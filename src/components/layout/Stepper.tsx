import React from 'react';
import { STEP_LABELS } from '../../constants/options';

interface StepperProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (step: number) => void;
}

export function Stepper({ currentStep, completedSteps, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Application progress" className="w-full">
      {/* Mobile: compact bar */}
      <div className="flex items-center gap-2 sm:hidden px-4 py-3 bg-white dark:bg-gray-900 border-b dark:border-gray-700">
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          Step {currentStep + 1} of {STEP_LABELS.length}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">— {STEP_LABELS[currentStep]}</span>
        <div className="flex-1 ml-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: full stepper */}
      <ol className="hidden sm:flex items-start gap-0 overflow-x-auto" role="list">
        {STEP_LABELS.map((label, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const isAccessible = isCompleted || index <= Math.max(currentStep, ...[...completedSteps]);

          return (
            <li key={index} className="flex-1 flex flex-col items-center relative min-w-0">
              {/* connector line */}
              {index < STEP_LABELS.length - 1 && (
                <div
                  className={[
                    'absolute top-4 left-1/2 right-0 h-0.5 w-full',
                    isCompleted ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700',
                  ].join(' ')}
                  style={{ left: '50%' }}
                  aria-hidden
                />
              )}
              <button
                onClick={() => isAccessible && onStepClick(index)}
                disabled={!isAccessible}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${index + 1}: ${label}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
                className={[
                  'relative z-10 flex flex-col items-center gap-1 group',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md p-1',
                  isAccessible ? 'cursor-pointer' : 'cursor-default',
                ].join(' ')}
              >
                {/* Circle */}
                <span
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200',
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                  ].join(' ')}
                >
                  {isCompleted ? '✓' : index + 1}
                </span>
                {/* Label */}
                <span
                  className={[
                    'text-xs text-center max-w-[70px] leading-tight',
                    isCurrent
                      ? 'font-semibold text-blue-600 dark:text-blue-400'
                      : isCompleted
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-400 dark:text-gray-500',
                  ].join(' ')}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
