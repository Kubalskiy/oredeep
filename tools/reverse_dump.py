import glob, re, struct
from loguru import logger; logger.remove()
from androguard.core.dex import DEX

TARGETS = set("""Economy Combat PlayerStats FighterStats Bag GearRarity GearCatalog
ChallengeRewards Skills SkillCatalog Girlfriends GirlfriendRoller Pets PetRoller
LuckyDraw Workouts WorkoutCatalog WorkoutProteinBalance Pvp PvpLeague Clans GymLevel
GymPerk GymCollectionBalance ShopBalance CoachOfferCatalog DailyQuestsBalance DailyQuestsCatalog
BoxerAvatarCatalog OpponentStats HeroResilience Bosses IdleClaim BagUpgrade WorkoutRules
BarnyardBrawl MuscleMania ShowFight BouncerAtTheClub Zookeeper SkillItems GearItems""".split())

def f32(u): return struct.unpack('<f', struct.pack('<I', u & 0xffffffff))[0]
def f64(u): return struct.unpack('<d', struct.pack('<Q', u & 0xffffffffffffffff))[0]

def nice(v, isFloat=False, isWide=False):
    if isWide:
        d=f64(v)
        if -1e12<d<1e12 and abs(d)>1e-6: return f"{d:g}"
    if isFloat:
        fv=f32(v<<16 if abs(v)<0x10000 else v)
        if -1e9<fv<1e9: return f"{fv:g}"
    return str(v)

dexes=[]
for f in sorted(glob.glob("*.dex")):
    try: dexes.append(DEX(open(f,"rb").read()))
    except: pass

def dump(cls):
    out=[]
    for m in cls.get_methods():
        code=m.get_code()
        if not code: continue
        try: inss=list(code.get_bc().get_instructions())
        except: continue
        floats=[]; wides=[]; ints=[]; arrays=[]
        for ins in inss:
            op=ins.get_name()
            o=ins.get_output()
            if op=="const/high16":
                try: floats.append(f32(ins.get_literals()[0]<<16))
                except: pass
            elif op in ("const-wide","const-wide/high16","const-wide/16","const-wide/32"):
                try:
                    lv=ins.get_literals()[0]
                    if op=="const-wide/high16": lv=lv<<48
                    wides.append(f64(lv))
                except: pass
            elif op.startswith("const"):
                try:
                    for l in ins.get_literals():
                        if isinstance(l,int) and -100000<l<100000000: ints.append(l)
                except: pass
            # fill-array-data payload
            if hasattr(ins,'get_data'):
                try:
                    data=ins.get_data()
                    # payload: <ushort ident><ushort width><uint size><bytes>
                    if isinstance(data,(bytes,bytearray)) and len(data)>=8:
                        width=struct.unpack('<H',data[2:4])[0]
                        size=struct.unpack('<I',data[4:8])[0]
                        payload=data[8:]
                        vals=[]
                        if width in (1,2,4,8) and 0<size<400 and len(payload)>=width*size:
                            for i in range(size):
                                chunk=payload[i*width:(i+1)*width]
                                if width==8: vals.append(round(f64(int.from_bytes(chunk,'little')),4))
                                elif width==4:
                                    iv=int.from_bytes(chunk,'little')
                                    fv=f32(iv)
                                    vals.append(round(fv,4) if 1e-6<abs(fv)<1e9 else iv)
                                else: vals.append(int.from_bytes(chunk,'little'))
                            arrays.append(vals)
                except: pass
        line=[]
        fl=[round(x,4) for x in floats if 1e-6<abs(x)<1e9]
        wd=[round(x,6) for x in wides if abs(x)<1e13]
        it=[x for x in ints if x!=0]
        if arrays: line.append("    ARRAY "+str(arrays))
        if wd: line.append("    doubles "+str(wd[:40]))
        if fl: line.append("    floats "+str(fl[:40]))
        if it: line.append("    ints "+str(it[:50]))
        if line:
            out.append(f"  {m.get_name()}{m.get_descriptor()}")
            out+=line
    return out

res={}
for d in dexes:
    for cls in d.get_classes():
        n=cls.get_name()
        if ('/balance/' in n or '/game/' in n or '/ui/sim/' in n):
            sn=n.strip('L;').split('/')[-1]
            if '$' in sn or sn not in TARGETS: continue
            res[sn]=dump(cls)

for sn in sorted(res):
    if res[sn]:
        print(f"\n===== {sn} =====")
        print("\n".join(res[sn]))
