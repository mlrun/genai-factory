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

import React from 'react';
import { useAtom } from 'jotai';
import { TableColumn } from 'react-data-table-component';

import { projectAtom, publicUserAtom } from '@atoms/index';
import { workflowsAtom, workflowsWithFetchAtom } from '@atoms/workflows';
import EntityTable from '@components/shared/EntityTable';
import Client from '@services/Api';
import { Workflow, WorkflowType } from '@shared/types/workflow';

import { workflowFields } from '@constants/index';

const WorkflowsTable: React.FC = () => {
  const [workflows] = useAtom(workflowsAtom);
  const [, fetchWorkflows] = useAtom(workflowsWithFetchAtom);
  const [project] = useAtom(projectAtom);
  const [publicUser] = useAtom(publicUserAtom);

  const base = project?.name ?? '';
  const uid = project?.uid ?? '';

  const newEntity: Workflow = {
    name: '',
    description: '',
    deployment: '',
    version: '',
    workflow_type: WorkflowType.APPLICATION,
    owner_id: publicUser.uid as string,
    project_id: uid,
  };

  if (Object.keys(publicUser).length === 0) return;

  const columns: TableColumn<Partial<Workflow>>[] = [
    { name: 'Name', selector: (row) => row.name ?? '', sortable: true },
    {
      name: 'Description',
      selector: (row) => row.description ?? '',
      sortable: true,
    },
    { name: 'Version', selector: (row) => row.version ?? '', sortable: true },
    {
      name: 'Workflow Type',
      selector: (row) => row.workflow_type ?? '',
      sortable: true,
    },
    {
      name: 'Deployment',
      selector: (row) => row.deployment ?? '',
      sortable: true,
    },
    { name: 'Created', selector: (row) => row.created ?? '', sortable: true },
  ];

  return (
    <EntityTable
      title="Workflows"
      entityName="Workflow"
      fields={workflowFields}
      columns={columns}
      data={workflows}
      fetchEntities={() => fetchWorkflows(base)}
      createEntity={(d) => Client.createWorkflow(base, d)}
      updateEntity={(d) => Client.updateWorkflow(base, d)}
      deleteEntity={(id) => Client.deleteWorkflow(base, id)}
      newEntityDefaults={newEntity}
    />
  );
};

export default WorkflowsTable;
