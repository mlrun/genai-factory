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
from sqlalchemy.orm import sessionmaker

import controller.db.sql.sqldb as db
import genai_factory.schemas as api_models
from controller.config import logger
from controller.db.client import Client


class SqlClient(Client):
    """
    This is the SQL client that interact with the SQL database.
    """

    def __init__(self, url: str, verbose: bool = False):
        self.db_url = url
        self.engine = sqlalchemy.create_engine(
            self.db_url, echo=verbose, connect_args={"check_same_thread": False}
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
    def _to_schema_object(obj, obj_class):
        """
        Convert an object from the database to an API object.
        :param obj:       The object from the database.
        :param obj_class: The API class of the object.
        :return: The API object.
        """
        object_dict = {}
        for field in obj.__table__.columns:
            object_dict[field.name] = getattr(obj, field.name)
        spec = object_dict.pop("spec", {})
        object_dict.update(spec)
        if obj.labels:
            object_dict["labels"] = {label.name: label.value for label in obj.labels}
        return obj_class.from_dict(object_dict)

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
        # try:
        uid = uuid.uuid4().hex
        db_object = self._to_db_object(obj, db_class, uid=uid)
        session.add(db_object)
        session.commit()
        return self._to_schema_object(db_object, obj.__class__)

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
    ) -> Type[api_models.Base]:
        """
        Update an object in the database.

        :param session:    The session to use.
        :param db_class:   The DB class of the object.
        :param api_object: The API object with the new data.
        :param kwargs:     The keyword arguments to filter the object.

        :return: The updated object.
        """
        kwargs = self._drop_none(**kwargs)
        session = self.get_db_session(session)
        obj = session.query(db_class).filter_by(**kwargs).one_or_none()
        if obj:
            obj = self._merge_into_db_object(api_object, obj)
            session.add(obj)
            session.commit()
            return self._to_schema_object(obj, api_object.__class__)
        else:
            # Create a new object if not found
            logger.debug(f"Object not found, creating a new one: {api_object}")
            return self._create(session, db_class, api_object)

    def _delete(self, session: sqlalchemy.orm.Session, db_class, **kwargs):
        """
        Delete an object from the database.

        :param session:  The session to use.
        :param db_class: The DB class of the object.
        :param kwargs:   The keyword arguments to filter the object.
        """
        kwargs = self._drop_none(**kwargs)
        session = self.get_db_session(session)
        query = session.query(db_class).filter_by(**kwargs)
        for obj in query:
            session.delete(obj)
        session.commit()

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
        user.name = user.name or user.email
        return self._create(db_session, db.User, user)

    def get_user(
        self,
        uid: str = None,
        name: str = None,
        email: str = None,
        db_session: sqlalchemy.orm.Session = None,
        **kwargs,
    ):
        """
        Get a user from the database.
        Either user_id or user_name or email must be provided.

        :param uid:        The UID of the user to get.
        :param name:       The name of the user to get.
        :param email:      The email of the user to get.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the user.

        :return: The user.
        """
        args = {}
        if email:
            args["email"] = email
        elif name:
            args["name"] = name
        elif uid:
            args["uid"] = uid
        else:
            raise ValueError("Either user_id or user_name or email must be provided")
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
        email: str = None,
        full_name: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        List users from the database.

        :param name:         The name to filter the users by.
        :param email:        The email to filter the users by.
        :param full_name:    The full name to filter the users by.
        :param labels_match: The labels to match, filter the users by labels.
        :param output_mode:  The output mode.
        :param db_session:   The session to use.

        :return: List of users.
        """
        logger.debug(
            f"Getting users: email={email}, full_name={full_name}, mode={output_mode}"
        )
        filters = []
        if name:
            filters.append(db.User.name == name)
        if email:
            filters.append(db.User.email == email)
        if full_name:
            filters.append(db.User.full_name.like(f"%{full_name}%"))
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

    def create_prompt_template(
        self,
        prompt_template: Union[api_models.PromptTemplate, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Create a new prompt template in the database.

        :param prompt_template: The prompt template object to create.
        :param db_session:      The session to use.

        :return: The created prompt template.
        """
        logger.debug(f"Creating prompt template: {prompt_template}")
        if isinstance(prompt_template, dict):
            prompt_template = api_models.PromptTemplate.from_dict(prompt_template)
        return self._create(db_session, db.PromptTemplate, prompt_template)

    def get_prompt_template(
        self, name: str = None, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Get a prompt template from the database.

        :param name:       The name of the prompt template to get.
        :param db_session: The session to use.

        :return: The requested prompt template.
        """
        logger.debug(f"Getting prompt template: name={name}")
        return self._get(
            db_session,
            db.PromptTemplate,
            api_models.PromptTemplate,
            name=name,
            **kwargs,
        )

    def update_prompt_template(
        self,
        name: str,
        prompt_template: Union[api_models.PromptTemplate, dict],
        db_session: sqlalchemy.orm.Session = None,
    ):
        """
        Update an existing prompt template in the database.

        :param name:            The name of the prompt template to update.
        :param prompt_template: The prompt template object with the new data.
        :param db_session:      The session to use.

        :return: The updated prompt template.
        """
        logger.debug(f"Updating prompt template: {prompt_template}")
        if isinstance(prompt_template, dict):
            prompt_template = api_models.PromptTemplate.from_dict(prompt_template)
        return self._update(
            db_session,
            db.PromptTemplate,
            prompt_template,
            name=name,
            uid=prompt_template.uid,
        )

    def delete_prompt_template(
        self, name: str = None, db_session: sqlalchemy.orm.Session = None, **kwargs
    ):
        """
        Delete a prompt template from the database.

        :param name:       The name of the prompt template to delete.
        :param db_session: The session to use.
        :param kwargs:     Additional keyword arguments to filter the prompt template.
        """
        logger.debug(f"Deleting prompt template: name={name}")
        self._delete(db_session, db.PromptTemplate, name=name, **kwargs)

    def list_prompt_templates(
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
        List prompt templates from the database.

        :param name:         The name to filter the prompt templates by.
        :param owner_id:     The owner to filter the prompt templates by.
        :param version:      The version to filter the prompt templates by.
        :param project_id:   The project to filter the prompt templates by.
        :param labels_match: The labels to match, filter the prompt templates by labels.
        :param output_mode:  The output mode.
        :param db_session:   The session to use.

        :return: The list of prompt templates.
        """
        logger.debug(
            f"Getting prompt templates: owner_id={owner_id}, version={version}, project_id={project_id},"
            f" labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if name:
            filters.append(db.PromptTemplate.name == name)
        if owner_id:
            filters.append(db.PromptTemplate.owner_id == owner_id)
        if version:
            filters.append(db.PromptTemplate.version == version)
        if project_id:
            filters.append(db.PromptTemplate.project_id == project_id)
        return self._list(
            session=db_session,
            db_class=db.PromptTemplate,
            api_class=api_models.PromptTemplate,
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
        :param labels_match:  The labels to match, filter the workflows by labels.
        :param output_mode:   The output mode.
        :param db_session:    The session to use.

        :return: The list of workflows.
        """
        logger.debug(
            f"Getting workflows: name={name}, owner_id={owner_id}, version={version}, project_id={project_id},"
            f" workflow_type={workflow_type}, labels_match={labels_match}, mode={output_mode}"
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
