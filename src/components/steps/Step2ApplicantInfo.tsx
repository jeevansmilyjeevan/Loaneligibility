import React, { useState } from 'react';
import { useWizard } from '../../context/WizardContext';
import { validateStep2 } from '../../engine/validation';
import { Card, SectionTitle } from '../ui/Card';
import { FormField, FormRow } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { WizardNavigation } from '../layout/WizardNavigation';
import { EMPLOYMENT_TYPES, MARITAL_STATUSES, STEP_LABELS } from '../../constants/options';
import { POLICY } from '../../config/policy';
import { calcAge, parseNum } from '../../utils/formatters';
import { calcAgeAtMaturity, getTypicalMaturityAge } from '../../engine/calculations';
import { FormulaPanel } from '../ui/FormulaPanel';
import type { StepErrors } from '../../types';

export function Step2ApplicantInfo() {
  const { state, updateStep2, goToStep, completeStep, saveDraft, resetWizard } = useWizard();
  const { step2, step1 } = state;
  const [errors, setErrors] = useState<StepErrors>({});

  const handleNext = () => {
    const errs = validateStep2(step2);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    completeStep(1);
    goToStep(2);
  };

  const age = step2.dateOfBirth ? calcAge(step2.dateOfBirth) : null;
  const tenure = parseNum(step1.requestedTenureMonths);
  const ageAtMaturity = age !== null && tenure > 0 ? calcAgeAtMaturity(age, tenure) : null;
  const typicalMaxAge = step2.employmentType ? getTypicalMaturityAge(step2.employmentType) : 60;

  return (
    <>
      <Card>
        <SectionTitle subtitle="Basic identity and employment details of the primary applicant.">
          {STEP_LABELS[1]}
        </SectionTitle>

        <div className="space-y-5">
          <FormRow cols={2}>
            <FormField label="Full Name" htmlFor="applicantName" required>
              <Input
                id="applicantName"
                value={step2.applicantName}
                onChange={(e) => updateStep2({ applicantName: e.target.value })}
                placeholder="As per PAN / Aadhaar"
                error={errors.applicantName}
              />
            </FormField>

            <FormField label="Date of Birth" htmlFor="dob" required>
              <Input
                id="dob"
                type="date"
                value={step2.dateOfBirth}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => updateStep2({ dateOfBirth: e.target.value })}
                error={errors.dateOfBirth}
                hint={age !== null ? `Current age: ${age} years` : undefined}
              />
            </FormField>
          </FormRow>

          <FormRow cols={2}>
            <FormField label="Employment Type" htmlFor="employmentType" required>
              <Select
                id="employmentType"
                options={EMPLOYMENT_TYPES}
                value={step2.employmentType}
                onChange={(e) => updateStep2({ employmentType: e.target.value as typeof step2.employmentType })}
                error={errors.employmentType}
              />
            </FormField>

            <FormField label="Marital Status" htmlFor="maritalStatus">
              <Select
                id="maritalStatus"
                options={MARITAL_STATUSES}
                value={step2.maritalStatus}
                onChange={(e) => updateStep2({ maritalStatus: e.target.value as typeof step2.maritalStatus })}
                hint="Optional — helps assess co-applicant context"
              />
            </FormField>
          </FormRow>

          {/* Age at maturity flag */}
          {ageAtMaturity !== null && step2.employmentType && (
            <Alert type={ageAtMaturity > typicalMaxAge + POLICY.age.maturityAgeGraceYears ? 'warning' : 'info'}>
              {ageAtMaturity <= typicalMaxAge ? (
                <span>
                  Loan would mature when you are <strong>{ageAtMaturity.toFixed(0)}</strong> years old — well within the typical{' '}
                  <strong>{typicalMaxAge}</strong>-year ceiling for {step2.employmentType === 'salaried' ? 'salaried' : 'self-employed'} applicants.
                </span>
              ) : ageAtMaturity <= typicalMaxAge + POLICY.age.maturityAgeGraceYears ? (
                <span>
                  Loan would mature at age <strong>{ageAtMaturity.toFixed(0)}</strong>. This is slightly above the typical{' '}
                  <strong>{typicalMaxAge}</strong>-year ceiling. Lender may suggest a shorter tenure.
                </span>
              ) : (
                <span>
                  Loan would mature at age <strong>{ageAtMaturity.toFixed(0)}</strong> — significantly above the typical{' '}
                  <strong>{typicalMaxAge}</strong>-year retirement age. Lender will very likely cap the tenure to{' '}
                  <strong>{Math.max(0, typicalMaxAge - (age ?? 0))} years</strong>.
                </span>
              )}
            </Alert>
          )}

          {/* Minimum age hard block */}
          {age !== null && age < POLICY.age.minAge && (
            <Alert type="error">
              Minimum applicant age is <strong>{POLICY.age.minAge} years</strong>. Current age: <strong>{age}</strong>. Application cannot proceed.
            </Alert>
          )}
        </div>
      </Card>

      {/* Formula panels */}
      <div className="space-y-2">
        <FormulaPanel
          title="Age Calculation from Date of Birth"
          formula={`Age (years) = floor( (Today − Date of Birth) ÷ 365.25 )

Hard Fail if Age < 21`}
          variables={[
            { symbol: 'Today', meaning: 'Date of application' },
            { symbol: '365.25', meaning: 'Average days/year — accounts for leap years' },
            { symbol: 'floor()', meaning: 'Round down to whole years' },
          ]}
          steps={
            age !== null
              ? [
                  { label: 'DOB entered', expr: step2.dateOfBirth },
                  { label: 'Age computed', expr: `${age} years` },
                  { label: 'Min age check', expr: `${age} ${age >= POLICY.age.minAge ? '≥' : '<'} ${POLICY.age.minAge} → ${age >= POLICY.age.minAge ? 'Pass' : 'HARD FAIL'}`, highlight: age >= POLICY.age.minAge },
                ]
              : [{ label: 'Note', expr: 'Enter date of birth above' }]
          }
          result={
            age !== null
              ? age < POLICY.age.minAge
                ? { label: 'Age Status', value: `Age ${age} < minimum ${POLICY.age.minAge} — Hard Fail`, status: 'fail' }
                : { label: 'Age', value: `${age} years — meets minimum age requirement`, status: 'pass' }
              : { label: 'Note', value: 'Enter date of birth to calculate', status: 'info' }
          }
        />

        <FormulaPanel
          title="Age at Maturity & Tenure Fit (10 pts)"
          formula={`Age at Maturity = Current Age + (Tenure Months ÷ 12)

Maturity Ceiling: Salaried → 60 yrs  |  Self-Employed → 65 yrs
Grace Period: 3 years (warn, not fail)

Recommended Max Tenure = (Ceiling − Age) × 12 months`}
          variables={[
            { symbol: 'Ceiling', meaning: '60 yrs (salaried) or 65 yrs (self-employed)' },
            { symbol: 'Grace', meaning: '3 years — warn only if within grace band' },
          ]}
          steps={
            age !== null && tenure > 0 && step2.employmentType
              ? [
                  { label: 'Current age', expr: `${age} years` },
                  { label: 'Tenure', expr: `${tenure} months` },
                  { label: 'Tenure (years)', expr: `${tenure} ÷ 12 = ${(tenure / 12).toFixed(2)} years` },
                  { label: 'Age at maturity', expr: `${age} + ${(tenure / 12).toFixed(2)} = ${ageAtMaturity?.toFixed(1)} years` },
                  { label: 'Ceiling', expr: `${typicalMaxAge} years (${step2.employmentType === 'salaried' ? 'salaried' : 'self-employed'})` },
                  { label: 'Compare', expr: `${ageAtMaturity?.toFixed(1)} ${(ageAtMaturity ?? 0) <= typicalMaxAge ? '≤' : '>'} ${typicalMaxAge} → ${(ageAtMaturity ?? 0) <= typicalMaxAge ? 'Full score (10/10)' : 'Score reduced'}`, highlight: (ageAtMaturity ?? 0) <= typicalMaxAge },
                  { label: 'Max eligible tenure', expr: `(${typicalMaxAge} − ${age}) × 12 = ${(typicalMaxAge - age) * 12} months` },
                ]
              : [{ label: 'Note', expr: 'Enter DOB, tenure (Step 1), and employment type' }]
          }
          result={
            ageAtMaturity !== null && step2.employmentType
              ? ageAtMaturity <= typicalMaxAge
                ? { label: 'Tenure Fit', value: `Maturity at ${ageAtMaturity.toFixed(1)} yrs — within ceiling → 10/10`, status: 'pass' }
                : ageAtMaturity <= typicalMaxAge + POLICY.age.maturityAgeGraceYears
                ? { label: 'Tenure Fit', value: `Maturity at ${ageAtMaturity.toFixed(1)} yrs — within grace period → 7/10`, status: 'warning' }
                : { label: 'Tenure Fit', value: `Maturity at ${ageAtMaturity.toFixed(1)} yrs — exceeds ceiling → 3/10`, status: 'fail' }
              : { label: 'Note', value: 'Enter DOB, tenure, and employment type', status: 'info' }
          }
        />

        <FormulaPanel
          title="Age Fit Scoring (15 pts)"
          formula={`Age Range    → Score Fraction
21–30        → 0.90  (14 pts)
31–45        → 1.00  (15 pts — prime range)
46–55        → 0.75  (11 pts)
> 55         → 0.40  (6 pts)
< 21         → Hard Fail`}
          steps={
            age !== null
              ? [
                  { label: 'Age', expr: `${age} years` },
                  {
                    label: 'Bracket',
                    expr: age < 21 ? 'Below minimum — HARD FAIL'
                      : age <= 30 ? '21–30 → fraction 0.90'
                      : age <= 45 ? '31–45 → fraction 1.00 (prime)'
                      : age <= 55 ? '46–55 → fraction 0.75'
                      : '> 55 → fraction 0.40',
                  },
                  {
                    label: 'Age Fit Score',
                    expr: age < 21 ? 'Hard Fail'
                      : `15 × ${age <= 30 ? '0.90 = 13.5 → 14' : age <= 45 ? '1.00 = 15' : age <= 55 ? '0.75 = 11.25 → 11' : '0.40 = 6'}`,
                    highlight: age >= 21,
                  },
                ]
              : [{ label: 'Note', expr: 'Enter date of birth above' }]
          }
          result={
            age !== null && age >= 21
              ? {
                  label: 'Age Fit Score',
                  value: age <= 30 ? '14 / 15' : age <= 45 ? '15 / 15' : age <= 55 ? '11 / 15' : '6 / 15',
                  status: age <= 45 ? 'pass' : age <= 55 ? 'warning' : 'fail',
                }
              : age !== null && age < 21
              ? { label: 'Age Fit', value: 'Hard Fail — below minimum age 21', status: 'fail' }
              : { label: 'Note', value: 'Enter date of birth', status: 'info' }
          }
        />
      </div>

      <WizardNavigation
        currentStep={1}
        totalSteps={11}
        onBack={() => goToStep(0)}
        onNext={handleNext}
        onSaveDraft={saveDraft}
        onReset={resetWizard}
      />
    </>
  );
}
