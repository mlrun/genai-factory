import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { LoginPage } from 'pages/LoginPage'
import { AdminPage } from 'pages/AdminPage'
import { ChatPage } from 'pages/ChatPage'
import { ChakraProvider } from '@chakra-ui/react'

function App() {
  const queryClient = new QueryClient()

  const router = createBrowserRouter([
    {
      path: '/',
      element: <LoginPage />
    },
    {
      path: '/admin',
      element: <AdminPage />
    },
    {
      path: '/chat',
      element: <ChatPage />
    }
  ])

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <ChakraProvider>
          <RouterProvider router={router} />
        </ChakraProvider>
      </JotaiProvider>
    </QueryClientProvider>
  )
}

export default App
