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
import { DataSource, DataSourceType } from '@shared/types/dataSource';
import { atom } from 'jotai';

export const dataSourcesAtom = atom<DataSource[]>([]);

export const dataSourcesLoadingAtom = atom<boolean>(false);

export const dataSourcesErrorAtom = atom<string | null>(null);


export const dataSourcesWithFetchAtom = atom(
  (get) => get(dataSourcesAtom),
  async (_get, set, username) => {
    set(dataSourcesLoadingAtom, true);
    set(dataSourcesErrorAtom, null);
    try {
      const dataSources = await Client.getDataSources(username as string);
      const sortedDataSources = dataSources.data.sort((a: DataSource, b: DataSource) => {
        const dateA = new Date(a.created as string);
        const dateB = new Date(b.created as string);
        return dateA.getTime() - dateB.getTime();
      });
      set(dataSourcesAtom, sortedDataSources);
    } catch (error) {
      set(dataSourcesErrorAtom, 'Failed to fetch dataSources');
    } finally {
      set(dataSourcesLoadingAtom, false);
    }
  }
);

export const selectedDataSourceAtom = atom<DataSource>({ name: '', description: '', labels: {}, owner_id: '', data_source_type: DataSourceType.OTHER, project_id: '' });
