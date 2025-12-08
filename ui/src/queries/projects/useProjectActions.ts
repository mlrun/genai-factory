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
    mutationFn: (project: Partial<Project>) =>
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
