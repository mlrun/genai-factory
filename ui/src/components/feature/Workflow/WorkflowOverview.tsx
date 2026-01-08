import React from 'react';
import {
  Box,
  Calendar,
  FileCode,
  GitBranch,
  Lock,
  Settings,
} from 'lucide-react';

import { Badge } from '@components/shared/badge';
import { useWorkflow } from '@queries';

export const WorkflowDetails = () => {
  const { data: workflow, isLoading } = useWorkflow();

  if (isLoading) {
    return (
      <div className="w-full px-6 py-10 animate-pulse grid grid-cols-2 gap-x-12 gap-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  if (!workflow) return null;

  return (
    <div className="w-full bg-white text-[#2a2d30] antialiased">
      <section className="mb-6">
        {/* Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 border-t border-gray-100">
          <DetailRow label="Owner">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#2a2d30] flex items-center justify-center text-[10px] text-white font-bold">
                {workflow.owner_id?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <span className="text-sm font-medium">{workflow.owner_id}</span>
            </div>
          </DetailRow>

          <DetailRow label="Type">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Box size={14} className="text-gray-400" />
              <span className="capitalize">{workflow.workflow_type}</span>
            </div>
          </DetailRow>

          <DetailRow label="Deployment">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Settings size={14} className="text-gray-400" />
              <span>{workflow.deployment}</span>
            </div>
          </DetailRow>

          <DetailRow label="Function">
            <div className="flex items-center gap-2">
              <FileCode size={14} className="text-gray-400" />
              <span className="font-mono text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                {workflow.workflow_function ?? 'default_handler'}
              </span>
            </div>
          </DetailRow>

          <DetailRow label="UID">
            <span
              className="font-mono text-[11px] text-gray-500 truncate block"
              title={workflow.uid}
            >
              {workflow.uid ?? 'N/A'}
            </span>
          </DetailRow>

          <DetailRow label="Created">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar size={14} className="text-gray-400" />
              <span>
                {workflow.created
                  ? new Date(workflow.created).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </span>
            </div>
          </DetailRow>
        </div>
      </section>
    </div>
  );
};

const DetailRow = ({
  children,
  label,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center py-3.5 border-b border-gray-100 overflow-hidden">
    <span className="w-1/3 min-w-[100px] text-gray-400 text-[13px] font-medium tracking-tight">
      {label}
    </span>
    <div className="w-2/3 text-[#2a2d30] flex items-center">{children}</div>
  </div>
);
