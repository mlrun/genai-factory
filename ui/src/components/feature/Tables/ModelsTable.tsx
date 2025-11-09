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
import { modelsAtom, modelsWithFetchAtom } from '@atoms/models';
import EntityTable from '@components/shared/EntityTable';
import Client from '@services/Api';
import { Model, ModelType } from '@shared/types/model';

import { modelFields } from '@constants/index';

const ModelsTable: React.FC = () => {
  const [models] = useAtom(modelsAtom);
  const [, fetchModels] = useAtom(modelsWithFetchAtom);
  const [project] = useAtom(projectAtom);
  const [publicUser] = useAtom(publicUserAtom);

  const base = project?.name ?? '';
  const uid = project?.uid ?? '';

  const newEntity: Model = {
    name: '',
    description: '',
    base_model: '',
    model_type: ModelType.MODEL,
    owner_id: publicUser.uid as string,
    project_id: uid,
  };

  if (Object.keys(publicUser).length === 0) return;

  const columns: TableColumn<Partial<Model>>[] = [
    { name: 'Name', selector: (row) => row.name ?? '', sortable: true },
    {
      name: 'Description',
      selector: (row) => row.description ?? '',
      sortable: true,
    },
    { name: 'Version', selector: (row) => row.version ?? '', sortable: true },
    {
      name: 'Base Model',
      selector: (row) => row.base_model ?? '',
      sortable: true,
    },
    {
      name: 'Model Type',
      selector: (row) => row.model_type ?? '',
      sortable: true,
    },
    { name: 'Task', selector: (row) => row.task ?? '', sortable: true },
    { name: 'Path', selector: (row) => row.path ?? '', sortable: true },
    { name: 'Producer', selector: (row) => row.producer ?? '', sortable: true },
    {
      name: 'Deployment',
      selector: (row) => row.deployment ?? '',
      sortable: true,
    },
    { name: 'Created', selector: (row) => row.created ?? '', sortable: true },
  ];

  return (
    <EntityTable
      title="Models"
      entityName="Model"
      fields={modelFields}
      columns={columns}
      data={models}
      fetchEntities={() => fetchModels(base)}
      createEntity={(d) => Client.createModel(base, d)}
      updateEntity={(d) => Client.updateModel(base, d)}
      deleteEntity={(id) => Client.deleteModel(base, id)}
      newEntityDefaults={newEntity}
    />
  );
};

export default ModelsTable;
