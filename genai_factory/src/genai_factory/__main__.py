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

import importlib.util
import os
import pathlib

import click
import dotenv

from genai_factory import WorkflowServerConfig
from genai_factory.api import router

# Load the environment variables:
_ROOT_PATH = pathlib.Path(__file__).parent.parent.parent
dotenv.load_dotenv(os.environ.get("MLRUN_GENAI_ENV_PATH", str(_ROOT_PATH / ".env")))
_USER_NAME = os.environ.get("MLRUN_GENAI_USER_NAME", "")
_IS_LOCAL_CONFIG = os.environ.get(
    "MLRUN_GENAI_IS_LOCAL_CONFIG", "0"
).lower().strip() in [
    "true",
    "1",
]
_CONFIG_PATH = os.environ.get("WORKFLOWS_CONFIG_PATH", None)


@click.group()
def cli():
    pass


@click.command(help="Run a workflows server initialized in a given path.")
@click.argument(
    "workflows-path",
    type=click.Path(exists=True, path_type=pathlib.Path),
    # help="Path to the workflow file"
)
@click.option(
    "-c",
    "--config-path",
    type=click.Path(exists=True, path_type=pathlib.Path),
    help="Path to a config file to use. Note: This option takes priority on both set configuration via the workflow "
    "server instance in code, and via path from environment variable.",
)
@click.option(
    "-r",
    "--runner",
    type=click.Choice(choices=["fastapi", "nuclio"]),
    default="fastapi",
    help="How to run the workflow/s.",
)
def run(
    workflows_path: pathlib.Path,
    config_path: pathlib.Path,
    runner: str,
):
    """
    Run given workflows from file.

    :param workflows_path: The workflows file path.
    :param config_path:    A configuration file path. Note: This option takes priority on both set configuration via
                           the workflow server instance in code, and via path from environment variable:

                           1. Command config
                           2. Env file config
                           3. Workflow server manual set config
    :param runner:         The runner to use, default is fastapi.
    """
    # Load the configuration if given:
    if config_path:
        click.echo(f"Loading configuration from: {config_path}")
        config = WorkflowServerConfig.from_yaml(config_path)
    else:
        # Initialize the global configuration:
        if _CONFIG_PATH:
            config = WorkflowServerConfig.from_yaml(_CONFIG_PATH)
        elif _IS_LOCAL_CONFIG:
            config = WorkflowServerConfig.local_config()
        else:
            config = WorkflowServerConfig()

    # Importing the workflows server instance:
    click.echo(f"Importing workflows server from: {workflows_path}")

    # import workflow_server from given path:

    # Load the module from the file path
    spec = importlib.util.spec_from_file_location("workflow_server", workflows_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    # Access the variable from the module
    workflow_server = module.workflow_server

    # Set the configuration:
    workflow_server.set_config(config=config)

    # Retrieve the desired object from the module
    click.echo(f"Running workflows using a '{runner}' runner...")
    workflow_server.deploy(router=router)


cli.add_command(run)


if __name__ == "__main__":
    cli()
