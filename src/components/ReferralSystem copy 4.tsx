import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GiPerson, GiPresent, GiShare } from 'react-icons/gi';
import { useGameContext } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';
import { useReferralIntegration } from '@/hooks/useReferralIntegration';
import './ReferralSystem.css';
import { supabase } from '@/lib/supabaseClient';
import { ReferralPrompt } from '@/components/ReferralPrompt';

interface ReferralReward {
  level: number;
  name: string;
  requirements: number;
  rewards: {
    points: number;
    gems: number;
    special?: string;
  };
  icon: string;
  color: string;
}

interface UplineInfo {
  id: string;
  username: string;
  rank: string;
  totalEarned: number;
  joinedAt: number;
  isActive: boolean;
  level: number;
}

interface DownlineInfo {
  id: string;
  username: string;
  rank: string;
  totalEarned: number;
  joinedAt: number;
  isActive: boolean;
  level: number;
  directReferrals: number;
}

// Referral reward tiers
const REFERRAL_REWARDS: ReferralReward[] = [
  {
    level: 1,
    name: 'First Friend',
    requirements: 1,
    rewards: { points: 100, gems: 10 },
    icon: '👥',
    color: 'green'
  },
  {
    level: 2,
    name: 'Social Butterfly',
    requirements: 3,
    rewards: { points: 300, gems: 30 },
    icon: '🦋',
    color: 'blue'
  },
  {
    level: 3,
    name: 'Network Builder',
    requirements: 5,
    rewards: { points: 500, gems: 50, special: 'VIP Access' },
    icon: '🌐',
    color: 'purple'
  },
  {
    level: 4,
    name: 'Community Leader',
    requirements: 10,
    rewards: { points: 1000, gems: 100, special: 'Exclusive NFT' },
    icon: '👑',
    color: 'yellow'
  },
  {
    level: 5,
    name: 'Referral Master',
    requirements: 20,
    rewards: { points: 2500, gems: 250, special: 'Legendary Status' },
    icon: '🏆',
    color: 'red'
  }
];

export const ReferralSystem: React.FC = () => {
  const { addPoints, addGems } = useGameContext();
  const { user } = useAuth();
  const { 
    referralData,
    loadReferralData,
    debugInfo,
    // clearReferralHistory,
    // testReferralCode
  } = useReferralIntegration();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'rewards'>('overview');
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showQR, setShowQR] = useState(false);
  // const [testCode, setTestCode] = useState('');
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  // Enhanced network visualization
  const [uplineData, setUplineData] = useState<UplineInfo[]>([]);
  const [downlineData, setDownlineData] = useState<DownlineInfo[]>([]);
  const [networkStats, setNetworkStats] = useState({
    totalNetworkSize: 0,
    totalNetworkEarnings: 0,
    networkLevels: 0,
    yourPosition: 0
  });
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Enhanced localStorage management with error handling
  const getUserSpecificKey = useCallback((baseKey: string, userId?: string) => {
    if (!userId) return baseKey;
    return `${baseKey}_${userId}`;
  }, []);

  const safeGetFromStorage = useCallback((key: string, defaultValue: any = []) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }, []);

  const safeSetToStorage = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, []);

  // Enhanced claimedRewards state management with database persistence
  const [claimedRewards, setClaimedRewards] = useState<string[]>(() => {
    const userId = user?.id ? user.id.toString() : 'anonymous';
    const claimedKey = getUserSpecificKey('referral_claimed_rewards', userId);
    return safeGetFromStorage(claimedKey, []);
  });

  // Load claimed rewards from database on component mount
  const loadClaimedRewardsFromDatabase = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('🔄 Loading claimed rewards from database for user:', user.id);
      
      // Use the database function to get claimed rewards
      const { data: dbRewards, error: dbError } = await supabase
        .rpc('get_user_claimed_rewards', { p_user_id: user.id });

      if (dbError) {
        console.warn('⚠️ Database function failed, trying direct query:', dbError);
        
        // Fallback to direct query
        const { data: fallbackRewards, error: fallbackError } = await supabase
          .from('referral_claimed_rewards')
          .select('reward_key, claimed_at')
          .eq('user_id', user.id);

        if (fallbackError) {
          console.warn('⚠️ Fallback query also failed, using localStorage:', fallbackError);
          return;
        }

        if (fallbackRewards && fallbackRewards.length > 0) {
          const dbClaimedKeys = fallbackRewards.map((r: { reward_key: string }) => r.reward_key);
          console.log('✅ Loaded claimed rewards from fallback query:', dbClaimedKeys);
          
          setClaimedRewards(dbClaimedKeys);
          
          const userId = user.id.toString();
          const claimedKey = getUserSpecificKey('referral_claimed_rewards', userId);
          safeSetToStorage(claimedKey, dbClaimedKeys);
        }
      } else if (dbRewards && dbRewards.length > 0) {
        const dbClaimedKeys = dbRewards.map((r: { reward_key: string }) => r.reward_key);
        console.log('✅ Loaded claimed rewards from database function:', dbClaimedKeys);
        
        // Update state with database data
        setClaimedRewards(dbClaimedKeys);
        
        // Also update localStorage for offline access
        const userId = user.id.toString();
        const claimedKey = getUserSpecificKey('referral_claimed_rewards', userId);
        safeSetToStorage(claimedKey, dbClaimedKeys);
      } else {
        console.log('ℹ️ No claimed rewards found in database');
      }
    } catch (error) {
      console.error('❌ Error loading claimed rewards from database:', error);
    }
  }, [user?.id, getUserSpecificKey, safeSetToStorage]);

  // Save claimed rewards to both localStorage and database
  const saveClaimedReward = useCallback(async (rewardKey: string, reward: ReferralReward) => {
    if (!user?.id) return;

    try {
      console.log('💾 Saving claimed reward to database:', rewardKey);
      
      // Parse reward key to get level and requirements
      const [levelStr, requirementsStr] = rewardKey.split('_');
      const level = parseInt(levelStr);
      const requirements = parseInt(requirementsStr);
      
      // Try to use the database function first
      const { error: functionError } = await supabase
        .rpc('claim_referral_reward', {
          p_user_id: user.id,
          p_reward_level: level,
          p_reward_requirements: requirements,
          p_reward_name: reward.name,
          p_points_awarded: reward.rewards.points,
          p_gems_awarded: reward.rewards.gems,
          p_special_reward: reward.rewards.special || null
        });

      if (functionError) {
        console.warn('⚠️ Database function failed, trying direct insert:', functionError);
        
        // Fallback to direct insert
        const { error: insertError } = await supabase
          .from('referral_claimed_rewards')
          .insert({
            user_id: user.id,
            reward_key: rewardKey,
            reward_name: reward.name,
            reward_level: level,
            reward_requirements: requirements,
            points_awarded: reward.rewards.points,
            gems_awarded: reward.rewards.gems,
            special_reward: reward.rewards.special || null,
            claimed_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Direct insert also failed:', insertError);
          throw insertError;
        }
      }

      console.log('✅ Reward saved to database successfully');
      
      // Also update localStorage for offline access
      const userId = user.id.toString();
      const claimedKey = getUserSpecificKey('referral_claimed_rewards', userId);
      const currentClaimed = safeGetFromStorage(claimedKey, []);
      const updatedClaimed = [...currentClaimed, rewardKey];
      safeSetToStorage(claimedKey, updatedClaimed);
      
    } catch (error) {
      console.error('❌ Error saving claimed reward:', error);
      throw error;
    }
  }, [user?.id, getUserSpecificKey, safeGetFromStorage, safeSetToStorage]);

  // Save claimed rewards to localStorage whenever it changes (fallback)
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const userId = user?.id ? user.id.toString() : 'anonymous';
    const claimedKey = getUserSpecificKey('referral_claimed_rewards', userId);
    safeSetToStorage(claimedKey, claimedRewards);
  }, [claimedRewards, user?.id, getUserSpecificKey, safeSetToStorage]);

  // Load claimed rewards from database on user change
  useEffect(() => {
    if (user?.id) {
      loadClaimedRewardsFromDatabase();
    }
  }, [user?.id, loadClaimedRewardsFromDatabase]);

  // Enhanced data loading effect
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (!user?.id || !mounted) return;
      
      try {
        console.log('🔄 Loading referral data for user:', user.id);
        
        // Force reload referral data
        await loadReferralData();
        
        if (mounted) {
          setDataLoaded(true);
          console.log('✅ Referral data loaded successfully');
        }
      } catch (error) {
        console.error('❌ Error loading referral data:', error);
        if (mounted) {
          setDataLoaded(true); // Set to true even on error to prevent infinite loading
        }
      }
    };

    loadData();
    
    return () => {
      mounted = false;
    };
  }, [user?.id, loadReferralData]);

  // Enhanced claim reward function with better error handling
  const claimReward = useCallback(async (reward: ReferralReward) => {
    if (isClaimingReward) {
      console.log('⚠️ Already claiming a reward, please wait...');
      return;
    }

    setIsClaimingReward(true);
    
    try {
      const rewardKey = `${reward.level}_${reward.requirements}`;
      
      console.log('🎯 Attempting to claim reward:', {
        reward: reward.name,
        rewardKey,
        totalReferrals: referralData.totalReferrals,
        requirements: reward.requirements,
        alreadyClaimed: claimedRewards.includes(rewardKey)
      });
      
      // Check if reward was already claimed
      if (claimedRewards.includes(rewardKey)) {
        setRewardMessage('🚫 This reward has already been claimed!');
        setShowRewardModal(true);
        return;
      }
      
      // Enhanced requirement check with debug info
      if (referralData.totalReferrals < reward.requirements) {
        const needed = reward.requirements - referralData.totalReferrals;
        console.log('❌ Insufficient referrals:', {
          current: referralData.totalReferrals,
          required: reward.requirements,
          needed
        });
        
        setRewardMessage(`🚫 You need ${needed} more referral${needed > 1 ? 's' : ''} to claim this reward!\n\nCurrent: ${referralData.totalReferrals}/${reward.requirements}`);
        setShowRewardModal(true);
        return;
      }
      
      console.log('✅ Reward requirements met, processing claim...');
      
      // Validate GameContext functions
      if (!addPoints || !addGems) {
        console.error('❌ GameContext functions not available');
        setRewardMessage('🚫 Error: Reward system not available. Please refresh the page.');
        setShowRewardModal(true);
        return;
      }
      
      // Award the rewards
      console.log('💰 Adding rewards:', {
        points: reward.rewards.points,
        gems: reward.rewards.gems
      });
      
      addPoints(reward.rewards.points);
      addGems(reward.rewards.gems, `referral_level_${reward.level}`);
      
      // Mark as claimed in database and update state
      await saveClaimedReward(rewardKey, reward);
      
      // Update local state
      setClaimedRewards(prev => {
        const newClaimed = [...prev, rewardKey];
        console.log('✅ Reward claimed successfully:', newClaimed);
        return newClaimed;
      });
      
      // Show success message
      const successMessage = `🎉 ${reward.name} unlocked!\n\n+${reward.rewards.points} Points\n+${reward.rewards.gems} Gems${reward.rewards.special ? `\n• ${reward.rewards.special}` : ''}`;
      setRewardMessage(successMessage);
      setShowRewardModal(true);
      
      // Dispatch success event
      window.dispatchEvent(new CustomEvent('referralRewardClaimed', {
        detail: { reward, rewardKey }
      }));
      
    } catch (error) {
      console.error('❌ Error claiming reward:', error);
      setRewardMessage('🚫 Error claiming reward. Please try again.');
      setShowRewardModal(true);
    } finally {
      setIsClaimingReward(false);
    }
  }, [referralData.totalReferrals, addPoints, addGems, claimedRewards, isClaimingReward, saveClaimedReward]);

  // Load upline and downline data
  const loadNetworkData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Load upline (who referred you and their referrers)
      const uplineResponse = await supabase
        .from('users')
        .select(`
          id,
          username,
          rank,
          total_earned,
          created_at,
          is_active,
          referrer_id,
          referrer:users!referrer_id(
            id,
            username,
            rank,
            total_earned,
            created_at,
            is_active,
            referrer_id
          )
        `)
        .eq('id', user.id)
        .single();

    let uplineArray: UplineInfo[] = [];
    if (uplineResponse.data?.referrer_id) {
      let currentUser = uplineResponse.data;
      let level = 1;

      while (currentUser.referrer && level <= 5) { // Limit to 5 levels
        const referrerData = Array.isArray(currentUser.referrer) ? currentUser.referrer[0] : currentUser.referrer;
        uplineArray.push({
          id: referrerData.id.toString(),
          username: referrerData.username,
          rank: referrerData.rank || 'Novice',
          totalEarned: referrerData.total_earned || 0,
          joinedAt: new Date(referrerData.created_at).getTime(),
          isActive: referrerData.is_active,
          level
        });

        // Break the loop since we can't go deeper with current query structure
        break;
      }
    }

    // Load downline (your referrals and their referrals)
    const downlineResponse = await supabase
      .from('referrals')
      .select(`
        *,
        referred:users!referred_id(
          id,
          username,
          rank,
          total_earned,
          created_at,
          is_active,
          direct_referrals
        )
      `)
      .eq('referrer_id', user.id);

    let downlineArray: DownlineInfo[] = [];
    if (downlineResponse.data) {
      downlineArray = downlineResponse.data.map(ref => ({
        id: ref.referred.id.toString(),
        username: ref.referred.username,
        rank: ref.referred.rank || 'Novice',
        totalEarned: ref.referred.total_earned || 0,
        joinedAt: new Date(ref.referred.created_at).getTime(),
        isActive: ref.referred.is_active,
        level: 1,
        directReferrals: ref.referred.direct_referrals || 0
      }));
    }

    // Update all states at once
    setUplineData(uplineArray);
    setDownlineData(downlineArray);

    // Calculate network stats
    const totalNetworkSize = downlineArray.length;
    const totalNetworkEarnings = downlineArray.reduce((sum, member) => sum + member.totalEarned, 0);
    const networkLevels = Math.max(...downlineArray.map(m => m.level), 0);

    setNetworkStats({
      totalNetworkSize,
      totalNetworkEarnings,
      networkLevels,
      yourPosition: uplineArray.length + 1
    });

  } catch (error) {
    console.error('Error loading network data:', error);
  }
}, [user?.id]);

// Update the useEffect to depend on user and dataLoaded
useEffect(() => {
  if (dataLoaded && user?.id) {
    loadNetworkData();
  }
}, [user?.id, dataLoaded, loadNetworkData]);

  // Copy referral code
  const copyReferralCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [referralData.code]);

  // Share referral link
  const shareReferral = useCallback(() => {
    const referralLink = `https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join DivineTap Mining!',
        text: 'Start mining divine points and earn rewards!',
        url: referralLink
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralData.code]);

  // Get current level info
  const getCurrentLevel = useCallback(() => {
    return REFERRAL_REWARDS.find(r => r.level === referralData.level) || REFERRAL_REWARDS[0];
  }, [referralData.level]);

  // Get next level info
  const getNextLevel = useCallback(() => {
    return REFERRAL_REWARDS.find(r => r.level === referralData.level + 1);
  }, [referralData.level]);

  // Debug function to refresh data
  const refreshData = useCallback(async () => {
    setDataLoaded(false);
    try {
      await loadReferralData();
      setDataLoaded(true);
      console.log('🔄 Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      setDataLoaded(true);
    }
  }, [loadReferralData]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();

  const tabs = [
    { id: 'overview', name: 'Overview', icon: GiShare },
    { id: 'network', name: 'Network', icon: GiPerson },
    { id: 'rewards', name: 'Rewards', icon: GiPresent }
  ];

  const handleManualReferralEntry = useCallback(() => {
    setShowManualEntry(true);
  }, []);

  const handleReferralPromptClose = useCallback(() => {
    setShowManualEntry(false);
    if (user?.id) {
      localStorage.setItem(`referral_prompted_${user.id}`, 'true');
    }
  }, [user?.id]);

  const handleReferralPromptSuccess = useCallback((referrerInfo: any) => {
    console.log('✅ Successfully joined network:', referrerInfo);
    setShowManualEntry(false);
    // Refresh data
    loadReferralData();
    loadNetworkData();
  }, [loadReferralData, loadNetworkData]);

  return (
    <div className="flex-1 p-2 space-y-1 overflow-y-auto game-scrollbar">
      {/* Compact Header */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-2 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 font-mono font-bold tracking-wider text-xs">REFERRAL SYSTEM</span>
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Compact Stats Cards */}
      <div className="grid grid-cols-3 gap-1">
        <div className="relative bg-black/40 backdrop-blur-xl border border-green-400/30 rounded-lg p-1.5 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
          <div className="text-center">
            <div className="text-green-400 font-mono font-bold text-xs tracking-wider">
              {dataLoaded ? referralData.totalReferrals : '...'}
            </div>
            <div className="text-green-300 text-xs font-mono uppercase tracking-wider">Total</div>
          </div>
        </div>

        <div className="relative bg-black/40 backdrop-blur-xl border border-blue-400/30 rounded-lg p-1.5 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <div className="text-center">
            <div className="text-blue-400 font-mono font-bold text-xs tracking-wider">
              {dataLoaded ? referralData.activeReferrals : '...'}
            </div>
            <div className="text-blue-300 text-xs font-mono uppercase tracking-wider">Active</div>
          </div>
        </div>

        <div className="relative bg-black/40 backdrop-blur-xl border border-yellow-400/30 rounded-lg p-1.5 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
          <div className="text-center">
            <div className="text-yellow-400 font-mono font-bold text-xs tracking-wider">
              {referralData.rewards.points.toLocaleString()}
            </div>
            <div className="text-yellow-300 text-xs font-mono uppercase tracking-wider">Earned</div>
          </div>
        </div>
      </div>

      {/* Compact Navigation Tabs */}
      <div className="flex gap-0.5">
        {tabs.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg font-mono text-xs font-bold tracking-wider transition-all duration-300 ${
              activeTab === id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                : 'bg-black/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
            }`}
          >
            <Icon size={12} />
            <span className="hidden sm:inline">{name}</span>
          </button>
        ))}
      </div>

      {/* Enhanced Debug Section - Only in dev */}
      {import.meta.env.DEV && (
        <div className="relative bg-black/40 backdrop-blur-xl border border-orange-500/30 rounded-lg p-2 shadow-[0_0_15px_rgba(251,146,60,0.1)]">
          <div className="flex items-center justify-between mb-1">
            <div className="text-orange-400 font-mono font-bold text-xs tracking-wider">DEBUG</div>
            <div className="flex gap-1">
              <button
                onClick={refreshData}
                className="text-green-400 hover:text-green-300 font-mono text-xs tracking-wider"
              >
                REFRESH
              </button>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-orange-300 text-xs font-mono tracking-wider"
              >
                {showDebug ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>
          {showDebug && (
            <div className="space-y-1 text-xs font-mono tracking-wider">
              <div className="text-orange-300">
                <span className="text-orange-400">Data:</span> {dataLoaded ? 'Yes' : 'No'} | 
                <span className="text-orange-400"> Total:</span> {referralData.totalReferrals} | 
                <span className="text-orange-400"> Code:</span> {referralData.code}
              </div>
              {debugInfo.error && (
                <div className="text-red-300">
                  <span className="text-red-400">Error:</span> {debugInfo.error}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {!dataLoaded && (
        <div className="relative bg-black/40 backdrop-blur-xl border border-gray-600/30 rounded-lg p-3 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
          <div className="text-center">
            <div className="text-xl mb-1 animate-spin">⏳</div>
            <div className="text-gray-400 font-mono font-bold text-xs tracking-wider">LOADING...</div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {dataLoaded && activeTab === 'overview' && (
        <div className="space-y-1">
          {/* Compact Referral Code */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-lg p-2 shadow-[0_0_15px_rgba(147,51,234,0.1)]">
            <div className="text-center mb-2">
              <div className="text-purple-400 font-mono font-bold text-xs tracking-wider mb-1">YOUR REFERRAL CODE</div>
              <div className="text-base font-mono font-bold text-purple-300 tracking-wider mb-1 break-all">{referralData.code}</div>
              <button
                onClick={copyReferralCode}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-purple-400"
              >
                {copied ? '✓ COPIED' : 'COPY CODE'}
              </button>
            </div>
          </div>

          {/* Compact Current Level */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-yellow-500/30 rounded-lg p-2 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
            <div className="text-center">
              <div className="text-lg mb-1">{currentLevel.icon}</div>
              <div className="text-yellow-400 font-mono font-bold text-xs tracking-wider mb-1">{currentLevel.name}</div>
              <div className="text-yellow-300 font-mono text-xs tracking-wider mb-1">
                {referralData.totalReferrals}/{currentLevel.requirements} referrals
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-1 mb-1">
                <div 
                  className="h-1 bg-yellow-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((referralData.totalReferrals / currentLevel.requirements) * 100, 100)}%` }}
                ></div>
              </div>
              
              {nextLevel && (
                <div className="text-gray-400 font-mono text-xs tracking-wider">
                  Next: {nextLevel.name} ({nextLevel.requirements - referralData.totalReferrals} more)
                </div>
              )}
            </div>
          </div>

          {/* Compact Share Section */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-2 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
            <div className="text-center mb-2">
              <div className="text-cyan-400 font-mono font-bold text-xs tracking-wider mb-1">SHARE & EARN</div>
              <div className="flex gap-1 justify-center">
                <button
                  onClick={shareReferral}
                  className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-cyan-400"
                >
                  {copied ? '✓ COPIED' : 'SHARE'}
                </button>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-purple-400"
                >
                  QR
                </button>
              </div>
              {showQR && (
                <div className="mt-2 p-2 bg-white rounded-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`)}`}
                    alt="Referral QR Code"
                    className="w-32 h-32 mx-auto"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Compact Referral List Preview */}
          {referralData.referrals.length > 0 && (
            <div className="relative bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-lg p-2 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
              <div className="text-center mb-2">
                <div className="text-green-400 font-mono font-bold text-xs tracking-wider mb-1">RECENT REFERRALS</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {referralData.referrals.slice(0, 3).map((referral, index) => (
                    <div key={referral.id} className="flex items-center justify-between bg-gray-800/50 rounded p-1">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <div className="text-green-300 font-mono text-xs">{referral.username}</div>
                      </div>
                      <div className="text-yellow-400 font-mono text-xs">{referral.pointsEarned.toLocaleString()}</div>
                    </div>
                  ))}
                  {referralData.referrals.length > 3 && (
                    <div className="text-gray-400 font-mono text-xs">
                      +{referralData.referrals.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add Manual Entry Button if user has no referrer */}
          {!referralData.referrals.length && (
            <div className="relative bg-black/40 backdrop-blur-xl border border-orange-500/30 rounded-lg p-2 shadow-[0_0_15px_rgba(251,146,60,0.1)]">
              <div className="text-center">
                <div className="text-orange-400 font-mono font-bold text-xs tracking-wider mb-1">🔗 JOIN NETWORK</div>
                <button
                  onClick={handleManualReferralEntry}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-orange-400"
                >
                  ENTER REFERRAL CODE
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {dataLoaded && activeTab === 'network' && (
        <div className="space-y-1">
          {/* Compact Network Overview */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-2 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
            <div className="text-center mb-2">
              <div className="text-cyan-400 font-mono font-bold text-xs tracking-wider mb-1">🌐 NETWORK STATS</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="bg-gray-800/50 rounded p-1">
                  <div className="text-green-400 font-bold">{networkStats.totalNetworkSize}</div>
                  <div className="text-gray-400">Members</div>
                </div>
                <div className="bg-gray-800/50 rounded p-1">
                  <div className="text-blue-400 font-bold">{networkStats.totalNetworkEarnings.toLocaleString()}</div>
                  <div className="text-gray-400">Earnings</div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Upline Section */}
          {uplineData.length > 0 && (
            <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-lg p-2 shadow-[0_0_15px_rgba(147,51,234,0.1)]">
              <div className="text-center mb-1">
                <div className="text-purple-400 font-mono font-bold text-xs tracking-wider">👆 UPLINE</div>
              </div>
              
              <div className="space-y-1">
                {uplineData.map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-gray-800/50 rounded p-1">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{member.level}</span>
                      </div>
                      <div className="text-purple-300 font-mono text-xs">{member.username}</div>
                    </div>
                    <div className="text-purple-400 font-mono text-xs">{member.totalEarned.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compact Downline Section */}
          {downlineData.length > 0 ? (
            <div className="relative bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-lg p-2 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
              <div className="text-center mb-1">
                <div className="text-green-400 font-mono font-bold text-xs tracking-wider">👇 DOWNLINE</div>
              </div>
              
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {downlineData.map((member, index) => (
                  <div key={member.id} className="flex items-center justify-between bg-gray-800/50 rounded p-1">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-green-300 font-mono text-xs">{member.username}</div>
                        <div className="text-gray-500 font-mono text-xs">{member.directReferrals} refs</div>
                      </div>
                    </div>
                    <div className="text-green-400 font-mono text-xs">{member.totalEarned.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative bg-black/40 backdrop-blur-xl border border-gray-600/30 rounded-lg p-3 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
              <div className="text-center">
                <div className="text-lg mb-1">👥</div>
                <div className="text-gray-400 font-mono font-bold text-xs tracking-wider mb-1">NO REFERRALS</div>
                <div className="text-gray-500 font-mono text-xs tracking-wider">
                  Share your code to build network!
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {dataLoaded && activeTab === 'rewards' && (
        <div className="space-y-1">
          <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-2 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
            <div className="text-center">
              <div className="text-cyan-400 font-mono font-bold text-xs tracking-wider mb-1">REWARD STATUS</div>
              <div className="text-cyan-300 font-mono text-xs tracking-wider">
                {referralData.totalReferrals} referrals • {claimedRewards.length} claimed
              </div>
            </div>
          </div>

          {REFERRAL_REWARDS.map((reward) => {
            const isUnlocked = referralData.totalReferrals >= reward.requirements;
            const isClaimed = claimedRewards.includes(`${reward.level}_${reward.requirements}`);
            const canClaim = isUnlocked && !isClaimed && !isClaimingReward;
            
            return (
              <div key={reward.level} className={`relative bg-black/40 backdrop-blur-xl border rounded-lg p-2 transition-all duration-300 ${
                isUnlocked 
                  ? 'border-green-400/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                  : 'border-gray-600/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-base">{reward.icon}</div>
                    <div>
                      <div className={`font-mono font-bold text-xs tracking-wider ${
                        isUnlocked ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {reward.name}
                      </div>
                      <div className="text-gray-400 font-mono text-xs tracking-wider">
                        {reward.requirements} refs • {Math.min(referralData.totalReferrals, reward.requirements)}/{reward.requirements}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-mono font-bold text-xs tracking-wider">
                      +{reward.rewards.points}p +{reward.rewards.gems}g
                    </div>
                    {canClaim && (
                      <button
                        onClick={() => claimReward(reward)}
                        disabled={isClaimingReward}
                        className="mt-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isClaimingReward ? 'CLAIMING...' : 'CLAIM'}
                      </button>
                    )}
                    {isClaimed && (
                      <div className="text-green-400 text-xs font-mono tracking-wider mt-1">✓ CLAIMED</div>
                    )}
                    {!isUnlocked && (
                      <div className="text-gray-500 text-xs font-mono tracking-wider mt-1">
                        Need {reward.requirements - referralData.totalReferrals} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative bg-black/90 backdrop-blur-2xl rounded-lg p-4 text-center max-w-sm mx-4 border border-cyan-400/30 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
            <div className="text-2xl mb-2 animate-bounce">
              {rewardMessage.includes('🚫') ? '❌' : '🎉'}
            </div>
            
            <h3 className="text-white font-mono font-bold text-base mb-2 tracking-wider">
              {rewardMessage.includes('🚫') ? 'REWARD UNAVAILABLE' : 'REWARD UNLOCKED!'}
            </h3>
            
            <div className="bg-cyan-500/20 backdrop-blur-xl rounded-lg p-2 border border-cyan-400/30 mb-3">
              <p className="text-cyan-200 text-xs font-mono tracking-wider whitespace-pre-line">
                {rewardMessage}
              </p>
            </div>
            
            <button
              onClick={() => setShowRewardModal(false)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold py-2 px-4 rounded-lg tracking-wider hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
            >
              {rewardMessage.includes('🚫') ? 'UNDERSTOOD' : 'AWESOME! ✨'}
            </button>
          </div>
        </div>
      )}

      {/* Add Manual Entry Modal */}
      {showManualEntry && (
        <ReferralPrompt 
          onClose={handleReferralPromptClose}
          onSuccess={handleReferralPromptSuccess}
        />
      )}
    </div>
  );
};