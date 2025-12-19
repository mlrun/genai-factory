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
import json
import os
from typing import List, Optional, Tuple, Union

from fastapi import APIRouter, Depends

from controller.api.utils import (
    AuthInfo,
    get_auth_user,
    get_db,
    parse_version,
)
from controller.db import client
from genai_factory.schemas import (
    APIResponse,
    StepConfiguration,
    OutputMode,
)

router = APIRouter(prefix="/projects/{project_name}/workflows/{workflow_name}")


@router.post("/step_configurations")
def create_step_configuration(
    project_name: str,
    step_configuration: StepConfiguration,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Create a new step configuration in the database.

    :param project_name: The name of the project to create the step configuration in.
    :param step_configuration:  The step configuration to create.
    :param db_session:   The database session.

    :return: The response from the database.
    """
    try:
        data = client.create_step_configuration(step_configuration=step_configuration, db_session=db_session)
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to create step configuration {step_configuration.name} in project {project_name}: {e}",
        )


@router.get("/step_configurations/{name}")
def get_data_source(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Get a step configuration from the database.

    :param project_name: The name of the project to get the step configuration from.
    :param name:         The name of the step configuration to get.
    :param uid:          The uid of the step configuration to get.
    :param version:      The version of the step configuration to get.
    :param db_session:   The database session.

    :return: The step configuration from the database.
    """
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    try:
        # Parse the version if provided:
        uid, version = parse_version(uid, version)
        data = client.get_step_configuration(
            project_id=project_id,
            name=name,
            uid=uid,
            version=version,
            db_session=db_session,
        )
        if data is None:
            return APIResponse(
                success=False, error=f"Step configuration uid = {uid} not found"
            )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to get Step Configuration {uid} in project {project_name}: {e}",
        )


@router.put("/step_configuration/{name}")
def update_step_configuration(
    project_name: str,
    step_configuration: StepConfiguration,
    name: str,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Update a data source in the database.

    :param project_name:        The name of the project to update the data source in.
    :param step_configuration:  The step configuration to update.
    :param name:                The name of the step configuration to update.
    :param db_session:          The database session.

    :return: The response from the database.
    """
    try:
        data = client.update_step_configuration(
            name=name, step_configuration=step_configuration, db_session=db_session
        )
        return APIResponse(success=True, data=data)
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to update data source {name} in project {project_name}: {e} and workflow {workflow_name}: {e}",
        )


@router.delete("/step_configuration/{name}")
def delete_data_source(
    project_name: str,
    name: str,
    uid: str = None,
    version: str = None,
    db_session=Depends(get_db),
) -> APIResponse:
    """
    Delete a data source from the database.

    :param project_name: The name of the project to delete the step configuration from.
    :param name:         The name of the step configuration to delete.
    :param uid:          The ID of the step configuration to delete.
    :param version:      The version of the step configuration to delete.
    :param db_session:   The database session.

    return The response from the database.
    """
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    uid, version = parse_version(uid, version)
    try:
        client.delete_step_configuration(
            name=name,
            project_id=project_id,
            uid=uid,
            version=version,
            db_session=db_session,
        )
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"Failed to delete step configuration {uid} in project {project_name}: {e}",
        )
    return APIResponse(success=True)


@router.get("/step_configurations")
def list_data_sources(
    project_name: str,
    name: str = None,
    version: str = None,
    labels: Optional[List[Tuple[str, str]]] = None,
    mode: OutputMode = OutputMode.DETAILS,
    db_session=Depends(get_db),
    auth: AuthInfo = Depends(get_auth_user),
) -> APIResponse:
    """
    List data sources in the database.

    :param project_name:     The name of the project to list the step configurations from.
    :param name:             The name to filter by.
    :param version:          The version to filter by.
    :param labels:           The labels to filter by.
    :param mode:             The output mode.
    :param db_session:       The database session.
    :param auth:             The authentication information.

    :return: The response from the database.
    """
    owner = client.get_user(name=auth.username, db_session=db_session)
    owner_id = getattr(owner, "uid", None)
    project_id = client.get_project(name=project_name, db_session=db_session).uid
    try:
        data = client.list_step_configurations(
            project_id=project_id,
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
            error=f"Failed to list step configurations in project {project_name}: {e}",
        )
