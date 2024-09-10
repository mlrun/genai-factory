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
import { modelsAtom, modelsWithFetchAtom } from '@atoms/models'
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
import { Model, ModelType } from '@shared/types/model'
import { useAtom } from 'jotai'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { TableColumn } from 'react-data-table-component'
import AddEditModelModal from './AddEditModelModal'

const ModelsTable: React.FC = () => {
  const [selectedRow, setSelectedRow] = useAtom(selectedRowAtom)
  const [models] = useAtom(modelsAtom)

  const [selectedRows, setSelectedRows] = useState<Model[]>([])
  const [editRow, setEditRow] = useState<Model>({
    name: '',
    description: '',
    owner_id: '',
    project_id: '',
    model_type: ModelType.MODEL,
    base_model: ''
  })
  const [filterText, setFilterText] = useState('')
  const [toggledClearRows, setToggleClearRows] = useState(false)

  const [columns] = useState([
    { name: 'name', selector: (row: Partial<Model>) => row.name ?? '', sortable: true },
    { name: 'description', selector: (row: Partial<Model>) => row.description ?? '', sortable: true },
    { name: 'version', selector: (row: Partial<Model>) => row.version ?? '', sortable: true }
  ])

  const [, fetchModels] = useAtom(modelsWithFetchAtom)

  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure()
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure()

  const toast = useToast()

  useEffect(() => {
    fetchModels('default')
  }, [fetchModels])

  const handleSave = async (model: Model) => {
    try {
      if (model.uid) {
        await Client.updateModel('default', model)
        toast({ title: 'Model updated.', status: 'success', duration: 3000, isClosable: true })
      } else {
        await Client.createModel('default', model)
        toast({ title: 'Model added successfully.', status: 'success', duration: 3000, isClosable: true })
      }
      await fetchModels('default')
      onDrawerClose()
    } catch (error) {
      console.error('Error saving model:', error)
      toast({ title: 'Error saving model.', status: 'error', duration: 3000, isClosable: true })
    }
  }

  const handleClearRows = useCallback(() => {
    setToggleClearRows(!toggledClearRows)
  }, [toggledClearRows])

  const handleDelete = useCallback(async () => {
    try {
      await Promise.all(selectedRows.map(row => Client.deleteModel('default', row.name as string)))
      setSelectedRows([])
      await fetchModels('default')
      toast({ title: 'Models deleted.', status: 'success', duration: 3000, isClosable: true })
    } catch (error) {
      console.error('Error deleting models:', error)
      toast({ title: 'Error deleting models.', status: 'error', duration: 3000, isClosable: true })
    }
    handleClearRows()
  }, [fetchModels, selectedRows, toast, handleClearRows])

  const handleUpdate = async () => {
    try {
      await Client.updateModel('default', selectedRow)
      toast({
        title: 'Model updated.',
        description: 'The model has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      await fetchModels('default')
      onDrawerClose()
    } catch (error) {
      toast({
        title: 'Error updating model.',
        description: 'There was an error updating the model.',
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
              model_type: ModelType.MODEL,
              base_model: ''
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
          { page: 'Models', url: '/models' }
        ]}
      />
      <DataTableComponent
        title={'Models'}
        data={models}
        columns={columns as TableColumn<Partial<Model>>[]}
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
      <AddEditModelModal isOpen={isModalOpen} onClose={onModalClose} onSave={handleSave} model={editRow} />
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

export default ModelsTable
