import type { Node } from '@xyflow/react';

// Base node data shared across all box types
export interface BaseNodeData extends Record<string, unknown> {
  alias: string;
  width: number;
  height: number;
}

// Generator box specific data
export interface GeneratorNodeData extends BaseNodeData {
  type: 'generator';
  input: string;
  output: string;
  isRunning: boolean;
  error?: string;
  provider?: AIProvider;  // Set when providers are fetched
  model?: string;         // Set when providers are fetched
}

// Content box specific data
export interface ContentNodeData extends BaseNodeData {
  type: 'content';
  content?: string; // For text content (legacy)
  fileData?: {
    fileName: string;
    fileType: string; // MIME type
    fileSize: number;
    data: string; // base64 encoded file data
  };
}

// Component box specific data
export interface ComponentNodeData extends BaseNodeData {
  type: 'component';
  componentKey: string;
  viewMode: 'mobile' | 'laptop';
}

// Data2UI box specific data
export interface Data2UINodeData extends BaseNodeData {
  type: 'data2ui';
  sourceAlias: string; // Reference to generator or content box alias
  outputPath: string; // Path to JSON file in /data/ folder (e.g., "audria/recent-memories.json")
}

// Folder color presets
export type FolderColor = 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'pink' | 'orange' | 'gray';

// Folder box specific data
export interface FolderNodeData extends BaseNodeData {
  type: 'folder';
  childNodeIds: string[];    // ordered array of node IDs in this folder
  isExpanded: boolean;        // controls child visibility on canvas
  label: string;              // user-facing display name
  color: FolderColor;         // user-selectable preset color
}

// Union type for all node data
export type CanvasNodeData = GeneratorNodeData | ContentNodeData | ComponentNodeData | Data2UINodeData | FolderNodeData;

// Typed nodes for React Flow
export type GeneratorNode = Node<GeneratorNodeData, 'generator'>;
export type ContentNode = Node<ContentNodeData, 'content'>;
export type ComponentNode = Node<ComponentNodeData, 'component'>;
export type Data2UINode = Node<Data2UINodeData, 'data2ui'>;
export type FolderNode = Node<FolderNodeData, 'folder'>;
export type CanvasNode = GeneratorNode | ContentNode | ComponentNode | Data2UINode | FolderNode;

// Type guard for folder nodes
export function isFolderNode(node: CanvasNode): node is FolderNode {
  return node.data.type === 'folder';
}

// Alias map for resolving references
export interface AliasMap {
  [alias: string]: {
    nodeId: string;
    type: 'generator' | 'content' | 'component' | 'data2ui' | 'folder';
    value: string;
  };
}

// AI Provider types
export type AIProvider = 'openai' | 'anthropic' | 'google';

// Message content parts for AI SDK
export type MessageContentPart =
  | { type: 'text'; text: string }
  | { type: 'image'; image: string; mimeType: string } // base64 encoded
  | { type: 'file'; data: string; mimeType: string }; // base64 encoded

export interface GeneratorMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContentPart[];
}

// Canvas state
export interface CanvasState {
  nodes: CanvasNode[];
  selectedNodeId: string | null;
  counters: {
    generator: number;
    content: number;
    component: number;
    data2ui: number;
    folder: number;
  };
}
