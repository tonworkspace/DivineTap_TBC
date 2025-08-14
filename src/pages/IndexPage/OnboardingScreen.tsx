import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  HiOutlineUser, 
  HiOutlineMail, 
  HiOutlineKey, 
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineShieldCheck
} from 'react-icons/hi';
import { useAuth } from '@/hooks/useAuth';
import { useTonAddress } from '@tonconnect/ui-react';
import { submitOnboardingForm, checkOnboardingStatus, type OnboardingFormData } from '@/lib/api';
import { useNotificationSystem } from '@/components/NotificationSystem';
import { supabase } from '@/lib/supabaseClient';
import { OnboardingDebugger } from '@/components/OnboardingDebugger';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  emoji: string;
}

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development';

// Debug logging function - only logs in development
const debugLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const OnboardingScreen: FC = () => {
  const { user } = useAuth();
  const userFriendlyAddress = useTonAddress();
  const { showSystemNotification, showAchievementNotification } = useNotificationSystem();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<OnboardingFormData>({
    firstName: '',
    lastName: '',
    email: '',
    tonWalletAddress: userFriendlyAddress || '',
    isTBCian: false,
    tbcHoldings: '',
    agreedToTerms: false
  });

  // Debug logging - only in development
  useEffect(() => {
    if (isDevelopment) {
      debugLog('🔍 OnboardingScreen Debug:', {
        user: user ? { id: user.id, username: user.username } : null,
        userFriendlyAddress,
        loading,
        shouldShow,
        currentStep
      });
      
  
    }
  }, [user, userFriendlyAddress, loading, shouldShow, currentStep]);

  // Memoize steps to prevent unnecessary re-renders
  const steps: OnboardingStep[] = useMemo(() => [
    {
      id: 'welcome',
      title: "Welcome to TBC Mining Revolution",
      description: "Complete your profile to unlock the full potential of The Billion Coin mining platform.",
      icon: <HiOutlineShieldCheck className="w-8 h-8 text-blue-400" />,
      emoji: "⛏️"
    },
    {
      id: 'personal',
      title: "Personal Information",
      description: "Tell us about yourself to personalize your mining experience.",
      icon: <HiOutlineUser className="w-8 h-8 text-blue-400" />,
      emoji: "👤"
    },
    {
      id: 'contact',
      title: "Contact Details",
      description: "We'll use this to send you important updates and rewards.",
      icon: <HiOutlineMail className="w-8 h-8 text-blue-400" />,
      emoji: "📧"
    },
    {
      id: 'wallet',
      title: "TON Wallet Connection",
      description: "Connect your TON wallet to receive mining rewards and manage your assets.",
      icon: <HiOutlineKey className="w-8 h-8 text-blue-400" />,
      emoji: "🔗"
    },
    {
      id: 'tbc-status',
      title: "TBC Community Status",
      description: "Are you part of the TBC community? This helps us provide better rewards.",
      icon: <HiOutlineCheckCircle className="w-8 h-8 text-blue-400" />,
      emoji: "💎"
    },
    {
      id: 'terms',
      title: "Terms & Conditions",
      description: "Please review and agree to our terms of service to continue.",
      icon: <HiOutlineDocumentText className="w-8 h-8 text-blue-400" />,
      emoji: "📋"
    }
  ], []);

  // Simplified onboarding check - force show for testing
  useEffect(() => {
    if (!user) {
      debugLog('❌ No user found');
      return;
    }

    debugLog('✅ User found, checking onboarding status...');

    const checkOnboarding = async () => {
      try {
        // Check if user has completed onboarding from database
        const hasCompletedOnboarding = await checkOnboardingStatus(user.id);
        debugLog('📊 Database onboarding status:', hasCompletedOnboarding);
        
        // Also check localStorage as backup
        const localStorageCompleted = localStorage.getItem(`onboarding_completed_${user.id}`);
        debugLog('📦 localStorage onboarding status:', localStorageCompleted);
        
        // Show onboarding only if NOT completed in both database and localStorage
        if (!hasCompletedOnboarding && !localStorageCompleted) {
          setShouldShow(true);
          debugLog('✅ Setting shouldShow to true - user needs onboarding');
        } else {
          setShouldShow(false);
          debugLog('❌ User has already completed onboarding - not showing');
        }

        // Reduced loading time for faster experience
        const loadingTimer = setTimeout(() => {
          setLoading(false);
          debugLog('⏰ Loading timer completed');
        }, 1000);

        return () => clearTimeout(loadingTimer);
      } catch (error) {
        debugLog('❌ Error checking onboarding status:', error);
        // Fallback to localStorage check only
        const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
        debugLog('📦 localStorage onboarding status (fallback):', hasCompletedOnboarding);
        
        if (!hasCompletedOnboarding) {
          setShouldShow(true);
          debugLog('✅ Setting shouldShow to true (fallback)');
        } else {
          setShouldShow(false);
          debugLog('❌ User has already completed onboarding (fallback)');
        }
        
        const loadingTimer = setTimeout(() => {
          setLoading(false);
          debugLog('⏰ Loading timer completed (fallback)');
        }, 1000);

        return () => clearTimeout(loadingTimer);
      }
    };

    checkOnboarding();
  }, [user]);

  // Update wallet address when connected - optimized with useCallback
  useEffect(() => {
    if (userFriendlyAddress) {
      setFormData(prev => ({
        ...prev,
        tonWalletAddress: userFriendlyAddress
      }));
      debugLog('🔗 Wallet address updated:', userFriendlyAddress);
    }
  }, [userFriendlyAddress]);

  // Optimized input change handler with useCallback
  const handleInputChange = useCallback((field: keyof OnboardingFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    debugLog('📝 Form field updated:', field, value);
  }, []);

  // Memoized validation function
  const validateCurrentStep = useCallback((): boolean => {
    debugLog('🔍 Validating step:', currentStep, 'Form data:', formData);
    
    switch (currentStep) {
      case 1: // Personal Information
        const personalValid = formData.firstName.trim() !== '' && formData.lastName.trim() !== '';
        debugLog('📝 Personal validation:', personalValid, { firstName: formData.firstName, lastName: formData.lastName });
        return personalValid;
      case 2: // Contact Details
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailValid = emailRegex.test(formData.email);
        debugLog('📧 Email validation:', emailValid, { email: formData.email });
        return emailValid;
      case 3: // Wallet Connection
        const walletValid = formData.tonWalletAddress.trim() !== '';
        debugLog('🔗 Wallet validation:', walletValid, { wallet: formData.tonWalletAddress });
        return walletValid;
      case 4: // TBC Status
        debugLog('💎 TBC status validation: always true (optional)');
        return true; // Always valid as it's optional
      case 5: // Terms
        const termsValid = formData.agreedToTerms;
        debugLog('📋 Terms validation:', termsValid, { agreedToTerms: formData.agreedToTerms });
        return termsValid;
      default:
        debugLog('✅ Default validation: always true');
        return true;
    }
  }, [currentStep, formData]);

  // Enhanced debugging function
  const debugFormSubmission = useCallback(() => {
    console.log('🔍 ONBOARDING DEBUG INFO:', {
      user: user ? { id: user.id, telegram_id: user.telegram_id } : 'NO USER',
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
        step1: formData.firstName.trim() !== '' && formData.lastName.trim() !== '',
        step2: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
        step3: formData.tonWalletAddress.trim() !== '',
        step4: true, // Always true (optional)
        step5: formData.agreedToTerms,
        overall: validateCurrentStep()
      },
      isSubmitting,
      shouldShow,
      userFriendlyAddress
    });
  }, [user, currentStep, formData, validateCurrentStep, isSubmitting, shouldShow, userFriendlyAddress]);

  // Optimized navigation handlers
  const handleNext = useCallback(() => {
    debugLog('➡️ Next button clicked, current step:', currentStep);
    if (validateCurrentStep() && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      debugLog('✅ Moving to next step');
      
      // Show progress notification for first step completion
      if (currentStep === 0) {
        showSystemNotification(
          '🚀 Getting Started',
          'Great! Let\'s set up your mining profile step by step.',
          'info'
        );
      }
      
      // Show notification when reaching the final step
      if (currentStep === steps.length - 2) {
        showSystemNotification(
          '📋 Final Step',
          'Almost there! Please review and agree to the terms to complete your setup.',
          'info'
        );
      }
    } else {
      debugLog('❌ Cannot move to next step - validation failed or at last step');
    }
  }, [validateCurrentStep, currentStep, steps.length, showSystemNotification]);

  const handlePrev = useCallback(() => {
    debugLog('⬅️ Previous button clicked, current step:', currentStep);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      debugLog('✅ Moving to previous step');
    }
  }, [currentStep]);

  // Enhanced submit handler with better error handling
  const handleSubmit = useCallback(async () => {
    debugLog('🚀 Submit button clicked');
    
    // Debug form state before submission
    debugFormSubmission();
    
    if (!validateCurrentStep() || !user) {
      debugLog('❌ Submit validation failed');
      
      // Detailed validation feedback
      if (!user) {
        debugLog('❌ No user found');
        showSystemNotification(
          '❌ Authentication Error',
          'User not authenticated. Please refresh the page and try again.',
          'error'
        );
        return;
      }
      
      if (!validateCurrentStep()) {
        debugLog('❌ Form validation failed');
        
        // Check specific validation issues
        const issues = [];
        if (!formData.firstName.trim()) issues.push('First name is required');
        if (!formData.lastName.trim()) issues.push('Last name is required');
        if (!formData.email.trim()) issues.push('Email is required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) issues.push('Valid email format required');
        if (!formData.tonWalletAddress.trim()) issues.push('TON wallet address is required');
        if (!formData.agreedToTerms) issues.push('Terms agreement is required');
        
        showSystemNotification(
          '⚠️ Form Incomplete',
          `Please fix the following: ${issues.join(', ')}`,
          'warning'
        );
        return;
      }
      return;
    }

    setIsSubmitting(true);
    try {
      debugLog('📤 Submitting form data:', formData);
      
      // Test database connection first
      const { error: testError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (testError) {
        debugLog('❌ Database connection test failed:', testError);
        showSystemNotification(
          '❌ Database Error',
          'Unable to connect to database. Please check your connection and try again.',
          'error'
        );
        return;
      }
      
      debugLog('✅ Database connection test passed');
      
      // Submit onboarding data to backend
      const result = await submitOnboardingForm(user.id, formData);
      
      if (result.success) {
        debugLog('✅ Onboarding submitted successfully');
        
        // PERMANENTLY MARK ONBOARDING AS COMPLETED
        // 1. Update database (already done in submitOnboardingForm)
        // 2. Update localStorage
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
        // 3. Update sessionStorage for immediate effect
        sessionStorage.setItem(`onboarding_completed_${user.id}`, 'true');

        // 4. Show beautiful completion notification
        showAchievementNotification({
          name: '🎉 Welcome to TBC Mining Revolution!',
          description: `Welcome ${formData.firstName}! Your profile has been successfully set up. You're now ready to start mining and earning TBC rewards!`
        });

        // 5. Show additional system notification
        showSystemNotification(
          '🚀 Profile Setup Complete',
          `Welcome ${formData.firstName}! Your TBC mining journey begins now. Connect your wallet and start mining to earn rewards!`,
          'success'
        );
        
        // 6. Close the onboarding screen permanently
        setShouldShow(false);
        
        debugLog('🔒 Onboarding permanently completed and closed');
        
        // 7. Reload the page to ensure clean state after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000); // Increased delay to allow notifications to be seen
        
      } else {
        debugLog('❌ Onboarding submission failed:', result.error);
        showSystemNotification(
          '❌ Submission Failed',
          `Failed to submit onboarding data: ${result.error}. Please try again.`,
          'error'
        );
      }
    } catch (error) {
      debugLog('❌ Error submitting onboarding:', error);
      showSystemNotification(
        '❌ Network Error',
        'An error occurred while submitting your data. Please check your connection and try again.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [validateCurrentStep, user, formData, showAchievementNotification, showSystemNotification, debugFormSubmission]);

  const handleSkip = useCallback(async () => {
    debugLog('⏭️ Skip button clicked');
    if (user) {
      try {
        // Mark onboarding as completed but skipped in database
        const { error } = await supabase
          .from('users')
          .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            // Don't set profile data to indicate it was skipped
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error marking onboarding as skipped:', error);
        }

        // PERMANENTLY MARK ONBOARDING AS COMPLETED (SKIPPED)
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
        sessionStorage.setItem(`onboarding_completed_${user.id}`, 'true');
        
        // Set reminder tracking
        localStorage.setItem(`onboarding_skipped_${user.id}`, 'true');
        localStorage.setItem(`onboarding_last_reminder_${user.id}`, Date.now().toString());
        localStorage.setItem(`onboarding_reminder_count_${user.id}`, '0');
        
        debugLog('🔒 Onboarding permanently skipped and closed');
        
        // Show skip notification with reminder
        showSystemNotification(
          '⏭️ Onboarding Skipped',
          'You can complete your profile setup later. We\'ll remind you to unlock exclusive features!',
          'info'
        );
      } catch (error) {
        console.error('Error handling skip:', error);
        showSystemNotification(
          '⚠️ Skip Error',
          'There was an issue skipping setup. Please try again.',
          'warning'
        );
        return;
      }
    }
    setShouldShow(false);
  }, [user, showSystemNotification]);

  // Memoized progress percentage
  const progressPercentage = useMemo(() => {
    return ((currentStep + 1) / steps.length) * 100;
  }, [currentStep, steps.length]);

  // Check if onboarding should be shown (no force show for production)
  const shouldDisplayOnboarding = shouldShow;

  if (!user) {
    debugLog('❌ No user - returning null');
    return null;
  }

  if (!shouldDisplayOnboarding) {
    debugLog('❌ Should not show - returning null');
    return null;
  }

  debugLog('🎯 Rendering onboarding screen');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/95 via-gray-900/95 to-blue-900/95 backdrop-blur-sm">
      {/* Enhanced Debugger - Only in development */}
      {isDevelopment && (
        <OnboardingDebugger
          formData={formData}
          currentStep={currentStep}
          validateCurrentStep={validateCurrentStep}
          isSubmitting={isSubmitting}
        />
      )}
      
      <div className="max-w-md w-full px-6 overflow-y-auto max-h-[90vh] py-8 rounded-lg">
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="relative w-20 h-20">
                {/* Reduced animation complexity */}
                <div className="absolute inset-0 bg-blue-500/20 rounded-full"></div>
                <div className="relative w-full h-full flex items-center justify-center">
                  <HiOutlineShieldCheck size={48} className="text-blue-500" />
                </div>
                
                {/* Removed particles for faster performance */}
              </div>
            </div>
            <div className="mt-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to Divine Coin Resurrection!
              </h2>
              <p className="text-blue-300 text-lg">
                ✨ Setting up your mining profile...
              </p>
              <div className="mt-4 text-sm text-blue-200">
                Preparing your divine resurrection...
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={handleSkip}
              className="absolute -top-12 right-0 text-sm text-blue-300 hover:text-white transition-colors duration-100 bg-gray-800/50 px-3 py-1 rounded-lg hover:bg-gray-700/50 border border-blue-600/30"
            >
              Skip Setup
            </button>
            
            <div className="text-center">
              {/* Step Header - removed animations */}
              <div className="relative mb-6">
                <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-600/10 via-slate-600/10 to-slate-800/10 border border-blue-500/20 shadow-xl backdrop-blur-sm">
                  <div className="text-4xl">{steps[currentStep].emoji}</div>
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500/60 rounded-full"></div>
                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-slate-400/40 rounded-full"></div>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-6 mb-4">
                {steps[currentStep].title}
              </h2>
              <p className="text-base text-slate-300 mb-8 leading-relaxed">
                {steps[currentStep].description}
              </p>

              {/* Progress Bar - minimal animation */}
              <div className="w-full h-1.5 bg-slate-800/50 rounded-full mb-8 overflow-hidden border border-slate-700/30">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-100"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Step Indicators - removed animations */}
              <div className="flex justify-center gap-2 mb-8">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                      index === currentStep
                        ? 'bg-blue-500'
                        : index < currentStep
                        ? 'bg-blue-600'
                        : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>

              {/* Form Content */}
              <div className="mb-8">
                {currentStep === 0 && (
                  <div className="text-center">
                    <div className="text-lg text-blue-300 mb-4">
                      🚀 Ready to start your mining journey?
                    </div>
                    <div className="text-sm text-slate-400 space-y-2">
                      <p>• Complete your profile setup</p>
                      <p>• Connect your TON wallet</p>
                      <p>• Start earning TBC rewards</p>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors duration-100 ${
                          formData.firstName.trim() === '' 
                            ? 'bg-slate-800/50 border-red-500/50 focus:border-red-400/50 focus:ring-red-500/30' 
                            : 'bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/30'
                        }`}
                        placeholder="Enter your first name"
                      />
                      {formData.firstName.trim() === '' && (
                        <p className="text-xs text-red-400 mt-1">First name is required</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors duration-100 ${
                          formData.lastName.trim() === '' 
                            ? 'bg-slate-800/50 border-red-500/50 focus:border-red-400/50 focus:ring-red-500/30' 
                            : 'bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/30'
                        }`}
                        placeholder="Enter your last name"
                      />
                      {formData.lastName.trim() === '' && (
                        <p className="text-xs text-red-400 mt-1">Last name is required</p>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors duration-100 ${
                        formData.email.trim() === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                          ? 'bg-slate-800/50 border-red-500/50 focus:border-red-400/50 focus:ring-red-500/30' 
                          : 'bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/30'
                      }`}
                      placeholder="Enter your email address"
                    />
                    {formData.email.trim() === '' && (
                      <p className="text-xs text-red-400 mt-1">Email address is required</p>
                    )}
                    {formData.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                      <p className="text-xs text-red-400 mt-1">Please enter a valid email format</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      We'll use this to send you important updates and rewards.
                    </p>
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      TON Wallet Address *
                    </label>
                    <input
                      type="text"
                      value={formData.tonWalletAddress}
                      onChange={(e) => handleInputChange('tonWalletAddress', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors duration-100 ${
                        formData.tonWalletAddress.trim() === '' 
                          ? 'bg-slate-800/50 border-red-500/50 focus:border-red-400/50 focus:ring-red-500/30' 
                          : 'bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/30'
                      }`}
                      placeholder="Enter your TON wallet address"
                    />
                    {formData.tonWalletAddress.trim() === '' && (
                      <p className="text-xs text-red-400 mt-1">TON wallet address is required</p>
                    )}
                    {userFriendlyAddress && (
                      <p className="text-xs text-green-400 mt-2">
                        ✅ Wallet connected: {userFriendlyAddress.slice(0, 8)}...{userFriendlyAddress.slice(-6)}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      This wallet will receive your mining rewards and TBC tokens.
                    </p>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <label className="block text-sm font-medium text-slate-300 mb-4">
                        Are you a TBCian? (Previous TBC holder)
                      </label>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => handleInputChange('isTBCian', true)}
                          className={`px-6 py-3 rounded-lg border transition-colors duration-100 ${
                            formData.isTBCian
                              ? 'bg-blue-600/50 border-blue-500/50 text-white'
                              : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                          }`}
                        >
                          Yes, I am
                        </button>
                        <button
                          onClick={() => handleInputChange('isTBCian', false)}
                          className={`px-6 py-3 rounded-lg border transition-colors duration-100 ${
                            !formData.isTBCian
                              ? 'bg-blue-600/50 border-blue-500/50 text-white'
                              : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                          }`}
                        >
                          No, I'm new
                        </button>
                      </div>
                    </div>
                    
                    {formData.isTBCian && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          How much TBC did you hold previously?
                        </label>
                        <input
                          type="text"
                          value={formData.tbcHoldings}
                          onChange={(e) => handleInputChange('tbcHoldings', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors duration-100"
                          placeholder="e.g., 1000 TBC"
                        />
                        <p className="text-xs text-slate-400 mt-2">
                          This helps us provide appropriate rewards and benefits.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-4">
                    <div className="bg-slate-800/30 border border-slate-600/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Terms of Service</h4>
                      <div className="text-xs text-slate-400 space-y-2">
                        <p>By using TBC Mining Revolution, you agree to:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Comply with all applicable laws and regulations</li>
                          <li>Provide accurate and truthful information</li>
                          <li>Not engage in fraudulent or malicious activities</li>
                          <li>Accept that cryptocurrency values are volatile</li>
                          <li>Understand that mining rewards are not guaranteed</li>
                          <li>Maintain the security of your wallet and credentials</li>
                        </ul>
                        <p className="mt-2">
                          We reserve the right to modify these terms and will notify users of significant changes.
                        </p>
                      </div>
                    </div>
                    
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.agreedToTerms}
                        onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-slate-300">
                        I have read and agree to the Terms of Service and Privacy Policy
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-100 ${
                    currentStep === 0
                      ? 'opacity-0 pointer-events-none'
                      : 'text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50'
                  }`}
                >
                  <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>

                {currentStep === steps.length - 1 ? (
                  <div className="flex flex-col items-end space-y-2">
                    {/* Validation Error Message */}
                    {!validateCurrentStep() && (
                      <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-500/30">
                        {(() => {
                          if (!formData.firstName.trim() || !formData.lastName.trim()) {
                            return 'Please enter your first and last name';
                          }
                          if (!formData.email.trim()) {
                            return 'Please enter a valid email address';
                          }
                          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                            return 'Please enter a valid email format';
                          }
                          if (!formData.tonWalletAddress.trim()) {
                            return 'Please enter your TON wallet address';
                          }
                          if (!formData.agreedToTerms) {
                            return 'Please agree to the terms and conditions';
                          }
                          return 'Please complete all required fields';
                        })()}
                      </div>
                    )}
                    
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !validateCurrentStep()}
                      className={`flex items-center px-6 py-2 rounded-lg transition-colors duration-100 shadow-lg border font-medium ${
                        isSubmitting || !validateCurrentStep()
                          ? 'bg-gray-600 text-gray-400 border-gray-500/30 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-500/30 hover:border-blue-400/50'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          Complete Setup
                          <HiOutlineArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-end space-y-2">
                    {/* Validation Error Message */}
                    {!validateCurrentStep() && (
                      <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-500/30">
                        {(() => {
                          switch (currentStep) {
                            case 1:
                              if (!formData.firstName.trim()) return 'Please enter your first name';
                              if (!formData.lastName.trim()) return 'Please enter your last name';
                              return 'Please complete all fields';
                            case 2:
                              if (!formData.email.trim()) return 'Please enter your email address';
                              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Please enter a valid email format';
                              return 'Please enter a valid email';
                            case 3:
                              return 'Please enter your TON wallet address';
                            default:
                              return 'Please complete all required fields';
                          }
                        })()}
                      </div>
                    )}
                    
                    <button
                      onClick={handleNext}
                      disabled={!validateCurrentStep()}
                      className={`flex items-center px-6 py-2 rounded-lg transition-colors duration-100 shadow-lg border font-medium ${
                        !validateCurrentStep()
                          ? 'bg-gray-600 text-gray-400 border-gray-500/30 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-500/30 hover:border-blue-400/50'
                      }`}
                    >
                      Next
                      <HiOutlineArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 