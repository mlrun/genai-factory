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

from controller.api.utils import AuthInfo, get_auth_user, get_db
from controller.db import client
from genai_factory.schemas import APIResponse, Dataset, OutputMode

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/datasets")
def create_dataset(
    project_name: str,
    dataset: Dataset,
    session=Depends(get_db),
) -> APIResponse:
    """
    Create a new dataset in the database.

    :param project_name:    The name of the project to create the dataset in.
    :param dataset:         The dataset to create.
    :param session:         The database session.

    :return:    The response from the database.
    """
    try:
        data = client.create_dataset(dataset=dataset, session=session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create dataset {dataset.name} in project {project_name}: {e}",
        )


@router.get("/datasets/{uid}")
def get_dataset(project_name: str, uid: str, session=Depends(get_db)) -> APIResponse:
    """
    Get a dataset from the database.

    :param project_name:    The name of the project to get the dataset from.
    :param uid:             The name of the dataset to get.
    :param session:         The database session.

    :return:    The dataset from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        data = client.get_dataset(project_id=project_id, uid=uid, session=session)
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


@router.put("/datasets/{dataset_name}")
def update_dataset(
    project_name: str,
    dataset: Dataset,
    dataset_name: str,
    session=Depends(get_db),
) -> APIResponse:
    """
    Update a dataset in the database.

    :param project_name:    The name of the project to update the dataset in.
    :param dataset:         The dataset to update.
    :param dataset_name:    The name of the dataset to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    try:
        data = client.update_dataset(dataset=dataset, session=session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update dataset {dataset_name} in project {project_name}: {e}",
        )


@router.delete("/datasets/{uid}")
def delete_dataset(project_name: str, uid: str, session=Depends(get_db)) -> APIResponse:
    """
    Delete a dataset from the database.

    :param project_name:    The name of the project to delete the dataset from.
    :param uid:             The UID of the dataset to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        client.delete_dataset(project_id=project_id, uid=uid, session=session)
        return APIResponse(success=True)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to delete dataset {uid} in project {project_name}: {e}",
        )


@router.get("/datasets")
def list_datasets(
    project_name: str,
    name: str = None,
    version: str = None,
    task: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List datasets in the database.

    :param project_name:    The name of the project to list the datasets from.
    :param name:            The name to filter by.
    :param version:         The version to filter by.
    :param task:            The task to filter by.
    :param labels:          The labels to filter by.
    :param mode:            The output mode.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(user_name=auth.username, session=session).uid
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        data = client.list_datasets(
            project_id=project_id,
            name=name,
            owner_id=owner_id,
            version=version,
            task=task,
            labels_match=labels,
            output_mode=mode,
            session=session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to list datasets in project {project_name}: {e}",
        )
