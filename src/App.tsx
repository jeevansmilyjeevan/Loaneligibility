import React from 'react';
import { WizardProvider, useWizard } from './context/WizardContext';
import { Layout } from './components/layout/Layout';
import { PolicyChecklist } from './pages/PolicyChecklist';
import { Step1LoanBasics } from './components/steps/Step1LoanBasics';
import { Step2ApplicantInfo } from './components/steps/Step2ApplicantInfo';
import { Step3PropertyValuation } from './components/steps/Step3PropertyValuation';
import { Step4CreditProfile } from './components/steps/Step4CreditProfile';
import { Step5Income } from './components/steps/Step5Income';
import { Step6CoApplicant } from './components/steps/Step6CoApplicant';
import { Step7ProductVariant } from './components/steps/Step7ProductVariant';
import { Step8Charges } from './components/steps/Step8Charges';
import { Step9Prepayment } from './components/steps/Step9Prepayment';
import { Step10ReviewSummary } from './components/steps/Step10ReviewSummary';
import { Step11FinalDecision } from './components/steps/Step11FinalDecision';
import { Button } from './components/ui/Button';
import { Alert } from './components/ui/Alert';

const STEP_COMPONENTS = [
  Step1LoanBasics,
  Step2ApplicantInfo,
  Step3PropertyValuation,
  Step4CreditProfile,
  Step5Income,
  Step6CoApplicant,
  Step7ProductVariant,
  Step8Charges,
  Step9Prepayment,
  Step10ReviewSummary,
  Step11FinalDecision,
];

function WizardContent() {
  const { state, loadDraft, hasDraft, resetWizard } = useWizard();
  const [draftDismissed, setDraftDismissed] = React.useState(false);
  const [draftLoaded, setDraftLoaded] = React.useState(false);

  const handleLoadDraft = () => {
    loadDraft();
    setDraftLoaded(true);
    setDraftDismissed(true);
  };

  const StepComponent = STEP_COMPONENTS[state.currentStep] ?? Step1LoanBasics;

  return (
    <>
      {/* Draft banner */}
      {hasDraft && !draftDismissed && state.currentStep === 0 && (
        <Alert type="info" className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span>A saved draft was found. Would you like to continue where you left off?</span>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleLoadDraft}>
                Load Draft
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDraftDismissed(true)}>
                Start Fresh
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Render current step with animation key */}
      <div key={state.currentStep} className="animate-slide-in">
        <StepComponent />
      </div>
    </>
  );
}

export default function App() {
  const [page, setPage] = React.useState<'wizard' | 'checklist'>(() =>
    window.location.hash === '#checklist' ? 'checklist' : 'wizard'
  );

  const navTo = (p: 'wizard' | 'checklist') => {
    window.location.hash = p === 'checklist' ? 'checklist' : '';
    setPage(p);
  };

  if (page === 'checklist') {
    return <PolicyChecklist onBack={() => navTo('wizard')} />;
  }

  return (
    <WizardProvider>
      <Layout onOpenChecklist={() => navTo('checklist')}>
        <WizardContent />
      </Layout>
    </WizardProvider>
  );
}
