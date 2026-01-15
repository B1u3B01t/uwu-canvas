// Main components
export { Canvas } from './components/Canvas';
export { Toolbar } from './components/Toolbar';

// Node components
export { GeneratorBox } from './components/nodes/GeneratorBox';
export { ContentBox } from './components/nodes/ContentBox';
export { ComponentBox } from './components/nodes/ComponentBox';

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
  CanvasNodeData,
  GeneratorNode,
  ContentNode,
  ComponentNode,
  CanvasNode,
  AliasMap,
  AIProvider,
  CanvasState,
} from './lib/types';

// Constants
export { 
  BOX_DEFAULTS, 
  NODE_TYPES, 
  ALIAS_PREFIXES, 
  CANVAS_CONFIG,
  AI_PROVIDER_KEYS,
} from './lib/constants';
