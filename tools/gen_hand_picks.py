"""Кирки «в руке» (сцена копания + PvP): art/pickh0..7.png из нарисованных art/pick0..7.png.

Каждая кирка выравнивается одинаково: рукоять строго вертикальна, торец рукояти внизу
в одной и той же точке, голова сверху, клюв вперёд (вправо); одинаковая длина.
Чуть сужается поперёк рукояти (SLIM), чтобы кирка была тоньше.
Иконки инвентаря (art/pick*.png) не меняются.
"""
import math
from PIL import Image

W, H = 56, 120
BUTT_X, BUTT_Y = 26, 116
LENGTH = 110
SLIM = 0.82
SRC = "art/pick{}.png"
OUT = "art/pickh{}.png"


def opaque(im):
    a = im.getchannel("A").load()
    return [(x, y) for y in range(im.height) for x in range(im.width) if a[x, y] > 40]


BUTT_RIGHT = {5}


def axis(pts, butt_right=False):
    """Торец рукояти и направление рукоять→голова (по нижней части кирки)."""
    butt = max(pts, key=(lambda p: p[1] + p[0]) if butt_right else (lambda p: p[1] - p[0]))
    tip = max(pts, key=lambda p: (p[0] - butt[0]) ** 2 + (p[1] - butt[1]) ** 2)
    L = math.dist(butt, tip)
    ux, uy = (tip[0] - butt[0]) / L, (tip[1] - butt[1]) / L
    hand = [p for p in pts if 0.05 * L < (p[0] - butt[0]) * ux + (p[1] - butt[1]) * uy < 0.5 * L]
    mx = sum(p[0] for p in hand) / len(hand)
    my = sum(p[1] for p in hand) / len(hand)
    sxx = sum((p[0] - mx) ** 2 for p in hand)
    syy = sum((p[1] - my) ** 2 for p in hand)
    sxy = sum((p[0] - mx) * (p[1] - my) for p in hand)
    ang = 0.5 * math.atan2(2 * sxy, sxx - syy)
    dx, dy = math.cos(ang), math.sin(ang)
    if dx * ux + dy * uy < 0:
        dx, dy = -dx, -dy
    t0 = min((p[0] - mx) * dx + (p[1] - my) * dy for p in hand)
    bx, by = mx + dx * t0, my + dy * t0
    return (bx, by), (dx, dy)


def normalize(src, butt_right=False):
    K = 4
    im = src.convert("RGBA")
    big = im.resize((im.width * K, im.height * K), Image.NEAREST)
    (bx, by), (dx, dy) = axis(opaque(im), butt_right)
    deg = math.degrees(math.atan2(dy, dx)) + 90
    pad = Image.new("RGBA", (big.width * 2, big.height * 2), (0, 0, 0, 0))
    ox, oy = big.width // 2, big.height // 2
    pad.alpha_composite(big, (ox, oy))
    cx, cy = ox + bx * K, oy + by * K
    rot = pad.rotate(deg, resample=Image.BICUBIC, center=(cx, cy))
    pts = opaque(rot.resize((rot.width // K, rot.height // K), Image.NEAREST))
    top = min(p[1] for p in pts) * K
    length = cy - top
    left = [p for p in pts if p[0] * K < cx - 6 * K]
    right = [p for p in pts if p[0] * K > cx + 6 * K]
    if len(left) > len(right):
        rot = rot.transpose(Image.FLIP_LEFT_RIGHT)
        cx = rot.width - cx
    s = (LENGTH * K) / length
    rot = rot.resize((int(rot.width * s * SLIM), int(rot.height * s)), Image.LANCZOS)
    cx, cy = cx * s * SLIM, cy * s
    tmp = Image.new("RGBA", (W * K, H * K), (0, 0, 0, 0))
    tmp.paste(rot, (int(round(BUTT_X * K - cx)), int(round(BUTT_Y * K - cy))), rot)
    res = tmp.resize((W, H), Image.LANCZOS)
    a = res.getchannel("A").point(lambda v: 255 if v > 110 else 0)
    res.putalpha(a)
    return res


if __name__ == "__main__":
    for i in range(8):
        normalize(Image.open(SRC.format(i)), i in BUTT_RIGHT).save(OUT.format(i))
    print("grip origin: x=%.1f%% y=%.1f%% (butt)" % (100 * BUTT_X / W, 100 * BUTT_Y / H))
