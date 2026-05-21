import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

import { AccountingNodeData } from '@/core/types';

export type AccountNode = Node<AccountingNodeData>;

type AccountState = {
  nodes: AccountNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<AccountNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: AccountNode) => void;
  updateNodeData: (nodeId: string, data: Partial<AccountingNodeData>) => void;
  removeNode: (nodeId: string) => void;
  clearAll: () => void;
};

/**
 * Check if there is a path from startId to endId in the directed graph defined by edges.
 * Used for cycle detection.
 */
function isReachable(startId: string, endId: string, edges: Edge[]): boolean {
  if (startId === endId) return true;
  const visited = new Set<string>();
  const queue: string[] = [startId];
  visited.add(startId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === endId) return true;

    for (const edge of edges) {
      if (edge.source === current && !visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push(edge.target);
      }
    }
  }
  return false;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes: NodeChange<AccountNode>[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    const currentEdges = get().edges;
    // Prevent cycle: if target node can reach source node, adding source -> target creates a cycle.
    if (connection.target && connection.source && isReachable(connection.target, connection.source, currentEdges)) {
      console.warn("Cycle detected! Connection rejected.");
      return;
    }
    set({
      edges: addEdge(connection, currentEdges),
    });
  },
  addNode: (node: AccountNode) => {
    set({ nodes: [...get().nodes, node] });
  },
  updateNodeData: (nodeId: string, data: Partial<AccountingNodeData>) => {
    const nodes = get().nodes;
    const idx = nodes.findIndex(n => n.id === nodeId);
    if (idx === -1) return;
    
    const node = nodes[idx];
    const newData = { ...node.data, ...data };
    
    // Bail out if data hasn't actually changed (shallow compare of vals)
    if (data.vals && node.data.vals) {
      const oldVals = node.data.vals;
      const newVals = data.vals;
      const valsChanged = Object.keys(newVals).some(k => newVals[k] !== oldVals[k]) 
        || Object.keys(oldVals).some(k => !(k in newVals));
      
      const otherKeysChanged = 
        (data.calcKeys !== undefined && JSON.stringify(data.calcKeys) !== JSON.stringify(node.data.calcKeys)) ||
        (data.manualKeys !== undefined && JSON.stringify(data.manualKeys) !== JSON.stringify(node.data.manualKeys)) ||
        (data.error !== undefined && data.error !== node.data.error) ||
        (data.inheritedKeys !== undefined && JSON.stringify(data.inheritedKeys) !== JSON.stringify(node.data.inheritedKeys)) ||
        (data.decision !== undefined && data.decision !== node.data.decision) ||
        (data.helpersVals !== undefined && JSON.stringify(data.helpersVals) !== JSON.stringify(node.data.helpersVals));
      
      if (!valsChanged && !otherKeysChanged) return; // Skip update — nothing changed
    }
    
    // Create new array reference
    const newNodes = nodes.slice();
    newNodes[idx] = { ...node, data: newData };
    set({ nodes: newNodes });
  },
  removeNode: (nodeId: string) => {
    set({ nodes: get().nodes.filter((n) => n.id !== nodeId) });
  },
  clearAll: () => {
    set({ nodes: [], edges: [] });
  },
}));

// ── Stable selector hooks to prevent unnecessary re-renders ──

/** Subscribe only to the store actions (never changes — functions are stable) */
export const useAccountActions = () =>
  useAccountStore(
    useShallow((s) => ({
      updateNodeData: s.updateNodeData,
      removeNode: s.removeNode,
      addNode: s.addNode,
      clearAll: s.clearAll,
      onNodesChange: s.onNodesChange,
      onEdgesChange: s.onEdgesChange,
      onConnect: s.onConnect,
    }))
  );

/** Get incoming edge source IDs for a given node */
export const useIncomingSourceIds = (nodeId: string): string[] =>
  useAccountStore(
    useShallow((s) => s.edges.filter(e => e.target === nodeId).map(e => e.source))
  );

/** Get upstream values for a node (only re-renders when upstream vals actually change) */
export const useUpstreamValues = (nodeId: string): Record<string, number> => {
  const sourceIds = useIncomingSourceIds(nodeId);

  return useAccountStore(
    useShallow((s) => {
      const inherited: Record<string, number> = {};
      const nodesMap = new Map(s.nodes.map(n => [n.id, n]));

      sourceIds.forEach(srcId => {
        const srcNode = nodesMap.get(srcId);
        if (srcNode?.data.vals) {
          Object.keys(srcNode.data.vals).forEach(k => {
            const v = srcNode.data.vals[k];
            if (v !== null && v !== undefined) inherited[k] = v;
          });
        }
      });
      return inherited;
    })
  );
};
