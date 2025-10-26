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
import { useProjectEntity,useUser } from '@queries';
import Client from '@services/Api';
import { Dataset } from '@shared/types/dataset';

import { useAuthStore } from '@stores/authStore';

import { datasetFields } from '@constants/index';

const DatasetsTable = () => {
  const { user } = useAuthStore();
  const username = user?.username;

  const { data: publicUser } = useUser(username, !!username);

  const {
    create,
    data: datasets = [],
    error,
    isLoading,
    project,
    remove,
    update,
  } = useProjectEntity<Dataset>(
    'datasets',
    (projectName) => Client.getDatasets(projectName),
    (projectName, dataset) => Client.createDataset(projectName, dataset),
    (projectName, dataset) => Client.updateDataset(projectName, dataset),
    (projectName, id) => Client.deleteDataset(projectName, id),
  );
  const projectUid = project?.uid ?? '';

  const newEntity: Dataset = useMemo(
    () => ({
      name: '',
      description: '',
      owner_id: publicUser?.uid ?? '',
      project_id: projectUid,
      path: '',
      task: '',
    }),
    [publicUser?.uid, projectUid],
  );
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

  if (isLoading) return <Loading />;
  if (error) return <div>Failed to load datasets.</div>;

  return (
    <EntityTable
      title="Datasets"
      entityName="Dataset"
      fields={datasetFields}
      columns={columns}
      data={datasets}
      createEntity={(d) => create.mutate(d)}
      updateEntity={(d) => update.mutate(d)}
      deleteEntity={(id) => remove.mutate(id)}
      newEntityDefaults={newEntity}
    />
  );
};

export default DatasetsTable;
