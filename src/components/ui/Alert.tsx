import React from 'react';
import type { FlagType } from '../../types';

interface AlertProps {
  type: FlagType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const config: Record<FlagType, { bg: string; border: string; icon: string; titleColor: string }> = {
  error: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    icon: '✕',
    titleColor: 'text-red-800 dark:text-red-300',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: '⚠',
    titleColor: 'text-amber-800 dark:text-amber-300',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'ℹ',
    titleColor: 'text-blue-800 dark:text-blue-300',
  },
};

export function Alert({ type, title, children, className = '' }: AlertProps) {
  const { bg, border, icon, titleColor } = config[type];
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={['rounded-lg border p-4', bg, border, className].join(' ')}
    >
      <div className="flex gap-3">
        <span className={['text-base font-bold mt-0.5', titleColor].join(' ')} aria-hidden>
          {icon}
        </span>
        <div>
          {title && <p className={['text-sm font-semibold mb-1', titleColor].join(' ')}>{title}</p>}
          <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function DisclaimerBanner() {
  return (
    <Alert type="info">
      <strong>Preliminary eligibility check only.</strong> This tool provides an indicative assessment based on internal policy guidelines. It is not a bank approval, offer, or commitment. Final eligibility and loan terms are determined by the lender after full documentation, credit bureau verification, property valuation, and underwriting.
    </Alert>
  );
}
