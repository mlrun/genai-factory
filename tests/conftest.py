import os
from pathlib import Path

from dotenv import load_dotenv

# ---- ENV -------------------------------------------------
# Load test env BEFORE importing controller modules
# so that CTRL_DB_PATH and other vars are set correctly

# Get the project root directory (parent of tests directory)
PROJECT_ROOT = Path(__file__).parent.parent

# Load .env from tests directory if it exists
TEST_ENV_PATH = Path(__file__).parent / ".env"
if TEST_ENV_PATH.exists():
    load_dotenv(TEST_ENV_PATH, override=True)

# Set default environment variables if not already set
if not os.getenv("CTRL_DATA_PATH"):
    os.environ["CTRL_DATA_PATH"] = str(PROJECT_ROOT / "data")

if not os.getenv("CTRL_DB_PATH"):
    data_path = PROJECT_ROOT / "data" / "sql.db"
    os.environ["CTRL_DB_PATH"] = f"sqlite:///{data_path}"

if not os.getenv("PYTHONPATH"):
    controller_src = PROJECT_ROOT / "controller" / "src"
    genai_factory_src = PROJECT_ROOT / "genai_factory" / "src"
    os.environ["PYTHONPATH"] = f"{controller_src}:{genai_factory_src}"

import pytest
from fastapi.testclient import TestClient

from controller.api import app
from controller.db import client as db_client


# ---- DB RESET --------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def reset_database():
    """
    Runs once before any tests.
    Drops all tables and recreates schema.
    """
    db_client.create_database(drop_old=True)
    yield


# ---- CLIENT ----------------------------------------------

@pytest.fixture(scope="session")
def client(reset_database):
    return TestClient(app)


# ---- CORE OBJECTS ----------------------------------------

@pytest.fixture(scope="session")
def owner(client):
    resp = client.post("/api/users", json={
        "name": "test-user",
        "extra_data": {}
    })
    assert resp.status_code == 200
    return resp.json()["data"]


@pytest.fixture(scope="session")
def project(client, owner):
    resp = client.post("/api/projects", json={
        "name": "test-project",
        "description": "Test Project",
        "owner_id": owner["uid"],
        "source": "test"
    })
    assert resp.status_code == 200
    return resp.json()["data"]


# ---- SANITY CHECK ----------------------------------------

def test_env_loaded():
    assert os.getenv("CTRL_DB_PATH") is not None
    assert os.getenv("PYTHONPATH") is not None
