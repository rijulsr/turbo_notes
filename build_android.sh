#!/bin/bash

# Turbo Notes Android Build Script
# This script replicates the CI build process locally

set -e  # Exit on any error

echo "🚀 Starting Turbo Notes Android build..."

# Check if we're in the right directory
if [ ! -f "android_app/main.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install system dependencies
echo "📦 Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y build-essential git zip zlib1g-dev autoconf automake libtool libltdl-dev

# Sanity check for ltdl.m4
echo "🔍 Checking for ltdl.m4..."
ls -l /usr/share/aclocal/ltdl.m4 || (echo "❌ ltdl.m4 missing" && exit 1)

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
pip install cython==0.29.36 buildozer==1.4.0

# Navigate to android_app directory
cd android_app

# Set environment variables for autotools
export ACLOCAL="aclocal -I /usr/share/aclocal"
export ACLOCAL_PATH="/usr/share/aclocal:${ACLOCAL_PATH}"
export PKG_CONFIG_PATH="/usr/lib/pkgconfig:/usr/share/pkgconfig"

echo "🔧 Environment variables set:"
echo "  ACLOCAL: $ACLOCAL"
echo "  ACLOCAL_PATH: $ACLOCAL_PATH"
echo "  PKG_CONFIG_PATH: $PKG_CONFIG_PATH"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
buildozer android clean || true

# Build the APK
echo "🔨 Building APK..."
buildozer --verbose android debug 2>&1 | tee buildozer_full.log

# Check if build was successful
if [ "${PIPESTATUS[0]}" -ne 0 ]; then
    echo "❌ Build failed! Last 100 lines of log:"
    tail -n 100 buildozer_full.log
    exit 1
fi

# Check if APK was created
if ls bin/*.apk 1> /dev/null 2>&1; then
    echo "✅ Build successful! APK created:"
    ls -la bin/*.apk
    
    echo ""
    echo "📱 To install on connected device:"
    echo "   adb install bin/turbo_notes-*-debug.apk"
else
    echo "❌ No APK found in bin/ directory"
    exit 1
fi 