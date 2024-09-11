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

import { documentsAtom, documentsWithFetchAtom } from '@atoms/documents'
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
import { Document } from '@shared/types/document'
import { useAtom } from 'jotai'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { TableColumn } from 'react-data-table-component'
import AddEditDocumentModal from './AddEditDocumentModal'

const DocumentsTable: React.FC = () => {
  const [selectedRow, setSelectedRow] = useAtom(selectedRowAtom)
  const [documents] = useAtom(documentsAtom)

  const [selectedRows, setSelectedRows] = useState<Document[]>([])
  const [editRow, setEditRow] = useState<Document>({
    name: '',
    description: '',
    owner_id: '',
    project_id: '',
    path: ''
  })
  const [filterText, setFilterText] = useState('')
  const [toggledClearRows, setToggleClearRows] = useState(false)

  const [columns] = useState([
    { name: 'name', selector: (row: Partial<Document>) => row.name ?? '', sortable: true },
    { name: 'description', selector: (row: Partial<Document>) => row.description ?? '', sortable: true },
    { name: 'version', selector: (row: Partial<Document>) => row.version ?? '', sortable: true }
  ])

  const [, fetchDocuments] = useAtom(documentsWithFetchAtom)

  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure()
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure()

  const toast = useToast()

  useEffect(() => {
    fetchDocuments('default')
  }, [fetchDocuments])

  const handleSave = async (document: Document) => {
    try {
      if (document.uid) {
        await Client.updateDocument('default', document)
        toast({ title: 'Document updated.', status: 'success', duration: 3000, isClosable: true })
      } else {
        await Client.createDocument('default', document)
        toast({ title: 'Document added successfully.', status: 'success', duration: 3000, isClosable: true })
      }
      await fetchDocuments('default')
      onDrawerClose()
    } catch (error) {
      console.error('Error saving document:', error)
      toast({ title: 'Error saving document.', status: 'error', duration: 3000, isClosable: true })
    }
  }

  const handleClearRows = useCallback(() => {
    setToggleClearRows(!toggledClearRows)
  }, [toggledClearRows])

  const handleDelete = useCallback(async () => {
    try {
      await Promise.all(selectedRows.map(row => Client.deleteDocument('default', row.name as string)))
      setSelectedRows([])
      await fetchDocuments('default')
      toast({ title: 'Documents deleted.', status: 'success', duration: 3000, isClosable: true })
    } catch (error) {
      console.error('Error deleting documents:', error)
      toast({ title: 'Error deleting documents.', status: 'error', duration: 3000, isClosable: true })
    }
    handleClearRows()
  }, [fetchDocuments, selectedRows, toast, handleClearRows])

  const handleUpdate = async () => {
    try {
      await Client.updateDocument('default', selectedRow)
      toast({
        title: 'Document updated.',
        description: 'The document has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      await fetchDocuments('default')
      onDrawerClose()
    } catch (error) {
      toast({
        title: 'Error updating document.',
        description: 'There was an error updating the document.',
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
              path: ''
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
          { page: 'Documents', url: '/documents' }
        ]}
      />
      <DataTableComponent
        title={'Documents'}
        data={documents}
        columns={columns as TableColumn<Partial<Document>>[]}
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
      <AddEditDocumentModal isOpen={isModalOpen} onClose={onModalClose} onSave={handleSave} document={editRow} />
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

export default DocumentsTable
