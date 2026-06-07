// Generic policy for banks without a specific config.
// Bank-specific policies (e.g. AXIS_LAP_POLICY) override these values.

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

// ─── Axis Finance LAP Policy (June 2025) ──────────────────────────────────────
// Source: LAP Policy OGL document — Loan Against Property, Product Policy &
// Operating Guidelines, Axis Finance Ltd.

export const AXIS_LAP_POLICY = {
  loanLimits: {
    minAmount: 50_000,              // ₹0.50 lakh minimum (all programs)
    maxAmount: 100_00_00_000,       // ₹100 crore (Normal Income program max)
    minTenureMonths: 12,
    maxTenureMonths: 240,           // 20 years standard; up to 25 yrs with deviation
  },

  // Max loan by underwriting program (in rupees)
  programLoanLimits: {
    normal_income:          100_00_00_000, // INR 1000 Lacs
    average_banking:         75_00_00_000, // INR 750 Lacs
    gst_program:             75_00_00_000, // INR 750 Lacs
    gross_margin:            75_00_00_000, // INR 750 Lacs
    gpr_doctors:             25_00_00_000, // INR 250 Lacs
    liquid_income:           30_00_00_000, // INR 300 Lacs
    repayment_track:         30_00_00_000, // INR 300 Lacs
    lease_rental_discounting:100_00_00_000, // INR 1000 Lacs
  },

  // City category caps
  cityLoanCaps: {
    metro_urban: 7_00_00_000,   // ₹7 Cr
    semi_urban:  5_00_00_000,   // ₹5 Cr
    rural:       3_00_00_000,   // ₹3 Cr
  },

  age: {
    minAge: 24,                             // Financial applicants (salaried & SE)
    minAgeNonFinancial: 18,                 // Non-financial co-applicants
    maxAgeNonFinancial: 75,
    salariedTypicalMaturityAge: 60,
    selfEmployedTypicalMaturityAge: 65,
    maturityAgeGraceYears: 2,
  },

  // LTV by property type (without insurance; SORP/SOCP +5%; Surrogate −5%)
  ltvByPropertyType: {
    lap_residential:     0.70,  // 70% — residential
    lap_commercial:      0.60,  // 60% — commercial / mixed usage
    lap_mixed_usage:     0.60,
    lap_plot:            0.60,  // 60% — plot (additional 5% if authority allotment)
    lap_special_usage:   0.55,  // 55% — special usage (school/industrial/hotel)
  },

  creditScore: {
    strongThreshold:     750,
    acceptableThreshold: 700,
    reviewThreshold:     650,
    hardFailThreshold:   600,   // Score < 600 → to be avoided (hard fail)
  },

  // FOIR for salaried (based on annual income band)
  foirSalaried: [
    { maxAnnualIncome: 6_00_000,   maxFOIR: 0.60 },  // Annual ≤ ₹6L → 60%
    { maxAnnualIncome: 12_00_000,  maxFOIR: 0.65 },  // ₹6L–12L → 65%
    { maxAnnualIncome: Infinity,   maxFOIR: 0.70 },  // > ₹12L → 70%
  ],

  // FOIR for self-employed (by program)
  foirSelfEmployed: {
    normal_income_low:           0.85, // Loan ≤ ₹300L, Normal Income
    normal_income_high:          0.80, // Loan > ₹300L, Normal Income
    gst_gmp_gpr_gtp:             0.75, // GST / GMP / GPR / GTP programs
    liquid_income:               0.70, // LIP program
    average_banking:             0.80, // ABB — derived from ABB/2 formula
    repayment_track:             0.80, // RTR
    lease_rental_discounting:    0.85, // LRD (based on rent receivables)
  },

  // Work experience minimums
  workExperience: {
    salariedCurrentJobYears:  1,
    salariedTotalYears:       2,
    selfEmployedYears:        3,
    nonIndividualYears:       3,
  },

  // Minimum monthly income
  minIncome: {
    salariedBankCredit:  15_000,
    salariedCash:        10_000,
    selfEmployed:        15_000,  // Combined total
  },

  interestRates: {
    floating: { min: 11.00, max: 14.00 }, // Indicative LAP rates
    fixed:    { rate: 15.00 },
    defaultEstimateRate: 12.00,
  },

  processingFee: {
    minPercent: 1.0,
    maxPercent: 2.0,
    gstRatePercent: 18,
  },

  prepayment: {
    floatingIndividualNilCharges: true,
    otherCasesChargePercent: 2,
    minEMIsBeforePrepayment: 12,
    maxPrepaymentPerYear: 2,
    maxPrepaymentPercentOfPrincipal: 25,
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
    productFitWeight: 0,
    thresholds: {
      eligible:                 85,
      eligible_with_conditions: 65,
      needs_review:             40,
    },
  },

  documents: {
    salaried:     ['hasSalarySlips', 'hasBankStatements'],
    self_employed: ['hasITR', 'hasBankStatements', 'hasAuditedFinancials'],
  },

  coApplicant: {
    mandatoryWarning: true,
    allOwnersRequired: true,  // Policy: all property owners must be co-borrowers
    acceptedRelationships: ['spouse', 'parent', 'son_daughter', 'sibling'],
  },

  // Prohibitive profiles (hard-fail)
  prohibitiveProfiles: [
    'nri',          // NRI customers not eligible
    'negative',     // Negative profile list
  ],
} as const;

export type AxisLAPPolicyType = typeof AXIS_LAP_POLICY;
