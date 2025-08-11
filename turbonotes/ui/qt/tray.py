from __future__ import annotations

import sys
from typing import Dict

from PySide6.QtGui import QIcon, QAction
from PySide6.QtWidgets import QSystemTrayIcon, QMenu, QApplication, QDialog

from ...core.storage import NotesStorage
from .sticky_note import StickyNoteWindow
from .home import HomeDialog


class TurboTray(QSystemTrayIcon):
    def __init__(self):
        super().__init__()
        self.setToolTip("Turbo Notes")
        # Use a generic icon if theme icon is unavailable
        self.setIcon(QIcon.fromTheme("note"))

        self.storage = NotesStorage()
        self.windows: Dict[str, StickyNoteWindow] = {}

        menu = QMenu()

        new_note_action = QAction("New Sticky Note")
        new_note_action.triggered.connect(self.create_sticky)
        menu.addAction(new_note_action)

        show_all_action = QAction("Notes & Search")
        show_all_action.triggered.connect(self.open_home)
        menu.addAction(show_all_action)

        menu.addSeparator()

        quit_action = QAction("Quit")
        quit_action.triggered.connect(QApplication.instance().quit)
        menu.addAction(quit_action)

        self.setContextMenu(menu)

    def create_sticky(self):
        note = self.storage.create_note(title="", body="")
        self.open_window(note.id)

    def open_window(self, note_id: str):
        if note_id in self.windows:
            self.windows[note_id].showNormal()
            self.windows[note_id].raise_()
            self.windows[note_id].activateWindow()
            return
        win = StickyNoteWindow(note_id=note_id, storage=self.storage)
        win.show()
        self.windows[note_id] = win

    def show_all(self):
        notes = self.storage.list_notes()
        if not notes:
            self.create_sticky()
            return
        for n in notes:
            self.open_window(n.id)

    def open_home(self):
        dlg = HomeDialog(self.storage)
        result = dlg.exec()
        # If user pressed New Sticky or double-clicked, open something
        if result == QDialog.Accepted:
            note_id = dlg.selected_note_id()
            if note_id:
                self.open_window(note_id)
            else:
                self.create_sticky()


