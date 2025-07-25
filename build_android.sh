#!/bin/bash
set -e

echo "🚀 Building Turbo Notes Android APK with Python-for-Android (Direct)..."

# Check if we're on Linux and install dependencies if needed
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📦 Installing system dependencies (you may need to enter your password)..."
    sudo apt-get update
    sudo apt-get install -y build-essential git zip zlib1g-dev autoconf automake libtool libltdl-dev
    
    # Sanity check for ltdl.m4
    echo "🔍 Verifying ltdl.m4 is available..."
    ls -l /usr/share/aclocal/ltdl.m4 || (echo "❌ ltdl.m4 missing" && exit 1)
    echo "✅ ltdl.m4 found - autotools macros are available"
    
    # Install Android SDK and NDK if not present
    if [ ! -d "/usr/lib/android-sdk" ] && [ ! -d "$HOME/Android/Sdk" ]; then
        echo "📱 Installing Android SDK..."
        sudo apt-get install -y android-sdk
        
        # Try to set ANDROID_HOME to common locations
        if [ -d "/usr/lib/android-sdk" ]; then
            export ANDROID_HOME="/usr/lib/android-sdk"
        elif [ -d "$HOME/Android/Sdk" ]; then
            export ANDROID_HOME="$HOME/Android/Sdk"
        else
            echo "⚠️  Android SDK not found. Please install manually and set ANDROID_HOME"
            echo "   You can download from: https://developer.android.com/studio"
        fi
    fi
fi

# Set JAVA_HOME if not already set
if [ -z "$JAVA_HOME" ]; then
    echo "🔧 Setting JAVA_HOME..."
    export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
fi

# Set Android environment variables
if [ -z "$ANDROID_HOME" ]; then
    if [ -d "/usr/lib/android-sdk" ]; then
        export ANDROID_HOME="/usr/lib/android-sdk"
    elif [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
    else
        echo "⚠️  ANDROID_HOME not set. Please set it manually."
    fi
fi

export ANDROID_SDK_ROOT="$ANDROID_HOME"

echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
pip install cython==0.29.36 python-for-android==2024.1.21

echo "📱 Building Android APK with Python-for-Android..."

# Navigate to android app directory
cd android_app

# Export environment variables for autotools fix
echo "🔧 Setting up build environment..."
export ACLOCAL="aclocal -I /usr/share/aclocal"
export ACLOCAL_PATH="/usr/share/aclocal:${ACLOCAL_PATH}"

echo "Environment variables:"
echo "  JAVA_HOME: $JAVA_HOME"
echo "  ANDROID_HOME: $ANDROID_HOME"
echo "  ANDROID_SDK_ROOT: $ANDROID_SDK_ROOT"
echo "  ACLOCAL: $ACLOCAL"
echo "  ACLOCAL_PATH: $ACLOCAL_PATH"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf ~/.local/share/python-for-android/dists/turbo_notes || true

# Create p4a distribution
echo "🏗️  Creating Python-for-Android distribution..."
p4a create --dist-name turbo_notes \
    --bootstrap sdl2 \
    --requirements python3,kivy==2.2.1,kivymd==1.1.1,pillow,pygments,plyer,android,pyjnius \
    --arch arm64-v8a --arch armeabi-v7a \
    --ndk-api 21 \
    --private . \
    --package com.turbo.notes \
    --name "Turbo Notes" \
    --version 1.0.0 \
    --orientation portrait \
    --permission INTERNET \
    --permission WRITE_EXTERNAL_STORAGE \
    --permission READ_EXTERNAL_STORAGE \
    --permission WAKE_LOCK \
    --permission VIBRATE \
    --copy-libs \
    --debug

# Build APK
echo "📦 Building APK..."
p4a apk --dist-name turbo_notes \
    --arch arm64-v8a --arch armeabi-v7a \
    --private . \
    --package com.turbo.notes \
    --name "Turbo Notes" \
    --version 1.0.0 \
    --bootstrap sdl2 \
    --requirements python3,kivy==2.2.1,kivymd==1.1.1,pillow,pygments,plyer,android,pyjnius \
    --orientation portrait \
    --permission INTERNET \
    --permission WRITE_EXTERNAL_STORAGE \
    --permission READ_EXTERNAL_STORAGE \
    --permission WAKE_LOCK \
    --permission VIBRATE \
    --copy-libs \
    --debug

# Find and copy the APK
echo "🔍 Locating built APK..."
find ~/.local/share/python-for-android -name "*.apk" -type f | head -5

# Create bin directory and copy APK
mkdir -p bin
find ~/.local/share/python-for-android -name "*turbo*notes*.apk" -type f -exec cp {} bin/ \; || \
find ~/.local/share/python-for-android -name "*.apk" -type f -exec cp {} bin/turbo-notes-debug.apk \;

# Check if build succeeded and show APK location
if ls bin/*.apk 1> /dev/null 2>&1; then
    echo ""
    echo "🎉 Build completed successfully!"
    echo "📱 APK location: $(pwd)/bin/"
    
    # List the generated APKs
    echo "📦 Generated APKs:"
    ls -la bin/*.apk
    
    # Show APK info
    APK_FILE=$(ls bin/*.apk | head -n1)
    APK_SIZE=$(stat -c%s "$APK_FILE" 2>/dev/null || stat -f%z "$APK_FILE" 2>/dev/null || echo "unknown")
    echo "📊 APK size: $APK_SIZE bytes"
    echo ""
    echo "🚀 You can now install the APK on your Android device:"
    echo "   adb install $APK_FILE"
else
    echo ""
    echo "❌ Build failed! No APK found in bin/ directory"
    echo "Available APKs in p4a directory:"
    find ~/.local/share/python-for-android -name "*.apk" -type f
    exit 1
fi 