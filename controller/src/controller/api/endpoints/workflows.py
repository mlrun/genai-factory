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
    session=Depends(get_db),
) -> APIResponse:
    """
    Create a new workflow in the database.

    :param project_name:    The name of the project to create the workflow in.
    :param workflow:        The workflow to create.
    :param session:         The database session.

    :return:    The response from the database.
    """
    try:
        data = client.create_workflow(workflow=workflow, session=session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create workflow {workflow.name} in project {project_name}: {e}",
        )


@router.get("/workflows/{uid}")
def get_workflow(project_name: str, uid: str, session=Depends(get_db)) -> APIResponse:
    """
    Get a workflow from the database.

    :param project_name:    The name of the project to get the workflow from.
    :param uid:             The UID of the workflow to get.
    :param session:         The database session.

    :return:    The workflow from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        data = client.get_workflow(project_id=project_id, uid=uid, session=session)
        if data is None:
            return APIResponse(
                success=False, error=f"Workflow with uid = {uid} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get workflow {uid} in project {project_name}: {e}",
        )


@router.put("/workflows/{workflow_name}")
def update_workflow(
    project_name: str,
    workflow: Workflow,
    workflow_name: str,
    session=Depends(get_db),
) -> APIResponse:
    """
    Update a workflow in the database.

    :param project_name:    The name of the project to update the workflow in.
    :param workflow:        The workflow to update.
    :param workflow_name:   The name of the workflow to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    try:
        data = client.update_workflow(workflow=workflow, session=session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update workflow {workflow_name} in project {project_name}: {e}",
        )


@router.delete("/workflows/{uid}")
def delete_workflow(
    project_name: str, uid: str, session=Depends(get_db)
) -> APIResponse:
    """
    Delete a workflow from the database.

    :param project_name:    The name of the project to delete the workflow from.
    :param uid:             The UID of the workflow to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    try:
        client.delete_workflow(uid=uid, session=session)
        return APIResponse(success=True)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to delete workflow {uid} in project {project_name}: {e}",
        )


@router.get("/workflows")
def list_workflows(
    project_name: str,
    name: str = None,
    version: str = None,
    workflow_type: Union[WorkflowType, str] = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List workflows in the database.

    :param project_name:    The name of the project to list the workflows from.
    :param name:            The name to filter by.
    :param version:         The version to filter by.
    :param workflow_type:   The workflow type to filter by.
    :param labels:          The labels to filter by.
    :param mode:            The output mode.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(
        user_name=auth.username, email=auth.username, session=session
    ).uid
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        data = client.list_workflows(
            name=name,
            project_id=project_id,
            owner_id=owner_id,
            version=version,
            workflow_type=workflow_type,
            labels_match=labels,
            output_mode=mode,
            session=session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to list workflows in project {project_name}: {e}",
        )


@router.post("/workflows/{uid}/infer")
def infer_workflow(
    project_name: str,
    uid: str,
    query: QueryItem,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    Run application workflow.

    :param project_name:    The name of the project to run the workflow in.
    :param uid:             The UID of the workflow to run.
    :param query:           The query to run.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    # Get workflow from the database
    project_id = client.get_project(project_name=project_name, session=session).uid
    workflow = client.get_workflow(project_id=project_id, uid=uid, session=session)
    path = workflow.get_infer_path()

    if query.session_id:
        # Get session by id:
        chat_session = client.get_chat_session(uid=query.session_id, session=session)
        if chat_session is None:
            # If not id found, get session by name:
            session_name = query.session_id
            chat_session = client.list_chat_sessions(name=session_name, session=session)
            # If not name found, create a new session:
            if chat_session:
                chat_session = chat_session[0]
            else:
                chat_session = client.create_chat_session(
                    chat_session=ChatSession(
                        name=session_name,
                        workflow_id=uid,
                        owner_id=client.get_user(
                            user_name=auth.username, session=session
                        ).uid,
                    ),
                )
        query.session_id = chat_session.uid
    # Prepare the data to send to the application's workflow
    data = {
        "item": query.dict(),
        "workflow": workflow.to_dict(short=True),
    }

    # Sent the event to the application's workflow:
    try:
        data = _send_to_application(
            path=path,
            method="POST",
            data=json.dumps(data),
            auth=auth,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to infer workflow {uid} in project {project_name}: {e}",
        )
