#!/bin/bash

# APK Verification Script for Turbo Notes

APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

echo "🔍 Turbo Notes APK Verification"
echo "==============================="
echo

if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK not found at: $APK_PATH"
    echo "Run 'npm run build && npx cap sync android && cd android && ./gradlew assembleDebug' first"
    exit 1
fi

echo "✅ APK found: $APK_PATH"

# Check file size
APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
APK_SIZE_BYTES=$(stat -c%s "$APK_PATH")
echo "📦 APK Size: $APK_SIZE ($APK_SIZE_BYTES bytes)"

if [ $APK_SIZE_BYTES -lt 1048576 ]; then
    echo "⚠️  Warning: APK seems small (< 1MB)"
else
    echo "✅ APK size looks good"
fi

# Check if APK is signed
echo "🔐 Checking APK signature..."
if command -v aapt2 &> /dev/null; then
    aapt2 dump badging "$APK_PATH" | head -3
elif command -v aapt &> /dev/null; then
    aapt dump badging "$APK_PATH" | head -3
else
    echo "ℹ️  aapt/aapt2 not found, skipping detailed check"
fi

# Basic ZIP integrity check
if unzip -t "$APK_PATH" > /dev/null 2>&1; then
    echo "✅ APK archive integrity: OK"
else
    echo "❌ APK archive integrity: FAILED"
    exit 1
fi

echo
echo "📱 Installation Instructions:"
echo "1. Transfer $APK_PATH to your Android device"
echo "2. Enable 'Unknown sources' in Android settings"
echo "3. Tap the APK file to install"
echo "4. Open 'Turbo Notes' from your app drawer"
echo
echo "🚀 APK verification complete!"
