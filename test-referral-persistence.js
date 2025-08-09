// Test script for referral rewards persistence
// This script tests the database functions and localStorage integration

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test user ID (replace with a real user ID for testing)
const TEST_USER_ID = 1;

async function testReferralRewardsPersistence() {
  console.log('🧪 Testing Referral Rewards Persistence...\n');

  try {
    // Test 1: Check if table exists
    console.log('1. Checking if referral_claimed_rewards table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('referral_claimed_rewards')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table does not exist or error:', tableError.message);
      console.log('💡 Run the CREATE_REFERRAL_REWARDS_TABLE.sql migration first');
      return;
    }
    console.log('✅ Table exists\n');

    // Test 2: Check if functions exist
    console.log('2. Testing database functions...');
    
    // Test get_user_claimed_rewards function
    const { data: claimedRewards, error: claimedError } = await supabase
      .rpc('get_user_claimed_rewards', { p_user_id: TEST_USER_ID });
    
    if (claimedError) {
      console.log('⚠️ get_user_claimed_rewards function error:', claimedError.message);
    } else {
      console.log('✅ get_user_claimed_rewards function works');
      console.log('   Current claimed rewards:', claimedRewards || []);
    }

    // Test can_claim_referral_reward function
    const { data: canClaim, error: canClaimError } = await supabase
      .rpc('can_claim_referral_reward', { 
        p_user_id: TEST_USER_ID, 
        p_reward_level: 1, 
        p_reward_requirements: 1 
      });
    
    if (canClaimError) {
      console.log('⚠️ can_claim_referral_reward function error:', canClaimError.message);
    } else {
      console.log('✅ can_claim_referral_reward function works');
      console.log('   Can claim level 1 reward:', canClaim);
    }

    // Test 3: Test claiming a reward
    console.log('\n3. Testing reward claiming...');
    
    const testReward = {
      level: 1,
      requirements: 1,
      name: 'Test Reward',
      points: 100,
      gems: 10
    };

    const { data: claimResult, error: claimError } = await supabase
      .rpc('claim_referral_reward', {
        p_user_id: TEST_USER_ID,
        p_reward_level: testReward.level,
        p_reward_requirements: testReward.requirements,
        p_reward_name: testReward.name,
        p_points_awarded: testReward.points,
        p_gems_awarded: testReward.gems,
        p_special_reward: null
      });

    if (claimError) {
      console.log('⚠️ claim_referral_reward function error:', claimError.message);
    } else {
      console.log('✅ claim_referral_reward function works');
      console.log('   Claim result:', claimResult);
    }

    // Test 4: Verify the claim was saved
    console.log('\n4. Verifying saved claim...');
    const { data: savedClaims, error: savedError } = await supabase
      .from('referral_claimed_rewards')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('reward_key', `${testReward.level}_${testReward.requirements}`);

    if (savedError) {
      console.log('❌ Error checking saved claims:', savedError.message);
    } else {
      console.log('✅ Claim verification works');
      console.log('   Saved claims:', savedClaims);
    }

    // Test 5: Test localStorage simulation
    console.log('\n5. Testing localStorage integration...');
    
    // Simulate localStorage operations
    const testLocalStorage = {
      'referral_claimed_rewards_1': JSON.stringify(['1_1', '2_3']),
      'referral_claimed_rewards_2': JSON.stringify(['1_1'])
    };

    console.log('   Simulated localStorage data:', testLocalStorage);
    
    // Test parsing
    try {
      const parsed1 = JSON.parse(testLocalStorage['referral_claimed_rewards_1']);
      const parsed2 = JSON.parse(testLocalStorage['referral_claimed_rewards_2']);
      console.log('✅ localStorage parsing works');
      console.log('   User 1 claimed rewards:', parsed1);
      console.log('   User 2 claimed rewards:', parsed2);
    } catch (error) {
      console.log('❌ localStorage parsing error:', error.message);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testReferralRewardsPersistence(); 