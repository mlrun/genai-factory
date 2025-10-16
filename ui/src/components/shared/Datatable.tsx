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
import { useAtom } from 'jotai';
import DataTable, {
  Alignment,
  createTheme,
  TableColumn,
} from 'react-data-table-component';

import { selectedRowAtom } from '@atoms/index';
import { Box, useColorMode } from '@chakra-ui/react';
import { colors } from '@shared/theme';
import { User } from '@shared/types';

createTheme(
  'dark',
  {
    text: {
      primary: colors.gray100,
      secondary: colors.info,
    },
    background: {
      default: colors.gray900,
    },

    divider: {
      default: colors.gray800,
    },
    action: {
      button: 'rgba(0,0,0,.54)',
      hover: 'rgba(0,0,0,.08)',
      disabled: 'rgba(0,0,0,.12)',
    },
    context: {
      background: colors.gray800,
    },
  },
  'light',
);
type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Partial<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: TableColumn<Partial<any>>[];
  title: string;
  contextActions: JSX.Element;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectedRowChange?: (e: any) => void;
  subheaderComponent?: React.ReactNode;
  filterText: string;
  user?: User;
  toggleClearRows: boolean;
  onOpenDrawer: () => void;
};

const DataTableComponent = ({
  columns,
  contextActions,
  data,
  filterText,
  onOpenDrawer,
  onSelectedRowChange,
  subheaderComponent,
  title,
  toggleClearRows,
}: Props) => {
  const { colorMode } = useColorMode();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [, setSelectedRow] = useAtom<any>(selectedRowAtom);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filteredItems, setFilteredItems] = useState<Partial<any>[]>(data);

  useEffect(() => {
    if (data) {
      setFilteredItems(
        data.filter(
          (item) =>
            (item.name &&
              item.name.toLowerCase().includes(filterText.toLowerCase())) ||
            (item.email &&
              item.email.toLowerCase().includes(filterText.toLowerCase())) ||
            (item.full_name &&
              item.full_name
                .toLowerCase()
                .includes(filterText.toLowerCase())) ||
            (item.description &&
              item.description
                .toLowerCase()
                .includes(filterText.toLowerCase())) ||
            (item.version &&
              item.version.toLowerCase().includes(filterText.toLowerCase())),
        ),
      );
    }
  }, [filterText, data]);

  return (
    <>
      <Box boxShadow="md" borderRadius="md">
        <DataTable
          title={title}
          theme={colorMode}
          columns={columns}
          data={filteredItems}
          // progressPending={!filteredItems?.length}
          pagination
          subHeader
          subHeaderComponent={subheaderComponent}
          persistTableHead
          subHeaderAlign={Alignment.RIGHT}
          selectableRows
          onSelectedRowsChange={onSelectedRowChange}
          contextActions={contextActions}
          highlightOnHover
          pointerOnHover
          clearSelectedRows={toggleClearRows}
          onRowClicked={(row) => {
            setSelectedRow(row);
            onOpenDrawer();
          }}
        />
      </Box>
    </>
  );
};

export default DataTableComponent;
