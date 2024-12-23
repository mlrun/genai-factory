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

from genai_factory import workflow_server
from genai_factory.chains.base import HistorySaver, SessionLoader
from genai_factory.chains.refine import RefineQuery
from genai_factory.chains.retrieval import MultiRetriever

workflow_graph = [
    SessionLoader(),
    RefineQuery(),
    MultiRetriever(),
    HistorySaver(),
]

workflow_server.add_workflow(
    name="default", graph=workflow_graph, workflow_type="application"
)
