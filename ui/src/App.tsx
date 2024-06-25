import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { ChatHistoriesTablePage } from 'pages/ChatHistoriesPage'
import { ChatPage } from 'pages/ChatPage'
import { LoginPage } from 'pages/LoginPage'
import { UsersTablePage } from 'pages/UsersTablePage'

function App() {
  const queryClient = new QueryClient()

  const router = createBrowserRouter([
    {
      path: '/',
      element: <LoginPage />
    },
    {
      path: '/admin/users',
      element: <UsersTablePage />
    },
    {
      path: '/admin/chat-histories',
      element: <ChatHistoriesTablePage />
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
