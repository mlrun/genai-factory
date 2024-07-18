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

import { AddIcon } from '@chakra-ui/icons'
import { Box, Button, Flex, useColorMode } from '@chakra-ui/react'
import { colors } from '@shared/theme'
import { DataRow } from '@shared/types'
import { useMemo, useState } from 'react'
import DataTable, { Alignment, TableColumn, createTheme } from 'react-data-table-component'
import FilterComponent from './Filter'

createTheme(
  'dark',
  {
    text: {
      primary: colors.gray100,
      secondary: colors.info
    },
    background: {
      default: colors.gray900
    },

    divider: {
      default: colors.gray800
    },
    action: {
      button: 'rgba(0,0,0,.54)',
      hover: 'rgba(0,0,0,.08)',
      disabled: 'rgba(0,0,0,.12)'
    },
    context: {
      background: colors.gray800
    }
  },
  'light'
)
type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: DataRow<Partial<any>>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: TableColumn<DataRow<Partial<any>>>[]
  title: string
  expandableRows?: boolean
  contextActions: JSX.Element
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectedRowChange?: (e: any) => void
}

const DataTableComponent = ({ data, columns, title, expandableRows, contextActions, onSelectedRowChange }: Props) => {
  const [filterText, setFilterText] = useState('')
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false)

  const { colorMode } = useColorMode()

  const filteredItems = data.filter(
    item =>
      (item.data.name && item.data.name.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.data.email && item.data.email.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.data.role && item.data.role.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.data.user && item.data.user.toLowerCase().includes(filterText.toLowerCase()))
  )

  const subHeaderComponentMemo = useMemo(() => {
    return (
      <Flex gap={4}>
        <FilterComponent
          onFilter={(e: React.ChangeEvent<HTMLInputElement>) => setFilterText(e.target.value)}
          filterText={filterText}
        />
        <Button bg={colors.mintDark} _hover={{ backgroundColor: colors.mint }} leftIcon={<AddIcon />}>
          Add New
        </Button>
      </Flex>
    )
  }, [filterText])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ExpandedComponent = ({ data }: any) => <pre>{JSON.stringify(data, null, 2)}</pre>
  return (
    <Box boxShadow="md" borderRadius="md">
      <DataTable
        expandableRowsComponent={ExpandedComponent}
        expandableRows={expandableRows}
        title={title}
        theme={colorMode}
        columns={columns}
        data={filteredItems}
        pagination
        paginationResetDefaultPage={resetPaginationToggle}
        subHeader
        subHeaderComponent={subHeaderComponentMemo}
        persistTableHead
        subHeaderAlign={Alignment.RIGHT}
        selectableRows
        onSelectedRowsChange={onSelectedRowChange}
        contextActions={contextActions}
      />
    </Box>
  )
}

export default DataTableComponent
