'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Play, Square } from 'lucide-react';
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
        lineClassName="!border-blue-500"
        handleClassName="!w-2 !h-2 !bg-blue-500 !border-blue-500"
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
                className="cursor-pointer rounded-lg bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-600 hover:bg-blue-100"
                onClick={() => setIsEditingAlias(true)}
              >
                @{data.alias}
              </span>
            )}
            {/* Provider & Model Selection */}
            {isLoadingProviders ? (
              <span className="text-[10px] text-muted-foreground">...</span>
            ) : !hasProviders ? (
              <span className="rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-600">
                No provider in env
              </span>
            ) : currentProvider && currentProviderData ? (
              <>
                <Select
                  value={currentProvider}
                  onValueChange={(value) => handleProviderChange(value as AIProvider)}
                  disabled={data.isRunning}
                >
                  <SelectTrigger className="h-5 w-[80px] border-none bg-muted/50 px-1.5 text-[10px]">
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
                  <SelectTrigger className="h-5 w-[100px] border-none bg-muted/50 px-1.5 text-[10px]">
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
        </CardHeader>
        <CardContent className="flex h-[calc(100%-40px)] flex-col gap-1.5 px-2 pb-2">
          {/* Input Section */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-xs font-medium text-muted-foreground">Input</label>
              <Button
                size="sm"
                className="h-6 w-6 p-0"
                onClick={data.isRunning ? handleStop : handleRun}
                variant={data.isRunning ? 'destructive' : 'default'}
                disabled={!hasProviders || isLoadingProviders}
              >
                {data.isRunning ? (
                  <Square className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <AutocompleteTextarea
              value={data.input}
              onChange={(value) => updateNode(id, { input: value })}
              placeholder="Enter prompt... Use @alias to reference other boxes"
              className="min-h-[60px] text-xs"
              disabled={data.isRunning}
            />
          </div>
          
          {/* Output Section */}
          <div className="flex min-h-0 flex-1 flex-col">
            <label className="mb-0.5 block text-xs font-medium text-muted-foreground">Output</label>
            <div className="flex-1 overflow-auto rounded-lg border bg-white p-1.5">
              {data.output ? (
                <pre className="whitespace-pre-wrap text-xs">{data.output}</pre>
              ) : (
                <p className="text-xs text-muted-foreground italic">Output will appear here...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export const GeneratorBox = memo(GeneratorBoxComponent);
