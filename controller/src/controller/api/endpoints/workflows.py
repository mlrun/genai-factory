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
from typing import List, Optional, Tuple, Union

from fastapi import APIRouter, Depends

from controller.api.utils import (
    AuthInfo,
    _send_to_application,
    get_auth_user,
    get_db,
    parse_version,
)
from controller.db import client
from genai_factory.schemas import (
    APIResponse,
    ChatSession,
    OutputMode,
    QueryItem,
    Workflow,
    WorkflowType,
)

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/workflows")
def create_workflow(
    project_name: str,
    workflow: Workflow,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new workflow in the database.

    :param project_name: The name of the project to create the workflow in.
    :param workflow:     The workflow to create.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.create_workflow(workflow=workflow, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create workflow {workflow.name} in project {project_name}: {e}",
        )


@router.get("/workflows/{name}")
def get_workflow(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Get a workflow from the database.

    :param project_name: The name of the project to get the workflow from.
    :param name:         The name of the workflow to get.
    :param uid:          The UID of the workflow to get.
    :param version:      The version of the workflow to get.
    :param db_session:   The database session.

    :return: The workflow from the database.
    """
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid, version)
    try:
        data = client.get_workflow(
            name=name,
            project_id=project_id,
            uid=uid,
            version=version,
            db_session=db_session,
        )
        if data is None:
            return APIResponse(
                success=False, error=f"Workflow with name = {name} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get workflow {name} in project {project_name}: {e}",
        )


@router.put("/workflows/{name}")
def update_workflow(
    project_name: str,
    workflow: Workflow,
    name: str,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a workflow in the database.

    :param project_name: The name of the project to update the workflow in.
    :param workflow:     The workflow to update.
    :param name:         The name of the workflow to update.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.update_workflow(
            name=name, workflow=workflow, db_session=db_session
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update workflow {name} in project {project_name}: {e}",
        )


@router.delete("/workflows/{name}")
def delete_workflow(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Delete a workflow from the database.

    :param project_name: The name of the project to delete the workflow from.
    :param name:         The name of the workflow to delete.
    :param uid:          The UID of the workflow to delete.
    :param version:      The version of the workflow to delete.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid=uid, version=version)
    try:
        client.delete_workflow(
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
            error=f"Failed to delete workflow {name} in project {project_name}: {e}",
        )


@router.get("/workflows")
def list_workflows(
    project_name: str,
    name: str = None,
    version: str = None,
    workflow_type: Union[WorkflowType, str] = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    db_session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List workflows in the database.

    :param project_name:  The name of the project to list the workflows from.
    :param name:          The name to filter by.
    :param version:       The version to filter by.
    :param workflow_type: The workflow type to filter by.
    :param labels:        The labels to filter by.
    :param mode:          The output mode.
    :param db_session:    The database session.
    :param auth:          The authentication information.

    :return: The response from the database.
    """
    owner = client.get_user(name=auth.username, db_session=db_session)
    owner_id = getattr(owner, "uid", None)
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    try:
        data = client.list_workflows(
            name=name,
            project_id=project_id,
            owner_id=owner_id,
            version=version,
            workflow_type=workflow_type,
            labels_match=labels,
            output_mode=mode,
            db_session=db_session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to list workflows in project {project_name}: {e}",
        )
