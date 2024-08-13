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

from controller.src.api.utils import (
    AuthInfo,
    _send_to_application,
    get_auth_user,
    get_db,
)
from controller.src.db import client
from controller.src.schemas import (
    ApiResponse,
    OutputMode,
    QueryItem,
    Workflow,
    WorkflowType,
)

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/workflows/{workflow_name}")
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


@router.get("/workflows/{workflow_name}")
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


@router.put("/workflows/{workflow_name}")
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


@router.delete("/workflows/{workflow_id}")
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


@router.get("/workflows")
def list_workflows(
    project_name: str,
    version: str = None,
    workflow_type: Union[WorkflowType, str] = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    List workflows in the database.

    :param project_name:    The name of the project to list the workflows from.
    :param version:         The version to filter by.
    :param workflow_type:   The workflow type to filter by.
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


@router.post("/workflows/{workflow_name}/infer")
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
