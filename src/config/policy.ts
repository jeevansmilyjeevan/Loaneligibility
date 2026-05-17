// Single source of truth for all policy thresholds.
// Change values here without touching any other business logic file.

export const POLICY = {
  loanLimits: {
    minAmount: 100_000,           // ₹1 lakh minimum
    maxAmount: 10_00_00_000,      // ₹10 crore
    minTenureMonths: 12,
    maxTenureMonths: 360,         // 30 years
  },

  age: {
    minAge: 21,
    salariedTypicalMaturityAge: 60,
    selfEmployedTypicalMaturityAge: 65,
    // Warn when maturity age exceeds these by this many years
    maturityAgeGraceYears: 3,
  },

  ltvBands: [
    { maxPropertyValue: 30_00_000,  maxLTV: 0.90 },   // ≤ ₹30 lakh → 90%
    { maxPropertyValue: 75_00_000,  maxLTV: 0.80 },   // ≤ ₹75 lakh → 80%
    { maxPropertyValue: Infinity,   maxLTV: 0.75 },   // > ₹75 lakh → 75%
  ],

  creditScore: {
    strongThreshold: 750,
    acceptableThreshold: 700,
    reviewThreshold: 650,
    // No hard minimum is published; scores below reviewThreshold → needs_review
    // Scores below hardFailThreshold with major defaults → not_eligible candidate
    hardFailThreshold: 550,
  },

  foir: {
    salaried: {
      ideal: 0.40,
      acceptable: 0.50,
      max: 0.60,
    },
    self_employed: {
      ideal: 0.40,
      acceptable: 0.55,
      max: 0.65,
    },
  },

  interestRates: {
    floating: { min: 8.00, max: 9.15 },
    fixed:    { rate: 14.00 },
    // Mid-point used for EMI estimation when rateType is unknown
    defaultEstimateRate: 8.75,
  },

  processingFee: {
    minPercent: 1.0,
    maxPercent: 2.0,
    gstRatePercent: 18,
  },

  prepayment: {
    floatingIndividualNilCharges: true,
    // For Home Loan / Affordable HL — 2% + taxes
    otherCasesChargePercent: 2,
    minEMIsBeforePrepayment: 12,
    maxPrepaymentPerYear: 2,                // twice per financial year
    maxPrepaymentPercentOfPrincipal: 25,    // 25% of outstanding
  },

  scoring: {
    categoryWeights: {
      amountFit:      15,
      tenureFit:      10,
      ltvFit:         15,
      ageFit:         15,
      creditFit:      20,
      incomeFit:      15,
      coApplicantFit: 10,
    },
    // productFit is informational (no eligibility impact by default)
    productFitWeight: 0,

    // Score → outcome mapping
    thresholds: {
      eligible:                 85,
      eligible_with_conditions: 65,
      needs_review:             40,
      // below 40 → not_eligible
    },
  },

  documents: {
    salaried: ['hasSalarySlips', 'hasITR', 'hasBankStatements', 'hasFormSixteen'],
    self_employed: ['hasITR', 'hasBankStatements', 'hasGSTReturns', 'hasAuditedFinancials'],
  },

  coApplicant: {
    // Policy says co-applicant is generally mandatory — warn if absent, don't hard-fail
    mandatoryWarning: true,
    acceptedRelationships: ['spouse', 'parent', 'son_daughter', 'sibling'],
  },
} as const;

export type PolicyType = typeof POLICY;
