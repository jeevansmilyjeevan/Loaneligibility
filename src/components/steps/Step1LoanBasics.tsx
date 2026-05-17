import React, { useState } from 'react';
import { useWizard } from '../../context/WizardContext';
import { validateStep1 } from '../../engine/validation';
import { Card, SectionTitle } from '../ui/Card';
import { FormField, FormRow } from '../ui/FormField';
import { CurrencyInput, NumberInput } from '../ui/Input';
import { Select } from '../ui/Select';
import { Alert, DisclaimerBanner } from '../ui/Alert';
import { WizardNavigation } from '../layout/WizardNavigation';
import { LOAN_PURPOSES, PROPERTY_TYPES, STEP_LABELS } from '../../constants/options';
import { POLICY } from '../../config/policy';
import { formatCurrency, formatMonths, parseNum } from '../../utils/formatters';
import { getMaxLoanByLTV, getEffectivePropertyValue } from '../../engine/calculations';
import { FormulaPanel } from '../ui/FormulaPanel';
import type { StepErrors } from '../../types';

export function Step1LoanBasics() {
  const { state, updateStep1, goToStep, completeStep, saveDraft, resetWizard } = useWizard();
  const { step1 } = state;
  const [errors, setErrors] = useState<StepErrors>({});

  const handleNext = () => {
    const errs = validateStep1(step1);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    completeStep(0);
    goToStep(1);
  };

  const loanAmount = parseNum(step1.desiredLoanAmount);
  const tenureMonths = parseNum(step1.requestedTenureMonths);

  return (
    <>
      <Card>
        <SectionTitle subtitle="Tell us about the loan you're looking for.">
          {STEP_LABELS[0]}
        </SectionTitle>

        <DisclaimerBanner />

        <div className="mt-6 space-y-5">
          <FormRow cols={2}>
            <FormField label="Desired Loan Amount" htmlFor="loanAmount" required>
              <CurrencyInput
                id="loanAmount"
                value={step1.desiredLoanAmount}
                onChange={(v) => updateStep1({ desiredLoanAmount: v })}
                placeholder="e.g. 50,00,000"
                error={errors.desiredLoanAmount}
                hint={`Max: ${formatCurrency(POLICY.loanLimits.maxAmount, true)}`}
              />
            </FormField>

            <FormField label="Requested Tenure" htmlFor="tenure" required>
              <NumberInput
                id="tenure"
                value={step1.requestedTenureMonths}
                onChange={(v) => updateStep1({ requestedTenureMonths: v })}
                min={12}
                max={360}
                placeholder="e.g. 240"
                suffix="mo"
                error={errors.requestedTenureMonths}
                hint={tenureMonths > 0 ? `= ${formatMonths(tenureMonths)}` : `Max 360 months (30 years)`}
              />
            </FormField>
          </FormRow>

          <FormRow cols={2}>
            <FormField label="Loan Purpose" htmlFor="loanPurpose" required>
              <Select
                id="loanPurpose"
                options={LOAN_PURPOSES}
                value={step1.loanPurpose}
                onChange={(e) => updateStep1({ loanPurpose: e.target.value as typeof step1.loanPurpose })}
                error={errors.loanPurpose}
              />
            </FormField>

            <FormField label="Property Type" htmlFor="propertyType" required>
              <Select
                id="propertyType"
                options={PROPERTY_TYPES}
                value={step1.propertyType}
                onChange={(e) => updateStep1({ propertyType: e.target.value as typeof step1.propertyType })}
                error={errors.propertyType}
              />
            </FormField>
          </FormRow>

          {/* Info box: amount vs LTV hint */}
          {loanAmount > 0 && (
            <Alert type="info">
              <p>
                Max loanable amount depends on property value and LTV band — up to{' '}
                <strong>90%</strong> for properties up to ₹30L, <strong>80%</strong> for ₹30–75L, and{' '}
                <strong>75%</strong> for properties above ₹75L. You'll calculate exact LTV in Step 3.
              </p>
              {loanAmount > POLICY.loanLimits.maxAmount && (
                <p className="mt-1 font-semibold text-red-700 dark:text-red-400">
                  Amount exceeds the ₹10 crore maximum.
                </p>
              )}
            </Alert>
          )}

          {/* Plot restriction note */}
          {step1.propertyType === 'residential_plot' && (
            <Alert type="warning">
              Residential plot loans may have restrictions. Plot-only purchase (without construction) may not be eligible under standard home loan policy. Plot + construction is a supported purpose.
            </Alert>
          )}
        </div>
      </Card>

      {/* Formula panels */}
      <div className="space-y-2">
        <FormulaPanel
          title="Loan Limit Validation"
          formula={`Hard Fail if: Amount = 0  OR  Amount > ₹10,00,00,000
Hard Fail if: Tenure > 360 months (30 years)
Min Tenure:   12 months`}
          variables={[
            { symbol: '₹10Cr', meaning: 'Policy maximum sanctioned amount' },
            { symbol: '360 mo', meaning: 'Policy maximum tenure (30 years)' },
          ]}
          steps={[
            { label: 'Amount entered', expr: loanAmount > 0 ? `₹${loanAmount.toLocaleString('en-IN')}` : 'Not entered' },
            { label: 'Amount check', expr: loanAmount > POLICY.loanLimits.maxAmount ? `₹${loanAmount.toLocaleString('en-IN')} > ₹10,00,00,000 → HARD FAIL` : loanAmount > 0 ? `₹${loanAmount.toLocaleString('en-IN')} ≤ ₹10,00,00,000 → Pass` : 'Enter amount above' },
            { label: 'Tenure entered', expr: tenureMonths > 0 ? `${tenureMonths} months` : 'Not entered' },
            { label: 'Tenure check', expr: tenureMonths > 360 ? `${tenureMonths} > 360 → HARD FAIL` : tenureMonths >= 12 ? `${tenureMonths} ≤ 360 → Pass` : tenureMonths > 0 ? `${tenureMonths} < 12 → Below minimum` : 'Enter tenure above', highlight: tenureMonths >= 12 && loanAmount > 0 && loanAmount <= POLICY.loanLimits.maxAmount },
          ]}
          result={
            loanAmount > 0 && tenureMonths >= 12
              ? loanAmount > POLICY.loanLimits.maxAmount || tenureMonths > 360
                ? { label: 'Status', value: 'Hard Fail — exceeds policy limits', status: 'fail' }
                : { label: 'Status', value: 'Pass — within policy limits', status: 'pass' }
              : { label: 'Status', value: 'Enter loan amount and tenure', status: 'info' }
          }
        />

        <FormulaPanel
          title="Amount Fit Scoring (15 pts) — requires Step 3 property value"
          formula={`Overage = Loan Amount − Max Loan by LTV

if Overage ≤ 0                         → Score = 15  (full)
if Overage / Max Loan ≤ 10%            → Score = 10  (partial)
if Overage / Max Loan  > 10%           → Score = 3   (low)`}
          variables={[
            { symbol: 'Overage', meaning: 'Requested amount minus LTV-allowed maximum' },
            { symbol: 'Max Loan', meaning: 'Property Value × LTV Band % (computed in Step 3)' },
          ]}
          steps={
            loanAmount > 0
              ? [
                  { label: 'Loan Amount', expr: `₹${loanAmount.toLocaleString('en-IN')}` },
                  { label: 'Max LTV Loan', expr: 'Computed in Step 3 (enter property value there)' },
                ]
              : [{ label: 'Note', expr: 'Enter loan amount to see score projection' }]
          }
          result={{ label: 'Note', value: 'Score calculated after Step 3 property entry', status: 'info' }}
        />
      </div>

      <WizardNavigation
        currentStep={0}
        totalSteps={11}
        onBack={() => {}}
        onNext={handleNext}
        onSaveDraft={saveDraft}
        onReset={resetWizard}
      />
    </>
  );
}
