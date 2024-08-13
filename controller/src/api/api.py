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

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controller.src.api.endpoints import (
    base,
    data_sources,
    datasets,
    documents,
    models,
    projects,
    prompt_templates,
    sessions,
    users,
    workflows,
)

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
api_router = APIRouter(prefix="/api")


# Include the routers for the different endpoints
api_router.include_router(
    base.router,
    tags=["base"],
)
api_router.include_router(
    users.router,
    tags=["users"],
)
api_router.include_router(
    projects.router,
    tags=["projects"],
)
api_router.include_router(
    data_sources.router,
    tags=["data_sources"],
)
api_router.include_router(
    datasets.router,
    tags=["datasets"],
)
api_router.include_router(
    models.router,
    tags=["models"],
)
api_router.include_router(
    prompt_templates.router,
    tags=["prompt_templates"],
)
api_router.include_router(
    documents.router,
    tags=["documents"],
)
api_router.include_router(
    workflows.router,
    tags=["workflows"],
)
api_router.include_router(
    sessions.router,
    tags=["chat_sessions"],
)

# Include the router in the main app
app.include_router(api_router)
