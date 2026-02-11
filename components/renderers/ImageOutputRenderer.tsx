'use client';

import { useCallback } from 'react';
import { Download } from 'lucide-react';
import type { GeneratedImage } from '../../lib/types';

interface ImageOutputRendererProps {
  images: GeneratedImage[];
}

function downloadImage(img: GeneratedImage, index: number) {
  const ext = img.mimeType.split('/')[1] || 'png';
  const link = document.createElement('a');
  link.href = `data:${img.mimeType};base64,${img.base64}`;
  link.download = `generated-image-${index + 1}.${ext}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function ImageOutputRenderer({ images }: ImageOutputRendererProps) {
  const handleDownload = useCallback((img: GeneratedImage, index: number) => {
    downloadImage(img, index);
  }, []);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {images.map((img, index) => (
        <div key={index} className="relative group">
          <img
            src={`data:${img.mimeType};base64,${img.base64}`}
            alt={img.revisedPrompt || `Generated image ${index + 1}`}
            className="w-full rounded-xl border border-[#DDD6C7]/50"
            loading="lazy"
          />
          {img.revisedPrompt && (
            <p className="mt-1.5 text-[11px] text-zinc-500 italic leading-snug">
              {img.revisedPrompt}
            </p>
          )}
          <button
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white rounded-lg p-1.5"
            onClick={() => handleDownload(img, index)}
            title="Download image"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
