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

import Client from '@services/Api';
import { APIResponse } from '@shared/types';
import { Project } from '@shared/types/project';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useProjectActions = () => {
  const queryClient = useQueryClient();

  const invalidateProjects = async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const validateApiResponse = async (
    apiCall: Promise<APIResponse>,
    action: string,
  ) => {
    const response = await apiCall;
    if (!response.success) {
      const message = response.error || `API request failed during ${action}`;
      console.error(`[Project ${action} Error]:`, message);
      throw new Error(message);
    }
    return response.data;
  };

  const createProject = useMutation({
    mutationFn: (project: Project) =>
      validateApiResponse(
        Client.createProject(project),
        `create (${project.name})`,
      ),
    onSuccess: invalidateProjects,
  });

  const updateProject = useMutation({
    mutationFn: (project: Project) =>
      validateApiResponse(
        Client.updateProject(project),
        `update (${project.name})`,
      ),
    onSuccess: invalidateProjects,
  });

  const deleteProject = useMutation({
    mutationFn: (projectId: string) =>
      validateApiResponse(
        Client.deleteProject(projectId),
        `delete (ID: ${projectId})`,
      ),
    onSuccess: invalidateProjects,
  });

  return { createProject, updateProject, deleteProject };
};
