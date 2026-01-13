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

from examples.a2aclient.a2a_client import A2AClient
from examples.a2aclient.communicator import Communicator
from examples.a2aclient.intent_choice import IntentChoice
from examples.a2aclient.intent_classifier import IntentClassifier
from genai_factory import workflow_server
from genai_factory.chains.base import HistorySaver, SessionLoader
from genai_factory.chains.hallucination_guardrail import HallucinationGuardrail
from genai_factory.chains.language_guardrail import LanguageGuardrail
from genai_factory.chains.refine import RefineQuery, CONVERSATION_CONTEXT_REFINER_PROMPT
import mlrun.serving as mlrun_serving

import os
from pathlib import Path
from dotenv import load_dotenv

# 1. Get the directory where THIS script is located
current_dir = Path(__file__).parent.resolve()

# 2. Define the path to the specific .env file in this directory
env_path = current_dir / ".env"

# 3. Load only this specific file (override=True ensures it takes priority)
load_dotenv(dotenv_path=env_path, override=True)

# Class instances
session_loader = SessionLoader()
refine_query = RefineQuery(
    prompt_template=CONVERSATION_CONTEXT_REFINER_PROMPT
)
intent_classifier = IntentClassifier()
intent_choice = IntentChoice()
a2a_client = A2AClient(base_url=os.getenv("A2A_BASE_URL", "http://localhost:10000"), name= "a2a")
communicator = Communicator(name="communicator")
language_guardrail = LanguageGuardrail()
hallucination_guardrail= HallucinationGuardrail()
history_saver = HistorySaver()

# Root , Start of Dag
root = mlrun_serving.states.RootFlowStep()

# First part until Choice step
classify_task = root.to(session_loader).to(refine_query).to(intent_classifier)

# Connect first part to choice step
choice_task = classify_task.to(intent_choice)

# Choice step
a2a_client_task = choice_task.to(a2a_client)
communicator_task = choice_task.to(communicator)


# Merge back choice steps
language_guardrail_task = root.add_step(language_guardrail, after=["a2a","communicator"])

# Conncet Last steps
language_guardrail_task.to(hallucination_guardrail).to(history_saver).respond()



workflow_server.add_workflow(
    name="default",
    graph=root,
    workflow_type="application",
)
