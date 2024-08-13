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

from datetime import datetime
from enum import Enum
from http.client import HTTPException
from typing import Dict, List, Optional, Tuple, Type, Union

import yaml
from pydantic import BaseModel


# ============================== from llmapps/app/schema.py ==============================
# Temporary: This was copied to here to avoid import from the app like this:
# from llmapps.app.schema import Conversation, Message
class ApiResponse(BaseModel):
    success: bool
    data: Optional[Union[list, Type[BaseModel], dict]] = None
    error: Optional[str] = None

    def with_raise(self, format=None) -> "ApiResponse":
        if not self.success:
            format = format or "API call failed: %s"
            raise ValueError(format % self.error)
        return self

    def with_raise_http(self, format=None) -> "ApiResponse":
        if not self.success:
            format = format or "API call failed: %s"
            raise HTTPException(status_code=400, detail=format % self.error)
        return self


class ChatRole(str, Enum):
    Human = "Human"
    AI = "AI"
    System = "System"
    User = "User"  # for co-pilot user (vs Human?)
    Agent = "Agent"  # for co-pilot agent


class Message(BaseModel):
    role: ChatRole
    content: str
    extra_data: Optional[dict] = None
    sources: Optional[List[dict]] = None
    human_feedback: Optional[str] = None


class Conversation(BaseModel):
    messages: list[Message] = []
    saved_index: int = 0

    def __str__(self):
        return "\n".join([f"{m.role}: {m.content}" for m in self.messages])

    def add_message(self, role, content, sources=None):
        self.messages.append(Message(role=role, content=content, sources=sources))

    def to_list(self):
        return self.dict()["messages"]
        # return self.model_dump(mode="json")["messages"]

    def to_dict(self):
        return self.dict()["messages"]
        # return self.model_dump(mode="json")["messages"]

    @classmethod
    def from_list(cls, data: list):
        return cls.parse_obj({"messages": data or []})
        # return cls.model_validate({"messages": data or []})


class QueryItem(BaseModel):
    question: str
    session_name: Optional[str] = None
    filter: Optional[List[Tuple[str, str]]] = None
    data_source: Optional[str] = None


class OutputMode(str, Enum):
    Names = "names"
    Short = "short"
    Dict = "dict"
    Details = "details"


class DataSourceType(str, Enum):
    relational = "relational"
    vector = "vector"
    graph = "graph"
    key_value = "key-value"
    column_family = "column-family"
    storage = "storage"
    other = "other"


class ModelType(str, Enum):
    model = "model"
    adapter = "adapter"


class WorkflowType(str, Enum):
    ingestion = "ingestion"
    application = "application"
    data_processing = "data-processing"
    training = "training"
    evaluation = "evaluation"


# ========================================================================================


metadata_fields = [
    "id",
    "name",
    "description",
    "labels",
    "owner_id",
    "created",
    "updated",
    "version",
    "project_id",
]


class Base(BaseModel):
    _extra_fields = []
    _top_level_fields = []

    class Config:
        orm_mode = True

    def to_dict(
        self, drop_none=True, short=False, drop_metadata=False, to_datestr=False
    ):
        struct = self.dict()
        # struct = self.model_dump(mode="json")  # pydantic v2
        new_struct = {}
        for k, v in struct.items():
            if (
                (drop_none and v is None)
                or (short and k in self._extra_fields)
                or (drop_metadata and k in metadata_fields)
            ):
                continue
            if to_datestr and isinstance(v, datetime):
                v = v.isoformat()
            elif short and isinstance(v, datetime):
                v = v.strftime("%Y-%m-%d %H:%M")
            if hasattr(v, "to_dict"):
                v = v.to_dict()
            new_struct[k] = v
        return new_struct

    @classmethod
    def from_dict(cls, data: dict):
        if isinstance(data, cls):
            return data
        return cls.parse_obj(data)
        # return cls.model_validate(data)  # pydantic v2

    @classmethod
    def from_orm_object(cls, obj):
        object_dict = {}
        for field in obj.__table__.columns:
            object_dict[field.name] = getattr(obj, field.name)
        spec = object_dict.pop("spec", {})
        object_dict.update(spec)
        if obj.labels:
            object_dict["labels"] = {label.name: label.value for label in obj.labels}
        return cls.from_dict(object_dict)

    def merge_into_orm_object(self, orm_object):
        struct = self.to_dict(drop_none=True)
        spec = orm_object.spec or {}
        labels = struct.pop("labels", None)
        for k, v in struct.items():
            if k in (metadata_fields + self._top_level_fields) and k not in [
                "created",
                "updated",
            ]:
                setattr(orm_object, k, v)
            if k not in [metadata_fields + self._top_level_fields]:
                spec[k] = v
        orm_object.spec = spec

        if labels:
            old = {label.name: label for label in orm_object.labels}
            orm_object.labels.clear()
            for name, value in labels.items():
                if name in old:
                    if value is not None:  # None means delete
                        old[name].value = value
                        orm_object.labels.append(old[name])
                else:
                    orm_object.labels.append(
                        orm_object.Label(name=name, value=value, parent=orm_object.name)
                    )

        return orm_object

    def to_orm_object(self, obj_class, uid=None):
        struct = self.to_dict(drop_none=False, short=False)
        obj_dict = {
            k: v
            for k, v in struct.items()
            if k in (metadata_fields + self._top_level_fields)
            and k not in ["created", "updated"]
        }
        obj_dict["spec"] = {
            k: v
            for k, v in struct.items()
            if k not in metadata_fields + self._top_level_fields
        }
        labels = obj_dict.pop("labels", None)
        if uid:
            obj_dict["id"] = uid
        obj = obj_class(**obj_dict)
        if labels:
            obj.labels.clear()
            for name, value in labels.items():
                obj.labels.append(obj.Label(name=name, value=value, parent=obj.name))
        return obj

    def to_yaml(self, drop_none=True):
        return yaml.dump(self.to_dict(drop_none=drop_none))

    def __repr__(self):
        args = ", ".join(
            [f"{k}={v!r}" for k, v in self.to_dict(short=True, to_datestr=True).items()]
        )
        return f"{self.__class__.__name__}({args})"

    def __str__(self):
        return str(self.to_dict(to_datestr=True))


class BaseWithMetadata(Base):
    name: str
    id: Optional[str] = None
    description: Optional[str] = None
    labels: Optional[Dict[str, Union[str, None]]] = None
    created: Optional[Union[str, datetime]] = None
    updated: Optional[Union[str, datetime]] = None


class BaseWithOwner(BaseWithMetadata):
    owner_id: Optional[str] = None


class BaseWithVerMetadata(BaseWithOwner):
    version: Optional[str] = ""


class User(BaseWithMetadata):
    _extra_fields = ["policy", "features"]
    _top_level_fields = ["email", "full_name"]

    email: str
    full_name: Optional[str] = None
    features: Optional[dict[str, str]] = None
    policy: Optional[dict[str, str]] = None
    is_admin: Optional[bool] = False


class Project(BaseWithVerMetadata):
    pass


class DataSource(BaseWithVerMetadata):
    _top_level_fields = ["data_source_type"]

    data_source_type: DataSourceType
    project_id: Optional[str] = None
    category: Optional[str] = None
    database_kwargs: Optional[dict[str, str]] = {}


class Dataset(BaseWithVerMetadata):
    _top_level_fields = ["task"]

    project_id: Optional[str] = None
    task: str
    sources: Optional[List[str]] = None
    path: str
    producer: Optional[str] = None


class Model(BaseWithVerMetadata):
    _extra_fields = ["path", "producer", "deployment"]
    _top_level_fields = ["model_type", "task"]

    model_type: ModelType
    base_model: str
    project_id: Optional[str] = None
    task: Optional[str] = None
    path: Optional[str] = None
    producer: Optional[str] = None
    deployment: Optional[str] = None


class PromptTemplate(BaseWithVerMetadata):
    _extra_fields = ["arguments"]
    _top_level_fields = ["text"]

    text: str
    project_id: Optional[str] = None
    arguments: Optional[List[str]] = None


class Document(BaseWithVerMetadata):
    _top_level_fields = ["path", "origin"]
    path: str
    project_id: Optional[str] = None
    origin: Optional[str] = None


class Workflow(BaseWithVerMetadata):
    _top_level_fields = ["workflow_type"]

    workflow_type: WorkflowType
    deployment: str
    project_id: Optional[str] = None
    workflow_function: Optional[str] = None
    configuration: Optional[dict] = None
    graph: Optional[dict] = None

    def get_infer_path(self):
        return f"{self.deployment}/api/workflows/{self.name}/infer"


class ChatSession(BaseWithOwner):
    _extra_fields = ["history"]
    _top_level_fields = ["workflow_id"]

    workflow_id: str
    history: Optional[List[Message]] = []

    def to_conversation(self):
        return Conversation.from_list(self.history)
