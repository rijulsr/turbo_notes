#!/bin/bash

# Turbo Notes Installation Script
# This script builds and installs Turbo Notes on your system

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Rust is installed
check_rust() {
    if ! command -v cargo &> /dev/null; then
        print_error "Rust/Cargo is not installed!"
        print_info "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
        print_success "Rust installed successfully!"
    else
        print_success "Rust is already installed"
    fi
}

# Build the application
build_app() {
    print_info "Building Turbo Notes (this may take a while)..."
    cargo build --release
    print_success "Build completed!"
}

# Install binaries
install_binaries() {
    local install_dir="$HOME/.local/bin"
    
    # Create install directory if it doesn't exist
    mkdir -p "$install_dir"
    
    # Copy binaries
    cp target/release/turbo-notes "$install_dir/"
    cp target/release/turbo-widget "$install_dir/"
    
    # Make executable
    chmod +x "$install_dir/turbo-notes"
    chmod +x "$install_dir/turbo-widget"
    
    print_success "Binaries installed to $install_dir"
    
    # Check if ~/.local/bin is in PATH
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        print_warning "~/.local/bin is not in your PATH"
        print_info "Add the following line to your ~/.bashrc or ~/.zshrc:"
        echo "export PATH=\"\$HOME/.local/bin:\$PATH\""
    fi
}

# Setup autostart (optional)
setup_autostart() {
    read -p "Do you want to enable auto-start on system boot? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        "$HOME/.local/bin/turbo-notes" --setup-autostart
        print_success "Auto-start enabled!"
    else
        print_info "Auto-start not enabled. You can enable it later with:"
        echo "turbo-notes --setup-autostart"
    fi
}

# Create desktop entry (Linux only)
create_desktop_entry() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        local desktop_dir="$HOME/.local/share/applications"
        mkdir -p "$desktop_dir"
        
        cat > "$desktop_dir/turbo-notes.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Turbo Notes
Comment=Minimalist terminal-based note-taking application
Exec=$HOME/.local/bin/turbo-notes
Icon=text-editor
Terminal=true
Categories=Office;TextEditor;Utility;
StartupNotify=false
Keywords=notes;text;terminal;
EOF
        
        print_success "Desktop entry created!"
    fi
}

# Test installation
test_installation() {
    print_info "Testing installation..."
    
    if command -v turbo-notes &> /dev/null; then
        print_success "turbo-notes command is available"
    else
        print_error "turbo-notes command not found in PATH"
        return 1
    fi
    
    if command -v turbo-widget &> /dev/null; then
        print_success "turbo-widget command is available"
    else
        print_error "turbo-widget command not found in PATH"
        return 1
    fi
    
    print_success "Installation test passed!"
}

# Main installation process
main() {
    echo
    echo "🚀 Turbo Notes Installation Script"
    echo "=================================="
    echo
    
    # Check if we're in the right directory
    if [[ ! -f "Cargo.toml" ]] || [[ ! -d "src" ]]; then
        print_error "Please run this script from the Turbo Notes project directory"
        exit 1
    fi
    
    print_info "Starting installation process..."
    
    # Installation steps
    check_rust
    build_app
    install_binaries
    create_desktop_entry
    setup_autostart
    test_installation
    
    echo
    print_success "🎉 Turbo Notes installation completed!"
    echo
    print_info "Usage:"
    echo "  turbo-notes              # Launch main application"
    echo "  turbo-notes --widget     # Launch quick note widget"
    echo "  turbo-notes --help       # Show help"
    echo
    print_info "Configuration and notes will be stored in:"
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  Config: ~/.config/turbo-notes/"
        echo "  Notes:  ~/.local/share/turbo-notes/"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  Config: ~/Library/Application Support/turbo-notes/"
        echo "  Notes:  ~/Library/Application Support/turbo-notes/"
    else
        echo "  Config: ~/.turbo-notes/"
        echo "  Notes:  ~/.turbo-notes/"
    fi
    echo
    print_info "Happy note-taking! 📝"
}

# Run main function
main "$@"
