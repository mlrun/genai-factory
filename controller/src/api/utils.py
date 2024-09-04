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

from typing import List, Tuple, Union

import requests
from fastapi import Header, Request
from pydantic import BaseModel

from controller.src.config import config
from controller.src.db import client


def get_db():
    db_session = None
    try:
        db_session = client.get_local_session()
        yield db_session
    finally:
        if db_session:
            db_session.close()


class AuthInfo(BaseModel):
    username: str
    token: str
    roles: List[str] = []


# placeholder for extracting the Auth info from the request
def get_auth_user(
    request: Request, x_username: Union[str, None] = Header(None)
) -> AuthInfo:
    """Get the user from the database"""
    token = request.cookies.get("Authorization", "")
    if x_username:
        return AuthInfo(username=x_username, token=token)
    else:
        return AuthInfo(username="guest@example.com", token=token)


def _send_to_application(
    path: str, method: str = "POST", request=None, auth=None, **kwargs
):
    """
    Send a request to the application's API.

    :param path:    The API path to send the request to.
    :param method:  The HTTP method to use: GET, POST, PUT, DELETE, etc.
    :param request: The FastAPI request object. If provided, the data will be taken from the body of the request.
    :param auth:    The authentication information to use. If provided, the username will be added to the headers.
    :param kwargs:  Additional keyword arguments to pass in the request function. For example, headers, params, etc.

    :return:        The JSON response from the application.
    """
    if config.application_url not in path:
        url = f"{config.application_url}/api/{path}"
    else:
        url = path

    if isinstance(request, Request):
        # If the request is a FastAPI request, get the data from the body
        kwargs["data"] = request._body.decode("utf-8")
    if auth is not None:
        kwargs["headers"] = {"x_username": auth.username}

    response = requests.request(
        method=method,
        url=url,
        **kwargs,
    )

    # Check the response
    if response.status_code == 200:
        # If the request was successful, return the JSON response
        return response.json()
    else:
        # If the request failed, raise an exception
        response.raise_for_status()


def parse_version(uid: str = None, version: str = None) -> Tuple[str, str]:
    """
    Parse the version string from the uid if uid = uid:version. Otherwise, return the version as is.

    :param uid:     The UID string.
    :param version: The version string to parse.

    :return:    The UID and version strings.
    """
    if uid and ":" in uid:
        uid, version_from_uid = uid.split(":")
        if version_from_uid and version:
            raise ValueError(
                "Version cannot be specified in both the UID and the version parameter."
            )
        version = version_from_uid
    return uid, version
