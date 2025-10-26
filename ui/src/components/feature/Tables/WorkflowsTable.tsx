// Copyright 2024 Iguazio
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useMemo } from 'react';
import { TableColumn } from 'react-data-table-component';

import EntityTable from '@components/shared/EntityTable';
import Loading from '@components/shared/Loading';
import { useProjectEntity, useUser } from '@queries';
import Client from '@services/Api';
import { Workflow, WorkflowType } from '@shared/types/workflow';

import { useAuthStore } from '@stores/authStore';

import { workflowFields } from '@constants/index';

const WorkflowsTable = () => {
  const { user } = useAuthStore();
  const username = user?.username;

  const { data: publicUser } = useUser(username, !!username);

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

  const columns: TableColumn<Partial<Workflow>>[] = [
    { name: 'Name', selector: (row) => row.name ?? '', sortable: true },
    { name: 'Description', selector: (row) => row.description ?? '', sortable: true },
    { name: 'Version', selector: (row) => row.version ?? '', sortable: true },
    { name: 'Workflow Type', selector: (row) => row.workflow_type ?? '', sortable: true },
    { name: 'Deployment', selector: (row) => row.deployment ?? '', sortable: true },
    { name: 'Created', selector: (row) => row.created ?? '', sortable: true },
  ];

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
    />
  );
};

export default WorkflowsTable;
