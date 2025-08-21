#!/bin/bash

echo "🚀 Turbo Notes Android App Testing Script"
echo "=========================================="
echo

# Check if emulator is running
if ! adb devices | grep -q "emulator"; then
    echo "❌ No emulator detected. Please start your emulator first:"
    echo "   emulator -avd Pixel_6_API_34 &"
    exit 1
fi

echo "✅ Emulator detected"

# Check if app is installed
if adb shell pm list packages | grep -q "com.turbonotes.app"; then
    echo "✅ Turbo Notes app is installed"
else
    echo "📱 Installing Turbo Notes app..."
    adb install android/app/build/outputs/apk/debug/app-debug.apk
    if [ $? -eq 0 ]; then
        echo "✅ App installed successfully"
    else
        echo "❌ App installation failed"
        exit 1
    fi
fi

echo
echo "🎯 Testing Options:"
echo "1. Launch app"
echo "2. View app logs"
echo "3. Take screenshot"
echo "4. Uninstall app"
echo "5. Reinstall app"
echo

read -p "Choose option (1-5): " choice

case $choice in
    1)
        echo "🚀 Launching Turbo Notes..."
        adb shell am start -n com.turbonotes.app/.MainActivity
        echo "✅ App launched! Check your emulator screen."
        ;;
    2)
        echo "📋 Viewing app logs (Press Ctrl+C to stop)..."
        adb logcat -s "TurboNotes" -s "Capacitor" -s "WebView"
        ;;
    3)
        echo "📸 Taking screenshot..."
        adb shell screencap -p /sdcard/turbo_notes_screenshot.png
        adb pull /sdcard/turbo_notes_screenshot.png ./turbo_notes_screenshot.png
        echo "✅ Screenshot saved as turbo_notes_screenshot.png"
        ;;
    4)
        echo "🗑️  Uninstalling app..."
        adb uninstall com.turbonotes.app
        echo "✅ App uninstalled"
        ;;
    5)
        echo "🔄 Reinstalling app..."
        adb uninstall com.turbonotes.app 2>/dev/null
        adb install android/app/build/outputs/apk/debug/app-debug.apk
        echo "✅ App reinstalled"
        adb shell am start -n com.turbonotes.app/.MainActivity
        echo "✅ App launched"
        ;;
    *)
        echo "❌ Invalid option"
        ;;
esac

echo
echo "📱 App Package: com.turbonotes.app"
echo "🎯 Activity: com.turbonotes.app/.MainActivity"
echo "📁 APK Location: android/app/build/outputs/apk/debug/app-debug.apk"
echo
echo "💡 Manual commands:"
echo "   adb shell am start -n com.turbonotes.app/.MainActivity  # Launch app"
echo "   adb logcat -s Capacitor                                 # View logs"
echo "   adb shell input text 'Hello Turbo Notes!'               # Send text input"
echo "   adb shell screencap -p /sdcard/screenshot.png           # Take screenshot"

