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
import { ChevronDownIcon, DeleteIcon, EditIcon, ExternalLinkIcon, RepeatIcon } from '@chakra-ui/icons'
import { Button, Flex, IconButton, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react'
import { colors } from '@shared/theme'
import { ChatHistory } from '@shared/types'
import { selectFunc } from '@shared/utils'
import { modalAtom, sessionIdAtom } from 'atoms'
import { useAtom } from 'jotai'
import { useLocation, useNavigate } from 'react-router-dom'

type Props = {
  history: ChatHistory[]
  setNew(newChat: boolean): void
}

const ChatHistoryList = (props: Props) => {
  const [sessionId, setSessionId] = useAtom(sessionIdAtom)
  const [modal, setModal] = useAtom(modalAtom)
  const histories = props.history

  const { pathname } = useLocation()
  const navigate = useNavigate()

  const selectChat = (sid: string) => {
    console.log('MODAL: ', modal)
    console.log('selected chat:', sid, sessionId)
    if (sid === sessionId) {
      return
    }
    selectFunc(sid)
    props.setNew(false)
    setSessionId(sid)
    navigate(`/chat/${sid}`)
  }

  return (
    <Flex width={72} flexFlow={'column'} gap={4} alignItems={'flex-start'}>
      <Flex width={'100%'} justifyContent={'space-between'} direction="column" gap={2}>
        {histories.map((history, index) => (
          <Flex gap={4} justifyContent={'space-between'} alignItems={'space-between'} key={index}>
            <Button
              width={'100%'}
              bg={pathname.includes(history.name as string) ? colors.mint : colors.gray600}
              onClick={() => {
                selectChat(history.name as string)
              }}
            >
              {history.description || history.name}
            </Button>
            <Menu>
              <MenuButton as={IconButton} aria-label="Options" icon={<ChevronDownIcon />} variant="outline" />
              <MenuList>
                <MenuItem icon={<EditIcon />}>Rename</MenuItem>
                <MenuItem icon={<ExternalLinkIcon />}>Export to PDF</MenuItem>
                <MenuItem icon={<RepeatIcon />}>Archive</MenuItem>
                <MenuItem icon={<DeleteIcon />}>Delete</MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}

export default ChatHistoryList
