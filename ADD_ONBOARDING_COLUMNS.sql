-- Add onboarding-related columns to users table
-- This migration adds columns to store user onboarding form data

-- Add email column for user contact information
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add first_name and last_name columns (if not already present)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Add TBCian status and holdings columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_tbcian BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tbc_holdings VARCHAR(255);

-- Add onboarding completion tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add terms acceptance tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;

-- Add updated_at column for tracking profile updates
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for onboarding completion status
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed 
ON users(onboarding_completed);

-- Create index for TBCian status
CREATE INDEX IF NOT EXISTS idx_users_is_tbcian 
ON users(is_tbcian);

-- Add comments to document the new columns
COMMENT ON COLUMN users.email IS 'User email address for contact and notifications';
COMMENT ON COLUMN users.first_name IS 'User first name from onboarding form';
COMMENT ON COLUMN users.last_name IS 'User last name from onboarding form';
COMMENT ON COLUMN users.is_tbcian IS 'Whether user was a previous TBC holder';
COMMENT ON COLUMN users.tbc_holdings IS 'Amount of TBC previously held by user';
COMMENT ON COLUMN users.onboarding_completed IS 'Whether user has completed the onboarding process';
COMMENT ON COLUMN users.onboarding_completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN users.terms_accepted IS 'Whether user has accepted terms and conditions';
COMMENT ON COLUMN users.terms_accepted_at IS 'Timestamp when terms were accepted';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of last profile update';

-- Update existing users to mark them as having completed onboarding (if they have wallet addresses)
UPDATE users 
SET onboarding_completed = TRUE, 
    onboarding_completed_at = created_at,
    terms_accepted = TRUE,
    terms_accepted_at = created_at
WHERE wallet_address IS NOT NULL 
  AND wallet_address != '' 
  AND onboarding_completed IS NULL;

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN (
    'email', 
    'first_name', 
    'last_name', 
    'is_tbcian', 
    'tbc_holdings', 
    'onboarding_completed', 
    'onboarding_completed_at',
    'terms_accepted',
    'terms_accepted_at',
    'updated_at'
  )
ORDER BY column_name; 