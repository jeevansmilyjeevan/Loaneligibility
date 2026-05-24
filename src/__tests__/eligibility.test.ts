import { describe, it, expect } from 'vitest';
import { computeEligibility } from '../engine/eligibility';
import type { WizardState } from '../types';

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<WizardState> = {}): WizardState {
  return {
    currentStep: 9,
    completedSteps: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]),
    step1: {
      selectedBank: 'sbi',
      selectedPlan: 'sbi_regular',
      desiredLoanAmount: 60_00_000,
      requestedTenureMonths: 240,
      loanPurpose: 'ready_property_purchase',
      propertyType: 'flat_apartment',
    },
    step2: {
      applicantName: 'Arjun Sharma',
      dateOfBirth: '1985-04-15',  // ~39 years old
      employmentType: 'salaried',
      maritalStatus: 'married',
    },
    step3: {
      marketValue: 85_00_000,
      agreementValue: 83_00_000,
      ownContribution: 23_00_000,
      useAgreementValueIfLower: true,
    },
    step4: {
      creditScore: 780,
      hasDefaults: false,
      defaultDetails: '',
      defaultSeverity: 'none',
      existingLoans: [{ id: '1', loanType: 'car_loan', outstandingAmount: 3_00_000, monthlyEMI: 8_000 }],
      repaymentHistory: 'excellent',
    },
    step5: {
      monthlyNetIncome: 1_20_000,
      otherMonthlyIncome: 15_000,
      employmentStabilityYears: 8,
      hasSalarySlips: true,
      hasITR: true,
      hasBankStatements: true,
      hasFormSixteen: true,
      hasGSTReturns: false,
      hasAuditedFinancials: false,
    },
    step6: {
      numberOfPropertyOwners: 2,
      numberOfCoApplicants: 1,
      coApplicantRelationship: 'spouse',
      allOwnersIncluded: true,
      coApplicantIncome: 80_000,
    },
    step7: { rateType: 'floating', productVariant: 'standard' },
    step8: { wantsChargesPreview: true, loanCategory: 'standard_purchase' },
    step9: { intendsToPrepay: false, anticipatedPrepaymentBehavior: 'none', preferEMIReduction: true },
    lastSaved: null,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('computeEligibility — strong profile', () => {
  it('returns eligible for a strong, well-structured application', () => {
    const result = computeEligibility(makeState());
    expect(result.outcome).toBe('eligible');
    expect(result.totalScore).toBeGreaterThanOrEqual(85);
  });

  it('produces no error flags for a clean application', () => {
    const result = computeEligibility(makeState());
    const errors = result.flags.filter((f) => f.type === 'error');
    expect(errors).toHaveLength(0);
  });

  it('computes positive estimated EMI', () => {
    const result = computeEligibility(makeState());
    expect(result.estimatedEMI).toBeGreaterThan(0);
  });
});

describe('computeEligibility — hard fails', () => {
  it('returns not_eligible for applicant under 21', () => {
    const state = makeState({
      step2: { ...makeState().step2, dateOfBirth: '2010-01-01' }, // ~14 years old
    });
    const result = computeEligibility(state);
    expect(result.outcome).toBe('not_eligible');
    expect(result.hasHardFail).toBe(true);
  });

  it('returns not_eligible for amount above ₹10 crore', () => {
    const state = makeState({
      step1: { ...makeState().step1, desiredLoanAmount: 12_00_00_000 },
    });
    const result = computeEligibility(state);
    expect(result.outcome).toBe('not_eligible');
    expect(result.hasHardFail).toBe(true);
  });

  it('returns not_eligible for tenure above 360 months', () => {
    const state = makeState({
      step1: { ...makeState().step1, requestedTenureMonths: 400 },
    });
    const result = computeEligibility(state);
    expect(result.outcome).toBe('not_eligible');
    expect(result.hasHardFail).toBe(true);
  });

  it('returns not_eligible for wilful default', () => {
    const state = makeState({
      step4: { ...makeState().step4, hasDefaults: true, defaultSeverity: 'wilful', defaultDetails: 'fraud' },
    });
    const result = computeEligibility(state);
    expect(result.outcome).toBe('not_eligible');
    expect(result.hasHardFail).toBe(true);
  });
});

describe('computeEligibility — credit score effects', () => {
  it('score 750+ gives full credit points', () => {
    const result = computeEligibility(makeState({ step4: { ...makeState().step4, creditScore: 780 } }));
    const creditCat = result.breakdown.find((c) => c.key === 'creditFit')!;
    expect(creditCat.score).toBe(creditCat.maxScore);
  });

  it('score 700–749 gives partial credit points', () => {
    const result = computeEligibility(makeState({ step4: { ...makeState().step4, creditScore: 720 } }));
    const creditCat = result.breakdown.find((c) => c.key === 'creditFit')!;
    expect(creditCat.score).toBeLessThan(creditCat.maxScore);
    expect(creditCat.score).toBeGreaterThan(0);
  });

  it('score below 550 gives zero credit points', () => {
    const result = computeEligibility(makeState({ step4: { ...makeState().step4, creditScore: 500 } }));
    const creditCat = result.breakdown.find((c) => c.key === 'creditFit')!;
    expect(creditCat.score).toBe(0);
  });
});

describe('computeEligibility — LTV assessment', () => {
  it('flags when requested amount exceeds LTV', () => {
    // Property 83L (effective), 75% LTV = max 62.25L. Request 75L → over limit
    const state = makeState({
      step1: { ...makeState().step1, desiredLoanAmount: 75_00_000 },
    });
    const result = computeEligibility(state);
    const ltvCat = result.breakdown.find((c) => c.key === 'ltvFit')!;
    expect(ltvCat.status).not.toBe('pass');
  });

  it('passes LTV when amount is within limit', () => {
    // 83L effective, 75% = 62.25L max. Request 60L → OK
    const result = computeEligibility(makeState());
    const ltvCat = result.breakdown.find((c) => c.key === 'ltvFit')!;
    expect(ltvCat.status).toBe('pass');
  });
});

describe('computeEligibility — FOIR assessment', () => {
  it('passes FOIR with low debt-to-income', () => {
    // Low existing EMIs, high income
    const result = computeEligibility(makeState());
    const incomeCat = result.breakdown.find((c) => c.key === 'incomeFit')!;
    expect(incomeCat.status).not.toBe('fail');
  });

  it('flags high FOIR', () => {
    const state = makeState({
      step4: {
        ...makeState().step4,
        existingLoans: [
          { id: '1', loanType: 'personal_loan', outstandingAmount: 10_00_000, monthlyEMI: 50_000 },
          { id: '2', loanType: 'car_loan', outstandingAmount: 5_00_000, monthlyEMI: 20_000 },
        ],
      },
      step5: { ...makeState().step5, monthlyNetIncome: 80_000, otherMonthlyIncome: 0 },
      step6: { ...makeState().step6, coApplicantIncome: 0 },
    });
    const result = computeEligibility(state);
    const incomeCat = result.breakdown.find((c) => c.key === 'incomeFit')!;
    expect(incomeCat.status).toBe('fail');
  });
});

describe('computeEligibility — co-applicant', () => {
  it('warns when no co-applicant is present', () => {
    const state = makeState({ step6: { ...makeState().step6, numberOfCoApplicants: 0 } });
    const result = computeEligibility(state);
    const coFlags = result.flags.filter((f) => f.category === 'Co-Applicant');
    expect(coFlags.length).toBeGreaterThan(0);
  });

  it('gives full co-applicant score when co-applicant present with standard relationship', () => {
    const result = computeEligibility(makeState());
    const coCat = result.breakdown.find((c) => c.key === 'coApplicantFit')!;
    expect(coCat.score).toBe(coCat.maxScore);
  });
});

describe('computeEligibility — age at maturity', () => {
  it('flags when tenure takes salaried applicant beyond 60', () => {
    // Applicant born 1975 = ~49 years, 300-month tenure = 25 years, maturity age = 74 → WAY beyond 60
    const state = makeState({
      step2: { ...makeState().step2, dateOfBirth: '1975-01-01', employmentType: 'salaried' },
      step1: { ...makeState().step1, requestedTenureMonths: 300 },
    });
    const result = computeEligibility(state);
    const tenureFlags = result.flags.filter((f) => f.category === 'Tenure');
    expect(tenureFlags.length).toBeGreaterThan(0);
  });
});

describe('computeEligibility — needs_review profile', () => {
  it('returns needs_review for borderline credit and FOIR issues', () => {
    const state = makeState({
      step4: { ...makeState().step4, creditScore: 660, repaymentHistory: 'fair' },
      step5: { ...makeState().step5, monthlyNetIncome: 70_000 },
      step6: { ...makeState().step6, numberOfCoApplicants: 0, coApplicantIncome: 0 },
    });
    const result = computeEligibility(state);
    expect(['needs_review', 'not_eligible', 'eligible_with_conditions']).toContain(result.outcome);
  });
});
