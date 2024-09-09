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
import { projectsAtom, projectsWithFetchAtom } from '@atoms/projects'
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
import { Project } from '@shared/types/project'
import { useAtom } from 'jotai'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { TableColumn } from 'react-data-table-component'
import AddEditProjectModal from './AddEditProjectModal'

const ProjectsTable: React.FC = () => {
  const [selectedRow, setSelectedRow] = useAtom(selectedRowAtom)
  const [projects] = useAtom(projectsAtom)

  const [selectedRows, setSelectedRows] = useState<Project[]>([])
  const [editRow, setEditRow] = useState<Project>({ name: '', description: '', version: '', owner_id: '' })
  const [filterText, setFilterText] = useState('')
  const [toggledClearRows, setToggleClearRows] = useState(false)

  const [columns] = useState([
    { name: 'name', selector: (row: Partial<Project>) => row.name ?? '', sortable: true },
    { name: 'description', selector: (row: Partial<Project>) => row.description ?? '', sortable: true },
    { name: 'version', selector: (row: Partial<Project>) => row.version ?? '', sortable: true }
  ])

  const [, fetchProjects] = useAtom(projectsWithFetchAtom)

  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure()
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure()

  const toast = useToast()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleSave = async (project: Project) => {
    try {
      if (project.uid) {
        await Client.updateProject(project)
        toast({ title: 'Project updated.', status: 'success', duration: 3000, isClosable: true })
      } else {
        await Client.createProject(project)
        toast({ title: 'Project added successfully.', status: 'success', duration: 3000, isClosable: true })
      }
      await fetchProjects()
      onDrawerClose()
    } catch (error) {
      console.error('Error saving project:', error)
      toast({ title: 'Error saving project.', status: 'error', duration: 3000, isClosable: true })
    }
  }

  const handleClearRows = useCallback(() => {
    setToggleClearRows(!toggledClearRows)
  }, [toggledClearRows])

  const handleDelete = useCallback(async () => {
    try {
      await Promise.all(selectedRows.map(row => Client.deleteProject(row.name as string)))
      setSelectedRows([])
      await fetchProjects()
      toast({ title: 'Projects deleted.', status: 'success', duration: 3000, isClosable: true })
    } catch (error) {
      console.error('Error deleting projects:', error)
      toast({ title: 'Error deleting projects.', status: 'error', duration: 3000, isClosable: true })
    }
    handleClearRows()
  }, [fetchProjects, selectedRows, toast, handleClearRows])

  const handleUpdate = async () => {
    try {
      await Client.updateProject(selectedRow)
      toast({
        title: 'Project updated.',
        description: 'The project has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      await fetchProjects()
      onDrawerClose()
    } catch (error) {
      toast({
        title: 'Error updating project.',
        description: 'There was an error updating the project.',
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
            setEditRow({ name: '', description: '', version: '', owner_id: '' })
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
          { page: 'Projects', url: '/projects' }
        ]}
      />
      <DataTableComponent
        title={'Projects'}
        data={projects}
        columns={columns as TableColumn<Partial<Project>>[]}
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
      <AddEditProjectModal isOpen={isModalOpen} onClose={onModalClose} onSave={handleSave} project={editRow} />
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

export default ProjectsTable
