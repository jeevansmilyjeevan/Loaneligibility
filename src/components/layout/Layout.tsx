import React, { useEffect, useState } from 'react';
import { Stepper } from './Stepper';
import { SidePanel } from './SidePanel';
import { useWizard } from '../../context/WizardContext';
import { Button } from '../ui/Button';

export function Layout({ children, onOpenChecklist }: { children: React.ReactNode; onOpenChecklist?: () => void }) {
  const { state, goToStep, completeStep } = useWizard();
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('darkMode', String(dark));
  }, [dark]);

  const handleStepClick = (step: number) => {
    completeStep(state.currentStep);
    goToStep(step);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="w-full px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">HL</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                Home Loan Eligibility
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-none mt-0.5">
                Preliminary checker · Not a bank decision
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenChecklist && (
              <Button variant="ghost" size="sm" onClick={onOpenChecklist}>
                Policy Checklist
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDark((d) => !d)}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? '☀️' : '🌙'}
            </Button>
          </div>
        </div>
        {/* Stepper row */}
        <div className="w-full px-2 sm:px-6 py-2">
          <Stepper
            currentStep={state.currentStep}
            completedSteps={state.completedSteps}
            onStepClick={handleStepClick}
          />
        </div>
      </header>

      {/* Body */}
      <div className="w-full px-4 sm:px-6 py-6 flex gap-6 items-start">
        {/* Main content */}
        <main className="flex-1 min-w-0 animate-slide-in" role="main">
          {children}
        </main>
        {/* Side panel — desktop only */}
        <SidePanel />
      </div>
    </div>
  );
}
