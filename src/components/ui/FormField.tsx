import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, required, error, hint, children, className = '' }: FormFieldProps) {
  return (
    <div className={['space-y-1', className].join(' ')}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
      </label>
      {children}
      {error && !React.isValidElement(children) && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {!error && hint && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}

export function FormRow({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  const colMap = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' };
  return (
    <div className={['grid gap-4', colMap[cols]].join(' ')}>
      {children}
    </div>
  );
}
