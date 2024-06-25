import Logo from '@assets/mlrun.png'
import { usernameAtom } from '@atoms/index'
import { HamburgerIcon } from '@chakra-ui/icons'
import {
  Avatar,
  Box,
  Flex,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useColorMode,
  useDisclosure
} from '@chakra-ui/react'
import { colors } from '@shared/theme'
import { useAtom } from 'jotai'
import Rightbar from './Rightbar'

type Props = {
  user: string
  onLoginChange: (value: boolean) => void
}
const Topbar = ({ user, onLoginChange }: Props) => {
  const { colorMode } = useColorMode()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [username, setUsername] = useAtom(usernameAtom)

  return (
    <Flex
      alignItems={'center'}
      justifyContent={'space-between'}
      h={16}
      bg={colorMode == 'dark' ? colors.topbarDark : colors.topbarLight}
    >
      <Flex alignItems={'center'}>
        <Box paddingLeft={4} display={{ sm: 'flex', md: 'none' }}>
          <Menu>
            <MenuButton as={IconButton} icon={<HamburgerIcon />} />
            <MenuList>
              <MenuItem>Users</MenuItem>
              <MenuItem>Chat Histories</MenuItem>
              <MenuItem>Data Sets</MenuItem>
              <MenuItem>Documents</MenuItem>
              <MenuItem>Pipelines</MenuItem>
            </MenuList>
          </Menu>
        </Box>
        <Image paddingLeft={4} filter={colorMode === 'light' ? 'invert(100%)' : ''} src={Logo} w={40} />
      </Flex>
      <Flex alignItems={'center'} paddingRight={4}>
        <Avatar _hover={{ cursor: 'pointer' }} onClick={onOpen} size="sm" name={username} src="" />
        <Rightbar isOpen={isOpen} onClose={onClose} onLoginChange={onLoginChange} />
      </Flex>
    </Flex>
  )
}

export default Topbar
