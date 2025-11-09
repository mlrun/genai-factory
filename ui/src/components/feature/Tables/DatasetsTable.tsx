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

import { datasetsAtom, datasetsWithFetchAtom } from '@atoms/datasets';
import { projectAtom, publicUserAtom } from '@atoms/index';
import EntityTable from '@components/shared/EntityTable';
import Client from '@services/Api';
import { Dataset } from '@shared/types/dataset';

import { datasetFields } from '@constants/index';

const DatasetsTable: React.FC = () => {
  const [datasets] = useAtom(datasetsAtom);
  const [, fetchDatasets] = useAtom(datasetsWithFetchAtom);
  const [project] = useAtom(projectAtom);
  const [publicUser] = useAtom(publicUserAtom);

  const base = project?.name ?? '';
  const uid = project?.uid ?? '';

  const newEntity: Dataset = {
    name: '',
    description: '',
    owner_id: publicUser.uid as string,
    project_id: uid,
    path: '',
    task: '',
  };

  if (Object.keys(publicUser).length === 0) return;

  const columns: TableColumn<Partial<Dataset>>[] = [
    { name: 'Name', selector: (row) => row.name ?? '', sortable: true },
    {
      name: 'Description',
      selector: (row) => row.description ?? '',
      sortable: true,
    },
    { name: 'Version', selector: (row) => row.version ?? '', sortable: true },
    { name: 'Task', selector: (row) => row.task ?? '', sortable: true },
    { name: 'Path', selector: (row) => row.path ?? '', sortable: true },
    { name: 'Producer', selector: (row) => row.producer ?? '', sortable: true },
    { name: 'Created', selector: (row) => row.created ?? '', sortable: true },
  ];

  return (
    <EntityTable
      title="Datasets"
      entityName="Dataset"
      fields={datasetFields}
      columns={columns}
      data={datasets}
      fetchEntities={() => fetchDatasets(base)}
      createEntity={(d) => Client.createDataset(base, d)}
      updateEntity={(d) => Client.updateDataset(base, d)}
      deleteEntity={(id) => Client.deleteDataset(base, id)}
      newEntityDefaults={newEntity}
    />
  );
};

export default DatasetsTable;
