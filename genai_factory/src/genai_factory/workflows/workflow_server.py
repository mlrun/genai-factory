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

from urllib.parse import urlparse

import uvicorn
import requests
import mlrun

from genai_factory.config import WorkflowServerConfig
from genai_factory.controller_client import ControllerClient
from genai_factory.schemas import WorkflowType
from genai_factory.sessions import SessionStore
from genai_factory.utils import logger
from genai_factory.workflows import Workflow


class WorkflowServer:
    def __init__(self, config: WorkflowServerConfig = None):
        self._project = None
        self._config = config or WorkflowServerConfig()
        self._controller_client = None
        self._session_store = None
        self._workflows: dict[str, Workflow] = {}

    @property
    def config(self) -> WorkflowServerConfig:
        return self._config

    @property
    def controller_client(self) -> ControllerClient:
        if not self._controller_client:
            self._set_controller_client()
        return self._controller_client

    def _set_controller_client(self):
        self._controller_client = ControllerClient(
            controller_url=self._config.controller_url,
            project_name=self._config.project_name,
            username=self._config.controller_username,
        )

    def set_config(self, config: WorkflowServerConfig):
        self._config = config
        logger.setLevel(config.log_level.upper())
        # reinitialize the controller client with the new config
        self._set_controller_client()
        self._session_store = SessionStore(self._controller_client)
        for workflow in self._workflows.values():
            workflow._server = None
            workflow._client = self._controller_client

    def add_workflow(
        self,
        name: str,
        workflow_type: WorkflowType,
        graph: list,
        version: str = "0.0.0",
        description: str = "",
        labels: dict = None,
    ):
        """Register a workflow for later build/deployment.

        :param name:           Unique workflow name.
        :param workflow_type:  Workflow type.
        :param graph:          Workflow graph (skeleton).
        :param version:        Optional workflow semantic version.
        :param description:    Optional textual description.
        :param labels:         Optional labels dictionary.
        :raises ValueError:    If a workflow with the same name already exists.
        """
        # Check if workflow already exists:
        if name in self._workflows:
            raise ValueError(f"The workflow '{name}' was already added to this server.")
        self._workflows[name] = Workflow(
            name=name,
            workflow_type=workflow_type,
            skeleton=graph,
            session_store=self._session_store,
            config=self._config,
            client=self.controller_client,
            version=version,
            description=description,
            labels=labels,
        )

    async def run_workflow(self, name: str, event):
        """Execute a registered workflow.

        :param name:   Workflow name to execute.
        :param event:  Input event payload.
        :return:       Workflow result.
        :raises ValueError: If the workflow name is not registered.
        """
        # Get the workflow object:
        if name not in self._workflows:
            raise ValueError(f"workflow {name} not found")

        # Run the workflow:
        return await self._workflows[name].run(event)

    def _build(self):
        """Build all registered workflows before deployment.

        :raises ValueError: If no workflows exist or config/session store are missing.
        """
        logger.info("Building workflows")

        # Make sure there are workflows to build:
        if not self._workflows:
            raise ValueError(
                "No workflows to build. Add at least one workflow via the `add_workflow` method before building."
            )

        # Initialize the controller client:
        self._set_controller_client()

        if not self._session_store or not self._config:
            raise ValueError(
                "Session store and configuration must be set before building workflows."
                " Make sure to set them via the `set_config` method."
            )
        for workflow in self._workflows.values():
            workflow.build(
                config=self._config,
                session_store=self._session_store,
            )

    def _commit(self):
        """ Commit the workflows to the controller.  """
        for workflow in self._workflows.values():
            workflow.set_deployment()
            self._controller_client.update_workflow(workflow.to_schema())

    def api_startup(self):
        """Startup hook executed when FastAPI initializes."""
        print("\nstartup event\n")

    def deploy(self, router=None, deployer=None, environment=None):
        """Build and deploy workflows based on the chosen backend.

        :param router:       FastAPI router (used when `deployer="fastapi"`).
        :param deployer:     Deployment backend ("nuclio" or "fastapi").
        :param environment:  Deployment environment label ("local" triggers commit before API start).
        """
        self._build()

        if deployer == "nuclio":
            print("Deploying nuclio")
            self.deploy_nuclio()
        else:
            print("Deploying fastapi")
            self.deploy_fastapi(router, environment)

    def deploy_fastapi(self, router, environment):
        """Deploy workflows as a FastAPI application.

        :param router:       Optional FastAPI router containing API routes.
        :param environment:  If "local", workflows are committed before launching the API.
        """
        from fastapi import FastAPI
        from fastapi.middleware.cors import CORSMiddleware

        if environment and environment == "local":
            self._commit()

        app = FastAPI()

        # Add CORS middleware, remove in production
        origins = ["*"]  # React app
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        extra = app.extra or {}
        extra["app_server"] = self
        app.extra = extra
        if router:
            router.add_event_handler("startup", self.api_startup)
            app.include_router(router)
        url = urlparse(self._config.deployment_url)
        uvicorn.run(app, host=url.hostname, port=url.port)

    def deploy_nuclio(self):
        """Deploy workflows as an MLRun Nuclio application.

        :raises ValueError: If MLRun is unreachable or workflow source URL is missing.
        """

        # validate mlrun and get/create mlrun project.
        self.validate_mlrun()
        # TODO: consider adding mlrun project migration
        project = self._project or self.init_project()
        print(f"Project Name: {project.name}")

        # TODO: validate mlrun project git source does not differ form gator git source

        # build image with workflow source code from git and config requirements
        requirements = getattr(self._config, "image_requirements", [])
        workflow_source_url = getattr(self._config, "workflow_source_url", project.source)
        if not workflow_source_url:
            raise ValueError(
                "Session store and configuration must be set before building workflows."
                " Make sure to set them via the `set_config` method."
            )
        project.set_source(
            workflow_source_url,
            pull_at_runtime=False
        )
        image = project.build_image(requirements=requirements).outputs.get("image")

        # set and deploy application runtime with the created image
        workflow_api_name = getattr(self._config, "workflow_api_name", "default")
        app = project.set_function(
            name=workflow_api_name,
            kind="application",
            image=image,
            with_repo=True
        )
        app.set_internal_application_port(8000)
        app.spec.command = "genai-factory"
        app.spec.args = [
            "run",
            "/home/mlrun_code/workflow.py",
            "--config-path",
            "/home/mlrun_code/workflow-config.yaml",
            "--deployer",
            "fastapi",
            "--environment",
            "remote"
        ]
        app.deploy(with_mlrun=True)

    def validate_mlrun(self) -> None:
        """Validate access to MLRun API (`/api/v1/healthz`).

        :raises ValueError: If `mlrun_api_url` is missing or health check fails.
        """
        api = (getattr(self._config, "mlrun_api_url", "") or "").rstrip("/")
        if not api:
            raise ValueError("mlrun_api_url is not set in the configuration.")
        health = f"{api}/api/v1/healthz"
        try:
            r = requests.get(health, timeout=5)
            r.raise_for_status()
        except Exception as e:
            raise ValueError(f"Could not reach MLRun at {health}: {e}")

    def init_project(self) -> mlrun.MlrunProject:
        """Create or retrieve the MLRun project associated with this server.

        :return: MLRun project instance.
        """
        project = mlrun.get_or_create_project(
            name=self._config.project_name,
            context=".",       # current repo context; used when packaging code
            user_project=False # set True if your MLRun is configured with user projects
        )
        self._project = project
        return project





