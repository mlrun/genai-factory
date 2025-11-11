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

import { useEffect, useState } from 'react';
import DataTable, {
  Alignment,
  createTheme,
  TableColumn,
} from 'react-data-table-component';

import { Box, useColorMode } from '@chakra-ui/react';
import { colors } from '@shared/theme';

createTheme(
  'dark',
  {
    text: { primary: colors.gray100, secondary: colors.info },
    background: { default: colors.gray900 },
    divider: { default: colors.gray800 },
    context: { background: colors.gray800 },
    action: {
      button: 'rgba(0,0,0,.54)',
      hover: 'rgba(0,0,0,.08)',
      disabled: 'rgba(0,0,0,.12)',
    },
  },
  'light',
);

export interface DataTableComponentProps<T extends Record<string, unknown>> {
  title: string;
  data: T[];
  columns: TableColumn<Partial<T>>[];
  contextActions?: JSX.Element;
  subheaderComponent?: React.ReactNode;
  filterText: string;
  toggleClearRows: boolean;
  onOpenDrawer: () => void;
  onSelectedRowChange?: (e: { selectedRows: Partial<T>[] }) => void;
  onRowSelect?: (row: Partial<T>) => void;
}

export function DataTableComponent<T extends Record<string, unknown>>({
  columns,
  contextActions,
  data,
  filterText,
  onOpenDrawer,
  onRowSelect,
  onSelectedRowChange,
  subheaderComponent,
  title,
  toggleClearRows,
}: DataTableComponentProps<T>) {
  const { colorMode } = useColorMode();
  const [filteredItems, setFilteredItems] = useState<Partial<T>[]>(data);

  useEffect(() => {
    if (data) {
      setFilteredItems(
        data.filter((item) => {
          const search = filterText.toLowerCase();
          return (
            (typeof item.name === 'string' &&
              item.name.toLowerCase().includes(search)) ||
            (typeof item.email === 'string' &&
              item.email.toLowerCase().includes(search)) ||
            (typeof item.full_name === 'string' &&
              item.full_name.toLowerCase().includes(search)) ||
            (typeof item.description === 'string' &&
              item.description.toLowerCase().includes(search)) ||
            (typeof item.version === 'string' &&
              item.version.toLowerCase().includes(search))
          );
        }),
      );
    }
  }, [filterText, data]);

  return (
    <Box boxShadow="md" borderRadius="md">
      <DataTable
        title={title}
        theme={colorMode}
        columns={columns}
        data={filteredItems}
        pagination
        subHeader
        subHeaderAlign={Alignment.RIGHT}
        subHeaderComponent={subheaderComponent}
        persistTableHead
        selectableRows
        highlightOnHover
        pointerOnHover
        contextActions={contextActions}
        clearSelectedRows={toggleClearRows}
        onSelectedRowsChange={onSelectedRowChange}
        onRowClicked={(row) => {
          onRowSelect?.(row);
          onOpenDrawer();
        }}
      />
    </Box>
  );
}

export default DataTableComponent;
