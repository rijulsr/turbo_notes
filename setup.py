#!/usr/bin/env python3
"""
Setup script for Turbo Notes
"""

import os
import subprocess
import sys
from pathlib import Path


def install_dependencies():
    """Install required Python packages"""
    print("📦 Installing dependencies...")
    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"]
        )
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False


def setup_autostart():
    """Setup auto-start configuration for Linux"""
    print("⚙️  Setting up auto-start...")

    # Get current script directory
    script_dir = Path(__file__).parent.absolute()
    app_path = script_dir / "turbo_notes.py"

    # Create desktop entry for autostart
    autostart_dir = Path.home() / ".config" / "autostart"
    autostart_dir.mkdir(parents=True, exist_ok=True)

    # Launch the new tray app (GUI) instead of a terminal dashboard
    desktop_entry_content = f"""[Desktop Entry]
Type=Application
Name=Turbo Notes
Exec=python3 -m turbonotes.ui.qt.app
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Comment=Turbo Notes - Tray app
"""

    desktop_file = autostart_dir / "turbo-notes.desktop"
    with open(desktop_file, "w") as f:
        f.write(desktop_entry_content)

    # Make executable
    os.chmod(desktop_file, 0o755)

    print(f"✅ Auto-start configured! Desktop entry created at: {desktop_file}")

    # Also create a manual launcher
    launcher_content = f"""#!/bin/bash
# Turbo Notes Launcher
cd "{script_dir}"
python3 turbo_notes.py
"""

    launcher_file = script_dir / "launch_turbo_notes.sh"
    with open(launcher_file, "w") as f:
        f.write(launcher_content)

    os.chmod(launcher_file, 0o755)
    print(f"✅ Manual launcher created: {launcher_file}")

    return True


def create_alias():
    """Create shell alias for easy access"""
    script_dir = Path(__file__).parent.absolute()
    app_path = script_dir / "turbo_notes.py"

    # Determine shell config file
    shell = os.environ.get("SHELL", "/bin/bash")
    if "zsh" in shell:
        config_file = Path.home() / ".zshrc"
    else:
        config_file = Path.home() / ".bashrc"

    alias_line = f'alias tn="python3 {app_path}"'

    # Check if alias already exists
    if config_file.exists():
        with open(config_file, "r") as f:
            content = f.read()
            if "alias tn=" in content:
                print("✅ Shell alias 'tn' already exists!")
                return True

    # Add alias to shell config
    with open(config_file, "a") as f:
        f.write(f"\n# Turbo Notes alias\n{alias_line}\n")

    print(f"✅ Shell alias 'tn' added to {config_file}")
    print("💡 Run 'source ~/.bashrc' or restart your terminal to use 'tn' command")

    return True


def main():
    print("🚀 Turbo Notes Setup")
    print("===================")

    # Check Python version
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required!")
        sys.exit(1)

    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

    # Install dependencies
    if not install_dependencies():
        sys.exit(1)

    # Setup autostart
    if not setup_autostart():
        sys.exit(1)

    # Create alias
    if not create_alias():
        sys.exit(1)

    print("\n🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Run 'python3 turbo_notes.py' to start the application")
    print("2. Or use the alias 'tn' after restarting your terminal")
    print("3. Turbo Notes will now show your dashboard when you log in")
    print("\nQuick commands:")
    print("  tn --help                 Show help")
    print("  tn --dashboard            Show dashboard")
    print("  tn --add-note 'My note'   Add quick note")
    print("  tn --add-task 'My task'   Add quick task")
    print("  tn --list-tasks           List pending tasks")


if __name__ == "__main__":
    main()
