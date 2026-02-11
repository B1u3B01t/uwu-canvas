'use client';

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { CheckCircle2, AlertCircle, ArrowRight, Database } from 'lucide-react';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import type { Data2UINodeData, GeneratorNodeData } from '../../lib/types';

// Type for recent memories format
interface Memory {
  id: string;
  text: string;
  colorScheme?: string;
  action?: {
    label: string;
    target: string;
    icon?: 'gmail' | 'calendar' | 'slack' | 'notion';
  };
}

// Helper to extract JSON from markdown code blocks or plain text
function extractJSON(text: string): string {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object/array in the text
  const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Return as-is if no pattern found
  return text.trim();
}

// Validate if the parsed JSON matches the recent memories format
function validateRecentMemoriesFormat(data: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Expected an array of memory objects' };
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (typeof item !== 'object' || item === null) {
      return { valid: false, error: `Item at index ${i} is not an object` };
    }

    // Check required fields
    if (typeof item.id !== 'string') {
      return { valid: false, error: `Item at index ${i} is missing required field "id" (string)` };
    }
    if (typeof item.text !== 'string') {
      return { valid: false, error: `Item at index ${i} is missing required field "text" (string)` };
    }

    // Check optional colorScheme
    if (item.colorScheme !== undefined && typeof item.colorScheme !== 'string') {
      return { valid: false, error: `Item at index ${i} has invalid "colorScheme" (must be string)` };
    }

    // Check optional action
    if (item.action !== undefined) {
      if (typeof item.action !== 'object' || item.action === null) {
        return { valid: false, error: `Item at index ${i} has invalid "action" (must be object)` };
      }
      if (typeof item.action.label !== 'string') {
        return { valid: false, error: `Item at index ${i} action is missing required field "label" (string)` };
      }
      if (typeof item.action.target !== 'string') {
        return { valid: false, error: `Item at index ${i} action is missing required field "target" (string)` };
      }
      if (item.action.icon !== undefined && typeof item.action.icon !== 'string') {
        return { valid: false, error: `Item at index ${i} action has invalid "icon" (must be string)` };
      }
    }
  }

  return { valid: true };
}

function Data2UIBoxComponent({ id, selected }: NodeProps) {
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [editingAlias, setEditingAlias] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [jsonFiles, setJsonFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  // Track previous isRunning state of source generator for auto-apply
  const prevSourceIsRunningRef = useRef<boolean>(false);

  // Read data directly from Zustand for this specific node
  const data = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data as Data2UINodeData | undefined;
  });

  const updateNode = useCanvasStore((state) => state.updateNode);
  const isAliasUnique = useCanvasStore((state) => state.isAliasUnique);
  const showDuplicateAliasToast = useCanvasStore((state) => state.showDuplicateAliasToast);
  const getAliasMap = useCanvasStore((state) => state.getAliasMap);
  const isDeleting = useCanvasStore((state) => state.deletingNodeIds.has(id));

  const commitAlias = useCallback(() => {
    const trimmed = editingAlias.trim();
    if (trimmed && trimmed !== data?.alias) {
      if (isAliasUnique(trimmed, id)) {
        updateNode(id, { alias: trimmed });
      } else {
        showDuplicateAliasToast(trimmed);
      }
    }
    setIsEditingAlias(false);
  }, [editingAlias, data?.alias, id, isAliasUnique, updateNode, showDuplicateAliasToast]);

  // Fetch JSON files on mount - must be before early return
  useEffect(() => {
    fetch('/uwu-canvas/api/list-json-files')
      .then((res) => res.json())
      .then((response) => {
        if (response.files) {
          setJsonFiles(response.files);
        }
        setIsLoadingFiles(false);
      })
      .catch((error) => {
        console.error('Failed to load JSON files:', error);
        setIsLoadingFiles(false);
      });
  }, []);

  // Get available aliases from generator and content boxes
  const aliasMap = getAliasMap();
  const availableAliases = Object.entries(aliasMap)
    .filter(([_, info]) => info.type === 'generator' || info.type === 'content')
    .map(([alias]) => alias);

  // Watch source generator node reactively using store selector
  const sourceGeneratorData = useCanvasStore((state) => {
    if (!data?.sourceAlias) return null;
    const sourceNode = state.nodes.find((n) => n.data.alias === data.sourceAlias);
    if (sourceNode?.data.type === 'generator') {
      return sourceNode.data as GeneratorNodeData;
    }
    return null;
  });

  // Define handleApply using useCallback so it can be used in useEffect
  const handleApply = useCallback(async () => {
    if (!data || !data.sourceAlias || !data.outputPath) {
      setApplyStatus('error');
      setErrorMessage('Please select a source and output file');
      return;
    }

    // Refresh alias map to get latest values
    const currentAliasMap = getAliasMap();
    const sourceInfo = currentAliasMap[data.sourceAlias];
    if (!sourceInfo) {
      setApplyStatus('error');
      setErrorMessage('Source alias not found');
      return;
    }

    const sourceValue = sourceInfo.value;
    if (!sourceValue || sourceValue.trim() === '') {
      setApplyStatus('error');
      setErrorMessage('Source has no value');
      return;
    }

    // Extract JSON from markdown code blocks or plain text
    const extractedJSON = extractJSON(sourceValue);

    // Check if the value is valid JSON
    let parsed;
    try {
      parsed = JSON.parse(extractedJSON);
    } catch (parseError) {
      setApplyStatus('error');
      setErrorMessage(`Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Parse error'}`);
      return;
    }

    // Check if output path is a recent memories file and validate format
    const isRecentMemoriesFile = data.outputPath.includes('recent-memories');
    if (isRecentMemoriesFile) {
      const validation = validateRecentMemoriesFormat(parsed);
      if (!validation.valid) {
        setApplyStatus('error');
        setErrorMessage(`Invalid recent memories format: ${validation.error}`);
        return;
      }
    }

    setIsApplying(true);
    setApplyStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/uwu-canvas/api/write-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: data.outputPath,
          data: parsed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to write JSON file' }));
        throw new Error(errorData.error || 'Failed to write JSON file');
      }

      setApplyStatus('success');
      setTimeout(() => setApplyStatus('idle'), 2000);
    } catch (error) {
      setApplyStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to write JSON file');
    } finally {
      setIsApplying(false);
    }
  }, [data, getAliasMap]);

  // Auto-apply when generator finishes (isRunning goes from true to false)
  useEffect(() => {
    if (!data || !data.sourceAlias || !data.outputPath || !sourceGeneratorData) {
      // Reset tracking if source is not available
      prevSourceIsRunningRef.current = false;
      return;
    }

    const currentIsRunning = sourceGeneratorData.isRunning;
    const prevIsRunning = prevSourceIsRunningRef.current;

    // Check if generation just finished (transition from true to false)
    if (prevIsRunning === true && currentIsRunning === false) {
      // Generation just completed - auto-apply if there's output
      const sourceValue = sourceGeneratorData.output;
      if (sourceValue && sourceValue.trim() !== '') {
        // Small delay to ensure output is fully set
        setTimeout(() => {
          handleApply();
        }, 100);
      }
    }

    // Update previous state
    prevSourceIsRunningRef.current = currentIsRunning;
  }, [data?.sourceAlias, data?.outputPath, sourceGeneratorData?.isRunning, sourceGeneratorData?.output, handleApply]);

  // Early return if node data not found - AFTER all hooks
  if (!data) return null;

  const isInteractive = !!selected;

  return (
    <>
      <NodeResizer
        minWidth={300}
        minHeight={190}
        isVisible={selected}
        lineClassName="!border-transparent"
        handleClassName="!border-0 !rounded-none !w-6 !h-6"
        handleStyle={{
          backgroundColor: 'transparent',
          border: 'none',
          width: '24px',
          height: '24px',
        }}
        onResize={(_, params) => {
          updateNode(id, { width: params.width, height: params.height });
        }}
      />
      <div
        className={`
          relative
          rounded-[32px]
          border border-[#DDD6C7]
          transition-all duration-300
          ${isDeleting ? 'uwu-node-exit' : 'uwu-node-enter'}
        `}
        style={{
          width: data.width,
          height: data.height,
          backgroundColor: '#E6E1D4',
        }}
      >
        {/* Custom arc handles */}
        {selected && (
          <>
            <svg className="absolute pointer-events-none z-[1000]" style={{ top: -16, left: -16, width: 40, height: 40 }} viewBox="0 0 40 40">
              <path d="M 12 33 L 12 28 A 16 16 0 0 1 28 12 L 33 12" fill="none" stroke="#D4CDBD" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className="absolute pointer-events-none z-[1000]" style={{ top: -16, right: -16, width: 40, height: 40 }} viewBox="0 0 40 40">
              <path d="M 7 12 L 12 12 A 16 16 0 0 1 28 28 L 28 33" fill="none" stroke="#D4CDBD" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className="absolute pointer-events-none z-[1000]" style={{ bottom: -16, left: -16, width: 40, height: 40 }} viewBox="0 0 40 40">
              <path d="M 12 7 L 12 12 A 16 16 0 0 0 28 28 L 33 28" fill="none" stroke="#D4CDBD" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className="absolute pointer-events-none z-[1000]" style={{ bottom: -16, right: -16, width: 40, height: 40 }} viewBox="0 0 40 40">
              <path d="M 7 28 L 12 28 A 16 16 0 0 0 28 12 L 28 7" fill="none" stroke="#D4CDBD" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}
        {/* Header */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-2">
          {isEditingAlias ? (
            <Input
              value={editingAlias}
              onChange={(e) => setEditingAlias(e.target.value)}
              onBlur={() => commitAlias()}
              onKeyDown={(e) => e.key === 'Enter' && commitAlias()}
              className="h-6 w-24 text-[11px] font-bold bg-[#D9D0BE] border-none focus:ring-1 focus:ring-zinc-400"
              autoFocus
            />
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-md bg-[#D9D0BE] w-fit text-[11px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => { setEditingAlias(data.alias); setIsEditingAlias(true); }}
            >
              <Database className="w-3 h-3" />
              {data.alias}
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`flex flex-col gap-3 px-6 pb-6 h-[calc(100%-60px)] overflow-hidden ${isInteractive ? 'nodrag nowheel nopan' : ''}`}>
          {/* Source -> Output in one line */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <Select
                value={data.sourceAlias}
                onValueChange={(value) => updateNode(id, { sourceAlias: value })}
              >
                <SelectTrigger className="h-8 w-full text-[11px] bg-[#D9D0BE]/40 border-[#DDD6C7] hover:bg-[#D9D0BE]/60 transition-colors rounded-lg">
                  <SelectValue placeholder="Source..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAliases.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      No generator/content boxes
                    </SelectItem>
                  ) : (
                    availableAliases.map((alias) => (
                      <SelectItem key={alias} value={alias} className="text-xs">
                        @{alias}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <ArrowRight className="h-4 w-4 text-[#D9D0BE] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Select
                value={data.outputPath}
                onValueChange={(value) => updateNode(id, { outputPath: value })}
              >
                <SelectTrigger className="h-8 w-full text-[11px] bg-[#D9D0BE]/40 border-[#DDD6C7] hover:bg-[#D9D0BE]/60 transition-colors rounded-lg">
                  <SelectValue placeholder={isLoadingFiles ? "Loading..." : "Output..."} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingFiles ? (
                    <SelectItem value="_loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : jsonFiles.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      No JSON files found
                    </SelectItem>
                  ) : (
                    jsonFiles.map((file) => (
                      <SelectItem key={file} value={file} className="text-xs">
                        {file}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            disabled={isApplying || !data.sourceAlias || !data.outputPath}
            className={`
              w-full h-9 rounded-xl
              flex items-center justify-center gap-2
              text-[12px] font-bold uppercase tracking-wider
              transition-all duration-150
              active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${applyStatus === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-[#3F3C39] text-white hover:bg-[#2D2A26]'
              }
            `}
          >
            {isApplying ? (
              <>Applying...</>
            ) : applyStatus === 'success' ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Applied
              </>
            ) : (
              <>Apply</>
            )}
          </button>

          {/* Status Display - Scrollable area */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {applyStatus === 'error' && errorMessage && (
              <div className="flex-shrink-0 rounded-xl bg-red-50 border border-red-100 p-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-red-600">{errorMessage}</p>
                </div>
              </div>
            )}

            {data.sourceAlias && data.outputPath && applyStatus !== 'error' && (
              <div className="flex-shrink-0 rounded-xl bg-[#DDD6C7]/30 p-2">
                <p className="text-[11px] text-zinc-500">
                  <span className="font-mono text-zinc-600">@{data.sourceAlias}</span>
                  <span className="mx-1.5">→</span>
                  <span className="font-mono text-zinc-600">{data.outputPath}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const Data2UIBox = memo(Data2UIBoxComponent);
