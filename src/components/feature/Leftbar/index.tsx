import ChatHistoryList from '@components/feature/ChatHistoryList'
import Button from '@components/shared/Button'
import Header from '@components/shared/Header'
import Client from '@services/Api'
import { ChatHistory } from '@shared/types'
import { generateSessionId } from '@shared/utils'
import { sessionIdAtom, usernameAtom } from 'atoms'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import './Leftbar.css'

const Leftbar = () => {
  const [sessionId, setSessionId] = useAtom(sessionIdAtom)
  const [username, setUsername] = useAtom(usernameAtom)
  const [history, setHistory] = useState<ChatHistory[]>([])
  const [isNew, setIsNew] = useState(true)

  const newChat = async () => {
    const sid = generateSessionId()
    setIsNew(true)
    setSessionId(sid)
  }

  const changeLogin = () => {
    setUsername('')
    //  setHistory([]);
  }

  const fetchSessions = async () => {
    try {
      const sessions = await Client.listSessions(username)
      console.log('fetching sessions:', isNew, sessions)
      if (isNew) {
        if (sessions.length === 0 || sessions[0].name !== sessionId) {
          sessions.unshift({ name: sessionId, description: '* New chat' })
        }
      }
      setHistory(sessions)
    } catch (error) {
      console.log('Failed to fetch sessions for:', username, error)
      setHistory([{ name: sessionId, description: '* New chat', content: '', role: 'user', sources: [] }])
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [sessionId])

  useEffect(() => {
    async function updateUser() {
      if (username) {
        console.log('changed login to:', username)
        const sessions = await Client.listSessions(username, 'names', 1)
        if (sessions.length > 0) {
          console.log('setting session id from history:', sessions[0])
          setSessionId(sessions[0])
          setIsNew(false)
          // await fetchSessions();
        } else {
          console.log('creating new chat session')
          await newChat()
        }
      }
    }
    updateUser()
  }, [username])

  return (
    <div className="comp-leftbar">
      <Header user={username} onLogout={changeLogin} />
      <div className="inner">
        {/* <Search /> */}
        <ChatHistoryList history={history} setNew={setIsNew} />
      </div>
      <div className="footer-flex">
        <Button label="New chat" onClick={newChat} />
      </div>
    </div>
  )
}

export default Leftbar
