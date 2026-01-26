'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './components/Canvas';

export default function UwuCanvasPage() {
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100/50">
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
    </div>
  );
}
