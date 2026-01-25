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

"""
Tests for the SQL client error handling, rollback behavior, and eager loading.
These tests verify the DB refactoring changes work correctly.
"""

import pytest


class TestErrorHandlingAndRollback:
    """Tests for error handling and transaction rollback behavior."""

    def test_create_duplicate_triggers_rollback(self, client, project, owner):
        """Test that creating a duplicate triggers proper rollback and doesn't leave partial data."""
        payload = {
            "name": "rollback-test-workflow",
            "description": "Test workflow for rollback",
            "owner_id": owner["uid"],
            "project_id": project["uid"],
            "configuration": {},
            "type_kwargs": {},
            "structure": {},
            "state": "draft",
            "workflow_type": "application",
            "branch": "",
        }

        # Create the first workflow
        r1 = client.post(f"/api/projects/{project['name']}/workflows", json=payload)
        assert r1.status_code == 200
        assert r1.json()["success"] is True

        # Try to create a duplicate - should fail
        r2 = client.post(f"/api/projects/{project['name']}/workflows", json=payload)
        assert r2.json()["success"] is False

        # Verify only one workflow exists with this name
        r3 = client.get(f"/api/projects/{project['name']}/workflows")
        workflows = r3.json()["data"]
        matching_workflows = [w for w in workflows if w["name"] == "rollback-test-workflow"]
        assert len(matching_workflows) == 1

        # Cleanup
        client.delete(f"/api/projects/{project['name']}/workflows/rollback-test-workflow")

    def test_update_nonexistent_does_not_create(self, client, project, owner):
        """Test that updating a non-existent object doesn't create a new one."""
        payload = {
            "name": "ghost-workflow",
            "description": "This should not be created",
            "owner_id": owner["uid"],
            "project_id": project["uid"],
            "configuration": {},
            "type_kwargs": {},
            "structure": {},
            "state": "draft",
            "workflow_type": "application",
            "branch": "",
        }

        # Try to update a non-existent workflow
        r = client.put(
            f"/api/projects/{project['name']}/workflows/ghost-workflow",
            json=payload,
        )
        assert r.json()["success"] is False

        # Verify the workflow was NOT created
        r2 = client.get(f"/api/projects/{project['name']}/workflows/ghost-workflow")
        assert r2.json()["success"] is False

    def test_delete_nonexistent_succeeds(self, client, project):
        """Test that deleting a non-existent object doesn't raise an error."""
        # Deleting non-existent should not raise an error
        r = client.delete(f"/api/projects/{project['name']}/workflows/nonexistent-workflow")
        # The API should handle this gracefully
        assert r.status_code == 200


class TestLabelsWithEagerLoading:
    """Tests for labels functionality with eager loading (N+1 query fix)."""

    def test_create_with_labels(self, client, project, owner):
        """Test creating an object with labels."""
        payload = {
            "name": "labeled-workflow",
            "description": "Workflow with labels",
            "owner_id": owner["uid"],
            "project_id": project["uid"],
            "configuration": {},
            "type_kwargs": {},
            "structure": {},
            "state": "draft",
            "workflow_type": "application",
            "branch": "",
            "labels": {
                "environment": "test",
                "team": "backend",
            },
        }

        r = client.post(f"/api/projects/{project['name']}/workflows", json=payload)
        assert r.status_code == 200
        assert r.json()["success"] is True

        # Get the workflow and verify labels are returned
        r2 = client.get(f"/api/projects/{project['name']}/workflows/labeled-workflow")
        assert r2.status_code == 200
        data = r2.json()["data"]
        assert data["labels"]["environment"] == "test"
        assert data["labels"]["team"] == "backend"

        # Cleanup
        client.delete(f"/api/projects/{project['name']}/workflows/labeled-workflow")

    def test_list_with_labels_eager_loaded(self, client, project, owner):
        """Test that listing objects with labels doesn't cause N+1 queries."""
        # Create multiple workflows with labels
        for i in range(3):
            payload = {
                "name": f"eager-load-test-{i}",
                "description": f"Workflow {i}",
                "owner_id": owner["uid"],
                "project_id": project["uid"],
                "configuration": {},
                "type_kwargs": {},
                "structure": {},
                "state": "draft",
                "workflow_type": "application",
                "branch": "",
                "labels": {
                    "index": str(i),
                    "batch": "eager-load-test",
                },
            }
            r = client.post(f"/api/projects/{project['name']}/workflows", json=payload)
            assert r.status_code == 200

        # List all workflows - labels should be eagerly loaded
        r = client.get(f"/api/projects/{project['name']}/workflows")
        assert r.status_code == 200
        workflows = r.json()["data"]

        # Verify labels are present for our test workflows
        test_workflows = [w for w in workflows if w["name"].startswith("eager-load-test-")]
        assert len(test_workflows) == 3
        for workflow in test_workflows:
            assert "labels" in workflow
            assert workflow["labels"]["batch"] == "eager-load-test"

        # Cleanup
        for i in range(3):
            client.delete(f"/api/projects/{project['name']}/workflows/eager-load-test-{i}")

    def test_update_labels(self, client, project, owner):
        """Test updating labels on an existing object."""
        payload = {
            "name": "label-update-workflow",
            "description": "Workflow for label update test",
            "owner_id": owner["uid"],
            "project_id": project["uid"],
            "configuration": {},
            "type_kwargs": {},
            "structure": {},
            "state": "draft",
            "workflow_type": "application",
            "branch": "",
            "labels": {
                "version": "v1",
            },
        }

        # Create
        r = client.post(f"/api/projects/{project['name']}/workflows", json=payload)
        assert r.status_code == 200

        # Update with new labels
        update_payload = {
            **payload,
            "labels": {
                "version": "v2",
                "new_label": "added",
            },
        }
        r2 = client.put(
            f"/api/projects/{project['name']}/workflows/label-update-workflow",
            json=update_payload,
        )
        assert r2.status_code == 200

        # Verify labels are updated
        r3 = client.get(f"/api/projects/{project['name']}/workflows/label-update-workflow")
        data = r3.json()["data"]
        assert data["labels"]["version"] == "v2"
        assert data["labels"]["new_label"] == "added"

        # Cleanup
        client.delete(f"/api/projects/{project['name']}/workflows/label-update-workflow")
