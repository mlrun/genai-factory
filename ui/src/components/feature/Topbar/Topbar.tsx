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

import { useLocation, useNavigate } from 'react-router-dom';

import {
  Avatar,
  Box,
  Button,
  Flex,
  Image,
  useColorMode,
  useDisclosure,
} from '@chakra-ui/react';
import { colors } from '@shared/theme';

import Rightbar from '../Rightbar';

import { useAuthStore } from '@stores/authStore';

import Logo from '@assets/mlrun.png';

type Props = {
  onLoginChange: (value: boolean) => void;
};

const Topbar = ({ onLoginChange }: Props) => {
  const { colorMode } = useColorMode();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const username = user?.username;

  const isPathActive = (current: string, base: string) =>
    current === base || current.startsWith(base + '/');

  const navItems = [
    { label: 'Projects', path: '/projects' },
    { label: 'Chat', path: '/chat' },
    { label: 'Users', path: '/users' },
  ];

  return (
    <Flex
      position="sticky"
      top={0}
      alignItems="center"
      justifyContent="space-between"
      h={16}
      bg={colorMode === 'dark' ? colors.topbarDark : colors.topbarLight}
      zIndex={10}
      data-testid="topbar"
    >
      <Flex alignItems="center">
        <Image
          paddingLeft={4}
          filter={colorMode === 'light' ? 'invert(100%)' : ''}
          src={Logo}
          w={40}
          alt="logo"
          data-testid="logo"
        />
        <Box paddingLeft={4} display="flex" gap={2}>
          {navItems.map(({ label, path }) => {
            const isActive = isPathActive(location.pathname, path);
            return (
              <Button
                key={path}
                variant={isActive ? 'solid' : 'ghost'}
                onClick={() => navigate(path)}
                fontWeight={isActive ? 'bold' : 'normal'}
                colorScheme={isActive ? 'blue' : undefined}
              >
                {label}
              </Button>
            );
          })}
        </Box>
      </Flex>
      <Flex alignItems="center" paddingRight={4}>
        <Rightbar
          isOpen={isOpen}
          onClose={onClose}
          onLoginChange={onLoginChange}
        />
      </Flex>
    </Flex>
  );
};

export default Topbar;
