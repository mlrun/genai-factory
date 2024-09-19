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

from controller.api.utils import AuthInfo, get_auth_user, get_db, parse_version
from controller.db import client
from genai_factory.schemas import APIResponse, Dataset, OutputMode

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/datasets")
def create_dataset(
    project_name: str,
    dataset: Dataset,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new dataset in the database.

    :param project_name: The name of the project to create the dataset in.
    :param dataset:      The dataset to create.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.create_dataset(dataset=dataset, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create dataset {dataset.name} in project {project_name}: {e}",
        )


@router.get("/datasets/{name}")
def get_dataset(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Get a dataset from the database.

    :param project_name: The name of the project to get the dataset from.
    :param name:         The name of the dataset to get.
    :param uid:          The name of the dataset to get.
    :param version:      The version of the dataset to get.
    :param db_session:   The database session.

    :return: The dataset from the database.
    """
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    try:
        uid, version = parse_version(uid, version)
        data = client.get_dataset(
            name=name,
            project_id=project_id,
            uid=uid,
            version=version,
            db_session=db_session,
        )
        if data is None:
            return APIResponse(
                success=False, error=f"Dataset with uid = {uid} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get dataset {uid} in project {project_name}: {e}",
        )


@router.put("/datasets/{name}")
def update_dataset(
    project_name: str,
    dataset: Dataset,
    name: str,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a dataset in the database.

    :param project_name: The name of the project to update the dataset in.
    :param dataset:      The dataset to update.
    :param name:         The name of the dataset to update.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.update_dataset(name=name, dataset=dataset, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update dataset {name} in project {project_name}: {e}",
        )


@router.delete("/datasets/{name}")
def delete_dataset(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Delete a dataset from the database.

    :param project_name: The name of the project to delete the dataset from.
    :param name:         The name of the dataset to delete.
    :param uid:          The UID of the dataset to delete.
    :param version:      The version of the dataset to delete.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid, version)
    try:
        client.delete_dataset(
            name=name,
            project_id=project_id,
            uid=uid,
            version=version,
            db_session=db_session,
        )
        return APIResponse(success=True)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to delete dataset {name} in project {project_name}: {e}",
        )


@router.get("/datasets")
def list_datasets(
    project_name: str,
    name: str = None,
    version: str = None,
    task: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    db_session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List datasets in the database.

    :param project_name: The name of the project to list the datasets from.
    :param name:         The name to filter by.
    :param version:      The version to filter by.
    :param task:         The task to filter by.
    :param labels:       The labels to filter by.
    :param mode:         The output mode.
    :param db_session:   The database session.
    :param auth:         The authentication information.

    :return: The response from the database.
    """
    owner = client.get_user(name=auth.username, db_session=db_session)
    owner_id = getattr(owner, "uid", None)
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    try:
        data = client.list_datasets(
            project_id=project_id,
            name=name,
            owner_id=owner_id,
            version=version,
            task=task,
            labels_match=labels,
            output_mode=mode,
            db_session=db_session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to list datasets in project {project_name}: {e}",
        )
