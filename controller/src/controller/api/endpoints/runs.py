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

from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends

from controller.api.utils import AuthInfo, get_auth_user, get_db, parse_version
from controller.db import client
from genai_factory.schemas import APIResponse, Run, OutputMode


router = APIRouter(prefix="/schedules/{schedule_name}")

@router.post("/runs")
def create_run(
    run: Run,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new run in the database.

    :param run:          The run to create.
    :param db_session:   The run session.

    :return: The response from the database.
    """
    try:
        data = client.create_run(run=run, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create run {run.name}: {e}",
        )


@router.get("/runs/{name}")
def get_run(
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Get a run from the database.

    :param name:         The name of the run to get.
    :param uid:          The name of the run to get.
    :param version:      The version of the run to get.
    :param db_session:   The database session.

    :return: The run from the database.
    """
    try:
        uid, version = parse_version(uid, version)
        data = client.get_run(
            name=name,
            uid=uid,
            version=version,
            db_session=db_session,
        )
        if data is None:
            return APIResponse(
                success=False, error=f"Run with uid = {uid} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get run {uid}: {e}",
        )


@router.put("/runs/{name}")
def update_run(
    run: Run,
    name: str,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a run in the database.

    :param run:          The run to update.
    :param name:         The name of the run to update.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.update_run(name=name, run=run, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update run {name}: {e}",
        )


@router.delete("/runs/{name}")
def delete_run(
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Delete a run from the database.

    :param name:         The name of the run to delete.
    :param uid:          The UID of the run to delete.
    :param version:      The version of the run to delete.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    uid, version = parse_version(uid, version)
    try:
        client.delete_run(
            name=name,
            uid=uid,
            version=version,
            db_session=db_session,
        )
        return APIResponse(success=True)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to delete run {name}: {e}",
        )


@router.get("/runs")
def list_runs(
    name: str = None,
    version: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    db_session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List runs in the database.

    :param name:         The name to filter by.
    :param version:      The version to filter by.
    :param labels:       The labels to filter by.
    :param mode:         The output mode.
    :param db_session:   The database session.
    :param auth:         The authentication information.

    :return: The response from the database.
    """
    owner = client.get_user(name=auth.username, db_session=db_session)
    owner_id = getattr(owner, "uid", None)
    try:
        data = client.list_runs(
            name=name,
            version=version,
            owner_id=owner_id,
            labels_match=labels,
            output_mode=mode,
            db_session=db_session,
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to list runs: {e}",
        )
