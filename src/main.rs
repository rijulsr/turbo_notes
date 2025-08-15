#![allow(dead_code)]

use anyhow::Result;
use clap::{Arg, Command};
use std::env;

mod app;
mod notes;
mod ui;
mod config;
mod autostart;

use app::App;
use autostart::setup_autostart;

#[tokio::main]
async fn main() -> Result<()> {
    let matches = Command::new("turbo-notes")
        .version("0.1.0")
        .about("A minimalist cross-platform terminal-based notes application")
        .arg(
            Arg::new("setup-autostart")
                .long("setup-autostart")
                .help("Setup auto-start functionality")
                .action(clap::ArgAction::SetTrue),
        )
        .arg(
            Arg::new("disable-autostart")
                .long("disable-autostart")
                .help("Disable auto-start functionality")
                .action(clap::ArgAction::SetTrue),
        )
        .arg(
            Arg::new("widget")
                .short('w')
                .long("widget")
                .help("Launch quick note widget")
                .action(clap::ArgAction::SetTrue),
        )
        .get_matches();

    if matches.get_flag("setup-autostart") {
        setup_autostart(true)?;
        println!("Auto-start enabled successfully!");
        return Ok(());
    }

    if matches.get_flag("disable-autostart") {
        setup_autostart(false)?;
        println!("Auto-start disabled successfully!");
        return Ok(());
    }

    if matches.get_flag("widget") {
        // Launch widget mode
        let mut app = App::new(true).await?;
        app.run_widget().await?;
        return Ok(());
    }

    // Check if launched on startup
    let is_startup = env::args().any(|arg| arg == "--startup");
    
    if is_startup {
        // Run in background widget mode on startup
        let mut app = App::new(true).await?;
        app.run_background().await?;
    } else {
        // Normal terminal UI mode
        let mut app = App::new(false).await?;
        app.run().await?;
    }

    Ok(())
}
