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

import { useParams } from 'react-router-dom';

import { useProject } from '@queries';
import Client from '@services/Api';
import { Workflow, WorkflowStep } from '@shared/types/workflow';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { validateApiResponse } from '@utils/validateApiResponse';

import { QUERY_DEFAULTS } from '@constants';

export function useWorkflow(enabled = true) {
  const { workflowName } = useParams();
  const { data: project } = useProject();

  return useQuery<Workflow | null>({
    queryKey: ['workflow', workflowName, project?.name],
    queryFn: async () => {
      if (!workflowName || !project) return null;

      return validateApiResponse(
        Client.getWorkflow(project.name, workflowName),
        `fetch workflow: ${workflowName}`,
      );
    },
    enabled: enabled && !!workflowName && !!project?.name,
    ...QUERY_DEFAULTS,
  });
}

export const useWorkflowActions = () => {
  const queryClient = useQueryClient();
  const { projectName } = useParams();
  const { data: currentWorkflow } = useWorkflow();

  const invalidateProjects = () =>
    queryClient.invalidateQueries({ queryKey: ['workflow'] });

  const updateClassArgs = useMutation({
    mutationFn: (workflowStep: WorkflowStep & { id: string }) => {
      if (!projectName) throw new Error('No project name provided');

      if (!currentWorkflow) throw new Error('No current workflow');

      console.log(workflowStep);
      // this shit runnied everything
      const updatedWorkflow: Workflow = {
        ...currentWorkflow,
        graph: {
          steps: {
            ...currentWorkflow.graph?.steps,
            [workflowStep.id]: workflowStep,
          },
        },
      };

      console.log(updatedWorkflow);

      return validateApiResponse<Workflow>(
        Client.updateWorkflow(projectName, updatedWorkflow),
        `update (${workflowStep.kind})`,
      );
    },
    onSuccess: invalidateProjects,
  });

  return { updateClassArgs };
};
