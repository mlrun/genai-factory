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

import React, { ReactNode, useEffect } from 'react';
import { publicUserAtom } from 'atoms';
import { motion as m } from 'framer-motion';
import { useAtom } from 'jotai';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box, Flex } from '@chakra-ui/react';
import Client from '@services/Api';

import Chatbar from './Chat/Chatbar';
import TopBar from './Topbar/Topbar';
import Sidebar from './Sidebar';

import useAuth from '@hooks/useAuth';

type LayoutProps = {
  children: ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [publicUser, setPublicUser] = useAtom(publicUserAtom);
  const { logout, user } = useAuth();

  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (Object.keys(publicUser).length === 0 && user?.username) {
      Client.getUser(user.username)
        .then((res) => setPublicUser(res.data))
        .catch((error) => {
          console.error('Failed to fetch user:', error);
          logout();
        });
    }
  }, []);

  const changeLogin = () => {
    if (user?.username) logout();
    navigate('/');
  };

  const showChatbar = pathname.includes('chat');

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: '100%' }}
      transition={{ duration: 0.3 }}
      exit={{ opacity: '50%' }}
    >
      <Flex direction="column" height="100vh">
        <TopBar onLoginChange={changeLogin} />
        <Flex flex="1" overflow="hidden">
          {showChatbar && (
            <Box display={{ md: 'flex' }}>
              <Sidebar>
                <Chatbar publicUser={publicUser} />
              </Sidebar>
            </Box>
          )}
          <Box flex="1" overflowY="auto" bg="gray.50">
            {children}
          </Box>
        </Flex>
      </Flex>
    </m.div>
  );
};

export default Layout;
