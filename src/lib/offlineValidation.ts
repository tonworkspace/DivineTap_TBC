import { supabase } from './supabaseClient';

export interface OfflineValidation {
  isValid: boolean;
  calculatedReward: number;
  maxAllowedTime: number;
  suspiciousActivity?: string[];
  reason?: string;
}

export interface OfflineProgress {
  offlineTime: number;
  calculatedReward: number;
  energyRegen: number;
  timestamp: number;
  userState: any;
}

// Track offline progress for anti-cheat
const offlineProgressHistory = new Map<string, OfflineProgress[]>();

// Offline progress validation
export const validateOfflineProgress = async (
  userId: string,
  claimedOfflineTime: number,
  userState: any,
  lastServerTime?: number
): Promise<OfflineValidation> => {
  const suspiciousActivity: string[] = [];
  
  // Get user's last known activity from database
  const { data: lastActivity } = await supabase
    .from('user_game_data')
    .select('last_updated, game_data')
    .eq('user_id', userId)
    .order('last_updated', { ascending: false })
    .limit(1)
    .single();
  
  const serverLastTime = lastActivity?.last_updated 
    ? new Date(lastActivity.last_updated).getTime()
    : lastServerTime || Date.now();
  
  const actualOfflineTime = Date.now() - serverLastTime;
  const maxAllowedTime = 14 * 24 * 60 * 60 * 1000; // 14 days
  
  // Check if claimed time exceeds actual time
  if (claimedOfflineTime > actualOfflineTime) {
    suspiciousActivity.push(`Claimed offline time (${claimedOfflineTime}ms) exceeds actual time (${actualOfflineTime}ms)`);
  }
  
  // Check if offline time exceeds maximum
  if (claimedOfflineTime > maxAllowedTime) {
    return {
      isValid: false,
      calculatedReward: 0,
      maxAllowedTime,
      reason: 'Offline time exceeds maximum allowed (14 days)'
    };
  }
  
  // Use the smaller of claimed vs actual time
  const validatedOfflineTime = Math.min(claimedOfflineTime, actualOfflineTime);
  
  // Calculate expected reward
  const calculatedReward = calculateOfflineReward(userState, validatedOfflineTime);
  
  // Check for suspicious reward amounts
  const maxPossibleReward = calculateMaxPossibleReward(userState, validatedOfflineTime);
  if (calculatedReward > maxPossibleReward) {
    suspiciousActivity.push(`Calculated reward (${calculatedReward}) exceeds maximum possible (${maxPossibleReward})`);
  }
  
  // Check for impossible offline progress patterns
  const userHistory = offlineProgressHistory.get(userId) || [];
  const recentOfflineProgress = userHistory.filter(
    progress => Date.now() - progress.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
  );
  
  // Check for excessive offline claims
  const totalOfflineTimeToday = recentOfflineProgress.reduce(
    (total, progress) => total + progress.offlineTime, 0
  );
  
  const maxDailyOfflineTime = 24 * 60 * 60 * 1000; // 24 hours
  if (totalOfflineTimeToday + validatedOfflineTime > maxDailyOfflineTime) {
    suspiciousActivity.push(`Total offline time today (${totalOfflineTimeToday + validatedOfflineTime}ms) exceeds 24 hours`);
  }
  
  // Check for impossible offline time patterns
  if (recentOfflineProgress.length > 0) {
    const lastProgress = recentOfflineProgress[recentOfflineProgress.length - 1];
    const timeSinceLastClaim = Date.now() - lastProgress.timestamp;
    
    // If user claims offline time that's less than time since last claim, it's suspicious
    if (validatedOfflineTime < timeSinceLastClaim * 0.5) {
      suspiciousActivity.push(`Offline time (${validatedOfflineTime}ms) is much less than time since last claim (${timeSinceLastClaim}ms)`);
    }
  }
  
  // Record the offline progress
  const offlineProgress: OfflineProgress = {
    offlineTime: validatedOfflineTime,
    calculatedReward,
    energyRegen: calculateEnergyRegen(userState, validatedOfflineTime),
    timestamp: Date.now(),
    userState: {
      divinePoints: userState.divinePoints,
      pointsPerSecond: userState.pointsPerSecond,
      miningLevel: userState.miningLevel,
      currentEnergy: userState.currentEnergy,
      maxEnergy: userState.maxEnergy
    }
  };
  
  userHistory.push(offlineProgress);
  offlineProgressHistory.set(userId, userHistory);
  
  // Keep only last 50 offline progress records per user
  if (userHistory.length > 50) {
    userHistory.splice(0, userHistory.length - 50);
  }
  
  return {
    isValid: true,
    calculatedReward,
    maxAllowedTime,
    suspiciousActivity: suspiciousActivity.length > 0 ? suspiciousActivity : undefined
  };
};

// Calculate offline reward with validation
const calculateOfflineReward = (userState: any, offlineTime: number): number => {
  const basePointsPerHour = (userState.pointsPerSecond || 1) * 3600;
  const offlineHours = offlineTime / (1000 * 60 * 60);
  
  // Apply mining level multiplier
  const miningLevel = userState.miningLevel || 1;
  const levelMultiplier = 1 + (miningLevel * 0.1);
  
  // Apply offline efficiency bonus (capped at 140%)
  const offlineEfficiencyBonus = Math.min(userState.offlineEfficiencyBonus || 0, 1.4);
  const totalMultiplier = levelMultiplier * (1 + offlineEfficiencyBonus);
  
  return Math.floor(basePointsPerHour * offlineHours * totalMultiplier);
};

// Calculate maximum possible reward (for validation)
const calculateMaxPossibleReward = (userState: any, offlineTime: number): number => {
  const basePointsPerHour = (userState.pointsPerSecond || 1) * 3600;
  const offlineHours = offlineTime / (1000 * 60 * 60);
  
  // Maximum possible multipliers
  const maxLevelMultiplier = 1 + (300 * 0.1); // Max level 300
  const maxOfflineBonus = 1.4; // 140% offline bonus
  const totalMaxMultiplier = maxLevelMultiplier * (1 + maxOfflineBonus);
  
  return Math.floor(basePointsPerHour * offlineHours * totalMaxMultiplier);
};

// Calculate energy regeneration
const calculateEnergyRegen = (userState: any, offlineTime: number): number => {
  const currentEnergy = userState.currentEnergy || 1000;
  const maxEnergy = userState.maxEnergy || 1000;
  const regenRate = 0.3; // 0.3 energy per second
  const miningLevel = userState.miningLevel || 1;
  
  // Premium multiplier for high levels
  const premiumMultiplier = miningLevel > 10 ? 1.5 : 1;
  const regenPerSecond = regenRate * premiumMultiplier;
  
  const totalRegenPossible = (offlineTime / 1000) * regenPerSecond;
  const energyDeficit = Math.max(0, maxEnergy - currentEnergy);
  
  return Math.min(totalRegenPossible, energyDeficit);
};

// Server-side offline progress processing
export const validateAndProcessOfflineProgress = async (
  userId: string,
  claimedOfflineTime: number,
  userState: any
): Promise<{ success: boolean; message: string; reward?: number; energyRegen?: number }> => {
  try {
    // Validate offline progress
    const validation = await validateOfflineProgress(userId, claimedOfflineTime, userState);
    
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.reason || 'Invalid offline progress'
      };
    }
    
    // Check for suspicious activity
    if (validation.suspiciousActivity && validation.suspiciousActivity.length > 0) {
      console.warn(`Suspicious offline activity for user ${userId}:`, validation.suspiciousActivity);
      
      // Log to security system
      // await logSecurityEvent({
      //   userId,
      //   eventType: 'suspicious',
      //   details: `Suspicious offline activity: ${validation.suspiciousActivity.join(', ')}`,
      //   timestamp: Date.now()
      // });
    }
    
    // Calculate energy regeneration
    const energyRegen = calculateEnergyRegen(userState, validation.calculatedReward);
    
    // Update user state with offline rewards
    const newGameState = {
      ...userState,
      divinePoints: userState.divinePoints + validation.calculatedReward,
      currentEnergy: Math.min(userState.maxEnergy, userState.currentEnergy + energyRegen),
      unclaimedOfflineRewards: 0,
      lastOfflineTime: Date.now(),
      lastOfflineRewardTime: Date.now()
    };
    
    // Save to database
    const { error: saveError } = await supabase
      .from('user_game_data')
      .upsert({
        user_id: userId,
        game_data: newGameState,
        last_updated: new Date().toISOString()
      });
    
    if (saveError) {
      throw saveError;
    }
    
    return {
      success: true,
      message: 'Offline progress processed successfully',
      reward: validation.calculatedReward,
      energyRegen
    };
    
  } catch (error) {
    console.error('Error in validateAndProcessOfflineProgress:', error);
    return {
      success: false,
      message: 'Server error occurred while processing offline progress'
    };
  }
};

// Get offline progress history
export const getOfflineProgressHistory = (userId: string): OfflineProgress[] => {
  return offlineProgressHistory.get(userId) || [];
};

// Clean up old offline progress history
export const cleanupOfflineHistory = () => {
  const now = Date.now();
  const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
  
  for (const [userId, history] of offlineProgressHistory.entries()) {
    const recentHistory = history.filter(progress => progress.timestamp > oneWeekAgo);
    offlineProgressHistory.set(userId, recentHistory);
  }
};

// Run cleanup every 6 hours
setInterval(cleanupOfflineHistory, 6 * 60 * 60 * 1000); 