# Turbo Notes

A secure, minimalist terminal-based note and task manager that automatically shows your important tasks when you log in.

## Features

- **🔐 Encrypted Storage**: All your notes and tasks are encrypted with your master password
- **⚡ Auto-Launch**: Automatically opens on login to show your important tasks
- **📝 Notes & Tasks**: Manage both notes and tasks in one place
- **🎯 Priority System**: Set task priorities (High, Medium, Low)
- **📅 Due Dates**: Track deadlines and get overdue warnings
- **🔍 Search**: Quick search across all notes and tasks
- **📂 Categories**: Organize content with custom categories
- **💻 Terminal-Based**: Clean, fast terminal interface
- **🌐 Local Only**: Everything stays on your computer

## Quick Setup

1. **Clone and setup**:
   ```bash
   cd ~/Gitlaboratory/Turbo-notes
   python3 setup.py
   ```

2. **Start using**:
   ```bash
   python3 turbo_notes.py
   # Or use the alias after restarting terminal:
   tn
   ```

## Requirements

- Python 3.7+
- Linux (tested on Ubuntu/Debian)
- Terminal emulator
- Internet connection for initial setup (to install packages)

## Usage

### Interactive Mode
```bash
python3 turbo_notes.py
# or
tn
```

### Quick Commands
```bash
# Show dashboard
tn --dashboard

# Add quick note
tn --add-note "Remember to buy groceries"

# Add quick task
tn --add-task "Finish project report"

# List pending tasks
tn --list-tasks

# Show help
tn --help
```

## 🔑 Security

- **Master Password**: Set a master password during first launch
- **Encryption**: All data encrypted using Fernet (AES 128 in CBC mode)
- **Local Storage**: Data never leaves your computer
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Secure Storage**: Password stored securely in system keyring

## 📁 File Structure

```
~/.turbo-notes/
├── notes_data.enc    # Encrypted notes and tasks
└── salt.key          # Encryption salt

~/.config/autostart/
└── turbo-notes.desktop    # Auto-start configuration
```

## 🎯 Dashboard Features

When you log in, Turbo Notes automatically shows:
- **Overdue Tasks**: Tasks past their due date
- **Today's Tasks**: Tasks due today
- **Recent Notes**: Your latest notes
- **Quick Stats**: Overview of your data

## Configuration

### Auto-Start
The setup script automatically configures Turbo Notes to show your dashboard when you log in. To disable:
```bash
rm ~/.config/autostart/turbo-notes.desktop
```

### Shell Alias
A convenient `tn` alias is added to your shell configuration. You can use it instead of typing the full command.

## Manual Installation

If the setup script doesn't work:

1. **Install dependencies**:
   ```bash
   pip3 install rich cryptography keyring click
   ```

2. **Make executable**:
   ```bash
   chmod +x turbo_notes.py
   ```

3. **Create alias** (optional):
   ```bash
   echo 'alias tn="python3 /path/to/turbo_notes.py"' >> ~/.bashrc
   source ~/.bashrc
   ```

## Data Management

### Export Data
Use the settings menu (option 8) to export your data to an unencrypted JSON file for backup.

### Categories
Default categories: Personal, Work, Ideas. Add custom categories through the settings menu.

### Backup
Your encrypted data is stored in `~/.turbo-notes/`. Back up this directory to preserve your data.

## Troubleshooting

### "Module not found" errors
```bash
pip3 install -r requirements.txt
```

### Permission denied
```bash
chmod +x turbo_notes.py
chmod +x setup.py
```

### Auto-start not working
Check if the desktop file exists:
```bash
ls ~/.config/autostart/turbo-notes.desktop
```

### Forgot master password
Unfortunately, there's no password recovery. You'll need to delete `~/.turbo-notes/` and start fresh.

## Contributing

This is a simple personal tool, but feel free to:
- Report bugs
- Suggest features
- Submit improvements

## License

MIT License - Use it however you want!

## Enjoy!

Turbo Notes is designed to be simple, secure, and get out of your way. Focus on what matters - your notes and tasks! 
