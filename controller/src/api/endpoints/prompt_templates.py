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

from controller.src.api.utils import AuthInfo, get_auth_user, get_db, parse_version
from controller.src.db import client
from controller.src.schemas import APIResponse, OutputMode, PromptTemplate

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/prompt_templates")
def create_prompt(
    project_name: str,
    prompt: PromptTemplate,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new prompt in the database.

    :param project_name:    The name of the project to create the prompt in.
    :param prompt:          The prompt to create.
    :param db_session:         The database session.

    :return:    The response from the database.
    """
    try:
        data = client.create_prompt_template(prompt=prompt, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create prompt {prompt.name} in project {project_name}: {e}",
        )


@router.get("/prompt_templates/{name}")
def get_prompt(project_name: str, name: str, uid: str = None, version: str = None, db_session=Depends(get_db)) -> APIResponse:
    """
    Get a prompt from the database.

    :param project_name:    The name of the project to get the prompt from.
    :param name:            The name of the prompt to get.
    :param uid:             The UID of the prompt to get.
    :param version:         The version of the prompt to get.
    :param db_session:      The database session.

    :return:    The prompt from the database.
    """
    project_id = client.get_project(project_name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid, version)
    try:
        data = client.get_prompt_template(project_id=project_id, name=name, uid=uid, version=version, db_session=db_session)
        if data is None:
            return APIResponse(
                success=False, error=f"Prompt with name = {name} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get prompt {name} in project {project_name}: {e}",
        )


@router.put("/prompt_templates/{name}")
def update_prompt(
    project_name: str,
    prompt: PromptTemplate,
    name: str,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a prompt in the database.

    :param project_name:    The name of the project to update the prompt in.
    :param prompt:          The prompt to update.
    :param name:            The name of the prompt to update.
    :param db_session:      The database session.

    :return:    The response from the database.
    """
    try:
        data = client.update_prompt_template(prompt=prompt, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update prompt {name} in project {project_name}: {e}",
        )


@router.delete("/prompt_templates/{name}")
def delete_prompt(project_name: str, name: str, uid: str = None, version: str = None, db_session=Depends(get_db)) -> APIResponse:
    """
    Delete a prompt from the database.

    :param project_name:    The name of the project to delete the prompt from.
    :param name:            The name of the prompt to delete.
    :param uid:             The UID of the prompt to delete.
    :param version:         The version of the prompt to delete.
    :param db_session:      The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid, version)
    try:
        client.delete_prompt_template(project_id=project_id, name=name, uid=uid, version=version, db_session=db_session)
        return APIResponse(success=True)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to delete prompt {name} in project {project_name}: {e}",
        )


@router.get("/prompt_templates")
def list_prompts(
    project_name: str,
    name: str = None,
    version: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    db_session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List prompts in the database.

    :param project_name:    The name of the project to list the prompts from.
    :param name:            The name to filter by.
    :param version:         The version to filter by.
    :param labels:          The labels to filter by.
    :param mode:            The output mode.
    :param db_session:      The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(user_name=auth.username, db_session=db_session).uid
    project_id = client.get_project(project_name=project_name, db_session=db_session).uid
    try:
        data = client.list_prompt_templates(
            project_id=project_id,
            name=name,
            owner_id=owner_id,
            version=version,
            labels_match=labels,
            output_mode=mode,
            db_session=db_session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to list prompts in project {project_name}: {e}",
        )
