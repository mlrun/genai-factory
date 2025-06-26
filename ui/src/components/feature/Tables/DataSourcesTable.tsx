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

import React from 'react'
import { dataSourcesAtom, dataSourcesWithFetchAtom } from '@atoms/dataSources'
import { useAtom } from 'jotai'
import { publicUserAtom, projectAtom } from '@atoms/index'
import Client from '@services/Api'
import { TableColumn } from 'react-data-table-component'
import { DataSource, DataSourceType } from '@shared/types/dataSource'
import EntityTable from '@components/shared/EntityTable'
import { dataSourceFields } from '@constants/index';

const DataSourcesTable: React.FC = () => {
  const [dataSources] = useAtom(dataSourcesAtom)
  const [, fetchDataSources] = useAtom(dataSourcesWithFetchAtom)
  const [project] = useAtom(projectAtom)
  const [publicUser] = useAtom(publicUserAtom)

  const base = project?.name ?? ''
  const uid = project?.uid ?? ''

  const newEntity: DataSource = {
    name: '',
    description: '',
    owner_id: publicUser.uid as string,
    project_id: uid,
    data_source_type: DataSourceType.OTHER
  }

  if(Object.keys(publicUser).length === 0) return;

  const columns: TableColumn<Partial<DataSource>>[] = [
    { name: 'Name', selector: row => row.name ?? '', sortable: true },
    { name: 'Description', selector: row => row.description ?? '', sortable: true },
    { name: 'Version', selector: row => row.version ?? '', sortable: true },
    { name: 'Type', selector: row => row.data_source_type ?? '', sortable: true },
    { name: 'Created', selector: row => row.created ?? '', sortable: true }
  ]

  return (
    <EntityTable
      title="DataSources"
      entityName="DataSource"
      fields={dataSourceFields}
      columns={columns}
      data={dataSources}
      fetchEntities={() => fetchDataSources(base)}
      createEntity={d => Client.createDataSource(base, d)}
      updateEntity={d => Client.updateDataSource(base, d)}
      deleteEntity={id => Client.deleteDataSource(base, id)}
      newEntityDefaults={newEntity}
    />
  )
}

export default DataSourcesTable
