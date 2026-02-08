# Database Schema Documentation

This document describes the database schema, foreign key relationships, and cascade behaviors for the GenAI Factory controller.

---

## Table of Contents

- [Overview](#overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Tables](#tables)
- [Foreign Key Behaviors](#foreign-key-behaviors)
- [Cascade Summary](#cascade-summary)
- [Delete Behavior Matrix](#delete-behavior-matrix)

---

## Overview

The database uses SQLAlchemy ORM with the following cascade behaviors:

| Behavior | Description |
|----------|-------------|
| **CASCADE** | When parent is deleted, child rows are **automatically deleted** |
| **SET NULL** | When parent is deleted, the FK field is **set to NULL** |
| **ORM CASCADE** | Deletion handled by SQLAlchemy relationship (not DB-level constraint) |

---

## Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                  │
└──────────────────────────────────────────────────────────────────────────────┘

                                    ┌────────┐
                                    │  User  │
                                    └────┬───┘
                                         │ SET NULL (owner_id)
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
              ┌─────────┐          ┌─────────┐          ┌─────────┐
              │ Project │          │ Session │          │   ...   │
              └────┬────┘          └─────────┘          └─────────┘
                   │
                   │ ORM CASCADE (all children deleted with project)
                   │
     ┌─────────────┼─────────────┬─────────────┬─────────────┐
     │             │             │             │             │
     ▼             ▼             ▼             ▼             ▼
┌──────────┐ ┌─────────┐ ┌───────────┐ ┌────────┐ ┌──────────────────┐
│DataSource│ │ Dataset │ │  Document │ │ Prompt │ │      Model       │
└──────────┘ └─────────┘ └───────────┘ └────────┘ └────────┬─────────┘
                                                           │
                                                           │ SET NULL
                                                           ▼
     ┌─────────────────────────────────────────────────────────────────┐
     │                           Workflow                               │
     │           (step_configurations stored in spec JSON)              │
     └───────┬─────────────┬─────────────┬─────────────────────────────┘
             │             │             │
             │ CASCADE     │ SET NULL    │ SET NULL
             ▼             ▼             ▼
       ┌──────────┐  ┌─────────┐  ┌────────────┐
       │ Schedule │  │   Run   │  │ Deployment │
       └────┬─────┘  └─────────┘  └────────────┘
            │
            │ SET NULL
            ▼
       ┌─────────┐
       │   Run   │
       └─────────┘
```

---

## Tables

### Base Tables (No Parent)

#### User
The root table for user management.

| Column | Type | Description |
|--------|------|-------------|
| uid | String(64) | Primary key |
| name | String(255) | Unique user name |
| description | String | Optional description |
| spec | JSON | Additional data |

**Relationships:**
- Has many Sessions (via owner_id)
- Referenced by all tables via owner_id

---

### Project-Level Tables

#### Project
Workspace container for all other entities.

| Column | Type | FK Reference | On Delete |
|--------|------|--------------|-----------|
| uid | String(64) | - | - |
| name | String(255) | - | - |
| owner_id | String(64) | User.uid | SET NULL |

**Children (all deleted when Project is deleted):**
- DataSource, Dataset, Model, Prompt, Document, Workflow, Deployment

---

#### DataSource

| Column | Type | FK Reference | On Delete |
|--------|------|--------------|-----------|
| project_id | String(64) | Project.uid | ORM CASCADE |
| owner_id | String(64) | User.uid | SET NULL |

---

#### Dataset

| Column | Type | FK Reference | On Delete |
|--------|------|--------------|-----------|
| project_id | String(64) | Project.uid | ORM CASCADE |
| owner_id | String(64) | User.uid | SET NULL |

---

#### Model

| Column | Type | FK Reference | On Delete |
|--------|------|--------------|-----------|
| project_id | String(64) | Project.uid | ORM CASCADE |
| owner_id | String(64) | User.uid | SET NULL |

**Referenced By:**
- Deployment.model_id (SET NULL on delete)

---

#### Prompt

| Column | Type | FK Reference | On Delete |
|--------|------|--------------|-----------|
| project_id | String(64) | Project.uid | ORM CASCADE |
| owner_id | String(64) | User.uid | SET NULL |

---

#### Document

| Column | Type | FK Reference | On Delete |
|--------|------|--------------|-----------|
| project_id | String(64) | Project.uid | ORM CASCADE |
| owner_id | String(64) | User.uid | SET NULL |

---

### Workflow-Level Tables

#### Workflow

| Column | Type | FK Reference | On Delete |
|--------|------|--------------|-----------|
| project_id | String(64) | Project.uid | ORM CASCADE |
| owner_id | String(64) | User.uid | SET NULL |

**Referenced By:**
| Table | FK Field | On Delete Behavior |
|-------|----------|-------------------|
| Schedule | workflow_id | **CASCADE** (deleted) |
| Run | workflow_id | SET NULL |
| Deployment | workflow_id | SET NULL |
| Session | workflow_id | SET NULL |

**Note:** Step configurations are now embedded in the Workflow.spec JSON field.

---

#### Session

| Column | Type | FK Reference | On Delete |
|--------|------|--------------|-----------|
| workflow_id | String(64) | Workflow.uid | SET NULL |
| owner_id | String(64) | User.uid | SET NULL |

---

#### Deployment

| Column | Type | FK Reference | On Delete |
|--------|------|--------------|-----------|
| project_id | String(64) | Project.uid | ORM CASCADE |
| workflow_id | String(64) | Workflow.uid | SET NULL |
| model_id | String(64) | Model.uid | SET NULL |
| owner_id | String(64) | User.uid | SET NULL |

---

### Schedule & Run Tables

#### Schedule

| Column | Type | FK Reference | On Delete |
|--------|------|--------------|-----------|
| workflow_id | String(64) | Workflow.uid | **CASCADE** |
| owner_id | String(64) | User.uid | SET NULL |

**Referenced By:**
- Run.schedule_id (SET NULL on delete)

---

#### Run

| Column | Type | FK Reference | On Delete |
|--------|------|--------------|-----------|
| workflow_id | String(64) | Workflow.uid | SET NULL |
| schedule_id | String(64) | Schedule.uid | SET NULL |
| owner_id | String(64) | User.uid | SET NULL |

---

## Foreign Key Behaviors

### SET NULL Relationships

When the parent is deleted, the FK field becomes NULL:

```
User ─────────────► All tables (owner_id)
Workflow ─────────► Run, Deployment, Session (workflow_id)
Model ────────────► Deployment (model_id)
Schedule ─────────► Run (schedule_id)
```

### CASCADE Relationships

When the parent is deleted, the child row is deleted:

```
Workflow ─────────► Schedule (workflow_id) [DB-level CASCADE]
Project ──────────► All children [ORM-level CASCADE via relationship]
```

---

## Cascade Summary

### Deleting a User
| Affected Table | Behavior |
|----------------|----------|
| All tables with owner_id | owner_id → NULL |

### Deleting a Project
| Affected Table | Behavior |
|----------------|----------|
| DataSource | **DELETED** |
| Dataset | **DELETED** |
| Model | **DELETED** |
| Prompt | **DELETED** |
| Document | **DELETED** |
| Workflow | **DELETED** |
| Deployment | **DELETED** |

### Deleting a Workflow
| Affected Table | Behavior |
|----------------|----------|
| Schedule | **DELETED** |
| Run | workflow_id → NULL |
| Deployment | workflow_id → NULL |
| Session | workflow_id → NULL |

### Deleting a Model
| Affected Table | Behavior |
|----------------|----------|
| Deployment | model_id → NULL |

### Deleting a Schedule
| Affected Table | Behavior |
|----------------|----------|
| Run | schedule_id → NULL |

---

## Delete Behavior Matrix

This matrix shows what happens to each table when a parent entity is deleted.

| When Deleting → | User | Project | Workflow | Model | Schedule |
|-----------------|------|---------|----------|-------|----------|
| **Project** | owner_id=NULL | - | - | - | - |
| **DataSource** | owner_id=NULL | DELETED | - | - | - |
| **Dataset** | owner_id=NULL | DELETED | - | - | - |
| **Model** | owner_id=NULL | DELETED | - | - | - |
| **Prompt** | owner_id=NULL | DELETED | - | - | - |
| **Document** | owner_id=NULL | DELETED | - | - | - |
| **Workflow** | owner_id=NULL | DELETED | - | - | - |
| **Session** | owner_id=NULL | - | workflow_id=NULL | - | - |
| **Deployment** | owner_id=NULL | DELETED | workflow_id=NULL | model_id=NULL | - |
| **Schedule** | owner_id=NULL | DELETED* | DELETED | - | - |
| **Run** | owner_id=NULL | DELETED* | workflow_id=NULL | - | schedule_id=NULL |

*\* Deleted via cascade chain: Project → Workflow → Schedule*

---

## Labels

Each table has an associated labels table (`{table_name}_labels`) that stores key-value pairs:

| Column | Type | Description |
|--------|------|-------------|
| uid | Integer | Primary key |
| name | String(255) | Label key |
| value | String(255) | Label value |
| parent | String(255) | FK to parent table's name |

Labels are automatically deleted when their parent entity is deleted (via ORM cascade="all, delete-orphan").

---

## Notes

1. **ORM vs DB-level cascades**: Most cascades are handled at the ORM level via SQLAlchemy relationships, not DB-level constraints. This means deletions must go through the ORM to trigger cascades.

2. **Indexes**: Foreign key columns are indexed for query performance.

3. **Nullable FKs**: All SET NULL foreign keys are nullable=True to allow the NULL value after parent deletion.
