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

import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { ArrowUpIcon, AttachmentIcon } from '@chakra-ui/icons';
import { Flex, IconButton, Input, useToast } from '@chakra-ui/react';
import { useSendMessage, useSession } from '@queries';

import { useAuthStore } from '@stores/authStore';
import { useChatStore } from '@stores/chatStore';

const Message = () => {
  const toast = useToast();
  const { sessionName } = useParams<{ sessionName: string }>();
  const { canSend, setCanSend, setIsMessageError } = useChatStore();
  const { user } = useAuthStore();
  const username = user?.username;

  const { data: session, refetch } = useSession(username, sessionName);
  const [inputValue, setInputValue] = useState('');

  const { mutateAsync: sendMessage } = useSendMessage();

  const submitMessage = async () => {
    if (!session || !username || !inputValue.trim()) return;

    setCanSend(false);
    await sendMessage(
      {
        question: inputValue,
        session_name: session.name,
      },
      {
        onSuccess: async () => {
          setCanSend(false);
          await refetch();
        },
        onError: (error) => {
          setIsMessageError(true);
          toast({
            title: 'An unexpected error occurred',
            description: error.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          setCanSend(true);
        },
      },
    );

    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent the default action to avoid adding a new line
      submitMessage();
    }
  };

  return (
    <Flex justifyContent="center" gap={4} maxWidth="100%">
      <IconButton aria-label="Send" icon={<AttachmentIcon />} />
      <Input
        maxWidth="576px"
        type="text"
        placeholder="Send message..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => canSend && handleKeyPress(e)}
      />
      <IconButton
        isDisabled={!canSend}
        aria-label="Send"
        icon={<ArrowUpIcon />}
        onClick={submitMessage}
      />
    </Flex>
  );
};

export default Message;
