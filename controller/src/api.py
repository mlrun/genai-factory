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

from typing import List, Optional, Tuple, Union

import requests
from fastapi import (APIRouter, Depends, FastAPI, File, Header, Request,
                     UploadFile)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from controller.src.config import config
from controller.src.model import ChatSession, DocCollection, OutputMode, QueryItem, User
from controller.src.sqlclient import client

app = FastAPI()

# Add CORS middleware, remove in production
origins = ["*"]  # React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with a prefix
router = APIRouter(prefix="/api")


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
        return AuthInfo(username="yhaviv@gmail.com", token=token)


def send_to_application(path: str, method: str = "POST", request=None, auth=None, **kwargs):
    """
    Send a request to the application's API.

    :param path:    The API path to send the request to.
    :param method:  The HTTP method to use: GET, POST, PUT, DELETE, etc.
    :param request: The FastAPI request object. If provided, the data will be taken from the body of the request.
    :param auth:    The authentication information to use. If provided, the username will be added to the headers.
    :param kwargs:  Additional keyword arguments to pass in the request function. For example, headers, params, etc.

    :return:        The JSON response from the application.
    """
    url = f"{config.application_url}/api/{path}"

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


@router.post("/tables")
def create_tables(drop_old: bool = False, names: list[str] = None):
    return client.create_tables(drop_old=drop_old, names=names)


@router.post("/pipeline/{name}/run")
def run_pipeline(
    request: Request, name: str, auth=Depends(get_auth_user)
):
    """This is the query command"""
    return send_to_application(
        path=f"pipeline/{name}/run",
        method="POST",
        request=request,
        auth=auth,
    )


@router.post("/collections/{collection}/{loader}/ingest")
def ingest(
    collection, path, loader, metadata, version, from_file, auth=Depends(get_auth_user)
):
    """Ingest documents into the vector database"""
    params = {
        "path": path,
        "from_file": from_file,
        "metadata": metadata,
        "version": version,
    }
    return send_to_application(
        path=f"collections/{collection}/{loader}/ingest",
        method="POST",
        params=params,
        auth=auth,
    )


@router.get("/collections")
def list_collections(
    owner: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
):
    return client.list_collections(
        owner=owner, labels_match=labels, output_mode=mode, session=session
    )


@router.get("/collection/{name}")
def get_collection(name: str, session=Depends(get_db)):
    return client.get_collection(name, session=session)


@router.post("/collection/{name}")
def create_collection(
    request: Request,
    name: str,
    collection: DocCollection,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
):
    collection.owner_name = auth.username
    return client.create_collection(collection, session=session)


@router.get("/users")
def list_users(
    email: str = None,
    username: str = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
):
    return client.list_users(
        email=email, full_name=username, output_mode=mode, session=session
    )


@router.get("/user/{username}")
def get_user(username: str, session=Depends(get_db)):
    return client.get_user(username, session=session)


@router.post("/user/{username}")
def create_user(
    user: User,
    username: str,
    session=Depends(get_db),
):
    """This is the user command"""
    return client.create_user(user, session=session)


@router.delete("/user/{username}")
def delete_user(username: str, session=Depends(get_db)):
    return client.delete_user(username, session=session)


# get last user sessions, specify user and last
@router.get("/user/{username}/sessions")
def list_user_sessions(
    username: str,
    last: int = 0,
    created: str = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
):
    return client.list_sessions(
        username, created_after=created, last=last, output_mode=mode, session=session
    )


@router.put("/user/{username}")
def update_user(
    user: User,
    username: str,
    session=Depends(get_db),
):
    return client.update_user(user, session=session)


# add routs for chat sessions, list_sessions, get_session
@router.post("/session")
def create_session(chat_session: ChatSession, session=Depends(get_db)):
    return client.create_session(chat_session, session=session)


@router.get("/sessions")
async def list_sessions(
    username: str = None,
    last: int = 0,
    created: str = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
    auth=Depends(get_auth_user),
):
    user = None if username and username == "all" else (username or auth.username)
    return client.list_sessions(
        user, created_after=created, last=last, output_mode=mode, session=session
    )


@router.get("/session/{session_id}")
async def get_session(
    session_id: str, session=Depends(get_db), auth=Depends(get_auth_user)
):
    user = None
    if session_id == "$last":
        user = auth.username
        session_id = None
    return client.get_session(session_id, user, session=session)


@router.put("/session/{session_id}")
async def update_session(
    session_id: str, chat_session: ChatSession, session=Depends(get_db)
):
    chat_session.name = session_id
    return client.update_session(chat_session, session=session)


@router.post("/transcribe")
async def transcribe_file(file: UploadFile = File(...)):
    file_contents = await file.read()
    file_handler = file.file
    return transcribe_file(file_handler)


# Include the router in the main app
app.include_router(router)
