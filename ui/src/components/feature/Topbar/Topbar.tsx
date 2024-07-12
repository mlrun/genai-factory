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

import Logo from '@assets/mlrun.png'
import { usernameAtom } from '@atoms/index'
import { HamburgerIcon } from '@chakra-ui/icons'
import {
  Avatar,
  Box,
  Flex,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useColorMode,
  useDisclosure
} from '@chakra-ui/react'
import { colors } from '@shared/theme'
import { useAtom } from 'jotai'
import Rightbar from '../Rightbar'

type Props = {
  user: string
  onLoginChange: (value: boolean) => void
}
const Topbar = ({ user, onLoginChange }: Props) => {
  const { colorMode } = useColorMode()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [username, setUsername] = useAtom(usernameAtom)

  return (
    <Flex
      alignItems={'center'}
      justifyContent={'space-between'}
      h={16}
      bg={colorMode == 'dark' ? colors.topbarDark : colors.topbarLight}
      data-testid="topbar"
    >
      <Flex alignItems={'center'}>
        <Box paddingLeft={4} display={{ sm: 'flex', md: 'none' }} data-testid="menu-box">
          <Menu>
            <MenuButton as={IconButton} icon={<HamburgerIcon />} data-testid="hamburger-menu" />
            <MenuList data-testid="menu-list">
              <MenuItem>Users</MenuItem>
              <MenuItem>Chat Histories</MenuItem>
              <MenuItem>Data Sets</MenuItem>
              <MenuItem>Documents</MenuItem>
              <MenuItem>Pipelines</MenuItem>
            </MenuList>
          </Menu>
        </Box>
        <Image
          paddingLeft={4}
          filter={colorMode === 'light' ? 'invert(100%)' : ''}
          src={Logo}
          w={40}
          alt="logo"
          data-testid="logo"
        />
      </Flex>
      <Flex alignItems={'center'} paddingRight={4}>
        <Avatar _hover={{ cursor: 'pointer' }} onClick={onOpen} size="sm" name={username} src="" data-testid="avatar" />
        <Rightbar isOpen={isOpen} onClose={onClose} onLoginChange={onLoginChange} />
      </Flex>
    </Flex>
  )
}

export default Topbar
