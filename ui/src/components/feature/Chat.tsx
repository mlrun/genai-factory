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
import { messagesAtom, sessionIdAtom, usernameAtom } from 'atoms'
import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'

const Chat = () => {
  const [messages, setMessages] = useAtom<ChatHistory[]>(messagesAtom)
  const [sessionId] = useAtom(sessionIdAtom)
  const [username] = useAtom(usernameAtom)

  useEffect(() => {
    async function fetchData() {
      await Client.getSession(username, sessionId)
    }
    fetchData()
  }, [sessionId, setMessages, username])

  const lastMessageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, setMessages])

  return (
    <Flex
      paddingX={{ xl: '25%', md: '10%' }}
      paddingBottom={4}
      flexDir={'column'}
      justifyContent={'space-between'}
      flexGrow={1}
      height="calc(100vh - 92px)"
    >
      <Flex
        sx={{
          '::-webkit-scrollbar': {
            display: 'none'
          }
        }}
        justifyContent="flex-start"
        flexGrow={1}
        flexDirection="column"
        paddingBottom="92px"
        overflowY="scroll"
      >
        {messages?.map((message, index) => (
          <Bubble
            key={index}
            content={message.content}
            bot={message.role}
            sources={message.sources}
            html={message.html as string}
          />
        ))}
        <Box height={'2px'} ref={lastMessageRef} />
      </Flex>
      <Box>
        <Message />
      </Box>
    </Flex>
  )
}

export default Chat
