'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CanvasNode, GeneratorNodeData, ContentNodeData, ComponentNodeData, AliasMap } from '../lib/types';
import { BOX_DEFAULTS, ALIAS_PREFIXES } from '../lib/constants';

const STORAGE_KEY = 'uwu-canvas-storage';
const AUTO_SAVE_DELAY = 1000; // 1 second debounce

interface CanvasStore {
  // State
  nodes: CanvasNode[];
  selectedNodeId: string | null;
  counters: {
    generator: number;
    content: number;
    component: number;
  };

  // Node actions
  addNode: (type: 'generator' | 'content' | 'component', position?: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  removeNode: (nodeId: string) => void;
  setNodes: (nodes: CanvasNode[]) => void;
  
  // Selection
  selectNode: (nodeId: string | null) => void;
  
  // Alias resolution
  getAliasMap: () => AliasMap;
  resolveAlias: (alias: string) => string;
  resolveAllAliases: (text: string) => string;
  
  // Generator specific
  setGeneratorOutput: (nodeId: string, output: string) => void;
  setGeneratorRunning: (nodeId: string, isRunning: boolean) => void;
  
  // Storage
  saveToStorage: () => void;
  loadFromStorage: () => void;
  
  // Clear
  clearCanvas: () => void;
}

const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Load initial state from localStorage
const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { nodes: [], counters: { generator: 0, content: 0, component: 0 } };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        nodes: parsed.nodes || [],
        counters: parsed.counters || { generator: 0, content: 0, component: 0 },
      };
    }
  } catch {
    // Ignore parse errors
  }
  
  return { nodes: [], counters: { generator: 0, content: 0, component: 0 } };
};

const initialState = getInitialState();

// Debounce timer for auto-save
let saveTimeout: NodeJS.Timeout | null = null;

const debouncedSave = (nodes: CanvasNode[], counters: CanvasStore['counters']) => {
  if (typeof window === 'undefined') return;
  
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, counters }));
    } catch {
      // Ignore storage errors
    }
  }, AUTO_SAVE_DELAY);
};

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector((set, get) => ({
  nodes: initialState.nodes,
  selectedNodeId: null,
  counters: initialState.counters,

  addNode: (type, position = { x: 100, y: 100 }) => {
    const { counters, nodes } = get();
    const newCount = counters[type] + 1;
    const id = generateId();
    
    let newNode: CanvasNode;
    
    switch (type) {
      case 'generator':
        newNode = {
          id,
          type: 'generator',
          position,
          data: {
            type: 'generator',
            alias: `${ALIAS_PREFIXES.generator}-${newCount}`,
            input: '',
            output: '',
            isRunning: false,
            provider: undefined,
            model: undefined,
            width: BOX_DEFAULTS.generator.width,
            height: BOX_DEFAULTS.generator.height,
          } as GeneratorNodeData,
        };
        break;
      case 'content':
        newNode = {
          id,
          type: 'content',
          position,
          data: {
            type: 'content',
            alias: `${ALIAS_PREFIXES.content}-${newCount}`,
            content: '',
            width: BOX_DEFAULTS.content.width,
            height: BOX_DEFAULTS.content.height,
          } as ContentNodeData,
        };
        break;
      case 'component':
        newNode = {
          id,
          type: 'component',
          position,
          data: {
            type: 'component',
            alias: `${ALIAS_PREFIXES.component}-${newCount}`,
            componentKey: '',
            viewMode: 'mobile',
            width: BOX_DEFAULTS.component.mobile.width,
            height: BOX_DEFAULTS.component.mobile.height,
          } as ComponentNodeData,
        };
        break;
    }
    
    set({
      nodes: [...nodes, newNode],
      counters: { ...counters, [type]: newCount },
      selectedNodeId: id,
    });
  },

  updateNode: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ) as CanvasNode[],
    });
  },

  removeNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  setNodes: (nodes) => {
    set({ nodes });
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  getAliasMap: () => {
    const { nodes } = get();
    const map: AliasMap = {};
    
    nodes.forEach((node) => {
      const data = node.data;
      let value = '';
      
      if (data.type === 'generator') {
        value = data.output;
      } else if (data.type === 'content') {
        value = data.content;
      } else if (data.type === 'component') {
        value = `[Component: ${data.componentKey}]`;
      }
      
      map[data.alias] = {
        nodeId: node.id,
        type: data.type,
        value,
      };
    });
    
    return map;
  },

  resolveAlias: (alias) => {
    const map = get().getAliasMap();
    return map[alias]?.value ?? `@${alias}`;
  },

  resolveAllAliases: (text) => {
    const map = get().getAliasMap();
    return text.replace(/@([\w-]+)/g, (match, alias) => {
      return map[alias]?.value ?? match;
    });
  },

  setGeneratorOutput: (nodeId, output) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId && node.data.type === 'generator'
          ? { ...node, data: { ...node.data, output } }
          : node
      ) as CanvasNode[],
    });
  },

  setGeneratorRunning: (nodeId, isRunning) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId && node.data.type === 'generator'
          ? { ...node, data: { ...node.data, isRunning } }
          : node
      ) as CanvasNode[],
    });
  },

  saveToStorage: () => {
    const { nodes, counters } = get();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, counters }));
    } catch {
      // Ignore storage errors
    }
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          nodes: parsed.nodes || [],
          counters: parsed.counters || { generator: 0, content: 0, component: 0 },
        });
      }
    } catch {
      // Ignore parse errors
    }
  },

  clearCanvas: () => {
    set({
      nodes: [],
      selectedNodeId: null,
      counters: { generator: 0, content: 0, component: 0 },
    });
  },
})));

// Subscribe to changes and auto-save with debounce
if (typeof window !== 'undefined') {
  useCanvasStore.subscribe(
    (state) => ({ nodes: state.nodes, counters: state.counters }),
    (state) => {
      debouncedSave(state.nodes, state.counters);
    },
    { equalityFn: (a, b) => a.nodes === b.nodes && a.counters === b.counters }
  );
}
