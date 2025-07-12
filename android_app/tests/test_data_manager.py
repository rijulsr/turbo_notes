#!/usr/bin/env python3
"""
Unit tests for DataManager class
"""

import unittest
import tempfile
import shutil
import json
from pathlib import Path
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from main import DataManager


class TestDataManager(unittest.TestCase):
    """Test cases for DataManager"""
    
    def setUp(self):
        """Set up test environment"""
        self.temp_dir = tempfile.mkdtemp()
        self.data_manager = DataManager()
        self.data_manager.data_dir = Path(self.temp_dir)
        self.data_manager.data_file = self.data_manager.data_dir / "test_data.json"
        self.data_manager.stats_file = self.data_manager.data_dir / "test_stats.json"
        
    def tearDown(self):
        """Clean up test environment"""
        shutil.rmtree(self.temp_dir)
        
    def test_init_creates_data_structure(self):
        """Test that DataManager initializes with correct data structure"""
        expected_keys = ["notes", "tasks", "categories", "stats", "settings"]
        for key in expected_keys:
            self.assertIn(key, self.data_manager.data)
            
    def test_add_note_basic(self):
        """Test adding a basic note"""
        title = "Test Note"
        content = "This is a test note"
        category = "Test"
        
        note = self.data_manager.add_note(title, content, category)
        
        self.assertEqual(note["title"], title)
        self.assertEqual(note["content"], content)
        self.assertEqual(note["category"], category)
        self.assertEqual(len(self.data_manager.data["notes"]), 1)
        self.assertEqual(self.data_manager.data["stats"]["total_notes"], 1)
        
    def test_add_note_with_tags(self):
        """Test adding a note with tags"""
        title = "Tagged Note"
        content = "Note with tags"
        tags = ["python", "testing"]
        
        note = self.data_manager.add_note(title, content, tags=tags)
        
        self.assertEqual(note["tags"], tags)
        
    def test_add_note_code_detection(self):
        """Test code detection in notes"""
        # Python code
        python_note = self.data_manager.add_note(
            "Python Function", 
            "def hello():\n    print('Hello World')"
        )
        self.assertTrue(python_note["is_code"])
        
        # JavaScript code
        js_note = self.data_manager.add_note(
            "JS Function",
            "function hello() { console.log('Hello'); }"
        )
        self.assertTrue(js_note["is_code"])
        
        # Regular text
        text_note = self.data_manager.add_note(
            "Regular Note",
            "This is just regular text without code"
        )
        self.assertFalse(text_note["is_code"])
        
    def test_add_task_basic(self):
        """Test adding a basic task"""
        title = "Test Task"
        description = "This is a test task"
        priority = "High"
        
        task = self.data_manager.add_task(title, description, priority)
        
        self.assertEqual(task["title"], title)
        self.assertEqual(task["description"], description)
        self.assertEqual(task["priority"], priority)
        self.assertFalse(task["completed"])
        self.assertEqual(len(self.data_manager.data["tasks"]), 1)
        self.assertEqual(self.data_manager.data["stats"]["total_tasks"], 1)
        
    def test_add_task_with_due_date(self):
        """Test adding a task with due date"""
        title = "Task with Due Date"
        due_date = "2024-12-31"
        
        task = self.data_manager.add_task(title, due_date=due_date)
        
        self.assertEqual(task["due_date"], due_date)
        
    def test_complete_task(self):
        """Test completing a task"""
        task = self.data_manager.add_task("Test Task", "Test Description")
        task_id = task["id"]
        
        result = self.data_manager.complete_task(task_id)
        
        self.assertTrue(result)
        self.assertTrue(self.data_manager.data["tasks"][0]["completed"])
        self.assertIn("completed_date", self.data_manager.data["tasks"][0])
        self.assertEqual(self.data_manager.data["stats"]["completed_tasks"], 1)
        
    def test_complete_nonexistent_task(self):
        """Test completing a task that doesn't exist"""
        result = self.data_manager.complete_task(999)
        self.assertFalse(result)
        
    def test_get_overdue_tasks(self):
        """Test getting overdue tasks"""
        # Add task due yesterday
        yesterday = (datetime.now() - timedelta(days=1)).isoformat()
        overdue_task = self.data_manager.add_task(
            "Overdue Task", 
            due_date=yesterday
        )
        
        # Add task due tomorrow
        tomorrow = (datetime.now() + timedelta(days=1)).isoformat()
        future_task = self.data_manager.add_task(
            "Future Task",
            due_date=tomorrow
        )
        
        # Add completed overdue task
        completed_overdue = self.data_manager.add_task(
            "Completed Overdue",
            due_date=yesterday
        )
        self.data_manager.complete_task(completed_overdue["id"])
        
        overdue_tasks = self.data_manager.get_overdue_tasks()
        
        self.assertEqual(len(overdue_tasks), 1)
        self.assertEqual(overdue_tasks[0]["title"], "Overdue Task")
        
    def test_get_today_tasks(self):
        """Test getting tasks due today"""
        # Add task due today
        today = datetime.now().isoformat()
        today_task = self.data_manager.add_task(
            "Today Task",
            due_date=today
        )
        
        # Add task due tomorrow
        tomorrow = (datetime.now() + timedelta(days=1)).isoformat()
        future_task = self.data_manager.add_task(
            "Future Task",
            due_date=tomorrow
        )
        
        today_tasks = self.data_manager.get_today_tasks()
        
        self.assertEqual(len(today_tasks), 1)
        self.assertEqual(today_tasks[0]["title"], "Today Task")
        
    def test_detect_code_various_languages(self):
        """Test code detection for various programming languages"""
        test_cases = [
            ("def function():", True),  # Python
            ("function test() {", True),  # JavaScript
            ("public class Test {", True),  # Java
            ("SELECT * FROM users", True),  # SQL
            ("<?php echo 'hello';", True),  # PHP
            ("#!/bin/bash", True),  # Shell
            ("import numpy as np", True),  # Python import
            ("Regular text here", False),  # Regular text
            ("Meeting notes for today", False),  # Regular text
        ]
        
        for content, expected in test_cases:
            with self.subTest(content=content):
                result = self.data_manager.detect_code(content)
                self.assertEqual(result, expected)
                
    def test_update_streak_new_user(self):
        """Test streak update for new user"""
        self.data_manager.data["stats"]["last_used"] = None
        
        self.data_manager.update_streak()
        
        self.assertEqual(self.data_manager.data["stats"]["streak_days"], 1)
        
    def test_update_streak_consecutive_days(self):
        """Test streak update for consecutive days"""
        # Set last used to yesterday
        yesterday = datetime.now() - timedelta(days=1)
        self.data_manager.data["stats"]["last_used"] = yesterday.isoformat()
        self.data_manager.data["stats"]["streak_days"] = 5
        
        self.data_manager.update_streak()
        
        self.assertEqual(self.data_manager.data["stats"]["streak_days"], 6)
        
    def test_update_streak_broken_streak(self):
        """Test streak update when streak is broken"""
        # Set last used to 3 days ago
        three_days_ago = datetime.now() - timedelta(days=3)
        self.data_manager.data["stats"]["last_used"] = three_days_ago.isoformat()
        self.data_manager.data["stats"]["streak_days"] = 10
        
        self.data_manager.update_streak()
        
        self.assertEqual(self.data_manager.data["stats"]["streak_days"], 1)
        
    def test_update_streak_same_day(self):
        """Test streak update for same day usage"""
        # Set last used to today
        today = datetime.now()
        self.data_manager.data["stats"]["last_used"] = today.isoformat()
        self.data_manager.data["stats"]["streak_days"] = 5
        
        self.data_manager.update_streak()
        
        # Streak should remain the same
        self.assertEqual(self.data_manager.data["stats"]["streak_days"], 5)
        
    def test_save_and_load_data(self):
        """Test saving and loading data"""
        # Add some test data
        self.data_manager.add_note("Test Note", "Test Content")
        self.data_manager.add_task("Test Task", "Test Description")
        
        # Save data
        self.data_manager.save_data()
        
        # Create new data manager and load data
        new_data_manager = DataManager()
        new_data_manager.data_dir = Path(self.temp_dir)
        new_data_manager.data_file = new_data_manager.data_dir / "test_data.json"
        new_data_manager.load_data()
        
        # Verify data was loaded correctly
        self.assertEqual(len(new_data_manager.data["notes"]), 1)
        self.assertEqual(len(new_data_manager.data["tasks"]), 1)
        self.assertEqual(new_data_manager.data["notes"][0]["title"], "Test Note")
        self.assertEqual(new_data_manager.data["tasks"][0]["title"], "Test Task")
        
    def test_load_data_file_not_exists(self):
        """Test loading data when file doesn't exist"""
        # Ensure file doesn't exist
        if self.data_manager.data_file.exists():
            self.data_manager.data_file.unlink()
            
        result = self.data_manager.load_data()
        
        self.assertTrue(result)
        # Should have default data structure
        self.assertIn("notes", self.data_manager.data)
        self.assertIn("tasks", self.data_manager.data)
        
    def test_load_data_corrupted_file(self):
        """Test loading data with corrupted JSON file"""
        # Create corrupted JSON file
        with open(self.data_manager.data_file, 'w') as f:
            f.write("invalid json content")
            
        # Should handle gracefully
        result = self.data_manager.load_data()
        
        # Should return False but not crash
        self.assertFalse(result)
        
    @patch('main.DataManager.save_data')
    def test_save_data_called_on_operations(self, mock_save):
        """Test that save_data is called after operations"""
        self.data_manager.add_note("Test", "Content")
        mock_save.assert_called_once()
        
        mock_save.reset_mock()
        self.data_manager.add_task("Test Task", "Description")
        mock_save.assert_called_once()
        
    def test_note_id_increment(self):
        """Test that note IDs increment properly"""
        note1 = self.data_manager.add_note("Note 1", "Content 1")
        note2 = self.data_manager.add_note("Note 2", "Content 2")
        note3 = self.data_manager.add_note("Note 3", "Content 3")
        
        self.assertEqual(note1["id"], 1)
        self.assertEqual(note2["id"], 2)
        self.assertEqual(note3["id"], 3)
        
    def test_task_id_increment(self):
        """Test that task IDs increment properly"""
        task1 = self.data_manager.add_task("Task 1", "Description 1")
        task2 = self.data_manager.add_task("Task 2", "Description 2")
        task3 = self.data_manager.add_task("Task 3", "Description 3")
        
        self.assertEqual(task1["id"], 1)
        self.assertEqual(task2["id"], 2)
        self.assertEqual(task3["id"], 3)
        
    def test_default_categories(self):
        """Test that default categories are set correctly"""
        expected_categories = ["Personal", "Work", "Ideas", "Code", "Learning"]
        self.assertEqual(self.data_manager.data["categories"], expected_categories)
        
    def test_default_settings(self):
        """Test that default settings are set correctly"""
        expected_settings = {
            "theme": "dark",
            "notifications": True,
            "sync_enabled": False,
            "code_highlighting": True
        }
        self.assertEqual(self.data_manager.data["settings"], expected_settings)
        
    def test_timestamps_are_set(self):
        """Test that timestamps are properly set"""
        note = self.data_manager.add_note("Test", "Content")
        
        self.assertIn("created", note)
        self.assertIn("modified", note)
        
        # Verify timestamp format
        created_time = datetime.fromisoformat(note["created"])
        modified_time = datetime.fromisoformat(note["modified"])
        
        self.assertIsInstance(created_time, datetime)
        self.assertIsInstance(modified_time, datetime)


if __name__ == '__main__':
    unittest.main() 