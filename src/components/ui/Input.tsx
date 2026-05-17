import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  hint?: string;
  inputPrefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const baseInput = [
  'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
  'bg-white text-gray-900 placeholder-gray-400',
  'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
  'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-500',
  'dark:focus:border-blue-400 dark:focus:ring-blue-400/20',
  'disabled:opacity-60 disabled:cursor-not-allowed',
].join(' ');

const errorInput = 'border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500';

export function Input({ error, hint, inputPrefix, suffix, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      <div className="relative flex items-center">
        {inputPrefix && (
          <span className="absolute left-3 text-sm text-gray-500 dark:text-gray-400 pointer-events-none select-none">
            {inputPrefix}
          </span>
        )}
        <input
          className={[baseInput, error ? errorInput : '', inputPrefix ? 'pl-8' : '', suffix ? 'pr-10' : '', className].join(' ')}
          aria-invalid={!!error}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-sm text-gray-500 dark:text-gray-400 pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
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

// ─── Currency Input ───────────────────────────────────────────────────────────

interface CurrencyInputProps extends Omit<InputProps, 'type' | 'inputPrefix' | 'onChange'> {
  value: number | '';
  onChange: (val: number | '') => void;
}

export function CurrencyInput({ value, onChange, ...props }: CurrencyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    if (raw === '' || raw === '-') { onChange(''); return; }
    const n = Number(raw);
    if (!isNaN(n)) onChange(n);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      inputPrefix="₹"
      value={value === '' ? '' : value.toLocaleString('en-IN')}
      onChange={handleChange}
      {...props}
    />
  );
}

// ─── Number Input ─────────────────────────────────────────────────────────────

interface NumberInputProps extends Omit<InputProps, 'type' | 'onChange'> {
  value: number | '';
  onChange: (val: number | '') => void;
}

export function NumberInput({ value, onChange, ...props }: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') { onChange(''); return; }
    const n = Number(raw);
    if (!isNaN(n)) onChange(n);
  };
  return (
    <Input
      type="number"
      value={value}
      onChange={handleChange}
      {...props}
    />
  );
}
