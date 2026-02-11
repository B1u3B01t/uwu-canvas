'use client';

import { memo, useState, useCallback } from 'react';
import { NodeProps } from '@xyflow/react';
import { Layout, ExternalLink, Smartphone, Monitor } from 'lucide-react';
import { Input } from '../ui/input';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { BOX_DEFAULTS } from '../../lib/constants';
import type { IframeNodeData } from '../../lib/types';

function IframeBoxComponent({ id, selected }: NodeProps) {
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [editingAlias, setEditingAlias] = useState('');

  const data = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data as IframeNodeData | undefined;
  });

  const updateNode = useCanvasStore((state) => state.updateNode);
  const isAliasUnique = useCanvasStore((state) => state.isAliasUnique);
  const showDuplicateAliasToast = useCanvasStore((state) => state.showDuplicateAliasToast);
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

  if (!data) return null;

  const handleViewModeChange = (mode: 'mobile' | 'laptop') => {
    const dimensions = mode === 'mobile'
      ? BOX_DEFAULTS.iframe.mobile
      : BOX_DEFAULTS.iframe.laptop;
    updateNode(id, {
      viewMode: mode,
      width: dimensions.width,
      height: dimensions.height,
    });
  };

  const isInteractive = !!selected;
  const displayUrl = data.url ? (() => {
    try {
      const u = new URL(data.url);
      return u.hostname + (u.pathname !== '/' ? u.pathname.slice(0, 24) + (u.pathname.length > 24 ? '…' : '') : '');
    } catch {
      return data.url.slice(0, 40) + (data.url.length > 40 ? '…' : '');
    }
  })() : '';

  return (
    <div
      className={`
        relative flex flex-col
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

      {/* Header - drag handle (non-interactive areas); interactive children have nodrag */}
      <div className="uwu-drag-handle flex items-center gap-2 px-6 pt-5 pb-2 flex-wrap cursor-grab active:cursor-grabbing">
        {isEditingAlias ? (
          <Input
            value={editingAlias}
            onChange={(e) => setEditingAlias(e.target.value)}
            onBlur={() => commitAlias()}
            onKeyDown={(e) => e.key === 'Enter' && commitAlias()}
            className="nodrag h-6 w-24 text-[11px] font-bold bg-[#D9D0BE] border-none focus:ring-1 focus:ring-zinc-400"
            autoFocus
          />
        ) : (
          <div
            className="nodrag inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-md bg-[#D9D0BE] w-fit text-[11px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => { setEditingAlias(data.alias); setIsEditingAlias(true); }}
          >
            <Layout className="w-3 h-3" />
            {data.alias}
          </div>
        )}

        {data.url && (
          <>
            <span className="text-[10px] text-zinc-500 truncate max-w-[140px]" title={data.url}>
              {displayUrl}
            </span>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="nodrag inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#D9D0BE]/60 hover:bg-[#D9D0BE] text-[10px] text-zinc-600 hover:text-zinc-800 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              Open in new tab
            </a>
          </>
        )}

        {/* View Mode Toggle - Pill-shaped segmented control (same as ComponentBox) */}
        <div className="nodrag flex rounded-full bg-[#D9D0BE]/60 p-0.5">
          <button
            onClick={() => handleViewModeChange('mobile')}
            className={`
              h-5 w-7 rounded-full
              flex items-center justify-center
              transition-all duration-150
              ${data.viewMode === 'mobile'
                ? 'bg-[#F5F2EF] shadow-sm text-zinc-700'
                : 'text-zinc-500 hover:text-zinc-700'
              }
            `}
          >
            <Smartphone className="h-3 w-3" />
          </button>
          <button
            onClick={() => handleViewModeChange('laptop')}
            className={`
              h-5 w-7 rounded-full
              flex items-center justify-center
              transition-all duration-150
              ${data.viewMode === 'laptop'
                ? 'bg-[#F5F2EF] shadow-sm text-zinc-700'
                : 'text-zinc-500 hover:text-zinc-700'
              }
            `}
          >
            <Monitor className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Content - only interactive when node selected; otherwise events pass through to canvas */}
      <div className={`flex-1 px-6 pb-6 overflow-hidden ${isInteractive ? 'nodrag nowheel nopan' : 'pointer-events-none'}`}>
        <div className="h-full overflow-hidden rounded-2xl border border-[#DDD6C7]/50 bg-white">
          {data.url ? (
            <iframe
              src={data.url}
              className="h-full w-full border-0"
              style={{ width: '100%', height: '100%' }}
              title={displayUrl || 'Embedded page'}
              sandbox="allow-scripts allow-same-origin allow-forms"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[13px] text-zinc-400 px-4 text-center">
              Paste a URL on the canvas to add a link
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const IframeBox = memo(IframeBoxComponent);
