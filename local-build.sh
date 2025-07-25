#!/bin/bash
set -e

echo "Setting up local Android build environment for Turbo Notes..."

# Export environment variables for autotools - this is the key fix for libffi
export ACLOCAL="aclocal -I /usr/share/aclocal"
export ACLOCAL_PATH="/usr/share/aclocal:$ACLOCAL_PATH"

# Set JAVA_HOME (adjust path if needed for your local Java installation)
if [ -z "$JAVA_HOME" ]; then
    echo "Setting JAVA_HOME..."
    export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
fi

echo "JAVA_HOME: $JAVA_HOME"
echo "ACLOCAL: $ACLOCAL"
echo "ACLOCAL_PATH: $ACLOCAL_PATH"

# Install Python dependencies if not already installed
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install buildozer==1.5.0 cython==0.29.36

# Navigate to android app directory
cd android_app

# Clean previous builds (ignore errors)
echo "Cleaning previous builds..."
buildozer android clean || true

# Build debug APK
echo "Building Android APK..."
buildozer android debug --verbose

echo "Build complete! APK should be located in bin/ directory"
ls -la bin/ 