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
import importlib
import os
import pathlib
from typing import Union

import yaml
from pydantic import BaseModel


class WorkflowServerConfig(BaseModel):
    """
    Workflows server configuration. Through this configuration, you can set the connection to the GenAI Factory
    controller and initialize the workflows with different settings.
    """

    controller_url: str = "http://localhost:8001"
    """
    URL of the controller API. Default: http://localhost:8001.
    """

    controller_username: str = "guest"
    """
    Username to use for the controller API. Default: admin.
    """

    project_name: str = "default"
    """
    MLRun project name to use for the workflows. Default: default.
    """

    mlrun_api_url: str = "http://localhost:30070"
    """
    URL to use for the mlrun API. Default: http://localhost:30070.
    """

    git_repo: str = "git://github.com/tomerbv/workflow_example"
    """
    MLRun git repo. Default: "".
    """

    default_image_requirements: list[str] = [
        "fastapi",
        "uvicorn",
        "git+https://github.com/mlrun/genai-factory"
    ]
    """
    MLRun default image requirements for creating images. Default: "".
    """

    verbose: bool = True
    """
    Whether to print verbose logs. Default: True.
    """

    log_level: str = "INFO"
    """
    The log level. Default: INFO.
    """

    deployment_url: str = "http://localhost:8000"
    """
    URL to use for the workflows server deployment API. Default: http://localhost:8000.
    """

    workflows_kwargs: dict[str, dict] = {}
    """
    Keyword arguments for each step's initialization in a workflow. Expecting a dictionary of per workflow name to step
     configurations::

        step_kwargs = config.workflows_kwargs[workflow_name]["steps"][step_name]
    """

    # TODO: All following configurations should be per workflow and attached to a step
    # TODO: KEEP DEFAULTS FOR CONVENIENCE
    chunk_size: int = 1024
    chunk_overlap: int = 20

    # Embeddings
    embeddings: dict = {"class_name": "huggingface", "model_name": "all-MiniLM-L6-v2"}

    # Default LLM
    default_llm: dict = {
        "class_name": "langchain_openai.ChatOpenAI",
        "temperature": 0,
        "model_name": "gpt-3.5-turbo",
    }
    # Vector store
    default_vector_store: dict = {
        "class_name": "milvus",
        "collection_name": "default",
        "connection_args": {"address": "localhost:19530"},
    }

    def default_collection(self):
        return self.default_vector_store.get("collection_name", "default")

    def print(self):
        print(yaml.dump(self.model_dump()))

    @classmethod
    def from_yaml(cls, path: Union[str, pathlib.Path]) -> "WorkflowServerConfig":
        with open(path, "r") as f:
            data = yaml.safe_load(f)
        return cls.model_validate(data)

    @classmethod
    def local_config(cls) -> "WorkflowServerConfig":
        """Create a local config for testing oe local deployment."""
        config = cls()
        config.verbose = True
        config.default_vector_store = {
            "class_name": "chroma",
            "collection_name": "default",
            "persist_directory": str(
                (
                    pathlib.Path(os.environ["GENAI_FACTORY_LOCAL_CHROMA"]) / "chroma"
                ).absolute()
            ),
        }
        return config


embeddings_shortcuts = {
    "huggingface": "langchain_huggingface.embeddings.huggingface.HuggingFaceEmbeddings",
    "openai": "langchain_openai.embeddings.base.OpenAIEmbeddings",
}

vector_db_shortcuts = {
    "milvus": "langchain_community.vectorstores.Milvus",
    "chroma": "langchain_community.vectorstores.chroma.Chroma",
}

llm_shortcuts = {
    "chat": "langchain_openai.ChatOpenAI",
    "gpt": "langchain_community.chat_models.GPT",
}


def get_embedding_function(config: WorkflowServerConfig, embeddings_args: dict = None):
    return get_object_from_dict(
        embeddings_args or config.embeddings, embeddings_shortcuts
    )


def get_llm(config: WorkflowServerConfig, llm_args: dict = None):
    """Get a language model instance."""
    return get_object_from_dict(llm_args or config.default_llm, llm_shortcuts)


def get_vector_db(
    config: WorkflowServerConfig,
    collection_name: str = None,
    vector_store_args: dict = None,
):
    """Get a vector database instance.

    Args:
        config: An AppConfig instance.
        collection_name: The name of the collection to use (if not default).
        vector_store_args: class_name and arguments to pass to the vector store class (None will use the config).
    """
    embeddings = get_embedding_function(config=config)
    vector_store_args = vector_store_args or config.default_vector_store
    vector_store_args = vector_store_args.copy()
    if collection_name:
        vector_store_args["collection_name"] = collection_name
    vector_store_args["embedding_function"] = embeddings
    return get_object_from_dict(vector_store_args, vector_db_shortcuts)


def get_class_from_string(class_path, shortcuts: dict = {}) -> type:
    if class_path in shortcuts:
        class_path = shortcuts[class_path]
    module_name, class_name = class_path.rsplit(".", 1)
    module = importlib.import_module(module_name)
    class_ = getattr(module, class_name)
    return class_


def get_object_from_dict(obj_dict: dict, shortcuts: dict = {}):
    if not isinstance(obj_dict, dict):
        return obj_dict
    obj_dict = obj_dict.copy()
    class_name = obj_dict.pop("class_name")
    class_ = get_class_from_string(class_name, shortcuts)
    return class_(**obj_dict)
