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

import { DrawerHeader } from '@components/shared/Drawer';
import { Separator } from '@components/shared/Separator';

import Book from '@assets/icons/book.svg?react';
import Close from '@assets/icons/close.svg?react';
import More from '@assets/icons/more.svg?react';
import Shield from '@assets/icons/shield.svg?react';
import { useWorkflowDrawerStore } from '@stores/workflowDrawerStore';

const WorkflowDrawerHeader = () => {
  const { selectedWorkflowStep, setDrawerOpen } = useWorkflowDrawerStore();

  return (
    <DrawerHeader className="flex items-center justify-between p-0">
      <div className="flex items-center gap-x-2 font-bold">
        <Shield />
        {selectedWorkflowStep?.id}
      </div>
      <div className="flex items-center gap-x-1">
        <button className="p-[3px]">
          <Book />
        </button>
        <button className="p-[3px] px-2">
          <More />
        </button>
        <Separator orientation="vertical" className="h-5 mx-1.5 my-1" />
        <button
          className="px-2 cursor-pointer"
          onClick={() => setDrawerOpen(false)}
        >
          <Close />
        </button>
      </div>
    </DrawerHeader>
  );
};

export default WorkflowDrawerHeader;
