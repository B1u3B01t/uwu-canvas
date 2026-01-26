'use client';

import { useReactFlow } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize2, Sparkles, FileText, Layout, Database } from 'lucide-react';
import { Tooltip, TooltipProvider } from './ui/Tooltip';
import { useCanvasStore } from '../hooks/useCanvasStore';

const BOX_TYPES = [
  { type: 'generator' as const, label: 'Generator', icon: Sparkles, accent: 'var(--accent-generator)' },
  { type: 'content' as const, label: 'Content', icon: FileText, accent: 'var(--accent-content)' },
  { type: 'component' as const, label: 'Component', icon: Layout, accent: 'var(--accent-component)' },
  { type: 'data2ui' as const, label: 'Data2UI', icon: Database, accent: 'var(--accent-data2ui)' },
] as const;

export function Toolbar() {
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow();
  const addNode = useCanvasStore((state) => state.addNode);

  const handleAddNode = (type: 'generator' | 'content' | 'component' | 'data2ui') => {
    const viewport = document.querySelector('.react-flow__viewport');
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const position = screenToFlowPosition({ x: centerX, y: centerY });
      addNode(type, position);
    } else {
      addNode(type);
    }
  };

  return (
    <TooltipProvider>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        {/* Node Creation Buttons - Glassmorphic Pill */}
        <div className="flex items-center gap-1 rounded-full bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-1.5">
          {BOX_TYPES.map(({ type, label, icon: Icon, accent }) => (
            <Tooltip key={type} content={label}>
              <button
                onClick={() => handleAddNode(type)}
                className="
                  relative group
                  w-9 h-9 rounded-full
                  flex items-center justify-center
                  text-zinc-500
                  hover:text-zinc-900 hover:bg-zinc-100/80
                  active:scale-95
                  transition-all duration-150
                  select-none cursor-pointer
                "
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                {/* Accent dot on hover */}
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: accent }}
                />
              </button>
            </Tooltip>
          ))}
        </div>

        {/* Zoom Controls - Glassmorphic Pill */}
        <div className="flex items-center gap-0.5 rounded-full bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-1">
          <Tooltip content="Zoom Out">
            <button
              onClick={() => zoomOut()}
              className="
                w-8 h-8 rounded-full
                flex items-center justify-center
                text-zinc-500
                hover:text-zinc-900 hover:bg-zinc-100/80
                active:scale-95
                transition-all duration-150
                cursor-pointer
              "
            >
              <ZoomOut className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </Tooltip>
          <Tooltip content="Zoom In">
            <button
              onClick={() => zoomIn()}
              className="
                w-8 h-8 rounded-full
                flex items-center justify-center
                text-zinc-500
                hover:text-zinc-900 hover:bg-zinc-100/80
                active:scale-95
                transition-all duration-150
                cursor-pointer
              "
            >
              <ZoomIn className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </Tooltip>
          <Tooltip content="Fit View">
            <button
              onClick={() => fitView({ padding: 0.2 })}
              className="
                w-8 h-8 rounded-full
                flex items-center justify-center
                text-zinc-500
                hover:text-zinc-900 hover:bg-zinc-100/80
                active:scale-95
                transition-all duration-150
                cursor-pointer
              "
            >
              <Maximize2 className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
