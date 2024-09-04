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
    parse_version,
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
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new data source in the database.

    :param project_name:        The name of the project to create the data source in.
    :param data_source:         The data source to create.
    :param db_session:          The database session.

    :return:    The response from the database.
    """
    try:
        data = client.create_data_source(data_source=data_source, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create data source {data_source.name} in project {project_name}: {e}",
        )


@router.get("/data_sources/{name}")
def get_data_source(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Get a data source from the database.

    :param project_name:    The name of the project to get the data source from.
    :param name:            The name of the data source to get.
    :param uid:             The uid of the data source to get.
    :param version:         The version of the data source to get.
    :param db_session:      The database session.

    :return:    The data source from the database.
    """
    project_id = client.get_project(
        project_name=project_name, db_session=db_session
    ).uid
    try:
        # Parse the version if provided:
        uid, version = parse_version(uid, version)
        data = client.get_data_source(
            project_id=project_id,
            name=name,
            uid=uid,
            version=version,
            db_session=db_session,
        )
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


@router.put("/data_sources/{name}")
def update_data_source(
    project_name: str,
    data_source: DataSource,
    name: str,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a data source in the database.

    :param project_name:    The name of the project to update the data source in.
    :param data_source:     The data source to update.
    :param name:            The name of the data source to update.
    :param db_session:      The database session.

    :return:    The response from the database.
    """
    try:
        data = client.update_data_source(
            name=name, data_source=data_source, db_session=db_session
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update data source {name} in project {project_name}: {e}",
        )


@router.delete("/data_sources/{name}")
def delete_data_source(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Delete a data source from the database.

    :param project_name:    The name of the project to delete the data source from.
    :param name:            The name of the data source to delete.
    :param uid:             The ID of the data source to delete.
    :param version:         The version of the data source to delete.
    :param db_session:      The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(
        project_name=project_name, db_session=db_session
    ).uid
    uid, version = parse_version(uid, version)
    try:
        client.delete_data_source(
            name=name,
            project_id=project_id,
            uid=uid,
            version=version,
            db_session=db_session,
        )
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
    db_session=Depends(get_db),
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
    :param db_session:          The database session.
    :param auth:                The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(user_name=auth.username, db_session=db_session).uid
    project_id = client.get_project(
        project_name=project_name, db_session=db_session
    ).uid
    try:
        data = client.list_data_sources(
            project_id=project_id,
            name=name,
            owner_id=owner_id,
            version=version,
            data_source_type=data_source_type,
            labels_match=labels,
            output_mode=mode,
            db_session=db_session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to list data sources in project {project_name}: {e}",
        )


@router.post("/data_sources/{name}/ingest")
def ingest(
    project_name: str,
    name: str,
    loader: str,
    path: str,
    uid: str = None,
    metadata=None,
    version: str = None,
    from_file: bool = False,
    db_session=Depends(get_db),
    auth=Depends(get_auth_user),
):
    """
    Ingest document into the vector database.

    :param project_name:        The name of the project to ingest the documents into.
    :param name:                The name of the data source to ingest the documents into.
    :param loader:              The data loader type to use.
    :param path:                The path to the document to ingest.
    :param uid:                 The UID of the data source to ingest the documents into.
    :param metadata:            The metadata to associate with the documents.
    :param version:             The version of the documents.
    :param from_file:           Whether the documents are from a file.
    :param db_session:          The database session.
    :param auth:                The authentication information.

    :return:    The response from the application.
    """
    project_id = client.get_project(
        project_name=project_name, db_session=db_session
    ).uid
    uid, ds_version = parse_version(uid, version)
    data_source = client.get_data_source(
        name=name,
        project_id=project_id,
        uid=uid,
        version=ds_version,
        db_session=db_session,
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
    document = client.create_document(document=document, db_session=db_session)

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
