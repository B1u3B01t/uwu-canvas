'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { NodeProps } from '@xyflow/react';
import { Smartphone, Monitor, Layout, Check } from 'lucide-react';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { getRegistryKeys, getComponentByKey } from '../../lib/registry';
import { BOX_DEFAULTS } from '../../lib/constants';
import type { ComponentNodeData } from '../../lib/types';

interface PromptCopiedMessage {
  type: 'DYNAMIC_PROMPT_COPIED';
  payload: {
    componentName: string;
    filePath: string;
  };
}

function isPromptCopiedMessage(data: unknown): data is PromptCopiedMessage {
  if (typeof data !== 'object' || data === null) return false;
  if (!('type' in data) || (data as Record<string, unknown>).type !== 'DYNAMIC_PROMPT_COPIED') return false;
  if (!('payload' in data)) return false;

  const payload = (data as Record<string, unknown>).payload;
  if (typeof payload !== 'object' || payload === null) return false;

  const { componentName, filePath } = payload as Record<string, unknown>;
  return typeof componentName === 'string' && typeof filePath === 'string';
}

function ComponentBoxComponent({ id, selected }: NodeProps) {
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [editingAlias, setEditingAlias] = useState('');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Read data directly from Zustand for this specific node
  const data = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data as ComponentNodeData | undefined;
  });

  const updateNode = useCanvasStore((state) => state.updateNode);
  const isAliasUnique = useCanvasStore((state) => state.isAliasUnique);
  const showDuplicateAliasToast = useCanvasStore((state) => state.showDuplicateAliasToast);
  const isDeleting = useCanvasStore((state) => state.deletingNodeIds.has(id));

  const commitAlias = useCallback(() => {
    const trimmed = editingAlias.trim();
    if (trimmed && trimmed !== data?.alias) {
      if (isAliasUnique(trimmed, id)) {
        updateNode(id, { alias: trimmed });
      } else {
        showDuplicateAliasToast(trimmed);
      }
    }
    setIsEditingAlias(false);
  }, [editingAlias, data?.alias, id, isAliasUnique, updateNode, showDuplicateAliasToast]);

  // Listen for prompt copied notifications from iframe
  useEffect(() => {
    if (!data?.componentKey) return;

    const handleMessage = (event: MessageEvent) => {
      if (isPromptCopiedMessage(event.data)) {
        const { componentName } = event.data.payload;
        setCopiedToast(componentName);
        // Auto-hide toast after 3 seconds
        setTimeout(() => setCopiedToast(null), 3000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [data?.componentKey]);

  // Early return if node data not found
  if (!data) return null;

  const isInteractive = !!selected;
  const registryKeys = getRegistryKeys();
  const selectedComponent = data.componentKey ? getComponentByKey(data.componentKey) : null;

  const handleViewModeChange = (mode: 'mobile' | 'laptop') => {
    const dimensions = mode === 'mobile'
      ? BOX_DEFAULTS.component.mobile
      : BOX_DEFAULTS.component.laptop;
    updateNode(id, {
      viewMode: mode,
      width: dimensions.width,
      height: dimensions.height
    });
  };

  return (
    <div
        className={`
          relative flex flex-col
          rounded-[32px]
          border border-[#DDD6C7]
          transition-all duration-300
          ${isDeleting ? 'uwu-node-exit' : 'uwu-node-enter'}
        `}
        style={{
          width: data.width,
          height: data.height,
          backgroundColor: '#E6E1D4',
        }}
      >
        {/* Custom arc handles */}
        {selected && (
          <>
            <svg className="absolute pointer-events-none z-[1000]" style={{ top: -16, left: -16, width: 40, height: 40 }} viewBox="0 0 40 40">
              <path d="M 12 33 L 12 28 A 16 16 0 0 1 28 12 L 33 12" fill="none" stroke="#D4CDBD" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className="absolute pointer-events-none z-[1000]" style={{ top: -16, right: -16, width: 40, height: 40 }} viewBox="0 0 40 40">
              <path d="M 7 12 L 12 12 A 16 16 0 0 1 28 28 L 28 33" fill="none" stroke="#D4CDBD" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className="absolute pointer-events-none z-[1000]" style={{ bottom: -16, left: -16, width: 40, height: 40 }} viewBox="0 0 40 40">
              <path d="M 12 7 L 12 12 A 16 16 0 0 0 28 28 L 33 28" fill="none" stroke="#D4CDBD" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className="absolute pointer-events-none z-[1000]" style={{ bottom: -16, right: -16, width: 40, height: 40 }} viewBox="0 0 40 40">
              <path d="M 7 28 L 12 28 A 16 16 0 0 0 28 12 L 28 7" fill="none" stroke="#D4CDBD" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}

        {/* Header - drag handle; interactive children have nodrag */}
        <div className="uwu-drag-handle flex items-center gap-2 px-6 pt-5 pb-2 cursor-grab active:cursor-grabbing">
          {isEditingAlias ? (
            <Input
              value={editingAlias}
              onChange={(e) => setEditingAlias(e.target.value)}
              onBlur={() => commitAlias()}
              onKeyDown={(e) => e.key === 'Enter' && commitAlias()}
              className="nodrag h-6 w-24 text-[11px] font-bold bg-[#D9D0BE] border-none focus:ring-1 focus:ring-zinc-400"
              autoFocus
            />
          ) : (
            <div
              className="nodrag inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-md bg-[#D9D0BE] w-fit text-[11px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => { setEditingAlias(data.alias); setIsEditingAlias(true); }}
            >
              <Layout className="w-3 h-3" />
              {data.alias}
            </div>
          )}

          {/* Component Selector */}
          <Select
            value={data.componentKey}
            onValueChange={(value) => updateNode(id, { componentKey: value })}
          >
            <SelectTrigger className="nodrag h-6 w-[100px] border-none bg-[#D9D0BE]/50 px-1.5 text-[10px] hover:bg-[#D9D0BE]/80 transition-colors rounded-lg">
              <SelectValue placeholder="Component..." />
            </SelectTrigger>
            <SelectContent>
              {registryKeys.length === 0 ? (
                <SelectItem value="_empty" disabled>
                  No components
                </SelectItem>
              ) : (
                registryKeys.map((key) => {
                  const entry = getComponentByKey(key);
                  return (
                    <SelectItem key={key} value={key} className="text-xs">
                      {entry?.name || key}
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>

          {/* View Mode Toggle - Pill-shaped segmented control */}
          <div className="nodrag flex rounded-full bg-[#D9D0BE]/60 p-0.5">
            <button
              onClick={() => handleViewModeChange('mobile')}
              className={`
                h-5 w-7 rounded-full
                flex items-center justify-center
                transition-all duration-150
                ${data.viewMode === 'mobile'
                  ? 'bg-[#F5F2EF] shadow-sm text-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-700'
                }
              `}
            >
              <Smartphone className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleViewModeChange('laptop')}
              className={`
                h-5 w-7 rounded-full
                flex items-center justify-center
                transition-all duration-150
                ${data.viewMode === 'laptop'
                  ? 'bg-[#F5F2EF] shadow-sm text-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-700'
                }
              `}
            >
              <Monitor className="h-3 w-3" />
            </button>
          </div>

          {/* Toast notification when prompt is copied */}
          {copiedToast && (
            <div
              className="nodrag
                h-5 px-2 rounded-full
                bg-emerald-500 text-white
                text-[10px] font-medium
                flex items-center gap-1
                animate-in fade-in slide-in-from-right-2 duration-200
              "
            >
              <Check className="h-3 w-3" />
              {copiedToast} prompt copied!
            </div>
          )}
        </div>

        {/* Content - only interactive when node selected; otherwise events pass through to canvas */}
        <div className={`flex-1 px-6 pb-6 overflow-hidden ${isInteractive ? 'nodrag nowheel nopan' : 'pointer-events-none'}`}>
          <div className="h-full overflow-hidden rounded-2xl border border-[#DDD6C7]/50 bg-white">
            {data.componentKey && selectedComponent ? (
              <iframe
                src={`/uwu-canvas/preview/${data.componentKey}`}
                className="h-full w-full border-0"
                style={{ width: '100%', height: '100%' }}
                title={selectedComponent.name}
                allow="clipboard-read; clipboard-write"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-zinc-400">
                {registryKeys.length === 0
                  ? 'No components in registry'
                  : 'Select a component to preview'}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}

export const ComponentBox = memo(ComponentBoxComponent);
