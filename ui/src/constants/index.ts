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

export * from './datasetFields';
export * from './dataSourceFields';
export * from './documentFields';
export * from './modelFields';
export * from './promptTemplateFields';
export * from './userFields';
export * from './workflowFields';

export const QUERY_DEFAULTS = {
  staleTime: 5 * 60 * 1000,
  retry: 1,
  refetchOnWindowFocus: false,
} as const;

export const FILTER_PLACEHOLDER_PREFIX = 'Find';

export const NEW_BUTTON_TEXT_PREFIX = 'New';
