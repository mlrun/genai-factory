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

import { usersAtom, usersWithFetchAtom } from '@atoms/apiAtoms'
import { AddIcon, DeleteIcon } from '@chakra-ui/icons'
import { Button, Flex, useDisclosure, useToast } from '@chakra-ui/react'
import Breadcrumbs from '@components/shared/Breadcrumbs'
import DataTableComponent from '@components/shared/Datatable'
import FilterComponent from '@components/shared/Filter'
import Client from '@services/Api'
import { User } from '@shared/types'
import { useAtom } from 'jotai'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { TableColumn } from 'react-data-table-component'
import AddEditUserModal from './AddEditUserModal'

const UsersTable: React.FC = () => {
  const [selectedRows, setSelectedRows] = useState<User[]>([])
  const [, fetchUsers] = useAtom(usersWithFetchAtom)

  const [editRow, setEditRow] = useState<User>({ name: '', email: '', full_name: '' })
  const [filterText, setFilterText] = useState('')

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const [users] = useAtom(usersAtom)

  const [columns] = useState([
    { name: 'Username', selector: (row: Partial<User>) => row.name ?? '', sortable: true },
    { name: 'Email', selector: (row: Partial<User>) => row.email ?? '', sortable: true },
    { name: 'Full Name', selector: (row: Partial<User>) => row.full_name ?? '', sortable: true }
  ])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSave = async (user: User) => {
    try {
      if (user.uid) {
        await Client.updateUser(user.uid, user)
        toast({ title: 'User updated.', status: 'success', duration: 3000, isClosable: true })
      } else {
        await Client.createUser(user)
        toast({ title: 'User added successfully.', status: 'success', duration: 3000, isClosable: true })
      }
      await fetchUsers()
      onClose()
    } catch (error) {
      console.error('Error saving user:', error)
      toast({ title: 'Error saving user.', status: 'error', duration: 3000, isClosable: true })
    }
  }

  const handleDelete = useCallback(async () => {
    try {
      await Promise.all(selectedRows.map(row => Client.deleteUser(row.uid as string)))
      setSelectedRows([])
      await fetchUsers()
      toast({ title: 'Users deleted.', status: 'success', duration: 3000, isClosable: true })
    } catch (error) {
      console.error('Error deleting users:', error)
      toast({ title: 'Error deleting users.', status: 'error', duration: 3000, isClosable: true })
    }
  }, [fetchUsers, selectedRows, toast])

  const contextActions = useMemo(
    () => (
      <Button key="delete" leftIcon={<DeleteIcon />} onClick={handleDelete}>
        Delete
      </Button>
    ),
    [handleDelete]
  )

  const subHeaderComponentMemo = useMemo(
    () => (
      <Flex gap={4}>
        <FilterComponent onFilter={e => setFilterText(e.target.value)} filterText={filterText} />
        <Button
          leftIcon={<AddIcon />}
          onClick={() => {
            setEditRow({ name: '', email: '', full_name: '' })
            onOpen()
          }}
        >
          New
        </Button>
      </Flex>
    ),
    [filterText]
  )

  return (
    <Flex p={4} flexDirection={'column'} width={'100%'}>
      <Breadcrumbs
        crumbs={[
          { page: 'Admin', url: '/admin' },
          { page: 'Users', url: '/users' }
        ]}
      />
      <DataTableComponent
        title={'Users'}
        data={users}
        columns={columns as TableColumn<Partial<User>>[]}
        contextActions={contextActions}
        onSelectedRowChange={e => setSelectedRows(e.selectedRows)}
        subheaderComponent={subHeaderComponentMemo}
        filterText={filterText}
      />
      <AddEditUserModal isOpen={isOpen} onClose={onClose} onSave={handleSave} user={editRow} />
    </Flex>
  )
}

export default UsersTable
