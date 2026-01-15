# Component Registry Guidelines

This document provides guidelines for AI code editors to register components in the uwu-canvas component registry.

## Overview

The component registry (`lib/registry.ts`) maps component keys to React components that can be rendered in Component Boxes on the canvas.

## How to Register a Component

### Step 1: Import the Component

Add the component import at the top of `lib/registry.ts`:

```typescript
import { MyComponent } from '@/components/MyComponent';
// or
import { MyComponent } from '../../../components/MyComponent';
```

### Step 2: Add Registry Entry

Add an entry to the `componentRegistry` object:

```typescript
export const componentRegistry: Record<string, RegistryEntry> = {
  'my-component': {
    name: 'My Component',
    component: MyComponent,
    category: 'UI',
    description: 'A description of what this component does',
  },
  // ... other entries
};
```

## Registry Entry Schema

```typescript
interface RegistryEntry {
  name: string;        // Human-readable display name
  component: ComponentType<Record<string, unknown>>;  // The React component
  category?: string;   // Optional grouping category
  description?: string; // Optional description
}
```

## Field Guidelines

### `key` (object key)
- Use kebab-case: `'user-profile'`, `'data-table'`
- Keep it short but descriptive
- Must be unique across the registry

### `name`
- Use Title Case: `'User Profile'`, `'Data Table'`
- Should be human-readable for display in the UI

### `component`
- Must be a valid React component
- Should accept no required props (or handle missing props gracefully)
- Can be a functional or class component

### `category` (optional)
- Use for grouping related components
- Examples: `'UI'`, `'Forms'`, `'Layout'`, `'Data Display'`
- Keep categories consistent across entries

### `description` (optional)
- Brief explanation of the component's purpose
- Helps users understand what the component does

## Example Registration

```typescript
// lib/registry.ts

import { Button } from '@/components/ui/button';
import { UserCard } from '@/components/UserCard';
import { DashboardWidget } from '@/app/dashboard/components/Widget';

export const componentRegistry: Record<string, RegistryEntry> = {
  'button': {
    name: 'Button',
    component: Button,
    category: 'UI',
    description: 'A clickable button component',
  },
  'user-card': {
    name: 'User Card',
    component: UserCard,
    category: 'User',
    description: 'Displays user information in a card format',
  },
  'dashboard-widget': {
    name: 'Dashboard Widget',
    component: DashboardWidget,
    category: 'Dashboard',
    description: 'A widget for the dashboard page',
  },
};
```

## Best Practices

1. **No Required Props**: Components should work without props or provide sensible defaults
2. **Self-Contained**: Components should include their own styling and not depend on parent context
3. **Error Handling**: Components should handle errors gracefully and not crash the canvas
4. **Performance**: Avoid components with heavy initial renders or infinite loops
5. **Naming Consistency**: Keep naming patterns consistent across the registry

## AI Code Editor Instructions

When a user asks to register a component:

1. **Identify the component** - Find the component file and its export
2. **Determine the import path** - Use absolute paths with `@/` alias when possible
3. **Choose an appropriate key** - kebab-case, unique, descriptive
4. **Add the entry** - Include name, component, and optionally category/description
5. **Verify the import** - Ensure the import path is correct and component exists

### Example Prompt Response

User: "Register the ProfileCard component from components/profile/ProfileCard.tsx"

AI Action:
```typescript
// Add to imports
import { ProfileCard } from '@/components/profile/ProfileCard';

// Add to registry
'profile-card': {
  name: 'Profile Card',
  component: ProfileCard,
  category: 'Profile',
  description: 'User profile card component',
},
```

## Troubleshooting

### Component Not Showing
- Check import path is correct
- Verify component is exported from its file
- Ensure registry key matches what's being requested

### Component Crashes Canvas
- Component may have required props - add defaults or wrapper
- Check for context dependencies (providers not available)
- Look for client/server component mismatches

### Styling Issues
- Component styles may conflict with canvas
- Consider wrapping in a container with `isolate` class
- Check for global styles affecting the component
