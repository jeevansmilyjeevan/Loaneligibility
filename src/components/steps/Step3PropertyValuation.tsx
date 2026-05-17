import React, { useState } from 'react';
import { useWizard } from '../../context/WizardContext';
import { validateStep3 } from '../../engine/validation';
import { Card, SectionTitle } from '../ui/Card';
import { FormField, FormRow } from '../ui/FormField';
import { CurrencyInput } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { WizardNavigation } from '../layout/WizardNavigation';
import { STEP_LABELS } from '../../constants/options';
import {
  getEffectivePropertyValue,
  getMaxLoanByLTV,
  getLTVBand,
  calcLTVPercent,
} from '../../engine/calculations';
import { formatCurrency, parseNum } from '../../utils/formatters';
import { FormulaPanel } from '../ui/FormulaPanel';
import type { StepErrors } from '../../types';

export function Step3PropertyValuation() {
  const { state, updateStep3, goToStep, completeStep, saveDraft, resetWizard } = useWizard();
  const { step3, step1 } = state;
  const [errors, setErrors] = useState<StepErrors>({});

  const handleNext = () => {
    const errs = validateStep3(step3);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    completeStep(2);
    goToStep(3);
  };

  const mv = parseNum(step3.marketValue);
  const av = parseNum(step3.agreementValue);
  const contrib = parseNum(step3.ownContribution);
  const loanAmount = parseNum(step1.desiredLoanAmount);

  const effectivePV = mv > 0 ? getEffectivePropertyValue(mv, av, step3.useAgreementValueIfLower) : 0;
  const ltvBand = effectivePV > 0 ? getLTVBand(effectivePV) : null;
  const maxLoan = effectivePV > 0 ? getMaxLoanByLTV(effectivePV) : 0;
  const currentLTV = effectivePV > 0 && loanAmount > 0 ? calcLTVPercent(loanAmount, effectivePV) : 0;
  const requiredContrib = loanAmount > 0 && effectivePV > 0 ? effectivePV - maxLoan : 0;
  const ltvOK = ltvBand ? currentLTV <= ltvBand.maxLTV : true;

  return (
    <>
      <Card>
        <SectionTitle subtitle="Property details used to determine the LTV-based maximum funding.">
          {STEP_LABELS[2]}
        </SectionTitle>

        <div className="space-y-5">
          <FormRow cols={2}>
            <FormField label="Market / Assessed Value" htmlFor="marketValue" required>
              <CurrencyInput
                id="marketValue"
                value={step3.marketValue}
                onChange={(v) => updateStep3({ marketValue: v })}
                placeholder="e.g. 80,00,000"
                error={errors.marketValue}
                hint="As per bank valuation report"
              />
            </FormField>

            <FormField label="Agreement / Sale Value" htmlFor="agreementValue">
              <CurrencyInput
                id="agreementValue"
                value={step3.agreementValue}
                onChange={(v) => updateStep3({ agreementValue: v })}
                placeholder="e.g. 78,00,000"
                hint="As per registered sale agreement (if applicable)"
              />
            </FormField>
          </FormRow>

          <Checkbox
            label="Use lower of market value vs agreement value for LTV calculation"
            description="Standard bank practice — the lower value is used as the base for LTV."
            checked={step3.useAgreementValueIfLower}
            onChange={(e) => updateStep3({ useAgreementValueIfLower: e.target.checked })}
          />

          <FormField label="Own Contribution / Down Payment" htmlFor="ownContrib" required>
            <CurrencyInput
              id="ownContrib"
              value={step3.ownContribution}
              onChange={(v) => updateStep3({ ownContribution: v })}
              placeholder="e.g. 20,00,000"
              error={errors.ownContribution}
              hint="Amount you will pay from personal funds"
            />
          </FormField>

          {/* LTV summary */}
          {effectivePV > 0 && ltvBand && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">LTV Calculation</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <LTVRow label="Effective Property Value" value={formatCurrency(effectivePV)} />
                <LTVRow label="LTV Band (Policy)" value={`≤ ${(ltvBand.maxLTV * 100).toFixed(0)}%`} />
                <LTVRow label="Max Eligible Loan" value={formatCurrency(maxLoan, true)} />
                <LTVRow label="Requested Loan" value={loanAmount > 0 ? formatCurrency(loanAmount, true) : '—'} />
                <LTVRow
                  label="Requested LTV"
                  value={
                    currentLTV > 0 ? (
                      <span className="flex items-center gap-1">
                        {(currentLTV * 100).toFixed(1)}%
                        <Badge color={ltvOK ? 'green' : 'red'}>{ltvOK ? 'OK' : 'Over limit'}</Badge>
                      </span>
                    ) : '—'
                  }
                />
                <LTVRow
                  label="Min Down Payment Required"
                  value={requiredContrib > 0 ? formatCurrency(requiredContrib, true) : '—'}
                />
              </div>

              {!ltvOK && loanAmount > 0 && (
                <Alert type="warning">
                  Requested loan amount exceeds the LTV-allowed maximum of{' '}
                  <strong>{formatCurrency(maxLoan, true)}</strong>. Increase your down payment to at least{' '}
                  <strong>{formatCurrency(requiredContrib, true)}</strong>, or reduce the loan amount.
                </Alert>
              )}

              {contrib > 0 && contrib < requiredContrib && (
                <Alert type="warning">
                  Planned down payment ({formatCurrency(contrib, true)}) is less than the minimum required (
                  {formatCurrency(requiredContrib, true)}). Shortfall:{' '}
                  <strong>{formatCurrency(requiredContrib - contrib, true)}</strong>.
                </Alert>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Formula panels */}
      <div className="space-y-2">
        <FormulaPanel
          title="Effective Property Value (EPV)"
          formula={`EPV = min(Market Value, Agreement Value)   if "use lower" = ON
EPV = Market Value                          if "use lower" = OFF`}
          variables={[
            { symbol: 'EPV', meaning: 'Base value used for all LTV calculations' },
            { symbol: 'min()', meaning: 'Takes the smaller of the two values — conservative basis' },
          ]}
          steps={
            mv > 0
              ? [
                  { label: 'Market Value', expr: `₹${mv.toLocaleString('en-IN')}` },
                  { label: 'Agreement Value', expr: av > 0 ? `₹${av.toLocaleString('en-IN')}` : 'Not entered (ignored)' },
                  { label: '"Use lower" toggle', expr: step3.useAgreementValueIfLower ? 'ON' : 'OFF' },
                  { label: 'EPV', expr: step3.useAgreementValueIfLower && av > 0 ? `min(₹${mv.toLocaleString('en-IN')}, ₹${av.toLocaleString('en-IN')}) = ₹${effectivePV.toLocaleString('en-IN')}` : `₹${mv.toLocaleString('en-IN')}`, highlight: true },
                ]
              : [{ label: 'Note', expr: 'Enter market value above' }]
          }
          result={
            effectivePV > 0
              ? { label: 'EPV', value: `₹${effectivePV.toLocaleString('en-IN')}`, status: 'pass' }
              : { label: 'Note', value: 'Enter property value', status: 'info' }
          }
        />

        <FormulaPanel
          title="LTV Band Lookup → Max Loan → LTV% → LTV Fit Score (15 pts)"
          formula={`Step A: LTV Band
  EPV ≤ ₹30L  → Band = 90%
  EPV ≤ ₹75L  → Band = 80%
  EPV  > ₹75L → Band = 75%

Step B: Max Loan by LTV
  Max Loan = EPV × Band %

Step C: Actual LTV%
  LTV% = (Loan Amount ÷ EPV) × 100

Step D: LTV Fit Score
  LTV ≤ Band      → 15 pts (full)
  LTV ≤ Band + 5% → 8 pts
  LTV  > Band + 5% → 0 pts`}
          variables={[
            { symbol: 'EPV', meaning: 'Effective Property Value (from above)' },
            { symbol: 'Band', meaning: 'Max LTV percentage for this property value tier' },
            { symbol: 'LTV%', meaning: 'Actual loan-to-value ratio as a percentage' },
          ]}
          steps={
            effectivePV > 0 && ltvBand
              ? [
                  { label: 'EPV', expr: `₹${effectivePV.toLocaleString('en-IN')}` },
                  { label: 'Band lookup', expr: effectivePV <= 3000000 ? 'EPV ≤ ₹30L → Band = 90%' : effectivePV <= 7500000 ? 'EPV ≤ ₹75L → Band = 80%' : 'EPV > ₹75L → Band = 75%' },
                  { label: 'Max Loan', expr: `₹${effectivePV.toLocaleString('en-IN')} × ${(ltvBand.maxLTV * 100).toFixed(0)}% = ₹${maxLoan.toLocaleString('en-IN')}` },
                  ...(loanAmount > 0
                    ? [
                        { label: 'Loan Amount', expr: `₹${loanAmount.toLocaleString('en-IN')}` },
                        { label: 'LTV%', expr: `₹${loanAmount.toLocaleString('en-IN')} ÷ ₹${effectivePV.toLocaleString('en-IN')} × 100 = ${(currentLTV * 100).toFixed(1)}%` },
                        {
                          label: 'LTV Fit Score',
                          expr: currentLTV <= ltvBand.maxLTV
                            ? `${(currentLTV * 100).toFixed(1)}% ≤ ${(ltvBand.maxLTV * 100).toFixed(0)}% → 15/15`
                            : currentLTV <= ltvBand.maxLTV + 0.05
                            ? `${(currentLTV * 100).toFixed(1)}% within +5% grace → 8/15`
                            : `${(currentLTV * 100).toFixed(1)}% > ${(ltvBand.maxLTV * 100).toFixed(0)}% significantly → 0/15`,
                          highlight: currentLTV <= ltvBand.maxLTV,
                        },
                      ]
                    : [{ label: 'Note', expr: 'Enter loan amount in Step 1 for LTV%' }]),
                ]
              : [{ label: 'Note', expr: 'Enter property value above' }]
          }
          result={
            effectivePV > 0 && ltvBand && loanAmount > 0
              ? currentLTV <= ltvBand.maxLTV
                ? { label: 'LTV Fit', value: `${(currentLTV * 100).toFixed(1)}% ≤ ${(ltvBand.maxLTV * 100).toFixed(0)}% — 15 / 15`, status: 'pass' }
                : currentLTV <= ltvBand.maxLTV + 0.05
                ? { label: 'LTV Fit', value: `${(currentLTV * 100).toFixed(1)}% slightly above band — 8 / 15`, status: 'warning' }
                : { label: 'LTV Fit', value: `${(currentLTV * 100).toFixed(1)}% exceeds band — 0 / 15`, status: 'fail' }
              : { label: 'Note', value: effectivePV > 0 ? 'Enter loan amount in Step 1' : 'Enter property value above', status: 'info' }
          }
        />

        <FormulaPanel
          title="Down Payment — Minimum Required"
          formula={`Min Down Payment = EPV − Max Loan by LTV
Implied Loan     = EPV − Own Contribution
Shortfall        = Min Down Payment − Own Contribution  (if positive)`}
          steps={
            effectivePV > 0 && ltvBand
              ? [
                  { label: 'EPV', expr: `₹${effectivePV.toLocaleString('en-IN')}` },
                  { label: 'Max Loan (LTV)', expr: `₹${maxLoan.toLocaleString('en-IN')}` },
                  { label: 'Min Down Payment', expr: `₹${effectivePV.toLocaleString('en-IN')} − ₹${maxLoan.toLocaleString('en-IN')} = ₹${requiredContrib.toLocaleString('en-IN')}`, highlight: true },
                  ...(contrib > 0
                    ? [
                        { label: 'Your contribution', expr: `₹${contrib.toLocaleString('en-IN')}` },
                        {
                          label: 'Shortfall',
                          expr: contrib >= requiredContrib
                            ? `₹${contrib.toLocaleString('en-IN')} ≥ ₹${requiredContrib.toLocaleString('en-IN')} → No shortfall`
                            : `₹${requiredContrib.toLocaleString('en-IN')} − ₹${contrib.toLocaleString('en-IN')} = ₹${(requiredContrib - contrib).toLocaleString('en-IN')} shortfall`,
                        },
                      ]
                    : [{ label: 'Note', expr: 'Enter own contribution above' }]),
                ]
              : [{ label: 'Note', expr: 'Enter property value above' }]
          }
          result={
            effectivePV > 0 && ltvBand && contrib > 0
              ? contrib >= requiredContrib
                ? { label: 'Down Payment', value: `₹${contrib.toLocaleString('en-IN')} — sufficient (min ₹${requiredContrib.toLocaleString('en-IN')})`, status: 'pass' }
                : { label: 'Shortfall', value: `₹${(requiredContrib - contrib).toLocaleString('en-IN')} additional needed`, status: 'fail' }
              : { label: 'Note', value: effectivePV > 0 ? 'Enter own contribution' : 'Enter property value', status: 'info' }
          }
        />
      </div>

      <WizardNavigation
        currentStep={2}
        totalSteps={11}
        onBack={() => goToStep(1)}
        onNext={handleNext}
        onSaveDraft={saveDraft}
        onReset={resetWizard}
      />
    </>
  );
}

function LTVRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-semibold text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  );
}
