# TBC Mining Revolution - Onboarding System

## Overview

The TBC Mining Revolution app now features a professional wizard-based onboarding system that collects essential user information and ensures compliance with terms and conditions. This system provides a smooth, step-by-step experience for new users to set up their mining profiles.

## Features

### 🎯 **Multi-Step Wizard Interface**
- **6-Step Process**: Welcome → Personal Info → Contact → Wallet → TBC Status → Terms
- **Progress Tracking**: Visual progress bar and step indicators
- **Validation**: Real-time form validation with helpful error messages
- **Navigation**: Previous/Next buttons with proper state management

### 📝 **Data Collection**
- **Personal Information**: First name and last name
- **Contact Details**: Email address for notifications and updates
- **Wallet Integration**: TON wallet address (auto-filled if connected)
- **TBC Community Status**: Whether user was a previous TBC holder
- **TBC Holdings**: Amount of TBC previously held (if applicable)
- **Terms Agreement**: Legal compliance and user consent

### 🔒 **Security & Compliance**
- **Terms of Service**: Comprehensive terms with user agreement
- **Data Validation**: Email format validation and required field checks
- **Database Storage**: Secure storage of user profile data
- **Audit Trail**: Timestamps for onboarding completion and terms acceptance

### 🎨 **User Experience**
- **Professional Design**: Cyberpunk theme with blue accents
- **Responsive Layout**: Works seamlessly on mobile devices
- **Loading States**: Smooth transitions and loading animations
- **Error Handling**: Graceful error handling with user feedback
- **Skip Option**: Users can skip onboarding if needed

## Technical Implementation

### Database Schema

The onboarding system adds the following columns to the `users` table:

```sql
-- Personal Information
email VARCHAR(255)
first_name VARCHAR(100)
last_name VARCHAR(100)

-- TBC Community Status
is_tbcian BOOLEAN DEFAULT FALSE
tbc_holdings VARCHAR(255)

-- Onboarding Tracking
onboarding_completed BOOLEAN DEFAULT FALSE
onboarding_completed_at TIMESTAMP WITH TIME ZONE

-- Terms Compliance
terms_accepted BOOLEAN DEFAULT FALSE
terms_accepted_at TIMESTAMP WITH TIME ZONE

-- Audit Trail
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### API Functions

#### `submitOnboardingForm(userId, formData)`
- **Purpose**: Submit user onboarding data to database
- **Parameters**: 
  - `userId`: User ID from authentication
  - `formData`: OnboardingFormData object
- **Returns**: `{ success: boolean, error?: string }`

#### `checkOnboardingStatus(userId)`
- **Purpose**: Check if user has completed onboarding
- **Parameters**: `userId`: User ID from authentication
- **Returns**: `boolean`

### Component Structure

```typescript
interface OnboardingFormData {
  firstName: string;
  lastName: string;
  email: string;
  tonWalletAddress: string;
  isTBCian: boolean;
  tbcHoldings: string;
  agreedToTerms: boolean;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  emoji: string;
}
```

## User Flow

### 1. **Welcome Screen**
- App introduction and setup overview
- User motivation and benefits explanation

### 2. **Personal Information**
- First name and last name collection
- Real-time validation for required fields

### 3. **Contact Details**
- Email address collection
- Email format validation
- Purpose explanation for transparency

### 4. **Wallet Connection**
- TON wallet address input
- Auto-fill if wallet is connected
- Connection status indicator

### 5. **TBC Community Status**
- Yes/No selection for previous TBC holder status
- Conditional TBC holdings input
- Community benefits explanation

### 6. **Terms & Conditions**
- Comprehensive terms display
- Scrollable terms content
- Checkbox for agreement
- Legal compliance tracking

## Validation Rules

### Required Fields
- **First Name**: Non-empty string
- **Last Name**: Non-empty string
- **Email**: Valid email format
- **TON Wallet**: Non-empty string
- **Terms Agreement**: Must be checked

### Optional Fields
- **TBC Holdings**: Only required if user is TBCian

## Error Handling

### Network Errors
- Graceful fallback to localStorage
- User-friendly error messages
- Retry functionality

### Validation Errors
- Real-time field validation
- Clear error indicators
- Helpful error messages

### Database Errors
- Comprehensive error logging
- User notification
- Fallback mechanisms

## Security Considerations

### Data Protection
- Secure database storage
- Input sanitization
- SQL injection prevention

### Privacy Compliance
- Terms of service agreement
- Data usage transparency
- User consent tracking

### Audit Trail
- Timestamp tracking
- User action logging
- Compliance verification

## Integration Points

### Authentication System
- Integrates with existing `useAuth` hook
- User ID validation
- Session management

### Wallet Integration
- TON Connect integration
- Auto-wallet detection
- Address validation

### Database Integration
- Supabase client integration
- Real-time updates
- Data consistency

## Customization Options

### Styling
- Theme customization
- Color scheme modification
- Responsive design adjustments

### Content
- Step descriptions
- Terms of service
- Validation messages

### Functionality
- Additional form fields
- Custom validation rules
- Extended data collection

## Migration Guide

### Database Migration
1. Run the `ADD_ONBOARDING_COLUMNS.sql` migration
2. Verify column creation
3. Update existing users if needed

### Code Integration
1. Import the new OnboardingScreen component
2. Update IndexPage to use the new component
3. Test the complete user flow

### Testing Checklist
- [ ] New user onboarding flow
- [ ] Existing user bypass
- [ ] Form validation
- [ ] Database storage
- [ ] Error handling
- [ ] Mobile responsiveness

## Future Enhancements

### Planned Features
- **Multi-language Support**: Internationalization
- **Advanced Validation**: More sophisticated validation rules
- **Profile Completion**: Percentage-based completion tracking
- **Social Login**: Additional authentication methods
- **Onboarding Analytics**: User behavior tracking

### Potential Improvements
- **Progressive Web App**: Offline capability
- **Voice Input**: Accessibility features
- **Biometric Authentication**: Enhanced security
- **AI-Powered Validation**: Smart form validation

## Support & Maintenance

### Monitoring
- User completion rates
- Error tracking
- Performance metrics

### Updates
- Regular security updates
- Feature enhancements
- Bug fixes

### Documentation
- API documentation
- User guides
- Developer resources

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintainer**: TBC Development Team 