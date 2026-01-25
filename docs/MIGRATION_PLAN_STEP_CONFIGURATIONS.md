# Migration Plan: StepConfiguration Table → Workflow.spec

> **Status:** Planned
> **Author:** Auto-generated
> **Date:** 2025-01-25

---

## Overview

This document outlines the migration plan to remove the `StepConfiguration` table and embed step configurations directly into the `Workflow.spec` JSON field.

### Goals
- Simplify the data model by removing one table
- Keep step configurations with their workflow (logical grouping)
- Reduce API surface area
- Align with MLRun's workflow.yaml pattern

### Non-Goals
- Backward compatibility for StepConfiguration API endpoints
- Versioning of individual step configurations
- Sharing step configurations across workflows

---

## Current vs Target Architecture

### Before (Current)
```
┌──────────┐       ┌───────────────────┐       ┌──────────┐
│ Project  │◄──────│ StepConfiguration │──────►│ Workflow │
└──────────┘       └───────────────────┘       └──────────┘
     │                                               │
     └───────────────────────────────────────────────┘
                    (both have FKs)
```

### After (Target)
```
┌──────────┐       ┌──────────────────────────────────────┐
│ Project  │◄──────│ Workflow                             │
└──────────┘       │  └─ spec.step_configurations: [...]  │
                   └──────────────────────────────────────┘

❌ StepConfiguration table DELETED
```

---

## Data Model Changes

### New StepConfigurationItem (embedded in Workflow)

```python
# Simple dict structure, no separate Pydantic model needed
step_configuration_item = {
    "name": str,           # Unique name within workflow
    "step_name": str,      # The step this configures
    "branch": str,         # Branch name (default: "default")
    "kwargs": dict         # Step parameters
}
```

### Workflow.spec Structure (After Migration)

```yaml
# Workflow.spec will contain:
configuration: {}
structure: {}
type_kwargs: {}
branch: "main"
step_configurations:          # NEW
  - name: "config-1"
    step_name: "SessionLoader"
    branch: "default"
    kwargs:
      timeout: 30
  - name: "config-2"
    step_name: "Guardrail"
    branch: "default"
    kwargs:
      strict: true
```

---

## Migration Steps

### Phase 1: Update Schemas

#### 1.1 Modify Workflow Schema
**File:** `genai_factory/src/genai_factory/schemas/workflow.py`

```python
# Add to imports
from typing import Optional, List

# Add new field to Workflow class (or BaseWithWorkMetadata)
class Workflow(BaseWithWorkMetadata):
    # ... existing fields ...

    # NEW: Embedded step configurations
    step_configurations: List[dict] = Field(default_factory=list)
```

#### 1.2 Delete StepConfiguration Schema
**File:** `genai_factory/src/genai_factory/schemas/step_configuration.py`
- DELETE entire file

#### 1.3 Update Schema Exports
**File:** `genai_factory/src/genai_factory/schemas/__init__.py`

```python
# REMOVE these lines:
from genai_factory.schemas.step_configuration import StepConfiguration
```

---

### Phase 2: Update Database Layer

#### 2.1 Remove StepConfiguration from sqldb.py
**File:** `controller/src/controller/db/sql/sqldb.py`

**Remove:**
- `class StepConfiguration(VersionedOwnerBaseSchema)` (entire class, ~45 lines)
- `step_configurations` relationship from `Project` class
- `step_configurations` relationship from `Workflow` class

**Changes to Project class:**
```python
# REMOVE this line from Project.relationship_args usage:
step_configurations: Mapped[List["StepConfiguration"]] = relationship(**relationship_args)
```

**Changes to Workflow class:**
```python
# REMOVE this relationship:
step_configurations: Mapped[List["StepConfiguration"]] = relationship(
    "StepConfiguration",
    back_populates="workflow"
)
```

#### 2.2 Remove StepConfiguration Methods from sqlclient.py
**File:** `controller/src/controller/db/sql/sqlclient.py`

**Remove these methods (~120 lines):**
- `create_step_configuration()`
- `get_step_configuration()`
- `update_step_configuration()`
- `delete_step_configuration()`
- `list_step_configurations()`

#### 2.3 Remove Abstract Methods from client.py
**File:** `controller/src/controller/db/client.py`

**Remove these abstract methods (~75 lines):**
- `create_step_configuration()`
- `get_step_configuration()`
- `update_step_configuration()`
- `delete_step_configuration()`
- `list_step_configurations()`

---

### Phase 3: Update API Layer

#### 3.1 Delete StepConfiguration Endpoints
**File:** `controller/src/controller/api/endpoints/step_configurations.py`
- DELETE entire file

#### 3.2 Update API Router
**File:** `controller/src/controller/api/__init__.py`

```python
# REMOVE from imports:
from controller.api.endpoints import (
    ...
    step_configurations,  # REMOVE
    ...
)

# REMOVE router include:
api_router.include_router(
    step_configurations.router,
    tags=["step_configurations"],
)
```

---

### Phase 4: Update Tests

#### 4.1 Delete StepConfiguration Tests
**File:** `tests/crud/test_step_configurations.py`
- DELETE entire file

#### 4.2 Add Workflow Step Configuration Tests
**File:** `tests/crud/test_workflows.py`

```python
# Add new test methods:

def test_workflow_with_step_configurations(self, client, project, owner):
    """Test creating workflow with embedded step configurations."""
    payload = {
        "name": "workflow-with-steps",
        "description": "Test workflow",
        "owner_id": owner["uid"],
        "project_id": project["uid"],
        "workflow_type": "application",
        "state": "draft",
        "configuration": {},
        "type_kwargs": {},
        "structure": {},
        "branch": "main",
        "step_configurations": [
            {
                "name": "step-config-1",
                "step_name": "SessionLoader",
                "branch": "default",
                "kwargs": {"timeout": 30}
            },
            {
                "name": "step-config-2",
                "step_name": "Guardrail",
                "branch": "default",
                "kwargs": {"strict": True}
            }
        ]
    }

    r = client.post(f"/api/projects/{project['name']}/workflows", json=payload)
    assert r.status_code == 200
    assert r.json()["success"] is True

    # Verify step configurations are stored
    r2 = client.get(f"/api/projects/{project['name']}/workflows/workflow-with-steps")
    data = r2.json()["data"]
    assert len(data["step_configurations"]) == 2
    assert data["step_configurations"][0]["step_name"] == "SessionLoader"

    # Cleanup
    client.delete(f"/api/projects/{project['name']}/workflows/workflow-with-steps")


def test_update_workflow_step_configurations(self, client, project, owner):
    """Test updating step configurations in a workflow."""
    # Create workflow
    payload = {
        "name": "workflow-update-steps",
        "owner_id": owner["uid"],
        "project_id": project["uid"],
        "workflow_type": "application",
        "state": "draft",
        "configuration": {},
        "type_kwargs": {},
        "structure": {},
        "branch": "main",
        "step_configurations": [
            {"name": "config-1", "step_name": "Step1", "branch": "default", "kwargs": {}}
        ]
    }
    client.post(f"/api/projects/{project['name']}/workflows", json=payload)

    # Update with new step configurations
    update_payload = {
        **payload,
        "step_configurations": [
            {"name": "config-1", "step_name": "Step1", "branch": "default", "kwargs": {"updated": True}},
            {"name": "config-2", "step_name": "Step2", "branch": "default", "kwargs": {}}
        ]
    }
    r = client.put(
        f"/api/projects/{project['name']}/workflows/workflow-update-steps",
        json=update_payload
    )
    assert r.status_code == 200

    # Verify update
    r2 = client.get(f"/api/projects/{project['name']}/workflows/workflow-update-steps")
    data = r2.json()["data"]
    assert len(data["step_configurations"]) == 2
    assert data["step_configurations"][0]["kwargs"]["updated"] is True

    # Cleanup
    client.delete(f"/api/projects/{project['name']}/workflows/workflow-update-steps")
```

---

### Phase 5: Documentation

#### 5.1 Update Database Schema Documentation
**File:** `controller/src/controller/db/DATABASE_SCHEMA.md`

**Remove:**
- StepConfiguration table section
- References in Project's children
- References in Workflow's relationships
- Cascade behavior for StepConfiguration

**Add:**
- Document `step_configurations` field in Workflow.spec

---

## File Checklist

| File | Action | Lines Affected |
|------|--------|----------------|
| `genai_factory/schemas/step_configuration.py` | DELETE | ~35 |
| `genai_factory/schemas/__init__.py` | Remove import | ~2 |
| `genai_factory/schemas/workflow.py` | Add field | ~5 |
| `controller/db/sql/sqldb.py` | Remove class + relationships | ~60 |
| `controller/db/sql/sqlclient.py` | Remove methods | ~120 |
| `controller/db/client.py` | Remove abstract methods | ~75 |
| `controller/api/endpoints/step_configurations.py` | DELETE | ~95 |
| `controller/api/__init__.py` | Remove import + router | ~8 |
| `tests/crud/test_step_configurations.py` | DELETE | ~45 |
| `tests/crud/test_workflows.py` | Add tests | ~60 |
| `controller/db/DATABASE_SCHEMA.md` | Update docs | ~30 |

**Total estimated changes:** ~535 lines removed, ~65 lines added

---

## Execution Order

```
1. genai_factory/schemas/workflow.py          # Add step_configurations field
2. genai_factory/schemas/__init__.py          # Remove StepConfiguration export
3. genai_factory/schemas/step_configuration.py # DELETE
4. controller/db/sql/sqldb.py                 # Remove class + relationships
5. controller/db/sql/sqlclient.py             # Remove methods
6. controller/db/client.py                    # Remove abstract methods
7. controller/api/endpoints/step_configurations.py # DELETE
8. controller/api/__init__.py                 # Remove router
9. tests/crud/test_step_configurations.py     # DELETE
10. tests/crud/test_workflows.py              # Add new tests
11. controller/db/DATABASE_SCHEMA.md          # Update docs
12. Run tests to verify
```

---

## Rollback Plan

If issues arise:
1. Restore deleted files from git
2. Revert schema changes
3. StepConfiguration table still exists (no DB migration needed for removal)

---

## Notes

- No database migration script needed - SQLAlchemy will simply not create the table on fresh installs
- Existing data in StepConfiguration table will be orphaned (acceptable per requirements)
- API consumers using `/step_configurations` endpoints will get 404 after migration
- Workflow YAML export (`workflow.to_yaml()`) will automatically include step_configurations

---

## Post-Migration Verification

```bash
# Run all tests
pytest tests/ --ignore=tests/test_a2a_workflow -v

# Verify endpoints
curl -X GET http://localhost:8001/api/projects/test/workflows/my-workflow
# Should return workflow with step_configurations in response

# Verify removed endpoints return 404
curl -X GET http://localhost:8001/api/projects/test/step_configurations
# Should return 404 Not Found
```
