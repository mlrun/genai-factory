/*
Copyright 2024 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import EntityTable from '@components/shared/EntityTable';
import Loading from '@components/shared/Loading';
import { useProjectEntity, useUser } from '@queries';
import Client from '@services/Api';
import { Workflow, WorkflowType } from '@shared/types/workflow';
import { ColumnDef } from '@tanstack/react-table';

import { workflowFields } from '@constants';

const WorkflowsPage = () => {
  const { data: publicUser } = useUser();
  const navigate = useNavigate();

  const {
    create,
    data: workflows = [],
    error,
    isLoading,
    project,
    remove,
    update,
  } = useProjectEntity<Workflow>(
    'workflows',
    (projectName) => Client.getWorkflows(projectName),
    (projectName, workflow) => Client.createWorkflow(projectName, workflow),
    (projectName, workflow) => Client.updateWorkflow(projectName, workflow),
    (projectName, id) => Client.deleteWorkflow(projectName, id),
  );

  const projectUid = project?.uid ?? '';

  const newEntity: Workflow = useMemo(
    () => ({
      name: '',
      description: '',
      deployment: '',
      version: '',
      workflow_type: WorkflowType.APPLICATION,
      owner_id: publicUser?.uid ?? '',
      project_id: projectUid,
    }),
    [publicUser?.uid, projectUid],
  );

  const columns: ColumnDef<Workflow>[] = useMemo(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
      },
      {
        header: 'Description',
        accessorKey: 'description',
      },
      {
        header: 'Version',
        accessorKey: 'version',
      },
      {
        header: 'Workflow Type',
        accessorKey: 'workflow_type',
      },
      {
        header: 'Deployment',
        accessorKey: 'deployment',
      },
      {
        header: 'Created',
        accessorKey: 'created',
      },
    ],
    [],
  );

  if (isLoading) return <Loading />;
  if (error) return <div>Failed to load workflows.</div>;

  return (
    <EntityTable
      title="Workflows"
      entityName="Workflow"
      fields={workflowFields}
      columns={columns}
      data={workflows}
      createEntity={(d) => create.mutate(d)}
      updateEntity={(d) => update.mutate(d)}
      deleteEntity={(id) => remove.mutate(id)}
      newEntityDefaults={newEntity}
      onRowClick={(workflow) => navigate(workflow.name)}
    />
  );
};

export default WorkflowsPage;
