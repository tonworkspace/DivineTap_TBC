import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GiCoins, GiLightningArc, GiUpgrade } from 'react-icons/gi';
import { useGameContext } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';
import { useReferralIntegration } from '@/hooks/useReferralIntegration';
import './TaskCenter.css';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  max: number;
  completed: boolean;
  icon?: React.ReactNode;
  type: 'mining' | 'social' | 'airdrop';
}

interface TaskProgress {
  [key: string]: number;
}

interface GameState {
  divinePoints?: number;
  isMining?: boolean;
  sessionStartTime?: number;
  upgrades?: Array<{ id: string; level: number }>;
  upgradesPurchased?: number;
}

export const TaskCenter: React.FC = () => {
  const { addGems } = useGameContext();
  const { user } = useAuth();
  const { referralData, loadReferralData } = useReferralIntegration();
  
  // Remove auto-hiding functionality - completed tasks are always visible
  // const [hideCompleted, setHideCompleted] = useState(false);
  
  // Centralized state management
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [taskProgress, setTaskProgress] = useState<TaskProgress>({});
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set());
  const [lastCompletionTime, setLastCompletionTime] = useState<{ [key: string]: number }>({});
  const [gameState, setGameState] = useState<GameState>({});
  const [miningTime, setMiningTime] = useState<number>(0);
  
  // Modal states
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentTaskModal, setCurrentTaskModal] = useState<{
    task: Task;
    type: 'social' | 'wallet' | 'invite';
    message: string;
    confirmText: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletError, setWalletError] = useState('');
  
  // Refs for tracking
  const autoCompletedTasksRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);
  
  // Helper function to get user-specific localStorage keys
  const getUserSpecificKey = useCallback((baseKey: string, userId?: string) => {
    if (!userId) return baseKey;
    return `${baseKey}_${userId}`;
  }, []);

  // Safe localStorage operations
  const safeGetItem = useCallback((key: string, defaultValue: any = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return defaultValue;
    }
  }, []);

  const safeSetItem = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, []);

  // Optimized mining time calculation
  const calculateMiningTime = useCallback((currentGameState: GameState, userId: string) => {
    if (!currentGameState.isMining || !currentGameState.sessionStartTime) {
      return 0;
    }

    const miningTimeKey = getUserSpecificKey('miningTime', userId);
    const lastUpdateKey = getUserSpecificKey('lastMiningUpdate', userId);
    
    const now = Date.now();
    const storedTime = parseFloat(localStorage.getItem(miningTimeKey) || '0');
    const lastUpdate = parseFloat(localStorage.getItem(lastUpdateKey) || '0');
    
    // Calculate time delta more accurately
    const timeDelta = lastUpdate > 0 ? 
      (now - lastUpdate) / 1000 : 
      (now - currentGameState.sessionStartTime) / 1000;
    
    const newTotalTime = storedTime + Math.max(0, timeDelta);
    
    // Update storage
    localStorage.setItem(miningTimeKey, newTotalTime.toString());
    localStorage.setItem(lastUpdateKey, now.toString());
    
    return Math.min(newTotalTime, 3600); // Cap at 1 hour
  }, [getUserSpecificKey]);

  // Centralized game state reader
  const readGameState = useCallback((): GameState => {
    const savedGameState = safeGetItem('divineMiningGame', {});
    return {
      divinePoints: savedGameState.divinePoints || 0,
      isMining: savedGameState.isMining || false,
      sessionStartTime: savedGameState.sessionStartTime || 0,
      upgrades: savedGameState.upgrades || [],
      upgradesPurchased: savedGameState.upgradesPurchased || 0
    };
  }, [safeGetItem]);

  // Optimized progress calculation
  const calculateProgress = useCallback(() => {
    if (!user?.id) return;

    const currentGameState = readGameState();
    const userId = user.id.toString();
    
    // Calculate mining time
    const currentMiningTime = calculateMiningTime(currentGameState, userId);
    
    // Check for upgrades
    const hasUpgrades = currentGameState.upgrades?.some(upgrade => (upgrade.level || 0) > 0) || 
                       (currentGameState.upgradesPurchased || 0) > 0;

    const newProgress: TaskProgress = {
      mine_1000: Math.min(currentGameState.divinePoints || 0, 1000),
      mine_10000: Math.min(currentGameState.divinePoints || 0, 10000),
      mine_1hour: Math.floor(currentMiningTime),
      buy_upgrade: hasUpgrades ? 1 : 0,
      follow_twitter: 0,
      join_telegram: 0,
      retweet_post: 0,
      submit_wallet: 0,
      invite_friend: referralData?.totalReferrals > 0 ? 1 : 0,
      like_post: 0
    };

    // Update states
    setGameState(currentGameState);
    setMiningTime(currentMiningTime);
    setTaskProgress(newProgress);

    // Auto-complete tasks
    const tasksToComplete = [
      { id: 'mine_1000', condition: newProgress.mine_1000 >= 1000, reward: '75 Gems' },
      { id: 'mine_10000', condition: newProgress.mine_10000 >= 10000, reward: '150 Gems' },
      { id: 'mine_1hour', condition: newProgress.mine_1hour >= 3600, reward: '100 Gems' },
      { id: 'buy_upgrade', condition: newProgress.buy_upgrade >= 1, reward: '50 Gems' },
      { id: 'invite_friend', condition: newProgress.invite_friend >= 1, reward: '100 Gems' }
    ];

    tasksToComplete.forEach(({ id, condition, reward }) => {
      if (condition && 
          !completedTasks.includes(id) && 
          !processingTasks.has(id) &&
          !autoCompletedTasksRef.current.has(id)) {
        console.log(`🎉 Auto-completing task: ${id}`);
        autoCompletedTasksRef.current.add(id);
        completeTask(id, reward);
      }
    });

  }, [user?.id, readGameState, calculateMiningTime, completedTasks, processingTasks, referralData]);

  // Optimized completeTask function
  const completeTask = useCallback((taskId: string, reward: string) => {
    const now = Date.now();
    
    // Comprehensive validation
    if (completedTasks.includes(taskId)) {
      console.log(`⚠️ Task ${taskId} already completed`);
      return;
    }
    
    if (processingTasks.has(taskId)) {
      console.log(`⚠️ Task ${taskId} is being processed`);
      return;
    }
    
    // Rate limiting
    const lastCompletion = lastCompletionTime[taskId];
    if (lastCompletion && (now - lastCompletion) < 1000) {
      console.log(`⚠️ Task ${taskId} rate limited`);
      return;
    }
    
    // Mark as processing
    setProcessingTasks(prev => new Set(prev).add(taskId));
    setLastCompletionTime(prev => ({ ...prev, [taskId]: now }));
    
    try {
      const gemMatch = reward.match(/(\d+)\s*Gems?/);
      if (gemMatch) {
        const gemAmount = parseInt(gemMatch[1], 10);
        
        // Atomic state update
        setCompletedTasks(prev => {
          if (prev.includes(taskId)) {
            console.log(`⚠️ Task ${taskId} was completed by another process`);
            autoCompletedTasksRef.current.delete(taskId);
            return prev;
          }
          
          const newCompleted = [...prev, taskId];
          
          // Add gems and show reward
          addGems(gemAmount, `task_${taskId}`);
          setRewardMessage(`🎉 Task completed! +${gemAmount} Gems`);
          setShowRewardModal(true);
          
          // Clean up auto-completion tracking
          autoCompletedTasksRef.current.delete(taskId);
          
          return newCompleted;
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      // Always clean up processing state
      setProcessingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  }, [completedTasks, processingTasks, lastCompletionTime, addGems]);

  // Load completed tasks on mount
  useEffect(() => {
    if (!user?.id) return;

    const userId = user.id.toString();
    const completedTasksKey = getUserSpecificKey('divineMiningCompletedTasks', userId);
    const savedTasks = safeGetItem(completedTasksKey, []);
    
    setCompletedTasks(savedTasks);
    
    // Clean up auto-completion refs
    savedTasks.forEach((taskId: string) => {
      autoCompletedTasksRef.current.delete(taskId);
    });
    
    isInitializedRef.current = true;
  }, [user?.id, getUserSpecificKey, safeGetItem]);

  // Save completed tasks
  useEffect(() => {
    if (!user?.id || !isInitializedRef.current) return;

    const userId = user.id.toString();
    const completedTasksKey = getUserSpecificKey('divineMiningCompletedTasks', userId);
    safeSetItem(completedTasksKey, completedTasks);
  }, [completedTasks, user?.id, getUserSpecificKey, safeSetItem]);

  // Load referral data
  useEffect(() => {
    if (user?.id) {
      loadReferralData();
    }
  }, [user?.id, loadReferralData]);

  // Optimized polling with better cleanup
  useEffect(() => {
    if (!user?.id) return;

    // Initial calculation
    calculateProgress();

    // Set up optimized interval (every 2 seconds instead of 1)
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      
      // Throttle updates to prevent excessive calculations
      if (now - lastUpdateRef.current < 2000) return;
      
      lastUpdateRef.current = now;
      calculateProgress();
    }, 2000);

    // Event listeners for immediate updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'divineMiningGame') {
        calculateProgress();
      }
    };

    const handleUpgradePurchase = (e: CustomEvent) => {
      console.log('🎉 Upgrade purchased event detected:', e.detail);
      // Force immediate progress calculation
      setTimeout(calculateProgress, 100);
    };

    const handleReferralUpdate = (e: CustomEvent) => {
      console.log('🎉 Referral update detected:', e.detail);
      // Force immediate progress calculation when referrals change
      setTimeout(calculateProgress, 100);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('upgradePurchased', handleUpgradePurchase as EventListener);
    window.addEventListener('referralUpdated', handleReferralUpdate as EventListener);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('upgradePurchased', handleUpgradePurchase as EventListener);
      window.removeEventListener('referralUpdated', handleReferralUpdate as EventListener);
    };
  }, [user?.id, calculateProgress]);

  // Compact professional task definitions
  const tasks: Task[] = useMemo(() => [
    // Social Tasks
    {
      id: 'follow_twitter',
      title: 'Follow DivineTaps on Twitter',
      description: 'Stay updated with latest news and airdrops',
      reward: '50 Gems',
      progress: completedTasks.includes('follow_twitter') ? 1 : (taskProgress.follow_twitter || 0),
      max: 1,
      completed: completedTasks.includes('follow_twitter'),
      icon: <span className="text-blue-400">🐦</span>,
      type: 'social'
    },
    {
      id: 'join_telegram',
      title: 'Join Telegram Community',
      description: 'Connect with fellow miners and get tips',
      reward: '75 Gems',
      progress: completedTasks.includes('join_telegram') ? 1 : (taskProgress.join_telegram || 0),
      max: 1,
      completed: completedTasks.includes('join_telegram'),
      icon: <span className="text-blue-400">📱</span>,
      type: 'social'
    },
    {
      id: 'retweet_post',
      title: 'Share Latest News',
      description: 'Help spread the word about DivineTaps',
      reward: '60 Gems',
      progress: completedTasks.includes('retweet_post') ? 1 : (taskProgress.retweet_post || 0),
      max: 1,
      completed: completedTasks.includes('retweet_post'),
      icon: <span className="text-blue-400">🔄</span>,
      type: 'social'
    },
    {
      id: 'like_post',
      title: 'Like Latest Post',
      description: 'Boost community engagement',
      reward: '40 Gems',
      progress: completedTasks.includes('like_post') ? 1 : (taskProgress.like_post || 0),
      max: 1,
      completed: completedTasks.includes('like_post'),
      icon: <span className="text-red-400">❤️</span>,
      type: 'social'
    },
    {
      id: 'invite_friend',
      title: 'Invite Friends',
      description: `Share referral link and earn bonuses${referralData?.code ? ` (Code: ${referralData.code})` : ''}`,
      reward: '100 Gems',
      progress: completedTasks.includes('invite_friend') ? 1 : (taskProgress.invite_friend || 0),
      max: 1,
      completed: completedTasks.includes('invite_friend'),
      icon: <span className="text-green-400">👥</span>,
      type: 'social'
    },
    // Airdrop Tasks
    {
      id: 'submit_wallet',
      title: 'Submit Wallet for Airdrops',
      description: 'Get early access to token launches',
      reward: '150 Gems',
      progress: completedTasks.includes('submit_wallet') ? 1 : (taskProgress.submit_wallet || 0),
      max: 1,
      completed: completedTasks.includes('submit_wallet'),
      icon: <span className="text-purple-400">💎</span>,
      type: 'airdrop'
    },
    // Mining Tasks
    {
      id: 'mine_1000',
      title: 'Mine 1,000 Points',
      description: 'Reach your first mining milestone',
      reward: '75 Gems',
      progress: completedTasks.includes('mine_1000') ? 1000 : (taskProgress.mine_1000 || 0),
      max: 1000,
      completed: completedTasks.includes('mine_1000'),
      icon: <GiCoins className="text-yellow-400" />,
      type: 'mining'
    },
    {
      id: 'mine_10000',
      title: 'Mine 10,000 Points',
      description: 'Reach advanced mining level',
      reward: '150 Gems',
      progress: completedTasks.includes('mine_10000') ? 10000 : (taskProgress.mine_10000 || 0),
      max: 10000,
      completed: completedTasks.includes('mine_10000'),
      icon: <GiCoins className="text-yellow-400" />,
      type: 'mining'
    },
    {
      id: 'mine_1hour',
      title: 'Mine for 1 Hour',
      description: 'Stay active for 1 hour',
      reward: '100 Gems',
      progress: completedTasks.includes('mine_1hour') ? 3600 : (taskProgress.mine_1hour || 0),
      max: 3600,
      completed: completedTasks.includes('mine_1hour'),
      icon: <GiLightningArc className="text-green-400" />,
      type: 'mining'
    },
    {
      id: 'buy_upgrade',
      title: 'Buy First Upgrade',
      description: 'Invest in mining efficiency',
      reward: '50 Gems',
      progress: completedTasks.includes('buy_upgrade') ? 1 : (taskProgress.buy_upgrade || 0),
      max: 1,
      completed: completedTasks.includes('buy_upgrade'),
      icon: <GiUpgrade className="text-blue-400" />,
      type: 'mining'
    }
  ], [completedTasks, taskProgress]);

  // Rest of the component methods remain the same...
  const displayTaskModal = useCallback((task: Task, type: 'social' | 'wallet' | 'invite', message: string, confirmText: string, cancelText?: string, onConfirm?: () => void, onCancel?: () => void) => {
    setCurrentTaskModal({
      task,
      type,
      message,
      confirmText,
      cancelText,
      onConfirm: onConfirm || (() => completeTask(task.id, task.reward)),
      onCancel
    });
    setShowTaskModal(true);
  }, [completeTask]);

  const handleTaskAction = useCallback((task: Task) => {
    if (completedTasks.includes(task.id)) {
      displayTaskModal(task, 'invite', '🎉 This task has already been completed! You\'re awesome!', 'Thanks!');
      return;
    }
    
    if (processingTasks.has(task.id)) {
      displayTaskModal(task, 'invite', '⚡ This task is currently being processed. Please wait a moment...', 'OK');
      return;
    }

    switch (task.id) {
      case 'follow_twitter':
        // Enhanced social experience
        displayTaskModal(
          task,
          'social',
          '🌟 Ready to follow DivineTaps on Twitter?\n\nYou\'ll get:\n• Latest news & updates\n• Exclusive airdrop alerts\n• Community highlights\n• Early access to features',
          'Follow Now!',
          'Maybe Later',
          () => {
            window.open('https://x.com/DivineTaps', '_blank');
            setTimeout(() => {
              displayTaskModal(
                task,
                'social',
                '🐦 Did you successfully follow @DivineTaps?\n\nThanks for joining our community!',
                'Yes, I Followed!',
                'I\'ll Do It Later',
                () => completeTask(task.id, task.reward),
                () => setShowTaskModal(false)
              );
            }, 2000);
          },
          () => setShowTaskModal(false)
        );
        break;
        
      case 'join_telegram':
        // Enhanced community experience
        displayTaskModal(
          task,
          'social',
          '💬 Ready to join our Telegram community?\n\nYou\'ll get:\n• Real-time chat with miners\n• Strategy sharing\n• Exclusive tips & tricks\n• Direct support from team',
          'Join Community!',
          'Maybe Later',
          () => {
            window.open('https://t.me/DivineTaps', '_blank');
            setTimeout(() => {
              displayTaskModal(
                task,
                'social',
                '📱 Did you successfully join our Telegram group?\n\nWelcome to the DivineTaps family!',
                'Yes, I Joined!',
                'I\'ll Do It Later',
                () => completeTask(task.id, task.reward),
                () => setShowTaskModal(false)
              );
            }, 2000);
          },
          () => setShowTaskModal(false)
        );
        break;
        
      case 'retweet_post':
        // Enhanced sharing experience
        displayTaskModal(
          task,
          'social',
          '🔄 Ready to share our latest news?\n\nHelp spread the word about DivineTaps and earn bonus rewards!',
          'Share Now!',
          'Maybe Later',
          () => {
            window.open('https://twitter.com/intent/retweet?tweet_id=1946298009924288617', '_blank');
            setTimeout(() => {
              displayTaskModal(
                task,
                'social',
                '🔄 Did you successfully retweet our post?\n\nThanks for helping us grow!',
                'Yes, I Shared!',
                'I\'ll Do It Later',
                () => completeTask(task.id, task.reward),
                () => setShowTaskModal(false)
              );
            }, 2000);
          },
          () => setShowTaskModal(false)
        );
        break;
        
      case 'submit_wallet':
        setWalletAddress('');
        setWalletError('');
        setShowWalletModal(true);
        break;
        
      case 'invite_friend':
        // Enhanced referral experience with actual integration
        displayTaskModal(
          task,
          'invite',
          '👥 Ready to invite friends and earn together?\n\nBenefits:\n• Earn 100 Gems per friend\n• Get referral bonuses\n• Build your mining network\n• Unlock exclusive rewards\n\nYour referral code: ' + (referralData?.code || 'Loading...') + '\n\nShare this code with friends to complete the task!',
          'Share My Code!',
          'View Referral System',
          () => {
            // Copy referral code to clipboard
            if (referralData?.code) {
              navigator.clipboard.writeText(referralData.code);
              // Show success message
              displayTaskModal(
                task,
                'invite',
                '📋 Referral code copied to clipboard!\n\nShare it with friends:\n' + referralData.code + '\n\nWhen someone uses your code, this task will automatically complete!',
                'Got It!',
                'View Referral System',
                () => setShowTaskModal(false),
                () => {
                  // Navigate to referral system
                  window.dispatchEvent(new CustomEvent('navigateToReferralSystem'));
                  setShowTaskModal(false);
                }
              );
            } else {
              // If no referral code, show error
              displayTaskModal(
                task,
                'invite',
                '⚠️ Referral code not available yet.\n\nPlease try again in a moment or check the Referral System tab.',
                'OK',
                'View Referral System',
                () => setShowTaskModal(false),
                () => {
                  window.dispatchEvent(new CustomEvent('navigateToReferralSystem'));
                  setShowTaskModal(false);
                }
              );
            }
          },
          () => {
            // Navigate to referral system
            window.dispatchEvent(new CustomEvent('navigateToReferralSystem'));
            setShowTaskModal(false);
          }
        );
        break;
        
      case 'like_post':
        // Enhanced engagement experience
        displayTaskModal(
          task,
          'social',
          '❤️ Ready to show some love?\n\nLike our latest post and help boost our community engagement!',
          'Like Now!',
          'Maybe Later',
          () => {
            window.open('https://x.com/intent/like?tweet_id=1946298009924288617', '_blank');
            setTimeout(() => {
              displayTaskModal(
                task,
                'social',
                '❤️ Did you successfully like our post?\n\nThanks for the support!',
                'Yes, I Liked It!',
                'I\'ll Do It Later',
                () => completeTask(task.id, task.reward),
                () => setShowTaskModal(false)
              );
            }, 2000);
          },
          () => setShowTaskModal(false)
        );
        break;
        
      default:
        break;
    }
  }, [completedTasks, processingTasks, displayTaskModal, completeTask]);

  // const getMiningStatus = useCallback(() => {
  //   return gameState.isMining ? 'ACTIVE' : 'INACTIVE';
  // }, [gameState.isMining]);

  // Filter tasks by type
  const miningTasks = useMemo(() => tasks.filter(task => task.type === 'mining'), [tasks]);
  const socialTasks = useMemo(() => tasks.filter(task => task.type === 'social'), [tasks]);
  const airdropTasks = useMemo(() => tasks.filter(task => task.type === 'airdrop'), [tasks]);

  const [activeTab, setActiveTab] = useState<'all' | 'mining' | 'social' | 'airdrop' | 'completed'>('all');

  const getCurrentTasks = useCallback(() => {
    let filteredTasks = tasks;
    
    // Filter by tab
    switch (activeTab) {
      case 'mining': filteredTasks = miningTasks; break;
      case 'social': filteredTasks = socialTasks; break;
      case 'airdrop': filteredTasks = airdropTasks; break;
      case 'completed': filteredTasks = tasks.filter(task => task.completed); break;
    }
    
    return filteredTasks;
  }, [activeTab, miningTasks, socialTasks, airdropTasks, tasks]);

  // Debug function for development
  const resetMiningTimeTracking = useCallback(() => {
    if (!user?.id) return;
    
    const userId = user.id.toString();
    const miningTimeKey = getUserSpecificKey('miningTime', userId);
    const lastUpdateKey = getUserSpecificKey('lastMiningUpdate', userId);
    
    localStorage.removeItem(miningTimeKey);
    localStorage.removeItem(lastUpdateKey);
    
    setMiningTime(0);
    autoCompletedTasksRef.current.delete('mine_1hour');
    
    console.log('🔄 Mining time tracking reset');
  }, [user?.id, getUserSpecificKey]);

  // Expose debug functions (development only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).resetMiningTime = resetMiningTimeTracking;
      (window as any).debugTaskCenter = () => {
        console.log('Task Center Debug:', {
          gameState,
          taskProgress,
          completedTasks,
          processingTasks: Array.from(processingTasks),
          miningTime,
          autoCompleted: Array.from(autoCompletedTasksRef.current),
          referralData
        });
      };
    }
  }, [resetMiningTimeTracking, gameState, taskProgress, completedTasks, processingTasks, miningTime, referralData]);

  // Listen for navigation events
  useEffect(() => {
    const handleNavigateToReferralSystem = () => {
      // Dispatch event to parent component to switch to referral system
      window.dispatchEvent(new CustomEvent('switchToReferralSystem'));
    };

    window.addEventListener('navigateToReferralSystem', handleNavigateToReferralSystem);
    
    return () => {
      window.removeEventListener('navigateToReferralSystem', handleNavigateToReferralSystem);
    };
  }, []);

  return (
    <div className="task-center-container flex-1 p-4 space-y-3 overflow-y-auto">
      {/* Compact Header */}
      <div className="flex items-center justify-between bg-gray-900/50 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-base font-semibold text-white">Task Center</h1>
            <p className="text-xs text-gray-400">
              {activeTab === 'completed' ? 'Completed tasks' : 'Complete tasks to earn rewards'}
            </p>
          </div>
          {/* <CompletedTasksToggle
            completedTasksCount={completedTasks.length}
            hideCompleted={hideCompleted}
            onToggle={() => setHideCompleted(!hideCompleted)}
          /> */}
        </div>
        <div className="flex items-center gap-3 text-xs">
          {activeTab === 'completed' ? (
            <>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span className="text-gray-300">{completedTasks.length} done</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                <span className="text-gray-300">{completedTasks.length * 50} gems</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span className="text-gray-300">{completedTasks.length} done</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span className="text-gray-300">{tasks.length - completedTasks.length} left</span>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Header */}
      {/* <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 font-mono font-bold tracking-wider text-sm">TASK CENTER</span>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
          
          <p className="text-cyan-300 font-mono text-xs tracking-wider">
            Complete missions to earn bonus rewards
          </p>
        </div>
      </div> */}

      {/* Mining Status */}
      {/* <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 font-mono font-bold text-xs tracking-wider">MINING STATUS</span>
          </div>
          <div className="text-right">
            <div className="text-cyan-300 font-mono text-xs tracking-wider">
              {getMiningStatus()}
            </div>
            {import.meta.env.DEV && (
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => {
                    (window as any).debugTaskCenter?.();
                  }}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  title="Debug Task Center"
                >
                  🔍
                </button>
                <button
                  onClick={() => {
                    if (confirm('Reset mining time tracking?')) {
                      resetMiningTimeTracking();
                      alert('Mining time tracking reset!');
                    }
                  }}
                  className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                  title="Reset Mining Time"
                >
                  🔄
                </button>
              </div>
            )}
          </div>
        </div>
      </div> */}

      {/* Task Controls */}
      <div className="flex flex-col gap-2">
        {/* Show/Hide Completed Toggle - Auto-hide when no completed tasks */}
        {/* Enhanced Task Type Tabs */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-2">
          <div className="flex gap-1">
            {[
              { 
                id: 'all', 
                name: 'All Tasks', 
                count: tasks.length,
                icon: '📋',
                color: 'blue',
                description: 'View all available tasks'
              },
              { 
                id: 'social', 
                name: 'Social', 
                count: socialTasks.length,
                icon: '🌐',
                color: 'purple',
                description: 'Social media engagement'
              },
              { 
                id: 'mining', 
                name: 'Mining', 
                count: miningTasks.length,
                icon: '⛏️',
                color: 'yellow',
                description: 'Mining achievements'
              },
              { 
                id: 'airdrop', 
                name: 'Airdrop', 
                count: airdropTasks.length,
                icon: '💎',
                color: 'cyan',
                description: 'Airdrop opportunities'
              },
              { 
                id: 'completed', 
                name: 'Completed', 
                count: completedTasks.length,
                icon: '✅',
                color: 'green',
                description: 'Finished tasks'
              }
            ].map(({ id, name, count, icon, color, description }) => {
              const isActive = activeTab === id;
              const colorClasses = {
                blue: isActive ? 'bg-blue-600/80 border-blue-500 text-white' : 'hover:bg-blue-600/20 hover:border-blue-500/50 text-blue-300',
                purple: isActive ? 'bg-purple-600/80 border-purple-500 text-white' : 'hover:bg-purple-600/20 hover:border-purple-500/50 text-purple-300',
                yellow: isActive ? 'bg-yellow-600/80 border-yellow-500 text-white' : 'hover:bg-yellow-600/20 hover:border-yellow-500/50 text-yellow-300',
                cyan: isActive ? 'bg-cyan-600/80 border-cyan-500 text-white' : 'hover:bg-cyan-600/20 hover:border-cyan-500/50 text-cyan-300',
                green: isActive ? 'bg-green-600/80 border-green-500 text-white' : 'hover:bg-green-600/20 hover:border-green-500/50 text-green-300'
              };
              
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border transition-all duration-200 ${
                    colorClasses[color as keyof typeof colorClasses]
                  } ${isActive ? 'shadow-lg scale-105' : 'hover:scale-102'}`}
                  title={description}
                >
                  <div className="text-sm">{icon}</div>
                  <div className="text-[10px] font-medium leading-tight">{name}</div>
                  <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-700/50 text-gray-300'
                  }`}>
                    {count}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compact Professional Task List */}
      <div className="space-y-1">
        {getCurrentTasks().map((task) => {
          const isCompleted = task.completed;
          const isProcessing = processingTasks.has(task.id);
          const progressPercentage = Math.min((task.progress / task.max) * 100, 100);
          
          return (
            <div key={task.id} className={`bg-gray-900/30 border rounded-md p-3 transition-colors ${
              isCompleted 
                ? 'border-green-600/50 bg-green-900/10' 
                : isProcessing
                ? 'border-orange-600/50 bg-orange-900/10'
                : 'border-gray-700/50 hover:border-gray-600/50'
            }`}>
              
              {/* Compact Task Row */}
              <div className="flex items-center justify-between">
                {/* Left: Icon and Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-base flex-shrink-0">
                    {task.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium text-sm truncate ${
                        isCompleted ? 'text-green-400' : 'text-white'
                      }`}>
                        {task.title}
                      </h3>
                      <span className="text-yellow-400 text-xs font-medium flex-shrink-0">
                        {task.reward}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs truncate">{task.description}</p>
                  </div>
                </div>
                
                {/* Right: Progress and Action */}
                <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                  {/* Progress Info */}
                  <div className="text-right">
                    <div className="text-xs text-gray-400">
                      {Math.round(progressPercentage)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {task.id === 'mine_1hour' 
                        ? `${Math.floor(task.progress / 60)}m/${Math.floor(task.max / 60)}m`
                        : `${task.progress.toLocaleString()}/${task.max.toLocaleString()}`
                      }
                    </div>
                  </div>
                  
                                {/* Status/Action */}
              {activeTab === 'completed' ? (
                <div className="text-xs text-green-400 px-2 py-1 bg-green-900/20 rounded">
                  ✓ Done
                </div>
              ) : task.type === 'mining' ? (
                <div className="text-xs text-gray-500 px-2 py-1 bg-gray-800/50 rounded">
                  Auto
                </div>
              ) : (
                <button
                  onClick={() => handleTaskAction(task)}
                  disabled={isCompleted || isProcessing}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    isCompleted
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : isProcessing
                      ? 'bg-orange-600 text-orange-200 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isCompleted ? 'Done' : isProcessing ? '...' : 'Start'}
                </button>
              )}
                </div>
              </div>
              
              {/* Compact Progress Bar */}
              <div className="mt-2">
                <div className="w-full bg-gray-700/50 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Status Indicator */}
              {(isCompleted || isProcessing) && (
                <div className="mt-2 text-xs">
                  {isCompleted && (
                    <span className="text-green-400">✓ Completed</span>
                  )}
                  {isProcessing && (
                    <span className="text-orange-400 animate-pulse">Processing...</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Clean Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center max-w-sm mx-4">
            <div className="text-4xl mb-4">🎉</div>
            
            <h3 className="text-white font-semibold text-lg mb-4">Task Completed!</h3>
            
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
              <p className="text-blue-200 text-sm">{rewardMessage}</p>
            </div>
            
            <button
              onClick={() => setShowRewardModal(false)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded transition-colors"
            >
              Great!
            </button>
          </div>
        </div>
      )}

      {/* Clean Task Modal */}
      {showTaskModal && currentTaskModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center max-w-md mx-4">
            {/* Close button */}
            <button
              onClick={() => setShowTaskModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl transition-colors"
            >
              ×
            </button>
            
            <div className="text-3xl mb-4">
              {currentTaskModal.type === 'social' && '🌐'}
              {currentTaskModal.type === 'wallet' && '💎'}
              {currentTaskModal.type === 'invite' && '👥'}
            </div>
            
            <h3 className="text-white font-semibold text-lg mb-4">
              {currentTaskModal.task.title}
            </h3>
            
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
              <p className="text-blue-200 text-sm whitespace-pre-line">
                {currentTaskModal.message}
              </p>
            </div>
            
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mb-6">
              <div className="text-yellow-400 font-medium text-sm">
                Reward: {currentTaskModal.task.reward}
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  currentTaskModal.onConfirm();
                  setShowTaskModal(false);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded transition-colors"
              >
                {currentTaskModal.confirmText}
              </button>
              
              {currentTaskModal.cancelText && (
                <button
                  onClick={() => {
                    currentTaskModal.onCancel?.();
                    setShowTaskModal(false);
                  }}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-6 rounded transition-colors"
                >
                  {currentTaskModal.cancelText}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clean Wallet Input Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center max-w-md mx-4">
            {/* Close button */}
            <button
              onClick={() => setShowWalletModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl transition-colors"
            >
              ×
            </button>
            
            <div className="text-3xl mb-4">💎</div>
            
            <h3 className="text-white font-semibold text-lg mb-4">Submit Wallet for Airdrop</h3>
            
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
              <p className="text-blue-200 text-sm">
                Enter your wallet address to receive exclusive airdrops and rewards
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => {
                  setWalletAddress(e.target.value);
                  setWalletError('');
                }}
                placeholder="Enter your TON wallet address..."
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                autoFocus
              />
              {walletError && (
                <div className="mt-2 text-red-400 text-xs">{walletError}</div>
              )}
            </div>
            
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6">
              <div className="text-yellow-400 font-medium text-sm mb-2">Reward: 150 Gems</div>
              <div className="text-yellow-300 text-xs">
                + Access to exclusive airdrops
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  const trimmedAddress = walletAddress.trim();
                  if (!trimmedAddress) {
                    setWalletError('Please enter a wallet address');
                    return;
                  }
                  if (trimmedAddress.length < 10) {
                    setWalletError('Wallet address must be at least 10 characters');
                    return;
                  }
                  if (trimmedAddress.length > 100) {
                    setWalletError('Wallet address is too long');
                    return;
                  }
                  
                  setShowWalletModal(false);
                  displayTaskModal(
                    tasks.find(t => t.id === 'submit_wallet')!,
                    'invite',
                    'Wallet address submitted successfully! You will receive 150 Gems and access to exclusive airdrops.',
                    'Great!'
                  );
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded transition-colors"
              >
                Submit
              </button>
              
              <button
                onClick={() => setShowWalletModal(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-6 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 