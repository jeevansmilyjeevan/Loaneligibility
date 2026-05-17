import React from 'react';
import { useWizard } from '../../context/WizardContext';
import { Card, SectionTitle } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { Select } from '../ui/Select';
import { FormField } from '../ui/FormField';
import { Alert } from '../ui/Alert';
import { WizardNavigation } from '../layout/WizardNavigation';
import { STEP_LABELS } from '../../constants/options';
import { POLICY } from '../../config/policy';
import { calculateEMI } from '../../engine/calculations';
import { formatCurrency, formatMonths, parseNum } from '../../utils/formatters';

const PREPAYMENT_OPTIONS = [
  { value: 'none', label: 'No plans to prepay' },
  { value: 'occasional', label: 'Occasional — once or twice over the loan term' },
  { value: 'frequent', label: 'Frequent — each year or multiple times a year' },
];

export function Step9Prepayment() {
  const { state, updateStep9, goToStep, completeStep, saveDraft, resetWizard } = useWizard();
  const { step9, step1, step7 } = state;

  const handleNext = () => {
    completeStep(8);
    goToStep(9);
  };

  const isFloating = step7.rateType === 'floating' || !step7.rateType;
  const rate = isFloating ? POLICY.interestRates.defaultEstimateRate : POLICY.interestRates.fixed.rate;
  const loanAmount = parseNum(step1.desiredLoanAmount);
  const tenure = parseNum(step1.requestedTenureMonths);
  const emi = loanAmount > 0 && tenure > 0 ? calculateEMI(loanAmount, rate, tenure) : 0;

  // Illustrative prepayment — 10% lump sum at year 5
  const illustrativePrepay = loanAmount * 0.10;
  const remaining60 = tenure - 60;
  // Outstanding after 5 years (approx) — simplified: remaining balance
  const paidInFirst5 = emi * 60;
  const interestInFirst5 = loanAmount * (rate / 100) * 5; // rough estimate
  const outstandingApprox = Math.max(0, loanAmount - (paidInFirst5 - interestInFirst5));
  const newOutstanding = Math.max(0, outstandingApprox - illustrativePrepay);
  const newEMI = remaining60 > 0 ? calculateEMI(newOutstanding, rate, remaining60) : 0;

  return (
    <>
      <Card>
        <SectionTitle subtitle="Understand prepayment rules and see the impact on your loan.">
          {STEP_LABELS[8]}
        </SectionTitle>

        <Alert type="info" className="mb-5">
          <strong>Informational only.</strong> Prepayment preferences are noted but do not affect eligibility.
        </Alert>

        <div className="space-y-6">
          {/* Rate type note */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Prepayment Rules (Indicative)</h3>
            {isFloating ? (
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-disc list-inside">
                {POLICY.prepayment.floatingIndividualNilCharges && (
                  <li>
                    For individual borrowers on floating rate home loans — <strong>foreclosure charges may be NIL</strong> (subject to RBI guidelines and lender policy).
                  </li>
                )}
                <li>
                  Part-prepayment may be restricted to <strong>{POLICY.prepayment.maxPrepaymentPerYear} times per financial year</strong>.
                </li>
                <li>
                  Each part-prepayment may be capped at <strong>{POLICY.prepayment.maxPrepaymentPercentOfPrincipal}% of principal outstanding</strong>.
                </li>
                <li>
                  Prepayment may only be allowed after <strong>{POLICY.prepayment.minEMIsBeforePrepayment} EMIs</strong> have been paid.
                </li>
              </ul>
            ) : (
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-disc list-inside">
                <li>
                  Fixed rate loans may attract a foreclosure charge of approximately{' '}
                  <strong>{POLICY.prepayment.otherCasesChargePercent}% + taxes</strong> on outstanding principal.
                </li>
                <li>Lender policy and specific product terms govern exact charges.</li>
              </ul>
            )}
          </div>

          {/* Prepayment intention */}
          <Checkbox
            label="I intend to make part-prepayments during the loan tenure"
            checked={step9.intendsToPrepay}
            onChange={(e) => updateStep9({ intendsToPrepay: e.target.checked })}
          />

          {step9.intendsToPrepay && (
            <div className="space-y-4 ml-7 border-l-2 border-blue-200 dark:border-blue-700 pl-4">
              <FormField label="Anticipated Prepayment Frequency" htmlFor="prepayFreq">
                <Select
                  id="prepayFreq"
                  options={PREPAYMENT_OPTIONS}
                  value={step9.anticipatedPrepaymentBehavior}
                  onChange={(e) => updateStep9({ anticipatedPrepaymentBehavior: e.target.value as typeof step9.anticipatedPrepaymentBehavior })}
                />
              </FormField>

              <Checkbox
                label="Prefer reduced EMI over reduced tenure after prepayment"
                description="Most lenders default to tenure reduction; EMI reduction requires a formal request."
                checked={step9.preferEMIReduction}
                onChange={(e) => updateStep9({ preferEMIReduction: e.target.checked })}
              />
            </div>
          )}

          {/* Illustrative prepayment impact */}
          {emi > 0 && (
            <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
                Illustrative Impact: 10% Lump-Sum After Year 5
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <PrepStat label="Loan Amount" value={formatCurrency(loanAmount, true)} />
                <PrepStat label="Monthly EMI (est.)" value={formatCurrency(Math.round(emi))} />
                <PrepStat label="Prepayment at Yr 5" value={formatCurrency(Math.round(illustrativePrepay), true)} />
                <PrepStat label="New EMI (est.)" value={newEMI > 0 ? formatCurrency(Math.round(newEMI)) : '—'} />
              </div>
              <p className="text-xs text-green-700 dark:text-green-400">
                Values are illustrative estimates for planning purposes. Actual impact depends on outstanding principal, lender terms, and payment date.
              </p>
            </div>
          )}
        </div>
      </Card>

      <WizardNavigation
        currentStep={8}
        totalSteps={11}
        onBack={() => goToStep(7)}
        onNext={handleNext}
        onSaveDraft={saveDraft}
        onReset={resetWizard}
        nextLabel="View Summary →"
      />
    </>
  );
}

function PrepStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-green-700 dark:text-green-300">{label}</p>
      <p className="font-semibold text-green-900 dark:text-green-100">{value}</p>
    </div>
  );
}
