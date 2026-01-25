# Copyright 2023 Iguazio
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import datetime
import uuid
from typing import List, Type, Union

import sqlalchemy
from sqlalchemy.orm import sessionmaker, selectinload

import controller.db.sql.sqldb as db
import genai_factory.schemas as api_models
from controller.config import logger
from controller.db.client import Client



class SqlClient(Client):
    """
    This is the SQL client that interact with the SQL database.
    """

    def __init__(self, db_url: str, verbose: bool = False):
        self.db_url = db_url
        # SQLite-specific configuration
        connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
        # Connection pooling configuration
        pool_kwargs = {}
        if "sqlite" not in db_url:
            pool_kwargs = {
                "pool_size": 10,
                "max_overflow": 20,
                "pool_recycle": 3600,
            }
        self.engine = sqlalchemy.create_engine(
            self.db_url,
            echo=verbose,
            connect_args=connect_args,
            **pool_kwargs
        )
        self._session_maker = sessionmaker(bind=self.engine)
        self._local_maker = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )

    def get_db_session(self, session: sqlalchemy.orm.Session = None):
        """
        Get a session from the session maker.

        :param session: The session to use. If None, a new session will be created.

        :return: The session.
        """
        return session or self._session_maker()

    def get_local_session(self):
        """
        Get a local session from the local session maker.

        :return: The session.
        """
        return self._local_maker()

    @staticmethod
    def _to_schema_object(
        obj, schema_class: Type[api_models.Base]
    ) -> Type[api_models.Base]:
        """
        Convert an object from the database to an API object.

        :param obj:          The object from the database.
        :param schema_class: The API class of the object.

        :return: The API object.
        """
        object_dict = {}
        for field in obj.__table__.columns:
            object_dict[field.name] = getattr(obj, field.name)
        spec = object_dict.pop("spec", {})
        object_dict.update(spec)
        if obj.labels:
            object_dict["labels"] = {label.name: label.value for label in obj.labels}
        return schema_class.from_dict(object_dict)

    @staticmethod
    def _to_db_object(obj, obj_class, uid=None):
        """
        Convert an API object to a database object.

        :param obj:       The API object.
        :param obj_class: The DB class of the object.
        :param uid:       The UID of the object.

        :return: The database object.
        """
        struct = obj.to_dict(drop_none=False, short=False)
        obj_dict = {
            k: v
            for k, v in struct.items()
            if k in (api_models.metadata_fields + obj._top_level_fields)
            and k not in ["created", "updated"]
        }
        obj_dict["spec"] = {
            k: v
            for k, v in struct.items()
            if k not in api_models.metadata_fields + obj._top_level_fields
        }
        labels = obj_dict.pop("labels", None)
        if uid:
            obj_dict["uid"] = uid
        obj = obj_class(**obj_dict)
        if labels:
            obj.labels.clear()
            for name, value in labels.items():
                obj.labels.append(obj.Label(name=name, value=value, parent=obj.name))
        return obj

    @staticmethod
    def _merge_into_db_object(obj, orm_object):
        """
        Merge an API object into a database object.

        :param obj:        The API object.
        :param orm_object: The ORM object.

        :return: The updated ORM object.
        """
        struct = obj.to_dict(drop_none=True)
        spec = orm_object.spec or {}
        labels = struct.pop("labels", None)
        for k, v in struct.items():
            if k in (api_models.metadata_fields + obj._top_level_fields) and k not in [
                "created",
                "updated",
            ]:
                setattr(orm_object, k, v)
            if k not in [api_models.metadata_fields + obj._top_level_fields]:
                spec[k] = v
        orm_object.spec = spec
        if labels:
            old = {label.name: label for label in orm_object.labels}
            orm_object.labels.clear()
            for name, value in labels.items():
                if name in old:
                    if value is not None:  # None means delete
                        old[name].value = value
                        orm_object.labels.append(old[name])
                else:
                    orm_object.labels.append(
                        orm_object.Label(name=name, value=value, parent=orm_object.name)
                    )
        return orm_object

    def create_database(self, drop_old: bool = False, names: list = None):
        """
        Create the tables in the database.

        :param drop_old: Whether to drop the old tables before creating the new ones.
        :param names:    The names of the tables to create. If None, all tables will be created.
        """
        tables = None
        if names:
            tables = [db.Base.metadata.tables[name] for name in names]
        if drop_old:
            db.Base.metadata.drop_all(self.engine, tables=tables)
        db.Base.metadata.create_all(self.engine, tables=tables, checkfirst=True)

    def _create(
        self, session: sqlalchemy.orm.Session, db_class, obj
    ) -> Type[api_models.Base]:
        """
        Create an object in the database.
        This method generates a UID to the object and adds the object to the session and commits the transaction.

        :param session:  The session to use.
        :param db_class: The DB class of the object.
        :param obj:      The object to create.

        :return: The created object.
        """
        session = self.get_db_session(session)
        try:
            uid = uuid.uuid4().hex
            db_object = self._to_db_object(obj, db_class, uid=uid)
            session.add(db_object)
            session.commit()
            return self._to_schema_object(db_object, obj.__class__)
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to create object: {e}")
            raise

    def _get(
        self, session: sqlalchemy.orm.Session, db_class, api_class, **kwargs
    ) -> Union[Type[api_models.Base], None]:
        """
        Get an object from the database.

        :param session:   The session to use.
        :param db_class:  The DB class of the object.
        :param api_class: The API class of the object.
        :param kwargs:    The keyword arguments to filter the object.

        :return: The object.
        """
        logger.debug(f"Getting object: {kwargs}")
        kwargs = self._drop_none(**kwargs)
        session = self.get_db_session(session)
        query = session.query(db_class).filter_by(**kwargs)
        # Eager load labels to avoid N+1 query problem
        if hasattr(db_class, 'labels'):
            query = query.options(selectinload(db_class.labels))
        num_objects = query.count()
        if num_objects > 1:
            # Take the latest created:
            obj = query.order_by(db_class.created.desc()).first()
        else:
            obj = query.one_or_none()
        if obj:
            return self._to_schema_object(obj, api_class)

    def _update(
        self, session: sqlalchemy.orm.Session, db_class, api_object, **kwargs
    ) -> Union[Type[api_models.Base], None]:
        """
        Update an object in the database.

        :param session:    The session to use.
        :param db_class:   The DB class of the object.
        :param api_object: The API object with the new data.
        :param kwargs:     The keyword arguments to filter the object.

        :return: The updated object, or None if not found.
        """
        kwargs = self._drop_none(**kwargs)
        session = self.get_db_session(session)
        try:
            obj = session.query(db_class).filter_by(**kwargs).one_or_none()
            if obj:
                obj = self._merge_into_db_object(api_object, obj)
                session.add(obj)
                session.commit()
                return self._to_schema_object(obj, api_object.__class__)
            else:
                logger.warning(f"Object not found for update: {kwargs}")
                return None
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to update object: {e}")
            raise

    def _delete(self, session: sqlalchemy.orm.Session, db_class, **kwargs):
        """
        Delete an object from the database.

        :param session:  The session to use.
        :param db_class: The DB class of the object.
        :param kwargs:   The keyword arguments to filter the object.
        """
        kwargs = self._drop_none(**kwargs)
        session = self.get_db_session(session)
        try:
            query = session.query(db_class).filter_by(**kwargs)
            for obj in query:
                session.delete(obj)
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to delete object: {e}")
            raise

    def _list(
        self,
        session: sqlalchemy.orm.Session,
        db_class: db.Base,
        api_class: Type[api_models.Base],
        output_mode: api_models.OutputMode,
        labels_match: List[str] = None,
        filters: list = None,
    ) -> List:
        """
        List objects from the database.

        :param session:      The session to use.
        :param db_class:     The DB class of the object.
        :param api_class:    The API class of the object.
        :param output_mode:  The output mode.
        :param labels_match: The labels to match, filter the objects by labels.
        :param filters:      The filters to apply.

        :return: A list of the desired objects.
        """
        session = self.get_db_session(session)

        query = session.query(db_class)
        # Eager load labels to avoid N+1 query problem
        if hasattr(db_class, 'labels'):
            query = query.options(selectinload(db_class.labels))
        for filter_statement in filters:
            query = query.filter(filter_statement)
        # TODO: Implement labels_match
        if labels_match:
            logger.debug("Filtering projects by labels is not supported yet")
            # query = self._filter_labels(query, sqldb.Project, labels_match)
            pass
        output = query.all()
        logger.debug(f"output: {output}")
        return self._process_output(output, api_class, output_mode)

    @staticmethod
    def _drop_none(**kwargs):
        return {k: v for k, v in kwargs.items() if v is not None}

    def create_user(
        self,
        user: Union[api_models.User, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Create a new user in the database.

        :param user:       The user object to create.
        :param db_session: The session to use.

        :return: The created user.
        """
        logger.debug(f"Creating user: {user}")
        if isinstance(user, dict):
            user = api_models.User.from_dict(user)
        user.name = user.name
        return self._create(db_session, db.User, user)

    def get_user(
        self,
        uid: str = None,
        name: str = None,
        db_session: sqlalchemy.orm.Session = None,
        **kwargs,
    ):
        """
        Get a user from the database.
        Either user_id or user_name or email must be provided.

        :param uid:        The UID of the user to get.
        :param name:       The name of the user to get.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the user.

        :return: The user.
        """
        args = {}
        if name:
            args["name"] = name
        elif uid:
            args["uid"] = uid
        else:
            raise ValueError("Either user_id or user_name must be provided")
        # add additional filters
        args.update(kwargs)
        logger.debug(f"Getting user: name={name}")
        return self._get(db_session, db.User, api_models.User, **args)

    def update_user(
        self,
        name: str,
        user: Union[api_models.User, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Update an existing user in the database.

        :param name:       The name of the user to update.
        :param user:       The user object with the new data.
        :param db_session: The session to use.

        :return: The updated user.
        """
        logger.debug(f"Updating user: {user}")
        if isinstance(user, dict):
            user = api_models.User.from_dict(user)
        return self._update(db_session, db.User, user, name=name, uid=user.uid)

    def delete_user(
        self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Delete a user from the database.

        :param name:       The name of the user to delete.
        :param db_session: The session to use.
        """
        logger.debug(f"Deleting user: name={name}")
        self._delete(db_session, db.User, name=name, **kwargs)

    def list_users(
        self,
        name: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        List users from the database.

        :param name:         The name to filter the users by.
        :param labels_match: The labels to match, filter the users by labels.
        :param output_mode:  The output mode.
        :param db_session:   The session to use.

        :return: List of users.
        """
        logger.debug(
            f"Getting users: mode={output_mode}"
        )
        filters = []
        if name:
            filters.append(db.User.name == name)
        return self._list(
            session=db_session,
            db_class=db.User,
            api_class=api_models.User,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_project(
        self,
        project: Union[api_models.Project, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Create a new project in the database.

        :param project:    The project object to create.
        :param db_session: The session to use.

        :return: The created project.
        """
        logger.debug(f"Creating project: {project}")
        if isinstance(project, dict):
            project = api_models.Project.from_dict(project)
        return self._create(db_session, db.Project, project)

    def get_project(
        self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Get a project from the database.

        :param name:       The name of the project to get.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the project.

        :return: The requested project.
        """
        logger.debug(f"Getting project: name={name}")
        return self._get(
            db_session, db.Project, api_models.Project, name=name, **kwargs
        )

    def update_project(
        self,
        name: str,
        project: Union[api_models.Project, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Update an existing project in the database.

        :param name:       The name of the project to update.
        :param project:    The project object with the new data.
        :param db_session: The session to use.

        :return: The updated project.
        """
        logger.debug(f"Updating project: {project}")
        if isinstance(project, dict):
            project = api_models.Project.from_dict(project)
        return self._update(db_session, db.Project, project, name=name, uid=project.uid)

    def delete_project(
        self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Delete a project from the database.

        :param name:       The name of the project to delete.
        :param db_session: The session to use.
        """
        logger.debug(f"Deleting project: name={name}")
        self._delete(db_session, db.Project, name=name, **kwargs)

    def list_projects(
        self,
        name: str = None,
        owner_id: str = None,
        version: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        List projects from the database.

        :param name:         The name to filter the projects by.
        :param owner_id:     The owner to filter the projects by.
        :param version:      The version to filter the projects by.
        :param labels_match: The labels to match, filter the projects by labels.
        :param output_mode:  The output mode.
        :param db_session:   The session to use.

        :return: List of projects.
        """
        logger.debug(
            f"Getting projects: owner_id={owner_id}, version={version}, labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if name:
            filters.append(db.Project.name == name)
        if owner_id:
            filters.append(db.Project.owner_id == owner_id)
        if version:
            filters.append(db.Project.version == version)
        return self._list(
            session=db_session,
            db_class=db.Project,
            api_class=api_models.Project,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_data_source(
        self,
        data_source: Union[api_models.DataSource, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Create a new data source in the database.

        :param data_source: The data source object to create.
        :param db_session:  The session to use.

        :return: The created data source.
        """
        logger.debug(f"Creating data source: {data_source}")
        if isinstance(data_source, dict):
            data_source = api_models.DataSource.from_dict(data_source)
        return self._create(db_session, db.DataSource, data_source)

    def get_data_source(
        self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Get a data source from the database.

        :param name:       The name of the data source to get.
        :param db_session: The session to use.

        :return: The requested data source.
        """
        logger.debug(f"Getting data source: name={name}")
        return self._get(
            db_session, db.DataSource, api_models.DataSource, name=name, **kwargs
        )

    def update_data_source(
        self,
        name: str,
        data_source: Union[api_models.DataSource, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Update an existing data source in the database.

        :param name:        The name of the data source to update.
        :param data_source: The data source object with the new data.
        :param db_session:  The session to use.

        :return: The updated data source.
        """
        logger.debug(f"Updating data source: {data_source}")
        if isinstance(data_source, dict):
            data_source = api_models.DataSource.from_dict(data_source)
        return self._update(
            db_session, db.DataSource, data_source, name=name, uid=data_source.uid
        )

    def delete_data_source(
        self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Delete a data source from the database.

        :param name:       The name of the data source to delete.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the data source.

        :return: A response object with the success status.
        """
        logger.debug(f"Deleting data source: name={name}")
        self._delete(db_session, db.DataSource, name=name, **kwargs)

    def list_data_sources(
        self,
        name: str = None,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        data_source_type: Union[api_models.DataSourceType, str] = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        List data sources from the database.

        :param name:             The name to filter the data sources by.
        :param owner_id:         The owner to filter the data sources by.
        :param version:          The version to filter the data sources by.
        :param project_id:       The project to filter the data sources by.
        :param data_source_type: The data source type to filter the data sources by.
        :param labels_match:     The labels to match, filter the data sources by labels.
        :param output_mode:      The output mode.
        :param db_session:       The session to use.

        :return: List of data sources.
        """
        logger.debug(
            f"Getting data sources: name={name}, owner_id={owner_id}, version={version},"
            f" data_source_type={data_source_type}, labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if name:
            filters.append(db.DataSource.name == name)
        if owner_id:
            filters.append(db.DataSource.owner_id == owner_id)
        if version:
            filters.append(db.DataSource.version == version)
        if project_id:
            filters.append(db.DataSource.project_id == project_id)
        if data_source_type:
            filters.append(db.DataSource.data_source_type == data_source_type)
        return self._list(
            session=db_session,
            db_class=db.DataSource,
            api_class=api_models.DataSource,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_dataset(
        self,
        dataset: Union[api_models.Dataset, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Create a new dataset in the database.

        :param dataset:    The dataset object to create.
        :param db_session: The session to use.

        :return: The created dataset.
        """
        logger.debug(f"Creating dataset: {dataset}")
        if isinstance(dataset, dict):
            dataset = api_models.Dataset.from_dict(dataset)
        return self._create(db_session, db.Dataset, dataset)

    def get_dataset(
        self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Get a dataset from the database.

        :param name:       The name of the dataset to get.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the dataset.

        :return: The requested dataset.
        """
        logger.debug(f"Getting dataset: name={name}")
        return self._get(
            db_session, db.Dataset, api_models.Dataset, name=name, **kwargs
        )

    def update_dataset(
        self,
        name: str,
        dataset: Union[api_models.Dataset, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Update an existing dataset in the database.

        :param name:       The name of the dataset to update.
        :param dataset:    The dataset object with the new data.
        :param db_session: The session to use.

        :return: The updated dataset.
        """
        logger.debug(f"Updating dataset: {dataset}")
        if isinstance(dataset, dict):
            dataset = api_models.Dataset.from_dict(dataset)
        return self._update(db_session, db.Dataset, dataset, name=name, uid=dataset.uid)

    def delete_dataset(
        self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Delete a dataset from the database.

        :param name:       The name of the dataset to delete.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the dataset.
        """
        logger.debug(f"Deleting dataset: name={name}")
        self._delete(db_session, db.Dataset, name=name, **kwargs)

    def list_datasets(
        self,
        name: str = None,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        task: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        List datasets from the database.

        :param name:         The name to filter the datasets by.
        :param owner_id:     The owner to filter the datasets by.
        :param version:      The version to filter the datasets by.
        :param project_id:   The project to filter the datasets by.
        :param task:         The task to filter the datasets by.
        :param labels_match: The labels to match, filter the datasets by labels.
        :param output_mode:  The output mode.
        :param db_session:   The session to use.

        :return: The list of datasets.
        """
        logger.debug(
            f"Getting datasets: owner_id={owner_id}, version={version}, task={task}, labels_match={labels_match},"
            f" mode={output_mode}"
        )
        filters = []
        if name:
            filters.append(db.Dataset.name == name)
        if owner_id:
            filters.append(db.Dataset.owner_id == owner_id)
        if version:
            filters.append(db.Dataset.version == version)
        if project_id:
            filters.append(db.Dataset.project_id == project_id)
        if task:
            filters.append(db.Dataset.task == task)
        return self._list(
            session=db_session,
            db_class=db.Dataset,
            api_class=api_models.Dataset,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_model(
        self,
        model: Union[api_models.Model, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Create a new model in the database.

        :param model:      The model object to create.
        :param db_session: The session to use.

        :return: The created model.
        """
        logger.debug(f"Creating model: {model}")
        if isinstance(model, dict):
            model = api_models.Model.from_dict(model)
        return self._create(db_session, db.Model, model)

    def get_model(self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs):
        """
        Get a model from the database.

        :param name:       The name of the model to get.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the model.

        :return: The requested model.
        """
        logger.debug(f"Getting model: name={name}")
        return self._get(db_session, db.Model, api_models.Model, name=name, **kwargs)

    def update_model(
        self,
        name: str,
        model: Union[api_models.Model, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Update an existing model in the database.

        :param name:       The name of the model to update.
        :param model:      The model object with the new data.
        :param db_session: The session to use.

        :return: The updated model.
        """
        logger.debug(f"Updating model: {model}")
        if isinstance(model, dict):
            model = api_models.Model.from_dict(model)
        return self._update(db_session, db.Model, model, name=name, uid=model.uid)

    def delete_model(
        self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Delete a model from the database.

        :param name:       The name of the model to delete.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the model.
        """
        logger.debug(f"Deleting model: name={name}")
        self._delete(db_session, db.Model, name=name, **kwargs)

    def list_models(
        self,
        name: str = None,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        model_type: str = None,
        task: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        List models from the database.

        :param name:         The name to filter the models by.
        :param owner_id:     The owner to filter the models by.
        :param version:      The version to filter the models by.
        :param project_id:   The project to filter the models by.
        :param model_type:   The model type to filter the models by.
        :param task:         The task to filter the models by.
        :param labels_match: The labels to match, filter the models by labels.
        :param output_mode:  The output mode.
        :param db_session:   The session to use.

        :return: The list of models.
        """
        logger.debug(
            f"Getting models: owner_id={owner_id}, version={version}, project_id={project_id},"
            f" model_type={model_type}, task={task}, labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if name:
            filters.append(db.Model.name == name)
        if owner_id:
            filters.append(db.Model.owner_id == owner_id)
        if version:
            filters.append(db.Model.version == version)
        if project_id:
            filters.append(db.Model.project_id == project_id)
        if model_type:
            filters.append(db.Model.model_type == model_type)
        if task:
            filters.append(db.Model.task == task)
        return self._list(
            session=db_session,
            db_class=db.Model,
            api_class=api_models.Model,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_prompt(
        self,
        prompt: Union[api_models.Prompt, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Create a new prompt in the database.

        :param prompt:      The prompt object to create.
        :param db_session:  The session to use.

        :return: The created prompt.
        """
        logger.debug(f"Creating prompt: {prompt}")
        if isinstance(prompt, dict):
            prompt = api_models.Prompt.from_dict(prompt)
        return self._create(db_session, db.Prompt, prompt)

    def get_prompt(
        self, name: str = None, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Get a prompt from the database.

        :param name:       The name of the prompt to get.
        :param db_session: The session to use.

        :return: The requested prompt template.
        """
        logger.debug(f"Getting prompt: name={name}")
        return self._get(
            db_session,
            db.Prompt,
            api_models.Prompt,
            name=name,
            **kwargs,
        )

    def update_prompt(
        self,
        name: str,
        prompt: Union[api_models.Prompt, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Update an existing prompt in the database.

        :param name:            The name of the prompt to update.
        :param prompt:          The prompt object with the new data.
        :param db_session:      The session to use.

        :return: The updated prompt template.
        """
        logger.debug(f"Updating prompt: {prompt}")
        if isinstance(prompt, dict):
            prompt = api_models.Prompt.from_dict(prompt)
        return self._update(
            db_session,
            db.Prompt,
            prompt,
            name=name,
            uid=prompt.uid,
        )

    def delete_prompt(
        self, name: str = None, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Delete a prompt from the database.

        :param name:       The name of the prompt to delete.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the prompt.
        """
        logger.debug(f"Deleting prompt: name={name}")
        self._delete(db_session, db.Prompt, name=name, **kwargs)

    def list_prompts(
        self,
        name: str = None,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        format: Union[api_models.PromptFormatType, str] = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        List prompts from the database.

        :param name:         The name to filter the prompt by.
        :param owner_id:     The owner to filter the prompt by.
        :param version:      The version to filter the prompt by.
        :param project_id:   The project to filter the prompt by.
        :param format:       The format to filter the prompt by.
        :param labels_match: The labels to match, filter the prompt by labels.
        :param output_mode:  The output mode.
        :param db_session:   The session to use.

        :return: The list of prompts.
        """
        logger.debug(
            f"Getting prompts: owner_id={owner_id}, version={version}, project_id={project_id},"
            f" format={format}, labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if name:
            filters.append(db.Prompt.name == name)
        if owner_id:
            filters.append(db.Prompt.owner_id == owner_id)
        if version:
            filters.append(db.Prompt.version == version)
        if project_id:
            filters.append(db.Prompt.project_id == project_id)
        if format:
            filters.append(db.Prompt.format == format)
        return self._list(
            session=db_session,
            db_class=db.Prompt,
            api_class=api_models.Prompt,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_document(
        self,
        document: Union[api_models.Document, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Create a new document in the database.

        :param document:   The document object to create.
        :param db_session: The session to use.

        :return: The created document.
        """
        logger.debug(f"Creating document: {document}")
        if isinstance(document, dict):
            document = api_models.Document.from_dict(document)
        return self._create(db_session, db.Document, document)

    def get_document(
        self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Get a document from the database.

        :param name:       The name of the document to get.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the document.

        :return: The requested document.
        """
        logger.debug(f"Getting document: name={name}")
        return self._get(
            db_session, db.Document, api_models.Document, name=name, **kwargs
        )

    def update_document(
        self,
        name: str,
        document: Union[api_models.Document, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Update an existing document in the database.

        :param name:       The name of the document to update.
        :param document:   The document object with the new data.
        :param db_session: The session to use.

        :return: The updated document.
        """
        logger.debug(f"Updating document: {document}")
        if isinstance(document, dict):
            document = api_models.Document.from_dict(document)
        return self._update(
            db_session, db.Document, document, name=name, uid=document.uid
        )

    def delete_document(
        self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Delete a document from the database.

        :param name:       The name of the document to delete.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the document.
        """
        logger.debug(f"Deleting document: name={name}")
        self._delete(db_session, db.Document, name=name, **kwargs)

    def list_documents(
        self,
        name: str = None,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        List documents from the database.

        :param name:         The name to filter the documents by.
        :param owner_id:     The owner to filter the documents by.
        :param version:      The version to filter the documents by.
        :param project_id:   The project to filter the documents by.
        :param labels_match: The labels to match, filter the documents by labels.
        :param output_mode:  The output mode.
        :param db_session:   The session to use.

        :return: The list of documents.
        """
        logger.debug(
            f"Getting documents: owner_id={owner_id}, version={version}, project_id={project_id},"
            f" labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if name:
            filters.append(db.Document.name == name)
        if owner_id:
            filters.append(db.Document.owner_id == owner_id)
        if version:
            filters.append(db.Document.version == version)
        if project_id:
            filters.append(db.Document.project_id == project_id)
        return self._list(
            session=db_session,
            db_class=db.Document,
            api_class=api_models.Document,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_workflow(
        self,
        workflow: Union[api_models.Workflow, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Create a new workflow in the database.

        :param workflow:   The workflow object to create.
        :param db_session: The session to use.

        :return: The created workflow.
        """
        logger.debug(f"Creating workflow: {workflow}")
        if isinstance(workflow, dict):
            workflow = api_models.Workflow.from_dict(workflow)
        return self._create(db_session, db.Workflow, workflow)

    def get_workflow(
        self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Get a workflow from the database.

        :param name:       The name of the workflow to get.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the workflow.

        :return: The requested workflow.
        """
        logger.debug(f"Getting workflow: name={name}")
        return self._get(
            db_session, db.Workflow, api_models.Workflow, name=name, **kwargs
        )

    def update_workflow(
        self,
        name: str,
        workflow: Union[api_models.Workflow, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Update an existing workflow in the database.

        :param name:       The name of the workflow to update.
        :param workflow:   The workflow object with the new data.
        :param db_session: The session to use.

        :return: The updated workflow.
        """
        logger.debug(f"Updating workflow: {workflow}")
        if isinstance(workflow, dict):
            workflow = api_models.Workflow.from_dict(workflow)
        return self._update(
            db_session, db.Workflow, workflow, name=name, uid=workflow.uid
        )

    def delete_workflow(
        self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Delete a workflow from the database.

        :param name:       The name of the workflow to delete.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the workflow.
        """
        logger.debug(f"Deleting workflow: name={name}")
        self._delete(db_session, db.Workflow, name=name, **kwargs)

    def list_workflows(
        self,
        name: str = None,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        workflow_type: Union[api_models.WorkflowType, str] = None,
        state: Union[api_models.WorkflowState, str] = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        List workflows from the database.

        :param name:          The name to filter the workflows by.
        :param owner_id:      The owner to filter the workflows by.
        :param version:       The version to filter the workflows by.
        :param project_id:    The project to filter the workflows by.
        :param workflow_type: The workflow type to filter the workflows by.
        :param state: The workflow state to filter the workflows by.
        :param labels_match:  The labels to match, filter the workflows by labels.
        :param output_mode:   The output mode.
        :param db_session:    The session to use.

        :return: The list of workflows.
        """
        logger.debug(
            f"Getting workflows: name={name}, owner_id={owner_id}, version={version}, project_id={project_id},"
            f" workflow_type={workflow_type}, state={state}, labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if name:
            filters.append(db.Workflow.name == name)
        if owner_id:
            filters.append(db.Workflow.owner_id == owner_id)
        if version:
            filters.append(db.Workflow.version == version)
        if project_id:
            filters.append(db.Workflow.project_id == project_id)
        if workflow_type:
            filters.append(db.Workflow.workflow_type == workflow_type)
        if state:
            filters.append(db.Workflow.state == state)
        return self._list(
            session=db_session,
            db_class=db.Workflow,
            api_class=api_models.Workflow,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_session(
        self,
        session: Union[api_models.ChatSession, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Create a new session in the database.

        :param session:    The chat session object to create.
        :param db_session: The session to use.

        :return: The created session.
        """
        logger.debug(f"Creating session: {session}")
        if isinstance(session, dict):
            session = api_models.ChatSession.from_dict(session)
        return self._create(db_session, db.Session, session)

    def get_session(
        self,
        name: str = None,
        uid: str = None,
        user_id: str = None,
        db_session: sqlalchemy.orm.Session = None,
        **kwargs,
    ):
        """
        Get a session from the database.

        :param name:       The name of the session to get.
        :param uid:        The ID of the session to get.
        :param user_id:    The UID of the user to get the last session for.
        :param db_session: The DB session to use.
        :param kwargs:     Additional keyword arguments to filter the session.

        :return: The requested session.
        """
        logger.debug(f"Getting session: name={name}, uid={uid}, user_id={user_id}")
        if uid:
            return self._get(
                db_session, db.Session, api_models.ChatSession, uid=uid, **kwargs
            )
        elif user_id:
            # get the last session for the user
            return self.list_sessions(
                user_id=user_id, last=1, db_session=db_session, **kwargs
            )[0]
        elif name:
            return self._get(
                db_session, db.Session, api_models.ChatSession, name=name, **kwargs
            )
        raise ValueError("session_name or user_id must be provided")

    def update_session(
        self,
        name: str,
        session: Union[api_models.ChatSession, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Update a session in the database.

        :param name:       The name of the session to update.
        :param session:    The session object with the new data.
        :param db_session: The DB session to use.

        :return: The updated chat session.
        """
        logger.debug(f"Updating chat session: {session}")
        return self._update(db_session, db.Session, session, name=name, uid=session.uid)

    def delete_session(
        self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Delete a session from the database.

        :param name:       The name of the session to delete.
        :param db_session: The DB session to use.
        :param kwargs:     Additional keyword arguments to filter the session.
        """
        logger.debug(f"Deleting session: name={name}")
        self._delete(db_session, db.Session, name=name, **kwargs)

    def list_sessions(
        self,
        name: str = None,
        user_id: str = None,
        workflow_id: str = None,
        created_after=None,
        last=0,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        List sessions from the database.

        :param name:          The name to filter the chat sessions by.
        :param user_id:       The user ID to filter the chat sessions by.
        :param workflow_id:   The workflow ID to filter the chat sessions by.
        :param created_after: The date to filter the chat sessions by.
        :param last:          The number of last chat sessions to return.
        :param output_mode:   The output mode.
        :param db_session:    The DB session to use.

        :return: The list of chat sessions.
        """
        logger.debug(
            f"Getting chat sessions: user_id={user_id}, workflow_id={workflow_id} created>{created_after},"
            f" last={last}, mode={output_mode}"
        )
        session = self.get_db_session(db_session)
        query = session.query(db.Session)
        if name:
            query = query.filter(db.Session.name == name)
        if user_id:
            query = query.filter(db.Session.owner_id == user_id)
        if workflow_id:
            query = query.filter(db.Session.workflow_id == workflow_id)
        if created_after:
            if isinstance(created_after, str):
                created_after = datetime.datetime.strptime(
                    created_after, "%Y-%m-%d %H:%M"
                )
            query = query.filter(db.Session.created >= created_after)
        query = query.order_by(db.Session.updated.desc())
        if last > 0:
            query = query.limit(last)
        return self._process_output(query.all(), api_models.ChatSession, output_mode)

    def create_deployment(
        self,
        deployment: Union[api_models.Deployment, dict],
        db_session: sqlalchemy.orm.Session = None,
    ) :
        """
        Create a new deployment in the database.

        :param deployment: The deployment object to create.
        :param db_session: The session to use.

        :return: The created deployment.
        """
        logger.debug(f"Creating deployment: {deployment}")
        if isinstance(deployment, dict):
            deployment = api_models.Deployment.from_dict(deployment)
        return self._create(db_session, db.Deployment, deployment)

    def get_deployment(
        self,
        name: str,
        db_session: sqlalchemy.orm.Session = None,
        **kwargs
    ):
        """
        Get a deployment from the database.

        :param name:       The name of the deployment to get.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the deployment.

        :return: The requested deployment.
        """
        logger.debug(f"Getting deployment: name={name}")
        return self._get(
            db_session, db.Deployment, api_models.Deployment, name=name, **kwargs
        )

    def update_deployment(
        self,
        name: str,
        deployment: Union[api_models.Deployment, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Update a deployment in the database.

        :param name:    The name of the deployment to update.
        :param deployment: The deployment object with the new data.
        :param db_session: The session to use.

        :return: The updated chat deployment.
        """
        logger.debug(f"Updating deployment: {deployment}")
        if isinstance(deployment, dict):
            deployment = api_models.Deployment.from_dict(deployment)
        return self._update(
            db_session, db.Deployment, deployment, name=name, uid=deployment.uid)

    def delete_deployment(
            self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Delete a deployment from the database.

        :param name: The name of the deployment to delete.
        :param db_session: The DB session to use.
        :param kwargs: Additional keyword arguments to filter the deployment.
        """
        logger.debug(f"Deleting deployment: name={name}")
        self._delete(db_session, db.Deployment, name=name, **kwargs)

    def list_deployments(
            self,
            name: str = None,
            owner_id: str = None,
            version: str = None,
            project_id: str = None,
            workflow_id: str = None,
            model_id: str = None,
            type: Union[api_models.DeploymentType, str] = None,
            is_remote: bool = None,
            labels_match: Union[list, str] = None,
            output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
            db_session: sqlalchemy.orm.Session = None,
    ):
        """
        List deployments from the database.

        :param name:         The name to filter the deployments by.
        :param owner_id:     The owner to filter the deployments by.
        :param version:      The version to filter the deployments by.
        :param project_id:   The project to filter the deployments by.
        :param workflow_id:  The workflow to filter the deployments by.
        :param model_id:     The model to filter the deployments by.
        :param type:         The Deployment Type to filter the deployments by.
        :param is_remote:    The boolean value of is_remote to filter the deployments by.
        :param labels_match: The labels to match, filter the deployments by labels.
        :param output_mode:  The output mode.
        :param db_session:   The session to use.

        :return: The list of deployments.
        """
        logger.debug(
            f"Getting deployments: owner_id={owner_id}, version={version}, project_id={project_id}, workflow_id={workflow_id},"
            f" model_id={model_id}, type={type}, is_remote={is_remote}, labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if name:
            filters.append(db.Deployment.name == name)
        if owner_id:
            filters.append(db.Deployment.owner_id == owner_id)
        if version:
            filters.append(db.Deployment.version == version)
        if project_id:
            filters.append(db.Deployment.project_id == project_id)
        if workflow_id:
            filters.append(db.Deployment.workflow_id == workflow_id)
        if model_id:
            filters.append(db.Deployment.model_id == model_id)
        if type:
            filters.append(db.Deployment.type == type)
        if is_remote:
            filters.append(db.Deployment.is_remote == is_remote)
        return self._list(
            session=db_session,
            db_class=db.Deployment,
            api_class=api_models.Deployment,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_schedule(
        self,
        schedule: Union[api_models.Schedule, dict],
        db_session: sqlalchemy.orm.Session = None,
    ) :
        """
        Create a new schedule in the database.

        :param schedule: The schedule object to create.
        :param db_session: The session to use.

        :return: The created schedule.
        """
        logger.debug(f"Creating schedule: {schedule}")
        if isinstance(schedule, dict):
            schedule = api_models.Schedule.from_dict(schedule)
        return self._create(db_session, db.Schedule, schedule)

    def get_schedule(
        self,
        name: str,
        db_session: sqlalchemy.orm.Session = None,
        **kwargs
    ):
        """
        Get a schedule from the database.

        :param name:       The name of the schedule to get.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the schedule.

        :return: The requested schedule.
        """
        logger.debug(f"Getting schedule: name={name}")
        return self._get(
            db_session, db.Schedule, api_models.Schedule, name=name, **kwargs
        )

    def update_schedule(
        self,
        name: str,
        schedule: Union[api_models.Schedule, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Update a schedule in the database.

        :param name:    The name of the schedule to update.
        :param schedule: The schedule object with the new data.
        :param db_session: The session to use.

        :return: The updated chat schedule.
        """
        logger.debug(f"Updating schedule: {schedule}")
        if isinstance(schedule, dict):
            schedule = api_models.Schedule.from_dict(schedule)
        return self._update(
            db_session, db.Schedule, schedule, name=name, uid=schedule.uid)

    def delete_schedule(
            self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Delete a schedule from the database.

        :param name: The name of the schedule to delete.
        :param db_session: The DB session to use.
        :param kwargs: Additional keyword arguments to filter the schedule.
        """
        logger.debug(f"Deleting schedule: name={name}")
        self._delete(db_session, db.Schedule, name=name, **kwargs)

    def list_schedules(
            self,
            name: str = None,
            owner_id: str = None,
            version: str = None,
            workflow_id: str = None,
            status: Union[api_models.Status, str] = None,
            labels_match: Union[list, str] = None,
            output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
            db_session: sqlalchemy.orm.Session = None,
    ):
        """
        List schedules from the database.

        :param name:         The name to filter the schedules by.
        :param owner_id:     The owner to filter the schedules by.
        :param version:      The version to filter the schedules by.
        :param workflow_id:  The workflow to filter the schedules by.
        :param status:       The status to filter the schedules by.
        :param labels_match: The labels to match, filter the schedules by labels.
        :param output_mode:  The output mode.
        :param db_session:   The session to use.

        :return: The list of schedules.
        """
        logger.debug(
            f"Getting schedules: owner_id={owner_id}, version={version}, workflow_id={workflow_id},"
            f" status={status}, labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if name:
            filters.append(db.Schedule.name == name)
        if owner_id:
            filters.append(db.Schedule.owner_id == owner_id)
        if version:
            filters.append(db.Schedule.version == version)
        if workflow_id:
            filters.append(db.Schedule.workflow_id == workflow_id)
        if status:
            filters.append(db.Schedule.status == status)
        return self._list(
            session=db_session,
            db_class=db.Schedule,
            api_class=api_models.Schedule,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_run(
        self,
        run: Union[api_models.Run, dict],
        db_session: sqlalchemy.orm.Session = None,
    ) :
        """
        Create a new run in the database.

        :param run: The run object to create.
        :param db_session: The session to use.

        :return: The created run.
        """
        logger.debug(f"Creating run: {run}")
        if isinstance(run, dict):
            run = api_models.Run.from_dict(run)
        return self._create(db_session, db.Run, run)

    def get_run(
        self,
        name: str,
        db_session: sqlalchemy.orm.Session = None,
        **kwargs
    ):
        """
        Get a run from the database.

        :param name:       The name of the run to get.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the run.

        :return: The requested run.
        """
        logger.debug(f"Getting run: name={name}")
        return self._get(
            db_session, db.Run, api_models.Run, name=name, **kwargs
        )

    def update_run(
        self,
        name: str,
        run: Union[api_models.Run, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Update a run in the database.

        :param name:    The name of the run to update.
        :param run: The run object with the new data.
        :param db_session: The session to use.

        :return: The updated chat run.
        """
        logger.debug(f"Updating run: {run}")
        if isinstance(run, dict):
            run = api_models.Run.from_dict(run)
        return self._update(
            db_session, db.Run, run, name=name, uid=run.uid)

    def delete_run(
            self, name: str, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Delete a run from the database.

        :param name: The name of the run to delete.
        :param db_session: The DB session to use.
        :param kwargs: Additional keyword arguments to filter the run.
        """
        logger.debug(f"Deleting run: name={name}")
        self._delete(db_session, db.Run, name=name, **kwargs)

    def list_runs(
            self,
            name: str = None,
            owner_id: str = None,
            version: str = None,
            workflow_id: str = None,
            schedule_id: str = None,
            status: Union[api_models.Status, str] = None,
            labels_match: Union[list, str] = None,
            output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
            db_session: sqlalchemy.orm.Session = None,
    ):
        """
        List runs from the database.

        :param name:         The name to filter the runs by.
        :param owner_id:     The owner to filter the runs by.
        :param version:      The version to filter the runs by.
        :param workflow_id:  The workflow to filter the runs by.
        :param schedule_id:     The model to filter the runs by.
        :param status:       The status to filter the schedules by.
        :param labels_match: The labels to match, filter the runs by labels.
        :param output_mode:  The output mode.
        :param db_session:   The session to use.

        :return: The list of runs.
        """
        logger.debug(
            f"Getting runs: owner_id={owner_id}, version={version}, workflow_id={workflow_id},"
            f" schedule_id={schedule_id}, status={status}, labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if name:
            filters.append(db.Run.name == name)
        if owner_id:
            filters.append(db.Run.owner_id == owner_id)
        if version:
            filters.append(db.Run.version == version)
        if workflow_id:
            filters.append(db.Run.workflow_id == workflow_id)
        if schedule_id:
            filters.append(db.Run.schedule_id == schedule_id)
        if status:
            filters.append(db.Run.status == status)
        return self._list(
            session=db_session,
            db_class=db.Run,
            api_class=api_models.Run,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def _process_output(
        self,
        items,
        obj_class,
        mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
    ) -> Union[list, dict]:
        """
        Process the output of a query. Use this method to convert the output to the desired format.
        For example when listing.

        :param items:     The items to process.
        :param obj_class: The class of the items.
        :param mode:      The output mode.

        :return: The processed items.
        """
        if mode == api_models.OutputMode.NAMES:
            return [item.name for item in items]
        items = [self._to_schema_object(item, obj_class) for item in items]
        if mode == api_models.OutputMode.DETAILS:
            return items
        short = mode == api_models.OutputMode.SHORT
        return [item.to_dict(short=short) for item in items]
