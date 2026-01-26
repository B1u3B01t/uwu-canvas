// Default sizes for different box types
export const BOX_DEFAULTS = {
  generator: {
    width: 340,
    height: 340,
  },
  content: {
    width: 280,
    height: 170,
  },
  component: {
    mobile: {
      width: 402,
      height: 874,
    },
    laptop: {
      width: 1280,
      height: 720,
    },
  },
  data2ui: {
    width: 320,
    height: 190,
  },
} as const;

// Node types
export const NODE_TYPES = {
  GENERATOR: 'generator',
  CONTENT: 'content',
  COMPONENT: 'component',
  DATA2UI: 'data2ui',
} as const;

// Alias prefixes
export const ALIAS_PREFIXES = {
  generator: 'output',
  content: 'con',
  component: 'comp',
  data2ui: 'data',
} as const;

// Canvas settings
export const CANVAS_CONFIG = {
//   snapGrid: [20, 20] as [number, number],
  backgroundGap: 24,
  backgroundSize: 1,
  backgroundColor: 'rgba(0,0,0,0.08)',
  minZoom: 0.1,
  maxZoom: 2,
} as const;

// AI Provider keys (models are fetched from API)
export const AI_PROVIDER_KEYS = ['openai', 'anthropic', 'google'] as const;
