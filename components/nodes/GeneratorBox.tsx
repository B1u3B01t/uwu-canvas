'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Play, Square, X } from 'lucide-react';
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
  const removeNode = useCanvasStore((state) => state.removeNode);
  const setGeneratorOutput = useCanvasStore((state) => state.setGeneratorOutput);
  const setGeneratorRunning = useCanvasStore((state) => state.setGeneratorRunning);
  const resolveAllAliases = useCanvasStore((state) => state.resolveAllAliases);
  
  // Early return if node data not found
  if (!data) return null;

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
        if (providerKeys.length > 0 && (!data.provider || !providers[data.provider])) {
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
  }, []);

  const providerKeys = Object.keys(providersData);
  const hasProviders = providerKeys.length > 0;
  
  // Get current provider and model, with fallbacks
  const currentProvider = (data.provider && providersData[data.provider]) 
    ? data.provider 
    : (providerKeys[0] as AIProvider | undefined);
  const currentProviderData = currentProvider ? providersData[currentProvider] : null;
  const currentModel = currentProviderData 
    ? (data.model && currentProviderData.models.some(m => m.id === data.model) ? data.model : currentProviderData.models[0]?.id)
    : undefined;

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
    if (data.isRunning) return;
    
    setGeneratorRunning(id, true);
    setGeneratorOutput(id, '');
    
    try {
      const resolvedInput = resolveAllAliases(data.input);
      
      const response = await fetch('/uwu-canvas/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: resolvedInput,
          provider: currentProvider,
          model: currentModel,
        }),
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
  }, [id, data.input, data.isRunning, currentProvider, currentModel, resolveAllAliases, setGeneratorOutput, setGeneratorRunning]);

  const handleStop = useCallback(() => {
    setGeneratorRunning(id, false);
  }, [id, setGeneratorRunning]);

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
        className="shadow-md transition-shadow hover:shadow-lg"
        style={{ width: data.width, height: data.height }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-3">
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
                className="cursor-pointer rounded bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-600 hover:bg-blue-100"
                onClick={() => setIsEditingAlias(true)}
              >
                @{data.alias}
              </span>
            )}
            {/* Provider & Model Selection */}
            {isLoadingProviders ? (
              <span className="text-[10px] text-muted-foreground">...</span>
            ) : !hasProviders ? (
              <span className="rounded-sm bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-600">
                No provider in env
              </span>
            ) : currentProvider && currentProviderData ? (
              <>
                <Select
                  value={currentProvider}
                  onValueChange={(value) => handleProviderChange(value as AIProvider)}
                  disabled={data.isRunning}
                >
                  <SelectTrigger className="h-5 w-[70px] border-none bg-muted/50 px-1.5 text-[10px]">
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
                  <SelectTrigger className="h-5 w-[90px] border-none bg-muted/50 px-1.5 text-[10px]">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => removeNode(id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="flex h-[calc(100%-48px)] flex-col gap-2 px-3 pb-3">
          {/* Input Section */}
          <div className="flex-shrink-0">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Input</label>
            <AutocompleteTextarea
              value={data.input}
              onChange={(value) => updateNode(id, { input: value })}
              placeholder="Enter prompt... Use @alias to reference other boxes"
              className="min-h-[80px] text-xs"
              disabled={data.isRunning}
            />
          </div>
          
          {/* Run Button */}
          <div className="flex-shrink-0">
            <Button
              size="sm"
              className="w-full gap-2"
              onClick={data.isRunning ? handleStop : handleRun}
              variant={data.isRunning ? 'destructive' : 'default'}
              disabled={!hasProviders || isLoadingProviders}
            >
              {data.isRunning ? (
                <>
                  <Square className="h-3.5 w-3.5" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Run
                </>
              )}
            </Button>
          </div>
          
          {/* Output Section */}
          <div className="flex min-h-0 flex-1 flex-col">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Output</label>
            <div className="flex-1 overflow-auto rounded-md border bg-muted/30 p-2">
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
