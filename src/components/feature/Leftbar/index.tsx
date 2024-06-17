import { Box, Button, Flex, useColorMode } from '@chakra-ui/react'
import Client from '@services/Api'
import { colors } from '@shared/theme'
import { ChatHistory } from '@shared/types'
import { generateSessionId } from '@shared/utils'
import { conversationsAtom, sessionIdAtom, usernameAtom } from 'atoms'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChatHistoryList from '../ChatHistoryList'

const Leftbar = () => {
  const [sessionId, setSessionId] = useAtom(sessionIdAtom)
  const [username, setUsername] = useAtom(usernameAtom)
  const [history, setHistory] = useAtom<ChatHistory[]>(conversationsAtom)
  const [isNew, setIsNew] = useState(true)
  const navigate = useNavigate()
  const { colorMode } = useColorMode()

  const newChat = async () => {
    const sid = generateSessionId()
    setIsNew(true)
    setSessionId(sid)
  }

  const changeLogin = () => {
    setUsername('')
    console.log('heheh')
    navigate('/')
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
    <Flex bg={colorMode == 'dark' ? colors.sidebarDark : colors.sidebarLight} flexDirection={'column'}>
      <ChatHistoryList history={history} setNew={setIsNew} />
      <Box p={4}>
        <Button width={'100%'} onClick={newChat}>
          New Chat
        </Button>
      </Box>
    </Flex>
  )
}

export default Leftbar
