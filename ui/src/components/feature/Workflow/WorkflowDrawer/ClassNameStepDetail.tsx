import React, { useState } from 'react';
import { Check, Edit2, Link as LinkIcon, X } from 'lucide-react';

import { useWorkflowActions } from '@queries';
import { WorkflowStep } from '@shared/types/workflow';

import { useWorkflowDrawerStore } from '@stores/workflowDrawerStore';

interface WorkflowStepDetailProps {
  label: string;
  value: Record<string, unknown>;
}

const formatValue = (val: unknown) => {
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
    const arrayStr = val.join(', ');
    return (
      <span
        className="block truncate text-ellipsis overflow-hidden"
        title={arrayStr}
      >
        {arrayStr}
      </span>
    );
  }

  if (typeof val === 'object' && val !== null) {
    return (
      <pre className="text-[11px] font-mono text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 w-full overflow-x-auto">
        {JSON.stringify(val, null, 2)}
      </pre>
    );
  }

  const stringVal = String(val);
  return (
    <span
      className="block truncate text-ellipsis overflow-hidden"
      title={stringVal}
    >
      {stringVal}
    </span>
  );
};

export const ClassNameStepDetail = ({ value }: WorkflowStepDetailProps) => {
  const { updateClassArgs } = useWorkflowActions();
  const { selectedWorkflowStep } = useWorkflowDrawerStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(
    (value.base_url as string) || ''
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    const updatedWorkflow: WorkflowStep & { id: string } = {
      class_name: '',
      kind: '',
      id: selectedWorkflowStep!.id,
      ...selectedWorkflowStep,
      class_args: { ...value, base_url: tempValue },
    };

    updateClassArgs.mutate(updatedWorkflow);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue((value.base_url as string) || '');
    setIsEditing(false);
  };

  return (
    <div className="w-full bg-white antialiased">
      {Object.entries(value).map(([key, val]) => {
        const isBaseUrl = key === 'base_url';
        const displayValue = isBaseUrl ? tempValue : val;

        return (
          <div
            key={key}
            className="flex items-center py-1 border-b border-gray-100 group"
          >
            {/* Label */}
            <span className="flex items-center gap-x-1 w-1/3 min-w-[120px] text-gray-500 text-[13px] font-medium tracking-tight capitalize">
              {key.replace(/_/g, ' ')}
              {isBaseUrl && <LinkIcon size={14} />}
            </span>

            {/* Value / Input Area */}
            <div className="w-2/3 flex items-center justify-between gap-4 min-w-0">
              {isBaseUrl && isEditing ? (
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center grow gap-2"
                >
                  <input
                    autoFocus
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="grow bg-gray-50 border border-gray-200 text-sm font-mono px-2 py-1 rounded focus:outline-none focus:border-[#2a2d30] text-[#2a2d30]"
                  />
                  <button
                    type="submit"
                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <X size={18} />
                  </button>
                </form>
              ) : isBaseUrl ? (
                <>
                  <span
                    className="text-sm font-mono text-[#2a2d30] truncate text-ellipsis overflow-hidden grow cursor-default min-w-0"
                    title={tempValue}
                  >
                    {tempValue}
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-[#2a2d30] hover:bg-gray-50 rounded transition-all flex-shrink-0"
                  >
                    <Edit2 size={14} />
                  </button>
                </>
              ) : (
                <div className="text-[#2a2d30] text-sm font-medium min-w-0 overflow-hidden">
                  {formatValue(displayValue)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
