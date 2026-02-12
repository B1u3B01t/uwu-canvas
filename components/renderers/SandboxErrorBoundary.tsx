'use client';

import React from 'react';

interface SandboxErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error) => React.ReactNode;
}

interface SandboxErrorBoundaryState {
  error: Error | null;
}

/**
 * Error boundary for the live preview sandbox. Catches runtime errors from
 * generated code (e.g. undefined props) so the canvas doesn't crash.
 * Implements getDerivedStateFromError so React is satisfied.
 */
export class SandboxErrorBoundary extends React.Component<
  SandboxErrorBoundaryProps,
  SandboxErrorBoundaryState
> {
  static getDerivedStateFromError(error: Error): SandboxErrorBoundaryState {
    return { error };
  }

  state: SandboxErrorBoundaryState = { error: null };

  componentDidCatch(error: Error) {
    // Already in state via getDerivedStateFromError; log if needed
    console.warn('[Sandbox] Preview error:', error.message);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }
      return (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3 text-xs font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap">
          {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}
