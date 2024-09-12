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

import { sessionsAtom } from '@atoms/sessions'
import { ArrowUpIcon, AttachmentIcon } from '@chakra-ui/icons'
import { Flex, IconButton, Input, useToast } from '@chakra-ui/react'
import Client from '@services/Api'
import { canSendMessageAtom, isMessageErrorAtom, messagesAtom, sessionIdAtom } from 'atoms'
import { useAtom } from 'jotai'
import { useState } from 'react'

const Message = () => {
  const [inputValue, setInputValue] = useState('')

  const [sessionId] = useAtom(sessionIdAtom)
  const [, setMessages] = useAtom(messagesAtom)
  const [canSendMessage, setCanSendMessage] = useAtom(canSendMessageAtom)
  const [sessions] = useAtom(sessionsAtom)
  const [, setIsMessageError] = useAtom(isMessageErrorAtom)

  const toast = useToast()

  const submitMessage = async () => {
    setCanSendMessage(false)
    setMessages(prevMessages => {
      const safeMessages = Array.isArray(prevMessages) ? prevMessages : []
      return [...safeMessages, { role: 'Human', content: inputValue, sources: [] }]
    })
    setInputValue('')

    setMessages(prevMessages => {
      const safeMessages = Array.isArray(prevMessages) ? prevMessages : []
      return [...safeMessages, { role: 'AI', content: '', sources: [] }]
    })

    const workflowId = sessions.find(session => session.uid === sessionId)?.workflow_id
    const result = await Client.inferWorkflow('default', workflowId ?? 'default', {
      question: inputValue,
      session_id: sessionId,
      data_source: 'default'
    }).then(res => {
      if (res.error) {
        setIsMessageError(true)
        toast({
          title: 'An unexpected error occured',
          description: res.error,
          status: 'error',
          duration: 5000,
          isClosable: true
        })
        setCanSendMessage(false)
        return res
      }
      setCanSendMessage(true)
      return res
    })

    setMessages(prevMessages => {
      const safeMessages = Array.isArray(prevMessages) ? prevMessages : []
      return [...safeMessages.slice(0, -1), { role: 'AI', content: result.data.data.answer, sources: result.sources }]
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault() // Prevent the default action to avoid adding a new line
      submitMessage()
    }
  }

  const handleClick = () => {
    submitMessage()
  }

  return (
    <Flex justifyContent={'center'} gap={4} maxWidth={'100%'}>
      <IconButton aria-label="Send" icon={<AttachmentIcon />} />

      <Input
        maxWidth={'576px'}
        type="text"
        placeholder="Send message..."
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => canSendMessage && handleKeyPress(e)}
      />
      <IconButton isDisabled={!canSendMessage} aria-label="Send" icon={<ArrowUpIcon />} onClick={handleClick} />
    </Flex>
  )
}

export default Message
