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
    <Box paddingX={{ md: 12, lg: 24 }}>
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

      {/* [X] TODO: Microphone should kinda work, make it a toggle of 2 colors */}
      {/* [X] TODO: new components: graph (like MLRun nodes) */}
      {/* [ ] TODO: Add 'suggest' icon, to open popup w alternative text input */}
      {/* [ ] TODO: Add a dropdown to login w name+description (of different apps) */}
      {/* [X] TODO: Add a Modal component for Delete an session  */}
    </Box>
  )
}

export default Bubble
