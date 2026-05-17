import React, { useState } from 'react';
import { useWizard } from '../../context/WizardContext';
import { validateStep7 } from '../../engine/validation';
import { Card, SectionTitle } from '../ui/Card';
import { FormField, FormRow } from '../ui/FormField';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { WizardNavigation } from '../layout/WizardNavigation';
import { RATE_TYPES, PRODUCT_VARIANTS, STEP_LABELS } from '../../constants/options';
import { POLICY } from '../../config/policy';
import { parseNum } from '../../utils/formatters';
import { calculateEMI } from '../../engine/calculations';
import { FormulaPanel } from '../ui/FormulaPanel';
import type { StepErrors } from '../../types';

export function Step7ProductVariant() {
  const { state, updateStep7, goToStep, completeStep, saveDraft, resetWizard } = useWizard();
  const { step7, step4, step1 } = state;
  const [errors, setErrors] = useState<StepErrors>({});

  const handleNext = () => {
    const errs = validateStep7(step7);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    completeStep(6);
    goToStep(7);
  };

  const score = parseNum(step4.creditScore);
  const isFloating = step7.rateType === 'floating';

  const loanAmount7 = parseNum(step1.desiredLoanAmount);
  const tenure7 = parseNum(step1.requestedTenureMonths);

  // Indicative rate adjustment for credit score
  let floatMin = POLICY.interestRates.floating.min;
  let floatMax = POLICY.interestRates.floating.max;
  if (score >= POLICY.creditScore.strongThreshold) {
    floatMax = floatMin + 0.5;
  } else if (score > 0 && score < POLICY.creditScore.acceptableThreshold) {
    floatMin = floatMin + 0.5;
  }

  const emiAtFloatMin = loanAmount7 > 0 && tenure7 > 0 ? calculateEMI(loanAmount7, floatMin, tenure7) : 0;
  const emiAtFloatMax = loanAmount7 > 0 && tenure7 > 0 ? calculateEMI(loanAmount7, floatMax, tenure7) : 0;
  const emiAtFixed = loanAmount7 > 0 && tenure7 > 0 ? calculateEMI(loanAmount7, POLICY.interestRates.fixed.rate, tenure7) : 0;

  return (
    <>
      <Card>
        <SectionTitle subtitle="Choose your interest rate preference and product variant. Rates shown are indicative only.">
          {STEP_LABELS[6]}
        </SectionTitle>

        <div className="space-y-6">
          <FormRow cols={2}>
            <FormField label="Rate Type Preference" htmlFor="rateType" required>
              <Select
                id="rateType"
                options={RATE_TYPES}
                value={step7.rateType}
                onChange={(e) => updateStep7({ rateType: e.target.value as typeof step7.rateType })}
                error={errors.rateType}
              />
            </FormField>

            <FormField label="Product Variant" htmlFor="productVariant">
              <Select
                id="productVariant"
                options={PRODUCT_VARIANTS}
                value={step7.productVariant}
                onChange={(e) => updateStep7({ productVariant: e.target.value })}
                hint="Optional — helps narrow the product"
              />
            </FormField>
          </FormRow>

          {/* Rate indicator */}
          {step7.rateType && (
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Indicative Interest Rate</h3>
              {isFloating ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                      {floatMin.toFixed(2)}% – {floatMax.toFixed(2)}% p.a.
                    </span>
                    <Badge color="indigo">Floating</Badge>
                  </div>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400">
                    Linked to the lender's benchmark rate (e.g. RLLR/MCLR). Changes periodically.
                  </p>
                  {score >= POLICY.creditScore.strongThreshold && (
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                      Your credit score qualifies you for the lower end of the rate range.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                      ~{POLICY.interestRates.fixed.rate.toFixed(2)}% p.a.
                    </span>
                    <Badge color="amber">Fixed</Badge>
                  </div>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400">
                    Fixed for a defined period. Typically higher than floating. Rate not subject to benchmark changes during fixed term.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Rate influencing factors */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Factors that influence your rate
            </h4>
            <ul className="space-y-1.5">
              {[
                { factor: 'Credit Score', impact: score >= POLICY.creditScore.strongThreshold ? 'Positive — qualifies for lower rate' : score >= POLICY.creditScore.acceptableThreshold ? 'Neutral' : 'Negative — may attract higher rate' },
                { factor: 'Income Profile', impact: 'Stronger income documentation → better pricing' },
                { factor: 'Loan-to-Value', impact: 'Lower LTV → lower risk → better rate' },
                { factor: 'Loan Amount', impact: 'Larger loans may attract specific pricing tiers' },
                { factor: 'Property Quality', impact: 'Ready vs. under-construction; RERA approval status' },
                { factor: 'Employment Type', impact: 'Salaried with stable employment often gets base rates' },
              ].map(({ factor, impact }) => (
                <li key={factor} className="flex gap-3 text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300 w-36 shrink-0">{factor}</span>
                  <span className="text-gray-500 dark:text-gray-400">{impact}</span>
                </li>
              ))}
            </ul>
          </div>

          <Alert type="info">
            All rates shown are indicative and risk-based. Final rate is determined by the lender after credit assessment, property valuation, and risk categorisation. This tool does not guarantee any specific rate.
          </Alert>
        </div>
      </Card>

      {/* Formula panels */}
      <div className="space-y-2">
        <FormulaPanel
          title="Indicative Rate — How Your Credit Score Adjusts the Band"
          formula={`Base floating range: ${POLICY.interestRates.floating.min.toFixed(2)}% – ${POLICY.interestRates.floating.max.toFixed(2)}% p.a.

Score ≥ ${POLICY.creditScore.strongThreshold} (Strong)
  → Max capped: ${POLICY.interestRates.floating.min.toFixed(2)}% + 0.50% = ${(POLICY.interestRates.floating.min + 0.5).toFixed(2)}%
  → Range narrows to: ${POLICY.interestRates.floating.min.toFixed(2)}% – ${(POLICY.interestRates.floating.min + 0.5).toFixed(2)}%

Score < ${POLICY.creditScore.acceptableThreshold} (Below acceptable)
  → Min raised: ${POLICY.interestRates.floating.min.toFixed(2)}% + 0.50% = ${(POLICY.interestRates.floating.min + 0.5).toFixed(2)}%
  → Range shifts to: ${(POLICY.interestRates.floating.min + 0.5).toFixed(2)}% – ${POLICY.interestRates.floating.max.toFixed(2)}%

Fixed rate: ~${POLICY.interestRates.fixed.rate.toFixed(2)}% p.a. (not score-adjusted)`}
          variables={[
            { symbol: '±0.50%', meaning: 'Credit score premium / discount applied to range bounds' },
            { symbol: 'Fixed', meaning: `${POLICY.interestRates.fixed.rate}% p.a. — fixed for agreed term, score-independent` },
          ]}
          steps={
            step7.rateType
              ? [
                  ...(score > 0 ? [{ label: 'Credit score', expr: `${score}` }] : []),
                  {
                    label: 'Adjustment',
                    expr: score >= POLICY.creditScore.strongThreshold
                      ? `${score} ≥ ${POLICY.creditScore.strongThreshold} → Strong — max capped at ${(POLICY.interestRates.floating.min + 0.5).toFixed(2)}%`
                      : score > 0 && score < POLICY.creditScore.acceptableThreshold
                      ? `${score} < ${POLICY.creditScore.acceptableThreshold} → Below avg — min raised to ${(POLICY.interestRates.floating.min + 0.5).toFixed(2)}%`
                      : score > 0
                      ? `${score} in standard band — full range applies`
                      : 'No credit score entered — default range used',
                  },
                  {
                    label: isFloating ? 'Floating range' : 'Fixed rate',
                    expr: isFloating
                      ? `${floatMin.toFixed(2)}% – ${floatMax.toFixed(2)}% p.a. (indicative)`
                      : `~${POLICY.interestRates.fixed.rate.toFixed(2)}% p.a. (score-independent)`,
                    highlight: true,
                  },
                ]
              : [{ label: 'Note', expr: 'Select a rate type above' }]
          }
          result={
            step7.rateType
              ? isFloating
                ? {
                    label: 'Rate Range',
                    value: `${floatMin.toFixed(2)}% – ${floatMax.toFixed(2)}% p.a. (floating, indicative)`,
                    status: score >= POLICY.creditScore.strongThreshold ? 'pass' : score > 0 && score < POLICY.creditScore.acceptableThreshold ? 'warning' : 'info',
                  }
                : { label: 'Fixed Rate', value: `~${POLICY.interestRates.fixed.rate.toFixed(2)}% p.a. (indicative)`, status: 'info' }
              : { label: 'Note', value: 'Select rate type above', status: 'info' }
          }
        />

        <FormulaPanel
          title="EMI Comparison at Indicative Rates"
          formula={`EMI = P × r × (1+r)^n ÷ ((1+r)^n − 1)

P = Loan amount,  r = rate ÷ 1200,  n = tenure months

Floating low  (${floatMin.toFixed(2)}%)  vs  Floating high  (${floatMax.toFixed(2)}%)  vs  Fixed  (${POLICY.interestRates.fixed.rate.toFixed(2)}%)`}
          variables={[
            { symbol: 'Floating', meaning: `Range ${floatMin.toFixed(2)}%–${floatMax.toFixed(2)}% — benchmark-linked, can change` },
            { symbol: 'Fixed', meaning: `${POLICY.interestRates.fixed.rate}% — locked for agreed period, predictable` },
          ]}
          steps={
            loanAmount7 > 0 && tenure7 > 0
              ? [
                  { label: 'Loan amount', expr: `₹${loanAmount7.toLocaleString('en-IN')}` },
                  { label: 'Tenure', expr: `${tenure7} months` },
                  { label: `EMI @ ${floatMin.toFixed(2)}% (float low)`, expr: `₹${Math.round(emiAtFloatMin).toLocaleString('en-IN')} / month` },
                  { label: `EMI @ ${floatMax.toFixed(2)}% (float high)`, expr: `₹${Math.round(emiAtFloatMax).toLocaleString('en-IN')} / month` },
                  { label: `EMI @ ${POLICY.interestRates.fixed.rate.toFixed(2)}% (fixed)`, expr: `₹${Math.round(emiAtFixed).toLocaleString('en-IN')} / month` },
                  {
                    label: 'Fixed vs float low',
                    expr: `₹${Math.round(emiAtFixed - emiAtFloatMin).toLocaleString('en-IN')} / month extra on fixed rate`,
                    highlight: false,
                  },
                ]
              : [{ label: 'Note', expr: 'Enter loan amount and tenure in Step 1 to compare EMIs' }]
          }
          result={
            loanAmount7 > 0 && tenure7 > 0
              ? isFloating
                ? {
                    label: 'Floating EMI range',
                    value: `₹${Math.round(emiAtFloatMin).toLocaleString('en-IN')} – ₹${Math.round(emiAtFloatMax).toLocaleString('en-IN')} / month`,
                    status: 'info',
                  }
                : {
                    label: 'Fixed EMI',
                    value: `₹${Math.round(emiAtFixed).toLocaleString('en-IN')} / month (₹${Math.round(emiAtFixed - emiAtFloatMin).toLocaleString('en-IN')} more than floating low)`,
                    status: 'info',
                  }
              : { label: 'Note', value: 'Enter loan amount and tenure (Step 1) to compare', status: 'info' }
          }
        />
      </div>

      <WizardNavigation
        currentStep={6}
        totalSteps={11}
        onBack={() => goToStep(5)}
        onNext={handleNext}
        onSaveDraft={saveDraft}
        onReset={resetWizard}
      />
    </>
  );
}
