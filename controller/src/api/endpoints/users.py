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
from controller.src.schemas import APIResponse, OutputMode, User

router = APIRouter()


@router.post("/users")
def create_user(
    user: User,
    session=Depends(get_db),
) -> APIResponse:
    """
    Create a new user in the database.

    :param user:    The user to create.
    :param session: The database session.

    :return:    The response from the database.
    """
    try:
        data = client.create_user(user=user, session=session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False, error=f"Failed to create user {user.name}: {e}"
        )


@router.get("/users/{user_name}")
def get_user(user_name: str, email: str = None, session=Depends(get_db)) -> APIResponse:
    """
    Get a user from the database.

    :param user_name:   The name of the user to get.
    :param email:       The email address to get the user by if the name is not provided.
    :param session:     The database session.

    :return:    The user from the database.
    """
    try:
        data = client.get_user(user_name=user_name, email=email, session=session)
        if data is None:
            return APIResponse(
                success=False,
                error=f"User with name = {user_name}, email = {email} not found",
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get user with name = {user_name}, email = {email}: {e}",
        )


@router.put("/users/{user_name}")
def update_user(
    user: User,
    user_name: str,
    session=Depends(get_db),
) -> APIResponse:
    """
    Update a user in the database.

    :param user:        The user to update.
    :param user_name:   The name of the user to update.
    :param session:     The database session.

    :return:    The response from the database.
    """
    try:
        data = client.update_user(user=user, session=session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False, error=f"Failed to update user {user_name}: {e}"
        )


@router.delete("/users/{user_name}")
def delete_user(user_name: str, session=Depends(get_db)) -> APIResponse:
    """
    Delete a user from the database.

    :param user_name:   The name of the user to delete.
    :param session:     The database session.

    :return:    The response from the database.
    """
    user = client.get_user(user_name=user_name, session=session)
    try:
        client.delete_user(uid=user.uid, session=session)
        return APIResponse(success=True)
    except Exception as e:
        return APIResponse(
            success=False, error=f"Failed to delete user {user_name}: {e}"
        )


@router.get("/users")
def list_users(
    name: str = None,
    email: str = None,
    full_name: str = None,
    mode: OutputMode = OutputMode.DETAILS,
    session=Depends(get_db),
) -> APIResponse:
    """
    List users in the database.

    :param name:        The name to filter by.
    :param email:       The email address to filter by.
    :param full_name:   The full name to filter by.
    :param mode:        The output mode.
    :param session:     The database session.

    :return:    The response from the database.
    """
    try:
        data = client.list_users(
            name=name,
            email=email,
            full_name=full_name,
            output_mode=mode,
            session=session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(success=False, error=f"Failed to list users: {e}")
