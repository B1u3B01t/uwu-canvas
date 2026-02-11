'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAliasResolver, type AliasOption } from '../../hooks/useAliasResolver';

interface AutocompleteTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function AutocompleteTextarea({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type @ to reference other boxes...',
  className = '',
  style,
  disabled = false,
}: AutocompleteTextareaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [triggerPosition, setTriggerPosition] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { filterAliases } = useAliasResolver();

  const filteredOptions = filterAliases(query);

  // Reset selected index when options change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredOptions.length, query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;
    const items = dropdownRef.current.querySelectorAll('[data-autocomplete-item]');
    const selectedItem = items[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, isOpen]);

  // Position the dropdown relative to the textarea
  useEffect(() => {
    if (!isOpen || !textareaRef.current) {
      setDropdownPos(null);
      return;
    }
    const rect = textareaRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
    });
  }, [isOpen, value]);

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
    // Cmd+Enter (Mac) or Ctrl+Enter (Win/Linux) to submit
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsOpen(false);
      onSubmit?.();
      return;
    }

    if (!isOpen || filteredOptions.length === 0) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    }

    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      handleSelect(filteredOptions[selectedIndex]);
    }
  };

  // Close on blur with delay to allow click on item
  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 200);
  };

  const typeColors: Record<string, string> = {
    generator: 'var(--accent-generator)',
    content: 'var(--accent-content)',
    component: 'var(--accent-component)',
    data2ui: 'var(--accent-data2ui)',
    folder: 'var(--accent-folder)',
  };

  const typeLabels: Record<string, string> = {
    generator: 'Generator',
    content: 'Content',
    component: 'Component',
    data2ui: 'Data2UI',
    folder: 'Folder',
  };

  const dropdownContent = (
    <>
      {isOpen && filteredOptions.length > 0 && dropdownPos && (
        <div
          ref={dropdownRef}
          className="fixed z-[9999] max-h-[200px] w-64 overflow-y-auto rounded-xl border p-1 shadow-lg backdrop-blur-sm"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            backgroundColor: 'var(--uwu-input-bg)',
            borderColor: 'var(--uwu-input-border)',
          }}
          onMouseDown={(e) => {
            // Prevent textarea blur so the click handler fires
            e.preventDefault();
          }}
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option.nodeId}
              data-autocomplete-item
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
              style={{
                backgroundColor: index === selectedIndex ? 'var(--uwu-surface-hover)' : 'transparent',
                color: 'var(--uwu-text)',
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(option);
              }}
            >
              <span
                className="font-mono text-xs font-medium"
                style={{ color: typeColors[option.type] }}
              >
                @{option.alias}
              </span>
              <span
                className="text-xs"
                style={{ color: 'var(--uwu-text-muted)' }}
              >
                ({typeLabels[option.type] ?? option.type})
              </span>
            </div>
          ))}
        </div>
      )}
      {isOpen && filteredOptions.length === 0 && query && dropdownPos && (
        <div
          className="fixed z-[9999] w-64 rounded-xl border p-3 text-center text-sm shadow-lg backdrop-blur-sm"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            backgroundColor: 'var(--uwu-input-bg)',
            borderColor: 'var(--uwu-input-border)',
            color: 'var(--uwu-text-muted)',
          }}
        >
          No matches found
        </div>
      )}
    </>
  );

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full resize-none rounded-md border px-3 py-2 text-sm placeholder:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        style={{
          backgroundColor: 'var(--uwu-input-bg)',
          borderColor: 'var(--uwu-input-border)',
          color: 'var(--uwu-text)',
          ...style,
        }}
        rows={4}
      />
      {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  );
}
