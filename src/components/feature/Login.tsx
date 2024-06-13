import Logo from '@assets/mlrun.png'
import { Box, Button, Flex, FormControl, FormLabel, Image, Input, Switch, useColorMode } from '@chakra-ui/react'
import { colors } from '@shared/theme'
import { adminAtom, usernameAtom } from 'atoms'
import { useAtom } from 'jotai'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const navigate = useNavigate()
  const { colorMode } = useColorMode()

  const [username, setUsername] = useAtom(usernameAtom)
  const [admin, setAdmin] = useAtom(adminAtom)
  const [password, setPassword] = useState('XxYaz12345')
  const [isLoading, setIsLoading] = useState(false)

  function submitFunc(event: React.MouseEvent<HTMLButtonElement>) {
    setTimeout(() => {
      setIsLoading(true)
    }, 1500)
    setIsLoading(false)
    event.preventDefault()

    if (admin) {
      navigate('/admin')
    } else {
      navigate('/chat')
    }
  }

  return (
    <Flex
      height={'100vh'}
      flexDirection={'column'}
      alignItems={'center'}
      justifyContent={'center'}
      bgGradient={'linear(to-b, #4b6cb7 0%, #182848 100%)'}
    >
      <Flex minWidth={'288px'}>
        <FormControl
          height={'420px'}
          bg={colorMode === 'dark' ? colors.gray900 : colors.gray100}
          border={`1px solid ${colorMode === 'dark' ? colors.gray600 : colors.gray700}`}
          display={'flex'}
          justifyContent={'space-around'}
          flexDirection={'column'}
          borderRadius={'10px'}
          gap={4}
          padding={4}
        >
          <Flex justifyContent={'center'}>
            <Image width={'180px'} filter={colorMode === 'dark' ? '' : 'invert(100%)'} src={Logo} />
          </Flex>
          <Box>
            <FormLabel>Username</FormLabel>
            <Input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </Box>
          <Box>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </Box>
          <Flex alignItems={'center'}>
            <FormLabel htmlFor="admin-mode" mb="0">
              Admin mode
            </FormLabel>
            <Switch defaultChecked={admin} onChange={() => setAdmin(!admin)} id="admin-mode" />
          </Flex>
          <Button isLoading={isLoading} onClick={submitFunc}>
            Login
          </Button>
        </FormControl>
      </Flex>
    </Flex>
  )
}

export default Login
