import Chat from '@components/Chat'
import Login from '@components/Login'
import Rightbar from '@components/Rightbar'
import AppContext from '@services/AppContext'
import Leftbar from 'components/Leftbar'
import { useState } from 'react'
import './App.css'

function App() {
  const [sessionId, setSessionId] = useState('')
  const [username, setUsername] = useState('')
  const [admin, setAdmin] = useState(false)
  const [modal, setModal] = useState(false)

  return (
    <div className="app-flex">
      <AppContext.Provider value={{ sessionId, setSessionId, username, setUsername, admin, setAdmin, modal, setModal }}>
        {username ? (
          !admin ? (
            <div className="app-flex">
              <Leftbar />
              <Chat />
              <Rightbar />
            </div>
          ) : (
            <div className="app-flex">
              <h1>Admin</h1>
            </div>
          )
        ) : (
          <div className="app-flex">
            <h1>
              <Login />
            </h1>
          </div>
        )}
      </AppContext.Provider>
    </div>
  )
}

export default App
