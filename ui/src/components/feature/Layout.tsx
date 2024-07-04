import { Box, Flex, Menu, MenuItem } from '@chakra-ui/react'
import { usernameAtom } from 'atoms'
import { motion as m } from 'framer-motion'
import { useAtom } from 'jotai'
import React, { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Chatbar from './Chatbar'
import Sidebar from './Sidebar'
import TopBar from './Topbar/Topbar'

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
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: '100%' }}
      transition={{ duration: 0.3 }}
      exit={{ opacity: '50%' }}
    >
      <Flex direction={'column'}>
        <TopBar user={username} onLoginChange={changeLogin} />
        <Flex justifyContent={'space-between'}>
          <Box display={{ base: 'none', md: 'flex' }}>
            <Sidebar>
              {pathname === '/chat' ? (
                <Chatbar />
              ) : (
                <Menu>
                  <MenuItem onClick={() => navigate('/admin/users')}>Users</MenuItem>
                  <MenuItem onClick={() => navigate('/admin/chat-histories')}>Chat Histories</MenuItem>
                  <MenuItem>Data Sets</MenuItem>
                  <MenuItem>Documents</MenuItem>
                  <MenuItem>Pipelines</MenuItem>
                </Menu>
              )}
            </Sidebar>
          </Box>
          <Flex width={'100%'} height={'91vh'}>
            {children}
          </Flex>
        </Flex>
      </Flex>
    </m.div>
  )
}

export default Layout
