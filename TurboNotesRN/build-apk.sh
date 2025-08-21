#!/bin/bash

# TurboNotesRN APK Build Script
# Comprehensive script to build APK with proper environment setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
check_directory() {
    if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
        print_error "Please run this script from the TurboNotesRN directory"
        exit 1
    fi
    
    if ! grep -q "TurboNotesRN" package.json; then
        print_error "This doesn't appear to be the TurboNotesRN project"
        exit 1
    fi
    
    print_success "Directory check passed"
}

# Check Node.js and npm
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed!"
        print_info "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 18 ]]; then
        print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 18+"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Install dependencies
install_dependencies() {
    print_info "Installing npm dependencies..."
    npm install
    print_success "Dependencies installed"
}

# Check Java
check_java() {
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed!"
        print_info "Please install Java 17 (OpenJDK recommended)"
        print_info "Ubuntu: sudo apt install openjdk-17-jdk"
        print_info "macOS: brew install openjdk@17"
        exit 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [[ $JAVA_VERSION -lt 11 ]]; then
        print_error "Java version $JAVA_VERSION is too old. Please install Java 17+"
        exit 1
    fi
    
    print_success "Java $(java -version 2>&1 | head -n 1) is installed"
}

# Setup Android SDK if needed
setup_android_sdk() {
    if [[ -z "$ANDROID_HOME" ]]; then
        print_warning "ANDROID_HOME not set. Attempting to find Android SDK..."
        
        # Common Android SDK locations
        POTENTIAL_PATHS=(
            "$HOME/Android/Sdk"
            "$HOME/Library/Android/sdk"
            "/usr/local/android-sdk"
            "/opt/android-sdk"
        )
        
        for path in "${POTENTIAL_PATHS[@]}"; do
            if [[ -d "$path" ]]; then
                export ANDROID_HOME="$path"
                export PATH="$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools"
                print_success "Found Android SDK at $ANDROID_HOME"
                break
            fi
        done
        
        if [[ -z "$ANDROID_HOME" ]]; then
            print_error "Android SDK not found!"
            print_info "Please install Android Studio or Android SDK"
            print_info "Then set ANDROID_HOME environment variable"
            exit 1
        fi
    else
        print_success "Android SDK found at $ANDROID_HOME"
    fi
}

# Create Android project if it doesn't exist
setup_android_project() {
    if [[ ! -f "android/build.gradle" ]]; then
        print_info "Android project not found. Creating React Native Android project..."
        
        # Create basic Android project structure
        npx @react-native-community/cli init TurboNotesRNTemp --skip-install
        
        # Copy Android files
        if [[ -d "TurboNotesRNTemp/android" ]]; then
            cp -r TurboNotesRNTemp/android ./
            rm -rf TurboNotesRNTemp
            print_success "Android project created"
        else
            print_error "Failed to create Android project"
            exit 1
        fi
    else
        print_success "Android project already exists"
    fi
}

# Build the bundle
build_bundle() {
    print_info "Building React Native bundle..."
    
    # Create assets directory if it doesn't exist
    mkdir -p android/app/src/main/assets
    
    # Build the bundle
    npx react-native bundle \
        --platform android \
        --dev false \
        --entry-file index.js \
        --bundle-output android/app/src/main/assets/index.android.bundle \
        --assets-dest android/app/src/main/res/
    
    print_success "Bundle created successfully"
}

# Build APK
build_apk() {
    print_info "Building APK..."
    
    cd android
    
    # Make gradlew executable
    chmod +x gradlew
    
    # Clean previous builds
    ./gradlew clean
    
    # Build debug APK
    ./gradlew assembleDebug
    
    cd ..
    
    print_success "APK build completed"
}

# Find and copy APK
find_apk() {
    print_info "Looking for built APK..."
    
    APK_PATH=$(find android -name "*.apk" -type f | head -1)
    
    if [[ -n "$APK_PATH" ]]; then
        # Copy APK to project root with descriptive name
        APK_NAME="TurboNotesRN-debug-$(date +%Y%m%d-%H%M%S).apk"
        cp "$APK_PATH" "./$APK_NAME"
        
        # Get APK info
        APK_SIZE=$(du -h "$APK_NAME" | cut -f1)
        
        print_success "APK built successfully!"
        echo
        echo "📱 APK Details:"
        echo "   File: $APK_NAME"
        echo "   Size: $APK_SIZE"
        echo "   Path: $(pwd)/$APK_NAME"
        echo
        print_info "You can now install this APK on your Android device:"
        echo "   adb install $APK_NAME"
        echo
        
        return 0
    else
        print_error "APK file not found!"
        print_info "Build may have failed. Check the logs above."
        return 1
    fi
}

# Main build process
main() {
    echo
    echo "🚀 TurboNotesRN APK Builder"
    echo "=========================="
    echo
    
    print_info "Starting APK build process..."
    
    # Run all checks and build steps
    check_directory
    check_node
    install_dependencies
    check_java
    setup_android_sdk
    setup_android_project
    build_bundle
    build_apk
    find_apk
    
    echo
    print_success "🎉 APK build process completed!"
    echo
}

# Handle command line arguments
case "${1:-}" in
    "--help"|"-h")
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo "  --clean       Clean all build artifacts before building"
        echo "  --release     Build release APK (requires signing setup)"
        exit 0
        ;;
    "--clean")
        print_info "Cleaning build artifacts..."
        rm -rf android/app/build
        rm -rf node_modules
        npm install
        ;;
    "--release")
        print_info "Building release APK..."
        # This would require signing setup
        print_warning "Release build requires signing configuration"
        ;;
esac

# Run main function
main "$@"

