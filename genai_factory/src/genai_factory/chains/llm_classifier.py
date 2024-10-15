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

from langchain_core.language_models.llms import LLM
from langchain_core.prompts.prompt import PromptTemplate

from genai_factory.chains.base import ChainRunner
from genai_factory.config import get_llm
from genai_factory.schemas import WorkflowEvent
from genai_factory.utils import logger

_classifier_prompt_template = """
You are a helpful AI classifier, given the following conversation and a follow up request,
and a list of possible categories, classify the follow up request to the most relevant class.

Chat History: {chat_history}
request: {question}
classify classes: {classifier_classes}

Answer in one word, the class of the request.
"""


class Classifier(ChainRunner):
    """
    A step that classifies a given text into a list of possible classes.
    The classes must be provided in the classifier_classes parameter.
    """

    def __init__(
        self,
        llm: LLM = None,
        prompt_template: str = None,
        classifier_classes: list[str] = None,
        **kwargs,
    ):
        """
        :param llm:             The llm to use, if None a default llm will be used from config.
        :param prompt_template: A template for the prompt to use for the llm, if None a default prompt will be used.
        """
        super().__init__(**kwargs)
        if not classifier_classes:
            raise ValueError(
                "classifier_classes must be provided in order to use the classifier."
            )
        self.classifier_classes = classifier_classes
        self.llm = llm
        self.prompt_template = prompt_template
        self._chain = None

    def post_init(self):
        """
        Initialize the chain with the llm and the prompt, load the llm from the config if not given.
        """
        self.llm = self.llm or get_llm(self.context._config)
        classifier_prompt = PromptTemplate.from_template(
            self.prompt_template or _classifier_prompt_template
        )
        self._chain = classifier_prompt | self.llm

    def _run(self, event: WorkflowEvent):
        """
        Classify a given text, to of out of a list of possible classes.

        :param event: The event of the workflow, containing the conversation and the text to classify.

        :return:      An event, containing the answer and the sources.
        """
        chat_history = str(event.conversation)
        logger.debug(
            f"Question: {event.query}\nChat history: {chat_history}, classes: {self.classifier_classes}"
        )
        resp = self._chain.invoke(
            {
                "question": event.query,
                "chat_history": chat_history,
                "classifier_classes": self.classifier_classes,
            }
        )
        logger.debug(f"classifierd question: {resp}")
        return {"answer": resp.content, "sources": ""}
