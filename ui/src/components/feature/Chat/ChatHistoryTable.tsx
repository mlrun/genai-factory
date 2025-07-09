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
import DataTableComponent from '@components/shared/Datatable'
import { colors } from '@shared/theme'
import { ChatHistory } from '@shared/types'
import { useMemo, useState } from 'react'
import { TableColumn } from 'react-data-table-component'

const ChatHistoryTable = () => {
  const [selectedRows, setSelectedRows] = useState<ChatHistory[]>([])

  const data: Partial<ChatHistory>[] = [
    {
      name: 'Guest',
      content: 'Hello, how can I help you?',
      role: 'assistant',
      sources: [],
    },
    {
      name: 'John Doe',
      content: 'I need help with my project.',
      role: 'user',
      sources: [],
    },
    {
      name: 'Jane Smith',
      content: 'Can you explain how MLRun works?',
      role: 'user',
      sources: [],
    },
    {
      name: 'Alice Johnson',
      content: 'Sure, here’s a quick overview of MLRun...',
      role: 'assistant',
      sources: [{ title: 'MLRun Docs', source: 'https://docs.mlrun.org' }],
    },
    {
      name: 'Bob Brown',
      content: 'What is the best way to deploy a function?',
      role: 'user',
      sources: [],
    },
    {
      name: 'Charlie Davis',
      content: 'You can use Nuclio or Kubernetes jobs.',
      role: 'assistant',
      sources: [{ title: 'Deployment Options', source: 'https://docs.mlrun.org/en/latest/deploy/' }],
    },
    {
      name: 'Diana Evans',
      content: 'I got an error when running my pipeline.',
      role: 'user',
      sources: [],
    },
    {
      name: 'Frank Green',
      content: 'Please check the logs for more details.',
      role: 'assistant',
      sources: [],
    },
    {
      name: 'Grace Hill',
      content: 'Can I customize the image used in the function?',
      role: 'user',
      sources: [],
    },
    {
      name: 'Henry Irving',
      content: 'Yes, just set the `image` field when defining the function.',
      role: 'assistant',
      sources: [],
    },
    {
      name: 'Isabel Jackson',
      content: 'Thanks for the help!',
      role: 'user',
      sources: [],
    },
    {
      name: 'Isabel Jackson',
      content: 'Can you save this session?',
      role: 'user',
      sources: [],
    },
    {
      name: 'Isabel Jackson',
      content: 'What are the available datasets?',
      role: 'user',
      sources: [],
    },
    {
      name: 'Isabel Jackson',
      content: 'Please provide an example.',
      role: 'user',
      sources: [],
    },
  ]

  const columns = [
    {
      name: 'User Name',
      selector: (row: ChatHistory) => {
        return row.name ?? ''
      },
      sortable: true
    },
    {
      name: 'Role',
      selector: (row: ChatHistory) => {
        return row.role ?? ''
      },
      sortable: true
    },
    {
      name: 'Message',
      selector: (row: ChatHistory) => {
        return row.content ?? ''
      },
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
