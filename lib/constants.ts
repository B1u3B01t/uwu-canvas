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
  folder: {
    width: 320,
    height: 280,
  },
} as const;

// Node types
export const NODE_TYPES = {
  GENERATOR: 'generator',
  CONTENT: 'content',
  COMPONENT: 'component',
  DATA2UI: 'data2ui',
  FOLDER: 'folder',
} as const;

// Alias prefixes
export const ALIAS_PREFIXES = {
  generator: 'output',
  content: 'con',
  component: 'comp',
  data2ui: 'data',
  folder: 'folder',
} as const;

// Box background colors
export const BOX_BACKGROUNDS = {
  generator: 'var(--frost-generator)',
  content: 'var(--frost-content)',
  component: 'var(--frost-component)',
  data2ui: 'var(--frost-data2ui)',
  folder: 'var(--frost-folder)',
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
    background: '#EBE6DB',
    dotsColor: '#e8e1d9',
  },
  // Dark mode colors
  dark: {
    background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)',
    dotsColor: 'rgba(255,255,255,0.15)',
  },
} as const;

// AI Provider keys (models are fetched from API)
export const AI_PROVIDER_KEYS = ['openai', 'anthropic', 'google'] as const;

// Folder color presets
export const FOLDER_COLORS = {
  green:  { tab: '#3D8B4D', body: '#4CAF50', frost: 'oklch(0.97 0.02 145 / 0.6)', pastelBg: 'oklch(0.85 0.12 145)', pastelText: 'oklch(0.25 0.08 145)' },
  blue:   { tab: '#4D7CF5', body: '#5B8BFF', frost: 'oklch(0.97 0.02 250 / 0.6)', pastelBg: 'oklch(0.85 0.12 250)', pastelText: 'oklch(0.25 0.08 250)' },
  red:    { tab: '#D84040', body: '#EF5350', frost: 'oklch(0.97 0.02 25 / 0.6)', pastelBg: 'oklch(0.85 0.12 25)', pastelText: 'oklch(0.25 0.08 25)' },
  yellow: { tab: '#D4A017', body: '#FFCA28', frost: 'oklch(0.97 0.02 85 / 0.6)', pastelBg: 'oklch(0.85 0.12 85)', pastelText: 'oklch(0.25 0.08 85)' },
  purple: { tab: '#7E3FAF', body: '#9C4DCC', frost: 'oklch(0.97 0.02 300 / 0.6)', pastelBg: 'oklch(0.85 0.12 300)', pastelText: 'oklch(0.25 0.08 300)' },
  pink:   { tab: '#C94080', body: '#EC5FA0', frost: 'oklch(0.97 0.02 340 / 0.6)', pastelBg: 'oklch(0.85 0.12 340)', pastelText: 'oklch(0.25 0.08 340)' },
  orange: { tab: '#D47017', body: '#FF9800', frost: 'oklch(0.97 0.02 55 / 0.6)', pastelBg: 'oklch(0.85 0.12 55)', pastelText: 'oklch(0.25 0.08 55)' },
  gray:   { tab: '#6B7280', body: '#9CA3AF', frost: 'oklch(0.97 0.01 250 / 0.6)', pastelBg: 'oklch(0.85 0.02 250)', pastelText: 'oklch(0.25 0.02 250)' },
} as const;

// React-grab bridge settings
export const REACT_GRAB_CONFIG = {
  // Delay before reading clipboard after copy event (ms)
  // Needs to be long enough for react-grab to finish writing to clipboard
  clipboardReadDelay: 500,
  // Debounce delay before allowing another capture (ms)
  debounceDelay: 1000,
} as const;
