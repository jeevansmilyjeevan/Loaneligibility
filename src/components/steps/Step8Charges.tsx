import React from 'react';
import { useWizard } from '../../context/WizardContext';
import { Card, SectionTitle } from '../ui/Card';
import { FormField } from '../ui/FormField';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Alert } from '../ui/Alert';
import { WizardNavigation } from '../layout/WizardNavigation';
import { STEP_LABELS } from '../../constants/options';
import { POLICY } from '../../config/policy';
import { calcProcessingFee } from '../../engine/calculations';
import { formatCurrency, parseNum } from '../../utils/formatters';

const LOAN_CATEGORY_OPTIONS = [
  { value: 'standard_purchase', label: 'Standard Purchase / Construction' },
  { value: 'balance_transfer', label: 'Balance Transfer' },
  { value: 'top_up', label: 'Top-Up Loan' },
];

export function Step8Charges() {
  const { state, updateStep8, goToStep, completeStep, saveDraft, resetWizard } = useWizard();
  const { step8, step1 } = state;

  const handleNext = () => {
    completeStep(7);
    goToStep(8);
  };

  const loanAmount = parseNum(step1.desiredLoanAmount);
  const fee = loanAmount > 0 ? calcProcessingFee(loanAmount) : null;

  const OTHER_CHARGES = [
    { name: 'Legal / Advocate Fees', note: 'Charged by empanelled advocate for title verification. Varies by property location.' },
    { name: 'Technical / Valuation Fees', note: 'Lender-appointed valuer charges. Typically ₹2,000–₹5,000.' },
    { name: 'CERSAI Registration', note: 'Central Registry of Securitisation — mandatory mortgage registration. Fixed government fee.' },
    { name: 'Stamp Duty on Loan Agreement', note: 'Varies by state. Payable at the time of agreement execution.' },
    { name: 'Insurance Premium (optional / bundled)', note: 'Property insurance and/or credit life insurance may be offered as add-ons.' },
    { name: 'Conversion Fee', note: 'Applicable if switching between fixed and floating rates later.' },
    { name: 'Duplicate NOC / Statement Charges', note: 'For requesting additional documents post-disbursement.' },
  ];

  return (
    <>
      <Card>
        <SectionTitle subtitle="Indicative charges associated with the home loan. This step is informational only.">
          {STEP_LABELS[7]}
        </SectionTitle>

        <Alert type="info" className="mb-5">
          <strong>Informational only.</strong> Charges listed here do not affect eligibility determination. Actual fees may vary. Confirm all charges with the lender before signing.
        </Alert>

        <div className="space-y-6">
          <Checkbox
            label="Show me a breakdown of estimated processing fees"
            checked={step8.wantsChargesPreview}
            onChange={(e) => updateStep8({ wantsChargesPreview: e.target.checked })}
          />

          <FormField label="Loan / Transaction Category" htmlFor="loanCategory">
            <Select
              id="loanCategory"
              options={LOAN_CATEGORY_OPTIONS}
              value={step8.loanCategory}
              onChange={(e) => updateStep8({ loanCategory: e.target.value as typeof step8.loanCategory })}
            />
          </FormField>

          {step8.wantsChargesPreview && loanAmount > 0 && fee && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Processing Fee Estimate</h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <ChargeStat
                  label={`At ${POLICY.processingFee.minPercent}% (min rate)`}
                  value={formatCurrency(fee.min)}
                  subValue={`+ GST = ${formatCurrency(Math.round(fee.minWithGST))}`}
                />
                <ChargeStat
                  label={`At ${POLICY.processingFee.maxPercent}% (max rate)`}
                  value={formatCurrency(fee.max)}
                  subValue={`+ GST = ${formatCurrency(Math.round(fee.maxWithGST))}`}
                />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Processing fee: {POLICY.processingFee.minPercent}%–{POLICY.processingFee.maxPercent}% of loan amount + {POLICY.processingFee.gstRatePercent}% GST.
                Minimum floor charges may apply. Fee may be negotiable for high-value loans.
              </p>

              {step8.loanCategory === 'balance_transfer' && (
                <Alert type="info">
                  Balance transfer transactions may attract reduced or zero processing fees as a promotional offer. Confirm with the lender.
                </Alert>
              )}
            </div>
          )}

          {step8.wantsChargesPreview && loanAmount === 0 && (
            <Alert type="info">Enter the loan amount in Step 1 to see the processing fee estimate.</Alert>
          )}

          {/* Other charges list */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Other Possible Charges</h3>
            <div className="divide-y dark:divide-gray-700 rounded-lg border dark:border-gray-700 overflow-hidden">
              {OTHER_CHARGES.map((c) => (
                <div key={c.name} className="flex gap-3 px-4 py-3 bg-white dark:bg-gray-900">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-52 shrink-0">{c.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{c.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <WizardNavigation
        currentStep={7}
        totalSteps={11}
        onBack={() => goToStep(6)}
        onNext={handleNext}
        onSaveDraft={saveDraft}
        onReset={resetWizard}
      />
    </>
  );
}

function ChargeStat({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-900 border dark:border-gray-600 p-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-bold text-gray-800 dark:text-gray-200">{value}</p>
      {subValue && <p className="text-xs text-gray-500 dark:text-gray-400">{subValue}</p>}
    </div>
  );
}
