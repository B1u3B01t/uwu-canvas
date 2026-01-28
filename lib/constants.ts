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

// Box background colors
export const BOX_BACKGROUNDS = {
  generator: 'var(--frost-generator)',
  content: 'var(--frost-content)',
  component: 'var(--frost-component)',
  data2ui: 'var(--frost-data2ui)',
} as const;

// Typography sizes
export const FONT_SIZES = {
  input: '14px',
  textarea: '14px',
  output: '14px',
} as const;

// Input/Output area styling
export const INPUT_OUTPUT_STYLE = {
  // Toggle between 'white' or 'frosted'
  backgroundType: 'white' as 'white' | 'frosted',

  // Styles for white background
  white: {
    background: 'bg-white/95',
    border: 'border-zinc-200',
    focusBorder: 'focus:border-zinc-300',
  },

  // Styles for frosted background
  frosted: {
    background: 'bg-zinc-50/50',
    border: 'border-zinc-100',
    focusBorder: 'focus:border-zinc-200',
  },
} as const;

// Canvas settings
export const CANVAS_CONFIG = {
  backgroundGap: 30,
  backgroundSize: 2.7,
  minZoom: 0.1,
  maxZoom: 2,
  // Light mode colors
  light: {
    background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 50%, #f5f5f7 100%)',
    dotsColor: 'rgba(0,0,0,0.15)',
  },
  // Dark mode colors
  dark: {
    background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)',
    dotsColor: 'rgba(255,255,255,0.15)',
  },
} as const;

// AI Provider keys (models are fetched from API)
export const AI_PROVIDER_KEYS = ['openai', 'anthropic', 'google'] as const;

// React-grab bridge settings
export const REACT_GRAB_CONFIG = {
  // Delay before reading clipboard after copy event (ms)
  // Needs to be long enough for react-grab to finish writing to clipboard
  clipboardReadDelay: 500,
  // Debounce delay before allowing another capture (ms)
  debounceDelay: 1000,
} as const;
