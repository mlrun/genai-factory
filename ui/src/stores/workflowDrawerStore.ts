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

import { create } from 'zustand';

import { WorkflowStep } from '@shared/types/workflow';

interface WorkflowDrawerStore {
  drawerOpen: boolean;
  selectedWorkflowStep?: WorkflowStep & { id: string };
  setDrawerOpen: (open: boolean) => void;
  setSelectedWorkflowStep: (step?: WorkflowStep & { id: string }) => void;
  handleNodeClick: (
    nodeId: string,
    workflow?: { graph?: { steps?: Record<string, WorkflowStep> } } | null,
  ) => void;
}

export const useWorkflowDrawerStore = create<WorkflowDrawerStore>((set) => ({
  drawerOpen: false,
  selectedWorkflowStep: undefined,
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  setSelectedWorkflowStep: (selectedWorkflowStep) =>
    set({ selectedWorkflowStep }),

  handleNodeClick: (nodeId, workflow) => {
    if (workflow?.graph?.steps?.[nodeId]) {
      set({
        selectedWorkflowStep: { id: nodeId, ...workflow.graph.steps[nodeId] },
        drawerOpen: true,
      });
    }
  },
}));
