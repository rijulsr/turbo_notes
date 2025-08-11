from __future__ import annotations

import base64
import os
from pathlib import Path
from typing import Optional

import keyring
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class CryptoManager:
    def __init__(self, app_name: str = "turbo-notes", data_dir: Optional[Path] = None):
        self.app_name = app_name
        self.data_dir = data_dir or (Path.home() / ".turbo-notes")
        self.salt_file = self.data_dir / "salt.key"
        self.data_dir.mkdir(exist_ok=True)
        self._fernet: Optional[Fernet] = None

    def is_enabled(self) -> bool:
        return keyring.get_password(self.app_name, "master_password") is not None

    def _derive_key(self, password: str) -> bytes:
        if self.salt_file.exists():
            salt = self.salt_file.read_bytes()
        else:
            salt = os.urandom(16)
            self.salt_file.write_bytes(salt)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(), length=32, salt=salt, iterations=100_000
        )
        return base64.urlsafe_b64encode(kdf.derive(password.encode()))

    def enable(self, password: str):
        keyring.set_password(self.app_name, "master_password", password)
        self._fernet = Fernet(self._derive_key(password))

    def disable(self):
        try:
            keyring.delete_password(self.app_name, "master_password")
        except Exception:
            pass
        if self.salt_file.exists():
            self.salt_file.unlink()
        self._fernet = None

    def load(self):
        pw = keyring.get_password(self.app_name, "master_password")
        if pw:
            self._fernet = Fernet(self._derive_key(pw))
        else:
            self._fernet = None

    def encrypt(self, data: bytes) -> bytes:
        if not self._fernet:
            return data
        return self._fernet.encrypt(data)

    def decrypt(self, data: bytes) -> bytes:
        if not self._fernet:
            return data
        return self._fernet.decrypt(data)


