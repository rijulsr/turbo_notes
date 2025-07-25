#!/bin/bash
set -e

echo "Setting up local Android build environment for Turbo Notes..."

# Check if we're on Linux and install dependencies if needed
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Installing system dependencies (you may need to enter your password)..."
    sudo apt-get update
    sudo apt-get install -y \
        build-essential autoconf automake libtool pkg-config \
        unzip zip libffi-dev libssl-dev openjdk-17-jdk \
        git python3-pip cmake zlib1g-dev libncurses5-dev \
        libncursesw5-dev libtinfo6 ccache gettext
fi

# Export environment variables for autotools
export ACLOCAL="aclocal -I /usr/share/aclocal"
export ACLOCAL_PATH="/usr/share/aclocal:${ACLOCAL_PATH}"

# Set JAVA_HOME if not already set
if [ -z "$JAVA_HOME" ]; then
    echo "Setting JAVA_HOME..."
    export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
fi

echo "Environment variables:"
echo "JAVA_HOME: $JAVA_HOME"
echo "ACLOCAL: $ACLOCAL"
echo "ACLOCAL_PATH: $ACLOCAL_PATH"

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install buildozer==1.5.0 cython==0.29.36

# Navigate to android app directory
cd android_app

# Run libtoolize to ensure libtool macros are available
echo "Running libtoolize to prepare autotools environment..."
libtoolize --force --copy

# Clean previous builds (ignore errors)
echo "Cleaning previous builds..."
buildozer android clean || true

# Build debug APK
echo "Building Android APK..."
buildozer android debug --verbose

echo "Build complete! APK should be located in .buildozer/android/platform/build-*/*/bin/"
find .buildozer/android/platform/build-*/*/bin/ -name "*.apk" 2>/dev/null || echo "No APK found yet - check build logs above" 