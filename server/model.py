from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Union

import yaml
from pydantic import BaseModel

from llmapps.app.schema import Conversation, Message

metadata_fields = [
    "name",
    "description",
    "labels",
    "owner_name",
    "created",
    "updated",
    "version",
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

    def to_orm_object(self, obj_class):
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
    description: Optional[str] = None
    labels: Optional[Dict[str, Union[str, None]]] = None
    created: Optional[Union[str, datetime]] = None
    updated: Optional[Union[str, datetime]] = None


class BaseWithVerMetadata(BaseWithMetadata):
    version: Optional[str] = ""


class User(BaseWithMetadata):
    _extra_fields = ["policy", "features"]
    _top_level_fields = ["email", "full_name"]

    email: str
    full_name: Optional[str] = None
    features: Optional[dict[str, str]] = None
    policy: Optional[dict[str, str]] = None


class DocCollection(BaseWithMetadata):
    _top_level_fields = ["owner_name"]

    owner_name: Optional[str] = None
    category: Optional[str] = None
    db_args: Optional[dict[str, str]] = None


class ChatSession(BaseWithMetadata):
    _extra_fields = ["history", "features", "state", "agent_name"]
    _top_level_fields = ["username"]

    username: Optional[str] = None
    agent_name: Optional[str] = None
    history: Optional[List[Message]] = []
    features: Optional[dict[str, str]] = None
    state: Optional[dict[str, str]] = None

    def to_conversation(self):
        return Conversation.from_list(self.history)


class Document(BaseWithVerMetadata):
    collection: str
    source: str
    origin: Optional[str] = None
    num_chunks: Optional[int] = None


class OutputMode(str, Enum):
    Names = "names"
    Short = "short"
    Dict = "dict"
    Details = "details"
