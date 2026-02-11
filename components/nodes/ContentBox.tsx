'use client';

import { memo, useState, useCallback } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Download, FileText } from 'lucide-react';
import { Input } from '../ui/input';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { fileUtils } from '../../lib/utils';
import type { ContentNodeData } from '../../lib/types';

function ContentBoxComponent({ id, selected }: NodeProps) {
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [editingAlias, setEditingAlias] = useState('');

  // Read data directly from Zustand for this specific node
  const data = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data as ContentNodeData | undefined;
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

  // Early return if node data not found
  if (!data) return null;

  const isInteractive = !!selected;

  return (
    <>
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        lineClassName="!border-transparent"
        handleClassName="!border-0 !rounded-none !w-6 !h-6"
        handleStyle={{
          backgroundColor: 'transparent',
          border: 'none',
          width: '24px',
          height: '24px',
        }}
        onResize={(_, params) => {
          updateNode(id, { width: params.width, height: params.height });
        }}
      />
      <div
        className={`
          relative
          rounded-[32px]
          transition-all duration-300
          border-[#DDD6C7] border
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
            {/* Top Left Arc */}
            <svg
              className="absolute pointer-events-none z-[1000]"
              style={{ top: -16, left: -16, width: 40, height: 40 }}
              viewBox="0 0 40 40"
            >
              <path
                d="M 12 33 L 12 28 A 16 16 0 0 1 28 12 L 33 12"
                fill="none"
                stroke="#D4CDBD"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Top Right Arc */}
            <svg
              className="absolute pointer-events-none z-[1000]"
              style={{ top: -16, right: -16, width: 40, height: 40 }}
              viewBox="0 0 40 40"
            >
              <path
                d="M 7 12 L 12 12 A 16 16 0 0 1 28 28 L 28 33"
                fill="none"
                stroke="#D4CDBD"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Bottom Left Arc */}
            <svg
              className="absolute pointer-events-none z-[1000]"
              style={{ bottom: -16, left: -16, width: 40, height: 40 }}
              viewBox="0 0 40 40"
            >
              <path
                d="M 12 7 L 12 12 A 16 16 0 0 0 28 28 L 33 28"
                fill="none"
                stroke="#D4CDBD"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Bottom Right Arc */}
            <svg
              className="absolute pointer-events-none z-[1000]"
              style={{ bottom: -16, right: -16, width: 40, height: 40 }}
              viewBox="0 0 40 40"
            >
              <path
                d="M 7 28 L 12 28 A 16 16 0 0 0 28 12 L 28 7"
                fill="none"
                stroke="#D4CDBD"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}

        {/* Header - drag handle; alias/input have nodrag */}
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
              <FileText className="w-3 h-3" />
              {data.alias}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className={`px-6 pb-6 h-[calc(100%-60px)] overflow-y-auto custom-scrollbar ${isInteractive ? 'nodrag nowheel nopan' : ''}`}>
          {data.fileData ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300/50 bg-[#DDD6C7]/30">
              {/* File icon with container */}
              <div className="w-14 h-14 rounded-2xl bg-[#D9D0BE] flex items-center justify-center shadow-sm">
                <span className="text-3xl">
                  {fileUtils.getFileIcon(data.fileData.fileType)}
                </span>
              </div>
              <div className="text-center px-3">
                <div className="font-bold text-[13px] text-zinc-700 truncate max-w-full" title={data.fileData.fileName}>
                  {data.fileData.fileName}
                </div>
                <div className="text-[11px] font-medium text-zinc-500 mt-0.5">
                  {fileUtils.formatFileSize(data.fileData.fileSize)}
                </div>
              </div>
              <button
                className="
                  flex items-center gap-1.5
                  px-3 py-1.5 rounded-lg
                  text-[11px] font-bold text-zinc-600
                  bg-[#D9D0BE] hover:bg-[#CDC4B2]
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
                DOWNLOAD
              </button>
            </div>
          ) : (
            <textarea
              value={data.content || ''}
              onChange={(e) => updateNode(id, { content: e.target.value })}
              placeholder="Enter content or drop a file here..."
              className="w-full h-full bg-transparent border-none focus:ring-0 resize-none text-[15px] text-zinc-700 leading-relaxed font-medium placeholder:text-zinc-400/50 outline-none"
              style={{ fontSize: '15px' }}
            />
          )}
        </div>
      </div>
    </>
  );
}

export const ContentBox = memo(ContentBoxComponent);
