import React from 'react';
import { useWizard } from '../../context/WizardContext';
import { Card, SectionTitle } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { Badge, OutcomeBadge } from '../ui/Badge';
import { ProgressRing } from '../ui/ProgressRing';
import { WizardNavigation } from '../layout/WizardNavigation';
import { STEP_LABELS } from '../../constants/options';
import { formatCurrency, formatMonths, formatDate, parseNum, calcAge } from '../../utils/formatters';
import type { CategoryScore, EligibilityFlag } from '../../types';

export function Step10ReviewSummary() {
  const { state, eligibilityResult, goToStep, completeStep, saveDraft, resetWizard } = useWizard();
  const { step1, step2, step3, step4, step5, step6, step7 } = state;

  const handleNext = () => {
    completeStep(9);
    goToStep(10);
  };

  if (!eligibilityResult) {
    return (
      <Card>
        <Alert type="info">
          Please complete the previous steps to generate the eligibility summary.
        </Alert>
        <WizardNavigation currentStep={9} totalSteps={11} onBack={() => goToStep(8)} onNext={() => goToStep(10)} onSaveDraft={saveDraft} onReset={resetWizard} />
      </Card>
    );
  }

  const { outcome, totalScore, breakdown, flags, maxLoanAmount, estimatedEMI, interestRateRange, ltvPercent, foirPercent, ageAtMaturity } = eligibilityResult;

  const errFlags = flags.filter((f) => f.type === 'error');
  const warnFlags = flags.filter((f) => f.type === 'warning');
  const infoFlags = flags.filter((f) => f.type === 'info');

  return (
    <>
      {/* Score + Outcome */}
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing score={totalScore} size={130} label="Eligibility Score" />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <OutcomeBadge outcome={outcome} size="md" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {outcome === 'eligible' && 'Preliminary assessment: Eligible'}
              {outcome === 'eligible_with_conditions' && 'Eligible — with conditions to meet'}
              {outcome === 'needs_review' && 'Needs further review before approval'}
              {outcome === 'not_eligible' && 'Not eligible under current parameters'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This is a preliminary check only. Not a bank decision or loan offer.
            </p>
          </div>
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card className="mb-4">
        <SectionTitle subtitle="Score breakdown by category.">Risk Category Breakdown</SectionTitle>
        <div className="space-y-3">
          {breakdown.filter((c) => c.maxScore > 0).map((cat) => (
            <CategoryBar key={cat.key} cat={cat} />
          ))}
        </div>
      </Card>

      {/* Key Computed Values */}
      <Card className="mb-4">
        <SectionTitle>Key Assessment Values</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KVStat label="Max Loan by LTV" value={maxLoanAmount > 0 ? formatCurrency(maxLoanAmount, true) : '—'} />
          <KVStat label="Requested Loan" value={parseNum(step1.desiredLoanAmount) > 0 ? formatCurrency(parseNum(step1.desiredLoanAmount), true) : '—'} />
          <KVStat label="Estimated EMI" value={estimatedEMI > 0 ? `${formatCurrency(Math.round(estimatedEMI))}/mo` : '—'} />
          <KVStat label="LTV Ratio" value={ltvPercent > 0 ? `${(ltvPercent * 100).toFixed(1)}%` : '—'} />
          <KVStat label="FOIR (incl. new EMI)" value={foirPercent > 0 ? `${(foirPercent * 100).toFixed(1)}%` : '—'} />
          <KVStat label="Age at Maturity" value={ageAtMaturity > 0 ? `${ageAtMaturity.toFixed(1)} yrs` : '—'} />
          <KVStat label="Rate Range (est.)" value={`${interestRateRange.min}% – ${interestRateRange.max}%`} />
          <KVStat label="Tenure" value={parseNum(step1.requestedTenureMonths) > 0 ? formatMonths(parseNum(step1.requestedTenureMonths)) : '—'} />
          <KVStat label="Credit Score" value={parseNum(step4.creditScore) > 0 ? String(parseNum(step4.creditScore)) : '—'} />
        </div>
      </Card>

      {/* Flags */}
      {flags.length > 0 && (
        <Card className="mb-4">
          <SectionTitle subtitle="Issues and notes identified during assessment.">Flags &amp; Warnings</SectionTitle>
          <div className="space-y-3">
            {errFlags.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">Errors (must resolve)</p>
                {errFlags.map((f, i) => <FlagItem key={i} flag={f} />)}
              </div>
            )}
            {warnFlags.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">Warnings</p>
                {warnFlags.map((f, i) => <FlagItem key={i} flag={f} />)}
              </div>
            )}
            {infoFlags.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">Information</p>
                {infoFlags.map((f, i) => <FlagItem key={i} flag={f} />)}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Application Data Summary */}
      <Card className="mb-4">
        <SectionTitle subtitle="Review all entered details.">Application Data Summary</SectionTitle>
        <div className="space-y-4 text-sm">
          <Section title="Loan Basics">
            <DataRow label="Amount" value={parseNum(step1.desiredLoanAmount) > 0 ? formatCurrency(parseNum(step1.desiredLoanAmount)) : '—'} />
            <DataRow label="Tenure" value={parseNum(step1.requestedTenureMonths) > 0 ? formatMonths(parseNum(step1.requestedTenureMonths)) : '—'} />
            <DataRow label="Purpose" value={step1.loanPurpose.replace(/_/g, ' ')} />
            <DataRow label="Property Type" value={step1.propertyType.replace(/_/g, ' ')} />
          </Section>
          <Section title="Applicant">
            <DataRow label="Name" value={step2.applicantName || '—'} />
            <DataRow label="DOB" value={step2.dateOfBirth ? formatDate(step2.dateOfBirth) : '—'} />
            <DataRow label="Age" value={step2.dateOfBirth ? `${calcAge(step2.dateOfBirth)} years` : '—'} />
            <DataRow label="Employment" value={step2.employmentType.replace('_', '-') || '—'} />
          </Section>
          <Section title="Property">
            <DataRow label="Market Value" value={parseNum(step3.marketValue) > 0 ? formatCurrency(parseNum(step3.marketValue)) : '—'} />
            <DataRow label="Own Contribution" value={parseNum(step3.ownContribution) > 0 ? formatCurrency(parseNum(step3.ownContribution)) : '—'} />
          </Section>
          <Section title="Credit">
            <DataRow label="Score" value={parseNum(step4.creditScore) > 0 ? String(parseNum(step4.creditScore)) : '—'} />
            <DataRow label="Defaults" value={step4.hasDefaults ? `Yes — ${step4.defaultSeverity}` : 'None declared'} />
            <DataRow label="Existing EMIs" value={step4.existingLoans.length > 0 ? formatCurrency(step4.existingLoans.reduce((s, l) => s + l.monthlyEMI, 0)) + '/mo' : 'None'} />
          </Section>
          <Section title="Income">
            <DataRow label="Net Income" value={parseNum(step5.monthlyNetIncome) > 0 ? formatCurrency(parseNum(step5.monthlyNetIncome)) + '/mo' : '—'} />
            <DataRow label="Other Income" value={parseNum(step5.otherMonthlyIncome) > 0 ? formatCurrency(parseNum(step5.otherMonthlyIncome)) + '/mo' : '—'} />
            <DataRow label="Stability" value={parseNum(step5.employmentStabilityYears) > 0 ? `${parseNum(step5.employmentStabilityYears)} years` : '—'} />
          </Section>
          <Section title="Co-Applicant">
            <DataRow label="Count" value={String(step6.numberOfCoApplicants)} />
            <DataRow label="Relationship" value={step6.coApplicantRelationship.replace('_', '/') || 'Not specified'} />
            <DataRow label="All Owners Included" value={step6.allOwnersIncluded ? 'Yes' : 'No'} />
          </Section>
          <Section title="Product">
            <DataRow label="Rate Type" value={step7.rateType || '—'} />
            <DataRow label="Variant" value={step7.productVariant || '—'} />
          </Section>
        </div>
      </Card>

      <WizardNavigation
        currentStep={9}
        totalSteps={11}
        onBack={() => goToStep(8)}
        onNext={handleNext}
        onSaveDraft={saveDraft}
        onReset={resetWizard}
        nextLabel="View Final Result →"
      />
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryBar({ cat }: { cat: CategoryScore }) {
  const pct = cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0;
  const color = cat.status === 'pass' ? 'bg-green-500' : cat.status === 'warning' ? 'bg-amber-500' : 'bg-red-500';
  const textColor = cat.status === 'pass' ? 'text-green-700 dark:text-green-400' : cat.status === 'warning' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400';
  const badgeColor = cat.status === 'pass' ? 'green' : cat.status === 'warning' ? 'amber' : 'red';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${textColor}`}>{cat.score}/{cat.maxScore}</span>
          <Badge color={badgeColor as 'green' | 'amber' | 'red'} size="sm">
            {cat.status === 'pass' ? 'Pass' : cat.status === 'warning' ? 'Warning' : 'Fail'}
          </Badge>
        </div>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      {cat.notes.length > 0 && (
        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
          {cat.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
    </div>
  );
}

function FlagItem({ flag }: { flag: EligibilityFlag }) {
  const icon = flag.type === 'error' ? '✕' : flag.type === 'warning' ? '⚠' : 'ℹ';
  const color = flag.type === 'error' ? 'text-red-600 dark:text-red-400' : flag.type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400';
  return (
    <div className="flex gap-2 text-sm py-1 border-b dark:border-gray-700 last:border-0">
      <span className={`font-bold ${color} shrink-0`}>{icon}</span>
      <span className="text-gray-600 dark:text-gray-300">{flag.message}</span>
    </div>
  );
}

function KVStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">{title}</h4>
      <div className="rounded-lg border dark:border-gray-700 overflow-hidden divide-y dark:divide-gray-700">
        {children}
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-3 py-2 bg-white dark:bg-gray-900 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">{value}</span>
    </div>
  );
}
