import React from 'react';
import { Github, Shield } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@components/shared/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@components/shared/Tabs';

type ProjectHeaderProps = {
  name: string;
  description?: string;
  uid?: string;
  created?: string;
  updated?: string;
  labels?: Record<string, string> | string | null;
};

const sampleMetrics = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  value: Math.floor(Math.random() * 40) + 10,
}));

const ProjectDetails = ({
  created,
  labels,
  name,
  uid,
  updated,
}: ProjectHeaderProps) => {
  const renderLabels = () => {
    if (!labels) return null;
    const items =
      typeof labels === 'string'
        ? [labels]
        : Object.entries(labels).map(([k, v]) => `${k}:${v}`);

    return items.map((label) => (
      <Badge
        key={label}
        className="bg-[#2a2d30] text-white border-none px-3 py-0.5 rounded text-xs font-normal"
      >
        {label}
      </Badge>
    ));
  };

  return (
    <div className="flex flex-col w-full h-fulltext-[#2a2d30] antialiased">
      {/* Header Section */}
      <div className="flex items-center gap-5 mb-6">
        <div className="w-16 h-16 rounded-xl bg-[#2a2d30] flex items-center justify-center shadow-lg shadow-gray-200">
          <Shield size={32} className="text-white" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#2a2d30]">
            {name}
          </h1>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Github size={16} />
            <span className="hover:underline cursor-pointer">
              internal/repository-source
            </span>
          </div>
        </div>
      </div>

      {/* Project Details Section */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-[#2a2d30]">
          Project details
        </h2>

        <div>
          <DetailRow label="Owner">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                E
              </div>
              <span className="text-sm font-medium">Elena Rot</span>
            </div>
          </DetailRow>

          <DetailRow label="UID">
            <span className="font-mono text-sm text-gray-500">
              {uid ?? 'N/A'}
            </span>
          </DetailRow>

          <DetailRow label="Created">
            <span className="text-sm font-medium">
              {created
                ? new Date(created).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Jul 2, 2024'}
            </span>
          </DetailRow>

          <DetailRow label="Last modified">
            <span className="text-sm font-medium">
              {updated
                ? new Date(updated).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Jul 2, 2024'}
            </span>
          </DetailRow>

          <DetailRow label="Labels">
            <div className="flex flex-wrap gap-2">{renderLabels()}</div>
          </DetailRow>
        </div>
      </section>

      <Tabs
        defaultValue="liveMonitoring"
        className="flex flex-col justify-start mt-auto"
      >
        <TabsList className="gap-4 bg-white justify-normal py-0">
          <TabsTrigger value="liveMonitoring">Live Monitoring</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent
          value="liveMonitoring"
          className="flex flex-col items-start gap-5 flex-1 self-stretch border-t"
        >
          <div className="w-full text-[#2a2d30]">
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    Live System Monitor
                  </h3>
                </div>
                <span className="text-xs font-mono text-gray-400">
                  Interval: 1s
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sampleMetrics}>
                    <defs>
                      <linearGradient
                        id="colorValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2a2d30"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2a2d30"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f3f4f6"
                    />
                    <XAxis dataKey="time" hide />
                    <YAxis
                      orientation="right"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip
                      cursor={{ stroke: '#2a2d30', strokeWidth: 1 }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#2a2d30',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area
                      isAnimationActive={true}
                      type="monotone"
                      dataKey="value"
                      stroke="#2a2d30"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      animationDuration={1000}
                    />
                    {/* Optional: Adds a "target" or "limit" line for that monitoring feel */}
                    <ReferenceLine
                      y={80}
                      stroke="#e5e7eb"
                      strokeDasharray="3 3"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="alerts"
          className="flex flex-col items-start gap-5 flex-1 self-stretch border-t"
        >
          <div className="h-[316px] w-full" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const DetailRow = ({
  children,
  label,
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) => (
  <div className="flex items-center py-2 border-b border-gray-100">
    <span className="w-1/3 text-gray-500 text-sm font-medium">{label}</span>
    <div className="w-2/3">{children}</div>
  </div>
);

export default ProjectDetails;
