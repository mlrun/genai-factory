import { Flex } from '@chakra-ui/react'
import Breadcrumbs from '@components/shared/Breadcrumbs'
import DataTableComponent from '@components/shared/Datatable'
import { DataRow, User } from '@shared/types'

const UsersTable = () => {
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

      <DataTableComponent title={'Users'} data={data} columns={columns} />
    </Flex>
  )
}

export default UsersTable
