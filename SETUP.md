# uwu-canvas Setup

## Quick Start

1. Copy the `uwu-canvas/` folder into your Next.js project's `src/app/` directory (or `app/` if you don't use `src`).
2. Open a terminal in your project root.
3. Run the setup script:
   ```
   node src/app/uwu-canvas/setup.mjs
   ```
   (Use `app/uwu-canvas/setup.mjs` if your app lives under `app/` with no `src`.)
4. Add at least one AI API key to `.env.local` (see [Environment](#environment)).
5. Start your project (`npm run dev` or your package manager’s dev command).
6. Open `http://localhost:3000/uwu-canvas`.

## Manual Install

If you prefer to skip the script, install dependencies from your project root:

```
npm install @xyflow/react zustand react-live react-markdown lucide-react ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-context-menu @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-tooltip @radix-ui/react-slot clsx tailwind-merge class-variance-authority cmdk
```

Replace `npm install` with `pnpm add`, `yarn add`, or `bun add` as needed.

Create a `data/uwu-canvas/` directory for JSON file outputs (optional; used by Data2UI nodes). Add API keys to `.env.local` as described below.

## Prerequisites

Your project should already have:

- **Next.js** (App Router, v14+)
- **React** 18 or 19
- **TypeScript**
- **Tailwind CSS**

The setup script checks for these and will warn if any are missing. The canvas uses Tailwind utility classes; if your app uses different theming, you may need to align CSS variables or styles.

## Environment

At least **one** AI provider API key is required for Generator nodes to work. Add them to your project’s `.env.local` (at the project root; Next.js loads it automatically):

| Variable | Provider | Required |
|----------|----------|----------|
| `OPENAI_API_KEY` | OpenAI (GPT) | One of these |
| `ANTHROPIC_API_KEY` | Anthropic (Claude) | must be set |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google (Gemini) | |

The setup script creates or updates `.env.local` with commented placeholders if needed. Uncomment and set at least one key. Without any key, the canvas still loads but Generator runs will fail.

## How It Works

1. **Generator** — Type a prompt and click Run; output streams as text. If the model returns JSX/TSX in a code block, it’s shown as a live component preview.
2. **Content** — Hold text or files (images, PDFs, etc.); reference them in prompts with `@alias`.
3. **Component** — Preview registered React components in mobile or laptop view; pick from the component registry.
4. **Data2UI** — Write AI output to JSON files under `data/uwu-canvas/`.
5. **Canvas state** is persisted in the browser (e.g. localStorage). Node positions and wiring are saved automatically.

For more usage and node types, see [README.md](./README.md).

## Removing uwu-canvas

Delete the `src/app/uwu-canvas/` (or `app/uwu-canvas/`) folder. Optionally remove dependencies you no longer need:

```
npm uninstall @xyflow/react zustand react-live react-markdown lucide-react ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-context-menu @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-tooltip @radix-ui/react-slot clsx tailwind-merge class-variance-authority cmdk
```

You can also delete the `data/uwu-canvas/` directory if you no longer need saved JSON outputs.
