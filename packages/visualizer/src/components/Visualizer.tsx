import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import ReactFlow, {
  addEdge,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
} from 'reactflow';
import type {
  Node,
  Edge,
  Connection,
  NodeProps,
  EdgeProps,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Grid dot background component
const GridDotBackground = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.2) 1px, transparent 0)',
        backgroundColor: '#0b1120',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  );
};

type HighlightState = {
  isSelected: boolean;
  isConnected: boolean;
};

// Custom node component with conditional connection handles
const CustomFileNodeComponent = ({ data }: NodeProps) => {
  const {
    sourceCount = 0,
    targetCount = 0,
    fileName,
    fullPath,
    nodeWidth,
    highlightState,
  } = data;

  // Dynamic styling based on file type
  const getFileTypeStyle = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const path = fullPath.toLowerCase();

    let backgroundColor = 'rgba(30, 41, 59, 0.9)';
    let borderColor = '#38bdf8';
    const textColor = '#e2e8f0';

    if (extension === 'ts' || extension === 'tsx') {
      backgroundColor = 'rgba(46, 91, 168, 0.85)';
      borderColor = '#60a5fa';
    } else if (extension === 'js' || extension === 'jsx') {
      backgroundColor = 'rgba(161, 98, 7, 0.75)';
      borderColor = '#facc15';
    } else if (extension === 'css') {
      backgroundColor = 'rgba(15, 118, 110, 0.75)';
      borderColor = '#2dd4bf';
    } else if (path.includes('/pages/')) {
      backgroundColor = 'rgba(180, 41, 104, 0.7)';
      borderColor = '#f472b6';
    } else if (path.includes('/components/')) {
      backgroundColor = 'rgba(91, 33, 182, 0.75)';
      borderColor = '#c4b5fd';
    } else if (path.includes('/hooks/')) {
      backgroundColor = 'rgba(17, 94, 89, 0.75)';
      borderColor = '#34d399';
    } else if (path.includes('/services/')) {
      backgroundColor = 'rgba(124, 45, 18, 0.75)';
      borderColor = '#fb923c';
    } else if (path.includes('/utils/')) {
      backgroundColor = 'rgba(12, 74, 110, 0.75)';
      borderColor = '#38bdf8';
    } else if (path.includes('/types/')) {
      backgroundColor = 'rgba(60, 72, 85, 0.8)';
      borderColor = '#94a3b8';
    }

    return { backgroundColor, borderColor, textColor };
  };

  const { backgroundColor, borderColor, textColor } =
    getFileTypeStyle(fileName);

  const highlight = highlightState as HighlightState | undefined;

  const isSelected = highlight?.isSelected ?? false;
  const isConnected = highlight?.isConnected ?? false;
  const CONNECTED_BORDER_COLOR = '#facc15';
  const SELECTED_BORDER_COLOR = '#fb923c';
  const SELECTED_BACKGROUND_OVERLAY = 'rgba(251, 146, 60, 0.28)';
  const CONNECTED_BACKGROUND_OVERLAY = 'rgba(250, 204, 21, 0.22)';

  const borderHighlightColor = isSelected
    ? SELECTED_BORDER_COLOR
    : isConnected
      ? CONNECTED_BORDER_COLOR
      : borderColor;
  const handleHighlightColor = isSelected
    ? SELECTED_BORDER_COLOR
    : isConnected
      ? CONNECTED_BORDER_COLOR
      : borderColor;
  const borderWidth = isSelected || isConnected ? 3 : 2;
  const nodeShadow = isSelected
    ? '0 0 18px rgba(251, 146, 60, 0.45)'
    : isConnected
      ? '0 0 16px rgba(250, 204, 21, 0.45)'
      : 'none';
  const backgroundOverlay = isSelected
    ? SELECTED_BACKGROUND_OVERLAY
    : isConnected
      ? CONNECTED_BACKGROUND_OVERLAY
      : null;

  return (
    <div
      style={{
        background:
          backgroundOverlay !== null
            ? `linear-gradient(135deg, ${backgroundOverlay}, ${backgroundOverlay}), ${backgroundColor}`
            : backgroundColor,
        border: `${borderWidth}px solid ${borderHighlightColor}`,
        borderRadius: '10px',
        padding: 'clamp(4.5px, 0.45vw, 7px) clamp(5px, 0.6vw, 9px)',
        width: nodeWidth ? `${Math.round(nodeWidth)}px` : 'auto',
        minWidth: '80px',
        maxWidth: '500px',
        fontSize: 'clamp(5px, 0.45vw, 6px)',
        fontWeight: '600',
        textAlign: 'center',
        color: textColor,
        position: 'relative',
        boxSizing: 'border-box',
        boxShadow: nodeShadow,
      }}
    >
      {/* Only show handles that are actually used */}
      {Array.from({ length: targetCount }).map((_, index) => (
        <Handle
          key={`target-${index}`}
          type="target"
          position={Position.Bottom}
          id={`target-${index}`}
          style={{
            background: handleHighlightColor,
            width: 'clamp(3px, 0.3vw, 5px)',
            height: 'clamp(3px, 0.3vw, 5px)',
            left: `${((index + 1) / (targetCount + 1)) * 100}%`,
            bottom: 0,
            transform: 'translate(-50%, 50%)',
          }}
        />
      ))}
      {Array.from({ length: sourceCount }).map((_, index) => (
        <Handle
          key={`source-${index}`}
          type="source"
          position={Position.Top}
          id={`source-${index}`}
          style={{
            background: handleHighlightColor,
            width: 'clamp(3px, 0.3vw, 5px)',
            height: 'clamp(3px, 0.3vw, 5px)',
            left: `${((index + 1) / (sourceCount + 1)) * 100}%`,
            top: 0,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Node content - show full path */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(6px, 0.5vw, 8px)',
            lineHeight: 1.2,
            wordBreak: 'break-word',
            color: 'rgba(255, 255, 255, 1)',
          }}
        >
          {fileName}
        </div>
        <div
          aria-hidden="true"
          style={{
            width: '100%',
            height: '1px',
            background: borderHighlightColor,
            opacity: 0.35,
            borderRadius: '2px',
          }}
        />
        <div
          style={{
            fontSize: 'clamp(4px, 0.4vw, 6px)',
            color: 'rgba(255, 255, 255, 0.75)',
            fontWeight: '500',
            lineHeight: 1.4,
            wordBreak: 'break-all',
          }}
        >
          {fullPath}
        </div>
      </div>
    </div>
  );
};

const CustomFileNode = memo(
  CustomFileNodeComponent,
  (prev, next) =>
    prev.data.fileName === next.data.fileName &&
    prev.data.fullPath === next.data.fullPath &&
    prev.data.sourceCount === next.data.sourceCount &&
    prev.data.targetCount === next.data.targetCount &&
    prev.data.nodeWidth === next.data.nodeWidth &&
    (prev.data.highlightState?.isSelected ?? false) ===
      (next.data.highlightState?.isSelected ?? false) &&
    (prev.data.highlightState?.isConnected ?? false) ===
      (next.data.highlightState?.isConnected ?? false)
);

const ContainerGroupNodeComponent = ({
  data,
}: NodeProps<{ label?: string; padding?: number }>) => {
  const label = data?.label ?? '';
  const paddingValue = data?.padding ?? 16;

  const labelOffset = Math.max(18, paddingValue * 0.75);
  const labelLeft = Math.max(8, paddingValue - 8);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: '2px solid rgba(56, 189, 248, 0.65)',
        borderRadius: '18px',
        boxSizing: 'border-box',
        padding: `${paddingValue}px`,
        position: 'relative',
        pointerEvents: 'auto',
      }}
    >
      {label ? (
        <div
          style={{
            position: 'absolute',
            top: `-${labelOffset}px`,
            left: `${labelLeft}px`,
            fontSize: 'clamp(9px, 0.65vw, 12px)',
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: 0.92,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

const ContainerGroupNode = memo(ContainerGroupNodeComponent);

const CONTAINER_PATHS = ['./src/schemas', './src/plugins'];

const nodeTypes = {
  customFile: CustomFileNode,
  containerGroup: ContainerGroupNode,
};

const FLOW_DASH_SEGMENT = 14;
const FLOW_GAP_SEGMENT = 12;
const FLOW_DASH_CYCLE = FLOW_DASH_SEGMENT + FLOW_GAP_SEGMENT;
const FLOW_ANIMATION_DURATION = 1.05;

const FlowAnimationStyles = () => (
  <style>
    {`
      @keyframes flowingEdgeAnimation {
        0% {
          stroke-dashoffset: 0;
        }
        100% {
          stroke-dashoffset: ${FLOW_DASH_CYCLE};
        }
      }
    `}
  </style>
);

const FlowingEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const baseStyle = { ...style } as CSSProperties;
  if (baseStyle.stroke) delete baseStyle.stroke;
  if (baseStyle.strokeWidth) delete baseStyle.strokeWidth;

  const isActive = data?.isActive ?? false;
  const strokeColor = isActive ? '#fb923c' : 'rgba(96, 165, 250, 0.4)';
  const strokeWidth = isActive ? 3 : 2;

  return (
    <g>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: isActive
            ? `${FLOW_DASH_SEGMENT} ${FLOW_GAP_SEGMENT}`
            : undefined,
          strokeDashoffset: isActive ? 0 : undefined,
          animation: isActive
            ? `flowingEdgeAnimation ${FLOW_ANIMATION_DURATION}s linear infinite`
            : undefined,
          filter: isActive
            ? 'drop-shadow(0 0 14px rgba(248, 162, 56, 0.55))'
            : undefined,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          willChange: isActive ? 'stroke-dashoffset' : undefined,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
          ...baseStyle,
        }}
      />
    </g>
  );
};

const edgeTypes = {
  flowing: FlowingEdge,
};

interface DependencyMap {
  nodes: { id: string }[];
  links: { source: string; target: string }[];
}

export default function Visualizer({
  dependencyMap,
}: {
  dependencyMap: DependencyMap;
}) {
  const data: DependencyMap = dependencyMap;

  const { initialNodes, initialEdges, adjacency } = useMemo(() => {
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, string[]>();
    const indegree = new Map<string, number>();
    const connectionCounts = new Map<string, number>();
    const adjacency = new Map<string, Set<string>>();

    data.nodes.forEach(node => {
      outgoing.set(node.id, []);
      incoming.set(node.id, []);
      indegree.set(node.id, 0);
      connectionCounts.set(node.id, 0);
      adjacency.set(node.id, new Set());
    });

    data.links.forEach(({ source, target }) => {
      if (!outgoing.has(source)) outgoing.set(source, []);
      if (!incoming.has(target)) incoming.set(target, []);
      outgoing.get(source)!.push(target);
      incoming.get(target)!.push(source);
      indegree.set(target, (indegree.get(target) ?? 0) + 1);
      if (!outgoing.has(target)) outgoing.set(target, []);
      if (!incoming.has(source)) incoming.set(source, []);
      connectionCounts.set(source, (connectionCounts.get(source) ?? 0) + 1);
      connectionCounts.set(target, (connectionCounts.get(target) ?? 0) + 1);
      if (!adjacency.has(source)) adjacency.set(source, new Set());
      if (!adjacency.has(target)) adjacency.set(target, new Set());
      adjacency.get(source)!.add(target);
      adjacency.get(target)!.add(source);
    });

    const levelMap = new Map<string, number>();
    const queue: string[] = [];
    const visited = new Set<string>();

    data.nodes.forEach(node => {
      if ((indegree.get(node.id) ?? 0) === 0) {
        levelMap.set(node.id, 0);
        queue.push(node.id);
      }
    });

    while (queue.length) {
      const nodeId = queue.shift()!;
      visited.add(nodeId);
      const currentLevel = levelMap.get(nodeId) ?? 0;
      const neighbors = outgoing.get(nodeId) ?? [];

      neighbors.forEach(targetId => {
        const nextLevel = currentLevel + 1;
        const previousLevel = levelMap.get(targetId) ?? 0;
        if (nextLevel > previousLevel) {
          levelMap.set(targetId, nextLevel);
        }

        const remaining = (indegree.get(targetId) ?? 0) - 1;
        indegree.set(targetId, remaining);
        if (remaining <= 0 && !visited.has(targetId)) {
          queue.push(targetId);
        }
      });
    }

    data.nodes.forEach(node => {
      if (!levelMap.has(node.id)) {
        const parents = incoming.get(node.id) ?? [];
        const parentLevel = parents.reduce((max, parentId) => {
          const level = levelMap.get(parentId);
          return level !== undefined ? Math.max(max, level + 1) : max;
        }, 0);
        levelMap.set(node.id, parentLevel);
      }
    });

    const NODE_MIN_WIDTH = 80;
    const NODE_MAX_WIDTH = 500;
    const NODE_VERTICAL_EXTENT = 60;
    const HORIZONTAL_GAP_MIN = 40;
    const HORIZONTAL_GAP_MAX = 130;
    const NAME_CHAR_WIDTH = 9;
    const PATH_CHAR_WIDTH = 5;
    const HORIZONTAL_PADDING = 32;
    const PATH_LENGTH_CAP = 120;
    const nodeSizing = new Map<string, { width: number }>();
    data.nodes.forEach(node => {
      const fileName = node.id.split('/').pop() || node.id;
      const fullPath = node.id;
      const nameWidth = Math.max(fileName.length, 1) * NAME_CHAR_WIDTH;
      const pathWidth =
        Math.max(Math.min(fullPath.length, PATH_LENGTH_CAP), 1) *
        PATH_CHAR_WIDTH;
      const contentWidth = Math.max(nameWidth, pathWidth) + HORIZONTAL_PADDING;
      const width = Math.max(
        NODE_MIN_WIDTH,
        Math.min(NODE_MAX_WIDTH, Math.round(contentWidth))
      );
      nodeSizing.set(node.id, { width });
    });
    const nodesWithMetrics = data.nodes.map(node => {
      const id = node.id;
      const sourceCount = outgoing.get(id)?.length ?? 0;
      const targetCount = incoming.get(id)?.length ?? 0;
      const difference = sourceCount - targetCount;
      const totalConnections = connectionCounts.get(id) ?? 0;
      const level = levelMap.get(id) ?? Number.MAX_SAFE_INTEGER;

      return {
        id,
        sourceCount,
        targetCount,
        difference,
        totalConnections,
        level,
      };
    });

    type NodeMetric = (typeof nodesWithMetrics)[number];

    const metricsById = new Map<string, NodeMetric>();
    nodesWithMetrics.forEach(metric => {
      metricsById.set(metric.id, metric);
    });

    const compareById = (a: NodeMetric, b: NodeMetric) =>
      a.id.localeCompare(b.id);

    const sortByImportance = (metricsList: NodeMetric[]) => {
      const pureSources: NodeMetric[] = [];
      const sourceDominant: NodeMetric[] = [];
      const balanced: NodeMetric[] = [];
      const targetDominant: NodeMetric[] = [];
      const pureTargets: NodeMetric[] = [];

      metricsList.forEach(metric => {
        if (metric.targetCount === 0 && metric.sourceCount > 0) {
          pureSources.push(metric);
          return;
        }

        if (metric.sourceCount === 0 && metric.targetCount > 0) {
          pureTargets.push(metric);
          return;
        }

        if (metric.sourceCount > metric.targetCount) {
          sourceDominant.push(metric);
          return;
        }

        if (metric.targetCount > metric.sourceCount) {
          targetDominant.push(metric);
          return;
        }

        balanced.push(metric);
      });

      pureSources.sort((a, b) => {
        if (b.sourceCount !== a.sourceCount) {
          return b.sourceCount - a.sourceCount;
        }
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        if (b.totalConnections !== a.totalConnections) {
          return b.totalConnections - a.totalConnections;
        }
        return compareById(a, b);
      });

      sourceDominant.sort((a, b) => {
        if (b.difference !== a.difference) {
          return b.difference - a.difference;
        }
        if (b.sourceCount !== a.sourceCount) {
          return b.sourceCount - a.sourceCount;
        }
        if (a.targetCount !== b.targetCount) {
          return a.targetCount - b.targetCount;
        }
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        if (b.totalConnections !== a.totalConnections) {
          return b.totalConnections - a.totalConnections;
        }
        return compareById(a, b);
      });

      balanced.sort((a, b) => {
        if (b.totalConnections !== a.totalConnections) {
          return b.totalConnections - a.totalConnections;
        }
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        return compareById(a, b);
      });

      targetDominant.sort((a, b) => {
        if (a.difference !== b.difference) {
          return a.difference - b.difference;
        }
        if (b.targetCount !== a.targetCount) {
          return b.targetCount - a.targetCount;
        }
        if (a.sourceCount !== b.sourceCount) {
          return a.sourceCount - b.sourceCount;
        }
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        if (b.totalConnections !== a.totalConnections) {
          return b.totalConnections - a.totalConnections;
        }
        return compareById(a, b);
      });

      pureTargets.sort((a, b) => {
        if (b.targetCount !== a.targetCount) {
          return b.targetCount - a.targetCount;
        }
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        if (b.totalConnections !== a.totalConnections) {
          return b.totalConnections - a.totalConnections;
        }
        return compareById(a, b);
      });

      return [
        ...pureTargets,
        ...targetDominant,
        ...balanced,
        ...sourceDominant,
        ...pureSources,
      ].map(metric => metric.id);
    };

    const buildEvenRows = (orderedIds: string[]) => {
      if (orderedIds.length === 0) {
        return [] as string[][];
      }

      const desiredRowCount = Math.max(
        1,
        Math.round(Math.sqrt(orderedIds.length))
      );
      const rows: string[][] = [];
      let startIndex = 0;

      for (let rowIndex = 0; rowIndex < desiredRowCount; rowIndex += 1) {
        const remainingNodes = orderedIds.length - startIndex;
        const remainingRows = desiredRowCount - rowIndex;
        if (remainingNodes <= 0) {
          break;
        }
        const rowSize = Math.ceil(remainingNodes / remainingRows);
        rows.push(orderedIds.slice(startIndex, startIndex + rowSize));
        startIndex += rowSize;
      }

      if (startIndex < orderedIds.length) {
        if (rows.length === 0) {
          rows.push(orderedIds.slice(startIndex));
        } else {
          rows[rows.length - 1].push(...orderedIds.slice(startIndex));
        }
      }

      return rows.filter(row => row.length > 0);
    };

    const containerConfigs = CONTAINER_PATHS.map((path, index) => ({
      id: `container-${index}`,
      path,
    }));

    const nodesAssignedToContainers = new Set<string>();
    const containerAssignments = containerConfigs.map(config => {
      const nodeIds = data.nodes
        .filter(node => node.id.includes(config.path))
        .map(node => node.id);

      nodeIds.forEach(id => nodesAssignedToContainers.add(id));

      const metrics = nodeIds
        .map(id => metricsById.get(id))
        .filter((metric): metric is NodeMetric => metric !== undefined);

      const orderedIds =
        metrics.length > 0 ? sortByImportance(metrics) : [...nodeIds];

      return {
        ...config,
        nodeIds,
        orderedIds,
      };
    });

    const nonContainerMetrics = nodesWithMetrics.filter(
      metric => !nodesAssignedToContainers.has(metric.id)
    );
    const orderedNonContainerIds = sortByImportance(nonContainerMetrics);

    const nonContainerRows = buildEvenRows(orderedNonContainerIds);

    const maxRowLength = nonContainerRows.reduce(
      (max: number, row: string[]) => Math.max(max, row.length),
      0
    );
    const baseGap =
      maxRowLength > 1
        ? Math.max(
            HORIZONTAL_GAP_MIN,
            Math.min(HORIZONTAL_GAP_MAX, 800 / Math.max(1, maxRowLength - 1))
          )
        : HORIZONTAL_GAP_MIN;
    const adjustedBaseGap = baseGap / 2;
    const verticalGap = adjustedBaseGap * 0.675;
    const verticalStep = NODE_VERTICAL_EXTENT + verticalGap;

    const nodePositions = new Map<string, { x: number; y: number }>();
    nonContainerRows.forEach((row: string[], rowIndex: number) => {
      const widths = row.map(
        (nodeId: string) => nodeSizing.get(nodeId)?.width ?? NODE_MIN_WIDTH
      );
      const totalWidth =
        widths.reduce((sum: number, width: number) => sum + width, 0) +
        adjustedBaseGap * Math.max(0, row.length - 1);
      let currentX = -totalWidth / 2;

      row.forEach((nodeId: string, index: number) => {
        const width = widths[index];
        nodePositions.set(nodeId, {
          x: currentX,
          y: rowIndex * verticalStep,
        });
        currentX += width + adjustedBaseGap;
      });
    });

    let initialNodes = data.nodes.map(node => {
      const position = nodePositions.get(node.id) ?? { x: 0, y: 0 };
      const fileName = node.id.split('/').pop() || node.id;
      const fullPath = node.id;
      const sourceCount = outgoing.get(node.id)?.length ?? 0;
      const targetCount = incoming.get(node.id)?.length ?? 0;
      const sizing = nodeSizing.get(node.id);

      return {
        id: node.id,
        position,
        data: {
          fileName,
          fullPath,
          sourceCount,
          targetCount,
          nodeWidth: sizing?.width,
          highlightState: undefined,
        },
        type: 'customFile',
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      } as Node;
    });
    const nodeById = new Map(
      initialNodes.map(node => [node.id, node] as const)
    );

    let nonContainerNodes = orderedNonContainerIds
      .map(id => nodeById.get(id))
      .filter((node): node is Node => node !== undefined);
    if (nonContainerNodes.length === 0) {
      nonContainerNodes = initialNodes.filter(
        node => !nodesAssignedToContainers.has(node.id)
      );
    }

    const containerPaddingBase = Math.max(16, adjustedBaseGap / 2);
    const horizontalGap = adjustedBaseGap;
    const verticalSpacing = verticalGap;
    const containerGap = NODE_VERTICAL_EXTENT + verticalSpacing;

    const containerNodes: Node[] = [];
    let containerCursorY = 0;

    containerAssignments.forEach(
      ({ id: containerId, orderedIds, nodeIds, path }) => {
        const layoutIds = orderedIds.length > 0 ? orderedIds : nodeIds;
        const childNodes = layoutIds
          .map(nodeId => nodeById.get(nodeId))
          .filter((node): node is Node => node !== undefined);

        if (childNodes.length === 0) {
          return;
        }

        const rows = buildEvenRows(layoutIds).map(rowIds =>
          rowIds
            .map(nodeId => nodeById.get(nodeId))
            .filter((node): node is Node => node !== undefined)
        );

        const validRows = rows.filter(row => row.length > 0);
        const padding = containerPaddingBase;
        const rowWidths = validRows.map(row => {
          return row.reduce((sum: number, node, index) => {
            const width =
              (node.data as { nodeWidth?: number }).nodeWidth ?? NODE_MIN_WIDTH;
            return sum + width + (index > 0 ? horizontalGap : 0);
          }, 0);
        });

        const maxRowWidth = rowWidths.length
          ? Math.max(...rowWidths)
          : padding * 2 + NODE_MIN_WIDTH;

        validRows.forEach((row, rowIndex) => {
          const totalRowWidth = rowWidths[rowIndex] ?? 0;
          let currentX = padding + (maxRowWidth - totalRowWidth) / 2;
          const currentY =
            padding + rowIndex * (NODE_VERTICAL_EXTENT + verticalSpacing);

          row.forEach(node => {
            const width =
              (node.data as { nodeWidth?: number }).nodeWidth ?? NODE_MIN_WIDTH;

            node.position = {
              x: currentX,
              y: currentY,
            };
            node.parentNode = containerId;
            node.extent = 'parent';
            node.draggable = true;

            currentX += width + horizontalGap;
          });
        });

        const rowCount = validRows.length;
        const innerHeight = rowCount
          ? rowCount * NODE_VERTICAL_EXTENT +
            verticalSpacing * Math.max(0, rowCount - 1)
          : NODE_VERTICAL_EXTENT;
        const containerWidth = maxRowWidth + padding * 2;
        const containerHeight = innerHeight + padding * 2;

        const containerNode: Node = {
          id: containerId,
          type: 'containerGroup',
          position: {
            x: -containerWidth / 2,
            y: containerCursorY,
          },
          data: {
            label: path,
            padding,
          },
          draggable: true,
          selectable: true,
          focusable: true,
          style: {
            width: containerWidth,
            height: containerHeight,
          },
        };

        containerNodes.push(containerNode);
        containerCursorY += containerHeight + containerGap;
      }
    );

    const totalContainerHeight =
      containerCursorY > 0 ? containerCursorY - containerGap : 0;
    const nonContainerYOffset =
      totalContainerHeight > 0 ? totalContainerHeight + containerGap : 0;

    if (nonContainerYOffset > 0) {
      initialNodes = initialNodes.map(node => {
        if (nodesAssignedToContainers.has(node.id)) {
          return node;
        }

        return {
          ...node,
          position: {
            x: node.position.x,
            y: node.position.y + nonContainerYOffset,
          },
        };
      });
    }

    if (containerNodes.length > 0) {
      initialNodes = [...containerNodes, ...initialNodes];
    }

    const sourceCounters = new Map<string, number>();
    const targetCounters = new Map<string, number>();

    const initialEdges = data.links.map((link, index) => {
      const sourceIndex = sourceCounters.get(link.source) ?? 0;
      sourceCounters.set(link.source, sourceIndex + 1);

      const targetIndex = targetCounters.get(link.target) ?? 0;
      targetCounters.set(link.target, targetIndex + 1);

      return {
        id: `edge-${index}`,
        source: link.source,
        target: link.target,
        sourceHandle: `source-${sourceIndex}`,
        targetHandle: `target-${targetIndex}`,
        type: 'flowing',
        data: {
          isActive: false,
        },
      } as Edge;
    });

    return { initialNodes, initialEdges, adjacency };
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(
    () => new Set()
  );

  const applySelectionState = useCallback(
    (selectedIds: Set<string>) => {
      const selected = new Set(selectedIds);
      const connected = new Set<string>();

      selected.forEach(selectedId => {
        adjacency.get(selectedId)?.forEach(neighbor => {
          connected.add(neighbor);
        });
      });

      setNodes(currentNodes =>
        currentNodes.map(node => {
          const isSelected = selected.has(node.id);
          const isConnected = connected.has(node.id) && !isSelected;
          const hasHighlight = isSelected || isConnected;

          if (!hasHighlight && node.data.highlightState === undefined) {
            return node;
          }

          return {
            ...node,
            data: {
              ...node.data,
              highlightState: hasHighlight
                ? { isSelected, isConnected }
                : undefined,
            },
          };
        })
      );

      setEdges(currentEdges =>
        currentEdges.map(edge => {
          const isActive =
            selected.has(edge.source) || selected.has(edge.target);

          if ((edge.data?.isActive ?? false) === isActive) {
            return edge;
          }

          return {
            ...edge,
            data: {
              ...(edge.data ?? {}),
              isActive,
            },
          };
        })
      );
    },
    [adjacency, setEdges, setNodes]
  );

  useEffect(() => {
    applySelectionState(selectedNodeIds);
  }, [applySelectionState, selectedNodeIds]);

  const handleNodeClick = useCallback<NodeMouseHandler>((_event, node) => {
    setSelectedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  }, []);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: '0',
        padding: '0',
        border: 'none',
        borderRadius: '0',
        overflow: 'hidden',
        background: '#0b1120',
        position: 'relative',
      }}
    >
      <FlowAnimationStyles />
      <GridDotBackground />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.1}
        onlyRenderVisibleElements
        fitViewOptions={{
          padding: 50,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Controls
          style={{
            bottom: 20,
            left: 20,
          }}
        />
        <MiniMap
          style={{
            bottom: 20,
            right: 20,
          }}
          nodeColor="#38bdf8"
          maskColor="rgba(15,23,42,0.65)"
        />
      </ReactFlow>
    </div>
  );
}
