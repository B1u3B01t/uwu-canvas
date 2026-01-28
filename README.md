# UWU Canvas

A visual AI-powered canvas for building and testing UI components with real-time data generation. UWU Canvas is a modular add-on that can be integrated into any Next.js application.

## Features

- **Visual Node-Based Editor**: Drag-and-drop canvas powered by React Flow
- **Multi-Provider AI Generation**: Supports OpenAI, Anthropic, and Google AI
- **Component Preview**: Live preview of registered components in mobile/laptop modes
- **Data Pipeline**: Connect AI outputs directly to JSON data files
- **File Support**: Drag and drop images, PDFs, and documents for AI processing
- **Alias References**: Reference node outputs using `@alias` syntax
- **Auto-Persistence**: Canvas state automatically saved to localStorage

## Installation

### Prerequisites

- Next.js 14+ (App Router)
- React 18+
- Tailwind CSS

### Required Dependencies

```bash
npm install zustand @xyflow/react ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
npm install @radix-ui/react-select @radix-ui/react-dropdown-menu @radix-ui/react-tooltip @radix-ui/react-popover
npm install lucide-react clsx tailwind-merge
```

### Setup

1. Copy the `uwu-canvas` folder to your Next.js app's `app/` directory:

```
your-app/
  app/
    uwu-canvas/       <- Copy here
    data/             <- Create this folder for JSON outputs
```

2. Add environment variables to `.env.local`:

```env
# At least one of these is required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

3. Visit `/uwu-canvas` in your browser to access the canvas.

## Usage

### Node Types

UWU Canvas has four node types:

| Node | Purpose | Icon |
|------|---------|------|
| **Generator** | Execute AI prompts with streaming output | Sparkles |
| **Content** | Store text or files (images, PDFs, docs) | FileText |
| **Component** | Preview registered React components | Layout |
| **Data2UI** | Write AI output to JSON files | Database |

### Creating Nodes

1. Click the toolbar buttons at the top of the canvas
2. Nodes appear in the center of the viewport
3. Drag nodes to reposition them
4. Resize nodes using the corner handles when selected

### Using Aliases

Every node has an alias (e.g., `@output-1`, `@con-1`). Reference other nodes in Generator prompts:

```
Analyze this image: @con-1
Based on @output-1, generate a summary.
```

### AI Generation Workflow

1. Create a **Content** node with your input (text or file)
2. Create a **Generator** node
3. Reference the content: `Describe this: @con-1`
4. Click the play button to run
5. Output streams in real-time

### Data Pipeline

Connect AI outputs to your app's data:

1. Create a **Generator** that outputs JSON
2. Create a **Data2UI** node
3. Select the generator as source
4. Select the output JSON file
5. Click "Apply" (or it auto-applies when generator finishes)

### Component Preview

Preview your React components in the canvas:

1. Register components in `lib/registry.ts`
2. Create a **Component** node
3. Select your component from the dropdown
4. Toggle between mobile (390x844) and laptop (1280x720) views

## Registering Components

Edit `lib/registry.ts` to add your components:

```typescript
import { MyComponent } from '@/app/my-app/MyComponent';

export const componentRegistry: Record<string, RegistryEntry> = {
  'my-component': {
    name: 'My Component',
    component: MyComponent,
    category: 'App',
    description: 'Description of my component',
  },
};
```

**Warning**: Never register the `/uwu-canvas` page itself - this causes an infinite loop.

## File Support

Drag and drop files directly onto the canvas:

| Type | Supported Formats |
|------|-------------------|
| Images | PNG, JPG, GIF, WebP, SVG |
| Documents | PDF, Word, Excel |
| Text | TXT, JSON, Markdown, Code files |
| Audio | MP3, WAV, OGG |

Files are converted to base64 and sent to AI providers that support multimodal input.

## API Endpoints

The canvas includes these API routes:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/uwu-canvas/api/generate` | POST | Stream AI responses |
| `/uwu-canvas/api/providers` | GET | List available AI providers/models |
| `/uwu-canvas/api/list-json-files` | GET | List JSON files in `/app/data/` |
| `/uwu-canvas/api/write-json` | POST | Write JSON to `/app/data/` |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` / `Backspace` | Delete selected node |
| Scroll | Pan canvas |
| Pinch/Scroll + Ctrl | Zoom |

## Persistence

Canvas state (nodes, positions, settings) is automatically saved to localStorage under the key `uwu-canvas-storage`. The canvas reloads your last state on refresh.

## Customization

### CSS Variables

Override colors in your global CSS:

```css
:root {
  --accent-generator: oklch(0.65 0.18 250);
  --accent-content: oklch(0.65 0.18 160);
  --accent-component: oklch(0.65 0.18 290);
  --accent-data2ui: oklch(0.65 0.18 45);
}
```

### Constants

Modify `lib/constants.ts` to change:
- Default node sizes
- Alias prefixes
- Canvas zoom limits
- Background styling

## Exports

Import from `uwu-canvas/index.ts`:

```typescript
import {
  Canvas,
  Toolbar,
  GeneratorBox,
  ContentBox,
  ComponentBox,
  Data2UIBox,
  useCanvasStore,
  componentRegistry,
} from '@/app/uwu-canvas';
```

## Troubleshooting

### No AI Providers Available
- Check that at least one API key is set in `.env.local`
- Restart the dev server after adding keys

### Components Not Showing
- Verify the component is registered in `lib/registry.ts`
- Check the import path is correct
- Ensure the component has a default export

### File Drop Not Working
- Check file type is supported
- Verify file size isn't too large (100MB+ may cause issues)

### Canvas State Lost
- Check localStorage isn't disabled
- Check for storage quota errors in console

## License

MIT
