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
