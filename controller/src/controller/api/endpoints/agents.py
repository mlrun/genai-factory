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
    Agent,
    AgentType,
    WorkflowState
)

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/agents")
def create_agent(
    project_name: str,
    agent: Agent,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new agent in the database.

    :param project_name: The name of the project to create the agent in.
    :param agent:        The agent to create.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.create_agent(agent=agent, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create agent {agent.name} in project {project_name}: {e}",
        )


@router.get("/agents/{name}")
def get_agent(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Get an agent from the database.

    :param project_name: The name of the project to get the agent from.
    :param name:         The name of the agent to get.
    :param uid:          The UID of the agent to get.
    :param version:      The version of the agent to get.
    :param db_session:   The database session.

    :return: The agent from the database.
    """
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid, version)
    try:
        data = client.get_agent(
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


@router.put("/agents/{name}")
def update_agent(
    project_name: str,
    agent: Agent,
    name: str,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update an agent in the database.

    :param project_name: The name of the project to update the agent in.
    :param agent:        The agent to update.
    :param name:         The name of the agent to update.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.update_agent(
            name=name, agent=agent, db_session=db_session
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update agent {name} in project {project_name}: {e}",
        )


@router.delete("/agents/{name}")
def delete_agent(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Delete an agent from the database.

    :param project_name: The name of the project to delete the agent from.
    :param name:         The name of the agent to delete.
    :param uid:          The UID of the agent to delete.
    :param version:      The version of the agent to delete.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid=uid, version=version)
    try:
        client.delete_agent(
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
            error=f"Failed to delete agent {name} in project {project_name}: {e}",
        )


@router.get("/agents")
def list_agents(
    project_name: str,
    name: str = None,
    version: str = None,
    agent_type: Union[AgentType, str] = None,
    state: Union[WorkflowState, str] = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    db_session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List agents in the database.

    :param project_name:  The name of the project to list the agents from.
    :param name:          The name to filter by.
    :param version:       The version to filter by.
    :param agent_type: The agent type to filter by.
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
        data = client.list_agents(
            name=name,
            project_id=project_id,
            owner_id=owner_id,
            version=version,
            agent_type=agent_type,
            state=state,
            labels_match=labels,
            output_mode=mode,
            db_session=db_session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to list agents in project {project_name}: {e}",
        )

