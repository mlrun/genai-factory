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

import { GitBranch } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import WorkflowActions from '@components/feature/Workflow/WorkflowActions';
import { useWorkflow } from '@queries';

import Back from '@assets/icons/back.svg?react';

const WorkflowHeader = () => {
  const { data: workflow } = useWorkflow();
  const { projectName } = useParams();

  return (
    <header className="flex justify-between items-center bg-white gap-6 pt-6 pr-8 pb-4 pl-8 self-stretch">
      {/* Header Section */}
      <Link
        to={`/projects/${projectName}/workflows`}
        className="flex items-center gap-2 font-medium text-sidebar-foreground hover:underline"
      >
        <Back />
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-xl bg-[#2a2d30] flex items-center justify-center shadow-lg shadow-gray-200">
            <GitBranch size={32} className="text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-[#2a2d30]">
                {workflow?.name}
              </h1>
              {workflow?.version && (
                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-500 mt-1">
                  v{workflow?.version}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <WorkflowActions />
    </header>
  );
};

export default WorkflowHeader;
