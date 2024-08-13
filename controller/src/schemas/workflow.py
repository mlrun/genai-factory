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

from enum import Enum
from typing import Optional

from controller.src.schemas.base import BaseWithVerMetadata


class WorkflowType(str, Enum):
    ingestion = "ingestion"
    application = "application"
    data_processing = "data-processing"
    training = "training"
    evaluation = "evaluation"


class Workflow(BaseWithVerMetadata):
    _top_level_fields = ["workflow_type"]

    workflow_type: WorkflowType
    deployment: str
    project_id: Optional[str] = None
    workflow_function: Optional[str] = None
    configuration: Optional[dict] = None
    graph: Optional[dict] = None

    def get_infer_path(self):
        return f"{self.deployment}/api/workflows/{self.name}/infer"
