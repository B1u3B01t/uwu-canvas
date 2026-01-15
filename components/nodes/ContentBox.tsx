'use client';

import { memo, useState } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader } from '../ui/card';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import type { ContentNodeData } from '../../lib/types';

function ContentBoxComponent({ id, selected }: NodeProps) {
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  
  // Read data directly from Zustand for this specific node
  const data = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data as ContentNodeData | undefined;
  });
  
  const updateNode = useCanvasStore((state) => state.updateNode);
  const removeNode = useCanvasStore((state) => state.removeNode);
  
  // Early return if node data not found
  if (!data) return null;

  return (
    <>
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        lineClassName="!border-green-500"
        handleClassName="!w-2 !h-2 !bg-green-500 !border-green-500"
        onResize={(_, params) => {
          updateNode(id, { width: params.width, height: params.height });
        }}
      />
      <Card 
        className="shadow-md transition-shadow hover:shadow-lg"
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
                className="h-6 w-24 text-xs"
                autoFocus
              />
            ) : (
              <span
                className="cursor-pointer rounded bg-green-50 px-2 py-0.5 font-mono text-xs text-green-600 hover:bg-green-100"
                onClick={() => setIsEditingAlias(true)}
              >
                @{data.alias}
              </span>
            )}
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
        <CardContent className="h-[calc(100%-48px)] px-3 pb-3">
          <Textarea
            value={data.content}
            onChange={(e) => updateNode(id, { content: e.target.value })}
            placeholder="Enter content here..."
            className="h-full resize-none text-xs"
          />
        </CardContent>
      </Card>
    </>
  );
}

export const ContentBox = memo(ContentBoxComponent);
