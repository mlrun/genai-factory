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
import abc

class BaseAPITest(abc.ABC):

    @property
    @abc.abstractmethod
    def resource(self) -> str:
        """e.g. 'agents', 'models'"""
        ...

    @abc.abstractmethod
    def create_payload(self, project, owner) -> dict:
        ...

    @abc.abstractmethod
    def update_payload(self, project, owner) -> dict:
        ...

    def base_url(self, project_name):
        return f"/api/projects/{project_name}/{self.resource}"

    def test_create(self, client, project, owner):
        r = client.post(
            self.base_url(project["name"]),
            json=self.create_payload(project, owner),
        )
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"]["name"] == self.create_payload(project, owner)["name"]

    def test_update(self, client, project, owner):
        name = self.create_payload(project, owner)["name"]

        client.post(self.base_url(project["name"]),
                    json=self.create_payload(project, owner))

        r = client.put(
            f"{self.base_url(project['name'])}/{name}",
            json=self.update_payload(project, owner),
        )
        assert r.status_code == 200
        assert r.json()["success"] is True

        r = client.get(f"{self.base_url(project['name'])}/{name}")
        assert r.json()["data"]["description"] == \
               self.update_payload(project, owner)["description"]

    def test_delete(self, client, project, owner):
        name = self.create_payload(project, owner)["name"]

        client.post(self.base_url(project["name"]),
                    json=self.create_payload(project, owner))

        r = client.delete(f"{self.base_url(project['name'])}/{name}")
        assert r.status_code == 200

        r = client.get(f"{self.base_url(project['name'])}/{name}")
        assert r.json()["success"] is False

    def test_list(self, client, project, owner):
        # Use unique names to avoid conflicts with other tests
        payload1 = self.create_payload(project, owner)
        payload1["name"] = f"{payload1['name']}-list-test-1"
        payload2 = {**payload1, "name": f"{payload1['name']}-2"}

        try:
            client.post(self.base_url(project["name"]), json=payload1)
            client.post(self.base_url(project["name"]), json=payload2)

            r = client.get(self.base_url(project["name"]))
            assert r.status_code == 200
            body = r.json()
            assert body["success"] is True
            items_list = body["data"]
            assert isinstance(items_list, list)

            # Check that our test items are present (don't assert exact count)
            names = [item["name"] for item in items_list]
            assert payload1["name"] in names, f"Expected {payload1['name']} in {names}"
            assert payload2["name"] in names, f"Expected {payload2['name']} in {names}"
            # At minimum, we should have at least our 2 items
            assert len(items_list) >= 2
        finally:
            # Cleanup - always run even if test fails
            client.delete(f"{self.base_url(project['name'])}/{payload1['name']}")
            client.delete(f"{self.base_url(project['name'])}/{payload2['name']}")

    def test_duplicate_create_fails(self, client, project, owner):
        payload = self.create_payload(project, owner)
        payload["name"] = f"{payload['name']}-dup-test"

        try:
            client.post(self.base_url(project["name"]), json=payload)
            r = client.post(self.base_url(project["name"]), json=payload)
            assert r.json()["success"] is False
        finally:
            # Cleanup
            client.delete(f"{self.base_url(project['name'])}/{payload['name']}")

    def test_get_missing_fails(self, client, project):
        r = client.get(f"{self.base_url(project['name'])}/does-not-exist")
        assert r.json()["success"] is False

    def test_update_nonexistent_fails(self, client, project, owner):
        """Test that updating a non-existent resource returns an error."""
        r = client.put(
            f"{self.base_url(project['name'])}/does-not-exist",
            json=self.update_payload(project, owner),
        )
        assert r.json()["success"] is False