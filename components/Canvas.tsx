'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useReactFlow,
  useStore,
  type NodeChange,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { GeneratorBox } from './nodes/GeneratorBox';
import { ContentBox } from './nodes/ContentBox';
import { ComponentBox } from './nodes/ComponentBox';
import { Toolbar } from './Toolbar';
import { useCanvasStore } from '../hooks/useCanvasStore';
import { CANVAS_CONFIG } from '../lib/constants';
import type { CanvasNode } from '../lib/types';

// Define node types for React Flow
const nodeTypes = {
  generator: GeneratorBox,
  content: ContentBox,
  component: ComponentBox,
};

export function Canvas() {
  const storeNodes = useCanvasStore((state) => state.nodes);
  const setStoreNodes = useCanvasStore((state) => state.setNodes);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const removeNode = useCanvasStore((state) => state.removeNode);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes as Node[]);
  const { fitView } = useReactFlow();
  
  // Get nodes from React Flow internal store for position sync
  const reactFlowNodes = useStore((state) => state.nodes);
  
  // Track node IDs to detect structural changes only
  const prevNodeIdsRef = useRef<string[]>(storeNodes.map(n => n.id));

  // Only sync when nodes are added or removed (structural changes)
  useEffect(() => {
    const currentIds = storeNodes.map(n => n.id);
    const prevIds = prevNodeIdsRef.current;
    
    // Check if nodes were added or removed
    const structureChanged = 
      currentIds.length !== prevIds.length ||
      !currentIds.every((id, i) => id === prevIds[i]);
    
    if (structureChanged) {
      // Only update position and type info for React Flow
      // Data is read directly from Zustand by node components
      setNodes(storeNodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data, // React Flow needs this but components read from store
      })) as Node[]);
      prevNodeIdsRef.current = currentIds;
    }
  }, [storeNodes, setNodes]);

  // Sync positions from React Flow to Zustand store (triggers auto-save via subscription)
  const syncPositionsToStore = useCallback(() => {
    const updatedNodes = storeNodes.map((storeNode) => {
      const rfNode = reactFlowNodes.find((n) => n.id === storeNode.id);
      if (rfNode) {
        return { ...storeNode, position: rfNode.position };
      }
      return storeNode;
    }) as CanvasNode[];
    setStoreNodes(updatedNodes);
  }, [storeNodes, reactFlowNodes, setStoreNodes]);

  // Handle node changes (position, selection, removal, etc.)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Handle remove changes - sync to Zustand store BEFORE React Flow processes them
      const removeChanges = changes.filter((change) => change.type === 'remove');
      removeChanges.forEach((change) => {
        if (change.type === 'remove') {
          removeNode(change.id);
        }
      });

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
    [onNodesChange, selectNode, removeNode, syncPositionsToStore]
  );

  // Fit view on initial load if there are nodes
  useEffect(() => {
    if (storeNodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }, []);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        minZoom={CANVAS_CONFIG.minZoom}
        maxZoom={CANVAS_CONFIG.maxZoom}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={CANVAS_CONFIG.backgroundGap}
          size={CANVAS_CONFIG.backgroundSize}
          color={CANVAS_CONFIG.backgroundColor}
        />
        <Toolbar />
      </ReactFlow>
    </div>
  );
}
