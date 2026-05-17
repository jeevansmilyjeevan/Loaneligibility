import React from 'react';
import type { SelectOption } from '../../constants/options';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
}

export function Select({ options, placeholder = 'Select…', error, hint, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      <select
        className={[
          'w-full rounded-lg border px-3 py-2 text-sm transition-colors appearance-none',
          'bg-white text-gray-900',
          'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
          'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600',
          'dark:focus:border-blue-400 dark:focus:ring-blue-400/20',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : '',
          className,
        ].join(' ')}
        aria-invalid={!!error}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}
