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
import { promptTemplatesAtom, promptTemplatesWithFetchAtom } from '@atoms/promptTemplates'
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
import { PromptTemplate } from '@shared/types/promptTemplate'
import { useAtom } from 'jotai'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { TableColumn } from 'react-data-table-component'
import AddEditPromptTemplateModal from './AddEditPromptTemplateModal'

const PromptTemplatesTable: React.FC = () => {
  const [selectedRow, setSelectedRow] = useAtom(selectedRowAtom)
  const [promptTemplates] = useAtom(promptTemplatesAtom)

  const [selectedRows, setSelectedRows] = useState<PromptTemplate[]>([])
  const [editRow, setEditRow] = useState<PromptTemplate>({
    name: '',
    description: '',
    owner_id: '',
    project_id: '',
    text: '',
    arguments: []
  })
  const [filterText, setFilterText] = useState('')
  const [toggledClearRows, setToggleClearRows] = useState(false)

  const [columns] = useState([
    { name: 'name', selector: (row: Partial<PromptTemplate>) => row.name ?? '', sortable: true },
    { name: 'description', selector: (row: Partial<PromptTemplate>) => row.description ?? '', sortable: true },
    { name: 'version', selector: (row: Partial<PromptTemplate>) => row.version ?? '', sortable: true }
  ])

  const [, fetchPromptTemplates] = useAtom(promptTemplatesWithFetchAtom)

  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure()
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure()

  const toast = useToast()

  useEffect(() => {
    fetchPromptTemplates('default')
  }, [fetchPromptTemplates])

  const handleSave = async (promptTemplate: PromptTemplate) => {
    try {
      if (promptTemplate.uid) {
        await Client.updatePromptTemplate('default', promptTemplate)
        toast({ title: 'PromptTemplate updated.', status: 'success', duration: 3000, isClosable: true })
      } else {
        await Client.createPromptTemplate('default', promptTemplate)
        toast({ title: 'PromptTemplate added successfully.', status: 'success', duration: 3000, isClosable: true })
      }
      await fetchPromptTemplates('default')
      onDrawerClose()
    } catch (error) {
      console.error('Error saving promptTemplate:', error)
      toast({ title: 'Error saving promptTemplate.', status: 'error', duration: 3000, isClosable: true })
    }
  }

  const handleClearRows = useCallback(() => {
    setToggleClearRows(!toggledClearRows)
  }, [toggledClearRows])

  const handleDelete = useCallback(async () => {
    try {
      await Promise.all(selectedRows.map(row => Client.deletePromptTemplate('default', row.name as string)))
      setSelectedRows([])
      await fetchPromptTemplates('default')
      toast({ title: 'PromptTemplates deleted.', status: 'success', duration: 3000, isClosable: true })
    } catch (error) {
      console.error('Error deleting promptTemplates:', error)
      toast({ title: 'Error deleting promptTemplates.', status: 'error', duration: 3000, isClosable: true })
    }
    handleClearRows()
  }, [fetchPromptTemplates, selectedRows, toast, handleClearRows])

  const handleUpdate = async () => {
    try {
      await Client.updatePromptTemplate('default', selectedRow)
      toast({
        title: 'PromptTemplate updated.',
        description: 'The promptTemplate has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      await fetchPromptTemplates('default')
      onDrawerClose()
    } catch (error) {
      toast({
        title: 'Error updating promptTemplate.',
        description: 'There was an error updating the promptTemplate.',
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
            setEditRow({
              name: '',
              description: '',
              owner_id: '',
              project_id: '',
              text: '',
              arguments: []
            })
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
          { page: 'PromptTemplates', url: '/promptTemplates' }
        ]}
      />
      <DataTableComponent
        title={'PromptTemplates'}
        data={promptTemplates}
        columns={columns as TableColumn<Partial<PromptTemplate>>[]}
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
      <AddEditPromptTemplateModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        onSave={handleSave}
        promptTemplate={editRow}
      />
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
                <FormControl id="description" mb={4}>
                  <FormLabel>Description</FormLabel>
                  <Input type="text" name="description" value={selectedRow.description || ''} onChange={handleChange} />
                </FormControl>
                <FormControl id="path" mb={4}>
                  <FormLabel>Path</FormLabel>
                  <Input type="text" name="path" value={selectedRow.path || ''} onChange={handleChange} />
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

export default PromptTemplatesTable
