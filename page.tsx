'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './components/Canvas';

export default function UwuCanvasPage() {
  return (
    <div className="h-screen w-screen bg-[#f5f5f5]">
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
    </div>
  );
}
