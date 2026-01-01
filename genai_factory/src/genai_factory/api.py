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
import json
from typing import List, Union

from fastapi import APIRouter, Depends, FastAPI, Header, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from genai_factory import workflow_server
from genai_factory.data.doc_loader import get_data_loader, get_loader_obj
from genai_factory.schemas import Document, QueryItem, Workflow

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
        return AuthInfo(username="guest", token=token)


@router.post("/data_sources/{data_source_name}/ingest")
async def ingest(
    data_source_name: str,
    loader: str,
    metadata: str = None, #for local debugging
    body: dict = Body(...),#for local debugging
    from_file: bool = False,
):
    # for local debugging
    kwargs = body.get("kwargs", {})
    document = Document(**body["document"])

    # decode metadata if present
    if metadata:
        metadata = json.loads(metadata)


    """Ingest documents into the vector database"""
    data_loader = get_data_loader(
        config=workflow_server.config,
        data_source_name=data_source_name,
        kwargs=kwargs,
    )

    if from_file:
        with open(document.path, "r") as fp:
            lines = fp.readlines()
        for line in lines:
            path = line.strip()
            if path and not path.startswith("#"):
                loader_obj = get_loader_obj(path, loader_type=loader)
                data_loader.load(
                    loader_obj, metadata=metadata, version=document.version
                )

    else:
        loader_obj = get_loader_obj(document.path, loader_type=loader)
        data_loader.load(loader_obj, metadata=metadata, version=document.version)
    return {"status": "ok"}


@router.post("/workflows/{name}/infer")
async def infer_workflow(
    request: Request,
    name: str,
    workflow: Workflow,
    item: QueryItem,
    auth=Depends(get_auth_user),
):
    """This is the query command"""
    app_server = request.app.extra.get("app_server")
    if not app_server:
        raise ValueError("app_server not found in app")

    event = {
        "username": auth.username,
        "session_name": item.session_name,
        "query": item.question,
        "workflow_id": workflow.uid,
    }
    resp = await app_server.run_workflow(name, event)
    print(f"resp: {resp}")
    return resp
