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

# Copyright 2023 Iguazio
# Licensed under the Apache License, Version 2.0

"""
Schedule tests (GLOBAL resource)

Rules:
- Schedule cannot exist without a workflow
- Deleting workflow deletes schedules
- Deleting schedule does NOT delete workflow
"""

import pytest
from controller.db import client as db_client


# ------------------------------------------------------------------------------
# Fixtures
# ------------------------------------------------------------------------------

@pytest.fixture(scope="session")
def workflow(client, project, owner):
    """
    Create a workflow to attach schedules to.
    """
    resp = client.post(
        f"/api/projects/{project['name']}/workflows",
        json={
            "name": "test-workflow",
            "description": "workflow for schedule tests",
            "owner_id": owner["uid"],
            "project_id": project["uid"],
            "configuration": {},
            "type_kwargs": {},
            "structure": {},
            "state": "draft",
            "workflow_type": "application",
            "branch": "",
        },
    )
    print("WORKFLOW RESPONSE:", resp.json())
    assert resp.status_code == 200
    return resp.json()["data"]


# ------------------------------------------------------------------------------
# CRUD TESTS
# ------------------------------------------------------------------------------

def test_create_schedule(client, owner, workflow):
    resp = client.post(
        "/api/schedules",
        json={
            "name": "schedule-1",
            "description": "test schedule",
            "owner_id": owner["uid"],
            "workflow_id": workflow["uid"],
            "configuration": {},
            "status": "pending",
        },
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["workflow_id"] == workflow["uid"]


def test_update_schedule(client, owner, workflow):
    client.post(
        "/api/schedules",
        json={
            "name": "schedule-1",
            "description": "test schedule",
            "owner_id": owner["uid"],
            "workflow_id": workflow["uid"],
            "configuration": {},
            "status": "pending",
        },
    )

    resp = client.put(
        "/api/schedules/schedule-1",
        json={
            "name": "schedule-1",
            "description": "updated schedule",
            "owner_id": owner["uid"],
            "workflow_id": workflow["uid"],
            "configuration": {},
            "status": "pending",
        },
    )

    assert resp.status_code == 200
    assert resp.json()["data"]["description"] == "updated schedule"


def test_delete_schedule(client, owner, workflow):
    client.post(
        "/api/schedules",
        json={
            "name": "schedule-1",
            "description": "test schedule",
            "owner_id": owner["uid"],
            "workflow_id": workflow["uid"],
            "configuration": {},
            "status": "pending",
        },
    )

    resp = client.delete("/api/schedules/schedule-1")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


def test_list_schedules(client, owner, workflow):
    client.post(
        "/api/schedules",
        json={
            "name": "schedule-1",
            "description": "test schedule",
            "owner_id": owner["uid"],
            "workflow_id": workflow["uid"],
            "configuration": {},
            "status": "pending",
        },
    )

    client.post(
        "/api/schedules",
        json={
            "name": "schedule-2",
            "description": "test schedule 2",
            "owner_id": owner["uid"],
            "workflow_id": workflow["uid"],
            "configuration": {},
            "status": "pending",
        },
    )

    resp = client.get("/api/schedules")

    body = resp.json()
    assert body["success"] is True
    assert len(body["data"]) == 2


# ------------------------------------------------------------------------------
# FAILURE TESTS
# ------------------------------------------------------------------------------

def test_create_schedule_without_workflow_fails(client, owner):
    resp = client.post(
        "/api/schedules",
        json={
            "name": "invalid-schedule",
            "owner_id": owner["uid"],
            "configuration": {},
            "status": "pending",
        },
    )

    assert resp.status_code == 422

    body = resp.json()
    assert "detail" in body
    assert any(
        err["loc"][-1] == "workflow_id"
        for err in body["detail"]
    )


# ------------------------------------------------------------------------------
# RELATIONSHIP TESTS
# ------------------------------------------------------------------------------

def test_deleting_workflow_deletes_schedules(client, owner, workflow, project):
    client.post(
        "/api/schedules",
        json={
            "name": "schedule-1",
            "description": "test schedule",
            "owner_id": owner["uid"],
            "workflow_id": workflow["uid"],
            "configuration": {},
            "status": "pending",
        },
    )

    # Delete workflow
    resp = client.delete(
        f"/api/projects/{project['name']}/workflows/{workflow['name']}"
    )
    assert resp.status_code == 200

    # Schedule should be deleted
    resp = client.get("/api/schedules")
    assert resp.json()["data"] == []

def test_deleting_schedule_preserves_runs(client, owner, workflow):
    # 1. Create a Schedule
    sched_resp = client.post(
        "/api/schedules",
        json={
            "name": "temp-schedule",
            "owner_id": owner["uid"],
            "workflow_id": workflow["uid"],
            "configuration": {},
            "status": "pending",
        },
    )
    schedule_uid = sched_resp.json()["data"]["uid"]

    # 2. Create a Run attached to that Schedule
    client.post(
        "/api/runs",
        json={
            "name": "historical-run",
            "owner_id": owner["uid"],
            "workflow_id": workflow["uid"],
            "schedule_id": schedule_uid,
            "configuration": {},
            "outputs": {},
            "status": "pending",
        },
    )

    # 3. Delete the Schedule
    delete_response = client.delete(f"/api/schedules/temp-schedule")
    assert delete_response.status_code == 200


    # 4. Verify the Run still exists but schedule_id is NULL
    run_resp = client.get("/api/runs/historical-run")
    assert run_resp.status_code == 200
    assert run_resp.json()["data"]["schedule_id"] is None  # This proves SET NULL worked!

