use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use std::path::{Path, PathBuf};
use tokio::fs as async_fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tags: Vec<String>,
}

impl Note {
    pub fn new(content: String) -> Self {
        let now = Utc::now();
        let id = format!("{}", now.timestamp_nanos_opt().unwrap_or(0));
        
        Self {
            id,
            content,
            created_at: now,
            updated_at: now,
            tags: Vec::new(),
        }
    }

    pub fn update_content(&mut self, content: String) {
        self.content = content;
        self.updated_at = Utc::now();
    }

    pub fn add_tag(&mut self, tag: String) {
        if !self.tags.contains(&tag) {
            self.tags.push(tag);
            self.updated_at = Utc::now();
        }
    }

    pub fn remove_tag(&mut self, tag: &str) {
        if let Some(pos) = self.tags.iter().position(|t| t == tag) {
            self.tags.remove(pos);
            self.updated_at = Utc::now();
        }
    }

    pub fn matches_search(&self, query: &str) -> bool {
        let query_lower = query.to_lowercase();
        self.content.to_lowercase().contains(&query_lower)
            || self.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
    }

    pub fn preview(&self, max_length: usize) -> String {
        if self.content.len() <= max_length {
            self.content.clone()
        } else {
            format!("{}...", &self.content[..max_length])
        }
    }
}

pub struct NotesManager {
    pub notes: Vec<Note>,
    notes_dir: PathBuf,
    notes_file: PathBuf,
}

impl NotesManager {
    pub async fn new(notes_dir: &Path) -> Result<Self> {
        let notes_file = notes_dir.join("notes.json");
        
        // Create notes directory if it doesn't exist
        if !notes_dir.exists() {
            async_fs::create_dir_all(notes_dir).await?;
        }

        let notes = if notes_file.exists() {
            Self::load_notes(&notes_file).await?
        } else {
            Vec::new()
        };

        Ok(Self {
            notes,
            notes_dir: notes_dir.to_path_buf(),
            notes_file,
        })
    }

    async fn load_notes(file_path: &Path) -> Result<Vec<Note>> {
        let content = async_fs::read_to_string(file_path).await?;
        let notes: Vec<Note> = serde_json::from_str(&content)?;
        Ok(notes)
    }

    async fn save_notes(&self) -> Result<()> {
        let content = serde_json::to_string_pretty(&self.notes)?;
        async_fs::write(&self.notes_file, content).await?;
        Ok(())
    }

    pub async fn add_note(&mut self, note: Note) -> Result<()> {
        self.notes.insert(0, note); // Insert at the beginning for recent-first order
        self.save_notes().await?;
        Ok(())
    }

    pub async fn update_note(&mut self, index: usize, content: String) -> Result<()> {
        if index < self.notes.len() {
            self.notes[index].update_content(content);
            self.save_notes().await?;
        }
        Ok(())
    }

    pub async fn delete_note(&mut self, index: usize) -> Result<()> {
        if index < self.notes.len() {
            self.notes.remove(index);
            self.save_notes().await?;
        }
        Ok(())
    }

    pub fn search_notes(&self, query: &str) -> Vec<(usize, &Note)> {
        self.notes
            .iter()
            .enumerate()
            .filter(|(_, note)| note.matches_search(query))
            .collect()
    }

    pub fn get_recent_notes(&self, limit: usize) -> Vec<&Note> {
        self.notes.iter().take(limit).collect()
    }

    pub fn get_note_by_id(&self, id: &str) -> Option<&Note> {
        self.notes.iter().find(|note| note.id == id)
    }

    pub fn get_all_tags(&self) -> Vec<String> {
        let mut tags: Vec<String> = self.notes
            .iter()
            .flat_map(|note| note.tags.iter())
            .cloned()
            .collect();
        tags.sort();
        tags.dedup();
        tags
    }

    pub fn get_notes_by_tag(&self, tag: &str) -> Vec<&Note> {
        self.notes
            .iter()
            .filter(|note| note.tags.contains(&tag.to_string()))
            .collect()
    }

    pub fn export_notes(&self, format: ExportFormat) -> Result<String> {
        match format {
            ExportFormat::Json => Ok(serde_json::to_string_pretty(&self.notes)?),
            ExportFormat::Markdown => {
                let mut output = String::new();
                output.push_str("# Turbo Notes Export\n\n");
                
                for note in &self.notes {
                    output.push_str(&format!("## Note ({})\n\n", note.created_at.format("%Y-%m-%d %H:%M:%S")));
                    output.push_str(&note.content);
                    output.push_str("\n\n");
                    
                    if !note.tags.is_empty() {
                        output.push_str("**Tags:** ");
                        output.push_str(&note.tags.join(", "));
                        output.push_str("\n\n");
                    }
                    
                    output.push_str("---\n\n");
                }
                
                Ok(output)
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum ExportFormat {
    Json,
    Markdown,
}
