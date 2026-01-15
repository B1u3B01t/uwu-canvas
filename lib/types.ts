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
  provider?: AIProvider;  // Set when providers are fetched
  model?: string;         // Set when providers are fetched
}

// Content box specific data
export interface ContentNodeData extends BaseNodeData {
  type: 'content';
  content: string;
}

// Component box specific data
export interface ComponentNodeData extends BaseNodeData {
  type: 'component';
  componentKey: string;
  viewMode: 'mobile' | 'laptop';
}

// Union type for all node data
export type CanvasNodeData = GeneratorNodeData | ContentNodeData | ComponentNodeData;

// Typed nodes for React Flow
export type GeneratorNode = Node<GeneratorNodeData, 'generator'>;
export type ContentNode = Node<ContentNodeData, 'content'>;
export type ComponentNode = Node<ComponentNodeData, 'component'>;
export type CanvasNode = GeneratorNode | ContentNode | ComponentNode;

// Alias map for resolving references
export interface AliasMap {
  [alias: string]: {
    nodeId: string;
    type: 'generator' | 'content' | 'component';
    value: string;
  };
}

// AI Provider types
export type AIProvider = 'openai' | 'anthropic' | 'google';

// Canvas state
export interface CanvasState {
  nodes: CanvasNode[];
  selectedNodeId: string | null;
  counters: {
    generator: number;
    content: number;
    component: number;
  };
}
