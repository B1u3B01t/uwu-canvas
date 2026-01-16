'use client';

import { useEffect } from 'react';
import '@/app/globals.css';

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="react-grab"]');
      if (existingScript) return;

      // Create and inject script into head
      const script = document.createElement('script');
      script.src = '//unpkg.com/react-grab/dist/index.global.js';
      script.crossOrigin = 'anonymous';
      script.async = false; // Load synchronously for beforeInteractive behavior
      document.head.appendChild(script);
    }
  }, []);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
