import type { ReactGrabCapture } from './reactGrabBridge';

/**
 * Generate a prompt for converting a captured component section into a dynamic,
 * props-based component with JSON data file.
 */
export function generateDynamicComponentPrompt(
  capture: ReactGrabCapture,
  componentKey: string
): string {
  const jsonPath = `app/data/${componentKey}/${toKebabCase(capture.componentName)}.json`;

  return `# Convert Component to Dynamic (Props-Based)

## Captured Component Info
- **Component Name:** \`${capture.componentName}\`
- **File Path:** \`${capture.filePath}\`
- **Line Number:** ${capture.lineNumber}
- **Component Key:** \`${componentKey}\`

## Captured HTML Source
\`\`\`html
${capture.html}
\`\`\`

---

## Instructions

Convert this component section to be **dynamic** (props-based) with an external JSON data file.

### Step 1: Analyze the Captured HTML

Identify all **hardcoded values** that should become dynamic:
- Text content (labels, titles, descriptions)
- Numbers (counts, sizes, positions)
- Colors (background, text, border colors)
- URLs (images, links, hrefs)
- Any repeated patterns that should become array items

### Step 2: Create JSON Data File

Create a JSON file at: \`${jsonPath}\`

Structure the data logically:
\`\`\`json
{
  // Single values
  "title": "...",
  "description": "...",

  // Arrays for repeated items
  "items": [
    { "id": "1", "text": "...", "color": "..." },
    { "id": "2", "text": "...", "color": "..." }
  ]
}
\`\`\`

### Step 3: Create TypeScript Interface

Add a TypeScript interface for the data shape. Either:
- Add to the component file, or
- Create at \`app/${componentKey}/lib/types.ts\`

Example:
\`\`\`typescript
export interface ${capture.componentName}Data {
  title: string;
  items: Array<{
    id: string;
    text: string;
    color?: string;
  }>;
}
\`\`\`

### Step 4: Update Component to Use Props

Modify \`${capture.filePath}\` to:

1. **Import the JSON data:**
   \`\`\`typescript
   import data from '@/app/data/${componentKey}/${toKebabCase(capture.componentName)}.json';
   import type { ${capture.componentName}Data } from '../lib/types';
   \`\`\`

2. **Replace hardcoded values with data references:**
   - \`"Some text"\` → \`{data.title}\`
   - Repeated JSX → \`{data.items.map(item => ...)}\`

3. **Keep the same visual appearance** - only the data source changes

### Complete Example: Converting a Section Title

**BEFORE - Hardcoded HTML captured:**
\`\`\`html
<h3 class="text-[15px] font-bold text-zinc-900 mb-2">
  Integrations
</h3>
\`\`\`

**Step 1: Create JSON data file at \`app/data/audria/section-title.json\`:**
\`\`\`json
{
  "titles": {
    "integrations": "Integrations",
    "collections": "Collections",
    "settings": "Settings",
    "recentMemories": "Recent memories"
  }
}
\`\`\`

**Step 2: Add TypeScript interface:**
\`\`\`typescript
// In app/audria/lib/types.ts
export interface SectionTitles {
  titles: Record<string, string>;
}
\`\`\`

**Step 3: Update component to use data:**
\`\`\`typescript
// BEFORE (hardcoded):
<SectionTitle>Integrations</SectionTitle>

// AFTER (dynamic):
import sectionTitles from '@/app/data/audria/section-title.json';

<SectionTitle>{sectionTitles.titles.integrations}</SectionTitle>
\`\`\`

---

### Complete Example: Converting a List of Items

**BEFORE - Hardcoded list captured:**
\`\`\`html
<div class="divide-y divide-zinc-100">
  <MemoryCard memory={{ id: "1", text: "Sarah requested...", colorScheme: "gold" }} />
  <MemoryCard memory={{ id: "2", text: "High CPU usage...", colorScheme: "rose" }} />
</div>
\`\`\`

**Step 1: Create JSON data file at \`app/data/audria/recent-memories.json\`:**
\`\`\`json
[
  {
    "id": "1",
    "text": "Sarah requested your review on the 'new-auth-flow' pull request.",
    "colorScheme": "gold",
    "action": { "label": "View PR", "target": "Connect", "icon": "code" }
  },
  {
    "id": "2",
    "text": "High CPU usage detected on the production database.",
    "colorScheme": "rose",
    "action": { "label": "View Dashboard", "target": "Connect", "icon": "server" }
  },
  {
    "id": "3",
    "text": "Your 1-on-1 with Maria is scheduled for 3 PM tomorrow.",
    "colorScheme": "sapphire",
    "action": { "label": "On your Calendar", "target": "done", "icon": "calendar" }
  }
]
\`\`\`

**Step 2: Add TypeScript interface:**
\`\`\`typescript
// In app/audria/lib/types.ts
export interface Memory {
  id: string;
  text: string;
  colorScheme?: 'gold' | 'rose' | 'sapphire' | 'jade';
  action?: {
    label: string;
    target: string;
    icon?: string;
  };
}
\`\`\`

**Step 3: Update component to use data:**
\`\`\`typescript
// BEFORE (hardcoded):
<div className="divide-y divide-zinc-100">
  <MemoryCard memory={{ id: "1", text: "Sarah requested...", colorScheme: "gold" }} />
  <MemoryCard memory={{ id: "2", text: "High CPU usage...", colorScheme: "rose" }} />
</div>

// AFTER (dynamic):
import memoriesData from '@/app/data/audria/recent-memories.json';
import type { Memory } from '../../lib/types';

<div className="divide-y divide-zinc-100">
  {(memoriesData as Memory[]).map((memory) => (
    <MemoryCard key={memory.id} memory={memory} />
  ))}
</div>
\`\`\`

---

## Expected Output

1. **New file:** \`${jsonPath}\` with extracted data
2. **Modified file:** \`${capture.filePath}\` using the JSON data
3. **Type definition** (if not already existing)

The component should render **exactly the same** visually but now be data-driven. Users can then edit the JSON file to change content without touching code.`;
}

/**
 * Convert PascalCase or camelCase to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}
