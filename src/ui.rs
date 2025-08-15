use ratatui::{
    layout::{Alignment, Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{
        Block, Borders, Clear, List, ListItem, ListState, Paragraph, Wrap,
    },
    Frame,
};
use chrono::Local;

use crate::app::AppMode;
use crate::notes::NotesManager;

pub struct UI {
    pub list_state: ListState,
}

impl Default for UI {
    fn default() -> Self {
        Self::new()
    }
}

impl UI {
    pub fn new() -> Self {
        Self {
            list_state: ListState::default(),
        }
    }

    pub fn draw(
        &mut self,
        f: &mut Frame,
        notes_manager: &NotesManager,
        current_input: &str,
        selected_note: Option<usize>,
        mode: &AppMode,
    ) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3),  // Header
                Constraint::Min(0),     // Main content
                Constraint::Length(3),  // Footer/Input
            ])
            .split(f.size());

        // Header
        self.draw_header(f, chunks[0]);

        // Main content
        match mode {
            AppMode::Normal => {
                self.draw_notes_list(f, chunks[1], notes_manager, selected_note);
            }
            AppMode::Insert => {
                self.draw_input_mode(f, chunks[1], current_input, "INSERT MODE - Type your note:");
            }
            AppMode::Search => {
                self.draw_input_mode(f, chunks[1], current_input, "SEARCH MODE - Enter search query:");
            }
            AppMode::Widget => {
                self.draw_widget_content(f, chunks[1], current_input);
            }
        }

        // Footer
        self.draw_footer(f, chunks[2], mode);
    }

    pub fn draw_widget(&self, f: &mut Frame, current_input: &str) {
        // Center the widget on screen
        let area = self.centered_rect(60, 20, f.size());
        
        // Clear the background
        f.render_widget(Clear, area);
        
        let block = Block::default()
            .title(" Quick Note ")
            .borders(Borders::ALL)
            .style(Style::default().fg(Color::Cyan));

        let inner = block.inner(area);
        f.render_widget(block, area);

        // Split into input and instructions
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3),  // Input
                Constraint::Min(0),     // Instructions
            ])
            .split(inner);

        // Input field
        let input = Paragraph::new(current_input)
            .block(
                Block::default()
                    .title("Note")
                    .borders(Borders::ALL)
                    .style(Style::default().fg(Color::White)),
            )
            .wrap(Wrap { trim: true });
        f.render_widget(input, chunks[0]);

        // Instructions
        let instructions = vec![
            Line::from(vec![
                Span::raw("Press "),
                Span::styled("Enter", Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)),
                Span::raw(" to save note"),
            ]),
            Line::from(vec![
                Span::raw("Press "),
                Span::styled("Esc", Style::default().fg(Color::Red).add_modifier(Modifier::BOLD)),
                Span::raw(" to cancel"),
            ]),
        ];

        let help = Paragraph::new(instructions)
            .alignment(Alignment::Center)
            .style(Style::default().fg(Color::Gray));
        f.render_widget(help, chunks[1]);
    }

    fn draw_header(&self, f: &mut Frame, area: Rect) {
        let title = Paragraph::new("🚀 Turbo Notes")
            .style(
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            )
            .alignment(Alignment::Center)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .style(Style::default().fg(Color::White)),
            );
        f.render_widget(title, area);
    }

    fn draw_notes_list(
        &mut self,
        f: &mut Frame,
        area: Rect,
        notes_manager: &NotesManager,
        selected_note: Option<usize>,
    ) {
        if notes_manager.notes.is_empty() {
            let empty_msg = Paragraph::new("No notes yet. Press 'n' to create your first note!")
                .style(Style::default().fg(Color::Gray))
                .alignment(Alignment::Center)
                .block(
                    Block::default()
                        .title(" Notes ")
                        .borders(Borders::ALL)
                        .style(Style::default().fg(Color::White)),
                );
            f.render_widget(empty_msg, area);
            return;
        }

        let items: Vec<ListItem> = notes_manager
            .notes
            .iter()
            .enumerate()
            .map(|(i, note)| {
                let preview = note.preview(60);
                let time = note.created_at.with_timezone(&Local).format("%m/%d %H:%M");
                
                let content = Line::from(vec![
                    Span::styled(
                        format!("[{}] ", time),
                        Style::default().fg(Color::Gray),
                    ),
                    Span::raw(preview),
                ]);

                let style = if Some(i) == selected_note {
                    Style::default().bg(Color::DarkGray).fg(Color::White)
                } else {
                    Style::default()
                };

                ListItem::new(content).style(style)
            })
            .collect();

        let list = List::new(items)
            .block(
                Block::default()
                    .title(" Notes ")
                    .borders(Borders::ALL)
                    .style(Style::default().fg(Color::White)),
            )
            .highlight_style(
                Style::default()
                    .bg(Color::Blue)
                    .add_modifier(Modifier::BOLD),
            );

        if let Some(selected) = selected_note {
            self.list_state.select(Some(selected));
        }

        f.render_stateful_widget(list, area, &mut self.list_state);
    }

    fn draw_input_mode(&self, f: &mut Frame, area: Rect, input: &str, title: &str) {
        let input_widget = Paragraph::new(input)
            .style(Style::default().fg(Color::Yellow))
            .block(
                Block::default()
                    .title(title)
                    .borders(Borders::ALL)
                    .style(Style::default().fg(Color::Yellow)),
            )
            .wrap(Wrap { trim: true });
        f.render_widget(input_widget, area);
    }

    fn draw_widget_content(&self, f: &mut Frame, area: Rect, input: &str) {
        let widget_area = self.centered_rect(70, 50, area);
        
        let input_widget = Paragraph::new(input)
            .style(Style::default().fg(Color::Green))
            .block(
                Block::default()
                    .title(" Quick Note Widget ")
                    .borders(Borders::ALL)
                    .style(Style::default().fg(Color::Green)),
            )
            .wrap(Wrap { trim: true });
        f.render_widget(input_widget, widget_area);
    }

    fn draw_footer(&self, f: &mut Frame, area: Rect, mode: &AppMode) {
        let help_text = match mode {
            AppMode::Normal => {
                vec![
                    Span::raw("Controls: "),
                    Span::styled("n", Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)),
                    Span::raw(":new "),
                    Span::styled("s", Style::default().fg(Color::Blue).add_modifier(Modifier::BOLD)),
                    Span::raw(":search "),
                    Span::styled("w", Style::default().fg(Color::Magenta).add_modifier(Modifier::BOLD)),
                    Span::raw(":widget "),
                    Span::styled("↑↓", Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD)),
                    Span::raw(":navigate "),
                    Span::styled("Enter", Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)),
                    Span::raw(":edit "),
                    Span::styled("Del", Style::default().fg(Color::Red).add_modifier(Modifier::BOLD)),
                    Span::raw(":delete "),
                    Span::styled("q", Style::default().fg(Color::Red).add_modifier(Modifier::BOLD)),
                    Span::raw(":quit"),
                ]
            }
            AppMode::Insert => {
                vec![
                    Span::raw("INSERT MODE - "),
                    Span::styled("Esc", Style::default().fg(Color::Red).add_modifier(Modifier::BOLD)),
                    Span::raw(": save & exit"),
                ]
            }
            AppMode::Search => {
                vec![
                    Span::raw("SEARCH MODE - "),
                    Span::styled("Enter", Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)),
                    Span::raw(": search "),
                    Span::styled("Esc", Style::default().fg(Color::Red).add_modifier(Modifier::BOLD)),
                    Span::raw(": cancel"),
                ]
            }
            AppMode::Widget => {
                vec![
                    Span::raw("WIDGET MODE - "),
                    Span::styled("Enter", Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)),
                    Span::raw(": save "),
                    Span::styled("Esc", Style::default().fg(Color::Red).add_modifier(Modifier::BOLD)),
                    Span::raw(": cancel"),
                ]
            }
        };

        let help = Paragraph::new(Line::from(help_text))
            .alignment(Alignment::Center)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .style(Style::default().fg(Color::White)),
            );
        f.render_widget(help, area);
    }

    fn centered_rect(&self, percent_x: u16, percent_y: u16, r: Rect) -> Rect {
        let popup_layout = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Percentage((100 - percent_y) / 2),
                Constraint::Percentage(percent_y),
                Constraint::Percentage((100 - percent_y) / 2),
            ])
            .split(r);

        Layout::default()
            .direction(Direction::Horizontal)
            .constraints([
                Constraint::Percentage((100 - percent_x) / 2),
                Constraint::Percentage(percent_x),
                Constraint::Percentage((100 - percent_x) / 2),
            ])
            .split(popup_layout[1])[1]
    }
}
