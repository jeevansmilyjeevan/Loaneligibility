import React, { useState, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type GatherStatus = 'pending' | 'gathered' | 'na';

interface BankCell {
  value: string;
  sample?: boolean; // true = indicative/sample; false/undefined = verified from policy doc
}

interface PolicyRow {
  id: string;
  category: string;
  parameter: string;
  dataType: string;
  notes?: string;
  banks: Record<string, BankCell>;
}

// ─── Bank definitions ─────────────────────────────────────────────────────────

const BANKS = [
  { id: 'axis',   label: 'Axis Finance (LAP)',   short: 'Axis',  color: 'bg-violet-700', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-700', bg: 'bg-violet-50 dark:bg-violet-950/30', verified: true  },
  { id: 'sbi',    label: 'SBI Home Loan',         short: 'SBI',   color: 'bg-blue-800',   text: 'text-blue-700 dark:text-blue-300',     border: 'border-blue-200 dark:border-blue-800',     bg: 'bg-white dark:bg-gray-900', verified: false },
  { id: 'hdfc',   label: 'HDFC Home Loan',        short: 'HDFC',  color: 'bg-red-600',    text: 'text-red-700 dark:text-red-400',       border: 'border-red-200 dark:border-red-900',       bg: 'bg-white dark:bg-gray-900', verified: false },
  { id: 'icici',  label: 'ICICI Home Loan',       short: 'ICICI', color: 'bg-orange-600', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-900', bg: 'bg-white dark:bg-gray-900', verified: false },
  { id: 'kotak',  label: 'Kotak Home Loan',       short: 'Kotak', color: 'bg-rose-600',   text: 'text-rose-700 dark:text-rose-400',     border: 'border-rose-200 dark:border-rose-900',     bg: 'bg-white dark:bg-gray-900', verified: false },
  { id: 'bob',    label: 'Bank of Baroda HL',     short: 'BoB',   color: 'bg-amber-600',  text: 'text-amber-700 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-900',   bg: 'bg-white dark:bg-gray-900', verified: false },
] as const;

type BankId = typeof BANKS[number]['id'];

// ─── Policy data rows ─────────────────────────────────────────────────────────
// Axis Finance values are verified from LAP Policy OGL June 2025.
// All other bank values are indicative samples — verify against each bank's
// current published policy / credit team before use.

const ROWS: PolicyRow[] = [

  // ── Product Configuration ──────────────────────────────────────────────────
  {
    id: 'product_type', category: 'Product', parameter: 'Product type / name',
    dataType: 'Text',
    banks: {
      axis:  { value: 'Loan Against Property (LAP)\nOGL June 2025' },
      sbi:   { value: 'SBI Home Loan\n(Regular / MaxGain / Flexipay)', sample: true },
      hdfc:  { value: 'HDFC Home Loan\n(Regular / Rural / Reach)', sample: true },
      icici: { value: 'ICICI Home Loan\n(Regular / Plot / NRI)', sample: true },
      kotak: { value: 'Kotak Home Loan\n(Regular / NRI)', sample: true },
      bob:   { value: 'Baroda Home Loan\n(Regular / Advantage)', sample: true },
    },
  },
  {
    id: 'target_segment', category: 'Product', parameter: 'Target customer segment',
    dataType: 'Text',
    banks: {
      axis:  { value: 'Resident Indian individuals (Salaried, SEP, SENP)\nNon-individuals (Prop, Partnership, Pvt Ltd, Public Ltd, Trust, LLP, Society, HUF)' },
      sbi:   { value: 'Resident Indians & NRIs\n(Salaried, SE Professionals, SE Non-Professionals)', sample: true },
      hdfc:  { value: 'Resident Indians, NRIs\n(Salaried, SE, Pensioners)', sample: true },
      icici: { value: 'Resident Indians, NRIs\n(Salaried, SE Professionals)', sample: true },
      kotak: { value: 'Resident Indians, NRIs\n(Salaried, SE)', sample: true },
      bob:   { value: 'Resident Indians, NRIs\n(Salaried, SE)', sample: true },
    },
  },
  {
    id: 'min_loan', category: 'Product', parameter: 'Minimum loan amount',
    dataType: 'Currency (₹)',
    banks: {
      axis:  { value: '₹50,000 (₹0.50 Lac)' },
      sbi:   { value: '₹50,000 (varies by product)', sample: true },
      hdfc:  { value: '₹3,00,000', sample: true },
      icici: { value: '₹5,00,000', sample: true },
      kotak: { value: '₹5,00,000', sample: true },
      bob:   { value: '₹3,00,000', sample: true },
    },
  },
  {
    id: 'max_loan', category: 'Product', parameter: 'Maximum loan amount',
    dataType: 'Currency (₹)',
    notes: 'Axis: depends on program & city tier. Others: RBI LTV caps apply.',
    banks: {
      axis:  { value: 'Normal Income: ₹100 Cr\nABB/GST/GMP: ₹75 Cr\nGPR: ₹25 Cr\nRTR/LIP: ₹30 Cr\nCity cap: Metro ₹7 Cr, Semi-Urban ₹5 Cr, Rural ₹3 Cr' },
      sbi:   { value: '₹10 Crore (standard)\nNo cap for some products', sample: true },
      hdfc:  { value: '₹10 Crore', sample: true },
      icici: { value: '₹10 Crore', sample: true },
      kotak: { value: '₹10 Crore', sample: true },
      bob:   { value: '₹10 Crore', sample: true },
    },
  },
  {
    id: 'min_tenure', category: 'Product', parameter: 'Minimum tenure',
    dataType: 'Months',
    banks: {
      axis:  { value: '12 months' },
      sbi:   { value: '12 months', sample: true },
      hdfc:  { value: '12 months', sample: true },
      icici: { value: '12 months', sample: true },
      kotak: { value: '12 months', sample: true },
      bob:   { value: '12 months', sample: true },
    },
  },
  {
    id: 'max_tenure', category: 'Product', parameter: 'Maximum tenure',
    dataType: 'Months',
    notes: 'Axis: >20 yrs needs deviation approval.',
    banks: {
      axis:  { value: '240 months (20 years)\nUp to 300 months with deviation' },
      sbi:   { value: '360 months (30 years)', sample: true },
      hdfc:  { value: '360 months (30 years)', sample: true },
      icici: { value: '360 months (30 years)', sample: true },
      kotak: { value: '360 months (30 years)', sample: true },
      bob:   { value: '360 months (30 years)', sample: true },
    },
  },

  // ── Age Norms ──────────────────────────────────────────────────────────────
  {
    id: 'age_min_salaried', category: 'Age Norms', parameter: 'Min age — financial applicant (Salaried)',
    dataType: 'Years',
    banks: {
      axis:  { value: '24 years' },
      sbi:   { value: '18 years', sample: true },
      hdfc:  { value: '21 years', sample: true },
      icici: { value: '21 years', sample: true },
      kotak: { value: '18 years', sample: true },
      bob:   { value: '21 years', sample: true },
    },
  },
  {
    id: 'age_min_se', category: 'Age Norms', parameter: 'Min age — financial applicant (Self-Employed)',
    dataType: 'Years',
    banks: {
      axis:  { value: '24 years' },
      sbi:   { value: '21 years', sample: true },
      hdfc:  { value: '21 years', sample: true },
      icici: { value: '25 years', sample: true },
      kotak: { value: '21 years', sample: true },
      bob:   { value: '21 years', sample: true },
    },
  },
  {
    id: 'age_max_salaried', category: 'Age Norms', parameter: 'Max age at loan maturity (Salaried)',
    dataType: 'Years',
    banks: {
      axis:  { value: '60 years' },
      sbi:   { value: '70 years', sample: true },
      hdfc:  { value: '65 years', sample: true },
      icici: { value: '65 years', sample: true },
      kotak: { value: '65 years', sample: true },
      bob:   { value: '70 years', sample: true },
    },
  },
  {
    id: 'age_max_se', category: 'Age Norms', parameter: 'Max age at loan maturity (Self-Employed)',
    dataType: 'Years',
    banks: {
      axis:  { value: '65 years' },
      sbi:   { value: '70 years', sample: true },
      hdfc:  { value: '70 years', sample: true },
      icici: { value: '70 years', sample: true },
      kotak: { value: '65 years', sample: true },
      bob:   { value: '70 years', sample: true },
    },
  },
  {
    id: 'age_coapplicant', category: 'Age Norms', parameter: 'Min / Max age — non-financial co-applicant',
    dataType: 'Years',
    banks: {
      axis:  { value: 'Min 18 yrs / Max 75 yrs at maturity' },
      sbi:   { value: 'Min 18 yrs / Max 70-75 yrs', sample: true },
      hdfc:  { value: 'Min 18 yrs / Max 70 yrs', sample: true },
      icici: { value: 'Min 18 yrs / Max 70 yrs', sample: true },
      kotak: { value: 'Min 18 yrs / Max 70 yrs', sample: true },
      bob:   { value: 'Min 18 yrs / Max 70 yrs', sample: true },
    },
  },

  // ── Credit Score ───────────────────────────────────────────────────────────
  {
    id: 'credit_hard_fail', category: 'Credit Score', parameter: 'Hard fail threshold (below = decline)',
    dataType: 'Score',
    notes: 'Bureau: TransUnion CIBIL or equivalent. "No Hit" cases may proceed to manual assessment at some banks.',
    banks: {
      axis:  { value: '< 600 — to be avoided\nNo Hit: proceed to appraisal' },
      sbi:   { value: '< 650 (indicative)\nNo Hit: case-by-case', sample: true },
      hdfc:  { value: '< 650 (indicative)', sample: true },
      icici: { value: '< 650-700 (indicative)', sample: true },
      kotak: { value: '< 650 (indicative)', sample: true },
      bob:   { value: '< 600-650 (indicative)', sample: true },
    },
  },
  {
    id: 'credit_acceptable', category: 'Credit Score', parameter: 'Acceptable score threshold',
    dataType: 'Score',
    banks: {
      axis:  { value: '650 — borderline\n700 — acceptable\n750+ — strong (best pricing)' },
      sbi:   { value: '700 — acceptable\n750+ — preferred', sample: true },
      hdfc:  { value: '700 — acceptable\n750+ — best rate', sample: true },
      icici: { value: '700-720 — acceptable\n750+ — preferred', sample: true },
      kotak: { value: '700 — acceptable\n750+ — best rate', sample: true },
      bob:   { value: '650-700 — acceptable\n750+ — preferred', sample: true },
    },
  },

  // ── LTV Grid ──────────────────────────────────────────────────────────────
  {
    id: 'ltv_residential', category: 'LTV Grid', parameter: 'Residential property — max LTV',
    dataType: 'Percent (%)',
    notes: 'Home Loans follow RBI circular: ≤30L→90%, 30-75L→80%, >75L→75%. Axis LAP: flat 70% (collateral-type based).',
    banks: {
      axis:  { value: '70% (LAP against residential)\n−5% for surrogate programs' },
      sbi:   { value: '≤₹30L → 90%\n₹30–75L → 80%\n>₹75L → 75%', sample: true },
      hdfc:  { value: '≤₹30L → 90%\n₹30–75L → 80%\n>₹75L → 75%', sample: true },
      icici: { value: '≤₹30L → 90%\n₹30–75L → 80%\n>₹75L → 75%', sample: true },
      kotak: { value: '≤₹30L → 90%\n₹30–75L → 80%\n>₹75L → 75%', sample: true },
      bob:   { value: '≤₹30L → 90%\n₹30–75L → 80%\n>₹75L → 75%', sample: true },
    },
  },
  {
    id: 'ltv_commercial', category: 'LTV Grid', parameter: 'Commercial / Mixed-use property — max LTV',
    dataType: 'Percent (%)',
    banks: {
      axis:  { value: '60% (LAP against commercial/mixed usage)\n−5% for surrogate programs' },
      sbi:   { value: 'N/A (home loan, not LAP)', sample: true },
      hdfc:  { value: 'N/A (home loan, not LAP)', sample: true },
      icici: { value: '70% (ICICI Plot loan)', sample: true },
      kotak: { value: 'N/A (home loan)', sample: true },
      bob:   { value: 'N/A (home loan)', sample: true },
    },
  },
  {
    id: 'ltv_plot', category: 'LTV Grid', parameter: 'Plot / Land — max LTV',
    dataType: 'Percent (%)',
    notes: 'Axis: +5% additional if govt authority allotment.',
    banks: {
      axis:  { value: '60% (LAP plot collateral)\n+5% if govt. authority allotment' },
      sbi:   { value: '70% (plot purchase + construction)', sample: true },
      hdfc:  { value: '60-70% (plot component)', sample: true },
      icici: { value: '70% (ICICI Plot Loan)', sample: true },
      kotak: { value: '60-70%', sample: true },
      bob:   { value: '70% (plot + construction)', sample: true },
    },
  },
  {
    id: 'ltv_special', category: 'LTV Grid', parameter: 'Special usage property — max LTV',
    dataType: 'Percent (%)',
    notes: 'Axis: school, clinic, warehouse, industrial unit, hotel. Not applicable for standard home loan banks.',
    banks: {
      axis:  { value: '55% (Industrial/Hotel/Hospital)\n55% (School)\n−5% for surrogate programs' },
      sbi:   { value: 'Not applicable\n(home loan product)', sample: true },
      hdfc:  { value: 'Not applicable\n(home loan product)', sample: true },
      icici: { value: 'Not applicable\n(home loan product)', sample: true },
      kotak: { value: 'Not applicable\n(home loan product)', sample: true },
      bob:   { value: 'Not applicable\n(home loan product)', sample: true },
    },
  },

  // ── FOIR ──────────────────────────────────────────────────────────────────
  {
    id: 'foir_salaried_low', category: 'FOIR', parameter: 'Salaried — annual income ≤ ₹6 Lakh',
    dataType: 'Percent (%) max',
    notes: 'FOIR = (All existing EMIs + proposed EMI) ÷ Gross/Net monthly income.',
    banks: {
      axis:  { value: '60%' },
      sbi:   { value: '45-50%', sample: true },
      hdfc:  { value: '40-50%', sample: true },
      icici: { value: '40-50%', sample: true },
      kotak: { value: '40-50%', sample: true },
      bob:   { value: '45-50%', sample: true },
    },
  },
  {
    id: 'foir_salaried_mid', category: 'FOIR', parameter: 'Salaried — annual income ₹6–12 Lakh',
    dataType: 'Percent (%) max',
    banks: {
      axis:  { value: '65%' },
      sbi:   { value: '50-55%', sample: true },
      hdfc:  { value: '45-55%', sample: true },
      icici: { value: '45-55%', sample: true },
      kotak: { value: '45-55%', sample: true },
      bob:   { value: '50-55%', sample: true },
    },
  },
  {
    id: 'foir_salaried_high', category: 'FOIR', parameter: 'Salaried — annual income > ₹12 Lakh',
    dataType: 'Percent (%) max',
    banks: {
      axis:  { value: '70%' },
      sbi:   { value: '55-60%', sample: true },
      hdfc:  { value: '50-60%', sample: true },
      icici: { value: '50-60%', sample: true },
      kotak: { value: '50-60%', sample: true },
      bob:   { value: '55-60%', sample: true },
    },
  },
  {
    id: 'foir_se_normal', category: 'FOIR', parameter: 'Self-Employed — Normal Income (ITR-based)',
    dataType: 'Percent (%) max',
    notes: 'Axis: 85% for loan ≤ ₹3 Cr; 80% for loan > ₹3 Cr.',
    banks: {
      axis:  { value: 'Loan ≤ ₹3 Cr → 85%\nLoan > ₹3 Cr → 80%' },
      sbi:   { value: '50-55%', sample: true },
      hdfc:  { value: '45-55%', sample: true },
      icici: { value: '45-55%', sample: true },
      kotak: { value: '50%', sample: true },
      bob:   { value: '50-55%', sample: true },
    },
  },
  {
    id: 'foir_se_surrogate', category: 'FOIR', parameter: 'Self-Employed — Surrogate programs',
    dataType: 'Percent (%) max',
    notes: 'GST/GMP/GPR/GTP → 75%. LIP → 70%. ABB → 80%. RTR → 80%.',
    banks: {
      axis:  { value: 'GST / GMP / GPR / GTP → 75%\nLIP → 70%\nABB / RTR → 80%' },
      sbi:   { value: 'N/A (standard ITR-based)', sample: true },
      hdfc:  { value: 'N/A (standard ITR-based)', sample: true },
      icici: { value: 'N/A (standard ITR-based)', sample: true },
      kotak: { value: 'N/A (standard ITR-based)', sample: true },
      bob:   { value: 'N/A (standard ITR-based)', sample: true },
    },
  },

  // ── Income Minimums ───────────────────────────────────────────────────────
  {
    id: 'min_income_salaried', category: 'Income Minimums', parameter: 'Min monthly income — Salaried (bank credit)',
    dataType: 'Currency (₹)',
    banks: {
      axis:  { value: '₹15,000 / month' },
      sbi:   { value: '₹10,000–15,000 / month', sample: true },
      hdfc:  { value: '₹15,000 / month', sample: true },
      icici: { value: '₹17,500 / month', sample: true },
      kotak: { value: '₹20,000 / month', sample: true },
      bob:   { value: '₹10,000–12,000 / month', sample: true },
    },
  },
  {
    id: 'min_income_cash', category: 'Income Minimums', parameter: 'Min monthly income — Salaried (cash salary)',
    dataType: 'Currency (₹)',
    banks: {
      axis:  { value: 'Min ₹10,000 / Max ₹25,000 (all financial applicants combined)' },
      sbi:   { value: 'Not specified separately', sample: true },
      hdfc:  { value: 'Preferred: bank credit\nCash salary: restricted products', sample: true },
      icici: { value: 'Bank credit preferred', sample: true },
      kotak: { value: 'Bank credit preferred', sample: true },
      bob:   { value: 'Not specified separately', sample: true },
    },
  },
  {
    id: 'min_income_se', category: 'Income Minimums', parameter: 'Min monthly income — Self-Employed',
    dataType: 'Currency (₹)',
    banks: {
      axis:  { value: '₹15,000 / month (combined, all financial applicants)' },
      sbi:   { value: '₹15,000–20,000 / month', sample: true },
      hdfc:  { value: '₹15,000 / month', sample: true },
      icici: { value: '₹25,000 / month', sample: true },
      kotak: { value: '₹20,000 / month', sample: true },
      bob:   { value: '₹12,000–15,000 / month', sample: true },
    },
  },

  // ── Work Experience ───────────────────────────────────────────────────────
  {
    id: 'workexp_sal_current', category: 'Work Experience', parameter: 'Salaried — min years at current job',
    dataType: 'Years',
    banks: {
      axis:  { value: '1 year at current job' },
      sbi:   { value: '1–2 years (varies by product)', sample: true },
      hdfc:  { value: '1 year (minimum)', sample: true },
      icici: { value: '2 years (preferred)', sample: true },
      kotak: { value: '1 year', sample: true },
      bob:   { value: '1 year', sample: true },
    },
  },
  {
    id: 'workexp_sal_total', category: 'Work Experience', parameter: 'Salaried — min total employment stability',
    dataType: 'Years',
    banks: {
      axis:  { value: '2 years total' },
      sbi:   { value: '2 years total', sample: true },
      hdfc:  { value: '2 years total', sample: true },
      icici: { value: '2 years total', sample: true },
      kotak: { value: '2 years total', sample: true },
      bob:   { value: '2 years total', sample: true },
    },
  },
  {
    id: 'workexp_se', category: 'Work Experience', parameter: 'Self-Employed — min years in current business',
    dataType: 'Years',
    banks: {
      axis:  { value: '3 years (SEP & SENP)\n3 years (Non-individual entity)' },
      sbi:   { value: '3 years', sample: true },
      hdfc:  { value: '3 years', sample: true },
      icici: { value: '3 years', sample: true },
      kotak: { value: '3 years', sample: true },
      bob:   { value: '3 years', sample: true },
    },
  },

  // ── Underwriting Programs ─────────────────────────────────────────────────
  {
    id: 'prog_normal', category: 'Underwriting Programs', parameter: 'Normal Income Program (ITR / Salary)',
    dataType: 'Yes / No + Max loan',
    banks: {
      axis:  { value: 'Yes — Salary slip / ITR\nMax: ₹100 Cr (Normal Income)\nMin ABB > 1× proposed EMI' },
      sbi:   { value: 'Yes — standard\nSalary slips + ITR + Form 16', sample: true },
      hdfc:  { value: 'Yes — standard\nSalary slips + ITR + Form 16', sample: true },
      icici: { value: 'Yes — standard\nSalary slips + ITR + Form 16', sample: true },
      kotak: { value: 'Yes — standard\nSalary slips + ITR + Form 16', sample: true },
      bob:   { value: 'Yes — standard\nSalary slips + ITR + Form 16', sample: true },
    },
  },
  {
    id: 'prog_banking', category: 'Underwriting Programs', parameter: 'Average Banking / ABB Surrogate',
    dataType: 'Yes / No + Max loan',
    notes: 'ABB = Average Bank Balance over 12 months (daily average). EMI eligibility = ABB ÷ 2.',
    banks: {
      axis:  { value: 'Yes — ABP Program\nMax: ₹75 Cr\nMin 12-month bank statements (PDF)\nABB > 1× proposed EMI\nMax 2% inward cheque returns' },
      sbi:   { value: 'Not standard — case-by-case', sample: true },
      hdfc:  { value: 'Not standard\n(HDFC Reach for informal income)', sample: true },
      icici: { value: 'Not standard', sample: true },
      kotak: { value: 'Not standard', sample: true },
      bob:   { value: 'Not standard', sample: true },
    },
  },
  {
    id: 'prog_gst', category: 'Underwriting Programs', parameter: 'GST / GMP / Turnover Surrogate',
    dataType: 'Yes / No + Max loan',
    banks: {
      axis:  { value: 'Yes — GST & GMP Programs\nMax: ₹75 Cr\nGSTR-3B mandatory (last 2 years)\nMin turnover ₹50 Lacs p.a.\nGrowth trend required' },
      sbi:   { value: 'Not available', sample: true },
      hdfc:  { value: 'Not available', sample: true },
      icici: { value: 'Not available', sample: true },
      kotak: { value: 'Not available', sample: true },
      bob:   { value: 'Not available', sample: true },
    },
  },
  {
    id: 'prog_gpr', category: 'Underwriting Programs', parameter: 'Doctors / GPR Program',
    dataType: 'Yes / No + eligibility',
    notes: 'Based on gross professional receipts. Requires MCI registration.',
    banks: {
      axis:  { value: 'Yes — GPR (Doctors) Program\nMax: ₹25 Cr\nMD/MS/DM/MCh/MDS/MBBS/BDS\nMCI-registered doctors only' },
      sbi:   { value: 'Not a separate program\n(assessed under SE income)', sample: true },
      hdfc:  { value: 'Not a separate program', sample: true },
      icici: { value: 'Not a separate program', sample: true },
      kotak: { value: 'Not a separate program', sample: true },
      bob:   { value: 'Not a separate program', sample: true },
    },
  },
  {
    id: 'prog_rtr', category: 'Underwriting Programs', parameter: 'Balance Transfer / RTR (Repayment Track)',
    dataType: 'Yes / No + eligibility',
    notes: 'RTR multiplier: 12-24 mo → 1.10×, 24-36 mo → 1.20×, >36 mo → 1.30× of original sanction.',
    banks: {
      axis:  { value: 'Yes — RTR Program\nMax: ₹30 Cr\nMin 12 months clean EMI history\nDPD must never be 30+\nNo more than 2 top-ups (secured) in last 6 months' },
      sbi:   { value: 'Yes — Balance Transfer offered\nRequires 12-month clean track', sample: true },
      hdfc:  { value: 'Yes — BT available\n12-month clean track required', sample: true },
      icici: { value: 'Yes — BT + Top-Up\n12+ months clean history', sample: true },
      kotak: { value: 'Yes — BT available', sample: true },
      bob:   { value: 'Yes — BT + Advantage plan', sample: true },
    },
  },
  {
    id: 'prog_lrd', category: 'Underwriting Programs', parameter: 'Lease Rental Discounting (LRD)',
    dataType: 'Yes / No + eligibility',
    notes: 'Axis: income from property rentals. LTV: MNC/Fortune 500 tenant → 90%; others → 85%.',
    banks: {
      axis:  { value: 'Yes — LRD Program\nMax: ₹100 Cr\nLease vintage > 6 months\nEscrow account mandatory\nMNC tenants: 90% LTV\nOther tenants: 85% LTV' },
      sbi:   { value: 'Yes — available for commercial properties', sample: true },
      hdfc:  { value: 'Yes — available', sample: true },
      icici: { value: 'Yes — available', sample: true },
      kotak: { value: 'Limited — check current policy', sample: true },
      bob:   { value: 'Limited — check current policy', sample: true },
    },
  },

  // ── Interest Rates ────────────────────────────────────────────────────────
  {
    id: 'rate_floating', category: 'Interest Rates', parameter: 'Floating rate range (% p.a.)',
    dataType: 'Percent range (%)',
    notes: 'Axis: communicated by Product Team. Others: as published / RLLR-linked.',
    banks: {
      axis:  { value: '11.00% – 14.00% (indicative)\nActual communicated by CO-Product Team' },
      sbi:   { value: '8.50% – 10.15% (RLLR-linked)', sample: true },
      hdfc:  { value: '8.75% – 9.65% (RLLR-linked)', sample: true },
      icici: { value: '8.75% – 9.80%', sample: true },
      kotak: { value: '8.75% – 9.85%', sample: true },
      bob:   { value: '8.40% – 10.60%', sample: true },
    },
  },
  {
    id: 'rate_fixed', category: 'Interest Rates', parameter: 'Fixed rate (% p.a.)',
    dataType: 'Percent (%)',
    banks: {
      axis:  { value: '~15.00% (indicative)' },
      sbi:   { value: 'Not standard\n(floating preferred)', sample: true },
      hdfc:  { value: 'Fixed for 2 yrs: ~9.60%\nthen converts to floating', sample: true },
      icici: { value: 'Fixed option available\n~10.00%', sample: true },
      kotak: { value: 'Not standard', sample: true },
      bob:   { value: 'Not standard', sample: true },
    },
  },
  {
    id: 'rate_benchmark', category: 'Interest Rates', parameter: 'Rate benchmark / reset frequency',
    dataType: 'Text',
    banks: {
      axis:  { value: 'As communicated by CO-Product Team\n(quarterly review typical)' },
      sbi:   { value: 'RLLR (Repo-Linked Lending Rate)\nQuarterly reset', sample: true },
      hdfc:  { value: 'RLLR\nQuarterly reset', sample: true },
      icici: { value: 'I-MCLR / RLLR\nQuarterly reset', sample: true },
      kotak: { value: 'RLLR\nQuarterly reset', sample: true },
      bob:   { value: 'RLLR / BRLLR\nQuarterly reset', sample: true },
    },
  },

  // ── Fees & Charges ────────────────────────────────────────────────────────
  {
    id: 'fee_processing', category: 'Fees & Charges', parameter: 'Processing fee range',
    dataType: 'Percent (%) of loan',
    banks: {
      axis:  { value: '1.00% – 2.00% + 18% GST' },
      sbi:   { value: 'Up to 0.35% + GST\n(waived on some products)', sample: true },
      hdfc:  { value: 'Up to 0.50% + GST\n(min ₹3,000)', sample: true },
      icici: { value: '0.50% + GST\n(min ₹3,000)', sample: true },
      kotak: { value: '0.50% + GST', sample: true },
      bob:   { value: '0.50% + GST\n(waiver on select products)', sample: true },
    },
  },
  {
    id: 'fee_prepayment', category: 'Fees & Charges', parameter: 'Prepayment / foreclosure charges',
    dataType: 'Percent (%) or Nil',
    notes: 'RBI: nil prepayment charges for floating rate individual borrowers.',
    banks: {
      axis:  { value: 'Floating / Individual: Nil\nOther cases: 2% + GST\nMin 12 EMIs before prepayment\nMax 2 prepayments/year\nMax 25% of principal/year' },
      sbi:   { value: 'Nil for floating individual\n2% + GST for other cases', sample: true },
      hdfc:  { value: 'Nil for floating individual\n2% + GST for other cases', sample: true },
      icici: { value: 'Nil for floating individual', sample: true },
      kotak: { value: 'Nil for floating individual', sample: true },
      bob:   { value: 'Nil for floating individual\n2% + GST for other cases', sample: true },
    },
  },

  // ── Co-Applicant Policy ───────────────────────────────────────────────────
  {
    id: 'coapplicant_required', category: 'Co-Applicant', parameter: 'Co-applicant mandatory / preferred',
    dataType: 'Mandatory / Preferred / Optional',
    banks: {
      axis:  { value: 'Preferred in ALL cases\nSingle applicant: min 5 yrs work experience\nAll property owners MUST be on loan structure' },
      sbi:   { value: 'Preferred (mandatory for joint ownership)', sample: true },
      hdfc:  { value: 'Preferred (mandatory for joint ownership)', sample: true },
      icici: { value: 'Preferred (mandatory for joint ownership)', sample: true },
      kotak: { value: 'Preferred', sample: true },
      bob:   { value: 'Preferred (mandatory for joint ownership)', sample: true },
    },
  },
  {
    id: 'coapplicant_relationships', category: 'Co-Applicant', parameter: 'Accepted co-applicant relationships',
    dataType: 'List',
    banks: {
      axis:  { value: 'Spouse, Parent, Son/Daughter, Sibling\nFor married individuals: spouse preferred\nFor unmarried: parent preferred\nAll property owners must be co-applicants' },
      sbi:   { value: 'Spouse, Parent, Son, Daughter\nBrother/Sister (own property cases)', sample: true },
      hdfc:  { value: 'Spouse, Parent, Son, Daughter\nBrother/Sister (select cases)', sample: true },
      icici: { value: 'Spouse, Parent, Son, Daughter, Sibling', sample: true },
      kotak: { value: 'Spouse, Parent, Son, Daughter, Sibling', sample: true },
      bob:   { value: 'Spouse, Parent, Son, Daughter, Sibling', sample: true },
    },
  },

  // ── Negative / Prohibited Profiles ────────────────────────────────────────
  {
    id: 'prohibited_nri', category: 'Prohibited Profiles', parameter: 'NRI customer eligibility',
    dataType: 'Eligible / Not Eligible',
    banks: {
      axis:  { value: 'NOT ELIGIBLE\n(Axis Finance LAP — NRIs excluded)' },
      sbi:   { value: 'Eligible\n(SBI NRI Home Loan product)', sample: true },
      hdfc:  { value: 'Eligible\n(HDFC NRI Home Loan)', sample: true },
      icici: { value: 'Eligible\n(ICICI NRI Home Loan)', sample: true },
      kotak: { value: 'Eligible\n(Kotak NRI Loan)', sample: true },
      bob:   { value: 'Eligible\n(NRI products available)', sample: true },
    },
  },
  {
    id: 'prohibited_profiles', category: 'Prohibited Profiles', parameter: 'Key prohibited customer / property profiles',
    dataType: 'List',
    banks: {
      axis:  { value: 'Negative: NGOs, STD/PCO outlets, Private money lenders, Gambling/Massage parlors, Cyber cafes, Lottery, MLM, Video parlors, Plantation/Aquaculture/Chit Fund firms\nCaution: Film personalities, Builders, Finance companies, Labour contractors, Tax consultants (non-qualified)\nProperty: owned by Chit Funds / Nidhi companies excluded' },
      sbi:   { value: 'Political exposure, speculative ventures, debarred entities per RBI lists', sample: true },
      hdfc:  { value: 'Debarred entities, wilful defaulters, political exposure', sample: true },
      icici: { value: 'Wilful defaulters, politically exposed persons (PEP) — NCM approval required', sample: true },
      kotak: { value: 'Debarred entities, wilful defaulters', sample: true },
      bob:   { value: 'RBI/IBA debarred entities, wilful defaulters', sample: true },
    },
  },

  // ── Property Norms ────────────────────────────────────────────────────────
  {
    id: 'property_age', category: 'Property Norms', parameter: 'Max property age at loan maturity',
    dataType: 'Years',
    notes: 'Axis: empaneled valuer must certify residual life. Min residual life at maturity = 10 years.',
    banks: {
      axis:  { value: 'Max 60 years at loan maturity\nMin residual life ≥ 10 years at maturity\n(certified by empaneled technical valuer)' },
      sbi:   { value: 'Residual life ≥ remaining loan tenure', sample: true },
      hdfc:  { value: 'Residual life ≥ remaining tenure\n(assessed by approved valuer)', sample: true },
      icici: { value: 'Residual life > remaining loan tenure', sample: true },
      kotak: { value: 'Residual life ≥ remaining tenure', sample: true },
      bob:   { value: 'Residual life ≥ remaining tenure', sample: true },
    },
  },
  {
    id: 'property_min_area', category: 'Property Norms', parameter: 'Minimum property / carpet area',
    dataType: 'Sq ft',
    banks: {
      axis:  { value: 'Residential: 150 sq ft\nCommercial: 100 sq ft\nMixed Usage: 150 sq ft\n(Built-up area for flats; Saleable area for plots)' },
      sbi:   { value: 'No explicit minimum\n(valued on market price)', sample: true },
      hdfc:  { value: 'No explicit minimum in standard policy', sample: true },
      icici: { value: 'No explicit minimum', sample: true },
      kotak: { value: 'No explicit minimum', sample: true },
      bob:   { value: 'No explicit minimum', sample: true },
    },
  },
  {
    id: 'property_security', category: 'Property Norms', parameter: 'Security / charge creation',
    dataType: 'Text',
    banks: {
      axis:  { value: 'Equitable Mortgage OR Registered Mortgage\n(as per state-specific regulations)\nFirst and exclusive charge\nClear & marketable title mandatory' },
      sbi:   { value: 'Equitable / Registered Mortgage\nFirst charge in favour of SBI', sample: true },
      hdfc:  { value: 'Equitable Mortgage\nFirst and exclusive charge', sample: true },
      icici: { value: 'Equitable Mortgage\nFirst exclusive charge', sample: true },
      kotak: { value: 'Equitable Mortgage\nFirst charge', sample: true },
      bob:   { value: 'Equitable Mortgage\nFirst charge', sample: true },
    },
  },
];

// ─── Derived data ─────────────────────────────────────────────────────────────

const ALL_CATEGORIES = Array.from(new Set(ROWS.map(r => r.category)));

const STATUS_CYCLE: GatherStatus[] = ['pending', 'gathered', 'na'];

function nextStatus(s: GatherStatus): GatherStatus {
  return STATUS_CYCLE[(STATUS_CYCLE.indexOf(s) + 1) % STATUS_CYCLE.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, onClick }: { status: GatherStatus; onClick?: () => void }) {
  const cfg = {
    pending:  { label: '○ Pending',  cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700' },
    gathered: { label: '✓ Gathered', cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60' },
    na:       { label: '— N/A',      cls: 'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 line-through' },
  }[status];

  return (
    <button
      type="button"
      onClick={onClick}
      title={onClick ? 'Click to toggle status' : undefined}
      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors whitespace-nowrap ${cfg.cls} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {cfg.label}
    </button>
  );
}

function ValueCell({ cell, bankId }: { cell: BankCell; bankId: string }) {
  const isAxis = bankId === 'axis';
  const lines = cell.value.split('\n');
  return (
    <div className={`text-xs leading-relaxed ${isAxis ? 'text-violet-900 dark:text-violet-200 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
      {lines.map((line, i) => (
        <span key={i} className="block">{line}</span>
      ))}
      {cell.sample && (
        <span className="mt-1 inline-block text-[10px] text-amber-600 dark:text-amber-400 italic">(sample — verify)</span>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PolicyChecklist({ onBack }: { onBack: () => void }) {
  const [statusMap, setStatusMap] = useState<Record<string, Record<BankId, GatherStatus>>>(() => {
    // Axis is always "gathered" (verified from policy doc)
    const init: Record<string, Record<BankId, GatherStatus>> = {};
    ROWS.forEach(row => {
      init[row.id] = {
        axis:  'gathered',
        sbi:   'pending',
        hdfc:  'pending',
        icici: 'pending',
        kotak: 'pending',
        bob:   'pending',
      };
    });
    return init;
  });

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleStatus = (rowId: string, bankId: BankId) => {
    if (bankId === 'axis') return; // Axis is locked as verified
    setStatusMap(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [bankId]: nextStatus(prev[rowId][bankId]),
      },
    }));
  };

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('darkMode', String(next));
  };

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase();
    return ROWS.filter(row => {
      const catMatch = activeCategory === 'All' || row.category === activeCategory;
      const searchMatch = !q ||
        row.parameter.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        Object.values(row.banks).some(b => b.value.toLowerCase().includes(q));
      return catMatch && searchMatch;
    });
  }, [activeCategory, search]);

  // Progress stats per bank
  const stats = useMemo(() => {
    const result: Record<BankId, { gathered: number; total: number }> = {
      axis: { gathered: ROWS.length, total: ROWS.length },
      sbi: { gathered: 0, total: ROWS.length },
      hdfc: { gathered: 0, total: ROWS.length },
      icici: { gathered: 0, total: ROWS.length },
      kotak: { gathered: 0, total: ROWS.length },
      bob: { gathered: 0, total: ROWS.length },
    };
    ROWS.forEach(row => {
      (Object.keys(result) as BankId[]).forEach(bankId => {
        if (bankId !== 'axis' && statusMap[row.id]?.[bankId] === 'gathered') {
          result[bankId].gathered++;
        }
      });
    });
    return result;
  }, [statusMap]);

  const categorizedRows = useMemo(() => {
    const grouped: Record<string, PolicyRow[]> = {};
    filteredRows.forEach(row => {
      if (!grouped[row.category]) grouped[row.category] = [];
      grouped[row.category].push(row);
    });
    return grouped;
  }, [filteredRows]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm print:static print:shadow-none">
        <div className="w-full px-4 sm:px-6 flex items-center justify-between h-14 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors print:hidden"
            >
              <span>←</span>
              <span className="hidden sm:inline">Back to Checker</span>
            </button>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 shrink-0 print:hidden" />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none truncate">
                Bank Policy Data Checklist
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-none mt-0.5">
                Axis Finance LAP (base) · {ROWS.length} parameters · {BANKS.length} banks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="print:hidden text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Print / Export
            </button>
            <button
              type="button"
              onClick={toggleDark}
              className="print:hidden text-sm px-2 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 py-6 space-y-4">

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-violet-700 shrink-0" />
              <span><strong className="text-violet-700 dark:text-violet-300">Axis Finance LAP</strong> — verified from policy document (OGL June 2025). Use as the reference base.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-600 dark:text-amber-400 italic font-medium">(sample — verify)</span>
              <span>Other banks show indicative/typical values. Verify against each bank's current credit policy before use.</span>
            </div>
            <div className="flex items-center gap-6">
              <StatusBadge status="pending" />
              <StatusBadge status="gathered" />
              <StatusBadge status="na" />
              <span>Click a status badge in any non-Axis cell to mark it. Use this to track which parameters you have verified.</span>
            </div>
          </div>
        </div>

        {/* ── Progress summary ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {BANKS.map(bank => {
            const s = stats[bank.id as BankId];
            const pct = Math.round((s.gathered / s.total) * 100);
            return (
              <div key={bank.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-center">
                <div className={`w-8 h-8 rounded-full ${bank.color} mx-auto flex items-center justify-center text-white text-xs font-bold mb-2`}>
                  {bank.short.slice(0, 3)}
                </div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight mb-1">{bank.short}</div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${bank.verified ? 'bg-violet-500' : 'bg-green-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {s.gathered}/{s.total} · {pct}%
                  {bank.verified && <span className="ml-1 text-violet-600 dark:text-violet-400">✓</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 items-center print:hidden">
          <input
            type="search"
            placeholder="Search parameters..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] max-w-xs text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex flex-wrap gap-1.5">
            {['All', ...ALL_CATEGORIES].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: '1100px' }}>
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  {/* Parameter columns */}
                  <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-4 py-3 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '200px' }}>
                    Category / Parameter
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 py-3 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '80px' }}>
                    Data Type
                  </th>
                  {/* Bank columns */}
                  {BANKS.map(bank => (
                    <th
                      key={bank.id}
                      className={`text-center text-xs font-semibold px-3 py-3 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap ${bank.verified ? 'bg-violet-50 dark:bg-violet-950/40' : ''}`}
                      style={{ minWidth: '160px' }}
                    >
                      <div className={`inline-flex items-center gap-1.5 ${bank.text}`}>
                        <div className={`w-4 h-4 rounded-full ${bank.color} shrink-0`} />
                        <span>{bank.short}</span>
                        {bank.verified && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-bold">
                            BASE
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {Object.entries(categorizedRows).map(([category, rows]) => (
                  <React.Fragment key={category}>
                    {/* Category separator */}
                    <tr className="bg-gray-100 dark:bg-gray-800/60 border-t-2 border-gray-200 dark:border-gray-600">
                      <td
                        colSpan={2 + BANKS.length}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400"
                      >
                        {category}
                      </td>
                    </tr>

                    {rows.map((row, rowIdx) => {
                      const isEven = rowIdx % 2 === 0;
                      const rowBg = isEven ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-900/50';

                      return (
                        <tr
                          key={row.id}
                          className={`border-t border-gray-100 dark:border-gray-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors ${rowBg}`}
                        >
                          {/* Parameter */}
                          <td className={`sticky left-0 z-10 px-4 py-3 border-r border-gray-100 dark:border-gray-800 align-top ${rowBg}`}>
                            <div className="font-medium text-gray-800 dark:text-gray-200 text-xs leading-snug">
                              {row.parameter}
                            </div>
                            {row.notes && (
                              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug italic">
                                {row.notes}
                              </div>
                            )}
                          </td>

                          {/* Data type */}
                          <td className="px-3 py-3 border-r border-gray-100 dark:border-gray-800 align-top">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                              {row.dataType}
                            </span>
                          </td>

                          {/* Bank cells */}
                          {BANKS.map(bank => {
                            const bankId = bank.id as BankId;
                            const cell = row.banks[bankId];
                            const cellStatus = statusMap[row.id]?.[bankId] ?? 'pending';
                            const isAxis = bankId === 'axis';

                            return (
                              <td
                                key={bankId}
                                className={`px-3 py-3 border-r border-gray-100 dark:border-gray-800 align-top ${isAxis ? 'bg-violet-50/60 dark:bg-violet-950/20' : ''}`}
                              >
                                <ValueCell cell={cell} bankId={bankId} />
                                <div className="mt-2">
                                  <StatusBadge
                                    status={cellStatus}
                                    onClick={isAxis ? undefined : () => toggleStatus(row.id, bankId)}
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-600 py-4 print:mt-8">
          Axis Finance LAP values sourced from LAP Policy OGL (June 2025). All other bank values are indicative samples
          based on publicly available information and are subject to change. Verify against each lender's current
          credit policy before use. Not a bank decision or official guidance.
        </div>
      </div>
    </div>
  );
}
