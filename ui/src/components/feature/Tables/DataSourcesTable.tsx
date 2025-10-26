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
import { DataSource, DataSourceType } from '@shared/types/dataSource';

import { useAuthStore } from '@stores/authStore';

import { dataSourceFields } from '@constants/index';

const DataSourcesTable = () => {
  const { user } = useAuthStore();
  const username = user?.username;

  const { data: publicUser } = useUser(username, !!username);

  const {
    create,
    data: dataSources = [],
    error,
    isLoading,
    project,
    remove,
    update,
  } = useProjectEntity<DataSource>(
    'dataSources',
    (projectName) => Client.getDataSources(projectName),
    (projectName, data) => Client.createDataSource(projectName, data),
    (projectName, data) => Client.updateDataSource(projectName, data),
    (projectName, id) => Client.deleteDataSource(projectName, id),
  );

  const projectUid = project?.uid ?? '';

  const newEntity: DataSource = useMemo(
    () => ({
      name: '',
      description: '',
      owner_id: publicUser?.uid ?? '',
      project_id: projectUid,
      data_source_type: DataSourceType.OTHER,
    }),
    [publicUser?.uid, projectUid],
  );

  const columns: TableColumn<Partial<DataSource>>[] = [
    { name: 'Name', selector: (row) => row.name ?? '', sortable: true },
    { name: 'Description', selector: (row) => row.description ?? '', sortable: true },
    { name: 'Version', selector: (row) => row.version ?? '', sortable: true },
    { name: 'Type', selector: (row) => row.data_source_type ?? '', sortable: true },
    { name: 'Created', selector: (row) => row.created ?? '', sortable: true },
  ];

  if (isLoading) return <Loading />;
  if (error) return <div>Failed to load data sources.</div>;

  return (
    <EntityTable
      title="DataSources"
      entityName="DataSource"
      fields={dataSourceFields}
      columns={columns}
      data={dataSources}
      createEntity={(d) => create.mutate(d)}
      updateEntity={(d) => update.mutate(d)}
      deleteEntity={(id) => remove.mutate(id)}
      newEntityDefaults={newEntity}
    />
  );
};

export default DataSourcesTable;
