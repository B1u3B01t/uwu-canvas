'use client';

import { memo, useState } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Download, FileIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
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
        lineClassName="!border-transparent"
        handleClassName="!w-2.5 !h-2.5 !bg-white !border !border-zinc-200 !rounded-full"
        onResize={(_, params) => {
          updateNode(id, { width: params.width, height: params.height });
        }}
      />
      <div
        className="
          relative
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
          style={{ backgroundColor: 'var(--accent-content)' }}
        />

        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          {isEditingAlias ? (
            <Input
              value={data.alias}
              onChange={(e) => updateNode(id, { alias: e.target.value })}
              onBlur={() => setIsEditingAlias(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingAlias(false)}
              className="h-5 w-24 text-[11px] font-mono"
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
                backgroundColor: 'var(--clay-content-bg)',
                color: 'var(--clay-content-text)',
              }}
              onClick={() => setIsEditingAlias(true)}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-content)' }}
              />
              @{data.alias}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-4 h-[calc(100%-52px)]">
          {data.fileData ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/30">
              {/* File icon with gradient container */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center shadow-sm">
                <span className="text-3xl">
                  {fileUtils.getFileIcon(data.fileData.fileType)}
                </span>
              </div>
              <div className="text-center px-3">
                <div className="font-medium text-[13px] text-zinc-700 truncate max-w-full" title={data.fileData.fileName}>
                  {data.fileData.fileName}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  {fileUtils.formatFileSize(data.fileData.fileSize)}
                </div>
              </div>
              <button
                className="
                  flex items-center gap-1.5
                  px-3 py-1.5 rounded-lg
                  text-[11px] font-medium text-zinc-600
                  bg-white border border-zinc-200
                  hover:bg-zinc-50 hover:border-zinc-300
                  active:scale-95
                  transition-all duration-150
                "
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `data:${data.fileData!.fileType};base64,${data.fileData!.data}`;
                  link.download = data.fileData!.fileName;
                  link.click();
                }}
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          ) : (
            <Textarea
              value={data.content || ''}
              onChange={(e) => updateNode(id, { content: e.target.value })}
              placeholder="Enter content or drop a file here..."
              className="h-full resize-none text-[13px] bg-zinc-50/50 border-zinc-100 focus:border-zinc-200 rounded-lg"
            />
          )}
        </div>
      </div>
    </>
  );
}

export const ContentBox = memo(ContentBoxComponent);
