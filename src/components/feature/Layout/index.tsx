import React, { ReactNode } from 'react'
import TopBar from '@components/feature/Topbar'
import { useAtom } from 'jotai'
import { usernameAtom } from 'atoms'
import Sidebar from '../Sidebar'
import { useNavigate } from 'react-router-dom'
import { Box, Flex } from '@chakra-ui/react'

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
    <Flex direction={'column'}>
      <TopBar user={username} onLoginChange={changeLogin} />
      <Flex justifyContent={'space-between'}>
        <Box display={{ base: 'none', md: 'flex' }}>
          <Sidebar />
        </Box>
        <Flex width={'100%'} height={'91vh'}>
          {children}
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Layout
