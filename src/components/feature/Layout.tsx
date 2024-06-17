import { Box, Flex } from '@chakra-ui/react'
import { usernameAtom } from 'atoms'
import { useAtom } from 'jotai'
import React, { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Leftbar from './Leftbar'
import Sidebar from './Sidebar'
import TopBar from './Topbar'
type LayoutProps = {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [username, setUsername] = useAtom(usernameAtom)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const changeLogin = (data: boolean) => {
    setUsername('')
    navigate('/')
  }
  return (
    <Flex direction={'column'}>
      <TopBar user={username} onLoginChange={changeLogin} />
      <Flex justifyContent={'space-between'}>
        <Box display={{ base: 'none', md: 'flex' }}>{pathname === '/chat' ? <Leftbar /> : <Sidebar />}</Box>
        <Flex width={'100%'} height={'91vh'}>
          {children}
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Layout
