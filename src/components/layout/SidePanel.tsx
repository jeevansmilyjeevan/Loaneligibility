import React from 'react';
import { useWizard } from '../../context/WizardContext';
import { OutcomeBadge } from '../ui/Badge';
import { ProgressRing } from '../ui/ProgressRing';
import { formatCurrency, formatMonths, parseNum } from '../../utils/formatters';

export function SidePanel() {
  const { state, eligibilityResult } = useWizard();
  const { step1, step2, step3, step5 } = state;

  const loanAmount = parseNum(step1.desiredLoanAmount);
  const income = parseNum(step5.monthlyNetIncome) + parseNum(step5.otherMonthlyIncome);

  return (
    <aside
      aria-label="Application summary"
      className="hidden xl:flex flex-col gap-4 w-72 shrink-0"
    >
      {/* Quick stats */}
      <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
          Application Summary
        </h3>
        <dl className="space-y-3">
          <SideStat label="Applicant" value={step2.applicantName || '—'} />
          <SideStat
            label="Loan Amount"
            value={loanAmount > 0 ? formatCurrency(loanAmount, true) : '—'}
          />
          <SideStat
            label="Tenure"
            value={parseNum(step1.requestedTenureMonths) > 0 ? formatMonths(parseNum(step1.requestedTenureMonths)) : '—'}
          />
          <SideStat
            label="Property Value"
            value={parseNum(step3.marketValue) > 0 ? formatCurrency(parseNum(step3.marketValue), true) : '—'}
          />
          <SideStat
            label="Monthly Income"
            value={income > 0 ? formatCurrency(income, true) : '—'}
          />
        </dl>
      </div>

      {/* Eligibility score */}
      {eligibilityResult && (
        <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-5 shadow-sm flex flex-col items-center gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 self-start">
            Eligibility Score
          </h3>
          <ProgressRing score={eligibilityResult.totalScore} size={100} label="out of 100" />
          <OutcomeBadge outcome={eligibilityResult.outcome} size="sm" />
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Preliminary assessment — not a bank decision.
          </p>
        </div>
      )}

      {/* Flags summary */}
      {eligibilityResult && eligibilityResult.flags.length > 0 && (
        <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Flags
          </h3>
          <ul className="space-y-2">
            {eligibilityResult.flags.slice(0, 5).map((f, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span
                  className={[
                    'shrink-0 font-bold',
                    f.type === 'error' ? 'text-red-500' : f.type === 'warning' ? 'text-amber-500' : 'text-blue-500',
                  ].join(' ')}
                >
                  {f.type === 'error' ? '✕' : f.type === 'warning' ? '⚠' : 'ℹ'}
                </span>
                <span className="text-gray-600 dark:text-gray-300">{f.message}</span>
              </li>
            ))}
            {eligibilityResult.flags.length > 5 && (
              <li className="text-xs text-gray-400">
                +{eligibilityResult.flags.length - 5} more flags — see Step 10.
              </li>
            )}
          </ul>
        </div>
      )}
    </aside>
  );
}

function SideStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-right">{value}</dd>
    </div>
  );
}
