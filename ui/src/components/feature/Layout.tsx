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

import React, { ReactNode, useCallback, useEffect, useMemo } from 'react';
import { motion as m } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box, Flex } from '@chakra-ui/react';
import Loading from '@components/shared/Loading';
import { useUser } from '@queries';

import Chatbar from './Chat/Chatbar';
import TopBar from './Topbar/Topbar';
import Sidebar from './Sidebar';

import { useAuthStore } from '@stores/authStore';

type LayoutProps = {
  children: ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const logout = useAuthStore((s) => s.logout);

  const { data: publicUser, error, isError, isLoading } = useUser();

  const username = useMemo(() => publicUser?.name || '', [publicUser]);

  useEffect(() => {
    if (isError) {
      console.error('Failed to fetch user:', error);
      logout();
      navigate('/');
    }
  }, [isError, error, logout, navigate, username]);

  const changeLogin = useCallback(() => {
    if (username) logout();
    navigate('/');
  }, [username]);

  const showChatbar = pathname.includes('chat');

  if (isLoading) return <Loading />;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      exit={{ opacity: 0.5 }}
    >
      <Flex direction="column" height="100vh">
        <TopBar onLoginChange={changeLogin} />
        <Flex flex="1" overflow="hidden">
          {showChatbar && (
            <Box display={{ md: 'flex' }}>
              <Sidebar>
                {publicUser && <Chatbar publicUser={publicUser} />}
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
