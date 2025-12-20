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
    UniqueConstraint,
)
from sqlalchemy.ext.mutable import MutableDict, MutableList
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

#Todo: improve nullable of fields in each table and pydantic objects
def make_label(table):
    class Label(Base):
        __tablename__ = f"{table}_labels"
        __table_args__ = (
            UniqueConstraint("name", "parent", name=f"_{table}_labels_uc"),
            Index(f"idx_{table}_labels_name_value", "name", "value"),
        )

        uid = Column(Integer, primary_key=True)
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

    :arg uid:         Unique identifier for each entry.
    :arg name:        Entry's name.
    :arg description: The entry's description.

    The following columns are automatically added to each table:
    - created: The entry's creation date.
    - updated: The entry's last update date.
    - spec:    A dictionary to store additional information.
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
    uid: Mapped[str] = mapped_column(String(ID_LENGTH), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    description: Mapped[Optional[str]]
    created: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )
    spec = Column(MutableDict.as_mutable(JSON), nullable=True)

    def __init__(self, uid, name, spec, description=None, labels=None):
        self.uid = uid
        self.name = name
        self.spec = spec
        self.description = description
        self.labels = labels or []


class OwnerBaseSchema(BaseSchema):
    """
    Base class for all tables with owner.
    We use this class to define common columns and methods for all tables with owner.

    :arg owner_id: The entry's owner's id.
    """

    __abstract__ = True
    owner_id: Mapped[Optional[str]] = mapped_column(
        String(ID_LENGTH), ForeignKey("user.uid")
    )

    def __init__(self, uid, name, spec, description=None, owner_id=None, labels=None):
        super().__init__(uid, name, spec, description, labels)
        self.owner_id = owner_id


class VersionedOwnerBaseSchema(OwnerBaseSchema):
    """
    Base class for all versioned tables.
    We use this class to define common columns and methods for all versioned tables.

    :arg version: The entry's version. This is the primary key for the table with uid.
    """

    __abstract__ = True
    version: Mapped[str] = mapped_column(String(255), primary_key=True, default="")

    def __init__(
        self, uid, name, spec, version, description=None, owner_id=None, labels=None
    ):
        super().__init__(uid, name, spec, description, owner_id, labels)
        self.version = version


class ComparableBaseSchema(VersionedOwnerBaseSchema):
    """
    Base class for all Comparable tables.
    We use this class to define common columns and methods for all Comparable tables.

    :arg evaluation: The entry's evaluation list.
    """

    __abstract__ = True
    evaluations: Mapped[list[str]] = mapped_column(
        MutableList.as_mutable(JSON),
        default=list,
        server_default="[]"
    )

    def __init__(
        self, uid, name, spec, version, evaluations, description=None, owner_id=None, labels=None
    ):
        super().__init__(uid, name, spec, version, description, owner_id, labels)
        self.evaluations = evaluations


#Todo: check all relationships logic between tables


class User(BaseSchema):
    """
    The User table which is used to define users.

    :arg full_name: The user's full name.
    """

    # Columns:

    # Relationships:

    # one-to-many relationship with sessions:
    sessions: Mapped[List["Session"]] = relationship(
        back_populates="user", foreign_keys="Session.owner_id"
    )

    def __init__(
        self, uid, name, spec, description=None, labels=None
    ):
        super().__init__(
            uid=uid, name=name, description=description, spec=spec, labels=labels
        )


class Project(VersionedOwnerBaseSchema):
    """
    The Project table which is used as a workspace. The other tables are associated with a project.
    """

    # Relationships:

    # one-to-many relationships:
    relationship_args = {"back_populates": "project", "cascade": "all, delete-orphan"}
    data_sources: Mapped[List["DataSource"]] = relationship(**relationship_args)
    datasets: Mapped[List["Dataset"]] = relationship(**relationship_args)
    models: Mapped[List["Model"]] = relationship(**relationship_args)
    prompt: Mapped[List["Prompt"]] = relationship(**relationship_args)
    documents: Mapped[List["Document"]] = relationship(**relationship_args)
    workflows: Mapped[List["Workflow"]] = relationship(**relationship_args)
    step_configurations: Mapped[List["StepConfiguration"]] = relationship(**relationship_args)
    deployments: Mapped[List["Deployment"]] = relationship(**relationship_args)
    agent: Mapped[List["Agent"]] = relationship(**relationship_args)
    mcp_server: Mapped[List["McpServer"]] = relationship(**relationship_args)

    # fields:
    source: Mapped[str] = mapped_column(default="", server_default="")

    def __init__(
        self, uid, name, spec, version, source, description=None, owner_id=None, labels=None
    ):
        super().__init__(
            uid=uid,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.source = source
        update_labels(self, {"_GENAI_FACTORY": True})


class DataSource(VersionedOwnerBaseSchema):
    """
    The DataSource table which is used to define data sources for the project.

    :arg  project_id:       The project's id.
    :arg  data_source_type: The type of the data source.
                            Can be one of the values in genai_factory.schemas.data_source.DataSourceType.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("project.uid"),
        nullable=False,
        index=True
    )
    data_source_type: Mapped[str] = mapped_column()

    # Relationships:

    # many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="data_sources")

    def __init__(
        self,
        uid,
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
            uid=uid,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id
        self.data_source_type = data_source_type


class Dataset(VersionedOwnerBaseSchema):
    """
    The Dataset table which is used to define datasets for the project.

    :arg  project_id: The project's id.
    :arg  task:       The task of the dataset.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("project.uid"),
        nullable=False,
        index=True
    )
    task: Mapped[str] = mapped_column()
    path : Mapped[Optional[str]] = mapped_column()


    # Relationships:

    # many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="datasets")

    def __init__(
        self,
        uid,
        name,
        spec,
        version,
        project_id,
        task,
        description=None,
        owner_id=None,
        labels=None,
        path=None,
    ):
        super().__init__(
            uid=uid,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.path = path
        self.project_id = project_id
        self.task = task


class Model(VersionedOwnerBaseSchema):
    """
    The Model table which is used to define models for the project.

    :arg  project_id: The project's id.
    :arg  model_type: The type of the model. Can be one of the values in genai_factory.schemas.model.ModelType.
    :arg  task:       The task of the model. For example, "classification", "text-generation", etc.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("project.uid"),
        nullable=False,
        index=True
    )
    is_adapter: Mapped[bool] = mapped_column()
    task: Mapped[str] = mapped_column()



    # Relationships:
    # many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="models")

    relationship_args = {"back_populates": "model", "cascade": "all, delete-orphan"}
    # one-to-many relationship with deployments:
    deployments: Mapped[List["Deployment"]] = relationship(**relationship_args)

    def __init__(
        self,
        uid,
        name,
        spec,
        version,
        project_id,
        task,
        is_adapter,
        description=None,
        owner_id=None,
        labels=None,
    ):
        super().__init__(
            uid=uid,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id
        self.is_adapter = is_adapter
        self.task = task


class Prompt(VersionedOwnerBaseSchema):
    """
    The Prompt table which is used to define prompts for the project.
    Each prompt is associated with a project.

    :arg project_id: The project's id.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("project.uid"),
        nullable=False,
        index=True
    )
    format: Mapped[str] = mapped_column()

    # Relationships:

    # many-to-one relationship with the 'Project' table
    project: Mapped["Project"] = relationship(back_populates="prompt")

    def __init__(
        self,
        uid,
        name,
        spec,
        version,
        project_id,
        format,
        description=None,
        owner_id=None,
        labels=None,
    ):
        super().__init__(
            uid=uid,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id
        self.format = format


class Document(VersionedOwnerBaseSchema):
    """
    The Document table which is used to define documents for the project. The documents are ingested into data sources.

    :arg project_id: The project's id.
    :arg path:       The path to the document. Can be a remote file or a web page.
    :arg origin:     The origin location of the document.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("project.uid"),
        nullable=False,
        index=True
    )
    path: Mapped[str] = mapped_column()
    keywords: Mapped[list[str]] = mapped_column(
        MutableList.as_mutable(JSON),
        default=list,
        server_default="[]"
    )
    # Relationships:

    # many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="documents")

    def __init__(
        self,
        uid,
        name,
        spec,
        version,
        project_id,
        path,
        keywords,
        description=None,
        owner_id=None,
        labels=None,
    ):
        super().__init__(
            uid=uid,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id
        self.path = path
        self.keywords = keywords


class Workflow(VersionedOwnerBaseSchema):
    """
    The Workflow table which is used to define workflows for the project.
    All workflows are a DAG of steps, each with its dedicated task.

    :arg project_id:    The project's id.
    :arg workflow_type: The type of the workflow.
                        Can be one of the values in genai_factory.schemas.workflow.WorkflowType.
    :arg state:         the state of the workflow.
                        Can be on of the values in genai_factory.schemas.base.WorkflowState.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("project.uid"),
        nullable = False,
        index = True
    )

    workflow_type: Mapped[str] = mapped_column()
    state: Mapped[str] = mapped_column()

    # Relationships:

    relationship_args = {"back_populates": "workflow", "cascade": "all, delete-orphan"}
    # one-to-many relationship with step configuration:
    step_configurations: Mapped[List["StepConfiguration"]] = relationship(**relationship_args)
    # one-to-many relationship with deployments:
    deployments: Mapped[List["Deployment"]] = relationship(**relationship_args)
    # one-to-many relationship with schedules:
    schedules: Mapped[List["Schedule"]] = relationship(**relationship_args)
    # one-to-many relationship with runs:
    runs: Mapped[List["Run"]] = relationship(**relationship_args)



    # many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="workflows")
    # many-to-one relationship with sessions:
    sessions: Mapped[List["Session"]] = relationship(back_populates="workflow")

    def __init__(
        self,
        uid,
        name,
        spec,
        version,
        project_id,
        workflow_type,
        state,
        description=None,
        owner_id=None,
        labels=None,
    ):
        super().__init__(
            uid=uid,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id
        self.workflow_type = workflow_type
        self.state = state


class Agent(VersionedOwnerBaseSchema):
    """
    The Agent table which is used to define Agent for the project.

    :arg project_id:    The project's id.
    :arg agent_type: The type of the Agent.
                     Can be one of the values in genai_factory.schemas.Agent.AgentType.
    :arg state:      the state of the workflow.
                     Can be on of the values in genai_factory.schemas.base.WorkflowState.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("project.uid"),
        nullable = False,
        index = True
    )

    agent_type: Mapped[str] = mapped_column()
    state: Mapped[str] = mapped_column()

    # Relationships:

    relationship_args = {"back_populates": "agent", "cascade": "all, delete-orphan"}
    # one-to-many relationship with step configuration:
    step_configurations: Mapped[List["StepConfiguration"]] = relationship(**relationship_args)
    # one-to-many relationship with deployments:
    deployments: Mapped[List["Deployment"]] = relationship(**relationship_args)




    # many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="agent")

    def __init__(
        self,
        uid,
        name,
        spec,
        version,
        project_id,
        agent_type,
        state,
        description=None,
        owner_id=None,
        labels=None,
    ):
        super().__init__(
            uid=uid,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id
        self.agent_type = agent_type
        self.state = state

class McpServer(VersionedOwnerBaseSchema):
    """
    The MCP server table which is used to define MCP Server's for the project.

    :arg project_id: The project's id.
    :arg agent_type: The type of the MCP server.
                     Can be one of the values in genai_factory.schemas.McpServer.McpType.
    :arg state:      the state of the MCP server.
                     Can be on of the values in genai_factory.schemas.base.WorkflowState.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("project.uid"),
        nullable = False,
        index = True
    )

    mcp_type: Mapped[str] = mapped_column()
    state: Mapped[str] = mapped_column()

    # Relationships:

    relationship_args = {"back_populates": "mcp_server", "cascade": "all, delete-orphan"}
    # one-to-many relationship with step configuration:
    step_configurations: Mapped[List["StepConfiguration"]] = relationship(**relationship_args)
    # one-to-many relationship with deployments:
    deployments: Mapped[List["Deployment"]] = relationship(**relationship_args)

    # many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="mcp_server")

    def __init__(
        self,
        uid,
        name,
        spec,
        version,
        project_id,
        mcp_type,
        state,
        description=None,
        owner_id=None,
        labels=None,
    ):
        super().__init__(
            uid=uid,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id
        self.mcp_type = mcp_type
        self.state = state


class Session(VersionedOwnerBaseSchema):
    """
    The Chat Session table which is used to define chat sessions of an application workflow per user.

    :arg workflow_id: The workflow's id.
    """

    # Columns:
    workflow_id: Mapped[str] = mapped_column(
        String(ID_LENGTH), ForeignKey("workflow.uid")
    )

    # Relationships:

    # Many-to-one relationship with workflows:
    workflow: Mapped["Workflow"] = relationship(back_populates="sessions")
    # Many-to-one relationship with users:
    user: Mapped["User"] = relationship(
        back_populates="sessions", foreign_keys="Session.owner_id"
    )

    def __init__(
        self, uid, name, version, spec, workflow_id, description=None, owner_id=None, labels=None
    ):
        super().__init__(
            uid=uid,
            name=name,
            version=version,
            spec=spec,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.workflow_id = workflow_id

class StepConfiguration(VersionedOwnerBaseSchema):
    """
    The Step Configuration table which is used to define step configurations of steps.

    :arg workflow_id: The workflow's id.
    :arg project_id: The project's id.
    """

    # Columns:
    project_id: Mapped[str] = mapped_column(
        String(ID_LENGTH), ForeignKey("project.uid"),
        nullable = False,
        index = True
    )
    workflow_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("workflow.uid"),
        nullable = False,
        index = True
    )

    agent_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("agent.uid"),
        nullable = True,
        index = True
    )

    mcp_server_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("mcp_server.uid"),
        nullable = True,
        index = True
    )

    # Relationships:

    # many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="step_configurations")

    # Many-to-one relationship with workflows:
    workflow: Mapped["Workflow"] = relationship(back_populates="step_configurations")

    # Many-to-one relationship with workflows:
    agent: Mapped["Agent"] = relationship(back_populates="step_configurations")

    # Many-to-one relationship with workflows:
    mcp_server: Mapped["McpServer"] = relationship(back_populates="step_configurations")

    def __init__(
        self, uid, name, spec, version, workflow_id, project_id, agent_id, mcp_server_id, description=None, owner_id=None, labels=None
    ):
        super().__init__(
            uid=uid,
            name=name,
            spec=spec,
            version=version,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.project_id = project_id
        self.workflow_id = workflow_id
        self.agent_id = agent_id
        self.mcp_server_id = mcp_server_id

class Deployment(VersionedOwnerBaseSchema):
    """
    The Deployment table which is used to define deployments.

    :arg workflow_id: The workflow's id.
    :arg project_id: The project's id.
    :arg model_id: the model's id.
    :arg is_remote: if the deployment is a remote deployment by the builder or is managed by gaitor.
    :arg type: the deployments type.
    """

    # Columns:

    project_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("project.uid"),
        nullable = False,
        index = True
    )

    workflow_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("workflow.uid"),
        nullable = True,
        index = True
    )

    model_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("model.uid"),
        nullable = True,
        index = True
    )

    agent_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("agent.uid"),
        nullable = True,
        index = True
    )

    mcp_server_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("mcp_server.uid"),
        nullable = True,
        index = True
    )

    is_remote: Mapped[bool] = mapped_column()

    type: Mapped[str] = mapped_column()


    # Relationships:

    # many-to-one relationship with projects:
    project: Mapped["Project"] = relationship(back_populates="deployments")


    # Many-to-one relationship with workflows:
    workflow: Mapped["Workflow"] = relationship(back_populates="deployments")


    # Many-to-one relationship with model:
    model: Mapped["Model"] = relationship(back_populates="deployments")

    # Many-to-one relationship with agent:
    agent: Mapped["Agent"] = relationship(back_populates="deployments")

    # Many-to-one relationship with McpServer:
    mcp_server: Mapped["McpServer"] = relationship(back_populates="deployments")

    def __init__(
        self, uid, name, spec, version, workflow_id, project_id, model_id, agent_id,
            mcp_server_id, is_remote, type, description=None, owner_id=None, labels=None
    ):
        super().__init__(
            uid=uid,
            name=name,
            spec=spec,
            version=version,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.workflow_id = workflow_id
        self.project_id = project_id
        self.model_id = model_id
        self.agent_id = agent_id
        self.mcp_server_id = mcp_server_id
        self.is_remote = is_remote
        self.type = type

class Schedule(VersionedOwnerBaseSchema):
    """
    The Schedule table which is used to define schdules.

    :arg workflow_id: The workflow's id.
    """

    # Columns:
    workflow_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("workflow.uid"),
        nullable = True,
        index = True
    )

    # Relationships:

    relationship_args = {"back_populates": "schedule", "cascade": "all, delete-orphan"}
    # one-to-many relationship with step configuration:
    runs: Mapped[List["Run"]] = relationship(**relationship_args)
    # many-to-one relationship with workflows:
    workflow: Mapped["Workflow"] = relationship(back_populates="schedules")


    def __init__(
        self, uid, name, spec, version, workflow_id, description=None, owner_id=None, labels=None
    ):
        super().__init__(
            uid=uid,
            name=name,
            spec=spec,
            version=version,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.workflow_id = workflow_id

class Run(VersionedOwnerBaseSchema):
    """
    The Run table which is used to define runs.

    :arg workflow_id: The workflow's id.
    :arg schedule_id: the schedule's id.
    """

    # Columns:
    workflow_id: Mapped[str] = mapped_column(
        String(ID_LENGTH),
        ForeignKey("workflow.uid"),
        nullable=False,
        index=True
    )
    schedule_id: Mapped[str] = mapped_column(
        String(ID_LENGTH), ForeignKey("schedule.uid"),
        nullable = True,
        index = True
    )

    # Relationships:

    # Many-to-one relationship with workflows:
    workflow: Mapped["Workflow"] = relationship(back_populates="runs")
    schedule: Mapped["Schedule"] = relationship(back_populates="runs")


    def __init__(
        self, uid, name, spec, version, workflow_id, schedule_id, description=None, owner_id=None, labels=None
    ):
        super().__init__(
            uid=uid,
            name=name,
            spec=spec,
            version=version,
            description=description,
            owner_id=owner_id,
            labels=labels,
        )
        self.workflow_id = workflow_id
        self.schedule_id = schedule_id

