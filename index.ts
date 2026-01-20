// Main components
export { Canvas } from './components/Canvas';
export { Toolbar } from './components/Toolbar';

// Node components
export { GeneratorBox } from './components/nodes/GeneratorBox';
export { ContentBox } from './components/nodes/ContentBox';
export { ComponentBox } from './components/nodes/ComponentBox';
export { Data2UIBox } from './components/nodes/Data2UIBox';

// UI components
export { AutocompleteTextarea } from './components/ui/Autocomplete';

// Hooks
export { useCanvasStore } from './hooks/useCanvasStore';
export { useAliasResolver } from './hooks/useAliasResolver';

// Registry
export {
  componentRegistry,
  getRegistryEntries,
  getRegistryKeys,
  getComponentByKey,
  getComponentsByCategory,
  getAllCategories,
  type RegistryEntry,
} from './lib/registry';

// Types
export type {
  BaseNodeData,
  GeneratorNodeData,
  ContentNodeData,
  ComponentNodeData,
  Data2UINodeData,
  CanvasNodeData,
  GeneratorNode,
  ContentNode,
  ComponentNode,
  Data2UINode,
  CanvasNode,
  AliasMap,
  AIProvider,
  CanvasState,
  MessageContentPart,
  GeneratorMessage,
} from './lib/types';

// Constants
export { 
  BOX_DEFAULTS, 
  NODE_TYPES, 
  ALIAS_PREFIXES, 
  CANVAS_CONFIG,
  AI_PROVIDER_KEYS,
} from './lib/constants';

// Utils
export { cn, fileUtils } from './lib/utils';

// React Flow re-exports (required peer dependency: @xyflow/react)
export {
  ReactFlowProvider,
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useReactFlow,
  useStore,
  NodeResizer,
} from '@xyflow/react';
export type {
  Node,
  NodeProps,
  NodeChange,
} from '@xyflow/react';
