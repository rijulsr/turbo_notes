#!/usr/bin/env python3
"""Create a desktop autostart entry that launches the tray app."""

from pathlib import Path


def main():
    autostart_dir = Path.home() / ".config" / "autostart"
    autostart_dir.mkdir(parents=True, exist_ok=True)
    # Use module entry to ensure virtualenv/python resolution
    exec_line = "python3 -m turbonotes.ui.qt.app"
    content = f"""[Desktop Entry]
Type=Application
Name=Turbo Notes
Exec={exec_line}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Comment=Turbo Notes tray
"""
    desktop_file = autostart_dir / "turbo-notes.desktop"
    desktop_file.write_text(content)
    desktop_file.chmod(0o755)
    print(f"Created autostart entry at {desktop_file}")


if __name__ == "__main__":
    main()


