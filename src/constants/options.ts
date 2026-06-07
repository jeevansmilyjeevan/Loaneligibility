import type {
  LoanPurpose,
  PropertyType,
  EmploymentType,
  RateType,
  CoApplicantRelationship,
  UnderwritingProgram,
  CityCategory,
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

// Axis LAP — purposes are different from standard home loan
export const LAP_PURPOSES: SelectOption<LoanPurpose>[] = [
  { value: 'lap_business_purpose',   label: 'Business Requirement',   description: 'Working capital, business expansion, or equipment purchase' },
  { value: 'lap_personal_purpose',   label: 'Personal Requirement',   description: 'Education, medical, marriage, or other personal needs' },
  { value: 'lap_balance_transfer',   label: 'Balance Transfer',       description: 'Transfer an existing LAP from another lender for better terms' },
  { value: 'lap_top_up',             label: 'Top-Up Loan',            description: 'Additional loan on an existing LAP with satisfactory track record' },
];

export const PROPERTY_TYPES: SelectOption<PropertyType>[] = [
  { value: 'flat_apartment',     label: 'Flat / Apartment',      description: 'Multi-storey residential unit' },
  { value: 'villa',              label: 'Villa',                 description: 'Standalone villa in a gated community' },
  { value: 'independent_house', label: 'Independent House',     description: 'Standalone house on its own plot' },
  { value: 'residential_plot',  label: 'Residential Plot',      description: 'A plot approved for residential construction' },
];

// Axis LAP — collateral property types (different from home loan property types)
export const LAP_PROPERTY_TYPES: SelectOption<PropertyType>[] = [
  { value: 'lap_residential',    label: 'Residential',           description: 'Self-occupied or rented residential property (flat, house, villa) — LTV up to 70%' },
  { value: 'lap_commercial',     label: 'Commercial',            description: 'Office, shop, or commercial building — LTV up to 60%' },
  { value: 'lap_mixed_usage',    label: 'Mixed Usage',           description: 'Partly residential, partly commercial — LTV up to 60%' },
  { value: 'lap_plot',           label: 'Plot / Land',           description: 'Residential or commercial plot — LTV up to 60%' },
  { value: 'lap_special_usage',  label: 'Special Usage',         description: 'School, clinic, warehouse, industrial unit, hotel — LTV up to 55%' },
];

// Axis LAP — underwriting programs
export const UNDERWRITING_PROGRAMS: SelectOption<UnderwritingProgram>[] = [
  { value: 'normal_income',          label: 'Normal Income Program',       description: 'Salary / ITR-based income assessment — max ₹100 Cr' },
  { value: 'average_banking',        label: 'Average Banking (ABB)',        description: 'For customers with good banking behaviour, limited ITR — max ₹75 Cr' },
  { value: 'gst_program',            label: 'GST Program',                  description: 'GST return-based income surrogation — max ₹75 Cr' },
  { value: 'gross_margin',           label: 'Gross Margin Program (GMP)',   description: 'Turnover × deemed margin for self-employed — max ₹75 Cr' },
  { value: 'gpr_doctors',            label: 'Doctors Program (GPR)',        description: 'Gross professional receipts for registered doctors — max ₹25 Cr' },
  { value: 'liquid_income',          label: 'Liquid Income Program (LIP)',  description: 'CA-assessed cash flow for businesses — max ₹30 Cr' },
  { value: 'repayment_track',        label: 'Repayment Track Record (RTR)', description: 'Balance transfer + top-up based on existing EMI track — max ₹30 Cr' },
  { value: 'lease_rental_discounting', label: 'Lease Rental Discounting (LRD)', description: 'Revenue from property rentals used as income — max ₹100 Cr' },
];

// City category for Axis LAP loan cap
export const CITY_CATEGORIES: SelectOption<CityCategory>[] = [
  { value: 'metro_urban',  label: 'Metro / Urban',  description: 'Mumbai, Delhi, Bengaluru, Chennai, Hyderabad, Pune, Kolkata, Ahmedabad and similar large cities — max ₹7 Cr' },
  { value: 'semi_urban',   label: 'Semi-Urban',      description: 'Tier-2 cities and large towns — max ₹5 Cr' },
  { value: 'rural',        label: 'Rural',           description: 'Small towns and villages — max ₹3 Cr' },
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
      {
        id: 'axis_lap_normal',
        name: 'LAP — Normal Income',
        description: 'Loan Against Property for salaried & self-employed with standard ITR-based income documentation.',
        rateMin: 11.00, rateMax: 13.00,
        highlights: ['Max ₹100 Cr', 'Up to 20 yrs', 'Residential / Commercial'],
      },
      {
        id: 'axis_lap_abb',
        name: 'LAP — Average Banking (ABB)',
        description: 'Income surrogation through 12-month average bank balance for customers with limited income proof.',
        rateMin: 12.00, rateMax: 14.00,
        highlights: ['ABB surrogate', 'Max ₹75 Cr', 'SEP/SENP eligible'],
      },
      {
        id: 'axis_lap_gst',
        name: 'LAP — GST / GMP Program',
        description: 'Income derived from GST returns or Gross Margin for self-employed businesses.',
        rateMin: 12.00, rateMax: 14.00,
        highlights: ['GST surrogate', 'Max ₹75 Cr', 'Growing turnover preferred'],
      },
      {
        id: 'axis_lap_gpr',
        name: 'LAP — Doctors Program (GPR)',
        description: 'Tailored for registered medical professionals (MD/MBBS/BDS) based on gross professional receipts.',
        rateMin: 11.50, rateMax: 13.50,
        highlights: ['Doctors only', 'Max ₹25 Cr', 'MCI registration required'],
      },
      {
        id: 'axis_lap_rtr',
        name: 'LAP — Balance Transfer / RTR',
        description: 'Transfer your existing LAP from another lender with top-up based on clean repayment history.',
        rateMin: 11.00, rateMax: 13.00,
        highlights: ['12-mo clean track', 'Max ₹30 Cr', 'Top-up available'],
      },
      {
        id: 'axis_lap_lrd',
        name: 'LAP — Lease Rental Discounting',
        description: 'Loan against commercial property where rental income from reputed tenants services the EMI.',
        rateMin: 11.00, rateMax: 12.50,
        highlights: ['Rent-backed', 'Max ₹100 Cr', 'MNC / Fortune 500 tenants preferred'],
      },
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
