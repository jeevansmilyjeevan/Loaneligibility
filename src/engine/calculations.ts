import { POLICY } from '../config/policy';
import type { LTVBand } from '../types';
import { parseNum } from '../utils/formatters';

// ─── EMI ─────────────────────────────────────────────────────────────────────

export function calculateEMI(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number,
): number {
  if (principal <= 0 || tenureMonths <= 0 || annualRatePercent <= 0) return 0;
  const r = annualRatePercent / 12 / 100;
  const n = tenureMonths;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ─── LTV ─────────────────────────────────────────────────────────────────────

export function getLTVBand(propertyValue: number): LTVBand {
  for (const band of POLICY.ltvBands) {
    if (propertyValue <= band.maxPropertyValue) return band;
  }
  return POLICY.ltvBands[POLICY.ltvBands.length - 1];
}

export function getMaxLoanByLTV(effectivePropertyValue: number): number {
  const band = getLTVBand(effectivePropertyValue);
  return effectivePropertyValue * band.maxLTV;
}

export function getEffectivePropertyValue(
  marketValue: number,
  agreementValue: number,
  useAgreementIfLower: boolean,
): number {
  if (useAgreementIfLower && agreementValue > 0) {
    return Math.min(marketValue, agreementValue);
  }
  return marketValue;
}

export function calcLTVPercent(loanAmount: number, propertyValue: number): number {
  if (propertyValue <= 0) return 0;
  return loanAmount / propertyValue;
}

// ─── FOIR ─────────────────────────────────────────────────────────────────────

export function calcFOIR(totalEMIs: number, totalIncome: number): number {
  if (totalIncome <= 0) return 0;
  return totalEMIs / totalIncome;
}

// ─── Age ──────────────────────────────────────────────────────────────────────

export function calcAgeAtMaturity(currentAge: number, tenureMonths: number): number {
  return currentAge + tenureMonths / 12;
}

export function getTypicalMaturityAge(employmentType: string): number {
  return employmentType === 'salaried'
    ? POLICY.age.salariedTypicalMaturityAge
    : POLICY.age.selfEmployedTypicalMaturityAge;
}

// ─── Max Eligible Amount ──────────────────────────────────────────────────────

// Repayment capacity: how much can they borrow given income and FOIR?
export function calcMaxLoanByRepaymentCapacity(
  totalMonthlyIncome: number,
  existingEMIs: number,
  employmentType: string,
  annualRatePercent: number,
  tenureMonths: number,
): number {
  const foirConfig =
    employmentType === 'salaried'
      ? POLICY.foir.salaried
      : POLICY.foir.self_employed;
  const maxAllowedEMI = totalMonthlyIncome * foirConfig.max - existingEMIs;
  if (maxAllowedEMI <= 0) return 0;
  // Reverse-engineer max principal from max EMI
  const r = annualRatePercent / 12 / 100;
  const n = tenureMonths;
  if (r === 0) return maxAllowedEMI * n;
  return (maxAllowedEMI * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
}

// ─── Processing Fee ───────────────────────────────────────────────────────────

export function calcProcessingFee(loanAmount: number): { min: number; max: number; minWithGST: number; maxWithGST: number } {
  const min = loanAmount * (POLICY.processingFee.minPercent / 100);
  const max = loanAmount * (POLICY.processingFee.maxPercent / 100);
  const gst = POLICY.processingFee.gstRatePercent / 100;
  return { min, max, minWithGST: min * (1 + gst), maxWithGST: max * (1 + gst) };
}

// ─── Prepayment savings ───────────────────────────────────────────────────────

export function calcPrepaymentSavings(
  currentOutstanding: number,
  prepayAmount: number,
  annualRatePercent: number,
  remainingMonths: number,
): { newEMI: number; savedMonths: number; savedInterest: number } {
  const newPrincipal = Math.max(0, currentOutstanding - prepayAmount);
  const origEMI = calculateEMI(currentOutstanding, annualRatePercent, remainingMonths);
  const newEMI = calculateEMI(newPrincipal, annualRatePercent, remainingMonths);
  const savedInterest = origEMI * remainingMonths - newEMI * remainingMonths;
  return { newEMI, savedMonths: 0, savedInterest };
}

// ─── Dummy export to keep parseNum import used ─────────────────────────────-
export { parseNum };
