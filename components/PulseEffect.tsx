'use client';

import { useCanvasStore } from '../hooks/useCanvasStore';
import { useViewport } from '@xyflow/react';
import { useEffect, useState } from 'react';

const GRID_SIZE = 30; // Match CANVAS_CONFIG.backgroundGap
const PULSE_DURATION = 2000; // 2 seconds
const MAX_RADIUS = 1500; // Maximum pulse radius in pixels

export function PulseEffect() {
  const pulses = useCanvasStore((state) => state.pulses);
  const viewport = useViewport();
  const [, setTick] = useState(0);

  // Force re-render every frame during pulse animation
  useEffect(() => {
    if (pulses.length === 0) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [pulses.length]);

  if (pulses.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      style={{
        zIndex: 1,
        width: '100%',
        height: '100%',
        overflow: 'visible'
      }}
    >
      {pulses.map((pulse) => {
        const now = Date.now();
        const elapsed = now - pulse.timestamp;
        const linearProgress = Math.min(elapsed / PULSE_DURATION, 1);

        // Gentler ease-out curve (quadratic) for balanced speed
        const progress = 1 - Math.pow(1 - linearProgress, 2);

        const radius = progress * MAX_RADIUS;

        // Convert flow coordinates to screen coordinates
        // Use the actual node position without offset since we want the center of the card
        const centerX = pulse.position.x * viewport.zoom + viewport.x + (170 * viewport.zoom); // Half of default width (340/2)
        const centerY = pulse.position.y * viewport.zoom + viewport.y + (170 * viewport.zoom); // Half of default height (340/2)

        // Calculate which grid lines to highlight
        const lines: React.ReactElement[] = [];

        // Vertical lines
        for (let i = -50; i <= 50; i++) {
          const x = centerX + i * GRID_SIZE * viewport.zoom;
          const distance = Math.abs(i * GRID_SIZE * viewport.zoom);

          if (distance <= radius && distance >= radius - 100) {
            const opacity = 1 - (radius - distance) / 100;
            lines.push(
              <line
                key={`v-${pulse.id}-${i}`}
                x1={x}
                y1={centerY - radius}
                x2={x}
                y2={centerY + radius}
                stroke="#2D2A26"
                strokeWidth={2.5}
                opacity={opacity * 0.8}
                style={{
                  filter: 'blur(0.5px)',
                }}
              />
            );
          }
        }

        // Horizontal lines
        for (let i = -50; i <= 50; i++) {
          const y = centerY + i * GRID_SIZE * viewport.zoom;
          const distance = Math.abs(i * GRID_SIZE * viewport.zoom);

          if (distance <= radius && distance >= radius - 100) {
            const opacity = 1 - (radius - distance) / 100;
            lines.push(
              <line
                key={`h-${pulse.id}-${i}`}
                x1={centerX - radius}
                y1={y}
                x2={centerX + radius}
                y2={y}
                stroke="#2D2A26"
                strokeWidth={2.5}
                opacity={opacity * 0.8}
                style={{
                  filter: 'blur(0.5px)',
                }}
              />
            );
          }
        }

        return <g key={pulse.id}>{lines}</g>;
      })}
    </svg>
  );
}
