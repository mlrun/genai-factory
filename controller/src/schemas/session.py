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
from typing import List, Tuple

from pydantic import BaseModel

from controller.src.schemas.base import BaseWithOwner


class QueryItem(BaseModel):
    question: str
    session_id: str = None
    filter: List[Tuple[str, str]] = None
    data_source: str = None


class ChatRole(str, Enum):
    HUMAN = "Human"
    AI = "AI"
    SYSTEM = "System"
    USER = "User"  # for co-pilot user (vs Human?)
    AGENT = "Agent"  # for co-pilot agent


class Message(BaseModel):
    role: ChatRole
    content: str
    extra_data: dict = None
    sources: List[dict] = None
    human_feedback: str = None


class ChatSession(BaseWithOwner):
    _extra_fields = ["history"]
    _top_level_fields = ["workflow_id"]

    workflow_id: str
    history: List[Message] = []
