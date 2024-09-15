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

from genai_factory import logger
from genai_factory.config import WorkflowServerConfig
from genai_factory.controller_client import ControllerClient
from genai_factory.schemas import WorkflowType
from genai_factory.sessions import SessionStore
from genai_factory.workflows import Workflow


class WorkflowServer:
    def __init__(self, config: WorkflowServerConfig = None):
        self._config = config or WorkflowServerConfig()
        self._controller_client = None
        self._session_store = SessionStore(self._config)
        self._workflows: dict[str, Workflow] = {}

    @property
    def config(self) -> WorkflowServerConfig:
        return self._config

    @property
    def controller_client(self) -> ControllerClient:
        if not self._controller_client:
            self._controller_client = ControllerClient(
                controller_url=self._config.controller_url,
                project_name=self._config.project_name,
                username=self._config.controller_username,
            )
        return self._controller_client

    def set_config(self, config: WorkflowServerConfig):
        self._config = config
        self._session_store = SessionStore(self._config)
        for workflow in self._workflows.values():
            workflow._server = None

    def add_workflow(
        self,
        name: str,
        workflow_type: WorkflowType,
        graph: list,
        version: str = "0.0.0",
        description: str = "",
        labels: dict = None,
    ):
        # Check if workflow already exists:
        if name in self._workflows:
            raise ValueError(f"The workflow '{name}' was already added to this server.")
        workflow = Workflow(
            name=name,
            workflow_type=workflow_type,
            skeleton=graph,
            session_store=self._session_store,
            config=self._config,
            version=version,
            description=description,
            labels=labels,
        )
        self._workflows[name] = workflow

    def run_workflow(self, name: str, event):
        # Get the workflow object:
        if name not in self._workflows:
            raise ValueError(f"workflow {name} not found")
        workflow = self._workflows[name]

        # Run the workflow:
        return workflow.run(event)

    def _build(self):
        logger.info("Building workflows")

        # Make sure there are workflows to build:
        if not self._workflows:
            raise ValueError(
                "No workflows to build. Add at least one workflow via the `add_workflow` method before building."
            )

        # Initialize the controller client:
        self._controller_client = ControllerClient(
            controller_url=self._config.controller_url,
            project_name=self._config.project_name,
            username=self._config.controller_username,
        )

        for workflow in self._workflows.values():
            workflow.build()

    def _commit(self):
        """
        Commit the workflows to the controller.
        """
        for workflow in self._workflows.values():
            self._controller_client.update_workflow(workflow.to_schema())

    def api_startup(self):
        print("\nstartup event\n")

    def deploy(self, router=None):
        self._build()
        self._commit()
        from fastapi import FastAPI
        from fastapi.middleware.cors import CORSMiddleware

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
        return app