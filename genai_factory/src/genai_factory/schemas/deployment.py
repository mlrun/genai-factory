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
from typing import Any, Dict, Optional

from genai_factory.schemas.base import BaseWithVerMetadata


class DeploymentType(str, Enum):
    MODEL = "model"
    WORKFLOW = "workflow"
    APPLICATION = "application"


class Deployment(BaseWithVerMetadata):
    _top_level_fields = ["address", "deployment_type"]
    address: str
    deployment_type: DeploymentType
    configuration: Optional[Dict[str, Any]] = None
    is_deployed: Optional[bool] = False
    is_monitored: Optional[bool] = False
    is_local: Optional[bool] = False
