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

import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  NodeMouseHandler,
  useEdgesState,
  useNodesState,
} from 'reactflow';

import WorkflowDrawer from '@components/feature/Workflow/WorkflowDrawer';
import { useWorkflow } from '@queries';

import { useWorkflowDrawerStore } from '@stores/workflowDrawerStore';
import { buildGraph } from '@utils/workflowGraph';

import 'reactflow/dist/style.css';

function WorkflowGraph() {
  const { data: workflow } = useWorkflow();

  const { handleNodeClick, selectedWorkflowStep } = useWorkflowDrawerStore();

  const { edges: initialEdges, nodes: initialNodes } = useMemo(
    () => buildGraph(workflow),
    [workflow],
  );
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick: NodeMouseHandler = (_event, node) =>
    handleNodeClick(node.id, workflow);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        elementsSelectable={false}
        multiSelectionKeyCode={null}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
        selectionKeyCode={null}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
      >
        {/* TODO: Replace default ReactFlow Controls with custom UI once Figma design is finalized */}
        <Controls
          className="shadow rounded-md p-1 flex gap-1 bg-white
        [&_button]:!border-0 [&_button]:rounded-sm [&_button]:hover:!bg-blue-50"
        />
        <Background />
      </ReactFlow>

      {selectedWorkflowStep && <WorkflowDrawer />}
    </div>
  );
}

export default WorkflowGraph;
