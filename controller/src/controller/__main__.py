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
#
# main file with cli commands using python click library
# include two click commands: 1. data ingestion (using the data loader), 2. query (using the agent)
import json
from typing import Optional

import click
import yaml
from tabulate import tabulate

from controller.api.utils import _send_to_application
from controller.config import config
from controller.db import client

from genai_factory.schemas import (
    DataSource,
    Document,
    Project,
    QueryItem,
    User,
    DataSourceType,
    Dataset,
    Model,
    StepConfiguration,
    Deployment, DeploymentType,
    Schedule,
    Run,
    Status,
    Agent, AgentType,
    WorkflowState,
    McpServer, McpType, Workflow, WorkflowType
)


@click.group()
def cli():
    pass


# click command for initializing the database tables
@click.command()
def initdb():
    """
    Initialize the database tables (delete old tables).
    """
    click.echo("Running Init DB")
    db_session = client.get_db_session()
    client.create_database(True)

    # Create admin user:
    click.echo("Creating guest user")
    guest_id = client.create_user(
        User(
            name="guest",
            extra_data={},
        ),
        db_session=db_session,
    ).uid
    click.echo("Creating admin user")
    admin_id = client.create_user(
        User(
            name="admin",
            extra_data={},
        ),
        db_session=db_session,
    ).uid

    # Create project:
    click.echo("Creating default project")
    project_id = client.create_project(
        Project(
            name="default",
            description="Default Project",
            owner_id=guest_id,
            source="default",
        ),
        db_session=db_session,
    ).uid

    # Create data source:
    click.echo("Creating default data source")
    client.create_data_source(
        DataSource(
            name="default",
            description="Default Data Source",
            owner_id=guest_id,
            project_id=project_id,
            data_source_type=DataSourceType.VECTOR,
        ),
        db_session=db_session,
    )

    # Create data set:
    click.echo("Creating default data set")
    client.create_dataset(
        Dataset(
            name="default",
            description="Default Data Set",
            owner_id=guest_id,
            project_id=project_id,
            path = "",
            producer = {}
        ),
        db_session=db_session,
    )

    # Create model:
    click.echo("Creating default model")
    client.create_model(
        Model(
            name="default",
            description="Default Data Set",
            owner_id=guest_id,
            project_id=project_id,
            is_adapter = False,
            producer= {},
            source="default",
        ),
        db_session=db_session,
    )

    # create deployment
    click.echo("Creating default deployment")
    client.create_deployment(
        Deployment(
            name="default",
            description="Default Step Configuration",
            owner_id=guest_id,
            project_id=project_id,
            model_id=project_id,
            is_remote=False,
            type=DeploymentType.MODEL,
            status={},
            configuration={}
        ),
        db_session=db_session,
    )

    # create schedule
    click.echo("Creating default deployment")
    client.create_schedule(
        Schedule(
            name="default",
            description="Default Schedule",
            owner_id=guest_id,
            configuration={},
            status={}
        ),
        db_session=db_session,
    )

    # create run
    click.echo("Creating default run")
    client.create_run(
        Run(
            name="default",
            description="Default Schedule",
            owner_id=guest_id,
            workflow_id=project_id,
            configuration={},
            status=Status.RUNNING,
            outputs={},
        ),
        db_session=db_session,
    )

    # create workflow
    click.echo("Creating default workflow")
    client.create_workflow(
        Workflow(
            name="default_workflow",
            description="Default Workflow for init",
            owner_id=guest_id,
            project_id=project_id,
            configuration={},
            type_kwargs={},
            structure={},
            state=WorkflowState.DRAFT,
            workflow_type=WorkflowType.APPLICATION,
            branch="",
        ),
        db_session=db_session,
    )

    # create agent
    click.echo("Creating default agent")
    client.create_agent(
        Agent(
            name="default",
            description="Default Agent",
            owner_id=guest_id,
            project_id=project_id,
            configuration={},
            type_kwargs={},
            structure={},
            state=WorkflowState.DRAFT,
            agent_type=AgentType.SINGLE,
            branch="",
        ),
        db_session=db_session,
    )

    # create Mcp
    click.echo("Creating default Mcp Server")
    client.create_mcp_server(
        McpServer(
            name="default",
            description="Default Schedule",
            owner_id=guest_id,
            project_id=project_id,
            configuration={},
            type_kwargs={},
            structure={},
            mcp_type=McpType.GAITOR,
            state=WorkflowState.DRAFT,
            branch="",
        ),
        db_session=db_session,
    )

    # create step configuration
    click.echo("Creating default step configuration")
    client.create_step_configuration(
        StepConfiguration(
            name="default",
            description="Default Step Configuration",
            owner_id=guest_id,
            project_id=project_id,
            branch="default",
            step_name="default",
            workflow_id=project_id,
        ),
        db_session=db_session,
    )
    db_session.close()



@click.command("config")
def print_config():
    """Print the config as a yaml file"""
    click.echo("Running Config")
    click.echo(yaml.dump(config.model_dump()))


@click.command()
@click.argument("path", type=str)
@click.option("-p", "--project", type=str, help="Project name", default="default")
@click.option("-n", "--name", type=str, help="Document name", default=None)
@click.option("-l", "--loader", type=str, help="Type of data loader")
@click.option(
    "-m", "--metadata", type=(str, str), multiple=True, help="Metadata Key value pair"
)
@click.option("-v", "--version", type=str, help="document version", default="")
@click.option("-d", "--data-source", type=str, help="Data source name")
@click.option(
    "-f", "--from-file", is_flag=True, help="Take the document paths from the file"
)
def ingest(path, project, name, loader, metadata, version, data_source, from_file):
    """
    Ingest data into the data source.

    :param path:        Path to the document
    :param project:     The project name to which the document belongs.
    :param name:        Name of the document
    :param loader:      Type of data loader, web, .csv, .md, .pdf, .txt, etc.
    :param metadata:    Metadata Key value pair labels
    :param version:     Version of the document
    :param data_source: Data source name
    :param from_file:   Take the document paths from the file
    """
    db_session = client.get_db_session()
    project = client.get_project(name=project, db_session=db_session)
    data_source = client.get_data_source(
        project_id=project.uid, name=data_source, db_session=db_session
    )

    # Create document from path:
    document = Document(
        name=name or path,
        version=version,
        path=path,
        owner_id=data_source.owner_id,
        project_id=project.uid,
        ingestions=[data_source.owner_id]
    )

    # Add document to the database:
    response = client.create_document(
        document=document,
        db_session=db_session,
    )
    document = response.to_dict(to_datestr=True)

    # Send ingest to application:
    params = {
        "loader": loader,
        "from_file": from_file,
    }

    data = {
        "document": document,
        "kwargs": data_source.kwargs,
    }

    if metadata:
        params["metadata"] = json.dumps({metadata[0]: metadata[1]})

    click.echo(f"Running Data Ingestion from: {path} with loader: {loader}")
    response = _send_to_application(
        path=f"data_sources/{data_source.name}/ingest",
        method="POST",
        data=json.dumps(data),
        params=params,
    )
    if response["status"] == "ok":
        click.echo("Ingestion completed successfully")
    else:
        click.echo("Ingestion failed")


@click.command()
@click.argument("question", type=str)
@click.option("-p", "--project", type=str, default="default", help="Project name")
@click.option(
    "-n", "--workflow-name", type=str, default="default", help="Workflow name"
)
@click.option(
    "-f",
    "--filter",
    type=(str, str),
    multiple=True,
    help="Search filter Key value pair",
)
@click.option("-c", "--data-source", type=str, help="Data Source name")
@click.option("-u", "--user", type=str, help="Username", default="guest")
@click.option("-s", "--session", type=str, help="Session ID")
def infer(
    question: str, project: str, workflow_name: str, filter, data_source, user, session
):
    """
    Run a chat query on the data source

    :param question:      The question to ask
    :param project:       The project name
    :param workflow_name: The workflow name
    :param filter:        Filter Key value pair
    :param data_source:   Data source name
    :param user:          The name of the user
    :param session:       The session name
    """
    db_session = client.get_db_session()

    project = client.get_project(name=project, db_session=db_session)
    # Getting the workflow:
    workflow = client.get_workflow(
        project_id=project.uid, name=workflow_name, db_session=db_session
    )
    path = workflow.get_infer_path()

    query = QueryItem(
        question=question,
        session_name=session,
        filter=filter,
        data_source=data_source,
    )

    data = {
        "item": query.model_dump(),
        "workflow": workflow.to_dict(short=True),
    }
    headers = {"x_username": user} if user else {}

    # Sent the event to the application's workflow:
    response = _send_to_application(
        path=path,
        method="POST",
        data=json.dumps(data),
        headers=headers,
    )

    result = response["data"]
    click.echo(result["answer"])
    click.echo(sources_to_text(result["sources"]))


@click.group()
def list():
    """List the different objects in the database (by category)"""
    pass


@click.group()
def update():
    """Create or update an object in the database"""
    pass


@click.command("users")
@click.option("-u", "--user", type=str, help="user name filter")
def list_users(user):
    """
    List all the users in the database

    :param user:  Username filter
    """
    click.echo("Running List Users")

    data = client.list_users(user, output_mode="short")
    table = format_table_results(data)
    click.echo(table)

@click.command("projects")
def list_projects():
    """
    List all the projects in the database

    """
    click.echo("Running List Users")

    data = client.list_projects(output_mode="short")
    table = format_table_results(data)
    click.echo(table)

@click.command("documents")
def list_documents():
    """
    List all the documents in the database

    """
    click.echo("Running List Documents")

    data = client.list_documents(output_mode="short")
    table = format_table_results(data)
    click.echo(table)

@click.command("step-configurations")
def list_step_configurations():
    """
    List all the step configurations in the database

    """
    click.echo("Running List Step Configurations")

    data = client.list_step_configurations(output_mode="short")
    table = format_table_results(data)
    click.echo(table)





@click.command("data-sources")
@click.option("-o", "--owner", type=str, help="owner filter")
@click.option("-p", "--project", type=str, help="project filter")
@click.option("-v", "--version", type=str, help="version filter")
@click.option("-t", "--source-type", type=str, help="data source type filter")
@click.option(
    "-m", "--metadata", type=(str, str), multiple=True, help="metadata filter"
)
def list_data_sources(owner, project, version, source_type, metadata):
    """
    List all the data sources in the database

    :param owner:       Owner filter
    :param project:     Project filter
    :param version:     Version filter
    :param source_type: Data source type filter
    :param metadata:    Metadata filter (labels)
    """
    click.echo("Running List Collections")
    if owner:
        owner = client.get_user(username=owner).uid
    if project:
        project = client.get_project(project_name=project).uid

    data = client.list_data_sources(
        owner_id=owner,
        project_id=project,
        version=version,
        data_source_type=source_type,
        labels_match=metadata,
        output_mode="raw",
    )
    table = format_table_results(data)
    click.echo(table)


@click.command("data-source")
@click.argument("name", type=str)
@click.option("-p", "--project", type=str, help="project name", default="default")
@click.option("-o", "--owner", type=str, help="owner name")
@click.option("-d", "--description", type=str, help="collection description")
@click.option("-c", "--source-type", type=str, help="data source type")
@click.option(
    "-l", "--labels", multiple=True, default=[], help="metadata labels filter"
)
def update_data_source(name, project, owner, description, source_type, labels):
    """
    Create or update a data source in the database

    :param name:        Data source name
    :param project:     Project name
    :param owner:       Owner name
    :param description: Data source description
    :param source_type: Type of data source
    :param labels:      Metadata labels
    """
    owner = owner or "guest"
    click.echo("Running Create or Update Collection")
    labels = fill_params(labels)

    db_session = client.get_db_session()
    project = client.get_project(project_name=project, db_session=db_session)

    client.update_data_source(
        db_session=db_session,
        collection=DataSource(
            project_id=project.uid,
            name=name,
            description=description,
            data_source_type=source_type,
            labels=labels,
            owner_id=client.get_user(username=owner).uid,
        ),
    ).with_raise()


@click.command("sessions")
@click.option("-u", "--user", type=str, help="user name filter")
@click.option("-l", "--last", type=int, default=0, help="last n sessions")
@click.option("-c", "--created", type=str, help="created after date")
def list_sessions(user, last, created):
    """
    List chat sessions

    :param user:    Username filter
    :param last:    Last n sessions
    :param created: Created after date
    """
    click.echo("Running List Sessions")

    if user:
        user = client.get_user(user_name=user).uid
    data = client.list_sessions(
        user_id=user, created_after=created, last=last, output_mode="short"
    )
    table = format_table_results(data)
    click.echo(table)


def sources_to_text(sources) -> str:
    """
    Convert a list of sources to a text string.

    :param sources: List of sources

    :return: Text string
    """
    if not sources:
        return ""
    return "\nSource documents:\n" + "\n".join(
        f"- {get_title(source)} ({source['source']})" for source in sources
    )


def sources_to_md(sources) -> str:
    """
    Convert a list of sources to a markdown string.

    :param sources: List of sources

    :return: Markdown string
    """
    if not sources:
        return ""
    sources = {
        source.metadata["source"]: get_title(source.metadata) for source in sources
    }
    return "\n**Source documents:**\n" + "\n".join(
        f"- [{title}]({url})" for url, title in sources.items()
    )


def get_title(metadata) -> str:
    """
    Get the title from the metadata.

    :param metadata: Metadata dictionary

    :return: Title string
    """
    if "chunk" in metadata:
        return f"{metadata.get('title', '')}-{metadata['chunk']}"
    if "page" in metadata:
        return f"{metadata.get('title', '')} - page {metadata['page']}"
    return metadata.get("title", "")


def fill_params(params, params_dict=None) -> Optional[dict]:
    """
    Fill the parameters dictionary from a list of key=value strings.

    :param params:      List of key=value strings
    :param params_dict: Dictionary to fill

    :return: Filled dictionary
    """
    params_dict = params_dict or {}
    for param in params:
        i = param.find("=")
        if i == -1:
            continue
        key, value = param[:i].strip(), param[i + 1 :].strip()
        if key is None:
            raise ValueError(f"cannot find param key in line ({param})")
        params_dict[key] = value
    if not params_dict:
        return None
    return params_dict


def format_table_results(table_results):
    """
    Format the table results as a printed table.

    :param table_results: Table results dictionary

    :return: Formatted table string
    """
    return tabulate(table_results, headers="keys", tablefmt="fancy_grid")


cli.add_command(ingest)
cli.add_command(infer)
cli.add_command(initdb)
cli.add_command(print_config)

cli.add_command(list)
list.add_command(list_users)
list.add_command(list_data_sources)
list.add_command(list_sessions)
list.add_command(list_projects)
list.add_command(list_documents)

cli.add_command(update)
update.add_command(update_data_source)

if __name__ == "__main__":
    cli()
