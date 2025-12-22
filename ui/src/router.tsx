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

import { createBrowserRouter, Navigate } from 'react-router-dom';

import Page from '@layout/Page';
import ProjectLayout from '@layout/ProjectLayout';
import ChatPage from '@pages/ChatPage';
import DatasetsPage from '@pages/DatasetsPage';
import DataSourcesPage from '@pages/DataSourcesPage';
import DocumentsPage from '@pages/DocumentsPage';
import LoginPage from '@pages/LoginPage';
import ModelsPage from '@pages/ModelsPage';
import ProjectPage from '@pages/ProjectPage';
import ProjectsPage from '@pages/ProjectsPage';
import PromptTemplatesPage from '@pages/PromptTemplatesPage';
import UsersPage from '@pages/UsersPage';
import WorkflowPage from '@pages/WorkflowPage';
import WorkflowsPage from '@pages/WorkflowsPage';

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
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:name', element: <ProjectPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'chat/:sessionName', element: <ChatPage /> },
      {
        path: 'projects/:name',
        element: <ProjectLayout />,
        children: [
          { index: true, element: <ProjectPage /> },
          { path: 'models', element: <ModelsPage /> },
          { path: 'data-sources', element: <DataSourcesPage /> },
          { path: 'datasets', element: <DatasetsPage /> },
          { path: 'documents', element: <DocumentsPage /> },
          { path: 'prompt-templates', element: <PromptTemplatesPage /> },
          { path: 'workflows', element: <WorkflowsPage /> },
          { path: 'users', element: <UsersPage /> },
        ],
      },
      {
        path: '/projects/:name/workflows/:workflowName',
        element: <WorkflowPage />,
      },
    ],
  },
]);
