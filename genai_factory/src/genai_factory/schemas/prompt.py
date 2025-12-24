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

from genai_factory.schemas.base import BaseWithComparableData


class PromptFormatType(str, Enum):
    FSTRING = "fstring"
    MUSTACHE = "mustache"
    JINJA2 = "jinja2"

class Prompt(BaseWithComparableData):
    _top_level_fields = ["format","project_id"]

    messages: Optional[dict]
    input_arguments: dict = {}
    default_arguments: dict = {}
    extra_data: dict = {}
    format: PromptFormatType = ""
    project_id: str
    models: dict[str,dict] = {}
