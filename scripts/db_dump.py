import requests
import json
import sys
from tabulate import tabulate

# -------------------------------------------------------------------
# CONFIG
# -------------------------------------------------------------------

BASE_URL = "http://localhost:8001/api"
PROJECT_NAME = "default"
WORKFLOW_NAME = "default"
SCHEDULE_NAME = "default"
USER_NAME = "guest"

TABLES_TO_SHOW = [
    "projects",
    "data_sources",
    "datasets",
    "models",
    "workflows",
    "documents",
    "step_configurations",
    "deployments",
    "schedules",
    "runs",
    "agents",
    "mcp_servers",
    "users",
    "sessions"
]

# Base fields shared by all schemas (BaseWithVerMetadata)
BASE_FIELDS = {
    "name",
    "uid",
    "description",
    "labels",
    "created",
    "updated",
    "owner_id",
    "version",
}

# Top-level fields per resource (MUST match Pydantic schemas)
TOP_LEVEL_FIELDS = {
    "projects": {"source"},
    "data_sources": {"project_id", "data_source_type"},
    "datasets": {"project_id", "task", "path"},
    "models": {"project_id", "source", "task", "is_adapter", "base_model"},
    "workflows": {"project_id", "workflow_type", "state"},
    "documents": {"project_id", "path", "keywords"},
    "step_configurations": {"project_id","workflow_id","model_id","agent_id","mcp_server_id"},
    "deployments": {"project_id","workflow_id","model_id","agent_id","mcp_server_id","is_remote","type"},
    "schedules": {"workflow_id"},
    "runs": {"workflow_id","schedule_id"},
    "agents": {"project_id", "agent_type", "state"},
    "mcp_servers": {"project_id", "mcp_type", "state"},
    "users": {},
    "sessions": {"workflow_id"},
}


# -------------------------------------------------------------------
# HTTP HELPERS
# -------------------------------------------------------------------

def get(endpoint: str):
    url = f"{BASE_URL}{endpoint}"
    resp = requests.get(url)
    resp.raise_for_status()
    payload = resp.json()

    if not payload.get("success", True):
        raise RuntimeError(payload.get("error"))

    return payload.get("data")


# -------------------------------------------------------------------
# DATA NORMALIZATION
# -------------------------------------------------------------------

def normalize_row(row: dict, resource: str) -> dict:
    """
    Split a flattened API row into:
    - base fields
    - top-level fields
    - spec (everything else)
    """
    base = {}
    spec = {}

    top_fields = TOP_LEVEL_FIELDS.get(resource, set())

    for k, v in row.items():
        if k in BASE_FIELDS or k in top_fields:
            base[k] = v
        else:
            spec[k] = v

    base["spec"] = json.dumps(spec, indent=2, ensure_ascii=False)
    return base


# -------------------------------------------------------------------
# PRINTING
# -------------------------------------------------------------------

def print_table(title: str, rows: list[dict]):
    print(f"\n=== {title.upper()} ===")

    if not rows:
        print("(empty)")
        return

    headers = rows[0].keys()
    values = [r.values() for r in rows]

    print(tabulate(values, headers=headers, tablefmt="grid"))


# -------------------------------------------------------------------
# FETCHERS
# -------------------------------------------------------------------

def fetch_projects():
    return get("/projects")

def fetch_schedules():
    return get("/schedules")

def fetch_users():
    return get("/users")

def fetch_runs():
    return get("/runs")



def fetch_project_resource(resource: str):
    return get(f"/projects/{PROJECT_NAME}/{resource}")

def fetch_schedules_resource(resource: str):
    return get(f"/schedules/{SCHEDULE_NAME}/{resource}")

def fetch_users_resource(resource: str):
    return get(f"/users/{USER_NAME}/{resource}")

def fetch_workflow_resource(resource: str):
    return get(f"/projects/{PROJECT_NAME}/workflows/{WORKFLOW_NAME}/{resource}")


# -------------------------------------------------------------------
# MAIN
# -------------------------------------------------------------------
def print_db_tables(output_file=None):
    original_stdout = sys.stdout
    file_handle = None
    if output_file:
        file_handle = open(output_file, "w", encoding="utf-8")
        sys.stdout = file_handle

    try:
        for resource in TABLES_TO_SHOW:
            try:
                if resource == "projects":
                    raw_rows = fetch_projects()
                elif resource == "runs":
                    raw_rows = fetch_runs()
                elif resource == "schedules":
                    raw_rows = fetch_schedules()
                elif resource == "users":
                    raw_rows = fetch_users()
                elif resource == "sessions":
                    raw_rows = fetch_users_resource(resource)
                else:
                    raw_rows = fetch_project_resource(resource)

                # API may return a single object or a list
                if isinstance(raw_rows, dict):
                    raw_rows = [raw_rows]

                normalized = [
                    normalize_row(row, resource)
                    for row in raw_rows
                ]

                print_table(resource, normalized)

            except Exception as e:
                print(f"\n=== {resource.upper()} ===")
                print(f"ERROR: {e}")
    finally:
        if file_handle:
            file_handle.close()
            sys.stdout = original_stdout



if __name__ == "__main__":
    print_db_tables(output_file="db_dump.txt")
