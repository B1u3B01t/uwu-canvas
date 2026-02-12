'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../lib/utils';
import * as Card from '../components/ui/card';
import * as Button from '../components/ui/button';
import * as Input from '../components/ui/input';
import * as LucideIcons from 'lucide-react';

/** Minimal Separator for sandbox (shadcn-style API, no Radix dependency) */
function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<'div'> & {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}) {
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={orientation}
      data-orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  );
}

/**
 * Scope object for the live preview sandbox.
 * Generated code has its imports stripped and receives these as globals.
 */
export const SANDBOX_SCOPE = {
  React,
  useState,
  useEffect,
  useCallback,
  useMemo,
  cn,
  ...Card,
  ...Button,
  ...Input,
  Separator,
  ...LucideIcons,
} as Record<string, unknown>;
