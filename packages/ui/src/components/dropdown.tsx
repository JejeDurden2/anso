import { ChevronDown } from 'lucide-react';
import { type ReactNode, useState, useRef, useEffect } from 'react';

import { cn } from '../lib/utils';

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'left', className }: DropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[12rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg',
            align === 'left' ? 'left-0' : 'right-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  disabled,
  danger,
  className,
}: DropdownItemProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center px-4 py-2 text-left text-sm transition-colors',
        danger
          ? 'text-danger hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-50',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownDivider(): JSX.Element {
  return <div className="my-1 border-t border-slate-200" />;
}

export interface DropdownButtonProps {
  children: ReactNode;
  className?: string;
}

export function DropdownButton({ children, className }: DropdownButtonProps): JSX.Element {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50',
        className
      )}
    >
      {children}
      <ChevronDown className="h-4 w-4" />
    </button>
  );
}
