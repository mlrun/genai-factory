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

import { usersWithFetchAtom } from '@atoms/apiAtoms'
import { selectedUserAtom } from '@atoms/index'
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Flex,
  FormControl,
  FormLabel,
  Input,
  useColorMode,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import Client from '@services/Api'
import { colors } from '@shared/theme'
import { User } from '@shared/types'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
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
  data: Partial<any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: TableColumn<Partial<any>>[]
  title: string
  contextActions: JSX.Element
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectedRowChange?: (e: any) => void
  subheaderComponent?: React.ReactNode
  filterText: string
  user?: User
}

const DataTableComponent = ({
  data,
  columns,
  title,
  contextActions,
  onSelectedRowChange,
  subheaderComponent,
  filterText
}: Props) => {
  const { colorMode } = useColorMode()
  const { isOpen, onOpen, onClose } = useDisclosure()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedRow, setSelectedRow] = useState<Partial<any> | null>(null)
  const [selectedUser, setSelectedUser] = useAtom<User>(selectedUserAtom)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filteredItems, setFilteredItems] = useState<Partial<any>[]>(data)
  const [, fetchUsers] = useAtom(usersWithFetchAtom)

  const toast = useToast()

  useEffect(() => {
    if (data) {
      setFilteredItems(
        data.filter(
          item =>
            (item.name && item.name.toLowerCase().includes(filterText.toLowerCase())) ||
            (item.email && item.email.toLowerCase().includes(filterText.toLowerCase())) ||
            (item.full_name && item.full_name.toLowerCase().includes(filterText.toLowerCase()))
        )
      )
    }
  }, [filterText, data])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSelectedUser({ ...selectedUser, [name]: value })
  }

  const handleUpdateUser = async () => {
    try {
      await Client.updateUser(selectedUser)
      toast({
        title: 'User updated.',
        description: 'The user has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      await fetchUsers()
      onClose()
    } catch (error) {
      toast({
        title: 'Error updating user.',
        description: 'There was an error updating the user.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  return (
    <>
      <Box boxShadow="md" borderRadius="md">
        <DataTable
          title={title}
          theme={colorMode}
          columns={columns}
          data={filteredItems}
          progressPending={!filteredItems?.length}
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
            setSelectedUser(row)
            onOpen()
          }}
        />
      </Box>
      <Drawer placement="right" size={'xl'} isOpen={isOpen} onClose={onClose}>
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">{selectedUser?.name} </DrawerHeader>
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
                <FormControl id="full_name" mb={4}>
                  <FormLabel>Full Name</FormLabel>
                  <Input type="text" name="full_name" value={selectedUser.full_name || ''} onChange={handleChange} />
                </FormControl>
              </Flex>
            </Flex>
            <Button marginTop={4} onClick={handleUpdateUser}>
              Save changes
            </Button>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default DataTableComponent
