from __future__ import annotations

import sys
from typing import Optional

from PySide6.QtWidgets import QApplication

from .tray import TurboTray


def run_tray(argv: Optional[list[str]] = None):
    argv = argv or sys.argv
    app = QApplication(argv)
    tray = TurboTray()
    tray.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    run_tray()


