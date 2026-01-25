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

from controller.api.utils import get_db
from controller.db import client
from genai_factory.schemas import APIResponse, OutputMode, User

router = APIRouter()


@router.post("/users")
def create_user(
    user: User,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new user in the database.

    :param user:       The user to create.
    :param db_session: The database session.

    :return: The response from the database.
    """
    try:
        data = client.create_user(user=user, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False, error=f"Failed to create user {user.name}: {e}"
        )


@router.get("/users/{name}")
def get_user(
    name: str,
    uid: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Get a user from the database.

    :param name:       The name of the user to get.
    :param uid:        The UID of the user to get.
    :param db_session: The database session.

    :return: The user from the database.
    """
    try:
        data = client.get_user(name=name, uid=uid, db_session=db_session)
        if data is None:
            return APIResponse(
                success=False,
                error=f"User with name = {name} not found",
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get user with name = {name}: {e}",
        )


@router.put("/users/{name}")
def update_user(
    user: User,
    name: str,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a user in the database.

    :param user:       The user to update.
    :param name:       The name of the user to update.
    :param db_session: The database session.

    :return: The response from the database.
    """
    try:
        data = client.update_user(name=name, user=user, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(success=False, error=f"Failed to update user {name}: {e}")


@router.delete("/users/{name}")
def delete_user(name: str, uid: str = None, db_session=Depends(get_db)) -> APIResponse:
    """
    Delete a user from the database.

    :param name:       The name of the user to delete.
    :param uid:        The UID of the user to delete.
    :param db_session: The database session.

    :return: The response from the database.
    """
    try:
        client.delete_user(name=name, uid=uid, db_session=db_session)
        return APIResponse(success=True)
    except Exception as e:
        return APIResponse(success=False, error=f"Failed to delete user {name}: {e}")


@router.get("/users")
def list_users(
    name: str = None,
    mode: OutputMode = OutputMode.DETAILS,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    List users in the database.

    :param name:       The name to filter by.
    :param mode:       The output mode.
    :param db_session: The database session.

    :return: The response from the database.
    """
    try:
        data = client.list_users(
            name=name,
            output_mode=mode,
            db_session=db_session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(success=False, error=f"Failed to list users: {e}")
