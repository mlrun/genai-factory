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

import { useEffect, useRef } from 'react';

import { Box, Flex } from '@chakra-ui/react';
import Bubble from '@components/shared/Bubble';
import Loading from '@components/shared/Loading';
import Message from '@components/shared/Message';
import { useSession } from '@queries';

const Chat = () => {
  const { data: session, error, isLoading } = useSession();
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [session?.history]);

  if (isLoading) return <Loading />;
  if (error) return <div>Failed to load chat.</div>;

  return (
    <Flex
      paddingX={{ xl: '25%', md: '10%' }}
      paddingBottom={4}
      flexDir="column"
      justifyContent="space-between"
      flexGrow={1}
      height="calc(100vh - 92px)"
    >
      <Flex
        sx={{ '::-webkit-scrollbar': { display: 'none' } }}
        justifyContent="flex-start"
        flexGrow={1}
        flexDirection="column"
        paddingBottom="92px"
        overflowY="scroll"
      >
        {session?.history?.map((message, index) => (
          <Bubble
            key={index}
            content={message.content}
            bot={message.role}
            sources={message.sources}
            html={message.html as string}
          />
        ))}
        <Box height="2px" ref={lastMessageRef} />
      </Flex>
      <Box>
        <Message />
      </Box>
    </Flex>
  );
};

export default Chat;
