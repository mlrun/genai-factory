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

from fastapi import (APIRouter, Depends, FastAPI, File, Header, Request,
                     UploadFile)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import logger
from .model import ChatSession, DocCollection, OutputMode, QueryItem, User
from .sqlclient import client

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
async def get_auth_user(
    request: Request, x_username: Union[str, None] = Header(None)
) -> AuthInfo:
    """Get the user from the database"""
    token = request.cookies.get("Authorization", "")
    if x_username:
        return AuthInfo(username=x_username, token=token)
    else:
        return AuthInfo(username="yhaviv@gmail.com", token=token)


@router.post("/tables")
async def create_tables(drop_old: bool = False, names: list[str] = None):
    return client.create_tables(drop_old=drop_old, names=names)


@router.post("/pipeline/{name}/run")
async def run_pipeline(
    request: Request, name: str, item: QueryItem, auth=Depends(get_auth_user)
):
    """This is the query command"""
    app_server = request.app.extra.get("app_server")
    if not app_server:
        raise ValueError("app_server not found in app")
    event = {
        "username": auth.username,
        "session_id": item.session_id,
        "query": item.question,
        "collection_name": item.collection,
    }
    logger.debug(f"running pipeline {name}: {event}")
    resp = app_server.run_pipeline(name, event)
    print(f"resp: {resp}")
    return resp


@router.get("/collections")
async def list_collections(
    owner: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
):
    return client.list_collections(
        owner=owner, labels_match=labels, output_mode=mode, session=session
    )


@router.get("/collection/{name}")
async def get_collection(name: str, session=Depends(get_db)):
    return client.get_collection(name, session=session)


@router.post("/collection/{name}")
async def create_collection(
    request: Request,
    name: str,
    collection: DocCollection,
    session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
):
    collection.owner_name = auth.username
    return client.create_collection(collection, session=session)


@router.get("/users")
async def list_users(
    email: str = None,
    username: str = None,
    mode: OutputMode = OutputMode.Details,
    session=Depends(get_db),
):
    return client.list_users(
        email=email, full_name=username, output_mode=mode, session=session
    )


@router.get("/user/{username}")
async def get_user(username: str, session=Depends(get_db)):
    return client.get_user(username, session=session)


@router.post("/user/{username}")
async def create_user(
    user: User,
    username: str,
    session=Depends(get_db),
):
    """This is the user command"""
    return client.create_user(user, session=session)


@router.delete("/user/{username}")
async def delete_user(username: str, session=Depends(get_db)):
    return client.delete_user(username, session=session)


# get last user sessions, specify user and last
@router.get("/user/{username}/sessions")
async def list_user_sessions(
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
async def update_user(
    user: User,
    username: str,
    session=Depends(get_db),
):
    return client.update_user(user, session=session)


# add routs for chat sessions, list_sessions, get_session
@router.post("/session")
async def create_session(chat_session: ChatSession, session=Depends(get_db)):
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
