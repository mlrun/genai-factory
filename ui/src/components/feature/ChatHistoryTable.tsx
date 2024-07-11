import { Flex } from '@chakra-ui/react'
import Breadcrumbs from '@components/shared/Breadcrumbs'
import DataTableComponent from '@components/shared/Datatable'
import { DataRow } from '@shared/types'

const ChatHistoryTable = () => {
  type ChatHistory = {
    user: string
  }
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

      <DataTableComponent expandableRows title={'Chat Histories'} data={data} columns={columns} />
    </Flex>
  )
}

export default ChatHistoryTable
