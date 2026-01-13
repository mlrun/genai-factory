from tests.base_api_test import BaseAPITest

class TestAgents(BaseAPITest):

    @property
    def resource(self):
        return "agents"

    def create_payload(self, project, owner):
        return {
            "name": "agent-1",
            "description": "agent",
            "owner_id": owner["uid"],
            "project_id": project["uid"],
            "configuration": {},
            "type_kwargs": {},
            "structure": {},
            "state": "draft",
            "agent_type": "single",
            "branch": "",
        }

    def update_payload(self, project, owner):
        return {
            **self.create_payload(project, owner),
            "description": "updated agent",
        }

    def test_deleting_agent_does_not_delete_project(self, client, project, owner):
        payload = {
            "name": "agent-1",
            "description": "agent",
            "owner_id": owner["uid"],
            "project_id": project["uid"],
            "configuration": {},
            "type_kwargs": {},
            "structure": {},
            "state": "draft",
            "agent_type": "single",
            "branch": "",
        }

        client.post(f"/api/projects/{project['name']}/agents", json=payload)

        client.delete(f"/api/projects/{project['name']}/agents/{payload['name']}")

        # project still exists
        r = client.get(f"/api/projects/{project['name']}")
        assert r.json()["success"] is True