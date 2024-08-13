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

from controller.src.api.utils import get_db
from controller.src.db import client
from controller.src.schemas import ApiResponse, OutputMode, Project

router = APIRouter()


@router.post("/projects")
def create_project(
    project: Project,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Create a new project in the database.

    :param project: The project to create.
    :param session: The database session.

    :return:    The response from the database.
    """
    return client.create_project(project=project, session=session)


@router.get("/projects/{project_name}")
def get_project(project_name: str, session=Depends(get_db)) -> ApiResponse:
    """
    Get a project from the database.

    :param project_name: The name of the project to get.
    :param session:    The database session.

    :return:    The project from the database.
    """
    return client.get_project(project_name=project_name, session=session)


@router.put("/projects/{project_name}")
def update_project(
    project: Project,
    project_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a project in the database.

    :param project:         The project to update.
    :param project_name:    The name of the project to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    if project_name != project.name:
        raise ValueError(
            f"Project name does not match: {project_name} != {project.name}"
        )
    return client.update_project(project=project, session=session)


@router.delete("/projects/{project_name}")
def delete_project(project_name: str, session=Depends(get_db)) -> ApiResponse:
    """
    Delete a project from the database.

    :param project_name:    The name of the project to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    return client.delete_project(project_name=project_name, session=session)


@router.get("/projects")
def list_projects(
    owner_name: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
) -> ApiResponse:
    """
    List projects in the database.

    :param owner_name:  The name of the owner to filter by.
    :param labels:      The labels to filter by.
    :param mode:        The output mode.
    :param session:     The database session.

    :return:    The response from the database.
    """
    if owner_name is not None:
        owner_id = client.get_user(user_name=owner_name, session=session).data["id"]
    else:
        owner_id = None
    return client.list_projects(
        owner_id=owner_id, labels_match=labels, output_mode=mode, session=session
    )
