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

import { ClassNameStepDetail } from '@components/feature/Workflow/WorkflowDrawer/ClassNameStepDetail';
import WorkflowDrawerHeader from '@components/feature/Workflow/WorkflowDrawer/WorkflowDrawerHeader';
import WorkflowStepDetail from '@components/feature/Workflow/WorkflowDrawer/WorkflowStepDetail';
import { Drawer, DrawerContent } from '@components/shared/Drawer';

import { useWorkflowDrawerStore } from '@stores/workflowDrawerStore';

const WorkflowDrawer = () => {
  const { drawerOpen, selectedWorkflowStep, setDrawerOpen } =
    useWorkflowDrawerStore();

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
      <DrawerContent
        aria-describedby={undefined}
        className="flex flex-col w-1/4 py-6 pl-8 pr-10 gap-y-4 border-0"
      >
        <WorkflowDrawerHeader />
        {selectedWorkflowStep &&
          Object.entries(selectedWorkflowStep).map(([key, value]) => {
            if (key === 'class_args')
              return (
                <ClassNameStepDetail
                  label={key}
                  key={key}
                  value={value as Record<string, unknown>}
                />
              );
            return <WorkflowStepDetail key={key} label={key} value={value} />;
          })}
      </DrawerContent>
    </Drawer>
  );
};

export default WorkflowDrawer;
