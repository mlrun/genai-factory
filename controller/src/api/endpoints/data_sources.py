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
import os
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
    DataSource,
    DataSourceType,
    Document,
    OutputMode,
)

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/data_sources")
def create_data_source(
    project_name: str,
    data_source: DataSource,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    Create a new data source in the database.

    :param project_name:        The name of the project to create the data source in.
    :param data_source:         The data source to create.
    :param session:             The database session.
    :param auth:                The authentication information.

    :return:    The response from the database.
    """
    # If the owner ID is not provided, get it from the username
    if data_source.owner_id is None:
        data_source.owner_id = client.get_user(
            user_name=auth.username, session=session
        ).data["id"]
    data_source.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    return client.create_data_source(data_source=data_source, session=session)


@router.get("/data_sources/{data_source_name}")
def get_data_source(
    project_name: str, data_source_name: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Get a data source from the database.

    :param project_name:        The name of the project to get the data source from.
    :param data_source_name:    The name of the data source to get.
    :param session:             The database session.

    :return:    The data source from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.get_data_source(
        project_id=project_id, data_source_name=data_source_name, session=session
    )


@router.put("/data_sources/{data_source_name}")
def update_data_source(
    project_name: str,
    data_source: DataSource,
    data_source_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a data source in the database.

    :param project_name:        The name of the project to update the data source in.
    :param data_source:         The data source to update.
    :param data_source_name:    The name of the data source to update.
    :param session:             The database session.

    :return:    The response from the database.
    """
    data_source.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    if data_source_name != data_source.name:
        raise ValueError(
            f"Data source name does not match: {data_source_name} != {data_source.name}"
        )
    return client.update_data_source(data_source=data_source, session=session)


@router.delete("/data_sources/{data_source_id}")
def delete_data_source(
    project_name: str, data_source_id: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Delete a data source from the database.

    :param project_name:        The name of the project to delete the data source from.
    :param data_source_id:      The ID of the data source to delete.
    :param session:             The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.delete_data_source(
        project_id=project_id, data_source_id=data_source_id, session=session
    )


@router.get("/data_sources")
def list_data_sources(
    project_name: str,
    version: str = None,
    data_source_type: Union[DataSourceType, str] = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    List data sources in the database.

    :param project_name:        The name of the project to list the data sources from.
    :param version:             The version to filter by.
    :param data_source_type:    The data source type to filter by.
    :param labels:              The labels to filter by.
    :param mode:                The output mode.
    :param session:             The database session.
    :param auth:                The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(user_name=auth.username, session=session).data["id"]
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.list_data_sources(
        project_id=project_id,
        owner_id=owner_id,
        version=version,
        data_source_type=data_source_type,
        labels_match=labels,
        output_mode=mode,
        session=session,
    )


@router.post("/data_sources/{data_source_name}/ingest")
def ingest(
    project_name,
    data_source_name,
    loader: str,
    path: str,
    metadata=None,
    version: str = None,
    from_file: bool = False,
    session=Depends(get_db),
    auth=Depends(get_auth_user),
):
    """
    Ingest document into the vector database.

    :param project_name:        The name of the project to ingest the documents into.
    :param data_source_name:    The name of the data source to ingest the documents into.
    :param loader:              The data loader type to use.
    :param path:                The path to the document to ingest.
    :param metadata:            The metadata to associate with the documents.
    :param version:             The version of the documents.
    :param from_file:           Whether the documents are from a file.
    :param session:             The database session.
    :param auth:                The authentication information.

    :return:    The response from the application.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    data_source = client.get_data_source(
        project_id=project_id, data_source_name=data_source_name, session=session
    ).data

    data_source = DataSource.from_dict(data_source)

    # Create document from path:
    document = Document(
        name=os.path.basename(path),
        version=version,
        path=path,
        owner_id=data_source.owner_id,
        project_id=project_id,
    )

    # Add document to the database:
    document = client.create_document(document=document, session=session).data

    # Send ingest to application:
    params = {
        "loader": loader,
        "from_file": from_file,
    }

    data = {
        "document": document,
        "database_kwargs": data_source.database_kwargs,
    }
    if metadata is not None:
        params["metadata"] = json.dumps(metadata)

    return _send_to_application(
        path=f"data_sources/{data_source_name}/ingest",
        method="POST",
        data=json.dumps(data),
        params=params,
        auth=auth,
    )
