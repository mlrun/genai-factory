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

import { ChatIcon, CopyIcon } from '@chakra-ui/icons'
import { Box, Flex, IconButton, useColorMode, useToast } from '@chakra-ui/react'
import ChatMessage from '@components/feature/ChatMessage'
import { colors } from '@shared/theme'
import { Source } from '@shared/types'
import Markdown from 'react-markdown'

type Props = {
  bot: string
  content: string
  html: string
  sources: Source[]
}

const Bubble = (props: Props) => {
  const { colorMode } = useColorMode()
  const toast = useToast()
  return (
    <Flex gap={10} flexDirection={'column'}>
      {props.bot == 'AI' ? (
        <Flex role={'group'} alignItems={'baseline'} gap={4}>
          <Flex></Flex>
          <ChatIcon />
          <Flex textAlign={'left'} marginY={2} maxW={'66%'}>
            {!!props.content && <ChatMessage message={props.content} />}
          </Flex>
          <IconButton
            display={'none'}
            _groupHover={{ display: 'block' }}
            icon={<CopyIcon />}
            onClick={() => {
              navigator.clipboard.writeText(props.content)
              toast({
                title: 'Copied',
                description: '',
                status: 'success',
                duration: 3000,
                position: 'bottom'
              })
            }}
            aria-label={'copy'}
          />
        </Flex>
      ) : (
        <Flex justifyContent={'flex-end'}>
          <Flex
            maxW={'66%'}
            textAlign={'left'}
            marginY={2}
            borderRadius={6}
            paddingX={4}
            paddingY={2}
            bg={colorMode === 'dark' ? colors.gray700 : colors.gray200}
            flexWrap={'wrap'}
          >
            <Markdown>{props.content}</Markdown>
          </Flex>
        </Flex>
      )}

      <Box className="help-text"></Box>
    </Flex>
  )
}

export default Bubble
