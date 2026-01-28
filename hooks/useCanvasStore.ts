'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CanvasNode, GeneratorNodeData, ContentNodeData, ComponentNodeData, Data2UINodeData, AliasMap, MessageContentPart } from '../lib/types';
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
    data2ui: number;
  };
  isDarkMode: boolean;

  // Theme
  toggleDarkMode: () => void;

  // Node actions
  addNode: (type: 'generator' | 'content' | 'component' | 'data2ui', position?: { x: number; y: number }) => void;
  addContentNodeWithFile: (fileData: { fileName: string; fileType: string; fileSize: number; data: string }, position?: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  removeNode: (nodeId: string) => void;
  setNodes: (nodes: CanvasNode[]) => void;
  
  // Selection
  selectNode: (nodeId: string | null) => void;
  
  // Alias resolution
  getAliasMap: () => AliasMap;
  resolveAlias: (alias: string) => string;
  resolveAllAliases: (text: string) => string;
  buildMessageContent: (text: string) => MessageContentPart[];
  getNodeByAlias: (alias: string) => CanvasNode | undefined;
  
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
    return { nodes: [], counters: { generator: 0, content: 0, component: 0, data2ui: 0 } };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        nodes: parsed.nodes || [],
        counters: parsed.counters || { generator: 0, content: 0, component: 0, data2ui: 0 },
      };
    }
  } catch {
    // Ignore parse errors
  }
  
  return { nodes: [], counters: { generator: 0, content: 0, component: 0, data2ui: 0 } };
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
  isDarkMode: false,

  toggleDarkMode: () => {
    set({ isDarkMode: !get().isDarkMode });
  },

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
      case 'data2ui':
        newNode = {
          id,
          type: 'data2ui',
          position,
          data: {
            type: 'data2ui',
            alias: `${ALIAS_PREFIXES.data2ui}-${newCount}`,
            sourceAlias: '',
            outputPath: '',
            width: BOX_DEFAULTS.data2ui.width,
            height: BOX_DEFAULTS.data2ui.height,
          } as Data2UINodeData,
        };
        break;
    }

    set({
      nodes: [...nodes, newNode],
      counters: { ...counters, [type]: newCount },
      selectedNodeId: id,
    });
  },

  addContentNodeWithFile: (fileData, position = { x: 100, y: 100 }) => {
    const { counters, nodes } = get();
    const newCount = counters.content + 1;
    const id = generateId();

    const newNode: CanvasNode = {
      id,
      type: 'content',
      position,
      data: {
        type: 'content',
        alias: `${ALIAS_PREFIXES.content}-${newCount}`,
        fileData,
        width: BOX_DEFAULTS.content.width,
        height: BOX_DEFAULTS.content.height,
      } as ContentNodeData,
    };

    set({
      nodes: [...nodes, newNode],
      counters: { ...counters, content: newCount },
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
        // For content nodes with files, use filename; otherwise use text content
        value = data.fileData ? `[File: ${data.fileData.fileName}]` : (data.content || '');
      } else if (data.type === 'component') {
        value = `[Component: ${data.componentKey}]`;
      } else if (data.type === 'data2ui') {
        value = `[Data2UI: ${data.outputPath}]`;
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

  getNodeByAlias: (alias) => {
    const { nodes } = get();
    return nodes.find((node) => node.data.alias === alias);
  },

  buildMessageContent: (text) => {
    const { nodes } = get();
    const parts: MessageContentPart[] = [];

    // Find all @alias references and their positions
    const aliasRegex = /@([\w-]+)/g;
    let lastIndex = 0;
    let match;

    while ((match = aliasRegex.exec(text)) !== null) {
      const alias = match[1];
      const matchStart = match.index;

      // Add text before this match
      if (matchStart > lastIndex) {
        const textBefore = text.slice(lastIndex, matchStart);
        if (textBefore.trim()) {
          parts.push({ type: 'text', text: textBefore });
        }
      }

      // Find the referenced node
      const referencedNode = nodes.find((n) => n.data.alias === alias);

      if (referencedNode) {
        const data = referencedNode.data;

        if (data.type === 'content') {
          if (data.fileData) {
            const { fileType, data: base64Data, fileName } = data.fileData;

            // Handle different file types according to AI SDK capabilities
            if (fileType.startsWith('image/')) {
              // Images: use image part
              parts.push({
                type: 'image',
                image: base64Data,
                mimeType: fileType,
              });
            } else if (fileType === 'application/pdf') {
              // PDFs: use file part
              parts.push({
                type: 'file',
                data: base64Data,
                mimeType: fileType,
              });
            } else if (fileType.startsWith('text/') || fileType === 'application/json') {
              // Text files: decode and include as text
              try {
                const textContent = atob(base64Data);
                parts.push({
                  type: 'text',
                  text: `[File: ${fileName}]\n${textContent}`,
                });
              } catch {
                parts.push({
                  type: 'text',
                  text: `[File: ${fileName} - unable to decode]`,
                });
              }
            } else if (
              fileType.startsWith('audio/') ||
              fileType.includes('excel') ||
              fileType.includes('spreadsheet') ||
              fileType.includes('word') ||
              fileType.includes('document')
            ) {
              // Audio and document files: use file part
              parts.push({
                type: 'file',
                data: base64Data,
                mimeType: fileType,
              });
            } else {
              // Unsupported file types: add as text placeholder
              parts.push({
                type: 'text',
                text: `[Attached file: ${fileName} (${fileType})]`,
              });
            }
          } else {
            // Text content box
            parts.push({
              type: 'text',
              text: data.content || '',
            });
          }
        } else if (data.type === 'generator') {
          // Generator output
          parts.push({
            type: 'text',
            text: data.output || '',
          });
        } else {
          // Other node types - just include as text placeholder
          parts.push({
            type: 'text',
            text: `@${alias}`,
          });
        }
      } else {
        // Alias not found - keep as is
        parts.push({
          type: 'text',
          text: `@${alias}`,
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last match
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText.trim()) {
        parts.push({ type: 'text', text: remainingText });
      }
    }

    // If no parts were created (no aliases), just return the whole text
    if (parts.length === 0 && text.trim()) {
      parts.push({ type: 'text', text });
    }

    return parts;
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
        counters: parsed.counters || { generator: 0, content: 0, component: 0, data2ui: 0 },
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
      counters: { generator: 0, content: 0, component: 0, data2ui: 0 },
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
