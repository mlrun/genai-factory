import { ArrowUpIcon, AttachmentIcon } from '@chakra-ui/icons'
import { Flex, IconButton, Input } from '@chakra-ui/react'
import Client from '@services/Api'
import { ChatHistory } from '@shared/types'
import { sessionIdAtom, usernameAtom } from 'atoms'
import { useAtom } from 'jotai'
import { useState } from 'react'
type Props = {
  setter: React.Dispatch<React.SetStateAction<ChatHistory[]>>
}
const Message = ({ setter }: Props) => {
  const [inputValue, setInputValue] = useState('')
  const [sessionId, setSessionId] = useAtom(sessionIdAtom)
  const [username, setUsername] = useAtom(usernameAtom)

  const submitMessage = async () => {
    setter(prevMessages => [...prevMessages, { role: 'Human', content: inputValue, sources: [] }])
    setInputValue('')
    setTimeout(function () {
      const lastBubble = document.getElementsByClassName('help-text').length - 1
      document.getElementsByClassName('help-text')[lastBubble].scrollIntoView(false)
    }, 50)

    setter(prevMessages => [...prevMessages, { role: 'AI', content: '...', sources: [] }])
    const result = await Client.submitQuery(sessionId, inputValue, username)
    setter(prevMessages => [
      ...prevMessages.slice(0, -1),
      { role: 'AI', content: result.answer, sources: result.sources }
    ])
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
    <Flex padding={'0 40px'} justifyContent={'center'} gap={4} maxWidth={'100%'}>
      <IconButton aria-label="Send" icon={<AttachmentIcon />} />

      <Input
        maxWidth={'576px'}
        type="text"
        placeholder="Send message..."
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
      />
      {/* <div
        className="icon-button mic-icon"
        onClick={event => {
          return (event.target as HTMLElement).classList.toggle('selected')
        }}
      ></div> */}
      <IconButton aria-label="Send" icon={<ArrowUpIcon />} onClick={handleClick} />
    </Flex>
  )
}

export default Message
