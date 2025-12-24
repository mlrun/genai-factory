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
from enum import Enum
from typing import Optional

from genai_factory.schemas.base import BaseWithComparableData


class DeploymentType(str, Enum):
    MODEL = "Model"
    WORKFLOW = "Workflow"
    KNOWLEDGE_BASE = "knowledge-base"
    AGENT = "agent"
    MCP_SERVER = "mcp_server"

class Deployment(BaseWithComparableData):
    _top_level_fields = ["project_id","workflow_id","model_id","agent_id","mcp_server_id","is_remote","type"]

    #required
    project_id: str
    is_remote: bool
    type: DeploymentType

    #Optional (nullable in Db)
    workflow_id: Optional[str] = None
    model_id: Optional[str] = None
    agent_id: Optional[str] = None
    mcp_server_id: Optional[str] = None

    type_kwargs: dict[str, str] = {}
    configuration: dict
    status: dict
    profile: dict = {}

