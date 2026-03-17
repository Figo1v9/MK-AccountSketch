import { create } from 'zustand'
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
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  addNode: (node: AccountNode) => {
    set({ nodes: [...get().nodes, node] });
  },
  updateNodeData: (nodeId: string, data: Partial<AccountingNodeData>) => {
    set({
      nodes: get().nodes.map((n) => {
        if (n.id === nodeId) {
          return { ...n, data: { ...n.data, ...data } };
        }
        return n;
      }),
    });
  },
  removeNode: (nodeId: string) => {
    set({ nodes: get().nodes.filter((n) => n.id !== nodeId) });
  },
  clearAll: () => {
    set({ nodes: [], edges: [] });
  }
}));
