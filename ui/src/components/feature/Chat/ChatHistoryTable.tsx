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
import { DataRow } from '@shared/types'
import { useMemo, useState } from 'react'
import { TableColumn } from 'react-data-table-component'

type ChatHistory = {
  user: string
}
const ChatHistoryTable = () => {
  const [selectedRows, setSelectedRows] = useState<ChatHistory[]>([])

  const data: Partial<ChatHistory>[] = [
    { user: 'John Doe' },
    { user: 'Jane Smith' },
    { user: 'Alice Johnson' },
    { user: 'Bob Brown' },
    { user: 'Charlie Davis' },
    { user: 'Diana Evans' },
    { user: 'Frank Green' },
    { user: 'Grace Hill' },
    { user: 'Henry Irving' },
    { user: 'Isabel Jackson' },
    { user: 'Isabel Jackson' },
    { user: 'Isabel Jackson' },
    { user: 'Isabel Jackson' },
    { user: 'Isabel Jackson' },
    { user: 'Isabel Jackson' }
  ]

  const columns = [
    {
      name: 'User',
      selector: (row: DataRow<Partial<ChatHistory>>) => row.data.user ?? '',
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
            page: 'Chat Histories',
            url: '/histories'
          }
        ]}
      />

      <DataTableComponent
        filterText={''}
        title={'Chat Histories'}
        data={data}
        columns={columns as TableColumn<Partial<ChatHistory>>[]}
        contextActions={contextActions}
        onSelectedRowChange={e => setSelectedRows(e.selectedRows)}
        toggleClearRows={false}
        onOpenDrawer={() => {}}
      />
    </Flex>
  )
}

export default ChatHistoryTable
