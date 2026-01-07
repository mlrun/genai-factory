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

import { Edge, MarkerType, Node, Position } from 'reactflow';

import { Workflow } from '@shared/types/workflow';

import {
  WORKFLOW_GRAPH_HORIZONTAL_OFFSET,
  WORKFLOW_GRAPH_LEVEL_SPACING,
  WORKFLOW_GRAPH_SIBLING_SPACING,
  WORKFLOW_GRAPH_VERTICAL_BASE_POSITION,
} from '@constants';

type NodePosition = {
  horizontalPosition: number;
  verticalPosition: number;
};

export function buildGraph(workflow?: Workflow | null) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (!workflow?.graph?.steps) return { nodes, edges };

  const steps = workflow.graph.steps;
  const stepKeys = Object.keys(steps);
  const positions: Record<string, NodePosition> = {};

  function setPosition(
    stepKey: string,
    level: number,
    siblingIndex: number,
    siblingCount: number,
  ): NodePosition {
    if (positions[stepKey]) return positions[stepKey];

    const horizontalPosition =
      level * WORKFLOW_GRAPH_LEVEL_SPACING + WORKFLOW_GRAPH_HORIZONTAL_OFFSET;
    const verticalOffset =
      (siblingIndex - (siblingCount - 1) / 2) * WORKFLOW_GRAPH_SIBLING_SPACING;
    const verticalPosition =
      WORKFLOW_GRAPH_VERTICAL_BASE_POSITION + verticalOffset;

    positions[stepKey] = { horizontalPosition, verticalPosition };
    return positions[stepKey];
  }

  const levels: Record<string, number> = {};
  function getLevel(stepKey: string): number {
    if (levels[stepKey] !== undefined) return levels[stepKey];
    const step = steps[stepKey];
    if (step?.after?.length) {
      levels[stepKey] = Math.max(...step.after.map(getLevel)) + 1;
    } else {
      levels[stepKey] = 0;
    }
    return levels[stepKey];
  }

  stepKeys.forEach(getLevel);

  const siblingCounts: Record<string, number> = {};
  Object.values(steps).forEach((step) => {
    step.after?.forEach((parent) => {
      siblingCounts[parent] = (siblingCounts[parent] || 0) + 1;
    });
  });

  const parentIndexCounter: Record<string, number> = {};
  stepKeys.forEach((key) => {
    const step = steps[key];
    const level = levels[key];
    let siblingIndex = 0;
    let siblingCount = 1;

    if (step.after?.length) {
      const parent = step.after[0];
      siblingIndex = parentIndexCounter[parent] || 0;
      siblingCount = siblingCounts[parent] || 1;
      parentIndexCounter[parent] = siblingIndex + 1;
    }

    const pos = setPosition(key, level, siblingIndex, siblingCount);

    nodes.push({
      id: key,
      data: { label: key },
      position: {
        x: pos.horizontalPosition,
        y: pos.verticalPosition,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    step.after?.forEach((prev) => {
      const edgeId = `${prev}-${key}`;
      if (!edges.some((e) => e.id === edgeId)) {
        edges.push({
          id: edgeId,
          source: prev,
          target: key,
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.Arrow,
            width: 15,
            height: 15,
          },
          style: {
            strokeWidth: 2,
          },
        });
      }
    });
  });

  return { nodes, edges };
}
