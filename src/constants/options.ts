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
