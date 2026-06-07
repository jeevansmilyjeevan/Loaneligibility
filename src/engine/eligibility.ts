import { POLICY, AXIS_LAP_POLICY } from '../config/policy';
import type {
  WizardState,
  EligibilityResult,
  EligibilityFlag,
  CategoryScore,
  EligibilityOutcome,
  CategoryKey,
  UnderwritingProgram,
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

// ─── Axis LAP Helpers ─────────────────────────────────────────────────────────

function isAxisLAP(state: WizardState): boolean {
  return state.step1.selectedBank === 'axis';
}

function getLAPMaxLoan(program: UnderwritingProgram, cityCategory: string): number {
  const programCap =
    AXIS_LAP_POLICY.programLoanLimits[
      (program || 'normal_income') as keyof typeof AXIS_LAP_POLICY.programLoanLimits
    ] ?? AXIS_LAP_POLICY.programLoanLimits.normal_income;

  const cityCap =
    cityCategory === 'metro_urban'
      ? AXIS_LAP_POLICY.cityLoanCaps.metro_urban
      : cityCategory === 'semi_urban'
        ? AXIS_LAP_POLICY.cityLoanCaps.semi_urban
        : cityCategory === 'rural'
          ? AXIS_LAP_POLICY.cityLoanCaps.rural
          : AXIS_LAP_POLICY.cityLoanCaps.metro_urban; // default metro

  return Math.min(programCap, cityCap);
}

function getLAPLTV(propType: string, program: UnderwritingProgram): number {
  const baseLTV =
    AXIS_LAP_POLICY.ltvByPropertyType[
      propType as keyof typeof AXIS_LAP_POLICY.ltvByPropertyType
    ] ?? 0.60;

  // Surrogate programs get 5% lower LTV
  const isSurrogate =
    program === 'average_banking' ||
    program === 'gst_program' ||
    program === 'gross_margin' ||
    program === 'liquid_income' ||
    program === 'repayment_track';

  return isSurrogate ? Math.max(0, baseLTV - 0.05) : baseLTV;
}

function getSalariedFOIR(monthlyIncome: number): number {
  const annualIncome = monthlyIncome * 12;
  for (const band of AXIS_LAP_POLICY.foirSalaried) {
    if (annualIncome <= band.maxAnnualIncome) return band.maxFOIR;
  }
  return 0.70;
}

function getSEFOIR(program: UnderwritingProgram, loanAmount: number): number {
  if (program === 'liquid_income') return AXIS_LAP_POLICY.foirSelfEmployed.liquid_income;
  if (program === 'average_banking') return AXIS_LAP_POLICY.foirSelfEmployed.average_banking;
  if (
    program === 'gst_program' ||
    program === 'gross_margin' ||
    program === 'gpr_doctors'
  ) return AXIS_LAP_POLICY.foirSelfEmployed.gst_gmp_gpr_gtp;
  if (program === 'repayment_track') return AXIS_LAP_POLICY.foirSelfEmployed.repayment_track;
  if (program === 'lease_rental_discounting')
    return AXIS_LAP_POLICY.foirSelfEmployed.lease_rental_discounting;
  // Normal income: depends on loan amount
  return loanAmount <= 3_00_00_000
    ? AXIS_LAP_POLICY.foirSelfEmployed.normal_income_low
    : AXIS_LAP_POLICY.foirSelfEmployed.normal_income_high;
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function computeEligibility(state: WizardState): EligibilityResult {
  const { step1, step2, step3, step4, step5, step6, step7 } = state;
  const axisLAP = isAxisLAP(state);
  const pol = axisLAP ? AXIS_LAP_POLICY : POLICY;
  const weights = pol.scoring.categoryWeights;
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
  const ageAtMaturity = calcAgeAtMaturity(currentAge, tenureMonths);

  const program = step1.underwritingProgram || 'normal_income';
  const cityCategory = step1.cityCategory || 'metro_urban';
  const propType = step1.propertyType || '';

  // ── LTV computation (Axis LAP uses property-type LTV; others use value bands) ─

  const lapLTV = axisLAP ? getLAPLTV(propType, program) : 0;
  const maxLoanByLTV = axisLAP
    ? effectivePropValue * lapLTV
    : getMaxLoanByLTV(effectivePropValue);
  const ltvPercent = calcLTVPercent(loanAmount, effectivePropValue);
  const ltvBand = axisLAP ? null : getLTVBand(effectivePropValue);

  // ── FOIR config ───────────────────────────────────────────────────────────

  let foirMax: number;
  if (axisLAP) {
    foirMax = empType === 'salaried'
      ? getSalariedFOIR(totalIncome > 0 ? totalIncome : netIncome)
      : getSEFOIR(program, loanAmount);
  } else {
    const foirConfig = empType === 'salaried' ? POLICY.foir.salaried : POLICY.foir.self_employed;
    foirMax = foirConfig.max;
  }

  const typicalMaturityAge = axisLAP
    ? (empType === 'salaried'
        ? AXIS_LAP_POLICY.age.salariedTypicalMaturityAge
        : AXIS_LAP_POLICY.age.selfEmployedTypicalMaturityAge)
    : getTypicalMaturityAge(empType);

  const rateType = step7.rateType || 'floating';
  const estimateRate = axisLAP
    ? (rateType === 'fixed' ? pol.interestRates.fixed.rate : pol.interestRates.defaultEstimateRate)
    : (rateType === 'fixed' ? POLICY.interestRates.fixed.rate : POLICY.interestRates.defaultEstimateRate);
  const estimatedEMI = calculateEMI(loanAmount, estimateRate, tenureMonths);
  const totalEMIWithNew = existingEMIs + estimatedEMI;
  const foirPercent = calcFOIR(totalEMIWithNew, totalIncome);

  // ── 1. Amount Fit (15 pts) ────────────────────────────────────────────────

  const amountNotes: string[] = [];
  let amountScore = 0;

  if (loanAmount <= 0) {
    amountNotes.push('Loan amount not provided.');
    hasHardFail = true;
    flags.push(flag('error', 'Amount', 'Loan amount must be greater than zero.'));
  } else {
    const policyMax = axisLAP ? getLAPMaxLoan(program, cityCategory) : POLICY.loanLimits.maxAmount;
    const policyMin = axisLAP ? AXIS_LAP_POLICY.loanLimits.minAmount : POLICY.loanLimits.minAmount;

    if (loanAmount < policyMin) {
      amountNotes.push(`Amount below minimum of ₹${(policyMin / 1_00_000).toFixed(1)}L for this program.`);
      hasHardFail = true;
      flags.push(flag('error', 'Amount', `Minimum loan amount is ₹${(policyMin / 1_00_000).toFixed(1)} lakh.`));
    } else if (loanAmount > policyMax) {
      const capLabel = axisLAP
        ? `₹${(policyMax / 1_00_00_000).toFixed(0)} Cr (${program.replace(/_/g, ' ')} / ${cityCategory.replace(/_/g, ' ')} cap)`
        : '₹10 crore';
      amountNotes.push(`Requested amount exceeds the ${capLabel} maximum.`);
      hasHardFail = true;
      flags.push(flag('error', 'Amount', `Requested loan amount exceeds the maximum sanctioned limit of ${capLabel}.`));
    } else {
      const overage = loanAmount - maxLoanByLTV;
      if (overage <= 0) {
        amountScore = weights.amountFit;
        amountNotes.push(`Requested amount is within the LTV-allowed limit of ₹${(maxLoanByLTV / 1_00_000).toFixed(1)}L.`);
      } else if (overage / maxLoanByLTV <= 0.1) {
        amountScore = Math.round(weights.amountFit * 0.65);
        amountNotes.push('Requested amount slightly exceeds LTV-allowed funding — a higher contribution will be needed.');
        flags.push(flag('warning', 'Amount', `Requested amount is ₹${(overage / 1_00_000).toFixed(1)}L above LTV ceiling. Additional own contribution required.`));
      } else {
        amountScore = Math.round(weights.amountFit * 0.2);
        amountNotes.push('Requested amount significantly exceeds LTV funding limit.');
        flags.push(flag('error', 'Amount', `Requested amount exceeds LTV-allowed maximum (₹${(maxLoanByLTV / 1_00_000).toFixed(1)}L). Reduce loan or increase own contribution.`));
      }

      if (axisLAP) {
        amountNotes.push(`Program cap: ₹${(getLAPMaxLoan(program, cityCategory) / 1_00_00_000).toFixed(0)} Cr. LTV: ${(lapLTV * 100).toFixed(0)}% for ${propType.replace('lap_', '').replace(/_/g, ' ')} property.`);
      }
    }
  }

  breakdown.push(score('amountFit', 'Amount Fit', amountScore, weights.amountFit, amountNotes));

  // ── 2. Tenure Fit (10 pts) ────────────────────────────────────────────────

  const tenureNotes: string[] = [];
  let tenureScore = 0;

  if (tenureMonths <= 0) {
    tenureNotes.push('Tenure not provided.');
    flags.push(flag('error', 'Tenure', 'Please provide a valid loan tenure.'));
  } else if (tenureMonths > pol.loanLimits.maxTenureMonths) {
    tenureNotes.push(`Requested tenure exceeds ${pol.loanLimits.maxTenureMonths / 12}-year maximum.`);
    hasHardFail = true;
    flags.push(flag('error', 'Tenure', `Maximum tenure is ${pol.loanLimits.maxTenureMonths} months (${pol.loanLimits.maxTenureMonths / 12} years).`));
  } else {
    const graceYears = pol.age.maturityAgeGraceYears;
    if (ageAtMaturity <= typicalMaturityAge) {
      tenureScore = weights.tenureFit;
      tenureNotes.push(`At maturity, age will be ${ageAtMaturity.toFixed(1)} — within the ${typicalMaturityAge}-year ceiling.`);
    } else if (ageAtMaturity <= typicalMaturityAge + graceYears) {
      tenureScore = Math.round(weights.tenureFit * 0.7);
      tenureNotes.push(`Age at maturity (${ageAtMaturity.toFixed(1)}) slightly exceeds typical limit — lender may require tenure reduction.`);
      flags.push(flag('warning', 'Tenure', `Loan would mature when applicant is ${ageAtMaturity.toFixed(0)} — just beyond the typical ${typicalMaturityAge}-year ceiling.`));
    } else {
      tenureScore = Math.round(weights.tenureFit * 0.3);
      tenureNotes.push(`Age at maturity (${ageAtMaturity.toFixed(1)}) substantially exceeds retirement age — tenure reduction likely.`);
      flags.push(flag('error', 'Tenure', `Applicant would be ${ageAtMaturity.toFixed(0)} at loan maturity. Lender will likely cap tenure so the loan closes by age ${typicalMaturityAge}.`));
    }

    if (axisLAP && tenureMonths > 240) {
      tenureNotes.push('Tenors above 20 years require deviation approval at Axis Finance.');
      flags.push(flag('warning', 'Tenure', 'Loans with tenor beyond 20 years (240 months) require deviation approval as per Axis LAP policy.'));
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
    const maxLTV = axisLAP ? lapLTV : (ltvBand?.maxLTV ?? 0.75);

    if (axisLAP) {
      ltvNotes.push(`LTV for ${propType.replace('lap_', '').replace(/_/g, ' ')} property: up to ${(maxLTV * 100).toFixed(0)}%${program !== 'normal_income' ? ' (−5% for surrogate program)' : ''}.`);
    } else {
      ltvNotes.push(`LTV band: up to ${(maxLTV * 100).toFixed(0)}% for this property value.`);
    }

    if (ltvPercent <= maxLTV) {
      ltvScore = weights.ltvFit;
      ltvNotes.push(`Current LTV ${(ltvPercent * 100).toFixed(1)}% is within the allowed ${(maxLTV * 100).toFixed(0)}% band.`);
    } else if (ltvPercent <= maxLTV + 0.05) {
      ltvScore = Math.round(weights.ltvFit * 0.5);
      ltvNotes.push(`LTV ${(ltvPercent * 100).toFixed(1)}% slightly exceeds the ${(maxLTV * 100).toFixed(0)}% limit.`);
      flags.push(flag('warning', 'LTV', `LTV of ${(ltvPercent * 100).toFixed(1)}% marginally exceeds the allowed ${(maxLTV * 100).toFixed(0)}%. A higher own contribution will be required.`));
    } else {
      ltvScore = 0;
      ltvNotes.push(`LTV ${(ltvPercent * 100).toFixed(1)}% significantly exceeds the ${(maxLTV * 100).toFixed(0)}% limit.`);
      flags.push(flag('error', 'LTV', `LTV of ${(ltvPercent * 100).toFixed(1)}% is above the ${(maxLTV * 100).toFixed(0)}% limit for this property type. Substantial additional own contribution needed.`));
    }

    const impliedLoan = effectivePropValue - ownContrib;
    if (ownContrib > 0 && impliedLoan > maxLoanByLTV) {
      flags.push(flag('info', 'LTV', `Own contribution of ₹${(ownContrib / 1_00_000).toFixed(1)}L implies a loan of ₹${(impliedLoan / 1_00_000).toFixed(1)}L — verify this aligns with your contribution plan.`));
    }
  }

  breakdown.push(score('ltvFit', 'LTV Fit', ltvScore, weights.ltvFit, ltvNotes));

  // ── 4. Age Fit (15 pts) ───────────────────────────────────────────────────

  const ageNotes: string[] = [];
  let ageScore = 0;
  const minAge = axisLAP ? AXIS_LAP_POLICY.age.minAge : POLICY.age.minAge;

  if (currentAge <= 0) {
    ageNotes.push('Date of birth not entered.');
  } else if (currentAge < minAge) {
    ageNotes.push(`Age ${currentAge} is below the minimum of ${minAge} years.`);
    hasHardFail = true;
    flags.push(flag('error', 'Age', `Financial applicants must be at least ${minAge} years old under Axis LAP policy. Current age: ${currentAge}.`));
  } else if (currentAge >= minAge && currentAge <= 30) {
    ageScore = Math.round(weights.ageFit * 0.9);
    ageNotes.push('Young applicant — strong tenure flexibility.');
  } else if (currentAge > 30 && currentAge <= 45) {
    ageScore = weights.ageFit;
    ageNotes.push('Prime age range — optimal balance of income stability and tenure.');
  } else if (currentAge > 45 && currentAge <= 55) {
    ageScore = Math.round(weights.ageFit * 0.75);
    ageNotes.push('Tenure may be limited by maturity age cap.');
    flags.push(flag('info', 'Age', `At age ${currentAge}, available tenure before ${typicalMaturityAge} is ${typicalMaturityAge - currentAge} years. Lender may cap tenure.`));
  } else {
    ageScore = Math.round(weights.ageFit * 0.4);
    ageNotes.push('Age significantly limits available tenure.');
    flags.push(flag('warning', 'Age', `At age ${currentAge}, maximum practical tenure is ~${Math.max(0, typicalMaturityAge - currentAge)} years. Repayment capacity must be strong.`));
  }

  breakdown.push(score('ageFit', 'Age Fit', ageScore, weights.ageFit, ageNotes));

  // ── 5. Credit Fit (20 pts) ────────────────────────────────────────────────

  const creditNotes: string[] = [];
  let creditScore2 = 0;
  const creditPolicy = axisLAP ? AXIS_LAP_POLICY.creditScore : POLICY.creditScore;

  if (creditScore <= 0) {
    creditNotes.push('Credit score not provided — will be treated as needs review.');
    flags.push(flag('warning', 'Credit', 'No credit score provided. TransUnion CIBIL score is mandatory for Axis LAP assessment.'));
  } else if (step4.defaultSeverity === 'wilful') {
    creditScore2 = 0;
    hasHardFail = true;
    creditNotes.push('Wilful default flagged — application cannot proceed.');
    flags.push(flag('error', 'Credit', 'A wilful default or fraud flag is recorded. This is a disqualifying event.'));
  } else if (step4.defaultSeverity === 'major') {
    creditScore2 = Math.round(weights.creditFit * 0.1);
    creditNotes.push('Major default or write-off in credit history — significant risk flag.');
    flags.push(flag('error', 'Credit', 'A major default, settlement, or 90+ DPD is recorded. Lender will require detailed explanation and may decline.'));
  } else if (axisLAP && creditScore < creditPolicy.hardFailThreshold) {
    creditScore2 = 0;
    hasHardFail = true;
    creditNotes.push(`Credit score ${creditScore} is below the minimum of ${creditPolicy.hardFailThreshold} — application to be avoided per Axis LAP policy.`);
    flags.push(flag('error', 'Credit', `Axis Finance requires a bureau score of at least ${creditPolicy.hardFailThreshold}. Score of ${creditScore} does not qualify.`));
  } else {
    if (creditScore >= creditPolicy.strongThreshold) {
      creditScore2 = weights.creditFit;
      creditNotes.push(`Credit score ${creditScore} — Strong profile (750+). Qualifies for best pricing.`);
    } else if (creditScore >= creditPolicy.acceptableThreshold) {
      creditScore2 = Math.round(weights.creditFit * 0.75);
      creditNotes.push(`Credit score ${creditScore} — Acceptable profile (700–749). Standard approval expected.`);
      flags.push(flag('info', 'Credit', `Score of ${creditScore} is acceptable. A 750+ score would improve rate pricing.`));
    } else if (creditScore >= creditPolicy.reviewThreshold) {
      creditScore2 = Math.round(weights.creditFit * 0.45);
      creditNotes.push(`Credit score ${creditScore} — Below acceptable range. Lender will review carefully.`);
      flags.push(flag('warning', 'Credit', `Score of ${creditScore} is below the 700 threshold. Lender will scrutinise credit history.`));
    } else if (creditScore >= creditPolicy.hardFailThreshold) {
      creditScore2 = Math.round(weights.creditFit * 0.2);
      creditNotes.push(`Credit score ${creditScore} — Borderline score, just above the ${creditPolicy.hardFailThreshold} hard floor.`);
      flags.push(flag('error', 'Credit', `Score of ${creditScore} is just above the ${creditPolicy.hardFailThreshold} minimum floor. Approval is uncertain — strong income & LTV needed.`));
    } else {
      creditScore2 = 0;
      creditNotes.push(`Credit score ${creditScore} — Below policy floor.`);
      flags.push(flag('error', 'Credit', `Score of ${creditScore} is below the ${creditPolicy.hardFailThreshold} minimum required.`));
    }

    if (step4.repaymentHistory === 'poor' && creditScore2 > 0) {
      creditScore2 = Math.round(creditScore2 * 0.7);
      creditNotes.push('Poor repayment history further reduces credit score.');
      flags.push(flag('warning', 'Credit', 'Self-declared repayment history is poor. Bureau report will be reviewed carefully.'));
    } else if (step4.repaymentHistory === 'fair' && creditScore2 > 0) {
      creditScore2 = Math.round(creditScore2 * 0.85);
      creditNotes.push('Fair repayment history noted.');
    }

    if (step4.defaultSeverity === 'minor') {
      creditScore2 = Math.round(creditScore2 * 0.85);
      creditNotes.push('Minor default/delay noted — resolved items assessed case by case.');
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
    // Axis LAP minimum income check
    if (axisLAP) {
      const minIncome = empType === 'salaried'
        ? AXIS_LAP_POLICY.minIncome.salariedBankCredit
        : AXIS_LAP_POLICY.minIncome.selfEmployed;
      if (netIncome < minIncome) {
        incomeNotes.push(`Monthly income ₹${netIncome.toLocaleString('en-IN')} is below the Axis LAP minimum of ₹${minIncome.toLocaleString('en-IN')}.`);
        flags.push(flag('warning', 'Income', `Axis LAP requires a minimum monthly income of ₹${minIncome.toLocaleString('en-IN')} for ${empType === 'salaried' ? 'salaried' : 'self-employed'} applicants.`));
      }

      // Work experience check
      const stabYears = parseNum(step5.employmentStabilityYears);
      const minStab = empType === 'salaried'
        ? AXIS_LAP_POLICY.workExperience.salariedCurrentJobYears
        : AXIS_LAP_POLICY.workExperience.selfEmployedYears;
      if (stabYears < minStab) {
        incomeNotes.push(`Business/employment stability of ${stabYears} yr${stabYears !== 1 ? 's' : ''} is below the minimum ${minStab} year${minStab !== 1 ? 's' : ''} required.`);
        flags.push(flag('warning', 'Income', `Axis LAP requires at least ${minStab} year${minStab !== 1 ? 's' : ''} of ${empType === 'salaried' ? 'employment stability (2 yrs total, 1 yr current job)' : 'business stability'}.`));
      } else if (empType === 'salaried' && stabYears < AXIS_LAP_POLICY.workExperience.salariedTotalYears) {
        flags.push(flag('info', 'Income', `Total employment stability of ${stabYears} year${stabYears !== 1 ? 's' : ''} should ideally be at least ${AXIS_LAP_POLICY.workExperience.salariedTotalYears} years.`));
      }

      incomeNotes.push(`FOIR limit for this profile: ${(foirMax * 100).toFixed(0)}% (${empType === 'salaried' ? 'income-tier based' : `${program.replace(/_/g, ' ')} program`}).`);
    }

    incomeNotes.push(`Total monthly income: ₹${(totalIncome / 1000).toFixed(1)}K. Existing EMIs: ₹${(existingEMIs / 1000).toFixed(1)}K. New EMI estimate: ₹${(estimatedEMI / 1000).toFixed(1)}K.`);
    incomeNotes.push(`FOIR (including new EMI): ${(foirPercent * 100).toFixed(1)}% vs allowed ${(foirMax * 100).toFixed(0)}%.`);

    const foirIdeal = foirMax * 0.75;
    const foirAcceptable = foirMax * 0.90;

    if (foirPercent <= foirIdeal) {
      incomeScore = weights.incomeFit;
      incomeNotes.push('FOIR is well within the comfortable range.');
    } else if (foirPercent <= foirAcceptable) {
      incomeScore = Math.round(weights.incomeFit * 0.8);
      incomeNotes.push('FOIR is within the acceptable range.');
    } else if (foirPercent <= foirMax) {
      incomeScore = Math.round(weights.incomeFit * 0.55);
      incomeNotes.push(`FOIR is elevated but within the maximum ${(foirMax * 100).toFixed(0)}% threshold.`);
      flags.push(flag('warning', 'Income', `FOIR of ${(foirPercent * 100).toFixed(1)}% is near the ceiling. Strong documentation and LTV headroom will help.`));
    } else {
      incomeScore = Math.round(weights.incomeFit * 0.15);
      incomeNotes.push(`FOIR of ${(foirPercent * 100).toFixed(1)}% exceeds the maximum allowed — repayment capacity insufficient for the requested EMI.`);
      flags.push(flag('error', 'Income', `FOIR of ${(foirPercent * 100).toFixed(1)}% exceeds the maximum of ${(foirMax * 100).toFixed(0)}%. Reduce loan amount, extend tenure, or reduce existing liabilities.`));
    }

    // Document check
    const isEmpSalaried = empType === 'salaried';
    const requiredDocs = isEmpSalaried
      ? ['hasSalarySlips', 'hasBankStatements'] as const
      : axisLAP
        ? ['hasITR', 'hasBankStatements', 'hasAuditedFinancials'] as const
        : ['hasITR', 'hasBankStatements'] as const;
    const missingDocs = requiredDocs.filter((k) => !step5[k]);
    if (missingDocs.length > 0) {
      incomeScore = Math.round(incomeScore * 0.85);
      const docLabels: Record<string, string> = {
        hasSalarySlips: 'Salary slips (last 6 months)',
        hasITR: 'ITR (last 2 years)',
        hasBankStatements: 'Bank statements (12 months)',
        hasFormSixteen: 'Form 16',
        hasGSTReturns: 'GST returns',
        hasAuditedFinancials: 'Audited financials / CA-certified P&L',
      };
      const missing = missingDocs.map((k) => docLabels[k]).join(', ');
      flags.push(flag('warning', 'Income', `Missing income documents: ${missing}. These will be required to process the application.`));
    }

    if (!axisLAP) {
      const stabYears = parseNum(step5.employmentStabilityYears);
      if (stabYears < 1) {
        incomeScore = Math.round(incomeScore * 0.85);
        flags.push(flag('warning', 'Income', 'Less than 1 year of employment/business stability. Most lenders prefer 2+ years.'));
      } else if (stabYears < 2) {
        flags.push(flag('info', 'Income', 'Employment stability under 2 years may require additional documentation.'));
      }
    }
  }

  breakdown.push(score('incomeFit', 'Income Fit', incomeScore, weights.incomeFit, incomeNotes));

  // ── 7. Co-Applicant Fit (10 pts) ─────────────────────────────────────────

  const coNotes: string[] = [];
  let coScore = 0;

  if (step6.numberOfCoApplicants === 0) {
    coScore = Math.round(weights.coApplicantFit * 0.5);
    coNotes.push('No co-applicant — policy prefers co-applicant in all cases.');
    flags.push(flag('warning', 'Co-Applicant', axisLAP
      ? 'Axis LAP strongly prefers a co-applicant. All property owners must be co-borrowers. Single-applicant cases require 5+ years work experience.'
      : 'A co-applicant is generally preferred. All property owners must be co-borrowers.'));
  } else {
    coScore = weights.coApplicantFit;
    const rel = step6.coApplicantRelationship;
    const accepted = axisLAP
      ? AXIS_LAP_POLICY.coApplicant.acceptedRelationships
      : POLICY.coApplicant.acceptedRelationships;
    if (rel && accepted.includes(rel as never)) {
      coNotes.push(`Co-applicant relationship (${rel.replace(/_/g, '/')}) is accepted under policy.`);
    } else if (rel === 'other') {
      coScore = Math.round(weights.coApplicantFit * 0.7);
      coNotes.push("Co-applicant relationship 'Other' may require lender review.");
      flags.push(flag('info', 'Co-Applicant', "Relationship category 'Other' may not be accepted. Accepted: spouse, parent, son/daughter, or sibling."));
    }

    if (!step6.allOwnersIncluded && step6.numberOfPropertyOwners > 1) {
      coScore = Math.round(coScore * 0.7);
      coNotes.push('Not all property owners are listed as co-applicants.');
      flags.push(flag('warning', 'Co-Applicant', axisLAP
        ? 'Axis LAP mandates all property owners/co-owners to be part of the loan structure.'
        : 'All property owners are typically required to be co-applicants.'));
    }
  }

  breakdown.push(score('coApplicantFit', 'Co-Applicant Fit', coScore, weights.coApplicantFit, coNotes));

  // ── 8. Product Fit (informational) ────────────────────────────────────────

  const productNotes: string[] = [];
  const rateRange = axisLAP ? AXIS_LAP_POLICY.interestRates.floating : POLICY.interestRates.floating;
  const fixedRate = axisLAP ? AXIS_LAP_POLICY.interestRates.fixed.rate : POLICY.interestRates.fixed.rate;
  const rateNotes =
    rateType === 'floating'
      ? `Axis LAP floating rate estimate: ${rateRange.min.toFixed(2)}%–${rateRange.max.toFixed(2)}% p.a. (risk-based, indicative). Actual rate communicated by Axis Finance Product Team.`
      : `Axis LAP fixed rate estimate: ~${fixedRate.toFixed(2)}% p.a. (indicative).`;
  productNotes.push(rateNotes);
  if (axisLAP) {
    productNotes.push(`Underwriting program: ${program.replace(/_/g, ' ').toUpperCase()} — ${cityCategory.replace(/_/g, ' ')} city.`);
    productNotes.push('Rate is subject to credit score, income, LTV, property type, and Axis Finance assessment.');
  }

  breakdown.push(score('productFit', 'Product Fit', 0, 0, productNotes));

  // ── Compute total score and outcome ───────────────────────────────────────

  const maxPossible = Object.values(weights).reduce((a, b) => a + b, 0);
  const totalScore = breakdown.reduce((s, c) => s + c.score, 0);
  const normalizedScore = Math.round((totalScore / maxPossible) * 100);

  const thresholds = pol.scoring.thresholds;
  let outcome: EligibilityOutcome;
  if (hasHardFail) {
    outcome = 'not_eligible';
  } else if (normalizedScore >= thresholds.eligible) {
    outcome = 'eligible';
  } else if (normalizedScore >= thresholds.eligible_with_conditions) {
    outcome = 'eligible_with_conditions';
  } else if (normalizedScore >= thresholds.needs_review) {
    outcome = 'needs_review';
  } else {
    outcome = 'not_eligible';
  }

  // Interest rate range (adjusted for credit)
  let rateMin: number = rateRange.min;
  let rateMax: number = rateRange.max;
  if (rateType === 'fixed') {
    rateMin = fixedRate;
    rateMax = fixedRate;
  } else if (creditScore > 0 && creditScore >= (axisLAP ? AXIS_LAP_POLICY.creditScore.strongThreshold : POLICY.creditScore.strongThreshold)) {
    rateMax = rateRange.min + 0.5;
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
