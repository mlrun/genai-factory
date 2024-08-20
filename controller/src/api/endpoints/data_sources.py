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
    APIResponse,
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
) -> APIResponse:
    """
    Create a new data source in the database.

    :param project_name:        The name of the project to create the data source in.
    :param data_source:         The data source to create.
    :param session:             The database session.

    :return:    The response from the database.
    """
    try:
        data = client.create_data_source(data_source=data_source, session=session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create data source {data_source.name} in project {project_name}: {e}",
        )


@router.get("/data_sources/{uid}")
def get_data_source(
    project_name: str, uid: str, session=Depends(get_db)
) -> APIResponse:
    """
    Get a data source from the database.

    :param project_name:    The name of the project to get the data source from.
    :param uid:             The uid of the data source to get.
    :param session:         The database session.

    :return:    The data source from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        data = client.get_data_source(project_id=project_id, uid=uid, session=session)
        if data is None:
            return APIResponse(
                success=False, error=f"Data source with uid = {uid} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get data source {uid} in project {project_name}: {e}",
        )


@router.put("/data_sources/{data_source_name}")
def update_data_source(
    project_name: str,
    data_source: DataSource,
    data_source_name: str,
    session=Depends(get_db),
) -> APIResponse:
    """
    Update a data source in the database.

    :param project_name:        The name of the project to update the data source in.
    :param data_source:         The data source to update.
    :param data_source_name:    The name of the data source to update.
    :param session:             The database session.

    :return:    The response from the database.
    """
    try:
        data = client.update_data_source(data_source=data_source, session=session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update data source {data_source_name} in project {project_name}: {e}",
        )


@router.delete("/data_sources/{uid}")
def delete_data_source(
    project_name: str, uid: str, session=Depends(get_db)
) -> APIResponse:
    """
    Delete a data source from the database.

    :param project_name:    The name of the project to delete the data source from.
    :param uid:             The ID of the data source to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        client.delete_data_source(project_id=project_id, uid=uid, session=session)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to delete data source {uid} in project {project_name}: {e}",
        )
    return APIResponse(success=True)


@router.get("/data_sources")
def list_data_sources(
    project_name: str,
    name: str = None,
    version: str = None,
    data_source_type: Union[DataSourceType, str] = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List data sources in the database.

    :param project_name:        The name of the project to list the data sources from.
    :param name:                The name to filter by.
    :param version:             The version to filter by.
    :param data_source_type:    The data source type to filter by.
    :param labels:              The labels to filter by.
    :param mode:                The output mode.
    :param session:             The database session.
    :param auth:                The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(user_name=auth.username, session=session).uid
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        data = client.list_data_sources(
            project_id=project_id,
            name=name,
            owner_id=owner_id,
            version=version,
            data_source_type=data_source_type,
            labels_match=labels,
            output_mode=mode,
            session=session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to list data sources in project {project_name}: {e}",
        )


@router.post("/data_sources/{uid}/ingest")
def ingest(
    project_name,
    uid,
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
    :param uid:                 The UID of the data source to ingest the documents into.
    :param loader:              The data loader type to use.
    :param path:                The path to the document to ingest.
    :param metadata:            The metadata to associate with the documents.
    :param version:             The version of the documents.
    :param from_file:           Whether the documents are from a file.
    :param session:             The database session.
    :param auth:                The authentication information.

    :return:    The response from the application.
    """
    project_id = client.get_project(project_name=project_name, session=session).uid
    data_source = client.get_data_source(
        project_id=project_id, uid=uid, session=session
    )

    # Create document from path:
    document = Document(
        name=os.path.basename(path),
        version=version,
        path=path,
        owner_id=data_source.owner_id,
        project_id=project_id,
    )

    # Add document to the database:
    document = client.create_document(document=document, session=session)

    # Send ingest to application:
    params = {
        "loader": loader,
        "from_file": from_file,
    }

    data = {
        "document": document.to_dict(),
        "database_kwargs": data_source.database_kwargs,
    }
    if metadata is not None:
        params["metadata"] = json.dumps(metadata)

    try:
        data = _send_to_application(
            path=f"data_sources/{data_source.name}/ingest",
            method="POST",
            data=json.dumps(data),
            params=params,
            auth=auth,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to ingest document into data source {data_source.name}: {e}",
        )
