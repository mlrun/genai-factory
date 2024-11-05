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

from typing import Union

import requests
from mlrun.utils.helpers import dict_to_json

from genai_factory.schemas import (
    ChatSession,
    DataSource,
    Deployment,
    Project,
    User,
    Workflow,
)
from genai_factory.utils import logger


class ControllerClient:
    """
    A client for the GenAI controller. It is used to interact with the controller's API to create and manage workflows,
    and other resources of a project and users sessions.
    """

    def __init__(
        self, controller_url: str, project_name: str, username: str, token: str = None
    ):
        """
        Initialize the client.

        :param controller_url: The URL of the controller.
        :param project_name:   The name of the MLRun project to manage.
        :param username:       The user that will be used as the owner for anything created via the client.
        :param token:          The token to use for authentication.
        """
        self._controller_url = controller_url
        self._project_name = project_name
        self._username = username
        self._token = token
        self._project_id = None
        self._owner_id = None

    @property
    def project_id(self):
        if not self._project_id:
            self._project_id = self.get_project().uid
        return self._project_id

    @property
    def owner_id(self):
        if not self._owner_id:
            self._owner_id = self.get_user().uid
        return self._owner_id

    def _send_request(
        self,
        path: str,
        method: str,
        params: dict = None,
        data: dict = None,
        files: dict = None,
        json: dict = None,
    ):
        """
        Send a request to the controller. The parameters are the same as the `requests.request` function but supporting
        only dictionaries for simplicity.

        :param path:   The sub-path of the controller API to send the request to. It is appended to the controller URL.
        :param method: Method for the new request. One of: GET, OPTIONS, HEAD, POST, PUT, PATCH, or DELETE.
        :param params: Dictionary to send in the query string for the Request.
        :param data:   Dictionary to send in the body of the Request.
        :param files:  Dictionary of 'name': file-like-objects.
        :param json:   A JSON serializable Python object to send in the body of the Request.

        :return: The JSON response of the request.

        :raises requests.HTTPError: If the request failed.
        :raises UnicodeDecodeError: If the request decoding failed.
        """
        # Construct the URL:
        url = f"{self._controller_url}/api/{path}"

        # Prepare the request kwargs:
        request_kwargs = {}
        if data is not None:
            request_kwargs["data"] = dict_to_json(data)
        if params is not None:
            request_kwargs["params"] = {
                k: v for k, v in params.items() if v is not None
            }
        if json is not None:
            request_kwargs["json"] = json
        if files is not None:
            request_kwargs["files"] = files

        # Make the request
        logger.debug(
            f"Sending {method} request to {url}, params: {params}, data: {data}, json: {json}, files: {files}"
        )
        response = requests.request(
            method,
            url,
            headers={"x_username": self._username},
            **request_kwargs,
        )

        # Check the response
        if response.status_code == 200:
            # If the request was successful, return the JSON response
            return response.json()
        # The request failed, raise an exception:
        response.raise_for_status()

    def get_data_source(
        self, name: str, uid: str = None, version: str = None
    ) -> DataSource:
        """
        Get a collection by name.

        :param name:    The name of the data source to get.
        :param uid:     The UID of the data source to get.
        :param version: The version of the data source to get.

        :return: The collection object as dictionary.
        """
        params = {}
        if uid:
            params["uid"] = uid
        if version:
            params["version"] = version
        response = self._send_request(
            path=f"projects/{self._project_name}/data_sources/{name}",
            method="GET",
            params=params,
        )
        return DataSource(**response["data"])

    def get_session(
        self, name: str, uid: str = None, username: str = None
    ) -> ChatSession:
        """
        Get a user's session

        :param name:     The name of the session to get.
        :param uid:      The UID of the session to get.
        :param username: The username of the user to get the session for.

        :return: The session object as dictionary.
        """
        username = username or self._username
        params = {}
        if uid:
            params["uid"] = uid
        response = self._send_request(
            path=f"users/{username}/sessions/{name}", method="GET", params=params
        )
        return ChatSession(**response["data"])

    def get_user(self, username: str = "", email: str = None, uid: str = None) -> User:
        """
        Get a user from the database.

        :param username: The name of the user to get.
        :param email:    The email address to get the user by if the name is not provided.
        :param uid:      The UID of the user to get.

        :return: The user from the database.
        """
        username = username or self._username
        params = {}
        if email:
            params["email"] = email
        if uid:
            params["uid"] = uid
        response = self._send_request(
            path=f"users/{username}", method="GET", params=params
        )
        return User(**response["data"])

    def update_session(
        self,
        chat_session: ChatSession,
        username: str = None,
    ) -> ChatSession:
        """
        Update a session in the database.

        :param chat_session: The session to update.
        :param username:     The name of the user to update the session for.

        :return: The updated session from the database.
        """
        username = username or self._username
        response = self._send_request(
            path=f"users/{username}/sessions/{chat_session.name}",
            method="PUT",
            data=chat_session.to_dict(),
        )
        return ChatSession(**response["data"])

    def get_project(self) -> Project:
        """
        Get the project object.

        :return: The project object.
        """
        response = self._send_request(
            path=f"projects/{self._project_name}", method="GET"
        )
        return Project(**response["data"])

    def create_workflow(self, workflow: Union[Workflow, dict]) -> Workflow:
        """
        Create a new workflow in the project.

        :param workflow: The workflow object or dictionary to create.

        :return: The created workflow object.
        """
        project_id = self.get_project().uid
        if isinstance(workflow, dict):
            workflow["graph"] = [step.to_dict() for step in workflow["graph"]]
            workflow = Workflow(**workflow)

        workflow.project_id = project_id
        response = self._send_request(
            path=f"projects/{self._project_name}/workflows",
            method="POST",
            data=workflow.to_dict(),
        )
        return Workflow(**response["data"])

    def get_workflow(
        self, workflow_name: str = None, workflow_id: str = None, version: str = None
    ) -> Workflow:
        """
        Get a workflow from database.

        :param workflow_name: The name of the workflow to get.
        :param workflow_id:   The id of the workflow to get.
        :param version:       The version of the workflow to get.

        :return: The workflow object.
        """
        params = {}
        if workflow_id:
            params["uid"] = workflow_id
        if version:
            params["version"] = version
        response = self._send_request(
            path=f"projects/{self._project_name}/workflows/{workflow_name}",
            method="GET",
            params=params,
        )
        return Workflow(**response)

    def update_workflow(self, workflow: Workflow) -> Workflow:
        """
        Update a workflow in the database. If the workflow does not exist, it will be created.

        :param workflow: The workflow object to update.

        :return: The updated workflow object.
        """
        response = self._send_request(
            path=f"projects/{self._project_name}/workflows/{workflow.name}",
            method="PUT",
            data=workflow.to_dict(),
        )
        return Workflow(**response["data"])

    def update_deployment(self, deployment: Deployment) -> Deployment:
        """
        Update a deployment in the database. If the deployment does not exist, it will be created.

        :param deployment: The deployment object to update.

        :return: The updated deployment object.
        """
        response = self._send_request(
            path=f"projects/{self._project_name}/deployments/{deployment.name}",
            method="PUT",
            data=deployment.to_dict(),
        )
        return Deployment(**response["data"])
