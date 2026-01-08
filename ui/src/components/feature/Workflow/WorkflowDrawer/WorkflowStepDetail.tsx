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

import React from 'react';

interface WorkflowStepDetailProps {
  label: string;
  value: string | boolean | string[] | Record<string, unknown>;
}

const WorkflowStepDetail = ({ label, value }: WorkflowStepDetailProps) => {
  // Cleaner value formatting
  const formatValue = (val: any) => {
    if (typeof val === 'boolean') {
      return (
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
            val ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {String(val)}
        </span>
      );
    }

    if (Array.isArray(val)) {
      return val.join(', ');
    }

    if (typeof val === 'object' && val !== null) {
      return (
        <pre className="text-[11px] font-mono text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 w-full overflow-x-auto">
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    }

    return (
      <span className="truncate block" title={String(val)}>
        {String(val)}
      </span>
    );
  };

  return (
    <div className="flex items-start py-1 border-b border-gray-100 overflow-hidden last:border-none">
      {/* Label - Fixed width matching the rest of your UI */}
      <span className="w-1/3 min-w-[120px] text-gray-500 text-[13px] font-medium tracking-tight capitalize">
        {label.replace(/_/g, ' ')}
      </span>

      {/* Value - Static text, no edit actions */}
      <div className="w-2/3 text-[#2a2d30] text-sm font-medium">
        {formatValue(value)}
      </div>
    </div>
  );
};

export default WorkflowStepDetail;
