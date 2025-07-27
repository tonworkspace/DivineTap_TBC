import { FC, useState, useEffect } from 'react';
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



interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  emoji: string;
}

export const OnboardingScreen: FC = () => {
  const { user } = useAuth();
  const userFriendlyAddress = useTonAddress();
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

  const steps: OnboardingStep[] = [
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
  ];

  useEffect(() => {
    if (!user) return;

    const checkOnboarding = async () => {
      try {
        // Check if user has completed onboarding from database
        const hasCompletedOnboarding = await checkOnboardingStatus(user.id);
        
        if (!hasCompletedOnboarding) {
          setShouldShow(true);
        }

        // Show loading screen
        const loadingTimer = setTimeout(() => {
          setLoading(false);
        }, 2000);

        return () => clearTimeout(loadingTimer);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Fallback to localStorage check
        const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
        if (!hasCompletedOnboarding) {
          setShouldShow(true);
        }
        
        const loadingTimer = setTimeout(() => {
          setLoading(false);
        }, 2000);

        return () => clearTimeout(loadingTimer);
      }
    };

    checkOnboarding();
  }, [user]);

  // Update wallet address when connected
  useEffect(() => {
    if (userFriendlyAddress) {
      setFormData(prev => ({
        ...prev,
        tonWalletAddress: userFriendlyAddress
      }));
    }
  }, [userFriendlyAddress]);

  const handleInputChange = (field: keyof OnboardingFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Personal Information
        return formData.firstName.trim() !== '' && formData.lastName.trim() !== '';
      case 2: // Contact Details
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(formData.email);
      case 3: // Wallet Connection
        return formData.tonWalletAddress.trim() !== '';
      case 4: // TBC Status
        return true; // Always valid as it's optional
      case 5: // Terms
        return formData.agreedToTerms;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep() || !user) return;

    setIsSubmitting(true);
    try {
      // Submit onboarding data to backend
      const result = await submitOnboardingForm(user.id, formData);
      
      if (result.success) {
        // Mark onboarding as completed locally as well
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
        setShouldShow(false);
      } else {
        console.error('Onboarding submission failed:', result.error);
        // You could show an error message to the user here
        alert('Failed to submit onboarding data. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      alert('An error occurred while submitting your data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    }
    setShouldShow(false);
  };

  if (!user || !shouldShow) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/95 via-gray-900/95 to-blue-900/95 backdrop-blur-sm">
      <div className="max-w-md w-full px-6">
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg animate-pulse"></div>
                <div className="relative w-full h-full flex items-center justify-center">
                  <HiOutlineShieldCheck size={48} className="text-blue-500 animate-bounce" />
                </div>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-blue-400 rounded-full animate-ping"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `rotate(${i * 90}deg) translateX(35px)`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to Divine Coin Resurrection!
              </h2>
              <p className="text-blue-300 text-lg">
                ✨ Setting up your mining profile...
              </p>
              <div className="mt-4 text-sm text-blue-200 animate-pulse">
                Preparing your divine resurrection...
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={handleSkip}
              className="absolute -top-12 right-0 text-sm text-blue-300 hover:text-white transition-colors bg-gray-800/50 px-3 py-1 rounded-lg hover:bg-gray-700/50 border border-blue-600/30"
            >
              Skip Setup
            </button>
            
            <div className="text-center animate-fade-in">
              {/* Step Header */}
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

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800/50 rounded-full mb-8 overflow-hidden border border-slate-700/30">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>

              {/* Step Indicators */}
              <div className="flex justify-center gap-2 mb-8">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
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
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                        placeholder="Enter your last name"
                      />
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
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      placeholder="Enter your email address"
                    />
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
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      placeholder="Enter your TON wallet address"
                    />
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
                          className={`px-6 py-3 rounded-lg border transition-all ${
                            formData.isTBCian
                              ? 'bg-blue-600/50 border-blue-500/50 text-white'
                              : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                          }`}
                        >
                          Yes, I am
                        </button>
                        <button
                          onClick={() => handleInputChange('isTBCian', false)}
                          className={`px-6 py-3 rounded-lg border transition-all ${
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
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
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
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentStep === 0
                      ? 'opacity-0 pointer-events-none'
                      : 'text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50'
                  }`}
                >
                  <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>

                {currentStep === steps.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !validateCurrentStep()}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg border border-blue-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={!validateCurrentStep()}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg border border-blue-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <HiOutlineArrowRight className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 