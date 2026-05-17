import React, { useState } from 'react';
import { useWizard } from '../../context/WizardContext';
import { validateStep4 } from '../../engine/validation';
import { Card, SectionTitle } from '../ui/Card';
import { FormField, FormRow } from '../ui/FormField';
import { Input, CurrencyInput, NumberInput } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { WizardNavigation } from '../layout/WizardNavigation';
import { DEFAULT_SEVERITIES, REPAYMENT_HISTORIES, LOAN_TYPES_FOR_EXISTING, STEP_LABELS } from '../../constants/options';
import { POLICY } from '../../config/policy';
import { parseNum } from '../../utils/formatters';
import type { StepErrors, ExistingLoan } from '../../types';
import { FormulaPanel } from '../ui/FormulaPanel';

function creditBand(score: number): { label: string; color: 'green' | 'blue' | 'amber' | 'red' | 'gray' } {
  if (score <= 0) return { label: 'Not entered', color: 'gray' };
  if (score >= POLICY.creditScore.strongThreshold) return { label: 'Strong (750+)', color: 'green' };
  if (score >= POLICY.creditScore.acceptableThreshold) return { label: 'Acceptable (700–749)', color: 'blue' };
  if (score >= POLICY.creditScore.reviewThreshold) return { label: 'Below average (650–699)', color: 'amber' };
  if (score >= POLICY.creditScore.hardFailThreshold) return { label: 'Low (550–649)', color: 'red' };
  return { label: 'Very low (<550)', color: 'red' };
}

export function Step4CreditProfile() {
  const { state, updateStep4, goToStep, completeStep, saveDraft, resetWizard } = useWizard();
  const { step4 } = state;
  const [errors, setErrors] = useState<StepErrors>({});

  const handleNext = () => {
    const errs = validateStep4(step4);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    completeStep(3);
    goToStep(4);
  };

  const score = parseNum(step4.creditScore);
  const band = creditBand(score);
  const totalEMI = step4.existingLoans.reduce((s, l) => s + l.monthlyEMI, 0);

  // Live credit fit score — mirrors eligibility.ts logic
  const isWilful = step4.defaultSeverity === 'wilful';
  const isMajor = step4.defaultSeverity === 'major';
  const isMinor = step4.defaultSeverity === 'minor';
  let liveBaseScore = 0;
  if (score >= POLICY.creditScore.strongThreshold) liveBaseScore = 20;
  else if (score >= POLICY.creditScore.acceptableThreshold) liveBaseScore = Math.round(20 * 0.75);
  else if (score >= POLICY.creditScore.reviewThreshold) liveBaseScore = Math.round(20 * 0.45);
  else if (score >= POLICY.creditScore.hardFailThreshold) liveBaseScore = Math.round(20 * 0.2);
  let afterRepayment = liveBaseScore;
  if (step4.repaymentHistory === 'poor' && afterRepayment > 0) afterRepayment = Math.round(afterRepayment * 0.7);
  else if (step4.repaymentHistory === 'fair' && afterRepayment > 0) afterRepayment = Math.round(afterRepayment * 0.85);
  const liveCreditFitScore = isWilful ? 0 : isMajor ? Math.round(20 * 0.1) : isMinor ? Math.round(afterRepayment * 0.85) : afterRepayment;

  const addLoan = () => {
    updateStep4({
      existingLoans: [
        ...step4.existingLoans,
        { id: Date.now().toString(), loanType: 'personal_loan', outstandingAmount: 0, monthlyEMI: 0 },
      ],
    });
  };

  const updateLoan = (id: string, patch: Partial<ExistingLoan>) => {
    updateStep4({
      existingLoans: step4.existingLoans.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  };

  const removeLoan = (id: string) => {
    updateStep4({ existingLoans: step4.existingLoans.filter((l) => l.id !== id) });
  };

  return (
    <>
      <Card>
        <SectionTitle subtitle="Your credit score and existing liabilities directly affect eligibility and pricing.">
          {STEP_LABELS[3]}
        </SectionTitle>

        <div className="space-y-6">
          {/* Credit Score */}
          <FormRow cols={2}>
            <FormField label="CIBIL / Credit Score" htmlFor="creditScore" required>
              <NumberInput
                id="creditScore"
                value={step4.creditScore}
                onChange={(v) => updateStep4({ creditScore: v })}
                min={300}
                max={900}
                placeholder="e.g. 750"
                error={errors.creditScore}
                hint="Check your latest bureau report (CIBIL, Experian, CRIF)"
              />
            </FormField>

            <FormField label="Repayment History (Self-declared)" htmlFor="repaymentHistory" required>
              <Select
                id="repaymentHistory"
                options={REPAYMENT_HISTORIES}
                value={step4.repaymentHistory}
                onChange={(e) => updateStep4({ repaymentHistory: e.target.value as typeof step4.repaymentHistory })}
                error={errors.repaymentHistory}
              />
            </FormField>
          </FormRow>

          {/* Score band indicator */}
          {score > 0 && (
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">Score assessment:</span>
              <Badge color={band.color}>{band.label}</Badge>
              {score >= POLICY.creditScore.strongThreshold && (
                <span className="text-xs text-green-600 dark:text-green-400">Qualifies for best pricing tier.</span>
              )}
              {score < POLICY.creditScore.reviewThreshold && score > 0 && (
                <span className="text-xs text-amber-600 dark:text-amber-400">Will require careful lender review.</span>
              )}
            </div>
          )}

          {/* Defaults */}
          <div className="space-y-3">
            <Checkbox
              label="I have defaults, delinquencies, or adverse credit events"
              description="Include settled accounts, write-offs, 90+ DPD, restructured loans, or legal proceedings."
              checked={step4.hasDefaults}
              onChange={(e) => updateStep4({ hasDefaults: e.target.checked })}
            />

            {step4.hasDefaults && (
              <div className="ml-7 space-y-3 border-l-2 border-amber-300 dark:border-amber-700 pl-4">
                <FormField label="Default Severity" htmlFor="defaultSeverity">
                  <Select
                    id="defaultSeverity"
                    options={DEFAULT_SEVERITIES}
                    value={step4.defaultSeverity}
                    onChange={(e) => updateStep4({ defaultSeverity: e.target.value as typeof step4.defaultSeverity })}
                  />
                </FormField>

                <FormField label="Brief Details" htmlFor="defaultDetails">
                  <textarea
                    id="defaultDetails"
                    value={step4.defaultDetails}
                    onChange={(e) => updateStep4({ defaultDetails: e.target.value })}
                    rows={2}
                    placeholder="e.g. One credit card payment delayed by 30 days in 2022, now resolved."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                  />
                  {errors.defaultDetails && (
                    <p role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.defaultDetails}</p>
                  )}
                </FormField>

                {step4.defaultSeverity === 'wilful' && (
                  <Alert type="error">
                    A wilful default is a disqualifying event under lender policy. This application cannot be processed automatically.
                  </Alert>
                )}
                {step4.defaultSeverity === 'major' && (
                  <Alert type="warning">
                    Major defaults (write-offs, settlements, 90+ DPD) significantly reduce eligibility probability. A detailed explanation will be required.
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Existing Loans */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Existing Loans / EMIs
              </h3>
              <Button variant="secondary" size="sm" onClick={addLoan}>
                + Add Loan
              </Button>
            </div>

            {step4.existingLoans.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                No existing loans. Click "Add Loan" if you have active EMIs.
              </p>
            )}

            {step4.existingLoans.map((loan) => (
              <div
                key={loan.id}
                className="rounded-lg border dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Existing Loan</span>
                  <Button variant="ghost" size="sm" onClick={() => removeLoan(loan.id)} className="text-red-500 hover:text-red-700">
                    Remove
                  </Button>
                </div>
                <FormRow cols={3}>
                  <FormField label="Loan Type">
                    <Select
                      options={LOAN_TYPES_FOR_EXISTING}
                      value={loan.loanType}
                      onChange={(e) => updateLoan(loan.id, { loanType: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Outstanding Amount">
                    <CurrencyInput
                      value={loan.outstandingAmount || ''}
                      onChange={(v) => updateLoan(loan.id, { outstandingAmount: parseNum(v) })}
                      placeholder="e.g. 3,00,000"
                    />
                  </FormField>
                  <FormField label="Monthly EMI">
                    <CurrencyInput
                      value={loan.monthlyEMI || ''}
                      onChange={(v) => updateLoan(loan.id, { monthlyEMI: parseNum(v) })}
                      placeholder="e.g. 8,000"
                    />
                  </FormField>
                </FormRow>
              </div>
            ))}

            {step4.existingLoans.length > 0 && (
              <div className="text-sm text-right text-gray-600 dark:text-gray-300 font-semibold">
                Total existing EMIs: ₹{totalEMI.toLocaleString('en-IN')} / month
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Formula panels */}
      <div className="space-y-2">
        <FormulaPanel
          title="Total Existing EMIs"
          formula={`Total Existing EMI = EMI₁ + EMI₂ + ... + EMIₙ

Carried into Step 5 as the existing-obligations component of FOIR.`}
          variables={[
            { symbol: 'EMIₙ', meaning: 'Monthly instalment of the nth active loan' },
          ]}
          steps={
            step4.existingLoans.length > 0
              ? [
                  ...step4.existingLoans.map((l, i) => ({
                    label: `Loan ${i + 1}`,
                    expr: `${l.loanType.replace(/_/g, ' ')} — ₹${l.monthlyEMI.toLocaleString('en-IN')} / mo`,
                  })),
                  { label: 'Total EMI', expr: `₹${totalEMI.toLocaleString('en-IN')} / month`, highlight: true },
                ]
              : [{ label: 'Note', expr: 'No loans entered — add loans above if you have active EMIs' }]
          }
          result={
            totalEMI > 0
              ? { label: 'Total Existing EMI', value: `₹${totalEMI.toLocaleString('en-IN')} / month`, status: 'info' }
              : { label: 'Note', value: 'No existing EMIs — FOIR will use only the new home loan EMI', status: 'info' }
          }
        />

        <FormulaPanel
          title="Credit Fit Score (20 pts)"
          formula={`Step 1 — Base score from credit score band:
  ≥ 750 (Strong)      → 20 pts  (full score)
  ≥ 700 (Acceptable)  → 15 pts  (× 0.75)
  ≥ 650 (Review)      →  9 pts  (× 0.45)
  ≥ 550 (Low)         →  4 pts  (× 0.20)
  < 550               →  0 pts

Step 2 — Default severity override (checked first):
  Wilful → 0 pts  (HARD FAIL — overrides everything)
  Major  → 2 pts  (× 0.10, bypasses Steps 1 & 3)

Step 3 — Repayment history modifier (applied to Step 1):
  Poor        → × 0.70
  Fair        → × 0.85
  Good / Exc. → × 1.00

Step 4 — Minor default modifier (applied after Step 3):
  Minor default declared → × 0.85

Final = Step 1 × Step 3 × Step 4   (or override value from Step 2)`}
          variables={[
            { symbol: 'Base', meaning: 'Points from credit score band (Step 1)' },
            { symbol: '×mod', meaning: 'Multiplicative modifiers reduce the base score' },
          ]}
          steps={
            score > 0 || isWilful || isMajor
              ? [
                  ...(score > 0 ? [{ label: 'Credit score', expr: `${score}` }] : []),
                  {
                    label: 'Base score',
                    expr: isWilful
                      ? 'Wilful default → HARD FAIL → 0 pts'
                      : isMajor
                      ? 'Major default → override → 2 pts'
                      : score >= POLICY.creditScore.strongThreshold
                      ? `${score} ≥ 750 → 20 pts (Strong)`
                      : score >= POLICY.creditScore.acceptableThreshold
                      ? `${score} ≥ 700 → 15 pts (× 0.75)`
                      : score >= POLICY.creditScore.reviewThreshold
                      ? `${score} ≥ 650 → 9 pts (× 0.45)`
                      : score >= POLICY.creditScore.hardFailThreshold
                      ? `${score} ≥ 550 → 4 pts (× 0.20)`
                      : `${score} < 550 → 0 pts`,
                  },
                  ...(!isWilful && !isMajor && liveBaseScore > 0
                    ? [
                        {
                          label: 'Repayment mod.',
                          expr: step4.repaymentHistory === 'poor'
                            ? `Poor → × 0.70 → ${liveBaseScore} × 0.70 = ${afterRepayment} pts`
                            : step4.repaymentHistory === 'fair'
                            ? `Fair → × 0.85 → ${liveBaseScore} × 0.85 = ${afterRepayment} pts`
                            : `${step4.repaymentHistory || '—'} → × 1.00 (no reduction)`,
                        },
                        ...(isMinor
                          ? [{ label: 'Minor default', expr: `Minor → × 0.85 → ${afterRepayment} × 0.85 = ${liveCreditFitScore} pts` }]
                          : []),
                        { label: 'Credit Fit Score', expr: `${liveCreditFitScore} / 20`, highlight: liveCreditFitScore >= 16 },
                      ]
                    : isWilful || isMajor
                    ? [{ label: 'Credit Fit Score', expr: `${liveCreditFitScore} / 20${isWilful ? ' — HARD FAIL' : ''}`, highlight: false }]
                    : []),
                ]
              : [{ label: 'Note', expr: 'Enter your credit score above to see score projection' }]
          }
          result={
            score > 0 || isWilful
              ? isWilful
                ? { label: 'Credit Fit', value: '0 / 20 — Hard Fail (wilful default)', status: 'fail' }
                : isMajor
                ? { label: 'Credit Fit', value: `${liveCreditFitScore} / 20 — major default on record`, status: 'fail' }
                : liveCreditFitScore >= 16
                ? { label: 'Credit Fit', value: `${liveCreditFitScore} / 20 — Strong`, status: 'pass' }
                : liveCreditFitScore >= 8
                ? { label: 'Credit Fit', value: `${liveCreditFitScore} / 20`, status: 'warning' }
                : { label: 'Credit Fit', value: `${liveCreditFitScore} / 20 — Low`, status: 'fail' }
              : { label: 'Note', value: 'Enter credit score to see score projection', status: 'info' }
          }
        />
      </div>

      <WizardNavigation
        currentStep={3}
        totalSteps={11}
        onBack={() => goToStep(2)}
        onNext={handleNext}
        onSaveDraft={saveDraft}
        onReset={resetWizard}
      />
    </>
  );
}
