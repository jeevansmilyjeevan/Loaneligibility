import type {
  LoanPurpose,
  PropertyType,
  EmploymentType,
  RateType,
  CoApplicantRelationship,
} from '../types';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

export const LOAN_PURPOSES: SelectOption<LoanPurpose>[] = [
  { value: 'ready_property_purchase',       label: 'Ready Property Purchase',         description: 'Purchase of a completed / ready-to-move property' },
  { value: 'under_construction_purchase',   label: 'Under-Construction Purchase',     description: 'Purchase of a property currently being built' },
  { value: 'self_construction',             label: 'Self Construction',               description: 'Constructing a house on your own plot' },
  { value: 'plot_construction',             label: 'Plot + Construction',             description: 'Buying a plot and constructing a house on it' },
  { value: 'home_renovation',              label: 'Home Renovation / Improvement',   description: 'Renovating or improving an existing property' },
  { value: 'home_extension',               label: 'Home Extension',                  description: 'Adding rooms or expanding an existing structure' },
  { value: 'balance_transfer',             label: 'Balance Transfer',                description: 'Transfer of an existing home loan from another lender' },
  { value: 'top_up',                       label: 'Top-Up Loan',                     description: 'Additional loan on an existing home loan' },
];

export const PROPERTY_TYPES: SelectOption<PropertyType>[] = [
  { value: 'flat_apartment',     label: 'Flat / Apartment',      description: 'Multi-storey residential unit' },
  { value: 'villa',              label: 'Villa',                 description: 'Standalone villa in a gated community' },
  { value: 'independent_house', label: 'Independent House',     description: 'Standalone house on its own plot' },
  { value: 'residential_plot',  label: 'Residential Plot',      description: 'A plot approved for residential construction' },
];

export const EMPLOYMENT_TYPES: SelectOption<EmploymentType>[] = [
  { value: 'salaried',      label: 'Salaried',      description: 'Government, PSU, or private sector employee' },
  { value: 'self_employed', label: 'Self-Employed',  description: 'Business owner, professional, or freelancer' },
];

export const MARITAL_STATUSES: SelectOption[] = [
  { value: 'single',   label: 'Single' },
  { value: 'married',  label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed',  label: 'Widowed' },
];

export const DEFAULT_SEVERITIES: SelectOption[] = [
  { value: 'none',   label: 'None — clean record' },
  { value: 'minor',  label: 'Minor — 1–2 late payments, resolved' },
  { value: 'major',  label: 'Major — written-off, settled, or 90+ DPD' },
  { value: 'wilful', label: 'Wilful default / fraud flag' },
];

export const REPAYMENT_HISTORIES: SelectOption[] = [
  { value: 'excellent', label: 'Excellent — always on time' },
  { value: 'good',      label: 'Good — occasional minor delays' },
  { value: 'fair',      label: 'Fair — some missed payments' },
  { value: 'poor',      label: 'Poor — frequent defaults or DPD' },
];

export const RATE_TYPES: SelectOption<RateType>[] = [
  { value: 'floating', label: 'Floating Rate',  description: 'Linked to benchmark rate; changes periodically' },
  { value: 'fixed',    label: 'Fixed Rate',     description: 'Fixed for a defined period; typically higher' },
];

export const CO_APPLICANT_RELATIONSHIPS: SelectOption<CoApplicantRelationship>[] = [
  { value: 'spouse',      label: 'Spouse' },
  { value: 'parent',      label: 'Parent' },
  { value: 'son_daughter', label: 'Son / Daughter' },
  { value: 'sibling',     label: 'Sibling' },
  { value: 'other',       label: 'Other' },
];

export const LOAN_TYPES_FOR_EXISTING: SelectOption[] = [
  { value: 'home_loan',       label: 'Home Loan' },
  { value: 'personal_loan',   label: 'Personal Loan' },
  { value: 'car_loan',        label: 'Car / Vehicle Loan' },
  { value: 'education_loan',  label: 'Education Loan' },
  { value: 'credit_card',     label: 'Credit Card EMI' },
  { value: 'business_loan',   label: 'Business Loan' },
  { value: 'other',           label: 'Other' },
];

export const PRODUCT_VARIANTS: SelectOption[] = [
  { value: 'standard',     label: 'Standard Home Loan' },
  { value: 'affordable',   label: 'Affordable Home Loan' },
  { value: 'nri',          label: 'NRI Home Loan' },
  { value: 'balance_transfer', label: 'Balance Transfer' },
  { value: 'top_up',       label: 'Top-Up Loan' },
];

// ─── Banks & Loan Plans ───────────────────────────────────────────────────────

export interface BankPlan {
  id: string;
  name: string;
  description: string;
  rateMin: number;
  rateMax: number;
  highlights: string[];
}

export interface Bank {
  id: string;
  name: string;
  shortName: string;
  color: string;
  plans: BankPlan[];
}

export const BANKS: Bank[] = [
  {
    id: 'sbi', name: 'State Bank of India', shortName: 'SBI', color: 'bg-blue-800',
    plans: [
      { id: 'sbi_regular',  name: 'SBI Home Loan',      description: 'Standard home loan for salaried & self-employed applicants.', rateMin: 8.50, rateMax: 10.15, highlights: ['Max ₹10 Cr', 'Up to 30 yrs', 'No prepayment charges'] },
      { id: 'sbi_maxgain',  name: 'SBI MaxGain',         description: 'Home loan with overdraft facility for flexible repayment.', rateMin: 8.75, rateMax: 10.25, highlights: ['OD facility', 'Interest savings', 'Online banking'] },
      { id: 'sbi_privilege',name: 'SBI Privilege',       description: 'Exclusive plan for government & defence employees.', rateMin: 8.50, rateMax: 9.65, highlights: ['Govt employees only', 'Lower rate', 'Tax benefits'] },
      { id: 'sbi_flexipay', name: 'SBI Flexipay',        description: 'Step-up EMI for young salaried professionals.', rateMin: 8.75, rateMax: 10.15, highlights: ['Lower initial EMI', 'Step-up repayment', 'Higher eligibility'] },
    ],
  },
  {
    id: 'hdfc', name: 'HDFC Bank', shortName: 'HDFC', color: 'bg-red-600',
    plans: [
      { id: 'hdfc_regular', name: 'HDFC Home Loan',      description: 'Standard home loan for purchase, construction & renovation.', rateMin: 8.75, rateMax: 9.65, highlights: ['Max ₹10 Cr', 'Up to 30 yrs', 'Part prepayment free'] },
      { id: 'hdfc_rural',   name: 'HDFC Rural Housing',  description: 'For purchase or construction in rural / semi-urban areas.', rateMin: 9.00, rateMax: 10.00, highlights: ['Rural properties', 'Kisan credit eligible', 'Agri income accepted'] },
      { id: 'hdfc_reach',   name: 'HDFC Reach',          description: 'Affordable housing for informal income borrowers.', rateMin: 9.40, rateMax: 14.00, highlights: ['Informal income', 'Low ticket size', 'PMAY eligible'] },
    ],
  },
  {
    id: 'icici', name: 'ICICI Bank', shortName: 'ICICI', color: 'bg-orange-600',
    plans: [
      { id: 'icici_regular',name: 'ICICI Home Loan',     description: 'Comprehensive home loan with instant online approval.', rateMin: 8.75, rateMax: 9.80, highlights: ['Instant sanction', 'Online process', 'Balance transfer'] },
      { id: 'icici_plot',   name: 'ICICI Plot Loan',     description: 'Loan for purchase of a residential plot.', rateMin: 9.00, rateMax: 10.50, highlights: ['Plot purchase', 'Up to 70% LTV', '15 yr tenure'] },
      { id: 'icici_nri',    name: 'ICICI NRI Loan',      description: 'Tailored for Non-Resident Indians buying in India.', rateMin: 9.00, rateMax: 10.00, highlights: ['NRI & OCI eligible', 'NRE/NRO repayment', 'Power of attorney'] },
    ],
  },
  {
    id: 'axis', name: 'Axis Bank', shortName: 'Axis', color: 'bg-violet-700',
    plans: [
      { id: 'axis_regular',     name: 'Axis Home Loan',      description: 'Flexible home loan with competitive floating rates.', rateMin: 8.75, rateMax: 9.65, highlights: ['Zero foreclosure', 'Digital process', 'Max ₹5 Cr'] },
      { id: 'axis_super_saver', name: 'Axis Super Saver',    description: 'Linked savings account reduces effective interest cost.', rateMin: 8.75, rateMax: 9.65, highlights: ['Linked savings', 'Interest savings', 'Flexible withdrawal'] },
      { id: 'axis_shubh',       name: 'Axis Shubh Aarambh', description: 'Affordable housing under PMAY for first-time buyers.', rateMin: 9.40, rateMax: 13.50, highlights: ['PMAY subsidy', 'First-time buyers', 'Affordable segment'] },
    ],
  },
  {
    id: 'kotak', name: 'Kotak Mahindra Bank', shortName: 'Kotak', color: 'bg-rose-600',
    plans: [
      { id: 'kotak_regular', name: 'Kotak Home Loan',    description: 'Competitive home loan with quick doorstep disbursal.', rateMin: 8.75, rateMax: 9.85, highlights: ['Quick approval', 'Doorstep service', 'Part prepayment free'] },
      { id: 'kotak_nri',     name: 'Kotak NRI Loan',     description: 'Home loan designed for Non-Resident Indians.', rateMin: 9.00, rateMax: 10.50, highlights: ['NRI eligible', 'NRE/NRO accounts', 'Online application'] },
    ],
  },
  {
    id: 'bob', name: 'Bank of Baroda', shortName: 'BoB', color: 'bg-amber-600',
    plans: [
      { id: 'bob_regular',    name: 'Baroda Home Loan',  description: 'Competitive home loan for all property types.', rateMin: 8.40, rateMax: 10.60, highlights: ['Low PSU rate', 'Up to 30 yrs', 'No processing fee*'] },
      { id: 'bob_advantage',  name: 'Baroda Advantage',  description: 'Home loan with top-up and overdraft features.', rateMin: 8.60, rateMax: 10.90, highlights: ['Top-up facility', 'OD option', 'Existing customer discount'] },
    ],
  },
  {
    id: 'lic', name: 'LIC Housing Finance', shortName: 'LIC HFL', color: 'bg-green-700',
    plans: [
      { id: 'lic_regular', name: 'LIC HFL Home Loan',    description: 'Trusted housing finance from India\'s largest insurer.', rateMin: 8.50, rateMax: 10.75, highlights: ['LIC policyholder pref.', 'Up to 30 yrs', 'Insurance bundled'] },
      { id: 'lic_griha',   name: 'LIC Griha Suvidha',    description: 'Composite loan for plot purchase and construction.', rateMin: 8.65, rateMax: 10.90, highlights: ['Plot + construction', 'Stage-wise disbursal', 'LIC policy benefit'] },
    ],
  },
  {
    id: 'bajaj', name: 'Bajaj Housing Finance', shortName: 'Bajaj', color: 'bg-blue-700',
    plans: [
      { id: 'bajaj_regular', name: 'Bajaj Home Loan',    description: 'Digital-first home loan with 10-minute sanction letter.', rateMin: 8.50, rateMax: 15.00, highlights: ['Online approval', '10 min sanction', 'Balance transfer'] },
      { id: 'bajaj_bt',      name: 'Bajaj Balance Transfer', description: 'Transfer your existing home loan for a lower rate.', rateMin: 8.50, rateMax: 13.00, highlights: ['Lower EMI', 'Top-up available', 'Zero prepayment'] },
    ],
  },
  {
    id: 'pnb', name: 'Punjab National Bank', shortName: 'PNB', color: 'bg-indigo-800',
    plans: [
      { id: 'pnb_regular',   name: 'PNB Home Loan',     description: 'Standard home loan from India\'s second-largest PSU bank.', rateMin: 8.50, rateMax: 10.25, highlights: ['PSU bank rates', 'Women borrower discount', 'Up to 30 yrs'] },
      { id: 'pnb_gen_next',  name: 'PNB Gen-Next',      description: 'Step-up home loan designed for young professionals.', rateMin: 8.50, rateMax: 10.25, highlights: ['Young professionals', 'Step-up EMI', 'Higher eligibility'] },
    ],
  },
  {
    id: 'canara', name: 'Canara Bank', shortName: 'Canara', color: 'bg-teal-700',
    plans: [
      { id: 'canara_regular', name: 'Canara Home Loan',  description: 'Affordable home loan from a leading public sector bank.', rateMin: 8.40, rateMax: 11.25, highlights: ['Low base rate', 'Govt employees pref.', 'Up to 30 yrs'] },
      { id: 'canara_awas',    name: 'Canara Awas',       description: 'Composite loan for plot purchase and construction.', rateMin: 8.50, rateMax: 11.25, highlights: ['Plot + construction', 'Flexible disbursal', 'Rural eligible'] },
    ],
  },
];

export const STEP_LABELS: string[] = [
  'Loan Basics',
  'Applicant Info',
  'Property & LTV',
  'Credit Profile',
  'Income & FOIR',
  'Co-Applicant',
  'Rate & Product',
  'Charges',
  'Prepayment',
  'Risk Summary',
  'Final Result',
];
