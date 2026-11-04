#!/usr/bin/env python3
"""Split the pet dragon sprites into animatable layers.

Each art/pet_dragon_<n>.png (72x64) is cut into part layers on the same canvas:
art/pet_dragon_<n>_<part>.png. Part polygons and joint pivots are authored in the
1024px source image space (assets/dragon_<n>_src.jpg) and mapped through the same
crop/scale the sprite was built with. The body layer keeps a 2px band along every
cut so joints never open a gap when a part rotates.

Prints the pivots as % of the canvas for DRAGON_RIG in js/game.js.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.expanduser(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ROOT, "assets")
W, H = 72, 64

# part: (polygon in source px, pivot in source px). Order = draw order back→front.
RIG = {
    "gold": {
        "wingB": ([(380,150),(650,150),(600,230),(520,240),(470,330),(440,450),(380,450)], (430,440)),
        "wingA": ([(20,120),(395,120),(395,330),(320,470),(250,560),(200,620),(180,700),(20,700)], (340,430)),
        "tail":  ([(650,590),(1010,590),(1010,880),(650,880)], (630,650)),
        "legA":  ([(180,600),(345,600),(345,860),(180,860)], (270,600)),
        "legB":  ([(360,640),(510,640),(510,870),(360,870)], (430,640)),
        "head":  ([(520,190),(850,190),(850,560),(700,560),(560,480),(500,330)], (580,520)),
    },
    "chaos": {
        "wingA": ([(20,140),(545,140),(575,330),(600,540),(560,600),(440,600),(300,590),(200,560),(20,560)], (560,560)),
        "tail":  ([(20,580),(400,600),(400,800),(20,800)], (420,700)),
        "legA":  ([(370,740),(520,740),(520,880),(370,880)], (450,740)),
        "legB":  ([(580,700),(760,700),(760,870),(580,870)], (640,700)),
        "head":  ([(600,150),(950,150),(950,480),(780,480),(700,470),(610,420)], (720,480)),
    },
    "storm": {
        "wingB": ([(455,150),(620,150),(600,250),(590,330),(520,420),(470,440),(455,300)], (500,430)),
        "wingA": ([(30,130),(475,130),(470,300),(500,430),(440,520),(330,560),(220,580),(30,560)], (470,480)),
        "tail":  ([(100,560),(330,560),(330,930),(100,930)], (330,640)),
        "tail2": ([(720,740),(940,740),(940,940),(720,940)], (720,800)),
        "legA":  ([(330,690),(470,690),(470,890),(330,890)], (400,690)),
        "legB":  ([(550,640),(720,640),(720,860),(550,860)], (620,640)),
        "head":  ([(590,90),(930,90),(930,400),(760,400),(650,380),(600,300)], (680,400)),
    },
}


def source_transform(path):
    """Same chroma-key crop + fit the sprite was generated with: src px → canvas px."""
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    alpha = Image.fromarray(np.where((g > 150) & (g - r > 70) & (g - b > 70), 0, 255).astype(np.uint8))
    x0, y0, x1, y1 = alpha.filter(ImageFilter.MinFilter(3)).getbbox()
    s = min(W / (x1 - x0), H / (y1 - y0))
    nw, nh = max(1, round((x1 - x0) * s)), max(1, round((y1 - y0) * s))
    ox, oy = (W - nw) // 2, H - nh
    return lambda p: ((p[0] - x0) * s + ox, (p[1] - y0) * s + oy)


def main():
    pivots = {}
    for name, parts in RIG.items():
        sprite = Image.open(os.path.join(ROOT, "art", f"pet_dragon_{name}.png")).convert("RGBA")
        tf = source_transform(os.path.join(SRC, f"dragon_{name}_src.jpg"))
        sa = np.asarray(sprite)
        taken = np.zeros((H, W), bool)
        pivots[name] = {}
        for part, (poly, pivot) in parts.items():
            m = Image.new("L", (W, H), 0)
            ImageDraw.Draw(m).polygon([tf(p) for p in poly], fill=255)
            mask = (np.asarray(m) > 0) & ~taken & (sa[..., 3] > 0)
            layer = sa.copy(); layer[..., 3] = np.where(mask, sa[..., 3], 0)
            Image.fromarray(layer, "RGBA").save(os.path.join(ROOT, "art", f"pet_dragon_{name}_{part}.png"))
            taken |= mask
            px, py = tf(pivot)
            pivots[name][part] = [round(px / W * 100, 1), round(py / H * 100, 1)]
        body_only = (sa[..., 3] > 0) & ~taken
        near_body = np.asarray(Image.fromarray((body_only * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
        body = sa.copy(); body[..., 3] = np.where(taken & ~near_body, 0, sa[..., 3])
        Image.fromarray(body, "RGBA").save(os.path.join(ROOT, "art", f"pet_dragon_{name}_body.png"))
    print(json.dumps(pivots))


if __name__ == "__main__":
    main()
