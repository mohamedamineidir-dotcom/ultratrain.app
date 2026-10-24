# Photos

Real photos, licensed for commercial use without attribution (see `CREDITS.md` for the
photographers and sources). Keep the same file names and both formats if you swap any of them:
the pages use the WebP and fall back to the JPEG.

| File | Used for | Size |
|---|---|---|
| `trail-portrait-1.jpg` + `.webp` | the story phone in "Share your runs" (the overlay sits on top) | 1080 x 1920 |
| `trail-portrait-2.jpg` + `.webp` | spare portrait, not referenced yet | 1080 x 1920 |
| `band-landscape.jpg` + `.webp` | the full-bleed "Every 100 m of climb" band | 2400 x 1350 |

Tips: keep the sky or a quiet area in the top third of the portrait so the overlay text stays
readable; avoid recognisable faces and race branding. To make the WebP: `cwebp -q 80 in.jpg -o out.webp`.

`Scripts/website/build-assets.py --placeholders` regenerates the labelled placeholder versions
(and `Scripts/website/placeholder-hashes.txt`), which `check-placeholders.sh` refuses to ship.
