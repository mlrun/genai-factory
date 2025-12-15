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

import EntityTable from '@components/shared/EntityTable';
import Loading from '@components/shared/Loading';
import { useProjectEntity, useUser } from '@queries';
import Client from '@services/Api';
import { DataSource, DataSourceType } from '@shared/types/dataSource';
import { ColumnDef } from '@tanstack/react-table';

import { dataSourceFields } from '@constants';

const DataSourcesPage = () => {
  const { data: publicUser } = useUser();

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

  const columns: ColumnDef<DataSource>[] = useMemo(
    () => [
      { header: 'Name', accessorKey: 'name' },
      { header: 'Description', accessorKey: 'description' },
      { header: 'Version', accessorKey: 'version' },
      { header: 'Type', accessorKey: 'data_source_type' },
      { header: 'Created', accessorKey: 'created' },
    ],
    [],
  );

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

export default DataSourcesPage;
