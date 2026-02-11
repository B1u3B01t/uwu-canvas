import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// File handling utilities
export const fileUtils = {
  /**
   * Read a file as base64 string
   */
  readFileAsBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/png;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Get file icon based on MIME type
   */
  getFileIcon: (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.startsWith('text/')) return '📄';
    if (mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') return '📦';
    return '📁';
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Check if a file type is supported
   */
  isFileTypeSupported: (mimeType: string): boolean => {
    const supportedTypes = [
      'image/',
      'video/',
      'audio/',
      'application/pdf',
      'text/',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-zip-compressed',
    ];

    return supportedTypes.some(type => mimeType.startsWith(type));
  }
};

/** Allowed schemes for iframe embeds (security) */
const ALLOWED_IFRAME_SCHEMES = ['https:', 'http:'] as const;

/** Hostnames considered localhost (http allowed for dev) */
const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Parse clipboard text as a URL and validate for iframe embedding.
 * Allows: https for any host; http/https for localhost/127.0.0.1.
 * Returns normalized URL string or null if invalid/unsafe.
 */
export function parseAndValidateIframeUrl(input: string): string | null {
  const raw = input.trim().split(/\s/)[0]?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const scheme = url.protocol;
    const hostname = url.hostname.toLowerCase();

    if (!ALLOWED_IFRAME_SCHEMES.includes(scheme as 'https:' | 'http:')) return null;
    if (scheme === 'http:' && !LOCALHOST_HOSTS.has(hostname)) return null;

    return url.href;
  } catch {
    return null;
  }
}
