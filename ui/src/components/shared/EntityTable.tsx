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

import React, { useState } from 'react';

import { useDisclosure, useToast } from '@chakra-ui/react';
import { Button } from '@components/shared/Button';
import { SortOption } from '@shared/types';
import { ModalField } from '@shared/types/modalFieldConfigs';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

import AddEditModal from './AddEditModal';
import DataTableComponent from './Datatable';
import FilterComponent from './Filter';
import Sort from './Sort';
import ToggleDisplay from './ToggleDisplay';

import { NEW_BUTTON_TEXT_PREFIX } from '@constants';

type EntityWithUID = { uid?: string; name: string };

type EntityTableProps<T extends EntityWithUID> = {
  data: T[];
  title: string;
  entityName: string;
  fields: ModalField[];
  columns: ColumnDef<T>[];
  createEntity: (entity: T) => void;
  updateEntity: (entity: Partial<T>) => void;
  deleteEntity: (id: string) => void;
  newEntityDefaults: T;
  sortOptions?: SortOption<T>[];
  CardComponent?: React.ComponentType<T>;
  onRowClick?: (row: T) => void;
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
  onRowClick,
  sortOptions = [],
  title,
  updateEntity,
}: EntityTableProps<T>) => {
  const toast = useToast();
  const modal = useDisclosure();
  const [editingEntity, setEditingEntity] = useState<T | null>(null);

  const [display, setDisplay] = useState<'list' | 'card'>('list');
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (sortOptions.length === 0) return [];
    const defaultKey =
      sortOptions.find((opt) => opt.isDefault)?.accessorKey ??
      sortOptions[0].accessorKey;
    return [{ id: defaultKey, desc: false }];
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
    enableGlobalFilter: true,
  });

  const tableData = table.getRowModel().rows.map((row) => row.original);

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
      setEditingEntity(null);
      modal.onClose();
    } catch {
      toast({
        title: `Error saving ${entityName}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = (row: T) => {
    try {
      deleteEntity(row.name);
      toast({
        title: `${entityName}(s) deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: `Error deleting ${entityName}(s)`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdate = (row: T) => {
    setEditingEntity(row);
    modal.onOpen();
  };

  return (
    <div className="flex flex-col w-full p-[32px_56px]">
      <div className="flex w-full justify-between items-center gap-4 flex-wrap">
        <FilterComponent
          placeholder={`Find ${title}...`}
          onFilter={(e) => setGlobalFilter(e.target.value)}
          filterText={globalFilter}
        />
        <div className="flex items-center gap-3">
          {CardComponent && (
            <ToggleDisplay
              display={display}
              onDisplayChange={(display) => setDisplay(display)}
            />
          )}
          {sortOptions.length > 0 && (
            <Sort
              sortOptions={sortOptions}
              sortKey={sorting[0]?.id as SortOption<T>['accessorKey']}
              onSortChange={(value) => setSorting([{ id: value, desc: false }])}
            />
          )}
          <Button
            className="capitalize min-w-24"
            onClick={() => {
              setEditingEntity(null);
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
            table={table}
            onRowClick={onRowClick}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ) : (
          <div className="grid grid-cols-4 gap-6 w-full min-w-[320px]">
            {CardComponent &&
              tableData.map((item) => (
                <CardComponent key={item.uid ?? item.name} {...item} />
              ))}
          </div>
        )}
      </div>

      <AddEditModal
        isOpen={modal.isOpen}
        onClose={() => {
          setEditingEntity(null);
          modal.onClose();
        }}
        onSave={handleSave}
        entity={editingEntity ?? newEntityDefaults}
        fields={fields}
        title={entityName}
      />
    </div>
  );
};

export default EntityTable;
