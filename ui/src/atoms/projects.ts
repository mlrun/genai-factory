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
import { atom } from 'jotai';

export const projectsAtom = atom<Project[]>([]);
export const projectsLoadingAtom = atom<boolean>(false);
export const projectsErrorAtom = atom<string | null>(null);


export const projectsWithFetchAtom = atom(
  (get) => get(projectsAtom),
  async (_get, set) => {
    set(projectsLoadingAtom, true);
    set(projectsErrorAtom, null);
    try {
      const projects = await Client.getProjects();
      set(projectsAtom, projects.data);
    } catch (error) {
      set(projectsErrorAtom, 'Failed to fetch projects');
    } finally {
      set(projectsLoadingAtom, false);
    }
  }
);

