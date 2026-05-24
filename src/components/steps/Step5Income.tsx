import React, { useState } from 'react';
import { useWizard } from '../../context/WizardContext';
import { validateStep5 } from '../../engine/validation';
import { Card, SectionTitle } from '../ui/Card';
import { FormField, FormRow } from '../ui/FormField';
import { CurrencyInput, NumberInput } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { WizardNavigation } from '../layout/WizardNavigation';
import { STEP_LABELS } from '../../constants/options';
import { POLICY } from '../../config/policy';
import { calcFOIR, calculateEMI, calcMaxLoanByRepaymentCapacity } from '../../engine/calculations';
import { FormulaPanel } from '../ui/FormulaPanel';
import { formatCurrency, parseNum } from '../../utils/formatters';
import type { StepErrors } from '../../types';

function foirBadge(foir: number, empType: string): { color: 'green' | 'blue' | 'amber' | 'red'; label: string } {
  const cfg = empType === 'salaried' ? POLICY.foir.salaried : POLICY.foir.self_employed;
  if (foir <= cfg.ideal) return { color: 'green', label: `Good (≤${(cfg.ideal * 100).toFixed(0)}%)` };
  if (foir <= cfg.acceptable) return { color: 'blue', label: `Acceptable (≤${(cfg.acceptable * 100).toFixed(0)}%)` };
  if (foir <= cfg.max) return { color: 'amber', label: `Elevated (≤${(cfg.max * 100).toFixed(0)}%)` };
  return { color: 'red', label: `Too high (>${(cfg.max * 100).toFixed(0)}%)` };
}

export function Step5Income() {
  const { state, updateStep5, goToStep, completeStep, saveDraft, resetWizard } = useWizard();
  const { step5, step4, step1, step2, step6 } = state;
  const [errors, setErrors] = useState<StepErrors>({});

  const isSalaried = step2.employmentType === 'salaried';

  const handleNext = () => {
    const errs = validateStep5(step5);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    completeStep(4);
    goToStep(5);
  };

  const netIncome = parseNum(step5.monthlyNetIncome);
  const otherIncome = parseNum(step5.otherMonthlyIncome);
  const coIncome = parseNum(step6.coApplicantIncome);
  const totalIncome = netIncome + otherIncome + coIncome;
  const existingEMIs = step4.existingLoans.reduce((s, l) => s + l.monthlyEMI, 0);
  const estimateRate = POLICY.interestRates.defaultEstimateRate;
  const tenure = parseNum(step1.requestedTenureMonths);
  const loanAmount = parseNum(step1.desiredLoanAmount);
  const newEMI = loanAmount > 0 && tenure > 0 ? calculateEMI(loanAmount, estimateRate, tenure) : 0;
  const totalEMI = existingEMIs + newEMI;
  const foir = totalIncome > 0 ? calcFOIR(totalEMI, totalIncome) : 0;
  const foirInfo = foir > 0 ? foirBadge(foir, step2.employmentType || 'salaried') : null;
  const foirConfig = isSalaried ? POLICY.foir.salaried : POLICY.foir.self_employed;
  const maxAllowedEMI = totalIncome > 0 ? Math.max(0, totalIncome * foirConfig.max - existingEMIs) : 0;
  const maxLoanByCapacity = tenure > 0 && totalIncome > 0
    ? calcMaxLoanByRepaymentCapacity(totalIncome, existingEMIs, step2.employmentType || 'salaried', estimateRate, tenure)
    : 0;
  const rMonthly = estimateRate / 12 / 100;

  return (
    <>
      <Card>
        <SectionTitle subtitle="Income assessment determines your repayment capacity (FOIR).">
          {STEP_LABELS[4]}
        </SectionTitle>

        <div className="space-y-6">
          {/* Income fields */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Monthly Income</h3>
            <FormRow cols={2}>
              <FormField label="Net Monthly Income (take-home)" htmlFor="netIncome" required>
                <CurrencyInput
                  id="netIncome"
                  value={step5.monthlyNetIncome}
                  onChange={(v) => updateStep5({ monthlyNetIncome: v })}
                  placeholder="e.g. 1,20,000"
                  error={errors.monthlyNetIncome}
                  hint={isSalaried ? 'After tax and PF deductions' : 'Average monthly profit / drawings'}
                />
              </FormField>

              <FormField label="Other Monthly Income" htmlFor="otherIncome">
                <CurrencyInput
                  id="otherIncome"
                  value={step5.otherMonthlyIncome}
                  onChange={(v) => updateStep5({ otherMonthlyIncome: v })}
                  placeholder="e.g. 15,000"
                  hint="Rental, freelance, dividends (verifiable sources only)"
                />
              </FormField>
            </FormRow>
          </div>

          {/* Employment stability */}
          <FormField label="Employment / Business Stability (years)" htmlFor="stability">
            <NumberInput
              id="stability"
              value={step5.employmentStabilityYears}
              onChange={(v) => updateStep5({ employmentStabilityYears: v })}
              min={0}
              max={50}
              placeholder="e.g. 5"
              error={errors.employmentStabilityYears}
              hint="Years with current employer / years in current business"
            />
          </FormField>

          {/* FOIR live calculator */}
          {totalIncome > 0 && (
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">FOIR Calculator (Live Preview)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <FOIRStat label="Total Income" value={formatCurrency(totalIncome)} />
                <FOIRStat label="Existing EMIs" value={formatCurrency(existingEMIs)} />
                <FOIRStat label="New EMI (est.)" value={newEMI > 0 ? formatCurrency(Math.round(newEMI)) : '—'} />
                <FOIRStat label="FOIR" value={
                  foir > 0 ? (
                    <span className="flex items-center gap-1 flex-wrap">
                      {(foir * 100).toFixed(1)}%
                      {foirInfo && <Badge color={foirInfo.color}>{foirInfo.label}</Badge>}
                    </span>
                  ) : '—'
                } />
              </div>
              {foir > (step2.employmentType === 'salaried' ? POLICY.foir.salaried.max : POLICY.foir.self_employed.max) && (
                <Alert type="warning">
                  FOIR exceeds the maximum threshold. Consider reducing the loan amount, extending tenure, or settling existing liabilities before applying.
                </Alert>
              )}
            </div>
          )}

        </div>
      </Card>

      {/* Formula panels */}
      <div className="space-y-2">
        <FormulaPanel
          title="New EMI — Estimated at Default Rate"
          formula={`EMI = P × r × (1+r)^n
      ─────────────────
        (1+r)^n − 1

P = Loan amount (from Step 1)
r = Annual rate ÷ 12 ÷ 100  (monthly rate)
n = Tenure in months (from Step 1)
Rate used for estimate: ${estimateRate}% p.a. (final rate set in Step 7)`}
          variables={[
            { symbol: 'P', meaning: 'Principal (loan amount from Step 1)' },
            { symbol: 'r', meaning: `Monthly rate = ${estimateRate} ÷ 12 ÷ 100 = ${rMonthly.toFixed(6)}` },
            { symbol: 'n', meaning: 'Tenure in months (from Step 1)' },
          ]}
          steps={
            loanAmount > 0 && tenure > 0
              ? [
                  { label: 'Loan amount (P)', expr: `₹${loanAmount.toLocaleString('en-IN')}` },
                  { label: 'Annual rate', expr: `${estimateRate}% p.a. (estimate)` },
                  { label: 'Monthly rate (r)', expr: `${estimateRate} ÷ 12 ÷ 100 = ${rMonthly.toFixed(6)}` },
                  { label: 'Tenure (n)', expr: `${tenure} months` },
                  { label: 'New EMI', expr: `₹${Math.round(newEMI).toLocaleString('en-IN')} / month`, highlight: true },
                ]
              : [{ label: 'Note', expr: 'Enter loan amount and tenure in Step 1' }]
          }
          result={
            newEMI > 0
              ? { label: 'Estimated EMI', value: `₹${Math.round(newEMI).toLocaleString('en-IN')} / month @ ${estimateRate}%`, status: 'info' }
              : { label: 'Note', value: 'Enter loan amount and tenure (Step 1) to compute EMI', status: 'info' }
          }
        />

        <FormulaPanel
          title="FOIR Calculation & Income Fit Score (15 pts)"
          formula={`FOIR = (Existing EMIs + New EMI) ÷ Total Monthly Income

Total Income = Net Income + Other Income + Co-Applicant Income

Scoring thresholds (${isSalaried ? 'Salaried' : 'Self-Employed'}):
  FOIR ≤ ${(foirConfig.ideal * 100).toFixed(0)}%   → 15 pts  (ideal)
  FOIR ≤ ${(foirConfig.acceptable * 100).toFixed(0)}%   → 12 pts  (acceptable × 0.80)
  FOIR ≤ ${(foirConfig.max * 100).toFixed(0)}%   →  8 pts  (elevated × 0.55)
  FOIR  > ${(foirConfig.max * 100).toFixed(0)}%   →  2 pts  (exceeds max × 0.15)`}
          variables={[
            { symbol: 'FOIR', meaning: 'Fixed Obligation to Income Ratio — share of income committed to EMIs' },
            { symbol: 'Total EMI', meaning: 'Sum of all existing EMIs + estimated new home loan EMI' },
          ]}
          steps={
            totalIncome > 0
              ? [
                  { label: 'Net income', expr: `₹${netIncome.toLocaleString('en-IN')}` },
                  ...(otherIncome > 0 ? [{ label: 'Other income', expr: `+ ₹${otherIncome.toLocaleString('en-IN')}` }] : []),
                  ...(coIncome > 0 ? [{ label: 'Co-applicant', expr: `+ ₹${coIncome.toLocaleString('en-IN')}` }] : []),
                  { label: 'Total income', expr: `₹${totalIncome.toLocaleString('en-IN')} / month` },
                  { label: 'Existing EMIs', expr: `₹${existingEMIs.toLocaleString('en-IN')} / month` },
                  { label: 'New EMI (est.)', expr: newEMI > 0 ? `₹${Math.round(newEMI).toLocaleString('en-IN')} / month` : 'Enter Step 1 values' },
                  ...(newEMI > 0
                    ? [
                        { label: 'Total EMI', expr: `₹${existingEMIs.toLocaleString('en-IN')} + ₹${Math.round(newEMI).toLocaleString('en-IN')} = ₹${Math.round(totalEMI).toLocaleString('en-IN')}` },
                        { label: 'FOIR', expr: `₹${Math.round(totalEMI).toLocaleString('en-IN')} ÷ ₹${totalIncome.toLocaleString('en-IN')} = ${(foir * 100).toFixed(1)}%` },
                        {
                          label: 'Income Fit Score',
                          expr: foir <= foirConfig.ideal
                            ? `${(foir * 100).toFixed(1)}% ≤ ${(foirConfig.ideal * 100).toFixed(0)}% → 15/15 (ideal)`
                            : foir <= foirConfig.acceptable
                            ? `${(foir * 100).toFixed(1)}% ≤ ${(foirConfig.acceptable * 100).toFixed(0)}% → 12/15 (acceptable)`
                            : foir <= foirConfig.max
                            ? `${(foir * 100).toFixed(1)}% ≤ ${(foirConfig.max * 100).toFixed(0)}% → 8/15 (elevated)`
                            : `${(foir * 100).toFixed(1)}% > ${(foirConfig.max * 100).toFixed(0)}% → 2/15 (exceeds max)`,
                          highlight: foir <= foirConfig.ideal,
                        },
                      ]
                    : []),
                ]
              : [{ label: 'Note', expr: 'Enter income above to see FOIR calculation' }]
          }
          result={
            totalIncome > 0 && newEMI > 0
              ? foir <= foirConfig.ideal
                ? { label: 'Income Fit', value: `FOIR ${(foir * 100).toFixed(1)}% — ideal ≤ ${(foirConfig.ideal * 100).toFixed(0)}% → 15/15`, status: 'pass' }
                : foir <= foirConfig.acceptable
                ? { label: 'Income Fit', value: `FOIR ${(foir * 100).toFixed(1)}% — acceptable → 12/15`, status: 'warning' }
                : foir <= foirConfig.max
                ? { label: 'Income Fit', value: `FOIR ${(foir * 100).toFixed(1)}% — elevated → 8/15`, status: 'warning' }
                : { label: 'Income Fit', value: `FOIR ${(foir * 100).toFixed(1)}% — exceeds max → 2/15`, status: 'fail' }
              : { label: 'Note', value: totalIncome > 0 ? 'Enter Step 1 values for full FOIR' : 'Enter income to calculate FOIR', status: 'info' }
          }
        />

        <FormulaPanel
          title="Max Affordable Loan — Reverse EMI"
          formula={`Step 1: Max Allowed EMI
  Max Allowed EMI = Total Income × FOIR_max − Existing EMIs
  FOIR_max = ${(foirConfig.max * 100).toFixed(0)}% (${isSalaried ? 'salaried' : 'self-employed'})

Step 2: Reverse-engineer max principal
  Max Loan = Max Allowed EMI × ((1+r)^n − 1) ÷ (r × (1+r)^n)

This is the maximum loan the income can support at the current tenure.
Compare with requested loan amount to see the gap.`}
          variables={[
            { symbol: 'FOIR_max', meaning: `Policy maximum FOIR for ${isSalaried ? 'salaried' : 'self-employed'}: ${(foirConfig.max * 100).toFixed(0)}%` },
            { symbol: 'r', meaning: `Monthly rate = ${estimateRate}% ÷ 1200 = ${rMonthly.toFixed(6)}` },
            { symbol: 'n', meaning: 'Tenure in months' },
          ]}
          steps={
            totalIncome > 0 && tenure > 0
              ? [
                  { label: 'Total income', expr: `₹${totalIncome.toLocaleString('en-IN')} / month` },
                  { label: 'FOIR max', expr: `${(foirConfig.max * 100).toFixed(0)}%` },
                  { label: 'Existing EMIs', expr: `₹${existingEMIs.toLocaleString('en-IN')} / month` },
                  { label: 'Max Allowed EMI', expr: `₹${totalIncome.toLocaleString('en-IN')} × ${(foirConfig.max * 100).toFixed(0)}% − ₹${existingEMIs.toLocaleString('en-IN')} = ₹${Math.round(maxAllowedEMI).toLocaleString('en-IN')}` },
                  { label: 'Tenure (n)', expr: `${tenure} months` },
                  {
                    label: 'Max Loan',
                    expr: maxLoanByCapacity > 0 ? `₹${Math.round(maxLoanByCapacity).toLocaleString('en-IN')}` : 'Insufficient income for any loan',
                    highlight: maxLoanByCapacity > 0 && (loanAmount === 0 || maxLoanByCapacity >= loanAmount),
                  },
                  ...(loanAmount > 0 && maxLoanByCapacity > 0
                    ? [{
                        label: 'vs Requested',
                        expr: maxLoanByCapacity >= loanAmount
                          ? `₹${Math.round(maxLoanByCapacity).toLocaleString('en-IN')} ≥ ₹${loanAmount.toLocaleString('en-IN')} → income sufficient`
                          : `₹${Math.round(maxLoanByCapacity).toLocaleString('en-IN')} < ₹${loanAmount.toLocaleString('en-IN')} → gap of ₹${(loanAmount - Math.round(maxLoanByCapacity)).toLocaleString('en-IN')}`,
                      }]
                    : []),
                ]
              : [{ label: 'Note', expr: 'Enter income above and tenure in Step 1' }]
          }
          result={
            totalIncome > 0 && tenure > 0 && maxLoanByCapacity > 0
              ? loanAmount > 0
                ? maxLoanByCapacity >= loanAmount
                  ? { label: 'Capacity', value: `Max ₹${Math.round(maxLoanByCapacity).toLocaleString('en-IN')} — covers requested ₹${loanAmount.toLocaleString('en-IN')}`, status: 'pass' }
                  : { label: 'Capacity', value: `Max ₹${Math.round(maxLoanByCapacity).toLocaleString('en-IN')} — ₹${(loanAmount - Math.round(maxLoanByCapacity)).toLocaleString('en-IN')} short of request`, status: 'fail' }
                : { label: 'Max Loan', value: `₹${Math.round(maxLoanByCapacity).toLocaleString('en-IN')} at ${(foirConfig.max * 100).toFixed(0)}% FOIR`, status: 'info' }
              : { label: 'Note', value: 'Enter income and tenure to compute maximum affordable loan', status: 'info' }
          }
        />
      </div>

      <WizardNavigation
        currentStep={4}
        totalSteps={11}
        onBack={() => goToStep(3)}
        onNext={handleNext}
        onSaveDraft={saveDraft}
        onReset={resetWizard}
      />
    </>
  );
}

function FOIRStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-blue-700 dark:text-blue-300">{label}</p>
      <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">{value}</p>
    </div>
  );
}
