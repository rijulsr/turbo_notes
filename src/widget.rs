use anyhow::Result;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEventKind},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    backend::CrosstermBackend,
    Terminal,
};
use std::io;
use tokio::time::Duration;

mod app;
mod notes;
mod ui;
mod config;
mod autostart;

use app::App;

#[tokio::main]
async fn main() -> Result<()> {
    // This is the standalone widget binary
    // It provides a quick note-taking interface
    
    let mut app = App::new(true).await?;
    
    // Setup terminal
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let result = run_widget_loop(&mut app, &mut terminal).await;

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

async fn run_widget_loop(app: &mut App, terminal: &mut Terminal<CrosstermBackend<io::Stdout>>) -> Result<()> {
    let mut input = String::new();
    let mut should_quit = false;

    loop {
        terminal.draw(|f| {
            let ui = ui::UI::new();
            ui.draw_widget(f, &input);
        })?;

        if event::poll(Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                if key.kind == KeyEventKind::Press {
                    match key.code {
                        KeyCode::Esc => {
                            should_quit = true;
                        }
                        KeyCode::Enter => {
                            if !input.trim().is_empty() {
                                let note = notes::Note::new(input.clone());
                                app.notes_manager.add_note(note).await?;
                                input.clear();
                                should_quit = true;
                            }
                        }
                        KeyCode::Backspace => {
                            input.pop();
                        }
                        KeyCode::Char(c) => {
                            input.push(c);
                        }
                        _ => {}
                    }
                }
            }
        }

        if should_quit {
            break;
        }
    }

    Ok(())
}
