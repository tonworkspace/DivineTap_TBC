// import { supabase } from './supabaseClient';

// // Security Configuration
// const SECURITY_CONFIG = {
//   MAX_POINTS_PER_SECOND: 1000,
//   MAX_OFFLINE_TIME: 14 * 24 * 60 * 60 * 1000, // 14 days
//   MAX_UPGRADES_PER_SAVE: 5,
//   SAVE_COOLDOWN: 5000, // 5 seconds
//   MAX_POINT_GAIN_MULTIPLIER: 100,
//   MAX_LEVEL_PROGRESSION: 5,
//   SUSPICIOUS_ACTIVITY_THRESHOLD: 3,
//   BAN_THRESHOLD: 5,
//   RATE_LIMIT_WINDOW: 60000, // 1 minute
//   MAX_SAVES_PER_MINUTE: 12,
// } as const;

// // User activity tracking
// const userActivity = new Map<string, {
//   lastSaveTime: number;
//   saveCount: number;
//   suspiciousFlags: string[];
//   banCount: number;
//   lastActivity: number;
// }>();

// // Rate limiting cache
// const rateLimitCache = new Map<string, {
//   saves: number[];
//   lastReset: number;
// }>();

// export interface GameStateValidation {
//   isValid: boolean;
//   warnings: string[];
//   errors: string[];
//   suspiciousActivity: string[];
//   shouldBan: boolean;
//   correctedState?: any;
// }

// export interface SecurityEvent {
//   userId: string;
//   eventType: 'suspicious' | 'cheat_detected' | 'rate_limit' | 'ban';
//   details: string;
//   timestamp: number;
//   gameState?: any;
// }

// // Security event logging
// const securityEvents: SecurityEvent[] = [];

// export const logSecurityEvent = (event: SecurityEvent) => {
//   securityEvents.push(event);
//   console.warn(`🚨 SECURITY EVENT: ${event.eventType} - ${event.details}`);
  
//   // Keep only last 1000 events
//   if (securityEvents.length > 1000) {
//     securityEvents.splice(0, securityEvents.length - 1000);
//   }
// };

// // Rate limiting
// export const checkRateLimit = (userId: string): { allowed: boolean; remaining: number; resetTime: number } => {
//   const now = Date.now();
//   const userKey = `rate_limit_${userId}`;
  
//   if (!rateLimitCache.has(userKey)) {
//     rateLimitCache.set(userKey, {
//       saves: [],
//       lastReset: now
//     });
//   }
  
//   const userRateLimit = rateLimitCache.get(userKey)!;
  
//   // Reset counter if window has passed
//   if (now - userRateLimit.lastReset > SECURITY_CONFIG.RATE_LIMIT_WINDOW) {
//     userRateLimit.saves = [];
//     userRateLimit.lastReset = now;
//   }
  
//   // Remove old saves outside the window
//   userRateLimit.saves = userRateLimit.saves.filter(
//     saveTime => now - saveTime < SECURITY_CONFIG.RATE_LIMIT_WINDOW
//   );
  
//   const remaining = SECURITY_CONFIG.MAX_SAVES_PER_MINUTE - userRateLimit.saves.length;
//   const allowed = remaining > 0;
  
//   if (allowed) {
//     userRateLimit.saves.push(now);
//   }
  
//   return {
//     allowed,
//     remaining: Math.max(0, remaining),
//     resetTime: userRateLimit.lastReset + SECURITY_CONFIG.RATE_LIMIT_WINDOW
//   };
// };

// // Validate game state integrity
// export const validateGameState = async (
//   userId: string,
//   currentState: any,
//   previousState?: any
// ): Promise<GameStateValidation> => {
//   const warnings: string[] = [];
//   const errors: string[] = [];
//   const suspiciousActivity: string[] = [];
  
//   // Initialize user activity tracking
//   if (!userActivity.has(userId)) {
//     userActivity.set(userId, {
//       lastSaveTime: 0,
//       saveCount: 0,
//       suspiciousFlags: [],
//       banCount: 0,
//       lastActivity: Date.now()
//     });
//   }
  
//   const user = userActivity.get(userId)!;
//   user.lastActivity = Date.now();
  
//   // Basic data type validation
//   if (typeof currentState.divinePoints !== 'number' || isNaN(currentState.divinePoints)) {
//     errors.push('Invalid divinePoints data type');
//   }
  
//   if (typeof currentState.pointsPerSecond !== 'number' || isNaN(currentState.pointsPerSecond)) {
//     errors.push('Invalid pointsPerSecond data type');
//   }
  
//   if (typeof currentState.miningLevel !== 'number' || isNaN(currentState.miningLevel)) {
//     errors.push('Invalid miningLevel data type');
//   }
  
//   // Range validation
//   if (currentState.divinePoints < 0) {
//     errors.push('Divine points cannot be negative');
//   }
  
//   if (currentState.pointsPerSecond < 0 || currentState.pointsPerSecond > SECURITY_CONFIG.MAX_POINTS_PER_SECOND) {
//     errors.push(`Points per second out of valid range (0-${SECURITY_CONFIG.MAX_POINTS_PER_SECOND})`);
//   }
  
//   if (currentState.miningLevel < 1 || currentState.miningLevel > 300) {
//     errors.push('Mining level out of valid range (1-300)');
//   }
  
//   // Previous state comparison (if available)
//   if (previousState) {
//     // Check for impossible progress
//     const pointGain = currentState.divinePoints - previousState.divinePoints;
//     const timeDiff = Date.now() - previousState.lastSaveTime;
//     const maxPossibleGain = previousState.pointsPerSecond * (timeDiff / 1000) * SECURITY_CONFIG.MAX_POINT_GAIN_MULTIPLIER;
    
//     if (pointGain > maxPossibleGain) {
//       suspiciousActivity.push(`Impossible point gain: ${pointGain} in ${timeDiff}ms (max: ${maxPossibleGain})`);
//     }
    
//     // Check for impossible level progression
//     const levelGain = currentState.miningLevel - previousState.miningLevel;
//     if (levelGain > SECURITY_CONFIG.MAX_LEVEL_PROGRESSION) {
//       suspiciousActivity.push(`Impossible level progression: ${levelGain} levels`);
//     }
    
//     // Check for impossible upgrade purchases
//     const upgradeGain = currentState.upgradesPurchased - previousState.upgradesPurchased;
//     if (upgradeGain > SECURITY_CONFIG.MAX_UPGRADES_PER_SAVE) {
//       suspiciousActivity.push(`Too many upgrades purchased: ${upgradeGain}`);
//     }
//   }
  
//   // Validate offline progress
//   if (currentState.unclaimedOfflineRewards > 0) {
//     const offlineTime = currentState.lastOfflineTime ? Date.now() - currentState.lastOfflineTime : 0;
//     if (offlineTime > SECURITY_CONFIG.MAX_OFFLINE_TIME) {
//       errors.push('Offline time exceeds maximum allowed');
//     }
    
//     // Validate offline reward calculation
//     const maxOfflineReward = calculateMaxOfflineReward(previousState, offlineTime);
//     if (currentState.unclaimedOfflineRewards > maxOfflineReward) {
//       suspiciousActivity.push(`Suspicious offline rewards: ${currentState.unclaimedOfflineRewards} (max: ${maxOfflineReward})`);
//     }
//   }
  
//   // Check for save cooldown violation
//   const timeSinceLastSave = Date.now() - user.lastSaveTime;
//   if (timeSinceLastSave < SECURITY_CONFIG.SAVE_COOLDOWN) {
//     warnings.push(`Save too frequent: ${timeSinceLastSave}ms since last save`);
//   }
  
//   // Update user activity
//   user.lastSaveTime = Date.now();
//   user.saveCount++;
//   user.suspiciousFlags.push(...suspiciousActivity);
  
//   // Check if user should be banned
//   const shouldBan = user.suspiciousFlags.length >= SECURITY_CONFIG.BAN_THRESHOLD;
  
//   if (shouldBan) {
//     user.banCount++;
//     logSecurityEvent({
//       userId,
//       eventType: 'ban',
//       details: `User banned due to ${user.suspiciousFlags.length} suspicious activities`,
//       timestamp: Date.now(),
//       gameState: currentState
//     });
//   }
  
//   // Log suspicious activity
//   if (suspiciousActivity.length > 0) {
//     logSecurityEvent({
//       userId,
//       eventType: 'suspicious',
//       details: `Suspicious activity detected: ${suspiciousActivity.join(', ')}`,
//       timestamp: Date.now(),
//       gameState: currentState
//     });
//   }
  
//   return {
//     isValid: errors.length === 0,
//     warnings,
//     errors,
//     suspiciousActivity,
//     shouldBan,
//     correctedState: errors.length > 0 ? sanitizeGameState(currentState) : undefined
//   };
// };

// // Calculate maximum possible offline reward
// const calculateMaxOfflineReward = (previousState: any, offlineTime: number): number => {
//   if (!previousState) return 0;
  
//   const basePointsPerHour = previousState.pointsPerSecond * 3600;
//   const maxMultiplier = 1 + (previousState.miningLevel * 0.1);
//   const maxOfflineHours = Math.min(offlineTime / (1000 * 60 * 60), SECURITY_CONFIG.MAX_OFFLINE_TIME / (1000 * 60 * 60));
  
//   return Math.floor(basePointsPerHour * maxOfflineHours * maxMultiplier);
// };

// // Sanitize game state to safe values
// const sanitizeGameState = (state: any): any => {
//   return {
//     ...state,
//     divinePoints: Math.max(0, Math.min(state.divinePoints || 0, 999999999)),
//     pointsPerSecond: Math.max(0, Math.min(state.pointsPerSecond || 0, SECURITY_CONFIG.MAX_POINTS_PER_SECOND)),
//     miningLevel: Math.max(1, Math.min(state.miningLevel || 1, 300)),
//     upgradesPurchased: Math.max(0, Math.min(state.upgradesPurchased || 0, 1000)),
//     unclaimedOfflineRewards: Math.max(0, Math.min(state.unclaimedOfflineRewards || 0, 999999999)),
//     currentEnergy: Math.max(0, Math.min(state.currentEnergy || 0, state.maxEnergy || 1000)),
//     maxEnergy: Math.max(100, Math.min(state.maxEnergy || 100, 10000))
//   };
// };

// // Server-side save validation
// export const validateAndSaveGameState = async (
//   userId: string,
//   gameState: any,
//   userTelegramId?: string
// ): Promise<{ success: boolean; message: string; correctedState?: any }> => {
//   try {
//     // Check rate limiting
//     const rateLimit = checkRateLimit(userId);
//     if (!rateLimit.allowed) {
//       logSecurityEvent({
//         userId,
//         eventType: 'rate_limit',
//         details: `Rate limit exceeded. Remaining: ${rateLimit.remaining}`,
//         timestamp: Date.now()
//       });
      
//       return {
//         success: false,
//         message: `Rate limit exceeded. Please wait ${Math.ceil((rateLimit.resetTime - Date.now()) / 1000)} seconds.`
//       };
//     }
    
//     // Get previous state from database
//     const { data: previousState } = await supabase
//       .from('user_game_data')
//       .select('game_data')
//       .eq('user_id', userId)
//       .single();
    
//     // Validate current state
//     const validation = await validateGameState(
//       userId,
//       gameState,
//       previousState?.game_data
//     );
    
//     if (!validation.isValid) {
//       logSecurityEvent({
//         userId,
//         eventType: 'cheat_detected',
//         details: `Invalid game state: ${validation.errors.join(', ')}`,
//         timestamp: Date.now(),
//         gameState
//       });
      
//       return {
//         success: false,
//         message: `Invalid game state: ${validation.errors.join(', ')}`,
//         correctedState: validation.correctedState
//       };
//     }
    
//     if (validation.shouldBan) {
//       return {
//         success: false,
//         message: 'Account suspended due to suspicious activity.'
//       };
//     }
    
//     // Save validated state to database
//     const { error } = await supabase
//       .from('user_game_data')
//       .upsert({
//         user_id: userId,
//         game_data: validation.correctedState || gameState,
//         last_updated: new Date().toISOString(),
//         security_validation: {
//           timestamp: Date.now(),
//           warnings: validation.warnings,
//           suspiciousActivity: validation.suspiciousActivity
//         }
//       });
    
//     if (error) {
//       throw error;
//     }
    
//     return {
//       success: true,
//       message: 'Game state saved successfully.'
//     };
    
//   } catch (error) {
//     console.error('Error in validateAndSaveGameState:', error);
//     return {
//       success: false,
//       message: 'Server error occurred while saving game state.'
//     };
//   }
// };

// // Get security statistics
// export const getSecurityStats = () => {
//   const totalUsers = userActivity.size;
//   const bannedUsers = Array.from(userActivity.values()).filter(user => user.banCount > 0).length;
//   const suspiciousEvents = securityEvents.filter(event => event.eventType === 'suspicious').length;
//   const cheatEvents = securityEvents.filter(event => event.eventType === 'cheat_detected').length;
  
//   return {
//     totalUsers,
//     bannedUsers,
//     suspiciousEvents,
//     cheatEvents,
//     totalSecurityEvents: securityEvents.length,
//     recentEvents: securityEvents.slice(-10)
//   };
// };

// // Clean up old activity data
// export const cleanupOldActivity = () => {
//   const now = Date.now();
//   const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
//   // Clean up old user activity
//   for (const [userId, activity] of userActivity.entries()) {
//     if (activity.lastActivity < oneDayAgo) {
//       userActivity.delete(userId);
//     }
//   }
  
//   // Clean up old rate limit data
//   for (const [key, rateLimit] of rateLimitCache.entries()) {
//     if (now - rateLimit.lastReset > SECURITY_CONFIG.RATE_LIMIT_WINDOW * 2) {
//       rateLimitCache.delete(key);
//     }
//   }
  
//   // Clean up old security events (keep last 24 hours)
//   const recentEvents = securityEvents.filter(event => event.timestamp > oneDayAgo);
//   securityEvents.splice(0, securityEvents.length - recentEvents.length);
// };

// // Run cleanup every hour
// setInterval(cleanupOldActivity, 60 * 60 * 1000); 