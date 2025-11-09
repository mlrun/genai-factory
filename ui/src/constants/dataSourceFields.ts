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

import { DataSourceType } from '@shared/types/dataSource';
import { ModalField } from '@shared/types/modalFieldConfigs';

export const dataSourceFields: ModalField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'description', label: 'Description', required: true },
  { name: 'version', label: 'Version' },
  {
    name: 'data_source_type',
    label: 'Data Source Type',
    required: true,
    options: [
      { label: 'Relational', value: DataSourceType.RELATIONAL },
      { label: 'Vector', value: DataSourceType.VECTOR },
      { label: 'Graph', value: DataSourceType.GRAPH },
      { label: 'Key-Value', value: DataSourceType.KEY_VALUE },
      { label: 'Column Family', value: DataSourceType.COLUMN_FAMILY },
      { label: 'Storage', value: DataSourceType.STORAGE },
      { label: 'Other', value: DataSourceType.OTHER },
    ],
  },
];
