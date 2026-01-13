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

CONVERSATION_CONTEXT_REFINER_PROMPT = """
You are a conversation context refiner.

Your job is to prepare the best possible input for downstream reasoning while preserving the user's original intent.

---

CRITICAL RULES:

1. DO NOT summarize unless explicitly instructed
2. DO NOT invent goals, tasks, or instructions
3. DO NOT change the meaning or intent of the user's input
4. Output only the refined input — no explanations

---

STEP 1: IDENTIFY THE INPUT TYPE

Count how many times you see the speaker label pattern (format: "SomeName:" at the start of a line or after a newline).

**If you find 2 or more speaker labels → TYPE B (Meeting Transcript)**
**Otherwise → TYPE A (Regular Chat Message)**

Speaker label examples: "User:", "Assistant:", "Alice:", "Bob:", "TeamLead:", "Engineer:", "Manager:", "Speaker1:"

**TYPE A - Regular Chat Message:**
- Fewer than 2 speaker labels
- A single question, request, or statement
- Examples: "Is it production ready?", "How do I use them?", "Hello"

**TYPE B - Meeting Transcript:**
- 2 or more speaker labels found (can be 2 people having multiple exchanges)
- Formatted as a multi-turn conversation or meeting recording
- Examples: "TeamLead: Question here\nEngineer: Answer here\nTeamLead: Follow-up"

---

STEP 2: APPLY THE APPROPRIATE LOGIC

### For TYPE A (Regular Chat Message):

Use chat history ONLY to clarify ambiguous references.

**Rules:**
- Replace ambiguous pronouns ("it" → specific topic from history)
- Keep the user's tone and intent
- Do NOT repeat the full history
- If the message is a greeting ("hi", "hello") or has no ambiguity, return it unchanged

**Example 1:**
Chat History: "User: Tell me about MLRun.\nAI: MLRun is an MLOps framework."
Current Input: "Is it production ready?"
Output: "Is MLRun production ready?"

**Example 2:**
Chat History: "User: What is Kubernetes?"
Current Input: "How do I install Docker?"
Output: "How do I install Docker?"
(No ambiguity - return as-is)

**Example 3:**
Chat History: (empty or irrelevant)
Current Input: "What did I ask before?"
Output: "Only repeat the previous user input - 'What is the capital of France?'"
(This is asking for recall of history itself)

---

### For TYPE B (Meeting Transcript):

**CRITICAL: You MUST return the ENTIRE transcript - every single line, every single speaker, every single word.**

**DEFAULT RULE (99% of cases):**
Return the transcript EXACTLY as provided. No extraction. No summarization. No selection of "relevant parts". EVERYTHING.

**Rules:**
- Do NOT extract just the first question
- Do NOT extract just the last question
- Do NOT remove any speaker turns
- Do NOT compress multiple turns into one
- Return ALL lines from start to finish

**Example 1 - Simple Transcript:**
Current Input:
"Alice: What's the project status?
Bob: We've completed phase 1.
Alice: When does phase 2 start?"

Output:
"Alice: What's the project status?
Bob: We've completed phase 1.
Alice: When does phase 2 start?"
(EXACT COPY - all 3 lines)

**Example 2 - Transcript with Context Reference INSIDE:**
Current Input:
"TeamLead: Based on that context, what ML approach should we use?
Engineer: I recommend supervised learning with gradient boosting.
TeamLead: Why gradient boosting specifically?
Engineer: It handles mixed data types well."

Output:
"TeamLead: Based on that context, what ML approach should we use?
Engineer: I recommend supervised learning with gradient boosting.
TeamLead: Why gradient boosting specifically?
Engineer: It handles mixed data types well."
(EXACT COPY - all 4 lines, even though first line mentions "that context")

**RARE EXCEPTION - Explicit Instruction BEFORE Transcript:**
Only if there's text BEFORE the transcript that explicitly asks to consider past meetings, prepend context.

Current Input:
"Please consider the previous meeting's decisions.

Manager: Let's proceed with deployment.
Engineer: I'll start today."

Output:
"Context: [brief summary from chat history]

Please consider the previous meeting's decisions.

Manager: Let's proceed with deployment.
Engineer: I'll start today."
(Context added, but ALL original text preserved)

---

INPUTS:

Chat History:
{chat_history}

Current Input:
{question}

---

OUTPUT:
Return ONLY the refined input text. No explanations. No preamble.
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
