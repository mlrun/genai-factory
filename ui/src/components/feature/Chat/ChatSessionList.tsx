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

import { useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ChevronDownIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { useSession, useSessionActions, useSessions } from '@queries';
import { colors } from '@shared/theme';
import { Session } from '@shared/types/session';

import { useAuthStore } from '@stores/authStore';
import { useChatStore } from '@stores/chatStore';

const ChatSessionList = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { sessionName } = useParams<{ sessionName: string }>();
  const { colorMode } = useColorMode();
  const toast = useToast();

  const { user } = useAuthStore();
  const username = user?.username;

  const { setCanSend, setIsTyping } = useChatStore();

  const { data: sessions = [] } = useSessions(username);
  const { data: selectedSession } = useSession(username, sessionName);

  const { deleteSession, updateSession } = useSessionActions(username);

  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectChat = (session: Session) => {
    setIsTyping(false);
    setCanSend(true);
    navigate(`/chat/${session.name}`);
  };

  const handleUpdateSession = () => {
    if (!selectedSession) return;

    updateSession.mutate(
      { ...selectedSession, description },
      {
        onSuccess: () => {
          toast({
            title: 'Session updated',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          setIsEditing(false);
        },
        onError: (error) => {
          toast({
            title: 'Error updating session',
            description: error.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        },
      },
    );
  };

  const handleDeleteSession = (name: string) => {
    deleteSession.mutate(name, {
      onSuccess: () => {
        toast({
          title: 'Session deleted',
          description: 'The selected session has been deleted successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error) => {
        toast({
          title: 'Error while deleting session',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    });
  };

  return (
    <Flex
      width={72}
      maxHeight="680px"
      overflow="scroll"
      flexFlow="column"
      gap={4}
      alignItems="flex-start"
    >
      <Flex
        width="100%"
        justifyContent="space-between"
        direction="column"
        gap={2}
      >
        {sessions.map((session, index) => (
          <Flex
            gap={4}
            justifyContent={'space-between'}
            alignItems={'space-between'}
            key={index}
          >
            <Button
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditing(true);
                }
              }}
              width={'100%'}
              bg={
                colorMode === 'dark'
                  ? pathname.includes(session.name as string)
                    ? colors.gray700
                    : colors.gray800
                  : pathname.includes(session.name as string)
                    ? colors.gray400
                    : colors.gray200
              }
              _hover={{
                bg: colorMode === 'dark' ? colors.gray700 : colors.gray400,
              }}
              _active={{ bg: colors.gray600 }}
              onClick={() => handleSelectChat(session)}
            >
              <>
                {isEditing && session.uid === selectedSession?.uid ? (
                  <Input
                    ref={inputRef}
                    onFocus={(e) => e.target.click()}
                    textAlign={'center'}
                    focusBorderColor="transparent"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleUpdateSession()
                    }
                  />
                ) : (
                  session.name
                )}
              </>
            </Button>

            <Menu>
              <MenuButton
                onClick={() => {
                  setIsEditing(false);
                  setDescription(session.description);
                }}
                as={IconButton}
                aria-label="Options"
                icon={<ChevronDownIcon />}
                variant="outline"
              />
              <MenuList>
                <MenuItem
                  onClick={() => setIsEditing(true)}
                  icon={<EditIcon />}
                >
                  Rename
                </MenuItem>
                {/* <MenuItem icon={<ExternalLinkIcon />}>Export to PDF</MenuItem>
                <MenuItem icon={<RepeatIcon />}>Archive</MenuItem> */}
                <MenuItem
                  onClick={() => handleDeleteSession(session.name)}
                  icon={<DeleteIcon />}
                >
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
};

export default ChatSessionList;
