import Button from '@components/shared/Button'
import Client from '@services/Api'
import AppContext from '@services/AppContext'
import { ChatHistory } from '@shared/types'
import { useContext, useState } from 'react'
import './Message.css'
type Props = {
  setter: React.Dispatch<React.SetStateAction<ChatHistory[]>>
}
const Message = ({ setter }: Props) => {
  const [inputValue, setInputValue] = useState('')
  const { sessionId, setSessionId, username, setUsername, admin, setAdmin } = useContext(AppContext)

  const submitMessage = async () => {
    console.log('inputValue:', inputValue)
    setter(prevMessages => [...prevMessages, { role: 'Human', content: inputValue, sources: [] }])
    setInputValue('')
    setTimeout(function () {
      const lastBubble = document.getElementsByClassName('help-text').length - 1
      document.getElementsByClassName('help-text')[lastBubble].scrollIntoView(false)
    }, 50)

    setter(prevMessages => [...prevMessages, { role: 'AI', content: '![Thinking](/assets/thinking.gif)', sources: [] }])
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

  return (
    <div className="comp-message">
      <div className="input">
        <div className="icon-button plus-icon"></div>
        <input
          type="text"
          placeholder="Send message..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <div
          className="icon-button mic-icon"
          onClick={event => {
            return (event.target as HTMLElement).classList.toggle('selected')
          }}
        ></div>
        <Button label="Send" onClick={submitMessage} />
      </div>
    </div>
  )
}

// [X] TODO: Add admin pages for Leftbar categories + selected
// [X] TODO: Add graphs for an option for a drilldown screen
// [X] TODO: Tabs component for table/ pages/ whatever

export default Message
