import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export function Checkbox({ label, description, className = '', ...props }: CheckboxProps) {
  return (
    <label className={['flex items-start gap-3 cursor-pointer group', className].join(' ')}>
      <input
        type="checkbox"
        className={[
          'mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600',
          'focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1',
          'dark:border-gray-600 dark:bg-gray-800',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
        {...props}
      />
      <span>
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
          {label}
        </span>
        {description && (
          <span className="block text-xs text-gray-500 dark:text-gray-400">{description}</span>
        )}
      </span>
    </label>
  );
}
