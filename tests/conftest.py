import os
from pathlib import Path

from dotenv import load_dotenv

# ---- ENV -------------------------------------------------
# Load test env BEFORE importing controller modules
# so that CTRL_DB_PATH and other vars are set correctly

TEST_ENV_PATH = Path(__file__).parent / ".env"
load_dotenv(TEST_ENV_PATH, override=True)

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
