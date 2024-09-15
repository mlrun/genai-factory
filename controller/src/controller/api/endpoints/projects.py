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

from controller.api.utils import get_db, parse_version
from controller.db import client
from genai_factory.schemas import APIResponse, OutputMode, Project

router = APIRouter()


@router.post("/projects")
def create_project(
    project: Project,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new project in the database.

    :param project:    The project to create.
    :param db_session: The database session.

    :return: The response from the database.
    """
    try:
        data = client.create_project(project=project, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False, error=f"Failed to create project {project.name}: {e}"
        )


@router.get("/projects/{name}")
def get_project(
    name: str, uid: str = None, version: str = None, db_session=Depends(get_db)
) -> APIResponse:
    """
    Get a project from the database.

    :param name:       The name of the project to get.
    :param uid:        The UID of the project to get.
    :param version:    The version of the project to get.
    :param db_session: The database session.

    :return: The project from the database.
    """
    uid, version = parse_version(uid=uid, version=version)
    try:
        data = client.get_project(
            name=name, uid=uid, version=version, db_session=db_session
        )
        if data is None:
            return APIResponse(
                success=False, error=f"Project with name {name} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(success=False, error=f"Failed to get project {name}: {e}")


@router.put("/projects/{name}")
def update_project(
    project: Project,
    name: str,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a project in the database.

    :param project:    The project to update.
    :param name:       The name of the project to update.
    :param db_session: The database session.

    :return: The response from the database.
    """
    try:
        data = client.update_project(name=name, project=project, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(success=False, error=f"Failed to update project {name}: {e}")


@router.delete("/projects/{name}")
def delete_project(
    name: str, uid: str = None, version: str = None, db_session=Depends(get_db)
) -> APIResponse:
    """
    Delete a project from the database.

    :param name:       The name of the project to delete.
    :param uid:        The UID of the project to delete.
    :param version:    The version of the project to delete.
    :param db_session: The database session.

    :return: The response from the database.
    """
    uid, version = parse_version(uid=uid, version=version)
    try:
        client.delete_project(
            name=name, uid=uid, version=version, db_session=db_session
        )
        return APIResponse(success=True)
    except Exception as e:
        return APIResponse(success=False, error=f"Failed to delete project {name}: {e}")


@router.get("/projects")
def list_projects(
    name: str = None,
    owner_name: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    List projects in the database.

    :param name:       The name of the project to filter by.
    :param owner_name: The name of the owner to filter by.
    :param labels:     The labels to filter by.
    :param mode:       The output mode.
    :param db_session: The database session.

    :return: The response from the database.
    """
    if owner_name is not None:
        owner_id = client.get_user(user_name=owner_name, db_session=db_session).uid
    else:
        owner_id = None
    try:
        data = client.list_projects(
            owner_id=owner_id,
            labels_match=labels,
            output_mode=mode,
            db_session=db_session,
            name=name,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(success=False, error=f"Failed to list projects: {e}")
