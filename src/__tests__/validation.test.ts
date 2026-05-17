import { describe, it, expect } from 'vitest';
import { validateStep1, validateStep2, validateStep3, validateStep4, validateStep5 } from '../engine/validation';
import type { Step1Data, Step2Data, Step3Data, Step4Data, Step5Data } from '../types';

// ─── Step 1 ───────────────────────────────────────────────────────────────────

describe('validateStep1', () => {
  const valid: Step1Data = {
    desiredLoanAmount: 50_00_000,
    requestedTenureMonths: 240,
    loanPurpose: 'ready_property_purchase',
    propertyType: 'flat_apartment',
  };

  it('passes for valid inputs', () => {
    expect(validateStep1(valid)).toEqual({});
  });

  it('fails for zero loan amount', () => {
    const errors = validateStep1({ ...valid, desiredLoanAmount: 0 });
    expect(errors.desiredLoanAmount).toBeDefined();
  });

  it('fails for amount below minimum', () => {
    const errors = validateStep1({ ...valid, desiredLoanAmount: 50_000 });
    expect(errors.desiredLoanAmount).toBeDefined();
  });

  it('fails for amount above 10 crore', () => {
    const errors = validateStep1({ ...valid, desiredLoanAmount: 11_00_00_000 });
    expect(errors.desiredLoanAmount).toBeDefined();
  });

  it('fails for tenure below minimum', () => {
    const errors = validateStep1({ ...valid, requestedTenureMonths: 6 });
    expect(errors.requestedTenureMonths).toBeDefined();
  });

  it('fails for tenure above 360 months', () => {
    const errors = validateStep1({ ...valid, requestedTenureMonths: 361 });
    expect(errors.requestedTenureMonths).toBeDefined();
  });

  it('fails when loan purpose is empty', () => {
    const errors = validateStep1({ ...valid, loanPurpose: '' });
    expect(errors.loanPurpose).toBeDefined();
  });

  it('fails when property type is empty', () => {
    const errors = validateStep1({ ...valid, propertyType: '' });
    expect(errors.propertyType).toBeDefined();
  });
});

// ─── Step 2 ───────────────────────────────────────────────────────────────────

describe('validateStep2', () => {
  const valid: Step2Data = {
    applicantName: 'Arjun Sharma',
    dateOfBirth: '1985-04-15',
    employmentType: 'salaried',
    maritalStatus: 'married',
  };

  it('passes for valid inputs', () => {
    expect(validateStep2(valid)).toEqual({});
  });

  it('fails for missing name', () => {
    const errors = validateStep2({ ...valid, applicantName: '' });
    expect(errors.applicantName).toBeDefined();
  });

  it('fails for missing DOB', () => {
    const errors = validateStep2({ ...valid, dateOfBirth: '' });
    expect(errors.dateOfBirth).toBeDefined();
  });

  it('fails for applicant under 21', () => {
    const recent = new Date();
    recent.setFullYear(recent.getFullYear() - 18);
    const errors = validateStep2({ ...valid, dateOfBirth: recent.toISOString().split('T')[0] });
    expect(errors.dateOfBirth).toBeDefined();
  });

  it('does not fail for missing marital status (optional)', () => {
    const errors = validateStep2({ ...valid, maritalStatus: '' });
    expect(errors.maritalStatus).toBeUndefined();
  });

  it('fails when employment type is missing', () => {
    const errors = validateStep2({ ...valid, employmentType: '' });
    expect(errors.employmentType).toBeDefined();
  });
});

// ─── Step 3 ───────────────────────────────────────────────────────────────────

describe('validateStep3', () => {
  const valid: Step3Data = {
    marketValue: 85_00_000,
    agreementValue: 82_00_000,
    ownContribution: 25_00_000,
    useAgreementValueIfLower: true,
  };

  it('passes for valid inputs', () => {
    expect(validateStep3(valid)).toEqual({});
  });

  it('fails for zero market value', () => {
    const errors = validateStep3({ ...valid, marketValue: 0 });
    expect(errors.marketValue).toBeDefined();
  });

  it('fails when own contribution >= property value', () => {
    const errors = validateStep3({ ...valid, ownContribution: 85_00_000 });
    expect(errors.ownContribution).toBeDefined();
  });

  it('fails for negative own contribution', () => {
    const errors = validateStep3({ ...valid, ownContribution: -1 });
    expect(errors.ownContribution).toBeDefined();
  });
});

// ─── Step 4 ───────────────────────────────────────────────────────────────────

describe('validateStep4', () => {
  const valid: Step4Data = {
    creditScore: 750,
    hasDefaults: false,
    defaultDetails: '',
    defaultSeverity: 'none',
    existingLoans: [],
    repaymentHistory: 'excellent',
  };

  it('passes for valid inputs', () => {
    expect(validateStep4(valid)).toEqual({});
  });

  it('fails for missing credit score', () => {
    const errors = validateStep4({ ...valid, creditScore: 0 });
    expect(errors.creditScore).toBeDefined();
  });

  it('fails for credit score out of range (< 300)', () => {
    const errors = validateStep4({ ...valid, creditScore: 200 });
    expect(errors.creditScore).toBeDefined();
  });

  it('fails for credit score out of range (> 900)', () => {
    const errors = validateStep4({ ...valid, creditScore: 950 });
    expect(errors.creditScore).toBeDefined();
  });

  it('fails when hasDefaults=true but details are empty', () => {
    const errors = validateStep4({ ...valid, hasDefaults: true, defaultDetails: '' });
    expect(errors.defaultDetails).toBeDefined();
  });

  it('fails when repaymentHistory is missing', () => {
    const errors = validateStep4({ ...valid, repaymentHistory: '' });
    expect(errors.repaymentHistory).toBeDefined();
  });
});

// ─── Step 5 ───────────────────────────────────────────────────────────────────

describe('validateStep5', () => {
  const valid: Step5Data = {
    monthlyNetIncome: 1_00_000,
    otherMonthlyIncome: 0,
    employmentStabilityYears: 5,
    hasSalarySlips: true,
    hasITR: true,
    hasBankStatements: true,
    hasFormSixteen: true,
    hasGSTReturns: false,
    hasAuditedFinancials: false,
  };

  it('passes for valid inputs', () => {
    expect(validateStep5(valid)).toEqual({});
  });

  it('fails for zero income', () => {
    const errors = validateStep5({ ...valid, monthlyNetIncome: 0 });
    expect(errors.monthlyNetIncome).toBeDefined();
  });

  it('fails for negative other income', () => {
    const errors = validateStep5({ ...valid, otherMonthlyIncome: -100 });
    expect(errors.otherMonthlyIncome).toBeDefined();
  });

  it('fails for negative employment stability', () => {
    const errors = validateStep5({ ...valid, employmentStabilityYears: -1 });
    expect(errors.employmentStabilityYears).toBeDefined();
  });
});
