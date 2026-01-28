import type { ComponentType } from 'react';
import { ExampleComponent } from '../components/examples/ExampleComponent';

// Component registry entry
export interface RegistryEntry {
  name: string;
  component: ComponentType<Record<string, unknown>>;
  category?: string;
  description?: string;
}

/**
 * Component Registry
 *
 * Register your components here to make them available in ComponentBox previews.
 * AI code editors can add entries here following the pattern below.
 *
 * USAGE:
 * 1. Import your component at the top of this file
 * 2. Add an entry to componentRegistry with a unique key
 *
 * EXAMPLE:
 * ```typescript
 * import { MyComponent } from '@/app/my-app/MyComponent';
 *
 * export const componentRegistry: Record<string, RegistryEntry> = {
 *   'my-component': {
 *     name: 'My Component',
 *     component: MyComponent,
 *     category: 'App',
 *     description: 'Description of my component',
 *   },
 * };
 * ```
 *
 * WARNING: NEVER add /uwu-canvas page to this registry!
 * It will cause an infinite loop since ComponentBox renders registry components.
 */
export const componentRegistry: Record<string, RegistryEntry> = {
  // Example component - replace with your own components
  'example': {
    name: 'Example',
    component: ExampleComponent,
    category: 'Example',
    description: 'Example component to demonstrate the registry pattern',
  },
  // Add your components here:
  // 'your-component-key': {
  //   name: 'Your Component Name',
  //   component: YourComponent,
  //   category: 'Your Category',
  //   description: 'Description of your component',
  // },
};

// Helper functions
export function getRegistryEntries(): RegistryEntry[] {
  return Object.values(componentRegistry);
}

export function getRegistryKeys(): string[] {
  return Object.keys(componentRegistry);
}

export function getComponentByKey(key: string): RegistryEntry | undefined {
  return componentRegistry[key];
}

export function getComponentsByCategory(category: string): RegistryEntry[] {
  return Object.values(componentRegistry).filter((entry) => entry.category === category);
}

export function getAllCategories(): string[] {
  const categories = new Set<string>();
  Object.values(componentRegistry).forEach((entry) => {
    if (entry.category) categories.add(entry.category);
  });
  return Array.from(categories);
}
