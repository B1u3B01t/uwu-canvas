# UWU Canvas — Visual AI Node Canvas for Next.js

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue)](https://www.typescriptlang.org)

**UWU Canvas** is an open-source, visual node-based AI canvas that you can drop into any **Next.js** app. Build, test, and iterate on UI components using real-time AI-generated data — powered by **OpenAI**, **Anthropic (Claude)**, and **Google Gemini**.

> Think of it as a personal AI data playground: wire up prompts, connect outputs to your components, and preview them live — all inside a drag-and-drop canvas.

![UWU Canvas Demo](<!-- add a screenshot or gif here -->)

## Why UWU Canvas?

- **No separate tool to install** — it lives inside your existing Next.js app at `/uwu-canvas`
- **Multi-provider AI support** — switch between OpenAI GPT, Anthropic Claude, and Google Gemini in one click
- **Real data pipelines** — pipe AI output directly into your app's JSON data files
- **Live component previews** — see your registered React components update in real time with AI-generated content
- **File-aware AI** — drag in images, PDFs, and documents for multimodal prompts

---

## Features

- **Visual Node-Based Editor** — drag-and-drop canvas powered by [React Flow](https://reactflow.dev)
- **Multi-Provider AI Generation** — OpenAI, Anthropic, and Google AI via the Vercel AI SDK
- **Component Preview** — live preview of registered components in mobile (390×844) and laptop (1280×720) modes
- **Data Pipeline** — connect AI outputs directly to JSON data files in your app
- **File Support** — drag and drop images, PDFs, Word docs, and more for AI processing
- **Alias References** — reference node outputs using `@alias` syntax in prompts
- **Auto-Persistence** — canvas state automatically saved to `localStorage`

---

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

1. Copy the `uwu-canvas` folder into your Next.js app's `app/` directory:
```
your-app/
  app/
    uwu-canvas/       ← copy here
    data/             ← create this for JSON outputs
```

2. Add your AI provider keys to `.env.local` (at least one required):
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

3. Start your dev server and visit `/uwu-canvas`.

---

## Node Types

| Node | Purpose | Icon |
|------|---------|------|
| **Generator** | Execute AI prompts with streaming output | Sparkles |
| **Content** | Store text or files (images, PDFs, docs) | FileText |
| **Component** | Preview registered React components | Layout |
| **Data2UI** | Write AI output to JSON files | Database |

---

## Usage

### Alias References

Every node gets an alias (e.g., `@output-1`, `@con-1`). Use aliases in Generator prompts to chain nodes:
```
Analyze this image: @con-1
Based on @output-1, generate a marketing summary.
```

### AI Generation Workflow

1. Create a **Content** node with your input (text or file)
2. Create a **Generator** node with a prompt referencing the content
3. Click ▶ to run — output streams in real time

### Data Pipeline (AI → JSON → Component)

1. Create a **Generator** that outputs valid JSON
2. Create a **Data2UI** node, select the generator as source
3. Select the output JSON file in your `app/data/` folder
4. Click **Apply** — your component re-renders with live data

### Component Preview

1. Register your components in `lib/registry.ts`
2. Create a **Component** node and select your component
3. Toggle between mobile and laptop viewport sizes

---

## Registering Components
```ts
// lib/registry.ts
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

> ⚠️ Never register the `/uwu-canvas` page itself — this causes an infinite render loop.

---

## File Support

| Type | Formats |
|------|---------|
| Images | PNG, JPG, GIF, WebP, SVG |
| Documents | PDF, Word, Excel |
| Text | TXT, JSON, Markdown, code files |
| Audio | MP3, WAV, OGG |

Files are converted to base64 and sent to multimodal-capable AI providers.

---

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/uwu-canvas/api/generate` | POST | Stream AI responses |
| `/uwu-canvas/api/providers` | GET | List available AI providers & models |
| `/uwu-canvas/api/list-json-files` | GET | List JSON files in `/app/data/` |
| `/uwu-canvas/api/write-json` | POST | Write JSON to `/app/data/` |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` / `Backspace` | Delete selected node |
| Scroll | Pan canvas |
| `Ctrl` + Scroll / Pinch | Zoom |

---

## Customization

### CSS Variables

Override node accent colors in your global CSS:
```css
:root {
  --accent-generator: oklch(0.65 0.18 250);
  --accent-content:   oklch(0.65 0.18 160);
  --accent-component: oklch(0.65 0.18 290);
  --accent-data2ui:   oklch(0.65 0.18 45);
}
```

### Constants

Modify `lib/constants.ts` to customize default node sizes, alias prefixes, zoom limits, and background styling.

---

## Exports
```ts
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

---

## Troubleshooting

**No AI providers available** → Check that at least one API key is in `.env.local` and restart the dev server.

**Components not showing** → Verify the component is registered in `lib/registry.ts` with a correct import path and default export.

**File drop not working** → Check the file type is supported and the file is under ~100MB.

**Canvas state lost** → Check that `localStorage` is enabled and not over quota in your browser console.

---

## License

MIT — free to use, modify, and distribute.

---

## Contributing

PRs and issues welcome! See [ARCHITECTURE.md](ARCHITECTURE.md) for a deep-dive into how the canvas is structured.
