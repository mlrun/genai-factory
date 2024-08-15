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

import { comparisonUserAtom, selectedUserAtom } from '@atoms/index'
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Flex,
  FormControl,
  FormLabel,
  Input,
  useColorMode,
  useDisclosure
} from '@chakra-ui/react'
import { colors } from '@shared/theme'
import { DataRow, User } from '@shared/types'
import { useAtom } from 'jotai'
import { useState } from 'react'
import DataTable, { Alignment, TableColumn, createTheme } from 'react-data-table-component'

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
  subheaderComponent?: React.ReactNode
  filterText: string
  drawerComponent?: React.ReactNode
  user?: User
}

const DataTableComponent = ({
  data,
  columns,
  title,
  expandableRows,
  contextActions,
  onSelectedRowChange,
  subheaderComponent,
  filterText,
  drawerComponent
}: Props) => {
  const { colorMode } = useColorMode()
  const { isOpen, onOpen, onClose } = useDisclosure()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedRow, setSelectedRow] = useState<DataRow<Partial<any>> | null>(null)
  const [selectedUser, setSelectedUser] = useAtom<User>(selectedUserAtom)
  const [comparisonUser, setComparisonUser] = useAtom<User>(comparisonUserAtom)

  const filteredItems = data.filter(
    item =>
      (item.data.name && item.data.name.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.data.email && item.data.email.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.data.role && item.data.role.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.data.user && item.data.user.toLowerCase().includes(filterText.toLowerCase()))
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSelectedUser({ ...selectedUser, [name]: value })
  }

  return (
    <>
      <Box boxShadow="md" borderRadius="md">
        <DataTable
          title={title}
          theme={colorMode}
          columns={columns}
          data={filteredItems}
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
          onRowClicked={row => {
            setSelectedRow(row)
            setSelectedUser(row.data)
            onOpen()
          }}
        />
      </Box>
      <Drawer placement="right" size={'xl'} isOpen={isOpen} onClose={onClose}>
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">{selectedRow?.data.name} </DrawerHeader>
          <DrawerBody>
            <Flex height={250} gap={10}>
              <Flex width={'100%'} flexDirection={'column'}>
                <FormControl id="name" mb={4}>
                  <FormLabel>Name</FormLabel>
                  <Input type="text" name="name" value={selectedUser.name || ''} onChange={handleChange} />
                </FormControl>
                <FormControl id="email" mb={4}>
                  <FormLabel>Email</FormLabel>
                  <Input type="email" name="email" value={selectedUser.email || ''} onChange={handleChange} />
                </FormControl>
                <FormControl id="role" mb={4}>
                  <FormLabel>Role</FormLabel>
                  <Input type="text" name="role" value={selectedUser.role || ''} onChange={handleChange} />
                </FormControl>
              </Flex>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default DataTableComponent
