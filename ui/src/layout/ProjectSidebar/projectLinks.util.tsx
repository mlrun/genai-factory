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

import Artifacts from '@assets/icons/sidebar/artifacts.svg?react';
import Dashboard from '@assets/icons/sidebar/dashboard.svg?react';
import DataSets from '@assets/icons/sidebar/data-sets.svg?react';
import DatabaseOutline from '@assets/icons/sidebar/database-outline.svg?react';
import Group from '@assets/icons/sidebar/group.svg?react';
import JobsWorkflows from '@assets/icons/sidebar/jobs-workflows.svg?react';
import MLFunctions from '@assets/icons/sidebar/ML-functions.svg?react';
import Model from '@assets/icons/sidebar/model.svg?react';

export const getProjectLinks = (projectName: string) => {
  const pathname = `/projects/${projectName}`;

  return [
    {
      icon: Dashboard,
      id: 'Dashboard',
      label: 'Project overview',
      link: `${pathname}`,
    },
    {
      icon: JobsWorkflows,
      id: 'Workflows',
      label: 'Workflows & Agents',
      link: `${pathname}/workflows`,
      hidden: true,
    },
    {
      icon: MLFunctions,
      id: 'PromptTemplates',
      label: 'Prompt Templates',
      link: `${pathname}/prompt-templates`,
    },
    {
      icon: Model,
      id: 'Models',
      label: 'Models',
      link: `${pathname}/models`,
    },
    {
      icon: DataSets,
      id: 'Datasets',
      label: 'Datasets',
      link: `${pathname}/datasets`,
    },
    {
      icon: DatabaseOutline,
      id: 'DataSources',
      label: 'Data Sources',
      link: `${pathname}/data-sources`,
    },
    {
      icon: Artifacts,
      id: 'Documents',
      label: 'Documents',
      link: `${pathname}/documents`,
    },
    {
      icon: Group,
      id: 'Users',
      label: 'Users',
      link: `${pathname}/users`,
    },
  ];
};
