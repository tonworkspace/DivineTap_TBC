import { supabase } from './supabaseClient';

export interface UpgradeValidation {
  canPurchase: boolean;
  cost: number;
  reason?: string;
  suspiciousActivity?: string[];
}

export interface UpgradePurchase {
  upgradeId: string;
  currentLevel: number;
  newLevel: number;
  cost: number;
  userPoints: number;
  timestamp: number;
}

// Track upgrade purchases for anti-cheat
const upgradePurchaseHistory = new Map<string, UpgradePurchase[]>();

// Upgrade cost validation
export const validateUpgradePurchase = async (
  userId: string,
  upgradeId: string,
  currentLevel: number,
  userPoints: number,
  upgrades: any[]
): Promise<UpgradeValidation> => {
  const suspiciousActivity: string[] = [];
  
  // Find the upgrade
  const upgrade = upgrades.find(u => u.id === upgradeId);
  if (!upgrade) {
    return {
      canPurchase: false,
      cost: 0,
      reason: 'Upgrade not found'
    };
  }
  
  // Validate current level
  if (currentLevel < 0 || currentLevel > upgrade.maxLevel) {
    suspiciousActivity.push(`Invalid current level: ${currentLevel} for upgrade ${upgradeId}`);
  }
  
  // Calculate expected cost
  const expectedCost = calculateUpgradeCost(upgrade, currentLevel);
  
  // Check if user has enough points
  if (userPoints < expectedCost) {
    return {
      canPurchase: false,
      cost: expectedCost,
      reason: `Insufficient points. Required: ${expectedCost}, Available: ${userPoints}`
    };
  }
  
  // Check for impossible level progression
  if (currentLevel >= upgrade.maxLevel) {
    return {
      canPurchase: false,
      cost: expectedCost,
      reason: 'Upgrade already at maximum level'
    };
  }
  
  // Validate upgrade requirements
  if (upgrade.requires) {
    const requiredUpgrade = upgrades.find(u => u.id === upgrade.requires.upgrade);
    if (!requiredUpgrade) {
      suspiciousActivity.push(`Required upgrade not found: ${upgrade.requires.upgrade}`);
    } else if (requiredUpgrade.level < upgrade.requires.level) {
      return {
        canPurchase: false,
        cost: expectedCost,
        reason: `Requires ${upgrade.requires.upgrade} level ${upgrade.requires.level}`
      };
    }
  }
  
  // Check purchase history for suspicious activity
  const userHistory = upgradePurchaseHistory.get(userId) || [];
  const recentPurchases = userHistory.filter(
    purchase => Date.now() - purchase.timestamp < 60000 // Last minute
  );
  
  if (recentPurchases.length > 10) {
    suspiciousActivity.push(`Too many upgrades purchased recently: ${recentPurchases.length}`);
  }
  
  // Check for duplicate purchases
  const duplicatePurchase = recentPurchases.find(
    purchase => purchase.upgradeId === upgradeId && purchase.currentLevel === currentLevel
  );
  
  if (duplicatePurchase) {
    suspiciousActivity.push(`Duplicate upgrade purchase detected: ${upgradeId} level ${currentLevel}`);
  }
  
  // Record the purchase
  const purchase: UpgradePurchase = {
    upgradeId,
    currentLevel,
    newLevel: currentLevel + 1,
    cost: expectedCost,
    userPoints,
    timestamp: Date.now()
  };
  
  userHistory.push(purchase);
  upgradePurchaseHistory.set(userId, userHistory);
  
  // Keep only last 100 purchases per user
  if (userHistory.length > 100) {
    userHistory.splice(0, userHistory.length - 100);
  }
  
  return {
    canPurchase: true,
    cost: expectedCost,
    suspiciousActivity: suspiciousActivity.length > 0 ? suspiciousActivity : undefined
  };
};

// Calculate upgrade cost with validation
const calculateUpgradeCost = (upgrade: any, currentLevel: number): number => {
  if (currentLevel < 0 || currentLevel >= upgrade.maxLevel) {
    return Infinity;
  }
  
  const baseCost = upgrade.baseCost || 25;
  const costMultiplier = upgrade.costMultiplier || 1.12;
  
  // Validate cost multiplier
  if (costMultiplier < 1.01 || costMultiplier > 2.0) {
    console.warn(`Suspicious cost multiplier for upgrade ${upgrade.id}: ${costMultiplier}`);
  }
  
  return Math.floor(baseCost * Math.pow(costMultiplier, currentLevel));
};

// Server-side upgrade purchase validation
export const validateAndProcessUpgrade = async (
  userId: string,
  upgradeId: string,
  currentGameState: any,
  upgrades: any[]
): Promise<{ success: boolean; message: string; newGameState?: any }> => {
  try {
    // Get current user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, balance')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Find the upgrade
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) {
      return {
        success: false,
        message: 'Upgrade not found'
      };
    }
    
    // Validate the purchase
    const validation = await validateUpgradePurchase(
      userId,
      upgradeId,
      upgrade.level,
      currentGameState.divinePoints,
      upgrades
    );
    
    if (!validation.canPurchase) {
      return {
        success: false,
        message: validation.reason || 'Cannot purchase upgrade'
      };
    }
    
    // Check for suspicious activity
    if (validation.suspiciousActivity && validation.suspiciousActivity.length > 0) {
      console.warn(`Suspicious upgrade activity for user ${userId}:`, validation.suspiciousActivity);
      
      // Log to security system
      // await logSecurityEvent({
      //   userId,
      //   eventType: 'suspicious',
      //   details: `Suspicious upgrade activity: ${validation.suspiciousActivity.join(', ')}`,
      //   timestamp: Date.now()
      // });
    }
    
    // Process the purchase
    const newGameState = {
      ...currentGameState,
      divinePoints: currentGameState.divinePoints - validation.cost,
      upgradesPurchased: currentGameState.upgradesPurchased + 1
    };
    
    // Update upgrade level
    const updatedUpgrades = upgrades.map(u => 
      u.id === upgradeId 
        ? { ...u, level: u.level + 1 }
        : u
    );
    
    // Save to database
    const { error: saveError } = await supabase
      .from('user_game_data')
      .upsert({
        user_id: userId,
        game_data: {
          ...newGameState,
          upgrades: updatedUpgrades
        },
        last_updated: new Date().toISOString()
      });
    
    if (saveError) {
      throw saveError;
    }
    
    return {
      success: true,
      message: 'Upgrade purchased successfully',
      newGameState: {
        ...newGameState,
        upgrades: updatedUpgrades
      }
    };
    
  } catch (error) {
    console.error('Error in validateAndProcessUpgrade:', error);
    return {
      success: false,
      message: 'Server error occurred while processing upgrade'
    };
  }
};

// Get upgrade purchase history
export const getUpgradePurchaseHistory = (userId: string): UpgradePurchase[] => {
  return upgradePurchaseHistory.get(userId) || [];
};

// Clean up old purchase history
export const cleanupUpgradeHistory = () => {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  for (const [userId, history] of upgradePurchaseHistory.entries()) {
    const recentHistory = history.filter(purchase => purchase.timestamp > oneHourAgo);
    upgradePurchaseHistory.set(userId, recentHistory);
  }
};

// Run cleanup every 30 minutes
setInterval(cleanupUpgradeHistory, 30 * 60 * 1000); 