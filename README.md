# 🚀 Turbo Notes - Secure Terminal Note & Task Manager

[![🚀 Turbo Notes CI/CD](https://github.com/rijulsr/turbo_notes/actions/workflows/ci.yml/badge.svg)](https://github.com/rijulsr/turbo_notes/actions/workflows/ci.yml)
[![⚡ Quick Tests](https://github.com/rijulsr/turbo_notes/actions/workflows/quick-test.yml/badge.svg)](https://github.com/rijulsr/turbo_notes/actions/workflows/quick-test.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

A **secure**, **minimalist**, and **addictive** productivity application that combines note-taking and task management with a beautiful terminal interface.

## ✨ Features

### 🎯 **Minimalist Design**
- **🚀 Quick Actions**: Single-key shortcuts for common tasks
- **📱 Streamlined Interface**: Clean, uncluttered dashboard
- **⚡ Instant Feedback**: Immediate visual confirmation for all actions
- **🎨 Beautiful UI**: Rich terminal interface with emojis and colors

### 🔥 **Addictive Features**
- **🔥 Daily Streaks**: Track your productivity streak with motivational emojis
- **🏆 Best Streak Tracking**: Challenge yourself to beat your record
- **📊 Progress Stats**: Visual progress indicators and completion rates
- **🎯 Gamification**: Achievement-style feedback for completed tasks

### 🖥️ **Core Functionality**
- **🔐 Encryption**: Optional password protection with PBKDF2 + Fernet encryption
- **📝 Rich Notes**: Full-featured note management with search
- **✅ Smart Tasks**: Priority levels, due dates, and completion tracking
- **🗑️ Delete Functionality**: Easy deletion of notes and tasks
- **🔍 Search**: Find notes and tasks quickly across all content
- **💾 Local Storage**: Secure local data storage with JSON format
- **🔄 Real-time Updates**: Instant updates across all features

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ 
- Git

### 📥 Installation

```bash
git clone https://github.com/rijulsr/turbo_notes.git
cd turbo_notes
pip install -r requirements.txt
python turbo_notes.py
```

## 🎯 Usage

### Quick Actions (New!)
```bash
# Interactive mode with quick actions
python turbo_notes.py

# Quick commands
python turbo_notes.py --add-note "Meeting notes from today"
python turbo_notes.py --add-task "Finish project documentation"
python turbo_notes.py --list-tasks
python turbo_notes.py --dashboard
```

### Interactive Quick Actions
- **n** - 📝 Quick Note (add note with minimal prompts)
- **t** - ✅ Quick Task (add task with priority)
- **c** - ✔️ Complete Task (mark tasks as done)
- **d** - 🗑️ Delete Item (remove notes or tasks)
- **s** - 🔍 Search (find content quickly)
- **v** - 👁️ View All (detailed views)
- **q** - 🚪 Quit

### Key Features
1. **🔥 Streak Tracking**: Build momentum with daily streaks
2. **📊 Dashboard**: View stats, overdue tasks, and recent notes
3. **🗑️ Delete Management**: Easy deletion with confirmation
4. **📝 Notes Management**: Create, view, and delete notes
5. **✅ Task Management**: Add tasks, set priorities, mark complete
6. **🔍 Search**: Find notes and tasks quickly
7. **📈 Statistics**: Track your productivity streaks and usage

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

### 🔒 **Security** (Every Push)
- **Bandit** security scanning
- **Safety** vulnerability checks
- **Security reports** generation

### 📬 **Notifications**
- **GitHub status checks**
- **Automated quality gates**

## 📊 Project Structure

```
Turbo-notes/
├── .github/
│   └── workflows/           # CI/CD pipelines
│       ├── ci.yml          # Main CI/CD pipeline
│       └── quick-test.yml  # Fast validation
├── turbo_notes.py          # Main terminal application
├── setup.py               # Installation script
├── setup_complete.py      # Complete setup script
├── requirements.txt       # Python dependencies
├── .isort.cfg            # Import sorting config
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🔧 Development

### Running Tests
```bash
# All tests
pytest

# With coverage
pytest --cov=turbo_notes --cov-report=html

# Specific test file
pytest tests/test_terminal_integration.py -v
```

### Code Quality
```bash
# Format code
black turbo_notes.py

# Sort imports  
isort turbo_notes.py

# Lint
flake8 turbo_notes.py --max-line-length=100

# Security check
bandit -r turbo_notes.py
```

## 🛠️ Configuration

### Terminal App Settings
- **Password Protection**: Enable/disable encryption
- **Categories**: Customize note categories
- **Export**: JSON export functionality
- **Statistics**: Usage tracking and streaks
- **Data Storage**: Local JSON files with encryption

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test: `pytest`
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Create Pull Request

## 📋 Roadmap

- [x] **🗑️ Delete Functionality**: Easy deletion of notes and tasks
- [x] **🚀 Quick Actions**: Single-key shortcuts for common tasks
- [x] **🔥 Streak Tracking**: Daily productivity streaks
- [x] **📱 Minimalist Design**: Streamlined interface
- [ ] **Cloud Sync**: Cross-device synchronization
- [ ] **Web Version**: Browser-based interface
- [ ] **Plugins**: Extension system
- [ ] **Themes**: Customizable terminal themes
- [ ] **Collaboration**: Shared notes and tasks
- [ ] **Advanced Search**: Full-text search with filters
- [ ] **Backup/Restore**: Automated backup system
- [ ] **Voice Notes**: Audio note recording
- [ ] **Markdown Support**: Rich text formatting
- [ ] **Tags System**: Advanced categorization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/rijulsr/turbo_notes/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rijulsr/turbo_notes/discussions)
- **Email**: [Create an issue for support](https://github.com/rijulsr/turbo_notes/issues/new)

---

<div align="center">

**Made with ❤️ for productivity enthusiasts**

</div> 
