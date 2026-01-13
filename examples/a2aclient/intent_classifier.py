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

from langchain_openai import ChatOpenAI
from genai_factory.chains.base import ChainRunner
from genai_factory.schemas import WorkflowEvent
from langchain_core.prompts import PromptTemplate

INTENT_PROMPT = """
You are an intent classifier.

Classify the following content into exactly one category.

Definitions:
- meeting: structured multi-speaker conversation such as a meeting, interview, call transcript, Zoom recording, or discussion log.
- casual: normal chat, Q&A, or conversational interaction.

Rules:
- Respond with EXACTLY one word.
- The response MUST be either: meeting OR casual.
- Do not explain.
- Do not add punctuation.
- Do not add quotes.

Content:
{query}
"""

class IntentClassifier(ChainRunner):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._llm = None
        self._chain = None

    @property
    def llm(self):
        if not self._llm:
            self._llm = ChatOpenAI(model="gpt-4", temperature=0.5)
        return self._llm

    def post_init(
        self,
        mode="sync",
        context=None,
        namespace=None,
        creation_strategy=None,
        **kwargs,
    ):

        prompt = PromptTemplate.from_template(INTENT_PROMPT)
        self._chain = prompt | self.llm

    def _run(self, event: WorkflowEvent):
        # Extract string content from AIMessage query (from RefineQuery)
        query = event.query.content

        result = self._chain.invoke(
            {"query": query}
        )

        intent = result.content.strip().lower()

        # Hard guardrail
        if intent not in {"meeting", "casual"}:
            intent = "casual"

        return {"intent": intent}
