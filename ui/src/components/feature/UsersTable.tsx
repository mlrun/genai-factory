import { selectedUserAtom } from '@atoms/index'
import { AddIcon, DeleteIcon, UpDownIcon } from '@chakra-ui/icons'
import { Button, Flex, useDisclosure, useToast } from '@chakra-ui/react'
import Breadcrumbs from '@components/shared/Breadcrumbs'
import DataTableComponent from '@components/shared/Datatable'
import FilterComponent from '@components/shared/Filter'
import { colors } from '@shared/theme'
import { DataRow, User } from '@shared/types'
import { useAtom } from 'jotai'
import React, { useMemo, useState } from 'react'

const UsersTable: React.FC = () => {
  const [selectedRows, setSelectedRows] = useState<DataRow<Partial<User>>[]>([])
  const [data, setData] = useState<DataRow<Partial<User>>[]>([
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
    }
  ])
  const [editRow, setEditRow] = useState<User>()
  const [filterText, setFilterText] = useState('')

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const [selectedUser, setSelectedUser] = useAtom<User>(selectedUserAtom)

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

  // useEffect(() => {
  //   async function fetchData() {
  //     const users = await Client.getUsers()

  //     if (users) {
  //       setUsers(users)
  //     } else {
  //       setUsers([])
  //     }
  //   }
  //   fetchData()
  // }, [])

  const handleSave = (user: Partial<User>) => {
    if (user.id) {
      setData(data.map(item => (item.data.id === user.id ? { id: item.id, data: user } : item)))
      toast({
        title: 'User updated.',
        description: 'The user has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } else {
      const newId = data.length ? Math.max(...data.map(item => item.id)) + 1 : 1
      const newUser = { id: newId, data: user }
      setData([...data, newUser])
      toast({
        title: 'User added.',
        description: 'A new user has been added successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    }
  }

  const handleDelete = () => {
    // setData(data.filter(item => !selectedRows.includes(item.data as User)))
    setSelectedRows([])
    toast({
      title: 'Users deleted.',
      description: 'The selected users have been deleted successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true
    })
  }

  const contextActions = useMemo(() => {
    return (
      <Flex gap={4}>
        {selectedRows.length === 2 && (
          <Button
            key="compare"
            style={{ backgroundColor: colors.gray700 }}
            leftIcon={<UpDownIcon />}
            onClick={() => {
              setSelectedUser(selectedRows[0].data as User)
              onOpen()
            }}
          >
            Compare
          </Button>
        )}
        <Button
          key="delete"
          style={{ backgroundColor: colors.danger }}
          leftIcon={<DeleteIcon />}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </Flex>
    )
  }, [selectedRows])

  const subHeaderComponentMemo = useMemo(() => {
    return (
      <Flex gap={4}>
        <FilterComponent
          onFilter={(e: React.ChangeEvent<HTMLInputElement>) => setFilterText(e.target.value)}
          filterText={filterText}
        />
        <Button
          bg={colors.mintDark}
          _hover={{ backgroundColor: colors.mint }}
          leftIcon={<AddIcon />}
          onClick={() => {
            setEditRow({ id: '', name: '', email: '', role: '', registered: '', username: '' })
            onOpen()
          }}
        >
          Add New
        </Button>
      </Flex>
    )
  }, [filterText])

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
        subheaderComponent={subHeaderComponentMemo}
        filterText={filterText}
      />
      {/* <AddEditUserModal isOpen={isOpen} onClose={onClose} onSave={handleSave} user={editRow as User} /> */}
    </Flex>
  )
}

export default UsersTable
