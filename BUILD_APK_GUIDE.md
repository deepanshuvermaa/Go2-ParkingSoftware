# 📱 Building Production APK for Go2 Parking App

## Prerequisites

### 1. Install Required Tools

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Install Expo CLI globally (if not already)
npm install -g expo-cli
```

### 2. Install Dependencies

```bash
cd Go2-ParkingSoftware
npm install
```

## Option 1: Build APK Using EAS Build (Recommended - Cloud Build)

### Step 1: Create Expo Account
1. Go to https://expo.dev
2. Create a free account
3. Login in terminal:
```bash
eas login
```

### Step 2: Configure Project
```bash
# Configure EAS for your project
eas build:configure
```

### Step 3: Build APK
```bash
# Build APK for Android
eas build --platform android --profile production
```

This will:
- Upload your code to Expo servers
- Build the APK in the cloud
- Provide a download link when complete (takes 15-20 minutes)

## Option 2: Build APK Locally (Requires Android Studio)

### Step 1: Prebuild Android Project
```bash
# Generate native Android project
npx expo prebuild --platform android
```

### Step 2: Configure Production URL
Edit `android/app/src/main/res/values/strings.xml`:
```xml
<string name="API_BASE_URL">https://web-production-764e.up.railway.app</string>
```

### Step 3: Build APK Using Gradle
```bash
cd android

# For Windows
./gradlew assembleRelease

# For Mac/Linux
./gradlew assembleRelease
```

The APK will be generated at:
`android/app/build/outputs/apk/release/app-release.apk`

## Option 3: Quick Development Build (For Testing)

### Step 1: Start Metro Bundler
```bash
npx expo start
```

### Step 2: Build Development APK
```bash
# In a new terminal
npx expo run:android
```

## 🔐 Creating a Signed Production APK

### Step 1: Generate Keystore (One-time)
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore go2parking.keystore -alias go2parking -keyalg RSA -keysize 2048 -validity 10000
```

Save the keystore file and passwords securely!

### Step 2: Configure Signing
Create `android/app/signing.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=go2parking.keystore
MYAPP_RELEASE_KEY_ALIAS=go2parking
MYAPP_RELEASE_STORE_PASSWORD=your_store_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

### Step 3: Update Gradle Config
Edit `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## 📦 Final APK Details

### App Information
- **App Name**: Go2 Parking
- **Package Name**: com.go2.parkingsoftware
- **Version**: 1.0.0
- **Backend URL**: https://web-production-764e.up.railway.app

### Features Included
✅ User Authentication (Owner, Manager, Attendant)
✅ Ticket Management
✅ Bluetooth Printer Support
✅ Offline Mode with Sync
✅ Reports and Analytics
✅ Multiple Location Support
✅ Pricing Configuration

### Default Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Owner | owner@go2parking.com | Owner@123 |
| Manager | manager@go2parking.com | Manager@123 |
| Attendant | attendant1@go2parking.com | Attendant@123 |

## 🚀 Quick Build Commands

### Fastest Option (EAS Cloud Build):
```bash
# One-time setup
npm install -g eas-cli
eas login
eas build:configure

# Build APK
eas build --platform android --profile production
```

### Local Build (if Android Studio installed):
```bash
# Prebuild and compile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

## 📲 Installing the APK

### On Device:
1. Transfer APK to device
2. Enable "Install from Unknown Sources" in Settings
3. Open APK file to install

### Using ADB:
```bash
adb install app-release.apk
```

## ⚠️ Important Notes

1. **Backend URL**: The app is configured to use `https://web-production-764e.up.railway.app`
2. **Permissions**: The app will request Bluetooth and Location permissions
3. **Minimum Android**: Android 5.0 (API 21) or higher
4. **First Launch**: On first launch, the app will sync with the backend

## 🎉 Success!

After building and installing the APK:
1. Open the app
2. Login with test credentials
3. Create and manage parking tickets
4. Print receipts via Bluetooth
5. View reports and analytics

Your Go2 Parking app is now ready for production use!