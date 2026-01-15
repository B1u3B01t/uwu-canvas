'use client';

import { use, Suspense } from 'react';
import { getComponentByKey } from '../../lib/registry';

interface PreviewPageProps {
  params: Promise<{ componentKey: string }>;
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const { componentKey } = use(params);
  const entry = getComponentByKey(componentKey);
  const Component = entry?.component;

  if (!Component) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Component not found
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <Component />
    </Suspense>
  );
}
