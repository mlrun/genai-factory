// src/components/LoginForm.tsx
import Logo from '@assets/mlrun.png'
import { adminAtom, userAtom, usernameAtom } from '@atoms/index'
import { Box, Button, Flex, FormControl, FormLabel, Image, Input, Switch, useColorMode } from '@chakra-ui/react'
import useAuth from '@hooks/useAuth'
import { colors } from '@shared/theme'
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const navigate = useNavigate()
  const { colorMode } = useColorMode()
  const [username, setUsername] = useAtom(usernameAtom)
  const [admin, setAdmin] = useAtom(adminAtom)
  const [password, setPassword] = useState('XxYaz12345')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const [user, setUser] = useAtom(userAtom)

  useEffect(() => {
    if (user) {
      navigate('/chat')
    }
  }, [navigate])

  const submitFunc = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      login(username, password, admin)
      if (admin) {
        navigate('/admin/users')
      } else {
        navigate('/chat')
      }
    }, 1000)
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
            <Switch defaultChecked={!!admin} onChange={() => setAdmin(!admin)} id="admin-mode" />
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
