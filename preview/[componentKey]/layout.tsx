'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
// Host app's root layout provides global styles (Tailwind, etc.)
import { parseReactGrabClipboard } from '../../lib/reactGrabBridge';
import { generateDynamicComponentPrompt } from '../../lib/promptTemplates';
import { REACT_GRAB_CONFIG } from '../../lib/constants';

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Extract componentKey from path: /uwu-canvas/preview/[componentKey]
  const componentKey = pathname?.split('/').pop() || '';

  // Inject react-grab script in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="react-grab"]');
      if (existingScript) return;

      // Create and inject script into head
      const script = document.createElement('script');
      script.src = '//unpkg.com/react-grab/dist/index.global.js';
      script.crossOrigin = 'anonymous';
      script.async = false; // Load synchronously for beforeInteractive behavior
      document.head.appendChild(script);
    }
  }, []);

  // Listen for copy events, detect react-grab captures, generate prompt and copy it
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (!componentKey) return;

    let isProcessing = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const handleCopy = () => {
      // Debounce: ignore if already processing
      if (isProcessing) {
        return;
      }

      isProcessing = true;

      // Clear any pending timeout
      if (timeoutId) clearTimeout(timeoutId);

      // Wait for react-grab to finish all its clipboard operations
      timeoutId = setTimeout(() => {
        navigator.clipboard.readText().then((text) => {
          const parsed = parseReactGrabClipboard(text);
          if (parsed) {
            // Generate the dynamic component prompt
            const prompt = generateDynamicComponentPrompt(parsed, componentKey);

            // Copy the prompt to clipboard (overwrites react-grab's content)
            navigator.clipboard.writeText(prompt).then(() => {
              // Notify parent that prompt was copied (for toast notification)
              window.parent.postMessage({
                type: 'DYNAMIC_PROMPT_COPIED',
                payload: {
                  componentName: parsed.componentName,
                  filePath: parsed.filePath,
                }
              }, '*');
            }).catch(() => {
              // Silent fail - clipboard write failed
            });
          }
        }).catch(() => {
          // Silent fail - clipboard read failed
        }).finally(() => {
          // Reset debounce after a delay
          setTimeout(() => {
            isProcessing = false;
          }, REACT_GRAB_CONFIG.debounceDelay);
        });
      }, REACT_GRAB_CONFIG.clipboardReadDelay);
    };

    document.addEventListener('copy', handleCopy);
    return () => {
      document.removeEventListener('copy', handleCopy);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [componentKey]);

  return (
    <div className="min-h-screen bg-background antialiased">
      {children}
    </div>
  );
}
