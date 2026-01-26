'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Play, Square } from 'lucide-react';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AutocompleteTextarea } from '../ui/Autocomplete';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import type { GeneratorNodeData, AIProvider } from '../../lib/types';

interface GeneratorBoxProps extends NodeProps {
  data: GeneratorNodeData;
}

interface ProviderData {
  name: string;
  models: { id: string; name: string }[];
}

type ProvidersMap = Record<string, ProviderData>;

// Cache for available providers (shared across all generator boxes)
let cachedProviders: ProvidersMap | null = null;
let providersFetched = false;

function GeneratorBoxComponent({ id, selected }: NodeProps) {
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [providersData, setProvidersData] = useState<ProvidersMap>(cachedProviders || {});
  const [isLoadingProviders, setIsLoadingProviders] = useState(!providersFetched);

  // Read data directly from Zustand for this specific node
  const data = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data as GeneratorNodeData | undefined;
  });

  const updateNode = useCanvasStore((state) => state.updateNode);
  const setGeneratorOutput = useCanvasStore((state) => state.setGeneratorOutput);
  const setGeneratorRunning = useCanvasStore((state) => state.setGeneratorRunning);
  const buildMessageContent = useCanvasStore((state) => state.buildMessageContent);

  const providerKeys = Object.keys(providersData);
  const hasProviders = providerKeys.length > 0;

  // Get current provider and model, with fallbacks
  const currentProvider = (data?.provider && providersData[data.provider])
    ? data.provider
    : (providerKeys[0] as AIProvider | undefined);
  const currentProviderData = currentProvider ? providersData[currentProvider] : null;
  const currentModel = currentProviderData
    ? (data?.model && currentProviderData.models.some(m => m.id === data.model) ? data.model : currentProviderData.models[0]?.id)
    : undefined;

  // Fetch available providers on mount
  useEffect(() => {
    if (providersFetched) return;

    fetch('/uwu-canvas/api/providers')
      .then((res) => res.json())
      .then((response) => {
        const providers = response.providers as ProvidersMap;
        cachedProviders = providers;
        providersFetched = true;
        setProvidersData(providers);
        setIsLoadingProviders(false);

        const providerKeys = Object.keys(providers);
        // Update node to first available provider if current one is not available
        if (data && providerKeys.length > 0 && (!data.provider || !providers[data.provider])) {
          const firstProvider = providerKeys[0] as AIProvider;
          updateNode(id, {
            provider: firstProvider,
            model: providers[firstProvider].models[0].id
          });
        }
      })
      .catch(() => {
        providersFetched = true;
        setIsLoadingProviders(false);
      });
  }, [data, id, updateNode]);

  const handleProviderChange = useCallback((provider: AIProvider) => {
    const models = providersData[provider]?.models;
    if (models) {
      updateNode(id, {
        provider,
        model: models[0].id // Reset to first model of new provider
      });
    }
  }, [id, updateNode, providersData]);

  const handleRun = useCallback(async () => {
    if (!data || data.isRunning) return;

    setGeneratorRunning(id, true);
    setGeneratorOutput(id, '');

    try {
      // Build structured message content with file/image parts
      const contentParts = buildMessageContent(data.input);

      // Check if we have any file/image parts
      const hasMediaParts = contentParts.some(
        (part) => part.type === 'image' || part.type === 'file'
      );

      const response = await fetch('/uwu-canvas/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          hasMediaParts
            ? {
                // Use structured messages format for files/images
                messages: [
                  {
                    role: 'user',
                    content: contentParts,
                  },
                ],
                provider: currentProvider,
                model: currentModel,
              }
            : {
                // Use simple prompt format for text-only
                prompt: contentParts.map((p) => (p.type === 'text' ? p.text : '')).join(''),
                provider: currentProvider,
                model: currentModel,
              }
        ),
      });

      if (!response.ok) throw new Error('Generation failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let output = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        output += chunk;
        setGeneratorOutput(id, output);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setGeneratorOutput(id, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratorRunning(id, false);
    }
  }, [id, data, currentProvider, currentModel, buildMessageContent, setGeneratorOutput, setGeneratorRunning]);

  const handleStop = useCallback(() => {
    setGeneratorRunning(id, false);
  }, [id, setGeneratorRunning]);

  // Early return if node data not found - AFTER all hooks
  if (!data) return null;

  return (
    <>
      <NodeResizer
        minWidth={280}
        minHeight={300}
        isVisible={selected}
        lineClassName="!border-transparent"
        handleClassName="!w-2.5 !h-2.5 !bg-white !border !border-zinc-200 !rounded-full"
        onResize={(_, params) => {
          updateNode(id, { width: params.width, height: params.height });
        }}
      />
      <div
        className="
          relative
          bg-white/80 backdrop-blur-md
          rounded-2xl
          border border-white/60
          transition-all duration-150
          hover:shadow-[var(--shadow-node-hover)]
        "
        style={{
          width: data.width,
          height: data.height,
          boxShadow: 'var(--shadow-node)',
        }}
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
          style={{ backgroundColor: 'var(--accent-generator)' }}
        />

        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          {isEditingAlias ? (
            <Input
              value={data.alias}
              onChange={(e) => updateNode(id, { alias: e.target.value })}
              onBlur={() => setIsEditingAlias(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingAlias(false)}
              className="h-5 w-20 text-[11px] font-mono"
              autoFocus
            />
          ) : (
            <span
              className="
                group flex items-center gap-1.5
                cursor-pointer rounded-md px-2 py-0.5
                font-mono text-[11px]
                hover:opacity-80 transition-opacity
              "
              style={{
                backgroundColor: 'var(--clay-generator-bg)',
                color: 'var(--clay-generator-text)',
              }}
              onClick={() => setIsEditingAlias(true)}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-generator)' }}
              />
              @{data.alias}
            </span>
          )}

          {/* Provider & Model Selection */}
          {isLoadingProviders ? (
            <span className="text-[10px] text-zinc-400">...</span>
          ) : !hasProviders ? (
            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600">
              No provider
            </span>
          ) : currentProvider && currentProviderData ? (
            <>
              <Select
                value={currentProvider}
                onValueChange={(value) => handleProviderChange(value as AIProvider)}
                disabled={data.isRunning}
              >
                <SelectTrigger className="h-5 w-[80px] border-none bg-zinc-50/50 px-1.5 text-[10px] hover:bg-zinc-100/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providerKeys.map((key) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {providersData[key].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={currentModel}
                onValueChange={(value) => updateNode(id, { model: value })}
                disabled={data.isRunning}
              >
                <SelectTrigger className="h-5 w-[100px] border-none bg-zinc-50/50 px-1.5 text-[10px] hover:bg-zinc-100/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentProviderData.models.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="text-xs">
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : null}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 px-4 pb-4 h-[calc(100%-52px)]">
          {/* Input Section */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Input</label>
              <button
                onClick={data.isRunning ? handleStop : handleRun}
                disabled={!hasProviders || isLoadingProviders}
                className={`
                  h-7 w-7 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150
                  active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${data.isRunning
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }
                `}
              >
                {data.isRunning ? (
                  <Square className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5 ml-0.5" />
                )}
              </button>
            </div>
            <AutocompleteTextarea
              value={data.input}
              onChange={(value) => updateNode(id, { input: value })}
              placeholder="Enter prompt... Use @alias to reference other boxes"
              className="min-h-[60px] text-[13px] bg-zinc-50/50 border-zinc-100 focus:border-zinc-200 rounded-lg"
              disabled={data.isRunning}
            />
          </div>

          {/* Output Section */}
          <div className="flex min-h-0 flex-1 flex-col">
            <label className="mb-1.5 text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Output</label>
            <div className="flex-1 overflow-auto rounded-lg border border-zinc-100 bg-white/60 p-2.5">
              {data.output ? (
                <pre className="whitespace-pre-wrap text-[13px] text-zinc-700">{data.output}</pre>
              ) : (
                <p className="text-[13px] text-zinc-400 italic">Output will appear here...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const GeneratorBox = memo(GeneratorBoxComponent);
