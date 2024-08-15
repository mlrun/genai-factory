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
from controller.src.schemas import ApiResponse, OutputMode, PromptTemplate

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/prompt_templates")
def create_prompt(
    project_name: str,
    prompt: PromptTemplate,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    Create a new prompt in the database.

    :param project_name:    The name of the project to create the prompt in.
    :param prompt:          The prompt to create.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    # If the owner ID is not provided, get it from the username
    if prompt.owner_id is None:
        prompt.owner_id = client.get_user(
            user_name=auth.username, session=session
        ).data["id"]
    prompt.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    return client.create_prompt_template(prompt=prompt, session=session)


@router.get("/prompt_templates/{prompt_name}")
def get_prompt(
    project_name: str, prompt_name: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Get a prompt from the database.

    :param project_name:    The name of the project to get the prompt from.
    :param prompt_name:     The name of the prompt to get.
    :param session:         The database session.

    :return:    The prompt from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.get_prompt(
        project_id=project_id, prompt_name=prompt_name, session=session
    )


@router.put("/prompt_templates/{prompt_name}")
def update_prompt(
    project_name: str,
    prompt: PromptTemplate,
    prompt_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a prompt in the database.

    :param project_name:    The name of the project to update the prompt in.
    :param prompt:          The prompt to update.
    :param prompt_name:     The name of the prompt to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    prompt.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    if prompt_name != prompt.name:
        raise ValueError(f"Prompt name does not match: {prompt_name} != {prompt.name}")
    return client.update_prompt_template(prompt=prompt, session=session)


@router.delete("/prompt_templates/{prompt_template_id}")
def delete_prompt(
    project_name: str, prompt_template_id: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Delete a prompt from the database.

    :param project_name:        The name of the project to delete the prompt from.
    :param prompt_template_id:  The ID of the prompt to delete.
    :param session:             The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.delete_prompt_template(
        project_id=project_id, prompt_template_id=prompt_template_id, session=session
    )


@router.get("/prompt_templates")
def list_prompts(
    project_name: str,
    version: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    List prompts in the database.

    :param project_name:    The name of the project to list the prompts from.
    :param version:         The version to filter by.
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
    return client.list_prompt_templates(
        project_id=project_id,
        owner_id=owner_id,
        version=version,
        labels_match=labels,
        output_mode=mode,
        session=session,
    )
