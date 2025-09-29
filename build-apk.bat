@echo off
echo ========================================
echo Go2 Parking APK Build (Quickbill Method)
echo ========================================
echo.

:: Set JAVA_HOME to Android Studio's Java
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%

echo Setting Java path from Android Studio...
echo JAVA_HOME: %JAVA_HOME%
echo.

:: Navigate to android directory
cd /d "%~dp0android"

echo Cleaning previous builds...
call gradlew.bat clean

echo.
echo Building Release APK...
echo This may take 5-10 minutes...
echo.

:: Build the release APK
call gradlew.bat assembleRelease

if %ERRORLEVEL% == 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo APK Location:
    echo %cd%\app\build\outputs\apk\release\app-release.apk
    echo.

    :: Copy to project root for easy access
    copy app\build\outputs\apk\release\app-release.apk ..\go2-parking-release.apk
    echo Copied to: %~dp0go2-parking-release.apk
    echo.
    echo You can now install this APK on your Android device!
) else (
    echo.
    echo ========================================
    echo BUILD FAILED!
    echo ========================================
    echo Please check the error messages above.
)

pause