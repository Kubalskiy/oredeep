#!/usr/bin/env python3
"""Генератор пиксель-арта ORE DEEP: ноды камней, кирки, иконки статов.
Собственная графика (CC0-by-construction) — безопасна для коммерции."""
from PIL import Image
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'art')
os.makedirs(OUT, exist_ok=True)

def hx(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i+2], 16) for i in (0, 2, 4)) + (255,)

def mix(c, w, t):  # c→w на долю t
    return tuple(int(c[i] + (w[i] - c[i]) * t) for i in range(3)) + (255,)

OUTLINE = hx('14161c')
ROCK = {'D': hx('3a3f4c'), 'R': hx('565e70'), 'H': hx('7b8499')}
WOOD = {'W': hx('6e4a28'), 'w': hx('8a5f38')}

RARITY = ['8f96a3', '5fd068', '5aa7e8', 'b97ae8', 'e87a7a', 'e8b93c', '7ae8dc', 'ff9d5c']

ROCK_MAP = [
"................",
".....OOOOOO.....",
"...OORRRRRHOO...",
"..ORRRHHRRRRO...",
".ORRHHRRRRRRRO..",
".ORRHRRRRRRRRRO.",
"ODRRRRRRRRRRRHO.",
"ODRRRRRRRRRRRRO.",
"ODDRRRRRRRRRRRO.",
"ODDRRRRRRRRRRRO.",
"ODDDRRRRRRRRRDO.",
".ODDDRRRRRRRDDO.",
".ODDDDDDDDDDDO..",
"..OODDDDDDDOO...",
"....OOOOOOO.....",
"................",
]
# кластеры кристаллов: (cx, cy) и ромб вокруг
CLUSTERS = [(5, 8), (10, 10), (9, 5)]
DIAMOND = [(0,-1,'C'), (-1,0,'c'), (0,0,'C'), (1,0,'c'), (0,1,'x'), (1,-1,'c'), (-1,1,'x')]

def gen_node(color_hex, path):
    base = hx(color_hex)
    pal = {'c': base, 'C': mix(base, (255,255,255), .45), 'x': mix(base, (0,0,0), .4)}
    im = Image.new('RGBA', (16,16), (0,0,0,0))
    px = im.load()
    for y, row in enumerate(ROCK_MAP):
        for x, ch in enumerate(row):
            if ch == 'O': px[x,y] = OUTLINE
            elif ch in ROCK: px[x,y] = ROCK[ch]
    for cx, cy in CLUSTERS:
        for dx, dy, sh in DIAMOND:
            x, y = cx+dx, cy+dy
            if 0 <= x < 16 and 0 <= y < 16 and ROCK_MAP[y][x] in 'DRH':
                px[x,y] = pal[sh]
    im.save(path)

# ---- кирка 22x22: программное рисование + авто-обводка ----
def outline_pass(im):
    px = im.load(); w, h = im.size
    edges = []
    for y in range(h):
        for x in range(w):
            if px[x,y][3] == 0:
                for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx,ny = x+dx,y+dy
                    if 0<=nx<w and 0<=ny<h and px[nx,ny][3]>0 and px[nx,ny][:3]!=OUTLINE[:3]:
                        edges.append((x,y)); break
    for x,y in edges: px[x,y]=OUTLINE

def gen_pick(color_hex, path, gem=False):
    base = hx(color_hex)
    light = mix(base,(255,255,255),.5); dark = mix(base,(0,0,0),.32)
    im = Image.new('RGBA',(24,24),(0,0,0,0)); px=im.load()
    def put(x,y,c):
        if 0<=x<24 and 0<=y<24 and c is not None: px[x,y]=c
    # рукоять: вертикально-диагональная, деревянная, 3px толщиной
    for i in range(16):
        t=i/15.0
        x=int(11 - t*3); y=int(4 + t*18)
        put(x,y,WOOD['W']); put(x+1,y,WOOD['w']); put(x+2,y,WOOD['W'])
    # голова кирки: двусторонняя изогнутая (полумесяц-«кирка»)
    import math
    for i in range(33):
        t=i/32.0
        # верхняя дуга слева-направо через макушку
        x=(1-t)**2*2 + 2*(1-t)*t*12 + t*t*22
        y=(1-t)**2*8 + 2*(1-t)*t*1 + t*t*8
        xi,yi=int(round(x)),int(round(y))
        put(xi,yi-1,light); put(xi,yi,base); put(xi,yi+1,dark)
    # заострённые концы
    put(1,8,dark); put(0,9,dark); put(22,8,dark); put(23,9,dark)
    put(2,7,light); put(21,7,light)
    # проушина/муфта на рукояти
    for dx in range(-1,4):
        for dy in range(0,3):
            put(9+dx,7+dy,dark)
    put(10,8,base); put(11,8,base)
    if gem: put(10,8,hx('fff2b0')); put(11,7,hx('ffd75e'))
    outline_pass(im)
    im.save(path)

def gen_sword(path):
    m=hx('aeb8c6'); ml=hx('d5dde8')
    im=Image.new('RGBA',(16,16),(0,0,0,0)); px=im.load()
    def put(x,y,c):
        if 0<=x<16 and 0<=y<16: px[x,y]=c
    for i in range(9):
        put(4+i,11-i,m); put(5+i,11-i,ml); put(4+i,10-i,ml)
    put(13,2,ml); put(14,1,ml); put(13,1,ml)
    for d in range(-1,3): put(4+d,12-d,hx('e8b93c'))
    put(2,13,WOOD['W']); put(3,13,WOOD['W']); put(2,14,WOOD['W'])
    outline_pass(im)
    im.save(path)

# ---- иконки статов 14x14 ----
def draw_map(rows, pal, path, size=14):
    im = Image.new('RGBA', (size,size), (0,0,0,0)); px=im.load()
    for y,row in enumerate(rows):
        for x,ch in enumerate(row):
            if ch in pal: px[x,y]=pal[ch]
    im.save(path)

SWORD = [
"..........OO..",
".........OMMO.",
"........OMmO..",
".......OMmO...",
"......OMmO....",
".....OMmO.....",
"..O.OMmO......",
".OGOMmO.......",
"..OGmO........",
".OWOGO........",
"OWO..O........",
"OO............",
"..............",
"..............",
]
BOOT = [
"..............",
"...OOOO.......",
"..OLLLLO......",
"..OLllLO......",
"..OLLLLO......",
"..OLllLO......",
"..OLLLLOOO....",
"..OLLLLLLLOO..",
".OLLllLLLLLO..",
".OLLLLLLLLLO..",
".ODDDDDDDDDO..",
"..OOOOOOOOO...",
"..............",
"..............",
]
BURST = [
"......O.......",
"..O..OYO..O...",
"...O.OYO.O....",
"....OYRYO.....",
"..OOYRRRYOO...",
".OYYRRWRRYYO..",
"..OOYRRRYOO...",
"....OYRYO.....",
"...O.OYO.O....",
"..O..OYO..O...",
"......O.......",
"..............",
"..............",
"..............",
]
CLOVER = [
"..............",
"..OGG...GGO...",
".OGggO.OggGO..",
".OGGGO.OGGGO..",
"..OGGOOOGG O..",
"...OGGGGGO....",
"..OGGOOOGGO...",
".OGGGO.OGGGO..",
".OGggO.OggGO..",
"..OGG..OGGO...",
".....OWO......",
".....OWO......",
"......O.......",
"..............",
]
STONE_I = [
"..............",
"....OOOOO.....",
"...ORRRHO O...",
"..ORRHHRRO....",
".ORRHRRRRRO...",
".ODRRRRRRRO...",
".ODDRRRRRDO...",
"..ODDDRRDDO...",
"...ODDDDDO....",
"....OOOOO.....",
"..............",
"..............",
"..............",
"..............",
]
MINIPICK = [
"...OOOOOO.....",
"..OMMMMMMOO...",
".OMmOOOOMMMO..",
".OMO....OMMO..",
"..O..OWO..O...",
".....OwO......",
"....OWO.......",
"....OwO.......",
"...OWO........",
"...OwO........",
"..OO..........",
"..............",
"..............",
"..............",
]
PAL_COMMON = {'O':OUTLINE,'M':hx('aeb8c6'),'m':hx('d5dde8'),'W':hx('6e4a28'),'w':hx('8a5f38'),
 'G':hx('e8b93c'),'g':hx('5fd068'),'L':hx('8a6a45'),'l':hx('a5825a'),'D':hx('4a3a26'),
 'Y':hx('ffd75e'),'R':hx('e05555'),'H':hx('7b8499')}
PAL_COMMON.update({'R':hx('e05555')})

def main():
    for i,c in enumerate(RARITY):
        gen_node(c, f'{OUT}/node_r{i}.png')
        gen_pick(c, f'{OUT}/pick_r{i}.png', gem=(i>=4))
    stone_pal = dict(PAL_COMMON); stone_pal['R']=ROCK['R']; stone_pal['D']=ROCK['D']
    clover_pal = dict(PAL_COMMON); clover_pal['G']=hx('3f9e4d'); clover_pal['g']=hx('7ed88a'); clover_pal['W']=hx('6e4a28')
    gen_sword(f'{OUT}/stat_atk.png')
    draw_map(BOOT, PAL_COMMON, f'{OUT}/stat_spd.png')
    draw_map(BURST, PAL_COMMON, f'{OUT}/stat_crit.png')
    draw_map(CLOVER, clover_pal, f'{OUT}/stat_luck.png')
    draw_map(STONE_I, stone_pal, f'{OUT}/stat_stone.png')
    import shutil
    shutil.copy(f'{OUT}/pick_r0.png', f'{OUT}/stat_mining.png')
    print('generated:', len(os.listdir(OUT)), 'files')



# ================= ГЕНЕРАТОР v2: руды, шахтёры, экипировка =================
import random, math

ORE_PAL = ['e8b93c','5aa7e8','ff8a4a','7ae8dc','b97ae8','ff5544']  # 5 чертогов + босс

def gem_pal(hexc):
    b = hx(hexc)
    return {'b': b, 'l': mix(b,(255,255,255),.45), 'd': mix(b,(0,0,0),.4)}

def rock_shade(y, cy, ry):
    if y < cy - ry*0.35: return ROCK['H']
    if y > cy + ry*0.30: return ROCK['D']
    return ROCK['R']

def blob(px, r, cx, cy, rx, ry, jitter=1.6):
    cells = []
    for y in range(max(0,int(cy-ry)), min(24,int(cy+ry)+1)):
        f = 1 - ((y-cy)/ry)**2
        if f <= 0: continue
        w = rx*math.sqrt(f) + r.uniform(-jitter, jitter)
        for x in range(max(0,int(cx-w)), min(24,int(cx+w)+1)):
            px[x,y] = rock_shade(y, cy, ry)
            cells.append((x,y))
    return cells

def sprinkle_gems(px, r, cells, pal, n):
    inner = [c for c in cells if 4 < c[0] < 20 and c[1] > 6]
    if not inner: return
    for _ in range(n):
        cx, cy = r.choice(inner)
        for dx, dy, sh in DIAMOND:
            x, y = cx+dx, cy+dy
            if (x,y) in set(cells):
                px[x,y] = pal[{'C':'l','c':'b','x':'d'}[sh]]

def shard(px, r, pal, x0, ytop, ybase):
    for y in range(ytop, ybase+1):
        t = (y-ytop)/max(1,(ybase-ytop))
        w = 1 + t*1.6
        for x in range(int(x0-w), int(x0+w)+1):
            if not (0<=x<24 and 0<=y<24): continue
            if px[x,y][3]>0: continue           # не затирать соседний шард
            px[x,y] = pal['l'] if x < x0 else (pal['b'] if x == int(x0) else pal['d'])
    if 0 <= ytop-1 < 24: px[int(x0), ytop-1] = pal['l']

def gen_ore(shape, pal_hex, seed, path):
    r = random.Random(seed)
    pal = gem_pal(pal_hex)
    im = Image.new('RGBA',(24,24),(0,0,0,0)); px = im.load()
    if shape == 0:      # глыба с вкраплениями
        cells = blob(px, r, 12, 13, r.uniform(8,9.5), r.uniform(8,9))
        sprinkle_gems(px, r, cells, pal, r.randint(4,5))
        for _ in range(7):                      # трещины-шум
            x,y = r.choice(cells)
            if px[x,y][:3]==ROCK['R'][:3]: px[x,y]=ROCK['D']
    elif shape == 1:    # кристальная друза
        for k in range(r.randint(4,5)):
            x0 = 4.5 + k*4.2 + r.uniform(-0.8,0.8)
            shard(px, r, pal, x0, r.randint(3,10), 19)
        blob(px, r, 12, 21, 9.5, 2.6, 0.8)      # каменное основание поверх низа
    elif shape == 2:    # корона: глыба + пики
        cells = blob(px, r, 12, 16, 9.5, 5.5)
        for k in range(3):
            x0 = 7.5 + k*4.5 + r.uniform(-0.8,0.8)
            shard(px, r, pal, x0, r.randint(6,9), 14)
        sprinkle_gems(px, r, cells, pal, 1)
    else:               # жеода с полостью
        cells = blob(px, r, 12, 13, 9.5, 8)
        cav = set()
        for y in range(24):
            for x in range(24):
                if ((x-12)/5.2)**2 + ((y-13)/4.6)**2 <= 1:
                    px[x,y] = hx('1e222b'); cav.add((x,y))
        ring = [(x,y) for (x,y) in cells if (x,y) not in cav and any(
            (x+dx,y+dy) in cav for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)))]
        for i,(x,y) in enumerate(ring):
            px[x,y] = pal['l'] if i%3==0 else (pal['b'] if i%3==1 else pal['d'])
    outline_pass(im)
    im.save(path)

# ---------- шахтёр: база 26x30 + слои экипировки ----------
SKINS = ['e8b08a','d99b6c','c58757']
BEARDS = ['c8632a','8a5a33','9aa0ad','ece8dc']

def gen_miner_base(seed, path):
    r = random.Random(seed)
    skin = hx(r.choice(SKINS)); skin_d = mix(skin,(0,0,0),.18)
    beard = hx(r.choice(BEARDS)); beard_d = mix(beard,(0,0,0),.2)
    long_beard = r.random() < 0.5
    shirt = hx(r.choice(['7d583a','6b6155','5d6b55']))
    ovl = hx('4a5a74'); ovl_d = mix(ovl,(0,0,0),.25)
    im = Image.new('RGBA',(26,30),(0,0,0,0)); px = im.load()
    def rect(x0,y0,x1,y1,c):
        for y in range(y0,y1+1):
            for x in range(x0,x1+1): px[x,y]=c
    rect(7,14,19,17,shirt)                    # рубаха
    rect(7,18,19,23,ovl)                      # комбинезон
    rect(9,14,10,17,ovl); rect(16,14,17,17,ovl)   # лямки
    rect(7,21,19,21,ovl_d)
    rect(4,15,6,18,shirt)                     # рукава
    rect(20,15,22,18,shirt)
    rect(4,19,6,20,skin)                      # ладони
    rect(20,19,22,20,skin)
    for y in range(15,21): px[7,y]=OUTLINE; px[19,y]=OUTLINE   # отделяем руки
    rect(8,24,12,26,ovl_d); rect(14,24,18,26,ovl_d)   # ноги
    rect(7,27,12,29,hx('463222')); rect(14,27,19,29,hx('463222'))  # ботинки по умолчанию
    rect(9,4,17,5,beard_d)                    # волосы под каску
    rect(8,6,18,13,skin)                      # голова
    rect(8,6,9,13,skin_d)
    white=hx('f4efe2'); pupil=hx('26221e')
    rect(10,8,12,10,white); rect(14,8,16,10,white)   # два глаза (белки)
    px[11,9]=pupil; px[15,9]=pupil                   # зрачки
    px[12,9]=pupil; px[16,9]=pupil
    rect(12,11,14,12,skin_d)                  # нос по центру
    # лёгкая щетина на подбородке (борода-стрижка идёт отдельным слоем)
    rect(11,12,15,12,mix(skin,(0,0,0),.12))
    outline_pass(im)
    im.save(path)

# 5 стилей бород (стрижки) — переключаемая косметика
BEARD_STYLES = [
    ("Окладистая", "c8632a"),
    ("Косы",       "8a5a33"),
    ("Раздвоенная","9aa0ad"),
    ("Козлиная",   "6e4a28"),
    ("Патриаршая", "ece8dc"),
]
def gen_beard_styles():
    for i,(nm,col) in enumerate(BEARD_STYLES):
        b=hx(col); bd=mix(b,(0,0,0),.22); bl_=mix(b,(255,255,255),.25)
        im=Image.new('RGBA',(26,30),(0,0,0,0)); px=im.load()
        def R(x0,y0,x1,y1,c):
            for y in range(y0,y1+1):
                for x in range(x0,x1+1):
                    if 0<=x<26 and 0<=y<30: px[x,y]=c
        R(11,12,15,12,bd)                       # усы у всех
        if i==0:                                # окладистая: широкая округлая
            R(9,13,17,15,b); R(10,16,16,20,b); R(11,21,15,22,b)
            R(9,13,10,15,bd); R(16,13,17,15,bd)
        elif i==1:                              # косы
            R(9,13,17,15,b); R(10,16,16,19,b)
            R(10,20,11,25,b); R(15,20,16,25,b)  # две косы вниз
            px[10,26]=hx('e8b93c'); px[15,26]=hx('e8b93c')   # золотые зажимы
            R(9,13,10,15,bd)
        elif i==2:                              # раздвоенная
            R(9,13,17,15,b); R(10,16,16,18,b)
            R(10,19,12,23,b); R(14,19,16,23,b)  # два острия
            R(9,13,10,15,bd)
        elif i==3:                              # козлиная (узкая по центру)
            R(12,13,14,20,b); R(12,13,12,20,bd)
            R(10,13,15,14,b)                     # тонкие усы-щёки
        else:                                   # патриаршая (длинная, но узкая)
            R(10,13,16,15,b); R(11,16,15,24,b); R(12,25,14,26,b)
            R(10,13,11,15,bd); R(12,17,13,23,bl_)  # светлая прядь
        outline_pass(im)
        im.save(f'{OUT}/beard_style_{i}.png')

# кружка эля (спрайт для анимации распития)
def gen_mug():
    im=Image.new('RGBA',(12,14),(0,0,0,0)); px=im.load()
    wood=hx('8a5f38'); woodd=hx('5f3f24'); foam=hx('f4efe2'); ale=hx('c8871f')
    def R(x0,y0,x1,y1,c):
        for y in range(y0,y1+1):
            for x in range(x0,x1+1): px[x,y]=c
    R(2,3,8,12,wood); R(2,3,3,12,woodd)      # кружка
    R(3,1,8,2,foam)                          # пена
    R(4,4,7,6,ale)                           # эль в прозрачной части
    R(8,5,10,9,woodd); R(9,6,9,8,None if False else hx('00000000'))  # ручка
    R(9,6,9,8,hx('8a5f38'))
    outline_pass(im)
    im.save(f'{OUT}/mug.png')

def _layer():  return Image.new('RGBA',(26,30),(0,0,0,0))

def gen_equip_layers(rar_hex, idx):
    c = hx(rar_hex); cl = mix(c,(255,255,255),.35); cd = mix(c,(0,0,0),.3)
    def rect(px,x0,y0,x1,y1,col):
        for y in range(y0,y1+1):
            for x in range(x0,x1+1): px[x,y]=col
    im=_layer(); px=im.load()                 # каска
    rect(px,11,0,15,0,cl); rect(px,9,1,17,2,cl); rect(px,8,3,18,5,c); rect(px,6,6,20,6,cd)
    outline_pass(im); im.save(f'{OUT}/eq_helm_r{idx}.png')
    im=_layer(); px=im.load()                 # роба
    rect(px,10,13,16,13,cd)
    rect(px,6,14,20,16,cl); rect(px,6,17,20,20,c); rect(px,6,21,20,23,cd)
    rect(px,6,20,20,20,mix(c,(0,0,0),.45)); px[13,20]=hx('ffd75e')
    outline_pass(im); im.save(f'{OUT}/eq_robe_r{idx}.png')
    im=_layer(); px=im.load()                 # ботинки
    rect(px,7,26,12,26,cl); rect(px,14,26,19,26,cl)
    rect(px,7,27,12,28,c); rect(px,14,27,19,28,c)
    rect(px,7,29,12,29,cd); rect(px,14,29,19,29,cd)
    outline_pass(im); im.save(f'{OUT}/eq_boots_r{idx}.png')
    im=_layer(); px=im.load()                 # перчатки
    rect(px,3,17,7,20,c); rect(px,3,17,7,17,cl)
    rect(px,19,17,23,20,c); rect(px,19,17,23,17,cl)
    outline_pass(im); im.save(f'{OUT}/eq_glove_r{idx}.png')
    im=_layer(); px=im.load()                 # рюкзак (слева, за спиной)
    rect(px,0,12,6,14,cd); rect(px,0,15,6,22,c); rect(px,1,18,5,19,cd); rect(px,0,23,6,23,cd)
    outline_pass(im); im.save(f'{OUT}/eq_pack_r{idx}.png')

def main2():
    n=0
    for pi,p in enumerate(ORE_PAL):
        for sh in range(4):
            gen_ore(sh, p, seed=pi*10+sh, path=f'{OUT}/ore_p{pi}_s{sh}.png'); n+=1
    for s in range(6):
        gen_miner_base(seed=s*7+1, path=f'{OUT}/miner_b{s}.png'); n+=1
    gen_beard_styles(); n+=5
    gen_mug(); n+=1
    for i,c in enumerate(RARITY):
        gen_equip_layers(c, i); n+=5
    print('v2 generated:', n, 'sprites')

if __name__ == '__main__':
    main()
    main2()
