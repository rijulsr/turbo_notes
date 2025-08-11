from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import List, Optional, Dict, Any

from .crypto import CryptoManager
from .models import Note, now_iso


class NotesStorage:
    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = base_dir or (Path.home() / ".turbo-notes")
        self.base_dir.mkdir(exist_ok=True)
        self.file_path = self.base_dir / "notes_gui.json"
        self.crypto = CryptoManager(data_dir=self.base_dir)
        self.crypto.load()
        self._data: Dict[str, Any] = {"notes": []}
        self._loaded = False

    def load(self):
        if not self.file_path.exists():
            self._loaded = True
            return
        raw = self.file_path.read_bytes()
        raw = self.crypto.decrypt(raw)
        self._data = json.loads(raw.decode("utf-8"))
        self._loaded = True

    def save(self):
        serialized = json.dumps(self._data, indent=2).encode("utf-8")
        serialized = self.crypto.encrypt(serialized)
        self.file_path.write_bytes(serialized)

    def list_notes(self) -> List[Note]:
        if not self._loaded:
            self.load()
        return [Note.from_dict(n) for n in self._data.get("notes", [])]

    def create_note(self, title: str = "", body: str = "") -> Note:
        if not self._loaded:
            self.load()
        note = Note(id=str(uuid.uuid4()), title=title, body=body)
        self._data.setdefault("notes", []).append(note.to_dict())
        self.save()
        return note

    def update_note(self, note_id: str, **updates) -> Optional[Note]:
        if not self._loaded:
            self.load()
        for n in self._data.get("notes", []):
            if n["id"] == note_id:
                n.update(updates)
                n["modified"] = now_iso()
                self.save()
                return Note.from_dict(n)
        return None

    def delete_note(self, note_id: str) -> bool:
        if not self._loaded:
            self.load()
        arr = self._data.get("notes", [])
        before = len(arr)
        arr[:] = [n for n in arr if n["id"] != note_id]
        removed = len(arr) != before
        if removed:
            self.save()
        return removed


