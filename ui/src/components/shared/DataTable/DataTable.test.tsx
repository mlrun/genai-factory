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

import { useState } from 'react';

import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DataTable, { type DataTableProps } from './DataTable';

import '@testing-library/jest-dom';

type Row = { name: string; age: number; severity: string };
const DATA: Row[] = [
  { name: 'Alpha', age: 31, severity: 'low' },
  { name: 'Beta', age: 26, severity: 'medium' },
  { name: 'Gamma', age: 42, severity: 'high' },
];

const setup = (overrides: Partial<DataTableProps<Row>> = {}) => {
  const Wrapper = () => {
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);

    const columns: ColumnDef<Row>[] = [
      { header: 'Name', accessorKey: 'name' },
      { header: 'Age', accessorKey: 'age' },
      { header: 'Severity', accessorKey: 'severity' },
    ];

    const table = useReactTable({
      data: DATA,
      columns,
      state: { globalFilter, sorting },
      onGlobalFilterChange: setGlobalFilter,
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getSortedRowModel: getSortedRowModel(),
      enableSorting: true,
      enableGlobalFilter: true,
    });

    const props: DataTableProps<Row> = {
      table,
      ...overrides,
    };

    return <DataTable<Row> {...props} />;
  };

  render(<Wrapper />);
};

describe('DataTable', () => {
  test('renders headers and rows', () => {
    setup();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  test('clicking a row triggers onRowClick', async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();
    setup({ onRowClick });

    const alphaCell = screen.getByText('Alpha');
    const row = alphaCell.closest('tr');
    await user.click(row!);

    expect(onRowClick).toHaveBeenCalledWith(DATA[0]);
  });
  test('clicking Update triggers onUpdate with correct row', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();

    setup({ onUpdate });

    const row = screen.getByText('Alpha').closest('tr')!;
    const dropdownButton = within(row).getByTestId('table-select-trigger');

    await user.click(dropdownButton);

    const updateBtn = screen.getByTestId('table-update-select-item');
    await user.click(updateBtn);

    expect(onUpdate).toHaveBeenCalledWith(DATA[0]);
  });

  test('clicking Delete triggers onDelete with correct row', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();

    setup({ onDelete });

    const row = screen.getByText('Alpha').closest('tr')!;
    const dropdownButton = within(row).getByTestId('table-select-trigger');

    await user.click(dropdownButton);

    const deleteBtn = screen.getByTestId('table-delete-select-item');
    await user.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith(DATA[0]);
  });
});
