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

from _common.schemas import APIResponse, Document, OutputMode
from controller.src.api.utils import AuthInfo, get_auth_user, get_db
from controller.src.db import client

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/documents")
def create_document(
    project_name: str,
    document: Document,
    session=Depends(get_db),
) -> APIResponse:
    """
    Create a new document in the database.

    :param project_name:    The name of the project to create the document in.
    :param document:        The document to create.
    :param session:         The database session.

    :return:    The response from the database.
    """
    try:
        data = client.create_document(document=document, session=session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create document {document.name} in project {project_name}: {e}",
        )


@router.get("/documents/{uid}")
def get_document(project_name: str, uid: str, session=Depends(get_db)) -> APIResponse:
    """
    Get a document from the database.

    :param project_name:    The name of the project to get the document from.
    :param uid:             The UID of the document to get.
    :param session:         The database session.

    :return:    The document from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        data = client.get_document(project_id=project_id, uid=uid, session=session)
        if data is None:
            return APIResponse(
                success=False, error=f"Document with uid = {uid} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get document {uid} in project {project_name}: {e}",
        )


@router.put("/documents/{document_name}")
def update_document(
    project_name: str,
    document: Document,
    document_name: str,
    session=Depends(get_db),
) -> APIResponse:
    """
    Update a document in the database.

    :param project_name:    The name of the project to update the document in.
    :param document:        The document to update.
    :param document_name:   The name of the document to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    try:
        data = client.update_document(document=document, session=session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update document {document.name} in project {project_name}: {e}",
        )


@router.delete("/documents/{uid}")
def delete_document(
    project_name: str, uid: str, session=Depends(get_db)
) -> APIResponse:
    """
    Delete a document from the database.

    :param project_name:    The name of the project to delete the document from.
    :param uid:             The UID of the document to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        client.delete_document(project_id=project_id, uid=uid, session=session)
        return APIResponse(success=True)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to delete document {uid} in project {project_name}: {e}",
        )


@router.get("/documents")
def list_documents(
    project_name: str,
    name: str = None,
    version: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List documents in the database.

    :param project_name:    The name of the project to list the documents from.
    :param name:            The name to filter by.
    :param version:         The version to filter by.
    :param labels:          The labels to filter by.
    :param mode:            The output mode.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    owner_id = client.get_user(user_name=auth.username, session=session).uid
    project_id = client.get_project(project_name=project_name, session=session).uid
    try:
        data = client.list_documents(
            project_id=project_id,
            name=name,
            owner_id=owner_id,
            version=version,
            labels_match=labels,
            output_mode=mode,
            session=session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to list documents in project {project_name}: {e}",
        )
