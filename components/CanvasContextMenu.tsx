'use client';

import { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { FolderPlus, FolderOpen, Palette, ChevronDown, ChevronRight, Ungroup, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
  ContextMenuLabel,
} from './ui/context-menu';
import { useCanvasStore } from '../hooks/useCanvasStore';
import { FOLDER_COLORS } from '../lib/constants';
import { isFolderNode } from '../lib/types';
import type { FolderColor } from '../lib/types';

interface CanvasContextMenuProps {
  children: React.ReactNode;
}

// Color dot component for the color picker
function ColorDot({ color, isActive, onClick }: { color: FolderColor; isActive: boolean; onClick: () => void }) {
  const colors = FOLDER_COLORS[color];
  return (
    <button
      className={`w-5 h-5 rounded-full border-2 transition-all duration-100 cursor-pointer hover:scale-110 ${
        isActive ? 'border-gray-900 scale-110' : 'border-transparent'
      }`}
      style={{ backgroundColor: colors.body }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    />
  );
}

export function CanvasContextMenu({ children }: CanvasContextMenuProps) {
  const { screenToFlowPosition } = useReactFlow();
  const nodes = useCanvasStore((state) => state.nodes);
  const addNode = useCanvasStore((state) => state.addNode);
  const addNodeToFolder = useCanvasStore((state) => state.addNodeToFolder);
  const removeNodeFromFolder = useCanvasStore((state) => state.removeNodeFromFolder);
  const getFolderForNode = useCanvasStore((state) => state.getFolderForNode);
  const toggleFolderExpanded = useCanvasStore((state) => state.toggleFolderExpanded);
  const setFolderColor = useCanvasStore((state) => state.setFolderColor);
  const markNodeForDeletion = useCanvasStore((state) => state.markNodeForDeletion);
  const ungroupFolder = useCanvasStore((state) => state.ungroupFolder);
  const createFolderWithNode = useCanvasStore((state) => state.createFolderWithNode);

  const [contextNodeId, setContextNodeId] = useState<string | null>(null);
  const [contextPosition, setContextPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Get folder nodes for submenus
  const folderNodes = nodes.filter(isFolderNode);

  // Get context node data (only content nodes can be added to folders)
  const contextNode = contextNodeId ? nodes.find((n) => n.id === contextNodeId) : null;
  const isFolder = contextNode ? isFolderNode(contextNode) : false;
  const isContentNode = contextNode?.data?.type === 'content';
  const folderData = contextNode && isFolderNode(contextNode) ? contextNode.data : null;
  const parentFolderId = contextNodeId && !isFolder ? getFolderForNode(contextNodeId) : null;

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    // Check if right-click was on a node
    const target = event.target as HTMLElement;
    const nodeElement = target.closest('.react-flow__node');

    if (nodeElement) {
      const nodeId = nodeElement.getAttribute('data-id');
      setContextNodeId(nodeId);
    } else {
      setContextNodeId(null);
    }

    setContextPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handleCreateFolder = useCallback(() => {
    const position = screenToFlowPosition(contextPosition);
    addNode('folder', position);
  }, [screenToFlowPosition, contextPosition, addNode]);

  const handleCreateFolderWithNode = useCallback(() => {
    if (!contextNodeId) return;
    const position = screenToFlowPosition(contextPosition);
    createFolderWithNode(contextNodeId, position);
  }, [contextNodeId, screenToFlowPosition, contextPosition, createFolderWithNode]);

  const handleUngroup = useCallback(() => {
    if (!contextNodeId || !isFolder) return;
    ungroupFolder(contextNodeId);
  }, [contextNodeId, isFolder, ungroupFolder]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild onContextMenu={handleContextMenu}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Canvas background context menu (no node selected) */}
        {!contextNodeId && (
          <>
            <ContextMenuItem onClick={handleCreateFolder}>
              <FolderPlus className="w-4 h-4" />
              New Folder
            </ContextMenuItem>
          </>
        )}

        {/* Non-folder node context menu */}
        {contextNodeId && !isFolder && (
          <>
            {isContentNode && folderNodes.length > 0 && (
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <FolderOpen className="w-4 h-4" />
                  Add to Folder
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  {folderNodes.map((folder) => {
                    const colors = FOLDER_COLORS[folder.data.color];
                    return (
                      <ContextMenuItem
                        key={folder.id}
                        onClick={() => addNodeToFolder(folder.id, contextNodeId)}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: colors.body }}
                        />
                        {folder.data.label}
                        <span className="ml-auto text-xs text-gray-400">
                          {folder.data.childNodeIds.length}
                        </span>
                      </ContextMenuItem>
                    );
                  })}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}
            {isContentNode && (
              <ContextMenuItem onClick={handleCreateFolderWithNode}>
                <FolderPlus className="w-4 h-4" />
                Create New Folder
              </ContextMenuItem>
            )}
            {parentFolderId && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => removeNodeFromFolder(parentFolderId, contextNodeId)}>
                  <Ungroup className="w-4 h-4" />
                  Remove from Folder
                </ContextMenuItem>
              </>
            )}
          </>
        )}

        {/* Folder node context menu */}
        {contextNodeId && isFolder && folderData && (
          <>
            <ContextMenuLabel>{folderData.label}</ContextMenuLabel>
            <ContextMenuItem onClick={() => toggleFolderExpanded(contextNodeId)}>
              {folderData.isExpanded ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  Expand
                </>
              )}
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Palette className="w-4 h-4" />
                Change Color
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <div className="flex flex-wrap gap-1.5 p-2 max-w-[140px]">
                  {(Object.keys(FOLDER_COLORS) as FolderColor[]).map((color) => (
                    <ColorDot
                      key={color}
                      color={color}
                      isActive={folderData.color === color}
                      onClick={() => setFolderColor(contextNodeId, color)}
                    />
                  ))}
                </div>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleUngroup}>
              <Ungroup className="w-4 h-4" />
              Ungroup
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => markNodeForDeletion(contextNodeId)}
              className="text-red-600 data-[highlighted]:text-red-600 data-[highlighted]:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Folder
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
