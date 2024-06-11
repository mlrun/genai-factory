import React, { ReactNode } from 'react'
import TopBar from '@components/feature/Topbar'
import { useAtom } from 'jotai'
import { usernameAtom } from 'atoms'
import Sidebar from '../Sidebar'
import { useNavigate } from 'react-router-dom'
import RightBar from '../Rightbar'

type LayoutProps = {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [username, setUsername] = useAtom(usernameAtom)
  const navigate = useNavigate()
  const changeLogin = (data: boolean) => {
    setUsername('')
    navigate('/')
  }
  return (
    <>
      <TopBar user={username} onLoginChange={changeLogin} />
      <div className="flex justify-between">
        <Sidebar />
        <div className="flex w-full">{children}</div>
        <RightBar />
      </div>
    </>
  )
}

export default Layout
