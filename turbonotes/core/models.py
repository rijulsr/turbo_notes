from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any


def now_iso() -> str:
    return datetime.now().isoformat()


@dataclass
class Note:
    id: str
    title: str
    body: str
    created: str = field(default_factory=now_iso)
    modified: str = field(default_factory=now_iso)
    color: str = "yellow"
    pinned: bool = False
    window: Dict[str, Any] = field(default_factory=dict)  # geometry: x,y,w,h; always_on_top

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "body": self.body,
            "created": self.created,
            "modified": self.modified,
            "color": self.color,
            "pinned": self.pinned,
            "window": self.window,
        }

    @staticmethod
    def from_dict(d: Dict[str, Any]) -> "Note":
        return Note(
            id=d["id"],
            title=d.get("title", ""),
            body=d.get("body", ""),
            created=d.get("created", now_iso()),
            modified=d.get("modified", now_iso()),
            color=d.get("color", "yellow"),
            pinned=d.get("pinned", False),
            window=d.get("window", {}),
        )


