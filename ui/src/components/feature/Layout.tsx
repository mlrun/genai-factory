// Copyright 2024 Iguazio
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Box, Flex, Menu, MenuItem } from '@chakra-ui/react'
import useAuth from '@hooks/useAuth'
import { userWithTokenAtom, usernameAtom } from 'atoms'
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
  const [username] = useAtom(usernameAtom)
  const [user] = useAtom(userWithTokenAtom)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { logout } = useAuth()
  const changeLogin = (data: boolean) => {
    if (user?.username) {
      logout()
    }
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
          <Box display={{ md: 'flex' }}>
            <Sidebar>
              {pathname.includes('chat') ? (
                <Chatbar />
              ) : (
                <Menu>
                  <MenuItem onClick={() => navigate('/admin/users')}>Users</MenuItem>
                  <MenuItem onClick={() => navigate('/admin/projects')}>Projects</MenuItem>
                  <MenuItem onClick={() => navigate('/admin/data-sources')}>Data Sources</MenuItem>
                  <MenuItem onClick={() => navigate('/admin/datasets')}>Datasets</MenuItem>
                  <MenuItem onClick={() => navigate('/admin/models')}>Models</MenuItem>
                  <MenuItem onClick={() => navigate('/admin/documents')}>Documents</MenuItem>
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
