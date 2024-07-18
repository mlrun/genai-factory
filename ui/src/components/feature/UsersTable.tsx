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

import { DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { Button, Flex } from '@chakra-ui/react'
import Breadcrumbs from '@components/shared/Breadcrumbs'
import DataTableComponent from '@components/shared/Datatable'
import { colors } from '@shared/theme'
import { DataRow, User } from '@shared/types'
import { useMemo, useState } from 'react'

const UsersTable = () => {
  const [selectedRows, setSelectedRows] = useState<User[]>([])
  const data: DataRow<Partial<User>>[] = [
    { id: 1, data: { name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', registered: '2021-01-10' } },
    { id: 2, data: { name: 'Jane Smith', email: 'jane.smith@example.com', role: 'User', registered: '2021-02-14' } },
    {
      id: 3,
      data: { name: 'Alice Johnson', email: 'alice.johnson@example.com', role: 'User', registered: '2021-03-20' }
    },
    { id: 4, data: { name: 'Bob Brown', email: 'bob.brown@example.com', role: 'Moderator', registered: '2021-04-18' } },
    {
      id: 5,
      data: { name: 'Charlie Davis', email: 'charlie.davis@example.com', role: 'User', registered: '2021-05-22' }
    },
    { id: 6, data: { name: 'Diana Evans', email: 'diana.evans@example.com', role: 'User', registered: '2021-06-25' } },
    { id: 7, data: { name: 'Frank Green', email: 'frank.green@example.com', role: 'Admin', registered: '2021-07-30' } },
    { id: 8, data: { name: 'Grace Hill', email: 'grace.hill@example.com', role: 'User', registered: '2021-08-11' } },
    {
      id: 9,
      data: { name: 'Henry Irving', email: 'henry.irving@example.com', role: 'User', registered: '2021-09-15' }
    },
    {
      id: 10,
      data: { name: 'Isabel Jackson', email: 'isabel.jackson@example.com', role: 'Moderator', registered: '2021-10-19' }
    },
    {
      id: 11,
      data: { name: 'Isabel Jackson', email: 'isabel.jackson@example.com', role: 'Moderator', registered: '2021-10-19' }
    },
    {
      id: 12,
      data: { name: 'Isabel Jackson', email: 'isabel.jackson@example.com', role: 'Moderator', registered: '2021-10-19' }
    },
    {
      id: 13,
      data: { name: 'Isabel Jackson', email: 'isabel.jackson@example.com', role: 'Moderator', registered: '2021-10-19' }
    },
    {
      id: 14,
      data: { name: 'Isabel Jackson', email: 'isabel.jackson@example.com', role: 'Moderator', registered: '2021-10-19' }
    },
    {
      id: 15,
      data: { name: 'Isabel Jackson', email: 'isabel.jackson@example.com', role: 'Moderator', registered: '2021-10-19' }
    }
  ]

  const columns = [
    {
      name: 'Name',
      selector: (row: DataRow<Partial<User>>) => row.data.name ?? '',
      sortable: true
    },
    {
      name: 'Email',
      selector: (row: DataRow<Partial<User>>) => row.data.email ?? '',
      sortable: true
    },
    {
      name: 'Role',
      selector: (row: DataRow<Partial<User>>) => row.data.role ?? '',
      sortable: true
    },
    {
      name: 'Registered',
      selector: (row: DataRow<Partial<User>>) => row.data.registered ?? '',
      sortable: true
    }
  ]

  const contextActions = useMemo(() => {
    return (
      <Flex gap={4}>
        {selectedRows.length === 1 && (
          <Button key="edit" style={{ backgroundColor: colors.primary }} leftIcon={<EditIcon />}>
            Edit
          </Button>
        )}
        <Button key="delete" style={{ backgroundColor: colors.danger }} leftIcon={<DeleteIcon />}>
          Delete
        </Button>
      </Flex>
    )
  }, [selectedRows])

  return (
    <Flex p={4} flexDirection={'column'} flexGrow={'grow'} width={'100%'}>
      <Breadcrumbs
        crumbs={[
          {
            page: 'Admin',
            url: '/admin'
          },
          {
            page: 'Users',
            url: '/users'
          }
        ]}
      />

      <DataTableComponent
        title={'Users'}
        data={data}
        columns={columns}
        contextActions={contextActions}
        onSelectedRowChange={e => setSelectedRows(e.selectedRows)}
      />
    </Flex>
  )
}

export default UsersTable
