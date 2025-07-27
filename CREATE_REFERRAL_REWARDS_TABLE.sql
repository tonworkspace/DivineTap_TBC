-- Create referral claimed rewards table for persistent reward tracking
-- This table stores which referral rewards each user has claimed

CREATE TABLE IF NOT EXISTS referral_claimed_rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_key VARCHAR(100) NOT NULL, -- Format: "level_requirements" (e.g., "1_1", "2_3", "3_5")
    reward_name VARCHAR(255) NOT NULL, -- Human readable reward name
    reward_level INTEGER NOT NULL, -- Referral level (1-5)
    reward_requirements INTEGER NOT NULL, -- Number of referrals required
    points_awarded INTEGER NOT NULL DEFAULT 0, -- Points given
    gems_awarded INTEGER NOT NULL DEFAULT 0, -- Gems given
    special_reward TEXT, -- Special reward description if any
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure each user can only claim each reward once
    UNIQUE(user_id, reward_key),
    
    -- Add constraints for valid data
    CONSTRAINT valid_reward_level CHECK (reward_level BETWEEN 1 AND 5),
    CONSTRAINT valid_requirements CHECK (reward_requirements > 0),
    CONSTRAINT valid_points CHECK (points_awarded >= 0),
    CONSTRAINT valid_gems CHECK (gems_awarded >= 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_claimed_rewards_user_id ON referral_claimed_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_claimed_rewards_reward_key ON referral_claimed_rewards(reward_key);
CREATE INDEX IF NOT EXISTS idx_referral_claimed_rewards_claimed_at ON referral_claimed_rewards(claimed_at);
CREATE INDEX IF NOT EXISTS idx_referral_claimed_rewards_user_reward ON referral_claimed_rewards(user_id, reward_key);

-- Add comments for documentation
COMMENT ON TABLE referral_claimed_rewards IS 'Tracks which referral rewards each user has claimed to prevent duplicate claims';
COMMENT ON COLUMN referral_claimed_rewards.reward_key IS 'Unique identifier for each reward tier (format: level_requirements)';
COMMENT ON COLUMN referral_claimed_rewards.reward_level IS 'Referral level (1-5) that this reward belongs to';
COMMENT ON COLUMN referral_claimed_rewards.reward_requirements IS 'Number of referrals required to unlock this reward';
COMMENT ON COLUMN referral_claimed_rewards.points_awarded IS 'Number of points awarded when this reward was claimed';
COMMENT ON COLUMN referral_claimed_rewards.gems_awarded IS 'Number of gems awarded when this reward was claimed';

-- Create function to check if a user can claim a specific reward
CREATE OR REPLACE FUNCTION can_claim_referral_reward(
    p_user_id INTEGER,
    p_reward_level INTEGER,
    p_reward_requirements INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_reward_key VARCHAR(100);
    v_already_claimed BOOLEAN;
    v_total_referrals INTEGER;
BEGIN
    -- Create reward key
    v_reward_key := p_reward_level || '_' || p_reward_requirements;
    
    -- Check if already claimed
    SELECT EXISTS(
        SELECT 1 FROM referral_claimed_rewards 
        WHERE user_id = p_user_id AND reward_key = v_reward_key
    ) INTO v_already_claimed;
    
    IF v_already_claimed THEN
        RETURN FALSE;
    END IF;
    
    -- Get user's total referrals
    SELECT COALESCE(direct_referrals, 0) INTO v_total_referrals
    FROM users WHERE id = p_user_id;
    
    -- Check if requirements are met
    RETURN v_total_referrals >= p_reward_requirements;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to claim a referral reward
CREATE OR REPLACE FUNCTION claim_referral_reward(
    p_user_id INTEGER,
    p_reward_level INTEGER,
    p_reward_requirements INTEGER,
    p_reward_name VARCHAR(255),
    p_points_awarded INTEGER,
    p_gems_awarded INTEGER,
    p_special_reward TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_reward_key VARCHAR(100);
    v_can_claim BOOLEAN;
BEGIN
    -- Create reward key
    v_reward_key := p_reward_level || '_' || p_reward_requirements;
    
    -- Check if can claim
    SELECT can_claim_referral_reward(p_user_id, p_reward_level, p_reward_requirements) INTO v_can_claim;
    
    IF NOT v_can_claim THEN
        RETURN FALSE;
    END IF;
    
    -- Insert the claimed reward record
    INSERT INTO referral_claimed_rewards (
        user_id,
        reward_key,
        reward_name,
        reward_level,
        reward_requirements,
        points_awarded,
        gems_awarded,
        special_reward
    ) VALUES (
        p_user_id,
        v_reward_key,
        p_reward_name,
        p_reward_level,
        p_reward_requirements,
        p_points_awarded,
        p_gems_awarded,
        p_special_reward
    );
    
    -- Update user's total earned (optional - you might want to handle this separately)
    UPDATE users 
    SET total_earned = total_earned + p_points_awarded
    WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's claimed rewards
CREATE OR REPLACE FUNCTION get_user_claimed_rewards(p_user_id INTEGER)
RETURNS TABLE (
    reward_key VARCHAR(100),
    reward_name VARCHAR(255),
    reward_level INTEGER,
    reward_requirements INTEGER,
    points_awarded INTEGER,
    gems_awarded INTEGER,
    special_reward TEXT,
    claimed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rcr.reward_key,
        rcr.reward_name,
        rcr.reward_level,
        rcr.reward_requirements,
        rcr.points_awarded,
        rcr.gems_awarded,
        rcr.special_reward,
        rcr.claimed_at
    FROM referral_claimed_rewards rcr
    WHERE rcr.user_id = p_user_id
    ORDER BY rcr.reward_level, rcr.claimed_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT ON referral_claimed_rewards TO authenticated;
GRANT EXECUTE ON FUNCTION can_claim_referral_reward(INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_referral_reward(INTEGER, INTEGER, INTEGER, VARCHAR, INTEGER, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_claimed_rewards(INTEGER) TO authenticated;

-- Insert sample data for testing (optional - remove in production)
-- INSERT INTO referral_claimed_rewards (user_id, reward_key, reward_name, reward_level, reward_requirements, points_awarded, gems_awarded) 
-- VALUES (1, '1_1', 'First Friend', 1, 1, 100, 10); 