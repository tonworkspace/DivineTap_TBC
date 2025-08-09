import { FC, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSystem } from '@/components/NotificationSystem';
import { supabase } from '@/lib/supabaseClient';

interface OnboardingReminderProps {
  onOpenOnboarding: () => void;
}

export const OnboardingReminder: FC<OnboardingReminderProps> = ({ onOpenOnboarding }) => {
  const { user } = useAuth();
  const { showSystemNotification, showAchievementNotification } = useNotificationSystem();
  const [showReminder, setShowReminder] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);

  // Check if user skipped onboarding
  const checkSkippedOnboarding = async () => {
    if (!user?.id) return false;

    try {
      // Check database for onboarding status
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed, first_name, last_name, email')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return false;
      }

      // User skipped if onboarding is marked as completed but has no profile data
      const hasProfileData = data.first_name && data.last_name && data.email;
      const skippedOnboarding = data.onboarding_completed && !hasProfileData;

      return skippedOnboarding;
    } catch (error) {
      console.error('Error checking skipped onboarding:', error);
      return false;
    }
  };

  // Get reminder count from localStorage
  const getReminderCount = () => {
    if (!user?.id) return 0;
    const count = localStorage.getItem(`onboarding_reminder_count_${user.id}`);
    return count ? parseInt(count, 10) : 0;
  };

  // Set reminder count in localStorage
  const setReminderCountStorage = (count: number) => {
    if (!user?.id) return;
    localStorage.setItem(`onboarding_reminder_count_${user.id}`, count.toString());
  };

  // Get last reminder time
  const getLastReminderTime = () => {
    if (!user?.id) return 0;
    const time = localStorage.getItem(`onboarding_last_reminder_${user.id}`);
    return time ? parseInt(time, 10) : 0;
  };

  // Set last reminder time
  const setLastReminderTime = () => {
    if (!user?.id) return;
    localStorage.setItem(`onboarding_last_reminder_${user.id}`, Date.now().toString());
  };

  // Check if it's time to show reminder
  const shouldShowReminder = () => {
    const lastReminder = getLastReminderTime();
    const now = Date.now();
    const count = getReminderCount();
    
    // Show reminder based on count:
    // 1st reminder: 1 hour after skip
    // 2nd reminder: 6 hours after skip
    // 3rd reminder: 24 hours after skip
    // 4th reminder: 3 days after skip
    // 5th reminder: 1 week after skip
    // Then every week
    
    const intervals = [
      60 * 60 * 1000,    // 1 hour
      6 * 60 * 60 * 1000, // 6 hours
      24 * 60 * 60 * 1000, // 24 hours
      3 * 24 * 60 * 60 * 1000, // 3 days
      7 * 24 * 60 * 60 * 1000, // 1 week
    ];

    const interval = count < intervals.length ? intervals[count] : intervals[intervals.length - 1];
    
    return (now - lastReminder) >= interval;
  };

  // Show reminder notification
  const showReminderNotification = () => {
    const count = getReminderCount();
    const messages = [
      {
        title: '🎯 Complete Your Profile',
        message: 'Set up your mining profile to unlock exclusive features and bonuses!',
        type: 'info' as const
      },
      {
        title: '⚡ Boost Your Mining',
        message: 'Complete your profile to get 50% bonus on all mining rewards!',
        type: 'info' as const
      },
      {
        title: '💎 Missing Out on Rewards',
        message: 'Complete your profile to access daily rewards and referral bonuses!',
        type: 'warning' as const
      },
      {
        title: '🚀 Unlock Premium Features',
        message: 'Your profile setup unlocks advanced mining features and higher rewards!',
        type: 'warning' as const
      },
      {
        title: '🌟 Don\'t Miss Out!',
        message: 'Complete your profile to join the elite mining community with exclusive benefits!',
        type: 'info' as const
      }
    ];

    const message = messages[Math.min(count, messages.length - 1)];
    
    showSystemNotification(
      message.title,
      message.message,
      message.type
    );

    // Show achievement notification for first reminder
    if (count === 0) {
      showAchievementNotification({
        name: '🎯 Profile Setup Available',
        description: 'Complete your profile to unlock exclusive mining features and bonuses!'
      });
    }
  };

  // Handle reminder action
  const handleReminderAction = () => {
    setShowReminder(false);
    onOpenOnboarding();
  };

  // Handle dismiss reminder
  const handleDismissReminder = () => {
    setShowReminder(false);
    const newCount = getReminderCount() + 1;
    setReminderCountStorage(newCount);
    setReminderCount(newCount);
    setLastReminderTime();
  };

  // Check for reminders periodically
  useEffect(() => {
    const checkReminders = async () => {
      if (!user?.id) return;

      const skipped = await checkSkippedOnboarding();
      if (!skipped) return;

      const count = getReminderCount();
      setReminderCount(count);

      if (shouldShowReminder()) {
        setShowReminder(true);
        showReminderNotification();
      }
    };

    // Check immediately
    checkReminders();

    // Check every 30 minutes
    const interval = setInterval(checkReminders, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, showSystemNotification, showAchievementNotification]);

  // Don't show if user is not available or reminder is not active
  if (!user || !showReminder) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-gradient-to-r from-blue-900/95 to-purple-900/95 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🎯</span>
            </div>
            <h3 className="text-white font-bold text-sm">Complete Your Profile</h3>
          </div>
          <button
            onClick={handleDismissReminder}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-blue-200 text-sm mb-3">
            Set up your mining profile to unlock exclusive features and boost your rewards!
          </p>
          
          {/* Benefits list */}
          <div className="space-y-2 text-xs text-blue-300">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span>50% bonus on mining rewards</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span>Daily bonus rewards</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span>Referral bonuses</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span>Advanced mining features</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleReminderAction}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105"
          >
            Complete Setup
          </button>
          <button
            onClick={handleDismissReminder}
            className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Later
          </button>
        </div>

        {/* Progress indicator */}
        <div className="mt-3 text-xs text-gray-400">
          Reminder {reminderCount + 1} of 5
        </div>
      </div>
    </div>
  );
}; 