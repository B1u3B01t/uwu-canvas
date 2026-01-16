'use client';

import { memo, useState } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { X, Smartphone, Monitor } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader } from '../ui/card';
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
import Script from 'next/script';

function ComponentBoxComponent({ id, selected }: NodeProps) {
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  
  // Read data directly from Zustand for this specific node
  const data = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data as ComponentNodeData | undefined;
  });
  
  const updateNode = useCanvasStore((state) => state.updateNode);
  const removeNode = useCanvasStore((state) => state.removeNode);
  
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
        lineClassName="!border-purple-500"
        handleClassName="!w-2 !h-2 !bg-purple-500 !border-purple-500"
        onResize={(_, params) => {
          updateNode(id, { width: params.width, height: params.height });
        }}
      />
      <Card 
        className="flex flex-col shadow-md transition-shadow hover:shadow-lg"
        style={{ width: data.width, height: data.height }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-3">
          <div className="flex items-center gap-2">
            {isEditingAlias ? (
              <Input
                value={data.alias}
                onChange={(e) => updateNode(id, { alias: e.target.value })}
                onBlur={() => setIsEditingAlias(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingAlias(false)}
                className="h-5 w-20 text-xs"
                autoFocus
              />
            ) : (
              <span
                className="cursor-pointer rounded bg-purple-50 px-2 py-0.5 font-mono text-xs text-purple-600 hover:bg-purple-100"
                onClick={() => setIsEditingAlias(true)}
              >
                @{data.alias}
              </span>
            )}
            {/* Component Selector */}
            <Select
              value={data.componentKey}
              onValueChange={(value) => updateNode(id, { componentKey: value })}
            >
              <SelectTrigger className="h-5 w-[100px] border-none bg-muted/50 px-1.5 text-[10px]">
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
            {/* View Mode Toggle */}
            <div className="flex rounded-sm border">
              <Button
                variant={data.viewMode === 'mobile' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-5 w-5 rounded-r-none"
                onClick={() => handleViewModeChange('mobile')}
              >
                <Smartphone className="h-3 w-3" />
              </Button>
              <Button
                variant={data.viewMode === 'laptop' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-5 w-5 rounded-l-none"
                onClick={() => handleViewModeChange('laptop')}
              >
                <Monitor className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => removeNode(id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-2 overflow-hidden px-3 pb-3">
          {/* Component Render Area - iframe for proper viewport simulation */}
          <div className="flex-1 overflow-hidden rounded-xl border bg-white">
            {data.componentKey && selectedComponent ? (
              <iframe
                src={`/uwu-canvas/preview/${data.componentKey}`}
                className="h-full w-full border-0"
                title={selectedComponent.name}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {registryKeys.length === 0 
                  ? 'No components in registry. See REGISTRY_GUIDELINES.md'
                  : 'Select a component to render'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export const ComponentBox = memo(ComponentBoxComponent);
