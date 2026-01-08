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

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { AddIcon } from '@chakra-ui/icons';
import { Button, Flex, useColorMode } from '@chakra-ui/react';
import { useSessionActions, useUser } from '@queries';
import { colors } from '@shared/theme';

import ChatSessionList from './ChatSessionList';

import { generateSessionId } from '@shared/utils';

import { DEFAULT_WORKFLOW_UID } from '@constants';

const Chatbar = () => {
  const navigate = useNavigate();
  const { colorMode } = useColorMode();
  const { data: publicUser } = useUser();

  const { createSession } = useSessionActions();

  const newChat = useCallback(async () => {
    try {
      const sessionName = generateSessionId();
      const payload = {
        name: sessionName,
        description: '* New Chat',
        labels: {},
        workflow_id: DEFAULT_WORKFLOW_UID,
        owner_id: publicUser?.uid,
      };
      const newSession = await createSession.mutateAsync(payload);
      navigate(`/chat/${newSession.name}`);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }, [publicUser]);

  return (
    <Flex
      gap={8}
      bg={colorMode === 'dark' ? colors.sidebarDark : colors.sidebarLight}
      flexDirection="column"
    >
      <ChatSessionList />
      <Flex justify="center">
        <Button
          width="30%"
          onClick={newChat}
          iconSpacing={2}
          leftIcon={<AddIcon />}
        >
          New
        </Button>
      </Flex>
    </Flex>
  );
};

export default Chatbar;
