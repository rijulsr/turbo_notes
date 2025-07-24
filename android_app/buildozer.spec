[app]

# (str) Title of your application
title = Turbo Notes

# (str) Package name
package.name = turbo_notes

# (str) Package domain (needed for android/ios packaging)
package.domain = com.turbo.notes

# (str) Source code where the main.py live
source.dir = .

# (list) Source files to include (let empty to include all the files)
source.include_exts = py,png,jpg,kv,atlas,json

# (str) Application versioning (method 1)
version = 1.0.0

# (list) Application requirements  
requirements = python3,kivy==2.3.0,kivymd,pillow,pygments,plyer,android,pyjnius

# (str) Presplash of the application
#presplash.filename = %(source.dir)s/data/presplash.png

# (str) Icon of the application
#icon.filename = %(source.dir)s/data/icon.png

# (str) Supported orientation (one of landscape, sensorLandscape, portrait or all)
orientation = portrait

# (bool) Indicate if the application should be fullscreen or not
fullscreen = 0

# (list) Permissions
android.permissions = INTERNET,WRITE_EXTERNAL_STORAGE,READ_EXTERNAL_STORAGE,WAKE_LOCK,VIBRATE

# (str) Android entry point, default is ok for Kivy-based app
#android.entrypoint = org.kivy.android.PythonActivity

# (str) Full name including package path of the Java class that implements Android Activity
#android.activity_class_name = org.kivy.android.PythonActivity

# (str) Full name including package path of the Java class that implements Python Service
#android.service_class_name = org.kivy.android.PythonService

# (list) Android application meta-data to set (key=value format)
android.meta_data = com.google.android.gms.version=@integer/google_play_services_version

# (str) Android logcat filters to use
android.logcat_filters = *:S python:D

# (bool) Copy library instead of making a libpymodules.so
android.copy_libs = 1

# (str) The Android arch to build for, choices: armeabi-v7a, arm64-v8a, x86, x86_64
android.archs = arm64-v8a, armeabi-v7a

# (int) Target Android API, should be as high as possible.
android.api = 33

# (int) Minimum API your APK will support.
android.minapi = 24

# (str) Android NDK version to use (25+ required, using system NDK)
android.ndk = 26b

# (int) Android SDK version to use
android.sdk = 33

# (str) Android SDK directory (if empty, it will be automatically downloaded.)
#android.sdk_path = /usr/local/lib/android/sdk

# (str) Android NDK directory (if empty, it will be automatically downloaded.)
#android.ndk_path = /usr/local/lib/android/sdk/ndk-bundle

# (bool) Use --private data storage (True) or --dir public storage (False)
android.private_storage = True

# (bool) Automatically accept Android SDK license agreements
android.accept_sdk_license = True

# (str) Android additional aab/apk to add
#android.add_aars = 

# (str) Android additional libraries to add
#android.add_libs = 

# (list) Gradle dependencies to add
#android.gradle_dependencies = com.google.android.material:material:1.8.0

# (bool) Enable AndroidX support. Enable when 'android.gradle_dependencies'
# contains an 'androidx' package, or any package from Kotlin source.
#android.enable_androidx = True

# (str) Bootstrap to use for android builds
bootstrap = sdl2

# (str) The directory in which python-for-android should look for your own build recipes (if any)
#p4a.local_recipes = 

# (str) Filename to the hook for p4a
#p4a.hook = 

# (str) Bootstrap to use for android builds
# p4a.bootstrap = sdl2

# (int) port number to specify an explicit --port= p4a argument (eg for bootstrap flask)
#p4a.port = 

# Control passing the --use-setup-py vs --ignore-setup-py to p4a
# "in the future" --use-setup-py is going to be the default behaviour in p4a, right now it is not
# Setting this to false will pass --ignore-setup-py, true will pass --use-setup-py
# NOTE: this is general setuptools integration, having pyproject.toml is enough, no need to generate
# setup.py if you're using Poetry, but you need to add "toml" to source.include_exts.
#p4a.setup_py = false

# (str) extra command line arguments to pass when invoking pythonforandroid.toolchain
p4a.extra_args = --ignore-setup-py

[buildozer]

# (int) Log level (0 = error only, 1 = info, 2 = debug (with command output))
log_level = 2

# (int) Display warning if buildozer is run as root (0 = False, 1 = True)
warn_on_root = 1

# (str) Path to build artifact storage, absolute or relative to spec file
build_dir = ./.buildozer

# (str) Path to build output (i.e. .apk, .ipa) storage
bin_dir = ./bin 