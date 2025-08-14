use anyhow::Result;
use dirs;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub notes_dir: PathBuf,
    pub auto_start: bool,
    pub widget_hotkey: String,
    pub theme: Theme,
    pub max_recent_notes: usize,
    pub backup_enabled: bool,
    pub backup_interval_hours: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Theme {
    pub primary_color: String,
    pub secondary_color: String,
    pub background_color: String,
    pub text_color: String,
    pub accent_color: String,
}

impl Default for Config {
    fn default() -> Self {
        let notes_dir = Self::default_notes_dir();
        
        Self {
            notes_dir,
            auto_start: false,
            widget_hotkey: "Ctrl+Shift+N".to_string(),
            theme: Theme::default(),
            max_recent_notes: 100,
            backup_enabled: true,
            backup_interval_hours: 24,
        }
    }
}

impl Default for Theme {
    fn default() -> Self {
        Self {
            primary_color: "cyan".to_string(),
            secondary_color: "blue".to_string(),
            background_color: "black".to_string(),
            text_color: "white".to_string(),
            accent_color: "yellow".to_string(),
        }
    }
}

impl Config {
    pub fn load() -> Result<Self> {
        let config_path = Self::config_file_path()?;
        
        if config_path.exists() {
            let content = fs::read_to_string(&config_path)?;
            let config: Config = serde_json::from_str(&content)?;
            Ok(config)
        } else {
            let config = Config::default();
            config.save()?;
            Ok(config)
        }
    }

    pub fn save(&self) -> Result<()> {
        let config_path = Self::config_file_path()?;
        
        // Create config directory if it doesn't exist
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let content = serde_json::to_string_pretty(self)?;
        fs::write(&config_path, content)?;
        Ok(())
    }

    fn config_file_path() -> Result<PathBuf> {
        let config_dir = dirs::config_dir()
            .ok_or_else(|| anyhow::anyhow!("Could not find config directory"))?;
        Ok(config_dir.join("turbo-notes").join("config.json"))
    }

    fn default_notes_dir() -> PathBuf {
        if let Some(data_dir) = dirs::data_dir() {
            data_dir.join("turbo-notes")
        } else if let Some(home_dir) = dirs::home_dir() {
            home_dir.join(".turbo-notes")
        } else {
            PathBuf::from("./turbo-notes-data")
        }
    }

    pub fn set_notes_dir(&mut self, path: PathBuf) -> Result<()> {
        self.notes_dir = path;
        self.save()
    }

    pub fn enable_auto_start(&mut self) -> Result<()> {
        self.auto_start = true;
        self.save()
    }

    pub fn disable_auto_start(&mut self) -> Result<()> {
        self.auto_start = false;
        self.save()
    }

    pub fn set_widget_hotkey(&mut self, hotkey: String) -> Result<()> {
        self.widget_hotkey = hotkey;
        self.save()
    }

    pub fn update_theme(&mut self, theme: Theme) -> Result<()> {
        self.theme = theme;
        self.save()
    }

    pub fn backup_dir(&self) -> PathBuf {
        self.notes_dir.join("backups")
    }

    pub fn should_backup(&self) -> bool {
        self.backup_enabled
    }

    pub fn validate(&self) -> Result<()> {
        // Ensure notes directory exists or can be created
        if !self.notes_dir.exists() {
            fs::create_dir_all(&self.notes_dir)?;
        }

        // Validate hotkey format (basic check)
        if self.widget_hotkey.is_empty() {
            return Err(anyhow::anyhow!("Widget hotkey cannot be empty"));
        }

        // Validate backup interval
        if self.backup_interval_hours == 0 {
            return Err(anyhow::anyhow!("Backup interval must be greater than 0"));
        }

        Ok(())
    }
}
