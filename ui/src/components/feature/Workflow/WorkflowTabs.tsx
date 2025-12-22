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

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@components/shared/Tabs';

const WorkflowTabs = () => {
  return (
    <Tabs defaultValue="overview" className="flex flex-col grow justify-start">
      <TabsList className="px-10 gap-4 bg-white justify-normal py-0">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="graph">Graph view</TabsTrigger>
      </TabsList>

      <TabsContent
        value="overview"
        className="flex flex-col items-start p-8 px-14 gap-5 flex-1 self-stretch border border-workflow-content-border bg-workflow-content-bg"
      ></TabsContent>

      <TabsContent value="graph" className="flex flex-1 flex-col"></TabsContent>
    </Tabs>
  );
};

export default WorkflowTabs;
