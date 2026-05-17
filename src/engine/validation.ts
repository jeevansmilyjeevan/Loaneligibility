import { POLICY } from '../config/policy';
import type {
  Step1Data, Step2Data, Step3Data, Step4Data,
  Step5Data, Step6Data, Step7Data, Step8Data, Step9Data,
  StepErrors,
} from '../types';
import { calcAge, parseNum } from '../utils/formatters';

type Validator<T> = (data: T) => StepErrors;

// ─── Step 1 ───────────────────────────────────────────────────────────────────
export const validateStep1: Validator<Step1Data> = (d) => {
  const errors: StepErrors = {};
  const amount = parseNum(d.desiredLoanAmount);
  const tenure = parseNum(d.requestedTenureMonths);

  if (amount <= 0) {
    errors.desiredLoanAmount = 'Please enter a valid loan amount.';
  } else if (amount < POLICY.loanLimits.minAmount) {
    errors.desiredLoanAmount = `Minimum loan amount is ₹${(POLICY.loanLimits.minAmount / 1_00_000).toFixed(0)} lakh.`;
  } else if (amount > POLICY.loanLimits.maxAmount) {
    errors.desiredLoanAmount = `Maximum sanctioned amount is ₹10 crore.`;
  }

  if (tenure <= 0) {
    errors.requestedTenureMonths = 'Please enter a valid tenure.';
  } else if (tenure < POLICY.loanLimits.minTenureMonths) {
    errors.requestedTenureMonths = `Minimum tenure is ${POLICY.loanLimits.minTenureMonths} months.`;
  } else if (tenure > POLICY.loanLimits.maxTenureMonths) {
    errors.requestedTenureMonths = `Maximum tenure is ${POLICY.loanLimits.maxTenureMonths} months (30 years).`;
  }

  if (!d.loanPurpose) errors.loanPurpose = 'Please select a loan purpose.';
  if (!d.propertyType) errors.propertyType = 'Please select a property type.';

  return errors;
};

// ─── Step 2 ───────────────────────────────────────────────────────────────────
export const validateStep2: Validator<Step2Data> = (d) => {
  const errors: StepErrors = {};

  if (!d.applicantName.trim()) {
    errors.applicantName = 'Applicant name is required.';
  }

  if (!d.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required.';
  } else {
    const age = calcAge(d.dateOfBirth);
    if (age < POLICY.age.minAge) {
      errors.dateOfBirth = `Applicant must be at least ${POLICY.age.minAge} years old.`;
    }
    if (age > 80) {
      errors.dateOfBirth = 'Please verify the date of birth entered.';
    }
  }

  if (!d.employmentType) errors.employmentType = 'Please select employment type.';

  return errors;
};

// ─── Step 3 ───────────────────────────────────────────────────────────────────
export const validateStep3: Validator<Step3Data> = (d) => {
  const errors: StepErrors = {};
  const mv = parseNum(d.marketValue);
  const contrib = parseNum(d.ownContribution);

  if (mv <= 0) errors.marketValue = 'Please enter the property market value.';

  if (contrib < 0) errors.ownContribution = 'Down payment cannot be negative.';
  if (mv > 0 && contrib >= mv) {
    errors.ownContribution = 'Down payment cannot be equal to or exceed property value.';
  }

  return errors;
};

// ─── Step 4 ───────────────────────────────────────────────────────────────────
export const validateStep4: Validator<Step4Data> = (d) => {
  const errors: StepErrors = {};
  const score = parseNum(d.creditScore);

  if (score <= 0) {
    errors.creditScore = 'Please enter your credit score.';
  } else if (score < 300 || score > 900) {
    errors.creditScore = 'Credit score must be between 300 and 900.';
  }

  if (d.hasDefaults && !d.defaultDetails.trim()) {
    errors.defaultDetails = 'Please provide brief details about the default.';
  }

  if (!d.repaymentHistory) errors.repaymentHistory = 'Please select your repayment history.';

  for (const loan of d.existingLoans) {
    if (loan.monthlyEMI < 0) {
      errors.existingLoans = 'EMI values cannot be negative.';
      break;
    }
  }

  return errors;
};

// ─── Step 5 ───────────────────────────────────────────────────────────────────
export const validateStep5: Validator<Step5Data> = (d) => {
  const errors: StepErrors = {};
  const income = parseNum(d.monthlyNetIncome);

  if (income <= 0) errors.monthlyNetIncome = 'Monthly net income must be greater than zero.';
  if (parseNum(d.otherMonthlyIncome) < 0) errors.otherMonthlyIncome = 'Income cannot be negative.';
  if (parseNum(d.employmentStabilityYears) < 0) {
    errors.employmentStabilityYears = 'Employment stability cannot be negative.';
  }

  return errors;
};

// ─── Step 6 ───────────────────────────────────────────────────────────────────
export const validateStep6: Validator<Step6Data> = (d) => {
  const errors: StepErrors = {};

  if (d.numberOfPropertyOwners < 1) errors.numberOfPropertyOwners = 'At least 1 owner required.';
  if (d.numberOfCoApplicants < 0) errors.numberOfCoApplicants = 'Cannot be negative.';

  if (parseNum(d.coApplicantIncome) < 0) {
    errors.coApplicantIncome = 'Co-applicant income cannot be negative.';
  }

  return errors;
};

// ─── Step 7 ───────────────────────────────────────────────────────────────────
export const validateStep7: Validator<Step7Data> = (d) => {
  const errors: StepErrors = {};
  if (!d.rateType) errors.rateType = 'Please select a rate type.';
  return errors;
};

// ─── Step 8 — informational only ──────────────────────────────────────────────
export const validateStep8: Validator<Step8Data> = (_d) => ({});

// ─── Step 9 — informational only ──────────────────────────────────────────────
export const validateStep9: Validator<Step9Data> = (_d) => ({});

// ─── Step validator map ───────────────────────────────────────────────────────
// Used by the wizard to validate before advancing
export const STEP_VALIDATORS = [
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  validateStep6,
  validateStep7,
  validateStep8,
  validateStep9,
] as const;
