'use client';

import { memo, useState } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Smartphone, Monitor } from 'lucide-react';
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

function ComponentBoxComponent({ id, selected }: NodeProps) {
  const [isEditingAlias, setIsEditingAlias] = useState(false);

  // Read data directly from Zustand for this specific node
  const data = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data as ComponentNodeData | undefined;
  });

  const updateNode = useCanvasStore((state) => state.updateNode);

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
    <>
      <NodeResizer
        minWidth={300}
        minHeight={400}
        isVisible={selected}
        lineClassName="!border-transparent"
        handleClassName="!w-2.5 !h-2.5 !bg-white !border !border-zinc-200 !rounded-full"
        onResize={(_, params) => {
          updateNode(id, { width: params.width, height: params.height });
        }}
      />
      <div
        className="
          relative flex flex-col
          bg-white/80 backdrop-blur-md
          rounded-2xl
          border border-white/60
          transition-all duration-150
          hover:shadow-[var(--shadow-node-hover)]
        "
        style={{
          width: data.width,
          height: data.height,
          boxShadow: 'var(--shadow-node)',
        }}
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
          style={{ backgroundColor: 'var(--accent-component)' }}
        />

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
                cursor-pointer rounded-md px-2 py-0.5
                font-mono text-[11px]
                hover:opacity-80 transition-opacity
              "
              style={{
                backgroundColor: 'var(--clay-component-bg)',
                color: 'var(--clay-component-text)',
              }}
              onClick={() => setIsEditingAlias(true)}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-component)' }}
              />
              @{data.alias}
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
    </>
  );
}

export const ComponentBox = memo(ComponentBoxComponent);
