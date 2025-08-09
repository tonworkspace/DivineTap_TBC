import  { FC, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

interface OnboardingDebuggerProps {
  formData: any;
  currentStep: number;
  validateCurrentStep: () => boolean;
  isSubmitting: boolean;
}

export const OnboardingDebugger: FC<OnboardingDebuggerProps> = ({
  formData,
  currentStep,
  validateCurrentStep,
  isSubmitting
}) => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [showDebugger, setShowDebugger] = useState(false);

  useEffect(() => {
    const updateDebugInfo = () => {
      const info = {
        timestamp: new Date().toISOString(),
        user: user ? {
          id: user.id,
          telegram_id: user.telegram_id,
          username: user.username
        } : 'NO USER',
        currentStep,
        formData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          tonWalletAddress: formData.tonWalletAddress,
          isTBCian: formData.isTBCian,
          tbcHoldings: formData.tbcHoldings,
          agreedToTerms: formData.agreedToTerms
        },
        validation: {
          step1: formData.firstName?.trim() !== '' && formData.lastName?.trim() !== '',
          step2: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email || ''),
          step3: formData.tonWalletAddress?.trim() !== '',
          step4: true, // Always true (optional)
          step5: formData.agreedToTerms,
          overall: validateCurrentStep()
        },
        isSubmitting,
        localStorage: {
          onboardingCompleted: localStorage.getItem(`onboarding_completed_${user?.id}`),
          sessionStorage: sessionStorage.getItem(`onboarding_completed_${user?.id}`)
        }
      };
      setDebugInfo(info);
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [user, currentStep, formData, validateCurrentStep, isSubmitting]);

  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, telegram_id, onboarding_completed')
        .eq('id', user?.id)
        .single();
      
      if (error) {
        console.error('Database test failed:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Database test error:', error);
      return { success: false, error: 'Unknown error' };
    }
  };

  const resetOnboarding = async () => {
    if (!user?.id) return;
    
    try {
      // Clear localStorage
      localStorage.removeItem(`onboarding_completed_${user.id}`);
      sessionStorage.removeItem(`onboarding_completed_${user.id}`);
      
      // Reset in database
      const { error } = await supabase
        .from('users')
        .update({
          onboarding_completed: false,
          onboarding_completed_at: null,
          terms_accepted: false,
          terms_accepted_at: null
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Reset failed:', error);
        alert('Reset failed: ' + error.message);
      } else {
        alert('Onboarding reset successfully! Page will reload.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Reset error:', error);
      alert('Reset error: ' + error);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-60">
      <button
        onClick={() => setShowDebugger(!showDebugger)}
        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 mb-2"
      >
        {showDebugger ? 'Hide Debug' : 'Show Debug'}
      </button>
      
      {showDebugger && (
        <div className="bg-black/90 text-white text-xs p-4 rounded max-w-md max-h-96 overflow-auto">
          <h3 className="font-bold mb-2">🔍 Onboarding Debugger</h3>
          
          <div className="space-y-2">
            <div>
              <strong>User:</strong>
              <pre className="text-green-400">{JSON.stringify(debugInfo.user, null, 2)}</pre>
            </div>
            
            <div>
              <strong>Current Step:</strong> {currentStep}
            </div>
            
            <div>
              <strong>Form Data:</strong>
              <pre className="text-blue-400">{JSON.stringify(debugInfo.formData, null, 2)}</pre>
            </div>
            
            <div>
              <strong>Validation:</strong>
              <pre className="text-yellow-400">{JSON.stringify(debugInfo.validation, null, 2)}</pre>
            </div>
            
            <div>
              <strong>Storage:</strong>
              <pre className="text-purple-400">{JSON.stringify(debugInfo.localStorage, null, 2)}</pre>
            </div>
            
            <div>
              <strong>Is Submitting:</strong> {isSubmitting ? 'Yes' : 'No'}
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <button
              onClick={testDatabaseConnection}
              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 mr-2"
            >
              Test DB
            </button>
            
            <button
              onClick={resetOnboarding}
              className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700"
            >
              Reset Onboarding
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 