# Referral Points Calculation System

## Overview

This document outlines the exact calculation system for referral points to ensure 100% accuracy. The system prioritizes different earning sources and applies specific multipliers and bonuses.

## Point Calculation Priority System

### 🥇 Priority 1: TBC Coins (Divine Points) - MOST ACCURATE
**Source**: Mining game activities
**Calculation**: 
- Base Points = `Math.max(currentTbcCoins, totalTbcEarned)`
- Mining Bonus = `Math.floor(pointsPerSecond * 100)` (if active mining)
- **Total = Base Points + Mining Bonus**

**Example**:
- Current TBC: 5,000
- Total Earned: 4,800
- Points/Second: 2.5
- **Points = 5,000 + (2.5 * 100) = 5,250**

### 🥈 Priority 2: Staking Earnings - ACCURATE STAKING REWARDS
**Source**: TON staking activities
**Calculation**:
- Base Points = `Math.floor(totalEarned * 100)` (1 TON = 100 points)
- Active Stakes Bonus = `numberOfActiveStakes * 50`
- **Total = Base Points + Active Stakes Bonus**

**Example**:
- Total Earned: 3.5 TON
- Active Stakes: 2
- **Points = (3.5 * 100) + (2 * 50) = 350 + 100 = 450**

### 🥉 Priority 3: Active Staking Potential - FUTURE EARNINGS
**Source**: Active stakes without earnings yet
**Calculation**:
- If has earnings: `Math.floor(totalStakeEarned * 100)`
- If no earnings: `Math.floor(totalStaked * 10)` (10 points per TON staked)
- **Total = Staking Points**

**Example**:
- Total Staked: 10 TON
- No earnings yet
- **Points = 10 * 10 = 100**

### 🏅 Priority 4: SBT Tokens - TOKEN HOLDINGS
**Source**: SBT token holdings
**Calculation**:
- **Total = `Math.floor(totalSbt)`**

**Example**:
- Total SBT: 250
- **Points = 250**

### 🎯 Priority 5: Activity-Based - ENGAGEMENT REWARDS
**Source**: New users and activity metrics
**Calculation**:
- Login Streak Points = `loginStreak * 20`
- Time Bonus = `Math.min(daysSinceJoined * 30, 300)`
- **Total = `Math.min(Login Streak Points + Time Bonus, 1000)`**

**Example**:
- Login Streak: 5 days
- Days Since Joined: 10
- **Points = Math.min((5 * 20) + Math.min(10 * 30, 300), 1000) = Math.min(100 + 300, 1000) = 400**

## Minimum Guarantees

### Active User Bonus
- **Condition**: User is marked as active AND points < 100
- **Bonus**: Points are boosted to 100
- **Example**: Active user with 50 points → 100 points

### Negative Protection
- **Rule**: Points can never be negative
- **Calculation**: `Math.max(0, calculatedPoints)`

## Total Earnings Calculation

### Referral Points Sum
```typescript
const totalReferralPoints = referralUsers.reduce((sum, referral) => sum + referral.pointsEarned, 0);
```

### TON Equivalent
```typescript
const totalReferralEarnings = Math.floor(totalReferralPoints / 100);
```

### Rewards Distribution
```typescript
rewards: {
  points: totalReferralPoints,                    // All calculated points
  gems: Math.floor(totalReferralPoints / 10),     // 1 gem per 10 points
  special: []
}
```

## Validation System

### Development Validation
In development mode, the system validates all calculations:

```typescript
if (import.meta.env.DEV) {
  referralUsers.forEach(referral => {
    validateReferralPoints(referral);
  });
}
```

### Validation Criteria
- **Accuracy**: Calculated points must match actual points within ±1 point
- **Debug Info**: Full calculation breakdown for each referral
- **Source Tracking**: Clear identification of point source and bonuses

## Point Source Types

| Source | Description | Priority |
|--------|-------------|----------|
| `tbc_current` | Current TBC coins | 1 |
| `tbc_total` | Total TBC earned | 1 |
| `staking` | TON staking earnings | 2 |
| `stake_potential` | Active stakes without earnings | 3 |
| `sbt` | SBT token holdings | 4 |
| `activity` | Activity-based points | 5 |
| `new` | New user bonus | 5 |

## Example Calculations

### Scenario 1: Active Miner
```typescript
{
  tbcCoins: 15000,
  totalTbcEarned: 12000,
  miningLevel: 5,
  pointsPerSecond: 3.2,
  isActive: true
}
// Points = Math.max(15000, 12000) + (3.2 * 100) = 15000 + 320 = 15320
```

### Scenario 2: Staking User
```typescript
{
  totalEarned: 2.5,
  activeStakes: 3,
  isActive: true
}
// Points = (2.5 * 100) + (3 * 50) = 250 + 150 = 400
```

### Scenario 3: New Active User
```typescript
{
  loginStreak: 3,
  daysSinceJoined: 5,
  isActive: true
}
// Points = Math.min((3 * 20) + Math.min(5 * 30, 300), 1000) = Math.min(60 + 150, 1000) = 210
// Since user is active and points < 100, boosted to 100
```

## Accuracy Guarantees

1. **No Negative Points**: All calculations use `Math.max(0, value)`
2. **Minimum Active Bonus**: Active users get at least 100 points
3. **Precise Calculations**: All multipliers and bonuses are exact
4. **Source Transparency**: Clear tracking of where points come from
5. **Validation**: Development mode validates all calculations
6. **Rounding Protection**: Handles decimal values correctly

## Testing

### Manual Testing
```typescript
// Test specific scenarios
const testCases = [
  { tbcCoins: 1000, expected: 1000 },
  { totalEarned: 1.5, expected: 150 },
  { loginStreak: 5, expected: 100 }, // Minimum active bonus
  // ... more test cases
];
```

### Automated Validation
The system automatically validates calculations in development mode and logs any discrepancies for investigation.

## Conclusion

This calculation system ensures 100% accuracy by:
- Using precise mathematical operations
- Applying clear priority rules
- Providing comprehensive validation
- Maintaining transparency in calculations
- Protecting against edge cases

All referral points are calculated consistently and accurately across the platform. 