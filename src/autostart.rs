use anyhow::Result;
use auto_launch::AutoLaunch;
use std::env;

pub fn setup_autostart(enable: bool) -> Result<()> {
    let exe_path = env::current_exe()?;
    
    #[cfg(target_os = "macos")]
    let auto_launch = AutoLaunch::new(
        "turbo-notes",
        &exe_path.to_string_lossy(),
        false, // hidden = false (not hidden)
        &["--startup"],
    );
    
    #[cfg(not(target_os = "macos"))]
    let auto_launch = AutoLaunch::new(
        "turbo-notes",
        &exe_path.to_string_lossy(),
        &["--startup"],
    );

    if enable {
        auto_launch.enable()?;
        println!("Auto-start enabled for Turbo Notes");
    } else {
        auto_launch.disable()?;
        println!("Auto-start disabled for Turbo Notes");
    }

    Ok(())
}

pub fn is_autostart_enabled() -> Result<bool> {
    let exe_path = env::current_exe()?;
    
    #[cfg(target_os = "macos")]
    let auto_launch = AutoLaunch::new(
        "turbo-notes",
        &exe_path.to_string_lossy(),
        false, // hidden = false (not hidden)
        &["--startup"],
    );
    
    #[cfg(not(target_os = "macos"))]
    let auto_launch = AutoLaunch::new(
        "turbo-notes",
        &exe_path.to_string_lossy(),
        &["--startup"],
    );

    Ok(auto_launch.is_enabled()?)
}

#[cfg(target_os = "linux")]
pub fn setup_linux_autostart(enable: bool) -> Result<()> {
    use std::fs;

    let home_dir = dirs::home_dir()
        .ok_or_else(|| anyhow::anyhow!("Could not find home directory"))?;
    
    let autostart_dir = home_dir.join(".config/autostart");
    let desktop_file = autostart_dir.join("turbo-notes.desktop");

    if enable {
        // Create autostart directory if it doesn't exist
        fs::create_dir_all(&autostart_dir)?;

        let exe_path = env::current_exe()?;
        let desktop_content = format!(
            r#"[Desktop Entry]
Type=Application
Name=Turbo Notes
Comment=Minimalist note-taking application
Exec={} --startup
Icon=text-editor
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
StartupNotify=false
"#,
            exe_path.to_string_lossy()
        );

        fs::write(&desktop_file, desktop_content)?;
        println!("Created autostart entry: {}", desktop_file.display());
    } else {
        // Remove the desktop file if it exists
        if desktop_file.exists() {
            fs::remove_file(&desktop_file)?;
            println!("Removed autostart entry: {}", desktop_file.display());
        }
    }

    Ok(())
}

#[cfg(target_os = "macos")]
pub fn setup_macos_autostart(enable: bool) -> Result<()> {
    use std::fs;

    let home_dir = dirs::home_dir()
        .ok_or_else(|| anyhow::anyhow!("Could not find home directory"))?;
    
    let launch_agents_dir = home_dir.join("Library/LaunchAgents");
    let plist_file = launch_agents_dir.join("com.turbo-notes.plist");

    if enable {
        // Create launch agents directory if it doesn't exist
        fs::create_dir_all(&launch_agents_dir)?;

        let exe_path = env::current_exe()?;
        let plist_content = format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.turbo-notes</string>
    <key>ProgramArguments</key>
    <array>
        <string>{}</string>
        <string>--startup</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
"#,
            exe_path.to_string_lossy()
        );

        fs::write(&plist_file, plist_content)?;

        // Load the launch agent
        std::process::Command::new("launchctl")
            .args(&["load", plist_file.to_str().unwrap()])
            .output()?;

        println!("Created autostart entry: {}", plist_file.display());
    } else {
        // Unload and remove the plist file
        if plist_file.exists() {
            std::process::Command::new("launchctl")
                .args(&["unload", plist_file.to_str().unwrap()])
                .output()?;

            fs::remove_file(&plist_file)?;
            println!("Removed autostart entry: {}", plist_file.display());
        }
    }

    Ok(())
}

#[cfg(target_os = "windows")]
pub fn setup_windows_autostart(enable: bool) -> Result<()> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use winapi::um::winreg::{RegCloseKey, RegDeleteValueW, RegOpenKeyExW, RegSetValueExW, HKEY_CURRENT_USER};
    use winapi::um::winnt::{REG_SZ, KEY_SET_VALUE, KEY_QUERY_VALUE};

    unsafe {
        let subkey = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\0"
            .encode_utf16()
            .collect::<Vec<u16>>();
        
        let value_name = "TurboNotes\0"
            .encode_utf16()
            .collect::<Vec<u16>>();

        let mut hkey = std::ptr::null_mut();
        let result = RegOpenKeyExW(
            HKEY_CURRENT_USER,
            subkey.as_ptr(),
            0,
            KEY_SET_VALUE | KEY_QUERY_VALUE,
            &mut hkey,
        );

        if result != 0 {
            return Err(anyhow::anyhow!("Failed to open registry key"));
        }

        if enable {
            let exe_path = env::current_exe()?;
            let mut exe_with_args = format!("{} --startup", exe_path.to_string_lossy());
            exe_with_args.push('\0');
            let exe_wide: Vec<u16> = exe_with_args.encode_utf16().collect();

            let result = RegSetValueExW(
                hkey,
                value_name.as_ptr(),
                0,
                REG_SZ,
                exe_wide.as_ptr() as *const u8,
                (exe_wide.len() * 2) as u32,
            );

            if result != 0 {
                RegCloseKey(hkey);
                return Err(anyhow::anyhow!("Failed to set registry value"));
            }

            println!("Added Turbo Notes to Windows startup");
        } else {
            RegDeleteValueW(hkey, value_name.as_ptr());
            println!("Removed Turbo Notes from Windows startup");
        }

        RegCloseKey(hkey);
    }

    Ok(())
}

// Cross-platform autostart setup that uses the appropriate method for each OS
pub fn setup_platform_autostart(enable: bool) -> Result<()> {
    #[cfg(target_os = "linux")]
    return setup_linux_autostart(enable);
    
    #[cfg(target_os = "macos")]
    return setup_macos_autostart(enable);
    
    #[cfg(target_os = "windows")]
    return setup_windows_autostart(enable);
    
    #[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
    {
        // Fallback to auto-launch crate for other platforms
        setup_autostart(enable)
    }
}
