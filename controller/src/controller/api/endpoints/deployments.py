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

from controller.api.utils import (
    AuthInfo,
    get_auth_user,
    get_db,
    parse_version,
)
from controller.db import client
from genai_factory.schemas import (
    APIResponse,
    Deployment,
    DeploymentType,
    OutputMode,
)

router = APIRouter(prefix="/projects/{project_name}")

router.post("/deployments")


def create_deployment(
    project_name: str,
    deployment: Deployment,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new workflow in the database.

    :param project_name: The name of the project to create the workflow in.
    :param deployment:   The deployment to create.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.create_deployment(deployment=deployment, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            message=f"Failed to create deployment {deployment.name} in project {project_name}: {e}",
        )


@router.get("/deployments/{name}")
def get_deployment(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Get a deployment from the database.

    :param project_name: The name of the project to get the deployment from.
    :param name:         The name of the deployment to get.
    :param uid:          The unique identifier of the deployment.
    :param version:      The version of the deployment.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    project_id = client.get_project_id(name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid, version)
    try:
        data = client.get_deployment(
            name=name,
            project_id=project_id,
            uid=uid,
            version=version,
            db_session=db_session,
        )
        if data is None:
            return APIResponse(
                success=False,
                message=f"Deployment with name = {name} not found",
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            message=f"Failed to get deployment {name} in project {project_name}: {e}",
        )


@router.put("/deployments/{name}")
def update_deployment(
    project_name: str,
    name: str,
    deployment: Deployment,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a deployment in the database.

    :param project_name: The name of the project to update the deployment in.
    :param name:         The name of the deployment to update.
    :param deployment:   The deployment to update.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.update_deployment(
            name=name, deployment=deployment, db_session=db_session
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            message=f"Failed to update deployment {name} in project {project_name}: {e}",
        )


@router.delete("/deployments/{name}")
def delete_deployment(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Delete a deployment from the database.

    :param project_name: The name of the project to delete the deployment from.
    :param name:         The name of the deployment to delete.
    :param uid:          The unique identifier of the deployment.
    :param version:      The version of the deployment.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid=uid, version=version)
    try:
        client.delete_deployment(
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
            message=f"Failed to delete deployment {name} in project {project_name}: {e}",
        )


@router.get("/deployments")
def list_deployments(
    project_name: str,
    name: str = None,
    version: str = None,
    deployment_type: DeploymentType = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    db_session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List deployments in the database.

    :param project_name:    The name of the project to list the deployments from.
    :param name:            The name of the deployment to list.
    :param version:         The version of the deployment to list.
    :param deployment_type: The type of the deployment to list.
    :param labels:          The labels of the deployment to list.
    :param mode:            The mode of the output.
    :param db_session:      The database session.
    :param auth:            The authentication information.

    :return: The response from the database.
    """
    owner = client.get_user(name=auth.username, db_session=db_session)
    owner_id = getattr(owner, "uid", None)
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    try:
        data = client.list_deployments(
            project_id=project_id,
            name=name,
            owner_id=owner_id,
            version=version,
            deployment_type=deployment_type,
            labels=labels,
            mode=mode,
            db_session=db_session,
            auth=auth,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            message=f"Failed to list deployments in project {project_name}: {e}",
        )
