import React, { useRef, useState } from 'react';
import { useWizard } from '../../context/WizardContext';
import { validateStep1 } from '../../engine/validation';
import { Card, SectionTitle } from '../ui/Card';
import { FormField, FormRow } from '../ui/FormField';
import { CurrencyInput, NumberInput } from '../ui/Input';
import { Select } from '../ui/Select';
import { Alert, DisclaimerBanner } from '../ui/Alert';
import { WizardNavigation } from '../layout/WizardNavigation';
import {
  BANKS,
  LOAN_PURPOSES,
  LAP_PURPOSES,
  PROPERTY_TYPES,
  LAP_PROPERTY_TYPES,
  UNDERWRITING_PROGRAMS,
  CITY_CATEGORIES,
  STEP_LABELS,
} from '../../constants/options';
import { POLICY, AXIS_LAP_POLICY } from '../../config/policy';
import { formatCurrency, formatMonths, parseNum } from '../../utils/formatters';
import { FormulaPanel } from '../ui/FormulaPanel';
import type { StepErrors, UnderwritingProgram } from '../../types';

// Map Axis LAP plan id → default underwriting program
const PLAN_TO_PROGRAM: Record<string, UnderwritingProgram> = {
  axis_lap_normal: 'normal_income',
  axis_lap_abb:    'average_banking',
  axis_lap_gst:    'gst_program',
  axis_lap_gpr:    'gpr_doctors',
  axis_lap_rtr:    'repayment_track',
  axis_lap_lrd:    'lease_rental_discounting',
};

export function Step1LoanBasics() {
  const { state, updateStep1, updateStep5, goToStep, completeStep, saveDraft, resetWizard } = useWizard();
  const { step1, step5 } = state;
  const [errors, setErrors] = useState<StepErrors>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});

  const isAxisLAP = step1.selectedBank === 'axis';
  const pol = isAxisLAP ? AXIS_LAP_POLICY : POLICY;

  const handleFileSelect = (key: string, file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [key]: file.name }));
  };

  const handleNext = () => {
    const errs = validateStep1(step1);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    completeStep(0);
    goToStep(1);
  };

  const loanAmount = parseNum(step1.desiredLoanAmount);
  const tenureMonths = parseNum(step1.requestedTenureMonths);
  const selectedBankData = BANKS.find((b) => b.id === step1.selectedBank) ?? null;
  const selectedPlanData = selectedBankData?.plans.find((p) => p.id === step1.selectedPlan) ?? null;

  const loanPurposeOptions = isAxisLAP ? LAP_PURPOSES : LOAN_PURPOSES;
  const propertyTypeOptions = isAxisLAP ? LAP_PROPERTY_TYPES : PROPERTY_TYPES;
  const maxAmount = pol.loanLimits.maxAmount;
  const maxTenure = pol.loanLimits.maxTenureMonths;

  // LTV info for the info box
  const lapLTVInfo: Record<string, string> = {
    lap_residential:   '70%',
    lap_commercial:    '60%',
    lap_mixed_usage:   '60%',
    lap_plot:          '60%',
    lap_special_usage: '55%',
  };
  const currentLapLTV = lapLTVInfo[step1.propertyType] ?? '—';

  return (
    <>
      <Card>
        <SectionTitle subtitle={isAxisLAP
          ? 'Configure your Axis Finance Loan Against Property (LAP) application.'
          : 'Tell us about the loan you\'re looking for.'
        }>
          {STEP_LABELS[0]}
        </SectionTitle>

        <DisclaimerBanner />

        <div className="mt-6 space-y-7">

          {/* ── Bank Selection ─────────────────────────────────────────────── */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Select Your Bank <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {BANKS.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => {
                    updateStep1({
                      selectedBank: bank.id,
                      selectedPlan: '',
                      underwritingProgram: '',
                      cityCategory: '',
                      loanPurpose: '',
                      propertyType: '',
                    });
                    setErrors((e) => ({ ...e, selectedBank: '', selectedPlan: '' }));
                  }}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all focus:outline-none
                    ${step1.selectedBank === bank.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xs leading-tight text-center ${bank.color}`}>
                    {bank.shortName}
                  </div>
                  <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300 leading-tight line-clamp-2">
                    {bank.name}
                  </span>
                </button>
              ))}
            </div>
            {errors.selectedBank && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400 mt-2">{errors.selectedBank}</p>
            )}
          </div>

          {/* ── Axis LAP badge ─────────────────────────────────────────────── */}
          {isAxisLAP && (
            <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-violet-700 flex items-center justify-center text-white text-xs font-bold">
                  LAP
                </div>
                <div>
                  <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">
                    Axis Finance — Loan Against Property (LAP)
                  </p>
                  <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                    Policy: OGL June 2025 · Min age 24 · Credit score ≥ 600 · Multiple underwriting programs
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Loan Plans ─────────────────────────────────────────────────── */}
          {selectedBankData && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {isAxisLAP ? 'LAP Programs — Axis Finance' : `Home Loan Plans — ${selectedBankData.name}`}{' '}
                <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedBankData.plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      const prog = PLAN_TO_PROGRAM[plan.id] ?? '';
                      updateStep1({
                        selectedPlan: plan.id,
                        underwritingProgram: prog,
                      });
                      setErrors((e) => ({ ...e, selectedPlan: '', underwritingProgram: '' }));
                    }}
                    className={`text-left rounded-xl border-2 p-4 transition-all focus:outline-none
                      ${step1.selectedPlan === plan.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                        {plan.name}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {plan.rateMin.toFixed(2)}–{plan.rateMax.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                      {plan.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {plan.highlights.map((h) => (
                        <span
                          key={h}
                          className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              {errors.selectedPlan && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400 mt-2">{errors.selectedPlan}</p>
              )}
            </div>
          )}

          {/* ── Axis LAP: Underwriting Program + City Category ─────────────── */}
          {isAxisLAP && (
            <FormRow cols={2}>
              <FormField label="Underwriting Program" htmlFor="underwritingProgram" required
                hint="Determines income assessment method and loan cap">
                <Select
                  id="underwritingProgram"
                  options={UNDERWRITING_PROGRAMS}
                  value={step1.underwritingProgram}
                  onChange={(e) => {
                    updateStep1({ underwritingProgram: e.target.value as UnderwritingProgram });
                    setErrors((err) => ({ ...err, underwritingProgram: '' }));
                  }}
                  error={errors.underwritingProgram}
                />
              </FormField>

              <FormField label="City Category" htmlFor="cityCategory" required
                hint="Affects maximum loan amount cap">
                <Select
                  id="cityCategory"
                  options={CITY_CATEGORIES}
                  value={step1.cityCategory}
                  onChange={(e) => {
                    updateStep1({ cityCategory: e.target.value as typeof step1.cityCategory });
                    setErrors((err) => ({ ...err, cityCategory: '' }));
                  }}
                  error={errors.cityCategory}
                />
              </FormField>
            </FormRow>
          )}

          {/* ── Loan Purpose + Property Type ───────────────────────────────── */}
          <FormRow cols={2}>
            <FormField label={isAxisLAP ? 'LAP Purpose' : 'Loan Purpose'} htmlFor="loanPurpose" required>
              <Select
                id="loanPurpose"
                options={loanPurposeOptions}
                value={step1.loanPurpose}
                onChange={(e) => updateStep1({ loanPurpose: e.target.value as typeof step1.loanPurpose })}
                error={errors.loanPurpose}
              />
            </FormField>

            <FormField
              label={isAxisLAP ? 'Collateral Property Type' : 'Property Type'}
              htmlFor="propertyType"
              required
            >
              <Select
                id="propertyType"
                options={propertyTypeOptions}
                value={step1.propertyType}
                onChange={(e) => updateStep1({ propertyType: e.target.value as typeof step1.propertyType })}
                error={errors.propertyType}
              />
            </FormField>
          </FormRow>

          {/* ── Loan Amount + Tenure ───────────────────────────────────────── */}
          <FormRow cols={2}>
            <FormField label="Desired Loan Amount" htmlFor="loanAmount" required>
              <CurrencyInput
                id="loanAmount"
                value={step1.desiredLoanAmount}
                onChange={(v) => updateStep1({ desiredLoanAmount: v })}
                placeholder="e.g. 50,00,000"
                error={errors.desiredLoanAmount}
                hint={`Max: ${formatCurrency(maxAmount, true)}`}
              />
            </FormField>

            <FormField label="Requested Tenure" htmlFor="tenure" required>
              <NumberInput
                id="tenure"
                value={step1.requestedTenureMonths}
                onChange={(v) => updateStep1({ requestedTenureMonths: v })}
                min={12}
                max={maxTenure}
                placeholder="e.g. 180"
                suffix="mo"
                error={errors.requestedTenureMonths}
                hint={tenureMonths > 0 ? `= ${formatMonths(tenureMonths)}` : `Max ${maxTenure} months (${maxTenure / 12} years)`}
              />
            </FormField>
          </FormRow>

          {/* Selected plan summary */}
          {selectedPlanData && (
            <div className={`rounded-xl border-l-4 ${isAxisLAP ? 'border-violet-500' : 'border-blue-500'} bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                Selected {isAxisLAP ? 'Program' : 'Plan'}
              </p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {selectedBankData?.name} — {selectedPlanData.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Indicative rate: {selectedPlanData.rateMin.toFixed(2)}%–{selectedPlanData.rateMax.toFixed(2)}% p.a. · {selectedPlanData.description}
              </p>
              {isAxisLAP && step1.underwritingProgram && (
                <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
                  Program: {UNDERWRITING_PROGRAMS.find(p => p.value === step1.underwritingProgram)?.label ?? step1.underwritingProgram}
                  {step1.cityCategory ? ` · ${CITY_CATEGORIES.find(c => c.value === step1.cityCategory)?.label ?? step1.cityCategory}` : ''}
                </p>
              )}
            </div>
          )}

          {/* Info box: LTV info */}
          {loanAmount > 0 && (
            <Alert type="info">
              {isAxisLAP ? (
                <div className="space-y-1">
                  <p>
                    <strong>Axis LAP LTV by collateral type:</strong>{' '}
                    Residential <strong>70%</strong> · Commercial/Mixed <strong>60%</strong> ·
                    Plot <strong>60%</strong> · Special Usage <strong>55%</strong>.
                    {step1.propertyType && (
                      <> Currently selected: <strong>{currentLapLTV}</strong> LTV.</>
                    )}
                  </p>
                  <p>
                    Surrogate programs (ABB/GST/GMP/LIP/RTR) attract <strong>5% lower LTV</strong> than the above grid.
                    LTV is calculated on property value in Step 3.
                  </p>
                </div>
              ) : (
                <p>
                  Max loanable amount depends on property value and LTV band — up to{' '}
                  <strong>90%</strong> for properties up to ₹30L, <strong>80%</strong> for ₹30–75L, and{' '}
                  <strong>75%</strong> for properties above ₹75L. You'll calculate exact LTV in Step 3.
                </p>
              )}
              {loanAmount > maxAmount && (
                <p className="mt-1 font-semibold text-red-700 dark:text-red-400">
                  Amount exceeds the {formatCurrency(maxAmount, true)} maximum for this program.
                </p>
              )}
            </Alert>
          )}

          {/* Axis LAP specific warnings */}
          {isAxisLAP && step1.propertyType === 'lap_special_usage' && (
            <Alert type="warning">
              Special Usage properties (school, clinic, warehouse, industrial, hotel) carry the lowest LTV of 55%
              and may require NCM-level approval for deviations. Colleges are eligible only if clubbed with schools.
            </Alert>
          )}

          {isAxisLAP && step1.propertyType === 'lap_plot' && (
            <Alert type="info">
              Plot collateral: standard LTV is 60%. An additional 5% LTV is allowed if the plot is a direct
              allotment or developed by a government authority.
            </Alert>
          )}

          {!isAxisLAP && step1.propertyType === 'residential_plot' && (
            <Alert type="warning">
              Residential plot loans may have restrictions. Plot-only purchase (without construction) may not be
              eligible under standard home loan policy.
            </Alert>
          )}
        </div>
      </Card>

      {/* Formula panels */}
      <div className="space-y-2">
        <FormulaPanel
          title="Loan Limit Validation"
          formula={isAxisLAP
            ? `Hard Fail if: Amount = 0  OR  Amount < ₹0.50L
Hard Fail if: Amount > Program cap (see below)
Hard Fail if: Tenure > ${maxTenure} months (${maxTenure / 12} years)
Note: All loans > 20 yrs require deviation approval`
            : `Hard Fail if: Amount = 0  OR  Amount > ₹10,00,00,000
Hard Fail if: Tenure > 360 months (30 years)
Min Tenure:   12 months`}
          variables={isAxisLAP
            ? [
                { symbol: 'Normal Income', meaning: 'Max ₹100 Cr (₹1000 Lacs)' },
                { symbol: 'ABB / GST / GMP', meaning: 'Max ₹75 Cr (₹750 Lacs)' },
                { symbol: 'GPR (Doctors)', meaning: 'Max ₹25 Cr (₹250 Lacs)' },
                { symbol: 'RTR / LIP', meaning: 'Max ₹30 Cr (₹300 Lacs)' },
                { symbol: 'City cap', meaning: 'Metro/Urban ₹7 Cr · Semi-Urban ₹5 Cr · Rural ₹3 Cr' },
              ]
            : [
                { symbol: '₹10Cr', meaning: 'Policy maximum sanctioned amount' },
                { symbol: '360 mo', meaning: 'Policy maximum tenure (30 years)' },
              ]}
          steps={[
            { label: 'Amount entered', expr: loanAmount > 0 ? `₹${loanAmount.toLocaleString('en-IN')}` : 'Not entered' },
            { label: 'Amount check', expr: loanAmount > maxAmount ? `₹${loanAmount.toLocaleString('en-IN')} > ${formatCurrency(maxAmount, true)} → HARD FAIL` : loanAmount > 0 ? `₹${loanAmount.toLocaleString('en-IN')} ≤ ${formatCurrency(maxAmount, true)} → Pass` : 'Enter amount above' },
            { label: 'Tenure entered', expr: tenureMonths > 0 ? `${tenureMonths} months` : 'Not entered' },
            { label: 'Tenure check', expr: tenureMonths > maxTenure ? `${tenureMonths} > ${maxTenure} → HARD FAIL` : tenureMonths >= 12 ? `${tenureMonths} ≤ ${maxTenure} → Pass` : tenureMonths > 0 ? `${tenureMonths} < 12 → Below minimum` : 'Enter tenure above', highlight: tenureMonths >= 12 && loanAmount > 0 && loanAmount <= maxAmount },
          ]}
          result={
            loanAmount > 0 && tenureMonths >= 12
              ? loanAmount > maxAmount || tenureMonths > maxTenure
                ? { label: 'Status', value: 'Hard Fail — exceeds policy limits', status: 'fail' }
                : { label: 'Status', value: 'Pass — within policy limits', status: 'pass' }
              : { label: 'Status', value: 'Enter loan amount and tenure', status: 'info' }
          }
        />

        {isAxisLAP && (
          <FormulaPanel
            title="Axis LAP — Key Policy Rules"
            formula={`Age:         Min 24 yrs (financial applicant) | Min 18 yrs (non-financial co-applicant)
Credit:      Score < 600 → Hard Fail (TransUnion bureau)
FOIR:        Salaried: ≤₹6L/yr=60%, ₹6–12L=65%, >₹12L=70%
             SE (Normal, Loan ≤₹3Cr): 85% | SE (Loan >₹3Cr): 80%
             GST/GMP/GPR: 75% | LIP: 70%
Work Exp:    Salaried: 1 yr current + 2 yrs total | SE: 3 yrs
LTV:         Residential 70% | Commercial 60% | Plot 60% | Special 55%
             Surrogate programs: −5% from above`}
            variables={[
              { symbol: 'FOIR', meaning: 'Fixed Obligation to Income Ratio — all existing EMIs + new EMI' },
              { symbol: 'LTV', meaning: 'Loan-to-Value ratio — without insurance adjustment' },
              { symbol: 'ABB', meaning: 'Average Bank Balance — daily average over last 12 months' },
            ]}
            steps={[
              { label: 'Program', expr: step1.underwritingProgram ? UNDERWRITING_PROGRAMS.find(p => p.value === step1.underwritingProgram)?.label ?? step1.underwritingProgram : 'Not selected' },
              { label: 'City category', expr: step1.cityCategory ? CITY_CATEGORIES.find(c => c.value === step1.cityCategory)?.label ?? step1.cityCategory : 'Not selected' },
              { label: 'Collateral LTV', expr: step1.propertyType ? `${LAP_PROPERTY_TYPES.find(p => p.value === step1.propertyType)?.label ?? step1.propertyType}: ${currentLapLTV}` : 'Select property type' },
            ]}
            result={{ label: 'Policy', value: 'Axis Finance LAP Policy OGL · June 2025', status: 'info' }}
          />
        )}

        {!isAxisLAP && (
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
        )}
      </div>

      {/* Document availability */}
      <Card>
        <SectionTitle subtitle="Mark which documents you have ready and optionally upload copies for reference.">
          Document Availability
        </SectionTitle>

        <div className="mt-4 space-y-6">

          {/* KYC / Identity */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              KYC / Identity
            </p>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <DocRow label="Aadhaar Card" checked={step1.hasAadhaar} onCheckChange={(v) => updateStep1({ hasAadhaar: v })} uploadedFileName={uploadedFiles['aadhaar']} onFileSelect={(f) => handleFileSelect('aadhaar', f)} />
              <DocRow label="PAN Card" checked={step1.hasPAN} onCheckChange={(v) => updateStep1({ hasPAN: v })} uploadedFileName={uploadedFiles['pan']} onFileSelect={(f) => handleFileSelect('pan', f)} />
              <DocRow label="Address Proof (utility bill / passport / ration card)" checked={step1.hasAddressProof} onCheckChange={(v) => updateStep1({ hasAddressProof: v })} uploadedFileName={uploadedFiles['addressProof']} onFileSelect={(f) => handleFileSelect('addressProof', f)} />
            </div>
          </div>

          {/* Income — Salaried */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Income — Salaried
            </p>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <DocRow label="Salary slips (last 6 months)" checked={step5.hasSalarySlips} onCheckChange={(v) => updateStep5({ hasSalarySlips: v })} uploadedFileName={uploadedFiles['salarySlips']} onFileSelect={(f) => handleFileSelect('salarySlips', f)} />
              <DocRow label="ITR with computation (last 2 years)" checked={step5.hasITR} onCheckChange={(v) => updateStep5({ hasITR: v })} uploadedFileName={uploadedFiles['itr_sal']} onFileSelect={(f) => handleFileSelect('itr_sal', f)} />
              <DocRow label="Bank statements (last 6 months)" checked={step5.hasBankStatements} onCheckChange={(v) => updateStep5({ hasBankStatements: v })} uploadedFileName={uploadedFiles['bankStmt_sal']} onFileSelect={(f) => handleFileSelect('bankStmt_sal', f)} />
              <DocRow label="Form 16 (last 2 years)" checked={step5.hasFormSixteen} onCheckChange={(v) => updateStep5({ hasFormSixteen: v })} uploadedFileName={uploadedFiles['form16']} onFileSelect={(f) => handleFileSelect('form16', f)} />
            </div>
          </div>

          {/* Income — Self-Employed */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Income — Self-Employed / Business
              {isAxisLAP && <span className="ml-2 text-violet-600 dark:text-violet-400">(12-month bank statements mandatory for ABB program)</span>}
            </p>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <DocRow label="ITR with computation (last 2 years)" checked={step5.hasITR} onCheckChange={(v) => updateStep5({ hasITR: v })} uploadedFileName={uploadedFiles['itr_se']} onFileSelect={(f) => handleFileSelect('itr_se', f)} />
              <DocRow label="Business bank statements (last 12 months, PDF format)" checked={step5.hasBankStatements} onCheckChange={(v) => updateStep5({ hasBankStatements: v })} uploadedFileName={uploadedFiles['bankStmt_se']} onFileSelect={(f) => handleFileSelect('bankStmt_se', f)} />
              <DocRow label="GST returns (GSTR-3B, last 2 years — required for GST program)" checked={step5.hasGSTReturns} onCheckChange={(v) => updateStep5({ hasGSTReturns: v })} uploadedFileName={uploadedFiles['gst']} onFileSelect={(f) => handleFileSelect('gst', f)} />
              <DocRow label="Audited financials / CA-certified P&L and Balance Sheet" checked={step5.hasAuditedFinancials} onCheckChange={(v) => updateStep5({ hasAuditedFinancials: v })} uploadedFileName={uploadedFiles['auditedFinancials']} onFileSelect={(f) => handleFileSelect('auditedFinancials', f)} />
            </div>
          </div>

          {/* Property Documents */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Property / Collateral Documents
            </p>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <DocRow
                label={isAxisLAP ? 'Title Deed / Ownership documents (clear & marketable title)' : 'Sale Agreement / ATS (Agreement to Sell)'}
                checked={isAxisLAP ? step1.hasTitleDeed : step1.hasSaleAgreement}
                onCheckChange={(v) => isAxisLAP ? updateStep1({ hasTitleDeed: v }) : updateStep1({ hasSaleAgreement: v })}
                uploadedFileName={uploadedFiles['saleOrTitle']}
                onFileSelect={(f) => handleFileSelect('saleOrTitle', f)}
              />
              {!isAxisLAP && (
                <DocRow label="Title Deed / Ownership documents" checked={step1.hasTitleDeed} onCheckChange={(v) => updateStep1({ hasTitleDeed: v })} uploadedFileName={uploadedFiles['titleDeed']} onFileSelect={(f) => handleFileSelect('titleDeed', f)} />
              )}
              <DocRow
                label={isAxisLAP ? 'Building approval / Municipality sanction plan' : 'Building approval / Sanction plan'}
                checked={step1.hasBuildingApproval}
                onCheckChange={(v) => updateStep1({ hasBuildingApproval: v })}
                uploadedFileName={uploadedFiles['buildingApproval']}
                onFileSelect={(f) => handleFileSelect('buildingApproval', f)}
              />
              {isAxisLAP && (
                <DocRow
                  label="Property valuation by empaneled technical valuer"
                  checked={false}
                  onCheckChange={() => {}}
                  uploadedFileName={uploadedFiles['valuation']}
                  onFileSelect={(f) => handleFileSelect('valuation', f)}
                />
              )}
            </div>
          </div>

        </div>
      </Card>

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

function DocRow({
  label,
  checked,
  onCheckChange,
  onFileSelect,
  uploadedFileName,
}: {
  label: string;
  checked: boolean;
  onCheckChange: (v: boolean) => void;
  onFileSelect: (file: File) => void;
  uploadedFileName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3 py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckChange(e.target.checked)}
        className="w-4 h-4 shrink-0 accent-blue-600 cursor-pointer"
      />
      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-snug">{label}</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="shrink-0 text-xs px-3 py-1 rounded-lg border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
      >
        {uploadedFileName ? 'Change' : 'Upload'}
      </button>
      {uploadedFileName && (
        <span
          className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[130px]"
          title={uploadedFileName}
        >
          {uploadedFileName}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelect(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
