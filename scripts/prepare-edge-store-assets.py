"""Resize generated marketing images to Microsoft Edge Add-ons exact sizes."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    r"C:\Users\yadav\.cursor\projects\d-Random-Comment-Picker\assets"
)
DST = ROOT / "extension" / "store-listing"
ICON = ROOT / "extension" / "icons" / "icon128.png"


def cover_resize(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    tw, th = size
    sw, sh = im.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale + 0.5), int(sh * scale + 0.5)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return im.crop((left, top, left + tw, top + th))


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)

    # Crisp logo from the extension icon (preferred for Partner Center).
    logo = Image.open(ICON).convert("RGBA")
    logo.resize((300, 300), Image.Resampling.LANCZOS).convert("RGB").save(
        DST / "logo-300x300.png", "PNG", optimize=True
    )

    ai_logo = SRC / "mysocial-store-logo.png"
    if ai_logo.exists():
        cover_resize(Image.open(ai_logo).convert("RGB"), (300, 300)).save(
            DST / "logo-300x300-alt.png", "PNG", optimize=True
        )

    cover_resize(
        Image.open(SRC / "mysocial-promo-small.png").convert("RGB"), (440, 280)
    ).save(DST / "promo-small-440x280.png", "PNG", optimize=True)

    cover_resize(
        Image.open(SRC / "mysocial-promo-large.png").convert("RGB"), (1400, 560)
    ).save(DST / "promo-large-1400x560.png", "PNG", optimize=True)

    shots = [
        ("mysocial-shot-popup.png", "screenshot-01-popup-1280x800.png"),
        ("mysocial-shot-picker.png", "screenshot-02-comment-picker-1280x800.png"),
        ("mysocial-shot-thumb.png", "screenshot-03-thumbnails-1280x800.png"),
        ("mysocial-shot-video.png", "screenshot-04-video-downloader-1280x800.png"),
    ]
    for src_name, out_name in shots:
        cover_resize(
            Image.open(SRC / src_name).convert("RGB"), (1280, 800)
        ).save(DST / out_name, "PNG", optimize=True)

    print(f"Wrote assets to {DST}")
    for path in sorted(DST.iterdir()):
        if path.suffix.lower() != ".png":
            continue
        im = Image.open(path)
        print(f"  {path.name}: {im.size[0]}x{im.size[1]} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
