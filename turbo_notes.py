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
            "tasks": [],
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
    
    def add_task(self, title: str, description: str = "", priority: str = "Medium", 
                 due_date: str = None, category: str = "Personal"):
        """Add a new task"""
        task = {
            "id": len(self.data["tasks"]) + 1,
            "title": title,
            "description": description,
            "priority": priority,
            "due_date": due_date,
            "category": category,
            "completed": False,
            "created": datetime.now().isoformat(),
            "modified": datetime.now().isoformat()
        }
        self.data["tasks"].append(task)
        self.save_data()
    
    def display_dashboard(self):
        """Display the main dashboard"""
        self.console.clear()
        
        # Header
        header = Panel(
            f"[bold blue]🚀 Turbo Notes[/bold blue] - [dim]{datetime.now().strftime('%A, %B %d, %Y')}[/dim]",
            style="blue"
        )
        self.console.print(header)
        
        # Quick stats
        pending_tasks = [t for t in self.data["tasks"] if not t["completed"]]
        overdue_tasks = []
        
        for task in pending_tasks:
            if task.get("due_date"):
                try:
                    due = datetime.fromisoformat(task["due_date"]).date()
                    if due < date.today():
                        overdue_tasks.append(task)
                except:
                    pass
        
        stats_text = f"📝 {len(self.data['notes'])} Notes | ✅ {len(pending_tasks)} Pending Tasks"
        if overdue_tasks:
            stats_text += f" | ⚠️  {len(overdue_tasks)} Overdue"
        
        self.console.print(f"\n{stats_text}\n")
        
        # Display urgent/overdue tasks
        if overdue_tasks:
            self.console.print("[bold red]⚠️  OVERDUE TASKS:[/bold red]")
            for task in overdue_tasks[:3]:  # Show only first 3
                self.console.print(f"  • [red]{task['title']}[/red] (Due: {task['due_date']})")
            self.console.print()
        
        # Display today's tasks
        today_tasks = []
        for task in pending_tasks:
            if task.get("due_date"):
                try:
                    due = datetime.fromisoformat(task["due_date"]).date()
                    if due == date.today():
                        today_tasks.append(task)
                except:
                    pass
        
        if today_tasks:
            self.console.print("[bold yellow]📅 TODAY'S TASKS:[/bold yellow]")
            for task in today_tasks:
                priority_color = {"High": "red", "Medium": "yellow", "Low": "green"}.get(task["priority"], "white")
                self.console.print(f"  • [{priority_color}]{task['title']}[/{priority_color}] ({task['priority']} priority)")
            self.console.print()
        
        # Display recent notes with full content
        if self.data["notes"]:
            self.console.print("[bold green]📄 RECENT NOTES:[/bold green]")
            recent_notes = sorted(self.data["notes"], key=lambda x: x["modified"], reverse=True)[:3]
            for note in recent_notes:
                # Show full note content in a panel
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
        """Main interactive menu"""
        while True:
            self.display_dashboard()
            
            self.console.print("[bold]Quick Actions:[/bold]")
            self.console.print("1. 📝 Add Note")
            self.console.print("2. ✅ Add Task")
            self.console.print("3. 📋 View All Tasks")
            self.console.print("4. 📚 View All Notes")
            self.console.print("5. ✔️  Mark Task Complete")
            self.console.print("6. 🗑️  Delete Item")
            self.console.print("7. 🔍 Search")
            self.console.print("8. ⚙️  Settings")
            self.console.print("9. 🚪 Exit")
            
            choice = Prompt.ask("\nSelect an option", choices=["1", "2", "3", "4", "5", "6", "7", "8", "9"])
            
            if choice == "1":
                self.add_note_interactive()
            elif choice == "2":
                self.add_task_interactive()
            elif choice == "3":
                self.view_tasks()
            elif choice == "4":
                self.view_notes()
            elif choice == "5":
                self.mark_task_complete()
            elif choice == "6":
                self.delete_item_interactive()
            elif choice == "7":
                self.search_interactive()
            elif choice == "8":
                self.settings_menu()
            elif choice == "9":
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
    
    def add_task_interactive(self):
        """Interactive task addition"""
        self.console.print("\n[bold blue]✅ Add New Task[/bold blue]")
        title = Prompt.ask("Task title")
        description = Prompt.ask("Description (optional)", default="")
        priority = Prompt.ask("Priority", choices=["Low", "Medium", "High"], default="Medium")
        
        has_due_date = Confirm.ask("Set due date?")
        due_date = None
        if has_due_date:
            due_date_str = Prompt.ask("Due date (YYYY-MM-DD)", default=date.today().isoformat())
            try:
                # Validate date format
                datetime.fromisoformat(due_date_str)
                due_date = due_date_str
            except:
                self.console.print("[red]Invalid date format, skipping due date[/red]")
        
        category = Prompt.ask("Category", choices=self.data["categories"], default="Personal")
        
        self.add_task(title, description, priority, due_date, category)
        self.console.print("[green]✓ Task added successfully![/green]")
        input("\nPress Enter to continue...")
    
    def view_tasks(self):
        """Display all tasks in a table"""
        self.console.clear()
        self.console.print("\n[bold blue]📋 All Tasks[/bold blue]\n")
        
        if not self.data["tasks"]:
            self.console.print("[dim]No tasks found.[/dim]")
            input("\nPress Enter to continue...")
            return
        
        table = Table(show_header=True, header_style="bold blue")
        table.add_column("ID", style="dim", width=3)
        table.add_column("Title", style="bold")
        table.add_column("Priority", width=8)
        table.add_column("Due Date", width=12)
        table.add_column("Status", width=10)
        table.add_column("Category", width=10)
        
        for task in self.data["tasks"]:
            status = "✅ Done" if task["completed"] else "⏳ Pending"
            priority_style = {"High": "red", "Medium": "yellow", "Low": "green"}.get(task["priority"], "white")
            
            due_display = task.get("due_date", "No due date")
            if task.get("due_date") and not task["completed"]:
                try:
                    due = datetime.fromisoformat(task["due_date"]).date()
                    if due < date.today():
                        due_display = f"[red]{due_display}[/red]"
                    elif due == date.today():
                        due_display = f"[yellow]{due_display}[/yellow]"
                except:
                    pass
            
            table.add_row(
                str(task["id"]),
                task["title"][:40] + "..." if len(task["title"]) > 40 else task["title"],
                f"[{priority_style}]{task['priority']}[/{priority_style}]",
                due_display,
                status,
                task["category"]
            )
        
        self.console.print(table)
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
    
    def mark_task_complete(self):
        """Mark a task as complete"""
        pending_tasks = [t for t in self.data["tasks"] if not t["completed"]]
        
        if not pending_tasks:
            self.console.print("\n[dim]No pending tasks found.[/dim]")
            input("\nPress Enter to continue...")
            return
        
        self.console.print("\n[bold blue]✔️  Mark Task Complete[/bold blue]\n")
        
        for task in pending_tasks:
            self.console.print(f"{task['id']}. {task['title']}")
        
        try:
            task_id = int(Prompt.ask("\nEnter task ID to mark complete"))
            
            for task in self.data["tasks"]:
                if task["id"] == task_id and not task["completed"]:
                    task["completed"] = True
                    task["modified"] = datetime.now().isoformat()
                    self.save_data()
                    self.console.print(f"[green]✓ Task '{task['title']}' marked as complete![/green]")
                    break
            else:
                self.console.print("[red]Task not found or already completed.[/red]")
                
        except ValueError:
            self.console.print("[red]Invalid task ID.[/red]")
        
        input("\nPress Enter to continue...")
    
    def delete_item_interactive(self):
        """Interactive item deletion"""
        self.console.print("\n[bold blue]🗑️  Delete Item[/bold blue]")
        item_type = Prompt.ask("What to delete?", choices=["note", "task"])
        
        if item_type == "note":
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
        
        else:  # task
            if not self.data["tasks"]:
                self.console.print("[dim]No tasks to delete.[/dim]")
            else:
                for task in self.data["tasks"]:
                    status = "✅" if task["completed"] else "⏳"
                    self.console.print(f"{task['id']}. {status} {task['title']}")
                
                try:
                    task_id = int(Prompt.ask("\nEnter task ID to delete"))
                    self.data["tasks"] = [t for t in self.data["tasks"] if t["id"] != task_id]
                    self.save_data()
                    self.console.print("[green]✓ Task deleted![/green]")
                except ValueError:
                    self.console.print("[red]Invalid task ID.[/red]")
        
        input("\nPress Enter to continue...")
    
    def search_interactive(self):
        """Interactive search functionality"""
        self.console.print("\n[bold blue]🔍 Search[/bold blue]")
        query = Prompt.ask("Search term").lower()
        
        # Search notes
        matching_notes = []
        for note in self.data["notes"]:
            if (query in note["title"].lower() or 
                query in note["content"].lower()):
                matching_notes.append(note)
        
        # Search tasks
        matching_tasks = []
        for task in self.data["tasks"]:
            if (query in task["title"].lower() or 
                query in task.get("description", "").lower() or 
                query in task["category"].lower()):
                matching_tasks.append(task)
        
        self.console.print(f"\n[bold]Search results for '{query}':[/bold]\n")
        
        if matching_notes:
            self.console.print("[bold green]📄 Notes:[/bold green]")
            for note in matching_notes:
                self.console.print(f"  • {note['title']}")
        
        if matching_tasks:
            self.console.print("[bold blue]✅ Tasks:[/bold blue]")
            for task in matching_tasks:
                status = "✅" if task["completed"] else "⏳"
                self.console.print(f"  • {status} {task['title']} ({task['category']})")
        
        if not matching_notes and not matching_tasks:
            self.console.print("[dim]No results found.[/dim]")
        
        input("\nPress Enter to continue...")
    
    def settings_menu(self):
        """Settings and configuration menu"""
        self.console.print("\n[bold blue]⚙️  Settings[/bold blue]")
        self.console.print("1. Add Category")
        self.console.print("2. Export Data")
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
                json.dump(self.data, f, indent=2)
            self.console.print(f"[green]✓ Data exported to {export_file}[/green]")
            
        elif choice == "3":
            completed_tasks = len([t for t in self.data["tasks"] if t["completed"]])
            pending_tasks = len(self.data["tasks"]) - completed_tasks
            
            stats = f"""
📊 Data Statistics:
  • Total Notes: {len(self.data['notes'])}
  • Total Tasks: {len(self.data['tasks'])}
  • Completed Tasks: {completed_tasks}
  • Pending Tasks: {pending_tasks}
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
@click.option('--add-task', '-t', help='Add a quick task')
@click.option('--list-tasks', '-l', is_flag=True, help='List all pending tasks')
@click.option('--dashboard', '-d', is_flag=True, help='Show dashboard and exit')
def main(add_note, add_task, list_tasks, dashboard):
    """Turbo Notes - Secure Terminal Note & Task Manager"""
    app = TurboNotes()
    # Load existing data first to get password preference
    app.load_data()
    # Setup encryption
    if not app.setup_encryption():
        sys.exit(1)
    # Only reload data if running interactive mode
    if not (add_note or add_task or list_tasks or dashboard):
        if not app.load_data():
            sys.exit(1)
    # Handle command line options
    if add_note:
        app.add_note("Quick Note", add_note)
        app.console.print("[green]✓ Note added![/green]")
        return
    if add_task:
        app.add_task(add_task)
        app.console.print("[green]✓ Task added![/green]")
        return
    if list_tasks:
        pending = [t for t in app.data["tasks"] if not t["completed"]]
        if pending:
            for task in pending:
                print(f"• {task['title']}")
        else:
            print("No pending tasks!")
        return
    if dashboard:
        app.display_dashboard()
        return
    # Run interactive mode
    app.run()

if __name__ == "__main__":
    main() 