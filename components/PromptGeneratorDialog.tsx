'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, FileCode, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import type { ReactGrabCapture } from '../lib/reactGrabBridge';
import { generateDynamicComponentPrompt } from '../lib/promptTemplates';

interface PromptGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capture: ReactGrabCapture;
  componentKey: string;
}

export function PromptGeneratorDialog({
  open,
  onOpenChange,
  capture,
  componentKey,
}: PromptGeneratorDialogProps) {
  const [copied, setCopied] = useState(false);

  const prompt = generateDynamicComponentPrompt(capture, componentKey);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = prompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [prompt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-emerald-600" />
            Make Component Dynamic
          </DialogTitle>
          <DialogDescription>
            Copy this prompt and paste it into your AI editor (Claude, Cursor, etc.) to convert the captured component to use props with a JSON data file.
          </DialogDescription>
        </DialogHeader>

        {/* Captured component info */}
        <div className="flex flex-wrap gap-2 py-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-medium">
            <FileCode className="w-3 h-3" />
            {capture.componentName}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-mono">
            <MapPin className="w-3 h-3" />
            {capture.filePath}:{capture.lineNumber}
          </span>
        </div>

        {/* Generated prompt */}
        <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
          <pre className="h-full overflow-auto p-4 text-xs font-mono text-zinc-800 whitespace-pre-wrap">
            {prompt}
          </pre>
        </div>

        <DialogFooter>
          <button
            onClick={handleCopy}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg
              text-sm font-medium transition-all duration-200
              ${copied
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }
            `}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Prompt
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
