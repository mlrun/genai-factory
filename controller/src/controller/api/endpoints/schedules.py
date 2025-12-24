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
from genai_factory.schemas import APIResponse, Schedule, OutputMode

router = APIRouter()

@router.post("/schedules")
def create_schedule(
    schedule: Schedule,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new schedule in the database.

    :param schedule:   The schedule to create.
    :param db_session:   The schedule session.

    :return: The response from the database.
    """
    try:
        data = client.create_schedule(schedule=schedule, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create schedule {schedule.name}: {e}",
        )


@router.get("/schedules/{name}")
def get_schedule(
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Get a schedule from the database.

    :param name:         The name of the schedule to get.
    :param uid:          The name of the schedule to get.
    :param version:      The version of the schedule to get.
    :param db_session:   The database session.

    :return: The schedule from the database.
    """
    try:
        uid, version = parse_version(uid, version)
        data = client.get_schedule(
            name=name,
            uid=uid,
            version=version,
            db_session=db_session,
        )
        if data is None:
            return APIResponse(
                success=False, error=f"Deployment with uid = {uid} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get schedule {uid}: {e}",
        )


@router.put("/schedules/{name}")
def update_schedule(
    schedule: Schedule,
    name: str,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a schedule in the database.

    :param schedule:   The schedule to update.
    :param name:         The name of the schedule to update.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.update_schedule(name=name, schedule=schedule, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update schedule {name}: {e}",
        )


@router.delete("/schedules/{name}")
def delete_schedule(
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Delete a schedule from the database.

    :param name:         The name of the schedule to delete.
    :param uid:          The UID of the schedule to delete.
    :param version:      The version of the schedule to delete.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    uid, version = parse_version(uid, version)
    try:
        client.delete_schedule(
            name=name,
            uid=uid,
            version=version,
            db_session=db_session,
        )
        return APIResponse(success=True)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to delete schedule {name}: {e}",
        )


@router.get("/schedules")
def list_schedules(
    name: str = None,
    version: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    db_session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List schedules in the database.

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
        data = client.list_schedules(
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
            error=f"Failed to list schedules: {e}",
        )
