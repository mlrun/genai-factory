import React, { ReactNode } from 'react'
import TopBar from '@components/feature/Topbar'
import RightBar from '@components/feature/Rightbar'
import { useAtom } from 'jotai'
import { usernameAtom } from 'atoms'
import Sidebar from '../Sidebar'

type LayoutProps = {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [username, setUsername] = useAtom(usernameAtom)
  const changeLogin = (data: boolean) => {
    setUsername('')
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
