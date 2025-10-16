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

import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';

import { adminAtom, publicUserAtom, usernameAtom } from '@atoms/index';
import { sessionsAtom, sessionsWithFetchAtom } from '@atoms/sessions';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  Switch,
  useColorMode,
} from '@chakra-ui/react';
import Client from '@services/Api';
import { colors } from '@shared/theme';

import useAuth from '@hooks/useAuth';

import Logo from '@assets/mlrun.png';

const Login = () => {
  const navigate = useNavigate();
  const { colorMode } = useColorMode();
  const [username, setUsername] = useAtom(usernameAtom);
  const [admin, setAdmin] = useAtom(adminAtom);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [publicUser, setPublicUser] = useAtom(publicUserAtom);
  const [sessions] = useAtom(sessionsAtom);
  const [, fetchSessions] = useAtom(sessionsWithFetchAtom);

  const submitFunc = async (
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      login(username, password, admin);

      const userResponse = await Client.getUser(username);
      if (userResponse && userResponse.data) {
        setPublicUser(userResponse.data);
      }

      if (admin) {
        navigate('/projects');
      } else {
        await handleUserNavigation();
      }
    } catch (error) {
      console.log(`Error: ${error}`);
      console.error('Error during submission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserNavigation = async () => {
    navigate(`/chat`);

    try {
      await fetchSessions(username);

      if (sessions.length) {
        navigate(`/chat/${sessions[0].uid}`);
      } else {
        await createNewSession();
      }
    } catch (error) {
      console.log(`Error: ${error}`);
      console.error('Error fetching sessions:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const sessionData = {
        name: 'default',
        description: '* New Chat',
        workflow_id: 'default',
        labels: {},
        owner_id: publicUser?.uid || '',
      };

      const newSessionResponse = await Client.createSession(
        username,
        sessionData,
      );

      if (!newSessionResponse.error) {
        navigate(`/chat/${newSessionResponse.data.uid}`);
      } else {
        console.error('Error creating session:', newSessionResponse.error);
      }
    } catch (error) {
      console.log(`Error: ${error}`);
      console.error('Error creating new session:', error);
    }
  };

  return (
    <Flex
      height={'100vh'}
      flexDirection={'column'}
      alignItems={'center'}
      justifyContent={'center'}
      bgGradient={'linear(to-b, #4b6cb7 0%, #182848 100%)'}
    >
      <Flex minWidth={'288px'}>
        <FormControl
          height={'420px'}
          bg={colorMode === 'dark' ? colors.gray900 : colors.gray100}
          border={`1px solid ${colorMode === 'dark' ? colors.gray600 : colors.gray700}`}
          display={'flex'}
          justifyContent={'space-around'}
          flexDirection={'column'}
          borderRadius={'10px'}
          gap={4}
          padding={4}
          onKeyDown={(e) =>
            username.length &&
            password.length &&
            e.key === 'Enter' &&
            submitFunc(e)
          }
        >
          <Flex justifyContent={'center'}>
            <Image
              width={'180px'}
              filter={colorMode === 'dark' ? '' : 'invert(100%)'}
              src={Logo}
            />
          </Flex>
          <Box>
            <FormLabel>Username</FormLabel>
            <Input
              data-testid="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Box>
          <Box>
            <FormLabel>Password</FormLabel>
            <Input
              data-testid="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Box>
          <Flex alignItems={'center'}>
            <FormLabel htmlFor="admin-mode" mb="0">
              Admin mode
            </FormLabel>
            <Switch
              defaultChecked={!!admin}
              onChange={() => setAdmin(!admin)}
              id="admin-mode"
            />
          </Flex>
          <Button
            isDisabled={!username.length || !password.length}
            isLoading={isLoading}
            onClick={submitFunc}
          >
            Login
          </Button>
        </FormControl>
      </Flex>
    </Flex>
  );
};

export default Login;
