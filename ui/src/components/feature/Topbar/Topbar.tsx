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
import {
  Avatar,
  Box, Button,
  Flex,
  Image,
  useColorMode,
  useDisclosure
} from '@chakra-ui/react'
import { colors } from '@shared/theme'
import { useAtom } from 'jotai'
import Rightbar from '../Rightbar'
import { useNavigate } from 'react-router-dom'

type Props = {
  onLoginChange: (value: boolean) => void
}

const Topbar = ({ onLoginChange }: Props) => {
  const { colorMode } = useColorMode()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate()
  const [username] = useAtom(usernameAtom)

  return (
    <Flex
      position="sticky"
      top={0}
      alignItems="center"
      justifyContent="space-between"
      h={16}
      bg={colorMode === 'dark' ? colors.topbarDark : colors.topbarLight}
      zIndex={10}
      data-testid="topbar"
    >
      <Flex alignItems="center">
        <Image
          paddingLeft={4}
          filter={colorMode === 'light' ? 'invert(100%)' : ''}
          src={Logo}
          w={40}
          alt="logo"
          data-testid="logo"
        />
        <Box paddingLeft={4} display="flex" gap={2}>
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            Projects
          </Button>
          <Button variant="ghost" onClick={() => navigate('/chat')}>
            Chat
          </Button>
          <Button variant="ghost" onClick={() => navigate('/users')}>
            Users
          </Button>
          <Button variant="ghost" onClick={() => navigate('/chat-histories')}>
            chat history
          </Button>
        </Box>
      </Flex>
      <Flex alignItems="center" paddingRight={4}>
        <Avatar
          _hover={{ cursor: 'pointer' }}
          onClick={onOpen}
          size="sm"
          name={username}
          src=""
          data-testid="avatar"
        />
        <Rightbar isOpen={isOpen} onClose={onClose} onLoginChange={onLoginChange} />
      </Flex>
    </Flex>
  )
}

export default Topbar
