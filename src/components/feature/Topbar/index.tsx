import Logo from '@assets/mlrun.png'
import { HamburgerIcon, MoonIcon, SettingsIcon, SunIcon } from '@chakra-ui/icons'
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Switch,
  Text,
  useColorMode,
  useDisclosure
} from '@chakra-ui/react'
import { colors } from '@shared/theme'
import './Topbar.css'

type Props = {
  user: string
  onLoginChange: (value: boolean) => void
}
const Topbar = ({ user, onLoginChange }: Props) => {
  const { colorMode, toggleColorMode } = useColorMode()
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Flex
      alignItems={'center'}
      justifyContent={'space-between'}
      h={20}
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
        <div className={colorMode === 'dark' ? 'logo-dark' : 'logo'}>
          <Image src={Logo} w={40} />
        </div>
      </Flex>
      <Flex paddingRight={4}>
        <IconButton onClick={onOpen} aria-label="Settings" icon={<SettingsIcon />} />
        <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Preferences</DrawerHeader>

            <DrawerBody>
              <FormControl display="flex" alignItems="center" justifyContent={'flex-start'}>
                <Flex gap={4} width={'100%'} flexDirection={'column'}>
                  <Flex alignItems={'center'} gap={2}>
                    <SunIcon />
                    <Switch defaultChecked={colorMode === 'dark'} onChange={toggleColorMode} />
                    <MoonIcon />
                  </Flex>
                  <Menu>
                    <MenuItem onClick={() => onLoginChange(false)}>Logout</MenuItem>
                  </Menu>
                </Flex>
              </FormControl>
              {/* <div className="title">Properties</div>
              <div className="">
                <Paragraph
                  header="Paragraph component"
                  content="Bibendum vehicula aenean parturient blandit aliquam. Amet ipsum turpis integer gravida pulvinar aenean dictumst faucibus."
                />
                <Input
                  onChange={e => console.log(e)}
                  type="text"
                  content="Please type name"
                  placeholder="Placeholder only"
                />
                <Dropdown
                  onChange={e => console.log(e)}
                  header="Dropdown component"
                  content="Please select company"
                  option={['Apple', 'Samsung', 'OnePlus', 'Google', 'Xiaomi']}
                />
                <Dropdown
                  onChange={e => console.log(e)}
                  header="Another dropdown"
                  content="What's the best beverage?"
                  option={['Water', 'Coke', 'Orange Juice', 'Cider', 'Coffee', 'Tea', 'Chai']}
                />
                <Textarea content="Please type description" placeholder="Placeholder only" />
                <Slider content="Values are between 1 and 18" min={1} max={18} />
                <Slider content="Values are between 1 and 99" min={1} max={99} />
              </div> */}
            </DrawerBody>

            <DrawerFooter>
              <Text fontSize={'xs'}>All rights reserved</Text>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Flex>
    </Flex>
  )
}

export default Topbar
