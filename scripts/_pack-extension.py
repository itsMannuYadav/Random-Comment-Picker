"""Zip extension/ with forward-slash entry names for Edge Partner Center."""

from __future__ import annotations

import sys
import zipfile
from pathlib import Path

EXCLUDE_DIRS = {"store-listing", "node_modules", ".git"}
EXCLUDE_FILES = {"README.md", ".DS_Store", "Thumbs.db", "LISTING.md"}


def should_skip(path: Path, root: Path) -> bool:
    rel_parts = path.relative_to(root).parts
    if any(part in EXCLUDE_DIRS for part in rel_parts[:-1]):
        return True
    if path.name in EXCLUDE_FILES:
        return True
    if path.suffix.lower() == ".zip":
        return True
    if path.name.startswith("."):
        return True
    return False


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: _pack-extension.py <extension-dir> <out-zip>")

    root = Path(sys.argv[1]).resolve()
    out = Path(sys.argv[2]).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    count = 0
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(root.rglob("*")):
            if not path.is_file():
                continue
            if should_skip(path, root):
                continue
            arcname = path.relative_to(root).as_posix()
            zf.write(path, arcname)
            count += 1

    print(f"Added {count} files")


if __name__ == "__main__":
    main()
