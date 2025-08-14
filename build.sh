#!/bin/bash

# Turbo Notes Cross-Platform Build Script
# Builds binaries for Linux, Windows, and macOS

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create release directory
setup_release_dir() {
    local release_dir="releases"
    rm -rf "$release_dir"
    mkdir -p "$release_dir"
    echo "$release_dir"
}

# Build for a specific target
build_target() {
    local target=$1
    local os_name=$2
    local release_dir=$3
    
    print_info "Building for $os_name ($target)..."
    
    # Add target if not already installed
    rustup target add "$target" 2>/dev/null || true
    
    # Build
    cargo build --release --target "$target"
    
    # Create target-specific directory
    local target_dir="$release_dir/$os_name"
    mkdir -p "$target_dir"
    
    # Copy binaries (different extensions for Windows)
    if [[ "$target" == *"windows"* ]]; then
        cp "target/$target/release/turbo-notes.exe" "$target_dir/"
        cp "target/$target/release/turbo-widget.exe" "$target_dir/"
    else
        cp "target/$target/release/turbo-notes" "$target_dir/"
        cp "target/$target/release/turbo-widget" "$target_dir/"
    fi
    
    # Copy documentation
    cp README.md "$target_dir/"
    cp LICENSE "$target_dir/"
    
    # Create platform-specific install instructions
    case "$os_name" in
        "linux")
            cat > "$target_dir/INSTALL.txt" << EOF
Turbo Notes - Linux Installation
================================

1. Extract this archive to a directory of your choice
2. Make the binaries executable:
   chmod +x turbo-notes turbo-widget
3. Add the directory to your PATH, or copy the binaries to ~/.local/bin
4. Run: ./turbo-notes --setup-autostart (optional)

Quick Start:
  ./turbo-notes              # Launch main application
  ./turbo-notes --widget     # Launch quick note widget
EOF
            ;;
        "windows")
            cat > "$target_dir/INSTALL.txt" << EOF
Turbo Notes - Windows Installation
==================================

1. Extract this archive to a directory of your choice (e.g., C:\Program Files\TurboNotes)
2. Add the directory to your system PATH
3. Run: turbo-notes.exe --setup-autostart (optional)

Quick Start:
  turbo-notes.exe              # Launch main application
  turbo-notes.exe --widget     # Launch quick note widget

Note: You may need to allow the application through Windows Defender.
EOF
            ;;
        "macos")
            cat > "$target_dir/INSTALL.txt" << EOF
Turbo Notes - macOS Installation
================================

1. Extract this archive to a directory of your choice (e.g., /Applications/TurboNotes)
2. Make the binaries executable:
   chmod +x turbo-notes turbo-widget
3. Add the directory to your PATH, or copy the binaries to /usr/local/bin
4. Run: ./turbo-notes --setup-autostart (optional)

Quick Start:
  ./turbo-notes              # Launch main application
  ./turbo-notes --widget     # Launch quick note widget

Note: On first run, you may need to allow the application in System Preferences > Security & Privacy.
EOF
            ;;
    esac
    
    # Create archive
    local archive_name="turbo-notes-$os_name.tar.gz"
    cd "$release_dir"
    tar -czf "$archive_name" "$os_name"
    cd ..
    
    print_success "Built $os_name release: $release_dir/$archive_name"
}

# Main build process
main() {
    echo
    echo "🚀 Turbo Notes Cross-Platform Build"
    echo "==================================="
    echo
    
    # Check if we're in the right directory
    if [[ ! -f "Cargo.toml" ]] || [[ ! -d "src" ]]; then
        print_error "Please run this script from the Turbo Notes project directory"
        exit 1
    fi
    
    # Check Rust installation
    if ! command -v cargo &> /dev/null; then
        print_error "Rust/Cargo is not installed!"
        exit 1
    fi
    
    # Setup release directory
    local release_dir
    release_dir=$(setup_release_dir)
    
    print_info "Building releases in $release_dir/"
    
    # Build for each target platform
    # Note: Cross-compilation may require additional setup for some targets
    
    # Linux (native)
    build_target "x86_64-unknown-linux-gnu" "linux" "$release_dir"
    
    # Windows (requires mingw-w64)
    if command -v x86_64-w64-mingw32-gcc &> /dev/null; then
        build_target "x86_64-pc-windows-gnu" "windows" "$release_dir"
    else
        print_error "Windows cross-compilation tools not found. Install mingw-w64."
        print_info "On Ubuntu: sudo apt install mingw-w64"
        print_info "On macOS: brew install mingw-w64"
    fi
    
    # macOS (requires macOS SDK)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        build_target "x86_64-apple-darwin" "macos" "$release_dir"
        # Apple Silicon Macs
        if rustup target list | grep -q "aarch64-apple-darwin (installed)"; then
            build_target "aarch64-apple-darwin" "macos-arm64" "$release_dir"
        fi
    else
        print_error "macOS cross-compilation requires macOS SDK (build on macOS)"
    fi
    
    echo
    print_success "🎉 Cross-platform build completed!"
    print_info "Release packages are in: $release_dir/"
    ls -la "$release_dir"/*.tar.gz 2>/dev/null || true
    echo
}

# Handle command line arguments
case "${1:-}" in
    "--help"|"-h")
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo "  --clean       Clean build artifacts before building"
        exit 0
        ;;
    "--clean")
        print_info "Cleaning build artifacts..."
        cargo clean
        shift
        ;;
esac

# Run main function
main "$@"
