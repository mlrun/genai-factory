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

import { selectedSessionAtom, sessionsWithFetchAtom } from '@atoms/sessions'
import { publicUserAtom, userWithFetchAtom } from '@atoms/users'
import { AddIcon } from '@chakra-ui/icons'
import { Button, Flex, useColorMode } from '@chakra-ui/react'
import Client from '@services/Api'
import { colors } from '@shared/theme'
import { generateSessionId } from '@shared/utils'
import { sessionIdAtom, userWithTokenAtom, usernameAtom } from 'atoms'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ChatSessionList from './ChatSessionList'

const Chatbar = () => {
  const [, setSessionId] = useAtom(sessionIdAtom)
  const [username] = useAtom(usernameAtom)
  const [user] = useAtom(userWithTokenAtom)
  const [, setIsNew] = useState(true)
  const { colorMode } = useColorMode()
  const [publicUser] = useAtom(publicUserAtom)
  const [, setSelectedSession] = useAtom(selectedSessionAtom)

  const [, fetchPublicUser] = useAtom(userWithFetchAtom)
  const [, fetchSessions] = useAtom(sessionsWithFetchAtom)

  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    fetchSessions(user?.username)
    fetchPublicUser(user?.username as string)
  }, [fetchPublicUser, fetchSessions, user])

  useEffect(() => {
    if (pathname.includes('chat')) {
      setSessionId(pathname.split('chat/')[1])
    }
  }, [pathname])

  const newChat = async () => {
    try {
      await Client.createSession(username, {
        name: generateSessionId(),
        description: '* New Chat',
        labels: {},
        workflow_id: '1dfd7fc7c4024501850e3541abc3ed9f',
        owner_id: publicUser.uid
      }).then(res => {
        setSessionId(res.data.uid)
        setSelectedSession(res.data)
        navigate(`/chat/${res.data.uid}`)
      })
      await fetchSessions(username)
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  return (
    <Flex gap={8} bg={colorMode == 'dark' ? colors.sidebarDark : colors.sidebarLight} flexDirection={'column'}>
      <ChatSessionList setNew={setIsNew} />
      <Flex justify={'center'}>
        <Button width={'30%'} onClick={newChat} iconSpacing={2} leftIcon={<AddIcon />}>
          New
        </Button>
      </Flex>
    </Flex>
  )
}

export default Chatbar
