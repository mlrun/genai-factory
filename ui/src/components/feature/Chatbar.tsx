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

import { Box, Button, Flex, useColorMode } from '@chakra-ui/react'
import Client from '@services/Api'
import { colors } from '@shared/theme'
import { ChatHistory } from '@shared/types'
import { generateSessionId } from '@shared/utils'
import { conversationsAtom, sessionIdAtom, usernameAtom } from 'atoms'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChatHistoryList from './ChatHistoryList'

const Chatbar = () => {
  const [sessionId, setSessionId] = useAtom(sessionIdAtom)
  const [username, setUsername] = useAtom(usernameAtom)
  const [history, setHistory] = useAtom<ChatHistory[]>(conversationsAtom)
  const [isNew, setIsNew] = useState(true)
  const navigate = useNavigate()
  const { colorMode } = useColorMode()

  const newChat = async () => {
    const sid = generateSessionId()
    setIsNew(true)
    setSessionId(sid)
  }

  const changeLogin = () => {
    setUsername('')
    navigate('/')
  }

  const fetchSessions = async () => {
    try {
      const sessions = await Client.listSessions(username)
      console.log('fetching sessions:', isNew, sessions)
      if (isNew) {
        if (sessions.length === 0 || sessions[0].name !== sessionId) {
          sessions.unshift({ name: sessionId, description: '* New chat' })
        }
      }
      setHistory(sessions)
    } catch (error) {
      console.log('Failed to fetch sessions for:', username, error)
      setHistory([{ name: sessionId, description: '* New chat', content: '', role: 'user', sources: [] }])
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [sessionId])

  useEffect(() => {
    async function updateUser() {
      if (username) {
        console.log('changed login to:', username)
        const sessions = await Client.listSessions(username, 'names', 1)
        if (sessions.length > 0) {
          console.log('setting session id from history:', sessions[0])
          setSessionId(sessions[0])
          setIsNew(false)
          // await fetchSessions();
        } else {
          console.log('creating new chat session')
          await newChat()
        }
      }
    }
    updateUser()
  }, [username])

  return (
    <Flex gap={8} bg={colorMode == 'dark' ? colors.sidebarDark : colors.sidebarLight} flexDirection={'column'}>
      <ChatHistoryList history={history} setNew={setIsNew} />
      <Box>
        <Button width={'100%'} onClick={newChat}>
          New Chat
        </Button>
      </Box>
    </Flex>
  )
}

export default Chatbar
