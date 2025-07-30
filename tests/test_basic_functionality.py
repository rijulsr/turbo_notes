"""
Basic functionality tests for Turbo Notes terminal application.
"""

import pytest
import tempfile
import os
from unittest.mock import patch, MagicMock


def test_import_turbo_notes():
    """Test that turbo_notes can be imported successfully."""
    try:
        import turbo_notes
        assert True
    except ImportError as e:
        pytest.fail(f"Failed to import turbo_notes: {e}")


def test_basic_app_creation():
    """Test that the TurboNotes app can be created."""
    try:
        from turbo_notes import TurboNotes
        app = TurboNotes()
        assert app is not None
    except Exception as e:
        pytest.fail(f"Failed to create TurboNotes app: {e}")


def test_data_directory_creation():
    """Test that data directory is created properly."""
    with tempfile.TemporaryDirectory() as temp_dir:
        with patch('turbo_notes.DATA_DIR', temp_dir):
            from turbo_notes import TurboNotes
            app = TurboNotes()
            
            # Check if data directory exists
            assert os.path.exists(temp_dir)
            
            # Check if notes and tasks files are created
            notes_file = os.path.join(temp_dir, 'notes.json')
            tasks_file = os.path.join(temp_dir, 'tasks.json')
            
            # Files should exist after app initialization
            assert os.path.exists(notes_file)
            assert os.path.exists(tasks_file)


def test_note_operations():
    """Test basic note operations."""
    with tempfile.TemporaryDirectory() as temp_dir:
        with patch('turbo_notes.DATA_DIR', temp_dir):
            from turbo_notes import TurboNotes
            app = TurboNotes()
            
            # Test adding a note
            app.add_note("Test Note", "This is a test note content")
            
            # Test getting notes
            notes = app.get_notes()
            assert len(notes) > 0
            
            # Test finding the added note
            test_note = None
            for note in notes:
                if note['title'] == "Test Note":
                    test_note = note
                    break
            
            assert test_note is not None
            assert test_note['content'] == "This is a test note content"


def test_task_operations():
    """Test basic task operations."""
    with tempfile.TemporaryDirectory() as temp_dir:
        with patch('turbo_notes.DATA_DIR', temp_dir):
            from turbo_notes import TurboNotes
            app = TurboNotes()
            
            # Test adding a task
            app.add_task("Test Task", priority="high")
            
            # Test getting tasks
            tasks = app.get_tasks()
            assert len(tasks) > 0
            
            # Test finding the added task
            test_task = None
            for task in tasks:
                if task['title'] == "Test Task":
                    test_task = task
                    break
            
            assert test_task is not None
            assert test_task['priority'] == "high"
            assert not test_task['completed']


if __name__ == "__main__":
    pytest.main([__file__]) 