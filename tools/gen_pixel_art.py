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
    light = mix(base,(255,255,255),.45); dark = mix(base,(0,0,0),.3)
    im = Image.new('RGBA',(22,22),(0,0,0,0)); px=im.load()
    def put(x,y,c):
        if 0<=x<22 and 0<=y<22: px[x,y]=c
    # рукоять: диагональ (5,19)->(15,5), 3px
    for i in range(15):
        t=i/14.0
        x=int(5+t*10); y=int(19-t*14)
        put(x,y,WOOD['W']); put(x+1,y,WOOD['w']); put(x+2,y,WOOD['W'])
    # голова: дуга-полумесяц, толщина 3-4
    import math
    for i in range(41):
        t=i/40.0
        # квадратичная дуга от (3,10) через (11,1) к 19,10
        x=(1-t)**2*3 + 2*(1-t)*t*11 + t*t*19
        y=(1-t)**2*10 + 2*(1-t)*t*(-2) + t*t*10
        xi,yi=int(round(x)),int(round(y))
        thick = 4 if 0.25<t<0.75 else (3 if 0.1<t<0.9 else 2)
        for k in range(thick):
            put(xi,yi+k, light if k==0 else (base if k<thick-1 else dark))
    # хомут на стыке
    for dx in range(-1,3):
        for dy in range(0,3):
            put(10+dx,4+dy,dark)
    if gem: put(10,5,hx('fff2b0')); put(11,5,hx('ffd75e'))
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

if __name__ == '__main__':
    main()
