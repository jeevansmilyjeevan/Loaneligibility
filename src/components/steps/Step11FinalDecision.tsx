import React from 'react';
import { useWizard } from '../../context/WizardContext';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { OutcomeBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressRing } from '../ui/ProgressRing';
import { STEP_LABELS } from '../../constants/options';
import { formatCurrency, formatMonths, parseNum, calcAge } from '../../utils/formatters';

const NEXT_STEPS: Record<string, string[]> = {
  eligible: [
    'Contact a loan officer to begin the formal application.',
    'Gather all income and identity documents.',
    'Arrange for property documentation and legal verification.',
    'Get a formal property valuation by a lender-approved valuer.',
    'Submit complete application with all KYC and income proofs.',
  ],
  eligible_with_conditions: [
    'Review the conditions listed in the summary before applying.',
    'Address any LTV or FOIR gaps identified.',
    'Collect all required documentation.',
    'Discuss specific conditions with a loan officer.',
    'Formally apply once conditions can be met.',
  ],
  needs_review: [
    'Review all flags raised in Step 10 carefully.',
    'Consider improving credit score before applying (if low).',
    'Settle or reduce existing EMI obligations to improve FOIR.',
    'Consult a loan officer — some cases can be processed manually.',
    'Gather complete income and property documentation.',
  ],
  not_eligible: [
    'Review the specific disqualifying factors identified.',
    'If age is the issue, consider reducing tenure.',
    'If LTV is the issue, increase down payment.',
    'If credit score is the issue, work on improving it over 6–12 months.',
    'Re-run this assessment after addressing the key issues.',
  ],
};

export function Step11FinalDecision() {
  const { state, eligibilityResult, goToStep, resetWizard } = useWizard();
  const { step1, step2, step3, step4, step5, step6, step7 } = state;

  if (!eligibilityResult) {
    return (
      <Card>
        <Alert type="info">Please complete all steps before viewing the final decision.</Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => goToStep(0)}>Go to Step 1</Button>
        </div>
      </Card>
    );
  }

  const {
    outcome, totalScore, flags, maxLoanAmount, estimatedEMI,
    interestRateRange, ltvPercent, foirPercent,
  } = eligibilityResult;

  const loanAmount = parseNum(step1.desiredLoanAmount);
  const tenure = parseNum(step1.requestedTenureMonths);

  const bgColor = {
    eligible: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800',
    eligible_with_conditions: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800',
    needs_review: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800',
    not_eligible: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800',
  }[outcome];

  const explanations = {
    eligible: 'Based on the details provided, this application appears to meet the preliminary eligibility criteria across amount, tenure, LTV, credit, income, and co-applicant requirements. Proceed to formal application.',
    eligible_with_conditions: 'The application is broadly eligible but some conditions need to be addressed — such as LTV adjustment, documentation gaps, or credit profile improvements. Review the conditions in Step 10.',
    needs_review: 'Some aspects of this profile fall below the standard thresholds or are inconclusive. Formal review by a lender underwriter is required before a decision can be made.',
    not_eligible: 'One or more critical parameters — such as age, LTV, credit history, or loan amount — are outside the acceptable range under current policy. Please review the specific issues and re-assess.',
  };

  return (
    <div className="space-y-5">
      {/* Main result card — printable */}
      <div id="printable-summary">
        {/* Header result card */}
        <div className={`rounded-2xl border bg-gradient-to-br p-6 ${bgColor} print:border print:rounded-none`}>
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            <ProgressRing score={totalScore} size={120} label="Score" />
            <div className="flex-1 text-center sm:text-left space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {STEP_LABELS[10]}
              </p>
              <OutcomeBadge outcome={outcome} size="md" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {outcome === 'eligible' && 'Congratulations — You Appear Eligible'}
                {outcome === 'eligible_with_conditions' && 'Eligible — with Conditions'}
                {outcome === 'needs_review' && 'Application Needs Review'}
                {outcome === 'not_eligible' && 'Not Eligible Under Current Parameters'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">{explanations[outcome]}</p>
            </div>
          </div>

          {/* Key numbers grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ResultStat label="Eligibility Score" value={`${totalScore}/100`} />
            <ResultStat label="Requested Amount" value={loanAmount > 0 ? formatCurrency(loanAmount, true) : '—'} />
            <ResultStat label="Max by LTV" value={maxLoanAmount > 0 ? formatCurrency(maxLoanAmount, true) : '—'} />
            <ResultStat label="EMI Estimate" value={estimatedEMI > 0 ? `${formatCurrency(Math.round(estimatedEMI))}/mo` : '—'} />
            <ResultStat label="Tenure" value={tenure > 0 ? formatMonths(tenure) : '—'} />
            <ResultStat label="LTV" value={ltvPercent > 0 ? `${(ltvPercent * 100).toFixed(1)}%` : '—'} />
            <ResultStat label="FOIR" value={foirPercent > 0 ? `${(foirPercent * 100).toFixed(1)}%` : '—'} />
            <ResultStat label="Rate Estimate" value={`${interestRateRange.min}%–${interestRateRange.max}%`} />
          </div>

          {/* Applicant line */}
          <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400">
            Applicant: {step2.applicantName || 'Not provided'} ·{' '}
            {step2.dateOfBirth ? `Age: ${calcAge(step2.dateOfBirth)}` : ''} ·{' '}
            {step2.employmentType ? `${step2.employmentType.replace('_', '-')} applicant` : ''} ·{' '}
            Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* Flags summary (print) */}
        {flags.filter((f) => f.type !== 'info').length > 0 && (
          <Card className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Key Issues &amp; Warnings</h3>
            <ul className="space-y-1.5">
              {flags.filter((f) => f.type !== 'info').map((f, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className={f.type === 'error' ? 'text-red-600 font-bold' : 'text-amber-600 font-bold'}>
                    {f.type === 'error' ? '✕' : '⚠'}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">{f.message}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Recommended next steps */}
        <Card className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recommended Next Steps</h3>
          <ol className="space-y-2">
            {NEXT_STEPS[outcome].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-gray-600 dark:text-gray-300">{step}</span>
              </li>
            ))}
          </ol>
        </Card>

        {/* Disclaimer */}
        <Alert type="info" className="mt-4">
          <strong>Important Disclaimer.</strong> This is a preliminary eligibility indicator only, based on the policy parameters configured in this tool. It is not a formal loan offer, sanction letter, credit decision, or commitment by any lender. Final eligibility, sanctioned amount, interest rate, and all other terms are determined by the lender after complete application processing, credit bureau assessment, property valuation, legal due diligence, and underwriting approval.
        </Alert>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <Button
          variant="primary"
          size="lg"
          onClick={() => window.print()}
        >
          🖨 Print / Save as PDF
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => goToStep(9)}
        >
          ← Back to Summary
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={resetWizard}
        >
          Start Over
        </Button>
      </div>

      {/* Print styles injected inline */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-summary, #printable-summary * { visibility: visible; }
          #printable-summary { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}
