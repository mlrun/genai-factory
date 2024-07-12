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

import { Box, Flex } from '@chakra-ui/react'
import Bubble from '@components/shared/Bubble'
import Message from '@components/shared/Message'
import Client from '@services/Api'
import { ChatHistory } from '@shared/types'
import { adminAtom, messagesAtom, sessionIdAtom, usernameAtom } from 'atoms'
import { useAtom } from 'jotai'
import { useEffect } from 'react'

const Chat = () => {
  const [messages, setMessages] = useAtom<ChatHistory[]>(messagesAtom)
  const [sessionId, setSessionId] = useAtom(sessionIdAtom)
  const [username, setUsername] = useAtom(usernameAtom)
  const [admin, setAdmin] = useAtom(adminAtom)

  useEffect(() => {
    async function fetchData() {
      console.log('getting session:', sessionId)
      if (!sessionId) {
        setMessages([])
        return
      }
      const chatSession = await Client.getSession(sessionId)
      console.log('session resp:', chatSession)
      if (chatSession) {
        setMessages(chatSession.history)
      } else {
        setMessages([])
      }
    }
    fetchData()
  }, [sessionId, setMessages])

  return (
    <Flex
      marginX={{ sm: '5%', lg: '25%' }}
      paddingBottom={4}
      flexDir={'column'}
      justifyContent={'space-between'}
      flexGrow={1}
      height="calc(100vh - 92px)"
    >
      <Flex
        justifyContent="flex-start"
        flexGrow={1}
        flexDirection="column"
        paddingBottom="92px"
        overflowY="scroll" // Ensures scrolling when messages exceed the container height
      >
        {messages?.map((chatHistory, index) => (
          <Bubble
            key={index}
            content={chatHistory.content}
            bot={chatHistory.role}
            sources={chatHistory.sources}
            html={chatHistory.html as string}
          />
        ))}
      </Flex>
      <Box>
        <Message setter={setMessages} />
      </Box>
    </Flex>
  )
}

export default Chat
