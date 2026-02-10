'use client';

import { memo, useState } from 'react';
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
  const removeNodeFromFolder = useCanvasStore((state) => state.removeNodeFromFolder);
  const toggleFolderExpanded = useCanvasStore((state) => state.toggleFolderExpanded);
  const setFolderColor = useCanvasStore((state) => state.setFolderColor);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const isDeleting = useCanvasStore((state) => state.deletingNodeIds.has(id));

  if (!data) return null;

  const colors = FOLDER_COLORS[data.color];
  const ChevronIcon = data.isExpanded ? ChevronDown : ChevronRight;

  return (
    <>
      <NodeResizer
        minWidth={240}
        minHeight={120}
        isVisible={selected}
        lineClassName="!border-transparent"
        handleClassName="!border !rounded-full"
        handleStyle={{
          backgroundColor: colors.body,
          borderColor: colors.body,
        }}
        onResize={(_, params) => {
          updateNode(id, { width: params.width, height: params.height });
        }}
      />
      <div
        className={`
          relative
          backdrop-blur-md
          rounded-3xl
          transition-all duration-150
          overflow-hidden
          ${isDeleting ? 'uwu-node-exit' : 'uwu-node-enter'}
        `}
        style={{
          width: data.width,
          height: data.height,
          backgroundColor: colors.frost,
        }}
      >
        {/* Background folder SVG */}
        <div className="absolute inset-0 top-8 pointer-events-none opacity-15">
          <FolderIcon
            tabColor={colors.tab}
            bodyColor={colors.body}
            size={data.width}
          />
        </div>

        {/* Content overlay */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <FolderIcon tabColor={colors.tab} bodyColor={colors.body} size={18} />

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
                  group flex items-center gap-1
                  cursor-pointer rounded-full px-2 py-0.5
                  font-mono text-[11px]
                  hover:opacity-80 transition-opacity
                "
                style={{
                  backgroundColor: colors.pastelBg,
                  color: colors.pastelText,
                }}
                onClick={() => setIsEditingAlias(true)}
              >
                {data.alias}
              </span>
            )}

            <div className="ml-auto flex items-center gap-0.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="
                      p-1 rounded-md
                      text-zinc-400 hover:text-zinc-600 hover:bg-white/30
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
                  text-zinc-400 hover:text-zinc-600 hover:bg-white/30
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
          <div className="flex-1 px-4 pb-3 overflow-hidden">
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
                        bg-white/30 hover:bg-white/50
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
                          text-zinc-400 hover:text-zinc-600 hover:bg-white/50
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
                    <div className="flex items-center justify-center h-full min-h-[60px] rounded-xl border border-dashed border-zinc-300/50">
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
