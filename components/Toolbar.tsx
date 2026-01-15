'use client';

import { useReactFlow } from '@xyflow/react';
import { Plus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCanvasStore } from '../hooks/useCanvasStore';

export function Toolbar() {
  const { zoomIn, zoomOut, fitView, getViewport } = useReactFlow();
  const addNode = useCanvasStore((state) => state.addNode);

  const handleAddNode = (type: 'generator' | 'content' | 'component') => {
    const viewport = getViewport();
    // Add node near the center of the current viewport
    const position = {
      x: (-viewport.x + 400) / viewport.zoom,
      y: (-viewport.y + 200) / viewport.zoom,
    };
    addNode(type, position);
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
      {/* Add Box Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-white shadow-sm">
            <Plus className="h-4 w-4" />
            Add Box
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[120px]">
          <DropdownMenuItem 
            onClick={() => handleAddNode('generator')}
            className="justify-center text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white"
          >
            Generator
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAddNode('content')}
            className="justify-center text-sm font-medium hover:bg-green-500 hover:text-white focus:bg-green-500 focus:text-white"
          >
            Content
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAddNode('component')}
            className="justify-center text-sm font-medium hover:bg-purple-500 hover:text-white focus:bg-purple-500 focus:text-white"
          >
            Component
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 rounded-md border bg-white p-1 shadow-sm">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomOut()}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomIn()}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fitView({ padding: 0.2 })}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
