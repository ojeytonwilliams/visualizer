import { useCallback, useMemo } from 'react';
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
import type { Node, Edge, Connection, NodeProps, EdgeProps } from 'reactflow';
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
        background: `
          radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.25) 1px, transparent 0),
          linear-gradient(135deg, #020617 0%, #0f172a 40%, #111827 70%, #020617 100%)
        `,
        backgroundSize: '26px 26px, 100% 100%',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  );
};

// Custom node component with conditional connection handles
const CustomFileNode = ({ data }: NodeProps) => {
  const { sourceCount = 0, targetCount = 0, fileName, fullPath } = data;

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

  return (
    <div
      style={{
        background: backgroundColor,
        border: `3px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '30px 40px',
        minWidth: '300px',
        width: 'auto',
        fontSize: '16px',
        fontWeight: '600',
        textAlign: 'center',
        boxShadow: '0 18px 40px rgba(2, 6, 23, 0.45)',
        color: textColor,
        position: 'relative',
      }}
    >
      {/* Only show handles that are actually used */}
      {Array.from({ length: targetCount }).map((_, index) => (
        <Handle
          key={`target-${index}`}
          type="target"
          position={Position.Top}
          id={`target-${index}`}
          style={{
            background: borderColor,
            width: '15px',
            height: '15px',
            left: `${((index + 1) / (targetCount + 1)) * 100}%`,
            top: 0,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.45)',
          }}
        />
      ))}
      {Array.from({ length: sourceCount }).map((_, index) => (
        <Handle
          key={`source-${index}`}
          type="source"
          position={Position.Bottom}
          id={`source-${index}`}
          style={{
            background: borderColor,
            width: '15px',
            height: '15px',
            left: `${((index + 1) / (sourceCount + 1)) * 100}%`,
            bottom: 0,
            transform: 'translate(-50%, 50%)',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.45)',
          }}
        />
      ))}

      {/* Node content - show full path */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: '24px',
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
            height: '2px',
            background: borderColor,
            opacity: 0.35,
            borderRadius: '2px',
          }}
        />
        <div
          style={{
            fontSize: '18x',
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

const nodeTypes = {
  customFile: CustomFileNode,
};

const FlowAnimationStyles = () => (
  <style>
    {`
      @keyframes flowingEdgeAnimation {
        0% {
          stroke-dashoffset: 0;
        }
        100% {
          stroke-dashoffset: -48;
        }
      }

      .react-flow__edge-flowing .flow-line {
        fill: none;
        stroke: #38bdf8;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 4px;
        stroke-dasharray: 12 14;
        animation: flowingEdgeAnimation 1.4s linear infinite;
        opacity: 0.95;
        pointer-events: none;
        filter: drop-shadow(0 0 12px #38bdf8) drop-shadow(0 0 20px #6cd1fcff);
      }

      .react-flow__controls {
        background: rgba(15, 23, 42, 0.9) !important;
        border: 1px solid rgba(148, 163, 184, 0.15);
        box-shadow: 0 14px 35px rgba(2, 6, 23, 0.45);
        backdrop-filter: blur(6px);
        filter: drop-shadow(0 0 12px #071f29ff) drop-shadow(0 0 20px #38bdf8);
      }

      .react-flow__controls button {
        background: transparent;
        color: #e2e8f0;
        border-bottom: 1px solid rgba(148, 163, 184, 0.12);

        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
      }

      .react-flow__controls button:hover {
        background: rgba(30, 41, 59, 0.85);
        color: #38bdf8;

        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35);
      }

      .react-flow__controls button svg {
        stroke: currentColor;

      }

      .react-flow__minimap {
        background: rgba(15, 23, 42, 0.88) !important;
        border: 1px solid rgba(148, 163, 184, 0.15);
        box-shadow: 0 18px 35px rgba(2, 6, 23, 0.5);
        filter: drop-shadow(0 0 12px #071f29ff) drop-shadow(0 0 20px #2c94c1ff);
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

  return (
    <g className="react-flow__edge-flowing">
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: 'rgba(56, 189, 248, 0.45)',
          strokeWidth: 6,
          filter: 'drop-shadow(0 0 14px rgba(30, 144, 255, 0.45))',
          ...baseStyle,
        }}
      />
      <path className="flow-line" d={edgePath} />
    </g>
  );
};

const edgeTypes = {
  flowing: FlowingEdge,
};

export default function Visualizer() {
  const data = {
    nodes: [
      { id: 'apps/web/src/main.tsx' },
      { id: 'apps/web/src/App.tsx' },
      { id: 'apps/web/src/pages/Dashboard.tsx' },
      { id: 'apps/web/src/pages/Settings.tsx' },
      { id: 'apps/web/src/components/Header.tsx' },
      { id: 'apps/web/src/components/UserMenu.tsx' },
      { id: 'apps/web/src/components/ThemeToggle.tsx' },
      { id: 'apps/web/src/hooks/useAuth.ts' },
      { id: 'apps/web/src/hooks/useFeatureFlags.ts' },
      { id: 'apps/web/src/services/apiClient.ts' },
      { id: 'apps/web/src/styles/global.css' },
      { id: 'apps/web/src/config/routes.ts' },
      { id: 'apps/admin/src/main.tsx' },
      { id: 'apps/admin/src/App.tsx' },
      { id: 'apps/admin/src/pages/Users.tsx' },
      { id: 'apps/admin/src/pages/Roles.tsx' },
      { id: 'apps/admin/src/components/AdminSidebar.tsx' },
      { id: 'apps/admin/src/components/RoleTable.tsx' },
      { id: 'apps/admin/src/hooks/useAdminApi.ts' },
      { id: 'packages/ui/src/components/Button.tsx' },
      { id: 'packages/ui/src/components/Card.tsx' },
      { id: 'packages/ui/src/components/Table.tsx' },
      { id: 'packages/ui/src/theme/index.ts' },
      { id: 'packages/utils/src/formatters.ts' },
      { id: 'packages/utils/src/logger.ts' },
      { id: 'packages/utils/src/http.ts' },
      { id: 'packages/types/src/index.ts' },
      { id: 'packages/types/src/user.ts' },
      { id: 'packages/types/src/role.ts' },
      { id: 'services/api/src/index.ts' },
      { id: 'services/api/src/router.ts' },
      { id: 'services/api/src/routes/userRoutes.ts' },
      { id: 'services/api/src/routes/roleRoutes.ts' },
      { id: 'services/api/src/controllers/userController.ts' },
      { id: 'services/api/src/controllers/roleController.ts' },
      { id: 'services/api/src/services/userService.ts' },
      { id: 'services/api/src/services/roleService.ts' },
      { id: 'services/api/src/middleware/auth.ts' },
      { id: 'services/api/src/config/env.ts' },
      { id: 'services/db/src/index.ts' },
      { id: 'services/db/src/connections/pool.ts' },
      { id: 'services/db/src/schema/userSchema.ts' },
      { id: 'services/db/src/schema/roleSchema.ts' },
      { id: 'config/eslint.config.js' },
      { id: 'config/tailwind.config.ts' },
      { id: 'scripts/deploy.ts' },
      { id: 'scripts/seed.ts' },
      { id: 'infra/docker/docker-compose.yml' },
      { id: 'infra/terraform/main.tf' },
      { id: 'docs/architecture.md' },
    ],
    links: [
      { source: 'apps/web/src/main.tsx', target: 'apps/web/src/App.tsx' },
      {
        source: 'apps/web/src/main.tsx',
        target: 'apps/web/src/styles/global.css',
      },
      {
        source: 'apps/web/src/App.tsx',
        target: 'apps/web/src/components/Header.tsx',
      },
      {
        source: 'apps/web/src/App.tsx',
        target: 'apps/web/src/pages/Dashboard.tsx',
      },
      {
        source: 'apps/web/src/App.tsx',
        target: 'apps/web/src/pages/Settings.tsx',
      },
      {
        source: 'apps/web/src/App.tsx',
        target: 'apps/web/src/hooks/useAuth.ts',
      },
      {
        source: 'apps/web/src/App.tsx',
        target: 'apps/web/src/config/routes.ts',
      },
      {
        source: 'apps/web/src/components/Header.tsx',
        target: 'apps/web/src/components/UserMenu.tsx',
      },
      {
        source: 'apps/web/src/components/Header.tsx',
        target: 'apps/web/src/components/ThemeToggle.tsx',
      },
      {
        source: 'apps/web/src/components/Header.tsx',
        target: 'packages/ui/src/components/Button.tsx',
      },
      {
        source: 'apps/web/src/components/UserMenu.tsx',
        target: 'apps/web/src/hooks/useAuth.ts',
      },
      {
        source: 'apps/web/src/components/UserMenu.tsx',
        target: 'packages/ui/src/components/Button.tsx',
      },
      {
        source: 'apps/web/src/components/ThemeToggle.tsx',
        target: 'packages/ui/src/theme/index.ts',
      },
      {
        source: 'apps/web/src/pages/Dashboard.tsx',
        target: 'apps/web/src/services/apiClient.ts',
      },
      {
        source: 'apps/web/src/pages/Dashboard.tsx',
        target: 'apps/web/src/hooks/useFeatureFlags.ts',
      },
      {
        source: 'apps/web/src/pages/Dashboard.tsx',
        target: 'packages/ui/src/components/Card.tsx',
      },
      {
        source: 'apps/web/src/pages/Dashboard.tsx',
        target: 'packages/ui/src/components/Table.tsx',
      },
      {
        source: 'apps/web/src/pages/Dashboard.tsx',
        target: 'packages/ui/src/components/Button.tsx',
      },
      {
        source: 'apps/web/src/pages/Settings.tsx',
        target: 'apps/web/src/components/ThemeToggle.tsx',
      },
      {
        source: 'apps/web/src/pages/Settings.tsx',
        target: 'apps/web/src/services/apiClient.ts',
      },
      {
        source: 'apps/web/src/pages/Settings.tsx',
        target: 'apps/web/src/config/routes.ts',
      },
      {
        source: 'apps/web/src/pages/Settings.tsx',
        target: 'packages/ui/src/components/Card.tsx',
      },
      {
        source: 'apps/web/src/hooks/useAuth.ts',
        target: 'apps/web/src/services/apiClient.ts',
      },
      {
        source: 'apps/web/src/hooks/useAuth.ts',
        target: 'packages/utils/src/http.ts',
      },
      {
        source: 'apps/web/src/hooks/useAuth.ts',
        target: 'packages/types/src/user.ts',
      },
      {
        source: 'apps/web/src/hooks/useFeatureFlags.ts',
        target: 'packages/utils/src/http.ts',
      },
      {
        source: 'apps/web/src/hooks/useFeatureFlags.ts',
        target: 'packages/utils/src/logger.ts',
      },
      {
        source: 'apps/web/src/services/apiClient.ts',
        target: 'packages/utils/src/http.ts',
      },
      {
        source: 'apps/web/src/services/apiClient.ts',
        target: 'packages/utils/src/logger.ts',
      },
      {
        source: 'apps/web/src/services/apiClient.ts',
        target: 'packages/types/src/index.ts',
      },
      {
        source: 'apps/web/src/services/apiClient.ts',
        target: 'services/api/src/index.ts',
      },
      {
        source: 'apps/web/src/config/routes.ts',
        target: 'packages/types/src/index.ts',
      },
      {
        source: 'apps/web/src/styles/global.css',
        target: 'config/tailwind.config.ts',
      },
      { source: 'apps/admin/src/main.tsx', target: 'apps/admin/src/App.tsx' },
      {
        source: 'apps/admin/src/main.tsx',
        target: 'apps/web/src/styles/global.css',
      },
      {
        source: 'apps/admin/src/App.tsx',
        target: 'apps/admin/src/components/AdminSidebar.tsx',
      },
      {
        source: 'apps/admin/src/App.tsx',
        target: 'apps/admin/src/pages/Users.tsx',
      },
      {
        source: 'apps/admin/src/App.tsx',
        target: 'apps/admin/src/pages/Roles.tsx',
      },
      {
        source: 'apps/admin/src/App.tsx',
        target: 'apps/admin/src/hooks/useAdminApi.ts',
      },
      {
        source: 'apps/admin/src/App.tsx',
        target: 'apps/web/src/config/routes.ts',
      },
      {
        source: 'apps/admin/src/components/AdminSidebar.tsx',
        target: 'packages/ui/src/components/Button.tsx',
      },
      {
        source: 'apps/admin/src/components/AdminSidebar.tsx',
        target: 'packages/ui/src/components/Card.tsx',
      },
      {
        source: 'apps/admin/src/components/AdminSidebar.tsx',
        target: 'packages/ui/src/theme/index.ts',
      },
      {
        source: 'apps/admin/src/pages/Users.tsx',
        target: 'apps/admin/src/components/RoleTable.tsx',
      },
      {
        source: 'apps/admin/src/pages/Users.tsx',
        target: 'packages/ui/src/components/Table.tsx',
      },
      {
        source: 'apps/admin/src/pages/Users.tsx',
        target: 'packages/ui/src/components/Button.tsx',
      },
      {
        source: 'apps/admin/src/pages/Users.tsx',
        target: 'apps/admin/src/hooks/useAdminApi.ts',
      },
      {
        source: 'apps/admin/src/pages/Users.tsx',
        target: 'packages/types/src/user.ts',
      },
      {
        source: 'apps/admin/src/pages/Roles.tsx',
        target: 'apps/admin/src/components/RoleTable.tsx',
      },
      {
        source: 'apps/admin/src/pages/Roles.tsx',
        target: 'packages/ui/src/components/Table.tsx',
      },
      {
        source: 'apps/admin/src/pages/Roles.tsx',
        target: 'apps/admin/src/hooks/useAdminApi.ts',
      },
      {
        source: 'apps/admin/src/pages/Roles.tsx',
        target: 'packages/types/src/role.ts',
      },
      {
        source: 'apps/admin/src/components/RoleTable.tsx',
        target: 'packages/ui/src/components/Table.tsx',
      },
      {
        source: 'apps/admin/src/components/RoleTable.tsx',
        target: 'packages/types/src/role.ts',
      },
      {
        source: 'apps/admin/src/hooks/useAdminApi.ts',
        target: 'packages/utils/src/http.ts',
      },
      {
        source: 'apps/admin/src/hooks/useAdminApi.ts',
        target: 'packages/utils/src/logger.ts',
      },
      {
        source: 'apps/admin/src/hooks/useAdminApi.ts',
        target: 'packages/types/src/index.ts',
      },
      {
        source: 'apps/admin/src/hooks/useAdminApi.ts',
        target: 'services/api/src/router.ts',
      },
      {
        source: 'packages/ui/src/components/Button.tsx',
        target: 'packages/ui/src/theme/index.ts',
      },
      {
        source: 'packages/ui/src/components/Card.tsx',
        target: 'packages/ui/src/theme/index.ts',
      },
      {
        source: 'packages/ui/src/components/Table.tsx',
        target: 'packages/ui/src/theme/index.ts',
      },
      {
        source: 'packages/ui/src/theme/index.ts',
        target: 'packages/types/src/index.ts',
      },
      {
        source: 'packages/utils/src/formatters.ts',
        target: 'packages/types/src/index.ts',
      },
      {
        source: 'packages/utils/src/formatters.ts',
        target: 'packages/types/src/user.ts',
      },
      {
        source: 'packages/utils/src/formatters.ts',
        target: 'packages/types/src/role.ts',
      },
      {
        source: 'packages/utils/src/http.ts',
        target: 'packages/utils/src/logger.ts',
      },
      {
        source: 'packages/utils/src/http.ts',
        target: 'packages/types/src/index.ts',
      },
      {
        source: 'packages/utils/src/logger.ts',
        target: 'services/api/src/config/env.ts',
      },
      {
        source: 'packages/types/src/index.ts',
        target: 'packages/types/src/user.ts',
      },
      {
        source: 'packages/types/src/index.ts',
        target: 'packages/types/src/role.ts',
      },
      {
        source: 'services/api/src/index.ts',
        target: 'services/api/src/router.ts',
      },
      {
        source: 'services/api/src/index.ts',
        target: 'services/api/src/config/env.ts',
      },
      {
        source: 'services/api/src/index.ts',
        target: 'services/api/src/middleware/auth.ts',
      },
      {
        source: 'services/api/src/index.ts',
        target: 'services/db/src/index.ts',
      },
      {
        source: 'services/api/src/router.ts',
        target: 'services/api/src/routes/userRoutes.ts',
      },
      {
        source: 'services/api/src/router.ts',
        target: 'services/api/src/routes/roleRoutes.ts',
      },
      {
        source: 'services/api/src/router.ts',
        target: 'services/api/src/middleware/auth.ts',
      },
      {
        source: 'services/api/src/routes/userRoutes.ts',
        target: 'services/api/src/controllers/userController.ts',
      },
      {
        source: 'services/api/src/routes/userRoutes.ts',
        target: 'services/api/src/middleware/auth.ts',
      },
      {
        source: 'services/api/src/routes/roleRoutes.ts',
        target: 'services/api/src/controllers/roleController.ts',
      },
      {
        source: 'services/api/src/routes/roleRoutes.ts',
        target: 'services/api/src/middleware/auth.ts',
      },
      {
        source: 'services/api/src/controllers/userController.ts',
        target: 'services/api/src/services/userService.ts',
      },
      {
        source: 'services/api/src/controllers/userController.ts',
        target: 'packages/types/src/user.ts',
      },
      {
        source: 'services/api/src/controllers/roleController.ts',
        target: 'services/api/src/services/roleService.ts',
      },
      {
        source: 'services/api/src/controllers/roleController.ts',
        target: 'packages/types/src/role.ts',
      },
      {
        source: 'services/api/src/services/userService.ts',
        target: 'services/db/src/schema/userSchema.ts',
      },
      {
        source: 'services/api/src/services/userService.ts',
        target: 'packages/utils/src/logger.ts',
      },
      {
        source: 'services/api/src/services/userService.ts',
        target: 'services/db/src/index.ts',
      },
      {
        source: 'services/api/src/services/roleService.ts',
        target: 'services/db/src/schema/roleSchema.ts',
      },
      {
        source: 'services/api/src/services/roleService.ts',
        target: 'packages/utils/src/logger.ts',
      },
      {
        source: 'services/api/src/services/roleService.ts',
        target: 'services/db/src/index.ts',
      },
      {
        source: 'services/api/src/middleware/auth.ts',
        target: 'packages/utils/src/logger.ts',
      },
      {
        source: 'services/api/src/middleware/auth.ts',
        target: 'packages/types/src/user.ts',
      },
      {
        source: 'services/db/src/index.ts',
        target: 'services/db/src/connections/pool.ts',
      },
      {
        source: 'services/db/src/index.ts',
        target: 'services/db/src/schema/userSchema.ts',
      },
      {
        source: 'services/db/src/index.ts',
        target: 'services/db/src/schema/roleSchema.ts',
      },
      {
        source: 'services/db/src/connections/pool.ts',
        target: 'services/api/src/config/env.ts',
      },
      {
        source: 'services/db/src/schema/userSchema.ts',
        target: 'packages/types/src/user.ts',
      },
      {
        source: 'services/db/src/schema/roleSchema.ts',
        target: 'packages/types/src/role.ts',
      },
      {
        source: 'config/eslint.config.js',
        target: 'packages/types/src/index.ts',
      },
      {
        source: 'config/tailwind.config.ts',
        target: 'packages/ui/src/theme/index.ts',
      },
      { source: 'scripts/deploy.ts', target: 'infra/terraform/main.tf' },
      {
        source: 'scripts/deploy.ts',
        target: 'infra/docker/docker-compose.yml',
      },
      { source: 'scripts/deploy.ts', target: 'services/api/src/index.ts' },
      { source: 'scripts/seed.ts', target: 'services/db/src/index.ts' },
      {
        source: 'scripts/seed.ts',
        target: 'services/api/src/services/userService.ts',
      },
      {
        source: 'infra/docker/docker-compose.yml',
        target: 'services/api/src/index.ts',
      },
      {
        source: 'infra/docker/docker-compose.yml',
        target: 'services/db/src/index.ts',
      },
      {
        source: 'infra/terraform/main.tf',
        target: 'services/api/src/index.ts',
      },
      { source: 'infra/terraform/main.tf', target: 'services/db/src/index.ts' },
      { source: 'docs/architecture.md', target: 'infra/terraform/main.tf' },
      { source: 'docs/architecture.md', target: 'services/api/src/index.ts' },
      { source: 'docs/architecture.md', target: 'apps/web/src/App.tsx' },
    ],
  };

  const linksBySource = useMemo(() => {
    const map = new Map<string, string[]>();
    data.links.forEach(({ source, target }) => {
      if (!map.has(source)) map.set(source, []);
      map.get(source)!.push(target);
    });
    return map;
  }, [data.links]);

  const linksByTarget = useMemo(() => {
    const map = new Map<string, string[]>();
    data.links.forEach(({ source, target }) => {
      if (!map.has(target)) map.set(target, []);
      map.get(target)!.push(source);
    });
    return map;
  }, [data.links]);

  // Transform data to React Flow format with dynamic handle assignment
  const initialNodes: Node[] = useMemo(() => {
    const verticalSpacing = 320;
    const horizontalSpacing = 520;
    const nodeSpacing = horizontalSpacing;
    const levelHeight = verticalSpacing;

    // Create positions based on dependency depth
    const getNodeLevel = (nodeId: string): number => {
      const incomingEdges = data.links.filter(link => link.target === nodeId);
      if (incomingEdges.length === 0) return 0; // Root node

      const sourceNodes = incomingEdges.map(edge => edge.source);
      const maxSourceLevel = Math.max(...sourceNodes.map(getNodeLevel));
      return maxSourceLevel + 1;
    };

    // Calculate positions
    const nodesByLevel = new Map<number, string[]>();
    const nodePositions = new Map<
      string,
      { x: number; y: number; level: number }
    >();

    data.nodes.forEach(node => {
      const level = getNodeLevel(node.id);
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(node.id);
    });

    // Position nodes
    nodesByLevel.forEach((nodesAtLevel, level) => {
      const totalWidth = (nodesAtLevel.length - 1) * nodeSpacing;
      const startX = -totalWidth / 2;

      nodesAtLevel.forEach((nodeId, index) => {
        nodePositions.set(nodeId, {
          x: startX + index * nodeSpacing,
          y: level * levelHeight,
          level,
        });
      });
    });

    return data.nodes.map(node => {
      const position = nodePositions.get(node.id) || { x: 0, y: 0 };
      const fileName = node.id.split('/').pop() || node.id;
      const fullPath = node.id;
      const sourceCount = linksBySource.get(node.id)?.length ?? 0;
      const targetCount = linksByTarget.get(node.id)?.length ?? 0;

      return {
        id: node.id,
        position,
        data: {
          fileName,
          fullPath,
          sourceCount,
          targetCount,
        },
        type: 'customFile',
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    });
  }, [data.nodes, data.links, linksBySource, linksByTarget]);

  const initialEdges: Edge[] = useMemo(() => {
    const sourceCounters = new Map<string, number>();
    const targetCounters = new Map<string, number>();

    return data.links.map((link, index) => {
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
      };
    });
  }, [data.links]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
        background: '#0e1b53ff',
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
        fitView
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
