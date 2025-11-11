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

import Markdown from 'react-markdown';

import { ChatIcon, CheckCircleIcon, CopyIcon } from '@chakra-ui/icons';
import {
  Flex,
  IconButton,
  Spinner,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import ChatMessage from '@components/feature/Chat/ChatMessage';
import { colors } from '@shared/theme';
import { Source } from '@shared/types';

import { useChatStore } from '@stores/chatStore';

interface BubbleProps {
  bot: string;
  content: string;
  html?: string;
  sources?: Source[];
}

const Bubble = ({ bot, content }: BubbleProps) => {
  const isMessageError = useChatStore((state) => state.isMessageError);
  const { colorMode } = useColorMode();
  const toast = useToast();

  return (
    <Flex gap={10} flexDirection="column">
      {bot === 'AI' ? (
        <Flex maxW="800px" role="group" alignItems="flex-start" gap={4}>
          <ChatIcon marginTop={2} />
          <Flex>{!content && !isMessageError && <Spinner size="sm" />}</Flex>
          {!!content && (
            <>
              <Flex
                direction="column"
                padding={4}
                borderRadius={6}
                bg={colorMode === 'dark' ? colors.gray800 : colors.gray300}
                textAlign="left"
                marginY={2}
                maxW="66%"
              >
                <ChatMessage message={content} />
              </Flex>
              <IconButton
                marginTop={2}
                _hover={{
                  bg: colorMode === 'dark' ? colors.gray700 : colors.gray200,
                }}
                bg={colorMode === 'dark' ? colors.gray800 : colors.gray300}
                display="none"
                _groupHover={{ display: 'block' }}
                icon={<CopyIcon />}
                onClick={() => {
                  navigator.clipboard.writeText(content);
                  toast({
                    title: 'Message copied',
                    status: 'success',
                    duration: 3000,
                    position: 'bottom',
                    icon: (
                      <Flex align="center">
                        <CheckCircleIcon />
                      </Flex>
                    ),
                  });
                }}
                aria-label="copy"
              />
            </>
          )}
        </Flex>
      ) : (
        <Flex justifyContent="flex-end">
          <Flex
            maxW="66%"
            textAlign="left"
            marginY={2}
            borderRadius={6}
            paddingX={4}
            paddingY={2}
            bg={colorMode === 'dark' ? colors.gray700 : colors.gray200}
            flexWrap="wrap"
          >
            <Markdown>{content}</Markdown>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default Bubble;
