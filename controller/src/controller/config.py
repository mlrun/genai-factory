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

import logging
import os
from pathlib import Path

import dotenv
import yaml
from pydantic import BaseModel

root_path = Path(__file__).parent.parent.parent
dotenv.load_dotenv(os.environ.get("CTRL_ENV_PATH", str(root_path / ".env")))
default_data_path = os.environ.get("CTRL_DATA_PATH", str(root_path / "data"))
default_db_path = os.environ.get(
    "CTRL_DB_PATH", f"sqlite:///{default_data_path}/sql.db"
)
# for mysql use: "mysql+mysqlconnector://root:mysql@localhost/db"


class CtrlConfig(BaseModel):
    """Configuration for the agent."""

    log_level: str = "DEBUG"
    # database kwargs:
    db: dict[str, str] = {
        "db_url": default_db_path,
        "verbose": True,
    }
    db_type: str = "sql"
    application_url: str = "http://localhost:8000"

    def print(self):
        print(yaml.dump(self.dict()))

    # @classmethod
    def load_from_yaml(cls, path: str):
        with open(path, "r") as f:
            data = yaml.safe_load(f)
        return cls.parse_obj(data)


config_path = os.environ.get("CTRL_CONFIG_PATH")

if config_path:
    config = CtrlConfig.load_from_yaml(config_path)
else:
    config = CtrlConfig()

logger = logging.getLogger("gaictrl")
logger.setLevel(config.log_level.upper())
logger.addHandler(logging.StreamHandler())
logger.info("Controller Logger initialized...")
