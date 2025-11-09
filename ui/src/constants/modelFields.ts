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

import { ModalField } from '@shared/types/modalFieldConfigs';
import { ModelType } from '@shared/types/model';

export const modelFields: ModalField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'description', label: 'Description', required: true },
  { name: 'version', label: 'Version' },
  { name: 'base_model', label: 'Base Model', required: true },
  {
    name: 'model_type',
    label: 'Model Type',
    required: true,
    options: [
      { label: 'Model', value: ModelType.MODEL },
      { label: 'Adapter', value: ModelType.ADAPTER },
    ],
  },
  { name: 'task', label: 'Task' },
  { name: 'path', label: 'Path' },
  { name: 'deployment', label: 'Deployment', required: true },
];
