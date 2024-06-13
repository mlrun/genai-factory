import { Flex, Menu, MenuItem, useColorMode } from '@chakra-ui/react'
import { colors } from '@shared/theme'
import './Sidebar.css'

const Sidebar = () => {
  const { colorMode } = useColorMode()

  return (
    <Flex
      width={72}
      height={'91vh'}
      bg={colorMode == 'dark' ? colors.sidebarDark : colors.sidebarLight}
      flexFlow={'column'}
      gap={4}
      padding={4}
      alignItems={'flex-start'}
    >
      <Menu>
        <MenuItem>Users</MenuItem>
        <MenuItem>Chat Histories</MenuItem>
        <MenuItem>Data Sets</MenuItem>
        <MenuItem>Documents</MenuItem>
        <MenuItem>Pipelines</MenuItem>
      </Menu>
    </Flex>
  )
}

export default Sidebar
