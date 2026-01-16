import type { ComponentType } from 'react';
import { AudriaApp } from '@/app/audria/AudriaApp';

// Component registry entry
export interface RegistryEntry {
  name: string;
  component: ComponentType<Record<string, unknown>>;
  category?: string;
  description?: string;
}

// The component registry - AI code editors should add entries here
// See REGISTRY_GUIDELINES.md for instructions
//
// ⚠️ WARNING: NEVER add /uwu-canvas page to this registry!
// It will cause an infinite loop since ComponentBox renders registry components.
//
export const componentRegistry: Record<string, RegistryEntry> = {
  'audria': {
    name: 'Audria',
    component: AudriaApp,
    category: 'App',
    description: 'Mobile app with 3D theme sphere and iOS-style bottom sheet',
  },
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
