import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  useReactFlow,
  BaseEdge,
  EdgeProps,
  getBezierPath,
  Background,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAccountStore, useAccountActions } from '@/store/accountStore';
import { useSettingsStore } from '@/store/settingsStore';
import { BrutalNode } from '@/components/ui/BrutalNode';
import { getNodeThemeStyle } from '@/core/themeColors';

import { MODULES } from '@/core/modules';
import { useTranslation } from '@/lib/i18n';
import { LayoutGrid } from 'lucide-react';

const CustomCurvedEdge = (props: EdgeProps) => {
  const { id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style } = props;
  
  const nodes = useAccountStore(state => state.nodes);
  const sourceNode = nodes.find(n => n.id === source);
  const targetNode = nodes.find(n => n.id === target);
  const theme = useSettingsStore(state => state.theme);
  const isMinimal = theme === 'quiet' || theme === 'google';

  const sourceDefId = sourceNode?.data.defId || '';
  const targetDefId = targetNode?.data.defId || '';
  const darkMode = useSettingsStore(state => state.darkMode);

  const sourceColor = sourceNode 
    ? (theme === 'google' 
        ? getNodeThemeStyle(sourceDefId, theme, darkMode, '#000').primaryColor 
        : MODULES.find(m => m.id === sourceDefId)?.color || '#000') 
    : '#000';
  const targetColor = targetNode 
    ? (theme === 'google' 
        ? getNodeThemeStyle(targetDefId, theme, darkMode, '#000').primaryColor 
        : MODULES.find(m => m.id === targetDefId)?.color || '#000') 
    : '#000';

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.8,
  });

  return (
    <>
      <defs>
        <linearGradient id={`gradient-${id}`} gradientUnits="userSpaceOnUse" x1={sourceX} y1={sourceY} x2={targetX} y2={targetY}>
          <stop offset="0%" stopColor={sourceColor} />
          <stop offset="100%" stopColor={targetColor} />
        </linearGradient>
      </defs>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={{ ...style, stroke: `url(#gradient-${id})`, strokeWidth: isMinimal ? 2.5 : 5 }} 
      />
    </>
  );
};

const nodeTypes = {
  brutalNode: BrutalNode,
};

const edgeTypes = {
  custom: CustomCurvedEdge,
};

import { useGlobalShortcuts } from '@/features/settings/useGlobalShortcuts';

const FlowCanvasCore = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const t = useTranslation();
  useGlobalShortcuts();
  
  const nodes = useAccountStore((s) => s.nodes);
  const edges = useAccountStore((s) => s.edges);
  const theme = useSettingsStore((s) => s.theme);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const isMinimal = theme === 'quiet' || theme === 'google';
  const { onNodesChange, onEdgesChange, onConnect, addNode } = useAccountActions();

  const connectionLineColor = theme === 'google'
    ? (darkMode ? '#8ab4f8' : '#1a73e8')
    : theme === 'quiet'
      ? (darkMode ? '#a5b4fc' : '#4f46e5')
      : '#000';

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const defId = event.dataTransfer.getData('application/reactflow');
      if (typeof defId === 'undefined' || !defId) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${defId}_${Date.now()}`,
        type: 'brutalNode',
        position,
        data: { defId, vals: {}, calcKeys: [], manualKeys: [] },
      };

      addNode(newNode as import('@/store/accountStore').AccountNode);
    },
    [screenToFlowPosition, addNode],
  );

  return (
    <div className="flex-1 relative" style={{ width: '100%', height: '100%' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.5}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ 
          style: { strokeWidth: isMinimal ? 2.5 : 4, stroke: connectionLineColor },
          type: 'custom'
        }}
        connectionLineStyle={{ strokeWidth: isMinimal ? 2.5 : 4, stroke: connectionLineColor }}
      >
        <Controls />
        {theme === 'google' && (
          <Background 
            variant={BackgroundVariant.Lines} 
            gap={30} 
            color={darkMode ? '#3c4043' : '#e8eaed'} 
            lineWidth={1}
          />
        )}
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-70">
          <LayoutGrid size={48} strokeWidth={1.5} style={{ marginBottom: '16px', opacity: 0.4 }} />
          <div
            className={
              theme === 'google'
                ? "p-6 text-2xl text-center font-bold transition-all duration-300"
                : "bg-white border-4 border-black border-dashed p-6 font-black text-2xl text-center"
            }
            style={{
              fontFamily: 'Cairo, sans-serif',
              backgroundColor: theme === 'google' ? (darkMode ? '#2d2f31' : '#ffffff') : undefined,
              color: theme === 'google' ? (darkMode ? '#e8eaed' : '#202124') : undefined,
              border: theme === 'google' ? `1px dashed ${darkMode ? '#5f6368' : '#dadce0'}` : undefined,
              borderRadius: theme === 'google' ? '12px' : undefined,
              boxShadow: theme === 'google' ? 'none' : undefined,
            }}
          >
            {t('canvas.drag_hint_1')}<br />{t('canvas.drag_hint_2')}
          </div>
        </div>
      )}
    </div>
  );
};

export const FlowCanvas = () => (
    <FlowCanvasCore />
);

