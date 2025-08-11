from __future__ import annotations

from typing import List

from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QDialog,
    QVBoxLayout,
    QHBoxLayout,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QPushButton,
)

from ...core.storage import NotesStorage


class HomeDialog(QDialog):
    def __init__(self, storage: NotesStorage):
        super().__init__()
        self.storage = storage
        self.setWindowTitle("Turbo Notes")
        self.setMinimumSize(420, 480)

        layout = QVBoxLayout(self)
        search_row = QHBoxLayout()
        self.search = QLineEdit(self)
        self.search.setPlaceholderText("Search notes…")
        self.search.textChanged.connect(self.refresh)
        new_btn = QPushButton("New Sticky")
        new_btn.clicked.connect(self.accept)
        search_row.addWidget(self.search)
        search_row.addWidget(new_btn)
        layout.addLayout(search_row)

        self.listing = QListWidget(self)
        self.listing.itemDoubleClicked.connect(self.accept)
        layout.addWidget(self.listing)

        self.refresh()

    def refresh(self):
        self.listing.clear()
        text = (self.search.text() or "").lower()
        for note in self.storage.list_notes():
            hay = f"{note.title}\n{note.body}".lower()
            if text and text not in hay:
                continue
            item = QListWidgetItem(note.title or "(untitled)")
            item.setData(Qt.UserRole, note.id)
            self.listing.addItem(item)

    def selected_note_id(self) -> str | None:
        item = self.listing.currentItem()
        return item.data(Qt.UserRole) if item else None


