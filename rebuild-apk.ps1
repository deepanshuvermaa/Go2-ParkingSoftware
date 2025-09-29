# Go2 Parking APK Rebuild Script
Write-Host "========================================" -ForegroundColor Green
Write-Host "Go2 Parking APK Rebuild" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Set JAVA_HOME to Android Studio's Java
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

Write-Host "Setting Java path from Android Studio..."
Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Yellow
Write-Host ""

# Navigate to android directory
Set-Location "$PSScriptRoot\android"

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Only rebuild the APK (no clean to make it faster)
Write-Host "Building Release APK..." -ForegroundColor Green
Write-Host "This may take 2-5 minutes..." -ForegroundColor Yellow
Write-Host ""

# Build the release APK
& .\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""

    $apkPath = "$(Get-Location)\app\build\outputs\apk\release\app-release.apk"

    if (Test-Path $apkPath) {
        Write-Host "APK Location:" -ForegroundColor Yellow
        Write-Host $apkPath -ForegroundColor Cyan
        Write-Host ""

        # Copy to project root for easy access
        $destinationPath = "$PSScriptRoot\go2-parking-release-fixed.apk"
        Copy-Item $apkPath $destinationPath -Force
        Write-Host "Copied to: $destinationPath" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now install this APK on your Android device!" -ForegroundColor Green
    } else {
        Write-Host "Warning: APK file not found at expected location" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "BUILD FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")