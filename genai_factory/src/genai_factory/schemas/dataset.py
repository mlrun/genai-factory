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

from typing import List, Optional

from pydantic import Field

from genai_factory.schemas.base import BaseWithVerMetadata


class Dataset(BaseWithVerMetadata):
    _top_level_fields = ["task","path"]

    task: str = ""
    path: str
    project_id: str
    data_sources: List[str] = Field(default_factory=list)
    producer: dict[str,str]
    profile: dict[str,str] = Field(default_factory=dict)
    extra_data: dict[str, str] = Field(default_factory=dict)
