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

interface WorkflowStepDetailProps {
  label: string;
  value: string | boolean | string[] | Record<string, unknown>;
}

const WorkflowStepDetail = ({ label, value }: WorkflowStepDetailProps) => (
  <div className="flex flex-col">
    <span className="capitalize text-[#667385] font-inter text-[14px] font-semibold leading-normal">
      {label}
    </span>
    <span className="text-[#404D60] font-inter text-[14px] font-normal leading-normal">
      {JSON.stringify(value).replace(/^"|"$/g, '')}
    </span>
  </div>
);

export default WorkflowStepDetail;
