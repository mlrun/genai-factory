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
import json
import os
from typing import List, Optional, Tuple, Union

import requests
from fastapi import APIRouter, Depends, FastAPI, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from controller.src.config import config
from controller.src.model import (
    ApiResponse,
    ChatSession,
    Dataset,
    DataSource,
    DataSourceType,
    Document,
    Model,
    OutputMode,
    Project,
    PromptTemplate,
    QueryItem,
    User,
    Workflow,
)
from controller.src.sqlclient import client

app = FastAPI()

# Add CORS middleware, remove in production
origins = ["*"]  # React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with a prefix
router = APIRouter(prefix="/api")


def get_db():
    db_session = None
    try:
        db_session = client.get_local_session()
        yield db_session
    finally:
        if db_session:
            db_session.close()


class AuthInfo(BaseModel):
    username: str
    token: str
    roles: List[str] = []


# placeholder for extracting the Auth info from the request
def get_auth_user(
    request: Request, x_username: Union[str, None] = Header(None)
) -> AuthInfo:
    """Get the user from the database"""
    token = request.cookies.get("Authorization", "")
    if x_username:
        return AuthInfo(username=x_username, token=token)
    else:
        return AuthInfo(username="guest@example.com", token=token)


def _send_to_application(
    path: str, method: str = "POST", request=None, auth=None, **kwargs
):
    """
    Send a request to the application's API.

    :param path:    The API path to send the request to.
    :param method:  The HTTP method to use: GET, POST, PUT, DELETE, etc.
    :param request: The FastAPI request object. If provided, the data will be taken from the body of the request.
    :param auth:    The authentication information to use. If provided, the username will be added to the headers.
    :param kwargs:  Additional keyword arguments to pass in the request function. For example, headers, params, etc.

    :return:        The JSON response from the application.
    """
    if config.application_url not in path:
        url = f"{config.application_url}/api/{path}"
    else:
        url = path

    if isinstance(request, Request):
        # If the request is a FastAPI request, get the data from the body
        kwargs["data"] = request._body.decode("utf-8")
    if auth is not None:
        kwargs["headers"] = {"x_username": auth.username}

    response = requests.request(
        method=method,
        url=url,
        **kwargs,
    )

    # Check the response
    if response.status_code == 200:
        # If the request was successful, return the JSON response
        return response.json()
    else:
        # If the request failed, raise an exception
        response.raise_for_status()


@router.post("/tables")
def create_tables(drop_old: bool = False, names: list[str] = None):
    return client.create_tables(drop_old=drop_old, names=names)


@router.post("/users")
def create_user(
    user: User,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Create a new user in the database.

    :param user:    The user to create.
    :param session: The database session.

    :return:    The response from the database.
    """
    return client.create_user(user=user, session=session)


@router.get("/users/{user_name}")
def get_user(user_name: str, email: str = None, session=Depends(get_db)) -> ApiResponse:
    """
    Get a user from the database.

    :param user_name:   The name of the user to get.
    :param email:       The email address to get the user by if the name is not provided.
    :param session:     The database session.

    :return:    The user from the database.
    """
    return client.get_user(user_name=user_name, email=email, session=session)


@router.put("/users/{user_name}")
def update_user(
    user: User,
    user_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a user in the database.

    :param user:        The user to update.
    :param user_name:   The name of the user to update.
    :param session:     The database session.

    :return:    The response from the database.
    """
    if user_name != user.name:
        raise ValueError(f"User name does not match: {user_name} != {user.name}")
    return client.update_user(user=user, session=session)


@router.delete("/users/{user_name}")
def delete_user(user_name: str, session=Depends(get_db)) -> ApiResponse:
    """
    Delete a user from the database.

    :param user_name:   The name of the user to delete.
    :param session:     The database session.

    :return:    The response from the database.
    """
    return client.delete_user(user_name=user_name, session=session)


@router.get("/users")
def list_users(
    email: str = None,
    full_name: str = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
) -> ApiResponse:
    """
    List users in the database.

    :param email:       The email address to filter by.
    :param full_name:   The full name to filter by.
    :param mode:        The output mode.
    :param session:     The database session.

    :return:    The response from the database.
    """
    return client.list_users(
        email=email, full_name=full_name, output_mode=mode, session=session
    )


@router.post("/projects")
def create_project(
    project: Project,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Create a new project in the database.

    :param project: The project to create.
    :param session: The database session.

    :return:    The response from the database.
    """
    return client.create_project(project=project, session=session)


@router.get("/projects/{project_name}")
def get_project(project_name: str, session=Depends(get_db)) -> ApiResponse:
    """
    Get a project from the database.

    :param project_name: The name of the project to get.
    :param session:    The database session.

    :return:    The project from the database.
    """
    return client.get_project(project_name=project_name, session=session)


@router.put("/projects/{project_name}")
def update_project(
    project: Project,
    project_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a project in the database.

    :param project:         The project to update.
    :param project_name:    The name of the project to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    if project_name != project.name:
        raise ValueError(
            f"Project name does not match: {project_name} != {project.name}"
        )
    return client.update_project(project=project, session=session)


@router.delete("/projects/{project_name}")
def delete_project(project_name: str, session=Depends(get_db)) -> ApiResponse:
    """
    Delete a project from the database.

    :param project_name:    The name of the project to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    return client.delete_project(project_name=project_name, session=session)


@router.get("/projects")
def list_projects(
    owner_name: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
) -> ApiResponse:
    """
    List projects in the database.

    :param owner_name:  The name of the owner to filter by.
    :param labels:      The labels to filter by.
    :param mode:        The output mode.
    :param session:     The database session.

    :return:    The response from the database.
    """
    if owner_name is not None:
        owner_id = client.get_user(user_name=owner_name, session=session).data["id"]
    else:
        owner_id = None
    return client.list_projects(
        owner_id=owner_id, labels_match=labels, output_mode=mode, session=session
    )


@router.post("projects/{project_name}/data_sources/{data_source_name}")
def create_data_source(
    project_name: str,
    data_source_name: str,
    data_source: DataSource,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    Create a new data source in the database.

    :param project_name:        The name of the project to create the data source in.
    :param data_source_name:    The name of the data source to create.
    :param data_source:         The data source to create.
    :param session:             The database session.
    :param auth:                The authentication information.

    :return:    The response from the database.
    """
    # If the owner ID is not provided, get it from the username
    if data_source.owner_id is None:
        data_source.owner_id = client.get_user(
            user_name=auth.username, session=session
        ).data["id"]
    data_source.name = data_source_name
    data_source.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    return client.create_data_source(data_source=data_source, session=session)


@router.get("projects/{project_name}/data_sources/{data_source_name}")
def get_data_source(
    project_name: str, data_source_name: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Get a data source from the database.

    :param project_name:        The name of the project to get the data source from.
    :param data_source_name:    The name of the data source to get.
    :param session:             The database session.

    :return:    The data source from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.get_data_source(
        project_id=project_id, data_source_name=data_source_name, session=session
    )


@router.put("projects/{project_name}/data_sources/{data_source_name}")
def update_data_source(
    project_name: str,
    data_source: DataSource,
    data_source_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a data source in the database.

    :param project_name:        The name of the project to update the data source in.
    :param data_source:         The data source to update.
    :param data_source_name:    The name of the data source to update.
    :param session:             The database session.

    :return:    The response from the database.
    """
    data_source.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    if data_source_name != data_source.name:
        raise ValueError(
            f"Data source name does not match: {data_source_name} != {data_source.name}"
        )
    return client.update_data_source(data_source=data_source, session=session)


@router.delete("projects/{project_name}/data_sources/{data_source_id}")
def delete_data_source(
    project_name: str, data_source_id: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Delete a data source from the database.

    :param project_name:        The name of the project to delete the data source from.
    :param data_source_id:      The ID of the data source to delete.
    :param session:             The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.delete_data_source(
        project_id=project_id, data_source_id=data_source_id, session=session
    )


@router.get("projects/{project_name}/data_sources")
def list_data_sources(
    project_name: str,
    version: str = None,
    data_source_type: Union[DataSourceType, str] = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    List data sources in the database.

    :param project_name:        The name of the project to list the data sources from.
    :param version:             The version to filter by.
    :param data_source_type:    The data source type to filter by.
    :param labels:              The labels to filter by.
    :param mode:                The output mode.
    :param session:             The database session.
    :param auth:                The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(user_name=auth.username, session=session).data["id"]
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.list_data_sources(
        project_id=project_id,
        owner_id=owner_id,
        version=version,
        data_source_type=data_source_type,
        labels_match=labels,
        output_mode=mode,
        session=session,
    )


@router.post("/projects/{project_name}/datasets/{dataset_name}")
def create_dataset(
    project_name: str,
    dataset_name: str,
    dataset: Dataset,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    Create a new dataset in the database.

    :param project_name:    The name of the project to create the dataset in.
    :param dataset_name:    The name of the dataset to create.
    :param dataset:         The dataset to create.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    # If the owner ID is not provided, get it from the username
    if dataset.owner_id is None:
        dataset.owner_id = client.get_user(
            user_name=auth.username, session=session
        ).data["id"]
    dataset.name = dataset_name
    dataset.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    return client.create_dataset(dataset=dataset, session=session)


@router.get("/projects/{project_name}/datasets/{dataset_name}")
def get_dataset(
    project_name: str, dataset_name: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Get a dataset from the database.

    :param project_name:    The name of the project to get the dataset from.
    :param dataset_name:    The name of the dataset to get.
    :param session:         The database session.

    :return:    The dataset from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.get_dataset(
        project_id=project_id, dataset_name=dataset_name, session=session
    )


@router.put("/projects/{project_name}/datasets/{dataset_name}")
def update_dataset(
    project_name: str,
    dataset: Dataset,
    dataset_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a dataset in the database.

    :param project_name:    The name of the project to update the dataset in.
    :param dataset:         The dataset to update.
    :param dataset_name:    The name of the dataset to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    dataset.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    if dataset_name != dataset.name:
        raise ValueError(
            f"Dataset name does not match: {dataset_name} != {dataset.name}"
        )
    return client.update_dataset(dataset=dataset, session=session)


@router.delete("/projects/{project_name}/datasets/{dataset_id}")
def delete_dataset(
    project_name: str, dataset_id: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Delete a dataset from the database.

    :param project_name:    The name of the project to delete the dataset from.
    :param dataset_id:      The ID of the dataset to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.delete_dataset(
        project_id=project_id, dataset_id=dataset_id, session=session
    )


@router.get("/projects/{project_name}/datasets")
def list_datasets(
    project_name: str,
    version: str = None,
    task: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    List datasets in the database.

    :param project_name:    The name of the project to list the datasets from.
    :param version:         The version to filter by.
    :param task:            The task to filter by.
    :param labels:          The labels to filter by.
    :param mode:            The output mode.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(user_name=auth.username, session=session).data["id"]
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.list_datasets(
        project_id=project_id,
        owner_id=owner_id,
        version=version,
        task=task,
        labels_match=labels,
        output_mode=mode,
        session=session,
    )


@router.post("/projects/{project_name}/models/{model_name}")
def create_model(
    project_name: str,
    model_name: str,
    model: Model,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    Create a new model in the database.

    :param project_name:    The name of the project to create the model in.
    :param model_name:      The name of the model to create.
    :param model:           The model to create.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    # If the owner ID is not provided, get it from the username
    if model.owner_id is None:
        model.owner_id = client.get_user(user_name=auth.username, session=session).data[
            "id"
        ]
    model.name = model_name
    model.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    return client.create_model(model=model, session=session)


@router.get("/projects/{project_name}/models/{model_name}")
def get_model(
    project_name: str, model_name: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Get a model from the database.

    :param project_name:    The name of the project to get the model from.
    :param model_name:      The name of the model to get.
    :param session:         The database session.

    :return:    The model from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.get_model(
        project_id=project_id, model_name=model_name, session=session
    )


@router.put("/projects/{project_name}/models/{model_name}")
def update_model(
    project_name: str,
    model: Model,
    model_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a model in the database.

    :param project_name:    The name of the project to update the model in.
    :param model:           The model to update.
    :param model_name:      The name of the model to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    model.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    if model_name != model.name:
        raise ValueError(f"Model name does not match: {model_name} != {model.name}")
    return client.update_model(model=model, session=session)


@router.delete("/projects/{project_name}/models/{model_id}")
def delete_model(
    project_name: str, model_id: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Delete a model from the database.

    :param project_name:    The name of the project to delete the model from.
    :param model_id:        The ID of the model to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.delete_model(
        project_id=project_id, model_id=model_id, session=session
    )


@router.get("/projects/{project_name}/models")
def list_models(
    project_name: str,
    version: str = None,
    model_type: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    List models in the database.

    :param project_name:    The name of the project to list the models from.
    :param version:         The version to filter by.
    :param model_type:      The model type to filter by.
    :param labels:          The labels to filter by.
    :param mode:            The output mode.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(user_name=auth.username, session=session).data["id"]
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.list_models(
        project_id=project_id,
        owner_id=owner_id,
        version=version,
        model_type=model_type,
        labels_match=labels,
        output_mode=mode,
        session=session,
    )


@router.post("/projects/{project_name}/prompt_templates/{prompt_name}")
def create_prompt(
    project_name: str,
    prompt_name: str,
    prompt: PromptTemplate,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    Create a new prompt in the database.

    :param project_name:    The name of the project to create the prompt in.
    :param prompt_name:     The name of the prompt to create.
    :param prompt:          The prompt to create.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    # If the owner ID is not provided, get it from the username
    if prompt.owner_id is None:
        prompt.owner_id = client.get_user(
            user_name=auth.username, session=session
        ).data["id"]
    prompt.name = prompt_name
    prompt.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    return client.create_prompt_template(prompt=prompt, session=session)


@router.get("/projects/{project_name}/prompt_templates/{prompt_name}")
def get_prompt(
    project_name: str, prompt_name: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Get a prompt from the database.

    :param project_name:    The name of the project to get the prompt from.
    :param prompt_name:     The name of the prompt to get.
    :param session:         The database session.

    :return:    The prompt from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.get_prompt(
        project_id=project_id, prompt_name=prompt_name, session=session
    )


@router.put("/projects/{project_name}/prompt_templates/{prompt_name}")
def update_prompt(
    project_name: str,
    prompt: PromptTemplate,
    prompt_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a prompt in the database.

    :param project_name:    The name of the project to update the prompt in.
    :param prompt:          The prompt to update.
    :param prompt_name:     The name of the prompt to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    prompt.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    if prompt_name != prompt.name:
        raise ValueError(f"Prompt name does not match: {prompt_name} != {prompt.name}")
    return client.update_prompt_template(prompt=prompt, session=session)


@router.delete("/projects/{project_name}/prompt_templates/{prompt_template_id}")
def delete_prompt(
    project_name: str, prompt_template_id: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Delete a prompt from the database.

    :param project_name:        The name of the project to delete the prompt from.
    :param prompt_template_id:  The ID of the prompt to delete.
    :param session:             The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.delete_prompt_template(
        project_id=project_id, prompt_template_id=prompt_template_id, session=session
    )


@router.get("/projects/{project_name}/prompt_templates")
def list_prompts(
    project_name: str,
    version: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    List prompts in the database.

    :param project_name:    The name of the project to list the prompts from.
    :param version:         The version to filter by.
    :param labels:          The labels to filter by.
    :param mode:            The output mode.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(user_name=auth.username, session=session).data["id"]
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.list_prompt_templates(
        project_id=project_id,
        owner_id=owner_id,
        version=version,
        labels_match=labels,
        output_mode=mode,
        session=session,
    )


@router.post("/projects/{project_name}/documents/{document_name}")
def create_document(
    project_name: str,
    document_name: str,
    document: Document,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    Create a new document in the database.

    :param project_name:    The name of the project to create the document in.
    :param document_name:   The name of the document to create.
    :param document:        The document to create.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    # If the owner ID is not provided, get it from the username
    if document.owner_id is None:
        document.owner_id = client.get_user(
            user_name=auth.username, session=session
        ).data["id"]
    document.name = document_name
    document.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    return client.create_document(document=document, session=session)


@router.get("/projects/{project_name}/documents/{document_name}")
def get_document(
    project_name: str, document_name: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Get a document from the database.

    :param project_name:    The name of the project to get the document from.
    :param document_name:   The name of the document to get.
    :param session:         The database session.

    :return:    The document from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.get_document(
        project_id=project_id, document_name=document_name, session=session
    )


@router.put("/projects/{project_name}/documents/{document_name}")
def update_document(
    project_name: str,
    document: Document,
    document_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a document in the database.

    :param project_name:    The name of the project to update the document in.
    :param document:        The document to update.
    :param document_name:   The name of the document to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    document.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    if document_name != document.name:
        raise ValueError(
            f"Document name does not match: {document_name} != {document.name}"
        )
    return client.update_document(document=document, session=session)


@router.delete("/projects/{project_name}/documents/{document_id}")
def delete_document(
    project_name: str, document_id: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Delete a document from the database.

    :param project_name:    The name of the project to delete the document from.
    :param document_id:     The ID of the document to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.delete_document(
        project_id=project_id, document_id=document_id, session=session
    )


@router.get("/projects/{project_name}/documents")
def list_documents(
    project_name: str,
    version: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    List documents in the database.

    :param project_name:    The name of the project to list the documents from.
    :param version:         The version to filter by.
    :param labels:          The labels to filter by.
    :param mode:            The output mode.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(user_name=auth.username, session=session).data["id"]
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.list_documents(
        project_id=project_id,
        owner_id=owner_id,
        version=version,
        labels_match=labels,
        output_mode=mode,
        session=session,
    )


@router.post("/projects/{project_name}/workflows/{workflow_name}")
def create_workflow(
    project_name: str,
    workflow_name: str,
    workflow: Workflow,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    Create a new workflow in the database.

    :param project_name:    The name of the project to create the workflow in.
    :param workflow_name:   The name of the workflow to create.
    :param workflow:        The workflow to create.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    # If the owner ID is not provided, get it from the username
    if workflow.owner_id is None:
        workflow.owner_id = client.get_user(
            user_name=auth.username, session=session
        ).data["id"]
    workflow.name = workflow_name
    workflow.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    return client.create_workflow(workflow=workflow, session=session)


@router.get("/projects/{project_name}/workflows/{workflow_name}")
def get_workflow(
    project_name: str, workflow_name: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Get a workflow from the database.

    :param project_name:    The name of the project to get the workflow from.
    :param workflow_name:   The name of the workflow to get.
    :param session:         The database session.

    :return:    The workflow from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.get_workflow(
        project_id=project_id, workflow_name=workflow_name, session=session
    )


@router.put("/projects/{project_name}/workflows/{workflow_name}")
def update_workflow(
    project_name: str,
    workflow: Workflow,
    workflow_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a workflow in the database.

    :param project_name:    The name of the project to update the workflow in.
    :param workflow:        The workflow to update.
    :param workflow_name:   The name of the workflow to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    workflow.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    if workflow_name != workflow.name:
        raise ValueError(
            f"Workflow name does not match: {workflow_name} != {workflow.name}"
        )
    return client.update_workflow(workflow=workflow, session=session)


@router.delete("/projects/{project_name}/workflows/{workflow_id}")
def delete_workflow(
    project_name: str, workflow_id: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Delete a workflow from the database.

    :param project_name:    The name of the project to delete the workflow from.
    :param workflow_id:     The ID of the workflow to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.delete_workflow(
        project_id=project_id, workflow_id=workflow_id, session=session
    )


@router.get("/projects/{project_name}/workflows")
def list_workflows(
    project_name: str,
    version: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    List workflows in the database.

    :param project_name:    The name of the project to list the workflows from.
    :param version:         The version to filter by.
    :param labels:          The labels to filter by.
    :param mode:            The output mode.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(user_name=auth.username, session=session).data["id"]
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.list_workflows(
        project_id=project_id,
        owner_id=owner_id,
        version=version,
        labels_match=labels,
        output_mode=mode,
        session=session,
    )


@router.post("/users/{user_name}/sessions/{session_name}")
def create_session(
    user_name: str,
    session_name: str,
    chat_session: ChatSession,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Create a new session in the database.

    :param user_name:       The name of the user to create the session for.
    :param session_name:    The name of the session to create.
    :param chat_session:    The session to create.
    :param session:         The database session.

    :return:    The response from the database.
    """
    chat_session.owner_id = client.get_user(user_name=user_name, session=session).data[
        "id"
    ]
    return client.create_chat_session(chat_session=chat_session, session=session)


@router.get("/users/{user_name}/sessions/{session_name}")
def get_session(
    user_name: str, session_name: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Get a session from the database. If the session ID is "$last", get the last session for the user.

    :param user_name:       The name of the user to get the session for.
    :param session_name:    The name of the session to get.
    :param session:         The database session.

    :return:    The session from the database.
    """
    user_id = None
    if session_name == "$last":
        user_id = client.get_user(user_name=user_name, session=session).data["id"]
        session_name = None
    return client.get_chat_session(
        session_name=session_name, user_id=user_id, session=session
    )


@router.put("/users/{user_name}/sessions/{session_name}")
def update_session(
    user_name: str,
    chat_session: ChatSession,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a session in the database.

    :param user_name:       The name of the user to update the session for.
    :param chat_session:    The session to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    chat_session.owner_id = client.get_user(user_name=user_name, session=session).data[
        "id"
    ]
    return client.update_chat_session(chat_session=chat_session, session=session)


@router.get("/users/{user_name}/sessions")
def list_sessions(
    user_name: str,
    last: int = 0,
    created: str = None,
    workflow_id: str = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
) -> ApiResponse:
    """
    List sessions in the database.

    :param user_name:   The name of the user to list the sessions for.
    :param last:        The number of sessions to get.
    :param created:     The date to filter by.
    :param workflow_id: The ID of the workflow to filter by.
    :param mode:        The output mode.
    :param session:     The database session.

    :return:    The response from the database.
    """
    user_id = client.get_user(user_name=user_name, session=session).data["id"]
    return client.list_chat_sessions(
        user_id=user_id,
        last=last,
        created_after=created,
        workflow_id=workflow_id,
        output_mode=mode,
        session=session,
    )


@router.post("/projects/{project_name}/workflows/{workflow_name}/infer")
def infer_workflow(
    project_name: str,
    workflow_name: str,
    query: QueryItem,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    Run application workflow.

    :param project_name:    The name of the project to run the workflow in.
    :param workflow_name:   The name of the workflow to run.
    :param query:           The query to run.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    # Get workflow from the database
    workflow = Workflow.from_dict(
        get_workflow(project_name, workflow_name, session).data
    )
    path = Workflow.get_infer_path(workflow)

    data = {
        "item": query.dict(),
        "workflow": workflow.to_dict(short=True),
    }

    # Sent the event to the application's workflow:
    return _send_to_application(
        path=path,
        method="POST",
        data=json.dumps(data),
        auth=auth,
    )


# @router.post("/pipeline/{name}/run")
# def run_pipeline(
#     request: Request, item: QueryItem, name: str, auth=Depends(get_auth_user)
# ):
#     """This is the query command"""
#
#     return _send_to_application(
#         path=f"pipeline/{name}/run",
#         method="POST",
#         request=request,
#         auth=auth,
#     )


@router.post("/projects/{project_name}/data_sources/{data_source_name}/ingest")
def ingest(
    project_name,
    data_source_name,
    loader: str,
    path: str,
    metadata=None,
    version: str = None,
    from_file: bool = False,
    session=Depends(get_db),
    auth=Depends(get_auth_user),
):
    """
    Ingest document into the vector database.

    :param project_name:        The name of the project to ingest the documents into.
    :param data_source_name:    The name of the data source to ingest the documents into.
    :param loader:              The data loader type to use.
    :param path:                The path to the document to ingest.
    :param metadata:            The metadata to associate with the documents.
    :param version:             The version of the documents.
    :param from_file:           Whether the documents are from a file.
    :param session:             The database session.
    :param auth:                The authentication information.

    :return:    The response from the application.
    """
    data_source = get_data_source(
        project_name=project_name, data_source_name=data_source_name, session=session
    ).data
    data_source = DataSource.from_dict(data_source)

    # Create document from path:
    document = Document(
        name=os.path.basename(path),
        version=version,
        path=path,
        owner_id=data_source.owner_id,
    )

    # Add document to the database:
    document = create_document(
        project_name=project_name,
        document_name=document.name,
        document=document,
        session=session,
        auth=auth,
    ).data

    # Send ingest to application:
    params = {
        "loader": loader,
        "from_file": from_file,
    }

    data = {
        "document": document,
        "database_kwargs": data_source.database_kwargs,
    }
    if metadata is not None:
        params["metadata"] = json.dumps(metadata)

    return _send_to_application(
        path=f"data_sources/{data_source_name}/ingest",
        method="POST",
        data=json.dumps(data),
        params=params,
        auth=auth,
    )


# Include the router in the main app
app.include_router(router)
