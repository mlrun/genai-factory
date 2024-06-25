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

    verbose: bool = True
    log_level: str = "DEBUG"
    # SQL Database
    sql_connection_str: str = default_db_path

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
