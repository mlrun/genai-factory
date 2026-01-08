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
import WorkflowGraph from '@components/feature/Workflow/WorkflowGraph';
import { WorkflowDetails } from '@components/feature/Workflow/WorkflowOverview';
import { useWorkflow } from '@queries';

const WorkflowView = () => {
  const { data: workflow } = useWorkflow();

  return (
    <div className="flex flex-col h-full">
      {/* 1. Technical Specification (Overview) */}
      <div className="w-full px-14">
        <WorkflowDetails />
      </div>

      {/* 2. Visual Logic (Graph) */}
      <div className="w-full px-14 pb-20 mt-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 pt-4">
            <h2 className="text-xl font-bold text-[#2a2d30]">Workflow Graph</h2>
            <div className="h-px grow bg-gray-100" />
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
              {Object.keys(workflow?.graph?.steps || {}).length} Steps
            </span>
          </div>

          {/* Graph Container */}
          <div className="relative w-full h-[350px] overflow-hidden shadow-inner">
            {/* Minimalist Grid Pattern for the graph background */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#2a2d30 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            <WorkflowGraph />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowView;
