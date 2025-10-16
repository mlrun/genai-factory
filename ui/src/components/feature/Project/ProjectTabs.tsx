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

import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import DatasetsTable from '@components/feature/Tables/DatasetsTable';
import DataSourcesTable from '@components/feature/Tables/DataSourcesTable';
import DocumentsTable from '@components/feature/Tables/DocumentsTable';
import ModelsTable from '@components/feature/Tables/ModelsTable';
import PromptTemplatesTable from '@components/feature/Tables/PromptTemplatesTable';
import WorkflowsTable from '@components/feature/Tables/WorkflowsTable';

const projectTabs = [
  { label: 'Models', component: <ModelsTable /> },
  { label: 'Data Sources', component: <DataSourcesTable /> },
  { label: 'Datasets', component: <DatasetsTable /> },
  { label: 'Documents', component: <DocumentsTable /> },
  { label: 'Prompt Templates', component: <PromptTemplatesTable /> },
  { label: 'Workflows', component: <WorkflowsTable /> },
];

const ProjectTabs = () => {
  return (
    <Tabs variant="enclosed">
      <TabList>
        {projectTabs.map(({ label }) => (
          <Tab key={label}>{label}</Tab>
        ))}
      </TabList>
      <TabPanels>
        {projectTabs.map(({ component, label }) => (
          <TabPanel key={label} px={0}>
            {component}
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};

export default ProjectTabs;
