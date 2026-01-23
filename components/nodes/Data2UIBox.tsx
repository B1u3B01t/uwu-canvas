'use client';

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader } from '../ui/card';
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
  const [isApplying, setIsApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [jsonFiles, setJsonFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  
  // Track previous isRunning state of source generator for auto-apply
  const prevSourceIsRunningRef = useRef<boolean | null>(null);
  
  // Read data directly from Zustand for this specific node
  const data = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data as Data2UINodeData | undefined;
  });
  
  const updateNode = useCanvasStore((state) => state.updateNode);
  const getAliasMap = useCanvasStore((state) => state.getAliasMap);

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
      prevSourceIsRunningRef.current = null;
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

  return (
    <>
      <NodeResizer
        minWidth={300}
        minHeight={190}
        isVisible={selected}
        lineClassName="!border-orange-500"
        handleClassName="!w-2 !h-2 !bg-orange-500 !border-orange-500"
        onResize={(_, params) => {
          updateNode(id, { width: params.width, height: params.height });
        }}
      />
      <Card 
        className="bg-transparent !border-transparent hover:!border-gray-200 shadow-none transition-all hover:shadow-lg !rounded-2xl"
        style={{ width: data.width, height: data.height }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-2">
          <div className="flex items-center gap-2">
            {isEditingAlias ? (
              <Input
                value={data.alias}
                onChange={(e) => updateNode(id, { alias: e.target.value })}
                onBlur={() => setIsEditingAlias(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingAlias(false)}
                className="h-5 w-20 text-xs"
                autoFocus
              />
            ) : (
              <span
                className="cursor-pointer rounded-lg bg-orange-50 px-2 py-0.5 font-mono text-xs text-orange-600 hover:bg-orange-100"
                onClick={() => setIsEditingAlias(true)}
              >
                @{data.alias}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-2 pb-2">
          {/* Source -> Output in one line */}
          <div className="flex-shrink-0 flex items-center gap-1.5">
            <div className="flex-1 min-w-0">
              <Select
                value={data.sourceAlias}
                onValueChange={(value) => updateNode(id, { sourceAlias: value })}
              >
                <SelectTrigger className="h-8 w-full text-xs">
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
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Select
                value={data.outputPath}
                onValueChange={(value) => updateNode(id, { outputPath: value })}
              >
                <SelectTrigger className="h-8 w-full text-xs">
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
          <div className="flex-shrink-0">
            <Button
              onClick={handleApply}
              disabled={isApplying || !data.sourceAlias || !data.outputPath}
              className="w-full gap-2"
              size="sm"
            >
              {isApplying ? (
                <>Applying...</>
              ) : applyStatus === 'success' ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Applied
                </>
              ) : (
                <>Apply</>
              )}
            </Button>
          </div>

          {/* Status Display - Scrollable area */}
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
            {applyStatus === 'error' && errorMessage && (
              <div className="flex-shrink-0 rounded-lg bg-red-50 border border-red-200 p-1.5">
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-red-600">{errorMessage}</p>
                </div>
              </div>
            )}
            
            {data.sourceAlias && data.outputPath && applyStatus !== 'error' && (
              <div className="flex-shrink-0 rounded-lg bg-muted/30 p-1.5">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-mono">@{data.sourceAlias}</span> →{' '}
                  <span className="font-mono">{data.outputPath}</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export const Data2UIBox = memo(Data2UIBoxComponent);
