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

import controller.src.db.sqldb as db
import controller.src.schemas as api_models
from controller.src.config import logger
from controller.src.schemas import ApiResponse


class SqlClient:
    """
    This is the SQL client that interact with the SQL database.
    """

    def __init__(self, db_url: str, verbose: bool = False):
        self.db_url = db_url
        self.engine = sqlalchemy.create_engine(
            db_url, echo=verbose, connect_args={"check_same_thread": False}
        )
        self._session_maker = sessionmaker(bind=self.engine)
        self._local_maker = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )

    def get_db_session(self, session: sqlalchemy.orm.Session = None):
        """
        Get a session from the session maker.

        :param session:    The session to use. If None, a new session will be created.

        :return:    The session.
        """
        return session or self._session_maker()

    def get_local_session(self):
        """
        Get a local session from the local session maker.

        :return:    The session.
        """
        return self._local_maker()

    def create_tables(self, drop_old: bool = False, names: list = None) -> ApiResponse:
        """
        Create the tables in the database.

        :param drop_old:    Whether to drop the old tables before creating the new ones.
        :param names:       The names of the tables to create. If None, all tables will be created.

        :return:    A response object with the success status.
        """
        tables = None
        if names:
            tables = [db.Base.metadata.tables[name] for name in names]
        if drop_old:
            db.Base.metadata.drop_all(self.engine, tables=tables)
        db.Base.metadata.create_all(self.engine, tables=tables, checkfirst=True)
        return ApiResponse(success=True)

    def _create(self, session: sqlalchemy.orm.Session, db_class, obj) -> ApiResponse:
        """
        Create an object in the database.
        This method generates a UID to the object and adds the object to the session and commits the transaction.

        :param session:     The session to use.
        :param db_class:    The DB class of the object.
        :param obj:         The object to create.

        :return:    A response object with the success status and the created object when successful.
        """
        session = self.get_db_session(session)
        try:
            uid = uuid.uuid4().hex
            db_object = obj.to_orm_object(db_class, uid=uid)
            session.add(db_object)
            session.commit()
            return ApiResponse(
                success=True, data=obj.__class__.from_orm_object(db_object)
            )
        except sqlalchemy.exc.IntegrityError:
            return ApiResponse(
                success=False, error=f"{db_class} {obj.name} already exists"
            )

    def _get(
        self, session: sqlalchemy.orm.Session, db_class, api_class, **kwargs
    ) -> ApiResponse:
        """
        Get an object from the database.

        :param session:     The session to use.
        :param db_class:    The DB class of the object.
        :param api_class:   The API class of the object.
        :param kwargs:      The keyword arguments to filter the object.

        :return:    A response object with the success status and the object when successful.
        """
        session = self.get_db_session(session)
        obj = session.query(db_class).filter_by(**kwargs).one_or_none()
        if obj is None:
            return ApiResponse(
                success=False, error=f"{db_class} object ({kwargs}) not found"
            )
        return ApiResponse(success=True, data=api_class.from_orm_object(obj))

    # def _get_by_name(self, session: sqlalchemy.orm.Session, db_class, api_class, name: str) -> ApiResponse:
    #     """
    #     Get an object from the database by name.
    #
    #     :param session:     The session to use.
    #     :param db_class:    The DB class of the object.
    #     :param api_class:   The API class of the object.
    #
    #     :return:    A response object with the success status and the object when successful.
    #     """
    #     session = self.get_db_session(session)
    #     obj = session.query(db_class).filter_by(name=name).one_or_none()
    #     if obj is None:
    #         return ApiResponse(success=False, error=f"{db_class} object ({name}) not found")
    #     return ApiResponse(success=True, data=api_class.from_orm_object(obj))

    def _update(
        self, session: sqlalchemy.orm.Session, db_class, api_object, **kwargs
    ) -> ApiResponse:
        """
        Update an object in the database.

        :param session:     The session to use.
        :param db_class:    The DB class of the object.
        :param api_object:  The API object with the new data.
        :param kwargs:      The keyword arguments to filter the object.

        :return:    A response object with the success status and the updated object when successful.
        """
        session = self.get_db_session(session)
        obj = session.query(db_class).filter_by(**kwargs).one_or_none()
        if obj:
            api_object.merge_into_orm_object(obj)
            session.add(obj)
            session.commit()
            return ApiResponse(
                success=True, data=api_object.__class__.from_orm_object(obj)
            )
        else:
            return ApiResponse(
                success=False, error=f"{db_class} object ({kwargs}) not found"
            )

    def _delete(
        self, session: sqlalchemy.orm.Session, db_class, **kwargs
    ) -> ApiResponse:
        """
        Delete an object from the database.

        :param session:     The session to use.
        :param db_class:    The DB class of the object.
        :param kwargs:      The keyword arguments to filter the object.

        :return:    A response object with the success status.
        """
        session = self.get_db_session(session)
        query = session.query(db_class).filter_by(**kwargs)
        for obj in query:
            session.delete(obj)
        session.commit()
        return ApiResponse(success=True)

    def _list(
        self,
        session: sqlalchemy.orm.Session,
        db_class: db.Base,
        api_class: Type[api_models.Base],
        output_mode: api_models.OutputMode,
        labels_match: List[str] = None,
        filters: list = None,
    ) -> ApiResponse:
        """
        List objects from the database.

        :param session:         The session to use.
        :param db_class:        The DB class of the object.
        :param api_class:       The API class of the object.
        :param output_mode:     The output mode.
        :param labels_match:    The labels to match, filter the objects by labels.
        :param filters:         The filters to apply.

        :return:    A response object with the success status and the list of objects when successful.
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
        data = _process_output(output, api_class, output_mode)
        return ApiResponse(success=True, data=data)

    def create_user(
        self, user: Union[api_models.User, dict], session: sqlalchemy.orm.Session = None
    ) -> ApiResponse:
        """
        Create a new user in the database.

        :param user:    The user object to create.
        :param session: The session to use.

        :return:    A response object with the success status and the created user when successful.
        """
        logger.debug(f"Creating user: {user}")
        if isinstance(user, dict):
            user = api_models.User.from_dict(user)
        user.name = user.name or user.email
        return self._create(session, db.User, user)

    def get_user(
        self,
        user_id: str = None,
        user_name: str = None,
        email: str = None,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Get a user from the database.
        Either user_id or user_name or email must be provided.

        :param user_id:     The ID of the user to get.
        :param user_name:   The name of the user to get.
        :param email:       The email of the user to get.
        :param session:     The session to use.

        :return:    A response object with the success status and the user when successful.
        """
        args = {}
        if email:
            args["email"] = email
        elif user_name:
            args["name"] = user_name
        elif user_id:
            args["id"] = user_id
        else:
            return ApiResponse(
                success=False, error="user_id or user_name or email must be provided"
            )
        logger.debug(f"Getting user: user_id={user_id}, user_name={user_name}")
        return self._get(session, db.User, api_models.User, **args)

    def update_user(
        self, user: Union[api_models.User, dict], session: sqlalchemy.orm.Session = None
    ) -> ApiResponse:
        """
        Update an existing user in the database.

        :param user:    The user object with the new data.
        :param session: The session to use.

        :return:    A response object with the success status and the updated user when successful.
        """
        logger.debug(f"Updating user: {user}")
        if isinstance(user, dict):
            user = api_models.User.from_dict(user)
        return self._update(session, db.User, user, name=user.name)

    def delete_user(
        self, user_name: str, session: sqlalchemy.orm.Session = None
    ) -> ApiResponse:
        """
        Delete a user from the database.

        :param user_name: The name of the user to delete.
        :param session:
        :return:
        """
        logger.debug(f"Deleting user: user_name={user_name}")
        return self._delete(session, db.User, name=user_name)

    def list_users(
        self,
        email: str = None,
        full_name: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.Details,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        List users from the database.

        :param email:           The email to filter the users by.
        :param full_name:       The full name to filter the users by.
        :param labels_match:    The labels to match, filter the users by labels.
        :param output_mode:     The output mode.
        :param session:         The session to use.

        :return:    A response object with the success status and the list of users when successful.
        """
        logger.debug(
            f"Getting users: email={email}, full_name={full_name}, mode={output_mode}"
        )
        filters = []
        if email:
            filters.append(db.User.email == email)
        if full_name:
            filters.append(db.User.full_name.like(f"%{full_name}%"))
        return self._list(
            session=session,
            db_class=db.User,
            api_class=api_models.User,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_project(
        self,
        project: Union[api_models.Project, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Create a new project in the database.

        :param project: The project object to create.
        :param session: The session to use.

        :return:    A response object with the success status and the created project when successful.
        """
        logger.debug(f"Creating project: {project}")
        if isinstance(project, dict):
            project = api_models.Project.from_dict(project)
        return self._create(session, db.Project, project)

    def get_project(
        self, project_name: str, session: sqlalchemy.orm.Session = None
    ) -> ApiResponse:
        """
        Get a project from the database.

        :param project_name:    The name of the project to get.
        :param session:         The session to use.

        :return:    A response object with the success status and the project when successful.
        """
        logger.debug(f"Getting project: project_name={project_name}")
        return self._get(session, db.Project, api_models.Project, name=project_name)

    def update_project(
        self,
        project: Union[api_models.Project, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Update an existing project in the database.

        :param project: The project object with the new data.
        :param session: The session to use.

        :return:    A response object with the success status and the updated project when successful.
        """
        logger.debug(f"Updating project: {project}")
        if isinstance(project, dict):
            project = api_models.Project.from_dict(project)
        return self._update(session, db.Project, project, name=project.name)

    def delete_project(
        self, project_name: str, session: sqlalchemy.orm.Session = None
    ) -> ApiResponse:
        """
        Delete a project from the database.

        :param project_name:    The name of the project to delete.
        :param session:         The session to use.

        :return:    A response object with the success status.
        """
        logger.debug(f"Deleting project: project_name={project_name}")
        return self._delete(session, db.Project, name=project_name)

    def list_projects(
        self,
        owner_id: str = None,
        version: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.Details,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        List projects from the database.

        :param owner_id:       The owner to filter the projects by.
        :param version:        The version to filter the projects by.
        :param labels_match:   The labels to match, filter the projects by labels.
        :param output_mode:    The output mode.
        :param session:        The session to use.

        :return:    A response object with the success status and the list of projects when successful.
        """
        logger.debug(
            f"Getting projects: owner_id={owner_id}, version={version}, labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if owner_id:
            filters.append(db.Project.owner_id == owner_id)
        if version:
            filters.append(db.Project.version == version)
        return self._list(
            session=session,
            db_class=db.User,
            api_class=api_models.User,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_data_source(
        self,
        data_source: Union[api_models.DataSource, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Create a new data source in the database.

        :param data_source: The data source object to create.
        :param session:     The session to use.

        :return:    A response object with the success status and the created data source when successful.
        """
        logger.debug(f"Creating data source: {data_source}")
        if isinstance(data_source, dict):
            data_source = api_models.DataSource.from_dict(data_source)
        return self._create(session, db.DataSource, data_source)

    def get_data_source(
        self,
        project_id: str,
        data_source_name: str,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Get a data source from the database.

        :param project_id:          The ID of the project to get the data source from.
        :param data_source_name:    The ID of the data source to get.
        :param session:             The session to use.

        :return:    A response object with the success status and the data source when successful.
        """
        logger.debug(f"Getting data source: data_source_name={data_source_name}")
        return self._get(
            session,
            db.DataSource,
            api_models.DataSource,
            name=data_source_name,
            project_id=project_id,
        )

    def update_data_source(
        self,
        data_source: Union[api_models.DataSource, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Update an existing data source in the database.

        :param data_source: The data source object with the new data.
        :param session:     The session to use.

        :return:    A response object with the success status and the updated data source when successful.
        """
        logger.debug(f"Updating data source: {data_source}")
        if isinstance(data_source, dict):
            data_source = api_models.DataSource.from_dict(data_source)
        return self._update(session, db.DataSource, data_source)

    def delete_data_source(
        self,
        project_id: str,
        data_source_id: str,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Delete a data source from the database.

        :param project_id:      The ID of the project to delete the data source from.
        :param data_source_id:  The ID of the data source to delete.
        :param session:         The session to use.

        :return:    A response object with the success status.
        """
        logger.debug(f"Deleting data source: data_source_id={data_source_id}")
        return self._delete(
            session, db.DataSource, project_id=project_id, id=data_source_id
        )

    def list_data_sources(
        self,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        data_source_type: Union[api_models.DataSourceType, str] = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.Details,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        List data sources from the database.

        :param owner_id:            The owner to filter the data sources by.
        :param version:             The version to filter the data sources by.
        :param project_id:          The project to filter the data sources by.
        :param data_source_type:    The data source type to filter the data sources by.
        :param labels_match:        The labels to match, filter the data sources by labels.
        :param output_mode:         The output mode.
        :param session:             The session to use.

        :return:    A response object with the success status and the list of data sources when successful.
        """
        logger.debug(
            f"Getting collections: owner_id={owner_id}, version={version}, data_source_type={data_source_type},"
            f" labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if owner_id:
            filters.append(db.DataSource.owner_id == owner_id)
        if version:
            filters.append(db.DataSource.version == version)
        if project_id:
            filters.append(db.DataSource.project_id == project_id)
        if data_source_type:
            filters.append(db.DataSource.data_source_type == data_source_type)
        return self._list(
            session=session,
            db_class=db.DataSource,
            api_class=api_models.DataSource,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_dataset(
        self,
        dataset: Union[api_models.Dataset, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Create a new dataset in the database.

        :param dataset: The dataset object to create.
        :param session: The session to use.

        :return:    A response object with the success status and the created dataset when successful.
        """
        logger.debug(f"Creating dataset: {dataset}")
        if isinstance(dataset, dict):
            dataset = api_models.Dataset.from_dict(dataset)
        return self._create(session, db.Dataset, dataset)

    def get_dataset(
        self, project_id: str, dataset_id: str, session: sqlalchemy.orm.Session = None
    ) -> ApiResponse:
        """
        Get a dataset from the database.

        :param project_id:  The ID of the project to get the dataset from.
        :param dataset_id:  The ID of the dataset to get.
        :param session:     The session to use.

        :return:    A response object with the success status and the dataset when successful.
        """
        logger.debug(f"Getting dataset: dataset_id={dataset_id}")
        return self._get(
            session,
            db.Dataset,
            api_models.Dataset,
            id=dataset_id,
            project_id=project_id,
        )

    def update_dataset(
        self,
        dataset: Union[api_models.Dataset, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Update an existing dataset in the database.

        :param dataset: The dataset object with the new data.
        :param session: The session to use.

        :return:    A response object with the success status and the updated dataset when successful.
        """
        logger.debug(f"Updating dataset: {dataset}")
        if isinstance(dataset, dict):
            dataset = api_models.Dataset.from_dict(dataset)
        return self._update(session, db.Dataset, dataset, id=dataset.id)

    def delete_dataset(
        self, project_id: str, dataset_id: str, session: sqlalchemy.orm.Session = None
    ) -> ApiResponse:
        """
        Delete a dataset from the database.

        :param project_id:  The ID of the project to delete the dataset from.
        :param dataset_id:  The ID of the dataset to delete.
        :param session:     The session to use.

        :return:    A response object with the success status.
        """
        logger.debug(f"Deleting dataset: dataset_id={dataset_id}")
        return self._delete(session, db.Dataset, project_id=project_id, id=dataset_id)

    def list_datasets(
        self,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        task: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.Details,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        List datasets from the database.

        :param owner_id:       The owner to filter the datasets by.
        :param version:        The version to filter the datasets by.
        :param project_id:     The project to filter the datasets by.
        :param task:           The task to filter the datasets by.
        :param labels_match:   The labels to match, filter the datasets by labels.
        :param output_mode:    The output mode.
        :param session:        The session to use.

        :return:    A response object with the success status and the list of datasets when successful.
        """
        logger.debug(
            f"Getting datasets: owner_id={owner_id}, version={version}, task={task}, labels_match={labels_match},"
            f" mode={output_mode}"
        )
        filters = []
        if owner_id:
            filters.append(db.Dataset.owner_id == owner_id)
        if version:
            filters.append(db.Dataset.version == version)
        if project_id:
            filters.append(db.Dataset.project_id == project_id)
        if task:
            filters.append(db.Dataset.task == task)
        return self._list(
            session=session,
            db_class=db.Dataset,
            api_class=api_models.Dataset,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_model(
        self,
        model: Union[api_models.Model, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Create a new model in the database.

        :param model:   The model object to create.
        :param session: The session to use.

        :return:    A response object with the success status and the created model when successful.
        """
        logger.debug(f"Creating model: {model}")
        if isinstance(model, dict):
            model = api_models.Model.from_dict(model)
        return self._create(session, db.Model, model)

    def get_model(
        self, project_id: str, model_id: str, session: sqlalchemy.orm.Session = None
    ) -> ApiResponse:
        """
        Get a model from the database.

        :param project_id:  The ID of the project to get the model from.
        :param model_id:    The ID of the model to get.
        :param session:     The session to use.

        :return:    A response object with the success status and the model when successful.
        """
        logger.debug(f"Getting model: model_id={model_id}")
        return self._get(
            session, db.Model, api_models.Model, project_id=project_id, id=model_id
        )

    def update_model(
        self,
        model: Union[api_models.Model, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Update an existing model in the database.

        :param model:   The model object with the new data.
        :param session: The session to use.

        :return:    A response object with the success status and the updated model when successful.
        """
        logger.debug(f"Updating model: {model}")
        if isinstance(model, dict):
            model = api_models.Model.from_dict(model)
        return self._update(session, db.Model, model, id=model.id)

    def delete_model(
        self, project_id: str, model_id: str, session: sqlalchemy.orm.Session = None
    ) -> ApiResponse:
        """
        Delete a model from the database.

        :param project_id:  The ID of the project to delete the model from.
        :param model_id:    The ID of the model to delete.
        :param session:     The session to use.

        :return:    A response object with the success status.
        """
        logger.debug(f"Deleting model: model_id={model_id}")
        return self._delete(session, db.Model, project_id=project_id, id=model_id)

    def list_models(
        self,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        model_type: str = None,
        task: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.Details,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        List models from the database.

        :param owner_id:       The owner to filter the models by.
        :param version:        The version to filter the models by.
        :param project_id:     The project to filter the models by.
        :param model_type:     The model type to filter the models by.
        :param task:           The task to filter the models by.
        :param labels_match:   The labels to match, filter the models by labels.
        :param output_mode:    The output mode.
        :param session:        The session to use.

        :return:    A response object with the success status and the list of models when successful.
        """
        logger.debug(
            f"Getting models: owner_id={owner_id}, version={version}, project_id={project_id},"
            f" model_type={model_type}, task={task}, labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
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
            session=session,
            db_class=db.Model,
            api_class=api_models.Model,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_prompt_template(
        self,
        prompt_template: Union[api_models.PromptTemplate, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Create a new prompt template in the database.

        :param prompt_template: The prompt template object to create.
        :param session:         The session to use.

        :return:    A response object with the success status and the created prompt template when successful.
        """
        logger.debug(f"Creating prompt template: {prompt_template}")
        if isinstance(prompt_template, dict):
            prompt_template = api_models.PromptTemplate.from_dict(prompt_template)
        return self._create(session, db.PromptTemplate, prompt_template)

    def get_prompt_template(
        self,
        project_id: str,
        prompt_template_id: str,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Get a prompt template from the database.

        :param project_id:          The ID of the project to get the prompt template from.
        :param prompt_template_id:  The ID of the prompt template to get.
        :param session:             The session to use.

        :return:    A response object with the success status and the prompt template when successful.
        """
        logger.debug(
            f"Getting prompt template: prompt_template_id={prompt_template_id}"
        )
        return self._get(
            session,
            db.PromptTemplate,
            api_models.PromptTemplate,
            project_id=project_id,
            id=prompt_template_id,
        )

    def update_prompt_template(
        self,
        prompt_template: Union[api_models.PromptTemplate, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Update an existing prompt template in the database.

        :param prompt_template: The prompt template object with the new data.
        :param session:         The session to use.

        :return:    A response object with the success status and the updated prompt template when successful.
        """
        logger.debug(f"Updating prompt template: {prompt_template}")
        if isinstance(prompt_template, dict):
            prompt_template = api_models.PromptTemplate.from_dict(prompt_template)
        return self._update(
            session, db.PromptTemplate, prompt_template, id=prompt_template.id
        )

    def delete_prompt_template(
        self,
        project_id: str,
        prompt_template_id: str,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Delete a prompt template from the database.

        :param project_id:          The ID of the project to delete the prompt template from.
        :param prompt_template_id:  The ID of the prompt template to delete.
        :param session:             The session to use.

        :return:    A response object with the success status.
        """
        logger.debug(
            f"Deleting prompt template: prompt_template_id={prompt_template_id}"
        )
        return self._delete(
            session, db.PromptTemplate, project_id=project_id, id=prompt_template_id
        )

    def list_prompt_templates(
        self,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.Details,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        List prompt templates from the database.

        :param owner_id:       The owner to filter the prompt templates by.
        :param version:        The version to filter the prompt templates by.
        :param project_id:     The project to filter the prompt templates by.
        :param labels_match:   The labels to match, filter the prompt templates by labels.
        :param output_mode:    The output mode.
        :param session:        The session to use.

        :return:    A response object with the success status and the list of prompt templates when successful.
        """
        logger.debug(
            f"Getting prompt templates: owner_id={owner_id}, version={version}, project_id={project_id},"
            f" labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if owner_id:
            filters.append(db.PromptTemplate.owner_id == owner_id)
        if version:
            filters.append(db.PromptTemplate.version == version)
        if project_id:
            filters.append(db.PromptTemplate.project_id == project_id)
        return self._list(
            session=session,
            db_class=db.PromptTemplate,
            api_class=api_models.PromptTemplate,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_document(
        self,
        document: Union[api_models.Document, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Create a new document in the database.

        :param document: The document object to create.
        :param session: The session to use.

        :return:    A response object with the success status and the created document when successful.
        """
        logger.debug(f"Creating document: {document}")
        if isinstance(document, dict):
            document = api_models.Document.from_dict(document)
        return self._create(session, db.Document, document)

    def get_document(
        self, project_id: str, document_id: str, session: sqlalchemy.orm.Session = None
    ) -> ApiResponse:
        """
        Get a document from the database.

        :param project_id: The ID of the project to get the document from.
        :param document_id: The ID of the document to get.
        :param session: The session to use.

        :return:    A response object with the success status and the document when successful.
        """
        logger.debug(f"Getting document: document_id={document_id}")
        return self._get(
            session,
            db.Document,
            api_models.Document,
            project_id=project_id,
            id=document_id,
        )

    def update_document(
        self,
        document: Union[api_models.Document, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Update an existing document in the database.

        :param document: The document object with the new data.
        :param session: The session to use.

        :return:    A response object with the success status and the updated document when successful.
        """
        logger.debug(f"Updating document: {document}")
        if isinstance(document, dict):
            document = api_models.Document.from_dict(document)
        return self._update(session, db.Document, document, id=document.id)

    def delete_document(
        self, project_id: str, document_id: str, session: sqlalchemy.orm.Session = None
    ) -> ApiResponse:
        """
        Delete a document from the database.

        :param project_id:  The ID of the project to delete the document from.
        :param document_id: The ID of the document to delete.
        :param session:     The session to use.

        :return:    A response object with the success status.
        """
        logger.debug(f"Deleting document: document_id={document_id}")
        return self._delete(session, db.Document, project_id=project_id, id=document_id)

    def list_documents(
        self,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.Details,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        List documents from the database.

        :param owner_id:       The owner to filter the documents by.
        :param version:        The version to filter the documents by.
        :param project_id:     The project to filter the documents by.
        :param labels_match:   The labels to match, filter the documents by labels.
        :param output_mode:    The output mode.
        :param session:        The session to use.

        :return:    A response object with the success status and the list of documents when successful.
        """
        logger.debug(
            f"Getting documents: owner_id={owner_id}, version={version}, project_id={project_id},"
            f" labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if owner_id:
            filters.append(db.Document.owner_id == owner_id)
        if version:
            filters.append(db.Document.version == version)
        if project_id:
            filters.append(db.Document.project_id == project_id)
        return self._list(
            session=session,
            db_class=db.Document,
            api_class=api_models.Document,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_workflow(
        self,
        workflow: Union[api_models.Workflow, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Create a new workflow in the database.

        :param workflow:    The workflow object to create.
        :param session:     The session to use.

        :return:    A response object with the success status and the created workflow when successful.
        """
        logger.debug(f"Creating workflow: {workflow}")
        if isinstance(workflow, dict):
            workflow = api_models.Workflow.from_dict(workflow)
        return self._create(session, db.Workflow, workflow)

    def get_workflow(
        self,
        project_id: str,
        workflow_name: str,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Get a workflow from the database.

        :param project_id:      The ID of the project to get the workflow from.
        :param workflow_name:   The name of the workflow to get.
        :param session:         The session to use.

        :return:    A response object with the success status and the workflow when successful.
        """
        logger.debug(f"Getting workflow: workflow_name={workflow_name}")
        return self._get(
            session,
            db.Workflow,
            api_models.Workflow,
            project_id=project_id,
            name=workflow_name,
        )

    def update_workflow(
        self,
        workflow: Union[api_models.Workflow, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Update an existing workflow in the database.

        :param workflow:    The workflow object with the new data.
        :param session:     The session to use.

        :return:    A response object with the success status and the updated workflow when successful.
        """
        logger.debug(f"Updating workflow: {workflow}")
        if isinstance(workflow, dict):
            workflow = api_models.Workflow.from_dict(workflow)
        return self._update(session, db.Workflow, workflow, id=workflow.id)

    def delete_workflow(
        self, workflow_id: str, session: sqlalchemy.orm.Session = None
    ) -> ApiResponse:
        """
        Delete a workflow from the database.

        :param workflow_id: The ID of the workflow to delete.
        :param session:     The session to use.

        :return:    A response object with the success status.
        """
        logger.debug(f"Deleting workflow: workflow_id={workflow_id}")
        return self._delete(session, db.Workflow, id=workflow_id)

    def list_workflows(
        self,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        workflow_type: Union[api_models.WorkflowType, str] = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.Details,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        List workflows from the database.

        :param owner_id:        The owner to filter the workflows by.
        :param version:         The version to filter the workflows by.
        :param project_id:      The project to filter the workflows by.
        :param workflow_type:   The workflow type to filter the workflows by.
        :param labels_match:    The labels to match, filter the workflows by labels.
        :param output_mode:     The output mode.
        :param session:         The session to use.

        :return:    A response object with the success status and the list of workflows when successful.
        """
        logger.debug(
            f"Getting workflows: owner_id={owner_id}, version={version}, project_id={project_id},"
            f" workflow_type={workflow_type}, labels_match={labels_match}, mode={output_mode}"
        )
        filters = []
        if owner_id:
            filters.append(db.Workflow.owner_id == owner_id)
        if version:
            filters.append(db.Workflow.version == version)
        if project_id:
            filters.append(db.Workflow.project_id == project_id)
        if workflow_type:
            filters.append(db.Workflow.workflow_type == workflow_type)
        return self._list(
            session=session,
            db_class=db.Workflow,
            api_class=api_models.Workflow,
            output_mode=output_mode,
            labels_match=labels_match,
            filters=filters,
        )

    def create_chat_session(
        self,
        chat_session: Union[api_models.ChatSession, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Create a new chat session in the database.

        :param chat_session:    The chat session object to create.
        :param session:         The session to use.

        :return:    A response object with the success status and the created chat session when successful.
        """
        logger.debug(f"Creating chat session: {chat_session}")
        if isinstance(chat_session, dict):
            chat_session = api_models.ChatSession.from_dict(chat_session)
        return self._create(session, db.Session, chat_session)

    def get_chat_session(
        self,
        session_name: str = None,
        user_id: str = None,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Get a chat session from the database.

        :param session_name:    The ID of the chat session to get.
        :param user_id:         The ID of the user to get the last session for.
        :param session:         The DB session to use.

        :return:    A response object with the success status and the chat session when successful.
        """
        logger.debug(
            f"Getting chat session: session_name={session_name}, user_id={user_id}"
        )
        if session_name:
            return self._get(
                session, db.Session, api_models.ChatSession, name=session_name
            )
        elif user_id:
            # get the last session for the user
            resp = self.list_chat_sessions(user_id=user_id, last=1, session=session)
            if resp.success:
                data = resp.data[0] if resp.data else None
                return ApiResponse(success=True, data=data)
            return resp
        else:
            return ApiResponse(
                success=False, error="session_id or username must be provided"
            )

    def update_chat_session(
        self,
        chat_session: Union[api_models.ChatSession, dict],
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        Update a chat session in the database.

        :param chat_session:    The chat session object with the new data.
        :param session:         The DB session to use.

        :return:    A response object with the success status and the updated chat session when successful.
        """
        logger.debug(f"Updating chat session: {chat_session}")
        return self._update(session, db.Session, chat_session, name=chat_session.name)

    def delete_chat_session(
        self, session_id: str, session: sqlalchemy.orm.Session = None
    ) -> ApiResponse:
        """
        Delete a chat session from the database.

        :param session_id:  The ID of the chat session to delete.
        :param session:     The DB session to use.

        :return:    A response object with the success status.
        """
        logger.debug(f"Deleting chat session: session_id={session_id}")
        return self._delete(session, db.Session, id=session_id)

    def list_chat_sessions(
        self,
        user_id: str = None,
        workflow_id: str = None,
        created_after=None,
        last=0,
        output_mode: api_models.OutputMode = api_models.OutputMode.Details,
        session: sqlalchemy.orm.Session = None,
    ) -> ApiResponse:
        """
        List chat sessions from the database.

        :param user_id:         The user ID to filter the chat sessions by.
        :param workflow_id:     The workflow ID to filter the chat sessions by.
        :param created_after:   The date to filter the chat sessions by.
        :param last:            The number of last chat sessions to return.
        :param output_mode:     The output mode.
        :param session:         The DB session to use.

        :return:    A response object with the success status and the list of chat sessions when successful.
        """
        logger.debug(
            f"Getting chat sessions: user_id={user_id}, workflow_id={workflow_id} created>{created_after},"
            f" last={last}, mode={output_mode}"
        )
        session = self.get_db_session(session)
        query = session.query(db.Session)
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
        data = _process_output(query.all(), api_models.ChatSession, output_mode)
        return ApiResponse(success=True, data=data)


def _dict_to_object(cls, d):
    if isinstance(d, dict):
        return cls.from_dict(d)
    return d


def _process_output(
    items, obj_class, mode: api_models.OutputMode = api_models.OutputMode.Details
):
    if mode == api_models.OutputMode.Names:
        return [item.name for item in items]
    items = [obj_class.from_orm_object(item) for item in items]
    if mode == api_models.OutputMode.Details:
        return items
    short = mode == api_models.OutputMode.Short
    return [item.to_dict(short=short) for item in items]