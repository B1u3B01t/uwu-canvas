'use client';

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Play, Square, Sparkles, Copy, Check, AlertCircle, RotateCcw, Code, Eye, Image as ImageIcon, Code2, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ImageOutputRenderer } from '../renderers/ImageOutputRenderer';
import { ComponentOutputRenderer } from '../renderers/ComponentOutputRenderer';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AutocompleteTextarea } from '../ui/Autocomplete';
import { Toggle } from '../ui/toggle';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { FONT_SIZES } from '../../lib/constants';
import type { GeneratorNodeData, AIProvider, ModelCapability, OutputMode } from '../../lib/types';

interface ProviderData {
  name: string;
  models: { id: string; name: string; capabilities?: ModelCapability[] }[];
}

type ProvidersMap = Record<string, ProviderData>;

// Derive the output mode from the selected model's capabilities
function getOutputMode(
  providersData: ProvidersMap,
  provider?: string,
  modelId?: string
): OutputMode {
  if (!provider || !modelId || !providersData[provider]) return 'text';
  const model = providersData[provider].models.find(m => m.id === modelId);
  if (!model?.capabilities) return 'text';
  if (model.capabilities.includes('image')) return 'image';
  return 'text';
}

// Cache for available providers (shared across all generator boxes)
let cachedProviders: ProvidersMap | null = null;
let providersFetched = false;

function GeneratorBoxComponent({ id, selected }: NodeProps) {
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [editingAlias, setEditingAlias] = useState('');
  const [providersData, setProvidersData] = useState<ProvidersMap>(cachedProviders || {});
  const [isLoadingProviders, setIsLoadingProviders] = useState(!providersFetched);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const prevIsRunningRef = useRef(false);

  // Read data directly from Zustand for this specific node
  const data = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data as GeneratorNodeData | undefined;
  });

  const isDeleting = useCanvasStore((state) => state.deletingNodeIds.has(id));

  const updateNode = useCanvasStore((state) => state.updateNode);
  const isAliasUnique = useCanvasStore((state) => state.isAliasUnique);
  const showDuplicateAliasToast = useCanvasStore((state) => state.showDuplicateAliasToast);
  const setGeneratorOutput = useCanvasStore((state) => state.setGeneratorOutput);
  const setGeneratorRunning = useCanvasStore((state) => state.setGeneratorRunning);
  const setGeneratorError = useCanvasStore((state) => state.setGeneratorError);
  const clearGeneratorError = useCanvasStore((state) => state.clearGeneratorError);
  const buildMessageContent = useCanvasStore((state) => state.buildMessageContent);

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

  // Detect generation completion for border pulse
  useEffect(() => {
    if (!data) return;
    const wasRunning = prevIsRunningRef.current;
    const isRunning = data.isRunning;

    if (wasRunning && !isRunning && data.output) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 600);
      return () => clearTimeout(timer);
    }
    prevIsRunningRef.current = isRunning;
  }, [data?.isRunning, data?.output]);

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

  const outputMode = getOutputMode(providersData, currentProvider, currentModel);

  const handleRun = useCallback(async () => {
    if (!data || data.isRunning) return;

    clearGeneratorError(id);
    setGeneratorRunning(id, true);
    setGeneratorOutput(id, null);

    try {
      if (outputMode === 'image') {
        // Non-streaming image generation
        const response = await fetch('/uwu-canvas/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: data.input,
            provider: currentProvider,
            model: currentModel,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Image generation failed');
        }

        const result = await response.json();
        if (result.images?.length > 0) {
          setGeneratorOutput(id, {
            mode: 'image',
            images: result.images,
            prompt: data.input,
          });
        } else if (result.textFallback) {
          // Gemini image model returned text instead of an image
          setGeneratorOutput(id, { mode: 'text', text: result.textFallback });
        } else {
          throw new Error('No image was generated');
        }
      } else {
        // Streaming text generation (existing logic)
        const contentParts = buildMessageContent(data.input);
        const hasMediaParts = contentParts.some(
          (part) => part.type === 'image' || part.type === 'file'
        );

        const response = await fetch('/uwu-canvas/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            hasMediaParts
              ? {
                  messages: [{ role: 'user', content: contentParts }],
                  provider: currentProvider,
                  model: currentModel,
                }
              : {
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
          setGeneratorOutput(id, { mode: 'text', text: output });
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      setGeneratorError(id, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setGeneratorRunning(id, false);
    }
  }, [id, data, currentProvider, currentModel, outputMode, buildMessageContent, setGeneratorOutput, setGeneratorRunning, setGeneratorError, clearGeneratorError]);

  const handleStop = useCallback(() => {
    setGeneratorRunning(id, false);
  }, [id, setGeneratorRunning]);

  const handleCopy = useCallback(() => {
    if (!data?.output) return;
    let copyText = '';
    if (data.output.mode === 'text') copyText = data.output.text;
    else if (data.output.mode === 'component') copyText = data.output.code;
    else if (data.output.mode === 'image') copyText = data.output.prompt;
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data?.output]);

  // Early return if node data not found - AFTER all hooks
  if (!data) return null;

  const isInteractive = !!selected;

  return (
    <>
      <NodeResizer
        minWidth={320}
        minHeight={380}
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
          relative flex flex-col transition-all duration-300
          ${isDeleting ? 'uwu-node-exit' : 'uwu-node-enter'}
          ${justCompleted ? 'uwu-node-complete' : ''}
        `}
        style={{
          width: data.width,
          height: data.height,
        }}
      >
        {/* Custom arc handles */}
        {selected && (
          <>
            {/* Top Left Arc */}
            <svg
              className="absolute pointer-events-none z-[1000]"
              style={{ top: -16, left: -16, width: 40, height: 40 }}
              viewBox="0 0 40 40"
            >
              <path
                d="M 12 33 L 12 28 A 16 16 0 0 1 28 12 L 33 12"
                fill="none"
                stroke="#D4CDBD"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Top Right Arc */}
            <svg
              className="absolute pointer-events-none z-[1000]"
              style={{ top: -16, right: -16, width: 40, height: 40 }}
              viewBox="0 0 40 40"
            >
              <path
                d="M 7 12 L 12 12 A 16 16 0 0 1 28 28 L 28 33"
                fill="none"
                stroke="#D4CDBD"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Bottom Left Arc */}
            <svg
              className="absolute pointer-events-none z-[1000]"
              style={{ bottom: -16, left: -16, width: 40, height: 40 }}
              viewBox="0 0 40 40"
            >
              <path
                d="M 12 7 L 12 12 A 16 16 0 0 0 28 28 L 33 28"
                fill="none"
                stroke="#D4CDBD"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Bottom Right Arc */}
            <svg
              className="absolute pointer-events-none z-[1000]"
              style={{ bottom: -16, right: -16, width: 40, height: 40 }}
              viewBox="0 0 40 40"
            >
              <path
                d="M 7 28 L 12 28 A 16 16 0 0 0 28 12 L 28 7"
                fill="none"
                stroke="#D4CDBD"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}

        {/* Top Part: Header + Input (3D card with shadow) */}
        <div
          className={`
            relative z-20 flex flex-col rounded-3xl overflow-hidden bg-white
            transition-all duration-300 ease-out
            ${data.isRunning
              ? 'border-[2px] border-[#DDD6C7] shadow-none translate-y-[7px]'
              : 'border-[2px] border-[#2D2A26] shadow-[0_7px_0_0_#2D2A26]'}
          `}
        >
          {/* Dark Header - drag handle; Run/Stop button has nodrag */}
          <div className="uwu-drag-handle flex items-center justify-between px-4 py-2.5 bg-[#3F3C39] cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-2.5">
              {/* Squircle Icon */}
              <div className="w-6 h-6 rounded-[6px] bg-zinc-800 flex items-center justify-center border border-zinc-600">
                <span className="text-zinc-200 text-sm font-medium leading-none">✦</span>
              </div>
              <span className="font-semibold text-[15px] text-zinc-100 tracking-tight">
                Generator
              </span>
            </div>

            {/* Run/Stop Button in Header */}
            <button
              onClick={data.isRunning ? handleStop : handleRun}
              disabled={!hasProviders || isLoadingProviders}
              className={`
                nodrag h-8 px-4 rounded-full
                flex items-center justify-center gap-2
                transition-all duration-200
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                ${data.isRunning
                  ? 'bg-zinc-700 text-zinc-300'
                  : 'bg-black hover:bg-zinc-900 text-white shadow-lg'
                }
              `}
            >
              {data.isRunning ? (
                <>
                  <span className="text-[11px] font-bold uppercase tracking-wider">Stop</span>
                  <Square className="h-3 w-3 fill-zinc-300" strokeWidth={0} />
                </>
              ) : (
                <>
                  <span className="text-[11px] font-bold uppercase tracking-wider">Run</span>
                  <Play className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                </>
              )}
            </button>
          </div>

          {/* Input Area */}
          <div className={`p-4 bg-white ${isInteractive ? 'nodrag nowheel nopan' : ''}`}>
            {/* Provider status */}
            {isLoadingProviders ? (
              <div className="mb-2">
                <span className="text-[10px] text-zinc-400">...</span>
              </div>
            ) : !hasProviders ? (
              <div className="mb-2">
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600">
                  No provider — add API keys to .env.local
                </span>
              </div>
            ) : null}

            <div className="relative group">
              <AutocompleteTextarea
                value={data.input}
                onChange={(value) => updateNode(id, { input: value })}
                onSubmit={handleRun}
                placeholder="Type here... Use @alias to reference other boxes"
                className="
                  w-full min-h-[140px]
                  rounded-2xl
                  p-4 pb-14
                  bg-[#F5F2EF]
                  text-[15px] text-zinc-800
                  placeholder:text-zinc-400/80
                  focus:ring-0 resize-none
                  border-none
                  font-medium leading-relaxed
                "
                style={{ fontSize: '15px' }}
                disabled={data.isRunning}
              />

              {/* Combined Model Selection */}
              {hasProviders && currentProvider && currentProviderData && (
                <div className="absolute bottom-2 left-2">
                  <Select
                    value={`${currentProvider}:${currentModel}`}
                    onValueChange={(val) => {
                      const [provider, ...modelParts] = val.split(':');
                      const model = modelParts.join(':');
                      updateNode(id, { provider: provider as AIProvider, model });
                    }}
                    disabled={data.isRunning}
                  >
                    <SelectTrigger className="h-9 w-auto min-w-[120px] text-[12px] font-semibold rounded-xl border-none px-3 gap-2 flex items-center text-zinc-600">
                      <SelectValue>
                        {currentProviderData.models.find(m => m.id === currentModel)?.name || 'Select Model'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto min-w-[180px] rounded-2xl border-zinc-100 shadow-2xl">
                      {providerKeys.map((pKey) => (
                        <SelectGroup key={pKey}>
                          <SelectLabel className="px-3 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {providersData[pKey].name}
                          </SelectLabel>
                          {providersData[pKey].models.map((m) => (
                            <SelectItem
                              key={`${pKey}:${m.id}`}
                              value={`${pKey}:${m.id}`}
                              className="text-[13px] py-2.5 pl-4 rounded-lg focus:bg-zinc-50"
                            >
                              <span className="inline-flex items-center gap-2 w-full">
                                <span className="flex-1">{m.name}</span>
                                <span className="inline-flex items-center gap-0.5 flex-shrink-0">
                                  {m.capabilities?.includes('image') && (
                                    <ImageIcon className="h-3 w-3 text-zinc-400" />
                                  )}
                                  {m.capabilities?.includes('component') && (
                                    <Code2 className="h-3 w-3 text-zinc-400" />
                                  )}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Part: Output (Layered Behind with overlap) */}
        <div
          className={`
            relative z-10 flex-1 -mt-5 pt-9 pb-4 px-6
            bg-[#E6E1D4] rounded-b-[32px] border-[#DDD6C7] border-1
            transition-all duration-300
            overflow-y-auto custom-scrollbar
            ${isInteractive ? 'nodrag nowheel nopan' : ''}
          `}
        >
          {/* Error State */}
          {data.error ? (
            <div className="flex-1 overflow-auto rounded-lg border border-red-200 bg-red-50 p-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-red-600 font-medium">Generation failed</p>
                  <p className="text-[12px] text-red-500 mt-0.5">{data.error}</p>
                </div>
              </div>
              <button
                onClick={handleRun}
                disabled={!hasProviders || isLoadingProviders}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 active:scale-95 transition-all duration-150 disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
                Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Output header row: alias badge + toggle/copy */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                      <Sparkles className="w-3 h-3" />
                      {data.alias}
                    </div>
                  )}
                  {data.isRunning && (
                    <span className="uwu-pulse-dot" />
                  )}
                </div>
                {data.output && !data.isRunning && (
                  <div className="flex items-center gap-0.5">
                    {/* Text mode: markdown/raw toggle */}
                    {data.output.mode === 'text' && (
                      <Toggle
                        pressed={showRaw}
                        onPressedChange={setShowRaw}
                        size="sm"
                        aria-label={showRaw ? 'Show formatted' : 'Show raw markdown'}
                      >
                        {showRaw ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <Code className="h-3.5 w-3.5" />
                        )}
                      </Toggle>
                    )}
                    {/* Copy button (text and component modes) */}
                    {data.output.mode !== 'image' && (
                      <button
                        onClick={handleCopy}
                        className="h-6 w-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-[#D9D0BE] transition-all duration-150"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Output content */}
              {data.output ? (
                data.output.mode === 'text' ? (
                  showRaw ? (
                    <pre className="whitespace-pre-wrap break-words font-mono text-zinc-700" style={{ fontSize: FONT_SIZES.output }}>
                      {data.output.text}
                    </pre>
                  ) : (
                    <div className="uwu-markdown" style={{ fontSize: FONT_SIZES.output }}>
                      <ReactMarkdown>{data.output.text}</ReactMarkdown>
                    </div>
                  )
                ) : data.output.mode === 'image' ? (
                  <ImageOutputRenderer images={data.output.images} />
                ) : data.output.mode === 'component' ? (
                  <ComponentOutputRenderer code={data.output.code} />
                ) : null
              ) : data.isRunning && outputMode === 'image' ? (
                <div className="flex items-center gap-2 text-zinc-400 text-[13px]">
                  <ImageIcon className="h-4 w-4 animate-pulse" />
                  <span className="italic">Generating image...</span>
                </div>
              ) : (
                <span className="text-zinc-400/60 italic text-[14px] font-medium">Your output will appear here...</span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const GeneratorBox = memo(GeneratorBoxComponent);
