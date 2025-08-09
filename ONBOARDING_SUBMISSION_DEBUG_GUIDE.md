# 🔍 Onboarding Submission Debug Guide

## 🚨 **Common Issues Preventing Form Submission**

### **1. Validation Failures**

#### **Step 1: Personal Information (First/Last Name)**
```typescript
// Current validation
const personalValid = formData.firstName.trim() !== '' && formData.lastName.trim() !== '';
```

**Common Issues:**
- ❌ **Empty fields**: User didn't enter first or last name
- ❌ **Whitespace only**: User entered only spaces
- ❌ **Special characters**: Some special characters might cause issues

**Debug Steps:**
1. Check browser console for validation logs
2. Verify form data in React DevTools
3. Test with simple names (no special characters)

#### **Step 2: Email Validation**
```typescript
// Current validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailValid = emailRegex.test(formData.email);
```

**Common Issues:**
- ❌ **Invalid email format**: Missing @ or domain
- ❌ **Empty email field**: User didn't enter email
- ❌ **Whitespace**: Email contains leading/trailing spaces

**Debug Steps:**
1. Test with valid email: `test@example.com`
2. Check for hidden characters or spaces
3. Verify email regex is working

#### **Step 3: Wallet Address**
```typescript
// Current validation
const walletValid = formData.tonWalletAddress.trim() !== '';
```

**Common Issues:**
- ❌ **Empty wallet address**: User didn't enter address
- ❌ **Invalid TON format**: Wrong wallet address format
- ❌ **Auto-fill issues**: Wallet connection not working

**Debug Steps:**
1. Check if TON wallet is connected
2. Verify wallet address format
3. Test with valid TON address

#### **Step 4: Terms Agreement**
```typescript
// Current validation
const termsValid = formData.agreedToTerms;
```

**Common Issues:**
- ❌ **Checkbox not checked**: User didn't agree to terms
- ❌ **State not updated**: Checkbox state not properly managed

**Debug Steps:**
1. Verify checkbox is checked
2. Check form state in React DevTools
3. Test checkbox functionality

### **2. Database Issues**

#### **Missing Database Columns**
The onboarding form tries to update these columns:
- `first_name`
- `last_name`
- `email`
- `wallet_address`
- `is_tbcian`
- `tbc_holdings`
- `onboarding_completed`
- `onboarding_completed_at`
- `terms_accepted`
- `terms_accepted_at`

**Check if columns exist:**
```sql
-- Run this query to check column existence
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
  'first_name', 'last_name', 'email', 'wallet_address',
  'is_tbcian', 'tbc_holdings', 'onboarding_completed',
  'onboarding_completed_at', 'terms_accepted', 'terms_accepted_at'
);
```

#### **Database Permissions**
Ensure the user has UPDATE permissions on the users table:
```sql
-- Check user permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'users';
```

### **3. Network/API Issues**

#### **Supabase Connection**
```typescript
// Check if Supabase is connected
const { data, error } = await supabase
  .from('users')
  .select('id')
  .limit(1);

if (error) {
  console.error('Supabase connection error:', error);
}
```

#### **API Rate Limiting**
- Check if user is hitting rate limits
- Verify API key is valid
- Check network connectivity

### **4. User Authentication Issues**

#### **User Object Missing**
```typescript
// Check if user object exists
if (!user) {
  console.error('No user object found');
  return;
}

// Check if user has valid ID
if (!user.id) {
  console.error('User ID is missing');
  return;
}
```

## 🔧 **Debugging Tools & Solutions**

### **1. Enhanced Debug Logging**

Add this to the onboarding component:
```typescript
// Enhanced debug logging
const debugFormState = () => {
  console.log('🔍 Form Debug Info:', {
    currentStep,
    formData,
    validationResult: validateCurrentStep(),
    user: user ? { id: user.id, telegram_id: user.telegram_id } : null,
    isSubmitting,
    shouldShow
  });
};

// Call this before submission
debugFormState();
```

### **2. Step-by-Step Validation Debug**

```typescript
const debugValidation = () => {
  console.log('🔍 Validation Debug:');
  
  // Step 1: Personal Info
  console.log('Step 1 - Personal:', {
    firstName: formData.firstName,
    lastName: formData.lastName,
    firstNameValid: formData.firstName.trim() !== '',
    lastNameValid: formData.lastName.trim() !== '',
    stepValid: formData.firstName.trim() !== '' && formData.lastName.trim() !== ''
  });
  
  // Step 2: Email
  console.log('Step 2 - Email:', {
    email: formData.email,
    emailValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
  });
  
  // Step 3: Wallet
  console.log('Step 3 - Wallet:', {
    wallet: formData.tonWalletAddress,
    walletValid: formData.tonWalletAddress.trim() !== ''
  });
  
  // Step 4: Terms
  console.log('Step 4 - Terms:', {
    agreedToTerms: formData.agreedToTerms
  });
};
```

### **3. Database Connection Test**

```typescript
const testDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, telegram_id')
      .eq('id', user?.id)
      .single();
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
    
    console.log('✅ Database connection successful:', data);
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
};
```

### **4. Form Data Validation**

```typescript
const validateFormData = (data: OnboardingFormData) => {
  const errors: string[] = [];
  
  if (!data.firstName?.trim()) errors.push('First name is required');
  if (!data.lastName?.trim()) errors.push('Last name is required');
  if (!data.email?.trim()) errors.push('Email is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Invalid email format');
  if (!data.tonWalletAddress?.trim()) errors.push('Wallet address is required');
  if (!data.agreedToTerms) errors.push('Terms must be agreed to');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

## 🛠️ **Quick Fixes**

### **Fix 1: Add Better Error Handling**

```typescript
const handleSubmit = useCallback(async () => {
  console.log('🚀 Submit attempt started');
  
  // Debug form state
  debugFormState();
  
  // Validate form data
  const validation = validateFormData(formData);
  if (!validation.isValid) {
    console.error('❌ Form validation failed:', validation.errors);
    showSystemNotification(
      '⚠️ Form Validation Error',
      validation.errors.join(', '),
      'error'
    );
    return;
  }
  
  // Check user
  if (!user?.id) {
    console.error('❌ No valid user found');
    showSystemNotification(
      '❌ Authentication Error',
      'User not authenticated. Please refresh the page.',
      'error'
    );
    return;
  }
  
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    showSystemNotification(
      '❌ Database Error',
      'Unable to connect to database. Please try again.',
      'error'
    );
    return;
  }
  
  setIsSubmitting(true);
  try {
    const result = await submitOnboardingForm(user.id, formData);
    // ... rest of submission logic
  } catch (error) {
    console.error('❌ Submission error:', error);
    showSystemNotification(
      '❌ Submission Failed',
      'An unexpected error occurred. Please try again.',
      'error'
    );
  } finally {
    setIsSubmitting(false);
  }
}, [formData, user, showSystemNotification]);
```

### **Fix 2: Add Form Reset Function**

```typescript
const resetForm = () => {
  setFormData({
    firstName: '',
    lastName: '',
    email: '',
    tonWalletAddress: userFriendlyAddress || '',
    isTBCian: false,
    tbcHoldings: '',
    agreedToTerms: false
  });
  setCurrentStep(0);
  setIsSubmitting(false);
};
```

### **Fix 3: Add Retry Mechanism**

```typescript
const submitWithRetry = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Submission attempt ${attempt}/${maxRetries}`);
      const result = await submitOnboardingForm(user.id, formData);
      
      if (result.success) {
        console.log('✅ Submission successful on attempt', attempt);
        return result;
      } else {
        console.error(`❌ Submission failed on attempt ${attempt}:`, result.error);
        if (attempt === maxRetries) {
          throw new Error(result.error);
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    } catch (error) {
      console.error(`❌ Error on attempt ${attempt}:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

## 📋 **Troubleshooting Checklist**

### **For Users Who Can't Submit:**

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for error messages
   - Check network tab for failed requests

2. **Verify Form Data**
   - Ensure all required fields are filled
   - Check for valid email format
   - Verify wallet address is entered
   - Make sure terms checkbox is checked

3. **Test Database Connection**
   - Run database connection test
   - Check if user exists in database
   - Verify required columns exist

4. **Check Network**
   - Ensure stable internet connection
   - Check if Supabase is accessible
   - Verify API keys are valid

5. **Clear Cache**
   - Clear browser cache and cookies
   - Try incognito/private mode
   - Refresh the page

### **For Developers:**

1. **Run Database Migration**
   ```sql
   -- Execute the onboarding columns migration
   \i ADD_ONBOARDING_COLUMNS.sql
   ```

2. **Check Supabase Configuration**
   - Verify environment variables
   - Check API key permissions
   - Test database connection

3. **Monitor Logs**
   - Check Supabase logs
   - Monitor application logs
   - Look for error patterns

4. **Test with Different Users**
   - Test with new users
   - Test with existing users
   - Test with different browsers

## 🎯 **Common Solutions**

### **Solution 1: Database Migration Issue**
If the onboarding columns don't exist:
```sql
-- Run this migration
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_tbcian BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tbc_holdings VARCHAR(255),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;
```

### **Solution 2: User Authentication Issue**
If user object is missing:
```typescript
// Add user validation
useEffect(() => {
  if (!user?.id) {
    console.error('No valid user found');
    // Redirect to login or show error
  }
}, [user]);
```

### **Solution 3: Form State Issue**
If form data is not updating:
```typescript
// Add form state debugging
useEffect(() => {
  console.log('Form data changed:', formData);
}, [formData]);
```

This comprehensive debugging guide should help identify and resolve most onboarding submission issues! 