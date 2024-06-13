import Bubble from '@components/shared/Bubble'
import Button from '@components/shared/Button'
import Message from '@components/shared/Message'
import Search from '@components/shared/Search'
import Client from '@services/Api'
import { ChatHistory } from '@shared/types'
import { adminAtom, sessionIdAtom, usernameAtom } from 'atoms'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import './Chat.css'

const Chat = () => {
  const [messages, setMessages] = useState<ChatHistory[]>([])
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
  }, [sessionId])

  return (
    <div className="comp-chat">
      <div className="chat-flex">
        <div className="bubbles-flex p-8">
          {messages.map((chatHistory, key) => (
            <Bubble
              key={key}
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
