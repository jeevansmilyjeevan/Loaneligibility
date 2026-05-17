import { POLICY } from '../config/policy';
import type {
  WizardState,
  EligibilityResult,
  EligibilityFlag,
  CategoryScore,
  EligibilityOutcome,
  CategoryKey,
} from '../types';
import {
  calculateEMI,
  getEffectivePropertyValue,
  getMaxLoanByLTV,
  getLTVBand,
  calcLTVPercent,
  calcFOIR,
  calcAgeAtMaturity,
  getTypicalMaturityAge,
} from './calculations';
import { calcAge, parseNum } from '../utils/formatters';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flag(type: EligibilityFlag['type'], category: string, message: string): EligibilityFlag {
  return { type, category, message };
}

function score(
  key: CategoryKey,
  label: string,
  earned: number,
  max: number,
  notes: string[],
): CategoryScore {
  const pct = max === 0 ? 1 : earned / max;
  const status = pct >= 0.8 ? 'pass' : pct >= 0.4 ? 'warning' : 'fail';
  return { key, label, score: Math.round(earned), maxScore: max, status, notes };
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function computeEligibility(state: WizardState): EligibilityResult {
  const { step1, step2, step3, step4, step5, step6, step7 } = state;
  const weights = POLICY.scoring.categoryWeights;
  const flags: EligibilityFlag[] = [];
  const breakdown: CategoryScore[] = [];
  let hasHardFail = false;

  // ── Derived values ────────────────────────────────────────────────────────

  const loanAmount = parseNum(step1.desiredLoanAmount);
  const tenureMonths = parseNum(step1.requestedTenureMonths);
  const currentAge = step2.dateOfBirth ? calcAge(step2.dateOfBirth) : 0;
  const empType = step2.employmentType || 'salaried';
  const marketValue = parseNum(step3.marketValue);
  const agreementValue = parseNum(step3.agreementValue);
  const ownContrib = parseNum(step3.ownContribution);
  const creditScore = parseNum(step4.creditScore);
  const netIncome = parseNum(step5.monthlyNetIncome);
  const otherIncome = parseNum(step5.otherMonthlyIncome);
  const coIncome = parseNum(step6.coApplicantIncome);
  const totalIncome = netIncome + otherIncome + coIncome;
  const existingEMIs = step4.existingLoans.reduce((s, l) => s + l.monthlyEMI, 0);
  const effectivePropValue = getEffectivePropertyValue(marketValue, agreementValue, step3.useAgreementValueIfLower);
  const maxLoanByLTV = getMaxLoanByLTV(effectivePropValue);
  const ltvPercent = calcLTVPercent(loanAmount, effectivePropValue);
  const ageAtMaturity = calcAgeAtMaturity(currentAge, tenureMonths);
  const typicalMaturityAge = getTypicalMaturityAge(empType);
  const rateType = step7.rateType || 'floating';
  const estimateRate =
    rateType === 'fixed'
      ? POLICY.interestRates.fixed.rate
      : POLICY.interestRates.defaultEstimateRate;
  const estimatedEMI = calculateEMI(loanAmount, estimateRate, tenureMonths);
  const totalEMIWithNew = existingEMIs + estimatedEMI;
  const foirPercent = calcFOIR(totalEMIWithNew, totalIncome);
  const foirConfig = empType === 'salaried' ? POLICY.foir.salaried : POLICY.foir.self_employed;
  const ltvBand = getLTVBand(effectivePropValue);

  // ── 1. Amount Fit (15 pts) ────────────────────────────────────────────────

  const amountNotes: string[] = [];
  let amountScore = 0;

  if (loanAmount <= 0) {
    amountNotes.push('Loan amount not provided.');
    hasHardFail = true;
    flags.push(flag('error', 'Amount', 'Loan amount must be greater than zero.'));
  } else if (loanAmount > POLICY.loanLimits.maxAmount) {
    amountNotes.push('Requested amount exceeds ₹10 crore maximum.');
    hasHardFail = true;
    flags.push(flag('error', 'Amount', 'Requested loan amount exceeds the maximum sanctioned limit of ₹10 crore.'));
  } else {
    const overage = loanAmount - maxLoanByLTV;
    if (overage <= 0) {
      amountScore = weights.amountFit;
      amountNotes.push(`Requested amount is within the LTV-allowed limit of ₹${(maxLoanByLTV / 1_00_000).toFixed(1)}L.`);
    } else if (overage / maxLoanByLTV <= 0.1) {
      amountScore = Math.round(weights.amountFit * 0.65);
      amountNotes.push('Requested amount slightly exceeds LTV-allowed funding — may need higher down payment.');
      flags.push(flag('warning', 'Amount', `Requested amount is ₹${(overage / 1_00_000).toFixed(1)}L above LTV ceiling. Additional down payment may be required.`));
    } else {
      amountScore = Math.round(weights.amountFit * 0.2);
      amountNotes.push('Requested amount significantly exceeds LTV funding limit.');
      flags.push(flag('error', 'Amount', `Requested amount exceeds LTV-allowed maximum (₹${(maxLoanByLTV / 1_00_000).toFixed(1)}L). Reduce loan or increase down payment.`));
    }
  }

  breakdown.push(score('amountFit', 'Amount Fit', amountScore, weights.amountFit, amountNotes));

  // ── 2. Tenure Fit (10 pts) ────────────────────────────────────────────────

  const tenureNotes: string[] = [];
  let tenureScore = 0;

  if (tenureMonths <= 0) {
    tenureNotes.push('Tenure not provided.');
    flags.push(flag('error', 'Tenure', 'Please provide a valid loan tenure.'));
  } else if (tenureMonths > POLICY.loanLimits.maxTenureMonths) {
    tenureNotes.push('Requested tenure exceeds 30-year maximum.');
    hasHardFail = true;
    flags.push(flag('error', 'Tenure', 'Maximum tenure is 360 months (30 years).'));
  } else {
    const gracePeriod = POLICY.age.maturityAgeGraceYears;
    if (ageAtMaturity <= typicalMaturityAge) {
      tenureScore = weights.tenureFit;
      tenureNotes.push(`At maturity, age will be ${ageAtMaturity.toFixed(1)} — within the typical ${typicalMaturityAge}-year ceiling.`);
    } else if (ageAtMaturity <= typicalMaturityAge + gracePeriod) {
      tenureScore = Math.round(weights.tenureFit * 0.7);
      tenureNotes.push(`Age at maturity (${ageAtMaturity.toFixed(1)}) slightly exceeds typical limit — lender may require tenure reduction.`);
      flags.push(flag('warning', 'Tenure', `Loan would mature when applicant is ${ageAtMaturity.toFixed(0)} — just beyond the typical ${typicalMaturityAge}-year ceiling. Lender may reduce tenure.`));
    } else {
      tenureScore = Math.round(weights.tenureFit * 0.3);
      tenureNotes.push(`Age at maturity (${ageAtMaturity.toFixed(1)}) substantially exceeds typical retirement age — tenure reduction likely.`);
      flags.push(flag('error', 'Tenure', `Applicant would be ${ageAtMaturity.toFixed(0)} at loan maturity. Lender will likely cap tenure so the loan closes by age ${typicalMaturityAge}.`));
    }
  }

  breakdown.push(score('tenureFit', 'Tenure Fit', tenureScore, weights.tenureFit, tenureNotes));

  // ── 3. LTV Fit (15 pts) ───────────────────────────────────────────────────

  const ltvNotes: string[] = [];
  let ltvScore = 0;

  if (effectivePropValue <= 0) {
    ltvNotes.push('Property value not provided.');
    flags.push(flag('error', 'LTV', 'Property value is required to assess LTV.'));
  } else {
    const maxLTV = ltvBand.maxLTV;
    ltvNotes.push(`LTV band: up to ${(maxLTV * 100).toFixed(0)}% for properties ≤ ₹${ltvBand.maxPropertyValue === Infinity ? '75L+' : (ltvBand.maxPropertyValue / 1_00_000).toFixed(0) + 'L'}.`);

    if (ltvPercent <= maxLTV) {
      ltvScore = weights.ltvFit;
      ltvNotes.push(`Current LTV ${(ltvPercent * 100).toFixed(1)}% is within the allowed ${(maxLTV * 100).toFixed(0)}% band.`);
    } else if (ltvPercent <= maxLTV + 0.05) {
      ltvScore = Math.round(weights.ltvFit * 0.5);
      ltvNotes.push(`LTV ${(ltvPercent * 100).toFixed(1)}% slightly exceeds the ${(maxLTV * 100).toFixed(0)}% limit.`);
      flags.push(flag('warning', 'LTV', `LTV of ${(ltvPercent * 100).toFixed(1)}% marginally exceeds the allowed ${(maxLTV * 100).toFixed(0)}%. A higher down payment will be required.`));
    } else {
      ltvScore = 0;
      ltvNotes.push(`LTV ${(ltvPercent * 100).toFixed(1)}% significantly exceeds the ${(maxLTV * 100).toFixed(0)}% limit.`);
      flags.push(flag('error', 'LTV', `LTV of ${(ltvPercent * 100).toFixed(1)}% is above the ${(maxLTV * 100).toFixed(0)}% limit for this property value. Substantial additional down payment needed.`));
    }

    // Down payment check
    const impliedLoan = effectivePropValue - ownContrib;
    if (ownContrib > 0 && impliedLoan > maxLoanByLTV) {
      flags.push(flag('info', 'LTV', `Own contribution of ₹${(ownContrib / 1_00_000).toFixed(1)}L implies a loan of ₹${(impliedLoan / 1_00_000).toFixed(1)}L — verify requested amount matches contribution plan.`));
    }
  }

  breakdown.push(score('ltvFit', 'LTV Fit', ltvScore, weights.ltvFit, ltvNotes));

  // ── 4. Age Fit (15 pts) ───────────────────────────────────────────────────

  const ageNotes: string[] = [];
  let ageScore = 0;

  if (currentAge < POLICY.age.minAge) {
    ageNotes.push(`Age ${currentAge} is below the minimum of ${POLICY.age.minAge}.`);
    hasHardFail = true;
    flags.push(flag('error', 'Age', `Applicant must be at least ${POLICY.age.minAge} years old. Current age: ${currentAge}.`));
  } else if (currentAge >= 21 && currentAge <= 30) {
    ageScore = Math.round(weights.ageFit * 0.9);
    ageNotes.push('Young applicant — strong tenure flexibility.');
  } else if (currentAge > 30 && currentAge <= 45) {
    ageScore = weights.ageFit;
    ageNotes.push('Prime age range — optimal balance of income stability and tenure.');
  } else if (currentAge > 45 && currentAge <= 55) {
    ageScore = Math.round(weights.ageFit * 0.75);
    ageNotes.push('Tenure may be limited by retirement age consideration.');
    flags.push(flag('info', 'Age', `At age ${currentAge}, available tenure before ${typicalMaturityAge} is ${typicalMaturityAge - currentAge} years. Lender may cap tenure accordingly.`));
  } else {
    ageScore = Math.round(weights.ageFit * 0.4);
    ageNotes.push('Age significantly limits available tenure.');
    flags.push(flag('warning', 'Age', `At age ${currentAge}, maximum practical tenure is around ${Math.max(0, typicalMaturityAge - currentAge)} years. Repayment capacity must be strong.`));
  }

  breakdown.push(score('ageFit', 'Age Fit', ageScore, weights.ageFit, ageNotes));

  // ── 5. Credit Fit (20 pts) ────────────────────────────────────────────────

  const creditNotes: string[] = [];
  let creditScore2 = 0;

  if (creditScore <= 0) {
    creditNotes.push('Credit score not provided — will be treated as needs review.');
    flags.push(flag('warning', 'Credit', 'No credit score provided. A CIBIL/bureau score is required for assessment.'));
  } else if (step4.defaultSeverity === 'wilful') {
    creditScore2 = 0;
    hasHardFail = true;
    creditNotes.push('Wilful default flagged — application cannot proceed automatically.');
    flags.push(flag('error', 'Credit', 'A wilful default or fraud flag is recorded. This is a disqualifying event and requires mandatory manual review.'));
  } else if (step4.defaultSeverity === 'major') {
    creditScore2 = Math.round(weights.creditFit * 0.1);
    creditNotes.push('Major default or write-off in credit history — significant risk flag.');
    flags.push(flag('error', 'Credit', 'A major default, settlement, or 90+ DPD is recorded. Lender will require detailed explanation and may decline.'));
  } else {
    // Score-based scoring
    if (creditScore >= POLICY.creditScore.strongThreshold) {
      creditScore2 = weights.creditFit;
      creditNotes.push(`Credit score ${creditScore} — Strong profile (750+). Qualifies for best pricing.`);
    } else if (creditScore >= POLICY.creditScore.acceptableThreshold) {
      creditScore2 = Math.round(weights.creditFit * 0.75);
      creditNotes.push(`Credit score ${creditScore} — Acceptable profile (700–749). Standard approval expected.`);
      flags.push(flag('info', 'Credit', `Score of ${creditScore} is acceptable. A 750+ score would improve rate pricing.`));
    } else if (creditScore >= POLICY.creditScore.reviewThreshold) {
      creditScore2 = Math.round(weights.creditFit * 0.45);
      creditNotes.push(`Credit score ${creditScore} — Below acceptable threshold. Needs review.`);
      flags.push(flag('warning', 'Credit', `Score of ${creditScore} is below the 700 threshold. Lender will scrutinise credit history carefully.`));
    } else if (creditScore >= POLICY.creditScore.hardFailThreshold) {
      creditScore2 = Math.round(weights.creditFit * 0.2);
      creditNotes.push(`Credit score ${creditScore} — Low score. Likely needs review or specialist product.`);
      flags.push(flag('error', 'Credit', `Score of ${creditScore} is significantly below typical acceptance bands. Approval is uncertain.`));
    } else {
      creditScore2 = 0;
      creditNotes.push(`Credit score ${creditScore} — Very low. Very unlikely to meet policy.`);
      flags.push(flag('error', 'Credit', `Score of ${creditScore} is below 550. This profile is very unlikely to qualify under standard policy.`));
    }

    // Repayment history modifier
    if (step4.repaymentHistory === 'poor' && creditScore2 > 0) {
      creditScore2 = Math.round(creditScore2 * 0.7);
      creditNotes.push('Poor repayment history further reduces credit score.');
      flags.push(flag('warning', 'Credit', 'Self-declared repayment history is poor. Bureau report will be reviewed carefully.'));
    } else if (step4.repaymentHistory === 'fair' && creditScore2 > 0) {
      creditScore2 = Math.round(creditScore2 * 0.85);
      creditNotes.push('Fair repayment history noted.');
    }

    // Minor defaults
    if (step4.defaultSeverity === 'minor') {
      creditScore2 = Math.round(creditScore2 * 0.85);
      creditNotes.push('Minor default/delay noted — resolved items will be assessed case by case.');
      flags.push(flag('info', 'Credit', 'Minor default noted. Resolved delinquencies may still be acceptable if score is sufficient.'));
    }
  }

  breakdown.push(score('creditFit', 'Credit Fit', creditScore2, weights.creditFit, creditNotes));

  // ── 6. Income / FOIR Fit (15 pts) ─────────────────────────────────────────

  const incomeNotes: string[] = [];
  let incomeScore = 0;

  if (totalIncome <= 0) {
    incomeNotes.push('Income data not provided.');
    flags.push(flag('error', 'Income', 'Monthly income is required to assess repayment capacity.'));
  } else {
    incomeNotes.push(`Total monthly income: ₹${(totalIncome / 1000).toFixed(1)}K. Existing EMIs: ₹${(existingEMIs / 1000).toFixed(1)}K. New EMI estimate: ₹${(estimatedEMI / 1000).toFixed(1)}K.`);
    incomeNotes.push(`FOIR (including new EMI): ${(foirPercent * 100).toFixed(1)}%.`);

    if (foirPercent <= foirConfig.ideal) {
      incomeScore = weights.incomeFit;
      incomeNotes.push(`FOIR is well within the ideal ${(foirConfig.ideal * 100).toFixed(0)}% threshold.`);
    } else if (foirPercent <= foirConfig.acceptable) {
      incomeScore = Math.round(weights.incomeFit * 0.8);
      incomeNotes.push(`FOIR is within the acceptable ${(foirConfig.acceptable * 100).toFixed(0)}% threshold.`);
    } else if (foirPercent <= foirConfig.max) {
      incomeScore = Math.round(weights.incomeFit * 0.55);
      incomeNotes.push(`FOIR is elevated but within the maximum ${(foirConfig.max * 100).toFixed(0)}% threshold.`);
      flags.push(flag('warning', 'Income', `FOIR of ${(foirPercent * 100).toFixed(1)}% is high. Lender may ask for income documentation to verify net disposable income.`));
    } else {
      incomeScore = Math.round(weights.incomeFit * 0.15);
      incomeNotes.push(`FOIR of ${(foirPercent * 100).toFixed(1)}% exceeds the maximum threshold — repayment capacity is insufficient for the requested EMI.`);
      flags.push(flag('error', 'Income', `FOIR of ${(foirPercent * 100).toFixed(1)}% exceeds the maximum of ${(foirConfig.max * 100).toFixed(0)}%. Reduce loan amount, extend tenure, or reduce existing liabilities.`));
    }

    // Document check
    const isEmpSalaried = empType === 'salaried';
    const requiredDocs = isEmpSalaried
      ? ['hasSalarySlips', 'hasITR', 'hasBankStatements'] as const
      : ['hasITR', 'hasBankStatements'] as const;
    const missingDocs = requiredDocs.filter((k) => !step5[k]);
    if (missingDocs.length > 0) {
      incomeScore = Math.round(incomeScore * 0.85);
      const docLabels: Record<string, string> = {
        hasSalarySlips: 'Salary slips',
        hasITR: 'ITR',
        hasBankStatements: 'Bank statements',
        hasFormSixteen: 'Form 16',
        hasGSTReturns: 'GST returns',
        hasAuditedFinancials: 'Audited financials',
      };
      const missing = missingDocs.map((k) => docLabels[k]).join(', ');
      flags.push(flag('warning', 'Income', `Missing income documents: ${missing}. These will be required to complete the application.`));
    }

    // Stability check
    const stabYears = parseNum(step5.employmentStabilityYears);
    if (stabYears < 1) {
      incomeScore = Math.round(incomeScore * 0.85);
      flags.push(flag('warning', 'Income', 'Less than 1 year of employment/business stability. Most lenders prefer 2+ years.'));
    } else if (stabYears < 2) {
      flags.push(flag('info', 'Income', 'Employment stability under 2 years may require additional documentation.'));
    }
  }

  breakdown.push(score('incomeFit', 'Income Fit', incomeScore, weights.incomeFit, incomeNotes));

  // ── 7. Co-Applicant Fit (10 pts) ─────────────────────────────────────────

  const coNotes: string[] = [];
  let coScore = 0;

  if (step6.numberOfCoApplicants === 0) {
    coScore = Math.round(weights.coApplicantFit * 0.5);
    coNotes.push('No co-applicant provided — this is generally mandatory per policy.');
    flags.push(flag('warning', 'Co-Applicant', 'A co-applicant is generally mandatory. All property owners must be co-borrowers. Application may be returned if no co-applicant is named.'));
  } else {
    coScore = weights.coApplicantFit;
    const rel = step6.coApplicantRelationship;
    if (rel && POLICY.coApplicant.acceptedRelationships.includes(rel as never)) {
      coNotes.push(`Co-applicant relationship (${rel.replace('_', '/')}) is accepted under policy.`);
    } else if (rel === 'other') {
      coScore = Math.round(weights.coApplicantFit * 0.7);
      coNotes.push("Co-applicant relationship 'Other' may require lender review.");
      flags.push(flag('info', 'Co-Applicant', "Relationship category 'Other' may not be accepted under standard policy. Accepted relationships are spouse, parent, son/daughter, or sibling."));
    }

    if (!step6.allOwnersIncluded && step6.numberOfPropertyOwners > 1) {
      coScore = Math.round(coScore * 0.7);
      coNotes.push('Not all property owners are listed as co-applicants.');
      flags.push(flag('warning', 'Co-Applicant', 'All property owners are typically required to be co-borrowers/co-applicants. Align ownership and borrower structure.'));
    }
  }

  breakdown.push(score('coApplicantFit', 'Co-Applicant Fit', coScore, weights.coApplicantFit, coNotes));

  // ── 8. Product Fit (informational) ────────────────────────────────────────

  const productNotes: string[] = [];
  const rateNotes =
    rateType === 'floating'
      ? `Floating rate estimate: ${POLICY.interestRates.floating.min}%–${POLICY.interestRates.floating.max}% p.a. (risk-based, indicative).`
      : `Fixed rate estimate: ~${POLICY.interestRates.fixed.rate}% p.a. (indicative).`;
  productNotes.push(rateNotes);
  productNotes.push('Actual rate depends on credit score, income, LTV, property quality, and lender assessment.');

  breakdown.push(score('productFit', 'Product Fit', 0, 0, productNotes));

  // ── Compute total score and outcome ───────────────────────────────────────

  const maxPossible = Object.values(weights).reduce((a, b) => a + b, 0);
  const totalScore = breakdown.reduce((s, c) => s + c.score, 0);
  const normalizedScore = Math.round((totalScore / maxPossible) * 100);

  let outcome: EligibilityOutcome;
  if (hasHardFail) {
    outcome = 'not_eligible';
  } else if (normalizedScore >= POLICY.scoring.thresholds.eligible) {
    outcome = 'eligible';
  } else if (normalizedScore >= POLICY.scoring.thresholds.eligible_with_conditions) {
    outcome = 'eligible_with_conditions';
  } else if (normalizedScore >= POLICY.scoring.thresholds.needs_review) {
    outcome = 'needs_review';
  } else {
    outcome = 'not_eligible';
  }

  // Interest rate range (adjusted for credit)
  let rateMin = POLICY.interestRates.floating.min;
  let rateMax = POLICY.interestRates.floating.max;
  if (rateType === 'fixed') {
    rateMin = POLICY.interestRates.fixed.rate;
    rateMax = POLICY.interestRates.fixed.rate;
  } else if (creditScore > 0 && creditScore >= POLICY.creditScore.strongThreshold) {
    rateMax = POLICY.interestRates.floating.min + 0.5;
  }

  return {
    outcome,
    totalScore: normalizedScore,
    breakdown,
    flags,
    maxLoanAmount: maxLoanByLTV,
    recommendedTenureMonths: Math.min(tenureMonths, (typicalMaturityAge - currentAge) * 12),
    estimatedEMI,
    interestRateRange: { min: rateMin, max: rateMax },
    ltvPercent,
    foirPercent,
    ageAtMaturity,
    hasHardFail,
  };
}
