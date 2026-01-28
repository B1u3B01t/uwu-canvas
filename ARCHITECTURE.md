# UWU Canvas Architecture

Technical documentation for developers and AI assistants working with UWU Canvas.

## Directory Structure

```
uwu-canvas/
├── page.tsx                    # Main canvas page (route: /uwu-canvas)
├── index.ts                    # Public exports
├── styles.css                  # CSS variables for theming
│
├── components/
│   ├── Canvas.tsx              # React Flow canvas container
│   ├── Toolbar.tsx             # Node creation & zoom controls
│   ├── PromptGeneratorDialog.tsx
│   │
│   ├── nodes/
│   │   ├── GeneratorBox.tsx    # AI prompt execution node
│   │   ├── ContentBox.tsx      # Text/file content node
│   │   ├── ComponentBox.tsx    # Component preview node
│   │   └── Data2UIBox.tsx      # JSON data writer node
│   │
│   ├── ui/                     # Radix UI components
│   │   ├── Autocomplete.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── popover.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   └── Tooltip.tsx
│   │
│   └── examples/
│       └── ExampleComponent.tsx  # Template for registry components
│
├── hooks/
│   ├── useCanvasStore.ts       # Zustand state management
│   └── useAliasResolver.ts     # Alias query utilities
│
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   ├── constants.ts            # Configuration values
│   ├── utils.ts                # Utilities (cn, fileUtils)
│   ├── registry.ts             # Component registry
│   ├── promptTemplates.ts      # AI prompt generation
│   └── reactGrabBridge.ts      # react-grab integration
│
├── api/
│   ├── generate/route.ts       # AI streaming endpoint
│   ├── providers/route.ts      # Available models endpoint
│   ├── write-json/route.ts     # JSON file writer
│   └── list-json-files/route.ts # JSON file lister
│
└── preview/
    └── [componentKey]/
        ├── layout.tsx          # Preview layout with react-grab
        └── page.tsx            # Component preview renderer
```

## State Management

### Zustand Store (`useCanvasStore`)

The central store manages all canvas state:

```typescript
interface CanvasStore {
  // State
  nodes: CanvasNode[];
  selectedNodeId: string | null;
  counters: { generator, content, component, data2ui };

  // Node CRUD
  addNode(type, position?): void;
  addContentNodeWithFile(fileData, position?): void;
  updateNode(nodeId, data): void;
  removeNode(nodeId): void;
  setNodes(nodes): void;

  // Selection
  selectNode(nodeId | null): void;

  // Alias Resolution
  getAliasMap(): AliasMap;
  resolveAlias(alias): string;
  resolveAllAliases(text): string;
  buildMessageContent(text): MessageContentPart[];
  getNodeByAlias(alias): CanvasNode | undefined;

  // Generator Helpers
  setGeneratorOutput(nodeId, output): void;
  setGeneratorRunning(nodeId, isRunning): void;

  // Persistence
  saveToStorage(): void;
  loadFromStorage(): void;
  clearCanvas(): void;
}
```

### Auto-Persistence

State automatically saves to `localStorage` with 1-second debounce:

```typescript
// Subscribe to changes
useCanvasStore.subscribe(
  (state) => ({ nodes: state.nodes, counters: state.counters }),
  (state) => debouncedSave(state.nodes, state.counters)
);
```

## Node Types

### Base Node Data

All nodes share these properties:

```typescript
interface BaseNodeData {
  alias: string;    // Unique reference (e.g., "output-1")
  width: number;
  height: number;
}
```

### Generator Node

```typescript
interface GeneratorNodeData extends BaseNodeData {
  type: 'generator';
  input: string;        // User prompt with @alias references
  output: string;       // AI response (streamed)
  isRunning: boolean;
  provider?: 'openai' | 'anthropic' | 'google';
  model?: string;
}
```

### Content Node

```typescript
interface ContentNodeData extends BaseNodeData {
  type: 'content';
  content?: string;     // Text content
  fileData?: {
    fileName: string;
    fileType: string;   // MIME type
    fileSize: number;
    data: string;       // Base64 encoded
  };
}
```

### Component Node

```typescript
interface ComponentNodeData extends BaseNodeData {
  type: 'component';
  componentKey: string;             // Registry key
  viewMode: 'mobile' | 'laptop';
}
```

### Data2UI Node

```typescript
interface Data2UINodeData extends BaseNodeData {
  type: 'data2ui';
  sourceAlias: string;  // Generator/content alias to watch
  outputPath: string;   // JSON file path (e.g., "app/recent.json")
}
```

## Data Flow

### Alias Resolution

```
User Input: "Analyze @con-1 and summarize"
    ↓
buildMessageContent()
    ├─ Find node with alias "con-1"
    ├─ Extract content/file data
    └─ Convert to MessageContentPart[]
    ↓
API Request: [
  { type: 'text', text: 'Analyze ' },
  { type: 'image', image: '...base64...', mimeType: 'image/png' },
  { type: 'text', text: ' and summarize' }
]
```

### Generation Flow

```
GeneratorBox
    ├─ handleRun()
    │   ├─ buildMessageContent(input)
    │   ├─ POST /api/generate
    │   ├─ Stream response chunks
    │   └─ Update store with output
    │
    └─ Data2UIBox (watching this generator)
        ├─ Detect isRunning: true → false
        ├─ Extract JSON from output
        ├─ POST /api/write-json
        └─ Update status
```

### Component Preview Flow

```
ComponentBox
    ├─ Select component key
    ├─ Render iframe: /uwu-canvas/preview/[key]
    │
preview/[componentKey]/page.tsx
    ├─ Lookup registry[key]
    ├─ Render component
    │
layout.tsx (dev only)
    ├─ Inject react-grab script
    ├─ Listen for copy events
    ├─ Parse clipboard
    └─ Generate AI prompt
```

## API Routes

### POST `/api/generate`

Streams AI responses using Vercel AI SDK.

**Request:**
```typescript
// Simple prompt
{ prompt: string, provider?: string, model?: string }

// Structured messages (for files/images)
{
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: '...' },
      { type: 'image', image: 'base64...', mimeType: 'image/png' }
    ]
  }],
  provider?: string,
  model?: string
}
```

**Response:** Text stream (chunked)

### GET `/api/providers`

Returns available AI providers and models.

**Response:**
```typescript
{
  providers: {
    openai?: { name: 'OpenAI', models: [{ id, name }] },
    anthropic?: { name: 'Anthropic', models: [...] },
    google?: { name: 'Google', models: [...] }
  }
}
```

### POST `/api/write-json`

Writes JSON data to `/app/data/` directory.

**Request:**
```typescript
{ path: string, data: object }
```

Path is sanitized to prevent directory traversal. Parent directories are created automatically.

### GET `/api/list-json-files`

Lists all JSON files in `/app/data/` recursively.

**Response:**
```typescript
{ files: ['path/to/file.json', ...] }
```

## Component Registry

### Adding Components

```typescript
// lib/registry.ts
import { YourComponent } from '@/app/your-app/YourComponent';

export const componentRegistry: Record<string, RegistryEntry> = {
  'your-key': {
    name: 'Display Name',
    component: YourComponent,
    category: 'Category',
    description: 'What it does',
  },
};
```

### Registry Entry Interface

```typescript
interface RegistryEntry {
  name: string;
  component: ComponentType<Record<string, unknown>>;
  category?: string;
  description?: string;
}
```

### Helpers

```typescript
getRegistryKeys(): string[]
getRegistryEntries(): RegistryEntry[]
getComponentByKey(key): RegistryEntry | undefined
getComponentsByCategory(category): RegistryEntry[]
getAllCategories(): string[]
```

## File Handling

### Supported Types

```typescript
// lib/utils.ts - fileUtils.isFileTypeSupported()
const SUPPORTED_TYPES = [
  'image/*',
  'application/pdf',
  'text/*',
  'application/json',
  'audio/*',
  'application/*spreadsheet*',
  'application/*document*',
  'application/*word*',
];
```

### Base64 Conversion

```typescript
// Read file as base64 (strips data URL prefix)
const base64 = await fileUtils.readFileAsBase64(file);
```

### AI SDK Integration

Files are converted to appropriate AI SDK parts:

| File Type | AI SDK Part |
|-----------|-------------|
| `image/*` | `ImagePart` |
| `application/pdf` | `FilePart` |
| `text/*`, `application/json` | Decoded to `TextPart` |
| `audio/*` | `FilePart` |
| Other documents | `FilePart` |

## CSS Theming

### Variables (styles.css)

```css
:root {
  /* Accent colors for each node type */
  --accent-generator: oklch(0.65 0.18 250);
  --accent-content: oklch(0.65 0.18 160);
  --accent-component: oklch(0.65 0.18 290);
  --accent-data2ui: oklch(0.65 0.18 45);

  /* Pastel badge backgrounds */
  --pastel-*-bg: oklch(0.85 0.12 *);
  --pastel-*-text: oklch(0.25 0.08 *);

  /* Frosted glass node backgrounds */
  --frost-*: oklch(0.97 0.02 * / 0.6);
}
```

## Constants

### Default Sizes

```typescript
BOX_DEFAULTS = {
  generator: { width: 340, height: 340 },
  content: { width: 280, height: 170 },
  component: {
    mobile: { width: 402, height: 874 },
    laptop: { width: 1280, height: 720 },
  },
  data2ui: { width: 320, height: 190 },
}
```

### Alias Prefixes

```typescript
ALIAS_PREFIXES = {
  generator: 'output',
  content: 'con',
  component: 'comp',
  data2ui: 'data',
}
```

## Best Practices

### For AI Assistants

1. **Reading State**: Always use Zustand selectors to read node data
   ```typescript
   const data = useCanvasStore((state) =>
     state.nodes.find(n => n.id === id)?.data
   );
   ```

2. **Updating Nodes**: Use `updateNode` for partial updates
   ```typescript
   updateNode(id, { output: newOutput });
   ```

3. **Adding Components**: Follow the registry pattern
   - Import at top of `lib/registry.ts`
   - Add entry with unique key
   - Never register canvas pages

4. **API Errors**: Keep error logging, use `console.error` only

### For Developers

1. **Node Components**: Use `memo()` to prevent re-renders
2. **Hooks Order**: All hooks before conditional returns
3. **File Handling**: Validate file types before processing
4. **Security**: Sanitize all file paths in API routes

## Extending UWU Canvas

### Adding New Node Types

1. Create interface in `lib/types.ts`:
   ```typescript
   interface NewNodeData extends BaseNodeData {
     type: 'new';
     // ... fields
   }
   ```

2. Create component in `components/nodes/NewBox.tsx`

3. Add to `nodeTypes` in `Canvas.tsx`:
   ```typescript
   const nodeTypes = {
     // ...existing
     new: NewBox,
   };
   ```

4. Add creation logic in `useCanvasStore.ts`

5. Add to `Toolbar.tsx` and `constants.ts`

### Adding AI Providers

1. Add to `lib/types.ts`:
   ```typescript
   type AIProvider = 'openai' | 'anthropic' | 'google' | 'new';
   ```

2. Update `api/providers/route.ts` with fetch function

3. Update `api/generate/route.ts` with model initialization
