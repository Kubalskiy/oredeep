"""Пиксель-арт сцена для интро ORE DEEP: старейшина знакомит новичка с Горой.
Рисуем в низком разрешении блоками, потом масштабируем nearest-neighbor.
python tools/gen_intro.py  ->  art/intro.png  (+ base64 в stdout)
"""
import os, base64, io, math, random
from PIL import Image, ImageDraw

random.seed(74)
W, H, SCALE = 200, 118, 5
img = Image.new("RGB", (W, H))
px = img.load()

# --- палитра ---
def lerp(a, b, t): return tuple(round(a[i] + (b[i]-a[i])*t) for i in range(3))
ROCK_TOP = (46, 39, 33)
ROCK_BOT = (18, 14, 11)
GLOW     = (232, 185, 60)     # золото факела
CRYST    = (122, 168, 232)    # синие кристаллы жилы
CRYST_HI = (190, 220, 255)

# --- фон: своды пещеры, радиальная темнота к центру-глубине ---
cx, cy = W*0.62, H*0.52
for y in range(H):
    for x in range(W):
        t = y / H
        base = lerp(ROCK_TOP, ROCK_BOT, t)
        d = math.hypot((x-cx)/W, (y-cy)/H)
        dark = max(0.0, 1 - d*1.9)          # тоннель уходит в глубину
        base = lerp(base, (8, 6, 5), dark*0.7)
        px[x, y] = base

# зернистость породы
for _ in range(2600):
    x, y = random.randint(0, W-1), random.randint(0, H-1)
    c = px[x, y]; k = random.randint(-12, 12)
    px[x, y] = tuple(max(0, min(255, c[i]+k)) for i in range(3))

d = ImageDraw.Draw(img)

# --- крепь: балки свода (дворф теперь под защитой Горы) ---
beam = (74, 54, 32); beam_hi = (104, 78, 48)
for bx in (14, 150):
    d.rectangle([bx, 6, bx+7, H-14], fill=beam)
    d.rectangle([bx, 6, bx+2, H-14], fill=beam_hi)
d.rectangle([14, 6, 157, 13], fill=beam)
d.rectangle([14, 6, 157, 8], fill=beam_hi)

# --- рельсы + вагонетка вдали ---
rail = (60, 60, 68)
d.line([(20, H-9), (140, H-9)], fill=rail)
d.line([(20, H-6), (140, H-6)], fill=rail)
for tx in range(24, 140, 10):
    d.line([(tx, H-9), (tx, H-6)], fill=(40, 40, 46))
# вагонетка
d.rectangle([118, H-20, 138, H-9], fill=(58, 44, 34))
d.rectangle([118, H-20, 138, H-17], fill=(80, 60, 44))
for ore in range(4):
    ox = 121 + ore*4
    d.rectangle([ox, H-23, ox+3, H-20], fill=lerp(GLOW, CRYST, random.random()))
d.ellipse([120, H-11, 124, H-7], fill=(30,30,34))
d.ellipse([132, H-11, 136, H-7], fill=(30,30,34))

# --- жила с кристаллами (рабочее место новичка) ---
vx, vy = 158, 60
d.polygon([(vx,vy-22),(vx+30,vy-10),(vx+34,vy+24),(vx+2,vy+30),(vx-8,vy+4)], fill=(40,50,66))
for _ in range(16):
    a = random.uniform(0, math.tau); r = random.uniform(2, 20)
    gx, gy = int(vx+10+math.cos(a)*r), int(vy+4+math.sin(a)*r)
    h = random.randint(3, 8)
    col = lerp(CRYST, CRYST_HI, random.random())
    d.polygon([(gx,gy-h),(gx+2,gy),(gx,gy+2),(gx-2,gy)], fill=col)
# свечение жилы
for rr in range(26, 8, -3):
    d.ellipse([vx+10-rr, vy+4-rr, vx+10+rr, vy+4+rr], outline=lerp((40,50,66), CRYST, 0.10))

# --- факел на балке, тёплый свет ---
tx, ty = 150, 34
d.rectangle([tx, ty, tx+2, ty+12], fill=(70,50,32))
d.ellipse([tx-3, ty-7, tx+5, ty+2], fill=(255, 210, 120))
d.ellipse([tx-1, ty-5, tx+3, ty-1], fill=(255, 245, 200))
for rr in range(30, 6, -4):
    d.ellipse([tx+1-rr, ty-2-rr, tx+1+rr, ty-2+rr], outline=lerp(px[tx, ty], GLOW, 0.06))

# ---------- фигуры дворфов (блочный пиксель-стиль игры) ----------
def dwarf(ox, oy, scale, skin, cloth, beard_col, beard_len, helm_col, young=False):
    s = scale
    def R(x, y, w, h, c): d.rectangle([ox+x*s, oy+y*s, ox+(x+w)*s-1, oy+(y+h)*s-1], fill=c)
    # тень
    d.ellipse([ox-2*s, oy+15*s, ox+9*s, oy+17*s], fill=(0,0,0))
    # ноги
    R(1, 12, 2, 4, cloth); R(4, 12, 2, 4, cloth)
    R(1, 15, 2, 1, (30,26,22)); R(4, 15, 2, 1, (30,26,22))
    # тело
    R(0, 7, 7, 6, cloth)
    R(0, 7, 7, 1, lerp(cloth,(255,255,255),0.2))
    # руки
    R(-1, 8, 1, 4, skin); R(7, 8, 1, 4, skin)
    # голова
    R(1, 3, 5, 4, skin)
    # шлем/каска
    R(1, 2, 5, 2, helm_col); R(1, 2, 5, 1, lerp(helm_col,(255,255,255),0.35))
    # глаза
    R(2, 4, 1, 1, (20,20,24)); R(4, 4, 1, 1, (20,20,24))
    # борода
    if beard_len > 0:
        R(1, 6, 5, beard_len, beard_col)
        R(1, 6, 5, 1, lerp(beard_col,(255,255,255),0.25))
    return ox, oy

# новичок «Пушок» — в центре, без бороды, с киркой, смотрит на жилу
nx, ny = 70, 54
dwarf(nx, ny, 3, (196,150,110), (70,96,120), (120,90,60), 0, (150,60,50), young=True)
# кирка в руках новичка
d.line([(nx+8*3, ny+9*3),(nx+15*3, ny+3*3)], fill=(120,86,50), width=2)
d.line([(nx+14*3, ny+2*3),(nx+18*3, ny+5*3)], fill=(150,150,158), width=2)

# старейшина — слева, огромная седая борода, жест к жиле (наставляет)
ex, ey = 26, 50
dwarf(ex, ey, 3, (188,142,104), (60,52,70), (222,222,228), 6, (90,80,120))
# рука-указатель старейшины (к жиле)
d.line([(ex+7*3, ey+8*3),(ex+16*3, ey+6*3)], fill=(188,142,104), width=3)
d.rectangle([ex+15*3, ey+5*3, ex+18*3, ey+7*3], fill=(188,142,104))

# --- виньетка ---
for y in range(H):
    for x in range(W):
        dd = math.hypot((x-W/2)/(W/2), (y-H/2)/(H/2))
        if dd > 0.82:
            c = px[x, y]; k = min(1.0,(dd-0.82)/0.5)
            px[x, y] = lerp(c, (6,5,4), k*0.8)

# масштаб nearest
big = img.resize((W*SCALE, H*SCALE), Image.NEAREST)
os.makedirs("art", exist_ok=True)
big.save("art/intro.png")
buf = io.BytesIO(); big.save(buf, "PNG")
b64 = base64.b64encode(buf.getvalue()).decode()
open("art/intro.b64", "w").write(b64)
print("art/intro.png", big.size, "bytes", len(buf.getvalue()), "b64len", len(b64))
