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
from controller.src.schemas import ApiResponse, OutputMode, User

router = APIRouter()


@router.post("/users")
def create_user(
    user: User,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Create a new user in the database.

    :param user:    The user to create.
    :param session: The database session.

    :return:    The response from the database.
    """
    return client.create_user(user=user, session=session)


@router.get("/users/{user_name}")
def get_user(user_name: str, email: str = None, session=Depends(get_db)) -> ApiResponse:
    """
    Get a user from the database.

    :param user_name:   The name of the user to get.
    :param email:       The email address to get the user by if the name is not provided.
    :param session:     The database session.

    :return:    The user from the database.
    """
    return client.get_user(user_name=user_name, email=email, session=session)


@router.put("/users/{user_name}")
def update_user(
    user: User,
    user_name: str,
    session=Depends(get_db),
) -> ApiResponse:
    """
    Update a user in the database.

    :param user:        The user to update.
    :param user_name:   The name of the user to update.
    :param session:     The database session.

    :return:    The response from the database.
    """
    if user_name != user.name:
        raise ValueError(f"User name does not match: {user_name} != {user.name}")
    return client.update_user(user=user, session=session)


@router.delete("/users/{user_name}")
def delete_user(user_name: str, session=Depends(get_db)) -> ApiResponse:
    """
    Delete a user from the database.

    :param user_name:   The name of the user to delete.
    :param session:     The database session.

    :return:    The response from the database.
    """
    return client.delete_user(user_name=user_name, session=session)


@router.get("/users")
def list_users(
    email: str = None,
    full_name: str = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
) -> ApiResponse:
    """
    List users in the database.

    :param email:       The email address to filter by.
    :param full_name:   The full name to filter by.
    :param mode:        The output mode.
    :param session:     The database session.

    :return:    The response from the database.
    """
    return client.list_users(
        email=email, full_name=full_name, output_mode=mode, session=session
    )
