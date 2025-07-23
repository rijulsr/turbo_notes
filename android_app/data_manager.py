#!/usr/bin/env python3
"""
Data Manager for Turbo Notes Android
Handles data persistence and business logic without UI dependencies
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List


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
                return True
            except Exception as e:
                print(f"Error loading data: {e}")
                return False
        return True

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
                except (ValueError, TypeError, AttributeError):
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
                except (ValueError, TypeError, AttributeError):
                    continue

        return today_tasks 