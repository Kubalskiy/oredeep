"""Образцы породы для Гильдии Рудознатцев.
Каждая картинка нарисована ПОД свой вопрос, поэтому у контрольных заданий
правильный ответ действительно виден глазами.
python tools/gen_specimen.py -> art/spec_*.png + art/specimens.json (base64)
"""
import os, io, json, math, base64, random
from PIL import Image, ImageDraw

W, H, SCALE = 120, 84, 3
OUT = {}

def lerp(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

def base_rock(seed, tone=(78, 70, 60), grain=1500):
    """Кусок породы на тёмном фоне: неровный многоугольник + зерно."""
    rnd = random.Random(seed)
    img = Image.new("RGB", (W, H), (13, 15, 20))
    d = ImageDraw.Draw(img)
    cx, cy, R = W // 2, H // 2, 30
    pts = []
    for i in range(11):
        a = i / 11 * math.tau
        r = R * rnd.uniform(0.78, 1.12)
        pts.append((cx + math.cos(a) * r * 1.35, cy + math.sin(a) * r))
    d.polygon(pts, fill=tone)
    # объём: светлее сверху
    for y in range(H):
        for x in range(W):
            p = img.getpixel((x, y))
            if p != (13, 15, 20):
                img.putpixel((x, y), lerp(p, (255, 255, 255), max(0, (H - y) / H - 0.45) * 0.28))
    px = img.load()
    for _ in range(grain):
        x, y = rnd.randrange(W), rnd.randrange(H)
        if px[x, y] != (13, 15, 20):
            k = rnd.randint(-16, 16)
            px[x, y] = tuple(max(0, min(255, px[x, y][i] + k)) for i in range(3))
    return img, d, rnd, pts

def crystal(d, x, y, h, col):
    d.polygon([(x, y - h), (x + 4, y - 2), (x + 2, y + 3), (x - 2, y + 3), (x - 4, y - 2)], fill=col)
    d.polygon([(x, y - h), (x + 4, y - 2), (x + 1, y - 1)], fill=lerp(col, (255, 255, 255), 0.45))

def save(name, img):
    big = img.resize((W * SCALE, H * SCALE), Image.NEAREST)
    os.makedirs("art", exist_ok=True)
    big.save(f"art/spec_{name}.png")
    buf = io.BytesIO(); big.save(buf, "PNG", optimize=True)
    OUT[name] = base64.b64encode(buf.getvalue()).decode()
    return len(buf.getvalue())

# ---- КОНТРОЛЬНЫЕ: ответ виден на картинке ----

# g1: "Сколько отдельных кристаллов на изломе?" -> ответ "2"
img, d, rnd, _ = base_rock(11, (70, 64, 58))
crystal(d, 48, 44, 13, (122, 168, 232))
crystal(d, 70, 46, 11, (140, 185, 240))
save("g1", img)

# g2: "Порода светится собственным светом?" -> ответ "нет" (тусклая, без ореола)
img, d, rnd, _ = base_rock(22, (58, 54, 50))
save("g2", img)

# g3: "Излом ровный или ступенчатый?" -> ответ "ступенчатый"
img, d, rnd, _ = base_rock(33, (84, 74, 62))
step_x, step_y = 40, 30
for i in range(5):
    d.rectangle([step_x + i * 8, step_y + i * 6, step_x + 40, step_y + i * 6 + 6],
                fill=lerp((84, 74, 62), (20, 18, 16), 0.45))
    d.line([(step_x + i * 8, step_y + i * 6), (step_x + 40, step_y + i * 6)], fill=(150, 140, 120))
save("g3", img)

# g4: "Видны ли прожилки другого цвета?" -> ответ "да"
img, d, rnd, _ = base_rock(44, (74, 68, 60))
for i in range(3):
    x0 = 28 + i * 4
    pts = [(x0, 24 + i * 3)]
    for k in range(6):
        pts.append((pts[-1][0] + rnd.randint(8, 13), pts[-1][1] + rnd.randint(-4, 7)))
    d.line(pts, fill=(226, 176, 72), width=2)
save("g4", img)

# ---- ОТКРЫТЫЕ: ответ неизвестен, толпа решает ----

# o1: тип породы — слоистая
img, d, rnd, _ = base_rock(55, (92, 80, 64))
for i in range(6):
    y = 26 + i * 6
    d.line([(30, y), (90, y + rnd.randint(-2, 2))], fill=lerp((92, 80, 64), (40, 34, 28), 0.5))
save("o1", img)

# o2: следы воды — округлые каверны
img, d, rnd, _ = base_rock(66, (66, 66, 70))
for _ in range(7):
    x, y = rnd.randint(38, 82), rnd.randint(26, 56)
    r = rnd.randint(2, 5)
    d.ellipse([x - r, y - r, x + r, y + r], fill=(40, 42, 48))
    d.arc([x - r, y - r, x + r, y + r], 200, 340, fill=(120, 124, 132))
save("o2", img)

# o3: зернистость — крупные зёрна
img, d, rnd, _ = base_rock(77, (80, 72, 66), grain=400)
for _ in range(26):
    x, y = rnd.randint(34, 86), rnd.randint(24, 58)
    r = rnd.randint(2, 4)
    d.ellipse([x - r, y - r, x + r, y + r], fill=lerp((80, 72, 66), (200, 190, 170), rnd.random() * 0.6))
save("o3", img)

# o4: пригодность к датировке — трещиноватый, с включением
img, d, rnd, _ = base_rock(88, (70, 62, 58))
for _ in range(4):
    x0, y0 = rnd.randint(32, 60), rnd.randint(24, 40)
    d.line([(x0, y0), (x0 + rnd.randint(10, 26), y0 + rnd.randint(6, 20))], fill=(30, 26, 24))
crystal(d, 66, 50, 9, (200, 120, 220))
save("o4", img)

json.dump(OUT, open("art/specimens.json", "w"))
print("образцов:", len(OUT), "| суммарно base64:", sum(len(v) for v in OUT.values()), "символов")
for k, v in OUT.items():
    print(" ", k, len(v))
