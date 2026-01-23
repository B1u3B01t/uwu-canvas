'use client';

import { memo, useState } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader } from '../ui/card';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { fileUtils } from '../../lib/utils';
import type { ContentNodeData } from '../../lib/types';

function ContentBoxComponent({ id, selected }: NodeProps) {
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  
  // Read data directly from Zustand for this specific node
  const data = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data as ContentNodeData | undefined;
  });
  
  const updateNode = useCanvasStore((state) => state.updateNode);
  
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
        className="bg-transparent !border-transparent hover:!border-gray-200 shadow-none transition-all hover:shadow-lg !rounded-2xl"
        style={{ width: data.width, height: data.height }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-2">
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
                className="cursor-pointer rounded-lg bg-green-50 px-2 py-0.5 font-mono text-xs text-green-600 hover:bg-green-100"
                onClick={() => setIsEditingAlias(true)}
              >
                @{data.alias}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="h-[calc(100%-40px)] px-2 pb-2">
          {data.fileData ? (
            <div className="h-full flex flex-col items-center justify-center space-y-2">
              <div className="text-4xl">
                {fileUtils.getFileIcon(data.fileData.fileType)}
              </div>
              <div className="text-center">
                <div className="font-medium text-sm truncate max-w-full" title={data.fileData.fileName}>
                  {data.fileData.fileName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {fileUtils.formatFileSize(data.fileData.fileSize)}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  // Create download link
                  const link = document.createElement('a');
                  link.href = `data:${data.fileData.fileType};base64,${data.fileData.data}`;
                  link.download = data.fileData.fileName;
                  link.click();
                }}
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          ) : (
            <Textarea
              value={data.content || ''}
              onChange={(e) => updateNode(id, { content: e.target.value })}
              placeholder="Enter content here..."
              className="h-full resize-none text-xs bg-white"
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}

export const ContentBox = memo(ContentBoxComponent);
