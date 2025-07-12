#!/usr/bin/env python3
"""
Complete Setup Script for Turbo Notes
Handles both desktop and Android versions
"""

import os
import sys
import subprocess
import shutil
import platform
from pathlib import Path

def print_banner():
    """Print the setup banner"""
    banner = """
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ████████╗██╗   ██╗██████╗ ██████╗  ██████╗             ║
║    ╚══██╔══╝██║   ██║██╔══██╗██╔══██╗██╔═══██╗             ║
║       ██║   ██║   ██║██████╔╝██████╔╝██║   ██║             ║
║       ██║   ██║   ██║██╔══██╗██╔══██╗██║   ██║             ║
║       ██║   ╚██████╔╝██████╔╝██║  ██║╚██████╔╝             ║
║       ╚═╝    ╚═════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝              ║
║                                                              ║
║                    ███╗   ██╗ ██████╗ ████████╗███████╗     ║
║                    ████╗  ██║██╔═══██╗╚══██╔══╝██╔════╝     ║
║                    ██╔██╗ ██║██║   ██║   ██║   █████╗       ║
║                    ██║╚██╗██║██║   ██║   ██║   ██╔══╝       ║
║                    ██║ ╚████║╚██████╔╝   ██║   ███████╗     ║
║                    ╚═╝  ╚═══╝ ╚═════╝    ╚═╝   ╚══════╝     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

    🚀 TURBO NOTES COMPLETE SETUP 🚀
    Desktop + Android Development Environment
    """
    print(banner)

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required!")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro} detected")

def install_desktop_dependencies():
    """Install desktop dependencies"""
    print("\n📦 Installing desktop dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Desktop dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install desktop dependencies: {e}")
        return False

def install_android_dependencies():
    """Install Android development dependencies"""
    print("\n📱 Installing Android dependencies...")
    try:
        android_deps = [
            "kivy==2.2.0",
            "kivymd==1.1.1",
            "buildozer==1.5.0",
            "cython==0.29.36",
            "pillow==10.0.0",
            "pygments==2.16.1",
            "plyer==2.1.0",
            "python-dateutil==2.8.2"
        ]
        
        for dep in android_deps:
            subprocess.check_call([sys.executable, "-m", "pip", "install", dep])
        
        print("✅ Android dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install Android dependencies: {e}")
        return False

def setup_desktop_autostart():
    """Setup desktop auto-start configuration"""
    print("\n⚙️  Setting up desktop auto-start...")
    
    script_dir = Path(__file__).parent.absolute()
    app_path = script_dir / "turbo_notes.py"
    
    if platform.system() == "Linux":
        # Create desktop entry for autostart
        autostart_dir = Path.home() / ".config" / "autostart"
        autostart_dir.mkdir(parents=True, exist_ok=True)
        
        desktop_entry_content = f"""[Desktop Entry]
Type=Application
Name=Turbo Notes
Exec=gnome-terminal -- python3 {app_path} --dashboard
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Comment=Turbo Notes - Quick task overview on login
"""
        
        desktop_file = autostart_dir / "turbo-notes.desktop"
        with open(desktop_file, 'w') as f:
            f.write(desktop_entry_content)
        
        os.chmod(desktop_file, 0o755)
        print(f"✅ Auto-start configured! Desktop entry created at: {desktop_file}")
    
    # Create launcher script
    launcher_content = f"""#!/bin/bash
# Turbo Notes Launcher
cd "{script_dir}"
python3 turbo_notes.py
"""
    
    launcher_file = script_dir / "launch_turbo_notes.sh"
    with open(launcher_file, 'w') as f:
        f.write(launcher_content)
    
    os.chmod(launcher_file, 0o755)
    print(f"✅ Manual launcher created: {launcher_file}")
    
    return True

def create_shell_alias():
    """Create shell alias for easy access"""
    print("\n🔗 Creating shell alias...")
    
    script_dir = Path(__file__).parent.absolute()
    app_path = script_dir / "turbo_notes.py"
    
    # Determine shell config file
    shell = os.environ.get('SHELL', '/bin/bash')
    if 'zsh' in shell:
        config_file = Path.home() / ".zshrc"
    else:
        config_file = Path.home() / ".bashrc"
    
    alias_line = f'alias tn="python3 {app_path}"'
    
    # Check if alias already exists
    if config_file.exists():
        with open(config_file, 'r') as f:
            content = f.read()
            if 'alias tn=' in content:
                print("✅ Shell alias 'tn' already exists!")
                return True
    
    # Add alias to shell config
    with open(config_file, 'a') as f:
        f.write(f'\n# Turbo Notes alias\n{alias_line}\n')
    
    print(f"✅ Shell alias 'tn' added to {config_file}")
    print("💡 Run 'source ~/.bashrc' or restart your terminal to use 'tn' command")
    
    return True

def setup_android_environment():
    """Setup Android development environment"""
    print("\n📱 Setting up Android development environment...")
    
    # Create android_app directory if it doesn't exist
    android_dir = Path("android_app")
    android_dir.mkdir(exist_ok=True)
    
    # Check if buildozer.spec exists
    buildozer_spec = android_dir / "buildozer.spec"
    if not buildozer_spec.exists():
        print("⚠️  buildozer.spec not found. You'll need to run 'buildozer init' in the android_app directory.")
    
    # Install system dependencies for Android (Linux)
    if platform.system() == "Linux":
        print("📦 Installing system dependencies for Android development...")
        system_deps = [
            "git", "zip", "unzip", "openjdk-8-jdk", "python3-pip", 
            "autoconf", "libtool", "pkg-config", "zlib1g-dev", 
            "libncurses5-dev", "libncursesw5-dev", "libtinfo5", 
            "cmake", "libffi-dev", "libssl-dev", "build-essential"
        ]
        
        try:
            subprocess.check_call(["sudo", "apt-get", "update"])
            subprocess.check_call(["sudo", "apt-get", "install", "-y"] + system_deps)
            print("✅ System dependencies installed!")
        except subprocess.CalledProcessError as e:
            print(f"⚠️  Failed to install some system dependencies: {e}")
            print("You may need to install them manually.")
    
    print("✅ Android environment setup complete!")
    return True

def run_tests():
    """Run tests to verify installation"""
    print("\n🧪 Running tests...")
    
    # Test desktop version
    try:
        result = subprocess.run([sys.executable, "-c", "import turbo_notes; print('Desktop version: OK')"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Desktop version test passed!")
        else:
            print(f"⚠️  Desktop version test failed: {result.stderr}")
    except Exception as e:
        print(f"⚠️  Desktop version test error: {e}")
    
    # Test Android dependencies
    try:
        result = subprocess.run([sys.executable, "-c", "import kivy, kivymd; print('Android deps: OK')"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Android dependencies test passed!")
        else:
            print(f"⚠️  Android dependencies test failed: {result.stderr}")
    except Exception as e:
        print(f"⚠️  Android dependencies test error: {e}")

def create_development_scripts():
    """Create helpful development scripts"""
    print("\n📝 Creating development scripts...")
    
    # Desktop run script
    desktop_script = """#!/bin/bash
# Quick desktop run script
echo "🚀 Starting Turbo Notes Desktop..."
python3 turbo_notes.py
"""
    
    with open("run_desktop.sh", 'w') as f:
        f.write(desktop_script)
    os.chmod("run_desktop.sh", 0o755)
    
    # Android development script
    android_script = """#!/bin/bash
# Android development script
echo "📱 Turbo Notes Android Development"
echo "=================================="
echo "1. Run desktop version for testing: python3 android_app/main.py"
echo "2. Build debug APK: cd android_app && buildozer android debug"
echo "3. Build release APK: cd android_app && buildozer android release"
echo "4. Deploy to device: cd android_app && buildozer android deploy run"
echo ""
echo "Choose an option:"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "🖥️  Running Android app in desktop mode..."
        python3 android_app/main.py
        ;;
    2)
        echo "🔨 Building debug APK..."
        cd android_app && buildozer android debug
        ;;
    3)
        echo "🔨 Building release APK..."
        cd android_app && buildozer android release
        ;;
    4)
        echo "📱 Deploying to device..."
        cd android_app && buildozer android deploy run
        ;;
    *)
        echo "Invalid choice"
        ;;
esac
"""
    
    with open("run_android.sh", 'w') as f:
        f.write(android_script)
    os.chmod("run_android.sh", 0o755)
    
    print("✅ Development scripts created:")
    print("   • run_desktop.sh - Quick desktop launcher")
    print("   • run_android.sh - Android development helper")

def print_completion_message():
    """Print completion message with instructions"""
    completion_msg = """
🎉 SETUP COMPLETED SUCCESSFULLY! 🎉

📋 What's been set up:
✅ Desktop version with full task & note management
✅ Android app with Material Design UI
✅ Auto-start configuration for desktop
✅ Shell alias 'tn' for quick access
✅ Development environment for Android
✅ CI/CD pipeline for automated builds

🚀 Quick Start:

Desktop Version:
  python3 turbo_notes.py          # Full interactive mode
  tn --dashboard                  # Quick dashboard
  tn --add-note "My note"         # Add quick note
  tn --add-task "My task"         # Add quick task
  tn --list-tasks                 # List pending tasks
  ./run_desktop.sh                # Use convenience script

Android Development:
  cd android_app                  # Go to Android directory
  python3 main.py                 # Test on desktop
  buildozer android debug         # Build debug APK
  ./run_android.sh                # Use convenience script

🔧 Development Commands:
  pytest android_app/tests/       # Run tests
  git push origin main            # Trigger CI/CD pipeline
  
📱 Android Build Process:
  1. Make changes to android_app/main.py
  2. Test locally: python3 android_app/main.py
  3. Build APK: cd android_app && buildozer android debug
  4. Deploy: buildozer android deploy run

📚 Documentation:
  • README.md - Main project documentation
  • android_app/README.md - Android-specific docs
  • GitHub Actions will build APKs automatically on push

🎯 Next Steps:
  1. Try the desktop version: tn --dashboard
  2. Test the Android app: cd android_app && python3 main.py
  3. Set up GitHub secrets for Android releases
  4. Start building your productivity system!

Happy coding! 🚀
"""
    print(completion_msg)

def main():
    """Main setup function"""
    print_banner()
    
    # Check system requirements
    check_python_version()
    
    # Install dependencies
    desktop_success = install_desktop_dependencies()
    android_success = install_android_dependencies()
    
    if not desktop_success:
        print("❌ Desktop setup failed!")
        sys.exit(1)
    
    # Setup desktop environment
    setup_desktop_autostart()
    create_shell_alias()
    
    # Setup Android environment
    if android_success:
        setup_android_environment()
    
    # Create development scripts
    create_development_scripts()
    
    # Run tests
    run_tests()
    
    # Print completion message
    print_completion_message()

if __name__ == "__main__":
    main() 