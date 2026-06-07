import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type {
  WizardState,
  Step1Data, Step2Data, Step3Data, Step4Data,
  Step5Data, Step6Data, Step7Data, Step8Data, Step9Data,
  EligibilityResult,
} from '../types';
import { computeEligibility } from '../engine/eligibility';

// ─── Initial State ────────────────────────────────────────────────────────────

const INITIAL_STATE: WizardState = {
  currentStep: 0,
  completedSteps: new Set<number>(),
  step1: {
    selectedBank: '',
    selectedPlan: '',
    desiredLoanAmount: '',
    requestedTenureMonths: 240,
    loanPurpose: '',
    propertyType: '',
    underwritingProgram: '',
    cityCategory: '',
    hasAadhaar: false,
    hasPAN: false,
    hasAddressProof: false,
    hasSaleAgreement: false,
    hasTitleDeed: false,
    hasBuildingApproval: false,
  },
  step2: {
    applicantName: '',
    dateOfBirth: '',
    employmentType: '',
    maritalStatus: '',
  },
  step3: {
    marketValue: '',
    agreementValue: '',
    ownContribution: '',
    useAgreementValueIfLower: true,
  },
  step4: {
    creditScore: '',
    hasDefaults: false,
    defaultDetails: '',
    defaultSeverity: 'none',
    existingLoans: [],
    repaymentHistory: '',
  },
  step5: {
    monthlyNetIncome: '',
    otherMonthlyIncome: '',
    employmentStabilityYears: '',
    hasSalarySlips: false,
    hasITR: false,
    hasBankStatements: false,
    hasFormSixteen: false,
    hasGSTReturns: false,
    hasAuditedFinancials: false,
  },
  step6: {
    numberOfPropertyOwners: 1,
    numberOfCoApplicants: 1,
    coApplicantRelationship: '',
    allOwnersIncluded: true,
    coApplicantIncome: '',
  },
  step7: { rateType: '', productVariant: 'standard' },
  step8: { wantsChargesPreview: true, loanCategory: '' },
  step9: { intendsToPrepay: false, anticipatedPrepaymentBehavior: 'none', preferEMIReduction: true },
  lastSaved: null,
};

const STORAGE_KEY = 'loanEligibilityDraft';

// ─── Serialization (Set ↔ Array for localStorage) ─────────────────────────────

function serialize(state: WizardState): string {
  return JSON.stringify({ ...state, completedSteps: [...state.completedSteps] });
}

function deserialize(raw: string): WizardState {
  const parsed = JSON.parse(raw);
  return { ...parsed, completedSteps: new Set<number>(parsed.completedSteps ?? []) };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'UPDATE_STEP1'; payload: Partial<Step1Data> }
  | { type: 'UPDATE_STEP2'; payload: Partial<Step2Data> }
  | { type: 'UPDATE_STEP3'; payload: Partial<Step3Data> }
  | { type: 'UPDATE_STEP4'; payload: Partial<Step4Data> }
  | { type: 'UPDATE_STEP5'; payload: Partial<Step5Data> }
  | { type: 'UPDATE_STEP6'; payload: Partial<Step6Data> }
  | { type: 'UPDATE_STEP7'; payload: Partial<Step7Data> }
  | { type: 'UPDATE_STEP8'; payload: Partial<Step8Data> }
  | { type: 'UPDATE_STEP9'; payload: Partial<Step9Data> }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'COMPLETE_STEP'; payload: number }
  | { type: 'RESET' }
  | { type: 'LOAD_DRAFT'; payload: WizardState };

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'UPDATE_STEP1': return { ...state, step1: { ...state.step1, ...action.payload } };
    case 'UPDATE_STEP2': return { ...state, step2: { ...state.step2, ...action.payload } };
    case 'UPDATE_STEP3': return { ...state, step3: { ...state.step3, ...action.payload } };
    case 'UPDATE_STEP4': return { ...state, step4: { ...state.step4, ...action.payload } };
    case 'UPDATE_STEP5': return { ...state, step5: { ...state.step5, ...action.payload } };
    case 'UPDATE_STEP6': return { ...state, step6: { ...state.step6, ...action.payload } };
    case 'UPDATE_STEP7': return { ...state, step7: { ...state.step7, ...action.payload } };
    case 'UPDATE_STEP8': return { ...state, step8: { ...state.step8, ...action.payload } };
    case 'UPDATE_STEP9': return { ...state, step9: { ...state.step9, ...action.payload } };
    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload };
    case 'COMPLETE_STEP': {
      const completed = new Set(state.completedSteps);
      completed.add(action.payload);
      return { ...state, completedSteps: completed };
    }
    case 'RESET': return { ...INITIAL_STATE, completedSteps: new Set<number>() };
    case 'LOAD_DRAFT': return action.payload;
    default: return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface WizardContextValue {
  state: WizardState;
  eligibilityResult: EligibilityResult | null;
  updateStep1: (p: Partial<Step1Data>) => void;
  updateStep2: (p: Partial<Step2Data>) => void;
  updateStep3: (p: Partial<Step3Data>) => void;
  updateStep4: (p: Partial<Step4Data>) => void;
  updateStep5: (p: Partial<Step5Data>) => void;
  updateStep6: (p: Partial<Step6Data>) => void;
  updateStep7: (p: Partial<Step7Data>) => void;
  updateStep8: (p: Partial<Step8Data>) => void;
  updateStep9: (p: Partial<Step9Data>) => void;
  goToStep: (step: number) => void;
  completeStep: (step: number) => void;
  resetWizard: () => void;
  saveDraft: () => void;
  hasDraft: boolean;
  loadDraft: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [hasDraft, setHasDraft] = React.useState(false);

  // Check for draft on mount
  useEffect(() => {
    setHasDraft(!!localStorage.getItem(STORAGE_KEY));
  }, []);

  // Auto-save on every state change (debounced by useEffect)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, serialize({ ...state, lastSaved: new Date().toISOString() }));
        setHasDraft(true);
      } catch {
        // localStorage may be unavailable (private browsing)
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [state]);

  const updateStep1 = useCallback((p: Partial<Step1Data>) => dispatch({ type: 'UPDATE_STEP1', payload: p }), []);
  const updateStep2 = useCallback((p: Partial<Step2Data>) => dispatch({ type: 'UPDATE_STEP2', payload: p }), []);
  const updateStep3 = useCallback((p: Partial<Step3Data>) => dispatch({ type: 'UPDATE_STEP3', payload: p }), []);
  const updateStep4 = useCallback((p: Partial<Step4Data>) => dispatch({ type: 'UPDATE_STEP4', payload: p }), []);
  const updateStep5 = useCallback((p: Partial<Step5Data>) => dispatch({ type: 'UPDATE_STEP5', payload: p }), []);
  const updateStep6 = useCallback((p: Partial<Step6Data>) => dispatch({ type: 'UPDATE_STEP6', payload: p }), []);
  const updateStep7 = useCallback((p: Partial<Step7Data>) => dispatch({ type: 'UPDATE_STEP7', payload: p }), []);
  const updateStep8 = useCallback((p: Partial<Step8Data>) => dispatch({ type: 'UPDATE_STEP8', payload: p }), []);
  const updateStep9 = useCallback((p: Partial<Step9Data>) => dispatch({ type: 'UPDATE_STEP9', payload: p }), []);
  const goToStep = useCallback((step: number) => dispatch({ type: 'GO_TO_STEP', payload: step }), []);
  const completeStep = useCallback((step: number) => dispatch({ type: 'COMPLETE_STEP', payload: step }), []);
  const resetWizard = useCallback(() => {
    dispatch({ type: 'RESET' });
    localStorage.removeItem(STORAGE_KEY);
    setHasDraft(false);
  }, []);
  const saveDraft = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, serialize({ ...state, lastSaved: new Date().toISOString() }));
    setHasDraft(true);
  }, [state]);
  const loadDraft = useCallback(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        dispatch({ type: 'LOAD_DRAFT', payload: deserialize(raw) });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Compute eligibility whenever steps 1–9 are non-trivially filled
  const eligibilityResult = useMemo<EligibilityResult | null>(() => {
    if (!state.step2.dateOfBirth && !state.step1.desiredLoanAmount) return null;
    return computeEligibility(state);
  }, [state]);

  const value = useMemo<WizardContextValue>(
    () => ({
      state,
      eligibilityResult,
      updateStep1, updateStep2, updateStep3, updateStep4, updateStep5,
      updateStep6, updateStep7, updateStep8, updateStep9,
      goToStep, completeStep, resetWizard, saveDraft, hasDraft, loadDraft,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, eligibilityResult, hasDraft],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used inside WizardProvider');
  return ctx;
}
