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
import { PromptTemplate } from '@shared/types/promptTemplate';
import { atom } from 'jotai';

export const promptTemplatesAtom = atom<PromptTemplate[]>([]);

export const promptTemplatesLoadingAtom = atom<boolean>(false);

export const promptTemplatesErrorAtom = atom<string | null>(null);


export const promptTemplatesWithFetchAtom = atom(
  (get) => get(promptTemplatesAtom),
  async (_get, set, username) => {
    set(promptTemplatesLoadingAtom, true);
    set(promptTemplatesErrorAtom, null);
    try {
      const promptTemplates = await Client.getPromptTemplates(username as string);
      const sortedPromptTemplates = promptTemplates.data.sort((a: PromptTemplate, b: PromptTemplate) => {
        const dateA = new Date(a.created as string);
        const dateB = new Date(b.created as string);
        return dateA.getTime() - dateB.getTime();
      });
      set(promptTemplatesAtom, sortedPromptTemplates);
    } catch (error) {
      set(promptTemplatesErrorAtom, 'Failed to fetch promptTemplates');
    } finally {
      set(promptTemplatesLoadingAtom, false);
    }
  }
);

export const selectedPromptTemplateAtom = atom<PromptTemplate>({ name: '', description: '', labels: {}, owner_id: '', project_id: '', text: '', arguments: [] });
