// Create a new file for API functions
import { supabase } from './supabaseClient';

export const getTONPrice = async (): Promise<number> => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd'
    );
    const data = await response.json();
    return data['the-open-network'].usd;
  } catch (error) {
    console.error('Error fetching TON price:', error);
    return 2.5; // Fallback price if API fails
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

// Submit onboarding form data
export const submitOnboardingForm = async (
  userId: number, 
  formData: OnboardingFormData
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Submitting onboarding data for user:', userId, formData);

    // Update user profile with onboarding data
    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        wallet_address: formData.tonWalletAddress,
        is_tbcian: formData.isTBCian,
        tbc_holdings: formData.tbcHoldings || null,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        terms_accepted: formData.agreedToTerms,
        terms_accepted_at: formData.agreedToTerms ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return { success: false, error: 'Failed to update profile' };
    }

    // Log onboarding completion
    console.log('Onboarding completed successfully for user:', userId);
    
    return { success: true };
  } catch (error) {
    console.error('Error submitting onboarding form:', error);
    return { success: false, error: 'Internal server error' };
  }
};

// Check if user has completed onboarding
export const checkOnboardingStatus = async (userId: number): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }

    return data?.onboarding_completed || false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}; 