import React from 'react';
import { Button } from '../ui/Button';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onReset: () => void;
  isLastStep?: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSaveDraft,
  onReset,
  isLastStep = false,
  nextLabel,
  nextDisabled = false,
}: WizardNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex gap-2">
        {currentStep > 0 && (
          <Button variant="secondary" onClick={onBack} size="md">
            ← Back
          </Button>
        )}
        <Button variant="ghost" onClick={onSaveDraft} size="md">
          Save Draft
        </Button>
      </div>

      <div className="flex gap-2 items-center">
        <span className="hidden sm:inline text-xs text-gray-400 dark:text-gray-500">
          {currentStep + 1} / {totalSteps}
        </span>
        {!isLastStep && (
          <Button
            variant="ghost"
            size="md"
            onClick={onReset}
            className="text-gray-400 hover:text-red-500"
          >
            Reset
          </Button>
        )}
        <Button
          variant="primary"
          onClick={onNext}
          disabled={nextDisabled}
          size="md"
        >
          {nextLabel ?? (isLastStep ? 'Finish' : 'Next →')}
        </Button>
      </div>
    </div>
  );
}
