import type { ComponentType } from 'react';
import { LoginForm } from '@/components/demo/LoginForm';
import { PricingCard } from '@/components/demo/PricingCard';
import { UserProfile } from '@/components/demo/UserProfile';
import { StatsCard } from '@/components/demo/StatsCard';
import HomePage from '@/app/page';

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
  // Pages
  'page-home': {
    name: '/',
    component: HomePage,
    category: 'Pages',
    description: 'Home page',
  },
  // Components
  'login-form': {
    name: 'Login Form',
    component: LoginForm,
    category: 'Components',
    description: 'A sign-in form with email and password fields',
  },
  'pricing-card': {
    name: 'Pricing Card',
    component: PricingCard,
    category: 'Components',
    description: 'A pricing plan card with features list',
  },
  'user-profile': {
    name: 'User Profile',
    component: UserProfile,
    category: 'Components',
    description: 'A user profile card with avatar and details',
  },
  'stats-card': {
    name: 'Stats Dashboard',
    component: StatsCard,
    category: 'Components',
    description: 'A grid of statistics cards with trends',
  },
  // Add more components here following the pattern above
  // See REGISTRY_GUIDELINES.md for detailed instructions
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
