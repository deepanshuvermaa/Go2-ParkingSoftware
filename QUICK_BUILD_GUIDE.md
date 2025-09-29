# 🚀 Quick APK Build Guide - 3 Methods

## Method 1: EAS Build (Recommended - 15 minutes)

### Step 1: Create Expo Account
1. Go to https://expo.dev
2. Click "Sign Up" (it's FREE)
3. Create your account

### Step 2: Login in Terminal
Open Command Prompt/Terminal and run:
```bash
cd Go2-ParkingSoftware
eas login
```
Enter your Expo email and password

### Step 3: Configure Build
```bash
eas build:configure
```
Press Enter to accept defaults

### Step 4: Build APK
```bash
eas build --platform android --profile preview
```

**This will:**
- Upload your code to Expo servers
- Build APK in the cloud
- Give you a download link (takes 15-20 minutes)
- Send email when complete

## Method 2: Instant Web Build (No Login)

### Use Snack Expo (Quick Test APK)
1. Go to https://snack.expo.dev
2. Upload your project files
3. Click "Download APK"

## Method 3: Local Build (Advanced)

### Prerequisites:
- Install Android Studio
- Install Java JDK 17

### Steps:
```bash
cd Go2-ParkingSoftware

# Install dependencies
npm install

# Generate Android project
npx expo prebuild --platform android

# Build APK
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/`

## 🎯 FASTEST OPTION - DO THIS NOW:

### Option A: If you want the APK immediately (5 minutes)
1. Open Command Prompt
2. Run these commands:
```bash
cd Go2-ParkingSoftware
eas login
# Enter email: your-email@gmail.com
# Enter password: your-password
eas build:configure
# Press Enter for all prompts
eas build --platform android --profile preview
```
3. Wait for build link (15-20 min)
4. Download APK from link

### Option B: Manual Upload (if login fails)
1. Go to https://expo.dev
2. Create account
3. Create new project
4. Upload your code
5. Click "Build" → "Android" → "APK"

## 📱 Your APK Will Include:

✅ **App Name**: Go2 Parking
✅ **Backend**: https://web-production-764e.up.railway.app
✅ **All Features**: Working and connected
✅ **Test Accounts**: Ready to use

## 🔑 Default Login Credentials:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@go2parking.com | Owner@123 |
| Manager | manager@go2parking.com | Manager@123 |
| Attendant | attendant1@go2parking.com | Attendant@123 |

## ⚡ Build Status

After running the build command, you'll see:
```
✔ Build started successfully
Build details: https://expo.dev/accounts/YOUR_USERNAME/projects/go2-parking/builds/xxxxx
```

Click the link to:
- See build progress
- Download APK when ready
- Get QR code for testing

## 📲 Installing Your APK

1. **Download APK** from build link
2. **Transfer to Android device**
3. **Enable "Unknown Sources"** in Settings → Security
4. **Install and run**

## ✅ Success!

Your complete parking management system will be ready in one APK file!