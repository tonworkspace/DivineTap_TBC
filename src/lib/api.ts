// Create a new file for API functions
import { supabase } from './supabaseClient';

// Cache for TON price to reduce API calls
let tonPriceCache: { price: number; timestamp: number } | null = null;
const TON_PRICE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getTONPrice = async (): Promise<number> => {
  try {
    // Check cache first
    if (tonPriceCache && Date.now() - tonPriceCache.timestamp < TON_PRICE_CACHE_DURATION) {
      return tonPriceCache.price;
    }

    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd'
    );
    const data = await response.json();
    const price = data['the-open-network'].usd;
    
    // Update cache
    tonPriceCache = { price, timestamp: Date.now() };
    
    return price;
  } catch (error) {
    console.error('Error fetching TON price:', error);
    // Return cached price if available, otherwise fallback
    return tonPriceCache?.price || 2.5;
  }
};

// Onboarding form submission interface
export interface OnboardingFormData {
  firstName: string;
  lastName: string;
  email: string;
  tonWalletAddress: string;
  isTBCian: boolean;
  tbcHoldings: string;
  agreedToTerms: boolean;
}

// Cache for onboarding status to reduce database calls
const onboardingStatusCache = new Map<number, { completed: boolean; timestamp: number }>();
const ONBOARDING_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Submit onboarding form data - optimized with better error handling
export const submitOnboardingForm = async (
  userId: number, 
  formData: OnboardingFormData
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Submitting onboarding data for user:', userId, formData);

    // Validate required fields
    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      return { success: false, error: 'First name and last name are required' };
    }

    if (!formData.email?.trim()) {
      return { success: false, error: 'Email address is required' };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    if (!formData.tonWalletAddress?.trim()) {
      return { success: false, error: 'TON wallet address is required' };
    }

    if (!formData.agreedToTerms) {
      return { success: false, error: 'You must agree to the terms and conditions' };
    }

    // Update user profile with onboarding data
    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        wallet_address: formData.tonWalletAddress.trim(),
        is_tbcian: formData.isTBCian,
        tbc_holdings: formData.tbcHoldings?.trim() || null,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        terms_accepted: formData.agreedToTerms,
        terms_accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return { success: false, error: 'Failed to update profile. Please try again.' };
    }

    // Update cache
    onboardingStatusCache.set(userId, { 
      completed: true, 
      timestamp: Date.now() 
    });

    // Log onboarding completion
    console.log('Onboarding completed successfully for user:', userId);
    
    return { success: true };
  } catch (error) {
    console.error('Error submitting onboarding form:', error);
    return { success: false, error: 'Network error. Please check your connection and try again.' };
  }
};

// Check if user has completed onboarding - optimized with caching
export const checkOnboardingStatus = async (userId: number): Promise<boolean> => {
  try {
    // Check cache first
    const cached = onboardingStatusCache.get(userId);
    if (cached && Date.now() - cached.timestamp < ONBOARDING_CACHE_DURATION) {
      return cached.completed;
    }

    const { data, error } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }

    const completed = data?.onboarding_completed || false;
    
    // Update cache
    onboardingStatusCache.set(userId, { 
      completed, 
      timestamp: Date.now() 
    });

    return completed;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

// Clear onboarding cache for a specific user (useful after updates)
export const clearOnboardingCache = (userId: number): void => {
  onboardingStatusCache.delete(userId);
};

// Clear all onboarding cache (useful for testing or maintenance)
export const clearAllOnboardingCache = (): void => {
  onboardingStatusCache.clear();
};

// Reset onboarding status in database (for development testing)
export const resetOnboardingStatus = async (userId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔄 Resetting onboarding status for user:', userId);
    
    // Update database to mark onboarding as not completed
    const { error: updateError } = await supabase
      .from('users')
      .update({
        onboarding_completed: false,
        onboarding_completed_at: null,
        terms_accepted: false,
        terms_accepted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error resetting onboarding status:', updateError);
      return { success: false, error: 'Failed to reset onboarding status in database.' };
    }

    // Clear cache for this user
    clearOnboardingCache(userId);
    
    console.log('✅ Onboarding status reset successfully for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
    return { success: false, error: 'Network error while resetting onboarding status.' };
  }
}; 