import Bubble from '@components/Bubble'
import Button from '@components/Button'
import Message from '@components/Message'
import Search from '@components/Search'
import Client from '@services/Api'
import AppContext from '@services/AppContext'
import { ChatHistory } from '@shared/types'
import { useContext, useEffect, useState } from 'react'
import './Chat.css'

const Chat = () => {
  const [messages, setMessages] = useState<ChatHistory[]>([])
  const { sessionId, setSessionId, username, setUsername, admin, setAdmin } = useContext(AppContext)

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
  }, [sessionId])

  return (
    <div className="comp-chat">
      <details className="mobile-menu">
        <summary>
          <div className="icon-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </div>
        </summary>
        <div className="inner-menu">
          <Search />
          <Button label="History" onClick={e => console.log(e)} />
          <Button label="Properties" onClick={e => console.log(e)} />
          <Button label="New Chat" onClick={e => console.log(e)} />
        </div>
      </details>

      <div className="chat-flex">
        <div className="bubbles-flex">
          {messages.map(chatHistory => (
            <Bubble
              content={chatHistory.content}
              bot={chatHistory.role}
              sources={chatHistory.sources}
              html={chatHistory.html as string}
            />
          ))}
        </div>

        <Message setter={setMessages} />
      </div>
    </div>
  )
}

export default Chat
