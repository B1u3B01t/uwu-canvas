'use client';

import { useMemo, useState } from 'react';
import { LiveProvider, LivePreview, LiveError } from 'react-live';
import { Code, Eye } from 'lucide-react';
import { Toggle } from '../ui/toggle';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { SANDBOX_SCOPE } from '../../lib/sandbox-registry';
import { preprocessSandboxCode } from '../../lib/sandbox-preprocess';
import { SandboxErrorBoundary } from './SandboxErrorBoundary';

interface ComponentOutputRendererProps {
  code: string;
}

export function ComponentOutputRenderer({ code }: ComponentOutputRendererProps) {
  const [showCode, setShowCode] = useState(false);
  const isDarkMode = useCanvasStore((state) => state.isDarkMode);

  const transformedCode = useMemo(() => preprocessSandboxCode(code), [code]);

  const transformCode = useMemo(
    () => (raw: string) => preprocessSandboxCode(raw),
    []
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <Toggle
          pressed={showCode}
          onPressedChange={setShowCode}
          size="sm"
          aria-label={showCode ? 'Show preview' : 'Show code'}
        >
          {showCode ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <Code className="h-3.5 w-3.5" />
          )}
        </Toggle>
      </div>

      {showCode ? (
        <pre className="whitespace-pre-wrap wrap-break-word font-mono text-[12px] text-zinc-700 bg-[#F5F2EF] rounded-xl p-4 overflow-auto max-h-[400px]">
          {transformedCode}
        </pre>
      ) : (
        <div className={`w-full min-h-[200px] rounded-xl overflow-hidden border border-[#DDD6C7]/50 bg-white ${isDarkMode ? 'uwu-dark' : ''}`}>
          <SandboxErrorBoundary>
            <LiveProvider
              code={code}
              scope={SANDBOX_SCOPE}
              noInline={true}
              transformCode={transformCode}
            >
              <div className="relative w-full min-h-[200px] h-[400px] p-4 overflow-auto">
                <LivePreview className="min-h-[180px]" />
                <LiveError className="absolute bottom-2 left-2 right-2 mt-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3 text-xs font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap" />
              </div>
            </LiveProvider>
          </SandboxErrorBoundary>
        </div>
      )}
    </div>
  );
}
