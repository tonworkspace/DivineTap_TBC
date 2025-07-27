# Referral Reward Persistence System

## Overview

The referral reward system has been enhanced with robust persistence that ensures claimed rewards are saved both locally and in the database. This prevents duplicate claims and provides reliable data across sessions and devices.

## Features

### 🔄 Dual Persistence
- **Database Storage**: Primary storage in PostgreSQL with full audit trail
- **LocalStorage Backup**: Offline access and fallback mechanism
- **Automatic Sync**: Seamless synchronization between local and remote storage

### 🛡️ Data Integrity
- **Unique Constraints**: Prevents duplicate reward claims
- **Validation**: Ensures reward requirements are met before claiming
- **Audit Trail**: Tracks when rewards were claimed with timestamps

### 📊 Enhanced Tracking
- **Detailed Records**: Stores reward name, level, requirements, and amounts
- **Special Rewards**: Tracks special rewards like VIP access and NFTs
- **Performance Indexes**: Optimized database queries for fast retrieval

## Database Schema

### `referral_claimed_rewards` Table

```sql
CREATE TABLE referral_claimed_rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_key VARCHAR(100) NOT NULL, -- Format: "level_requirements"
    reward_name VARCHAR(255) NOT NULL, -- Human readable name
    reward_level INTEGER NOT NULL, -- Referral level (1-5)
    reward_requirements INTEGER NOT NULL, -- Referrals required
    points_awarded INTEGER NOT NULL DEFAULT 0, -- Points given
    gems_awarded INTEGER NOT NULL DEFAULT 0, -- Gems given
    special_reward TEXT, -- Special reward description
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, reward_key), -- Prevents duplicate claims
    CONSTRAINT valid_reward_level CHECK (reward_level BETWEEN 1 AND 5),
    CONSTRAINT valid_requirements CHECK (reward_requirements > 0),
    CONSTRAINT valid_points CHECK (points_awarded >= 0),
    CONSTRAINT valid_gems CHECK (gems_awarded >= 0)
);
```

## Database Functions

### `can_claim_referral_reward(user_id, level, requirements)`
Checks if a user can claim a specific reward by verifying:
- Reward hasn't been claimed before
- User meets the referral requirements

### `claim_referral_reward(user_id, level, requirements, name, points, gems, special)`
Claims a reward and:
- Inserts the claim record
- Updates user's total earnings
- Returns success/failure status

### `get_user_claimed_rewards(user_id)`
Retrieves all claimed rewards for a user with full details.

## Implementation Details

### Component Integration

The `ReferralSystem` component now includes:

```typescript
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
    // Use database function with fallback to direct query
    const { data: dbRewards, error: dbError } = await supabase
      .rpc('get_user_claimed_rewards', { p_user_id: user.id });

    if (dbRewards && dbRewards.length > 0) {
      const dbClaimedKeys = dbRewards.map((r: { reward_key: string }) => r.reward_key);
      setClaimedRewards(dbClaimedKeys);
      
      // Update localStorage for offline access
      const userId = user.id.toString();
      const claimedKey = getUserSpecificKey('referral_claimed_rewards', userId);
      safeSetToStorage(claimedKey, dbClaimedKeys);
    }
  } catch (error) {
    console.error('Error loading claimed rewards from database:', error);
  }
}, [user?.id, getUserSpecificKey, safeSetToStorage]);

// Save claimed rewards to both localStorage and database
const saveClaimedReward = useCallback(async (rewardKey: string, reward: ReferralReward) => {
  if (!user?.id) return;

  try {
    // Parse reward key
    const [levelStr, requirementsStr] = rewardKey.split('_');
    const level = parseInt(levelStr);
    const requirements = parseInt(requirementsStr);
    
    // Use database function with fallback
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

      if (insertError) throw insertError;
    }

    // Update localStorage for offline access
    const userId = user.id.toString();
    const claimedKey = getUserSpecificKey('referral_claimed_rewards', userId);
    const currentClaimed = safeGetFromStorage(claimedKey, []);
    const updatedClaimed = [...currentClaimed, rewardKey];
    safeSetToStorage(claimedKey, updatedClaimed);
    
  } catch (error) {
    console.error('Error saving claimed reward:', error);
    throw error;
  }
}, [user?.id, getUserSpecificKey, safeGetFromStorage, safeSetToStorage]);
```

### Reward Claiming Process

1. **Validation**: Check if reward can be claimed
2. **Database Save**: Save claim to database with full details
3. **Local Update**: Update localStorage for offline access
4. **State Update**: Update component state
5. **Reward Award**: Award points and gems to user

## Migration Guide

### 1. Run Database Migration

Execute the SQL migration file:

```bash
# Run the migration
psql -d your_database -f CREATE_REFERRAL_REWARDS_TABLE.sql
```

### 2. Update Existing Data (Optional)

If you have existing claimed rewards in localStorage, you can migrate them:

```typescript
// Migration function (run once)
const migrateExistingClaims = async () => {
  const userId = user?.id;
  if (!userId) return;

  const claimedKey = getUserSpecificKey('referral_claimed_rewards', userId);
  const existingClaims = safeGetFromStorage(claimedKey, []);
  
  for (const rewardKey of existingClaims) {
    const [levelStr, requirementsStr] = rewardKey.split('_');
    const level = parseInt(levelStr);
    const requirements = parseInt(requirementsStr);
    
    const reward = REFERRAL_REWARDS.find(r => 
      r.level === level && r.requirements === requirements
    );
    
    if (reward) {
      await saveClaimedReward(rewardKey, reward);
    }
  }
};
```

## Error Handling

### Fallback Mechanisms

1. **Database Function Failure**: Falls back to direct table insert
2. **Database Unavailable**: Uses localStorage only
3. **Network Issues**: Queues operations for retry

### Error Recovery

```typescript
// Example error recovery
try {
  await saveClaimedReward(rewardKey, reward);
} catch (error) {
  console.error('Failed to save reward:', error);
  
  // Store in offline queue for retry
  addToOfflineQueue({
    type: 'referral_reward_claim',
    data: { rewardKey, reward },
    userId: user.id
  });
  
  // Show user-friendly message
  setRewardMessage('Reward claimed! Will sync when connection is restored.');
}
```

## Performance Optimizations

### Database Indexes

```sql
CREATE INDEX idx_referral_claimed_rewards_user_id ON referral_claimed_rewards(user_id);
CREATE INDEX idx_referral_claimed_rewards_reward_key ON referral_claimed_rewards(reward_key);
CREATE INDEX idx_referral_claimed_rewards_claimed_at ON referral_claimed_rewards(claimed_at);
CREATE INDEX idx_referral_claimed_rewards_user_reward ON referral_claimed_rewards(user_id, reward_key);
```

### Caching Strategy

- **LocalStorage**: Immediate access for UI updates
- **Database**: Source of truth for persistence
- **Memory State**: React state for component rendering

## Testing

### Unit Tests

```typescript
// Test reward claiming
describe('Referral Reward Persistence', () => {
  it('should save claimed reward to database', async () => {
    const reward = REFERRAL_REWARDS[0];
    const rewardKey = `${reward.level}_${reward.requirements}`;
    
    await saveClaimedReward(rewardKey, reward);
    
    const { data } = await supabase
      .from('referral_claimed_rewards')
      .select('*')
      .eq('user_id', user.id)
      .eq('reward_key', rewardKey)
      .single();
    
    expect(data).toBeTruthy();
    expect(data.reward_name).toBe(reward.name);
  });
});
```

### Integration Tests

```typescript
// Test full reward flow
describe('Reward Claiming Flow', () => {
  it('should handle complete reward claiming process', async () => {
    // Setup user with enough referrals
    await setupUserWithReferrals(user.id, 5);
    
    // Claim reward
    await claimReward(REFERRAL_REWARDS[2]); // Level 3, 5 referrals
    
    // Verify database record
    const { data } = await supabase
      .rpc('get_user_claimed_rewards', { p_user_id: user.id });
    
    expect(data).toHaveLength(1);
    expect(data[0].reward_level).toBe(3);
    
    // Verify localStorage
    const localClaims = safeGetFromStorage(
      getUserSpecificKey('referral_claimed_rewards', user.id.toString()), 
      []
    );
    expect(localClaims).toContain('3_5');
  });
});
```

## Monitoring and Analytics

### Key Metrics

- **Claim Success Rate**: Percentage of successful claims
- **Database Sync Time**: Time to sync with database
- **Error Rates**: Failed saves and recoveries
- **User Engagement**: Reward claiming frequency

### Logging

```typescript
// Enhanced logging for monitoring
console.log('🎯 Attempting to claim reward:', {
  reward: reward.name,
  rewardKey,
  totalReferrals: referralData.totalReferrals,
  requirements: reward.requirements,
  alreadyClaimed: claimedRewards.includes(rewardKey),
  userId: user.id,
  timestamp: new Date().toISOString()
});
```

## Security Considerations

### Data Validation

- **Input Sanitization**: Validate reward parameters
- **User Authorization**: Ensure user can only claim their own rewards
- **Rate Limiting**: Prevent rapid successive claims

### Privacy

- **Minimal Data**: Store only necessary information
- **Data Retention**: Consider cleanup policies for old records
- **Access Control**: Restrict database access to authenticated users

## Future Enhancements

### Planned Features

1. **Batch Operations**: Claim multiple rewards at once
2. **Reward History**: Detailed claim history with timestamps
3. **Analytics Dashboard**: Visual representation of reward patterns
4. **Mobile Sync**: Enhanced offline/online synchronization
5. **Reward Expiration**: Time-limited rewards

### Scalability

- **Database Partitioning**: Partition by user_id for large datasets
- **Caching Layer**: Redis cache for frequently accessed data
- **Async Processing**: Background job processing for heavy operations

## Troubleshooting

### Common Issues

1. **Duplicate Claims**: Check unique constraints and validation
2. **Sync Failures**: Verify network connectivity and database access
3. **Performance Issues**: Monitor database indexes and query performance
4. **Data Inconsistency**: Compare localStorage vs database state

### Debug Commands

```sql
-- Check user's claimed rewards
SELECT * FROM referral_claimed_rewards WHERE user_id = 123;

-- Verify reward constraints
SELECT * FROM referral_claimed_rewards 
WHERE reward_level NOT BETWEEN 1 AND 5;

-- Check for duplicates
SELECT user_id, reward_key, COUNT(*) 
FROM referral_claimed_rewards 
GROUP BY user_id, reward_key 
HAVING COUNT(*) > 1;
```

## Conclusion

The enhanced referral reward persistence system provides:

- ✅ **Reliable Data Storage**: Database + localStorage dual persistence
- ✅ **Data Integrity**: Unique constraints and validation
- ✅ **Performance**: Optimized queries and caching
- ✅ **Error Recovery**: Robust fallback mechanisms
- ✅ **Scalability**: Designed for growth and monitoring
- ✅ **Security**: Proper validation and access control

This system ensures that users' reward claims are never lost and provides a solid foundation for future enhancements. 