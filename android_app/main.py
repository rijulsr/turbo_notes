#!/usr/bin/env python3
"""
Turbo Notes Android - Lightweight mobile version
Built with Kivy for cross-platform compatibility
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

from kivy.clock import Clock
from kivy.metrics import dp
from kivymd.app import MDApp
from kivymd.uix.bottomnavigation import (MDBottomNavigation,
                                         MDBottomNavigationItem)
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.button import MDFlatButton, MDIconButton, MDRaisedButton
from kivymd.uix.card import MDCard
from kivymd.uix.chip import MDChip
from kivymd.uix.dialog import MDDialog
from kivymd.uix.gridlayout import MDGridLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.list import MDList, TwoLineListItem
from kivymd.uix.screen import MDScreen
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.selectioncontrol import MDCheckbox
from kivymd.uix.snackbar import Snackbar
from kivymd.uix.textfield import MDTextField


class DataManager:
    """Handle data persistence and sync"""

    def __init__(self):
        # Use app directory for Android compatibility
        try:
            from android.storage import primary_external_storage_path

            self.data_dir = Path(primary_external_storage_path()) / "TurboNotes"
        except ImportError:
            self.data_dir = Path.home() / ".turbo-notes-mobile"

        self.data_dir.mkdir(exist_ok=True)
        self.data_file = self.data_dir / "notes_data.json"

        self.data = {
            "notes": [],
            "tasks": [],
            "categories": ["Personal", "Work", "Ideas", "Code", "Learning"],
            "stats": {
                "total_notes": 0,
                "total_tasks": 0,
                "completed_tasks": 0,
                "streak_days": 0,
                "last_used": None,
                "achievements": [],
            },
            "settings": {
                "theme": "dark",
                "notifications": True,
                "sync_enabled": False,
                "code_highlighting": True,
            },
        }
        self.load_data()

    def load_data(self):
        """Load data from JSON file"""
        if self.data_file.exists():
            try:
                with open(self.data_file, "r") as f:
                    loaded_data = json.load(f)
                    self.data.update(loaded_data)
            except Exception as e:
                print(f"Error loading data: {e}")

    def save_data(self):
        """Save data to JSON file"""
        try:
            self.data["stats"]["last_used"] = datetime.now().isoformat()
            with open(self.data_file, "w") as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            print(f"Error saving data: {e}")

    def add_note(
        self,
        title: str,
        content: str,
        category: str = "Personal",
        tags: List[str] = None,
    ):
        """Add a new note"""
        note = {
            "id": len(self.data["notes"]) + 1,
            "title": title,
            "content": content,
            "category": category,
            "tags": tags or [],
            "created": datetime.now().isoformat(),
            "modified": datetime.now().isoformat(),
            "is_code": self.detect_code(content),
        }
        self.data["notes"].append(note)
        self.data["stats"]["total_notes"] += 1
        self.save_data()
        return note

    def add_task(
        self,
        title: str,
        description: str = "",
        priority: str = "Medium",
        due_date: str = None,
        category: str = "Personal",
    ):
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
            "modified": datetime.now().isoformat(),
        }
        self.data["tasks"].append(task)
        self.data["stats"]["total_tasks"] += 1
        self.save_data()
        return task

    def complete_task(self, task_id: int):
        """Mark task as completed"""
        for task in self.data["tasks"]:
            if task["id"] == task_id:
                task["completed"] = True
                task["completed_date"] = datetime.now().isoformat()
                self.data["stats"]["completed_tasks"] += 1
                self.update_streak()
                self.save_data()
                return True
        return False

    def delete_note(self, note_id: int):
        """Delete a note"""
        self.data["notes"] = [n for n in self.data["notes"] if n["id"] != note_id]
        self.save_data()
        return True

    def delete_task(self, task_id: int):
        """Delete a task"""
        self.data["tasks"] = [t for t in self.data["tasks"] if t["id"] != task_id]
        self.save_data()
        return True

    def detect_code(self, content: str) -> bool:
        """Detect if content contains code"""
        code_indicators = [
            "def ",
            "class ",
            "import ",
            "from ",
            "function",
            "var ",
            "let ",
            "const ",
            "public ",
            "private ",
            "protected ",
            "static ",
            "void ",
            "int ",
            "String ",
            "<?php",
            "#!/",
            "SELECT ",
            "INSERT ",
            "UPDATE ",
            "DELETE ",
            "CREATE TABLE",
        ]
        return any(indicator in content for indicator in code_indicators)

    def update_streak(self):
        """Update daily usage streak"""
        today = datetime.now().date()
        last_used = self.data["stats"].get("last_used")

        if last_used:
            try:
                last_date = datetime.fromisoformat(last_used).date()
                if today == last_date + timedelta(days=1):
                    self.data["stats"]["streak_days"] += 1
                elif today != last_date:
                    self.data["stats"]["streak_days"] = 1
            except Exception:
                self.data["stats"]["streak_days"] = 1
        else:
            self.data["stats"]["streak_days"] = 1

    def get_overdue_tasks(self) -> List[Dict]:
        """Get tasks that are overdue"""
        today = datetime.now().date()
        overdue = []

        for task in self.data["tasks"]:
            if not task["completed"] and task.get("due_date"):
                try:
                    due_date = datetime.fromisoformat(task["due_date"]).date()
                    if due_date < today:
                        overdue.append(task)
                except Exception:
                    continue

        return overdue

    def get_today_tasks(self) -> List[Dict]:
        """Get tasks due today"""
        today = datetime.now().date()
        today_tasks = []

        for task in self.data["tasks"]:
            if not task["completed"] and task.get("due_date"):
                try:
                    due_date = datetime.fromisoformat(task["due_date"]).date()
                    if due_date == today:
                        today_tasks.append(task)
                except Exception:
                    continue

        return today_tasks


class DashboardScreen(MDScreen):
    """Main dashboard screen"""

    def __init__(self, data_manager: DataManager, **kwargs):
        super().__init__(**kwargs)
        self.data_manager = data_manager
        self.build_dashboard()

    def build_dashboard(self):
        """Build the dashboard layout"""
        main_layout = MDBoxLayout(
            orientation="vertical", spacing=dp(10), padding=dp(10)
        )

        # Title
        title = MDLabel(
            text="🚀 Turbo Notes",
            font_style="H4",
            theme_text_color="Primary",
            size_hint_y=None,
            height=dp(60),
            halign="center",
        )
        main_layout.add_widget(title)

        # Stats cards
        stats_layout = MDGridLayout(
            cols=2, spacing=dp(10), size_hint_y=None, height=dp(120)
        )

        # Notes card
        notes_card = MDCard(
            MDBoxLayout(
                MDLabel(
                    text=f"📝 {len(self.data_manager.data['notes'])}\nNotes",
                    theme_text_color="Primary",
                    halign="center",
                ),
                orientation="vertical",
                padding=dp(10),
            ),
            elevation=2,
            size_hint_y=None,
            height=dp(100),
        )

        # Tasks card
        tasks_card = MDCard(
            MDBoxLayout(
                MDLabel(
                    text=f"✅ {len(self.data_manager.data['tasks'])}\nTasks",
                    theme_text_color="Primary",
                    halign="center",
                ),
                orientation="vertical",
                padding=dp(10),
            ),
            elevation=2,
            size_hint_y=None,
            height=dp(100),
        )

        stats_layout.add_widget(notes_card)
        stats_layout.add_widget(tasks_card)
        main_layout.add_widget(stats_layout)

        # Streak card
        streak_card = MDCard(
            MDBoxLayout(
                MDLabel(
                    text=f"🔥 {self.data_manager.data['stats']['streak_days']} Day Streak",
                    theme_text_color="Primary",
                    halign="center",
                ),
                orientation="vertical",
                padding=dp(10),
            ),
            elevation=2,
            size_hint_y=None,
            height=dp(60),
        )
        main_layout.add_widget(streak_card)

        # Recent items
        recent_layout = MDBoxLayout(orientation="vertical", spacing=dp(10))

        # Overdue tasks
        overdue_tasks = self.data_manager.get_overdue_tasks()
        if overdue_tasks:
            overdue_label = MDLabel(
                text="⚠️ Overdue Tasks",
                theme_text_color="Error",
                size_hint_y=None,
                height=dp(30),
            )
            recent_layout.add_widget(overdue_label)

            for task in overdue_tasks[:3]:
                task_card = MDCard(
                    MDBoxLayout(
                        MDLabel(
                            text=f"{task['title']}\n{task.get('description', '')[:50]}...",
                            theme_text_color="Primary",
                        ),
                        MDIconButton(
                            icon="check",
                            on_release=lambda x, task_id=task["id"]: self.complete_task(
                                task_id
                            ),
                        ),
                        orientation="horizontal",
                        padding=dp(10),
                    ),
                    elevation=1,
                    size_hint_y=None,
                    height=dp(80),
                )
                recent_layout.add_widget(task_card)

        # Recent notes
        recent_notes = sorted(
            self.data_manager.data["notes"], key=lambda x: x["modified"], reverse=True
        )[:3]
        if recent_notes:
            notes_label = MDLabel(
                text="📝 Recent Notes",
                theme_text_color="Primary",
                size_hint_y=None,
                height=dp(30),
            )
            recent_layout.add_widget(notes_label)

            for note in recent_notes:
                note_card = MDCard(
                    MDBoxLayout(
                        MDLabel(
                            text=f"{note['title']}\n{note['content'][:50]}...",
                            theme_text_color="Primary",
                        ),
                        MDChip(text=note["category"], size_hint_x=None, width=dp(80)),
                        orientation="horizontal",
                        padding=dp(10),
                    ),
                    elevation=1,
                    size_hint_y=None,
                    height=dp(80),
                )
                recent_layout.add_widget(note_card)

        scroll_view = MDScrollView()
        scroll_view.add_widget(recent_layout)
        main_layout.add_widget(scroll_view)

        self.add_widget(main_layout)

    def complete_task(self, task_id: int):
        """Complete a task and show success message"""
        if self.data_manager.complete_task(task_id):
            Snackbar(text="Task completed! 🎉").open()
            self.refresh_dashboard()

    def refresh_dashboard(self):
        """Refresh the dashboard content"""
        self.clear_widgets()
        self.build_dashboard()


class NotesScreen(MDScreen):
    """Notes management screen"""

    def __init__(self, data_manager: DataManager, **kwargs):
        super().__init__(**kwargs)
        self.data_manager = data_manager
        self.build_notes_screen()

    def build_notes_screen(self):
        """Build the notes screen layout"""
        main_layout = MDBoxLayout(
            orientation="vertical", spacing=dp(10), padding=dp(10)
        )

        # Header
        header_layout = MDBoxLayout(
            orientation="horizontal", size_hint_y=None, height=dp(60), spacing=dp(10)
        )

        title = MDLabel(text="📝 Notes", font_style="H5", theme_text_color="Primary")

        add_button = MDRaisedButton(
            text="Add Note",
            size_hint_x=None,
            width=dp(100),
            on_release=self.show_add_note_dialog,
        )

        header_layout.add_widget(title)
        header_layout.add_widget(add_button)
        main_layout.add_widget(header_layout)

        # Notes list
        self.notes_list = MDList()
        self.populate_notes_list()

        scroll_view = MDScrollView()
        scroll_view.add_widget(self.notes_list)
        main_layout.add_widget(scroll_view)

        self.add_widget(main_layout)

    def populate_notes_list(self):
        """Populate the notes list"""
        self.notes_list.clear_widgets()

        notes = sorted(
            self.data_manager.data["notes"], key=lambda x: x["modified"], reverse=True
        )

        for note in notes:
            note_item = TwoLineListItem(
                text=note["title"],
                secondary_text=(
                    f"{note['content'][:50]}..."
                    if len(note["content"]) > 50
                    else note["content"]
                ),
                on_release=lambda x, note_id=note["id"]: self.view_note(note_id),
            )
            self.notes_list.add_widget(note_item)

    def show_add_note_dialog(self, *args):
        """Show dialog to add new note"""
        content = MDBoxLayout(
            orientation="vertical", spacing=dp(10), size_hint_y=None, height=dp(200)
        )

        self.title_field = MDTextField(hint_text="Note title")
        self.content_field = MDTextField(
            hint_text="Note content", multiline=True, size_hint_y=None, height=dp(100)
        )

        content.add_widget(self.title_field)
        content.add_widget(self.content_field)

        self.add_note_dialog = MDDialog(
            title="Add New Note",
            type="custom",
            content_cls=content,
            buttons=[
                MDFlatButton(text="CANCEL", on_release=self.close_add_note_dialog),
                MDRaisedButton(text="ADD", on_release=self.add_note),
            ],
        )
        self.add_note_dialog.open()

    def add_note(self, *args):
        """Add a new note"""
        title = self.title_field.text
        content = self.content_field.text

        if title and content:
            self.data_manager.add_note(title, content)
            self.populate_notes_list()
            self.add_note_dialog.dismiss()
            Snackbar(text="Note added successfully! 📝").open()
        else:
            Snackbar(text="Please fill in all fields").open()

    def close_add_note_dialog(self, *args):
        """Close the add note dialog"""
        self.add_note_dialog.dismiss()

    def view_note(self, note_id: int):
        """View a specific note"""
        note = next(
            (n for n in self.data_manager.data["notes"] if n["id"] == note_id), None
        )
        if note:
            content = MDBoxLayout(
                orientation="vertical", spacing=dp(10), size_hint_y=None, height=dp(300)
            )

            content.add_widget(
                MDLabel(text=f"Title: {note['title']}", size_hint_y=None, height=dp(40))
            )
            content.add_widget(
                MDLabel(
                    text=f"Category: {note['category']}",
                    size_hint_y=None,
                    height=dp(40),
                )
            )
            content.add_widget(
                MDLabel(text=f"Content:\n{note['content']}", text_size=(dp(250), None))
            )

            dialog = MDDialog(
                title="View Note",
                type="custom",
                content_cls=content,
                buttons=[
                    MDFlatButton(
                        text="DELETE",
                        on_release=lambda x: self.delete_note(note_id, dialog),
                    ),
                    MDFlatButton(text="CLOSE", on_release=lambda x: dialog.dismiss()),
                ],
            )
            dialog.open()

    def delete_note(self, note_id: int, dialog):
        """Delete a note"""
        self.data_manager.delete_note(note_id)
        self.populate_notes_list()
        dialog.dismiss()
        Snackbar(text="Note deleted").open()


class TasksScreen(MDScreen):
    """Tasks management screen"""

    def __init__(self, data_manager: DataManager, **kwargs):
        super().__init__(**kwargs)
        self.data_manager = data_manager
        self.build_tasks_screen()

    def build_tasks_screen(self):
        """Build the tasks screen layout"""
        main_layout = MDBoxLayout(
            orientation="vertical", spacing=dp(10), padding=dp(10)
        )

        # Header
        header_layout = MDBoxLayout(
            orientation="horizontal", size_hint_y=None, height=dp(60), spacing=dp(10)
        )

        title = MDLabel(text="✅ Tasks", font_style="H5", theme_text_color="Primary")

        add_button = MDRaisedButton(
            text="Add Task",
            size_hint_x=None,
            width=dp(100),
            on_release=self.show_add_task_dialog,
        )

        header_layout.add_widget(title)
        header_layout.add_widget(add_button)
        main_layout.add_widget(header_layout)

        # Tasks list
        self.tasks_list = MDList()
        self.populate_tasks_list()

        scroll_view = MDScrollView()
        scroll_view.add_widget(self.tasks_list)
        main_layout.add_widget(scroll_view)

        self.add_widget(main_layout)

    def populate_tasks_list(self):
        """Populate the tasks list"""
        self.tasks_list.clear_widgets()

        tasks = sorted(
            self.data_manager.data["tasks"], key=lambda x: x["created"], reverse=True
        )

        for task in tasks:
            task_item = MDBoxLayout(
                orientation="horizontal",
                size_hint_y=None,
                height=dp(60),
                padding=dp(10),
                spacing=dp(10),
            )

            checkbox = MDCheckbox(
                active=task["completed"],
                size_hint_x=None,
                width=dp(40),
                on_active=lambda checkbox, active, task_id=task[
                    "id"
                ]: self.toggle_task_completion(task_id, active),
            )

            task_info = MDLabel(
                text=f"{task['title']}\n{task.get('description', '')[:30]}...",
                theme_text_color="Primary",
            )

            priority_chip = MDChip(
                text=task["priority"], size_hint_x=None, width=dp(60)
            )

            task_item.add_widget(checkbox)
            task_item.add_widget(task_info)
            task_item.add_widget(priority_chip)

            # Wrap in card
            task_card = MDCard(
                task_item,
                elevation=1,
                size_hint_y=None,
                height=dp(80),
                on_release=lambda x, task_id=task["id"]: self.view_task(task_id),
            )

            self.tasks_list.add_widget(task_card)

    def show_add_task_dialog(self, *args):
        """Show dialog to add new task"""
        content = MDBoxLayout(
            orientation="vertical", spacing=dp(10), size_hint_y=None, height=dp(250)
        )

        self.task_title_field = MDTextField(hint_text="Task title")
        self.task_description_field = MDTextField(
            hint_text="Task description",
            multiline=True,
            size_hint_y=None,
            height=dp(80),
        )
        self.task_priority_field = MDTextField(
            hint_text="Priority (High/Medium/Low)", text="Medium"
        )

        content.add_widget(self.task_title_field)
        content.add_widget(self.task_description_field)
        content.add_widget(self.task_priority_field)

        self.add_task_dialog = MDDialog(
            title="Add New Task",
            type="custom",
            content_cls=content,
            buttons=[
                MDFlatButton(text="CANCEL", on_release=self.close_add_task_dialog),
                MDRaisedButton(text="ADD", on_release=self.add_task),
            ],
        )
        self.add_task_dialog.open()

    def add_task(self, *args):
        """Add a new task"""
        title = self.task_title_field.text
        description = self.task_description_field.text
        priority = self.task_priority_field.text or "Medium"

        if title:
            self.data_manager.add_task(title, description, priority)
            self.populate_tasks_list()
            self.add_task_dialog.dismiss()
            Snackbar(text="Task added successfully! ✅").open()
        else:
            Snackbar(text="Please enter a task title").open()

    def close_add_task_dialog(self, *args):
        """Close the add task dialog"""
        self.add_task_dialog.dismiss()

    def toggle_task_completion(self, task_id: int, active: bool):
        """Toggle task completion status"""
        if active:
            self.data_manager.complete_task(task_id)
            Snackbar(text="Task completed! 🎉").open()
        self.populate_tasks_list()

    def view_task(self, task_id: int):
        """View a specific task"""
        task = next(
            (t for t in self.data_manager.data["tasks"] if t["id"] == task_id), None
        )
        if task:
            content = MDBoxLayout(
                orientation="vertical", spacing=dp(10), size_hint_y=None, height=dp(300)
            )

            content.add_widget(
                MDLabel(text=f"Title: {task['title']}", size_hint_y=None, height=dp(40))
            )
            content.add_widget(
                MDLabel(
                    text=f"Priority: {task['priority']}",
                    size_hint_y=None,
                    height=dp(40),
                )
            )
            content.add_widget(
                MDLabel(
                    text=f"Status: {'Completed' if task['completed'] else 'Pending'}",
                    size_hint_y=None,
                    height=dp(40),
                )
            )
            content.add_widget(
                MDLabel(
                    text=f"Description:\n{task['description']}",
                    text_size=(dp(250), None),
                )
            )

            dialog = MDDialog(
                title="View Task",
                type="custom",
                content_cls=content,
                buttons=[
                    MDFlatButton(
                        text="DELETE",
                        on_release=lambda x: self.delete_task(task_id, dialog),
                    ),
                    MDFlatButton(text="CLOSE", on_release=lambda x: dialog.dismiss()),
                ],
            )
            dialog.open()

    def delete_task(self, task_id: int, dialog):
        """Delete a task"""
        self.data_manager.delete_task(task_id)
        self.populate_tasks_list()
        dialog.dismiss()
        Snackbar(text="Task deleted").open()


class TurboNotesApp(MDApp):
    """Main application class"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.data_manager = DataManager()
        self.theme_cls.theme_style = "Dark"
        self.theme_cls.primary_palette = "Blue"
        self.theme_cls.accent_palette = "Amber"

    def build(self):
        """Build the main app interface"""
        self.title = "Turbo Notes"

        # Create bottom navigation
        bottom_nav = MDBottomNavigation()

        # Dashboard tab
        dashboard_tab = MDBottomNavigationItem(
            name="dashboard", text="Dashboard", icon="view-dashboard"
        )
        dashboard_screen = DashboardScreen(self.data_manager, name="dashboard")
        dashboard_tab.add_widget(dashboard_screen)

        # Notes tab
        notes_tab = MDBottomNavigationItem(name="notes", text="Notes", icon="note-text")
        notes_screen = NotesScreen(self.data_manager, name="notes")
        notes_tab.add_widget(notes_screen)

        # Tasks tab
        tasks_tab = MDBottomNavigationItem(
            name="tasks", text="Tasks", icon="checkbox-marked-circle"
        )
        tasks_screen = TasksScreen(self.data_manager, name="tasks")
        tasks_tab.add_widget(tasks_screen)

        bottom_nav.add_widget(dashboard_tab)
        bottom_nav.add_widget(notes_tab)
        bottom_nav.add_widget(tasks_tab)

        return bottom_nav

    def on_start(self):
        """Called when the app starts"""
        self.data_manager.update_streak()
        Clock.schedule_interval(self.periodic_save, 60)

    def periodic_save(self, dt):
        """Periodic save function"""
        self.data_manager.save_data()

    def on_stop(self):
        """Called when the app stops"""
        self.data_manager.save_data()


if __name__ == "__main__":
    TurboNotesApp().run()
