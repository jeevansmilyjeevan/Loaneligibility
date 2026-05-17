import React, { useState } from 'react';
import { useWizard } from '../../context/WizardContext';
import { validateStep6 } from '../../engine/validation';
import { Card, SectionTitle } from '../ui/Card';
import { FormField, FormRow } from '../ui/FormField';
import { NumberInput, CurrencyInput } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Alert } from '../ui/Alert';
import { WizardNavigation } from '../layout/WizardNavigation';
import { CO_APPLICANT_RELATIONSHIPS, STEP_LABELS } from '../../constants/options';
import { POLICY } from '../../config/policy';
import { parseNum } from '../../utils/formatters';
import { calcFOIR, calculateEMI } from '../../engine/calculations';
import { FormulaPanel } from '../ui/FormulaPanel';
import type { StepErrors } from '../../types';

export function Step6CoApplicant() {
  const { state, updateStep6, goToStep, completeStep, saveDraft, resetWizard } = useWizard();
  const { step1, step4, step5, step6 } = state;
  const [errors, setErrors] = useState<StepErrors>({});

  const handleNext = () => {
    const errs = validateStep6(step6);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    completeStep(5);
    goToStep(6);
  };

  // Derived values for formula panels
  const netIncome = parseNum(step5.monthlyNetIncome);
  const otherIncome = parseNum(step5.otherMonthlyIncome);
  const coIncome = parseNum(step6.coApplicantIncome);
  const totalIncomeWithoutCo = netIncome + otherIncome;
  const totalIncomeWithCo = totalIncomeWithoutCo + coIncome;
  const existingEMIs = step4.existingLoans.reduce((s, l) => s + l.monthlyEMI, 0);
  const loanAmount6 = parseNum(step1.desiredLoanAmount);
  const tenure6 = parseNum(step1.requestedTenureMonths);
  const estimateRate6 = POLICY.interestRates.defaultEstimateRate;
  const newEMI6 = loanAmount6 > 0 && tenure6 > 0 ? calculateEMI(loanAmount6, estimateRate6, tenure6) : 0;
  const totalEMI6 = existingEMIs + newEMI6;
  const foirWithoutCo = totalIncomeWithoutCo > 0 ? calcFOIR(totalEMI6, totalIncomeWithoutCo) : 0;
  const foirWithCo = totalIncomeWithCo > 0 ? calcFOIR(totalEMI6, totalIncomeWithCo) : 0;
  // Live co-applicant fit score
  let liveCoScore = 0;
  if (step6.numberOfCoApplicants === 0) {
    liveCoScore = 5;
  } else {
    liveCoScore = 10;
    if (step6.coApplicantRelationship === 'other') liveCoScore = 7;
    if (!step6.allOwnersIncluded && step6.numberOfPropertyOwners > 1) liveCoScore = Math.round(liveCoScore * 0.7);
  }

  const ownersBorrowerMismatch =
    step6.numberOfPropertyOwners > 1 && !step6.allOwnersIncluded;
  const hasOtherRelationship = step6.coApplicantRelationship === 'other';
  const noCoApplicant = step6.numberOfCoApplicants === 0;

  return (
    <>
      <Card>
        <SectionTitle subtitle="Co-applicant is generally mandatory. All property owners should be co-borrowers.">
          {STEP_LABELS[5]}
        </SectionTitle>

        <div className="space-y-5">
          <FormRow cols={2}>
            <FormField label="Number of Property Owners" htmlFor="numOwners" required>
              <NumberInput
                id="numOwners"
                value={step6.numberOfPropertyOwners}
                onChange={(v) => updateStep6({ numberOfPropertyOwners: typeof v === 'number' ? v : 1 })}
                min={1}
                max={6}
                error={errors.numberOfPropertyOwners}
              />
            </FormField>

            <FormField label="Number of Co-Applicants" htmlFor="numCoApplicants" required>
              <NumberInput
                id="numCoApplicants"
                value={step6.numberOfCoApplicants}
                onChange={(v) => updateStep6({ numberOfCoApplicants: typeof v === 'number' ? v : 0 })}
                min={0}
                max={6}
                error={errors.numberOfCoApplicants}
                hint="Including spouse, parents, or siblings"
              />
            </FormField>
          </FormRow>

          {step6.numberOfCoApplicants > 0 && (
            <>
              <FormRow cols={2}>
                <FormField label="Primary Co-Applicant Relationship" htmlFor="coRelationship">
                  <Select
                    id="coRelationship"
                    options={CO_APPLICANT_RELATIONSHIPS}
                    value={step6.coApplicantRelationship}
                    onChange={(e) => updateStep6({ coApplicantRelationship: e.target.value as typeof step6.coApplicantRelationship })}
                  />
                </FormField>

                <FormField label="Co-Applicant Monthly Income" htmlFor="coIncome">
                  <CurrencyInput
                    id="coIncome"
                    value={step6.coApplicantIncome}
                    onChange={(v) => updateStep6({ coApplicantIncome: v })}
                    placeholder="e.g. 80,000"
                    error={errors.coApplicantIncome}
                    hint="Combined income improves FOIR assessment"
                  />
                </FormField>
              </FormRow>

              {hasOtherRelationship && (
                <Alert type="info">
                  Relationship category 'Other' may require additional justification. Standard co-applicants accepted under policy are: spouse, parent, son/daughter, or sibling.
                </Alert>
              )}
            </>
          )}

          <Checkbox
            label="All property owners are included as co-applicants / co-borrowers"
            description="All individuals registered as property owners must typically be co-borrowers per lender policy."
            checked={step6.allOwnersIncluded}
            onChange={(e) => updateStep6({ allOwnersIncluded: e.target.checked })}
          />

          {/* Warnings */}
          {noCoApplicant && POLICY.coApplicant.mandatoryWarning && (
            <Alert type="warning">
              A co-applicant is <strong>generally mandatory</strong> under policy. Without one, the application may be returned during processing. If there is a genuine reason, this can be discussed with the relationship manager.
            </Alert>
          )}

          {ownersBorrowerMismatch && (
            <Alert type="warning">
              You have indicated <strong>{step6.numberOfPropertyOwners} property owners</strong> but not all are included as co-applicants. Lenders typically require all property owners to be co-borrowers. Please align the ownership and borrower structure.
            </Alert>
          )}

          {/* Policy note */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Co-Applicant Policy Notes
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
              <li>All property owners must be co-borrowers.</li>
              <li>Accepted relationships: spouse, parents, son/daughter, sibling.</li>
              <li>Co-applicant income can strengthen FOIR assessment.</li>
              <li>A co-applicant with a strong credit profile can improve pricing.</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Formula panels */}
      <div className="space-y-2">
        <FormulaPanel
          title="Co-Applicant Income — Impact on FOIR"
          formula={`Total Income (without co-applicant) = Net + Other
Total Income (with co-applicant)    = Net + Other + Co-Applicant Income

FOIR = (Existing EMIs + New EMI) ÷ Total Income

Adding co-applicant income reduces FOIR, improving eligibility.`}
          variables={[
            { symbol: 'FOIR', meaning: 'Fixed Obligation to Income Ratio — lower is better' },
            { symbol: 'Co-income', meaning: "Co-applicant's verifiable monthly income" },
          ]}
          steps={
            totalIncomeWithoutCo > 0 || coIncome > 0
              ? [
                  { label: 'Net income', expr: `₹${netIncome.toLocaleString('en-IN')} / month` },
                  ...(otherIncome > 0 ? [{ label: 'Other income', expr: `+ ₹${otherIncome.toLocaleString('en-IN')} / month` }] : []),
                  { label: 'Primary income', expr: `₹${totalIncomeWithoutCo.toLocaleString('en-IN')} / month` },
                  ...(newEMI6 > 0
                    ? [{ label: 'Total EMI', expr: `₹${Math.round(totalEMI6).toLocaleString('en-IN')} / month (existing + new)` }]
                    : []),
                  ...(foirWithoutCo > 0
                    ? [{ label: 'FOIR without co.', expr: `${(foirWithoutCo * 100).toFixed(1)}%` }]
                    : []),
                  ...(coIncome > 0
                    ? [
                        { label: 'Co-appl. income', expr: `+ ₹${coIncome.toLocaleString('en-IN')} / month` },
                        { label: 'Total with co.', expr: `₹${totalIncomeWithCo.toLocaleString('en-IN')} / month` },
                        {
                          label: 'FOIR with co.',
                          expr: foirWithCo > 0 ? `${(foirWithCo * 100).toFixed(1)}% (was ${(foirWithoutCo * 100).toFixed(1)}% — reduced by ${((foirWithoutCo - foirWithCo) * 100).toFixed(1)}pp)` : '—',
                          highlight: foirWithCo > 0 && foirWithCo < foirWithoutCo,
                        },
                      ]
                    : [{ label: 'Note', expr: 'Enter co-applicant income above to see FOIR improvement' }]),
                ]
              : [{ label: 'Note', expr: 'Enter income in Step 5 and co-applicant income above' }]
          }
          result={
            foirWithCo > 0 && coIncome > 0
              ? { label: 'FOIR with co.', value: `${(foirWithCo * 100).toFixed(1)}% (reduced from ${(foirWithoutCo * 100).toFixed(1)}% without co.)`, status: foirWithCo <= 0.50 ? 'pass' : foirWithCo <= 0.65 ? 'warning' : 'fail' }
              : foirWithoutCo > 0
              ? { label: 'FOIR (primary)', value: `${(foirWithoutCo * 100).toFixed(1)}% — add co-applicant income to improve`, status: 'info' }
              : { label: 'Note', value: 'Enter income (Step 5) for FOIR preview', status: 'info' }
          }
        />

        <FormulaPanel
          title="Co-Applicant Fit Score (10 pts)"
          formula={`No co-applicant             → 5 pts   (50% — mandatory warning)
With co-applicant (base)    → 10 pts  (full)

Modifiers (applied to base):
  Relationship = 'Other'    → × 0.70  (7 pts — may need justification)
  Not all owners included   → × 0.70  (only when owners > 1)

Modifiers multiply sequentially if both apply.`}
          variables={[
            { symbol: '10 pts', meaning: 'Full score when co-applicant present with accepted relationship' },
            { symbol: '× 0.70', meaning: 'Reduction for non-standard relationship or missing owners' },
          ]}
          steps={[
            {
              label: 'Co-applicants',
              expr: `${step6.numberOfCoApplicants} co-applicant(s)`,
            },
            {
              label: 'Base score',
              expr: step6.numberOfCoApplicants === 0 ? '0 co-applicants → 5 pts (policy warning)' : '1+ co-applicant → 10 pts base',
            },
            ...(step6.numberOfCoApplicants > 0
              ? [
                  {
                    label: 'Relationship',
                    expr: step6.coApplicantRelationship === 'other'
                      ? `'Other' relationship → × 0.70 → 7 pts`
                      : step6.coApplicantRelationship
                      ? `${step6.coApplicantRelationship.replace('_', '/')} → accepted → × 1.00`
                      : 'Not selected',
                  },
                  {
                    label: 'All owners incl.',
                    expr: step6.numberOfPropertyOwners <= 1
                      ? 'Single owner — no penalty'
                      : step6.allOwnersIncluded
                      ? 'All owners included → × 1.00'
                      : `Not all owners included → × 0.70 → ${Math.round((step6.coApplicantRelationship === 'other' ? 7 : 10) * 0.7)} pts`,
                  },
                ]
              : []),
            { label: 'Co-Appl. Fit Score', expr: `${liveCoScore} / 10`, highlight: liveCoScore >= 8 },
          ]}
          result={
            liveCoScore >= 8
              ? { label: 'Co-Appl. Fit', value: `${liveCoScore} / 10`, status: 'pass' }
              : liveCoScore >= 5
              ? { label: 'Co-Appl. Fit', value: `${liveCoScore} / 10 — reduced`, status: 'warning' }
              : { label: 'Co-Appl. Fit', value: `${liveCoScore} / 10`, status: 'fail' }
          }
        />
      </div>

      <WizardNavigation
        currentStep={5}
        totalSteps={11}
        onBack={() => goToStep(4)}
        onNext={handleNext}
        onSaveDraft={saveDraft}
        onReset={resetWizard}
      />
    </>
  );
}
