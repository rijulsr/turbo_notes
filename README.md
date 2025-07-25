# 🚀 Turbo Notes - Secure Cross-Platform Note & Task Manager

[![🚀 Turbo Notes CI/CD](https://github.com/rijul-kansal/Turbo-notes/actions/workflows/ci.yml/badge.svg)](https://github.com/rijul-kansal/Turbo-notes/actions/workflows/ci.yml)
[![⚡ Quick Tests](https://github.com/rijul-kansal/Turbo-notes/actions/workflows/quick-test.yml/badge.svg)](https://github.com/rijul-kansal/Turbo-notes/actions/workflows/quick-test.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

A **secure**, **cross-platform** productivity application that combines note-taking and task management with beautiful interfaces for both **terminal** and **Android** platforms.

## ✨ Features

### 🖥️ Terminal Version
- **🔐 Encryption**: Optional password protection with PBKDF2 + Fernet encryption
- **📝 Rich Notes**: Full-featured note management with categories and search
- **✅ Smart Tasks**: Priority levels, due dates, and completion tracking
- **🎨 Beautiful UI**: Rich terminal interface with ASCII art and colors
- **📊 Dashboard**: Overview of overdue tasks, today's agenda, and recent notes
- **🔍 Search**: Find notes and tasks quickly across all content
- **📈 Statistics**: Streak tracking and productivity insights

### 📱 Android Version (KivyMD)
- **🎨 Material Design**: Clean, modern mobile interface
- **📱 Touch Optimized**: Intuitive navigation with bottom tabs
- **💾 Local Storage**: Secure local data storage on device
- **🔄 Real-time Sync**: Instant updates across app components
- **✨ Animations**: Smooth transitions and feedback
- **📊 Dashboard**: Mobile-optimized stats and overview

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ 
- Git

### 📥 Installation

#### For Terminal Use:
```bash
git clone https://github.com/rijul-kansal/Turbo-notes.git
cd Turbo-notes
pip install -r requirements.txt
python turbo_notes.py
```

#### For Android Development:
```bash
cd android_app
pip install -r requirements.txt
python main.py  # Run on desktop first
```

#### Build Android APK:
```bash
cd android_app
pip install buildozer
buildozer android debug
```

## 🎯 Usage

### Terminal Commands
```bash
# Interactive mode (recommended)
python turbo_notes.py

# Quick commands
python turbo_notes.py --add-note "Meeting notes from today"
python turbo_notes.py --add-task "Finish project documentation"
python turbo_notes.py --list-tasks
python turbo_notes.py --dashboard
```

### Android App
1. **Dashboard Tab**: View stats, overdue tasks, and recent notes
2. **Notes Tab**: Create, view, and manage notes with categories
3. **Tasks Tab**: Add tasks, set priorities, and mark complete

## 🏗️ CI/CD Pipeline

Our automated pipeline includes:

### 🔍 **Code Quality** (Every Push)
- **Black** formatting validation
- **isort** import sorting 
- **flake8** linting
- **Bandit** security scanning
- **Safety** vulnerability checks
- **Pylint** code quality analysis

### 🧪 **Testing** (Multi-Platform)
- **Cross-platform testing** (Ubuntu, Windows, macOS)
- **Python version matrix** (3.10, 3.11, 3.12)
- **Integration tests** with pytest
- **Code coverage** reporting
- **Basic functionality validation**

### 📱 **Android Build** (Master Branch)
- **Automated APK generation**
- **Build artifact storage** (30 days)
- **Release automation**

### 📬 **Notifications**
- **Slack integration** for build failures (optional)
- **GitHub status checks**
- **Automated releases** with APK downloads

## 📊 Project Structure

```
Turbo-notes/
├── .github/
│   └── workflows/           # CI/CD pipelines
│       ├── ci.yml          # Main CI/CD pipeline
│       └── quick-test.yml  # Fast validation
├── android_app/
│   ├── main.py             # Android app (KivyMD)
│   ├── buildozer.spec      # Android build config
│   ├── requirements.txt    # Android dependencies
│   └── tests/              # Android app tests
├── turbo_notes.py          # Terminal application
├── requirements.txt        # Core dependencies
└── README.md              # This file
```

## 🔧 Development

### Running Tests
```bash
# All tests
pytest

# With coverage
pytest --cov=turbo_notes --cov-report=html

# Specific test file
pytest android_app/tests/test_terminal_integration.py -v
```

### Code Quality
```bash
# Format code
black turbo_notes.py android_app/main.py

# Sort imports  
isort turbo_notes.py android_app/main.py

# Lint
flake8 turbo_notes.py android_app/main.py --max-line-length=100

# Security check
bandit -r turbo_notes.py android_app/main.py
```

## 🛠️ Configuration

### Terminal App Settings
- **Password Protection**: Enable/disable encryption
- **Categories**: Customize note categories
- **Export**: JSON export functionality
- **Statistics**: Usage tracking and streaks

### Android App Settings
- **Theme**: Dark/Light mode support
- **Notifications**: Task reminder system
- **Sync**: Future cloud sync capability
- **Code Highlighting**: Syntax highlighting for code notes

## 📱 Android Emulator Testing

To test on Android emulator:

1. **Start Emulator**: `emulator -avd your_avd_name`
2. **Build APK**: `cd android_app && buildozer android debug`
3. **Install**: `adb install bin/*.apk`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test: `pytest`
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Create Pull Request

## 📋 Roadmap

- [ ] **Cloud Sync**: Cross-device synchronization
- [ ] **Web Version**: Browser-based interface
- [ ] **Plugins**: Extension system
- [ ] **Themes**: Customizable UI themes
- [ ] **Collaboration**: Shared notes and tasks
- [ ] **Advanced Search**: Full-text search with filters
- [ ] **Backup/Restore**: Automated backup system
- [ ] **Voice Notes**: Audio note recording

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/rijul-kansal/Turbo-notes/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rijul-kansal/Turbo-notes/discussions)
- **Email**: [Create an issue for support](https://github.com/rijul-kansal/Turbo-notes/issues/new)

---

<div align="center">



</div> 
