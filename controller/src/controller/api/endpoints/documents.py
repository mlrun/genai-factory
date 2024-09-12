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
from genai_factory.schemas import APIResponse, Document, OutputMode

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/documents")
def create_document(
    project_name: str,
    document: Document,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new document in the database.

    :param project_name: The name of the project to create the document in.
    :param document:     The document to create.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.create_document(document=document, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create document {document.name} in project {project_name}: {e}",
        )


@router.get("/documents/{name}")
def get_document(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Get a document from the database.

    :param project_name: The name of the project to get the document from.
    :param name:         The name of the document to get.
    :param uid:          The UID of the document to get.
    :param version:      The version of the document to get.
    :param db_session:   The database session.

    :return: The document from the database.
    """
    project_id = client.get_project(
        project_name=project_name, db_session=db_session
    ).uid
    uid, version = parse_version(uid, version)
    try:
        data = client.get_document(
            project_id=project_id,
            name=name,
            uid=uid,
            version=version,
            db_session=db_session,
        )
        if data is None:
            return APIResponse(
                success=False, error=f"Document with name = {name} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get document {name} in project {project_name}: {e}",
        )


@router.put("/documents/{name}")
def update_document(
    project_name: str,
    document: Document,
    name: str,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a document in the database.

    :param project_name: The name of the project to update the document in.
    :param document:     The document to update.
    :param name:         The name of the document to update.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.update_document(
            name=name, document=document, db_session=db_session
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update document {name} in project {project_name}: {e}",
        )


@router.delete("/documents/{name}")
def delete_document(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Delete a document from the database.

    :param project_name: The name of the project to delete the document from.
    :param name:         The name of the document to delete.
    :param uid:          The UID of the document to delete.
    :param version:      The version of the document to delete.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    project_id = client.get_project(
        project_name=project_name, db_session=db_session
    ).uid
    uid, version = parse_version(uid, version)
    try:
        client.delete_document(
            project_id=project_id,
            name=name,
            uid=uid,
            version=version,
            db_session=db_session,
        )
        return APIResponse(success=True)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to delete document {name} in project {project_name}: {e}",
        )


@router.get("/documents")
def list_documents(
    project_name: str,
    name: str = None,
    version: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    db_session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List documents in the database.

    :param project_name: The name of the project to list the documents from.
    :param name:         The name to filter by.
    :param version:      The version to filter by.
    :param labels:       The labels to filter by.
    :param mode:         The output mode.
    :param db_session:   The database session.
    :param auth:         The authentication information.

    :return: The response from the database.
    """
    owner = client.get_user(user_name=auth.username, db_session=db_session)
    owner_id = getattr(owner, "uid", None)
    project_id = client.get_project(
        project_name=project_name, db_session=db_session
    ).uid
    try:
        data = client.list_documents(
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
            error=f"Failed to list documents in project {project_name}: {e}",
        )
