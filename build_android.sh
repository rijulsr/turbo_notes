#!/bin/bash
set -e

echo "🚀 Building Turbo Notes Android APK locally..."

# Check if we're on Linux and install dependencies if needed
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📦 Installing system dependencies (you may need to enter your password)..."
    sudo apt-get update
    sudo apt-get install -y \
        build-essential git zip zlib1g-dev \
        autoconf automake libtool libltdl-dev \
        pkg-config libffi-dev libssl-dev \
        cmake ccache gettext \
        openjdk-17-jdk
        
    echo "✅ System dependencies installed"
fi

# Set JAVA_HOME if not already set
if [ -z "$JAVA_HOME" ]; then
    echo "🔧 Setting JAVA_HOME..."
    export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
fi

echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
pip install cython==0.29.36 buildozer==1.4.0

echo "📱 Building Android APK..."

# Navigate to android app directory
cd android_app

# Clean previous builds (ignore errors)
echo "🧹 Cleaning previous builds..."
buildozer android clean || true

# Export environment variables for autotools fix
echo "🔧 Setting up autotools environment..."
export ACLOCAL="aclocal -I /usr/share/aclocal"
export ACLOCAL_PATH="/usr/share/aclocal:${ACLOCAL_PATH}"
export PKG_CONFIG_PATH="/usr/lib/pkgconfig:/usr/share/pkgconfig"

echo "Environment variables:"
echo "  JAVA_HOME: $JAVA_HOME"
echo "  ACLOCAL: $ACLOCAL"
echo "  ACLOCAL_PATH: $ACLOCAL_PATH"
echo "  PKG_CONFIG_PATH: $PKG_CONFIG_PATH"

# Run libtoolize to ensure libtool macros are available
echo "🔨 Running libtoolize to prepare autotools environment..."
libtoolize --force --copy || true

# Build debug APK with verbose output
echo "🏗️  Building debug APK (this may take a while)..."
buildozer --verbose android debug 2>&1 | tee buildozer_full.log

# Check if build succeeded and show APK location
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Build completed successfully!"
    echo "📱 APK location: $(pwd)/bin/"
    
    # List the generated APKs
    if ls bin/*.apk 1> /dev/null 2>&1; then
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
        echo "⚠️  No APK files found in bin/ directory"
    fi
else
    echo ""
    echo "❌ Build failed! Check the logs above for errors."
    echo "📋 Full build log saved to: buildozer_full.log"
    exit 1
fi 