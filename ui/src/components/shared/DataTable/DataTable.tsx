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

import { MoreVertical, Pencil, Trash } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/shared/DropdownMenu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/shared/Table';
import type { Table as TableType } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';

import Arrow from '@assets/icons/arrow.svg?react';
import { cn } from '@shared/cn/utils';

import { SORT_DIRECTION, TABLE_LABELS } from '@constants';

export type DataTableProps<T> = {
  table: TableType<T>;
  onRowClick?: (row: T) => void;
  onUpdate?: (row: T) => void;
  onDelete?: (row: T) => void;
};

const DataTable = <T,>({
  onDelete,
  onRowClick,
  onUpdate,
  table,
}: DataTableProps<T>) => (
  <div className="relative overflow-auto rounded-[8px] border bg-white border-table-border">
    <Table className="w-full border-collapse table-fixed">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="sticky top-0 z-10 bg-white">
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                aria-colspan={header.colSpan}
                className="relative px-4 py-2 text-left text-sm font-bold leading-6 text-table-text-muted"
              >
                {!header.isPlaceholder && (
                  <button
                    type="button"
                    onClick={header.column.getToggleSortingHandler()}
                    disabled={!header.column.getCanSort()}
                    className="inline-flex items-center gap-2 w-full bg-transparent border-0 py-1 cursor-pointer rounded disabled:cursor-default"
                  >
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis block">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </span>
                    {header.column.getCanSort() && (
                      <Arrow
                        aria-hidden="true"
                        className={cn(
                          'transition-transform duration-150 ease-in-out',
                          header.column.getIsSorted() === SORT_DIRECTION.ASC &&
                            'rotate-180 opacity-100',
                          header.column.getIsSorted() === SORT_DIRECTION.DESC &&
                            'rotate-0 opacity-100',
                          !header.column.getIsSorted() && 'opacity-40',
                        )}
                      />
                    )}
                  </button>
                )}
              </TableHead>
            ))}
            <TableHead className="px-4 py-2 text-right text-sm font-bold w-14" />
          </TableRow>
        ))}
      </TableHeader>

      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell
              aria-colspan={table.getAllColumns().length + 1}
              className="px-4 py-2 text-left text-sm text-table-text-default"
            >
              {TABLE_LABELS.NO_ROWS}
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer h-12"
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="px-4 text-left text-table-text-default text-[13px] font-normal truncate h-12"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}

              <TableCell className="px-4 py-2 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1 rounded-md hover:bg-gray-100 outline-none"
                      data-testid="table-select-trigger"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onUpdate && (
                      <DropdownMenuItem
                        data-testid="table-update-select-item"
                        onClick={() => onUpdate(row.original)}
                      >
                        <Pencil className="text-gray-500" />
                        {TABLE_LABELS.UPDATE}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        data-testid="table-delete-select-item"
                        onClick={() => onDelete(row.original)}
                        className="flex items-center gap-2 text-red-500"
                      >
                        <Trash size={16} /> {TABLE_LABELS.DELETE}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

export default DataTable;
