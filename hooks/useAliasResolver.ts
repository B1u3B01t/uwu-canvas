'use client';

import { useMemo } from 'react';
import { useCanvasStore } from './useCanvasStore';

export interface AliasOption {
  alias: string;
  type: 'generator' | 'content' | 'component';
  nodeId: string;
  label: string;
}

export function useAliasResolver() {
  const nodes = useCanvasStore((state) => state.nodes);
  const resolveAlias = useCanvasStore((state) => state.resolveAlias);
  const resolveAllAliases = useCanvasStore((state) => state.resolveAllAliases);

  const allAliases = useMemo<AliasOption[]>(() => {
    return nodes.map((node) => {
      const data = node.data;
      let label = data.alias;
      
      if (data.type === 'generator') {
        label = `${data.alias} (Generator)`;
      } else if (data.type === 'content') {
        label = `${data.alias} (Content)`;
      } else if (data.type === 'component') {
        label = `${data.alias} (Component: ${data.componentKey || 'none'})`;
      }
      
      return {
        alias: data.alias,
        type: data.type,
        nodeId: node.id,
        label,
      };
    });
  }, [nodes]);

  const filterAliases = (query: string): AliasOption[] => {
    if (!query) return allAliases;
    const lowerQuery = query.toLowerCase();
    return allAliases.filter(
      (option) =>
        option.alias.toLowerCase().includes(lowerQuery) ||
        option.label.toLowerCase().includes(lowerQuery)
    );
  };

  return {
    allAliases,
    filterAliases,
    resolveAlias,
    resolveAllAliases,
  };
}
