"""Turn a GPT line-art plate into the two files the site draws from.

    python3 scripts/plates/make_plate.py plates/src/signage.webp      # one plate
    python3 scripts/plates/make_plate.py plates/src/*.webp            # all of them

Writes, for <slug> = the source file name:
  public/plates/<slug>-order.png  grey+alpha: alpha = ink, grey = drawing order (0 first .. 255 last)
  public/plates/<slug>.png        navy ink on transparent, for the no-WebGL and no-motion views

Drawing order: ink is split into connected strokes; the biggest strokes (the silhouette) start first and
take longest, small parts and dashed guide lines come last. Inside each stroke the order grows with the
distance travelled along the ink from its top-left point, so it reads like a pen tracing the line.
Needs numpy and Pillow only.
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

INK = (19, 29, 39)  # --ink, #131d27
OUT = Path('public/plates')


def ink_alpha(img):
    g = np.asarray(img.convert('L'), dtype=np.float32) / 255.0
    return np.clip((1.0 - g - 0.06) / 0.55, 0.0, 1.0)  # paper to 0, line cores to 1, keep the anti-aliasing


def strokes(mask):
    """8-connected components; returns label image and list of pixel index arrays."""
    h, w = mask.shape
    label = np.full(mask.shape, -1, dtype=np.int32)
    comps = []
    ys, xs = np.nonzero(mask)
    for y0, x0 in zip(ys, xs):
        if label[y0, x0] >= 0:
            continue
        cid = len(comps)
        q = deque([(y0, x0)])
        label[y0, x0] = cid
        px = []
        while q:
            y, x = q.popleft()
            px.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and label[ny, nx] < 0:
                        label[ny, nx] = cid
                        q.append((ny, nx))
        comps.append(np.array(px))
    return label, comps


def geodesic(px, label, cid):
    """Distance along the ink from the stroke's top-left pixel."""
    start = tuple(px[np.argmin(px[:, 0] + px[:, 1])])
    dist = {start: 0}
    q = deque([start])
    h, w = label.shape
    while q:
        y, x = q.popleft()
        d = dist[(y, x)] + 1
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and label[ny, nx] == cid and (ny, nx) not in dist:
                    dist[(ny, nx)] = d
                    q.append((ny, nx))
    return np.array([dist[(y, x)] for y, x in px], dtype=np.float32)


def make(src):
    slug = Path(src).stem
    img = Image.open(src).convert('RGB')
    a = ink_alpha(img)
    mask = a > 0.2
    label, comps = strokes(mask)
    sizes = np.array([len(c) for c in comps], dtype=np.float32)
    order_idx = np.argsort(-sizes)
    total = sizes.sum()
    order = np.zeros(a.shape, dtype=np.float32)
    done = 0.0
    big = sizes.max()
    ends = []
    for cid in order_idx:
        px = comps[cid]
        start = 0.62 * (done / total)                       # silhouette first, details later
        dur = 0.12 + 0.5 * np.sqrt(sizes[cid] / big)        # long strokes take longer
        d = geodesic(px, label, cid)
        t = start + dur * (d / max(d.max(), 1.0))
        order[px[:, 0], px[:, 1]] = t
        ends.append(start + dur)
        done += sizes[cid]
    order /= max(ends)
    # soft edge pixels (ink below the mask threshold) take the latest order of their neighbours
    soft = (a > 0) & ~mask
    grown = order.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            grown = np.maximum(grown, np.roll(np.roll(order, dy, 0), dx, 1))
    order[soft] = grown[soft]

    OUT.mkdir(parents=True, exist_ok=True)
    la = np.dstack([(order * 255).round().astype(np.uint8) * (a > 0), (a * 255).round().astype(np.uint8)])
    Image.fromarray(la, 'LA').save(OUT / f'{slug}-order.png', optimize=True)
    rgba = np.zeros((*a.shape, 4), dtype=np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = INK
    rgba[..., 3] = (a * 255).round().astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(OUT / f'{slug}.png', optimize=True)
    print(f'{slug}: {len(comps)} strokes, {int(total)} ink px')


if __name__ == '__main__':
    for f in sys.argv[1:]:
        make(f)
