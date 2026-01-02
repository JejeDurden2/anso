import * as React from 'react';
import { useState, useEffect } from 'react';

import { cn } from '../lib/utils';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  currency?: string;
  error?: string;
}

function formatDisplayValue(value: string): string {
  if (!value) return '';

  // Remove all non-digit characters except decimal separator
  const numericValue = value.replace(/[^\d.,]/g, '');

  // Split integer and decimal parts
  const parts = numericValue.split(/[.,]/);
  const integerPart = parts[0] || '';
  const decimalPart = parts[1];

  // Add thousand separators to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // Combine with decimal part if present
  if (decimalPart !== undefined) {
    return `${formattedInteger},${decimalPart.slice(0, 2)}`;
  }

  return formattedInteger;
}

function parseToNumericString(displayValue: string): string {
  if (!displayValue) return '';

  // Remove spaces (thousand separators) and replace comma with dot for numeric value
  const cleaned = displayValue.replace(/\s/g, '').replace(',', '.');

  // Only keep valid numeric characters
  const numericOnly = cleaned.replace(/[^\d.]/g, '');

  return numericOnly;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = '', onChange, currency = '€', error, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(() => formatDisplayValue(value));

    // Update display value when external value changes
    useEffect(() => {
      const formatted = formatDisplayValue(value);
      if (parseToNumericString(formatted) !== parseToNumericString(displayValue)) {
        setDisplayValue(formatted);
      }
    }, [value, displayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      const rawValue = e.target.value;

      // Allow empty input
      if (!rawValue) {
        setDisplayValue('');
        onChange?.('');
        return;
      }

      // Only allow digits, spaces, commas, and dots
      if (!/^[\d\s.,]*$/.test(rawValue)) {
        return;
      }

      // Format and update display
      const formatted = formatDisplayValue(rawValue);
      setDisplayValue(formatted);

      // Send numeric string value to parent
      const numericValue = parseToNumericString(formatted);
      onChange?.(numericValue);
    };

    return (
      <div className="w-full">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-slate-500 sm:text-sm">{currency}</span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            ref={ref}
            value={displayValue}
            onChange={handleChange}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
