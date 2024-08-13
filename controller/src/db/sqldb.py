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

import datetime
import re
from typing import List, Optional

from sqlalchemy import (
    JSON,
    Column,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    UniqueConstraint,
)
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import (
    Mapped,
    declarative_base,
    declared_attr,
    mapped_column,
    relationship,
)

ID_LENGTH = 64
TEXT_LENGTH = 1024

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


class BaseSchema(Base):
    """
    Base class for all tables.
    We use this class to define common columns and methods for all tables.

    :arg  id: unique identifier for each entry.
    :arg  name: entry's name.
    :arg  description: The entry's description.

    The following columns are automatically added to each table:
    - created: The entry's creation date.
    - updated: The entry's last update date.
    - spec: A dictionary to store additional information.
    """

    __abstract__ = True

    @declared_attr
    def __tablename__(cls) -> str:
        # Convert CamelCase class name to snake_case table name
        return re.sub(r"(?<!^)(?=[A-Z])", "_", cls.__name__).lower()

    @declared_attr
    def Label(cls):
        return make_label(cls.__tablename__)

    @declared_attr
    def labels(cls):
        return relationship(cls.Label, cascade="all, delete-orphan")

    # Columns:
    id: Mapped[str] = mapped_column(String(ID_LENGTH), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    description: Mapped[Optional[str]]
    created: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )
    spec = Column(MutableDict.as_mutable(JSON), nullable=True)

    def __init__(self, id, name, spec, description=None, labels=None):
        self.id = id
        self.name = name
        self.spec = spec
        self.description = description
        self.labels = labels or []


class OwnerBaseSchema(BaseSchema):
    """
    Base class for all tables with owner.
    We use this class to define common columns and methods for all tables with owner.

    :arg  owner_id: The entry's owner's id.
    """

    __abstract__ = True
    owner_id: Mapped[Optional[str]] = mapped_column(
        String(ID_LENGTH), ForeignKey("user.id")
    )

    def __init__(self, id, name, spec, description=None, owner_id=None, labels=None):
        super().__init__(id, name, spec, description, labels)
        self.owner_id = owner_id


class VersionedBaseSchema(OwnerBaseSchema):
    """
    Base class for all versioned tables.
    We use this class to define common columns and methods for all versioned tables.

    :arg  version: The entry's version. This is the primary key for the table with id.
    """

    __abstract__ = True
    version: Mapped[str] = mapped_column(String(255), primary_key=True, default="")

    def __init__(
        self, id, name, spec, version, description=None, owner_id=None, labels=None
    ):
        super().__init__(id, name, spec, description, owner_id, labels)
        self.version = version


# Association table between users and projects for many-to-many relationship
user_project = Table(
    "user_project",
    Base.metadata,
    Column("user_id", ForeignKey("user.id")),
    Column("project_id", ForeignKey("project.id")),
    Column("project_version", ForeignKey("project.version")),
)

# Association table between models and prompt templates for many-to-many relationship
model_prompt_template = Table(
    "model_prompt_template",
    Base.metadata,
    Column("prompt_id", String(ID_LENGTH), ForeignKey("prompt_template.id")),
    Column(
        "prompt_version", String(TEXT_LENGTH), ForeignKey("prompt_template.version")
    ),
    Column("model_id", String(ID_LENGTH), ForeignKey("model.id")),
    Column("model_version", String(TEXT_LENGTH), ForeignKey("model.version")),
    Column("generation_config", JSON),
)

# Association table between documents and data sources (ingestions) for many-to-many relationship
ingestions = Table(
    "ingestions",
    Base.metadata,
    Column("document_id", String(ID_LENGTH), ForeignKey("document.id")),
    Column("document_version", String(TEXT_LENGTH), ForeignKey("document.version")),
    Column("data_source_id", String(ID_LENGTH), ForeignKey("data_source.id")),
    Column(
        "data_source_version", String(TEXT_LENGTH), ForeignKey("data_source.version")
    ),
    Column("extra_data", JSON),
)


class User(BaseSchema):
    """
    The User table which is used to define users.

    :arg    full_name:  The user's full name.
    :arg    email:      The user's email.
    """

    # Columns:
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships:

    # many-to-many relationship with projects:
    projects: Mapped[List["Project"]] = relationship(
        back_populates="users",
        secondary=user_project,
        primaryjoin="User.id == user_project.c.user_id",
        secondaryjoin="and_(Project.id == user_project.c.project_id,"
        " Project.version == user_project.c.project_version)",
        foreign_keys=[
            user_project.c.user_id,
            user_project.c.project_id,
            user_project.c.project_version,
        ],
    )
    # one-to-many relationship with sessions:
    sessions: Mapped[List["Session"]] = relationship(
        back_populates="user", foreign_keys="Session.owner_id"
    )

    def __init__(self, id, name, email, full_name, spec, description=None, labels=None):
        super().__init__(
            id=id, name=name, description=description, spec=spec, labels=labels
        )
        self.email = email
        self.full_name = full_name


class Project(VersionedBaseSchema):
    """
    The Project table which is used as a workspace. The other tables are associated with a project.
    """

    # Relationships:

    # many-to-many relationship with user:
    users: Mapped[List["User"]] = relationship(
        back_populates="projects",
        secondary=user_project,
        primaryjoin="and_(Project.id == user_project.c.project_id, Project.version == user_project.c.project_version)",
        secondaryjoin="User.id == user_project.c.user_id",
        foreign_keys=[
            user_project.c.user_id,
            user_project.c.project_id,
            user_project.c.project_version,
        ],
    )

    # one-to-many relationships:
    relationship_args = {"back_populates": "project", "cascade": "all, delete-orphan"}
    data_sources: Mapped[List["DataSource"]] = relationship(**relationship_args)
    datasets: Mapped[List["Dataset"]] = relationship(**relationship_args)
    models: Mapped[List["Model"]] = relationship(**relationship_args)
    prompt_templates: Mapped[List["PromptTemplate"]] = relationship(**relationship_args)
    documents: Mapped[List["Document"]] = relationship(**relationship_args)
    workflows: Mapped[List["Workflow"]] = relationship(**relationship_args)

    def __init__(
        self, id, name, spec, version, description=None, owner_id=None, labels=None
    ):
        super().__init__(
            id=id,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        update_labels(self, {"_GENAI_FACTORY": True})


class DataSource(VersionedBaseSchema):
    """
    The DataSource table which is used to define data sources for the project.

    :arg  project_id:       The project's id.
    :arg  data_source_type: The type of the data source.
                            Can be one of the values in controller.src.schemas.data_source.DataSourceType.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(String(ID_LENGTH), ForeignKey("project.id"))
    data_source_type: Mapped[str]

    # Relationships:

    # many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="data_sources")
    # many-to-many relationship with documents:
    documents: Mapped[List["Document"]] = relationship(
        back_populates="data_sources",
        secondary=ingestions,
        primaryjoin="and_(DataSource.id == ingestions.c.data_source_id,"
        " DataSource.version == ingestions.c.data_source_version)",
        secondaryjoin="and_(Document.id == ingestions.c.document_id,"
        " Document.version == ingestions.c.document_version)",
        foreign_keys=[
            ingestions.c.data_source_id,
            ingestions.c.data_source_version,
            ingestions.c.document_id,
            ingestions.c.document_version,
        ],
    )

    def __init__(
        self,
        id,
        name,
        spec,
        version,
        project_id,
        data_source_type,
        description=None,
        owner_id=None,
        labels=None,
    ):
        super().__init__(
            id=id,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id
        self.data_source_type = data_source_type


class Dataset(VersionedBaseSchema):
    """
    The Dataset table which is used to define datasets for the project.

    :arg  project_id:       The project's id.
    :arg  task:             The task of the dataset.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(String(ID_LENGTH), ForeignKey("project.id"))
    task: Mapped[Optional[str]]

    # Relationships:

    # Many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="datasets")

    def __init__(
        self,
        id,
        name,
        spec,
        version,
        project_id,
        task,
        description=None,
        owner_id=None,
        labels=None,
    ):
        super().__init__(
            id=id,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id
        self.task = task


class Model(VersionedBaseSchema):
    """
    The Model table which is used to define models for the project.

    :arg  project_id:       The project's id.
    :arg  model_type:       The type of the model. Can be one of the values in controller.src.schemas.model.ModelType.
    :arg  task:             The task of the model. For example, "classification", "text-generation", etc.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(String(ID_LENGTH), ForeignKey("project.id"))
    model_type: Mapped[str]
    task: Mapped[Optional[str]]

    # Relationships:

    # many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="models")
    # many-to-many relationship with prompt_templates:
    prompt_templates: Mapped[List["PromptTemplate"]] = relationship(
        back_populates="models",
        secondary=model_prompt_template,
        primaryjoin="and_(Model.id == model_prompt_template.c.model_id,"
        " Model.version == model_prompt_template.c.model_version)",
        secondaryjoin="and_(PromptTemplate.id == model_prompt_template.c.prompt_id,"
        " PromptTemplate.version == model_prompt_template.c.prompt_version)",
        foreign_keys=[
            model_prompt_template.c.model_id,
            model_prompt_template.c.model_version,
            model_prompt_template.c.prompt_id,
            model_prompt_template.c.prompt_version,
        ],
    )

    def __init__(
        self,
        id,
        name,
        spec,
        version,
        project_id,
        model_type,
        task,
        description=None,
        owner_id=None,
        labels=None,
    ):
        super().__init__(
            id=id,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id
        self.model_type = model_type
        self.task = task


class PromptTemplate(VersionedBaseSchema):
    """
    The PromptTemplate table which is used to define prompt templates for the project.
    Each prompt template is associated with a model.

    :arg    project_id:         The project's id.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(String(ID_LENGTH), ForeignKey("project.id"))

    # Relationships:

    # many-to-one relationship with the 'Project' table
    project: Mapped["Project"] = relationship(back_populates="prompt_templates")
    # many-to-many relationship with the 'Model' table
    models: Mapped[List["Model"]] = relationship(
        back_populates="prompt_templates",
        secondary=model_prompt_template,
        primaryjoin="and_(PromptTemplate.id == model_prompt_template.c.prompt_id,"
        " PromptTemplate.version == model_prompt_template.c.prompt_version)",
        secondaryjoin="and_(Model.id == model_prompt_template.c.model_id,"
        " Model.version == model_prompt_template.c.model_version)",
        foreign_keys=[
            model_prompt_template.c.prompt_id,
            model_prompt_template.c.prompt_version,
            model_prompt_template.c.model_id,
            model_prompt_template.c.model_version,
        ],
    )

    def __init__(
        self,
        id,
        name,
        spec,
        version,
        project_id,
        description=None,
        owner_id=None,
        labels=None,
    ):
        super().__init__(
            id=id,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id


class Document(VersionedBaseSchema):
    """
    The Document table which is used to define documents for the project. The documents are ingested into data sources.

    :arg    project_id:     The project's id.
    :arg    path:           The path to the document. Can be a remote file or a web page.
    :arg    origin:         The origin location of the document.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(String(ID_LENGTH), ForeignKey("project.id"))
    path: Mapped[str]
    origin: Mapped[Optional[str]]

    # Relationships:

    # many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="documents")
    # many-to-many relationship with ingestion:
    data_sources: Mapped[List["DataSource"]] = relationship(
        back_populates="documents",
        secondary=ingestions,
        primaryjoin="and_(Document.id == ingestions.c.document_id, Document.version == ingestions.c.document_version)",
        secondaryjoin="and_(DataSource.id == ingestions.c.data_source_id,"
        " DataSource.version == ingestions.c.data_source_version)",
        foreign_keys=[
            ingestions.c.document_id,
            ingestions.c.document_version,
            ingestions.c.data_source_id,
            ingestions.c.data_source_version,
        ],
    )

    def __init__(
        self,
        id,
        name,
        spec,
        version,
        project_id,
        path,
        origin,
        description=None,
        owner_id=None,
        labels=None,
    ):
        super().__init__(
            id=id,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id
        self.path = path
        self.origin = origin


class Workflow(VersionedBaseSchema):
    """
    The Workflow table which is used to define workflows for the project.
    All workflows are a DAG of steps, each with its dedicated task.

    :arg    project_id:     The project's id.
    :arg    workflow_type:  The type of the workflow.
                            Can be one of the values in controller.src.schemas.workflow.WorkflowType.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(String(ID_LENGTH), ForeignKey("project.id"))
    workflow_type: Mapped[str]

    # Relationships:

    # many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="workflows")
    # one-to-many relationship with sessions:
    sessions: Mapped[List["Session"]] = relationship(back_populates="workflow")

    def __init__(
        self,
        id,
        name,
        spec,
        version,
        project_id,
        workflow_type,
        description=None,
        owner_id=None,
        labels=None,
    ):
        super().__init__(
            id=id,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id
        self.workflow_type = workflow_type


class Session(OwnerBaseSchema):
    """
    The Chat Session table which is used to define chat sessions of an application workflow per user.

    :arg    workflow_id:    The workflow's id.
    """

    # Columns:
    workflow_id: Mapped[str] = mapped_column(
        String(ID_LENGTH), ForeignKey("workflow.id")
    )

    # Relationships:

    # Many-to-one relationship with workflows:
    workflow: Mapped["Workflow"] = relationship(back_populates="sessions")
    # Many-to-one relationship with users:
    user: Mapped["User"] = relationship(
        back_populates="sessions", foreign_keys="Session.owner_id"
    )

    def __init__(
        self, id, name, spec, workflow_id, description=None, owner_id=None, labels=None
    ):
        super().__init__(
            id=id,
            name=name,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.workflow_id = workflow_id
