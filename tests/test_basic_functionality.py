"""
Basic functionality tests for Turbo Notes (updated for current API).
"""

import os
import tempfile

import pytest


def test_import_turbo_notes():
    try:
        import turbo_notes  # noqa: F401
        assert True
    except ImportError as e:
        pytest.fail(f"Failed to import turbo_notes: {e}")


def test_basic_app_creation():
    try:
        from turbo_notes import TurboNotes

        app = TurboNotes()
        assert app is not None
    except Exception as e:
        pytest.fail(f"Failed to create TurboNotes app: {e}")


def test_data_directory_creation():
    from turbo_notes import TurboNotes
    from pathlib import Path

    with tempfile.TemporaryDirectory() as temp_dir:
        app = TurboNotes()
        # Redirect app storage to temp
        app.data_dir = Path(temp_dir)
        app.data_dir.mkdir(exist_ok=True)
        app.data_file = app.data_dir / "notes_data.enc"
        app.salt_file = app.data_dir / "salt.key"
        # Trigger a save to create the file
        app.save_data_unencrypted()
        assert os.path.exists(temp_dir)
        assert app.data_file.exists()


def test_note_operations():
    from turbo_notes import TurboNotes
    from pathlib import Path

    with tempfile.TemporaryDirectory() as temp_dir:
        app = TurboNotes()
        app.data_dir = Path(temp_dir)
        app.data_dir.mkdir(exist_ok=True)
        app.data_file = app.data_dir / "notes_data.enc"
        app.salt_file = app.data_dir / "salt.key"

        app.add_note("Test Note", "This is a test note content")
        notes = app.data["notes"]
        assert len(notes) > 0
        test_note = next((n for n in notes if n["title"] == "Test Note"), None)
        assert test_note is not None
        assert test_note["content"] == "This is a test note content"


def test_task_operations():
    from turbo_notes import TurboNotes
    from pathlib import Path

    with tempfile.TemporaryDirectory() as temp_dir:
        app = TurboNotes()
        app.data_dir = Path(temp_dir)
        app.data_dir.mkdir(exist_ok=True)
        app.data_file = app.data_dir / "notes_data.enc"
        app.salt_file = app.data_dir / "salt.key"

        app.add_task("Test Task", priority="high")
        tasks = app.data.get("tasks", [])
        assert len(tasks) > 0
        test_task = next((t for t in tasks if t["title"] == "Test Task"), None)
        assert test_task is not None
        assert test_task["priority"] == "high"
        assert not test_task["completed"]


if __name__ == "__main__":
    pytest.main([__file__])