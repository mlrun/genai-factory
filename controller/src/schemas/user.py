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

from controller.src.schemas.base import BaseWithMetadata


class User(BaseWithMetadata):
    _extra_fields = ["policy", "features"]
    _top_level_fields = ["email", "full_name"]

    email: str
    full_name: str = None
    features: dict[str, str] = None
    policy: dict[str, str] = None
    is_admin: bool = False
