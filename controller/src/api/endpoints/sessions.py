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

from fastapi import APIRouter, Depends

from controller.src.api.utils import get_db
from controller.src.db import client
from controller.src.schemas import ApiResponse, ChatSession, OutputMode

router = APIRouter(prefix="/users/{user_name}")


@router.post("/sessions")
def create_session(
    user_name: str,
    chat_session: ChatSession,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Create a new session in the database.

    :param user_name:       The name of the user to create the session for.
    :param chat_session:    The session to create.
    :param session:         The database session.

    :return:    The response from the database.
    """
    chat_session.owner_id = client.get_user(user_name=user_name, session=session).data[
        "id"
    ]
    return client.create_chat_session(chat_session=chat_session, session=session)


@router.get("/sessions/{session_name}")
def get_session(
    user_name: str, session_name: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Get a session from the database. If the session ID is "$last", get the last session for the user.

    :param user_name:       The name of the user to get the session for.
    :param session_name:    The name of the session to get.
    :param session:         The database session.

    :return:    The session from the database.
    """
    user_id = None
    if session_name == "$last":
        user_id = client.get_user(user_name=user_name, session=session).data["id"]
        session_name = None
    return client.get_chat_session(
        session_name=session_name, user_id=user_id, session=session
    )


@router.put("/sessions/{session_name}")
def update_session(
    user_name: str,
    chat_session: ChatSession,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a session in the database.

    :param user_name:       The name of the user to update the session for.
    :param chat_session:    The session to update.
    :param session:         The database session.

    :return:    The response from the database.
    """
    chat_session.owner_id = client.get_user(user_name=user_name, session=session).data[
        "id"
    ]
    return client.update_chat_session(chat_session=chat_session, session=session)


@router.delete("/sessions/{session_id}")
def delete_session(
    user_name: str, session_id: str, session=Depends(get_db)
) -> ApiResponse:
    """
    Delete a session from the database.

    :param user_name:       The name of the user to delete the session for.
    :param session_id:      The ID of the session to delete.
    :param session:         The database session.

    :return:    The response from the database.
    """
    user_id = client.get_user(user_name=user_name, session=session).data["id"]
    return client.delete_chat_session(
        session_name=session_id, user_id=user_id, session=session
    )


@router.get("/sessions")
def list_sessions(
    user_name: str,
    last: int = 0,
    created: str = None,
    workflow_id: str = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
) -> ApiResponse:
    """
    List sessions in the database.

    :param user_name:   The name of the user to list the sessions for.
    :param last:        The number of sessions to get.
    :param created:     The date to filter by.
    :param workflow_id: The ID of the workflow to filter by.
    :param mode:        The output mode.
    :param session:     The database session.

    :return:    The response from the database.
    """
    user_id = client.get_user(user_name=user_name, session=session).data["id"]
    return client.list_chat_sessions(
        user_id=user_id,
        last=last,
        created_after=created,
        workflow_id=workflow_id,
        output_mode=mode,
        session=session,
    )
