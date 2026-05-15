import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  useReactFlow,
  ReactFlowProvider,
  BaseEdge,
  EdgeProps,
  getBezierPath
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAccountStore } from '@/store/accountStore';
import { BrutalNode } from '@/components/ui/BrutalNode';

import { MODULES } from '@/core/modules';

const CustomCurvedEdge = (props: EdgeProps) => {
  const { id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style } = props;
  
  const nodes = useAccountStore(state => state.nodes);
  const sourceNode = nodes.find(n => n.id === source);
  const targetNode = nodes.find(n => n.id === target);

  const sourceColor = sourceNode ? MODULES.find(m => m.id === sourceNode.data.defId)?.color || '#000' : '#000';
  const targetColor = targetNode ? MODULES.find(m => m.id === targetNode.data.defId)?.color || '#000' : '#000';

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
        style={{ ...style, stroke: `url(#gradient-${id})`, strokeWidth: 5 }} 
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

const FlowCanvasCore = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useAccountStore();

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
          style: { strokeWidth: 4, stroke: '#000' },
          type: 'custom'
        }}
        connectionLineStyle={{ strokeWidth: 4, stroke: '#000' }}
      >
        <Controls />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-70">
          <div className="text-6xl mb-4">📊</div>
          <div className="bg-white border-4 border-black border-dashed p-6 font-black text-2xl text-center" style={{ fontFamily: 'Cairo, sans-serif' }}>
            اسحب أي موديول هنا<br />لإجراء الحسابات فوراً
          </div>
        </div>
      )}
    </div>
  );
};

export const FlowCanvas = () => (
    <ReactFlowProvider>
        <FlowCanvasCore />
    </ReactFlowProvider>
);
