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
import { useLogin } from '@queries';
import { colors } from '@shared/theme';

import Logo from '@assets/mlrun.png';

const Login = () => {
  const { colorMode } = useColorMode();
  const loginMutation = useLogin();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [admin, setAdmin] = useState(false);

  const submitFunc = (
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    loginMutation.mutate({ username, password, admin });
  };

  return (
    <Flex
      height="100vh"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      // bgGradient="linear(to-b, #4b6cb7 0%, #182848 100%)"
    >
      <Flex minWidth="288px">
        <FormControl
          height="420px"
          bg={colorMode === 'dark' ? colors.gray900 : colors.gray100}
          border={`1px solid ${
            colorMode === 'dark' ? colors.gray600 : colors.gray700
          }`}
          display="flex"
          justifyContent="space-around"
          flexDirection="column"
          borderRadius="10px"
          gap={4}
          padding={4}
          onKeyDown={(e) =>
            username.length &&
            password.length &&
            e.key === 'Enter' &&
            submitFunc(e)
          }
        >
          <Flex justifyContent="center">
            <Image
              width="180px"
              filter={colorMode === 'dark' ? '' : 'invert(100%)'}
              src={Logo}
              alt="Logo"
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

          <Flex alignItems="center">
            <FormLabel htmlFor="admin-mode" mb="0">
              Admin mode
            </FormLabel>
            <Switch
              id="admin-mode"
              isChecked={admin}
              onChange={() => setAdmin((admin) => !admin)}
            />
          </Flex>

          <Button
            isDisabled={!username.length || !password.length}
            isLoading={loginMutation.isPending}
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
