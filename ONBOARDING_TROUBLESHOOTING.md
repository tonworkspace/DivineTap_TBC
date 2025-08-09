# 🔧 Onboarding Form Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Complete Setup" Button is Disabled**

**Symptoms:**
- The "Complete Setup" button appears grayed out
- Button shows "Submitting..." but never completes
- No error message appears

**Solutions:**

#### **Step 1: Check Required Fields**
Make sure you've filled out ALL required fields:

✅ **Personal Information (Step 1):**
- First Name: Enter your first name
- Last Name: Enter your last name

✅ **Contact Details (Step 2):**
- Email: Enter a valid email address (e.g., `yourname@email.com`)

✅ **Wallet Connection (Step 3):**
- TON Wallet Address: Connect your TON wallet or enter address manually

✅ **Terms Agreement (Step 5):**
- Check the "I agree to the terms and conditions" checkbox

#### **Step 2: Check Email Format**
Your email must be in a valid format:
- ✅ `user@example.com`
- ✅ `your.name@company.org`
- ❌ `invalid-email`
- ❌ `user@`
- ❌ `@domain.com`

#### **Step 3: Check Wallet Address**
- Make sure your TON wallet is connected
- Or manually enter a valid TON wallet address
- Address should start with `EQ` or `UQ`

### **Issue 2: Form Submits But Shows Error**

**Symptoms:**
- Button works but shows error message
- "Submission Failed" notification appears
- "Network Error" message

**Solutions:**

#### **Step 1: Check Internet Connection**
- Ensure you have a stable internet connection
- Try refreshing the page
- Check if other websites load properly

#### **Step 2: Try Again**
- Wait a few seconds and try submitting again
- Sometimes network issues are temporary

#### **Step 3: Clear Browser Cache**
1. Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
2. Or clear browser cache manually:
   - Chrome: Settings → Privacy → Clear browsing data
   - Firefox: Options → Privacy → Clear Data
   - Safari: Preferences → Privacy → Manage Website Data

### **Issue 3: Form Disappears After Submission**

**Symptoms:**
- Form submits successfully
- Onboarding screen disappears
- But you're not sure if it saved

**Solutions:**

#### **Step 1: Check for Success Notifications**
- Look for green success notifications
- Check if you see "Profile Setup Complete" message

#### **Step 2: Verify Completion**
- The onboarding screen should disappear permanently
- You should see the main mining interface
- If it reappears, there was an issue

#### **Step 3: Check Your Profile**
- Look for your name/email in the app
- Check if wallet connection is working

### **Issue 4: Can't Connect TON Wallet**

**Symptoms:**
- Wallet connection button doesn't work
- "Connect Wallet" button is disabled
- Wallet address field is empty

**Solutions:**

#### **Step 1: Install TON Wallet**
- Download a TON wallet (Tonkeeper, TonHub, etc.)
- Create or import your wallet
- Make sure you have some TON coins

#### **Step 2: Connect Wallet**
- Click "Connect Wallet" button
- Approve the connection in your wallet
- Make sure you're on the correct network (Mainnet/Testnet)

#### **Step 3: Manual Entry**
- If auto-connection fails, manually enter your wallet address
- Copy the address from your wallet app
- Paste it in the wallet address field

### **Issue 5: Form Won't Load**

**Symptoms:**
- Onboarding screen shows loading forever
- "Setting up your mining profile..." message stays
- Screen is blank or frozen

**Solutions:**

#### **Step 1: Refresh the Page**
- Press `F5` or `Ctrl + R`
- Wait for the page to fully load
- Try again

#### **Step 2: Check Browser**
- Try a different browser (Chrome, Firefox, Safari)
- Make sure JavaScript is enabled
- Disable browser extensions temporarily

#### **Step 3: Clear Data**
- Clear browser cache and cookies
- Try incognito/private mode
- Restart your browser

## 🔍 **Debug Mode (For Developers)**

If you're a developer or have access to developer tools:

### **Step 1: Open Developer Tools**
- Press `F12` or right-click → "Inspect"
- Go to "Console" tab
- Look for error messages (red text)

### **Step 2: Check Network Tab**
- Go to "Network" tab in DevTools
- Try submitting the form
- Look for failed requests (red entries)

### **Step 3: Check Form Data**
- In Console, type: `localStorage.getItem('onboarding_completed_123')`
- Replace `123` with your user ID
- Check if onboarding is marked as completed

## 📱 **Mobile-Specific Issues**

### **Issue: Form Doesn't Work on Mobile**

**Solutions:**
- Make sure you're using the latest version of your browser
- Try using the Telegram app's built-in browser
- Check if you have enough storage space
- Ensure your device has a stable internet connection

### **Issue: Keyboard Covers Form Fields**

**Solutions:**
- Rotate your device to landscape mode
- Scroll down to see all fields
- Use the "Next" button to navigate between fields

## 🆘 **Still Having Issues?**

If none of the above solutions work:

### **Step 1: Contact Support**
- Send a screenshot of the error
- Include your browser and device information
- Describe exactly what happens when you try to submit

### **Step 2: Try Alternative Methods**
- Use a different device
- Try a different network (mobile data vs WiFi)
- Use a different browser

### **Step 3: Check System Status**
- Check if the service is experiencing issues
- Look for maintenance announcements
- Try again later

## ✅ **Quick Checklist**

Before submitting, make sure:

- [ ] First name is entered
- [ ] Last name is entered
- [ ] Email is valid format
- [ ] TON wallet is connected or address entered
- [ ] Terms checkbox is checked
- [ ] Internet connection is stable
- [ ] Browser is up to date
- [ ] No browser extensions are interfering

## 🎯 **Success Indicators**

You'll know the form submitted successfully when:

- ✅ Green success notification appears
- ✅ "Profile Setup Complete" message shows
- ✅ Onboarding screen disappears permanently
- ✅ You see the main mining interface
- ✅ Your name/email appears in the app
- ✅ Wallet connection is active

If you see these indicators, your onboarding was successful! 🎉 