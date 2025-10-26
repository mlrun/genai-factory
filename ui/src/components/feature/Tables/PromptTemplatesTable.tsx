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
import { PromptTemplate } from '@shared/types/promptTemplate';

import { useAuthStore } from '@stores/authStore';

import { promptTemplateFields } from '@constants/index';

const PromptTemplatesTable = () => {
  const { user } = useAuthStore();
  const username = user?.username;

  const { data: publicUser } = useUser(username, !!username);

  const {
    create,
    data: promptTemplates = [],
    error,
    isLoading,
    project,
    remove,
    update,
  } = useProjectEntity<PromptTemplate>(
    'promptTemplates',
    (projectName) => Client.getPromptTemplates(projectName),
    (projectName, template) => Client.createPromptTemplate(projectName, template),
    (projectName, template) => Client.updatePromptTemplate(projectName, template),
    (projectName, id) => Client.deletePromptTemplate(projectName, id),
  );

  const projectUid = project?.uid ?? '';

  const newEntity: PromptTemplate = useMemo(
    () => ({
      name: '',
      description: '',
      text: '',
      arguments: ['prompt'],
      owner_id: publicUser?.uid ?? '',
      project_id: projectUid,
    }),
    [publicUser?.uid, projectUid],
  );

  const columns: TableColumn<Partial<PromptTemplate>>[] = [
    { name: 'Name', selector: (row) => row.name ?? '', sortable: true },
    { name: 'Description', selector: (row) => row.description ?? '', sortable: true },
    { name: 'Version', selector: (row) => row.version ?? '', sortable: true },
    { name: 'Text', selector: (row) => row.text ?? '', sortable: false },
    { name: 'Created', selector: (row) => row.created ?? '', sortable: true },
  ];

  if (isLoading) return <Loading />;
  if (error) return <div>Failed to load prompt templates.</div>;

  return (
    <EntityTable
      title="Prompt Templates"
      entityName="PromptTemplate"
      fields={promptTemplateFields}
      columns={columns}
      data={promptTemplates}
      createEntity={(d) => create.mutate(d)}
      updateEntity={(d) => update.mutate(d)}
      deleteEntity={(id) => remove.mutate(id)}
      newEntityDefaults={newEntity}
    />
  );
};

export default PromptTemplatesTable;
