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

import os
from typing import List, Union

import mlrun.serving as mlrun_serving
from mlrun.utils import get_caller_globals

from genai_factory.config import WorkflowServerConfig
from genai_factory.controller_client import ControllerClient
from genai_factory.schemas import APIDictResponse, Deployment, WorkflowType
from genai_factory.schemas import Workflow as WorkflowSchema
from genai_factory.sessions import SessionStore


class Workflow:
    def __init__(
        self,
        name: str,
        version: str,
        workflow_type: WorkflowType,
        skeleton: Union[List[Union[mlrun_serving.states.FlowStep, dict]], dict],
        session_store: SessionStore,
        config: WorkflowServerConfig,
        client: ControllerClient,
        description: str = "",
        labels: dict = None,
        deployment: str = None,
    ):
        # Validate the skeleton:
        if not skeleton:
            raise ValueError("The workflow skeleton must not be empty")

        # Store parameters:
        self._name = name
        self._id = None
        self._version = version
        self._workflow_type = workflow_type
        self._skeleton = skeleton
        self._session_store = session_store
        self._config = config
        self._labels = labels
        self._description = description
        self._deployment = deployment
        self._client = client

        # Prepare future instances:
        self._graph = None
        self._server = None

    def to_schema(self) -> WorkflowSchema:
        return WorkflowSchema(
            owner_id=self._client.owner_id,
            project_id=self._client.project_id,
            name=self._name,
            version=self._version,
            workflow_type=self._workflow_type,
            configuration=self.get_config(),
            graph=self._graph.to_dict(),
            labels=self._labels,
            description=self._description,
            # deployment=self._deployment,
        )

    def get_id(self):
        return self._id

    def set_deployment(self):
        self._deployment = os.path.join(
            self._config.deployment_url, f"api/workflows/{self._name}/infer"
        )
        self._client.update_deployment(
            Deployment(
                name=self._name,
                project_id=self._client.project_id,
                owner_id=self._client.owner_id,
                version=self._version,
                deployment_type="workflow",
                address=self._deployment,
                labels=self._labels,
                description="deployment of " + self._description
                if self._description
                else self._name + " deployment",
            )
        )

    def get_config(self):
        return self._config.workflows_kwargs.get(self._name, {})

    def build(self, config: WorkflowServerConfig, session_store: SessionStore):
        self._config = config
        self._session_store = session_store
        steps_config = self._config.workflows_kwargs.get(self._name, {}).get(
            "steps", {}
        )
        if isinstance(self._skeleton, list):
            self._graph = mlrun_serving.states.RootFlowStep()
            last_step = self._graph
            for step in self._skeleton:
                if isinstance(step, dict):
                    step_name = step.get("name", step["class_name"])
                    if step_name in getattr(steps_config, "steps", {}):
                        step.update(steps_config["steps"][step_name])
                    last_step = last_step.to(**step)
                else:
                    step_name = step.name
                    if step_name in getattr(steps_config, "steps", {}):
                        step.class_args = steps_config["steps"][step_name]
                    last_step = last_step.to(step)
            last_step.respond()
            return

        # Skeleton is a graph dictionary:
        self._graph = mlrun_serving.states.RootFlowStep.from_dict(self._skeleton)
        for step in self._graph:
            if step.name in getattr(steps_config, "steps", {}):
                step.class_args = steps_config["steps"][step.name]

    @property
    def server(self) -> mlrun_serving.GraphServer:
        if self._server is None:
            namespace = get_caller_globals()
            server = mlrun_serving.create_graph_server(
                graph=self._graph,
                parameters={},
                verbose=self._config.verbose,
                graph_initializer=self.graph_initializer,
            )
            server.init_states(context=None, namespace=namespace)
            server.init_object(namespace)
            self._server = server
            return server
        return self._server

    def graph_initializer(self, server: mlrun_serving.GraphServer):
        context = server.context

        def register_prompt(
            name, template, description: str = None, llm_args: dict = None
        ):
            if not hasattr(context, "prompts"):
                context.prompts = {}
            context.prompts[name] = (template, llm_args)

        if getattr(context, "_config", None) is None:
            context._config = self._config
        if getattr(context, "session_store", None) is None:
            context.session_store = self._session_store

    def run(self, event, db_session=None):
        # todo: pass sql db_session to steps via context or event
        server = self.server
        try:
            resp = server.test("", body=event)
        except Exception as e:
            server.wait_for_completion()
            raise e

        return APIDictResponse(
            success=True,
            data={
                "answer": resp.results["answer"],
                "sources": resp.results["sources"],
                "returned_state": {},
            },
        )
