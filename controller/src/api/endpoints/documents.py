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
from controller.src.schemas import ApiResponse, Document, OutputMode

router = APIRouter(prefix="/projects/{project_name}")


@router.post("/documents")
def create_document(
    project_name: str,
    document: Document,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    Create a new document in the database.

    :param project_name:    The name of the project to create the document in.
    :param document:        The document to create.
    :param session:         The database session.
    :param auth:            The authentication information.

    :return:    The response from the database.
    """
    # If the owner ID is not provided, get it from the username
    if document.owner_id is None:
        document.owner_id = client.get_user(
            user_name=auth.username, session=session
        ).data["id"]
    document.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    return client.create_document(document=document, session=session)


@router.get("/documents/{document_name}")
def get_document(
    project_name: str, document_name: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Get a document from the database.

    :param project_name:    The name of the project to get the document from.
    :param document_name:   The name of the document to get.
    :param session:         The database session.

    :return:    The document from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.get_document(
        project_id=project_id, document_name=document_name, session=session
    )


@router.put("/documents/{document_name}")
def update_document(
    project_name: str,
    document: Document,
    document_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a document in the database.

    :param project_name:    The name of the project to update the document in.
    :param document:        The document to update.
    :param document_name:   The name of the document to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    document.project_id = client.get_project(
        project_name=project_name, session=session
    ).data["id"]
    if document_name != document.name:
        raise ValueError(
            f"Document name does not match: {document_name} != {document.name}"
        )
    return client.update_document(document=document, session=session)


@router.delete("/documents/{document_id}")
def delete_document(
    project_name: str, document_id: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Delete a document from the database.

    :param project_name:    The name of the project to delete the document from.
    :param document_id:     The ID of the document to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    project_id = client.get_project(project_name=project_name, session=session).data[
        "id"
    ]
    return client.delete_document(
        project_id=project_id, document_id=document_id, session=session
    )


@router.get("/documents")
def list_documents(
    project_name: str,
    version: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> ApiResponse:
    """
    List documents in the database.

    :param project_name:    The name of the project to list the documents from.
    :param version:         The version to filter by.
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
    return client.list_documents(
        project_id=project_id,
        owner_id=owner_id,
        version=version,
        labels_match=labels,
        output_mode=mode,
        session=session,
    )
