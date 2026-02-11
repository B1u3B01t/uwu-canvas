'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CanvasNode, GeneratorNodeData, ContentNodeData, ComponentNodeData, Data2UINodeData, FolderNodeData, FolderColor, AliasMap, MessageContentPart, Pulse } from '../lib/types';
import { isFolderNode } from '../lib/types';
import { BOX_DEFAULTS, ALIAS_PREFIXES } from '../lib/constants';

const STORAGE_KEY = 'uwu-canvas-storage';
const DARK_MODE_KEY = 'uwu-canvas-dark-mode';
const STORAGE_VERSION = 1;
const AUTO_SAVE_DELAY = 1000; // 1 second debounce
const UNDO_TIMEOUT = 5000; // 5 seconds to undo

interface CanvasStore {
  // State
  nodes: CanvasNode[];
  selectedNodeId: string | null;
  counters: {
    generator: number;
    content: number;
    component: number;
    data2ui: number;
    folder: number;
  };
  isDarkMode: boolean;

  // Pulse effects
  pulses: Pulse[];

  // Deletion animation & undo
  deletingNodeIds: Set<string>;
  lastDeletedNode: CanvasNode | null;

  // Duplicate alias toast
  duplicateAliasToast: string | null;
  showDuplicateAliasToast: (alias: string) => void;
  isAliasUnique: (alias: string, nodeId: string) => boolean;

  // Theme
  toggleDarkMode: () => void;

  // Node actions
  addNode: (type: 'generator' | 'content' | 'component' | 'data2ui' | 'folder', position?: { x: number; y: number }) => string;
  addContentNodeWithFile: (fileData: { fileName: string; fileType: string; fileSize: number; data: string }, position?: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  removeNode: (nodeId: string) => void;
  markNodeForDeletion: (nodeId: string) => void;
  undoDelete: () => void;
  clearUndoState: () => void;
  setNodes: (nodes: CanvasNode[]) => void;

  // Selection
  selectNode: (nodeId: string | null) => void;

  // Folder actions
  addNodeToFolder: (folderId: string, nodeId: string) => void;
  removeNodeFromFolder: (folderId: string, nodeId: string) => void;
  reorderFolderChildren: (folderId: string, childNodeIds: string[]) => void;
  toggleFolderExpanded: (folderId: string) => void;
  getFolderForNode: (nodeId: string) => string | null;
  setFolderColor: (folderId: string, color: FolderColor) => void;
  ungroupFolder: (folderId: string) => void;
  createFolderWithNode: (nodeId: string, position: { x: number; y: number }) => void;

  // Alias resolution
  getAliasMap: () => AliasMap;
  resolveAlias: (alias: string) => string;
  resolveAllAliases: (text: string) => string;
  buildMessageContent: (text: string) => MessageContentPart[];
  getNodeByAlias: (alias: string) => CanvasNode | undefined;

  // Pulse effects
  triggerPulse: (nodeId: string) => void;
  removePulse: (pulseId: string) => void;

  // Generator specific
  setGeneratorOutput: (nodeId: string, output: string) => void;
  setGeneratorRunning: (nodeId: string, isRunning: boolean) => void;
  setGeneratorError: (nodeId: string, error: string) => void;
  clearGeneratorError: (nodeId: string) => void;

  // Storage
  saveToStorage: () => void;
  loadFromStorage: () => void;

  // Clear
  clearCanvas: () => void;
}

const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Load dark mode preference from localStorage
const getInitialDarkMode = () => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(DARK_MODE_KEY) === 'true';
  } catch {
    return false;
  }
};

// Load initial state from localStorage with version migration
const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { nodes: [], counters: { generator: 0, content: 0, component: 0, data2ui: 0, folder: 0 } };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Handle versioned and legacy formats
      const nodes = parsed.nodes || [];
      const counters = parsed.counters || { generator: 0, content: 0, component: 0, data2ui: 0, folder: 0 };
      // Migrate: ensure folder counter exists
      if (counters.folder === undefined) counters.folder = 0;

      // Migrate legacy format (no version field) to versioned
      if (!parsed.version) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, nodes, counters }));
      }

      return { nodes, counters };
    }
  } catch {
    // Ignore parse errors
  }

  return { nodes: [], counters: { generator: 0, content: 0, component: 0, data2ui: 0, folder: 0 } };
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, nodes, counters }));
    } catch {
      // Ignore storage errors
    }
  }, AUTO_SAVE_DELAY);
};

// Timer for undo expiry
let undoTimeout: NodeJS.Timeout | null = null;

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector((set, get) => ({
  nodes: initialState.nodes,
  selectedNodeId: null,
  counters: initialState.counters,
  isDarkMode: getInitialDarkMode(),

  // Pulse effects
  pulses: [],

  // Deletion animation & undo
  deletingNodeIds: new Set<string>(),
  lastDeletedNode: null,

  // Duplicate alias toast
  duplicateAliasToast: null,

  showDuplicateAliasToast: (alias) => {
    set({ duplicateAliasToast: alias });
    setTimeout(() => {
      set({ duplicateAliasToast: null });
    }, 2500);
  },

  isAliasUnique: (alias, nodeId) => {
    const { nodes } = get();
    return !nodes.some((node) => node.id !== nodeId && node.data.alias === alias);
  },

  toggleDarkMode: () => {
    const newValue = !get().isDarkMode;
    set({ isDarkMode: newValue });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DARK_MODE_KEY, String(newValue));
      } catch {
        // Ignore storage errors
      }
    }
  },

  addNode: (type, position = { x: 100, y: 100 }) => {
    const { counters, nodes } = get();
    const existingAliases = new Set(nodes.map((n) => n.data.alias));
    let newCount = counters[type] + 1;
    // Ensure the generated alias is unique
    while (existingAliases.has(`${ALIAS_PREFIXES[type]}-${newCount}`)) {
      newCount++;
    }
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
      case 'folder':
        newNode = {
          id,
          type: 'folder',
          position,
          data: {
            type: 'folder',
            alias: `${ALIAS_PREFIXES.folder}-${newCount}`,
            childNodeIds: [],
            isExpanded: true,
            label: `Folder ${newCount}`,
            color: 'green',
            width: BOX_DEFAULTS.folder.width,
            height: BOX_DEFAULTS.folder.height,
          } as FolderNodeData,
        };
        break;
    }

    set({
      nodes: [...nodes, newNode],
      counters: { ...counters, [type]: newCount },
      selectedNodeId: id,
    });

    return id;
  },

  addContentNodeWithFile: (fileData, position = { x: 100, y: 100 }) => {
    const { counters, nodes } = get();
    const existingAliases = new Set(nodes.map((n) => n.data.alias));
    let newCount = counters.content + 1;
    while (existingAliases.has(`${ALIAS_PREFIXES.content}-${newCount}`)) {
      newCount++;
    }
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
    const nodeToDelete = get().nodes.find((node) => node.id === nodeId);

    // Save for undo
    if (nodeToDelete) {
      // Clear any previous undo timeout
      if (undoTimeout) {
        clearTimeout(undoTimeout);
      }

      set({
        lastDeletedNode: nodeToDelete,
      });

      // Auto-clear undo state after timeout
      undoTimeout = setTimeout(() => {
        set({ lastDeletedNode: null });
        undoTimeout = null;
      }, UNDO_TIMEOUT);
    }

    // Clean up folder relationships
    let updatedNodes = get().nodes;
    if (nodeToDelete) {
      updatedNodes = updatedNodes.map((node) => {
        if (!isFolderNode(node)) return node;
        // If deleting a non-folder node, remove it from any folder's childNodeIds
        if (node.data.childNodeIds.includes(nodeId)) {
          return {
            ...node,
            data: { ...node.data, childNodeIds: node.data.childNodeIds.filter((id) => id !== nodeId) },
          };
        }
        return node;
      }) as CanvasNode[];
    }

    set({
      nodes: updatedNodes.filter((node) => node.id !== nodeId),
      deletingNodeIds: new Set([...get().deletingNodeIds].filter(id => id !== nodeId)),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  markNodeForDeletion: (nodeId) => {
    const newSet = new Set(get().deletingNodeIds);
    newSet.add(nodeId);
    set({ deletingNodeIds: newSet });

    // After animation, actually remove
    setTimeout(() => {
      get().removeNode(nodeId);
    }, 200);
  },

  undoDelete: () => {
    const { lastDeletedNode, nodes } = get();
    if (!lastDeletedNode) return;

    // Clear the undo timeout
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      undoTimeout = null;
    }

    set({
      nodes: [...nodes, lastDeletedNode],
      lastDeletedNode: null,
    });
  },

  clearUndoState: () => {
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      undoTimeout = null;
    }
    set({ lastDeletedNode: null });
  },

  setNodes: (nodes) => {
    set({ nodes });
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  // Folder actions
  addNodeToFolder: (folderId, nodeId) => {
    const { nodes } = get();
    if (folderId === nodeId) return;
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode || isFolderNode(targetNode)) return;
    // Only content nodes can be added to folders
    if (targetNode.data.type !== 'content') return;
    const alreadyInFolder = nodes.some(
      (n) => isFolderNode(n) && n.data.childNodeIds.includes(nodeId)
    );
    if (alreadyInFolder) return;

    set({
      nodes: nodes.map((node) =>
        node.id === folderId && isFolderNode(node)
          ? { ...node, data: { ...node.data, childNodeIds: [...node.data.childNodeIds, nodeId] } }
          : node
      ) as CanvasNode[],
    });
  },

  removeNodeFromFolder: (folderId, nodeId) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === folderId && isFolderNode(node)
          ? { ...node, data: { ...node.data, childNodeIds: node.data.childNodeIds.filter((id) => id !== nodeId) } }
          : node
      ) as CanvasNode[],
    });
  },

  reorderFolderChildren: (folderId, childNodeIds) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === folderId && isFolderNode(node)
          ? { ...node, data: { ...node.data, childNodeIds } }
          : node
      ) as CanvasNode[],
    });
  },

  toggleFolderExpanded: (folderId) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === folderId && isFolderNode(node)
          ? { ...node, data: { ...node.data, isExpanded: !node.data.isExpanded } }
          : node
      ) as CanvasNode[],
    });
  },

  getFolderForNode: (nodeId) => {
    const { nodes } = get();
    const folder = nodes.find(
      (n) => isFolderNode(n) && n.data.childNodeIds.includes(nodeId)
    );
    return folder?.id ?? null;
  },

  setFolderColor: (folderId, color) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === folderId && isFolderNode(node)
          ? { ...node, data: { ...node.data, color } }
          : node
      ) as CanvasNode[],
    });
  },

  ungroupFolder: (folderId) => {
    set({
      nodes: get().nodes
        .map((node) =>
          node.id === folderId && isFolderNode(node)
            ? { ...node, data: { ...node.data, childNodeIds: [] } }
            : node
        )
        .filter((node) => node.id !== folderId) as CanvasNode[],
    });
  },

  createFolderWithNode: (nodeId, position) => {
    const targetNode = get().nodes.find((n) => n.id === nodeId);
    if (!targetNode || targetNode.data.type !== 'content') return;
    const folderId = get().addNode('folder', position);
    get().addNodeToFolder(folderId, nodeId);
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
      } else if (data.type === 'folder') {
        value = `[Folder: ${data.label} (${data.childNodeIds.length} items)]`;
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

    // Helper: resolve a single node's content into message parts
    const resolveNodeContent = (node: CanvasNode): MessageContentPart[] => {
      const data = node.data;
      const resolved: MessageContentPart[] = [];

      if (data.type === 'content') {
        if (data.fileData) {
          const { fileType, data: base64Data, fileName } = data.fileData;
          if (fileType.startsWith('image/')) {
            resolved.push({ type: 'image', image: base64Data, mimeType: fileType });
          } else if (fileType === 'application/pdf') {
            resolved.push({ type: 'file', data: base64Data, mimeType: fileType });
          } else if (fileType.startsWith('text/') || fileType === 'application/json') {
            try {
              const textContent = atob(base64Data);
              resolved.push({ type: 'text', text: `[File: ${fileName}]\n${textContent}` });
            } catch {
              resolved.push({ type: 'text', text: `[File: ${fileName} - unable to decode]` });
            }
          } else if (
            fileType.startsWith('audio/') ||
            fileType.includes('excel') ||
            fileType.includes('spreadsheet') ||
            fileType.includes('word') ||
            fileType.includes('document')
          ) {
            resolved.push({ type: 'file', data: base64Data, mimeType: fileType });
          } else {
            resolved.push({ type: 'text', text: `[Attached file: ${fileName} (${fileType})]` });
          }
        } else {
          resolved.push({ type: 'text', text: data.content || '' });
        }
      } else if (data.type === 'generator') {
        resolved.push({ type: 'text', text: data.output || '' });
      } else {
        resolved.push({ type: 'text', text: `@${data.alias}` });
      }

      return resolved;
    };

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
        if (isFolderNode(referencedNode)) {
          // Folder: expand all child contents
          parts.push({ type: 'text', text: `[Folder: ${referencedNode.data.label}]\n` });
          for (const childId of referencedNode.data.childNodeIds) {
            const childNode = nodes.find((n) => n.id === childId);
            if (childNode) {
              parts.push(...resolveNodeContent(childNode));
            }
          }
          parts.push({ type: 'text', text: `[End Folder: ${referencedNode.data.label}]\n` });
        } else {
          parts.push(...resolveNodeContent(referencedNode));
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

  triggerPulse: (nodeId) => {
    const node = get().nodes.find(n => n.id === nodeId);
    if (!node) return;
    const pulseId = `pulse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newPulse: Pulse = {
      id: pulseId,
      position: node.position,
      timestamp: Date.now(),
    };
    set({ pulses: [...get().pulses, newPulse] });
    setTimeout(() => {
      get().removePulse(pulseId);
    }, 2000);
  },

  removePulse: (pulseId) => {
    set({ pulses: get().pulses.filter(p => p.id !== pulseId) });
  },

  setGeneratorOutput: (nodeId, output) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId && node.data.type === 'generator'
          ? { ...node, data: { ...node.data, output, error: undefined } }
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
    if (isRunning) {
      get().triggerPulse(nodeId);
    }
  },

  setGeneratorError: (nodeId, error) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId && node.data.type === 'generator'
          ? { ...node, data: { ...node.data, error, output: '' } }
          : node
      ) as CanvasNode[],
    });
  },

  clearGeneratorError: (nodeId) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId && node.data.type === 'generator'
          ? { ...node, data: { ...node.data, error: undefined } }
          : node
      ) as CanvasNode[],
    });
  },

  saveToStorage: () => {
    const { nodes, counters } = get();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, nodes, counters }));
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
        counters: { ...{ generator: 0, content: 0, component: 0, data2ui: 0, folder: 0 }, ...(parsed.counters || {}) },
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
      counters: { generator: 0, content: 0, component: 0, data2ui: 0, folder: 0 },
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
