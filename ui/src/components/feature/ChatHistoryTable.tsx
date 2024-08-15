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

type ChatHistory = {
  user: string
}
const ChatHistoryTable = () => {
  const [selectedRows, setSelectedRows] = useState<ChatHistory[]>([])

  const data: DataRow<Partial<ChatHistory>>[] = [
    { id: 1, data: { user: 'John Doe' } },
    { id: 2, data: { user: 'Jane Smith' } },
    { id: 3, data: { user: 'Alice Johnson' } },
    { id: 4, data: { user: 'Bob Brown' } },
    { id: 5, data: { user: 'Charlie Davis' } },
    { id: 6, data: { user: 'Diana Evans' } },
    { id: 7, data: { user: 'Frank Green' } },
    { id: 8, data: { user: 'Grace Hill' } },
    { id: 9, data: { user: 'Henry Irving' } },
    { id: 10, data: { user: 'Isabel Jackson' } },
    { id: 11, data: { user: 'Isabel Jackson' } },
    { id: 12, data: { user: 'Isabel Jackson' } },
    { id: 13, data: { user: 'Isabel Jackson' } },
    { id: 14, data: { user: 'Isabel Jackson' } },
    { id: 15, data: { user: 'Isabel Jackson' } }
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
            url: '/chat-histories'
          }
        ]}
      />

      <DataTableComponent
        filterText={''}
        expandableRows
        title={'Chat Histories'}
        data={data}
        columns={columns}
        contextActions={contextActions}
        onSelectedRowChange={e => setSelectedRows(e.selectedRows)}
      />
    </Flex>
  )
}

export default ChatHistoryTable
