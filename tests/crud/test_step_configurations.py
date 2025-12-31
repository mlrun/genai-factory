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


class TestStepConfigurations(BaseAPITest):

    @property
    def resource(self):
        return "step_configurations"

    def create_payload(self, project, owner):
        return {
            "name": "step-1",
            "description": "step",
            "owner_id": owner["uid"],
            "project_id": project["uid"],
            "branch": "default",
            "step_name": "step"
        }

    def update_payload(self, project, owner):
        return {
            **self.create_payload(project, owner),
            "description": "updated step",
        }
