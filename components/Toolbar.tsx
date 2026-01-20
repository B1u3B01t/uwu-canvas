'use client';

import { useReactFlow } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { useCanvasStore } from '../hooks/useCanvasStore';

const BOX_TYPES = [
  { type: 'generator' as const, label: 'Generator', color: 'blue' },
  { type: 'content' as const, label: 'Content', color: 'green' },
  { type: 'component' as const, label: 'Component', color: 'purple' },
  { type: 'data2ui' as const, label: 'Data2UI', color: 'orange' },
] as const;

export function Toolbar() {
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow();
  const addNode = useCanvasStore((state) => state.addNode);

  const handleAddNode = (type: 'generator' | 'content' | 'component' | 'data2ui') => {
    // Calculate position at center of viewport
    const viewport = document.querySelector('.react-flow__viewport');
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const position = screenToFlowPosition({ x: centerX, y: centerY });
      addNode(type, position);
    } else {
      // Fallback to default position if viewport not found
      addNode(type);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
      {/* Clickable Box Buttons */}
      <div className="flex items-center gap-2 rounded-md border bg-white p-1.5 shadow-sm">
        {BOX_TYPES.map(({ type, label, color }) => (
          <button
            key={type}
            onClick={() => handleAddNode(type)}
            className={`
              cursor-pointer
              px-3 py-1.5 rounded-sm
              text-sm font-medium
              transition-all duration-150
              select-none
              ${
                color === 'blue'
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white'
                  : color === 'green'
                  ? 'bg-green-50 text-green-600 hover:bg-green-500 hover:text-white focus:bg-green-500 focus:text-white'
                  : color === 'purple'
                  ? 'bg-purple-50 text-purple-600 hover:bg-purple-500 hover:text-white focus:bg-purple-500 focus:text-white'
                  : 'bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white focus:bg-orange-500 focus:text-white'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

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
