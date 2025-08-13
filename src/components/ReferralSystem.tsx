import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGameContext } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';
import { useReferralIntegration } from '@/hooks/useReferralIntegration';
import './ReferralSystem.css';
import { ReferralPrompt } from '@/components/ReferralPrompt';
import { ReferralCard } from './ReferralCard';
import './ReferralCard.css';

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
    loadReferralData
  } = useReferralIntegration();
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Enhanced localStorage management with error handling
  const getUserSpecificKey = useCallback((baseKey: string, userId?: string) => {
    if (!userId) return baseKey;
    return `${baseKey}_${userId}`;
  }, []);

  const safeGetFromStorage = useCallback((key: string, defaultValue: unknown = []) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }, []);

  const safeSetToStorage = useCallback((key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, []);

  // Enhanced claimedRewards state management
  const [claimedRewards, setClaimedRewards] = useState<string[]>(() => {
    const userId = user?.id ? user.id.toString() : 'anonymous';
    const claimedKey = getUserSpecificKey('referral_claimed_rewards', userId);
    return safeGetFromStorage(claimedKey, []);
  });

  // Save claimed rewards to localStorage whenever it changes
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const userId = user?.id ? user.id.toString() : 'anonymous';
    const claimedKey = getUserSpecificKey('referral_claimed_rewards', userId);
    safeSetToStorage(claimedKey, claimedRewards);
  }, [claimedRewards, user?.id, getUserSpecificKey, safeSetToStorage]);

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
      
      // Mark as claimed
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
  }, [referralData.totalReferrals, addPoints, addGems, claimedRewards, isClaimingReward]);

  const shareReferral = useCallback(() => {
    const referralLink = `https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join DivineTap Mining!',
        text: 'Start mining divine points and earn rewards!',
        url: referralLink
      });
    } else {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralData.code]);

  // Get next level info
  const getNextLevel = useCallback(() => {
    return REFERRAL_REWARDS.find(r => r.level === referralData.level + 1);
  }, [referralData.level]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const nextLevel = getNextLevel();

  const handleManualReferralEntry = useCallback(() => {
    setShowManualEntry(true);
  }, []);

  const handleReferralPromptClose = useCallback(() => {
    setShowManualEntry(false);
    if (user?.id) {
      localStorage.setItem(`referral_prompted_${user.id}`, 'true');
    }
  }, [user?.id]);

  const handleReferralPromptSuccess = useCallback((referrerInfo: unknown) => {
    console.log('✅ Successfully joined network:', referrerInfo);
    setShowManualEntry(false);
    loadReferralData();
  }, [loadReferralData]);

  const progress = nextLevel ? (referralData.totalReferrals / nextLevel.requirements) * 100 : 100;
  const referralsNeeded = nextLevel ? nextLevel.requirements - referralData.totalReferrals : 0;
  const referralLink = `https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`;

  return (
    <div className="flex-1 p-custom space-y-4 overflow-y-auto game-scrollbar referral-system-redesigned">
      {!dataLoaded ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center text-gray-400 font-mono">Loading...</div>
        </div>
      ) : (
        <>
          <ReferralCard
            referralLink={referralLink}
            totalReferrals={referralData.totalReferrals}
            totalEarnings={referralData.rewards.points}
            nextRewardTier={nextLevel ? nextLevel.name : 'All Tiers Completed'}
            referralsNeeded={referralsNeeded > 0 ? referralsNeeded : 0}
            progress={progress}
            onShare={shareReferral}
            copied={copied}
          />

          {!referralData.referredBy && !localStorage.getItem(`referral_prompted_${user?.id}`) && (
             <div className="join-network-prompt">
               <h3>Have a referral code?</h3>
               <p>Join a friend&apos;s network to get bonus rewards!</p>
               <button onClick={handleManualReferralEntry}>
                 Enter Code
               </button>
             </div>
          )}

          <div className="text-center">
            <button onClick={() => setShowDetails(!showDetails)} className="details-toggle-button">
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {showDetails && (
            <div className="details-section">
              {/* Rewards Section */}
              <div className="rewards-list">
                <h3 className="section-title">Your Rewards</h3>
                {REFERRAL_REWARDS.map((reward) => {
                  const isUnlocked = referralData.totalReferrals >= reward.requirements;
                  const isClaimed = claimedRewards.includes(`${reward.level}_${reward.requirements}`);
                  const canClaim = isUnlocked && !isClaimed;
                  return (
                    <div key={reward.level} className={`reward-item ${isUnlocked ? 'unlocked' : ''} ${isClaimed ? 'claimed' : ''}`}>
                      <div className="reward-icon">{reward.icon}</div>
                      <div className="reward-info">
                        <h4>{reward.name}</h4>
                        <p>{reward.requirements} referrals required</p>
                      </div>
                      <div className="reward-action">
                        {isClaimed ? (
                          <span className="claimed-badge">✓ Claimed</span>
                        ) : canClaim ? (
                          <button onClick={() => claimReward(reward)} disabled={isClaimingReward}>
                            {isClaimingReward ? '...' : 'Claim'}
                          </button>
                        ) : (
                          <span>{reward.requirements - referralData.totalReferrals} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Referrals List Section */}
              <div className="referrals-list">
                <h3 className="section-title">Your Friends ({referralData.totalReferrals})</h3>
                {referralData.referrals.length > 0 ? (
                  referralData.referrals.map((friend) => (
                    <div key={friend.id} className="friend-item">
                      <div className="friend-avatar">{friend.username.charAt(0)}</div>
                      <div className="friend-info">
                        <h4>{friend.username}</h4>
                        <p>Joined {new Date(friend.joinedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="friend-points">
                        <span>{friend.pointsEarned.toLocaleString()}</span>
                        <p>points</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-friends">You have not referred any friends yet.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showRewardModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative bg-black/90 backdrop-blur-2xl rounded-xl p-4 text-center max-w-sm mx-4 border border-cyan-400/30 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
            <div className="text-3xl mb-3 animate-bounce">
              {rewardMessage.includes('🚫') ? '❌' : '🎉'}
            </div>
            
            <h3 className="text-white font-mono font-bold text-lg mb-3 tracking-wider">
              {rewardMessage.includes('🚫') ? 'REWARD UNAVAILABLE' : 'REWARD UNLOCKED!'}
            </h3>
            
            <div className="bg-cyan-500/20 backdrop-blur-xl rounded-lg p-3 border border-cyan-400/30 mb-4">
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

      {showManualEntry && (
        <ReferralPrompt 
          onClose={handleReferralPromptClose}
          onSuccess={handleReferralPromptSuccess}
        />
      )}
    </div>
  );
};