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

from _common.schemas import APIResponse, Model, OutputMode
from controller.src.api.utils import AuthInfo, get_auth_user, get_db
from controller.src.db import client

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/models")
def create_model(
    project_name: str,
    model: Model,
    session=Depends(get_db),
) -> APIResponse:
    """
    Create a new model in the database.

    :param project_name:    The name of the project to create the model in.
    :param model:           The model to create.
    :param session:         The database session.

    :return:    The response from the database.
    """
    try:
        data = client.create_model(model=model, session=session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create model {model.name} in project {project_name}: {e}",
        )


@router.get("/models/{uid}")
def get_model(project_name: str, uid: str, session=Depends(get_db)) -> APIResponse:
    """
    Get a model from the database.

    :param project_name:    The name of the project to get the model from.
    :param uid:             The UID of the model to get.
    :param session:         The database session.

    :return:    The model from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        data = client.get_model(project_id=project_id, uid=uid, session=session)
        if data is None:
            return APIResponse(success=False, error=f"Model with uid = {uid} not found")
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get model {uid} in project {project_name}: {e}",
        )


@router.put("/models/{model_name}")
def update_model(
    project_name: str,
    model: Model,
    model_name: str,
    session=Depends(get_db),
) -> APIResponse:
    """
    Update a model in the database.

    :param project_name:    The name of the project to update the model in.
    :param model:           The model to update.
    :param model_name:      The name of the model to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    try:
        data = client.update_model(model=model, session=session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update model {model.name} in project {project_name}: {e}",
        )


@router.delete("/models/{uid}")
def delete_model(project_name: str, uid: str, session=Depends(get_db)) -> APIResponse:
    """
    Delete a model from the database.

    :param project_name:    The name of the project to delete the model from.
    :param uid:             The ID of the model to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        client.delete_model(project_id=project_id, uid=uid, session=session)
        return APIResponse(success=True)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to delete model {uid} in project {project_name}: {e}",
        )


@router.get("/models")
def list_models(
    project_name: str,
    name: str = None,
    version: str = None,
    model_type: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List models in the database.

    :param project_name:    The name of the project to list the models from.
    :param name:            The name to filter by.
    :param version:         The version to filter by.
    :param model_type:      The model type to filter by.
    :param labels:          The labels to filter by.
    :param mode:            The output mode.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(user_name=auth.username, session=session).uid
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        data = client.list_models(
            project_id=project_id,
            name=name,
            owner_id=owner_id,
            version=version,
            model_type=model_type,
            labels_match=labels,
            output_mode=mode,
            session=session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False, error=f"Failed to list models in project {project_name}: {e}"
        )
