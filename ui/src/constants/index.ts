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

import CardIcon from '@assets/icons/cards-icon.svg?react';
import ListIcon from '@assets/icons/list-icon.svg?react';

export * from './datasetFields';
export * from './dataSourceFields';
export * from './documentFields';
export * from './modelFields';
export * from './promptTemplateFields';
export * from './userFields';
export * from './workflowFields';
export * from './projectFields';

export const NEW_BUTTON_TEXT_PREFIX = 'New';

export const PROJECT_TABLE_TITLE = 'projects';
export const PROJECT_ENTITY_NAME = 'project';

export const PROJECTS_BASE_PATH = '/projects';
export const PATHNAME_SCREEN_INDEX = 3;

export const QUERY_DEFAULTS = {
  staleTime: 5 * 60 * 1000,
  retry: 1,
  refetchOnWindowFocus: false,
} as const;

export const TOGGLE_OPTIONS = [
  { value: 'card' as const, Icon: CardIcon },
  { value: 'list' as const, Icon: ListIcon },
];

export const TABLE_LABELS = {
  UPDATE: 'Update',
  DELETE: 'Delete',
  NO_ROWS: 'No rows available',
};

export const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
