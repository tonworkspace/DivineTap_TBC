import { FC, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSystem } from '@/components/NotificationSystem';
import { supabase } from '@/lib/supabaseClient';

interface OnboardingSettingsProps {
  onOpenOnboarding: () => void;
}

export const OnboardingSettings: FC<OnboardingSettingsProps> = ({ onOpenOnboarding }) => {
  const { user } = useAuth();
  const { showSystemNotification } = useNotificationSystem();
  const [isChecking, setIsChecking] = useState(false);

  // Check if user has completed onboarding
  const checkOnboardingStatus = async () => {
    if (!user?.id) return false;

    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed, first_name, last_name, email')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return false;
      }

      // User has completed onboarding if they have profile data
      const hasProfileData = data.first_name && data.last_name && data.email;
      return data.onboarding_completed && hasProfileData;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Handle reopen onboarding
  const handleReopenOnboarding = async () => {
    const hasCompleted = await checkOnboardingStatus();
    
    if (hasCompleted) {
      showSystemNotification(
        '⚠️ Profile Already Complete',
        'Your profile is already set up. You can edit your information in the settings.',
        'warning'
      );
      return;
    }

    // Clear any existing onboarding data
    if (user) {
      // Reset onboarding status in database
      await supabase
        .from('users')
        .update({
          onboarding_completed: false,
          onboarding_completed_at: null,
          terms_accepted: false,
          terms_accepted_at: null
        })
        .eq('id', user.id);
    }

    // Open onboarding
    onOpenOnboarding();
    
    showSystemNotification(
      '🎯 Profile Setup',
      'Opening profile setup wizard. Complete your profile to unlock exclusive features!',
      'info'
    );
  };

  return (
    <div className="bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">👤</span>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Profile Setup</h3>
            <p className="text-gray-400 text-xs">Complete your profile to unlock bonuses</p>
          </div>
        </div>
        
        <button
          onClick={handleReopenOnboarding}
          disabled={isChecking}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white text-xs font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105 disabled:scale-100"
        >
          {isChecking ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Checking...</span>
            </div>
          ) : (
            'Setup Profile'
          )}
        </button>
      </div>
      
      {/* Benefits list */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center space-x-1 text-green-400">
          <span>✓</span>
          <span>50% Mining Bonus</span>
        </div>
        <div className="flex items-center space-x-1 text-green-400">
          <span>✓</span>
          <span>Daily Rewards</span>
        </div>
        <div className="flex items-center space-x-1 text-green-400">
          <span>✓</span>
          <span>Referral Bonuses</span>
        </div>
        <div className="flex items-center space-x-1 text-green-400">
          <span>✓</span>
          <span>Premium Features</span>
        </div>
      </div>
    </div>
  );
}; 