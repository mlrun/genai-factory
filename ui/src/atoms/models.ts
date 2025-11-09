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

import { atom } from 'jotai';

import Client from '@services/Api';
import { Model, ModelType } from '@shared/types/model';

export const modelsAtom = atom<Model[]>([]);

export const modelsLoadingAtom = atom<boolean>(false);

export const modelsErrorAtom = atom<string | null>(null);

export const modelsWithFetchAtom = atom(
  (get) => get(modelsAtom),
  async (_get, set, projectName) => {
    set(modelsLoadingAtom, true);
    set(modelsErrorAtom, null);
    try {
      const models = await Client.getModels(projectName as string);
      const sortedModels = models.data.sort((a: Model, b: Model) => {
        const dateA = new Date(a.created as string);
        const dateB = new Date(b.created as string);
        return dateA.getTime() - dateB.getTime();
      });
      set(modelsAtom, sortedModels);
    } catch (error) {
      console.log(`Error: ${error}`);
      set(modelsErrorAtom, 'Failed to fetch models');
    } finally {
      set(modelsLoadingAtom, false);
    }
  },
);

export const selectedModelAtom = atom<Model>({
  name: '',
  description: '',
  labels: {},
  owner_id: '',
  project_id: '',
  model_type: ModelType.MODEL,
  base_model: '',
});
