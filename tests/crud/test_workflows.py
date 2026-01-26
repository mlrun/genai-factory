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
from tests.base_api_test import BaseAPITest


class TestWorkflows(BaseAPITest):

    @property
    def resource(self):
        return "workflows"

    def create_payload(self, project, owner):
        return {
            "name": "workflow-1",
            "description": "workflow",
            "owner_id": owner["uid"],
            "project_id": project["uid"],
            "configuration": {},
            "type_kwargs": {},
            "structure": {},
            "state": "draft",
            "workflow_type": "application",
            "branch": "",
        }

    def update_payload(self, project, owner):
        return {
            **self.create_payload(project, owner),
            "description": "updated workflow",
        }

    def test_workflow_with_step_configurations(self, client, project, owner):
        """Test creating workflow with embedded step configurations."""
        payload = {
            "name": "workflow-with-steps",
            "description": "Test workflow",
            "owner_id": owner["uid"],
            "project_id": project["uid"],
            "workflow_type": "application",
            "state": "draft",
            "configuration": {},
            "type_kwargs": {},
            "structure": {},
            "branch": "main",
            "step_configurations": [
                {
                    "name": "step-config-1",
                    "step_name": "SessionLoader",
                    "branch": "default",
                    "kwargs": {"timeout": 30}
                },
                {
                    "name": "step-config-2",
                    "step_name": "Guardrail",
                    "branch": "default",
                    "kwargs": {"strict": True}
                }
            ]
        }
        try:
            r = client.post(f"/api/projects/{project['name']}/workflows", json=payload)
            assert r.status_code == 200
            assert r.json()["success"] is True

            # Verify step configurations are stored
            r2 = client.get(f"/api/projects/{project['name']}/workflows/workflow-with-steps")
            data = r2.json()["data"]
            assert len(data["step_configurations"]) == 2
            assert data["step_configurations"][0]["step_name"] == "SessionLoader"
        finally:
            # Cleanup
            client.delete(f"/api/projects/{project['name']}/workflows/workflow-with-steps")

    def test_update_workflow_step_configurations(self, client, project, owner):
        """Test updating step configurations in a workflow."""
        # Create workflow
        payload = {
            "name": "workflow-update-steps",
            "owner_id": owner["uid"],
            "project_id": project["uid"],
            "workflow_type": "application",
            "state": "draft",
            "configuration": {},
            "type_kwargs": {},
            "structure": {},
            "branch": "main",
            "step_configurations": [
                {"name": "config-1", "step_name": "Step1", "branch": "default", "kwargs": {}}
            ]
        }
        try:
            client.post(f"/api/projects/{project['name']}/workflows", json=payload)

            # Update with new step configurations
            update_payload = {
                **payload,
                "step_configurations": [
                    {"name": "config-1", "step_name": "Step1", "branch": "default", "kwargs": {"updated": True}},
                    {"name": "config-2", "step_name": "Step2", "branch": "default", "kwargs": {}}
                ]
            }
            r = client.put(
                f"/api/projects/{project['name']}/workflows/workflow-update-steps",
                json=update_payload
            )
            assert r.status_code == 200

            # Verify update
            r2 = client.get(f"/api/projects/{project['name']}/workflows/workflow-update-steps")
            data = r2.json()["data"]
            assert len(data["step_configurations"]) == 2
            assert data["step_configurations"][0]["kwargs"]["updated"] is True
        finally:
            # Cleanup
            client.delete(f"/api/projects/{project['name']}/workflows/workflow-update-steps")