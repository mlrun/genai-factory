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

import { Button } from '@components/shared/Button';
import { Separator } from '@components/shared/Separator';

import { WORKFLOW_MAIN_ACTIONS, WORKFLOW_SECONDARY_ACTIONS } from '@constants';

const WorkflowActions = () => (
  <div className="flex h-full gap-x-3">
    <div className="flex gap-x-3">
      {WORKFLOW_MAIN_ACTIONS.map(({ icon: Icon, label, variant }, index) => (
        <Button
          key={`${label}-${index}`}
          variant={variant}
          className="flex items-center text-sm py-2 px-4 gap-x-1.5 rounded-[6px]"
        >
          <Icon className="mt-0.5" />
          {label}
        </Button>
      ))}
    </div>
    <div className="py-2 px-1.5">
      <Separator orientation="vertical" />
    </div>
    <div className="flex gap-x-3">
      {WORKFLOW_SECONDARY_ACTIONS.map((action, index) => (
        <Button
          key={`${action.label}-${index}`}
          variant={action.variant}
          className="flex items-center text-sm py-2 px-4 gap-x-1.5 rounded-[6px]"
        >
          {action.label}
        </Button>
      ))}
    </div>
  </div>
);

export default WorkflowActions;
