'use client';

import { useMemo, useState } from 'react';
import { Code, Eye } from 'lucide-react';
import { Toggle } from '../ui/toggle';

interface ComponentOutputRendererProps {
  code: string;
}

function extractComponentCode(rawOutput: string): string {
  // Extract code from markdown fences (```jsx, ```tsx, ```javascript, ```react, or plain ```)
  const match = rawOutput.match(/```(?:jsx|tsx|javascript|react)?\s*\n?([\s\S]*?)```/);
  return match ? match[1].trim() : rawOutput.trim();
}

export function ComponentOutputRenderer({ code }: ComponentOutputRendererProps) {
  const [showCode, setShowCode] = useState(false);
  const extractedCode = useMemo(() => extractComponentCode(code), [code]);

  const iframeSrcdoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
    #error { color: #dc2626; padding: 16px; font-size: 13px; font-family: monospace; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="error"></div>
  <script type="text/babel" data-type="module">
    try {
      ${extractedCode}

      // Try common export patterns
      const Component = typeof App !== 'undefined' ? App
        : typeof Default !== 'undefined' ? Default
        : typeof Component !== 'undefined' ? Component
        : null;

      if (Component) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(Component));
      } else {
        document.getElementById('error').textContent = 'No component found. Export a component as App, Default, or Component.';
      }
    } catch (e) {
      document.getElementById('error').textContent = 'Render error: ' + e.message;
    }
  </script>
</body>
</html>`;
  }, [extractedCode]);

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
        <pre className="whitespace-pre-wrap break-words font-mono text-[12px] text-zinc-700 bg-[#F5F2EF] rounded-xl p-4 overflow-auto max-h-[400px]">
          {extractedCode}
        </pre>
      ) : (
        <div className="w-full min-h-[200px] rounded-xl overflow-hidden border border-[#DDD6C7]/50 bg-white">
          <iframe
            srcDoc={iframeSrcdoc}
            sandbox="allow-scripts"
            className="w-full h-full border-0"
            style={{ minHeight: '200px', height: '400px' }}
            title="Generated Component Preview"
          />
        </div>
      )}
    </div>
  );
}
