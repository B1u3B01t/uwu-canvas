'use client';

import { memo, useState, useCallback } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { ChevronDown, ChevronRight, X, Sparkles, FileText, Layout, Database, MoreVertical } from 'lucide-react';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { FOLDER_COLORS } from '../../lib/constants';
import { FolderIcon } from './FolderIcon';
import type { FolderNodeData, FolderColor, CanvasNode } from '../../lib/types';

// Type icon mapping
function NodeTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'generator':
      return <Sparkles className="w-3 h-3 text-zinc-400" />;
    case 'content':
      return <FileText className="w-3 h-3 text-zinc-400" />;
    case 'component':
      return <Layout className="w-3 h-3 text-zinc-400" />;
    case 'data2ui':
      return <Database className="w-3 h-3 text-zinc-400" />;
    default:
      return <FileText className="w-3 h-3 text-zinc-400" />;
  }
}

function FolderBoxComponent({ id, selected }: NodeProps) {
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [editingAlias, setEditingAlias] = useState('');

  const data = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data as FolderNodeData | undefined;
  });

  const childNodeIds = data?.childNodeIds;

  const childNodes = useCanvasStore(
    useShallow((state) =>
      childNodeIds
        ? childNodeIds
            .map((childId) => state.nodes.find((n) => n.id === childId))
            .filter((n): n is CanvasNode => n !== undefined)
        : []
    )
  );

  const updateNode = useCanvasStore((state) => state.updateNode);
  const isAliasUnique = useCanvasStore((state) => state.isAliasUnique);
  const showDuplicateAliasToast = useCanvasStore((state) => state.showDuplicateAliasToast);
  const removeNodeFromFolder = useCanvasStore((state) => state.removeNodeFromFolder);
  const toggleFolderExpanded = useCanvasStore((state) => state.toggleFolderExpanded);
  const setFolderColor = useCanvasStore((state) => state.setFolderColor);
  const selectNode = useCanvasStore((state) => state.selectNode);
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

  if (!data) return null;

  const isInteractive = !!selected;
  const colors = FOLDER_COLORS[data.color];
  const ChevronIcon = data.isExpanded ? ChevronDown : ChevronRight;

  return (
    <>
      <NodeResizer
        minWidth={240}
        minHeight={120}
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
          border border-[#DDD6C7]
          transition-all duration-300
          overflow-hidden
          ${isDeleting ? 'uwu-node-exit' : 'uwu-node-enter'}
        `}
        style={{
          width: data.width,
          height: data.height,
          backgroundColor: colors.frost,
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
        {/* Background folder SVG */}
        <div className="absolute inset-0 top-8 pointer-events-none opacity-15">
          <FolderIcon
            tabColor={colors.tab}
            bodyColor={colors.body}
            size={data.width}
          />
        </div>

        {/* Content overlay */}
        <div className={`relative z-10 h-full flex flex-col ${isInteractive ? 'nodrag nowheel nopan' : ''}`}>
          {/* Header - drag handle; interactive children have nodrag */}
          <div className="uwu-drag-handle flex items-center gap-2 px-6 pt-5 pb-2 cursor-grab active:cursor-grabbing">
            <FolderIcon tabColor={colors.tab} bodyColor={colors.body} size={18} />

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
                className="nodrag inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-md bg-[#D9D0BE] w-fit text-[11px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => { setEditingAlias(data.alias); setIsEditingAlias(true); }}
              >
                {data.alias}
              </div>
            )}

            <div className="nodrag ml-auto flex items-center gap-0.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="
                      p-1 rounded-md
                      text-zinc-400 hover:text-zinc-600 hover:bg-[#DDD6C7]/50
                      active:scale-95
                      transition-all duration-100
                      cursor-pointer
                    "
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuLabel>Color</DropdownMenuLabel>
                  <div className="flex flex-wrap gap-1.5 p-2">
                    {(Object.keys(FOLDER_COLORS) as FolderColor[]).map((color) => (
                      <button
                        key={color}
                        className={`
                          w-5 h-5 rounded-full
                          transition-all duration-100
                          cursor-pointer hover:scale-110
                          ${data.color === color ? 'ring-2 ring-offset-1 ring-zinc-400' : ''}
                        `}
                        style={{ backgroundColor: FOLDER_COLORS[color].body }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderColor(id, color);
                        }}
                      />
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={() => toggleFolderExpanded(id)}
                className="
                  p-1 rounded-md
                  text-zinc-400 hover:text-zinc-600 hover:bg-[#DDD6C7]/50
                  active:scale-95
                  transition-all duration-100
                  cursor-pointer
                "
              >
                <ChevronIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 pb-4 overflow-hidden">
            {data.isExpanded ? (
              <div className="flex flex-col h-full">
                {/* Child list */}
                <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
                  {childNodes.map((child) => (
                    <div
                      key={child.id}
                      className="
                        group flex items-center gap-2
                        px-2 py-1.5 rounded-lg
                        bg-[#DDD6C7]/30 hover:bg-[#DDD6C7]/50
                        cursor-pointer
                        transition-colors duration-100
                      "
                      onClick={() => selectNode(child.id)}
                    >
                      <NodeTypeIcon type={child.data.type} />
                      <span className="font-mono text-[11px] text-zinc-600 truncate">
                        {child.data.alias}
                      </span>
                      <span className="text-[10px] text-zinc-400 capitalize">
                        {child.data.type}
                      </span>
                      <button
                        className="
                          ml-auto opacity-0 group-hover:opacity-100
                          p-0.5 rounded
                          text-zinc-400 hover:text-zinc-600 hover:bg-[#DDD6C7]/50
                          active:scale-90
                          transition-all duration-100
                          cursor-pointer
                        "
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNodeFromFolder(id, child.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {childNodes.length === 0 && (
                    <div className="flex items-center justify-center h-full min-h-[60px] rounded-xl border border-dashed border-[#D9D0BE]">
                      <p className="text-[11px] text-zinc-400">
                        Right-click nodes to add
                      </p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <p className="text-[12px] text-zinc-400 px-1">
                {data.childNodeIds.length} {data.childNodeIds.length === 1 ? 'item' : 'items'}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const FolderBox = memo(FolderBoxComponent);
