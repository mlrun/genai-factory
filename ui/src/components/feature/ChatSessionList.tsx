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
import { selectedSessionAtom, sessionsAtom, sessionsWithFetchAtom } from '@atoms/sessions'
import { ChevronDownIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons'
import {
  Button,
  Flex,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useColorMode,
  useToast
} from '@chakra-ui/react'
import Client from '@services/Api'
import { colors } from '@shared/theme'
import { Session } from '@shared/types/session'
import { isTypingAtom, messagesAtom, sessionIdAtom, usernameAtom } from 'atoms'
import { useAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type Props = {
  setNew(newChat: boolean): void
}

const ChatSessionList = (props: Props) => {
  const [, setSessionId] = useAtom(sessionIdAtom)
  const [sessions] = useAtom(sessionsAtom)
  const [selectedSession, setSelectedSession] = useAtom(selectedSessionAtom)
  const [, setMessages] = useAtom(messagesAtom)
  const [, setIsTyping] = useAtom(isTypingAtom)
  const [username] = useAtom(usernameAtom)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const toast = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [description, setDescription] = useState('')
  const [, fetchSessions] = useAtom(sessionsWithFetchAtom)
  const inputRef = useRef<HTMLInputElement>(null)

  const { colorMode } = useColorMode()

  useEffect(() => {
    sessions.find(session => {
      if (pathname.includes(session.uid as string)) {
        setMessages(session.history!)
        setDescription(session.description)
      }
    })
  }, [sessions, pathname, setMessages])

  const selectChat = (session: Session) => {
    props.setNew(false)
    setIsTyping(false)
    setMessages(session.history!)
    navigate(`/chat/${session.uid}`)
  }

  const deleteSession = async () => {
    try {
      await Client.deleteSession(username, selectedSession).then(res => {
        if (!res.error) {
          toast({
            title: 'Session deleted',
            description: 'The selected session has been deleted successfully.',
            status: 'success',
            duration: 3000,
            isClosable: true
          })
        } else {
          toast({
            title: 'Error while deleting session',
            description: res.error,
            status: 'error',
            duration: 5000,
            isClosable: true
          })
        }
      })
    } catch (error) {
      console.error(error)
    }
  }

  const updateSession = async () => {
    try {
      await Client.updateSession(username, { ...selectedSession, description })
      setIsEditing(false)
      await fetchSessions(username)
    } catch (error) {
      console.error('Error updating session:', error)
      toast({
        title: 'Error updating session',
        description: 'The session has not been updated.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  return (
    <Flex width={72} flexFlow={'column'} gap={4} alignItems={'flex-start'}>
      <Flex width={'100%'} justifyContent={'space-between'} direction="column" gap={2}>
        {sessions.map((session, index) => (
          <Flex gap={4} justifyContent={'space-between'} alignItems={'space-between'} key={index}>
            <Button
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setIsEditing(true)
                }
              }}
              width={'100%'}
              bg={
                colorMode === 'dark'
                  ? pathname.includes(session.uid as string)
                    ? colors.mint
                    : colors.gray700
                  : pathname.includes(session.uid as string)
                    ? colors.mint
                    : colors.gray300
              }
              _hover={{ bg: colors.mintDark }}
              _active={{ bg: colors.mintLight }}
              onClick={() => {
                selectChat(session)
                setSessionId(session.uid as string)
                setSelectedSession(session)
              }}
            >
              <>
                {isEditing && session.uid === selectedSession.uid ? (
                  <Input
                    bg={'transparent'}
                    border={'none'}
                    ref={inputRef}
                    onFocus={e => e.target.click()}
                    textAlign={'center'}
                    focusBorderColor="transparent"
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    value={description}
                    onChange={e => {
                      setDescription(e.target.value)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        updateSession()
                      }
                    }}
                  />
                ) : (
                  session.description || session.name
                )}
              </>
            </Button>
            <Menu>
              <MenuButton
                onClick={() => {
                  setIsEditing(false)
                  setSelectedSession(session)
                  setDescription(session.description)
                }}
                as={IconButton}
                aria-label="Options"
                icon={<ChevronDownIcon />}
                variant="outline"
              />
              <MenuList>
                <MenuItem onClick={() => setIsEditing(true)} icon={<EditIcon />}>
                  Rename
                </MenuItem>
                {/* <MenuItem icon={<ExternalLinkIcon />}>Export to PDF</MenuItem>
                <MenuItem icon={<RepeatIcon />}>Archive</MenuItem> */}
                <MenuItem onClick={deleteSession} icon={<DeleteIcon />}>
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}

export default ChatSessionList
