import { Flex, useColorMode } from '@chakra-ui/react'
import { colors } from '@shared/theme'
import { ReactNode } from 'react'

type SidebarProps = {
  children: ReactNode
}

const Sidebar = ({ children }: SidebarProps) => {
  const { colorMode } = useColorMode()

  return (
    <Flex
      minWidth={72}
      bg={colorMode == 'dark' ? colors.sidebarDark : colors.sidebarLight}
      flexFlow={'column'}
      gap={4}
      padding={4}
      alignItems={'flex-start'}
    >
      {children}
    </Flex>
  )
}

export default Sidebar
