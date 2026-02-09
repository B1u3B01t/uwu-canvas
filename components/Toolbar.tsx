'use client';

import { useState } from 'react';
import { useReactFlow, Panel } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize2, Sparkles, FileText, Layout, Database, Sun, Moon } from 'lucide-react';
import { Tooltip, TooltipProvider } from './ui/Tooltip';
import { useCanvasStore } from '../hooks/useCanvasStore';

const BOX_TYPES = [
  { type: 'generator' as const, label: 'Generator — AI prompt box', icon: Sparkles, accent: 'var(--accent-generator)' },
  { type: 'content' as const, label: 'Content — Text or file', icon: FileText, accent: 'var(--accent-content)' },
  { type: 'component' as const, label: 'Component — Live preview', icon: Layout, accent: 'var(--accent-component)' },
  { type: 'data2ui' as const, label: 'Data2UI — Pipe to JSON file', icon: Database, accent: 'var(--accent-data2ui)' },
] as const;

// Color mapping for spreading effect
const ACCENT_COLORS: Record<string, string> = {
  generator: 'var(--accent-generator)',
  content: 'var(--accent-content)',
  component: 'var(--accent-component)',
  data2ui: 'var(--accent-data2ui)',
};

export function Toolbar() {
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow();
  const addNode = useCanvasStore((state) => state.addNode);
  const isDarkMode = useCanvasStore((state) => state.isDarkMode);
  const toggleDarkMode = useCanvasStore((state) => state.toggleDarkMode);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  // Get spreading style based on button position and hovered type
  const getSpreadingStyle = (index: number) => {
    if (!hoveredType) return {};

    const hoveredIndex = BOX_TYPES.findIndex(b => b.type === hoveredType);
    const distance = Math.abs(index - hoveredIndex);
    const opacity = Math.max(0, 0.25 - (distance * 0.08)); // Fade with distance

    return {
      backgroundColor: `color-mix(in oklch, ${ACCENT_COLORS[hoveredType]} ${opacity * 100}%, transparent)`,
      transition: 'background-color 150ms',
    };
  };

  // Get container spreading style
  const getContainerSpreadingStyle = () => {
    if (!hoveredType) return {};
    return {
      backgroundColor: `color-mix(in oklch, ${ACCENT_COLORS[hoveredType]} 8%, rgba(255,255,255,0.8))`,
      transition: 'background-color 150ms',
    };
  };

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
    <Panel position="top-center" className="!top-4">
      <TooltipProvider>
        <div className="flex items-center gap-3">
        {/* Node Creation Buttons - Glassmorphic Pill */}
        <div
          className="flex items-center gap-0 rounded-full bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-1.5"
          style={getContainerSpreadingStyle()}
        >
          {BOX_TYPES.map(({ type, label, icon: Icon, accent }, index) => (
            <Tooltip key={type} content={label}>
              <button
                onClick={() => handleAddNode(type)}
                onMouseEnter={() => setHoveredType(type)}
                onMouseLeave={() => setHoveredType(null)}
                className="
                  relative group
                  w-9 h-9 rounded-full
                  flex items-center justify-center
                  text-zinc-500
                  active:scale-95
                  transition-all duration-150
                  select-none cursor-pointer
                "
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
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

        {/* Dark Mode Toggle */}
        <Tooltip content={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
          <button
            onClick={toggleDarkMode}
            className="
              w-9 h-9 rounded-full
              flex items-center justify-center
              bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg
              text-zinc-500
              hover:text-zinc-900 hover:bg-zinc-100/80
              active:scale-95
              transition-all duration-150
              cursor-pointer
            "
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <Moon className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </Tooltip>
        </div>
      </TooltipProvider>
    </Panel>
  );
}
