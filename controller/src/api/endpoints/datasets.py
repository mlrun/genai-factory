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
from controller.src.schemas import ApiResponse, Dataset, OutputMode

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/datasets/{dataset_name}")
def create_dataset(
    project_name: str,
    dataset_name: str,
    dataset: Dataset,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    Create a new dataset in the database.

    :param project_name:    The name of the project to create the dataset in.
    :param dataset_name:    The name of the dataset to create.
    :param dataset:         The dataset to create.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    # If the owner ID is not provided, get it from the username
    if dataset.owner_id is None:
        dataset.owner_id = client.get_user(
            user_name=auth.username, session=session
        ).data["id"]
    dataset.name = dataset_name
    dataset.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    return client.create_dataset(dataset=dataset, session=session)


@router.get("/datasets/{dataset_name}")
def get_dataset(
    project_name: str, dataset_name: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Get a dataset from the database.

    :param project_name:    The name of the project to get the dataset from.
    :param dataset_name:    The name of the dataset to get.
    :param session:         The database session.

    :return:    The dataset from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.get_dataset(
        project_id=project_id, dataset_name=dataset_name, session=session
    )


@router.put("/datasets/{dataset_name}")
def update_dataset(
    project_name: str,
    dataset: Dataset,
    dataset_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a dataset in the database.

    :param project_name:    The name of the project to update the dataset in.
    :param dataset:         The dataset to update.
    :param dataset_name:    The name of the dataset to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    dataset.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    if dataset_name != dataset.name:
        raise ValueError(
            f"Dataset name does not match: {dataset_name} != {dataset.name}"
        )
    return client.update_dataset(dataset=dataset, session=session)


@router.delete("/datasets/{dataset_id}")
def delete_dataset(
    project_name: str, dataset_id: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Delete a dataset from the database.

    :param project_name:    The name of the project to delete the dataset from.
    :param dataset_id:      The ID of the dataset to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.delete_dataset(
        project_id=project_id, dataset_id=dataset_id, session=session
    )


@router.get("/datasets")
def list_datasets(
    project_name: str,
    version: str = None,
    task: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    List datasets in the database.

    :param project_name:    The name of the project to list the datasets from.
    :param version:         The version to filter by.
    :param task:            The task to filter by.
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
    return client.list_datasets(
        project_id=project_id,
        owner_id=owner_id,
        version=version,
        task=task,
        labels_match=labels,
        output_mode=mode,
        session=session,
    )
