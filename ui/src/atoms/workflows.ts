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
import { Workflow, WorkflowType } from '@shared/types/workflow';
import { atom } from 'jotai';

export const workflowsAtom = atom<Workflow[]>([]);

export const workflowsLoadingAtom = atom<boolean>(false);

export const workflowsErrorAtom = atom<string | null>(null);


export const workflowsWithFetchAtom = atom(
  (get) => get(workflowsAtom),
  async (_get, set, username) => {
    set(workflowsLoadingAtom, true);
    set(workflowsErrorAtom, null);
    try {
      const workflows = await Client.getWorkflows(username as string);
      const sortedWorkflows = workflows.data.sort((a: Workflow, b: Workflow) => {
        const dateA = new Date(a.created as string);
        const dateB = new Date(b.created as string);
        return dateA.getTime() - dateB.getTime();
      });
      set(workflowsAtom, sortedWorkflows);
    } catch (error) {
      set(workflowsErrorAtom, 'Failed to fetch workflows');
    } finally {
      set(workflowsLoadingAtom, false);
    }
  }
);

export const selectedWorkflowAtom = atom<Workflow>({ name: '', description: '', labels: {}, owner_id: '', project_id: '', workflow_type: WorkflowType.APPLICATION, deployment: '' });
