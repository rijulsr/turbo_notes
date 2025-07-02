#!/usr/bin/env python3
"""
Turbo Notes - A secure, minimalist terminal-based note and task manager
"""

import os
import json
import sys
import getpass
from datetime import datetime, date
from pathlib import Path
from typing import Dict, List, Optional, Any

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich.text import Text
from rich.layout import Layout
from rich.live import Live
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import keyring
import base64

class TurboNotes:
    def __init__(self):
        self.console = Console()
        self.app_name = "turbo-notes"
        self.data_dir = Path.home() / ".turbo-notes"
        self.data_file = self.data_dir / "notes_data.enc"
        self.salt_file = self.data_dir / "salt.key"
        
        # Ensure data directory exists
        self.data_dir.mkdir(exist_ok=True)
        
        self.cipher_suite = None
        self.data = {
            "notes": [],
            "categories": ["Personal", "Work", "Ideas"],
            "last_accessed": None,
            "password_enabled": None
        }
        
    def generate_key_from_password(self, password: str) -> bytes:
        """Generate encryption key from password using PBKDF2"""
        # Get or create salt
        if self.salt_file.exists():
            with open(self.salt_file, 'rb') as f:
                salt = f.read()
        else:
            salt = os.urandom(16)
            with open(self.salt_file, 'wb') as f:
                f.write(salt)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key
    
    def setup_encryption(self) -> bool:
        """Setup encryption with password, or allow user to skip password protection"""
        try:
            stored_password = keyring.get_password(self.app_name, "master_password")
            # Check if user has already chosen not to use a password
            if self.data.get("password_enabled") is False:
                self.cipher_suite = None
                return True
            if stored_password is None:
                # First time setup or after disabling password
                self.console.print("\n[bold blue]Welcome to Turbo Notes![/bold blue]")
                set_pw = Prompt.ask("Do you want to set a password for your notes and tasks? (y/n, default: n)", choices=["y", "n"], default="n")
                if set_pw.lower() == "y":
                    self.console.print("Set up your master password for encryption:")
                    while True:
                        password = getpass.getpass("Enter master password: ")
                        confirm_password = getpass.getpass("Confirm master password: ")
                        if password == confirm_password and len(password) >= 6:
                            keyring.set_password(self.app_name, "master_password", password)
                            key = self.generate_key_from_password(password)
                            self.cipher_suite = Fernet(key)
                            self.data["password_enabled"] = True
                            self.save_data()
                            self.console.print("[green]✓ Password set successfully![/green]")
                            return True
                        elif len(password) < 6:
                            self.console.print("[red]Password must be at least 6 characters long.[/red]")
                        else:
                            self.console.print("[red]Passwords don't match. Try again.[/red]")
                else:
                    # User chose not to set a password; operate in unencrypted mode
                    self.cipher_suite = None
                    self.data["password_enabled"] = False
                    self.save_data()
                    return True
            else:
                # Verify existing password
                password = getpass.getpass("Enter master password: ")
                if password == stored_password:
                    key = self.generate_key_from_password(password)
                    self.cipher_suite = Fernet(key)
                    self.data["password_enabled"] = True
                    self.save_data()
                    return True
                else:
                    self.console.print("[red]Incorrect password![/red]")
                    return False
        except Exception as e:
            self.console.print(f"[red]Encryption setup failed: {e}[/red]")
            return False
    
    def load_data(self) -> bool:
        """Load and decrypt data from file, or load unencrypted if password is disabled"""
        if not self.data_file.exists():
            return True  # First run, no data to load
        try:
            stored_password = keyring.get_password(self.app_name, "master_password")
            if stored_password is None:
                # Load unencrypted
                with open(self.data_file, 'r') as f:
                    self.data = json.load(f)
                return True
            else:
                with open(self.data_file, 'rb') as f:
                    encrypted_data = f.read()
                decrypted_data = self.cipher_suite.decrypt(encrypted_data)
                self.data = json.loads(decrypted_data.decode())
                return True
        except Exception as e:
            self.console.print(f"[red]Failed to load data: {e}[/red]")
            return False
    
    def save_data(self):
        """Encrypt and save data to file, or save unencrypted if password is disabled"""
        try:
            self.data["last_accessed"] = datetime.now().isoformat()
            json_data = json.dumps(self.data, indent=2)
            stored_password = keyring.get_password(self.app_name, "master_password")
            if stored_password is None:
                # Save unencrypted
                with open(self.data_file, 'w') as f:
                    f.write(json_data)
            else:
                encrypted_data = self.cipher_suite.encrypt(json_data.encode())
                with open(self.data_file, 'wb') as f:
                    f.write(encrypted_data)
        except Exception as e:
            self.console.print(f"[red]Failed to save data: {e}[/red]")
    
    def add_note(self, title: str, content: str):
        """Add a new note"""
        note = {
            "id": len(self.data["notes"]) + 1,
            "title": title,
            "content": content,
            "created": datetime.now().isoformat(),
            "modified": datetime.now().isoformat()
        }
        self.data["notes"].append(note)
        self.save_data()
    
    def display_dashboard(self):
        """Display the main dashboard (notes only)"""
        self.console.clear()
        header = Panel(
            f"[bold blue]🚀 Turbo Notes[/bold blue] - [dim]{datetime.now().strftime('%A, %B %d, %Y')}[/dim]",
            style="blue"
        )
        self.console.print(header)
        stats_text = f"📝 {len(self.data['notes'])} Notes"
        self.console.print(f"\n{stats_text}\n")
        if self.data["notes"]:
            self.console.print("[bold green]📄 RECENT NOTES:[/bold green]")
            recent_notes = sorted(self.data["notes"], key=lambda x: x["modified"], reverse=True)[:3]
            for note in recent_notes:
                note_panel = Panel(
                    f"[bold]{note['title']}[/bold]\n\n{note['content']}",
                    title=f"Note #{note['id']}",
                    subtitle=note['created'][:10],
                    border_style="green",
                    padding=(0, 1)
                )
                self.console.print(note_panel)
            self.console.print()
    
    def interactive_menu(self):
        """Main interactive menu (notes only)"""
        while True:
            self.display_dashboard()
            self.console.print("[bold]Quick Actions:[/bold]")
            self.console.print("1. 📝 Add Note")
            self.console.print("2. 📚 View All Notes")
            self.console.print("3. 🗑️  Delete Note")
            self.console.print("4. 🔍 Search")
            self.console.print("5. ⚙️  Settings")
            self.console.print("6. 🚪 Exit")
            choice = Prompt.ask("\nSelect an option", choices=["1", "2", "3", "4", "5", "6"])
            if choice == "1":
                self.add_note_interactive()
            elif choice == "2":
                self.view_notes()
            elif choice == "3":
                self.delete_note_interactive()
            elif choice == "4":
                self.search_interactive()
            elif choice == "5":
                self.settings_menu()
            elif choice == "6":
                self.console.print("\n[bold blue]👋 See you later![/bold blue]")
                break
    
    def add_note_interactive(self):
        """Interactive note addition"""
        self.console.print("\n[bold blue]📝 Add New Note[/bold blue]")
        title = Prompt.ask("Note title")
        content = Prompt.ask("Note content (press Enter for multiline, 'END' to finish)")
        
        if content.strip():
            lines = [content]
        else:
            self.console.print("Enter your note content (type 'END' on a new line to finish):")
            lines = []
            while True:
                line = input()
                if line.strip() == "END":
                    break
                lines.append(line)
        
        content = "\n".join(lines)
        
        self.add_note(title, content)
        self.console.print("[green]✓ Note added successfully![/green]")
        input("\nPress Enter to continue...")
    
    def view_notes(self):
        """Display all notes"""
        self.console.clear()
        self.console.print("\n[bold blue]📚 All Notes[/bold blue]\n")
        
        if not self.data["notes"]:
            self.console.print("[dim]No notes found.[/dim]")
            input("\nPress Enter to continue...")
            return
        
        for note in self.data["notes"]:
            # Show full note content without truncation
            panel_content = f"[bold]{note['title']}[/bold]\n\n{note['content']}"
            panel = Panel(
                panel_content,
                title=f"Note #{note['id']}",
                subtitle=f"Created: {note['created'][:10]} | Modified: {note['modified'][:10]}",
                border_style="green"
            )
            self.console.print(panel)
        
        input("\nPress Enter to continue...")
    
    def delete_note_interactive(self):
        """Delete a note interactively"""
        self.console.print("\n[bold blue]🗑️  Delete Note[/bold blue]")
        if not self.data["notes"]:
            self.console.print("[dim]No notes to delete.[/dim]")
        else:
            for note in self.data["notes"]:
                self.console.print(f"{note['id']}. {note['title']}")
            try:
                note_id = int(Prompt.ask("\nEnter note ID to delete"))
                self.data["notes"] = [n for n in self.data["notes"] if n["id"] != note_id]
                self.save_data()
                self.console.print("[green]✓ Note deleted![/green]")
            except ValueError:
                self.console.print("[red]Invalid note ID.[/red]")
        input("\nPress Enter to continue...")
    
    def search_interactive(self):
        """Search notes only"""
        self.console.print("\n[bold blue]🔍 Search[/bold blue]")
        query = Prompt.ask("Search term").lower()
        matching_notes = []
        for note in self.data["notes"]:
            if (query in note["title"].lower() or query in note["content"].lower()):
                matching_notes.append(note)
        self.console.print(f"\n[bold]Search results for '{query}':[/bold]\n")
        if matching_notes:
            self.console.print("[bold green]📄 Notes:[/bold green]")
            for note in matching_notes:
                self.console.print(f"  • {note['title']}")
        else:
            self.console.print("[dim]No results found.[/dim]")
        input("\nPress Enter to continue...")
    
    def settings_menu(self):
        """Settings and configuration menu (notes only)"""
        self.console.print("\n[bold blue]⚙️  Settings[/bold blue]")
        self.console.print("1. Add Category")
        self.console.print("2. Export Notes")
        self.console.print("3. Data Statistics")
        self.console.print("4. Password & Security")
        self.console.print("5. Back to Main Menu")
        choice = Prompt.ask("\nSelect option", choices=["1", "2", "3", "4", "5"])
        if choice == "1":
            new_category = Prompt.ask("New category name")
            if new_category not in self.data["categories"]:
                self.data["categories"].append(new_category)
                self.save_data()
                self.console.print(f"[green]✓ Category '{new_category}' added![/green]")
            else:
                self.console.print("[red]Category already exists.[/red]")
        elif choice == "2":
            export_file = self.data_dir / f"turbo_notes_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(export_file, 'w') as f:
                json.dump({"notes": self.data["notes"]}, f, indent=2)
            self.console.print(f"[green]✓ Notes exported to {export_file}[/green]")
        elif choice == "3":
            stats = f"""
📊 Data Statistics:
  • Total Notes: {len(self.data['notes'])}
  • Categories: {len(self.data['categories'])}
  • Last Accessed: {self.data.get('last_accessed', 'Never')}
            """
            self.console.print(stats)
        elif choice == "4":
            self.password_security_menu()
        if choice != "5":
            input("\nPress Enter to continue...")

    def password_security_menu(self):
        """Password & Security submenu for changing/disabling/enabling password"""
        self.console.print("\n[bold blue]🔑 Password & Security[/bold blue]")
        self.console.print("1. Change Password")
        self.console.print("2. Disable Password (store data unencrypted)")
        self.console.print("3. Enable Password (encrypt data)")
        self.console.print("4. Back to Settings")
        choice = Prompt.ask("\nSelect option", choices=["1", "2", "3", "4"])
        if choice == "1":
            self.change_password()
        elif choice == "2":
            self.disable_password()
        elif choice == "3":
            self.enable_password()
        # '4' just returns

    def change_password(self):
        """Change the master password and re-encrypt data"""
        stored_password = keyring.get_password(self.app_name, "master_password")
        if stored_password is None:
            self.console.print("[red]No password is currently set. Please enable password first.[/red]")
            return
        old_password = getpass.getpass("Enter current password: ")
        if old_password != stored_password:
            self.console.print("[red]Incorrect password.[/red]")
            return
        while True:
            new_password = getpass.getpass("Enter new password: ")
            confirm_password = getpass.getpass("Confirm new password: ")
            if new_password == confirm_password and len(new_password) >= 6:
                # Re-encrypt data with new password
                key = self.generate_key_from_password(new_password)
                self.cipher_suite = Fernet(key)
                keyring.set_password(self.app_name, "master_password", new_password)
                self.save_data()
                self.console.print("[green]✓ Password changed successfully![/green]")
                return
            elif len(new_password) < 6:
                self.console.print("[red]Password must be at least 6 characters long.[/red]")
            else:
                self.console.print("[red]Passwords don't match. Try again.[/red]")

    def disable_password(self):
        """Remove password protection and store data unencrypted"""
        stored_password = keyring.get_password(self.app_name, "master_password")
        if stored_password is None:
            self.console.print("[yellow]Password is already disabled.[/yellow]")
            return
        password = getpass.getpass("Enter current password to disable: ")
        if password != stored_password:
            self.console.print("[red]Incorrect password.[/red]")
            return
        # Save data unencrypted
        self.save_data_unencrypted()
        keyring.delete_password(self.app_name, "master_password")
        if self.salt_file.exists():
            self.salt_file.unlink()
        self.cipher_suite = None
        self.data["password_enabled"] = False
        self.save_data_unencrypted()
        self.console.print("[green]✓ Password disabled. Data is now stored unencrypted![/green]")

    def enable_password(self):
        """Enable password protection and encrypt data"""
        stored_password = keyring.get_password(self.app_name, "master_password")
        if stored_password is not None:
            self.console.print("[yellow]Password is already enabled.[/yellow]")
            return
        while True:
            password = getpass.getpass("Set new master password: ")
            confirm_password = getpass.getpass("Confirm new password: ")
            if password == confirm_password and len(password) >= 6:
                keyring.set_password(self.app_name, "master_password", password)
                key = self.generate_key_from_password(password)
                self.cipher_suite = Fernet(key)
                self.data["password_enabled"] = True
                self.save_data()
                self.console.print("[green]✓ Password enabled and data encrypted![/green]")
                return
            elif len(password) < 6:
                self.console.print("[red]Password must be at least 6 characters long.[/red]")
            else:
                self.console.print("[red]Passwords don't match. Try again.[/red]")

    def save_data_unencrypted(self):
        """Save data unencrypted to file"""
        try:
            self.data["last_accessed"] = datetime.now().isoformat()
            json_data = json.dumps(self.data, indent=2)
            with open(self.data_file, 'w') as f:
                f.write(json_data)
        except Exception as e:
            self.console.print(f"[red]Failed to save data: {e}[/red]")

    def run(self):
        """Main application entry point"""
        if not self.setup_encryption():
            return False
            
        if not self.load_data():
            return False
            
        self.interactive_menu()
        return True

@click.command()
@click.option('--add-note', '-n', help='Add a quick note')
@click.option('--dashboard', '-d', is_flag=True, help='Show dashboard and exit')
def main(add_note, dashboard):
    """Turbo Notes - Secure Terminal Note Manager"""
    app = TurboNotes()
    app.load_data()
    if not app.setup_encryption():
        sys.exit(1)
    if not (add_note or dashboard):
        if not app.load_data():
            sys.exit(1)
    if add_note:
        app.add_note("Quick Note", add_note)
        app.console.print("[green]✓ Note added![/green]")
        return
    if dashboard:
        app.display_dashboard()
        return
    app.run()

if __name__ == "__main__":
    main() 