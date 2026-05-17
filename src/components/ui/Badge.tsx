import React from 'react';
import type { EligibilityOutcome } from '../../types';

type BadgeColor = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'indigo';

interface BadgeProps {
  color?: BadgeColor;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const colorClasses: Record<BadgeColor, string> = {
  green:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  blue:   'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  amber:  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  red:    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  gray:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const dotColors: Record<BadgeColor, string> = {
  green: 'bg-green-500', blue: 'bg-blue-500', amber: 'bg-amber-500',
  red: 'bg-red-500', gray: 'bg-gray-500', indigo: 'bg-indigo-500',
};

export function Badge({ color = 'gray', children, size = 'sm', dot = false }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        colorClasses[color],
      ].join(' ')}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />}
      {children}
    </span>
  );
}

// Convenience badge for eligibility outcomes
export function OutcomeBadge({ outcome, size = 'md' }: { outcome: EligibilityOutcome; size?: 'sm' | 'md' }) {
  const map: Record<EligibilityOutcome, { color: BadgeColor; label: string }> = {
    eligible:                 { color: 'green',  label: 'Eligible' },
    eligible_with_conditions: { color: 'blue',   label: 'Eligible with Conditions' },
    needs_review:             { color: 'amber',  label: 'Needs Review' },
    not_eligible:             { color: 'red',    label: 'Not Eligible' },
  };
  const { color, label } = map[outcome];
  return <Badge color={color} size={size} dot>{label}</Badge>;
}
