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

from controller.api.utils import AuthInfo, get_auth_user, get_db, parse_version
from controller.db import client
from genai_factory.schemas import APIResponse, Model, OutputMode

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/models")
def create_model(
    project_name: str,
    model: Model,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new model in the database.

    :param project_name: The name of the project to create the model in.
    :param model:        The model to create.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.create_model(model=model, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create model {model.name} in project {project_name}: {e}",
        )


@router.get("/models/{name}")
def get_model(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Get a model from the database.

    :param project_name: The name of the project to get the model from.
    :param name:         The name of the model to get.
    :param uid:          The UID of the model to get.
    :param version:      The version of the model to get.
    :param db_session:   The database session.

    :return: The model from the database.
    """
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid, version)
    try:
        data = client.get_model(
            project_id=project_id,
            name=name,
            uid=uid,
            version=version,
            db_session=db_session,
        )
        if data is None:
            return APIResponse(
                success=False, error=f"Model with name = {name} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get model {name} in project {project_name}: {e}",
        )


@router.put("/models/{name}")
def update_model(
    project_name: str,
    model: Model,
    name: str,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a model in the database.

    :param project_name: The name of the project to update the model in.
    :param model:        The model to update.
    :param name:         The name of the model to update.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.update_model(name=name, model=model, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update model {name} in project {project_name}: {e}",
        )


@router.delete("/models/{name}")
def delete_model(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Delete a model from the database.

    :param project_name: The name of the project to delete the model from.
    :param name:         The name of the model to delete.
    :param uid:          The ID of the model to delete.
    :param version:      The version of the model to delete.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid, version)
    try:
        client.delete_model(
            project_id=project_id,
            name=name,
            uid=uid,
            version=version,
            db_session=db_session,
        )
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
    db_session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List models in the database.

    :param project_name: The name of the project to list the models from.
    :param name:         The name to filter by.
    :param version:      The version to filter by.
    :param model_type:   The model type to filter by.
    :param labels:       The labels to filter by.
    :param mode:         The output mode.
    :param db_session:   The database session.
    :param auth:         The authentication information.

    :return: The response from the database.
    """
    owner = client.get_user(name=auth.username, db_session=db_session)
    owner_id = getattr(owner, "uid", None)
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    try:
        data = client.list_models(
            project_id=project_id,
            name=name,
            owner_id=owner_id,
            version=version,
            model_type=model_type,
            labels_match=labels,
            output_mode=mode,
            db_session=db_session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False, error=f"Failed to list models in project {project_name}: {e}"
        )
