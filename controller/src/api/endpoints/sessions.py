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

from controller.src.api.utils import get_db, parse_version
from controller.src.db import client
from controller.src.schemas import APIResponse, ChatSession, OutputMode

router = APIRouter(prefix="/users/{user_name}")


@router.post("/sessions")
def create_session(
    user_name: str,
    session: ChatSession,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new session in the database.

    :param user_name:   The name of the user to create the session for.
    :param session:     The session to create.
    :param db_session:  The database session.

    :return:    The response from the database.
    """
    try:
        data = client.create_session(session=session, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create session {session.uid} for user {user_name}: {e}",
        )


@router.get("/sessions/{name}")
def get_session(user_name: str, name: str, uid: str = None, version: str = None, db_session=Depends(get_db)) -> APIResponse:
    """
    Get a session from the database. If the session ID is "$last", get the last session for the user.

    :param user_name:   The name of the user to get the session for.
    :param name:        The name of the session to get.
    :param uid:         The UID of the session to get. if "$last" bring the last user's session.
    :param version:     The version of the session to get.
    :param db_session:  The database session.

    :return:    The session from the database.
    """
    user_id = None
    uid, version = parse_version(uid=uid, version=version)
    if name == "$last":
        user_id = client.get_user(user_name=user_name, db_session=db_session).uid
        name = None
    try:
        data = client.get_session(user_id=user_id, name=name, uid=uid, version=version, db_session=db_session)
        if data is None:
            return APIResponse(
                success=False, error=f"Session with name = {name} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get session {uid} for user {user_name}: {e}",
        )


@router.put("/sessions/{name}")
def update_session(
    user_name: str,
    name: str,
    session: ChatSession,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a session in the database.

    :param user_name:   The name of the user to update the session for.
    :param name:        The name of the session to update.
    :param session:     The session to update.
    :param db_session:  The database session.

    :return:    The response from the database.
    """
    try:
        data = client.update_session(session=session, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update session {name} for user {user_name}: {e}",
        )


@router.delete("/sessions/{name}")
def delete_session(user_name: str, name: str, uid: str = None, version: str = None, db_session=Depends(get_db)) -> APIResponse:
    """
    Delete a session from the database.

    :param user_name:   The name of the user to delete the session for.
    :param name:        The name of the session to delete.
    :param uid:         The UID of the session to delete.
    :param version:     The version of the session to delete.
    :param db_session:  The database session.

    :return:    The response from the database.
    """
    user_id = client.get_user(user_name=user_name, db_session=db_session).uid
    uid, version = parse_version(uid=uid, version=version)
    try:
        client.delete_session(name=name, uid=uid, version=version, user_id=user_id, db_session=db_session)
        return APIResponse(success=True)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to delete session {name} for user {user_name}: {e}",
        )


@router.get("/sessions")
def list_sessions(
    user_name: str,
    name: str = None,
    last: int = 0,
    created: str = None,
    workflow_id: str = None,
    mode: OutputMode = OutputMode.DETAILS,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    List sessions in the database.

    :param user_name:   The name of the user to list the sessions for.
    :param name:        The name of the session to filter by.
    :param last:        The number of sessions to get.
    :param created:     The date to filter by.
    :param workflow_id: The ID of the workflow to filter by.
    :param mode:        The output mode.
    :param db_session:  The database session.

    :return:    The response from the database.
    """
    user_id = client.get_user(user_name=user_name, db_session=db_session).uid
    try:
        data = client.list_sessions(
            user_id=user_id,
            name=name,
            last=last,
            created_after=created,
            workflow_id=workflow_id,
            output_mode=mode,
            db_session=db_session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False, error=f"Failed to list sessions for user {user_name}: {e}"
        )
