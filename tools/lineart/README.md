# Line-art pipeline

Converts black-on-white drawings into the binaries the hero animation draws.
Each image becomes a set of contours, simplified with Douglas-Peucker until the
whole image fits a point budget, with an optional color sampled per point from a
colored variant of the same drawing.

```
pip install -r requirements.txt

# Whole folder, writes N.bin files plus manifest.json
python lineart.py build drawings/ ../../public/art/lineart --color-dir drawings-colored/

# Single image, with a preview of the traced contours
python lineart.py trace drawing.png drawing.json --preview drawing-preview.png
python lineart.py pack drawing.json drawing.bin

# Inspect an existing binary
python lineart.py unpack ../../public/art/lineart/1.bin out.json
```

The site picks art from `public/art/lineart/manifest.json`, so adding or
removing files only needs a manifest update.

Coordinates are limited to 14 bits (0 to 16383). A pixel color of pure black
is stored as "no color" and drawn in the current group color instead.
