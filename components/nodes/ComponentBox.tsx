'use client';

import { memo, useState, useEffect } from 'react';
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
import { BOX_DEFAULTS, BOX_BACKGROUNDS } from '../../lib/constants';
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
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Read data directly from Zustand for this specific node
  const data = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data as ComponentNodeData | undefined;
  });

  const updateNode = useCanvasStore((state) => state.updateNode);
  const isDeleting = useCanvasStore((state) => state.deletingNodeIds.has(id));

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
          backdrop-blur-md
          rounded-3xl
          transition-all duration-150
          ${isDeleting ? 'uwu-node-exit' : 'uwu-node-enter'}
        `}
        style={{
          width: data.width,
          height: data.height,
          backgroundColor: BOX_BACKGROUNDS.component,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          {isEditingAlias ? (
            <Input
              value={data.alias}
              onChange={(e) => updateNode(id, { alias: e.target.value })}
              onBlur={() => setIsEditingAlias(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingAlias(false)}
              className="h-5 w-20 text-[11px] font-mono"
              autoFocus
            />
          ) : (
            <span
              className="
                group flex items-center gap-1.5
                cursor-pointer rounded-full px-2.5 py-1
                font-mono text-[11px]
                hover:opacity-80 transition-opacity
              "
              style={{
                backgroundColor: 'var(--pastel-component-bg)',
                color: 'var(--pastel-component-text)',
              }}
              onClick={() => setIsEditingAlias(true)}
            >
              <Layout className="w-3 h-3" />
              {data.alias}
            </span>
          )}

          {/* Component Selector */}
          <Select
            value={data.componentKey}
            onValueChange={(value) => updateNode(id, { componentKey: value })}
          >
            <SelectTrigger className="h-5 w-[100px] border-none bg-zinc-50/50 px-1.5 text-[10px] hover:bg-zinc-100/50 transition-colors">
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
          <div className="flex rounded-full bg-zinc-100/80 p-0.5">
            <button
              onClick={() => handleViewModeChange('mobile')}
              className={`
                h-5 w-7 rounded-full
                flex items-center justify-center
                transition-all duration-150
                ${data.viewMode === 'mobile'
                  ? 'bg-white shadow-sm text-zinc-900'
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
                  ? 'bg-white shadow-sm text-zinc-900'
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
              className="
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

        {/* Content */}
        <div className="flex-1 px-4 pb-4 overflow-hidden">
          <div className="h-full overflow-hidden rounded-xl border border-zinc-100 bg-white">
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
