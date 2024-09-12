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
import { Dataset } from '@shared/types/dataset';
import { atom } from 'jotai';

export const datasetsAtom = atom<Dataset[]>([]);

export const datasetsLoadingAtom = atom<boolean>(false);

export const datasetsErrorAtom = atom<string | null>(null);


export const datasetsWithFetchAtom = atom(
  (get) => get(datasetsAtom),
  async (_get, set, username) => {
    set(datasetsLoadingAtom, true);
    set(datasetsErrorAtom, null);
    try {
      const datasets = await Client.getDatasets(username as string);
      const sortedDatasets = datasets.data.sort((a: Dataset, b: Dataset) => {
        const dateA = new Date(a.created as string);
        const dateB = new Date(b.created as string);
        return dateA.getTime() - dateB.getTime();
      });
      set(datasetsAtom, sortedDatasets);
    } catch (error) {
      set(datasetsErrorAtom, 'Failed to fetch datasets');
    } finally {
      set(datasetsLoadingAtom, false);
    }
  }
);

export const selectedDatasetAtom = atom<Dataset>({ name: '', description: '', labels: {}, owner_id: '', project_id: '', path: '', task: '' });
