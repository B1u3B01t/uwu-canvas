'use client';

import { memo, useState } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Download, FileText } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { BOX_BACKGROUNDS, FONT_SIZES, INPUT_OUTPUT_STYLE, RESIZE_HANDLE_SIZE } from '../../lib/constants';
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

  // Get input/output styles based on backgroundType setting
  const inputStyle = INPUT_OUTPUT_STYLE[INPUT_OUTPUT_STYLE.backgroundType];

  return (
    <>
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        lineClassName="!border-transparent"
        handleClassName="!border !rounded-full"
        handleStyle={{
          width: RESIZE_HANDLE_SIZE,
          height: RESIZE_HANDLE_SIZE,
          backgroundColor: 'var(--accent-content)',
          borderColor: 'var(--accent-content)',
        }}
        onResize={(_, params) => {
          updateNode(id, { width: params.width, height: params.height });
        }}
      />
      <div
        className="
          relative
          backdrop-blur-md
          rounded-3xl
          transition-all duration-150
        "
        style={{
          width: data.width,
          height: data.height,
          backgroundColor: BOX_BACKGROUNDS.content,
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
              className="h-5 w-24 text-[11px] font-mono"
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
                backgroundColor: 'var(--pastel-content-bg)',
                color: 'var(--pastel-content-text)',
              }}
              onClick={() => setIsEditingAlias(true)}
            >
              <FileText className="w-3 h-3" />
              {data.alias}
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
              className={`h-full resize-none ${inputStyle.background} ${inputStyle.border} ${inputStyle.focusBorder} rounded-lg`}
              style={{ fontSize: FONT_SIZES.textarea }}
            />
          )}
        </div>
      </div>
    </>
  );
}

export const ContentBox = memo(ContentBoxComponent);
