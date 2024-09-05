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

import click
import yaml
from tabulate import tabulate

from controller.src.api.utils import _send_to_application
from controller.src.config import config
from controller.src.db import client
from controller.src.schemas import (
    DataSource,
    Document,
    Project,
    QueryItem,
    User,
    Workflow,
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
    client.create_tables(True)

    # Create admin user:
    click.echo("Creating admin user")
    user_id = client.create_user(
        User(
            name="guest",
            email="guest@example.com",
            full_name="Guest User",
            is_admin=True,
        ),
        db_session=db_session,
    ).uid

    # Create project:
    click.echo("Creating default project")
    project_id = client.create_project(
        Project(
            name="default",
            description="Default Project",
            owner_id=user_id,
        ),
        db_session=db_session,
    ).uid

    # Create data source:
    click.echo("Creating default data source")
    client.create_data_source(
        DataSource(
            name="default",
            description="Default Data Source",
            owner_id=user_id,
            project_id=project_id,
            data_source_type="vector",
        ),
        db_session=db_session,
    )

    # Create Workflow:
    click.echo("Creating default workflow")
    client.create_workflow(
        Workflow(
            name="default",
            description="Default Workflow",
            owner_id=user_id,
            project_id=project_id,
            workflow_type="application",
            deployment="http://localhost:8000/api/workflows/default",
        ),
        db_session=db_session,
    )
    db_session.close()


@click.command("config")
def print_config():
    """Print the config as a yaml file"""
    click.echo("Running Config")
    click.echo(yaml.dump(config.dict()))


@click.command()
@click.argument("path", type=str)
@click.option("-p", "--project", type=str, help="Project name", default="default")
@click.option("-n", "--name", type=str, help="Document name", default=None)
@click.option("-l", "--loader", type=str, help="Type of data loader")
@click.option(
    "-m", "--metadata", type=(str, str), multiple=True, help="Metadata Key value pair"
)
@click.option("-v", "--version", type=str, help="document version")
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
    project = client.get_project(project_name=project, db_session=db_session)
    data_source = client.list_data_sources(
        project_id=project.uid, name=data_source, db_session=db_session
    )[0]

    # Create document from path:
    document = Document(
        name=name or path,
        version=version,
        path=path,
        owner_id=data_source.owner_id,
        project_id=project.uid,
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
        "database_kwargs": data_source.database_kwargs,
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

    project = client.get_project(project_name=project, db_session=db_session)
    # Getting the workflow:
    workflow = client.list_workflows(
        project_id=project.uid, name=workflow_name, db_session=db_session
    )[0]
    path = workflow.get_infer_path()

    query = QueryItem(
        question=question,
        session_name=session,
        filter=filter,
        data_source=data_source,
    )

    data = {
        "item": query.dict(),
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
@click.option("-e", "--email", type=str, help="email filter")
def list_users(user, email):
    """
    List all the users in the database

    :param user:  Username filter
    :param email: Email filter
    """
    click.echo("Running List Users")

    data = client.list_users(email, user, output_mode="short")
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
        output_mode="short",
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
    click.echo("Running Create or Update Collection")
    labels = fill_params(labels)

    db_session = client.get_db_session()
    # check if the collection exists, if it does, update it, otherwise create it
    project = client.get_project(project_name=project, db_session=db_session)
    data_source = client.list_data_sources(
        project_id=project.uid,
        data_source_name=name,
        db_session=db_session,
    )

    if data_source is not None:
        client.update_data_source(
            db_session=db_session,
            collection=DataSource(
                project_id=project.uid,
                name=name,
                description=description,
                data_source_type=source_type,
                labels=labels,
            ),
        ).with_raise()
    else:
        client.create_data_source(
            db_session=db_session,
            data_source=DataSource(
                project_id=project.uid,
                name=name,
                description=description,
                owner_name=owner,
                data_source_type=source_type,
                labels=labels,
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


def fill_params(params, params_dict=None) -> dict:
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

cli.add_command(update)
update.add_command(update_data_source)

if __name__ == "__main__":
    cli()
