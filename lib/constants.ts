// Default sizes for different box types
export const BOX_DEFAULTS = {
  generator: {
    width: 320,
    height: 400,
  },
  content: {
    width: 280,
    height: 200,
  },
  component: {
    mobile: {
      width: 390,
      height: 844,
    },
    laptop: {
      width: 1280,
      height: 720,
    },
  },
} as const;

// Node types
export const NODE_TYPES = {
  GENERATOR: 'generator',
  CONTENT: 'content',
  COMPONENT: 'component',
} as const;

// Alias prefixes
export const ALIAS_PREFIXES = {
  generator: 'output',
  content: 'con',
  component: 'comp',
} as const;

// Canvas settings
export const CANVAS_CONFIG = {
//   snapGrid: [20, 20] as [number, number],
  backgroundGap: 24,
  backgroundSize: 2.5,
  backgroundColor: '#BFBFBF',
  minZoom: 0.1,
  maxZoom: 2,
} as const;

// AI Provider keys (models are fetched from API)
export const AI_PROVIDER_KEYS = ['openai', 'anthropic', 'google'] as const;
