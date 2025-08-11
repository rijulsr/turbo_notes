from __future__ import annotations

from typing import Optional

from PySide6.QtCore import Qt, QRect
from PySide6.QtGui import QPalette, QColor, QAction
from PySide6.QtWidgets import (
    QMainWindow,
    QTextEdit,
    QVBoxLayout,
    QWidget,
    QToolBar,
)

from ...core.storage import NotesStorage


COLOR_MAP = {
    "yellow": QColor(255, 253, 208),
    "blue": QColor(208, 233, 255),
    "green": QColor(208, 255, 220),
    "pink": QColor(255, 220, 240),
}


class StickyNoteWindow(QMainWindow):
    def __init__(self, note_id: str, storage: NotesStorage):
        super().__init__()
        self.note_id = note_id
        self.storage = storage
        self.setWindowFlags(
            Qt.WindowStaysOnTopHint | Qt.WindowMinimizeButtonHint | Qt.Window
        )
        self.setWindowTitle("Sticky Note")

        note = self._note()
        self.text = QTextEdit()
        self.text.setPlainText(note.body)
        self.text.textChanged.connect(self._on_text_changed)

        # Toolbar
        toolbar = QToolBar()
        color_action = QAction("Color")
        color_action.triggered.connect(self._cycle_color)
        pin_action = QAction("Pin/Unpin")
        pin_action.triggered.connect(self._toggle_pin)
        delete_action = QAction("Delete")
        delete_action.triggered.connect(self._delete)
        toolbar.addAction(color_action)
        toolbar.addAction(pin_action)
        toolbar.addAction(delete_action)

        central = QWidget()
        layout = QVBoxLayout(central)
        layout.setContentsMargins(6, 6, 6, 6)
        layout.setSpacing(4)
        layout.addWidget(toolbar)
        layout.addWidget(self.text)
        self.setCentralWidget(central)

        self._apply_color(note.color)
        self._maybe_restore_geometry(note)

    def _note(self):
        for n in self.storage.list_notes():
            if n.id == self.note_id:
                return n
        # if missing, create
        return self.storage.create_note()

    def _apply_color(self, color_key: str):
        color = COLOR_MAP.get(color_key, COLOR_MAP["yellow"])
        pal = self.palette()
        pal.setColor(QPalette.Base, color)
        pal.setColor(QPalette.Window, color)
        self.setPalette(pal)
        self.text.setPalette(pal)

    def _on_text_changed(self):
        content = self.text.toPlainText()
        # derive title as first line
        first_line = content.splitlines()[0] if content.splitlines() else ""
        self.storage.update_note(self.note_id, title=first_line[:80], body=content)

    def _cycle_color(self):
        note = self._note()
        keys = list(COLOR_MAP.keys())
        try:
            idx = keys.index(note.color)
        except ValueError:
            idx = 0
        new_color = keys[(idx + 1) % len(keys)]
        self.storage.update_note(self.note_id, color=new_color)
        self._apply_color(new_color)

    def _toggle_pin(self):
        note = self._note()
        pinned = not note.pinned
        self.storage.update_note(self.note_id, pinned=pinned)
        flags = self.windowFlags()
        if pinned:
            flags |= Qt.WindowStaysOnTopHint
        else:
            flags &= ~Qt.WindowStaysOnTopHint
        self.setWindowFlags(flags)
        self.show()

    def _delete(self):
        self.storage.delete_note(self.note_id)
        self.close()

    def closeEvent(self, event):
        # save geometry
        geom = self.geometry()
        window = {
            "x": geom.x(),
            "y": geom.y(),
            "w": geom.width(),
            "h": geom.height(),
        }
        self.storage.update_note(self.note_id, window=window)
        super().closeEvent(event)

    def _maybe_restore_geometry(self, note):
        win = note.window or {}
        if {k: win.get(k) for k in ("x", "y", "w", "h")}:
            rect = QRect(win.get("x", 100), win.get("y", 100), win.get("w", 300), win.get("h", 300))
            self.setGeometry(rect)
        else:
            self.resize(300, 300)


