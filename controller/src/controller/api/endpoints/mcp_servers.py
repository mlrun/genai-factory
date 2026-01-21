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

from typing import List, Optional, Tuple, Union

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
    OutputMode,
    McpServer,
    McpType,
    WorkflowState
)

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/mcp_servers")
def create_mcp_server(
    project_name: str,
    mcp_server: McpServer,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new mcp_server in the database.

    :param project_name: The name of the project to create the mcp_server in.
    :param mcp_server:        The mcp_server to create.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.create_mcp_server(mcp_server=mcp_server, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create mcp_server {mcp_server.name} in project {project_name}: {e}",
        )


@router.get("/mcp_servers/{name}")
def get_mcp_server(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Get a mcp_server from the database.

    :param project_name: The name of the project to get the mcp_server from.
    :param name:         The name of the mcp_server to get.
    :param uid:          The UID of the mcp_server to get.
    :param version:      The version of the mcp_server to get.
    :param db_session:   The database session.

    :return: The mcp_server from the database.
    """
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid, version)
    try:
        data = client.get_mcp_server(
            name=name,
            project_id=project_id,
            uid=uid,
            version=version,
            db_session=db_session,
        )
        if data is None:
            return APIResponse(
                success=False, error=f"Agent with name = {name} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get Agent {name} in project {project_name}: {e}",
        )


@router.put("/mcp_servers/{name}")
def update_mcp_server(
    project_name: str,
    mcp_server: McpServer,
    name: str,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a mcp_server in the database.

    :param project_name: The name of the project to update the mcp_server in.
    :param mcp_server:   The mcp_server to update.
    :param name:         The name of the mcp_server to update.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.update_mcp_server(
            name=name, mcp_server=mcp_server, db_session=db_session
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update mcp_server {name} in project {project_name}: {e}",
        )


@router.delete("/mcp_servers/{name}")
def delete_mcp_server(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Delete a mcp_server from the database.

    :param project_name: The name of the project to delete the mcp_server from.
    :param name:         The name of the mcp_server to delete.
    :param uid:          The UID of the mcp_server to delete.
    :param version:      The version of the mcp_server to delete.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid=uid, version=version)
    try:
        client.delete_mcp_server(
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
            error=f"Failed to delete mcp_server {name} in project {project_name}: {e}",
        )


@router.get("/mcp_servers")
def list_mcp_servers(
    project_name: str,
    name: str = None,
    version: str = None,
    mcp_type: Union[McpType, str] = None,
    state: Union[WorkflowState, str] = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    db_session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List mcp_servers in the database.

    :param project_name:  The name of the project to list the mcp_servers from.
    :param name:          The name to filter by.
    :param version:       The version to filter by.
    :param mcp_type:      The mcp_server type to filter by.
    :param state:         The workflow state to filter by.
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
        data = client.list_mcp_servers(
            name=name,
            project_id=project_id,
            owner_id=owner_id,
            version=version,
            mcp_type=mcp_type,
            state=state,
            labels_match=labels,
            output_mode=mode,
            db_session=db_session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to list mcp_servers in project {project_name}: {e}",
        )

