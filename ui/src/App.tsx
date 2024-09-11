// Copyright 2024 Iguazio
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { ChatHistoriesTablePage } from 'pages/ChatHistoriesPage'
import { ChatPage } from 'pages/ChatPage'
import { DataSourceTablePage } from 'pages/DataSourcesTablePage'
import { DatasetsTablePage } from 'pages/DatasetsTablePage'
import { DocumentsTablePage } from 'pages/DocumentsTablePage'
import { LoginPage } from 'pages/LoginPage'
import { ModelsTablePage } from 'pages/ModelsTablePage'
import { ProjectsTablePage } from 'pages/ProjectsTablePage'
import { UsersTablePage } from 'pages/UsersTablePage'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

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
    { path: '/admin/projects', element: <ProjectsTablePage /> },
    { path: '/admin/data-sources', element: <DataSourceTablePage /> },
    { path: '/admin/datasets', element: <DatasetsTablePage /> },
    { path: '/admin/models', element: <ModelsTablePage /> },
    { path: '/admin/documents', element: <DocumentsTablePage /> },
    {
      path: '/admin/histories',
      element: <ChatHistoriesTablePage />
    },

    {
      path: '/admin/datasets',
      element: <UsersTablePage />
    },
    {
      path: '/admin/documents',
      element: <ChatHistoriesTablePage />
    },

    {
      path: '/admin/pipelines',
      element: <UsersTablePage />
    },

    {
      path: '/chat',
      element: <ChatPage />
    },
    {
      path: '/chat/:sessionId',
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
