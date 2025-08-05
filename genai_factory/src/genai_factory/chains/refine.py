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

from langchain_core.prompts.prompt import PromptTemplate

from genai_factory.chains.base import ChainRunner
from genai_factory.config import get_llm
from genai_factory.schemas import WorkflowEvent
from genai_factory.utils import logger

_refine_prompt_template = """
You are an assistant refining a user query for retrieval.  
You have full access to the provided chat history in this conversation. 
Use it when necessary to clarify ambiguous references in the current query.

Please carefully understand the intent of the current user query.  
- The current user query always takes priority over chat history.  
- Use chat history ONLY to clarify ambiguous references.  
- Never replace the user’s intent with content from the past unless explicitly requested.  

Rules:  
- The current user query always takes priority over chat history.  
- Chat history is a valid source you can reference.  
- Do not say you cannot recall previous interactions — the history is given to you.
- If the user query is a greeting, farewell, or small talk (e.g., "hi", "hello", "how are you"), do NOT request more context. Leave it as a conversational intent.   

Example for a query with hidden intent:
The chat history in this example contains data about the capital of France. 
User Query: "What did I ask before?"  
Refined Query: "Only repeat the previous user input - 'What is the capital of France?'"
Instead of wrong refined query: "What is the capital of France?"

Input:  
Chat History: {chat_history}  
Current User Query: {question}  

output:
"""


class RefineQuery(ChainRunner):
    def __init__(self, llm=None, prompt_template=None, **kwargs):
        super().__init__(**kwargs)
        self.llm = llm
        self.prompt_template = prompt_template
        self._chain = None

    def post_init(self,
    mode="sync",
    context=None,
    namespace=None,
    creation_strategy=None,
    **kwargs, ):
        self.llm = self.llm or get_llm(self.context._config)
        refine_prompt = PromptTemplate.from_template(
            self.prompt_template or _refine_prompt_template
        )
        self._chain = refine_prompt | self.llm

    def _run(self, event: WorkflowEvent):
        chat_history = str(event.conversation)
        logger.debug(f"Question: {event.query}\nChat history: {chat_history}")
        resp = self._chain.invoke(
            {"question": event.query, "chat_history": chat_history}
        )
        logger.debug(f"Refined question: {resp}")
        return {"answer": resp}


def get_refine_chain(config, verbose=False, prompt_template=None):
    llm = get_llm(config)
    verbose = verbose or config.verbose
    return RefineQuery(llm=llm, verbose=verbose, prompt_template=prompt_template)
