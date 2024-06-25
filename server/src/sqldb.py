import datetime

import sqlalchemy
from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import declarative_base, relationship

# Create a base class for declarative class definitions
Base = declarative_base()


def make_label(table):
    class Label(Base):
        __tablename__ = f"{table}_labels"
        __table_args__ = (
            UniqueConstraint("name", "parent", name=f"_{table}_labels_uc"),
            Index(f"idx_{table}_labels_name_value", "name", "value"),
        )

        id = Column(Integer, primary_key=True)
        name = Column(String(255, None))  # in mysql collation="utf8_bin"
        value = Column(String(255, collation=None))
        parent = Column(Integer, ForeignKey(f"{table}.name"))

    return Label


def update_labels(obj, labels: dict):
    old = {label.name: label for label in obj.labels}
    obj.labels.clear()
    for name, value in labels.items():
        if name in old:
            old[name].value = value
            obj.labels.append(old[name])
        else:
            obj.labels.append(obj.Label(name=name, value=value, parent=obj.name))


class User(Base):
    __tablename__ = "users"

    name = Column(String(255), primary_key=True, nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    description = Column(String(255), nullable=True, default="")
    full_name = Column(String(255), nullable=False)
    created = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )
    spec = Column(MutableDict.as_mutable(JSON), nullable=True)
    Label = make_label(__tablename__)
    labels = relationship(Label, cascade="all, delete-orphan")


class ChatSessionContext(Base):
    """Chat session context table CRUD"""

    __tablename__ = "session_context"

    name = Column(String(255), primary_key=True, nullable=False)
    description = Column(String(255), nullable=True, default="")
    username = Column(String(255), sqlalchemy.ForeignKey("users.name"), nullable=False)
    created = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )
    spec = Column(MutableDict.as_mutable(JSON), nullable=True)
    Label = make_label(__tablename__)
    labels = relationship(Label, cascade="all, delete-orphan")

    # Define the relationship with the 'Users' table
    user = relationship(User)


class DocumentCollection(Base):
    __tablename__ = "document_collections"

    name = Column(String(255), primary_key=True, nullable=False)
    description = Column(String(255), nullable=True, default="")
    created = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )
    spec = Column(MutableDict.as_mutable(JSON), nullable=True)
    Label = make_label(__tablename__)
    labels = relationship(Label, cascade="all, delete-orphan")
    owner_name = Column(String(255), sqlalchemy.ForeignKey("users.name"), nullable=True)

    owner = relationship(User)


class Document(Base):
    __tablename__ = "documents"
    _details_fields = ["doc_origin", "meta"]

    doc_uid = Column(String(255), primary_key=True, nullable=False)
    version = Column(String(255), primary_key=True, nullable=False)
    collection_name = Column(
        String(255), sqlalchemy.ForeignKey("document_collections.name"), nullable=False
    )
    title = Column(String(255), nullable=True)
    source = Column(String(255), nullable=True)
    doc_origin = Column(String(255), nullable=True)
    num_chunks = Column(Integer, nullable=True)
    created_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_update = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )
    meta = Column(JSON, nullable=True)

    collection = relationship(DocumentCollection)

    def __init__(
        self,
        doc_uid,
        version,
        collection_name,
        title,
        source,
        doc_origin=None,
        num_chunks=None,
        meta=None,
    ):
        self.doc_uid = doc_uid
        self.version = version
        self.collection_name = collection_name
        self.title = title
        self.source = source
        self.doc_origin = doc_origin
        self.num_chunks = num_chunks
        self.meta = meta


class Prompt(Base):
    __tablename__ = "prompts"
    _details_fields = ["arguments", "meta"]

    name = Column(String(255), primary_key=True, nullable=False)
    version = Column(String(255), primary_key=True, nullable=False)
    description = Column(String(255), nullable=True)
    text = Column(String(255), nullable=True)
    arguments = Column(JSON, nullable=True)
    meta = Column(JSON, nullable=True)
    created_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_update = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )
    usage = Column(JSON, nullable=True)

    def __init__(
        self,
        name,
        version,
        description=None,
        text=None,
        arguments=None,
        meta=None,
        usage=None,
    ):
        self.name = name
        self.version = version
        self.description = description
        self.text = text
        self.arguments = arguments
        self.meta = meta
        self.usage = usage
