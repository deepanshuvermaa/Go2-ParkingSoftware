@echo off
echo Building Go2 Parking APK...
echo.

echo Step 1: Installing dependencies...
call npm install

echo.
echo Step 2: Login to EAS (Create free account at https://expo.dev)
call eas login

echo.
echo Step 3: Configuring build...
call eas build:configure

echo.
echo Step 4: Building APK...
echo This will take 15-20 minutes and provide a download link
call eas build --platform android --profile preview

echo.
echo Build complete! Check the link above to download your APK.
pause