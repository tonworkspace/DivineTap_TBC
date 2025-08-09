// DailyRewards Component Validation Utility
// This utility helps ensure the DailyRewards component works perfectly

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ComponentState {
  user: any;
  userStakes: any[];
  userBalance: number;
  totalEarnings: number;
  availableToClaim: number;
  miningSynergy: any;
  stealthSaveState: any;
}

export class DailyRewardsValidator {
  private static instance: DailyRewardsValidator;
  
  static getInstance(): DailyRewardsValidator {
    if (!DailyRewardsValidator.instance) {
      DailyRewardsValidator.instance = new DailyRewardsValidator();
    }
    return DailyRewardsValidator.instance;
  }

  // Validate component state
  validateComponentState(state: ComponentState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate user object
    if (!state.user) {
      errors.push('User object is missing');
    } else {
      if (!state.user.id) {
        errors.push('User ID is missing');
      }
      if (!state.user.telegram_id) {
        warnings.push('Telegram ID is missing - may affect data isolation');
      }
    }

    // Validate user balance
    if (typeof state.userBalance !== 'number') {
      errors.push('User balance must be a number');
    } else {
      if (state.userBalance < 0) {
        errors.push('User balance cannot be negative');
      }
      if (state.userBalance > 999999999) {
        warnings.push('User balance is extremely high - may indicate data corruption');
      }
    }

    // Validate total earnings
    if (typeof state.totalEarnings !== 'number') {
      errors.push('Total earnings must be a number');
    } else {
      if (state.totalEarnings < 0) {
        errors.push('Total earnings cannot be negative');
      }
    }

    // Validate available to claim
    if (typeof state.availableToClaim !== 'number') {
      errors.push('Available to claim must be a number');
    } else {
      if (state.availableToClaim < 0) {
        errors.push('Available to claim cannot be negative');
      }
      if (state.availableToClaim > state.userBalance * 10) {
        warnings.push('Available to claim seems unusually high compared to balance');
      }
    }

    // Validate user stakes
    if (!Array.isArray(state.userStakes)) {
      errors.push('User stakes must be an array');
    } else {
      state.userStakes.forEach((stake, index) => {
        if (!stake.id) {
          errors.push(`Stake ${index} is missing ID`);
        }
        if (typeof stake.amount !== 'number' || stake.amount <= 0) {
          errors.push(`Stake ${index} has invalid amount`);
        }
        if (typeof stake.daily_rate !== 'number' || stake.daily_rate <= 0) {
          errors.push(`Stake ${index} has invalid daily rate`);
        }
        if (typeof stake.total_earned !== 'number' || stake.total_earned < 0) {
          errors.push(`Stake ${index} has invalid total earned`);
        }
      });
    }

    // Validate mining synergy
    if (!state.miningSynergy) {
      warnings.push('Mining synergy object is missing');
    } else {
      if (typeof state.miningSynergy.synergyLevel !== 'number') {
        errors.push('Mining synergy level must be a number');
      }
      if (state.miningSynergy.synergyLevel < 0 || state.miningSynergy.synergyLevel > 10) {
        errors.push('Mining synergy level must be between 0 and 10');
      }
    }

    // Validate stealth save state
    if (!state.stealthSaveState) {
      warnings.push('Stealth save state is missing');
    } else {
      if (typeof state.stealthSaveState.isOnline !== 'boolean') {
        errors.push('Stealth save online status must be a boolean');
      }
      if (!Array.isArray(state.stealthSaveState.pendingOperations)) {
        errors.push('Pending operations must be an array');
      }
    }

    // Generate suggestions
    if (state.userStakes.length === 0) {
      suggestions.push('Consider creating your first stake to start earning');
    }
    if (state.availableToClaim > 0) {
      suggestions.push('You have rewards available to claim');
    }
    if (state.userBalance > 0) {
      suggestions.push('You have balance available for staking');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Validate localStorage data
  validateLocalStorage(userId?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Check user data
      const userDataKey = `divine_mining_user_data_${userId || 'anonymous'}`;
      const userData = localStorage.getItem(userDataKey);
      
      if (userData) {
        const parsed = JSON.parse(userData);
        if (typeof parsed.balance !== 'number') {
          errors.push('Local storage user balance is not a number');
        }
        if (parsed.balance < 0) {
          errors.push('Local storage user balance is negative');
        }
      }

      // Check stakes data
      const stakesKey = `divine_mining_stakes_${userId || 'anonymous'}`;
      const stakesData = localStorage.getItem(stakesKey);
      
      if (stakesData) {
        const parsed = JSON.parse(stakesData);
        if (!Array.isArray(parsed)) {
          errors.push('Local storage stakes data is not an array');
        } else {
          parsed.forEach((stake: any, index: number) => {
            if (!stake.id) {
              errors.push(`Local storage stake ${index} is missing ID`);
            }
            if (typeof stake.amount !== 'number' || stake.amount <= 0) {
              errors.push(`Local storage stake ${index} has invalid amount`);
            }
          });
        }
      }

      // Check synergy data
      const synergyKey = `divine_mining_synergy_${userId || 'anonymous'}`;
      const synergyData = localStorage.getItem(synergyKey);
      
      if (synergyData) {
        const parsed = JSON.parse(synergyData);
        if (typeof parsed.synergyLevel !== 'number') {
          errors.push('Local storage synergy level is not a number');
        }
      }

    } catch (error) {
      errors.push(`Local storage validation failed: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Validate database connectivity
  async validateDatabaseConnection(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Test basic connectivity
      const { supabase } = await import('../lib/supabaseClient');
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        errors.push(`Database connection failed: ${error.message}`);
      } else {
        suggestions.push('Database connection is working');
      }

      // Test stakes table
      const { error: stakesError } = await supabase
        .from('stakes')
        .select('id')
        .limit(1);

      if (stakesError) {
        warnings.push(`Stakes table access issue: ${stakesError.message}`);
      }

      // Test deposits table
      const { error: depositsError } = await supabase
        .from('deposits')
        .select('id')
        .limit(1);

      if (depositsError) {
        warnings.push(`Deposits table access issue: ${depositsError.message}`);
      }

    } catch (error) {
      errors.push(`Database validation failed: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Validate TON wallet integration
  validateTONWallet(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Check if TON Connect is available
      if (typeof window !== 'undefined' && (window as any).tonConnectUI) {
        suggestions.push('TON Connect UI is available');
      } else {
        warnings.push('TON Connect UI is not available');
      }

      // Check network configuration
      const isMainnet = false; // This should match your component
      const networkName = isMainnet ? 'Mainnet' : 'Testnet';
      suggestions.push(`Using ${networkName} network`);

    } catch (error) {
      errors.push(`TON wallet validation failed: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Comprehensive validation
  async runFullValidation(state: ComponentState, userId?: string): Promise<ValidationResult> {
    const results = await Promise.all([
      this.validateComponentState(state),
      this.validateLocalStorage(userId),
      this.validateDatabaseConnection(),
      this.validateTONWallet()
    ]);

    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings);
    const allSuggestions = results.flatMap(r => r.suggestions);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      suggestions: allSuggestions
    };
  }

  // Performance validation
  validatePerformance(renderTime: number, dataUpdateTime: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (renderTime > 100) {
      warnings.push(`Component render time is slow: ${renderTime}ms`);
      suggestions.push('Consider optimizing component rendering');
    }

    if (dataUpdateTime > 500) {
      warnings.push(`Data update time is slow: ${dataUpdateTime}ms`);
      suggestions.push('Consider optimizing data operations');
    }

    if (renderTime < 16) {
      suggestions.push('Component performance is excellent');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }
}

// Export singleton instance
export const dailyRewardsValidator = DailyRewardsValidator.getInstance();

// Utility functions for debugging
export const debugDailyRewards = {
  logState: (state: ComponentState) => {
    console.group('🔍 DailyRewards State Debug');
    console.log('User:', state.user);
    console.log('Balance:', state.userBalance);
    console.log('Earnings:', state.totalEarnings);
    console.log('Available to Claim:', state.availableToClaim);
    console.log('Stakes Count:', state.userStakes.length);
    console.log('Synergy Level:', state.miningSynergy?.synergyLevel);
    console.log('Online Status:', state.stealthSaveState?.isOnline);
    console.groupEnd();
  },

  validateAndLog: async (state: ComponentState, userId?: string) => {
    const result = await dailyRewardsValidator.runFullValidation(state, userId);
    
    console.group('🔍 DailyRewards Validation Results');
    
    if (result.errors.length > 0) {
      console.error('❌ Errors:', result.errors);
    }
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Warnings:', result.warnings);
    }
    
    if (result.suggestions.length > 0) {
      console.info('💡 Suggestions:', result.suggestions);
    }
    
    if (result.isValid) {
      console.log('✅ All validations passed');
    }
    
    console.groupEnd();
    
    return result;
  }
}; 