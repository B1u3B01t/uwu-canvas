'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  SelectionMode,
  useNodesState,
  useReactFlow,
  useStore,
  type NodeChange,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Undo2, Sparkles, AlertTriangle } from 'lucide-react';

import { GeneratorBox } from './nodes/GeneratorBox';
import { ContentBox } from './nodes/ContentBox';
import { ComponentBox } from './nodes/ComponentBox';
import { Data2UIBox } from './nodes/Data2UIBox';
import { FolderBox } from './nodes/FolderBox';
import { Toolbar } from './Toolbar';
import { CanvasContextMenu } from './CanvasContextMenu';
import { useCanvasStore } from '../hooks/useCanvasStore';
import { CANVAS_CONFIG } from '../lib/constants';
import { fileUtils } from '../lib/utils';
import { isFolderNode } from '../lib/types';
import type { CanvasNode } from '../lib/types';

// Define node types for React Flow
const nodeTypes = {
  generator: GeneratorBox,
  content: ContentBox,
  component: ComponentBox,
  data2ui: Data2UIBox,
  folder: FolderBox,
};

export function Canvas() {
  const storeNodes = useCanvasStore((state) => state.nodes);
  const setStoreNodes = useCanvasStore((state) => state.setNodes);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const markNodeForDeletion = useCanvasStore((state) => state.markNodeForDeletion);
  const addNode = useCanvasStore((state) => state.addNode);
  const addContentNodeWithFile = useCanvasStore((state) => state.addContentNodeWithFile);
  const isDarkMode = useCanvasStore((state) => state.isDarkMode);
  const lastDeletedNode = useCanvasStore((state) => state.lastDeletedNode);
  const undoDelete = useCanvasStore((state) => state.undoDelete);
  const duplicateAliasToast = useCanvasStore((state) => state.duplicateAliasToast);

  // Track spacebar for pan mode (Figma-style: Space+drag = pan, plain drag = select)
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        // Don't hijack space when typing in inputs/textareas
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    // Reset if window loses focus while space is held
    const handleBlur = () => setIsSpacePressed(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Derive visible nodes via useMemo — filters out children of collapsed folders
  // This avoids the infinite re-render loop caused by calling .filter() inside a Zustand selector
  const visibleNodes = useMemo(() => {
    const hiddenIds = new Set<string>();
    storeNodes.forEach((node) => {
      if (isFolderNode(node) && !node.data.isExpanded) {
        node.data.childNodeIds.forEach((id) => hiddenIds.add(id));
      }
    });
    return storeNodes.filter((node) => !hiddenIds.has(node.id));
  }, [storeNodes]);

  // Get theme colors based on dark mode
  const themeColors = isDarkMode ? CANVAS_CONFIG.dark : CANVAS_CONFIG.light;

  const [nodes, setNodes, onNodesChange] = useNodesState(visibleNodes as Node[]);
  const { fitView, screenToFlowPosition } = useReactFlow();

  // Get nodes from React Flow internal store for position sync
  const reactFlowNodes = useStore((state) => state.nodes);

  // Track node IDs to detect structural changes only
  const prevNodeIdsRef = useRef<string[]>(visibleNodes.map(n => n.id));

  // Only sync when visible nodes are added, removed, or visibility changes
  useEffect(() => {
    const currentIds = visibleNodes.map(n => n.id);
    const prevIds = prevNodeIdsRef.current;

    // Check if visible nodes changed (add/remove/expand/collapse)
    const structureChanged =
      currentIds.length !== prevIds.length ||
      !currentIds.every((id, i) => id === prevIds[i]);

    if (structureChanged) {
      // Only update position and type info for React Flow
      // Data is read directly from Zustand by node components
      setNodes(visibleNodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data, // React Flow needs this but components read from store
      })) as Node[]);
      prevNodeIdsRef.current = currentIds;
    }
  }, [visibleNodes, setNodes]);

  // Sync positions from React Flow to Zustand store (triggers auto-save via subscription)
  // Uses storeNodes (ALL nodes) so hidden children keep their positions
  const syncPositionsToStore = useCallback(() => {
    const updatedNodes = storeNodes.map((node) => {
      const rfNode = reactFlowNodes.find((n) => n.id === node.id);
      if (rfNode) {
        return { ...node, position: rfNode.position };
      }
      return node;
    }) as CanvasNode[];
    setStoreNodes(updatedNodes);
  }, [storeNodes, reactFlowNodes, setStoreNodes]);

  // Handle node changes (position, selection, removal, etc.)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Handle remove changes - use animated deletion
      const removeChanges = changes.filter((change) => change.type === 'remove');
      if (removeChanges.length > 0) {
        removeChanges.forEach((change) => {
          if (change.type === 'remove') {
            markNodeForDeletion(change.id);
          }
        });
        // Filter out remove changes - we handle deletion ourselves after animation
        changes = changes.filter((change) => change.type !== 'remove');
      }

      onNodesChange(changes);

      // Sync positions to store when drag ends (triggers debounced auto-save)
      const dragEndChanges = changes.filter(
        (change) => change.type === 'position' && change.dragging === false
      );
      if (dragEndChanges.length > 0) {
        // Use setTimeout to ensure React Flow state is updated first
        setTimeout(syncPositionsToStore, 0);
      }

      // Handle selection changes
      const selectionChanges = changes.filter((change) => change.type === 'select');
      selectionChanges.forEach((change) => {
        if (change.type === 'select') {
          selectNode(change.selected ? change.id : null);
        }
      });
    },
    [onNodesChange, selectNode, markNodeForDeletion, syncPositionsToStore]
  );

  // Fit view on initial load if there are nodes
  useEffect(() => {
    if (visibleNodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }, []);

  // Handle file drag and drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      // Only handle file drops
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        // Handle file drops
        const files = Array.from(event.dataTransfer.files);

        for (const file of files) {
          // Check if file type is supported
          if (!fileUtils.isFileTypeSupported(file.type)) {
            console.warn(`Unsupported file type: ${file.type}`);
            continue;
          }

          try {
            // Read file as base64
            const base64Data = await fileUtils.readFileAsBase64(file);

            // Create a content node with file data
            const fileData = {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              data: base64Data,
            };

            // Add content node with file data
            addContentNodeWithFile(fileData, position);

            // Offset position for next file if multiple files
            position.x += 320; // Default content box width + spacing
          } catch (error) {
            console.error('Failed to process dropped file:', error);
          }
        }
      }
    },
    [screenToFlowPosition, addContentNodeWithFile]
  );

  return (
    <CanvasContextMenu>
    <div
      className={`h-full w-full relative transition-colors duration-300 ${isDarkMode ? 'uwu-dark' : ''} ${isSpacePressed ? 'uwu-panning' : ''}`}
      style={{ background: themeColors.background }}
    >
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onDrop={onDrop}
        onDragOver={onDragOver}
        minZoom={CANVAS_CONFIG.minZoom}
        maxZoom={CANVAS_CONFIG.maxZoom}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={['Backspace', 'Delete']}
        panOnScroll={true}
        panOnDrag={isSpacePressed}
        selectionOnDrag={!isSpacePressed}
        selectionMode={SelectionMode.Partial}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={CANVAS_CONFIG.backgroundGap}
          size={CANVAS_CONFIG.backgroundSize}
          color={themeColors.dotsColor}
        />
        <Toolbar />
      </ReactFlow>

      {/* Empty Canvas State */}
      {storeNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 ${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-100/80'}`}>
              <Sparkles className={`w-6 h-6 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
            </div>
            <p className={`text-[15px] font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Drop a Generator node to start prompting AI
            </p>
            <p className={`text-[13px] mt-1 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
              or drag a file onto the canvas
            </p>
            <p className={`text-[11px] mt-3 ${isDarkMode ? 'text-zinc-700' : 'text-zinc-300'}`}>
              Press Delete or Backspace to remove nodes
            </p>
          </div>
        </div>
      )}

      {/* Undo Delete Toast */}
      {lastDeletedNode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 uwu-undo-toast">
          <button
            onClick={undoDelete}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl
              text-[13px] font-medium
              shadow-lg backdrop-blur-md
              transition-all duration-150
              active:scale-95 cursor-pointer
              ${isDarkMode
                ? 'bg-zinc-800/90 text-zinc-200 border border-zinc-700 hover:bg-zinc-700/90'
                : 'bg-white/90 text-zinc-700 border border-zinc-200 hover:bg-zinc-50/90'
              }
            `}
          >
            <Undo2 className="w-4 h-4" />
            Node deleted — Undo
          </button>
        </div>
      )}

      {/* Duplicate Alias Toast */}
      {duplicateAliasToast && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 uwu-undo-toast">
          <div
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl
              text-[13px] font-medium
              shadow-lg backdrop-blur-md
              ${isDarkMode
                ? 'bg-zinc-800/90 text-zinc-200 border border-zinc-700'
                : 'bg-white/90 text-zinc-700 border border-zinc-200'
              }
            `}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            Alias &ldquo;{duplicateAliasToast}&rdquo; already exists
          </div>
        </div>
      )}
    </div>
    </CanvasContextMenu>
  );
}
