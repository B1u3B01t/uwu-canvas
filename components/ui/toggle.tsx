'use client';

import * as React from 'react';

interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  size?: 'default' | 'sm';
  variant?: 'default' | 'outline';
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed = false, onPressedChange, size = 'default', variant = 'default', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        data-state={pressed ? 'on' : 'off'}
        onClick={() => onPressedChange?.(!pressed)}
        className={`
          inline-flex items-center justify-center rounded-md font-medium
          transition-all duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2
          disabled:pointer-events-none disabled:opacity-50
          ${size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'}
          ${pressed
            ? 'bg-zinc-100 text-zinc-900'
            : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/50'
          }
          ${className || ''}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Toggle.displayName = 'Toggle';

export { Toggle };
export type { ToggleProps };
