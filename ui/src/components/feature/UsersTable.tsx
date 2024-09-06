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

import { selectedRowAtom } from '@atoms/index'
import { usersAtom, usersWithFetchAtom } from '@atoms/users'
import { AddIcon, DeleteIcon } from '@chakra-ui/icons'
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Flex,
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
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
  const [selectedRow, setSelectedRow] = useAtom(selectedRowAtom)
  const [editRow, setEditRow] = useState<User>({ name: '', email: '', full_name: '' })
  const [filterText, setFilterText] = useState('')
  const [toggledClearRows, setToggleClearRows] = useState(false)

  const [users] = useAtom(usersAtom)

  const [columns] = useState([
    { name: 'Username', selector: (row: Partial<User>) => row.name ?? '', sortable: true },
    { name: 'Email', selector: (row: Partial<User>) => row.email ?? '', sortable: true },
    { name: 'Full Name', selector: (row: Partial<User>) => row.full_name ?? '', sortable: true }
  ])

  const [, fetchUsers] = useAtom(usersWithFetchAtom)

  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure()
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure()

  const toast = useToast()

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSave = async (user: User) => {
    try {
      if (user.uid) {
        await Client.updateUser(user)
        toast({ title: 'User updated.', status: 'success', duration: 3000, isClosable: true })
      } else {
        await Client.createUser(user)
        toast({ title: 'User added successfully.', status: 'success', duration: 3000, isClosable: true })
      }
      await fetchUsers()
      onDrawerClose()
    } catch (error) {
      console.error('Error saving user:', error)
      toast({ title: 'Error saving user.', status: 'error', duration: 3000, isClosable: true })
    }
  }

  const handleClearRows = useCallback(() => {
    setToggleClearRows(!toggledClearRows)
  }, [toggledClearRows])

  const handleDelete = useCallback(async () => {
    try {
      await Promise.all(selectedRows.map(row => Client.deleteUser(row.name as string)))
      setSelectedRows([])
      await fetchUsers()
      toast({ title: 'Users deleted.', status: 'success', duration: 3000, isClosable: true })
    } catch (error) {
      console.error('Error deleting users:', error)
      toast({ title: 'Error deleting users.', status: 'error', duration: 3000, isClosable: true })
    }
    handleClearRows()
  }, [fetchUsers, selectedRows, toast, handleClearRows])

  const handleUpdate = async () => {
    try {
      await Client.updateUser(selectedRow)
      toast({
        title: 'User updated.',
        description: 'The user has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      await fetchUsers()
      onDrawerClose()
    } catch (error) {
      toast({
        title: 'Error updating user.',
        description: 'There was an error updating the user.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSelectedRow({ ...selectedRow, [name]: value })
  }

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
            onModalOpen()
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
        onSelectedRowChange={e => {
          setSelectedRows(e.selectedRows)
        }}
        subheaderComponent={subHeaderComponentMemo}
        filterText={filterText}
        onOpenDrawer={() => {
          onDrawerOpen()
        }}
        toggleClearRows={toggledClearRows}
      />
      <AddEditUserModal isOpen={isModalOpen} onClose={onModalClose} onSave={handleSave} user={editRow} />
      <Drawer placement="right" size={'xl'} isOpen={isDrawerOpen} onClose={onDrawerClose}>
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">{selectedRow?.name} </DrawerHeader>
          <DrawerBody>
            <Flex height={250} gap={10}>
              <Flex width={'100%'} flexDirection={'column'}>
                <FormControl id="name" mb={4}>
                  <FormLabel>Name</FormLabel>
                  <Input type="text" name="name" value={selectedRow.name || ''} onChange={handleChange} />
                </FormControl>
                <FormControl id="email" mb={4}>
                  <FormLabel>Email</FormLabel>
                  <Input type="email" name="email" value={selectedRow.email || ''} onChange={handleChange} />
                </FormControl>
                <FormControl id="full_name" mb={4}>
                  <FormLabel>Full Name</FormLabel>
                  <Input type="text" name="full_name" value={selectedRow.full_name || ''} onChange={handleChange} />
                </FormControl>
              </Flex>
            </Flex>
            <Button marginTop={4} onClick={handleUpdate}>
              Save changes
            </Button>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  )
}

export default UsersTable
