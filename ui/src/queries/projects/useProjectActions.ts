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
import { Project } from '@shared/types/project';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { validateApiResponse } from '@utils/validateApiResponse';

export const useProjectActions = () => {
  const queryClient = useQueryClient();

  const invalidateProjects = () =>
    queryClient.invalidateQueries({ queryKey: ['projects'] });

  const createProject = useMutation({
    mutationFn: (project: Project) =>
      validateApiResponse<Project>(
        Client.createProject(project),
        `create (${project.name})`,
      ),
    onSuccess: invalidateProjects,
  });

  const updateProject = useMutation({
    mutationFn: (project: Project) =>
      validateApiResponse<Project>(
        Client.updateProject(project),
        `update (${project.name})`,
      ),
    onSuccess: invalidateProjects,
  });

  const deleteProject = useMutation({
    mutationFn: (projectId: string) =>
      validateApiResponse<Project>(
        Client.deleteProject(projectId),
        `delete (ID: ${projectId})`,
      ),
    onSuccess: invalidateProjects,
  });

  return { createProject, updateProject, deleteProject };
};
