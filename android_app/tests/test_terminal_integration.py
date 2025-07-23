#!/usr/bin/env python3
"""
Integration tests for Turbo Notes Terminal App
"""

import pytest
import tempfile
import os
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from turbo_notes import TurboNotes


class TestTurboNotesIntegration:
    """Integration tests for TurboNotes terminal application"""
    
    def setup_method(self):
        """Set up test environment before each test"""
        self.temp_dir = tempfile.mkdtemp()
        self.app = TurboNotes()
        # Override data directory to use temp directory
        self.app.data_dir = Path(self.temp_dir)
        self.app.data_file = self.app.data_dir / "test_notes_data.enc"
        self.app.salt_file = self.app.data_dir / "test_salt.key"
        
        # Initialize fresh data
        self.app.data = {
            "notes": [],
            "tasks": [],
            "categories": ["Personal", "Work", "Ideas"],
            "last_accessed": None,
            "password_enabled": False
        }
        
    def teardown_method(self):
        """Clean up after each test"""
        # Remove temp files
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_note_operations(self):
        """Test basic note operations"""
        # Test adding a note
        self.app.add_note("Test Note", "This is a test note content")
        
        assert len(self.app.data["notes"]) == 1
        note = self.app.data["notes"][0]
        assert note["title"] == "Test Note"
        assert note["content"] == "This is a test note content"
        assert "created" in note
        assert "modified" in note
        
    def test_task_operations(self):
        """Test basic task operations"""
        # Test adding a task
        task = self.app.add_task("Test Task", "Test description", "High")
        
        assert len(self.app.data["tasks"]) == 1
        assert task["title"] == "Test Task"
        assert task["description"] == "Test description"
        assert task["priority"] == "High"
        assert not task["completed"]
        
        # Test completing a task
        success = self.app.complete_task(task["id"])
        assert success
        assert self.app.data["tasks"][0]["completed"]
        assert "completed_date" in self.app.data["tasks"][0]
        
    def test_overdue_tasks(self):
        """Test overdue task detection"""
        from datetime import datetime, timedelta
        
        # Add task with past due date
        past_date = (datetime.now() - timedelta(days=2)).isoformat()
        self.app.add_task("Overdue Task", "Should be overdue", due_date=past_date)
        
        # Add task with future due date
        future_date = (datetime.now() + timedelta(days=2)).isoformat()
        self.app.add_task("Future Task", "Should not be overdue", due_date=future_date)
        
        overdue_tasks = self.app.get_overdue_tasks()
        assert len(overdue_tasks) == 1
        assert overdue_tasks[0]["title"] == "Overdue Task"
        
    def test_today_tasks(self):
        """Test today's task detection"""
        from datetime import datetime
        
        # Add task due today
        today = datetime.now().isoformat()
        self.app.add_task("Today Task", "Due today", due_date=today)
        
        today_tasks = self.app.get_today_tasks()
        assert len(today_tasks) == 1
        assert today_tasks[0]["title"] == "Today Task"
        
    @patch('keyring.get_password')
    @patch('keyring.set_password')
    def test_data_persistence(self, mock_set_password, mock_get_password):
        """Test data saving and loading"""
        mock_get_password.return_value = None  # No password set
        
        # Add some data
        self.app.add_note("Persistent Note", "This should persist")
        self.app.add_task("Persistent Task", "This should also persist")
        
        # Save data (unencrypted since no password)
        self.app.save_data_unencrypted()
        
        # Create new app instance and load data
        new_app = TurboNotes()
        new_app.data_dir = self.app.data_dir
        new_app.data_file = self.app.data_file
        new_app.salt_file = self.app.salt_file
        
        # Load should work
        success = new_app.load_data()
        assert success
        assert len(new_app.data["notes"]) == 1
        assert len(new_app.data["tasks"]) == 1
        assert new_app.data["notes"][0]["title"] == "Persistent Note"
        assert new_app.data["tasks"][0]["title"] == "Persistent Task"
        
    @patch('keyring.get_password')
    @patch('keyring.set_password')  
    @patch('turbo_notes.TurboNotes.save_data')
    def test_encryption_setup_no_password(self, mock_save_data, mock_set_password, mock_get_password):
        """Test encryption setup when user chooses no password"""
        mock_get_password.return_value = None
        
        with patch('builtins.input', side_effect=['n']):  # User chooses no password
            with patch('turbo_notes.Prompt.ask', return_value='n'):
                success = self.app.setup_encryption()
                
        assert success
        assert self.app.data["password_enabled"] is False
        assert self.app.cipher_suite is None
        
    def test_multiple_notes_and_tasks(self):
        """Test handling multiple notes and tasks"""
        # Add multiple notes
        for i in range(5):
            self.app.add_note(f"Note {i}", f"Content for note {i}")
            
        # Add multiple tasks with different priorities
        priorities = ["High", "Medium", "Low"]
        for i in range(6):
            self.app.add_task(
                f"Task {i}", 
                f"Description for task {i}",
                priorities[i % 3]
            )
            
        assert len(self.app.data["notes"]) == 5
        assert len(self.app.data["tasks"]) == 6
        
        # Complete some tasks
        self.app.complete_task(1)
        self.app.complete_task(3)
        
        completed_tasks = [t for t in self.app.data["tasks"] if t["completed"]]
        assert len(completed_tasks) == 2


class TestDataIntegrity:
    """Test data integrity and edge cases"""
    
    def setup_method(self):
        """Set up test environment"""
        self.temp_dir = tempfile.mkdtemp()
        self.app = TurboNotes()
        self.app.data_dir = Path(self.temp_dir)
        self.app.data_file = self.app.data_dir / "test_notes_data.enc"
        
    def teardown_method(self):
        """Clean up after tests"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
        
    @patch('keyring.get_password')
    def test_empty_data_handling(self, mock_get_password):
        """Test handling of empty or missing data"""
        mock_get_password.return_value = None  # No password set
        
        # Test with no existing data file
        success = self.app.load_data()
        assert success
        assert isinstance(self.app.data["notes"], list)
        assert isinstance(self.app.data["tasks"], list)
        
    def test_invalid_task_completion(self):
        """Test completing non-existent task"""
        # Try to complete task that doesn't exist
        success = self.app.complete_task(999)
        assert not success
        
    def test_task_without_due_date(self):
        """Test tasks without due dates"""
        self.app.add_task("No Due Date Task", "No due date specified")
        
        overdue_tasks = self.app.get_overdue_tasks()
        today_tasks = self.app.get_today_tasks()
        
        # Task without due date should not appear in either list
        assert len(overdue_tasks) == 0
        assert len(today_tasks) == 0


if __name__ == "__main__":
    pytest.main([__file__]) 