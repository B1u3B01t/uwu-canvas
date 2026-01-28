'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Play, Square, Sparkles } from 'lucide-react';
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
import { BOX_BACKGROUNDS, FONT_SIZES, INPUT_OUTPUT_STYLE } from '../../lib/constants';
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

  // Get input/output styles based on backgroundType setting
  const inputStyle = INPUT_OUTPUT_STYLE[INPUT_OUTPUT_STYLE.backgroundType];

  return (
    <>
      <NodeResizer
        minWidth={280}
        minHeight={300}
        isVisible={selected}
        lineClassName="!border-transparent"
        handleClassName="!border !rounded-full"
        handleStyle={{
          backgroundColor: 'var(--accent-generator)',
          borderColor: 'var(--accent-generator)',
        }}
        onResize={(_, params) => {
          updateNode(id, { width: params.width, height: params.height });
        }}
      />
      <div
        className="
          relative
          backdrop-blur-md
          rounded-3xl
          transition-all duration-150
        "
        style={{
          width: data.width,
          height: data.height,
          backgroundColor: BOX_BACKGROUNDS.generator,
        }}
      >
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
                cursor-pointer rounded-full px-2.5 py-1
                font-mono text-[11px]
                hover:opacity-80 transition-opacity
              "
              style={{
                backgroundColor: 'var(--pastel-generator-bg)',
                color: 'var(--pastel-generator-text)',
              }}
              onClick={() => setIsEditingAlias(true)}
            >
              <Sparkles className="w-3 h-3" />
              {data.alias}
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
                    ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                    : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                  }
                `}
              >
                {data.isRunning ? (
                  <Square className="h-4 w-4" strokeWidth={2} />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" strokeWidth={2} />
                )}
              </button>
            </div>
            <AutocompleteTextarea
              value={data.input}
              onChange={(value) => updateNode(id, { input: value })}
              placeholder="Enter prompt... Use @alias to reference other boxes"
              className={`min-h-[60px] ${inputStyle.background} ${inputStyle.border} ${inputStyle.focusBorder} rounded-lg`}
              style={{ fontSize: FONT_SIZES.input }}
              disabled={data.isRunning}
            />
          </div>

          {/* Output Section */}
          <div className="flex min-h-0 flex-1 flex-col">
            <label className="mb-1.5 text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Output</label>
            <div className={`flex-1 overflow-auto rounded-lg border ${inputStyle.border} ${inputStyle.background} p-2.5`}>
              {data.output ? (
                <pre className="whitespace-pre-wrap text-zinc-700" style={{ fontSize: FONT_SIZES.output }}>{data.output}</pre>
              ) : (
                <p className="text-zinc-400 italic" style={{ fontSize: FONT_SIZES.output }}>Output will appear here...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const GeneratorBox = memo(GeneratorBoxComponent);
