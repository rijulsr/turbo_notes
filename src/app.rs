use anyhow::Result;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEventKind},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    backend::{Backend, CrosstermBackend},
    Terminal,
};
use std::io;
use tokio::time::{sleep, Duration};

use crate::notes::{Note, NotesManager};
use crate::ui::UI;
use crate::config::Config;

pub struct App {
    pub notes_manager: NotesManager,
    pub ui: UI,
    pub config: Config,
    pub widget_mode: bool,
    pub should_quit: bool,
    pub current_input: String,
    pub selected_note: Option<usize>,
    pub mode: AppMode,
}

#[derive(Debug, Clone, PartialEq)]
pub enum AppMode {
    Normal,
    Insert,
    Search,
    Widget,
}

impl App {
    pub async fn new(widget_mode: bool) -> Result<Self> {
        let config = Config::load()?;
        let notes_manager = NotesManager::new(&config.notes_dir).await?;
        let ui = UI::new();

        Ok(Self {
            notes_manager,
            ui,
            config,
            widget_mode,
            should_quit: false,
            current_input: String::new(),
            selected_note: None,
            mode: if widget_mode { AppMode::Widget } else { AppMode::Normal },
        })
    }

    pub async fn run(&mut self) -> Result<()> {
        // Setup terminal
        enable_raw_mode()?;
        let mut stdout = io::stdout();
        execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
        let backend = CrosstermBackend::new(stdout);
        let mut terminal = Terminal::new(backend)?;

        let result = self.run_app(&mut terminal).await;

        // Restore terminal
        disable_raw_mode()?;
        execute!(
            terminal.backend_mut(),
            LeaveAlternateScreen,
            DisableMouseCapture
        )?;
        terminal.show_cursor()?;

        result
    }

    pub async fn run_widget(&mut self) -> Result<()> {
        self.mode = AppMode::Widget;
        
        // Setup terminal for widget
        enable_raw_mode()?;
        let mut stdout = io::stdout();
        execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
        let backend = CrosstermBackend::new(stdout);
        let mut terminal = Terminal::new(backend)?;

        let result = self.run_widget_app(&mut terminal).await;

        // Restore terminal
        disable_raw_mode()?;
        execute!(
            terminal.backend_mut(),
            LeaveAlternateScreen,
            DisableMouseCapture
        )?;
        terminal.show_cursor()?;

        result
    }

    pub async fn run_background(&mut self) -> Result<()> {
        // Run in background, listening for hotkey or system tray interaction
        // For now, just wait for a signal file or timeout
        loop {
            sleep(Duration::from_secs(60)).await;
            
            // Check if should activate widget
            if self.should_show_widget().await? {
                self.run_widget().await?;
            }
            
            if self.should_quit {
                break;
            }
        }
        Ok(())
    }

    async fn run_app<B: Backend>(&mut self, terminal: &mut Terminal<B>) -> Result<()> {
        loop {
            terminal.draw(|f| self.ui.draw(f, &self.notes_manager, &self.current_input, self.selected_note, &self.mode))?;

            if event::poll(Duration::from_millis(100))? {
                if let Event::Key(key) = event::read()? {
                    if key.kind == KeyEventKind::Press {
                        self.handle_key_event(key.code).await?;
                    }
                }
            }

            if self.should_quit {
                break;
            }
        }
        Ok(())
    }

    async fn run_widget_app<B: Backend>(&mut self, terminal: &mut Terminal<B>) -> Result<()> {
        loop {
            terminal.draw(|f| self.ui.draw_widget(f, &self.current_input))?;

            if event::poll(Duration::from_millis(100))? {
                if let Event::Key(key) = event::read()? {
                    if key.kind == KeyEventKind::Press {
                        self.handle_widget_key_event(key.code).await?;
                    }
                }
            }

            if self.should_quit {
                break;
            }
        }
        Ok(())
    }

    async fn handle_key_event(&mut self, key: KeyCode) -> Result<()> {
        match self.mode {
            AppMode::Normal => self.handle_normal_mode(key).await?,
            AppMode::Insert => self.handle_insert_mode(key).await?,
            AppMode::Search => self.handle_search_mode(key).await?,
            AppMode::Widget => self.handle_widget_key_event(key).await?,
        }
        Ok(())
    }

    async fn handle_normal_mode(&mut self, key: KeyCode) -> Result<()> {
        match key {
            KeyCode::Char('q') => self.should_quit = true,
            KeyCode::Char('n') => {
                self.mode = AppMode::Insert;
                self.current_input.clear();
            }
            KeyCode::Char('s') => {
                self.mode = AppMode::Search;
                self.current_input.clear();
            }
            KeyCode::Char('w') => {
                self.run_widget().await?;
            }
            KeyCode::Up => {
                if let Some(selected) = self.selected_note {
                    if selected > 0 {
                        self.selected_note = Some(selected - 1);
                    }
                } else if !self.notes_manager.notes.is_empty() {
                    self.selected_note = Some(self.notes_manager.notes.len() - 1);
                }
            }
            KeyCode::Down => {
                if let Some(selected) = self.selected_note {
                    if selected < self.notes_manager.notes.len() - 1 {
                        self.selected_note = Some(selected + 1);
                    }
                } else if !self.notes_manager.notes.is_empty() {
                    self.selected_note = Some(0);
                }
            }
            KeyCode::Enter => {
                if let Some(selected) = self.selected_note {
                    if selected < self.notes_manager.notes.len() {
                        self.current_input = self.notes_manager.notes[selected].content.clone();
                        self.mode = AppMode::Insert;
                    }
                }
            }
            KeyCode::Delete => {
                if let Some(selected) = self.selected_note {
                    if selected < self.notes_manager.notes.len() {
                        self.notes_manager.delete_note(selected).await?;
                        if self.notes_manager.notes.is_empty() {
                            self.selected_note = None;
                        } else if selected >= self.notes_manager.notes.len() {
                            self.selected_note = Some(self.notes_manager.notes.len() - 1);
                        }
                    }
                }
            }
            _ => {}
        }
        Ok(())
    }

    async fn handle_insert_mode(&mut self, key: KeyCode) -> Result<()> {
        match key {
            KeyCode::Esc => {
                if !self.current_input.trim().is_empty() {
                    let note = Note::new(self.current_input.clone());
                    self.notes_manager.add_note(note).await?;
                }
                self.current_input.clear();
                self.mode = AppMode::Normal;
            }
            KeyCode::Backspace => {
                self.current_input.pop();
            }
            KeyCode::Char(c) => {
                self.current_input.push(c);
            }
            _ => {}
        }
        Ok(())
    }

    async fn handle_search_mode(&mut self, key: KeyCode) -> Result<()> {
        match key {
            KeyCode::Esc => {
                self.current_input.clear();
                self.mode = AppMode::Normal;
            }
            KeyCode::Enter => {
                // Perform search and switch back to normal mode
                self.mode = AppMode::Normal;
            }
            KeyCode::Backspace => {
                self.current_input.pop();
            }
            KeyCode::Char(c) => {
                self.current_input.push(c);
            }
            _ => {}
        }
        Ok(())
    }

    async fn handle_widget_key_event(&mut self, key: KeyCode) -> Result<()> {
        match key {
            KeyCode::Esc => self.should_quit = true,
            KeyCode::Enter => {
                if !self.current_input.trim().is_empty() {
                    let note = Note::new(self.current_input.clone());
                    self.notes_manager.add_note(note).await?;
                    self.current_input.clear();
                    self.should_quit = true;
                }
            }
            KeyCode::Backspace => {
                self.current_input.pop();
            }
            KeyCode::Char(c) => {
                self.current_input.push(c);
            }
            _ => {}
        }
        Ok(())
    }

    async fn should_show_widget(&self) -> Result<bool> {
        // Check for trigger file or other conditions
        // For now, return false to not auto-show
        Ok(false)
    }
}
