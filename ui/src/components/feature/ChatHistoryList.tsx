import { ChevronDownIcon, DeleteIcon, EditIcon, ExternalLinkIcon, RepeatIcon } from '@chakra-ui/icons'
import { Button, Flex, IconButton, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react'
import { ChatHistory } from '@shared/types'
import { selectFunc } from '@shared/utils'
import { modalAtom, sessionIdAtom } from 'atoms'
import { useAtom } from 'jotai'
import { useEffect } from 'react'

type Props = {
  history: ChatHistory[]
  setNew(newChat: boolean): void
}

const ChatHistoryList = (props: Props) => {
  const [sessionId, setSessionId] = useAtom(sessionIdAtom)
  const [modal, setModal] = useAtom(modalAtom)
  const histories = props.history

  const selectChat = (sid: string) => {
    console.log('MODAL: ', modal)
    console.log('selected chat:', sid, sessionId)
    if (sid === sessionId) {
      return
    }
    selectFunc(sid)
    props.setNew(false)
    setSessionId(sid)
  }

  useEffect(() => {
    selectFunc(sessionId)
  })

  return (
    <Flex width={72} flexFlow={'column'} gap={4} alignItems={'flex-start'}>
      <Flex width={'100%'} justifyContent={'space-between'} direction="column" gap={2}>
        {histories.map((history, index) => (
          <Flex gap={4} justifyContent={'space-between'} alignItems={'space-between'} key={index}>
            <Button
              width={'100%'}
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
