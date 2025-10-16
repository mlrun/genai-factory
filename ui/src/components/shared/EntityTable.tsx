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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtom } from 'jotai';
import { TableColumn } from 'react-data-table-component';

import { selectedRowAtom } from '@atoms/index';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
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
  useToast,
} from '@chakra-ui/react';
import { ModalField } from '@shared/types/modalFieldConfigs';

import AddEditModal from './AddEditModal';
import DataTableComponent from './Datatable';
import FilterComponent from './Filter';

type EntityWithUID = { uid?: string; name?: string };

type Props<T extends EntityWithUID> = {
  title: string;
  entityName: string;
  fields: ModalField[];
  columns: TableColumn<Partial<T>>[];
  data: T[];
  fetchEntities: () => Promise<void>;
  createEntity: (entity: T) => Promise<void>;
  updateEntity: (entity: T) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;
  newEntityDefaults: T;
};

function EntityTable<T extends EntityWithUID>({
  columns,
  createEntity,
  data,
  deleteEntity,
  entityName,
  fetchEntities,
  fields,
  newEntityDefaults,
  title,
  updateEntity,
}: Props<T>) {
  const toast = useToast();
  const [selectedRow, setSelectedRow] = useAtom<T>(selectedRowAtom);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [editRow, setEditRow] = useState<T>(newEntityDefaults);
  const [filterText, setFilterText] = useState('');
  const [toggledClearRows, setToggleClearRows] = useState(false);

  const {
    isOpen: isModalOpen,
    onClose: onModalClose,
    onOpen: onModalOpen,
  } = useDisclosure();
  const {
    isOpen: isDrawerOpen,
    onClose: onDrawerClose,
    onOpen: onDrawerOpen,
  } = useDisclosure();

  useEffect(() => {
    fetchEntities();
  }, []);

  const handleSave = async (entity: T) => {
    try {
      if (entity.uid) {
        await updateEntity(entity);
        toast({
          title: `${entityName} updated`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createEntity(entity);
        toast({
          title: `${entityName} created`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      await fetchEntities();
      onModalClose();
    } catch {
      toast({
        title: `Error saving ${entityName}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }

    setEditRow(newEntityDefaults);
  };

  const handleDelete = useCallback(async () => {
    try {
      await Promise.all(
        selectedRows.map((r) => deleteEntity(r.name as string)),
      );
      toast({
        title: `${entityName}s deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setSelectedRows([]);
      await fetchEntities();
    } catch {
      toast({
        title: `Error deleting ${entityName}s`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    setToggleClearRows(!toggledClearRows);
  }, [
    deleteEntity,
    selectedRows,
    fetchEntities,
    toggledClearRows,
    entityName,
    toast,
  ]);

  const handleUpdateDrawer = async () => {
    try {
      await updateEntity(selectedRow);
      toast({
        title: `${entityName} updated`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await fetchEntities();
      onDrawerClose();
    } catch {
      toast({
        title: `Error updating ${entityName}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSelectedRow({ ...selectedRow, [name]: value });
  };

  const contextActions = useMemo(
    () => (
      <Button leftIcon={<DeleteIcon />} onClick={handleDelete}>
        Delete
      </Button>
    ),
    [handleDelete],
  );

  const subHeaderComponentMemo = useMemo(
    () => (
      <Flex gap={4}>
        <FilterComponent
          onFilter={(e) => setFilterText(e.target.value)}
          filterText={filterText}
        />
        <Button
          leftIcon={<AddIcon />}
          onClick={() => {
            setEditRow(newEntityDefaults);
            onModalOpen();
          }}
        >
          New
        </Button>
      </Flex>
    ),
    [filterText, newEntityDefaults, onModalOpen],
  );

  return (
    <Flex p={4} flexDirection="column" width="100%">
      <DataTableComponent
        title={title}
        data={data}
        columns={columns}
        contextActions={contextActions}
        onSelectedRowChange={(e) => setSelectedRows(e.selectedRows)}
        subheaderComponent={subHeaderComponentMemo}
        filterText={filterText}
        onOpenDrawer={onDrawerOpen}
        toggleClearRows={toggledClearRows}
      />
      <AddEditModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        onSave={handleSave}
        entity={editRow}
        fields={fields}
        title={entityName}
      />
      <Drawer
        placement="right"
        size="xl"
        isOpen={isDrawerOpen}
        onClose={onDrawerClose}
      >
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">
            {selectedRow?.name}
          </DrawerHeader>
          <DrawerBody>
            <Flex gap={10}>
              <Flex width="100%" flexDirection="column">
                {fields.map((field) => (
                  <FormControl key={field.name} id={field.name} mb={4}>
                    <FormLabel>{field.label}</FormLabel>
                    <Input
                      type="text"
                      name={field.name}
                      value={
                        (selectedRow[field.name as keyof T] as string) || ''
                      }
                      onChange={handleChange}
                    />
                  </FormControl>
                ))}
              </Flex>
            </Flex>
            <Button mt={4} onClick={handleUpdateDrawer}>
              Save changes
            </Button>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
}

export default EntityTable;
