import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAccountStore } from '@/store/accountStore';
import { BrutalNode } from '@/components/ui/BrutalNode';

const nodeTypes = {
  brutalNode: BrutalNode,
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
    <div className="flex-1 h-full w-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        minZoom={0.5}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
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
