'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverAnchor } from './popover';
import { useAliasResolver, type AliasOption } from '../../hooks/useAliasResolver';

interface AutocompleteTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AutocompleteTextarea({
  value,
  onChange,
  placeholder = 'Type @ to reference other boxes...',
  className = '',
  disabled = false,
}: AutocompleteTextareaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [triggerPosition, setTriggerPosition] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { filterAliases } = useAliasResolver();

  const filteredOptions = filterAliases(query);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(newCursorPosition);
    
    // Check for @ trigger
    const textBeforeCursor = newValue.slice(0, newCursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Check if there's a space or newline between @ and cursor
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!/[\s\n]/.test(textAfterAt)) {
        setTriggerPosition(lastAtIndex);
        setQuery(textAfterAt);
        setIsOpen(true);
        return;
      }
    }
    
    setIsOpen(false);
    setTriggerPosition(null);
    setQuery('');
  };

  const handleSelect = useCallback((option: AliasOption) => {
    if (triggerPosition === null) return;
    
    const before = value.slice(0, triggerPosition);
    const after = value.slice(cursorPosition);
    const newValue = `${before}@${option.alias}${after}`;
    
    onChange(newValue);
    setIsOpen(false);
    setTriggerPosition(null);
    setQuery('');
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = triggerPosition + option.alias.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [value, triggerPosition, cursorPosition, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen) return;
    
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
    
    if (e.key === 'Tab' || e.key === 'Enter') {
      if (filteredOptions.length > 0) {
        e.preventDefault();
        handleSelect(filteredOptions[0]);
      }
    }
  };

  // Close on blur with delay to allow click
  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative">
      <Popover open={isOpen}>
        <PopoverAnchor asChild>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            rows={4}
          />
        </PopoverAnchor>
        <PopoverContent
          className="w-64 p-0"
          align="start"
          side="bottom"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandList>
              <CommandEmpty>No matches found</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.nodeId}
                    onSelect={() => handleSelect(option)}
                    className="cursor-pointer"
                  >
                    <span className="font-mono text-xs text-blue-600">@{option.alias}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {option.type === 'generator' && '(Generator)'}
                      {option.type === 'content' && '(Content)'}
                      {option.type === 'component' && '(Component)'}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
