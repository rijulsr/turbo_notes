# 📱 Turbo Notes Android

The Android version of Turbo Notes - a minimalist note-taking application built with Capacitor and TypeScript.

## ✨ Features

- **📝 Quick Note Capture**: Instant note-taking with a clean, minimalist interface
- **💾 Offline Storage**: All notes stored locally on your device using Capacitor Preferences
- **🌙 Dark Theme**: Easy on the eyes with a beautiful dark interface
- **📱 Native Android Experience**: Built with Capacitor for native performance
- **⚡ Fast & Responsive**: Optimized for smooth scrolling and quick interactions
- **🔍 Visual Note Preview**: See your notes at a glance with formatted previews
- **📅 Smart Date Formatting**: Relative dates (Today, Yesterday, X days ago)
- **✨ Haptic Feedback**: Tactile feedback for actions (on supported devices)

## 🛠️ Development

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Android Studio (for Android development)
- Java JDK 17

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Capacitor CLI:**
   ```bash
   npm install -g @capacitor/cli
   ```

3. **Build the web assets:**
   ```bash
   npm run build
   ```

4. **Add Android platform:**
   ```bash
   npx cap add android
   ```

5. **Sync with native platforms:**
   ```bash
   npx cap sync android
   ```

### Development Workflow

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Build and run on Android:**
   ```bash
   npm run android:dev
   ```

3. **Build for production:**
   ```bash
   npm run android:build
   ```

### Project Structure

```
TurboNotesAndroid/
├── src/
│   └── main.ts          # Main application logic
├── public/
│   ├── manifest.json    # PWA manifest
│   └── icons/          # App icons
├── index.html          # Main HTML file
├── capacitor.config.ts # Capacitor configuration
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies and scripts
```

## 📦 Building APK

### Debug Build

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

The debug APK will be generated at: `android/app/build/outputs/apk/debug/`

### Release Build

1. **Create a keystore (first time only):**
   ```bash
   keytool -genkey -v -keystore release.keystore -alias turbo-notes -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Add keystore info to `android/local.properties`:**
   ```properties
   STORE_FILE=../release.keystore
   STORE_PASSWORD=your_keystore_password
   KEY_ALIAS=turbo-notes
   KEY_PASSWORD=your_key_password
   ```

3. **Build release APK:**
   ```bash
   npm run build
   npx cap sync android
   cd android
   ./gradlew assembleRelease
   ```

The release APK will be generated at: `android/app/build/outputs/apk/release/`

## 🚀 CI/CD with GitHub Actions

The project includes automated CI/CD pipeline that:

1. **Builds APK automatically** on every push to master
2. **Runs tests** and linting
3. **Creates GitHub releases** with downloadable APKs
4. **Supports both debug and release builds**

### Workflow Triggers

- **Push to master**: Creates a release build
- **Pull requests**: Creates a debug build for testing
- **Manual trigger**: Choose between debug/release build

### Required Secrets

For release builds, add these secrets to your GitHub repository:

- `ANDROID_KEYSTORE`: Base64 encoded keystore file
- `KEYSTORE_PASSWORD`: Keystore password
- `KEY_ALIAS`: Key alias name
- `KEY_PASSWORD`: Key password

## 📱 App Architecture

### Data Storage

- **Local Storage**: Uses Capacitor Preferences API for persistent note storage
- **JSON Format**: Notes stored as JSON with metadata (id, content, timestamps)
- **No Network Required**: Fully offline application

### UI Components

- **Main Screen**: Quick note input + notes list
- **Note Editor**: Full-screen modal for editing notes
- **Responsive Design**: Adapts to different screen sizes
- **Material Design**: Follows Android design guidelines

### Key Classes

- **TurboNotesApp**: Main application class handling all logic
- **Note Interface**: TypeScript interface defining note structure
- **Capacitor Plugins**: Native device integration

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `index.html`:

```css
:root {
  --primary-color: #00FFFF;
  --background-color: #000;
  --text-color: #fff;
  --border-color: #333;
}
```

### Adding Features

1. **New UI Components**: Add to `index.html`
2. **Logic Implementation**: Extend `TurboNotesApp` class in `src/main.ts`
3. **Styling**: Add CSS to `index.html` styles section

## 🔧 Troubleshooting

### Common Issues

1. **Build Fails:**
   - Ensure Java JDK 17 is installed
   - Check Android SDK is properly configured
   - Run `npx cap doctor` to diagnose issues

2. **APK Not Installing:**
   - Enable "Unknown sources" in Android settings
   - Check if APK is signed properly for release builds

3. **App Crashes:**
   - Check browser console for errors
   - Ensure all Capacitor plugins are properly installed

### Debug Commands

```bash
# Check Capacitor setup
npx cap doctor

# View native logs
npx cap run android --log

# Clean build
./android/gradlew clean
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/turbo-notes/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/turbo-notes/discussions)

---

Built with ❤️ using Capacitor, TypeScript, and modern web technologies.
