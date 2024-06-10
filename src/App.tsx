import Chat from '@components/feature/Chat'
import Login from '@components/feature/Login'
import Rightbar from '@components/feature/Rightbar'
import Leftbar from '@components/feature/Leftbar'
import './App.css'
import Admin from '@components/feature/Admin'
import { useAtom } from 'jotai'
import { adminAtom, modalAtom, sessionIdAtom, usernameAtom } from 'atoms'
import { Provider as JotaiProvider } from 'jotai'

function App() {
  const [sessionId, setSessionId] = useAtom(sessionIdAtom)
  const [username, setUsername] = useAtom(usernameAtom)
  const [admin, setAdmin] = useAtom(adminAtom)

  return (
    <JotaiProvider>
      <div className="app-flex">
        {username ? (
          !admin ? (
            <div className="app-flex">
              <Leftbar />
              <Chat />
              <Rightbar />
            </div>
          ) : (
            <div className="app-flex">
              <Admin />
            </div>
          )
        ) : (
          <div className="app-flex">
            <h1>
              <Login />
            </h1>
          </div>
        )}
      </div>
    </JotaiProvider>
  )
}

export default App
