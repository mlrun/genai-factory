/*
Copyright 2024 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/

import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import Page from '@layout/Page';

const TableLayout = lazy(() => import('@layout/Table'));

import ProjectsPage from '@pages/ProjectsPage';

const LoginPage = lazy(() => import('@pages/LoginPage'));
const ChatPage = lazy(() => import('@pages/ChatPage'));
const ProjectPage = lazy(() => import('@pages/ProjectPage'));
const ModelsPage = lazy(() => import('@pages/ModelsPage'));
const DataSourcesPage = lazy(() => import('@pages/DataSourcesPage'));
const DatasetsPage = lazy(() => import('@pages/DatasetsPage'));
const DocumentsPage = lazy(() => import('@pages/DocumentsPage'));
const PromptTemplatesPage = lazy(() => import('@pages/PromptTemplatesPage'));
const UsersPage = lazy(() => import('@pages/UsersPage'));
const WorkflowsPage = lazy(() => import('@pages/WorkflowsPage'));
const WorkflowPage = lazy(() => import('@pages/WorkflowPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element:
      import.meta.env.VITE_ENV === 'development' ? (
        // TODO: Will be implemented GAIT-36
        <Navigate to="/projects" replace />
      ) : (
        <LoginPage />
      ),
  },
  {
    path: '/',
    element: <Page />,
    children: [
      {
        path: 'projects',
        children: [
          { index: true, element: <ProjectsPage /> },
          {
            path: ':projectName',
            children: [
              { index: true, element: <Navigate replace to="monitor" /> },
              {
                element: <TableLayout />,
                children: [
                  { path: 'monitor', element: <ProjectPage /> },
                  { path: 'models', element: <ModelsPage /> },
                  { path: 'data-sources', element: <DataSourcesPage /> },
                  { path: 'datasets', element: <DatasetsPage /> },
                  { path: 'documents', element: <DocumentsPage /> },
                  {
                    path: 'prompt-templates',
                    element: <PromptTemplatesPage />,
                  },
                  { path: 'users', element: <UsersPage /> },
                  {
                    path: 'workflows',
                    index: true,
                    element: <WorkflowsPage />,
                  },
                ],
              },
              {
                path: 'workflows',
                children: [
                  { path: ':workflowName', element: <WorkflowPage /> },
                ],
              },
            ],
          },
        ],
      },
      {
        path: 'chat',
        children: [
          { index: true, element: <ChatPage /> },
          { path: ':sessionName', element: <ChatPage /> },
        ],
      },
    ],
  },
]);
