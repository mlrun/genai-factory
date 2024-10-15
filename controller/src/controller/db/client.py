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

from abc import ABC, abstractmethod
from typing import List, Optional, Type, Union

import genai_factory.schemas as api_models


class Client(ABC):
    @abstractmethod
    def get_local_session(self):
        """
        Get a local session from the local session maker.
        This is the session that is inserted into the API endpoints.

        :return: The session.
        """
        pass

    @abstractmethod
    def create_database(self, drop_old: bool = False, names: list = None):
        """
        Create a new database.

        :param drop_old: Whether to drop the old data before creating the new data.
        :param names:    The names of the entities to create. If None, all entities will be created.
        """
        pass

    @abstractmethod
    def create_user(
        self, user: Union[api_models.User, dict], **kwargs
    ) -> api_models.User:
        """
        Create a new user in the database.

        :param user: The user object to create.

        :return: The created user.
        """
        pass

    @abstractmethod
    def get_user(
        self, uid: str = None, name: str = None, email: str = None, **kwargs
    ) -> Optional[api_models.User]:
        """
        Get a user from the database.
        Either user_id or user_name or email must be provided.

        :param uid:   The UID of the user to get.
        :param name:  The name of the user to get.
        :param email: The email of the user to get.

        :return: The user.
        """
        pass

    @abstractmethod
    def update_user(
        self, name: str, user: Union[api_models.User, dict], **kwargs
    ) -> api_models.User:
        """
        Update an existing user in the database.

        :param name: The name of the user to update.
        :param user: The user object with the new data.

        :return: The updated user.
        """
        pass

    @abstractmethod
    def delete_user(self, name: str, **kwargs):
        """
        Delete a user from the database.

        :param name: The name of the user to delete.
        """
        pass

    @abstractmethod
    def list_users(
        self,
        name: str = None,
        email: str = None,
        full_name: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        **kwargs,
    ) -> List[Optional[api_models.User]]:
        """
        List users from the database.

        :param name:         The name to filter the users by.
        :param email:        The email to filter the users by.
        :param full_name:    The full name to filter the users by.
        :param labels_match: The labels to match, filter the users by labels.
        :param output_mode:  The output mode.

        :return: List of users.
        """
        pass

    @abstractmethod
    def create_project(
        self, project: Union[api_models.Project, dict], **kwargs
    ) -> api_models.Project:
        """
        Create a new project in the database.

        :param project: The project object to create.

        :return: The created project.
        """
        pass

    @abstractmethod
    def get_project(self, name: str, **kwargs) -> Optional[api_models.Project]:
        """
        Get a project from the database.

        :param name: The name of the project to get.

        :return: The requested project.
        """
        pass

    @abstractmethod
    def update_project(
        self, name: str, project: Union[api_models.Project, dict], **kwargs
    ) -> api_models.Project:
        """
        Update an existing project in the database.

        :param name:    The name of the project to update.
        :param project: The project object with the new data.

        :return: The updated project.
        """
        pass

    @abstractmethod
    def delete_project(self, name: str, **kwargs):
        """
        Delete a project from the database.

        :param name: The name of the project to delete.
        """
        pass

    @abstractmethod
    def list_projects(
        self,
        name: str = None,
        owner_id: str = None,
        version: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        **kwargs,
    ) -> List[Optional[api_models.Project]]:
        """
        List projects from the database.

        :param name:         The name to filter the projects by.
        :param owner_id:     The owner to filter the projects by.
        :param version:      The version to filter the projects by.
        :param labels_match: The labels to match, filter the projects by labels.
        :param output_mode:  The output mode.

        :return: List of projects.
        """
        pass

    @abstractmethod
    def create_data_source(
        self, data_source: Union[api_models.DataSource, dict], **kwargs
    ) -> api_models.DataSource:
        """
        Create a new data source in the database.

        :param data_source: The data source object to create.

        :return: The created data source.
        """
        pass

    @abstractmethod
    def get_data_source(self, name: str, **kwargs) -> Optional[api_models.DataSource]:
        """
        Get a data source from the database.

        :param name: The name of the data source to get.

        :return: The requested data source.
        """
        pass

    @abstractmethod
    def update_data_source(
        self, name: str, data_source: Union[api_models.DataSource, dict], **kwargs
    ) -> api_models.DataSource:
        """
        Update an existing data source in the database.

        :param name:        The name of the data source to update.
        :param data_source: The data source object with the new data.

        :return: The updated data source.
        """
        pass

    @abstractmethod
    def delete_data_source(self, name: str, **kwargs):
        """
        Delete a data source from the database.

        :param name: The name of the data source to delete.

        :return: A response object with the success status.
        """
        pass

    @abstractmethod
    def list_data_sources(
        self,
        name: str = None,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        data_source_type: Union[api_models.DataSourceType, str] = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        **kwargs,
    ) -> List[Optional[api_models.DataSource]]:
        """
        List data sources from the database.

        :param name:             The name to filter the data sources by.
        :param owner_id:         The owner to filter the data sources by.
        :param version:          The version to filter the data sources by.
        :param project_id:       The project to filter the data sources by.
        :param data_source_type: The data source type to filter the data sources by.
        :param labels_match:     The labels to match, filter the data sources by labels.
        :param output_mode:      The output mode.

        :return: List of data sources.
        """
        pass

    @abstractmethod
    def create_dataset(
        self, dataset: Union[api_models.Dataset, dict], **kwargs
    ) -> api_models.Dataset:
        """
        Create a new dataset in the database.

        :param dataset: The dataset object to create.

        :return: The created dataset.
        """
        pass

    @abstractmethod
    def get_dataset(self, name: str, **kwargs) -> Optional[api_models.Dataset]:
        """
        Get a dataset from the database.

        :param name: The name of the dataset to get.

        :return: The requested dataset.
        """
        pass

    @abstractmethod
    def update_dataset(
        self, name: str, dataset: Union[api_models.Dataset, dict], **kwargs
    ) -> api_models.Dataset:
        """
        Update an existing dataset in the database.

        :param name:    The name of the dataset to update.
        :param dataset: The dataset object with the new data.

        :return: The updated dataset.
        """
        pass

    @abstractmethod
    def delete_dataset(self, name: str, **kwargs):
        """
        Delete a dataset from the database.

        :param name: The name of the dataset to delete.
        """
        pass

    @abstractmethod
    def list_datasets(
        self,
        name: str = None,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        task: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        **kwargs,
    ) -> List[Optional[api_models.Dataset]]:
        """
        List datasets from the database.

        :param name:         The name to filter the datasets by.
        :param owner_id:     The owner to filter the datasets by.
        :param version:      The version to filter the datasets by.
        :param project_id:   The project to filter the datasets by.
        :param task:         The task to filter the datasets by.
        :param labels_match: The labels to match, filter the datasets by labels.
        :param output_mode:  The output mode.

        :return: The list of datasets.
        """
        pass

    @abstractmethod
    def create_model(self, model: Union[api_models.Model, dict]) -> api_models.Model:
        """
        Create a new model in the database.

        :param model: The model object to create.

        :return: The created model.
        """
        pass

    @abstractmethod
    def get_model(self, name: str, **kwargs) -> Optional[api_models.Model]:
        """
        Get a model from the database.

        :param name: The name of the model to get.

        :return: The requested model.
        """
        pass

    @abstractmethod
    def update_model(
        self, name: str, model: Union[api_models.Model, dict], **kwargs
    ) -> api_models.Model:
        """
        Update an existing model in the database.

        :param name:  The name of the model to update.
        :param model: The model object with the new data.

        :return: The updated model.
        """
        pass

    @abstractmethod
    def delete_model(self, name: str, **kwargs):
        """
        Delete a model from the database.

        :param name: The name of the model to delete.
        """
        pass

    @abstractmethod
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
        **kwargs,
    ) -> List[Optional[api_models.Model]]:
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

        :return: The list of models.
        """
        pass

    @abstractmethod
    def create_prompt_template(
        self, prompt_template: Union[api_models.PromptTemplate, dict], **kwargs
    ) -> api_models.PromptTemplate:
        """
        Create a new prompt template in the database.

        :param prompt_template: The prompt template object to create.

        :return: The created prompt template.
        """
        pass

    @abstractmethod
    def get_prompt_template(
        self, name: str, **kwargs
    ) -> Optional[api_models.PromptTemplate]:
        """
        Get a prompt template from the database.

        :param name: The name of the prompt template to get.

        :return: The requested prompt template.
        """
        pass

    @abstractmethod
    def update_prompt_template(
        self,
        name: str,
        prompt_template: Union[api_models.PromptTemplate, dict],
        **kwargs,
    ) -> api_models.PromptTemplate:
        """
        Update an existing prompt template in the database.

        :param name:            The name of the prompt template to update.
        :param prompt_template: The prompt template object with the new data.

        :return: The updated prompt template.
        """
        pass

    @abstractmethod
    def delete_prompt_template(self, name: str, **kwargs):
        """
        Delete a prompt template from the database.

        :param name: The name of the prompt template to delete.
        """
        pass

    @abstractmethod
    def list_prompt_templates(
        self,
        name: str = None,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        **kwargs,
    ) -> List[Optional[api_models.PromptTemplate]]:
        """
        List prompt templates from the database.

        :param name:         The name to filter the prompt templates by.
        :param owner_id:     The owner to filter the prompt templates by.
        :param version:      The version to filter the prompt templates by.
        :param project_id:   The project to filter the prompt templates by.
        :param labels_match: The labels to match, filter the prompt templates by labels.
        :param output_mode:  The output mode.

        :return: The list of prompt templates.
        """
        pass

    @abstractmethod
    def create_document(
        self, document: Union[api_models.Document, dict], **kwargs
    ) -> api_models.Document:
        """
        Create a new document in the database.

        :param document: The document object to create.

        :return: The created document.
        """
        pass

    @abstractmethod
    def get_document(self, name: str, **kwargs) -> Optional[api_models.Document]:
        """
        Get a document from the database.

        :param name: The name of the document to get.

        :return: The requested document.
        """
        pass

    @abstractmethod
    def update_document(
        self, name: str, document: Union[api_models.Document, dict], **kwargs
    ) -> api_models.Document:
        """
        Update an existing document in the database.

        :param name:     The name of the document to update.
        :param document: The document object with the new data.

        :return: The updated document.
        """
        pass

    @abstractmethod
    def delete_document(self, name: str, **kwargs):
        """
        Delete a document from the database.

        :param name: The name of the document to delete.
        """
        pass

    @abstractmethod
    def list_documents(
        self,
        name: str = None,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        **kwargs,
    ) -> List[Optional[api_models.Document]]:
        """
        List documents from the database.

        :param name:         The name to filter the documents by.
        :param owner_id:     The owner to filter the documents by.
        :param version:      The version to filter the documents by.
        :param project_id:   The project to filter the documents by.
        :param labels_match: The labels to match, filter the documents by labels.
        :param output_mode:  The output mode.

        :return: The list of documents.
        """
        pass

    @abstractmethod
    def create_workflow(
        self, workflow: Union[api_models.Workflow, dict], **kwargs
    ) -> api_models.Workflow:
        """
        Create a new workflow in the database.

        :param workflow: The workflow object to create.

        :return: The created workflow.
        """
        pass

    @abstractmethod
    def get_workflow(self, name: str, **kwargs) -> Type[api_models.Base]:
        """
        Get a workflow from the database.

        :param name: The name of the workflow to get.

        :return: The requested workflow.
        """
        pass

    @abstractmethod
    def update_workflow(
        self, name: str, workflow: Union[api_models.Workflow, dict], **kwargs
    ) -> api_models.Workflow:
        """
        Update an existing workflow in the database.

        :param name:     The name of the workflow to update.
        :param workflow: The workflow object with the new data.

        :return: The updated workflow.
        """
        pass

    @abstractmethod
    def delete_workflow(self, name: str, **kwargs):
        """
        Delete a workflow from the database.

        :param name: The name of the workflow to delete.
        """
        pass

    @abstractmethod
    def list_workflows(
        self,
        name: str = None,
        owner_id: str = None,
        version: str = None,
        project_id: str = None,
        workflow_type: Union[api_models.WorkflowType, str] = None,
        labels_match: Union[list, str] = None,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        **kwargs,
    ) -> List[Optional[api_models.Workflow]]:
        """
        List workflows from the database.

        :param name:          The name to filter the workflows by.
        :param owner_id:      The owner to filter the workflows by.
        :param version:       The version to filter the workflows by.
        :param project_id:    The project to filter the workflows by.
        :param workflow_type: The workflow type to filter the workflows by.
        :param labels_match:  The labels to match, filter the workflows by labels.
        :param output_mode:   The output mode.

        :return: The list of workflows.
        """
        pass

    @abstractmethod
    def create_session(
        self, session: Union[api_models.ChatSession, dict], **kwargs
    ) -> api_models.ChatSession:
        """
        Create a new session in the database.

        :param session: The chat session object to create.

        :return: The created session.
        """
        pass

    @abstractmethod
    def get_session(
        self, name: str = None, uid: str = None, user_id: str = None, **kwargs
    ) -> Optional[api_models.ChatSession]:
        """
        Get a session from the database.

        :param name:    The name of the session to get.
        :param uid:     The ID of the session to get.
        :param user_id: The UID of the user to get the last session for.

        :return: The requested session.
        """
        pass

    @abstractmethod
    def update_session(
        self, name: str, session: Union[api_models.ChatSession, dict], **kwargs
    ) -> api_models.ChatSession:
        """
        Update a session in the database.

        :param name:    The name of the session to update.
        :param session: The session object with the new data.

        :return: The updated chat session.
        """
        pass

    @abstractmethod
    def delete_session(self, name: str, **kwargs):
        """
        Delete a session from the database.

        :param name: The name of the session to delete.
        """
        pass

    @abstractmethod
    def list_sessions(
        self,
        name: str = None,
        user_id: str = None,
        workflow_id: str = None,
        created_after=None,
        last=0,
        output_mode: api_models.OutputMode = api_models.OutputMode.DETAILS,
        **kwargs,
    ):
        """
        List sessions from the database.

        :param name:          The name to filter the chat sessions by.
        :param user_id:       The user ID to filter the chat sessions by.
        :param workflow_id:   The workflow ID to filter the chat sessions by.
        :param created_after: The date to filter the chat sessions by.
        :param last:          The number of last chat sessions to return.
        :param output_mode:   The output mode.

        :return: The list of chat sessions.
        """
        pass

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
        items = [self._from_db_object(item, obj_class) for item in items]
        if mode == api_models.OutputMode.DETAILS:
            return items
        short = mode == api_models.OutputMode.SHORT
        return [item.to_dict(short=short) for item in items]
