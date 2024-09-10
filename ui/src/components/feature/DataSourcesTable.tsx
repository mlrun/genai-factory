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

import { dataSourcesAtom, dataSourcesWithFetchAtom } from '@atoms/dataSources'
import { selectedRowAtom } from '@atoms/index'
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
import { DataSource, DataSourceType } from '@shared/types/dataSource'
import { useAtom } from 'jotai'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { TableColumn } from 'react-data-table-component'
import AddEditDataSourceModal from './AddEditDataSourceModal'

const DataSourcesTable: React.FC = () => {
  const [selectedRow, setSelectedRow] = useAtom(selectedRowAtom)
  const [dataSources] = useAtom(dataSourcesAtom)

  const [selectedRows, setSelectedRows] = useState<DataSource[]>([])
  const [editRow, setEditRow] = useState<DataSource>({
    name: '',
    description: '',
    owner_id: '',
    project_id: '',
    data_source_type: DataSourceType.OTHER
  })
  const [filterText, setFilterText] = useState('')
  const [toggledClearRows, setToggleClearRows] = useState(false)

  const [columns] = useState([
    { name: 'name', selector: (row: Partial<DataSource>) => row.name ?? '', sortable: true },
    { name: 'description', selector: (row: Partial<DataSource>) => row.description ?? '', sortable: true },
    { name: 'version', selector: (row: Partial<DataSource>) => row.version ?? '', sortable: true }
  ])

  const [, fetchDataSources] = useAtom(dataSourcesWithFetchAtom)

  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure()
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure()

  const toast = useToast()

  useEffect(() => {
    fetchDataSources('default')
  }, [fetchDataSources])

  const handleSave = async (dataSource: DataSource) => {
    try {
      if (dataSource.uid) {
        await Client.updateDataSource('default', dataSource)
        toast({ title: 'DataSource updated.', status: 'success', duration: 3000, isClosable: true })
      } else {
        await Client.createDataSource('default', dataSource)
        toast({ title: 'DataSource added successfully.', status: 'success', duration: 3000, isClosable: true })
      }
      await fetchDataSources('default')
      onDrawerClose()
    } catch (error) {
      console.error('Error saving dataSource:', error)
      toast({ title: 'Error saving dataSource.', status: 'error', duration: 3000, isClosable: true })
    }
  }

  const handleClearRows = useCallback(() => {
    setToggleClearRows(!toggledClearRows)
  }, [toggledClearRows])

  const handleDelete = useCallback(async () => {
    try {
      await Promise.all(selectedRows.map(row => Client.deleteDataSource('default', row.name as string)))
      setSelectedRows([])
      await fetchDataSources('default')
      toast({ title: 'DataSources deleted.', status: 'success', duration: 3000, isClosable: true })
    } catch (error) {
      console.error('Error deleting dataSources:', error)
      toast({ title: 'Error deleting dataSources.', status: 'error', duration: 3000, isClosable: true })
    }
    handleClearRows()
  }, [fetchDataSources, selectedRows, toast, handleClearRows])

  const handleUpdate = async () => {
    try {
      await Client.updateDataSource('default', selectedRow)
      toast({
        title: 'DataSource updated.',
        description: 'The dataSource has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      await fetchDataSources('default')
      onDrawerClose()
    } catch (error) {
      toast({
        title: 'Error updating dataSource.',
        description: 'There was an error updating the dataSource.',
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
              data_source_type: DataSourceType.OTHER
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
          { page: 'DataSources', url: '/dataSources' }
        ]}
      />
      <DataTableComponent
        title={'DataSources'}
        data={dataSources}
        columns={columns as TableColumn<Partial<DataSource>>[]}
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
      <AddEditDataSourceModal isOpen={isModalOpen} onClose={onModalClose} onSave={handleSave} dataSource={editRow} />
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
                <FormControl id="version" mb={4}>
                  <FormLabel>Version</FormLabel>
                  <Input type="text" name="version" value={selectedRow.version || ''} onChange={handleChange} />
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

export default DataSourcesTable
