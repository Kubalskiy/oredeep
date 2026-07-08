#!/usr/bin/env python3
"""HQ-генератор пиксель-арта: фасетные кристаллы 32×32 с направленным
светом, палитровыми рампами (5 стопов + спекуляр), дизерингом и обводкой.
Собственная графика (CC0-by-construction)."""
from PIL import Image
import os, math, random

OUT = os.path.join(os.path.dirname(__file__), '..', 'art')
os.makedirs(OUT, exist_ok=True)
OUTLINE = (16,18,24,255)

def hx(s):
    s=s.lstrip('#'); return tuple(int(s[i:i+2],16) for i in (0,2,4))+(255,)
def mix(c,w,t):
    return tuple(int(c[i]+(w[i]-c[i])*t) for i in range(3))+(255,)

def ramp(base_hex):
    b=hx(base_hex); W=(255,255,255); K=(0,0,0)
    return {
      'spec': mix(b,W,.75), 'hi': mix(b,W,.45), 'lit': mix(b,W,.18),
      'mid': b, 'sh': mix(b,K,.28), 'deep': mix(b,K,.5)
    }

# --- рок-основание (тёмная порода под кристаллами) ---
ROCK = {'r':(74,69,84,255),'rd':(52,48,62,255),'rl':(96,90,108,255)}

def dither(x,y): return (x+y)%2==0

def outline(im):
    px=im.load(); w,h=im.size; edge=[]
    for y in range(h):
        for x in range(w):
            if px[x,y][3]==0:
                for dx,dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)):
                    nx,ny=x+dx,y+dy
                    if 0<=nx<w and 0<=ny<h and px[nx,ny][3]>0 and px[nx,ny][:3]!=OUTLINE[:3]:
                        edge.append((x,y)); break
    for x,y in edge: px[x,y]=OUTLINE

def shard(px, r, tipx,tipy, basex,basey, halfw, pal):
    """Гранёный кристалл: левая грань — свет, правая — тень, ребро — блик."""
    steps=int(math.hypot(tipx-basex,tipy-basey))+1
    for i in range(steps+1):
        t=i/max(1,steps)
        cx=basex+(tipx-basex)*t; cy=basey+(tipy-basey)*t
        w=halfw*(1-0.85*t)  # сужается к вершине
        for dx in range(-int(w)-1,int(w)+2):
            x=int(round(cx+dx)); y=int(round(cy))
            if not(0<=x<32 and 0<=y<32): continue
            rel=dx/max(0.5,w)
            if rel<-0.25: c=pal['hi'] if t>0.5 else pal['lit']       # левая грань — свет
            elif rel>0.35: c=pal['sh'] if not dither(x,y) else pal['deep']  # правая — тень+дизер
            else: c=pal['mid'] if dither(x,y) else pal['lit']         # центральное ребро
            px[x,y]=c
    # блик-ребро и вершина
    for i in range(steps//2):
        t=i/max(1,steps); x=int(round(basex+(tipx-basex)*t - (halfw*(1-0.85*t))*0.25)); y=int(round(basey+(tipy-basey)*t))
        if 0<=x<32 and 0<=y<32: px[x,y]=pal['spec'] if i%2==0 else pal['hi']
    if 0<=tipx<32 and 0<=tipy<32: px[int(tipx),int(tipy)]=pal['spec']

def gen_node_hq(color_hex, seed, path):
    r=random.Random(seed); pal=ramp(color_hex)
    im=Image.new('RGBA',(32,32),(0,0,0,0)); px=im.load()
    # основание-порода
    for y in range(21,29):
        halfw=11-abs(y-24)*0.7
        for x in range(int(16-halfw),int(16+halfw)):
            if 0<=x<32:
                c=ROCK['rl'] if y<23 else (ROCK['rd'] if (x+y)%2 and y>26 else ROCK['r'])
                px[x,y]=c
    # 3-5 кристаллов, растущих вверх
    n=r.randint(3,5)
    for k in range(n):
        bx=9+k*(14//max(1,n-1))+r.randint(-1,1)
        by=25-r.randint(0,2)
        th=r.randint(11,18); lean=r.randint(-3,3)
        shard(px, r, bx+lean, by-th, bx, by, r.uniform(2.2,3.4), pal)
    # искры-спекуляр
    for _ in range(r.randint(2,4)):
        x,y=r.randint(8,23),r.randint(6,20)
        if px[x,y][3]>0: px[x,y]=(255,255,255,255)
    outline(im)
    im.save(path)

RARITY = ['8f96a3','5fd068','5aa7e8','b97ae8','e87a7a','e8b93c','7ae8dc','ff9d5c']
def main():
    for i,c in enumerate(RARITY):
        gen_node_hq(c, seed=i*13+1, path=f'{OUT}/node_hq_r{i}.png')
    print('HQ nodes:', len(RARITY))
if __name__=='__main__': main()
