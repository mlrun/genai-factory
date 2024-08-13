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

from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends

from controller.src.api.utils import AuthInfo, get_auth_user, get_db
from controller.src.db import client
from controller.src.schemas import ApiResponse, Model, OutputMode

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/models/{model_name}")
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


@router.get("/models/{model_name}")
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


@router.put("/models/{model_name}")
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


@router.delete("/models/{model_id}")
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


@router.get("/models")
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
