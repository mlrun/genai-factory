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


class DataSourceType(str, Enum):
    relational = "relational"
    vector = "vector"
    graph = "graph"
    key_value = "key-value"
    column_family = "column-family"
    storage = "storage"
    other = "other"


class DataSource(BaseWithVerMetadata):
    _top_level_fields = ["data_source_type"]

    data_source_type: DataSourceType
    project_id: Optional[str] = None
    database_kwargs: Optional[dict[str, str]] = {}
