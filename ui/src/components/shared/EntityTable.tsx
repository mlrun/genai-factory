/*
Copyright 2024 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/

import React, { useCallback, useMemo, useState } from 'react';
import { TableColumn } from 'react-data-table-component';

import {
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
import { Button } from '@components/shared/Button';
import { SortOption } from '@shared/types';
import { ModalField } from '@shared/types/modalFieldConfigs';

import AddEditModal from './AddEditModal';
import DataTableComponent from './Datatable';
import FilterComponent from './Filter';
import Sort from './Sort';
import ToggleDisplay from './ToggleDisplay';

import { filterTableData, sortTableData } from '@utils/table.utils';

import { FILTER_PLACEHOLDER_PREFIX, NEW_BUTTON_TEXT_PREFIX } from '@constants';

type EntityWithUID = { uid?: string; name?: string };

type Props<T extends EntityWithUID> = {
  title: string;
  entityName: string;
  fields: ModalField[];
  columns: TableColumn<Partial<T>>[];
  data: T[];
  createEntity: (entity: T) => void; // from useMutation.mutate
  updateEntity: (entity: Partial<T>) => void;
  deleteEntity: (id: string) => void;
  newEntityDefaults: T;
  sortOptions?: SortOption<T>[];
  CardComponent?: React.ComponentType<T>;
};

const EntityTable = <T extends EntityWithUID>({
  CardComponent,
  columns,
  createEntity,
  data,
  deleteEntity,
  entityName,
  fields,
  newEntityDefaults,
  sortOptions = [],
  title,
  updateEntity,
}: Props<T>) => {
  const toast = useToast();

  const [display, setDisplay] = useState<'list' | 'card'>('list');
  const [selectedRow, setSelectedRow] = useState<Partial<T> | null>(null);
  const [selectedRows, setSelectedRows] = useState<Partial<T>[]>([]);
  const [editRow, setEditRow] = useState<T>(newEntityDefaults);
  const [filterText, setFilterText] = useState('');
  const [toggledClearRows, setToggleClearRows] = useState(false);
  const [sortKey, setSortKey] = useState<SortOption<T>['accessorKey'] | null>(
    () => {
      if (sortOptions.length === 0) return null;
      return (
        sortOptions.find((opt) => opt.isDefault)?.accessorKey ??
        sortOptions[0].accessorKey
      );
    },
  );

  const modal = useDisclosure();
  const drawer = useDisclosure();

  const filteredData = useMemo(() => {
    const filteredDate = filterTableData(data, filterText);

    return sortTableData(filteredDate, sortKey);
  }, [data, filterText, sortKey]);

  const handleSave = (entity: T) => {
    try {
      if (entity.uid) {
        updateEntity(entity);
        toast({
          title: `${entityName} updated`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        createEntity(entity);
        toast({
          title: `${entityName} created`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      modal.onClose();
      setEditRow(newEntityDefaults);
    } catch {
      toast({
        title: `Error saving ${entityName}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = useCallback(() => {
    try {
      selectedRows.forEach((r) => deleteEntity(r.name as string));
      toast({
        title: `${entityName}(s) deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setSelectedRows([]);
    } catch {
      toast({
        title: `Error deleting ${entityName}(s)`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    setToggleClearRows((prev) => !prev);
  }, [deleteEntity, selectedRows, entityName, toast]);

  const handleUpdateDrawer = () => {
    if (!selectedRow) return;
    try {
      updateEntity(selectedRow);
      toast({
        title: `${entityName} updated`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      drawer.onClose();
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
    setSelectedRow((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const contextActions = useMemo(
    () => <Button onClick={handleDelete}>Delete</Button>,
    [handleDelete],
  );

  return (
    <div className="flex flex-col w-full p-[32px_56px]">
      <div className="flex w-full justify-between items-center gap-4 flex-wrap">
        <FilterComponent
          placeholder={`${FILTER_PLACEHOLDER_PREFIX} ${title}...`}
          onFilter={(e) => setFilterText(e.target.value)}
          filterText={filterText}
        />
        <div className="flex items-center gap-3">
          {CardComponent && (
            <ToggleDisplay
              display={display}
              onDisplayChange={(display) => {
                if (display) {
                  setDisplay(display);
                }
              }}
            />
          )}
          {sortOptions && sortKey && (
            <Sort
              sortOptions={sortOptions}
              sortKey={sortKey}
              onSortChange={(value) => setSortKey(value)}
            />
          )}
          <Button
            className="capitalize min-w-24"
            onClick={() => {
              setEditRow(newEntityDefaults);
              modal.onOpen();
            }}
          >
            {`${NEW_BUTTON_TEXT_PREFIX} ${title}`}
          </Button>
        </div>
      </div>
      <div className="mt-5">
        {display === 'list' ? (
          <DataTableComponent
            data={filteredData}
            columns={columns}
            contextActions={contextActions}
            onRowSelect={(row) => setSelectedRow(row)}
            onSelectedRowChange={(e) => setSelectedRows(e.selectedRows)}
            onOpenDrawer={() => drawer.onOpen()}
            toggleClearRows={toggledClearRows}
          />
        ) : (
          <div className="grid grid-cols-4 gap-6 w-full min-w-[320px]">
            {CardComponent &&
              filteredData.map((item) => (
                <CardComponent key={item.uid ?? item.name} {...item} />
              ))}
          </div>
        )}
      </div>

      <AddEditModal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        onSave={handleSave}
        entity={editRow}
        fields={fields}
        title={entityName}
      />

      <Drawer
        placement="right"
        size="xl"
        isOpen={drawer.isOpen}
        onClose={drawer.onClose}
      >
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">
            {selectedRow?.name ?? 'Edit'}
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
                        (selectedRow?.[field.name as keyof T] as string) ?? ''
                      }
                      onChange={handleChange}
                    />
                  </FormControl>
                ))}
              </Flex>
            </Flex>
            <Button className="mt-1" onClick={handleUpdateDrawer}>
              Save changes
            </Button>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default EntityTable;
