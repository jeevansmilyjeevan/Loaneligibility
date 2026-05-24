// ─── Enumerations ─────────────────────────────────────────────────────────────

export type EmploymentType = 'salaried' | 'self_employed';

export type LoanPurpose =
  | 'ready_property_purchase'
  | 'under_construction_purchase'
  | 'self_construction'
  | 'plot_construction'
  | 'home_renovation'
  | 'home_extension'
  | 'balance_transfer'
  | 'top_up';

export type PropertyType =
  | 'flat_apartment'
  | 'villa'
  | 'independent_house'
  | 'residential_plot';

export type RateType = 'floating' | 'fixed';

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | '';

export type DefaultSeverity = 'none' | 'minor' | 'major' | 'wilful';

export type RepaymentHistory = 'excellent' | 'good' | 'fair' | 'poor' | '';

export type PrepaymentBehavior = 'none' | 'occasional' | 'frequent' | '';

export type LoanCategory = 'standard_purchase' | 'balance_transfer' | 'top_up' | '';

export type CoApplicantRelationship =
  | 'spouse'
  | 'parent'
  | 'son_daughter'
  | 'sibling'
  | 'other'
  | '';

export type EligibilityOutcome =
  | 'eligible'
  | 'eligible_with_conditions'
  | 'needs_review'
  | 'not_eligible';

// ─── Step Data Interfaces ─────────────────────────────────────────────────────

export interface Step1Data {
  selectedBank: string;
  selectedPlan: string;
  desiredLoanAmount: number | '';
  requestedTenureMonths: number | '';
  loanPurpose: LoanPurpose | '';
  propertyType: PropertyType | '';
  // KYC / Identity docs
  hasAadhaar: boolean;
  hasPAN: boolean;
  hasAddressProof: boolean;
  // Property docs
  hasSaleAgreement: boolean;
  hasTitleDeed: boolean;
  hasBuildingApproval: boolean;
}

export interface Step2Data {
  applicantName: string;
  dateOfBirth: string;
  employmentType: EmploymentType | '';
  maritalStatus: MaritalStatus;
}

export interface Step3Data {
  marketValue: number | '';
  agreementValue: number | '';
  ownContribution: number | '';
  useAgreementValueIfLower: boolean;
}

export interface ExistingLoan {
  id: string;
  loanType: string;
  outstandingAmount: number;
  monthlyEMI: number;
}

export interface Step4Data {
  creditScore: number | '';
  hasDefaults: boolean;
  defaultDetails: string;
  defaultSeverity: DefaultSeverity;
  existingLoans: ExistingLoan[];
  repaymentHistory: RepaymentHistory;
}

export interface Step5Data {
  monthlyNetIncome: number | '';
  otherMonthlyIncome: number | '';
  employmentStabilityYears: number | '';
  hasSalarySlips: boolean;
  hasITR: boolean;
  hasBankStatements: boolean;
  hasFormSixteen: boolean;
  hasGSTReturns: boolean;
  hasAuditedFinancials: boolean;
}

export interface Step6Data {
  numberOfPropertyOwners: number;
  numberOfCoApplicants: number;
  coApplicantRelationship: CoApplicantRelationship;
  allOwnersIncluded: boolean;
  coApplicantIncome: number | '';
}

export interface Step7Data {
  rateType: RateType | '';
  productVariant: string;
}

export interface Step8Data {
  wantsChargesPreview: boolean;
  loanCategory: LoanCategory;
}

export interface Step9Data {
  intendsToPrepay: boolean;
  anticipatedPrepaymentBehavior: PrepaymentBehavior;
  preferEMIReduction: boolean;
}

// ─── Wizard State ─────────────────────────────────────────────────────────────

export interface WizardState {
  currentStep: number;
  completedSteps: Set<number>;
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
  step6: Step6Data;
  step7: Step7Data;
  step8: Step8Data;
  step9: Step9Data;
  lastSaved: string | null;
}

// ─── Eligibility Engine Types ─────────────────────────────────────────────────

export type FlagType = 'error' | 'warning' | 'info';

export interface EligibilityFlag {
  type: FlagType;
  category: string;
  message: string;
}

export type CategoryKey =
  | 'amountFit'
  | 'tenureFit'
  | 'ltvFit'
  | 'ageFit'
  | 'creditFit'
  | 'incomeFit'
  | 'coApplicantFit'
  | 'productFit';

export interface CategoryScore {
  key: CategoryKey;
  label: string;
  score: number;
  maxScore: number;
  status: 'pass' | 'warning' | 'fail';
  notes: string[];
}

export interface EligibilityResult {
  outcome: EligibilityOutcome;
  totalScore: number;
  breakdown: CategoryScore[];
  flags: EligibilityFlag[];
  maxLoanAmount: number;
  recommendedTenureMonths: number;
  estimatedEMI: number;
  interestRateRange: { min: number; max: number };
  ltvPercent: number;
  foirPercent: number;
  ageAtMaturity: number;
  hasHardFail: boolean;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type StepErrors = Record<string, string>;

// ─── Computed Helpers ─────────────────────────────────────────────────────────

export interface LTVBand {
  maxPropertyValue: number;
  maxLTV: number;
}
