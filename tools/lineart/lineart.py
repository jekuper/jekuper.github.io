"""Turns images into the line-art binaries drawn by the particle engine.

    python lineart.py build <images_dir> <out_dir> [--color-dir DIR]
    python lineart.py trace <image> <out.json> [--preview out.png]
    python lineart.py pack <in.json> <out.bin>
    python lineart.py unpack <in.bin> <out.json>

Binary format: per contour a big-endian uint16 point count, then 7 bytes per
point holding x:14 | y:14 | r:8 | g:8 | b:8. Black means "use the group color".
"""

import argparse
import json
import math
import struct
from pathlib import Path

POINT_BYTES = 7
COORD_MAX = (1 << 14) - 1
CORNER_MARGIN = 5


def perpendicular_distance(a, b, p):
    dx, dy = b["x"] - a["x"], b["y"] - a["y"]
    length = math.hypot(dx, dy)
    if length == 0:
        return math.hypot(p["x"] - a["x"], p["y"] - a["y"])
    return abs(dy * p["x"] - dx * p["y"] + b["x"] * a["y"] - b["y"] * a["x"]) / length


def simplify(contour, epsilon):
    """Douglas-Peucker, iterative so long contours do not hit the recursion limit."""
    keep = [False] * len(contour)
    keep[0] = keep[-1] = True
    stack = [(0, len(contour) - 1)]
    while stack:
        lo, hi = stack.pop()
        best, index = -1.0, lo
        for i in range(lo + 1, hi):
            d = perpendicular_distance(contour[lo], contour[hi], contour[i])
            if d > best:
                best, index = d, i
        if best > epsilon:
            keep[index] = True
            stack.append((lo, index))
            stack.append((index, hi))
    return [p for p, k in zip(contour, keep) if k]


def fit_budget(contour, budget):
    """Smallest integer tolerance whose result fits in `budget` points."""
    lo, hi, best = 0, 100000, contour
    while lo <= hi:
        mid = (lo + hi) // 2
        result = simplify(contour, mid)
        if len(result) <= budget:
            best, hi = result, mid - 1
        else:
            lo = mid + 1
    return best


def optimize(contours, max_points):
    """Shares the point budget between contours by length, longest first."""
    total = sum(len(c) for c in contours) or 1
    contours.sort(key=len, reverse=True)
    result, used = [], 0
    for contour in contours:
        if used >= max_points:
            break
        budget = max(math.floor(max_points * len(contour) / total), 2)
        simplified = fit_budget(contour, budget)
        result.append(simplified)
        used += len(simplified)
    result = [c for c in result if c]
    if result:
        min_x = min(p["x"] for c in result for p in c)
        min_y = min(p["y"] for c in result for p in c)
        for c in result:
            for p in c:
                p["x"] -= min_x
                p["y"] -= min_y
    return result


def sample_color(cv2, np, image, x, y, radius):
    h, w = image.shape[:2]
    x0, x1 = max(0, x - radius), min(w, x + radius + 1)
    y0, y1 = max(0, y - radius), min(h, y + radius + 1)
    mask = np.zeros((y1 - y0, x1 - x0), dtype=np.uint8)
    cv2.circle(mask, (x - x0, y - y0), radius, 255, -1)
    b, g, r = cv2.mean(image[y0:y1, x0:x1], mask=mask)[:3]
    return int(r), int(g), int(b)


def trace(path, color_path=None, threshold=127, max_points=20000, color_radius=1, color=True):
    import cv2
    import numpy as np

    image = cv2.imread(str(path))
    if image is None:
        raise ValueError(f"Could not load {path}")
    color_image = cv2.imread(str(color_path)) if color_path else image
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY_INV)
    found, _ = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    h, w = image.shape[:2]
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]

    def near_corner(x, y):
        return any(abs(x - cx) <= CORNER_MARGIN and abs(y - cy) <= CORNER_MARGIN for cx, cy in corners)

    contours = []
    for contour in found:
        if len(contour) < 3:
            continue
        # Contours touching a corner are the image frame, not the drawing.
        if any(near_corner(px, py) for [[px, py]] in contour):
            continue
        points = []
        for [[px, py]] in contour:
            point = {"x": float(px), "y": float(py)}
            if color:
                point["r"], point["g"], point["b"] = sample_color(cv2, np, color_image, int(px), int(py), color_radius)
            points.append(point)
        contours.append(points)
    return optimize(contours, max_points), (h, w)


def pack(contours):
    out = bytearray()
    for contour in contours:
        out += struct.pack(">H", len(contour))
        for p in contour:
            x, y = int(p["x"]), int(p["y"])
            if not (0 <= x <= COORD_MAX and 0 <= y <= COORD_MAX):
                raise ValueError(f"Point ({x}, {y}) is outside the 14 bit range")
            value = (x << 38) | (y << 24) | (int(p.get("r", 0)) << 16) | (int(p.get("g", 0)) << 8) | int(p.get("b", 0))
            out += value.to_bytes(POINT_BYTES, "big")
    return bytes(out)


def unpack(data):
    contours, offset = [], 0
    while offset + 2 <= len(data):
        (count,) = struct.unpack_from(">H", data, offset)
        offset += 2
        if offset + count * POINT_BYTES > len(data):
            raise ValueError("Truncated line art data")
        contour = []
        for _ in range(count):
            value = int.from_bytes(data[offset:offset + POINT_BYTES], "big")
            offset += POINT_BYTES
            point = {"x": (value >> 38) & 0x3FFF, "y": (value >> 24) & 0x3FFF}
            r, g, b = (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF
            if r or g or b:
                point.update(r=r, g=g, b=b)
            contour.append(point)
        contours.append(contour)
    return contours


def save_preview(contours, size, path):
    import cv2
    import numpy as np

    canvas = np.zeros((size[0], size[1], 3), dtype=np.uint8)
    polylines = [np.array([[[int(p["x"]), int(p["y"])]] for p in c], dtype=np.int32) for c in contours]
    cv2.drawContours(canvas, polylines, -1, (0, 255, 0), 1)
    cv2.imwrite(str(path), canvas)


def build(images_dir, out_dir, color_dir=None, **options):
    out_dir.mkdir(parents=True, exist_ok=True)
    files = []
    for image in sorted(images_dir.glob("*.png")):
        color_path = color_dir / image.name if color_dir and (color_dir / image.name).exists() else None
        contours, _ = trace(image, color_path, **options)
        name = image.stem + ".bin"
        (out_dir / name).write_bytes(pack(contours))
        files.append(name)
        print(f"{image.name}: {sum(len(c) for c in contours)} points")
    (out_dir / "manifest.json").write_text(json.dumps({"files": files}, indent=2) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    def trace_options(p):
        p.add_argument("--threshold", type=int, default=127, help="binarization threshold, 0-255")
        p.add_argument("--max-points", type=int, default=20000, help="point budget for the whole image")
        p.add_argument("--color-radius", type=int, default=1, help="color sampling radius in pixels")
        p.add_argument("--no-color", action="store_true", help="store no per-point color")

    p = sub.add_parser("build", help="trace a folder of PNGs into binaries and a manifest")
    p.add_argument("images", type=Path)
    p.add_argument("out", type=Path)
    p.add_argument("--color-dir", type=Path, help="colored variants with the same file names")
    trace_options(p)

    p = sub.add_parser("trace", help="trace one image into JSON")
    p.add_argument("image", type=Path)
    p.add_argument("out", type=Path)
    p.add_argument("--color-source", type=Path)
    p.add_argument("--preview", type=Path, help="write the traced contours as an image")
    trace_options(p)

    p = sub.add_parser("pack", help="JSON contours to binary")
    p.add_argument("json", type=Path)
    p.add_argument("out", type=Path)

    p = sub.add_parser("unpack", help="binary to JSON contours")
    p.add_argument("bin", type=Path)
    p.add_argument("out", type=Path)

    args = parser.parse_args()
    if args.command in ("build", "trace"):
        options = dict(
            threshold=args.threshold,
            max_points=args.max_points,
            color_radius=args.color_radius,
            color=not args.no_color,
        )
    if args.command == "build":
        build(args.images, args.out, args.color_dir, **options)
    elif args.command == "trace":
        contours, size = trace(args.image, args.color_source, **options)
        args.out.write_text(json.dumps(contours))
        if args.preview:
            save_preview(contours, size, args.preview)
    elif args.command == "pack":
        args.out.write_bytes(pack(json.loads(args.json.read_text())))
    elif args.command == "unpack":
        args.out.write_text(json.dumps(unpack(args.bin.read_bytes()), indent=2))


if __name__ == "__main__":
    main()
