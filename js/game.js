"use strict";
/* Auto-split from index.html — edit here; keep load order: balance → platform → game → ui_screens */

function solveGeometricRatio(n, total, first){
  if(first<=0||n<1||total<first*n) return 1;
  const target=total/first; let lo=0.0001, hi=1e9, r=1;
  for(let i=0;i<80;i++){
    r=(lo+hi)/2;
    const sum=(Math.abs(r-1)<1e-9)? n : (Math.pow(r,n)-1)/(r-1);
    if(sum<target) lo=r; else hi=r;
    if(Math.abs(hi-lo)<1e-9) break;
  }
  return r;
}
function eventReward(spec, level){
  if(spec.flat) return spec.flat;
  const r=solveGeometricRatio(spec.maxLvl, spec.total, spec.first);
  return Math.round(spec.first*Math.pow(r, level-1));
}

const ANCHOR_IDX  = [1, 2000, 20000, 50000];
const ANCHOR_HP   = [225, 200000, 2000000, 10000000];
const ANCHOR_ABR  = [45, 20000, 200000, 1000000];
const ANCHOR_HARD = [11, 5000, 50000, 250000];
const ANCHOR_RESP = [1.0, 1.2, 2.0, 2.0];
const EASE_K = 1.35;
const lerp = (a,b,u)=>a+(b-a)*u;
const growthLerp = (a,b,t)=>lerp(a,b,Math.pow(t,EASE_K));
function anchored(arr, idx){
  if(idx<=ANCHOR_IDX[0]) return arr[0];
  const n=ANCHOR_IDX.length;
  if(idx>=ANCHOR_IDX[n-1]) return arr[n-1];
  let i=0; while(ANCHOR_IDX[i+1]<idx) i++;
  const t=(idx-ANCHOR_IDX[i])/(ANCHOR_IDX[i+1]-ANCHOR_IDX[i]);
  return growthLerp(arr[i],arr[i+1],t);
}

const DEPTH={ escStart:200, rampBlocks:20, hpMul:44 };
function atkLevelsPerBlock(){
  const G=BALANCE.idle.growth*Math.pow(BALANCE.idle.damp,0.4);
  const g=UPGRADES.find(u=>u.id==="atk").g;
  return Math.log(G)/Math.log(g);
}
function escPerBlock(){ return Math.pow(ATK_COMPOUND, atkLevelsPerBlock()); }
function depthEsc(idx){
  idx=Math.min(idx, BALANCE.run.len);
  if(idx<=DEPTH.escStart) return 1;
  const blocks=(idx-DEPTH.escStart)/BALANCE.venueStride;
  const gearComp=(1+idx/60)/(1+DEPTH.escStart/60);
  const ramp=1+(DEPTH.hpMul-1)*Math.min(1,blocks/DEPTH.rampBlocks);
  return Math.pow(escPerBlock(),blocks)*gearComp*ramp;
}
function rockStatsAt(idx, isBoss){
  const m = isBoss?1.5:1, e = depthEsc(idx);

  const a = Math.min(idx, DEPTH.escStart);
  return { hp:anchored(ANCHOR_HP,a)*m*e, abr:anchored(ANCHOR_ABR,a)*e,
           hard:anchored(ANCHOR_HARD,a)*e, resp:anchored(ANCHOR_RESP,idx) };
}
const DMG_HARD_K=0.5, DRAIN_K=0.08, CRIT_MULT=BALANCE.combat.critMul;

const RAR_NAMES=["Common","Rare","Epic","Legendary","Exotic","Mythical","Raised","Space"];
const RAR_SHORT=["Conventional","Redk","Epic","Legend","Exot","Myth","Reson","Cosm"];
const RAR_POW  =BALANCE.gearRarityMul;
const RAR_MULT =[1,3,9,27,80,220,600,1500];

function bagWeights(lvl){
  const W=BALANCE.bagWeights;
  lvl=Math.max(1,Math.min(50,lvl|0));
  const row=W[lvl-1];
  return row?row.slice():[100,0,0,0,0,0,0,0];
}
const SHA256=(function(){
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function rr(x,n){return (x>>>n)|(x<<(32-n));}
  return function(msg){
    const bytes=[]; for(let i=0;i<msg.length;i++){ let c=msg.charCodeAt(i);
      if(c<128) bytes.push(c);
      else if(c<2048){ bytes.push(192|(c>>6),128|(c&63)); }
      else { bytes.push(224|(c>>12),128|((c>>6)&63),128|(c&63)); } }
    const l=bytes.length; bytes.push(0x80);
    while(bytes.length%64!==56) bytes.push(0);
    const bl=l*8;
    for(let i=7;i>=0;i--) bytes.push((bl/Math.pow(2,i*8))&0xff);
    let h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    for(let j=0;j<bytes.length;j+=64){
      const w=new Array(64);
      for(let i=0;i<16;i++) w[i]=(bytes[j+i*4]<<24)|(bytes[j+i*4+1]<<16)|(bytes[j+i*4+2]<<8)|(bytes[j+i*4+3]);
      for(let i=16;i<64;i++){ const s0=rr(w[i-15],7)^rr(w[i-15],18)^(w[i-15]>>>3);
        const s1=rr(w[i-2],17)^rr(w[i-2],19)^(w[i-2]>>>10);
        w[i]=(w[i-16]+s0+w[i-7]+s1)|0; }
      let [a,b,c,d,e,f,g,hh]=h;
      for(let i=0;i<64;i++){ const S1=rr(e,6)^rr(e,11)^rr(e,25); const ch=(e&f)^(~e&g);
        const t1=(hh+S1+ch+K[i]+w[i])|0; const S0=rr(a,2)^rr(a,13)^rr(a,22);
        const mj=(a&b)^(a&c)^(b&c); const t2=(S0+mj)|0;
        hh=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0; }
      h=[(h[0]+a)|0,(h[1]+b)|0,(h[2]+c)|0,(h[3]+d)|0,(h[4]+e)|0,(h[5]+f)|0,(h[6]+g)|0,(h[7]+hh)|0];
    }
    return h.map(x=>("00000000"+(x>>>0).toString(16)).slice(-8)).join("");
  };
})();
function randSeed(){ let s=""; for(let i=0;i<16;i++) s+=Math.floor(Math.random()*16).toString(16); return s; }
function ensureScience(d){ if(!d) return d;
  if(!d.science) d.science={ on:false, done:0, goldOk:0, goldTotal:0 };
  return d; }
function ensureIntro(d){ if(!d) return d;
  if(d.introSeen==null) d.introSeen=true;
  return d; }
function ensureFair(d){ if(!d) return d;
  if(!d.fair){ const server=randSeed();
    d.fair={ server, serverHash:SHA256(server), client:randSeed(), nonce:0, on:false }; }
  return d; }

function fairFloat(){
  const f=S.fair;
  const hex=SHA256(f.server+":"+f.client+":"+f.nonce);
  f.nonce++;
  return parseInt(hex.slice(0,8),16)/0x100000000;
}

function grandom(){ return (S.fair && S.fair.on) ? fairFloat() : Math.random(); }

function rotateFairSeed(){
  const revealed=S.fair.server, revealedHash=S.fair.serverHash;
  const server=randSeed();
  S.fair.server=server; S.fair.serverHash=SHA256(server); S.fair.nonce=0;
  save();
  return { revealed, revealedHash };
}

function rollRarity(w){
  const sum=w.reduce((a,b)=>a+b,0);
  let r=grandom()*sum;
  for(let i=0;i<w.length;i++){ r-=w[i]; if(r<=0) return i; }
  return 0;
}

const SLOTS=[
  {id:"helm",  n:"Helmet",    ic:"⛑️", st:{energy:30,tough:2}},
  {id:"glove", n:"Gloves", ic:"🧤", st:{crit:1.6}},
  {id:"pick",  n:"Pickaxe",    ic:"⛏️", st:{atk:8},           extra:"Find"},
  {id:"lamp",  n:"Lantern",   ic:"🏮", st:{mining:2,luck:1}},
  {id:"pants", n:"Pants",    ic:"👖", st:{tough:2}},
  {id:"boots", n:"Boots",   ic:"🥾", st:{spd:0.35}},
  {id:"pack",  n:"Belt",     ic:"🪢", st:{stone:14}},
  {id:"robe",  n:"Robe",     ic:"🦺", st:{tough:2.5}},
  {id:"pet",   n:"Pet",  ic:"🐉", st:{luck:1.5,mining:3}}
];
function gearSlots(){ return SLOTS.filter(s=>s.id!=="pet"); }
function rollGearSlot(){ const g=gearSlots(); return g[Math.floor(Math.random()*g.length)]; }

const SLOT_FLUFF={
  helm:{
    effect:"Energy — How much of a courtman can hold a man’s dig - I’m going to smoke. — rock And bites less, supports mine He’s been living longer.",
    lore:[
      "Simple shift helmet, chalk lining: “Don’t be a hero. — Come back.“",
      "The scout casca of Nori’s scout. — He said “one more time“ and he found out vein.",
      "The helmet of the Echo Doum Brigade, the visor remembers the names of those who went deep and never came back.",
      "Cascu’s been giving Doreen a ride for the senior shift. — You’ll hear the echo of the vows.",
      "You take runes you don’t teach in Guilds.",
      "The myth of the helmet that’s going to go away. cave-in:: Superstitious — I’m not sure how long they live.",
      "The raised crown of Podgoria, said it was worn by the first person to hear the Zov.",
      "The Indible Space helmet, inside. — Silence of stars; outside — A bang. pickaxe."
    ]
  },
  glove:{
    effect:"Crit — chance to hit a weak spot in the vein: stronger strike, richer reward, stone cracks easier.",
    lore:[
      "Work mittens, smells like resin and a promise to hit again.",
      "Nori’s Gloves, He counted the blows, not the gold. — up tovein before gray beard.",
      "The theft of a fighter digOn the left. — I’m gonna take a short cut for every critical blow to the boss.",
      "Master Girum’s gloves, he broke “fractureless“ vein I’m gonna bet you.",
      "Exotic from the firefly cave: the fabric itself is searching for a crack in the stone.",
      "The mythical crags of the Gala Mountain, the stone is supposed to be a weakness.",
      "The raised gloves of the Ring, everyone yells — It’s like a bell in the depths.",
      "Space gloves of the Void. — He “finds“ where the ore has already given up."
    ]
  },
  pick:{
    effect:"Attack — force of each impact on rockII. Special: pickaxe He’s got a sense of find. — Things and stones in vein.",
    lore:[
      "Student pickaxe. Heavy, honest, nameless — I’m not gonna let you get away with it until you deserve it.",
      "pickaxe On the shoe, the day off.",
      "Combat pickaxe She was being chased. veinwhen the vaults were already singing cave-in.",
      "The legend of Thorin’s blacksmith: “good pickaxe “Remembers the hand of the master.“",
      "Blade-pickaxe It’s like a starship. rocklike a dog’s nose.",
      "Myth of pickaxe- Sings, while it rings. — vein It won’t end in vain.",
      "Raised pickaxe She was on her way to the first Zow.",
      "Space pickaxe The deep, it’s not a rock. — In a world where the ore is hidden."
    ]
  },
  lamp:{
    effect:"Sense — chance of a double hit, rock hits back less often, and rare stones turn up more often.",
    lore:[
      "The oil light is new, coptitis if you lie about the depths. — I don’t even know if it was an accident.",
      "The lamp of the scout, the glass is in the cracks, but the beam still finds the path.",
      "The Ore-Sage Guild lamp burns only while the report stays honest.",
      "Balin’s legendary lamp, which has a thousand-year-old resin oil.",
      "Exotic crystal-flag, looking where luck has already decided for you.",
      "The Mythical Fire of Podgoria, double strike — It’s like two courthouses in the same shadow.",
      "The raised light of Zova, they were lit mineWhere the leg wasn’t.",
      "The Space Lighthouse of the Void. — It’s not an accident, it’s a route."
    ]
  },
  pants:{
    effect:"Defense — less energy lost when the rock hits back; props hold longer.",
    lore:[
      "Hosepants shift, pay more than embroidery.",
      "“Needs don’t take.“ Sciel Grur One-Hand. — I swore I wouldn’t have to do it again.",
      "Bridges. digIn his pocket, a piece of quartz is stuck for good luck.",
      "The legendary Doorin’s legs: they were fought with them. cave-instanding on their knees supports.",
      "The Exotic of the Skin of the Deep Beast — He scratches the stone, and the courtman saves the stone.",
      "Mythical Stoke pants, while you’re standing. — supports He’s keeping you with him.",
      "The guards of the Cathedrals, who were the last to close the exit, wore them.",
      "Nedra space pants. — A truce agreement with Mount."
    ]
  },
  boots:{
    effect:"Speed — legs set the shift pace; the pick hits more often and the vein ends sooner.",
    lore:[
      "Student hobnails — ugly, honest, built to keep you at work.",
      "Borin’s boots by the prop: “He who stands, the Mountain calls.”",
      "Artel dig boots: soles smell of tar, stubbornness, and night shift.",
      "Legendary Hontz shoes — they carried vein news across three halls.",
      "Exotic lava-ash boots — walk soft, strike more often.",
      "Mythic Rhythm boots: the foot knows when the next blow lands.",
      "Ascended Path boots — they went where maps ended.",
      "Cosmic Pulse boots — tuned to the Mountain’s breath."
    ]
  },
  pack:{
    effect:"Greed — more gold for each veinThe belt is drawn to income, not to the beauty of the outfit.",
    lore:[
      "Belt with bag It’s hard to save from the little things and the habit of saving.",
      "Belt trader Silka BeaubeardOn the buckle, “the weight first, then the conscience.“",
      "The belt of the arming treasurer, the buckle clicks when vein I’m not doing anything.",
      "The Legendary Belt of Gold veinThey’ve been measured. loot until the first lie is reported.",
      "The Dragon Cheshua Exotic Belt — Gold sticks itself, conscience. — No, no.",
      "The deeper the meth of the Greed of Mountain, the more the coins in the ears.",
      "Dani’s raised belt, paid by Zov. — And still, they were filling up their pockets.",
      "The Space Belt of Excess. — The law of physics, not vice."
    ]
  },
  robe:{
    effect:"Defense — rock hits drain less energy; your props hold longer through the vein.",
    lore:[
      "Ore stained working robe, rarely washed — “for luck.“",
      "The robot’s shift, “The Fire of the Fire.“ The magma’s stain on his back is wearing the order.",
      "The Guardian’s Cloak mineThe lining is soaked with smoke and orders.",
      "The legendary robe of Kusni: it was used to extinguish sparks when they were licked. pickaxe For heroes.",
      "Exotic silk cape — Light and hot. rock.",
      "Mythical Shield Rob, yet on my shoulders. — The energy is going slower than anger.",
      "The elevated Guardian’s robe, she was put on the watch outside the entrance to the Besdna.",
      "Silence’s Space Rob. — Like Mountain I forgot you were here for a moment."
    ]
  }
};
function gearSlotLoreText(sl, it){
  const f=SLOT_FLUFF[sl&&sl.id]; if(!f) return "";
  const list=f.lore;
  if(Array.isArray(list)){
    if(!it) return "The Slot is empty, history is written by ore and blows — Put on your tiring.";
    const r=Math.max(0, Math.min(7, it.r|0));
    return list[r]||list[0]||"";
  }
  return list||"";
}
function gearSlotArtHtml(sl, it){
  const src=(it?gearArtSrc(sl.id, it.r):null)||SLOT_ART[sl.id]||null;
  if(!src){
    return '<div style="text-align:center;font-size:56px;line-height:1;margin:6px 0 10px;opacity:'+(it?".95":".4")+'">'+(sl.ic||"⚒")+'</div>';
  }
  const empty=!it;
  return '<div class="gearSlotHero" style="text-align:center;margin:4px 0 12px">'
    +'<img src="'+src+'" alt="'+esc(sl.n)+'" class="oreimg slotArt gearSlotImg"'
    +' style="width:96px;height:96px;image-rendering:pixelated;object-fit:contain;'
    +(empty?'opacity:.38;filter:grayscale(.55);':'filter:drop-shadow(0 4px 10px rgba(0,0,0,.75)) brightness(1.08) saturate(1.05);')
    +'"></div>';
}
function gearSlotFluffHtml(sl, it){
  const f=SLOT_FLUFF[sl.id]; if(!f) return "";
  let lore=gearSlotLoreText(sl, it);
  if(sl.id==="pick"&&it&&it.n) lore="«"+it.n+"» · "+lore;
  return '<div class="uiCard" style="margin-top:10px;flex-direction:column;align-items:stretch;gap:8px">'
    +'<div><div class="uiSub" style="color:var(--gold);margin:0 0 4px;font-family:var(--font-display);letter-spacing:.5px">WHAT DOES IT AFFECT?</div>'
    +'<div class="uiSub" style="margin:0;line-height:1.55;color:var(--textBody)">'+esc(f.effect)+'</div></div>'
    +'<div><div class="uiSub" style="color:var(--gold);margin:0 0 4px;font-family:var(--font-display);letter-spacing:.5px">HISTORY</div>'
    +'<div class="uiSub" style="margin:0;line-height:1.55;color:var(--textBody)">'+esc(lore)+'</div></div>'
    +'</div>';
}
const STAT_CAPS={crit:60,luck:100,mining:80,stamina:90,spd:BALANCE.combat.maxAPS};

const MINE_DURAB={max:100, decayPerSec:0.08, safe:50, checkSec:6, baseP:0.008,
  reinfSecOfIncome:25, warnAt:50, critAt:20, penaltyGoldPct:0.08};
function reinforceCost(){ return Math.max(50, Math.round(idlePerSec()*MINE_DURAB.reinfSecOfIncome)); }

const DURAB_SUPPORT_K=2000;
function durabDecayMult(){ const s=Math.max(0,stat("tough")); return Math.max(0.4, 1 - s/(s+DURAB_SUPPORT_K)); }
function collapseRiskPerMin(){
  const d=S.durab==null?MINE_DURAB.max:S.durab;
  if(d>=MINE_DURAB.safe) return 0;
  const f=(MINE_DURAB.safe-d)/MINE_DURAB.safe;
  const pCheck=MINE_DURAB.baseP*f*f;
  const checksMin=60/MINE_DURAB.checkSec;
  return 1-Math.pow(1-pCheck,checksMin);
}

function gearRarityFactor(r){
  const GS=BALANCE.gearStat||{};
  const exp=GS.rarityExp!=null?GS.rarityExp:0.38;
  return Math.pow(RAR_POW[r]||1, exp);
}
function itemStat(item, statId){
  const base=SLOTS.find(s=>s.id===item.s).st[statId]||0;
  if(!base) return 0;
  const GS=BALANCE.gearStat||{};
  const stageDiv=GS.stageDiv||120;
  return base*gearRarityFactor(item.r)*(1+item.i/stageDiv)*item.m;
}
function makeItem(slotId){
  const it={ s:slotId, r:rollRarity(bagWeights(S.bag)), m:0.85+Math.random()*0.3, i:S.stageIdx };
  if(slotId==="pick") it.n=PICK_NAMES[it.r][Math.floor(Math.random()*PICK_NAMES[it.r].length)];
  return it;
}
function sellPrice(item){ return Math.round(veinReward()*(0.5+item.r*1.5)); }

const ART="art/";
const ORE_ICONS=[0,1,2,3,4,5,6,7].map(i=>ART+"ore"+i+".png");
const PICK_ICONS=[0,1,2,3,4,5,6,7].map(i=>ART+"pick"+i+".png");

const ORE_SPRITES=[0,1,2,3,4,5].map(p=>[0,1,2,3].map(v=>ART+"ore_p"+p+"_s"+v+".png"));

const MINER_BASES=[0,1,2,3,4,5,6,7].map(i=>ART+"dwarf"+i+".png");
const SLOT_ART={helm:"art/eq_helm.png",glove:"art/eq_glove.png",lamp:"art/eq_lamp.png",pick:"art/eq_pick.png",
  pants:"art/eq_pants.png",boots:"art/eq_boots.png",pack:"art/eq_pack.png",robe:"art/eq_robe.png"};
function gearArtSrc(slotId, rarity){
  if(slotId==="pick"){
    const r=Math.max(0, Math.min(7, rarity==null?0:(rarity|0)));
    return PICK_ICONS[r];
  }
  if(!SLOT_ART[slotId]) return null;
  if(rarity==null || rarity<0) return SLOT_ART[slotId];
  const r=Math.max(0, Math.min(7, rarity|0));
  return "art/eq_"+slotId+"_r"+r+".png";
}
const BEARD_STYLES=[0,1,2,3,4].map(()=>"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
const BEARD_NAMES=["Goatee","Braids","Forked","Wild","Patriarch"];
const GEO_NAMES_POOL=["Groor One Hand","Balin the mason.","TrollI-in-law","Durin. dig:: . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .",
  "Gimley Tedir.","Farin Mold","Naked Ruddop.","Oin Worcchus","Beafour Kuwald","Dory Scoot",
  "Nadeen Deep","Frr. Beerna","Thorin Hwaston","Kids Fast","Bombour Heavy"];

const BEARD_LEN_ORDER=[3,2,0,1,4];
const BEARD_RANKS=[
  "Peach Fuzz","Stubble","Bearded Recruit","Proud Beard",
  "Seasoned Veteran","Graybeard","Silverbeard","MOUNTAIN PATRIARCH"];

function beardLevel(){ const xp=S.beardXP||0; return Math.min(BEARD_RANKS.length-1, Math.floor(Math.log((xp/140)+1)/Math.log(1.85))); }
function beardWisdom(){
  const lv=beardLevel();
  return { lv, goldPct:lv*3, luckAdd:lv*0.4, title:BEARD_RANKS[lv],
    lenStyle:BEARD_LEN_ORDER[Math.min(4, Math.round(lv*4/(BEARD_RANKS.length-1)))],
    grey:Math.min(1, lv/(BEARD_RANKS.length-1)) };
}
function beardNextXP(lv){ return Math.round(140*(Math.pow(1.85,lv+1)-1)); }
function addBeardXP(n){ const before=beardLevel(); S.beardXP=(S.beardXP||0)+n;
  if(beardLevel()>before){ const w=beardWisdom();
    showToast("🧔","BEARD I’M GROWING UP!","",w.title,"+"+(w.goldPct)+"% Income · +"+w.luckAdd.toFixed(1)+" Good luck.",true);
    sayQuip("beard The clan bows.",4);
    Platform.logEvent("beard_rank",{lv:w.lv});

    ensureSpecial();
    if((S.specialPool||0)<99){ S.specialPool=(S.specialPool||0)+1;
      showToast("🧬","Damn the gnome.","","+1 QUESTION OF CRASACH","distributions in skillx",true); }
  } }
const MUG_ICON="art/ic_mug.png?v=2";
const EQ=(()=>{const o={};for(const k of ["helm","robe","boots","glove","pack"])o[k]=[0,1,2,3,4,5,6,7].map(()=>"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");return o;})();

const PICK_NAMES=[
  ["Wooden","Stone"],
  ["Copper","Bronze"],
  ["Iron","Steel"],
  ["Mithril","Adamantite"],
  ["Orichalcum","Titanium"],
  ["Dragon Claw","Flame"],
  ["Frost","Glacial"],
  ["Godforged","Starforged"]
];

const BAG_NAMES=[[1,"Holey Sack"],[5,"Trader’s Bag"],[10,"Miner’s Bag"],
  [15,"Dwarven Chest"],[20,"Reinforced Chest"],[25,"Secret Chest"],[30,"Dwarven Safe"],
  [35,"Small Treasury"],[40,"Royal Treasury"],[45,"Mountain Vault"],[50,"CHEST OF CHESTS"]];
function bagName(l){ let n=BAG_NAMES[0][1]; for(const p of BAG_NAMES) if(l>=p[0]) n=p[1]; return n; }
function nextBagName(l){ for(const p of BAG_NAMES) if(p[0]>l) return p; return null; }
const DROP_CHANCE=35;
const bagCost=()=> Math.round(veinReward()*(4+S.bag));

function geoWeights(rolls){
  const X=BALANCE.geo.pityX, W=BALANCE.geo.pityW;
  const x=Math.max(0,Math.min(X[X.length-1],rolls));
  let i=0; while(i<X.length-1 && X[i+1]<x) i++;
  if(i===X.length-1) return W[i].slice();
  const t=(x-X[i])/(X[i+1]-X[i]);
  return W[i].map((v,j)=>lerp(v,W[i+1][j],t));
}

const GEO_TYPES=[
  {stat:"atk",   names:["Grandpa Dubaust","Tan Crushibor","Master Couwald.","Gram Granny"],      pct:[12,36,108,324]},
  {stat:"energy",names:["The Knuckle of Hild.","beerWarrior Bodri","Aunt Otwar","Mhov’s cure"], pct:[15,45,135,405]},
  {stat:"stone", names:["Glady’s accountant","trader Nori","The Vorgue","Treasury, Silence"],pct:[10,30,90,270]}
];
const GEO_RAR=["Common","Rare","Epic","Legendary"];
const geoCost=()=> 1;
function bagUpgrading(){ return !!(S.bagActive && Date.now()<S.bagActive.end); }
function bagUpgradeLeft(){ return S.bagActive? Math.max(0,Math.ceil((S.bagActive.end-Date.now())/1000)) : 0; }

function bagUpgradeSec(lv){
  const b=BALANCE.bags, L=Math.max(1,Math.min(49,(lv==null?S.bag:lv)|0));
  const tab=b.upgradeSecFrom;
  if(tab && tab[L]!=null) return Math.max(1, tab[L]|0);
  return Math.max(1, (b.upgradeSec||60)|0);
}
function bagSkipGemsFull(lv){
  const b=BALANCE.bags, per=b.skipSecPerGem||1800;
  return Math.max(1, Math.ceil(bagUpgradeSec(lv)/per));
}
function bagSkipGems(lv){
  const L=lv==null?S.bag:lv;
  const full=bagSkipGemsFull(L);
  if(lv!=null || !S.bagActive) return full;
  const left=bagUpgradeLeft(), dur=Math.max(1,S.bagActive.dur|0);
  return Math.max(1, Math.ceil(full*left/dur));
}
let bagSkipArmed=false;

function finishBagUpgrade(){
  if(!S.bagActive || Date.now()<S.bagActive.end) return false;
  S.bagActive=null;
  bagSkipArmed=false;
  const oldName=bagName(S.bag);
  S.bag++;
  Platform.logEvent("bag_upgrade",{level:S.bag});
  try{ checkPlayAchievements(); }catch(e){}
  if(bagName(S.bag)!==oldName){
    showToast("🧰","New loot bag!","",bagName(S.bag),"Rarity odds improved.");
    sayQuip("Whoa, «"+bagName(S.bag)+"»! Grandpa would approve.",4);
  }
  save(); render();
  if($("chestModal")&&$("chestModal").style.display==="flex") renderChestCard();
  return true;
}
function startBagUpgrade(){
  if(S.bag>=50 || bagUpgrading()) return false;
  const c=bagCost();
  if((S.gold||0)<c) return false;
  if(S.ftue&&!S.ftue.b){ S.ftue.b=1;
    if($("powerUp")&&$("powerUp").classList) $("powerUp").classList.remove("pulse");
    if($("powerUp")&&$("powerUp").classList) $("powerUp").classList.remove("pulse"); }
  S.gold-=c;
  bagSkipArmed=false;
  const sec=bagUpgradeSec();
  S.bagActive={ end:Date.now()+sec*1000, dur:sec, from:S.bag };
  Platform.logEvent("bag_upgrade_start",{next:S.bag+1, sec, skip:bagSkipGems()});
  try{ scheduleBagReadyNotify(); }catch(e){}
  save(); render();
  if($("chestModal")&&$("chestModal").style.display==="flex") renderChestCard();
  return true;
}
function skipBagUpgrade(){
  if(!S.bagActive) return false;
  const gems=bagSkipGems();
  if((S.gems||0)<gems){
    showToast("💎","Not enough gems","","Need "+gems+" 💎","or −1h via ad");
    return false;
  }
  S.gems-=gems;
  S.bagActive.end=Date.now();
  bagSkipArmed=false;
  Platform.logEvent("bag_skip",{gems, paid:true});
  showToast("⏩","Skipped!","","−"+gems+" 💎","bag → lv."+(S.bag+1));
  finishBagUpgrade();
  return true;
}
function bagSkipAdHour(){
  if(!S.bagActive) return false;
  const cut=(BALANCE.bags&&BALANCE.bags.adSkipSec)|3600;
  offerAdReward("bag_skip", ()=>{
    if(!S.bagActive) return;
    S.bagActive.end=Math.max(Date.now(), S.bagActive.end - cut*1000);
    bagSkipArmed=false;
    Platform.logEvent("bag_skip_hour",{sec:cut, ad:true});
    if(Date.now()>=S.bagActive.end){
      showToast("⏩","Timer done","","−"+fmtClock(cut*1000),"bag → lv."+(S.bag+1));
      finishBagUpgrade();
    } else {
      showToast("⏩","−1 hour","","left "+fmtClock(bagUpgradeLeft()*1000));
      save(); render();
      if($("chestModal")&&$("chestModal").style.display==="flex") renderChestCard();
    }
  }, {limitMsg:"−1h skip unavailable"});
  return true;
}
function rollVeinExtras(isBoss){
  const G=BALANCE.gacha||{};
  if(featUnlocked("beards") && Math.random()*100<(isBoss?G.combBossPct:G.combDropPct||0)){
    S.combs=(S.combs||0)+1;
    if(!FAST()) showToast("🪮","comb!","","+1 · for gacha elder");
    Platform.logEvent("comb_drop",{boss:!!isBoss});
  }
  if(featUnlocked("pets") && Math.random()*100<(isBoss?G.eggBossPct:G.eggDropPct||0)){
    S.eggs=(S.eggs||0)+1;
    if(!FAST()) showToast("🥚","egg!","","+1 · for gacha pet");
    Platform.logEvent("egg_drop",{boss:!!isBoss});
  }
}

const MINES=[
  {n:"Adit «Newbie Beard»", rock:"🪨", stones:["Orphan Coal","Button Copper","Quartz «almost diamond»","Dwarf Gold (real)","Great-Grandpa Beard Topaz","Snob Sapphire","Thane Diamond","Tear of the Mountain"]},
  {n:"Halls of Echo-Doom", rock:"⛰️", stones:["Echo-Grade Gravel","Axe Iron","Introvert Amethyst","Envious Emerald","Ruby «dragon eye (not)»","Mithril (shh!)","Black Diamond","Shard of the First Song"]},
  {n:"Forge of Underhill Fire", rock:"🌋", stones:["Singed Obsidian","Sulfur «what a stink»","Granny’s Garnet","Fire Opal","Tempered Platinum","Lava Sapphire","Smithy Adamant","Heart of the Hearth"]},
  {n:"Crystal Halls", rock:"🧊", stones:["Impostor Calcite","Glowing Fluorite","Feast Crystal","Giant Emerald","Tanzanite Rare Guest","Moonstone (not from the Moon)","Star Diamond","Crystal of the Depths"]},
  {n:"Abyss «Do Not Wake Him»", rock:"🗿", stones:["Shale «why are you here»","Anxious Nickel","Table Silver","Nugget «MOM, I FOUND IT»","Whisper Iridium","True Mithril","Abyss Adamantium","HIS Scale"]}
];

const ROCK_POOLS=[
  ["Enduring Cobble","Stubborn Seam","Ordinary Boulder","Rock with Character"],
  ["Echo Slab","Rumbling Seam","Greedy Vein","Resonant Boulder"],
  ["Scorched Seam","Slag Slab","Vein with a Kick","Lava Stubborn"],
  ["Show-off Druse","Crystal Seam","Faceted Slab","Untouchable Vein"],
  ["Silent Monolith","Dark Seam","Vein «don’t look»","Dream Boulder"]
];
const BOSS_POOLS=[
  ["Grandpa Boulder","Clumsy Cartilage","Senior Cobble"],
  ["Echo Golem","Rumbling Monolith","Cave-In Choir"],
  ["Magma Grandpa","Slag Tan","Undercooked Golem"],
  ["Crystal Snob","Count Druse","Mirror Hulk"],
  ["IT (junior)","Whisper-in-the-Wall","HIS Pinkie"]
];
const STAGES_PER_MINE=BALANCE.venueStride;
const RANKS=["BEARDLESS","ALMOST A GNOME","ORE DIGGER","FACE WORKER","THANE OF THE FACE","BEARD LEGEND",
  "TERROR OF THE DEPTHS","MAGNATE OF THE DEEPS","UNDERHILL KING","LEGEND OF THE MOUNTAIN"];

const BASE={atk:10, spd:BALANCE.combat.baseAPS, mining:10, crit:5, luck:10, stone:120, energy:70, tough:0, regen:0, stamina:0};

const STAT_LBL={
  atk:"Attack", energy:"Energy", spd:"Pace", tough:"Defense",
  crit:"Crit", luck:"Luck", mining:"Sense", stone:"Greed",
  regen:"Regen", stamina:"Wind"
};
function statLbl(id){ return STAT_LBL[id]||id; }
const UPGRADES=[
  {id:"atk",   k:"Attack",  step:3,   base:25, g:1.35, fmt:v=>fmt(v)},
  {id:"energy",k:"Energy",  step:20,  base:20, g:1.32, fmt:v=>fmt(v)},
  {id:"spd",   k:"Pace",    step:0.12,base:40, g:1.35, fmt:v=>v.toFixed(2)},
  {id:"tough", k:"Defense", step:2,   base:35, g:1.45, fmt:v=>fmt(v)},
  {id:"crit",  k:"Crit",    step:1,   base:50, g:1.6,  fmt:v=>Math.round(v)+"%"},
  {id:"luck",  k:"Luck",    step:1,   base:50, g:1.55, fmt:v=>Math.round(v)+"%"},
  {id:"mining",k:"Sense",   step:2,   base:45, g:1.5,  fmt:v=>Math.round(v)},
  {id:"stone", k:"Greed",   step:10,  base:30, g:1.4,  fmt:v=>(v>=1000?fmt(v):Math.round(v))+"%"}
];
const upCost=u=>Math.round(u.base*Math.pow(u.g,S.lvls[u.id]));

function gearSum(statId){
  let s=0;
  for(const k in S.gear){ if(S.gear[k]) s+=itemStat(S.gear[k],statId); }
  if((S.sets||{}).mythic) s*=1.4;
  return s;
}
const ATK_COMPOUND=1.12;
function statRaw(id, gearAdd){
  if(gearAdd==null) gearAdd=gearSum(id);
  const u=UPGRADES.find(x=>x.id===id);
  let v=BASE[id]+(u?u.step*S.lvls[id]:0)+gearAdd;
  if(id==="atk") v+=(S.echo||0);
  if(id==="atk") v*=Math.pow(ATK_COMPOUND,S.lvls.atk||0);
  if(id==="atk"||id==="energy"||id==="tough") v*=prestigeMult();
  if(S.geo && GEO_TYPES[S.geo.t].stat===id) v*=(1+geoPct(S.geo)/100);
  if(id==="stone") v+=2*uniqueStones();
  for(const sd of SKILL_DEFS){ if(sd.stat===id) v+=skillBonus(sd.id); }
  v+=stickerBonus(id);
  if(id==="luck") v+=beardWisdom().luckAdd;
  { const sp=specialBonusPct(id); if(sp) v*=(1+sp/100); }
  { const pk=perkBonusPct(id); if(pk) v*=(1+pk/100); }
  const sets=S.sets||{};
  if(id==="atk"&&sets.berserk) v*=1.5;
  if(id==="crit"&&sets.berserk) v+=20;
  if(id==="stone"&&sets.greed) v*=2;
  if(id==="energy"&&sets.guardian) v*=1.8;
  if(id==="luck"&&sets.lucky) v+=25;
  const petPct=petBonus(id), wkPct=workoutBonus(id);
  if(petPct||wkPct) v*=(1+(petPct+wkPct)/100);
  for(let k=0;k<SET_BONUS.length;k++){
    if(SET_BONUS[k].stat===id && setDone(k))
      v = SET_BONUS[k].flat ? v+SET_BONUS[k].flat : v*(1+SET_BONUS[k].pct/100);
  }
  { const gp=gymPerkPct(); if(gp) v*=(1+gp/100); }
  return v;
}
function gearOverflowRoutes(){
  const GS=BALANCE.gearStat||{};
  const routes=GS.overflowRoute||{crit:"atk",luck:"stone",mining:"atk",spd:"energy",stamina:"regen"};
  const frac=GS.overflowFrac!=null?GS.overflowFrac:0.4;
  const routeScale=GS.routeScale||{atk:0.12,stone:1.5,energy:6,regen:0.4};
  const out={};
  for(const src in routes){
    if(STAT_CAPS[src]==null) continue;
    const cap=STAT_CAPS[src];
    const core=statRaw(src,0);
    const gear=gearSum(src);
    const room=Math.max(0, cap-core);
    const gearOverflow=Math.max(0, gear-room);
    if(gearOverflow<=0) continue;
    const dest=routes[src];
    const scale=routeScale[dest]!=null?routeScale[dest]:1;
    out[dest]=(out[dest]||0)+gearOverflow*frac*scale;
  }
  return out;
}
function gearStatMult(id){
  if(STAT_CAPS[id]==null) return 1;
  const GS=BALANCE.gearStat||{};
  const on=GS.overflowMultOn||{};
  if(on[id]===false||on[id]===0) return 1;
  const cap=STAT_CAPS[id];
  const core=statRaw(id,0);
  const gear=gearSum(id);
  const room=Math.max(0, cap-core);
  const gearOverflow=Math.max(0, gear-room);
  if(gearOverflow<=0) return 1;
  const toMult=GS.overflowToMult!=null?GS.overflowToMult:0.6;
  const maxM=GS.maxOverflowMult!=null?GS.maxOverflowMult:50;
  return Math.min(maxM, 1+(gearOverflow*toMult)/cap);
}
const statCapped=id=>STAT_CAPS[id]!=null && statRaw(id,0)>=STAT_CAPS[id]-1e-9;
function statFmtDisplay(u){
  const id=u.id, mult=gearStatMult(id);
  if(STAT_CAPS[id]!=null && mult>1.005){
    const filled=Math.min(STAT_CAPS[id], statRaw(id,0)+gearSum(id));
    return u.fmt(filled)+" ×"+mult.toFixed(1);
  }
  return u.fmt(stat(id));
}
function stat(id){
  const routed=gearOverflowRoutes()[id]||0;
  if(STAT_CAPS[id]==null) return statRaw(id, gearSum(id)+routed);
  const cap=STAT_CAPS[id];
  const filled=Math.min(cap, statRaw(id,0)+gearSum(id));
  const mult=gearStatMult(id);
  if(id==="spd") return Math.max(BALANCE.combat.baseAPS, filled*mult);
  return filled*mult;
}

function prestigeLevelsFor(stageIdx){ return Math.floor(Math.sqrt(stageIdx/BALANCE.prestige.div)); }
function prestigeGain(){

  const byDepth=Math.max(0, prestigeLevelsFor(S.stageIdx)-(S.prestigeLv||0));
  return S.runDone ? Math.max(1, byDepth) : byDepth;
}
function canPrestige(){
  if(S.runDone) return true;
  return S.stageIdx>=BALANCE.prestige.minStage && prestigeGain()>0;
}
function prestigeMult(){ return Math.pow(BALANCE.prestige.powPerLevel, S.prestigeLv||0); }
function echoFromGear(){
  let p=0; for(const k in S.gear){ if(S.gear[k]) p+=itemPower(S.gear[k]); }
  return p*BALANCE.prestige.echoFrac;
}
function doPrestige(){
  if(!canPrestige()){
    showToast("⛰️","Early","","Deep Call is not heard","I need a phase. "+BALANCE.prestige.minStage+"+ And at least 1 level");
    return false;
  }
  const gain=prestigeGain(), addEcho=echoFromGear();
  S.prestigeLv=(S.prestigeLv||0)+gain;
  S.prestigeRuns=(S.prestigeRuns||0)+1;
  S.echo=(S.echo||0)+addEcho;

  S.gold=0; S.gear={}; S.stageIdx=1; S.stage=1; S.mine=0; S.bag=1;
  S.lvls={atk:0,energy:0,spd:0,tough:0,crit:0,luck:0,mining:0,stone:0};
  S.loadoutTier=0; S.cartFill=0; S.durab=MINE_DURAB.max; S.runDone=false; S._wallShown=false; resetTimers();
  fpResetLevelTrack();

  dead=false; if($("overlay")) $("overlay").style.display="none";
  Platform.logEvent("prestige",{lv:S.prestigeLv,gain});
  try{ unlockPlayAchievement("prestige_1"); }catch(e){}
  showToast("⛰️","DEEP CALL!","","Prestige "+S.prestigeLv,"+"+gain+" Lv. · attack ×"+fmt(prestigeMult()),true);
  sayQuip("Mountain She’s calling again. beard I remember everything.",5);
  try{ jingleSet(); }catch(e){}
  newRock(); save(); render();
  return true;
}

function idleGoldPerDay(){
  const idx=Math.min(S.stageIdx, BALANCE.run.len);
  const block=Math.floor(idx/BALANCE.venueStride);
  const within=(idx%BALANCE.venueStride)/BALANCE.venueStride;
  const A=block+within, B=block*0.4;
  return BALANCE.idle.base*Math.pow(BALANCE.idle.growth,A)*Math.pow(BALANCE.idle.damp,B);
}
const idlePerSec=()=>Math.max(1, idleGoldPerDay()/86400*(stat("stone")/100)*(1+beardWisdom().goldPct/100)*(typeof growthCoopMult==="function"?growthCoopMult():1));
function veinReward(){ return Math.max(5, idlePerSec()*8); }

function pickBonusFind(){ return S.gear.pick ? S.gear.pick.r*4 : 0; }
function findChance(){
  let c=8 + pickBonusFind() + stat("luck")-BASE.luck;
  if((S.sets||{}).lucky) c*=1.5;
  return Math.min(50, c);
}
function stoneWeights(){
  const shift=S.gear.pick ? S.gear.pick.r*3 : 0;
  return bagWeights(Math.min(50,S.bag+shift));
}
const FIND_TARGET=0.15;
function stoneValue(ri){
  const w=stoneWeights();
  const avg=w.reduce((a,wi,i)=>a+wi*RAR_MULT[i],0)/100;
  const chance=findChance()/100;
  const v=veinReward()*FIND_TARGET*RAR_MULT[ri]/(chance*avg);
  return Math.round(Math.max(veinReward()*0.15,v));
}
function onFind(forceR){
  const ri=(forceR!==undefined)?forceR:rollRarity(stoneWeights());
  const mineKey=S.mine%MINES.length;
  const name=MINES[mineKey].stones[ri];
  const val=stoneValue(ri);
  if(!S.best||ri>=S.best.r) S.best={r:ri,name:name};
  dailyProgress("find",1);
  S.col[mineKey]=S.col[mineKey]||{};
  const had=S.col[mineKey][ri]||0;
  S.col[mineKey][ri]=had+1;
  let extra;
  if(had>0){ S.gold+=val; const sh=BALANCE.shardYield[ri]||0;
    if(sh) S.shards=(S.shards||0)+sh;
    if(FAST()){ dupN++; dupGold+=val; dupShards+=sh; return; }
    extra = sh ? ("duplicate → +"+fmt(val)+" 🪙 · +"+sh+" 💠")
               : ("duplicate → trader +"+fmt(val)+" 🪙"); }
  else if(setDone(mineKey)){
    extra="SETH IS ASSEMBLED! FOREVER: "+SET_BONUS[mineKey].label;
    Platform.logEvent("set_complete",{mine:mineKey});
    sayQuip("- The whole set! Mountain I’m singing!",5);
    jingleSet();
  }
  else { extra="Into the collection! +2% Greed Forever"; jingleFind(); }
  sayQuip(FIND_QUIPS[Math.floor(Math.random()*FIND_QUIPS.length)]);
  showToast(`<img src="${ORE_ICONS[ri]}" class="oreimg big">`,RAR_NAMES[ri],"r"+ri,name,extra);
}

const SET_BONUS=[
  {stat:"atk",   pct:100, label:"×2 Attack — “The Anger of the Mountain“"},
  {stat:"energy",pct:100, label:"×2 Energy — “Glubin Breath“"},
  {stat:"stone", pct:150, label:"×2.5 Greed — “Gorn’s Heat“"},
  {stat:"luck",  flat:15, label:"+15% Good luck. — “The Light of Crusal“"},
  {stat:"atk",   pct:200, label:"×3 Attack — “His blessing“"}
];
function uniqueStones(){ let n=0; for(const k in S.col) n+=Object.keys(S.col[k]).length; return n; }
function setDone(k){ return Object.keys(S.col[k]||{}).length===8; }

let S=null;
function freshState(){
  return { v:4, gymXP:0, stickers:{}, petLegSeen:0, pvpDay:'', pvpFights:0, pvpBotRec:{}, shopFree:{day:'', taken:{}}, runDone:false, _wallShown:false, science:null, introSeen:true, fair:null, playerName:"", bestDepth:0, prestigeLv:0, prestigeRuns:0, echo:0, bags:(BALANCE.bags&&BALANCE.bags.starter)|0, autoRoll:false, autoRollTier:4, petBox:{}, geoBox:{}, skillCards:{}, chestKeys:1, pickLog:{}, beard:0, beardXP:0, cartFill:0, cartRuns:0, shards:0, boxes:[], loadoutTier:0, frags:{}, sets:{}, keyAt:Date.now(), gems:50, trophies:0, keys:2, eventRun:null, skills:{}, special:{s:5,p:5,e:5,c:5,i:5,a:5,l:5}, specialPool:5, skillPts:0, minerLv:0, veinsBroken:0, skillTags:[], trained:{}, perks:[], perkPicks:0, traits:[], traitPicks:0, perkBought:0, traitBought:0, wheelSpins:0, pvpWins:0, protein:200, wkPts:0, eggs:0, combs:0, pet:null, petRolls:0, workouts:{}, wkActive:null, bagActive:null, daily:{day:'',prog:{},tok:0,claimed:[]}, noAds:false, gold:0, stageIdx:1, mine:0, stage:1, bag:1, speed:1, look:Math.floor(Math.random()*6), lastSeen:0, ftue:{u:0,b:0,c:0,t:0,m:0,g:0}, featToast:{}, streak:{n:0,last:""}, best:null,
    growth:{ installId:"", installAt:0, code:"", referredBy:"", invites:0, milestones:[], coopUntil:0,
      waitlist:{joined:false,claimed:false,at:0}, starterBought:false, organic:true,
      ads:{day:"",count:0}, adViewsLifetime:0, revenueCents:0 },
    lvls:{atk:0,energy:0,spd:0,tough:0,crit:0,luck:0,mining:0,stone:0},
    gear:{}, geo:null, geoRolls:0, col:{}, rockHP:0, energy:0 };
}

const DEPTH_MARKS=[
  [30,"First gems","It’s already shining."],
  [90,"Band-Aids","Echo’s not answering immediately."],
  [300,"Old works","Someone dug up our asses."],
  [900,"Warm stones","The stones are warm."],
  [3000,"The Heart of the Mountain is Near","It’s not mine. pickaxe."],
  [15000,"♪ He can hear you ♪","We’re digging a t-i-haw."],
  [150000,"The bottom of peace","Let’s just go upstairs, just kidding, we’re going to go."]
];
function playerName(){ return S.playerName || ("King-"+(S.look!=null?S.look:0)); }
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function submitMyScore(){
  const depth=S.stageIdx*3;
  if(depth<=(S.bestDepth||0) && (S.prestigeLv||0)===(S.bestPrestige||0)) return;
  S.bestDepth=Math.max(S.bestDepth||0,depth);
  S.bestPrestige=Math.max(S.bestPrestige||0,S.prestigeLv||0);
  try{ Platform.submitScore({name:playerName(),depth:S.bestDepth,prestige:S.bestPrestige}); }catch(e){}
  try{ trackPlayEvent("depth_best", Math.max(1, S.bestDepth|0)); checkPlayAchievements(); }catch(e){}
}
function checkDepthMark(prevIdx){
  const d0=prevIdx*3, d1=S.stageIdx*3;
  for(const [m,title,quip] of DEPTH_MARKS){
    if(d0<m && d1>=m){
      showToast("⛏️","♪ The ♪ "+fmt(m)+" m","",title,"Mountain Marks your path");
      sayQuip(quip,4);
      Platform.logEvent("depth_mark",{m}); addBeardXP(60);
      break;
    }
  }
}

const IDLE_QUIPS=[
  "It’s not even a tax one that gets that far.",
  "beard In dust — It’s been a good day.",
  "My father was digging, and I’m a redhead.",
  "The Elves wouldn’t be here.veinAnd no offense.",
  "You hear the knock?",
  "The main rule of the mine is don’t wake up.",
  "Who drank my ale?! vein.",
  "Cardio?",
  "Don’t look in the abyss.",
  "Mifriel won’t find himself.",
  "- Do you know what I mean? — Who is it? — Rich!",
  "The helmet is pinning, so it’s getting a little bit head-growing."
];
const FIND_QUIPS=["I swear to God, it’s brilliant. beard!","In the chest, quickly, shut up.","Grandpa would cry.","It’s not a stone."];
const BOSS_QUIPS=["Shh... he can hear pickaxe.","Big Stone — A great glory.","For beard Grandpa!"];
const KO_SCREENS=[
  ["BREAK IN THE HALLS","🍺 You earned this beer 🍺"],
  ["YOU’RE NOT GONNA DIG IT!","🍺 vein - You’re standing there. — And again in dig 🍺"],
  ["BEARD I’M DUSTY.","🍺 The power’s out early. rock 🍺"]
];

const FEED_CAP=3;
var feedBuf=[];
let quipHide=0, quipNext=6;
function renderFeed(){
  const lines=$("feedLines"), empty=$("feedEmpty");
  if(!lines) return;
  if(!feedBuf.length){
    lines.innerHTML="";
    if(empty) empty.style.display="";
    return;
  }
  if(empty) empty.style.display="none";
  lines.innerHTML=feedBuf.map(e=>
    `<div class="feedLine ${esc(e.kind||"")}"><span class="feedTxt"><b>${esc(e.who)}:</b> ${esc(e.text)}</span></div>`
  ).join("");
}
function pushFeed(who, text, kind){
  const t=String(text||"").replace(/\s+/g," ").trim();
  if(!t) return;
  const w=String(who||"Event");
  const k=kind||"event";
  const last=feedBuf[feedBuf.length-1];
  if(last && last.who===w && last.text===t) return;
  feedBuf.push({who:w, text:t, kind:k});
  while(feedBuf.length>FEED_CAP) feedBuf.shift();
  renderFeed();
}
function feedWhoFromToast(rar, name, extra){
  const blob=[rar,name,extra].filter(Boolean).join(" ");
  if(/Level|Upgrad|PASS|bag|KRASAVA|perk|Coach|Lv\./i.test(blob)) return {who:"Upgrade", kind:"up"};
  if(/Cup|store|Pack|Promotional|No-Ads|No advertising|Starter|Waitlist|gems/i.test(blob)) return {who:"Purchased", kind:"buy"};
  if(/On.|sold|chest|Find|duplicate|Collection|pet|COMMON|RARE|EPIC|LEGENDARY|EXOTIC|MYTHIC|ASCENDED|COSMIC/i.test(blob))
    return {who:"Loot", kind:"loot"};
  if(/Borin|Replica|dig|beard/i.test(blob)) return {who:"Borin", kind:"quip"};
  return {who:"Event", kind:importantFeedKind(blob)};
}
function importantFeedKind(blob){
  if(/Level|prestige|CALL|SET/i.test(blob)) return "hot";
  return "event";
}
function sayQuip(t,dur){
  pushFeed("Borin", t, "quip");
  quipNext=9+Math.random()*(dur?dur+4:8);
  quipHide=0;
  const b=$("bubble"); if(b) b.classList.remove("show");
}

let rock, hitTimer=0, respTimer=0, dead=false, pendingDrop=null, durabTimer=0, lastDurabWarn=100, regenAcc=0;
let _overlayKind=null, _overlaySipped=false, _collapseLost=0, _lastVeinGold=0;

function resetTimers(){
  hitTimer=0; respTimer=0; durabTimer=0; autoRollAcc=0; logAcc=0;
  autoSoldN=0; autoSoldGold=0; dupN=0; dupGold=0; dupShards=0; sellN=0; sellGold=0; equipN=0;
  lastDurabWarn=MINE_DURAB.max;
}
function fpLevelNumber(){ return Math.max(1, (S&&S.stageIdx)|0); }
function fpBalance(){ return { gold: Math.round((S&&S.gold)||0), gems: (S&&S.gems)|0 }; }
let _fpLevelKey=null, _fpLevelDone=null, _fpLevelT0=0;
function fpLevelKey(){ return (S.mine|0)+":"+(S.stageIdx|0); }
function fpResetLevelTrack(){ _fpLevelKey=null; _fpLevelDone=null; _fpLevelT0=0; }
function fpNoteLevelStart(){
  if(!S) return;
  const key=fpLevelKey();
  if(_fpLevelKey===key) return;
  _fpLevelKey=key;
  _fpLevelT0=Date.now();
  const n=fpLevelNumber();
  try{ Platform.logEvent("game_level_start", { level_number:n, level_id:String(n) }); }catch(e){}
}
function fpLevelTime(){ return Math.max(1, Math.round((Date.now()-(_fpLevelT0||Date.now()))/1000)); }
function fpCompleteLevel(){
  if(!S) return;
  const key=fpLevelKey();
  if(_fpLevelDone===key) return;
  _fpLevelDone=key;
  const n=fpLevelNumber();
  try{
    Platform.logEvent("game_level_complete", {
      level_number:n, level_id:String(n), balance:fpBalance(), time:fpLevelTime()
    });
    Platform.logEvent("af_level_achieved", { af_level:n });
    if(n===5||n===10||n===15||n===20) Platform.logEvent("af_level_achieved"+n, { af_level:n });
  }catch(e){}
}
function fpFailLevel(){
  if(rock && (rock.isRaid || rock.isEvent)) return;
  if(S && _fpLevelDone===fpLevelKey()) return;
  const n=fpLevelNumber();
  let progress=0;
  if(rock && rock.hp) progress=Math.round(100*(1-Math.max(0, S.rockHP||0)/rock.hp));
  try{
    Platform.logEvent("game_level_failed", {
      level_number:n, level_id:String(n), balance:fpBalance(),
      time:fpLevelTime(), progress:Math.max(0, Math.min(100, progress))
    });
  }catch(e){}
}
function newRock(){
  const isBoss=(S.stageIdx % BALANCE.combat.bossEvery)===0;
  rock=rockStatsAt(S.stageIdx,isBoss);
  rock.isBoss=isBoss;
  rock.isRaid=false;
  { const d=petDot();
    if(d){ if(d.kind==="shock")  rock.hard*=(1-d.defCut);
           if(d.kind==="splash") rock.resp*=(1-d.spdCut); } }

  if(S.eventRun && S.eventRun.id){
    const er=S.eventRun;
    const baseMul=(BALANCE.events&&BALANCE.events.hpMul)||3;
    const mul=baseMul*(1+0.18*(er.wave|0));
    rock.isRaid=true; rock.isBoss=true; rock.isEvent=true;
    rock.hp=Math.max(rock.hp+1, Math.round(rock.hp*mul));
  } else if(S.mineRaid && (S.mineRaid.mineId|0)===(S.mine%MINES.length)){
    const mul=(BALANCE.mineRaid&&BALANCE.mineRaid.hpMul)||5;
    rock.isRaid=true; rock.isBoss=true;
    rock.hp=Math.max(rock.hp+1, Math.round(rock.hp*mul));
  }
  S.rockHP=rock.hp;
  S.energy=stat("energy");
  try{ snapRockHpBars(100); }catch(e){}
  const mk=S.mine%MINES.length, cycle=Math.floor(S.mine/MINES.length);
  { const _p=ORE_SPRITES[rock.isBoss?5:mk]||ORE_SPRITES[0]; const _si=Number(S.stageIdx)||0; $("rockImg").src=_p[((_si*7+mk)%4+4)%4]||_p[0]; }
  if(rock.isEvent && S.eventRun){
    const er=S.eventRun;
    $("rockName").textContent=(er.ic||"◎")+" "+(er.n||"Yvent")+" · "+((er.wave|0)+1)+"/"+(er.waves||1);
  } else if(rock.isRaid && S.mineRaid){
    $("rockName").textContent="SPECIAL STONE · "+(S.mineRaid.n||"Award")+" "+(S.mineRaid.ic||"");
  } else {
    $("rockName").textContent=rock.isBoss
      ? BOSS_POOLS[mk][cycle%BOSS_POOLS[mk].length]+" (Boss)"
      : ROCK_POOLS[mk][S.stageIdx%ROCK_POOLS[mk].length];
  }
  if(rock.isEvent) sayQuip("The key only goes down if you finish all the waves.",4);
  else if(rock.isRaid) sayQuip("A special stone! — hall He’ll give it to you.",4);
  else if(rock.isBoss) sayQuip(BOSS_QUIPS[Math.floor(Math.random()*BOSS_QUIPS.length)],4);
  try{
    if(isDailySharedVein()){
      $("rockName").textContent="🌐 Shared vein #"+dailyVeinSeed()+" · "+($("rockName").textContent||"Rock");
      rock.isDailyShared=true;
    }
  }catch(e){}
  $("rockName").classList.toggle("bosslabel",!!rock.isBoss);
  $("rock").classList.toggle("boss",!!rock.isBoss);
  $("rock").classList.toggle("raid",!!rock.isRaid);
  $("scene").className="scene t"+(S.mine%MINES.length);
  prepBuried();
  if(!rock.isRaid && !rock.isEvent) fpNoteLevelStart();
}

function prepBuried(){
  rock.buried={item:null, stoneR:-1};

  const dropRoll=(rock.isBoss||S.stageIdx<=3)?100:DROP_CHANCE;
  if(Math.random()*100<dropRoll){
    const slot=rollGearSlot();
    rock.buried.item=makeItem(slot.id);
  }

  if(S.stageIdx===2 && uniqueStones()===0) rock.buried.stoneR=0;
  else if(Math.random()*100<findChance()) rock.buried.stoneR=rollRarity(stoneWeights());

  const pk=$("peek");
  if(rock.buried.stoneR>=0){ pk.src=ORE_ICONS[rock.buried.stoneR]; pk.dataset.on="1"; }
  else if(rock.buried.item){
    const it=rock.buried.item;
    pk.src=(it.s==="pick")?PICK_ICONS[it.r]:ORE_ICONS[it.r];
    pk.dataset.on="1";
  } else { pk.dataset.on=""; }
  pk.classList.remove("pop");
  updatePeek();
}

function updatePeek(){
  const pk=$("peek");
  if(!rock||!rock.buried||pk.dataset.on!=="1"){ pk.style.display="none"; return; }
  pk.style.display="block";
  const broken=1-Math.max(0,S.rockHP)/rock.hp;
  const hidden=Math.round((1-broken)*70);
  pk.style.clipPath="inset("+hidden+"% 0 0 0)";
  pk.style.transform="translateY("+Math.round(hidden*0.12)+"px)";
}
function oneStrike(){
  let dmg=Math.max(stat("atk")*0.15, stat("atk")-rock.hard*DMG_HARD_K);
  let crit=false;
  if(Math.random()*100<stat("crit")){ dmg*=CRIT_MULT; crit=true; }
  if(Math.random()*100<stat("mining")) dmg*=2;
  S.rockHP-=dmg;
  fxDamage(dmg,crit); sfxHit(crit);
  return S.rockHP<=0;
}
function minerHit(){
  fxSwing();
  let broke=oneStrike();

  if(!broke){
    let extra=0;
    while(extra<BALANCE.combat.maxCombo && Math.random()*100<stat("stamina")){
      extra++;
      if(oneStrike()){ broke=true; break; }
    }
  }
  updatePeek();
  if(broke) breakVein();
}
function rockRespond(){
  if(Math.random()*100<stat("luck")) return;
  const drain=Math.max(1, rock.abr*DRAIN_K-stat("tough"));
  S.energy=Math.max(0,S.energy-drain);
  if(S.energy<=0) exhausted();
}
function cartCapacity(){ return 8; }
function renderCart(){
  const g=$("cartOre"); if(!g) return;
  const cap=cartCapacity(), n=Math.min(cap, Math.round(S.cartFill||0));
  const pal=["#8a6a3a","#a5824a","#6e5230","#9a7440"];

  const rows=[
    [[9,4],[15,4],[21,4],[27,4]],
    [[11,4],[17,4],[23,4]],
    [[14,4],[20,4]],
    [[17,4]]
  ];
  const yRow=[18,14,10,7];
  let html=""; let placed=0;
  for(let r=0;r<rows.length && placed<n;r++){
    for(const [x,w] of rows[r]){
      if(placed>=n) break;
      const c=pal[(placed)%pal.length];
      html+=`<rect x="${x}" y="${yRow[r]}" width="${w}" height="5" rx="1.5" fill="${c}"/>`;

      html+=`<rect x="${x}" y="${yRow[r]}" width="${w}" height="1.5" rx="1" fill="#ffffff30"/>`;
      placed++;
    }
  }
  g.innerHTML=html;
}
function addCartOre(){
  S.cartFill=(S.cartFill||0)+1;
  if(S.cartFill>=cartCapacity()){ departCart(); }
  else renderCart();
}
let cartBusy=false;
function departCart(){
  if(cartBusy) return; cartBusy=true;
  const c=$("cart"); if(!c){ S.cartFill=0; cartBusy=false; return; }
  S.cartRuns=(S.cartRuns||0)+1;
  Platform.logEvent("cart_depart",{runs:S.cartRuns});
  if(AC&&musicOn){ const t=AC.currentTime; thump(t,0.18); anvil(t+0.1,300,0.05,0.6); }
  c.classList.remove("arrive"); void c.offsetWidth; c.classList.add("depart");
  setTimeout(()=>{
    S.cartFill=0; renderCart();
    c.classList.remove("depart"); void c.offsetWidth; c.classList.add("arrive");
    setTimeout(()=>{ c.classList.remove("arrive"); cartBusy=false; }, 820);
  }, 1420);
}
function reinforceMine(){
  if(dead) return;
  if((S.durab||0)>=MINE_DURAB.max-1e-6){ showToast("🪵","supports whole","","There’s nothing to strengthen yet."); return; }
  const c=reinforceCost();
  if((S.gold||0)>=c){
    S.gold-=c; S.durab=MINE_DURAB.max; lastDurabWarn=MINE_DURAB.max;
    Platform.logEvent("reinforce",{cost:c}); sfxGear();
    showToast("🪵","supports strengthened","","The vaults hold","−"+fmt(c)+" 🪙 · 100%");
    save(); render();
    return;
  }
  if(adSlotOk("durab_free")){
    offerAdReward("durab_free", ()=>{
      S.durab=MINE_DURAB.max; lastDurabWarn=MINE_DURAB.max;
      Platform.logEvent("reinforce",{cost:0,ad:true});
      showToast("📺","supports for advertising","","100% · The vaults hold");
      save(); render();
    }, {limitMsg:"Promotion for today"});
    return;
  }
  showToast("🪙","Few gold","","At supports I need to. "+fmt(c)+" 🪙","or 📺 tomorrow");
}
function reinforceMineAd(){
  if(dead||(S.durab||0)>=MINE_DURAB.max-1e-6) return;
  offerAdReward("durab_free", ()=>{
    S.durab=MINE_DURAB.max; lastDurabWarn=MINE_DURAB.max;
    Platform.logEvent("reinforce",{cost:0,ad:true});
    showToast("📺","supports for advertising","","100%");
    save(); render();
  });
}
function caveIn(){
  if(dead) return;
  dead=true;
  failEventRun("cave-in Codes");
  Platform.logEvent("collapse",{stage:S.stageIdx});
  fpFailLevel();
  const lost=Math.floor((S.gold||0)*MINE_DURAB.penaltyGoldPct);
  _collapseLost=lost;
  S.gold-=lost; S.cartFill=0; S.energy=0;
  try{ jingleKO(); }catch(e){}
  $("ovTitle").textContent="⛰️ CAVE-IN!";
  $("ovText").textContent="supports I couldn’t take it. — The vaults are gone. "+fmt(lost)+" 🪙. 📺 We can dig out and get some gold back.";
  _overlayKind="collapse"; resetOverlayUi(); syncOverlayAdBtn();
  $("overlay").style.display="flex";
  showToast("⛰️","CAVE-IN!","","The checker’s down.","−"+fmt(lost)+" 🪙",true);
}
function breakVein(){
  const prevIdx=S.stageIdx;
  const wasEvent=!!(rock&&rock.isEvent&&S.eventRun);
  const eventSnap=wasEvent?Object.assign({},S.eventRun):null;
  const wasRaid=!!(rock&&rock.isRaid&&S.mineRaid&&!wasEvent);
  const raidSnap=wasRaid?Object.assign({},S.mineRaid):null;
  sfxBreak();
  addCartOre();
  let veinGold=0;
  if(!wasEvent && !wasRaid){
    veinGold=Math.round(veinReward()*(rock.isBoss?1.5:1)*activeLootMult());
    S.gold+=veinGold;
  } else {
    S.gold+=veinReward()*(rock.isBoss?1.5:1)*activeLootMult();
  }
  if(wasEvent&&eventSnap){
    advanceEventWave(eventSnap);
  } else if(wasRaid&&raidSnap){
    grantMineRaidReward(raidSnap);
    S.mineRaid=null;
  } else {
    grantBags(rock.isBoss?BALANCE.bags.perBoss:BALANCE.bags.perVein);
  }

  if(!wasRaid&&!wasEvent){
    const mk=S.mine%MINES.length, ex=(BALANCE.minesExtra||[])[mk];
    if(ex && Math.random()*100<ex.pct){
      const amt = rock.isBoss ? ex.boss : ex.vein;
      if(amt>0){
        S[ex.res]=(S[ex.res]||0)+amt;
        if(FAST()){
          if(!mineExtraAgg) mineExtraAgg={};
          mineExtraAgg[ex.res]=(mineExtraAgg[ex.res]||0)+amt;
        } else {
          showToast(ex.ic, ex.name, "", "+"+amt+" "+ex.label);
        }
        Platform.logEvent("mine_extra",{mine:S.mine,res:ex.res,amt, boss:!!rock.isBoss});
      }
    }
  }

  const pk=$("peek");
  if(rock.buried && pk.dataset.on==="1"){ pk.classList.add("pop"); setTimeout(()=>pk.classList.remove("pop"),560); }
  if(rock.buried && rock.buried.stoneR>=0) onFind(rock.buried.stoneR);
  if(rock.buried && rock.buried.item) dropGearItem(rock.buried.item);
  if(S.stageIdx>=BALANCE.run.len){
    if(!wasRaid&&!wasEvent) fpCompleteLevel();
    S.runDone=true;
    if(!S._wallShown){ S._wallShown=true;
      showToast("⛰️",BALANCE.run.wallMsg+"!","","Next — Only Deep Call","Phase "+BALANCE.run.len+" · Push it. ⛰️",true);
      sayQuip("Next. Mountain It’s time to call again.",6); }
  } else if(!wasRaid&&!wasEvent){ fpCompleteLevel(); S.stageIdx++; S.stage++; }
  dailyProgress("break",1);
  addBeardXP(rock.isBoss?12:2);
  S.veinsBroken=(S.veinsBroken||0)+1;
  try{ trackPlayEvent("veins_broken",1); }catch(e){}
  if(veinGold>0) try{ trackPlayEvent("gold_earned", Math.max(1, Math.round(veinGold))); }catch(e){}
  try{ checkPlayAchievements(); }catch(e){}
  try{ checkMinerLevelUp(true); }catch(e){}
  if(!wasRaid&&!wasEvent) rollVeinExtras(rock.isBoss);
  checkDepthMark(prevIdx); submitMyScore();
  if(rock.isBoss&&!wasRaid&&!wasEvent) Platform.logEvent("boss_kill",{stage:S.stageIdx,mine:S.mine});
  if(!wasRaid&&!wasEvent && S.stage>STAGES_PER_MINE){ S.stage=1; S.mine++; S.durab=MINE_DURAB.max; lastDurabWarn=MINE_DURAB.max; toastMine(); Platform.logEvent("mine_enter",{mine:S.mine}); }
  try{ notifyFeatUnlocks(); }catch(e){}
  newRock(); save();
  if(veinGold>0 && adSlotOk("vein_double") && veinAdBurstOk()){
    _lastVeinGold=veinGold;
    if(typeof __vclock!=="undefined") showVeinAdOffer(veinGold);
    else setTimeout(()=>showVeinAdOffer(veinGold), FAST()?80:450);
  }
}
function veinAdBurstState(){
  if(!S.veinAd||typeof S.veinAd!=="object") S.veinAd={n:0,coolAt:0};
  if(S.veinAd.n==null) S.veinAd.n=0;
  if(S.veinAd.coolAt==null) S.veinAd.coolAt=0;
  return S.veinAd;
}
function veinAdBurstOk(){
  const st=veinAdBurstState();
  const now=Date.now();
  if(st.coolAt && now<st.coolAt) return false;
  if(st.coolAt && now>=st.coolAt){ st.coolAt=0; st.n=0; }
  const burst=(BALANCE.ads&&BALANCE.ads.veinBurst)|0||2;
  return (st.n|0)<burst;
}
function veinAdBurstMark(){
  const st=veinAdBurstState();
  const burst=(BALANCE.ads&&BALANCE.ads.veinBurst)|0||2;
  const cd=((BALANCE.ads&&BALANCE.ads.veinBurstCdSec)|0||300)*1000;
  st.n=(st.n|0)+1;
  if(st.n>=burst){
    st.coolAt=Date.now()+cd;
    st.n=0;
  }
}
function showVeinAdOffer(amt){
  if(!amt||!adSlotOk("vein_double")||!veinAdBurstOk()) return;
  veinAdBurstMark();
  _lastVeinGold=amt;
  const st=veinAdBurstState();
  const left=adSlotLeft("vein_double");
  let hint=left!=null?("still "+left+" ×2 for today"):"";
  if(st.coolAt && st.coolAt>Date.now())
    hint=(hint?hint+" · ":"")+"Pause "+fmtClock(st.coolAt-Date.now());
  else {
    const burst=(BALANCE.ads&&BALANCE.ads.veinBurst)|0||2;
    hint=(hint?hint+" · ":"")+"Series "+(st.n|0)+"/"+burst;
  }
  setTxt("veinAdGold","+"+fmt(amt)+" 🪙 → ×2");
  setTxt("veinAdLeft", hint);
  const ov=$("veinAdOverlay"); if(ov) ov.style.display="flex";
}
function skipVeinAd(){ const ov=$("veinAdOverlay"); if(ov) ov.style.display="none"; }
function claimVeinDouble(){
  offerAdReward("vein_double", ()=>{
    S.gold+=_lastVeinGold|0;
    skipVeinAd();
    showToast("📺","×2 vein!","","+"+fmt(_lastVeinGold)+" 🪙","Double gold",true);
    Platform.logEvent("vein_double",{gold:_lastVeinGold});
    save(); render();
  });
}
function exhausted(){
  dead=true;
  failEventRun("Zero energy");
  jingleKO();
  Platform.logEvent("exhaust",{stage:S.stageIdx});
  fpFailLevel();
  const ko=KO_SCREENS[Math.floor(Math.random()*KO_SCREENS.length)];
  showExhaustOverlay(ko[0], ko[1]);
}
function resetOverlayUi(){
  _overlaySipped=false;
  const cont=$("ovContinue"); if(cont) cont.style.display="none";
  syncOverlayAdBtn();
}
function syncOverlayAdBtn(){
  const btn=$("ovAdBtn"); if(!btn) return;
  btn.style.display="none";
  if(S.noAds) return;
  if(_overlayKind==="exhaust" && adSlotOk("exhaust_refill")){
    btn.style.display="block";
    btn.textContent="📺 Second breath (+"+Math.round((BALANCE.ads.exhaustEnergyPct||0.48)*100)+"% ⚡)";
    btn.onclick=overlayExhaustAd;
  } else if(_overlayKind==="collapse" && adSlotOk("collapse_recover")){
    btn.style.display="block";
    btn.textContent="📺 Unload (turn) ~"+Math.round((BALANCE.ads.collapseRecoverPct||0.72)*100)+"% 🪙)";
    btn.onclick=overlayCollapseRecover;
  }
}
function overlayExhaustAd(){
  offerAdReward("exhaust_refill", ()=>{
    const pct=BALANCE.ads.exhaustEnergyPct||0.48;
    S.energy=Math.min(stat("energy"), Math.max(S.energy||0, Math.round(stat("energy")*pct)));
    _overlaySipped=true;
    const cont=$("ovContinue"); if(cont) cont.style.display="block";
    syncOverlayAdBtn();
    showToast("📺","Second breath!","","⚡ "+fmt(Math.floor(S.energy))+" · same vein",true);
    Platform.logEvent("exhaust_ad",{energy:S.energy});
    save(); render();
  });
}
function overlayCollapseRecover(){
  offerAdReward("collapse_recover", ()=>{
    const back=Math.floor((_collapseLost||0)*(BALANCE.ads.collapseRecoverPct||0.72));
    if(back>0) S.gold+=back;
    S.durab=MINE_DURAB.max; lastDurabWarn=MINE_DURAB.max; S.energy=Math.min(stat("energy"), Math.round(stat("energy")*0.35));
    $("overlay").style.display="none"; dead=false; _overlayKind=null; resetOverlayUi();
    newRock();
    showToast("📺","We’re out!","","+"+fmt(back)+" 🪙 · supports restored",true);
    Platform.logEvent("collapse_ad",{gold:back});
    save(); render();
  });
}
function showExhaustOverlay(title,text){
  _overlayKind="exhaust";
  resetOverlayUi();
  $("ovTitle").textContent=title;
  $("ovText").textContent=text+(adSlotOk("exhaust_refill")?" · or 📺 Second breath":"");
  $("overlay").style.display="flex";
}
function closeOverlay(){
  $("overlay").style.display="none"; dead=false;
  _overlayKind=null; resetOverlayUi();
  if((S.speed||1)>3){ S.speed=1; sayQuip("Down to ×1 — We’ll get a spirit.",3); }
  S.durab=MINE_DURAB.max; durabTimer=0; lastDurabWarn=MINE_DURAB.max; newRock(); save();
  try{ if(typeof updateFtueHint==="function") updateFtueHint(); }catch(e){}
}
function resumeFromExhaust(){
  if(_overlayKind!=="exhaust" || !_overlaySipped) return;
  $("overlay").style.display="none"; dead=false;
  _overlayKind=null; resetOverlayUi();
  save();
  try{ if(typeof updateFtueHint==="function") updateFtueHint(); }catch(e){}
  showToast("🍺","B dig!","","Same vein · Energy "+fmt(Math.floor(S.energy)));
}
function overlayAle(){
  sipAle();
  const pool=Math.random()<0.55?EX_QUIPS:ALE_QUIPS;
  $("ovText").textContent="🍺 "+pool[Math.floor(Math.random()*pool.length)];
  if(_overlayKind==="exhaust"){
    _overlaySipped=true;
    const cont=$("ovContinue"); if(cont) cont.style.display="block";
  }
}

function buyStat(id){
  const u=UPGRADES.find(x=>x.id===id); if(!u) return;
  if(statCapped(id)) return;
  const c=upCost(u);
  if((S.gold||0)>=c){ S.gold-=c; S.lvls[id]++;
    if(id==="energy") S.energy=Math.min(S.energy+u.step,stat("energy"));
    sfxGear(); save(); render(); openUpgradesModal(); }
}
function openUpgradesModal(){
  const rows=UPGRADES.map(u=>{
    const capped=statCapped(u.id), c=upCost(u), cur=statFmtDisplay(u);
    const btn=capped
      ? `<button class="btn btn-soft" disabled style="opacity:.4">MAX</button>`
      : `<button class="btn btn-soft" onclick="buyStat('${u.id}')" ${(S.gold||0)<c?"disabled":""}>+ ${fmt(c)}🪙</button>`;
    return `<div class="metarow"><span>${u.k} · <b>${cur}</b></span>${btn}</div>`;
  }).join("");
  metaOpen("Upgrades dig","Gold "+fmt(S.gold)+" 🪙 · ♪ rock the statues to beat ♪ rock.",rows);
}

function itemPower(it){
  const sl=SLOTS.find(s=>s.id===it.s);
  if(!sl) return gearRarityFactor(it.r)*(1+it.i/((BALANCE.gearStat&&BALANCE.gearStat.stageDiv)||120))*it.m;
  let p=0;
  for(const k in sl.st){
    const v=itemStat(it,k);
    p+=v*(STAT_CAPS[k]?0.25:1);
  }
  return p;
}
function dropGear(){ dropGearItem(makeItem(rollGearSlot().id)); }

let autoRollAcc=0;
function grantBags(n){ S.bags=Math.min(BALANCE.bags.cap,(S.bags||0)+n); }

const FEAT_ORDER=["auto","pets","beards","daily","mines","skills","artifacts","pvp","social"];
const FEAT_INFO={
  auto:{ic:"⚙️",n:"Autos and bonuses",hint:"AVTA bag, bonus chest, offline and 2× loot"},
  pets:{ic:"🐾",n:"Pets",hint:"egg c vein · ♪ roll the gurney in the slot ♪ pet"},
  beards:{ic:"🧔",n:"Beards",hint:"comb c vein · rank and gacha elder"},
  daily:{ic:"📕",n:"Tasks",hint:"Daily quests and shares on the left on stage"},
  mines:{ic:"⛏",n:"mine",hint:"Change hall in the bottom panel"},
  skills:{ic:"📜",n:"skill",hint:"Map Laure, CRASAWA and training"},
  artifacts:{ic:"💎",n:"Trophies",hint:"Achievements and artifacts on the left on stage"},
  pvp:{ic:"⚔",n:"Arena",hint:"PvP in the bottom panel"},
  social:{ic:"🍺",n:"Tavern and friends",hint:"Tavern downstairs. · Friends on the left"}
};
const FEAT_CHROME={
  auto:["bonusChest","boost2x"],
  daily:["quests","offers"],
  mines:["navMines"],
  skills:["navSkills"],
  artifacts:["achievements","artifacts"],
  pvp:["navPvp"],
  social:["friendsBtn","navTavBtn"]
};
const FEAT_SCREEN={pets:"pets",beards:"beards",mines:"mines",pvp:"pvp",tavern:"social",artifacts:"artifacts"};
function featNeedStage(id){
  const U=BALANCE.unlocks||{};
  return U[id]!=null?U[id]:1;
}
function featUnlocked(id){
  if(typeof __TEST_UNLOCK_ALL!=="undefined" && __TEST_UNLOCK_ALL) return true;
  if(!S) return false;
  const need=featNeedStage(id);
  return (S.stageIdx||1)>=need;
}
function featLockToast(id){
  const meta=FEAT_INFO[id]||{ic:"🔒",n:"Mechanics"};
  const need=featNeedStage(id);
  const left=Math.max(0,need-(S.stageIdx||1));
  showToast("🔒",meta.n+" still closed","",
    "Opens at stage "+need+(left?" · More. ~"+left:""));
}
function requireFeat(id){
  if(featUnlocked(id)) return true;
  featLockToast(id);
  return false;
}
function ensureFeat(d){
  if(!d) return d;
  if(!d.featToast||typeof d.featToast!=="object") d.featToast={};

  const stage=d.stageIdx||1;
  const U=BALANCE.unlocks||{};
  for(const id of FEAT_ORDER){
    const need=U[id]!=null?U[id]:1;
    if(stage>=need && d.featToast[id]==null) d.featToast[id]=1;
  }
  return d;
}
function applyFeatureChrome(){
  if(!S) return;
  for(const id of Object.keys(FEAT_CHROME)){
    const on=featUnlocked(id);
    for(const elId of FEAT_CHROME[id]){
      const el=$(elId); if(!el||!el.classList) continue;
      const isNav=elId==="navMines"||elId==="navSkills"||elId==="navPvp"||elId==="navTavBtn";
      if(isNav){
        el.classList.remove("featOff");
        el.classList.toggle("featLocked", !on);
        el.title=!on?("Opens at stage "+featNeedStage(id)):"";
      } else {
        el.classList.remove("featLocked");
        el.classList.toggle("featOff", !on);
      }
    }
  }
  const sm=$("sideMenu");
  if(sm&&sm.classList){
    const kids=sm.querySelectorAll?sm.querySelectorAll(".btn-side"):[];
    let any=false;
    for(let i=0;i<kids.length;i++){
      if(!kids[i].classList||!kids[i].classList.contains("featOff")){ any=true; break; }
    }
    sm.classList.toggle("featEmpty", !any);
  }
  const rank=$("statMinerCell");
  if(rank){
    const on=featUnlocked("beards");
    rank.style.cursor=on?"pointer":"default";
    rank.title=on?"Beards · rank":"Rang (beard (to be opened later)";
    rank.classList&&rank.classList.toggle("featMuted", !on);
  }
  const smine=$("statMine");
  if(smine){
    const on=featUnlocked("mines");
    const cell=smine.closest?smine.closest(".cell"):null;
    const target=cell||smine;
    target.style.cursor=on?"pointer":"default";
    target.title=on?"mine":"mine (map opens later)";
  }
}
function notifyFeatUnlocks(){
  if(!S) return;
  if(!S.featToast||typeof S.featToast!=="object") S.featToast={};
  let changed=false;
  for(const id of FEAT_ORDER){
    if(!featUnlocked(id)||S.featToast[id]) continue;
    S.featToast[id]=1; changed=true;
    if(id==="pets"&&(S.eggs||0)<1) S.eggs=1;
    if(id==="beards"&&(S.combs||0)<1) S.combs=1;
    const m=FEAT_INFO[id]||{ic:"✨",n:id,hint:""};
    showToast(m.ic, m.n+" Open!","", m.hint, "Phase "+(S.stageIdx||1), true);
    try{ Platform.logEvent("feat_unlock",{id,stage:S.stageIdx}); }catch(e){}
  }
  if(changed){ applyFeatureChrome(); save(); }
}

function canOpenBag(){ return (S.bags||0)>=1 && !S.autoRoll; }
function openBag(){
  if(S.autoRoll){ showToast("🎒","Auto on.","","Turn off the Auto to open manually"); return false; }
  if((S.bags||0)<1){ showToast("🎒","No bags","","Bags drop from veins"); return false; }
  S.bags--; dailyProgress("bag",1);
  S.bagsOpened=(S.bagsOpened||0)+1;
  try{ trackPlayEvent("bags_opened",1); }catch(e){}
  try{ checkPlayAchievements(); }catch(e){}
  if(S.ftue&&!S.ftue.c){ S.ftue.c=1; { const lc=$("lootChest"); if(lc&&lc.classList) lc.classList.remove("pulse"); }; }
  dropGearItem(makeItem(rollGearSlot().id));
  Platform.logEvent("bag_open",{}); save(); render();
  return true;
}

let autoSoldN=0, autoSoldGold=0;
let dupN=0, dupGold=0, dupShards=0;
let sellN=0, sellGold=0;
let equipN=0;
let mineExtraAgg=null;
let logAcc=0;
const FAST=()=>((S&&S.speed)||1)>3;
function flushMineExtras(){
  if(!mineExtraAgg) return;
  const parts=[];
  for(const k in mineExtraAgg){
    const v=mineExtraAgg[k];
    if(v>0) parts.push("+"+fmt(v)+" "+(k==="wheelSpins"?"◎":k==="chestKeys"?"🗝":k==="protein"?"🍺":"💠"));
  }
  if(parts.length){
    showToast("⛏️","mine","",parts.length+"× bonus",parts.join(" · "));
  }
  mineExtraAgg=null;
}
function flushSales(){

  if(dupN){ showToast("💎","duplicate","",dupN+"× Stones",
    "+"+fmt(dupGold)+" 🪙"+(dupShards?(" · +"+fmt(dupShards)+" 💠"):"")); dupN=0;dupGold=0;dupShards=0; }
  sellN=0; sellGold=0; equipN=0;
  flushMineExtras();
  flushAutoSold();
}
function autoOpenBag(quiet){
  if((S.bags||0)<1) return false;
  S.bags--; dailyProgress("bag",1);
  S.bagsOpened=(S.bagsOpened||0)+1;
  try{ trackPlayEvent("bags_opened",1); }catch(e){}
  const it=makeItem(rollGearSlot().id);
  if(it.r < (S.autoRollTier||0)){
    const p=sellPrice(it); S.gold+=p;
    autoSoldN++; autoSoldGold+=p;
  } else {
    dropGearItem(it, true);
  }
  return true;
}
function flushAutoSold(){

  autoSoldN=0; autoSoldGold=0;
}

function autoRollUnlocked(){
  const b=BALANCE.bags||{};
  const slots=gearSlots();
  const needSlots=b.autoUnlockSlots!=null?b.autoUnlockSlots:slots.length;
  const needRare=b.autoUnlockRares!=null?b.autoUnlockRares:3;
  let filled=0, rares=0;
  for(let i=0;i<slots.length;i++){
    const it=S.gear[slots[i].id];
    if(!it) continue;
    filled++;
    if((it.r|0)>=1) rares++;
  }
  return filled>=needSlots || rares>=needRare;
}
function autoLockHint(){
  const b=BALANCE.bags||{};
  const n=b.autoUnlockRares!=null?b.autoUnlockRares:3;
  return "Fill all slots or put them on. "+n+" things rarity Rare and higher";
}
function toggleAutoRoll(){
  if(!featUnlocked("auto")){ featLockToast("auto"); return; }
  if(!autoRollUnlocked()){
    if(S.autoRoll){ S.autoRoll=false; autoRollAcc=0; save(); render(); }
    showToast("🔒","Auto closed","",autoLockHint(),"Open up. bag And wear the best.");
    return;
  }
  S.autoRoll=!S.autoRoll; autoRollAcc=0;
  Platform.logEvent("auto_roll",{on:S.autoRoll,tier:S.autoRollTier});
  save(); render();
}
function cycleAutoTier(){
  if(!featUnlocked("auto")){ featLockToast("auto"); return; }
  if(!autoRollUnlocked()){
    showToast("🔒","Auto closed","",autoLockHint());
    return;
  }
  S.autoRollTier=((S.autoRollTier||0)+1)%8;
  save(); render();
}
function autoTierPanelSub(){
  const cur=S.autoRollTier|0;
  return "Below threshold → sell. At or above → keep. Current: "+RAR_NAMES[cur]+"+.";
}
function autoTierPanelRows(){
  const cur=S.autoRollTier|0;
  return RAR_NAMES.map(function(n,r){
    const on=r===cur;
    return '<div class="metarow"><span class="r'+r+'">'+n+' and above</span>'
      +'<button type="button" class="btn '+(on?"btn-hard":"btn-soft")+'" onclick="setAutoTier('+r+')">'
      +(on?"✓ threshold":"Keep")+'</button></div>';
  }).join("");
}
function refreshAutoTierPanel(){
  if(typeof UIS==="undefined" || UIS.id!=="panel") return;
  const t=($("uiTitle")||{}).textContent||"";
  if(t!=="Auto-sell threshold") return;
  UIS.openPanel("Auto-sell threshold", autoTierPanelSub(), autoTierPanelRows(), true);
}
function setAutoTier(r){
  if(!featUnlocked("auto")){ featLockToast("auto"); return; }
  if(!autoRollUnlocked()){
    showToast("🔒","Auto closed","",autoLockHint());
    return;
  }
  S.autoRollTier=Math.max(0,Math.min(7,r|0));
  Platform.logEvent("auto_tier",{tier:S.autoRollTier});
  save(); render();
  refreshAutoTierPanel();
}

function openAutoTierModal(){
  if(!featUnlocked("auto")){ featLockToast("auto"); return; }
  if(!autoRollUnlocked()){
    showToast("🔒","Auto closed","",autoLockHint(),"Open up. bag And wear the best.");
    return;
  }
  metaOpen("Auto-sell threshold", autoTierPanelSub(), autoTierPanelRows());
}
function dropGearItem(it, quiet){
  if(!it || it.s==="pet") it=makeItem(rollGearSlot().id);
  const slot=SLOTS.find(s=>s.id===it.s);
  if(!slot || slot.id==="pet") return;
  const old=S.gear[slot.id];

  const strictlyBetter = !old || (itemPower(it)>itemPower(old) && it.r>=old.r);
  if(it.s==="pick"&&it.n){ S.pickLog=S.pickLog||{}; S.pickLog[it.n]=true; }
  if(strictlyBetter){
    if(old){ S.gold+=sellPrice(old); }
    S.gear[slot.id]=it;
    S.energy=Math.min(S.energy,stat("energy"));
    if(quiet || FAST()) equipN++;
    sfxGear();
    renderGear();
    try{ if((it.r|0)>=7) unlockPlayAchievement("cosmic_slot"); }catch(e){}
  } else {
    const p=sellPrice(it);
    S.gold+=p;
    if(quiet || FAST()){ sellN++; sellGold+=p; }
  }
}

function hireGeo(){
  if(!requireFeat("beards")) return;
  if((S.combs||0)<1){
    if(adSlotOk("beard_roll")){
      offerAdReward("beard_roll", ()=>{ S.combs=(S.combs||0)+1; hireGeo(); }, {limitMsg:"comb for today’s ads."});
      return false;
    }
    showToast("🪮","No combs.","","C vein · or 📺 for roll"); return false;
  }
  S.combs--;
  const r=rollRarity(geoWeights(S.geoRolls));
  S.geoRolls++;
  const t=Math.floor(Math.random()*GEO_TYPES.length);
  const name=GEO_TYPES[t].names[Math.floor(Math.random()*GEO_TYPES[t].names.length)];
  if(!S.geo || (r>S.geo.r) || (r===S.geo.r && GEO_TYPES[t].pct[r]>GEO_TYPES[S.geo.t].pct[S.geo.r])){
    if(S.geo) boxAdd(S.geoBox,S.geo.t,S.geo.r,1);
    S.geo={t,r,n:name,lv:1,asc:0};
    showToast("👷",GEO_RAR[r],"r"+r,name,"- Yes, you are! +"+GEO_TYPES[t].pct[r]+"% "+GEO_TYPES[t].stat.toUpperCase());
  } else {
    boxAdd(S.geoBox,t,r,1);
    showToast("👷",GEO_RAR[r],"r"+r,name,"to the artefact · Merger material");
  }
  try{ unlockPlayAchievement("first_beard"); }catch(e){}
  save(); render();
  return true;
}

function tryBagUpgrade(){
  if(bagUpgrading()){
    openChest(true);
    return false;
  }
  bagSkipArmed=false;
  if(S.bag>=50) return false;
  if((S.gold||0)<bagCost()) return false;
  startBagUpgrade();
  return true;
}
if($("energyBox")) $("energyBox").onclick=()=>reinforceMine();

function onPowerUpClick(){
  if(bagUpgrading()){ tryBagUpgrade(); return; }
  openChest(true);
}
if($("powerUp")) $("powerUp").onclick=()=>onPowerUpClick();
if($("auto")) $("auto").onclick=()=>toggleAutoRoll();
if($("autoTier")) $("autoTier").onclick=()=>openAutoTierModal();

(function wireLootChest(){
  const lc=$("lootChest"); if(!lc) return;
  lc.onclick=function(){ openChest(false); };
})();

let last=performance.now(), idleAcc=0;
function loop(now){
  const rawDt=Math.min(0.1,(now-last)/1000); last=now;
  const dt=rawDt*(S.speed||1);
  const paused=dead;
  if(!paused){
    hitTimer+=dt; respTimer+=dt;
    const hitInt=1/stat("spd"), respInt=1/rock.resp;

    let hits=0;
    while(hitTimer>=hitInt && S.rockHP>0 && hits++<BALANCE.combat.maxHitsPerFrame){ hitTimer-=hitInt; minerHit(); }
    if(hits>=BALANCE.combat.maxHitsPerFrame) hitTimer=0;
    while(respTimer>=respInt&&!dead&&S.rockHP>0){ respTimer-=respInt; rockRespond(); }

    if(S.durab==null) S.durab=MINE_DURAB.max;
    S.durab=Math.max(0,S.durab-MINE_DURAB.decayPerSec*durabDecayMult()*dt);

    if(S.durab<=MINE_DURAB.critAt && lastDurabWarn>MINE_DURAB.critAt){
      showToast("⚠️","SUPPORTS ARE CRACKING!","","The vault is about to collapse.","Tap ⚡ to reinforce",true); lastDurabWarn=S.durab; }
    else if(S.durab<=MINE_DURAB.warnAt && lastDurabWarn>MINE_DURAB.warnAt){
      showToast("🪵","SUPPORTS ARE WEAK","","Tap the ⚡ bar to reinforce"); lastDurabWarn=S.durab; }
    else if(S.durab>lastDurabWarn) lastDurabWarn=S.durab;

    if(S.bagActive && Date.now()>=S.bagActive.end) finishBagUpgrade();
    if(S.autoRoll && autoRollUnlocked() && (S.bags||0)>0){
      autoRollAcc+=dt;
      if(autoRollAcc>=autoTurboSec()){
        autoRollAcc=0;
        const n=Math.min(S.bags||0, autoTurboPerTick());
        for(let i=0;i<n;i++){
          if((S.bags||0)<1) break;
          autoOpenBag(true);
        }
      }
    } else if(!S.autoRoll) autoRollAcc=0;
    logAcc+=rawDt;
    if(logAcc>=1){ logAcc=0; flushSales(); }
    regenAcc+=dt;
    if(regenAcc>=1){ const s=Math.floor(regenAcc); regenAcc-=s;
      const rg=stat("regen"); if(rg>0) S.energy=Math.min(stat("energy"), S.energy+rg*s); }
    if(S.rockHP>0){ const d=petDot();
      if(d&&d.dps>0){ S.rockHP-=d.dps*dt; if(S.rockHP<=0) breakVein(); } }
    durabTimer+=dt;
    while(durabTimer>=MINE_DURAB.checkSec){
      durabTimer-=MINE_DURAB.checkSec;
      if(!dead && S.durab<MINE_DURAB.safe){
        const f=(MINE_DURAB.safe-S.durab)/MINE_DURAB.safe;
        if(Math.random()<MINE_DURAB.baseP*f*f){ caveIn(); break; }
      }
    }
  }
  idleAcc+=dt;
  if(idleAcc>=1){ const w=Math.floor(idleAcc); refillKeys(); S.gold+=idlePerSec()*w;
    { const W=BALANCE.workouts, cap=W.proteinCapH*W.proteinPerHour, cur=S.protein||0;
      if(cur<cap) S.protein=Math.min(cap, cur+W.proteinPerHour/3600*w); }
    idleAcc%=1; }
  if(aleAnim>0) aleAnim-=rawDt;
  else if(!dead){ aleNext-=rawDt; if(aleNext<=0){ sipAle(); aleNext=35+Math.random()*30; } }
  if(!dead){ quipNext-=rawDt; if(quipNext<=0) sayQuip(IDLE_QUIPS[Math.floor(Math.random()*IDLE_QUIPS.length)]); }
  tickPetMood(rawDt);
  render();
  requestAnimationFrame(loop);
}

(function wirePetMoodTap(){
  const box=document.getElementById("petBox");
  if(!box||!box.addEventListener) return;
  box.style.cursor="pointer";
  let longFired=false, lpT=0;
  box.addEventListener("pointerdown", function(e){
    if(e&&e.stopPropagation) e.stopPropagation();
    longFired=false;
    clearTimeout(lpT);
    lpT=setTimeout(function(){
      longFired=true;
      if(typeof UIS!=="undefined"&&UIS.open) UIS.open("pets","gacha");
      else if(typeof openPets==="function") openPets();
    }, 520);
  });
  function clearLp(){ clearTimeout(lpT); }
  box.addEventListener("pointerup", clearLp);
  box.addEventListener("pointercancel", clearLp);
  box.addEventListener("click", function(e){
    if(e&&e.stopPropagation) e.stopPropagation();
    if(longFired){ longFired=false; return; }
    petCat();
  });
})();

function $(id){ return document.getElementById(id); }

function setTxt(elOrId, v){
  const e=typeof elOrId==="string"?$(elOrId):elOrId;
  if(!e) return;
  const s=v==null?"":String(v);
  if(e.textContent!==s) e.textContent=s;
}
function setWidth(elOrId, pct){
  const e=typeof elOrId==="string"?$(elOrId):elOrId;
  if(!e||!e.style) return;
  const s=(typeof pct==="number"?pct:parseFloat(pct))+"%";
  if(e.style.width!==s) e.style.width=s;
}
/** Snap rock HP bars without CSS transition (avoids ghost lag doubling on new vein / OnePlus WebView). */
let _hpBarPct=100;
function snapRockHpBars(pct){
  const fill=$("hpFill"), ghost=$("hpGhost");
  const s=(Math.max(0,Math.min(100,pct)))+"%";
  [fill,ghost].forEach(el=>{
    if(!el||!el.style) return;
    const prev=el.style.transition;
    el.style.transition="none";
    el.style.width=s;
    void el.offsetWidth;
    el.style.transition=prev||"";
  });
  _hpBarPct=pct;
}
function updateRockHpBars(){
  if(!rock||!rock.hp) return;
  const hpPct=Math.max(0,Math.min(100, S.rockHP/rock.hp*100));
  const hb=$("hpBar"); if(hb&&hb.classList) hb.classList.toggle("low",hpPct<28);
  // New vein / HP rose → snap (no ghost lag). Damage → fill + delayed ghost.
  if(hpPct>_hpBarPct+0.05){
    snapRockHpBars(hpPct);
  } else if(hpPct<_hpBarPct-0.05){
    setWidth("hpFill",hpPct+"%");
    setWidth("hpGhost",hpPct+"%");
    _hpBarPct=hpPct;
  }
}
function setHtml(elOrId, html){
  const e=typeof elOrId==="string"?$(elOrId):elOrId;
  if(!e) return;
  const s=html==null?"":String(html);
  if(e._html===s) return;
  e._html=s; e.innerHTML=s;
}
function setOp(elOrId, v){
  const e=typeof elOrId==="string"?$(elOrId):elOrId;
  if(!e||!e.style) return;
  const s=String(v);
  if(e.style.opacity!==s) e.style.opacity=s;
}
const SUFFIX=["","K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc"];
function fmt(n){
  n=Math.floor(n);
  if(!isFinite(n)) return "∞";
  if(n<1000) return String(n);
  const tier=Math.floor(Math.log10(n)/3);
  if(tier>=SUFFIX.length) return n.toExponential(2).replace("e+","e");
  return (n/Math.pow(10,tier*3)).toFixed(2)+SUFFIX[tier];
}
const LOOT2X_MS=30*60*1000;
function fmtClock(ms){
  ms=Math.max(0,Math.floor(ms/1000));
  const h=Math.floor(ms/3600), m=Math.floor((ms%3600)/60), s=ms%60;
  if(h>0) return h+":"+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
  return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
}
function bonusFib(){ return (BALANCE.bonus&&BALANCE.bonus.fib)||[1,1,2,3,5,8,13]; }
function bonusFibAt(i){
  const f=bonusFib();
  if(i<0) return f[0]||1;
  if(i>=f.length) return f[f.length-1]||1;
  return Math.max(1, f[i]|0);
}
function ensureBonus(d){ if(!d) return d;
  if(!d.bonusProg||typeof d.bonusProg!=="object") d.bonusProg={day:"",step:0,readyAt:0};
  if(d.bonusProg.step==null) d.bonusProg.step=0;
  if(d.bonusProg.readyAt==null) d.bonusProg.readyAt=0;

  if(d.bonusReadyAt!=null && typeof d.bonusReadyAt==="number" && !d.bonusProg.day){
    d.bonusProg.readyAt=d.bonusReadyAt;
  }
  return d;
}
function bonusReset(){
  ensureBonus(S);
  const t=todayStr();
  if(S.bonusProg.day!==t){
    S.bonusProg={day:t, step:0, readyAt:0};
  }

  const s=bonusSlotRaw();
  S.bonusReadyAt=s.done?Date.now()+864e5:(s.ready?0:Date.now()+s.leftMs);
}
function bonusSlotRaw(){
  ensureBonus(S);
  const fib=bonusFib();
  const step=Math.max(0, S.bonusProg.step|0);
  const done=step>=fib.length;
  const readyAt=done?Number.POSITIVE_INFINITY:(+S.bonusProg.readyAt||0);
  const leftMs=done?0:Math.max(0, readyAt-Date.now());
  const ready=!done && leftMs<=0;
  return {step, readyAt, leftMs, ready, done, fib:done?0:bonusFibAt(step), max:fib.length};
}
function bonusSlot(){ bonusReset(); return bonusSlotRaw(); }
function bonusAdvance(){
  bonusReset();
  const fib=bonusFib();
  const next=(S.bonusProg.step|0)+1;
  const unit=((BALANCE.bonus&&BALANCE.bonus.timerUnitSec)||3600)*1000;
  if(next>=fib.length){
    S.bonusProg={day:S.bonusProg.day, step:next, readyAt:Number.POSITIVE_INFINITY};
  } else {
    S.bonusProg={day:S.bonusProg.day, step:next, readyAt:Date.now()+bonusFibAt(next)*unit};
  }
  S.bonusReadyAt=S.bonusProg.readyAt;
}
function activeLootMult(){
  return (S.loot2xUntil&&S.loot2xUntil>Date.now()) ? 2 : 1;
}
function toggleLoot2x(){
  if(!requireFeat("auto")) return;
  const now=Date.now();
  if(S.loot2xUntil&&S.loot2xUntil>now){
    showToast("🎬","×2 loot","","Active yet. "+fmtClock(S.loot2xUntil-now));
    return;
  }
  const apply=()=>{
    S.loot2xUntil=now+LOOT2X_MS; save(); render();
    showToast("🎬","×2 loot!","","30 minutes of double loot");
    Platform.logEvent("loot2x_on",{});
  };
  try{
    if(Platform&&typeof Platform.showRewarded==="function"){
      Platform.showRewarded(ok=>{ if(ok) apply(); }, "loot2x");
      return;
    }
  }catch(e){}
  apply();
}
function bonusRewardGold(step){
  const mul=(BALANCE.bonus&&BALANCE.bonus.goldVeinMul)||3;
  const fib=bonusFibAt(step==null?bonusSlot().step:step);
  return Math.max(1, Math.round(veinReward()*mul*fib));
}
function bonusRewardBags(step){
  const base=(BALANCE.bonus&&BALANCE.bonus.bags)|0 || 1;
  return Math.max(1, Math.round(base*bonusFibAt(step==null?bonusSlot().step:step)));
}
function claimBonusChest(){
  if(!requireFeat("auto")) return;
  const slot=bonusSlot();
  if(slot.done){
    showToast("🧰","Bonuses for today","","All stages today · tomorrow with ×1");
    return;
  }
  if(!slot.ready){
    showToast("🧰","Bonus · step "+(slot.step+1),"","×"+slot.fib+" Through "+fmtClock(slot.leftMs));
    return;
  }
  openBonusClaim();
}

function openBonusClaim(){
  const slot=bonusSlot();
  const g=bonusRewardGold(slot.step), bags=bonusRewardBags(slot.step);
  metaOpen("🧰 Bonus · step "+(slot.step+1)+"/"+slot.max+" · ×"+slot.fib,
    "The longer you wait for the next step. — The more the reward.",
    '<div class="sub" style="margin-bottom:4px">Basic Award (×'+slot.fib+')</div>'
    +'<div class="metarow"><span>Gold</span><span><b>+'+fmt(g)+' 🪙</b></span></div>'
    +'<div class="metarow"><span>Bag</span><span><b>+'+bags+' 🎒</b></span></div>'
    +'<div class="sub" style="margin:12px 0 4px">With advertising ×2</div>'
    +'<div class="metarow"><span>Gold</span><span><b>+'+fmt(g*2)+' 🪙</b></span></div>'
    +'<div class="metarow"><span>Bag</span><span><b>+'+(bags*2)+' 🎒</b></span></div>'
    +'<div class="btnrow" style="margin-top:14px">'
    +'<button type="button" class="btn btn-soft" onclick="grantBonusChest(1)">Claim<br><small>+'+fmt(g)+' · +'+bags+'🎒</small></button>'
    +'<button type="button" class="btn btn-hard" onclick="grantBonusChest(2)">×2 with ad<br><small>+'+fmt(g*2)+' · +'+(bags*2)+'🎒</small></button>'
    +'</div>');
}
function grantBonusChest(mult){
  const slot=bonusSlot();
  if(slot.done||!slot.ready) return false;
  const m=mult===2?2:1;
  const step=slot.step, fib=slot.fib;
  const finish=function(){
    const g=bonusRewardGold(step)*m;
    const bags=bonusRewardBags(step)*m;
    S.gold+=g; grantBags(bags);
    bonusAdvance();
    const mm=$("metaModal"); if(mm) mm.style.display="none";
    try{ if(typeof UIS!=="undefined"&&UIS.id&&UIS.close) UIS.close(); }catch(e){}
    Platform.logEvent("bonus_chest",{mult:m,step,fib});
    const next=bonusSlot();
    const nextHint=next.done
      ? "That’s it for today."
      : ("Further ×"+next.fib+" Through "+fmtClock(next.leftMs));
    showToast("🧰", m>1?"Bonus ×2 · ×"+fib:"Bonus · ×"+fib,"","+"+fmt(g)+" 🪙 · +"+bags+" 🎒", nextHint);
    save(); render();
  };
  if(m===2){
    try{
      if(Platform&&typeof Platform.showRewarded==="function"){
        Platform.showRewarded(function(ok){ if(ok) finish(); }, "bonus_x2");
        return true;
      }
    }catch(e){}
  }
  finish();
  return true;
}
function buyUpgrade(id){
  const u=UPGRADES.find(x=>x.id===id); if(!u) return false;
  if(statCapped(u.id)) return false;
  const c=upCost(u);
  if((S.gold||0)<c){
    showToast("🪙","Few gold","",fmt(c)+" need");
    return false;
  }
  S.gold-=c; S.lvls[u.id]++;
  if(u.id==="energy") S.energy=Math.min(S.energy+u.step,stat("energy"));
  if(S.ftue&&!S.ftue.u){ S.ftue.u=1; const el=$("u_"+u.id); if(el&&el.classList) el.classList.remove("pulse"); }
  Platform.logEvent("upgrade",{id:u.id,lv:S.lvls[u.id]});
  pushFeed("Upgrade", (statLbl(u.id)||u.k)+" → Lv."+(S.lvls[u.id]|0)+" · −"+fmt(c)+" 🪙", "up");
  try{ checkPlayAchievements(); }catch(e){}
  save(); render();
  return true;
}
function buildUpgrades(){
  const box=$("statStrip")||$("upgrades"); if(!box) return;
  box.innerHTML="";
  UPGRADES.forEach(u=>{
    const d=document.createElement("div"); d.className="u"; d.id="u_"+u.id;
    d.innerHTML=`<div class="k">${statLbl(u.id)||u.k}</div><div class="lv">Lv. 0</div><div class="v"></div><div class="c"></div><button type="button" class="btn btn-soft" aria-hidden="true">+</button>`;
    const val=d.querySelector(".v"); if(u.id==="atk"&&val) val.id="pAtk";
    const doBuy=e=>{ if(e&&e.stopPropagation) e.stopPropagation(); buyUpgrade(u.id); };
    d.onclick=doBuy;
    d.title="Tap to upgrade";
    const btn=d.querySelector("button"); if(btn) btn.onclick=doBuy;
    box.appendChild(d);
  });
}
const RAR_HEX=["#8f96a3","#5fd068","#5aa7e8","#b97ae8","#e87a7a","#e8b93c","#7ae8dc","#ff9d5c"];
function shadeHex(h,t){ const n=parseInt(h.slice(1),16);
  const f=c=>Math.max(0,Math.round(c*(1+t)));
  const r=Math.min(255,f(n>>16)),g=Math.min(255,f((n>>8)&255)),b=Math.min(255,f(n&255));
  return "#"+((r<<16|g<<8|b)>>>0).toString(16).padStart(6,"0"); }
function setFill(id,c){ const el=document.getElementById(id); if(el&&el.setAttribute) el.setAttribute("fill",c); }

const PET_MOODS=[
  {id:"gaze",  title:"Looking into your eyes."},
  {id:"purr",  title:"Smooth when you’re around."},
  {id:"follow",title:"Follows you."},
  {id:"twitch",title:"Raises and pulls up the tail"},
  {id:"sleep", title:"Sleeping on you."},
  {id:"belly", title:"Shows the belly"}
];

const PET_SKIN_POOL=[
  [
    {id:"snow", n:"Snow", pat:"none", fur:"#f5f6f8", dark:"#c8ced6", sock:"#ffffff", eye:"#6bb8e8", nose:"#e8a0a8", patch:"#e08a3c"},
    {id:"beige",n:"Run", pat:"none", fur:"#e8d2b0", dark:"#c4a078", sock:"#f5ebe0", eye:"#5a8a6a", nose:"#8a5040", patch:"#c4a078"},
    {id:"miner",n:"The checker", pat:"none", fur:"#2c3038", dark:"#1a1c22", sock:"#4a4e58", eye:"#f0c84a", nose:"#1a1010", patch:"#e08a3c"}
  ],
  [
    {id:"rust", n:"Rusty", pat:"tabby", fur:"#e08a3c", dark:"#b05620", sock:"#f0c090", eye:"#3a8a4a", nose:"#5a3020", patch:"#b05620"},
    {id:"sea",  n:"Sea cats", pat:"none", fur:"#7a8494", dark:"#5a6474", sock:"#eef0f3", eye:"#f0c84a", nose:"#3a2c1c", patch:"#e08a3c"},
    {id:"dust", n:"Dust", pat:"tabby", fur:"#6a6870", dark:"#3a3840", sock:"#c8c6c0", eye:"#f0c84a", nose:"#2a2218", patch:"#3a3840"}
  ],
  [
    {id:"calico",n:"Snow-sprout miner", pat:"calico", fur:"#f0f2f4", dark:"#2a2e34", sock:"#ffffff", eye:"#f0c84a", nose:"#3a2c1c", patch:"#e08a3c"},
    {id:"fluffy",n:"Snow wool", pat:"fluffy", fur:"#f8f9fb", dark:"#d0d4dc", sock:"#ffffff", eye:"#6bb8e8", nose:"#e8a0a8", patch:"#d0d4dc"},
    {id:"tuxedo",n:"Snow-dust", pat:"tuxedo", fur:"#4a5060", dark:"#2a3038", sock:"#f4f6f8", eye:"#f0c84a", nose:"#3a2c1c", patch:"#f4f6f8"}
  ],
  [
    {id:"egypt",n:"Egyptians", pat:"sphynx", fur:"#d4b090", dark:"#b89070", sock:"#e8c8b0", eye:"#6bb8e8", nose:"#c07070", patch:"#b89070"},
    {id:"tortie",n:"Dust-red", pat:"calico", fur:"#3a3838", dark:"#1a1818", sock:"#e08a3c", eye:"#f0c84a", nose:"#2a1810", patch:"#e08a3c"},
    {id:"sand", n:"Mm-hmm.", pat:"none", fur:"#c9a070", dark:"#9a7040", sock:"#e8d0b0", eye:"#5a8a4a", nose:"#6a4030", patch:"#9a7040"}
  ],
  [
    {id:"leo", n:"The rustmer", pat:"rosette", fur:"#d4a060", dark:"#6a4020", sock:"#e8c898", eye:"#c8a020", nose:"#3a2c1c", patch:"#6a4020"},
    {id:"polka",n:"Annoyed at peas", pat:"polka", fur:"#8a9098", dark:"#2a2e34", sock:"#d0d4da", eye:"#e05040", nose:"#3a2c1c", patch:"#2a2e34"},
    {id:"bandaid",n:"With a band-aid", pat:"bandaid", fur:"#6a9aaa", dark:"#3a6a7a", sock:"#c8e0e8", eye:"#f0c84a", nose:"#3a2c1c", patch:"#f0a0b0"}
  ]
];
let petMoodI=0, petMoodT=0, petPetLock=0;
function activeCatPet(){
  if(S.pet&&S.pet.r!=null) return S.pet;
  if(S.gear&&S.gear.pet) return {t:0, r:S.gear.pet.r|0};
  return null;
}
function petSkinOf(pet){
  const pool=PET_SKIN_POOL[Math.min(Math.max(0,(pet&&pet.r)|0), PET_SKIN_POOL.length-1)];
  return pool[((pet&&pet.t)|0)%pool.length];
}
function syncPetBoxClass(){
  const box=$("petBox"); if(!box) return;
  const mood=(PET_MOODS[petMoodI]||PET_MOODS[0]);
  const pet=activeCatPet();
  const skin=petSkinOf(pet||{t:0,r:0});
  const petting=box.classList.contains("petting");
  const next="pet mood-"+mood.id+" skin-"+skin.id+" pat-"+(skin.pat||"none")+(petting?" petting":"");
  if(box.className!==next) box.className=next;
  const fam=(pet&&PET_TYPES[pet.t|0])?PET_TYPES[pet.t|0]:PET_TYPES[0];
  box.title=petting
    ? "You’re ironing. · Smurling"
    : ((fam&&fam.n)?fam.n+" · ":"")+(mood.title+" · "+skin.n+" · slip — To iron");
  box.style.setProperty("--pet-fur", skin.fur);
  box.style.setProperty("--pet-dark", skin.dark);
  box.style.setProperty("--pet-sock", skin.sock);
  box.style.setProperty("--pet-eye", skin.eye);
  box.style.setProperty("--pet-nose", skin.nose);
  box.style.setProperty("--pet-patch", skin.patch||skin.dark);
  const img=$("petArtImg");
  if(img&&fam&&fam.art){
    const src=fam.art;
    if(img.getAttribute("src")!==src) img.setAttribute("src", src);
    img.alt=fam.n||"dragon";
  }
  if(pet) paintPetCollars(RAR_HEX[Math.min(pet.r|0, RAR_HEX.length-1)]);
}
function applyPetMood(id){
  const ix=PET_MOODS.findIndex(x=>x.id===id);
  if(ix>=0) petMoodI=ix;
  syncPetBoxClass();
}

function petCat(){
  if(!activeCatPet()) return false;
  applyPetMood("purr");
  petMoodT=-4;
  const box=$("petBox");
  if(box){
    box.classList.remove("petting");
    void box.offsetWidth;
    box.classList.add("petting");
    box.title="You’re ironing. · Smurling";
    clearTimeout(petPetLock);
    petPetLock=setTimeout(function(){
      box.classList.remove("petting");
      syncPetBoxClass();
    }, 1500);
  }
  try{ sfxPurr(); }catch(e){}
  return true;
}
function tickPetMood(rawDt){
  const box=$("petBox");
  if(!box||box.style.display==="none"||!activeCatPet()) return;
  if(box.classList.contains("petting")) return;
  petMoodT+=rawDt;
  if(petMoodT<5) return;
  petMoodT=0;
  petMoodI=(petMoodI+1)%PET_MOODS.length;
  syncPetBoxClass();
}
function paintPetCollars(hex){
  const box=$("petBox"); if(!box||!box.querySelectorAll) return;
  box.querySelectorAll(".petCollar").forEach(el=>{ if(el.setAttribute) el.setAttribute("fill",hex); });
}
function cyclePetMood(force){
  if(!force && !activeCatPet()) return;
  petMoodT=0;
  petMoodI=(petMoodI+1)%PET_MOODS.length;
  syncPetBoxClass();
}

function gearRarities(){
  const g=(S&&S.gear&&typeof S.gear==="object")?S.gear:{};
  const ks=["helm","glove","pick","lamp","pants","boots","pack","robe"];
  const out=[];
  for(const k of ks){ const it=g[k]; if(!it) continue;
    const r=Number(it.r); if(Number.isFinite(r)) out.push(r|0); }
  return out;
}
/** Type of the courthouse = the weakest floor (as a “complect threshold“) is not the average of the vineverate. */
function dwarfTier(){
  const rs=gearRarities();
  if(!rs.length) return 0;
  const t=Math.min.apply(null, rs);
  if(!Number.isFinite(t)) return 0;
  return Math.max(0, Math.min(MINER_BASES.length-1, t));
}
function gearLoadoutHint(){
  const rs=gearRarities();
  if(!rs.length) return "Empty · equip gear from a bag";
  const minR=Math.min.apply(null, rs), maxR=Math.max.apply(null, rs);
  const filled=rs.length, total=8;
  if(minR===maxR && filled===total)
    return "Set · "+(RAR_NAMES[minR]||"")+" in all slots";
  if(minR===maxR)
    return (RAR_NAMES[minR]||"")+" · Slots "+filled+"/"+total+" · species of hero = this rarity";
  return "Mix "+(RAR_SHORT[minR]||minR)+"…"+(RAR_SHORT[maxR]||maxR)
    +" · hero look = weakest slot ("+(RAR_SHORT[minR]||minR)+") · pickaxe separate";
}
function updateMiner(){
  const g=S.gear;
  $("mlBase").src=MINER_BASES[dwarfTier()];
  { const w=beardWisdom();
    $("mlBeard").src=BEARD_STYLES[w.lenStyle];
    $("mlBeard").style.filter="grayscale("+w.grey.toFixed(2)+") brightness("+(1+w.grey*0.7).toFixed(2)+")"; }
  $("aleMug").src=MUG_ICON;
  const mug=$("aleMug");
  if(mug&&!mug._drinkWired){
    mug._drinkWired=1; mug.style.cursor="pointer"; mug.title="Drink beer → Training glasses";
    mug.onclick=function(e){ if(e&&e.stopPropagation) e.stopPropagation(); drinkBeer(); };
  }
  const L={pack:"mlPack",robe:"mlRobe",boots:"mlBoots",glove:"mlGlove",helm:"mlHelm"};
  for(const k in L){ const el=$(L[k]); if(el) el.style.display="none"; }
  { const bd=$("mlBeard"); if(bd) bd.style.display="none"; }
  $("pickHand").src=PICK_ICONS[g.pick?g.pick.r:0];
  const miner=$("miner");
  if(miner) miner.title=gearLoadoutHint();
  const hint=$("gearLoadoutHint");
  if(hint) hint.textContent=gearLoadoutHint();
  const pb=$("petBox");
  if(pb){
    const on=!!(g.pet||S.pet);
    pb.style.display=on?"block":"none";
    if(on) syncPetBoxClass();
  }
}
function openPickGallery(){
  const log=S.pickLog||{};
  const cur=S.gear.pick;
  $("pickList").innerHTML=PICK_NAMES.map((names,r)=>names.map(n=>{
    const owned=!!log[n], now=cur&&cur.n===n;
    return `<div style="border:2px solid ${owned?RAR_HEX[r]:"#2e3745"};border-radius:6px;padding:8px 6px;text-align:center;${owned?"":"opacity:.38;filter:grayscale(.6);"}">
      <img src="${PICK_ICONS[r]}" class="oreimg" style="width:34px;height:34px;margin:0 0 4px">
      <div style="font-size:12px;line-height:1.5">${owned?n:"???"}</div>
      <div class="r${r}" style="font-size:11px;margin-top:3px">${RAR_NAMES[r]}${now?" · IN THE HANDS":""}</div>
    </div>`;}).join("")).join("");
  $("pickModal").style.display="flex";
  Platform.logEvent("pick_gallery",{});
}
function checkLoadout(){
  const slots=gearSlots();
  if(slots.some(sl=>!S.gear[sl.id])) return;
  let minR=99; for(const sl of slots) minR=Math.min(minR, S.gear[sl.id].r);
  if(minR>=1 && minR>(S.loadoutTier||0)){
    const got=minR-(S.loadoutTier||0);
    for(let t=(S.loadoutTier||0)+1; t<=minR; t++) S.boxes.push(t);
    S.loadoutTier=minR;
    showToast("📦","SET!","r"+minR,RAR_NAMES[minR]+" in all slots","loot box ×"+got+" · :: . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . "+minR,true);
    Platform.logEvent("lootbox_drop",{tier:minR}); sfxGear();
  }
}

function slotCanBagUp(item){
  return !!((S.bags||0)>0 && (!item || item.r < Math.min(7, 1+Math.floor((S.bag||1)/7))));
}
function renderGear(){
  const g=$("gearGrid"); if(!g) return;
  g.innerHTML="";
  const REF_ORDER=["helm","glove","pick","lamp","pants","boots","pack","robe","pet"];
  REF_ORDER.map(id=>SLOTS.find(s=>s.id===id)).filter(Boolean).forEach(sl=>{
    if(sl.id==="pet" && !featUnlocked("pets")) return;
    const d=document.createElement("div");
    if(sl.id==="pet"){
      const pet=S.pet;
      const mergeReady=Object.keys(S.petBox||{}).some(k=>{
        const [t,r]=k.split("_").map(Number); return canMergePet(t,r);
      });
      const hintUp=!!((S.eggs||0)>0 || mergeReady);
      d.className="slot "+(pet?("br"+Math.min(7,pet.r|0)):"empty")+(hintUp?" canUp":"")+" petSlot";
      let sv="—";
      if(pet&&PET_TYPES[pet.t]){
        const t=PET_TYPES[pet.t], r=pet.r|0;
        sv='<div><span class="r'+r+'">'+(PET_RAR[r]||RAR_SHORT[r]||"")+'</span></div>'
          +'<div class="svv">+'+t.pct[r]+'% '+t.stat.toUpperCase()+'</div>';
      }
      const icon=pet?petIcon(pet.t):(sl.ic||"❔");
      d.innerHTML='<span class="up">↑</span><div class="ic">'+icon+'</div><div class="sn">'
        +(pet&&PET_TYPES[pet.t]?PET_TYPES[pet.t].n:sl.n)+'</div><div class="sv">'+sv+'</div>';
      d.title=pet
        ? (PET_TYPES[pet.t].n+" · "+(PET_RAR[pet.r|0]||"")+(hintUp?" · Yes egg/merger":""))
        : (hintUp?"pet · Yes egg or merger":"Pets");
      d.onclick=function(){ if(typeof UIS!=="undefined"&&UIS.open) UIS.open("pets","gacha"); else if(typeof openPets==="function") openPets(); };
      g.appendChild(d);
      return;
    }
    const item=S.gear[sl.id];
    const canUp=slotCanBagUp(item);
    d.className="slot "+(item?("br"+item.r):"empty")+(canUp?" canUp":"");
    let sv="—";
    if(item){
      const firstStat=Object.keys(sl.st)[0];
      const v=itemStat(item,firstStat);
      sv=`<div><span class="r${item.r}">${(RAR_SHORT[item.r]||RAR_NAMES[item.r])}</span></div><div class="svv">+${v>=100?fmt(v):v.toFixed(1)}</div>`;
    }
    const iconSrc=item?gearArtSrc(sl.id, item.r):(SLOT_ART[sl.id]||null);
    const icon=iconSrc
      ?`<img src="${iconSrc}" class="oreimg slotArt" style="width:30px;height:30px;margin:0">`
      :sl.ic;
    d.innerHTML=`<span class="up">↑</span><div class="ic">${icon}</div><div class="sn">${sl.n}</div><div class="sv">${sv}</div>`;
    if(sl.id==="pick"){
      d.title=canUp?"pickaxe · ↑ bag Maybe it’s better.":"pickaxe";
      d.onclick=openPickGallery;
    } else {
      d.title=canUp?"Tap for info · ↑ bag can be upgraded":"Slot info";
      d.onclick=function(){ openGearSlot(sl.id); };
    }
    g.appendChild(d);
  });
  updateMiner();
  checkLoadout();
}
function render(){
  setTxt("gold",fmt(S.gold));
  setTxt("gps",fmt(idlePerSec()*3600));
  setTxt("streakLine",(S.streak&&S.streak.n>0)?("🔥 "+S.streak.n+" d"):"");
  setTxt("gems",fmt(S.gems||0)); setTxt("trophies",fmt(S.trophies||0)); setTxt("protein",fmt(Math.floor(S.protein||0))); setTxt("shards",fmt(S.shards||0));
  { const set=(id,v)=>setTxt(id,v);
    set("curGems",fmt(S.gems||0)); set("curShards",fmt(S.shards||0));
    set("curProtein",fmt(Math.floor(S.protein||0))); set("curBags",fmt(S.bags||0));
    set("curKeys",String(S.keys||0)); set("curChestKeys",String(S.chestKeys||0));
    set("curTrophies",fmt(S.trophies||0)); set("curEggs",String(S.eggs||0)); set("curCombs",String(S.combs||0)); }
  renderBadges(); renderSetFx(); renderPaperdoll();
  setTxt("mineLabel",(S.mine+1)+"-"+S.stage);
  setTxt("stageLabel", S.runDone
    ? "⛰ TOTAL"
    : Math.min(S.stageIdx,BALANCE.run.len)+" / "+BALANCE.run.len);

  setTxt("minerRank",beardWisdom().title+((S.prestigeLv||0)?(" ⛰️"+S.prestigeLv):""));
  { const nick=$("nickname"); if(nick) setTxt(nick,playerName().toUpperCase());
    const w=beardWisdom();
    const sm=$("statMiner"); if(sm){
      setTxt(sm,w.title);
      sm.title=w.title+((S.prestigeLv||0)?(" · prestige "+S.prestigeLv):"");
    }
    const sn=$("statMine"); if(sn) setTxt(sn,(S.mine+1)+"-"+S.stage);
    const hp=$("hudPrestige"); if(hp) setTxt(hp,(S.prestigeLv||0)?("⛰️"+S.prestigeLv):""); }

  { const hp=$("hudPrestige"); if(hp) setTxt(hp,(S.prestigeLv||0)?("⛰️"+S.prestigeLv):""); }
  { updateRockHpBars(); }
  setOp("cracks",(1-Math.max(0,S.rockHP)/rock.hp).toFixed(2));
  setTxt("hpTxt",fmt(Math.max(0,S.rockHP))+" / "+fmt(rock.hp));
  setWidth("enFill",Math.max(0,S.energy/stat("energy")*100)+"%");
  { const d=S.durab==null?MINE_DURAB.max:S.durab;
    let t=fmt(Math.max(0,S.energy))+" / "+fmt(stat("energy"));
    if(d<MINE_DURAB.warnAt) t+=" · 🪵"+Math.round(d)+"%";
    setTxt("enTxt",t); }
  { const ac=$("statAds");
    if(ac) setTxt(ac, S.noAds?"VIP":(adViewsToday()+"/"+adsDailyCap()));
    const adCell=$("statAdCell");
    if(adCell&&adCell.classList) adCell.classList.toggle("pulse", !!adPulseWanted()); }
  { const d=S.durab==null?MINE_DURAB.max:S.durab;
    setWidth("duFill",Math.max(0,d)+"%");
    const bar=$("duBar"); if(bar&&bar.classList){ bar.classList.toggle("warn",d<MINE_DURAB.warnAt&&d>=MINE_DURAB.critAt); bar.classList.toggle("crit",d<MINE_DURAB.critAt); }
    const risk=collapseRiskPerMin();
    const duTxtEl=$("duTxt"); if(duTxtEl) setTxt(duTxtEl,risk>0?("⚠ "+(risk*100<1?"<1":Math.round(risk*100))+"%/min"):(Math.round(d)+"%"));
    const eb=$("energyBox");
    if(eb&&eb.classList){
      eb.classList.toggle("warn",d<MINE_DURAB.warnAt&&d>=MINE_DURAB.critAt);
      eb.classList.toggle("crit",d<MINE_DURAB.critAt);
      eb.title=d>=MINE_DURAB.max-1e-6?"supports whole":("Tap to reinforce · "+fmt(reinforceCost())+" 🪙 · supports "+Math.round(d)+"%");
    }
  }
  setTxt("sAtk",fmt(stat("atk")));
  setTxt("sSpd",stat("spd").toFixed(1));
  setTxt("sMin",Math.round(stat("mining")));
  setTxt("sCrit",Math.round(stat("crit"))+"%");
  setTxt("sLuck",Math.round(stat("luck"))+"%");
  { const st=stat("stone"); setTxt("sStone",(st>=1000?fmt(st):Math.round(st))+"%"); }
  UPGRADES.forEach(u=>{
    const d=$("u_"+u.id); if(!d) return;
    const btn=d.querySelector("button"), val=d.querySelector(".v"), cost=d.querySelector(".c"), lv=d.querySelector(".lv");
    if(!val||!cost) return;
    const capped=statCapped(u.id);
    const c=upCost(u);
    const can=!capped && (S.gold||0)>=c;
    if(lv) setTxt(lv,"Lv. "+(S.lvls[u.id]|0));
    setTxt(val,statFmtDisplay(u));
    setTxt(cost,capped?"MAX":("🪙"+fmt(c)));
    if(d.classList){ d.classList.toggle("can", !!can); d.classList.toggle("maxed", !!capped); }
    if(btn){
      const wantDisabled=!can;
      if(btn.disabled!==wantDisabled) btn.disabled=wantDisabled;
      const txt=capped?"✓":"+";
      if(btn.textContent!==txt) setTxt(btn,txt);
    }
  });
  { const rn=$("rockName"), en=$("refEnemyName"), en2=$("enemyName");
    const txt=(rn&&rn.textContent||"ROCK").replace(/ \(Boss.\)$/i,"").toUpperCase();
    if(en) setTxt(en,txt); if(en2) setTxt(en2,txt); }
  { ensureBonus(S);
    const bb=$("refBonusBtn"), bc=$("bonusChest"), bt=$("refBonusTimer");
    const slot=typeof bonusSlot==="function"?bonusSlot():{ready:Date.now()>=(S.bonusReadyAt||0),leftMs:Math.max(0,(S.bonusReadyAt||0)-Date.now()),done:false,fib:1};
    const ready=!!slot.ready;
    if(bb&&bb.classList) bb.classList.toggle("ready",ready);
    if(bc&&bc.classList) bc.classList.toggle("ready",ready);
    if(bt){
      if(slot.done) setTxt(bt,"tomorrow");
      else if(ready) setTxt(bt,"×"+slot.fib+" SLIP");
      else setTxt(bt,"×"+slot.fib+" "+fmtClock(slot.leftMs));
    } }
  { const lb=$("loot2xBtn"), b2=$("boost2x"), ll=$("loot2xLbl");
    const on=S.loot2xUntil&&S.loot2xUntil>Date.now();
    if(lb&&lb.classList) lb.classList.toggle("on",!!on);
    if(b2&&b2.classList) b2.classList.toggle("on",!!on);
    if(ll) setTxt(ll,on?fmtClock(S.loot2xUntil-Date.now()):"INACTIVE"); }
  setTxt("findChance",Math.round(findChance()));
  { const mn=$("refMinerName"); if(mn) setTxt(mn,playerName().toUpperCase()); }
  { const df=$("refDifficulty"), sl=$("statLoot");
    const dtxt=((rock&&rock.isBoss)?"BOSS":"BRUTAL");
    if(df){ setTxt(df,dtxt); if(df.classList) df.classList.toggle("tag", true); }
    if(sl) setTxt(sl,dtxt);
  }
  setTxt("speedBtn","×"+(S.speed||1)+" PACE");
  setTxt("bagLvl",S.bag);
  setTxt("dropCh",DROP_CHANCE);
  setTxt("bagTier",bagName(S.bag));
  const nb=nextBagName(S.bag);
  setTxt("bagNext",nb?("up to «"+nb[1]+"»: "+(nb[0]-S.bag)+" Lv."):"The limit of greed is reached");

  { const cheapest=UPGRADES.reduce((a,u)=>upCost(u)<upCost(a)?u:a,UPGRADES[0]);
    UPGRADES.forEach(u=>{
      const row=$("u_"+u.id);
      if(!row||!row.classList) return;
      const want=!!(S.ftue && !S.ftue.u && u.id===cheapest.id && S.gold>=upCost(cheapest));
      row.classList.toggle("pulse", want);
    });
  }
  { const pu=$("powerUp");
    if(pu&&pu.classList){
      const want=!!(S.ftue && !S.ftue.b && !bagUpgrading() && S.bag<50 && (S.gold||0)>=bagCost());
      pu.classList.toggle("pulse", want);
    }
  }
  { const ob=$("lootChest");
    if(ob&&ob.classList) ob.classList.toggle("pulse", !!(S.ftue && !S.ftue.c && (S.bags||0)>0)); }
  if($("bagCount")) setTxt("bagCount",fmt(S.bags||0));

  if($("bagBadge2")){ const n=S.bags||0; setTxt("bagBadge2",n>99?"99+":n); $("bagBadge2").style.display=n>0?"flex":"none"; }
  if($("bagAreaLvl")){
    if(bagUpgrading() && bagSkipArmed) setTxt("bagAreaLvl","PASS");
    else if(bagUpgrading()) setTxt("bagAreaLvl","BAG… "+bagUpgradeLeft()+"c");
    else if(S.bag>=50) setTxt("bagAreaLvl","BAG MAX");
    else setTxt("bagAreaLvl","BAG LV "+S.bag);
  }
  if($("bagAreaTimer")){
    const bt=$("bagAreaTimer");
    if(bagUpgrading()){
      setTxt(bt, bagSkipArmed
        ? ("Tup again. → −"+bagSkipGems()+" 💎")
        : ("slip — pass · 💎"+bagSkipGems()));
    }     else if(S.bag>=50) setTxt(bt,"max");
    else setTxt(bt, fmt(bagCost())+" 🪙 · "+bagUpgradeSec()+"c");
  }
  { const dot=$("bagUpDot");
    if(dot){
      const busy=bagUpgrading();
      const can=!busy && S.bag<50 && (S.gold||0)>=bagCost();
      if(busy && bagSkipArmed){
        // price already in the signature — Bage with 💎 Duplication and assaulting PROPUSK
        dot.style.display="none";
        setTxt(dot,"");
        dot.title="";
      } else if(busy){
        dot.style.display="flex";
        setTxt(dot,"⏩");
        dot.title="Tap for pass price";
      } else {
        setTxt(dot,"↑");
        dot.style.display=can?"flex":"none";
        dot.title="";
      }
    }
  }
  { const ab=$("auto")||$("autoBtn2"); if(ab&&ab.classList){
      const featOn=featUnlocked("auto");
      const unlocked=featOn && autoRollUnlocked();
      ab.classList.toggle("on",!!(S.autoRoll && unlocked));
      ab.classList.toggle("off",!unlocked);
      ab.classList.remove("featOff");
      setOp(ab, unlocked?"1":"0.55");
      const l=$("autoLbl2");
      if(l) setTxt(l, !featOn ? "🔒" : (!autoRollUnlocked() ? "🔒" : (S.autoRoll ? "INCLUDING" : "OFF")));
      ab.title=!featOn
        ? ("Opens at stage "+featNeedStage("auto"))
        : (!autoRollUnlocked()
          ? autoLockHint()
          : ("Auto bag removal · Now. "+(S.autoRoll?"INCLUDING":"OFF")));
    }
    const at=$("autoTier"); if(at&&at.classList){
      const featOn=featUnlocked("auto");
      const unlocked=featOn && autoRollUnlocked();
      const tier=S.autoRollTier|0;
      const tierTxt=(RAR_NAMES[tier]||"?")+"+";
      at.classList.toggle("on",!!(unlocked && (S.autoRollTier!=null)));
      at.classList.toggle("off",!unlocked);
      at.classList.remove("featOff");
      setOp(at, unlocked?"1":"0.55");
      const tl=$("autoTierLbl");
      if(tl) setTxt(tl, !featOn ? "🔒" : (!autoRollUnlocked() ? "🔒" : tierTxt));
      at.title=!featOn
        ? ("Opens at stage "+featNeedStage("auto"))
        : (!autoRollUnlocked()
          ? autoLockHint()
          : ("Threshold: below — trader, s "+tierTxt+" — Keep"));
    }
    const ag=$("autoGroup"); if(ag&&ag.classList) ag.classList.remove("featOff");
  }
  { const lc=$("lootChest");
    if(lc){ const dim=(S.bags||0)<1;
      setOp(lc,(dim||!!S.autoRoll)?"0.55":"1");
      if(lc.classList) lc.classList.toggle("off", dim||!!S.autoRoll);
      if("disabled"in lc) lc.disabled=false; } }
  { const pu=$("powerUp");
    if(pu){
      const busy=bagUpgrading(), maxed=S.bag>=50;
      const poor=!busy&&!maxed&&(S.gold||0)<bagCost();
      const off=maxed && !busy;
      if("disabled"in pu){ if(pu.disabled!==!!off) pu.disabled=!!off; }
      setOp(pu,(off||poor)?"0.55":"1");
      if(pu.classList){
        pu.classList.toggle("off",!!(off||poor));
        pu.classList.toggle("busyBag", !!busy);
        pu.classList.toggle("skipOffer", !!(busy && bagSkipArmed));
      }
      pu.title=busy
        ? (bagSkipArmed
          ? ("Pass for 💎"+bagSkipGems()+" — Tup again.")
          : ("Upside down. · slip — price of pass"))
        : (maxed?"Maximum":"Tap for drop odds and upgrade"
          +(poor?(" · need "+fmt(bagCost())+" 🪙"):(" · "+fmt(bagCost())+" 🪙")));
    }
  }
  if(S.geo){
    const g=GEO_TYPES[S.geo.t];
    const asc=(S.geo.asc||0)?(" ✦"+S.geo.asc):"";
    setHtml("geoName",`<span class="r${S.geo.r}">${S.geo.n||g.names[0]}${asc}</span>`);
    setHtml("geoDesc",GEO_RAR[S.geo.r]+" Lv."+(S.geo.lv||1)+" · +"+Math.round(geoPct(S.geo))+"% "+statLbl(g.stat)
      +'<br><span style="color:var(--dim);font-size:11px">Artel: '+geoMaterials()+' merger</span>');
  }
  { const gr=$("geoRolls"); if(gr) setTxt(gr,S.geoRolls); }
  const mineKey=S.mine%MINES.length;
  { const got=Object.keys(S.col[mineKey]||{}).length;
  setTxt("colCount",got+"/8"+(setDone(mineKey)?" ✓":(got===7?" · Another one!":""))); }
  applyFeatureChrome();
  updateFtueHint();
  try{ refreshGearSlotIfOpen(); }catch(e){}
  try{ refreshEventsIfOpen(); }catch(e){}
}
function hideFtueTip(tip){
  tip=tip||$("ftueTip"); if(!tip) return;
  tip.style.display="none"; tip._ftueStep=null; tip._ftueMsg=null;
  tip._ftueLeft=null; tip._ftueTop=null; tip._ftueArr=null;
}

function ftueOverlayOpen(){
  const intro=$("introOv"); if(intro&&intro.classList&&intro.classList.contains("on")) return true;
  const ui=$("uiScreen"); if(ui&&ui.style.display==="flex") return true;
  for(const id of ["dropModal","chestModal","metaModal","charModal","perkModal","setModal","setModal2","colModal","profModal","pickModal","overlay","offOverlay"]){
    const m=$(id); if(m&&m.style.display==="flex") return true;
  }
  return false;
}

function ftueAnchorVisible(el){
  if(!el||!el.getBoundingClientRect) return false;
  if(el.isConnected===false) return false;
  try{
    if(typeof window.getComputedStyle==="function"){
      for(let node=el; node; node=node.parentElement){
        const st=window.getComputedStyle(node);
        if(st.display==="none"||st.visibility==="hidden"||+st.opacity<0.05) return false;
      }
    }
  }catch(e){}
  const r=el.getBoundingClientRect();
  if(r.width<1||r.height<1) return false;
  const pad=6, vw=window.innerWidth||430, vh=window.innerHeight||900;
  if(r.bottom<=pad||r.right<=pad||r.top>=vh-pad||r.left>=vw-pad) return false;
  const app=$("app");
  if(app&&app.getBoundingClientRect){
    const ar=app.getBoundingClientRect();
    if(r.bottom<=ar.top+pad||r.right<=ar.left+pad||r.top>=ar.bottom-pad||r.left>=ar.right-pad) return false;
  }
  return true;
}

function ftueAppBounds(pad){
  pad=pad||8;
  const vw=window.innerWidth||430, vh=window.innerHeight||900;
  let left=pad, top=pad, right=vw-pad, bottom=vh-pad;
  const app=$("app");
  if(app&&app.getBoundingClientRect){
    const ar=app.getBoundingClientRect();
    if(ar.width>1&&ar.height>1){
      left=Math.max(left, ar.left+pad);
      top=Math.max(top, ar.top+pad);
      right=Math.min(right, ar.right-pad);
      bottom=Math.min(bottom, ar.bottom-pad);
    }
  }
  const nav=$("bottomNav");
  if(nav&&nav.getBoundingClientRect){
    const nr=nav.getBoundingClientRect();
    if(nr.top>top+40) bottom=Math.min(bottom, nr.top-pad);
  }
  return { left, top, right, bottom };
}
function updateFtueHint(){
  const tip=$("ftueTip"); if(!tip||!S||!S.ftue||S.introSeen===false) return;
  if(ftueOverlayOpen()){ hideFtueTip(tip); return; }
  let el=null, msg="", step=null;
  const cheapest=UPGRADES.reduce((a,u)=>upCost(u)<upCost(a)?u:a,UPGRADES[0]);
  if(!S.ftue.u && S.gold>=upCost(cheapest)){
    el=$("u_"+cheapest.id); step="u"; msg="<b>CLUE</b>Pump the attack. — vein ♪ it breaks faster ♪";
  } else if(!S.ftue.c && (S.bags||0)>0){
    el=$("lootChest"); step="c"; msg="<b>CHEST</b>Open the chest. — Put it on or sell it.";
  } else if(!S.ftue.b && !bagUpgrading() && S.bag<50 && S.gold>=bagCost()){
    el=$("powerUp"); step="b"; msg="<b>FORCE</b>Improve the chest. — The chance is rarer.";
  } else if(!S.ftue.t && S.ftue.b && featUnlocked("social")){
    el=$("navTavBtn"); step="t"; msg="<b>TAVERN</b>feast, beer and the artefact";
  } else if(!S.ftue.g && S.ftue.t && featUnlocked("social")){
    step="g"; msg="<b>FRIENDS</b>Tap Friends → Come on, cop-blast without advertising.";
    el=$("friendsBtn");
  }
  if(!el||!step||!ftueAnchorVisible(el)){ hideFtueTip(tip); return; }
  const r=el.getBoundingClientRect();
  const bounds=ftueAppBounds(8);
  tip.style.display="block";
  tip.style.visibility="visible";
  const contentChanged=tip._ftueStep!==step || tip._ftueMsg!==msg;
  if(contentChanged){
    tip._ftueStep=step; tip._ftueMsg=msg;
    tip.innerHTML=msg+'<span class="ftueSkip">slip — Hide</span>';
    tip._ftueArr=null;
  } else {
    tip._ftueStep=step;
  }
  const gap=6;
  const maxW=Math.max(120, bounds.right-bounds.left);
  const twRough=Math.min(tip.offsetWidth||210, maxW);
  const thRough=(tip.offsetHeight||56)+18;

  let sideRight=step==="g" && (r.right+gap+Math.min(twRough,200)<=bounds.right);
  let below=true;
  if(!sideRight){
    const preferBelow=r.top < bounds.top+(bounds.bottom-bounds.top)*0.35;
    below=preferBelow;
    if(preferBelow){
      if(r.bottom+gap+thRough>bounds.bottom && r.top-thRough-gap>=bounds.top) below=false;
    } else {
      if(r.top-thRough-gap<bounds.top && r.bottom+gap+thRough<=bounds.bottom) below=true;
    }
  }
  const arrNeed=sideRight?"sideL":(below?"top":"bot");
  const arrChar=sideRight?"◀":(below?"▲":"▼");
  if(tip._ftueArr!==arrNeed){
    const bodyHtml=msg+'<span class="ftueSkip">slip — Hide</span>';
    const arrHtml='<div class="ftueArr '+arrNeed+'">'+arrChar+'</div>';
    tip.innerHTML=sideRight || below ? (arrHtml+bodyHtml) : (bodyHtml+arrHtml);
    tip._ftueArr=arrNeed;
  }
  const tw=Math.min(tip.offsetWidth||210, maxW);
  const th=tip.offsetHeight||56;
  let left, top;
  if(sideRight){
    left=r.right+gap;
    top=r.top+r.height/2-th/2;
  } else {
    left=r.left+r.width/2-tw/2;
    top=below ? (r.bottom+gap) : (r.top-th-gap);
  }
  left=Math.max(bounds.left, Math.min(bounds.right-tw, left));
  top=Math.max(bounds.top, Math.min(bounds.bottom-th, top));
  left=Math.round(left); top=Math.round(top);
  if(contentChanged || tip._ftueLeft!==left || tip._ftueTop!==top){
    tip.style.left=left+"px";
    tip.style.top=top+"px";
    tip._ftueLeft=left; tip._ftueTop=top;
  }
}
function dismissFtueHint(e){
  if(e){
    if(e.preventDefault) e.preventDefault();
    if(e.stopPropagation) e.stopPropagation();
  }
  const tip=$("ftueTip"); if(!tip||!S||!S.ftue) return;
  const step=tip._ftueStep;
  if(step) S.ftue[step]=1;
  if(step==="b"){ const pu=$("powerUp"); if(pu&&pu.classList) pu.classList.remove("pulse"); }
  if(step==="c"){ const lc=$("lootChest"); if(lc&&lc.classList) lc.classList.remove("pulse"); }
  if(step==="u"){ const cheapest=UPGRADES.reduce((a,u)=>upCost(u)<upCost(a)?u:a,UPGRADES[0]);
    const row=$("u_"+cheapest.id), btn=row&&row.querySelector("button");
    if(btn&&btn.classList) btn.classList.remove("pulse"); }
  hideFtueTip(tip);
  save(); updateFtueHint();
}
if($("ftueTip")){
  const tip=$("ftueTip");
  const hide=(e)=>dismissFtueHint(e);
  tip.addEventListener("pointerdown", hide);
  tip.addEventListener("click", hide);
  tip.addEventListener("keydown",(e)=>{ if(e.key==="Enter"||e.key===" ") hide(e); });
  tip.onclick=hide;
}

function fxSwing(){
  const m=$("miner"); if(m&&m.classList){ m.classList.remove("swing"); void m.offsetWidth; m.classList.add("swing"); }
  const r=$("rock"); if(r&&r.classList){ r.classList.remove("hitfx"); void r.offsetWidth; r.classList.add("hitfx"); }
  if(Math.random()<0.55){
    const c=document.createElement("div");
    if(Math.random()<0.55){ c.className="shard"; }
    else { c.className="chip"; c.textContent="✨"; }
    c.style.right=(10+Math.random()*8)+"%"; c.style.bottom="66px";
    c.style.setProperty("--dx",(Math.random()*80-40)+"px");
    c.style.setProperty("--dy",(-30-Math.random()*50)+"px");
    $("scene").appendChild(c); setTimeout(()=>c.remove(),700);
  }
}
function fxDamage(dmg,crit){
  const d=document.createElement("div");
  d.className="dmgnum"+(crit?" crit":"");
  d.textContent=(crit?"CREEK ":"")+fmt(dmg);
  d.style.right=(8+Math.random()*14)+"%"; d.style.bottom=(86+Math.random()*30)+"px";
  $("scene").appendChild(d); setTimeout(()=>d.remove(),800);
}
let toastT=null;
let lastLogMsg="";
var LOG_PER_PAGE=100, LOG_MAX_PAGES=10, LOG_CAP=LOG_PER_PAGE*LOG_MAX_PAGES;
var logBuf=[];
var logPage=0;
function logTotalPages(){ return Math.max(1, Math.ceil(logBuf.length/LOG_PER_PAGE)); }
function renderLog(){
  const g=$("log"); if(!g||!g.appendChild) return;
  const pages=logTotalPages();
  if(logPage>pages-1) logPage=pages-1;
  if(logPage<0) logPage=0;

  const endIdx=logBuf.length-logPage*LOG_PER_PAGE;
  const startIdx=Math.max(0,endIdx-LOG_PER_PAGE);
  const slice=logBuf.slice(startIdx,endIdx);
  while(g.firstChild && g.removeChild) g.removeChild(g.firstChild);
  for(const e of slice){
    const li=document.createElement("div");
    li.className="li"+(e.important?" hot":"");
    const rarHtml = e.rar?`<span class="${e.rc}">${e.rar}</span> `:"";
    li.innerHTML=`<span class="ic">${e.icon}</span><span>${rarHtml}<b>${esc(e.name||"")}</b>${e.extra?(` <span class="tail">· ${esc(e.extra)}</span>`):""}</span>`;
    g.appendChild(li);
  }
  const pos=$("logPos"); if(pos) pos.textContent=(logPage+1)+"/"+pages;
  const nb=$("logNext"), pb=$("logPrev"), fb=$("logFirst");
  if(nb&&"disabled"in nb) nb.disabled=(logPage<=0);
  if(pb&&"disabled"in pb) pb.disabled=(logPage>=pages-1);
  if(fb&&"disabled"in fb) fb.disabled=(logPage<=0);

  if(logPage===0 && typeof g.scrollHeight==="number") g.scrollTop=g.scrollHeight;
}
let toastHideT=0;
function hideToast(e){
  if(e){
    if(e.preventDefault) e.preventDefault();
    if(e.stopPropagation) e.stopPropagation();
  }
  clearTimeout(toastHideT);
  const t=$("toast"); if(t) t.style.display="none";
}
function toastIconHtml(icon){
  const s=String(icon||"");

  if(/^<img\b/i.test(s) && s.indexOf("<",1)<0) return s;
  return esc(s);
}
function showToast(icon,rar,rcls,name,extra,important){
  const head=[rar,name].filter(x=>x&&(""+x).trim()).join(" ");
  lastLogMsg=(/^<img\b/i.test(String(icon||""))?"💎":(icon||""))+" "+head+(extra?(" · "+extra):"");
  logBuf.push({icon:icon||"",rar:rar||"",rc:(rcls||"").trim(),name:name||"",extra:extra||"",important:!!important});
  while(logBuf.length>LOG_CAP) logBuf.shift();
  if(logPage!==0) logPage++;
  if(logPage>logTotalPages()-1) logPage=0;
  renderLog();

  try{
    const fw=feedWhoFromToast(rar,name,extra);
    const body=[head,extra].filter(x=>x&&(""+x).trim()).join(" · ");
    pushFeed(fw.who, body, important?"hot":fw.kind);
  }catch(e){}
  const t=$("toast");
  if(!t) return;
  if(!toastsOn){ t.style.display="none"; return; }
  const rc=(rcls||"").trim().replace(/[^a-zA-Z0-9_-]/g,"");
  t.innerHTML=`<div class="big">${toastIconHtml(icon)}</div><div class="r ${rc}">${esc(rar||"")}</div><div class="nm">${esc(name||"")}</div><div class="vl">${esc(extra||"")}</div>`;
  t.style.display="block";
  clearTimeout(toastHideT);
  toastHideT=setTimeout(function(){ if(t) t.style.display="none"; }, important?2800:1800);
}
if($("toast")){

  $("toast").addEventListener("pointerdown", function(e){
    if(e.preventDefault) e.preventDefault();
    if(e.stopPropagation) e.stopPropagation();
    hideToast();
  }, {passive:false});
  $("toast").onclick=hideToast;
}
function toastMine(){
  const m=MINES[S.mine%MINES.length];
  const lines=["Deeper, what could go wrong?","New hall — New stones.","Echo’s become bass..."];
  showToast("⛏️","Deeper in the mountain!","",m.n,lines[Math.floor(Math.random()*lines.length)]);
  if(S.ftue&&!S.ftue.m && S.mine>=1){
    S.ftue.m=1; save();
    sayQuip("Second hallWho came here? — It’s usually the same as Grandpa.",5);
  }
}

function mineRaidFib(){ return (BALANCE.mineRaid&&BALANCE.mineRaid.fib)||[1,1,2,3,5,8,13]; }
function mineRaidFibAt(i){
  const f=mineRaidFib();
  if(i<0) return f[0]||1;
  if(i>=f.length) return f[f.length-1]||1;
  return Math.max(1, f[i]|0);
}
function ensureMineRaid(d){
  if(!d) return d;
  if(d.mineRaid!=null && typeof d.mineRaid!=="object") d.mineRaid=null;
  if(!d.mineRaidProg||typeof d.mineRaidProg!=="object") d.mineRaidProg={day:"",mines:{}};
  if(!d.mineRaidProg.mines||typeof d.mineRaidProg.mines!=="object") d.mineRaidProg.mines={};

  if(d.mineRaidDay&&typeof d.mineRaidDay==="object"){
    if(!d.mineRaidProg.day) d.mineRaidProg.day=d.mineRaidDay.day||"";
    delete d.mineRaidDay;
  }
  return d;
}
function mineRaidReset(){
  ensureMineRaid(S);
  const t=todayStr();
  if(S.mineRaidProg.day!==t){
    S.mineRaidProg={day:t,mines:{}};
    for(let i=0;i<MINES.length;i++) S.mineRaidProg.mines[i]={step:0,readyAt:0,adSkip:false};
  }
  for(let i=0;i<MINES.length;i++){
    const m=S.mineRaidProg.mines[i];
    if(!m||typeof m!=="object") S.mineRaidProg.mines[i]={step:0,readyAt:0,adSkip:false};
    else {
      if(m.step==null) m.step=0;
      if(m.readyAt==null) m.readyAt=0;
      if(m.adSkip==null) m.adSkip=false;
    }
  }
}
function mineRaidAdOk(mineId){
  mineRaidReset();
  const m=S.mineRaidProg.mines[mineId|0]||{};
  if(m.adSkip) return false;
  return adSlotOk("mine_raid_ready");
}
function mineRaidReadyAd(mineId){
  mineId=mineId|0;
  const slot=mineRaidSlot(mineId);
  if(slot.ready||slot.done||S.mineRaid) return;
  offerAdReward("mine_raid_ready", ()=>{
    mineRaidReset();
    const m=S.mineRaidProg.mines[mineId];
    if(!m) return;
    m.readyAt=0;
    m.adSkip=true;
    showToast("📺","Step ready","","×"+slot.fib+" · You can hit a rock.");
    Platform.logEvent("mine_raid_ready",{mine:mineId,step:slot.step});
    save(); render();
    if(typeof UIS!=="undefined"&&UIS.id==="mines") UIS.render("mines");
  }, {limitMsg:"Speeding up the advertising step for today"});
}
function mineRaidDef(id){
  const list=(BALANCE.mineRaid&&BALANCE.mineRaid.raids)||[];
  return list.find(r=>r.id===id)||list[id]||null;
}
function mineRaidSlot(id){
  mineRaidReset();
  id=id|0;
  const fib=mineRaidFib();
  const m=S.mineRaidProg.mines[id]||{step:0,readyAt:0};
  const step=Math.max(0, m.step|0);
  const done=step>=fib.length;
  const readyAt=done?Number.POSITIVE_INFINITY:(+m.readyAt||0);
  const leftMs=done?0:Math.max(0, readyAt-Date.now());
  const ready=!done && leftMs<=0;
  return {step, readyAt, leftMs, ready, done, fib:done?0:mineRaidFibAt(step), max:fib.length};
}
function mineRaidKeysLeft(id){

  const s=mineRaidSlot(id);
  return s.ready?1:0;
}
function mineRaidLevel(){ return Math.max(1, Math.floor((S.mine||0)/MINES.length)+1); }
function mineRaidRewardAmt(def, step){
  if(!def) return 1;
  const lv=mineRaidLevel();
  const base=Math.max(1, Math.round((def.base||1)*Math.pow(def.g||1.1, lv-1)));
  const mul=mineRaidFibAt(step==null?mineRaidSlot(def.id|0).step:step);
  return Math.max(1, Math.round(base*mul));
}
function mineRaidAdvance(mineId){
  mineRaidReset();
  const fib=mineRaidFib();
  const cur=S.mineRaidProg.mines[mineId]||{step:0,readyAt:0};
  const next=(cur.step|0)+1;
  const unit=((BALANCE.mineRaid&&BALANCE.mineRaid.timerUnitSec)||1800)*1000;
  if(next>=fib.length){
    S.mineRaidProg.mines[mineId]={step:next, readyAt:Number.POSITIVE_INFINITY};
  } else {
    S.mineRaidProg.mines[mineId]={step:next, readyAt:Date.now()+mineRaidFibAt(next)*unit};
  }
}
function grantMineRaidReward(snap){
  const res=snap.res, amt=Math.max(1, snap.amt|0), ic=snap.ic||"⛏", n=snap.n||"Award";
  if(res==="bags") grantBags(amt);
  else S[res]=(S[res]||0)+amt;
  const fib=snap.fib||1;
  showToast(ic,"A special stone!","", n+" · ×"+fib, "+"+amt+" "+(snap.label||ic), true);
  sayQuip("hall I gave it to him. — The mountain timer.",4);
  Platform.logEvent("mine_raid",{mineId:snap.mineId,res,amt,fib,step:snap.step});
}
function startMineRaid(mineId){
  mineId=mineId|0;
  if(!(mineId>=0 && mineId<MINES.length)) return false;
  if(typeof requireFeat==="function" && !requireFeat("mines")) return false;
  const curAbs=S.mine||0, cur=curAbs%MINES.length;
  if(mineId>cur){
    showToast("⛏","hall closed","","First, come here as usual. loot","Now. "+(cur+1)+"/5");
    return false;
  }
  const slot=mineRaidSlot(mineId);
  if(slot.done){
    showToast("🔑","Level for today","","All stages today · tomorrow with ×1");
    return false;
  }
  if(!slot.ready){
    showToast("⏱","Not yet.","","Next step ×"+slot.fib, fmtClock(slot.leftMs));
    return false;
  }
  if(S.mineRaid){
    showToast("⛏","On it.","","First, break the current special stone.");
    return false;
  }
  if(S.eventRun){
    showToast("◎","Runs","","First, finish the wave of the iventa.","Or lose. — key retained");
    return false;
  }
  const def=mineRaidDef(mineId);
  if(!def) return false;
  const step=slot.step, fib=slot.fib;
  const amt=mineRaidRewardAmt(def, step);
  mineRaidAdvance(mineId);
  S.mineRaid={ mineId, res:def.res, amt, ic:def.ic, n:def.n, label:def.label, step, fib };
  const cycle=Math.floor(curAbs/MINES.length);
  const nextAbs=cycle*MINES.length+mineId;
  if(nextAbs!==curAbs){
    S.mine=nextAbs; S.stage=Math.min(S.stage||1, STAGES_PER_MINE);
    S.durab=MINE_DURAB.max; lastDurabWarn=MINE_DURAB.max;
  }
  dead=false;
  try{ if(typeof UIS!=="undefined"&&UIS.close) UIS.close(); }catch(e){}
  newRock(); save(); render();
  const next=mineRaidSlot(mineId);
  const nextHint=next.done
    ? "That’s it for today."
    : ("Further ×"+next.fib+" Through "+fmtClock(next.leftMs));
  showToast(def.ic||"🔑","Special Stone · step "+(step+1),"",
    "Break it. — "+amt+" "+(def.label||def.n)+" (×"+fib+")", nextHint);
  Platform.logEvent("mine_raid_start",{mineId,amt,step,fib});
  return true;
}

function switchMine(id){
  if(!(id>=0 && id<MINES.length)) return false;
  const curAbs=S.mine||0, cur=curAbs%MINES.length, cycle=Math.floor(curAbs/MINES.length);
  if(id>cur){ showToast("⛏","Closed","","Go to that. hall In a circle","Now. "+(cur+1)+"/5"); return false; }
  if(S.eventRun){
    showToast("◎","Runs","","First, finish the wave of the iventa.");
    return false;
  }
  if(S.mineRaid){
    showToast("⛏","First, a special stone","","The step has already been taken. — finish it. vein");
    return false;
  }
  const nextAbs=cycle*MINES.length + id;
  if(nextAbs===curAbs){ switchTab("Mine"); return true; }
  S.mine=nextAbs;
  S.stage=1;
  S.durab=MINE_DURAB.max; lastDurabWarn=MINE_DURAB.max;
  toastMine();
  newRock(); save(); render();
  Platform.logEvent("mine_switch",{mine:S.mine});
  switchTab("Mine");
  return true;
}
function tapVein(){
  if(!dead&&rock&&S.rockHP>0){ fxSwing(); hitTimer=Math.max(hitTimer, 1/stat("spd")-0.02); }
}
if($("miner")) $("miner").onclick=tapVein;
if($("rock")) $("rock").onclick=tapVein;
if($("setMusic")) $("setMusic").onclick=()=>toggleMusic();
if($("introGo")) $("introGo").onclick=closeIntro;
["Mine","Hero","Meta"].forEach(t=>{ const b=$("tab"+t+"Btn"); if(b) b.onclick=()=>switchTab(t); });
document.querySelectorAll&&document.querySelectorAll("#bottomNav .btn-nav[data-nav]").forEach(b=>{
  b.onclick=()=>switchTab(b.getAttribute("data-nav"));
});
if($("geoName")) $("geoName").onclick=openGeoGuild;
if($("geoDesc")) $("geoDesc").onclick=openGeoGuild;
if($("logNext")&&$("logNext").addEventListener){
  $("logNext").onclick=()=>{ logPage--; renderLog(); };
  $("logPrev").onclick=()=>{ logPage++; renderLog(); };
  $("logFirst").onclick=()=>{ logPage=0; renderLog(); };
}
function openCollection(){
  const mineKey=S.mine%MINES.length, m=MINES[mineKey], col=S.col[mineKey]||{};
  $("colTitle").textContent="Collection: "+m.n;
  const got=Object.keys(col).length;
  const bonusLine=`<div class="col-item"><span>Liabilities: +2% Greed for the Stone</span><span class="cnt">Now. +${2*uniqueStones()}%</span></div>`
    +`<div class="col-item"><span>Seth. hall (8/8): <b>${SET_BONUS[mineKey].label}</b></span><span class="cnt">${setDone(mineKey)?"ACTIVE ✓":got+"/8"}</span></div>`;
  $("colList").innerHTML=bonusLine+m.stones.map((s,i)=>{
    const c=col[i]||0;
    const ic=c?`<img src="${ORE_ICONS[i]}" class="oreimg">`:`<span style="display:inline-block;width:26px;height:26px;margin-right:6px;text-align:center;opacity:.4">?</span>`;
    let craft="";
    if(i>=1){
      const need=craftBoxCost(i), have=dupStones(i), ok=have>=need;
      craft=`<button class="btn btn-soft" style="width:auto;padding:6px 10px;font-size:12px;margin-left:8px"
        onclick="craftBoxFromStones(${i})" ${ok?"":"disabled"} ${ok?"":'style="width:auto;padding:6px 10px;font-size:12px;margin-left:8px;opacity:.4"'}
        title="duplicate: ${have}/${need}">📦 ${need}</button>`;
    }
    return `<div class="col-item"><span class="${c?"found":"notfound"}">${ic}<b class="r${i}">${RAR_NAMES[i]}</b> · ${c?s:"???"}</span><span class="cnt">${c?"×"+c:"not found"}${craft}</span></div>`;
  }).join("");
  $("colModal").style.display="flex";
}
function resetProgress(){
  if(confirm("Are you sure it’s all over again? Mountain She remembers, but she will.")){
    wipeSave(); S=ensureAll(freshState()); newRock(); save(); renderGear(); render();
  }
}

/* —— Play Games Level Up (achievements / rewards / cloud / notify) —— */
let _pgsAuthed=false, _cloudBusy=false, _cloudPend=null, _lastCloudPush=0;
function ensurePlay(d){
  if(!d) return d;
  if(!d.playClaimed||typeof d.playClaimed!=="object") d.playClaimed={};
  if(!d.playCosmetics||typeof d.playCosmetics!=="object") d.playCosmetics={};
  if(!d.playUnlocked||typeof d.playUnlocked!=="object") d.playUnlocked={};
  if(d.bagsOpened==null) d.bagsOpened=0;
  return d;
}
function playAchId(key){
  try{ return (PLAY_ACHIEVEMENTS&&PLAY_ACHIEVEMENTS[key]&&PLAY_ACHIEVEMENTS[key].id)||key; }catch(e){ return key; }
}
function playEvId(key){
  try{ return (PLAY_EVENTS&&PLAY_EVENTS[key]&&PLAY_EVENTS[key].id)||key; }catch(e){ return key; }
}
function unlockPlayAchievement(key){
  if(!S) return;
  ensurePlay(S);
  if(S.playUnlocked[key]) return;
  S.playUnlocked[key]=1;
  try{ Platform.unlockAchievement(playAchId(key)); }catch(e){}
  try{ Platform.logEvent("play_achievement",{key}); }catch(e){}
}
function trackPlayEvent(key, amount){
  const n=Math.max(1, amount|0);
  try{ Platform.incrementEvent(playEvId(key), n); }catch(e){}
}
function checkPlayAchievements(){
  if(!S) return;
  ensurePlay(S);
  if((S.veinsBroken||0)>=1) unlockPlayAchievement("first_vein");
  if((S.bagsOpened||0)>=10) unlockPlayAchievement("bags_10");
  if((S.stageIdx||0)>=10) unlockPlayAchievement("depth_30");
  if((S.bag||0)>=5) unlockPlayAchievement("bag_lv5");
  if((S.lvls&&S.lvls.atk|0)>=1) unlockPlayAchievement("upgrade_atk");
  if((S.stageIdx||0)>=34) unlockPlayAchievement("depth_100");
  if(S.pet || (S.petRolls|0)>0) unlockPlayAchievement("first_pet");
  if(S.geo || (S.geoRolls|0)>0 || (S.beard|0)>0) unlockPlayAchievement("first_beard");
  if((S.prestigeRuns||0)>=1) unlockPlayAchievement("prestige_1");
  if((S.pvpWins||0)>=1) unlockPlayAchievement("pvp_win");
  if(S.streak&&(S.streak.n|0)>=7) unlockPlayAchievement("streak_7");
  try{
    for(const k in (S.gear||{})){
      const it=S.gear[k];
      if(it && (it.r|0)>=7){ unlockPlayAchievement("cosmic_slot"); break; }
    }
  }catch(e){}
}
function grantPlayReward(rewardId){
  if(!S || !rewardId) return false;
  ensurePlay(S);
  let def=null, key=null;
  try{
    for(const k in PLAY_REWARDS){
      if(PLAY_REWARDS[k].id===rewardId || k===rewardId){ def=PLAY_REWARDS[k]; key=k; break; }
    }
  }catch(e){}
  if(!def){ try{ showToast("🎮","Play reward","","Unknown offer"); }catch(e){} return false; }
  if(def.kind==="single" && S.playClaimed[key]){
    showToast("🎮","Already claimed","",def.n||key); return false;
  }
  const g=def.grant||"";
  if(g==="pick_skin_magma"){
    S.playCosmetics.pick="magma";
    showToast("⛏️","Magma Pick Skin","","Equipped vanity · Play Games",true);
  } else if(g==="beard_style_royal"){
    S.playCosmetics.beard="royal";
    showToast("🧔","Royal Beard Style","","Equipped vanity · Play Games",true);
  } else if(g==="gold_weekly"){
    const mul=def.goldMul||80;
    const amt=Math.max(100, Math.round(veinReward()*mul));
    S.gold=(S.gold||0)+amt;
    showToast("🪙","Weekly Gold Cache","","+"+fmt(amt)+" 🪙 · Play Games",true);
  } else {
    showToast("🎮","Play reward","",def.n||key);
  }
  if(def.kind==="single") S.playClaimed[key]=Date.now();
  try{ Platform.logEvent("play_reward",{id:rewardId,key,grant:g}); }catch(e){}
  save(); try{ render(); }catch(e){}
  return true;
}
function playProgressScore(d){
  if(!d) return 0;
  return ((d.prestigeLv|0)*1e9)+((d.bestDepth|0)*1e3)+((d.stageIdx|0)*10)+((d.veinsBroken|0));
}
function applyCloudSave(raw){
  try{
    const parsed=JSON.parse(raw);
    if(!parsed||typeof parsed!=="object"||Array.isArray(parsed)) return false;
    S=Object.assign(freshState(), migrate(parsed));
    sanitizeState(S); ensureAll(S); ensurePlay(S); S.eventRun=null; resetTimers();
    try{ Platform.syncAds(); }catch(e){}
    try{ newRock(); render(); }catch(e){}
    save();
    showToast("☁️","Cloud save loaded","","Progress from Play Games",true);
    return true;
  }catch(e){ return false; }
}
function showCloudConflict(cloudRaw){
  let cloud=null;
  try{ cloud=JSON.parse(cloudRaw); }catch(e){ return; }
  if(!cloud||typeof cloud!=="object") return;
  const localScore=playProgressScore(S);
  const cloudScore=playProgressScore(cloud);
  if(cloudScore<=localScore){
    try{ pushCloudSave(true); }catch(e){}
    return;
  }
  _cloudPend=cloudRaw;
  const cDepth=fmt((cloud.bestDepth||cloud.stageIdx*3)||0);
  const lDepth=fmt((S.bestDepth||S.stageIdx*3)||0);
  metaOpen("Cloud save conflict",
    "Play Games has newer progress",
    '<div class="metarow"><span>This device</span><span>⛰'+(S.prestigeLv||0)+' · '+lDepth+' m</span></div>'
    +'<div class="metarow"><span>Cloud</span><span>⛰'+(cloud.prestigeLv||0)+' · '+cDepth+' m</span></div>'
    +'<div class="btnrow" style="margin-top:12px">'
    +'<button type="button" class="btn btn-soft" onclick="resolveCloudConflict(false)">Keep this device</button>'
    +'<button type="button" class="btn btn-hard" onclick="resolveCloudConflict(true)">Use cloud</button>'
    +'</div>');
}
function resolveCloudConflict(useCloud){
  const raw=_cloudPend; _cloudPend=null;
  try{ if($("metaModal")) $("metaModal").style.display="none"; }catch(e){}
  if(useCloud && raw) applyCloudSave(raw);
  else pushCloudSave(true);
}
function pushCloudSave(force){
  if(!S || !_pgsAuthed || _cloudBusy) return;
  const now=Date.now();
  if(!force && now-_lastCloudPush<25000) return;
  _lastCloudPush=now;
  try{
    S.lastSeen=now;
    const raw=JSON.stringify(S);
    _cloudBusy=true;
    Platform.cloudSave(raw, function(){ _cloudBusy=false; });
  }catch(e){ _cloudBusy=false; }
}
function onPlayGamesAuth(ok){
  _pgsAuthed=!!ok;
  try{ Platform.logEvent("pgs_auth",{ok:_pgsAuthed}); }catch(e){}
  if(!_pgsAuthed || !S) return;
  checkPlayAchievements();
  Platform.cloudLoad(function(okLoad, payload){
    if(okLoad && payload) showCloudConflict(payload);
    else pushCloudSave(true);
  });
}
function scheduleGameNotify(title, body, whenMs){
  try{ Platform.scheduleNotify(title, body, whenMs); }catch(e){}
}
function scheduleBagReadyNotify(){
  if(!S||!S.bagActive||!S.bagActive.end) return;
  scheduleGameNotify("Bag ready","Your loot bag upgrade finished.", S.bagActive.end);
}
function scheduleBonusNotify(){
  if(!S||!S.bonusReadyAt||S.bonusReadyAt<=Date.now()) return;
  scheduleGameNotify("Bonus chest","A bonus chest is ready in the mine.", S.bonusReadyAt);
}
function dailyVeinSeed(){
  const t=todayStr();
  let h=0; for(let i=0;i<t.length;i++) h=((h<<5)-h)+t.charCodeAt(i)|0;
  return Math.abs(h)%9973;
}
function isDailySharedVein(){
  if(!rock||rock.isRaid||rock.isEvent||rock.isBoss) return false;
  return ((S.stageIdx|0)+dailyVeinSeed())%17===0;
}
function shareDailyVein(){
  const seed=dailyVeinSeed();
  const depth=fmt((S.stageIdx||1)*3);
  const text="Today's shared vein #"+seed+" · I'm at "+depth+" m in Mountain King. Dig with me!";
  try{ Platform.logEvent("daily_vein_share",{seed}); }catch(e){}
  if(navigator.share){
    navigator.share({title:"Mountain King", text:text}).catch(()=>{});
  } else {
    try{ navigator.clipboard.writeText(text); showToast("📤","Copied","","Daily vein link text"); }catch(e){
      showToast("📤","Share","","Vein #"+seed);
    }
  }
}
function bindPlayKeyboard(){
  if(window.__mkKeysBound) return;
  window.__mkKeysBound=true;
  document.addEventListener("keydown", function(e){
    if(!e||e.metaKey||e.ctrlKey||e.altKey) return;
    const tag=(e.target&&e.target.tagName||"").toLowerCase();
    if(tag==="input"||tag==="textarea"||(e.target&&e.target.isContentEditable)) return;
    const k=e.key;
    if(k===" "||k==="Enter"){
      e.preventDefault();
      try{ if(typeof minerHit==="function") minerHit(); }catch(err){}
      return;
    }
    if(k==="b"||k==="B"){ e.preventDefault(); try{ openBag(); }catch(err){} return; }
    if(k==="s"||k==="S"){ e.preventDefault(); try{ shareCard(); }catch(err){} return; }
    if(k==="d"||k==="D"){ e.preventDefault(); try{ shareDailyVein(); }catch(err){} return; }
    if(k>="1"&&k<="5"){
      const tabs=["Mine","Market","Skills","Tavern","PvP"];
      const t=tabs[(k|0)-1];
      if(t){ e.preventDefault(); try{ switchTab(t); }catch(err){} }
    }
  }, true);
}

const SAVE_KEY="oredeep_v3";
const SAVE_BAK="oredeep_v3_bak";
let _saveFailAt=0;
function save(){
  if(!S) return false;
  try{
    S.lastSeen=Date.now();
    const raw=JSON.stringify(S);
    localStorage.setItem(SAVE_KEY, raw);
    try{ localStorage.setItem(SAVE_BAK, raw); }catch(e2){}
    try{ pushCloudSave(false); }catch(e3){}
    return true;
  }catch(e){
    if(Date.now()-_saveFailAt>60000){
      _saveFailAt=Date.now();
      try{ showToast("💾","Unable to save","","Not much room in the browser.","Close other tabs"); }catch(e3){}
    }
    return false;
  }
}

function flushSave(){ try{ save(); }catch(e){} }
function readSaveObject(){
  const keys=[SAVE_KEY, SAVE_BAK];
  for(let i=0;i<keys.length;i++){
    try{
      const raw=localStorage.getItem(keys[i]);
      if(!raw) continue;
      const parsed=JSON.parse(raw);
      if(parsed && typeof parsed==="object" && !Array.isArray(parsed))
        return { data:parsed, fromBak:i>0 };
    }catch(e){}
  }
  return null;
}
const SAVE_VER=2;
function ensureDurab(d){ if(d && d.durab==null) d.durab=MINE_DURAB.max; return d; }
function ensureCards(d){ if(!d) return d;
  if(!d.skillCards) d.skillCards={};
  if(!d.skills) d.skills={};
  { const B=BALANCE.special||{}, start=B.start||5;
    if(!d.special){ d.special={}; SPECIAL_DEFS.forEach(x=>{ d.special[x.id]=start; }); }
    SPECIAL_DEFS.forEach(x=>{ if(d.special[x.id]==null) d.special[x.id]=start; });
    if(d.specialPool==null) d.specialPool=B.pool||5;
    if(d.skillPts==null) d.skillPts=0;
    if(d.minerLv==null) d.minerLv=0;
    if(d.veinsBroken==null) d.veinsBroken=0;
    if(!d.skillTags) d.skillTags=[];
    if(!d.trained) d.trained={};
    if(!Array.isArray(d.perks)) d.perks=[];
    if(d.perkPicks==null) d.perkPicks=0;
    if(!Array.isArray(d.traits)) d.traits=[];
    if(d.traitPicks==null) d.traitPicks=0;
    if(d.perkBought==null) d.perkBought=0;
    if(d.traitBought==null) d.traitBought=0; }
  if(!d.stickers||typeof d.stickers!=='object') d.stickers={};
  if(typeof d.gymXP!=='number'||!isFinite(d.gymXP)||d.gymXP<0) d.gymXP=0;
  if(d.chestKeys==null) d.chestKeys=1;
  return d; }
function ensureMerge(d){ if(!d) return d;
  if(!d.petBox) d.petBox={};
  if(!d.geoBox) d.geoBox={};
  if(d.geo && d.geo.lv==null) d.geo.lv=1;
  if(d.geo && d.geo.asc==null) d.geo.asc=0;
  return d; }
function ensureBags(d){ if(!d) return d;
  if(d.bags==null) d.bags=0;
  if(d.autoRoll==null) d.autoRoll=false;
  if(d.autoRollTier==null) d.autoRollTier=4;
  if(!d.shopFree||typeof d.shopFree!=="object") d.shopFree={day:"",taken:{}};
  if(!d.pvpBotRec||typeof d.pvpBotRec!=="object") d.pvpBotRec={};
  return d; }
function ensureGrowth(d){ if(!d) return d;
  const f=freshState().growth;
  if(!d.growth||typeof d.growth!=="object") d.growth=JSON.parse(JSON.stringify(f));
  if(!d.growth.installId) d.growth.installId=randSeed();
  if(!d.growth.installAt) d.growth.installAt=Date.now();
  if(!d.growth.code) d.growth.code=SHA256("ore_inv_"+d.growth.installId).slice(0,6).toUpperCase();
  if(!d.growth.waitlist||typeof d.growth.waitlist!=="object") d.growth.waitlist={joined:false,claimed:false,at:0};
  if(!d.growth.ads||typeof d.growth.ads!=="object") d.growth.ads={day:"",count:0,bySlot:{}};
  if(!d.growth.ads.bySlot||typeof d.growth.ads.bySlot!=="object") d.growth.ads.bySlot={};
  if(!Array.isArray(d.growth.milestones)) d.growth.milestones=[];
  if(d.growth.adViewsLifetime==null) d.growth.adViewsLifetime=0;
  if(d.growth.revenueCents==null) d.growth.revenueCents=0;
  if(d.growth.organic==null) d.growth.organic=true;
  try{
    if(d.growth.code){
      const cap=BALANCE.growth.referral.inviterCap;
      const n=Number(localStorage.getItem("oredeep_ref_"+d.growth.code)||0);
      const fromLs=isFinite(n)?n:0;
      d.growth.invites=Math.min(cap, Math.max(d.growth.invites||0, fromLs));
    }
  }catch(e){}
  return d; }
function ensurePrestige(d){ if(!d) return d;
  if(d.prestigeLv==null) d.prestigeLv=0;
  if(d.prestigeRuns==null) d.prestigeRuns=0;
  if(d.echo==null) d.echo=0;
  return d; }

const NON_NEGATIVE=["gold","gems","shards","protein","trophies","keys","chestKeys",
                    "bags","echo","beardXP","prestigeLv","prestigeRuns","bestDepth","eggs","combs"];
function sanitizeState(d){
  const f=freshState();
  for(const k in f){
    const fv=f[k], dv=d[k];
    if(fv===null) continue;
    if(dv===undefined){ d[k]=fv; continue; }
    if(typeof fv==="number"){
      if(typeof dv!=="number" || !isFinite(dv)) d[k]=fv;
    } else if(typeof fv==="boolean"){
      if(typeof dv!=="boolean") d[k]=fv;
    } else if(typeof fv==="string"){
      if(typeof dv!=="string") d[k]=fv;
    } else if(Array.isArray(fv)){
      if(!Array.isArray(dv)) d[k]=fv;
    } else if(typeof fv==="object"){
      if(!dv || typeof dv!=="object" || Array.isArray(dv)) d[k]=fv;
    }
  }

  if(!d.lvls || typeof d.lvls!=="object") d.lvls=f.lvls;
  for(const u of UPGRADES){
    const v=d.lvls[u.id];
    if(typeof v!=="number" || !isFinite(v) || v<0) d.lvls[u.id]=0;
  }
  for(const k of NON_NEGATIVE) if(typeof d[k]==="number" && d[k]<0) d[k]=0;
  if(typeof d.durab==="number") d.durab=Math.max(0,Math.min(MINE_DURAB.max,d.durab));
  if(typeof d.speed!=="number" || !SPEEDS.includes(d.speed)) d.speed=1;
  return d;
}

function ensureWorkouts(d){ if(!d) return d;
  if(d.wkPts==null||!isFinite(d.wkPts)||d.wkPts<0) d.wkPts=0;
  if(!d.workouts||typeof d.workouts!=="object") d.workouts={};
  if(d.wkActive && (typeof d.wkActive.end!=="number"||!d.wkActive.path)) d.wkActive=null;
  if(d.mugLv==null||!isFinite(d.mugLv)||d.mugLv<0) d.mugLv=0;
  const mugMax=((BALANCE.workouts&&BALANCE.workouts.mug)||[{mul:1}]).length-1;
  if(d.mugLv>mugMax) d.mugLv=mugMax;
  return d;
}
function ensureAll(d){
  ensureDurab(d); ensurePrestige(d); ensureBags(d); ensureMerge(d);
  ensureCards(d); ensureFair(d); ensureScience(d); ensureGacha(d); ensureBonus(d); ensureGrowth(d);
  ensureWorkouts(d); ensureFeat(d); ensureMineRaid(d); ensureEventRun(d); ensurePlay(d);
  return d;
}
function ensureGacha(d){ if(!d) return d;
  if(d.eggs==null) d.eggs=0;
  if(d.combs==null) d.combs=0;
  if(d.bagActive && typeof d.bagActive.end!=="number") d.bagActive=null;
  if(d.bagActive && d.ftue && !d.ftue.b) d.ftue.b=1;
  if(d.ftue){
    if(d.ftue.c==null) d.ftue.c=d.ftue.b?1:0;
    const U=BALANCE.unlocks||{};
    if(d.ftue.t==null) d.ftue.t=(d.stageIdx||1)>=(U.social||160)?1:0;
    if(d.ftue.g==null) d.ftue.g=(d.stageIdx||1)>=(U.social||160)?1:0;
    if(d.ftue.m==null) d.ftue.m=(d.mine||0)>0?1:0;
  }
  return d; }
function migrate(d){ ensureAll(d); ensureIntro(d); ensureGacha(d);
  if(!d.v||d.v<2){
    if(!d.ftue) d.ftue={u:1,b:1,c:1,t:1,m:1,g:1};
    else { d.ftue.u=d.ftue.u||1; d.ftue.b=d.ftue.b||1; d.ftue.c=1; d.ftue.t=1; d.ftue.g=1; d.ftue.m=(d.mine||0)>0?1:0; }
    if(!d.streak) d.streak={n:0,last:""};
    if(d.look===undefined) d.look=Math.floor(Math.random()*6);
    d.v=2;
  }
  if(!d.v||d.v<3){
    ensureGacha(d);
    d.v=3;
  }
  if(!d.v||d.v<4){
    ensureGrowth(d);
    d.v=4;
  }
  if(d.beard===undefined) d.beard=0;
  if(d.beardXP===undefined) d.beardXP=0;
  if(d.shards===undefined){ d.shards=0; d.boxes=[]; d.loadoutTier=0; d.frags={}; d.sets={}; }
  if(d.keyAt===undefined) d.keyAt=Date.now();
  if(!d.pickLog){
    d.pickLog={};
    if(d.gear&&d.gear.pick&&!d.gear.pick.n){
      d.gear.pick.n=PICK_NAMES[d.gear.pick.r][0];
      d.pickLog[d.gear.pick.n]=true;
    }
  }
  return d;
}
function load(){
  try{
    const got=readSaveObject();
    if(got){
      S=Object.assign(freshState(), migrate(got.data));
      sanitizeState(S); ensureAll(S); S.eventRun=null; resetTimers();
      if(got.fromBak){
        try{ save(); }catch(e){}
        try{ showToast("💾","Progress restored","","from a backup",""); }catch(e){}
      }
      try{ Platform.syncAds(); }catch(e){}
      return;
    }
  }catch(e){}
  S=ensureAll(freshState());
  resetTimers();
  try{ Platform.syncAds(); }catch(e){}
}
function wipeSave(){
  try{ localStorage.removeItem(SAVE_KEY); localStorage.removeItem(SAVE_BAK); }catch(e){}
}
function bindSaveLifecycle(){
  const flush=()=>flushSave();
  try{
    document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden") flush(); });
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
  }catch(e){}
}

let AC=null, MG=null, DL=null, musicOn=(localStorage.getItem("oredeep_music")!=="off");
let toastsOn=(localStorage.getItem("oredeep_toasts")!=="off");
function toastToggleLabel(){ return toastsOn?"💬 on":"🚫 off"; }
function syncToastToggleBtns(){
  const label=toastToggleLabel();
  const a=$("setToasts"), b=$("uiSetToasts");
  if(a) a.textContent=label;
  if(b) b.textContent=label;
}
function toggleToasts(){
  toastsOn=!toastsOn;
  try{ localStorage.setItem("oredeep_toasts",toastsOn?"on":"off"); }catch(e){}
  syncToastToggleBtns();
  const t=$("toast");
  if(!toastsOn && t){ t.style.display="none"; clearTimeout(toastHideT); }
  if(toastsOn) showToast("💬","Pop-up messages","","included","You can turn it off again in settings.");
}
let nextBeat=0, beatN=0, musicTimer=null, chordIdx=0, arpStep=0;
const BPM=60, SPB=60/BPM;
const SCALE=[146.83,174.61,196,220,261.63,293.66];

const CHORDS=[[146.83,174.61,220],[130.81,164.81,196],[116.54,146.83,174.61],[98,116.54,146.83]];

function audioStart(){
  if(AC||!musicOn) return;
  try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  MG=AC.createGain(); MG.gain.value=0.2; MG.connect(AC.destination);
  DL=AC.createDelay(1.5); DL.delayTime.value=0.75;
  const fb=AC.createGain(); fb.gain.value=0.45;
  DL.connect(fb); fb.connect(DL); DL.connect(MG);
  const drone=(f,type,g)=>{
    const o=AC.createOscillator(),gn=AC.createGain(),fl=AC.createBiquadFilter();
    o.type=type; o.frequency.value=f;
    fl.type="lowpass"; fl.frequency.value=160;
    gn.gain.value=g; o.connect(fl); fl.connect(gn); gn.connect(MG); o.start();
    const lfo=AC.createOscillator(), lg=AC.createGain();
    lfo.frequency.value=0.04+Math.random()*0.04; lg.gain.value=g*0.5;
    lfo.connect(lg); lg.connect(gn.gain); lfo.start();
  };
  drone(36.71,"sine",0.09);
  drone(73.42,"sawtooth",0.028);
  drone(110,"triangle",0.04);
  nextBeat=AC.currentTime+0.1; beatN=0;
  musicTimer=setInterval(musicSchedule,120);
}
function thump(t,vel){
  const o=AC.createOscillator(),g=AC.createGain();
  o.type="sine";
  o.frequency.setValueAtTime(75,t);
  o.frequency.exponentialRampToValueAtTime(36,t+0.3);
  g.gain.setValueAtTime(vel,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.5);
  o.connect(g); g.connect(MG); o.start(t); o.stop(t+0.55);
}
function anvil(t,f,vel,dur){
  [1,2.76,5.4].forEach((m,i)=>{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type="sine"; o.frequency.value=f*m;
    g.gain.setValueAtTime(vel/(i+1),t);
    g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g); g.connect(MG); o.start(t); o.stop(t+dur+0.05);
  });
}
function horn(t,f,dur,vel){
  [-4,0,4].forEach(det=>{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type="triangle"; o.frequency.value=f; o.detune.value=det;
    g.gain.setValueAtTime(0.0001,t);
    g.gain.linearRampToValueAtTime(vel,t+dur*0.3);
    g.gain.linearRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(MG); o.start(t); o.stop(t+dur+0.05);
  });
}
function pad(t,freqs,dur){
  freqs.forEach(f=>{
    [0,6].forEach(det=>{
      const o=AC.createOscillator(),g=AC.createGain(),fl=AC.createBiquadFilter();
      o.type="triangle"; o.frequency.value=f; o.detune.value=det;
      fl.type="lowpass";
      fl.frequency.setValueAtTime(280,t);
      fl.frequency.linearRampToValueAtTime(900,t+dur*0.5);
      fl.frequency.linearRampToValueAtTime(280,t+dur);
      g.gain.setValueAtTime(0.0001,t);
      g.gain.linearRampToValueAtTime(0.04,t+dur*0.35);
      g.gain.linearRampToValueAtTime(0.0001,t+dur);
      o.connect(fl); fl.connect(g); g.connect(MG);
      o.start(t); o.stop(t+dur+0.1);
    });
  });
}
function arpNote(t,f){
  const o=AC.createOscillator(),g=AC.createGain();
  o.type="sine"; o.frequency.value=f;
  g.gain.setValueAtTime(0.05,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.22);
  o.connect(g); g.connect(MG); g.connect(DL);
  o.start(t); o.stop(t+0.3);
}
function musicSchedule(){
  if(!AC||!musicOn) return;
  while(nextBeat<AC.currentTime+0.5){
    const t=nextBeat;
    if(beatN%16===0){ pad(t,CHORDS[chordIdx%CHORDS.length],17); chordIdx++; }
    if(beatN%2===0) thump(t,0.10);
    const ch=CHORDS[(chordIdx+CHORDS.length-1)%CHORDS.length];
    const tones=[...ch.map(f=>f*2),...ch.map(f=>f*4)];
    const seq=[0,2,4,1,3,5,4,2];
    for(let i=0;i<4;i++){
      arpNote(t+i*SPB/4, tones[seq[arpStep%seq.length]%tones.length]);
      arpStep++;
    }
    if(Math.random()<0.05) anvil(t,1400+Math.random()*800,0.02,2.5);
    nextBeat+=SPB; beatN++;
  }
}
function sfxHit(crit){
  if(!AC||!musicOn) return;
  const t=AC.currentTime;
  const o=AC.createOscillator(),g=AC.createGain();
  o.type="square"; o.frequency.setValueAtTime(crit?220:140,t);
  o.frequency.exponentialRampToValueAtTime(60,t+0.05);
  g.gain.setValueAtTime(crit?0.09:0.045,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.06);
  o.connect(g); g.connect(MG); o.start(t); o.stop(t+0.07);
  if(crit) anvil(t,900,0.05,0.3);
}
function sfxBreak(){
  if(!AC||!musicOn) return;
  const t=AC.currentTime;
  thump(t,0.3); anvil(t+0.05,520,0.07,0.4);
}
function sfxGear(){
  if(!AC||!musicOn) return;
  const t=AC.currentTime;
  anvil(t,392,0.08,0.35); anvil(t+0.08,587,0.08,0.4);
}
function sfxPurr(){
  if(!AC||!musicOn) return;
  const t=AC.currentTime;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type="triangle";
  o.frequency.setValueAtTime(52, t);
  o.frequency.linearRampToValueAtTime(64, t+0.18);
  o.frequency.linearRampToValueAtTime(55, t+0.36);
  o.frequency.linearRampToValueAtTime(61, t+0.55);
  o.frequency.linearRampToValueAtTime(50, t+0.85);
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.045, t+0.1);
  g.gain.linearRampToValueAtTime(0.028, t+0.55);
  g.gain.exponentialRampToValueAtTime(0.001, t+0.95);
  o.connect(g); g.connect(MG); o.start(t); o.stop(t+1);
}
function jingleFind(){ if(!AC||!musicOn) return; const t=AC.currentTime;
  [392,523.25,659.25].forEach((f,i)=>anvil(t+i*0.09,f,0.12,0.6)); }
function jingleSet(){ if(!AC||!musicOn) return; const t=AC.currentTime;
  [293.66,392,440,587.33].forEach((f,i)=>{ horn(t+i*0.16,f,0.55,0.14); anvil(t+i*0.16,f*2,0.05,0.4); }); }
function jingleKO(){ if(!AC||!musicOn) return; const t=AC.currentTime;
  horn(t,146.83,1.2,0.12); horn(t+0.5,138.59,1.8,0.12); }
function toggleMusic(){
  musicOn=!musicOn;
  try{ localStorage.setItem("oredeep_music",musicOn?"on":"off"); }catch(e){}
  if(musicOn&&!AC) audioStart();
  if(MG) MG.gain.value=musicOn?0.22:0;
  const sm=$("setMusic"), us=$("uiSetMusic");
  const label=musicOn?"🔊 on":"🔇 off";
  if(sm) sm.textContent=label;
  if(us) us.textContent=label;
}
document.addEventListener("pointerdown",()=>{
  if(musicOn){ audioStart(); if(AC&&AC.state==="suspended") AC.resume(); }
});

async function buildShareCard(){
  const c=document.createElement("canvas");
  if(!c.getContext) return null;
  c.width=560; c.height=720;
  const x=c.getContext("2d");
  x.imageSmoothingEnabled=false;
  x.fillStyle="#12151d"; x.fillRect(0,0,560,720);
  x.strokeStyle="#e8b93c"; x.lineWidth=6; x.strokeRect(12,12,536,696);
  try{ await document.fonts.load("22px 'Press Start 2P'"); }catch(e){}
  const F=s=>s+"px 'Press Start 2P', monospace";
  x.fillStyle="#e8b93c"; x.font=F(26); x.textAlign="center";
  x.fillText("MOUNTAIN KING",280,64);
  x.fillStyle="#8a93a3"; x.font=F(11);
  x.fillText("dig deeper. then deeper.",280,92);

  const layers=["mlPack","mlBase","mlRobe","mlBoots","mlGlove","mlBeard","mlHelm"];
  for(const id of layers){
    const el=$(id);
    if(el.src && el.style.display!=="none"){
      try{ x.drawImage(el,150,130,26*10,30*10); }catch(e){}
    }
  }
  try{ x.drawImage($("pickHand"),330,90,22*7,22*7); }catch(e){}

  const best=S.best||{r:0,name:"Orphan Corner"};
  const oreImg=new Image();
  await new Promise(res=>{ oreImg.onload=res; oreImg.onerror=res; oreImg.src=ORE_ICONS[best.r]; });
  try{ x.drawImage(oreImg,60,470,112,112); }catch(e){}
  x.fillStyle=RAR_HEX[best.r]; x.font=F(13); x.textAlign="left";
  x.fillText(RAR_NAMES[best.r].toUpperCase(),190,505);
  x.fillStyle="#e8e6df"; x.font=F(12);
  const nm=best.name.length>22?best.name.slice(0,21)+"…":best.name;
  x.fillText(nm,190,535);
  x.fillStyle="#5aa7e8"; x.font=F(12);
  x.fillText("DEPTH: "+fmt(S.stageIdx*3)+" m",190,572);
  if(S.streak&&S.streak.n>0){
    x.fillStyle="#ff9d5c";
    x.fillText("STREAK: "+S.streak.n+" d",190,600);
  }
  x.fillStyle="#8a93a3"; x.font=F(10); x.textAlign="center";
  x.fillText("🧔 "+beardWisdom().title,280,660);
  return c;
}
async function shareCard(){
  Platform.logEvent("share_card",{best:S.best?S.best.r:-1});
  try{ if(rock&&rock.isDailyShared) shareDailyVein(); }catch(e){}
  const c=await buildShareCard();
  if(!c) return;
  c.toBlob(b=>{
    if(!b) return;
    const f=new File([b],"diggy-dwarf.png",{type:"image/png"});
    if(navigator.share && navigator.canShare && navigator.canShare({files:[f]})){
      navigator.share({files:[f],title:"Mountain King",text:"My dwarf dug "+fmt(S.stageIdx*3)+" m deep. Mountain King!"}).catch(()=>{});
    } else {
      const a=document.createElement("a");
      a.href=URL.createObjectURL(b); a.download="diggy-dwarf.png"; a.click();
    }
  },"image/png");
}

const STREAK_MARKS={3:2,7:3,14:5,30:10};
function todayStr(){ const d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function yesterdayStr(){ const d=new Date(Date.now()-864e5); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function checkStreak(){
  if(!S.streak) S.streak={n:0,last:""};
  const t=todayStr();
  if(S.streak.last===t) return;
  S.streak.n = (S.streak.last===yesterdayStr()) ? S.streak.n+1 : 1;
  S.streak.last=t;
  const mult=STREAK_MARKS[S.streak.n]||1;
  const reward=Math.round(veinReward()*25*mult);
  S.gold+=reward;
  showToast("🔥","Day "+S.streak.n+" streak","",
    (mult>1?"Reward ×"+mult:"Good to see you back."),
    "+"+fmt(reward)+" 🪙", true);
  sayQuip(S.streak.n>=7?"Streak "+S.streak.n+" days! The beard approves.":"Back to the dig.",4);
  Platform.logEvent("streak",{n:S.streak.n}); addBeardXP(25);
  try{ if((S.streak.n|0)>=7) unlockPlayAchievement("streak_7"); }catch(e){}
  save();
}

const OFFLINE_CAP_H=BALANCE.idle.capSec/3600;
let offlinePending=0, offlineBagsPending=0;
function checkOffline(){
  if(!featUnlocked("auto")) return;
  if(!S.lastSeen) return;
  const sec=Math.min(OFFLINE_CAP_H*3600, (Date.now()-S.lastSeen)/1000);
  if(sec<120) return;
  offlinePending=Math.floor(idlePerSec()*sec);
  const bagSec=(BALANCE.bags&&BALANCE.bags.offlineSecPerBag)|0||6;
  offlineBagsPending=Math.min(BALANCE.bags.cap, Math.floor(sec/bagSec));
  if(offlinePending<1 && offlineBagsPending<1) return;
  const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60);
  $("offTime").textContent="You were gone. "+(h?h+" h ":"")+m+" min"+(sec>=OFFLINE_CAP_H*3600?" (Cap "+OFFLINE_CAP_H+" (c)":"");
  $("offGold").textContent="+"+fmt(offlinePending)+" 🪙"+(offlineBagsPending?(" · +"+fmt(offlineBagsPending)+" 🎒"):"");
  $("offOverlay").style.display="flex";
  Platform.logEvent("offline_return",{sec:Math.round(sec)});
}
function claimOffline(mult){
  const grant=()=>{ S.gold+=offlinePending*mult; grantBags(offlineBagsPending*mult);
    offlinePending=0; offlineBagsPending=0;
    $("offOverlay").style.display="none"; save(); render(); };
  if(mult>1) Platform.showRewarded(ok=>{ if(ok) grant(); }, "offline_x2");
  else grant();
}

function metaOpen(title,sub,html){ $("metaTitle").textContent=title; $("metaSub").innerHTML=sub;
  $("metaBody").innerHTML=html; $("metaModal").style.display="flex"; }

const SPECIAL_DEFS=[
  {id:"e", n:"Fortitude", letter:"K", stats:["energy","tough"], tip:"Energy and defense"},
  {id:"i", n:"Reason", letter:"R", stats:[], tip:"More skill points per level"},
  {id:"a", n:"Agility", letter:"A", stats:["spd"], tip:"Improves attack speed"},
  {id:"s", n:"Strength", letter:"S", stats:["atk"], tip:"Improves attack damage"},
  {id:"c", n:"Aura", letter:"A", stats:["stone"], tip:"Improves ore yield"},
  {id:"l", n:"Vigilance", letter:"V", stats:["luck"], tip:"Improves luck"},
  {id:"p", n:"Analysis", letter:"A", stats:["mining","crit"], tip:"Improves mining and critical hits"}
];
const KRASAVA_TITLE="K.R.A.S.A.V.A.";
function ensureSpecial(){
  const B=BALANCE.special||{};
  const start=B.start||5;
  if(!S.special){ S.special={}; SPECIAL_DEFS.forEach(d=>{ S.special[d.id]=start; }); }
  SPECIAL_DEFS.forEach(d=>{ if(S.special[d.id]==null) S.special[d.id]=start; });
  if(S.specialPool==null) S.specialPool=B.pool||5;
  if(S.skillPts==null) S.skillPts=0;
  if(S.minerLv==null) S.minerLv=0;
  if(S.veinsBroken==null) S.veinsBroken=0;
  if(!S.skillTags) S.skillTags=[];
  if(!S.trained) S.trained={};
  if(!Array.isArray(S.perks)) S.perks=[];
  if(S.perkPicks==null) S.perkPicks=0;
  if(!Array.isArray(S.traits)) S.traits=[];
  if(S.traitPicks==null) S.traitPicks=0;
  if(S.perkBought==null) S.perkBought=0;
  if(S.traitBought==null) S.traitBought=0;
}
function specialAttr(id){ ensureSpecial(); return S.special[id]|0; }
function specialPtsPerLevel(){
  ensureSpecial();
  const B=BALANCE.special||{};
  const i=Math.max(0, specialAttr("i")-(B.start||5));
  let pts=(B.ptsBase||5)+i*(B.ptsPerInt||1);
  if(typeof hasTrait==="function"){
    for(const id of (S.traits||[])){
      const t=traitDef(id); if(!t||t.ptsMult==null) continue;
      pts=Math.max(1, Math.floor(pts*t.ptsMult));
    }
  }
  return pts;
}
function minerLevelTarget(){
  const B=BALANCE.special||{};
  const per=B.veinsPerLv||35, max=B.maxLv||40;
  return Math.min(max, Math.floor((S.veinsBroken||0)/per));
}
function checkMinerLevelUp(announce){
  ensureSpecial();
  let gained=0, pts=0, perkGain=0;
  const every=(BALANCE.perks&&BALANCE.perks.everyLv)||3;
  while((S.minerLv||0)<minerLevelTarget()){
    S.minerLv=(S.minerLv||0)+1;
    const add=specialPtsPerLevel();
    S.skillPts=(S.skillPts||0)+add;
    gained++; pts+=add;
    if(S.minerLv%every===0){ S.perkPicks=(S.perkPicks||0)+1; perkGain++; }
  }
  if(gained && announce){
    const sub=perkGain?("+"+pts+" - Okay. · perk ×"+perkGain):("+"+pts+" - Okay. skill · Mind "+specialAttr("i"));
    showToast("📈","MINER LEVEL","", "Lv."+S.minerLv, sub, true);
    sayQuip(perkGain?"Level — and Mountain whispers new perkYou choose.":"More. vein Behind your back, your hands remember. — I’m thinking of my head counting my glasses.",4);
    Platform.logEvent("miner_level",{lv:S.minerLv,pts:S.skillPts,perk:perkGain});
  }
  return gained;
}
function specialBonusPct(statId){
  if(typeof BALANCE==="undefined"||!BALANCE.special) return 0;
  ensureSpecial();
  const B=BALANCE.special, start=B.start||5;
  let pct=0;
  for(const d of SPECIAL_DEFS){
    if(!d.stats||d.stats.indexOf(statId)<0) continue;
    const over=Math.max(0, specialAttr(d.id)-start);
    pct+=over*(B.attrPct||1.2);
  }
  return Math.min(B.attrPctCap||12, pct);
}

const PERK_DEFS=[
  {id:"aware",    n:"Rock Sense",     ico:"🔭", stats:["mining"],
    desc:"You see weaknesses in veinIt’s a little bit of a bandage. — Less blind blows."},
  {id:"hth",      n:"A Rough Shot",     ico:"💪", stats:["atk"],
    desc:"pickaxe It’s harder to get down. Every swing chewing more. rock."},
  {id:"cautious", n:"Careful dig", ico:"🛡", stats:["tough"],
    desc:"You’re not getting under the bridge. cave-in The defense keeps it longer. — Less than the fines from fatigue."},
  {id:"heal",     n:"Quick breathing",  ico:"❤", stats:["regen"],
    desc:"Light miners are recovering faster. dig."},
  {id:"sequence", n:"Early strike",      ico:"⚡", stats:["spd"],
    desc:"You hit first, the rate of impact is higher. — vein It’s getting worse before it can answer."},
  {id:"night",    n:"The lamp in the eyes",  ico:"🕯", stats:["luck"],
    desc:"In the middle of darkness mine You find what others miss, lucky find."},
  {id:"presence", n:"Tendering trader",  ico:"💰", stats:["stone"],
    desc:"Even the stone listens to you, more gold on each one. vein."},
  {id:"lifegiver",n:"Living",          ico:"🫀", stats:["energy"],
    desc:"You’re standing by more than you can. digwhile the others are already in the tavern."},
  {id:"crits",    n:"Crit Mark",    ico:"🎯", stats:["crit"],
    desc:"You’re in a crack, the chance of a critical blow is growing."},
  {id:"fortune",  n:"The lucky seeker.",   ico:"🍀", stats:["luck"],
    desc:"Mountain Sometimes smiles, you run into fatters more often. vein And a rare lute."},
  {id:"stam",     n:"Inflexible",      ico:"🫁", stats:["stamina"],
    desc:"The Combo doesn’t break off so easily. dig."},
  {id:"pockets",  n:"Deep pockets", ico:"🎒", stats:["stone","luck"],
    desc:"There’s always a handful of more in your pockets, a little more gold and luck on the drape."}
];
const TRAIT_DEFS=[
  {id:"gifted", n:"A gifted man.", ico:"✨",
    desc:"Mind and hands are natural. +1 ♪ to all the devils of CRASAW ♪ ♪ at once, but the miner levels ♪ 20% less than points skill.",
    specialAdd:1, ptsMult:0.8},
  {id:"small", n:"Indigenous", ico:"🪨",
    desc:"The little, the strong, the vaults love you.+supports) but pickaxe Slowly (−The time is now at which the number of persons in the country is increasing.",
    statsPlus:["tough"], statsMinus:["spd"]},
  {id:"bruiser", n:"Power", ico:"💪",
    desc:"Force strikes through attack: more attack, less speed — vein I think I’ll be scared in time.",
    statsPlus:["atk"], statsMinus:["spd"]},
  {id:"finesse", n:"Precise", ico:"🎯",
    desc:"You hit a crack, not a spirit, and it’s more common, but every blow is easier. (−The attack).",
    statsPlus:["crit"], statsMinus:["atk"]},
  {id:"kamikaze", n:"Crazy.", ico:"💥",
    desc:"What protection, running into the dig (+The vendetta is a vendetta. (−Protection).",
    statsPlus:["spd"], statsMinus:["tough"]},
  {id:"greed", n:"Greedy.", ico:"🪙",
    desc:"trader Crystal of happiness+Greedy. Mountain He’s upset, luck is falling.",
    statsPlus:["stone"], statsMinus:["luck"]},
  {id:"jinxed", n:"Mountain Ball", ico:"🍀",
    desc:"The stone jumps into its pocket.+A little bit of the bandage is going to go blind. (−You find everything but vein.",
    statsPlus:["luck"], statsMinus:["mining"]},
  {id:"aleblood", n:"beer Blood", ico:"🍺",
    desc:"The stock of power is like a barrel.+After the third mug the gut of the seams is floating. (−I’m not sure.",
    statsPlus:["energy"], statsMinus:["mining"]},
  {id:"sober", n:"Truck, tremor", ico:"🧊",
    desc:"Water instead of beer, you see every crack.+I’m tired of you, but you’re tired of being mortal. (−Energy).",
    statsPlus:["mining"], statsMinus:["energy"]},
  {id:"goodnat", n:"Good", ico:"🤝",
    desc:"Even rock He says hello to you.+Greedy trader) Beating hard — Not friendly. (−The attack).",
    statsPlus:["stone"], statsMinus:["atk"]},
  {id:"heavy", n:"Heavy arm", ico:"⛏",
    desc:"The blow is jamming the echo. — I’m not sure if it’s a hole.",
    statsPlus:["atk"], statsMinus:["crit"]},
  {id:"lantern", n:"Eyes of the lantern", ico:"🕯",
    desc:"In the dark, you see vein (+A gut, +You’re racing in the sun, the pace is falling.",
    statsPlus:["mining","crit"], statsMinus:["spd"]},
  {id:"bearded", n:"beardYou’re off the peel.", ico:"🧔",
    desc:"beard He’s carrying luck.+And the clan’s respect, but it’s confused. pickaxe (−The time is now at which the number of persons in the country is increasing.",
    statsPlus:["luck"], statsMinus:["spd"]},
  {id:"winded", n:"Short Breath", ico:"😮‍💨",
    desc:"Breath is weaker, but you beat worse.+The attack is still in the air.",
    statsPlus:["atk"], statsMinus:["stamina"]}
];
function hasPerk(id){ ensureSpecial(); return (S.perks||[]).indexOf(id)>=0; }
function hasTrait(id){ ensureSpecial(); return (S.traits||[]).indexOf(id)>=0; }
function perkDef(id){ return PERK_DEFS.find(p=>p.id===id); }
function traitDef(id){ return TRAIT_DEFS.find(t=>t.id===id); }
function perkBonusPct(statId){
  if(typeof BALANCE==="undefined"||!BALANCE.perks) return 0;
  ensureSpecial();
  const B=BALANCE.perks, pct=B.pct||2, cap=B.pctCap||16;
  let n=0;
  for(const id of (S.perks||[])){
    const d=perkDef(id); if(!d||!d.stats) continue;
    if(d.stats.indexOf(statId)>=0) n++;
  }
  for(const id of (S.traits||[])){
    const t=traitDef(id); if(!t) continue;
    if(t.statsPlus&&t.statsPlus.indexOf(statId)>=0) n+=1.5;
    if(t.statsMinus&&t.statsMinus.indexOf(statId)>=0) n-=1.5;
  }
  return Math.max(-cap, Math.min(cap, n*pct));
}
function availablePerks(){
  ensureSpecial();
  const max=(BALANCE.perks&&BALANCE.perks.maxOwned)!=null
    ? BALANCE.perks.maxOwned : PERK_DEFS.length;
  if((S.perks||[]).length>=max) return [];
  return PERK_DEFS.filter(p=>!hasPerk(p.id));
}
function canPickPerk(){ ensureSpecial(); return (S.perkPicks||0)>0 && availablePerks().length>0; }
function perkPickOpen(){ const m=$("perkModal"); return !!(m&&m.style.display==="flex"); }
function openPerkPick(){
  ensureSpecial(); checkMinerLevelUp(false);
  if(!canPickPerk()){
    showToast("📜","There’s nothing to choose.","",(S.perkPicks||0)<1?"perk every "+((BALANCE.perks&&BALANCE.perks.everyLv)||3)+" Miner":"All perk From the pool already taken");
    window._charTab="perks"; openCharSheet({tab:"perks"}); return false;
  }
  window._perkSel=(availablePerks()[0]||{}).id||null;
  renderPerkPick();
  const m=$("perkModal"); if(m) m.style.display="flex";
  return true;
}
function closePerkPick(){ const m=$("perkModal"); if(m) m.style.display="none"; }
function selectPerkPreview(id){
  if(!perkDef(id)||hasPerk(id)) return;
  window._perkSel=id; renderPerkPick();
}
function renderPerkPick(){
  const list=$("perkList"), det=$("perkDetail"); if(!list||!det) return;
  const avail=availablePerks();
  const sel=window._perkSel && avail.some(p=>p.id===window._perkSel) ? window._perkSel : (avail[0]&&avail[0].id);
  window._perkSel=sel;
  list.innerHTML=avail.map(p=>{
    const on=p.id===sel?" on":"";
    return `<div class="foPerkItem${on}" onclick="selectPerkPreview('${p.id}')">${esc(p.n)}</div>`;
  }).join("")||`<div class="foPerkItem have">Empty</div>`;
  const p=perkDef(sel);
  if(!p){ det.innerHTML=`<div class="pd">No available perkowl.</div>`; return; }
  const eff=(p.stats||[]).map(s=>s.toUpperCase()).join(", ");
  const pct=(BALANCE.perks&&BALANCE.perks.pct)||2;
  det.innerHTML=`<div class="pt">${esc(p.n)}</div>
    <div class="pd">${esc(p.desc)}</div>
    <div class="pi">${p.ico||"📜"}</div>
    <div class="pe">Effect: +${pct}% to ${eff} (Total cap perk(c)</div>`;
  const done=$("perkDoneBtn"); if(done) done.disabled=!sel;
}
function confirmPerkPick(){
  ensureSpecial();
  const id=window._perkSel, p=perkDef(id);
  if(!p||!canPickPerk()||hasPerk(id)){ showToast("📜","You can’t.","","Choose another one. perk"); return false; }
  S.perkPicks=(S.perkPicks||0)-1;
  S.perks.push(id);
  if(p.id==="comprehend"){  }
  Platform.logEvent("perk_pick",{id, left:S.perkPicks});
  showToast(p.ico||"📜","PERK!", "", p.n, (p.stats||[]).map(s=>s.toUpperCase()).join(" · "), true);
  sayQuip("A new habit has grown into bones. Mountain Noodles.",3);
  sfxGear(); save(); closePerkPick();
  window._charTab="perks";
  if(_skillsShellTab!=null) openSkills("perks");
  else if(charSheetOpen()) renderCharSheet();
  else openSkills("perks");
  if((S.perkPicks||0)>0 && availablePerks().length) setTimeout(()=>openPerkPick(), 280);
  return true;
}
function cancelPerkPick(){
  closePerkPick();
  if(_skillsShellTab!=null) openSkills(_skillsShellTab==="train"||_skillsShellTab==="cards"?_skillsShellTab:"perks");
  else if(charSheetOpen()){ window._charTab="perks"; renderCharSheet(); }
}

function dropPerk(id){
  ensureSpecial();
  if(!hasPerk(id)) return false;
  const p=perkDef(id);
  S.perks=(S.perks||[]).filter(x=>x!==id);
  S.perkPicks=(S.perkPicks||0)+1;
  Platform.logEvent("perk_drop",{id, left:S.perkPicks});
  showToast(p&&p.ico||"📜","perk withdrawn","",p?p.n:id,"choice +1 · Take another one.");
  save();
  window._charTab="perks"; refreshSpecialUi();
  return true;
}
function traitMax(){
  const m=BALANCE.traits&&BALANCE.traits.maxOwned;
  return m!=null?m:TRAIT_DEFS.length;
}
function _pickBuyCost(kind, pay){
  const B=kind==="perk"?(BALANCE.perks||{}):(BALANCE.traits||{});
  const bought=kind==="perk"?(S.perkBought|0):(S.traitBought|0);
  if(pay==="pts"){
    const base=B.buyPtsBase!=null?B.buyPtsBase:(kind==="perk"?10:6);
    const g=B.buyPtsG!=null?B.buyPtsG:1.3;
    return Math.max(1, Math.round(base*Math.pow(g, bought)));
  }
  const base=B.buyGoldBase!=null?B.buyGoldBase:(kind==="perk"?8000:5000);
  const g=B.buyGoldG!=null?B.buyGoldG:1.5;
  const scaled=Math.round(base*Math.pow(g, bought));
  const vein=typeof veinReward==="function"?veinReward():base;
  return Math.max(scaled, Math.round(vein*4*Math.pow(1.15, Math.min(20, bought))));
}
function perkPickCostGold(){ ensureSpecial(); return _pickBuyCost("perk","gold"); }
function perkPickCostPts(){ ensureSpecial(); return _pickBuyCost("perk","pts"); }
function traitPickCostGold(){ ensureSpecial(); return _pickBuyCost("trait","gold"); }
function traitPickCostPts(){ ensureSpecial(); return _pickBuyCost("trait","pts"); }
function buyPerkPick(pay){
  ensureSpecial();
  if(!availablePerks().length){ showToast("📜","Poole empty.","","All perk already taken"); return false; }
  pay=pay==="pts"?"pts":"gold";
  const cost=pay==="pts"?perkPickCostPts():perkPickCostGold();
  if(pay==="pts"){
    if((S.skillPts||0)<cost){ showToast("📈","Not much experience","","I do. "+cost+" Okay, here we go. "+(S.skillPts||0)); return false; }
    S.skillPts-=cost;
  } else {
    if((S.gold||0)<cost){ showToast("🪙","Few gold","","I do. "+fmt(cost)+" 🪙"); return false; }
    S.gold-=cost;
  }
  S.perkBought=(S.perkBought||0)+1;
  S.perkPicks=(S.perkPicks||0)+1;
  Platform.logEvent("perk_buy",{pay,cost,left:S.perkPicks});
  showToast("📜","Point perka","","+"+(pay==="pts"?cost+" - Okay.":fmt(cost)+" 🪙"),"Elections: "+S.perkPicks);
  save(); refreshSpecialUi(); return true;
}
function buyTraitPick(pay){
  ensureSpecial();
  if((S.traits||[]).length>=traitMax()){ showToast("🧬","Damn it.","","Take one off to take another."); return false; }
  pay=pay==="pts"?"pts":"gold";
  const cost=pay==="pts"?traitPickCostPts():traitPickCostGold();
  if(pay==="pts"){
    if((S.skillPts||0)<cost){ showToast("📈","Not much experience","","I do. "+cost+" Okay, here we go. "+(S.skillPts||0)); return false; }
    S.skillPts-=cost;
  } else {
    if((S.gold||0)<cost){ showToast("🪙","Few gold","","I do. "+fmt(cost)+" 🪙"); return false; }
    S.gold-=cost;
  }
  S.traitBought=(S.traitBought||0)+1;
  S.traitPicks=(S.traitPicks||0)+1;
  Platform.logEvent("trait_buy",{pay,cost,left:S.traitPicks});
  showToast("🧬","Point of the line","","+"+(pay==="pts"?cost+" - Okay.":fmt(cost)+" 🪙"),"Elections: "+S.traitPicks);
  save(); refreshSpecialUi(); return true;
}
function canPickTrait(id){
  ensureSpecial();
  if(hasTrait(id)) return false;
  if((S.traits||[]).length>=traitMax()) return false;
  if((S.traitPicks||0)<1) return false;
  return !!traitDef(id);
}
function pickTrait(id){
  ensureSpecial();
  const t=traitDef(id); if(!t||!canPickTrait(id)) return false;
  S.traitPicks=(S.traitPicks||0)-1;
  S.traits.push(id);
  if(t.specialAdd){
    SPECIAL_DEFS.forEach(d=>{ S.special[d.id]=Math.min((BALANCE.special.attrMax||10), specialAttr(d.id)+t.specialAdd); });
  }
  Platform.logEvent("trait_pick",{id,left:S.traitPicks}); save();
  showToast(t.ico||"✨","DAMN IT.","",t.n);
  window._charTab="perks"; refreshSpecialUi();
  return true;
}

function unpickTrait(id){
  ensureSpecial();
  if(!hasTrait(id)) return false;
  const t=traitDef(id);
  S.traits=(S.traits||[]).filter(x=>x!==id);
  S.traitPicks=(S.traitPicks||0)+1;
  if(t&&t.specialAdd){
    const floor=BALANCE.special.start||5;
    SPECIAL_DEFS.forEach(d=>{
      S.special[d.id]=Math.max(floor, specialAttr(d.id)-t.specialAdd);
    });
  }
  Platform.logEvent("trait_drop",{id,left:S.traitPicks}); save();
  showToast(t&&t.ico||"✨","Damn it.","",t?t.n:id,"Point returned");
  window._charTab="perks"; refreshSpecialUi();
  return true;
}
function isSkillTagged(id){ ensureSpecial(); return (S.skillTags||[]).indexOf(id)>=0; }
function trainCost(id){
  const B=BALANCE.special||{};
  return isSkillTagged(id)?(B.tagCost||1):(B.untagCost||2);
}
function canTagSkill(id){
  ensureSpecial();
  if(!SKILL_DEFS.some(s=>s.id===id)) return false;
  if(isSkillTagged(id)) return false;
  const slots=BALANCE.special.tagSlots!=null?BALANCE.special.tagSlots:SKILL_DEFS.length;
  return (S.skillTags||[]).length<slots;
}
function charSheetOpen(){
  const m=$("charModal"); return !!(m&&m.style.display==="flex");
}
function refreshSpecialUi(tab){
  if(charSheetOpen()) renderCharSheet();
  else if(_skillsShellTab==="sheet"||_skillsShellTab==="perks"||_skillsShellTab==="cards"||_skillsShellTab==="list")
    openSkills(_skillsShellTab);
}
function tagSkill(id){
  ensureSpecial();
  if(!canTagSkill(id)){ showToast("🏷","Cannot be noted","","Slots already marked or not","max "+(BALANCE.special.tagSlots||SKILL_DEFS.length)); return false; }
  S.skillTags.push(id);
  Platform.logEvent("skill_tag",{id}); save();
  if(typeof window._charFocus!=="undefined") window._charFocus={kind:"skill",id};
  refreshSpecialUi("train");
  return true;
}
function untagSkill(id){
  ensureSpecial();
  S.skillTags=(S.skillTags||[]).filter(x=>x!==id);
  save(); refreshSpecialUi("train");
}
function toggleSkillTag(id){
  if(isSkillTagged(id)) untagSkill(id); else tagSkill(id);
}
function spendSpecial(id){
  ensureSpecial();
  const d=SPECIAL_DEFS.find(x=>x.id===id); if(!d) return false;
  const max=BALANCE.special.attrMax||10;
  if((S.specialPool||0)<1){ showToast("🧬","No glasses","","Grading with rank beard"); return false; }
  if(specialAttr(id)>=max){ showToast("🧬","Ceiling","","Max. "+max+" · "+d.n); return false; }
  S.specialPool--; S.special[id]=specialAttr(id)+1;
  Platform.logEvent("special_up",{id,v:S.special[id]});
  showToast("🧬",d.letter+" "+d.n,"","="+S.special[id], d.tip);
  window._charFocus={kind:"special",id};
  save(); refreshSpecialUi("special");
  return true;
}

function refundSpecial(id){
  ensureSpecial();
  const d=SPECIAL_DEFS.find(x=>x.id===id); if(!d) return false;
  const floor=BALANCE.special.start||5;
  if(specialAttr(id)<=floor){
    showToast("🧬","Already base","",d.n,"below "+floor+" No, you can’t.");
    return false;
  }
  S.special[id]=specialAttr(id)-1;
  S.specialPool=(S.specialPool||0)+1;
  Platform.logEvent("special_refund",{id,v:S.special[id]});
  showToast("🧬",d.letter+" "+d.n,"","="+S.special[id],"Point back in the pool.");
  window._charFocus={kind:"special",id};
  save(); refreshSpecialUi("special");
  return true;
}
function resetSpecial(){
  ensureSpecial();
  const floor=BALANCE.special.start||5;
  let back=0;
  SPECIAL_DEFS.forEach(d=>{
    const v=specialAttr(d.id);
    if(v>floor){ back+=v-floor; S.special[d.id]=floor; }
  });
  if(!back){ showToast("🧬","Nothing to throw away.","","All the features are on the start."); return false; }
  S.specialPool=(S.specialPool||0)+back;
  Platform.logEvent("special_reset",{back});
  showToast("🧬","CRASACHA DONE","","+"+back+" Point in pool");
  save(); refreshSpecialUi("special");
  return true;
}
function canTrainSkill(id){
  ensureSpecial();
  const sd=SKILL_DEFS.find(s=>s.id===id); if(!sd) return false;
  const cap=BALANCE.special.trainCap||15;
  if(((S.trained||{})[id]||0)>=cap) return false;

  return (S.skillPts||0)>=trainCost(id);
}
function trainSkill(id){
  ensureSpecial();
  const sd=SKILL_DEFS.find(s=>s.id===id); if(!sd) return false;
  const cost=trainCost(id);
  if(!canTrainSkill(id)){
    const tr=((S.trained||{})[id]||0), cap=BALANCE.special.trainCap||15;
    if(tr>=cap) showToast("🔒","Training ceiling","",sd.n,"Max training. "+cap);
    else if((S.skillPts||0)<cost) showToast("📈","Few points","","I do. "+cost+", have "+(S.skillPts||0),
      isSkillTagged(id)?"tag: cheaper":"Mark it with tag. — cheaper");
    else showToast("🔒","You can’t.","",sd.n);
    return false;
  }
  S.skillPts-=cost;
  S.trained[id]=((S.trained||{})[id]||0)+1;
  dailyProgress("skill",1);
  Platform.logEvent("skill_train",{id,lv:S.trained[id],tag:isSkillTagged(id)});
  sfxGear();
  const stCap=STAT_CAPS[sd.stat];
  const soft=stCap!=null && stat(sd.stat)>=stCap-1e-9;
  showToast("📈","Training","r"+sd.r, sd.n+" · I’m a coach."+S.trained[id],
    "−"+cost+" - Okay."+(isSkillTagged(id)?" · tag":"")+(soft?" · ♪ The statue on the drop ♪":""));
  window._charFocus={kind:"skill",id};
  save(); refreshSpecialUi("train");
  return true;
}
function foGrade(v){
  const g=["","Bad","Weak","Not so good.","Medium","Okay.","Great.","Great","Hero","Legend","Myth"];
  return g[Math.max(1,Math.min(10,v|0))]||"—";
}
function skillSheetPct(id){
  const d=SKILL_DEFS.find(s=>s.id===id); if(!d) return 0;
  const card=(typeof skillLv==="function"?skillLv(id):0)|0;
  const tr=(S.trained||{})[id]|0;
  const tag=isSkillTagged(id)?12:0;
  return Math.min(99, 18 + card*9 + tr*4 + tag);
}
function foStatTxt(id){
  const pct=id==="crit"||id==="luck"||id==="mining";
  const v=stat(id);
  return pct?(Math.round(v)+"%"):fmt(v);
}
const FO_SPECIAL_INFO={
  e:{ico:"🛡", txt:"The miner’s fortress, which affects energy and protection, you’re standing by longer. dig, less fatigue fines. supports mine (browns) — Separate: slip on ⚡."},
  i:{ico:"🧠", txt:"The mind of the miners, every level of the miner gives more points. skill♪ Roll the mind ♪ — learn faster."},
  a:{ico:"⚡", txt:"Athletics digI’m not sure. — How many times pickaxe He’s knocking in a second."},
  s:{ico:"💪", txt:"Hand strength and pickaxe. Impact on attack: above force — harder to hit. veinI. Force ≠ attack: attack — The ultimate damage, the power grows."},
  c:{ico:"💰", txt:"Aura’s at the traderI’m not sure. — more gold for vein."},
  l:{ico:"🍀", txt:"Luck in dig- It’s a good thing. — A chance to find stones and fatty ones vein."},
  p:{ico:"👁", txt:"The analysis of the seams, it affects the gut and the chopping. — See where the stone lies before the others."}
};
const FO_SKILL_ICO={crit_up:"🎯",atk_up:"⛏",luck_up:"💎",stone_up:"🪙",energy_up:"💨",mining_up:"🧭",tough_up:"🪵",regen_up:"❤",stam_up:"🫁"};

const FO_SKILL_INFO={
  crit_up:"You hit the crack, it’s the crack, it’s the screaming.",
  atk_up:"Attack dig. pickaxe It’s getting heavier. — vein I’m sure he’s got a hint of the first time.",
  luck_up:"Smell on the rocks, nose knows before eyes, luck is growing.",
  stone_up:"Greed. trader She cries, you nod, greed grows. — Gold for vein.",
  energy_up:"Second breath. When the lungs say “all“, the porch answers “one more blow.“ The energy grows.",
  mining_up:"Seam Sense. You hear where the stone lies — Sense grows, chance of a double hit.",
  tough_up:"Oak Defense. The vaults hold because you’re oak too — Defense grows.",
  regen_up:"Second heart, first one knocks on veinsecond — It’s a tavern, it’s growing regen.",
  stam_up:"The Combo doesn’t stop sneeze, the breathing grows."
};
function charFocus(kind,id){
  window._charFocus={kind,id};
  if(_skillsShellTab==="sheet"||_skillsShellTab==="perks"||_skillsShellTab==="list") openSkills(_skillsShellTab);
  else renderCharSheet();
}
function closeCharSheet(){
  const m=$("charModal"); if(m) m.style.display="none";
  closePerkPick();
  try{ if(typeof syncBottomNav==="function") syncBottomNav(); }catch(e){}
}
function closeSkillsShell(){
  _skillsShellTab=null;
  const b=$("uiBody"); if(b&&b.classList) b.classList.remove("foLock");
  closeCharSheet();
  try{ if(typeof UIS!=="undefined") UIS.close(); }catch(e){}
  const meta=$("metaModal"); if(meta) meta.style.display="none";
}
function openCharSheet(focus){
  ensureSpecial(); checkMinerLevelUp(false);

  if(focus&&focus.kind==="skill"){
    window._charFocus=focus;
    openSkills("list");
    return;
  }
  if(!(focus&&focus.kind)){
    openSkills((focus&&focus.tab==="perks")?"perks":"sheet");
    return;
  }
  _skillsShellTab=null;
  if(focus.tab) window._charTab=focus.tab;
  else window._charTab=(focus.kind==="perk"||focus.kind==="trait")?"perks":"stats";
  window._charFocus=focus;
  if(!window._charTab) window._charTab="stats";
  try{ if(typeof UIS!=="undefined"&&UIS.id==="panel") UIS.close(); }catch(e){}
  const meta=$("metaModal"); if(meta) meta.style.display="none";
  closePerkPick();
  renderCharSheet();
  const m=$("charModal"); if(m) m.style.display="flex";
  try{ if(typeof syncBottomNav==="function") syncBottomNav(); }catch(e){}
}
function setCharTab(tab){
  window._charTab=tab||"stats";
  if(_skillsShellTab!=null){
    openSkills(tab==="perks"?"perks":tab==="list"?"list":"sheet");
    return;
  }
  renderCharSheet();
}
function buildCharSheetHtml(inShell){
  ensureSpecial();
  const B=BALANCE.special||{}, max=B.attrMax||10;
  if(inShell) window._charTab=_skillsShellTab==="perks"?"perks":(_skillsShellTab==="list"?"list":"stats");
  const tab=window._charTab||"stats";
  const focus=window._charFocus||{kind:"special",id:"s"};
  const w=(typeof beardWisdom==="function")?beardWisdom():{title:"beard"};
  const age=1+(S.minerLv|0)+(S.prestigeLv|0);
  const eMax=Math.max(1,stat("energy")|0), eCur=Math.max(0,Math.min(eMax,(S.energy!=null?S.energy:eMax)|0));

  const tabs=inShell?"":`<div class="foTabs">
    <button type="button" class="${tab==="stats"?"on":""}" onclick="setCharTab('stats')">Articles</button>
    <button type="button" class="${tab==="list"?"on":""}" onclick="setCharTab('list')">Skils</button>
    <button type="button" class="${tab==="perks"?"on":""}" onclick="setCharTab('perks')">perk${(S.perkPicks||0)>0?(" · "+S.perkPicks):""}</button>
  </div>`;
  const doneBtn=inShell
    ?`<button type="button" class="btn btn-hard" onclick="closeSkillsShell()">DONE</button>`
    :`<button type="button" class="btn btn-hard" onclick="closeCharSheet()">DONE</button>`;

  if(tab==="perks"){
    const owned=(S.perks||[]).map(id=>{
      const p=perkDef(id); if(!p) return "";
      const on=focus.kind==="perk"&&focus.id===id?" on":"";
      return `<div class="row${on}" onclick="charFocus('perk','${id}')"><span class="ic">${p.ico}</span><span class="nm">${esc(p.n)}</span>
        <button type="button" class="btn btn-soft btn-tiny" onclick="event.stopPropagation();dropPerk('${id}')">Delete</button></div>`;
    }).join("")||`<div class="empty">It’s empty for now. perk every ${((BALANCE.perks&&BALANCE.perks.everyLv)||3)} The miner.</div>`;
    const traitRows=TRAIT_DEFS.map(t=>{
      const have=hasTrait(t.id), can=canPickTrait(t.id);
      return `<div class="row${have?" on":""}" onclick="charFocus('trait','${t.id}')">
        <span class="ic">${t.ico}</span><span class="nm">${esc(t.n)}${have?" · ✓":""}</span>
        ${have?`<button type="button" class="btn btn-soft btn-tiny" onclick="event.stopPropagation();unpickTrait('${t.id}')">Delete</button>`:""}
        ${!have&&can?`<button type="button" class="btn btn-soft btn-tiny" onclick="event.stopPropagation();pickTrait('${t.id}')">Take</button>`:""}
        ${!have&&!can&&(S.traitPicks||0)<1?`<span class="sub" style="font-size:10px">I need a point.</span>`:""}
      </div>`;
    }).join("");
    let infoIco="📜", infoTtl="perk", infoTxt="Glasses perkowl — From mine level or buy it for experience./Gold. — Only for the glasses (test or gold).";
    if(focus.kind==="perk"){
      const p=perkDef(focus.id);
      if(p){ infoIco=p.ico; infoTtl=p.n; infoTxt=p.desc+" Effect: +"+((BALANCE.perks&&BALANCE.perks.pct)||2)+"% to "+(p.stats||[]).map(s=>s.toUpperCase()).join(", ")+"."; }
    }else if(focus.kind==="trait"){
      const t=traitDef(focus.id);
      if(t){ infoIco=t.ico; infoTtl=t.n; infoTxt=t.desc; }
    }
    const perkMax=(BALANCE.perks&&BALANCE.perks.maxOwned)||PERK_DEFS.length;
    const pg=perkPickCostGold(), pp=perkPickCostPts(), tg=traitPickCostGold(), tp=traitPickCostPts();
    const perkBuy=`<div class="btnrow" style="margin-top:8px;flex-wrap:wrap;gap:6px">
      <button type="button" class="btn btn-soft" ${(S.skillPts||0)<pp?"disabled":""} onclick="buyPerkPick('pts')">📈 Point · ${pp} - Okay.</button>
      <button type="button" class="btn btn-hard" ${(S.gold||0)<pg?"disabled":""} onclick="buyPerkPick('gold')">🪙 Point · ${fmt(pg)}</button>
    </div>`;
    const traitBuy=`<div class="btnrow" style="margin-top:8px;flex-wrap:wrap;gap:6px">
      <button type="button" class="btn btn-soft" ${(S.skillPts||0)<tp?"disabled":""} onclick="buyTraitPick('pts')">📈 Point · ${tp} - Okay.</button>
      <button type="button" class="btn btn-hard" ${(S.gold||0)<tg?"disabled":""} onclick="buyTraitPick('gold')">🪙 Point · ${fmt(tg)}</button>
    </div>`;
    return tabs+
      `<div class="foPin">
        <div class="foHead">
          <div class="foCell"><span class="k">Name</span><span class="v">${esc(playerName())}</span></div>
          <div class="foCell"><span class="k">Experience</span><span class="v">${S.skillPts||0}</span></div>
          <div class="foCell"><span class="k">perk</span><span class="v">${S.perkPicks||0}</span></div>
          <div class="foCell"><span class="k">Damn it.</span><span class="v">${S.traitPicks||0}</span></div>
        </div>
        <div class="foInfo" style="margin-bottom:6px">
          <div class="ico">${infoIco}</div>
          <div><div class="ttl">${esc(infoTtl)}</div><div class="txt">${esc(infoTxt)}</div></div>
        </div>
      </div>
      <div class="foScroll">
        <div class="foPanel" style="margin-bottom:6px">
          <h4>Perks · ${(S.perks||[]).length}/${perkMax}</h4>
          <div class="foPerkOwned">${owned}</div>
          ${perkBuy}
          ${(S.perkPicks||0)>0?`<button type="button" class="btn btn-hard" style="width:100%;margin-top:8px" onclick="openPerkPick()">SELECT PERK · ${S.perkPicks}</button>`:""}
        </div>
        <div class="foPanel" style="margin-bottom:6px">
          <h4>Traits · ${(S.traits||[]).length}/${traitMax()} · points ${S.traitPicks||0}</h4>
          <div class="foPerkOwned">${traitRows}</div>
          ${traitBuy}
          <div class="sub" style="margin-top:6px;color:#8a7a60">Buy a point for experience or gold. · Take the point back. ${TRAIT_DEFS.length}.</div>
        </div>
      </div>
      <div class="foFoot">
        <button type="button" class="btn btn-soft" onclick="setCharTab('stats')">← Articles</button>
        ${doneBtn}
      </div>`;
  }

  if(tab==="list"){
    const skillFocus=focus.kind==="skill"?focus.id:(SKILL_DEFS[0]&&SKILL_DEFS[0].id);
    const skillRows=SKILL_DEFS.map(d=>{
      const pct=skillSheetPct(d.id), tagged=isSkillTagged(d.id), cost=trainCost(d.id), ok=canTrainSkill(d.id);
      const on=d.id===skillFocus?" on":"";
      return `<div class="foSkillRow${on}">
        <button type="button" class="tag${tagged?" on":""}" title="${tagged?"Remove tag":"Tag · It’s cheaper to rock."}"
          onclick="toggleSkillTag('${d.id}')"></button>
        <span class="sn" onclick="charFocus('skill','${d.id}')">${d.n}</span>
        <span class="pct" onclick="charFocus('skill','${d.id}')">${pct}%</span>
        <button type="button" class="trn${ok?"":" dim"}" title="Training −${cost}"
          onclick="trainSkill('${d.id}')">+${cost}</button>
      </div>`;
    }).join("");
    let infoIco="📜", infoTtl="Skils", infoTxt="Choose skill — There’s a clue upstairs.";
    const d=SKILL_DEFS.find(x=>x.id===skillFocus);
    if(d){
      const tr=(S.trained||{})[d.id]|0, card=(typeof skillLv==="function"?skillLv(d.id):0)|0;
      const fluff=FO_SKILL_INFO[d.id]||d.n;
      infoIco=FO_SKILL_ICO[d.id]||"📜"; infoTtl=d.n+" · "+skillSheetPct(d.id)+"%";
      infoTxt=fluff+" Card Lv."+card+" · Trained "+tr+"/"+(B.trainCap||15)+" · +"+(d.per*(B.trainMult||0.5)).toFixed(1)+" "+statLbl(d.stat)+"/workout · Tag "+(B.tagCost||1)+" · Untag "+(B.untagCost||2)+".";
    }
    return tabs+
      `<div class="foPin">
        <div class="foInfo" style="margin:0 0 6px">
          <div class="ico">${infoIco}</div>
          <div><div class="ttl">${esc(infoTtl)}</div><div class="txt">${esc(infoTxt)}</div></div>
        </div>
      </div>
      <div class="foScroll">
        <div class="foPanel" style="margin-bottom:6px">
          <h4>Skills · tags and training</h4>
          ${skillRows}
          <div class="foTagBar"><span>Tags ${(S.skillTags||[]).length}/${B.tagSlots||SKILL_DEFS.length}</span>
            <span>Glasses skill <b>${S.skillPts||0}</b></span></div>
        </div>
      </div>
      <div class="foFoot">
        ${inShell
          ?`<button type="button" class="btn btn-soft" onclick="openSkills('sheet')">← BEAUTY</button>`
          :`<button type="button" class="btn btn-soft" onclick="setCharTab('stats')">← Articles</button>`}
        ${doneBtn}
      </div>`;
  }

  const specRows=SPECIAL_DEFS.map(d=>{
    const v=specialAttr(d.id);
    const canUp=(S.specialPool||0)>0 && v<max;
    const canDown=v>(BALANCE.special.start||5);
    const on=focus.kind==="special"&&focus.id===d.id?" on":"";
    return `<div class="foSpecRow${on}">
      <span class="nm" onclick="charFocus('special','${d.id}')">${d.n}</span>
      <span class="foSpecCtrl">
        <button type="button" class="${canDown?"":"dim"}" title="Return point to pool" onclick="refundSpecial('${d.id}')">−</button>
        <span class="num">${String(v).padStart(2,"0")}</span>
        <button type="button" class="${canUp?"":"dim"}" title="Add Point" onclick="spendSpecial('${d.id}')">+</button>
      </span>
    </div>`;
  }).join("");

  const derRows=[
    [statLbl("energy"), eCur+"/"+eMax],
    [statLbl("tough"), foStatTxt("tough")],
    [statLbl("atk"), foStatTxt("atk")],
    [statLbl("spd"), foStatTxt("spd")+"/c"],
    [statLbl("mining"), foStatTxt("mining")],
    [statLbl("crit"), foStatTxt("crit")],
    [statLbl("luck"), foStatTxt("luck")],
    [statLbl("stone"), foStatTxt("stone")],
    [statLbl("regen"), foStatTxt("regen")],
    [statLbl("stamina"), foStatTxt("stamina")],
    ["Ur miner", String(S.minerLv||0)],
    ["Prestige", String(S.prestigeLv||0)]
  ].map(([a,b])=>`<div class="row"><span>${a}</span><span>${b}</span></div>`).join("");

  let infoIco="🧔", infoTtl="Dwarf", infoTxt="Pick a skill line — tips appear upstairs.";
  if(focus.kind==="special"){
    const d=SPECIAL_DEFS.find(x=>x.id===focus.id), info=FO_SPECIAL_INFO[focus.id]||{};
    if(d){ infoIco=info.ico||"🧬"; infoTtl=d.letter+". "+d.n+" · "+specialAttr(d.id);
      infoTxt=(info.txt||d.tip)+(d.stats&&d.stats.length?(" Impact: "+d.stats.map(s=>statLbl(s)).join(", ")+"."):" Impact on glasses skill To level."); }
  }

  return tabs+
    `<div class="foPin">
      <div class="foHead">
        <div class="foCell"><span class="k">Name</span><span class="v">${esc(playerName())}</span></div>
        <div class="foCell"><span class="k">Lv.</span><span class="v">${S.minerLv||0}</span></div>
        <div class="foCell"><span class="k">Internship</span><span class="v">${age}</span></div>
        <div class="foCell"><span class="k">Rank</span><span class="v">${esc(w.title||"—")}</span></div>
      </div>
      <div class="foInfo" style="margin:6px 0">
        <div class="ico">${infoIco}</div>
        <div><div class="ttl">${esc(infoTtl)}</div><div class="txt">${esc(infoTxt)}</div></div>
      </div>
    </div>
    <div class="foScroll">
      <div class="foGrid">
        <div class="foPanel">
          <h4>${KRASAVA_TITLE}</h4>
          ${specRows}
          <div class="foPoints"><span>The glasses are shit.</span><b>${S.specialPool||0}</b></div>
        </div>
        <div class="foPanel">
          <h4>Combat</h4>
          <div class="foDer">${derRows}</div>
        </div>
      </div>
    </div>
    <div class="foFoot">
      ${inShell
        ?`<button type="button" class="btn btn-soft" onclick="openSkills('list')">Skils</button>`
        :`<button type="button" class="btn btn-soft" onclick="setCharTab('list')">Skils</button>`}
      ${(S.perkPicks||0)>0?`<button type="button" class="btn btn-hard" onclick="openPerkPick()">PERK · ${S.perkPicks}</button>`:""}
      <button type="button" class="btn btn-soft" title="Drop CRASAWA in pool" onclick="resetSpecial()">↺ BEAUTY</button>
      ${doneBtn}
    </div>`;
}
function renderCharSheet(){
  const el=$("charSheet"); if(!el) return;
  const fo=el.querySelector(".foScroll");
  const keepY=fo?fo.scrollTop:0;
  el.innerHTML=buildCharSheetHtml(false);
  const fo2=el.querySelector(".foScroll");
  if(fo2) fo2.scrollTop=keepY;
}

const SKILL_DEFS=[
  {id:"crit_up",  n:"Exact blow",    stat:"crit",  per:1.5, r:1},
  {id:"atk_up",   n:"Attack dig",    stat:"atk",   per:8,   r:0},
  {id:"luck_up",  n:"Smell on the rocks.",   stat:"luck",  per:1.2, r:2},
  {id:"stone_up", n:"Greed",       stat:"stone", per:12,  r:0},
  {id:"energy_up",n:"Second breath", stat:"energy",per:15,  r:1},
  {id:"mining_up",n:"Seam Sense",   stat:"mining",per:2,   r:2},
  {id:"tough_up", n:"Dubber protection", stat:"tough", per:6,   r:3},
  {id:"regen_up", n:"Second heart",  stat:"regen", per:3,   r:2},
  {id:"stam_up",  n:"Breath",        stat:"stamina",per:6,  r:3}
];
const SKILL_RAR=["Common","Rare","Epic","Legendary"];
function skillBonus(id){
  const d=SKILL_DEFS.find(s=>s.id===id); if(!d) return 0;
  const cardLv=(S.skills&&S.skills[id])||0;
  const trainLv=(S.trained&&S.trained[id])||0;
  const tm=(BALANCE.special&&BALANCE.special.trainMult)!=null?BALANCE.special.trainMult:0.5;
  return d.per*cardLv + d.per*trainLv*tm;
}

let _skillsShellTab=null;
function skillsTabBar(tab){
  return `<div class="btnrow skillsTabs" style="margin-bottom:10px;flex-wrap:wrap">
    <button class="btn ${tab==="cards"?"btn-hard":"btn-soft"}" onclick="openSkills('cards')">Maps</button>
    <button class="btn ${tab==="list"?"btn-hard":"btn-soft"}" onclick="openSkills('list')">Skils</button>
    <button class="btn ${tab==="sheet"?"btn-hard":"btn-soft"}" onclick="openSkills('sheet')">BEAUTY</button>
    <button class="btn ${tab==="perks"?"btn-hard":"btn-soft"}" onclick="openSkills('perks')">perk${(S.perkPicks||0)>0?(" · "+S.perkPicks):""}</button>
    <button class="btn ${tab==="train"?"btn-hard":"btn-soft"}" onclick="openSkills('train')">Training${(S.wkPts||0)>0?(" · "+(S.wkPts|0)):""}</button>
  </div>`;
}
function skillsLockBody(on){
  const b=$("uiBody"); if(b&&b.classList) b.classList.toggle("foLock", !!on);
}
function openSkills(tab){
  if(!requireFeat("skills")) return;
  ensureSpecial(); checkMinerLevelUp(false);
  tab=tab||"cards";
  if(tab==="workouts") tab="train";
  if(tab==="special") tab="sheet";
  if(tab==="skills") tab="list";
  const prevTab=_skillsShellTab;
  const cm=$("charModal"); if(cm) cm.style.display="none";
  closePerkPick();
  _skillsShellTab=tab;
  const tabBar=skillsTabBar(tab);
  let body="", sub="Beer 🍺 "+Math.floor(S.protein||0)+" · 🗝 "+(S.chestKeys||0)+" · - Okay. "+(S.skillPts||0);
  if(tab==="sheet"||tab==="perks"||tab==="list"){
    window._charTab=tab==="perks"?"perks":(tab==="list"?"list":"stats");
    body=`<div class="foInPanel">${buildCharSheetHtml(true)}</div>`;
    sub=tab==="perks"
      ?"perk and features · beer 🍺 "+Math.floor(S.protein||0)
      :(tab==="list"
        ?"Skils · glasses "+(S.skillPts||0)+" · beer 🍺 "+Math.floor(S.protein||0)
        :"KRASWAH · glasses, damn it. "+(S.specialPool||0)+" · beer 🍺 "+Math.floor(S.protein||0));
  } else if(tab==="train"){
    ensureWorkouts(S);
    body=workoutsPanelHtml();
    sub="Drink it. beer → glasses → Training Path";
  } else {
    tab="cards"; _skillsShellTab="cards";
    const chests=BALANCE.skillChests.map(ch=>{
      const ok = ch.keyCost ? (S.chestKeys||0)>=ch.keyCost : (S.gems||0)>=ch.gemCost;
      const price = ch.keyCost ? (ch.keyCost+" 🗝") : (ch.gemCost+" 💎");
      return `<div class="metarow"><span>${ch.n}<br><span class="sub">${ch.cards} Maps · guarantee <b class="r${ch.minR}">${SKILL_RAR[ch.minR]}</b>+</span></span>
        <button class="${ch.keyCost?"btn btn-soft":"btn btn-hard"}" onclick="openSkillChest('${ch.id}')" ${ok?"":"disabled"} ${ok?"":'style="opacity:.45"'}>${price}</button></div>`;
    }).join("");
    const rows=SKILL_DEFS.map(d=>{
      const lv=skillLv(d.id), cards=cardsOf(d.id), need=cardsNeeded(d.id), pro=proteinNeeded(d.id);
      const tr=(S.trained||{})[d.id]||0;
      const cap=STAT_CAPS[d.stat], cur=stat(d.stat);
      const pct=(d.stat==="crit"||d.stat==="luck"||d.stat==="mining");
      const curTxt=pct?(Math.round(cur)+"%"):fmt(cur);
      const maxed=cap!=null && cur>=cap-1e-9;
      const capTxt=cap!=null?` / max ${cap}${pct?"%":""}`:"";
      const ok=canUpSkill(d.id);
      const subRow=maxed
        ? `<span style="color:var(--gold)">${d.stat.toUpperCase()} Maximum · ${curTxt}${capTxt}</span>`
        : `<span style="color:var(--dim)">+${d.per} ${d.stat.toUpperCase()} · Now. ${curTxt}${capTxt}<br>Maps ${cards}/${need} · beer ${pro} 🍺${tr?(" · I’m a coach."+tr):""}${isSkillTagged(d.id)?" · 🏷":""}</span>`;
      const btn=maxed
        ? `<button class="btn btn-soft" disabled style="opacity:.4">max</button>`
        : `<button class="btn btn-soft" onclick="upSkill('${d.id}')" ${ok?"":"disabled"} ${ok?"":'style="opacity:.45"'}>${lv===0?"open":"Lv."+(lv+1)}</button>`;
      return `<div class="metarow"><span><b class="r${d.r}">${SKILL_RAR[d.r]}</b> ${d.n} · Lv.${lv}<br>${subRow}</span>${btn}</div>`;
    }).join("");
    body=`<div class="sub" style="margin-bottom:6px">Larry with the schill cards:</div>${chests}
      <div class="sub" style="margin:12px 0 6px">skill:</div>${rows}`;
    sub="A card lab. beer 🍺 "+Math.floor(S.protein||0)+" · 🗝 "+(S.chestKeys||0)+" · - Okay. "+(S.skillPts||0);
  }
  metaOpen("Mining Skills", sub, tabBar+body);
  skillsLockBody(tab==="sheet"||tab==="perks"||tab==="list");
  // Tab switch: start at top. Same-tab refresh (stat buy) keeps scroll via UIS.openPanel.
  if(prevTab!=null && prevTab!==tab){
    const b=$("uiBody"); if(b) b.scrollTop=0;
    const fo=b&&b.querySelector(".foScroll"); if(fo) fo.scrollTop=0;
  }
  if(tab==="train") workoutsBindRefresh();
}

function cardsOf(id){ return (S.skillCards||{})[id]||0; }
function skillLv(id){ return (S.skills||{})[id]||0; }

function cardsNeeded(id){ const lv=skillLv(id); return lv===0?1:lv; }
function proteinNeeded(id){
  const lv=skillLv(id), t=BALANCE.skillCardProtein;
  return t[Math.min(lv,t.length-1)];
}
function canUpSkill(id){
  const sd=SKILL_DEFS.find(s=>s.id===id); if(!sd) return false;
  const cap=STAT_CAPS[sd.stat];
  if(cap!=null && stat(sd.stat)>=cap-1e-9) return false;
  return cardsOf(id)>=cardsNeeded(id) && (S.protein||0)>=proteinNeeded(id);
}
function upSkill(id){
  const sd=SKILL_DEFS.find(s=>s.id===id); if(!sd) return false;
  const cap=STAT_CAPS[sd.stat];
  if(cap!=null && stat(sd.stat)>=cap-1e-9){ showToast("🔒",sd.stat.toUpperCase()+" Maximum","","There’s nowhere else.","ceiling "+cap+"%"); return false; }
  const need=cardsNeeded(id), pro=proteinNeeded(id);
  if(cardsOf(id)<need){ showToast("🃏","Few maps","",sd.n,"need "+need+", have "+cardsOf(id)); return false; }
  if((S.protein||0)<pro){ showToast("🍺","Not enough beer.","",sd.n,"need "+pro+" 🍺, have "+Math.floor(S.protein||0)); return false; }
  S.skillCards[id]=cardsOf(id)-need;
  S.protein-=pro;
  S.skills=S.skills||{}; S.skills[id]=skillLv(id)+1;
  dailyProgress("skill",1); Platform.logEvent("skill_up",{id,lv:S.skills[id]}); sfxGear();
  showToast("🃏","SKILL UPGRADED","r"+sd.r,sd.n+" Lv."+S.skills[id],"−"+need+" cards · −"+pro+" 🍺");
  save(); render(); openSkills(_skillsShellTab||"cards");
  return true;
}

function grantSkillCard(minR){
  const pool=SKILL_DEFS.filter(s=>s.r>=minR);
  const sd=(pool.length?pool:SKILL_DEFS)[Math.floor(Math.random()*(pool.length||SKILL_DEFS.length))];
  S.skillCards=S.skillCards||{};
  S.skillCards[sd.id]=cardsOf(sd.id)+1;
  return sd;
}
function openSkillChest(chestId){
  const ch=BALANCE.skillChests.find(c=>c.id===chestId); if(!ch) return false;
  if(ch.keyCost && (S.chestKeys||0)<ch.keyCost){ showToast("🗝","No keys to the larays.","",ch.n,"They give training and dilicks."); return false; }
  if(ch.gemCost && (S.gems||0)<ch.gemCost){ showToast("💎","Few crystals","",ch.n,"need "+ch.gemCost+" 💎"); return false; }
  if(ch.keyCost) S.chestKeys-=ch.keyCost;
  if(ch.gemCost) S.gems-=ch.gemCost;
  const got=[];
  for(let i=0;i<ch.cards;i++){
    const minR = i===0?ch.minR:0;
    got.push(grantSkillCard(minR).n);
  }
  showToast("🎴","Laurel’s open.","",ch.n,got.join(" · "),true);
  Platform.logEvent("skill_chest",{id:chestId}); sfxGear(); save(); render();
  if(typeof UIS!=="undefined" && UIS.id==="shop") UIS.render("shop");
  else openSkills(_skillsShellTab||"cards");
  return true;
}
function openWheel(){
  const spin=S.wheelSpins||0;
  const cost=BALANCE.wheel.cost[Math.min(spin,BALANCE.wheel.cost.length-1)];
  const adBtn=adSlotOk("wheel_free")
    ? `<button class="btn btn-soft" style="margin-top:8px" onclick="spinWheelAd()">📺 Free turn · East`+adSlotLeft("wheel_free")+`</button>`
    : "";
  metaOpen("The wheel of the miners","Roll "+(spin+1)+" · The price goes up with every attempt.",
    `<div style="text-align:center;padding:10px 0">
      <div style="font-size:13px;margin-bottom:10px;line-height:1.8">Awards: gold · crystals · rare stone</div>
      <button class="btn btn-hard" onclick="spinWheel(${cost})" ${(S.gems||0)<cost?"disabled":""}>Roll for ${cost}💎</button>
      ${adBtn}
    </div>`);
}
function wheelSpinReward(){
  const roll=Math.random(); let msg;
  if(roll<0.5){ const g=Math.round(veinReward()*50); S.gold+=g; msg="+"+fmt(g)+" 🪙"; }
  else if(roll<0.8){ const gm=[25,50,100][Math.floor(Math.random()*3)]; S.gems+=gm; msg="+"+gm+" 💎"; }
  else { onFind(); msg="A rare stone!"; }
  S.wheelSpins=(S.wheelSpins||0)+1;
  Platform.logEvent("wheel_spin",{n:S.wheelSpins});
  showToast("◎","Wheel!","",msg,"Cool "+S.wheelSpins);
  save(); render(); openWheel();
}
function spinWheel(cost){
  if((S.gems||0)<cost) return;
  S.gems-=cost;
  wheelSpinReward();
}
function spinWheelAd(){
  offerAdReward("wheel_free", wheelSpinReward);
}
function powerScore(){
  return Math.round(stat("energy")+stat("tough")*100+stat("atk")*8+stat("spd")*5
    +stat("crit")*2+stat("luck")*2+stat("mining")*3+stat("stone"));
}
function pvpLeagueIdx(){ const t=S.trophies||0; let i=0; for(let k=0;k<BALANCE.pvp.thresholds.length;k++) if(t>=BALANCE.pvp.thresholds[k]) i=k; return i; }
function pvpWinGold(li){
  li=li==null?pvpLeagueIdx():li;
  return (BALANCE.pvp.rewards[li]||0)*100;
}
function pvpLeaderboard(){
  const meName=playerName();
  const seeds=(typeof UI_PVP_BOARD!=="undefined"?UI_PVP_BOARD:[]).map(e=>({
    n:e.n, ic:e.ic||"⚔", t:e.t|0, me:false
  }));
  const list=seeds.filter(e=>e.n!==meName)
    .concat([{n:meName, ic:"⛏️", t:S.trophies|0, me:true}]);
  list.sort((a,b)=>b.t-a.t || (a.me?-1:1));
  return list;
}
function openPvpBoard(){
  const lb=pvpLeaderboard();
  const myRank=lb.findIndex(e=>e.me);
  const li=pvpLeagueIdx();
  const rows=lb.map((e,i)=>{
    const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":("#"+(i+1));
    const league=BALANCE.pvp.names[(()=>{ const t=e.t; let j=0;
      for(let k=0;k<BALANCE.pvp.thresholds.length;k++) if(t>=BALANCE.pvp.thresholds[k]) j=k; return j; })()]||"";
    return `<div class="metarow" ${e.me?'style="background:#1c2230;border-radius:6px"':''}>
      <span>${medal} ${e.ic||""} ${e.me?"<b style=\"color:var(--gold)\">":""}${esc(e.n)}${e.me?"</b>":""}
        <br><span class="sub">${league} · 🏆 ${fmt(e.t)}</span></span></div>`;
  }).join("");
  metaOpen("⚔ PvP Leaderboard",
    "- I’m going to go to the arena. "+BALANCE.pvp.names[li]+" · 🏆 "+fmt(S.trophies||0)
      +(myRank>=0?(" · place #"+(myRank+1)):"")
      +" · win now. +"+fmt(pvpWinGold(li))+" 🪙",
    rows+'<div class="sub" style="margin-top:10px">Mountain Wall — I’m the one who dug deeper than anyone.</div>'
      +'<button class="btn btn-wide" style="margin-top:8px" onclick="openWall()">🏔 Mountain Wall</button>');
  Platform.logEvent("pvp_board",{rank:myRank+1,trophies:S.trophies|0});
}
let pvpSlate=null;
function pvpDayReset(){ const t=todayStr();
  if(S.pvpDay!==t){ S.pvpDay=t; S.pvpFights=0; pvpSlate=null; } }
function pvpBotRec(id){
  ensureBags(S);
  if(!S.pvpBotRec[id]) S.pvpBotRec[id]={w:0,l:0};
  return S.pvpBotRec[id];
}
function pvpDayForm(botId){

  const s=String(todayStr())+"|"+botId;
  let h=2166136261>>>0;
  for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); }
  return 0.90+((h>>>0)%1001)/10000;
}
function pvpBotPower(bot, me){
  const form=pvpDayForm(bot.id)*(0.985+Math.random()*0.03);
  return Math.max(1, Math.round((me||1)*(bot.mul||1)*form));
}
function pvpRollSlate(withEasy){
  const me=powerScore();
  const bots=BALANCE.pvpBots||[];
  pvpSlate=bots.map(b=>({
    id:b.id, name:b.n, ic:b.ic||"🤖", tag:b.tag||"", fluff:b.fluff||"",
    grit:b.grit||0.4, mul:b.mul||1,
    power:pvpBotPower(b, me), bot:true
  }));
  if(withEasy){
    const easyMul=0.6;
    pvpSlate.push({
      id:"sponsor", name:"Slak-Sponsor", ic:"🍺", tag:"Light", fluff:"After the ads — weak rival for warm-up",
      grit:0.12, mul:easyMul, power:Math.max(1, Math.round(me*easyMul)), bot:true, easy:true
    });
  }
  if(pvpSlate.length!==(BALANCE.pvpCandidates||5) && !withEasy)
    BALANCE.pvpCandidates=pvpSlate.length;
}
function pvpWinChance(meP, oppP){
  const diff=(meP||0)-(oppP||0);
  return Math.max(8, Math.min(92, Math.round(50+diff*0.07)));
}
function pvpOpponentDwarfIdx(botId){
  let h=2166136261>>>0;
  const s=String(botId||"bot");
  for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); }
  return (h>>>0)%MINER_BASES.length;
}
function pvpBrawlSim(meP, oppP, grit){
  const cfg=BALANCE.pvp.brawl||{};
  const hpBase=cfg.hpBase||100, hpScale=cfg.hpScale||0.32, dmgScale=cfg.dmgScale||0.0625;
  const maxR=cfg.maxRounds||40;
  const meMax=Math.round(hpBase+(meP||1)*hpScale);
  const oppMax=Math.round(hpBase+(oppP||1)*hpScale);
  let me=meMax, opp=oppMax;
  const meDmg=Math.max(4, (meP||1)*dmgScale);
  const oppDmg=Math.max(4, (oppP||1)*dmgScale);
  const g=Math.max(0,Math.min(1, grit==null?0.4:grit));
  const spread=0.22*(1-g*0.55);
  const hits=[];
  for(let turn=0; me>0 && opp>0 && turn<maxR; turn++){
    const meHit=turn%2===0;
    const varMul=1-spread+Math.random()*spread*2;
    const d=Math.max(1, Math.round((meHit?meDmg:oppDmg)*varMul));
    if(meHit){ opp=Math.max(0, opp-d); hits.push({who:"me", dmg:d, me, opp}); }
    else { me=Math.max(0, me-d); hits.push({who:"opp", dmg:d, me, opp}); }
  }
  const win=me>0 && (opp<=0 || me>=opp);
  return { win, meMax, oppMax, meLeft:Math.max(0,me), oppLeft:Math.max(0,opp), hits, rounds:hits.length };
}
let _pvpAnimTok=0;
function pvpCloseBrawl(){ _pvpAnimTok++; const ov=$("pvpOverlay"); if(ov) ov.style.display="none"; }
function pvpSetBrawlHp(id, cur, max){
  const el=$(id); if(!el) return;
  const pct=Math.max(0, Math.min(100, Math.round(cur/Math.max(1,max)*100)));
  el.style.width=pct+"%";
}
function pvpSetupBrawlUi(cand, brawl){
  const meName=playerName();
  const pickSrc=gearArtSrc("pick", (S.gear.pick&&S.gear.pick.r)|0)||PICK_ICONS[0];
  const oppPick=PICK_ICONS[Math.min(7, Math.floor(((cand.power||1)/120)%8))];
  setTxt("pvpMeName", meName);
  setTxt("pvpOppName", (cand.ic||"")+" "+(cand.name||"Opponent"));
  const meImg=$("pvpMeImg"), oppImg=$("pvpOppImg");
  if(meImg) meImg.src=MINER_BASES[dwarfTier()];
  if(oppImg) oppImg.src=MINER_BASES[pvpOpponentDwarfIdx(cand.id)];
  const mp=$("pvpMePick"), op=$("pvpOppPick");
  if(mp) mp.src=pickSrc;
  if(op) op.src=oppPick;
  pvpSetBrawlHp("pvpMeHp", brawl.meMax, brawl.meMax);
  pvpSetBrawlHp("pvpOppHp", brawl.oppMax, brawl.oppMax);
  const st=$("pvpBrawlStage"), res=$("pvpBrawlResult");
  if(st) st.style.display="";
  if(res) res.style.display="none";
  const pop=$("pvpDmgPop"); if(pop){ pop.className="pvpDmgPop"; pop.style.display="none"; }
  const meF=$("pvpMeFighter"), oppF=$("pvpOppFighter");
  if(meF) meF.classList.remove("swing");
  if(oppF) oppF.classList.remove("swing");
}
function pvpShowBrawlDmg(side, dmg){
  const pop=$("pvpDmgPop"); if(!pop) return;
  pop.textContent="-"+dmg;
  pop.className="pvpDmgPop show "+side;
  pop.style.display="block";
  setTimeout(()=>{ if(pop) pop.classList.remove("show"); }, 280);
}
function pvpShowBrawlResult(cand, brawl, done){
  const st=$("pvpBrawlStage"), res=$("pvpBrawlResult");
  if(st) st.style.display="none";
  let fin=false;
  const finish=()=>{ if(fin) return; fin=true; pvpCloseBrawl(); done(); };
  if(res){
    res.style.display="flex";
    res.className="pvpResult "+(brawl.win?"win":"lose");
    setTxt("pvpResTitle", brawl.win?"VICTORY!":"DEFEAT");
    setTxt("pvpResSub", brawl.win
      ? ("You’re standing. · "+brawl.meLeft+" HP after "+brawl.rounds+" Shots")
      : ((cand.name||"Opponent")+" I won. · "+brawl.rounds+" Shots"));
    setTxt("pvpResDetail", (brawl.win?"+30 🏆":"-15 🏆")+" · HP "+brawl.meLeft+" vs "+brawl.oppLeft);
    const btn=$("pvpBrawlOk"); if(btn) btn.onclick=finish;
  }
  setTimeout(finish, brawl.win?2200:2800);
}
function pvpPlayBrawlAnim(cand, brawl, done){
  if(typeof __vclock!=="undefined"){ done(); return; }
  const ov=$("pvpOverlay");
  if(!ov){ done(); return; }
  const tok=++_pvpAnimTok;
  pvpSetupBrawlUi(cand, brawl);
  ov.style.display="flex";
  const hitMs=(BALANCE.pvp.brawl&&BALANCE.pvp.brawl.hitMs)||380;
  const hits=brawl.hits||[];
  let i=0;
  const step=()=>{
    if(tok!==_pvpAnimTok) return;
    if(i>=hits.length){ pvpShowBrawlResult(cand, brawl, done); return; }
    const h=hits[i++];
    const meAtk=h.who==="me";
    const fighter=$(meAtk?"pvpMeFighter":"pvpOppFighter");
    if(fighter){ fighter.classList.remove("swing"); void fighter.offsetWidth; fighter.classList.add("swing"); }
    pvpSetBrawlHp("pvpMeHp", h.me, brawl.meMax);
    pvpSetBrawlHp("pvpOppHp", h.opp, brawl.oppMax);
    pvpShowBrawlDmg(meAtk?"opp":"me", h.dmg);
    setTimeout(step, hitMs);
  };
  setTimeout(step, 420);
}
function pvpFightApply(cand, brawl){
  const win=brawl.win;
  if(cand.id){ const r=pvpBotRec(cand.id); if(win) r.w++; else r.l++; }
  if(win){
    S.pvpWins=(S.pvpWins||0)+1; S.trophies=(S.trophies||0)+30; dailyProgress("pvp",1); addGymXP(GYM_XP.perPvpWin);
    const li=pvpLeagueIdx(); S.gold+=pvpWinGold(li);
    try{ trackPlayEvent("pvp_fights",1); unlockPlayAchievement("pvp_win"); }catch(e){}
    showToast("⚔","VICTORY!","",
      (cand.ic||"")+" "+(cand.name||"The competition"),
      "+30 🏆 · HP "+brawl.meLeft+" vs "+brawl.oppLeft+" · "+brawl.rounds+" Ed.", true); }
  else { S.trophies=Math.max(0,(S.trophies||0)-15);
    showToast("⚔","DEFEAT","",
      (cand.ic||"")+" "+(cand.name||"The competition"),
      "-15 🏆 · HP "+brawl.meLeft+" vs "+brawl.oppLeft+" · "+brawl.rounds+" Ed."); }
  Platform.logEvent("pvp_fight",{win, bot:cand.id||null, meHp:brawl.meLeft, oppHp:brawl.oppLeft, rounds:brawl.rounds});
  pvpRollSlate(); save(); render();
  if(typeof UIS!=="undefined" && UIS.id==="pvp") UIS.render("pvp");
  else openPvp();
}
function pvpMineOrePerSec(power){
  return Math.max(0.5, (power||1)/12);
}
function pvpRaceSim(meP, oppP, grit){
  const sec=BALANCE.pvp.raceSec||180;
  const meOre=pvpMineOrePerSec(meP)*sec;
  const g=Math.max(0,Math.min(1,grit==null?0.4:grit));
  const spread=0.16*(1-g*0.65);
  const oppOre=pvpMineOrePerSec(oppP)*sec*(1-spread+Math.random()*spread*2);
  return {meOre, oppOre, sec, win:meOre>=oppOre};
}
function openPvp(){
  pvpDayReset();
  if(!pvpSlate) pvpRollSlate();
  const li=pvpLeagueIdx(), me=powerScore();
  const left=Math.max(0, BALANCE.pvpDayLimit-(S.pvpFights||0));
  const cards = left>0 ? pvpSlate.map((o,i)=>{
    const fav=me>=o.power;
    const rec=pvpBotRec(o.id);
    const chance=pvpWinChance(me, o.power);
    return `<div class="metarow"><span>${o.ic||"🤖"} <b>${o.name}</b> · <span class="sub">${o.tag||"AND"}</span>
      <br><span class="sub" style="color:${fav?"var(--green)":"#e8a24a"}">Force ${fmt(o.power)} · A chance. ~${chance}% · Account ${rec.w}:${rec.l}</span>
      <br><span class="sub">${o.fluff||""}</span></span>
      <button class="btn btn-soft" onclick="pvpFight(${i})">⚔ Fight.</button></div>`;
  }).join("") : '<div class="sub" style="color:#e8a24a">Fights are finished for today.</div>';
  metaOpen("⚔ PvP · A quick fight.",
    "League "+BALANCE.pvp.names[li]+" · force "+fmt(me)+" · left: "+left+"/"+BALANCE.pvpDayLimit,
    `<div class="metarow"><span>Cups: ${fmt(S.trophies||0)} · win: ${S.pvpWins||0}</span></div>
     <div class="sub" style="margin:6px 0">Two gnomes beating. pickaxeMee. — If you stand, you win.</div>
     ${cards}
     ${left>0?('<div style="text-align:center;padding:8px 0;display:flex;flex-direction:column;gap:6px;align-items:center">'
       +'<button onclick="pvpRerollSlate()">Update Form (free)</button>'
       +(adSlotOk("pvp_reroll")?('<button class="btn btn-hard" onclick="pvpRerollAd()">📺 New Opponents · '+adSlotLeft("pvp_reroll")+'</button>'):"")
       +'</div>'):''}`);
}
function pvpRerollSlate(){ pvpRollSlate(); openPvp(); }
function pvpRerollAd(){
  offerAdReward("pvp_reroll", ()=>{
    pvpRollSlate(true);
    showToast("📺","New Opponents","","+ Slak-Sponsor light");
    if(typeof UIS!=="undefined" && UIS.id==="pvp") UIS.render("pvp");
    else openPvp();
  });
}
function autoTurboActive(){ return !!(S.autoTurboUntil&&S.autoTurboUntil>Date.now()); }
function autoTurboSec(){
  const B=BALANCE.ads||{};
  return autoTurboActive() ? (B.autoTurboSec||2) : BALANCE.bags.autoSec;
}
function autoTurboPerTick(){
  const B=BALANCE.ads||{};
  return autoTurboActive() ? (B.autoTurboPerTick||2) : ((BALANCE.bags.autoOpenPerTick!=null?BALANCE.bags.autoOpenPerTick:1)|0);
}
function startAutoTurboAd(){
  if(!autoRollUnlocked()){ showToast("🎒","Auto closed","","First, unlock the trunks."); return; }
  offerAdReward("auto_turbo", ()=>{
    const min=(BALANCE.ads&&BALANCE.ads.autoTurboMin)||10;
    S.autoTurboUntil=Date.now()+min*60*1000;
    showToast("📺","Turbo chests","","×"+autoTurboPerTick()+" / "+autoTurboSec()+"c · "+min+" min");
    Platform.logEvent("auto_turbo",{min});
    save(); render();
  }, {limitMsg:"Turbo advertising for today."});
}
function pvpFight(idx){
  pvpDayReset();
  if((S.pvpFights||0)>=BALANCE.pvpDayLimit){ showToast("⚔","The Fight Limited","","Come back tomorrow."); return; }
  if(!pvpSlate) pvpRollSlate();
  const cand=pvpSlate[idx]||pvpSlate[0];
  const me=powerScore(), opp=cand.power;
  S.pvpFights=(S.pvpFights||0)+1;
  const brawl=pvpBrawlSim(me, opp, cand.grit);
  pvpPlayBrawlAnim(cand, brawl, ()=>pvpFightApply(cand, brawl));
}
const EVENT_LIST=[
  ["rockfall","Rockfall","The wave of boulders"],["lavaVein","Lava Vein","Constant sequence"],
  ["prospectorFair","Prospector Fair","indicative loot"],
  ["crystalCave","Crystal Cave","Seif crystals"],["critterDen","Critter Den","Latch cleaning"]
];

function refillKeys(){
  if((S.keys||0)>=BALANCE.keyMax){ S.keyAt=Date.now(); return; }
  if(!S.keyAt) S.keyAt=Date.now();
  const elapsed=(Date.now()-S.keyAt)/1000;
  const gained=Math.floor(elapsed/BALANCE.keyRefillSec);
  if(gained>0){
    S.keys=Math.min(BALANCE.keyMax,(S.keys||0)+gained);
    S.keyAt = (S.keys>=BALANCE.keyMax) ? Date.now() : S.keyAt+gained*BALANCE.keyRefillSec*1000;
  }
}
function keyTimerStr(){
  if((S.keys||0)>=BALANCE.keyMax) return "Total stock";
  const left=Math.max(0, BALANCE.keyRefillSec-(Date.now()-(S.keyAt||Date.now()))/1000);
  const h=Math.floor(left/3600), m=Math.floor(left%3600/60);
  return "Key "+(h?h+"h ":"")+m+"m";
}
function eventLevel(){ return Math.max(1, Math.floor((S.mine||0)/2)+1); }
function eventNameOf(id){
  for(let i=0;i<EVENT_LIST.length;i++) if(EVENT_LIST[i][0]===id) return EVENT_LIST[i][1];
  return id;
}
function ensureEventRun(d){
  if(!d) return d;
  if(d.eventRun!=null && typeof d.eventRun!=="object") d.eventRun=null;
  if(d.keys==null||!isFinite(d.keys)) d.keys=BALANCE.keyMax;
  if(d.keyAt==null||!isFinite(d.keyAt)) d.keyAt=Date.now();
  return d;
}
function failEventRun(reason){
  if(!S.eventRun) return;
  const id=S.eventRun.id;
  S.eventRun=null;
  showToast("★","The race failed","","Key Not spent", reason||"Try again.");
  Platform.logEvent("event_fail",{id, reason:reason||""});
  try{ save(); }catch(e){}
}
function grantEventWin(snap){
  S.keys=Math.max(0,(S.keys||0)-1);
  if(!S.keyAt||S.keys===BALANCE.keyMax-1) S.keyAt=Date.now();
  const rew=Math.max(0, snap.rew|0);
  if(snap.res) S[snap.res]=(S[snap.res]||0)+rew;
  showToast("★","The race is over!","",(snap.ic||"◎")+" +"+fmt(rew)+" "+(snap.currency||""),"level "+(snap.lvl||1)+" · still 🔑"+S.keys,true);
  Platform.logEvent("event_win",{id:snap.id,lvl:snap.lvl,waves:snap.waves});
}
function advanceEventWave(snap){
  const next=(snap.wave|0)+1;
  const waves=Math.max(1, snap.waves|0);
  if(next>=waves){
    grantEventWin(snap);
    S.eventRun=null;
  } else {
    S.eventRun.wave=next;
    showToast(snap.ic||"◎","Wave "+(next)+"/"+waves,"","More. "+(waves-next),"Key is still intact.");
    Platform.logEvent("event_wave",{id:snap.id,wave:next,waves});
  }
}
function openEvents(){
  if(!requireFeat("daily")) return;
  refillKeys();
  ensureEventRun(S);
  const lvl=eventLevel();
  const busy=!!S.eventRun;
  const rows=EVENT_LIST.map(([id,nm,desc])=>{
    const s=BALANCE.events[id];
    const rew=eventReward(s,lvl)*(s.mult||1);
    const waves=Math.max(1,s.waveSize||1);
    const cap=lvl>=s.maxLvl?" (max)":"";
    const btn=busy
      ? `<button class="btn btn-soft" disabled>It’s coming...</button>`
      : ((S.keys||0)<1
        ? `<button class="btn btn-soft" disabled>I need it. 🔑</button>`
        : `<button class="btn btn-soft" onclick="playEvent('${id}')">Run 🔑</button>`);
    return `<div class="metarow"><span><b>${nm}</b> · <span style="color:var(--dim)">${desc}</span><br>
      <span style="color:var(--gold)">${s.ic} +${fmt(rew)} ${s.currency}</span> · Lv.${lvl}/${s.maxLvl}${cap} · ${waves} Waves</span>
      ${btn}</div>`;
  }).join("");
  let claim="";
  if((S.keys||0)<BALANCE.keyMax && !busy){
    const gemCost=BALANCE.eventKeyGem||50;
    claim=`<div class="metarow"><span>Take it now.</span>
      <span style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-soft" onclick="claimEventKey()">🔑 +1 Publicity</button>
        <button class="btn btn-hard" onclick="buyEventKey()">🔑 +1 · 💎${gemCost}</button>
      </span></div>`;
  }
  if(busy){
    const er=S.eventRun;
    claim=`<div class="metarow"><span>Now: <b>${er.n||er.id}</b> · wave ${(er.wave|0)+1}/${er.waves||1}</span>
      <button class="btn btn-soft" disabled>Key whole before victory</button></div>`+claim;
  }
  metaOpen("(Signed) Ivan5 (i.e. mode)",
    "🔑 "+(S.keys||0)+"/"+BALANCE.keyMax+" · "+keyTimerStr()+" · The key is spent only on winning.",
    claim+rows);
  try{ if(typeof UIS!=="undefined"&&UIS._lastMeta) UIS._lastMeta.kind="events"; }catch(e){}
}
function playEvent(id){
  refillKeys();
  ensureEventRun(S);
  if((S.keys||0)<1){ showToast("🔑","No keys","","Wait for the refill. — "+keyTimerStr(),"Or take the ads."); openEvents(); return false; }
  if(S.eventRun){ showToast("◎","On it.","","Finish the current race."); return false; }
  if(S.mineRaid){ showToast("⛏","Special Stone","","First, break it."); return false; }
  const s=BALANCE.events[id];
  if(!s) return false;
  const lvl=eventLevel();
  const waves=Math.max(1, s.waveSize||1);
  const rew=eventReward(s,lvl)*(s.mult||1);
  S.eventRun={ id, wave:0, waves, rew, res:s.res, ic:s.ic, currency:s.currency, n:eventNameOf(id), lvl };
  dead=false;
  try{ if(typeof UIS!=="undefined"&&UIS.close) UIS.close(); }catch(e){}
  newRock(); save(); render();
  try{ switchTab("Mine"); }catch(e){}
  showToast(s.ic||"◎","Run: "+eventNameOf(id),"",
    waves+" Waves · Award "+fmt(rew)+" "+s.currency,
    "The key only goes down if you finish it.");
  Platform.logEvent("event_start",{id,lvl,waves});
  return true;
}
function claimEventKey(){
  refillKeys();
  if((S.keys||0)>=BALANCE.keyMax){ showToast("🔑","Full stock","","already. "+BALANCE.keyMax+"/"+BALANCE.keyMax); openEvents(); return; }
  const grant=()=>{
    S.keys=(S.keys||0)+1;
    showToast("🔑","Key received","","with ad","You can run.");
    Platform.logEvent("event_key_ad",{});
    save(); render(); openEvents();
  };
  try{
    if(Platform&&typeof Platform.showRewarded==="function"){
      Platform.showRewarded(ok=>{ if(ok) grant(); }, "event_key");
      return;
    }
  }catch(e){}
  grant();
}
function buyEventKey(){
  refillKeys();
  const cost=BALANCE.eventKeyGem||50;
  if((S.keys||0)>=BALANCE.keyMax){ showToast("🔑","Full stock","","It’s already the maximum."); openEvents(); return; }
  if((S.gems||0)<cost){ showToast("💎","Few crystals","","need "+cost,"Now. "+(S.gems||0)); return; }
  S.gems-=cost;
  S.keys=(S.keys||0)+1;
  showToast("🔑","The key is bought.","","−"+cost+" 💎","You can run.");
  Platform.logEvent("event_key_gem",{cost});
  save(); render(); openEvents();
}

const PET_TYPES=[
  {stat:"luck",  n:"Golden Dragon",   ic:"🐉", art:"art/pet_dragon_gold.png?v=3",  pct:[8,24,72,216,648], dot:"bleed"},
  {stat:"mining",n:"Chaos Dragon",     ic:"🐉", art:"art/pet_dragon_chaos.png?v=3", pct:[10,30,90,270,810],dot:"shock"},
  {stat:"stone", n:"Storm Dragon", ic:"🐉", art:"art/pet_dragon_storm.png?v=3", pct:[12,36,108,324,972],dot:"splash"}
];
function petIcon(t){
  const p=PET_TYPES[t|0];
  if(!p) return "🐉";
  if(p.art) return '<img class="uiPetArt" src="'+p.art+'" alt="'+(p.n||"dragon")+'">';
  return p.ic||"🐉";
}
function petIconEmoji(t){
  const p=PET_TYPES[t|0];
  return (p&&p.ic)||"🐉";
}
const DOT_NAMES={bleed:"Bleeding",shock:"Shock",splash:"Wave"};

const GYM_XP={ perGift:5, perWorkout:20, perPvpWin:8, perDaily:15 };
const GYM_LEVELS=[0,50,150,350,700,1200,2000,3200,5000,8000,12000];
const GYM_PERKS=[
  {lv:1,pct:5, n:"Warming up"}, {lv:3,pct:10,n:"Second breath"},
  {lv:5,pct:18,n:"Trick"},  {lv:7,pct:28,n:"The Mastery"},
  {lv:9,pct:42,n:"The Spirit of the Mountain"}, {lv:10,pct:60,n:"Mountain Heritage"}
];
function gymLevel(){ let lv=0; for(let i=0;i<GYM_LEVELS.length;i++) if((S.gymXP||0)>=GYM_LEVELS[i]) lv=i; return lv; }
function gymPerkPct(){ let p=0; const lv=gymLevel(); for(const pk of GYM_PERKS) if(lv>=pk.lv) p=pk.pct; return p; }
function addGymXP(n){ if(!(n>0)) return; const before=gymLevel();
  S.gymXP=(S.gymXP||0)+n; const after=gymLevel();
  if(after>before){ showToast("🏋","THE HALL IS GROWN!","","Level "+after,"+"+gymPerkPct()+"% To all statues",true); try{ jingleSet(); }catch(e){} } }

const STICKERS=[
  {id:"s_atk1",n:"Fire Pickaxe",   ic:"⛏️",stat:"atk",   val:15,r:0,col:"mountain"},
  {id:"s_atk2",n:"Gold hammer", ic:"🔨",stat:"atk",   val:40,r:2,col:"forge"},
  {id:"s_crit",n:"The Mark Eye",   ic:"🎯",stat:"crit",  val:3, r:1,col:"forge"},
  {id:"s_luck",n:"Clever-4",      ic:"🍀",stat:"luck",  val:4, r:1,col:"deep"},
  {id:"s_min", n:"Ore Nuhach",    ic:"👃",stat:"mining",val:4, r:2,col:"mountain"},
  {id:"s_sto1",n:"Gold bag",  ic:"💰",stat:"stone", val:20,r:0,col:"tavern"},
  {id:"s_sto2",n:"A chest of ancestors",ic:"🧰",stat:"stone", val:60,r:3,col:"tavern"},
  {id:"s_en",  n:"Second breath",ic:"🫁",stat:"energy",val:30,r:1,col:"deep"},
  {id:"s_tou", n:"Dubular shield",   ic:"🛡️",stat:"tough", val:8, r:2,col:"forge"},
  {id:"s_rgn", n:"Living water",    ic:"💧",stat:"regen", val:2, r:2,col:"deep"},
  {id:"s_stm", n:"Light-pistol furs",   ic:"🌬️",stat:"stamina",val:5,r:3,col:"tavern"},
  {id:"s_atk3",n:"Heart of the Mountain",   ic:"💎",stat:"atk",   val:120,r:4,col:"mountain"}
];
function stickersInCol(colId){ return STICKERS.filter(s=>s.col===colId); }
function stickerColProgress(colId){
  const list=stickersInCol(colId), owned=S.stickers||{};
  let have=0; for(const s of list) if((owned[s.id]||0)>0) have++;
  return {have, total:list.length};
}
const STICKER_PACK_GEMS=250, STICKER_PACK_N=5;
function stickerBonus(id){ let v=0; const owned=S.stickers||{};
  for(const s of STICKERS) if(s.stat===id && (owned[s.id]||0)>0) v+=s.val; return v; }
function stickerDupes(){ let n=0; const o=S.stickers||{};
  for(const k in o) if(o[k]>1) n+=o[k]-1; return n; }
const PET_RAR=["Common","Rare","Epic","Legendary","Exotic"];
const PET_MERGE_MAX=3;
function petDot(){
  if(!S.pet) return null;
  const t=PET_TYPES[S.pet.t], r=S.pet.r||0, D=BALANCE.petDot;
  return { kind:t.dot, name:DOT_NAMES[t.dot],
    dps:stat("atk")*D.dpsFrac[r], defCut:D.defCut[r], spdCut:D.spdCut[r] };
}
function petBonus(id){ if(!S.pet||PET_TYPES[S.pet.t].stat!==id) return 0;
  return PET_TYPES[S.pet.t].pct[S.pet.r]; }
function openGeoGuild(){
  if(!S.geo){ metaOpen("Artelle. elder","First, hire someone.",'<div class="sub">It’s empty.</div>'); return; }
  const g=GEO_TYPES[S.geo.t], mats=geoMaterials();
  const isLeg=S.geo.r===GEO_RAR.length-1;
  const ascOk=canAscendGeo();
  const B=BALANCE.merge;
  const ascWhy = !isLeg ? `need ${GEO_RAR[GEO_RAR.length-1]}`
    : ((S.geo.lv||1)<B.ascendLv ? `I need a ur.${B.ascendLv} (have ${S.geo.lv||1})`
    : ((S.gems||0)<B.ascendGems ? `need ${B.ascendGems} 💎 (have ${fmt(S.gems||0)})` : ""));
  const box=Object.keys(S.geoBox||{}).filter(k=>S.geoBox[k]>0)
    .sort((a,b)=>Number(b.split("_")[1])-Number(a.split("_")[1]))
    .map(k=>{ const [t,r]=k.split("_").map(Number);
      const usable=r<=S.geo.r;
      return `<div class="metarow"><span><b class="r${r}">${GEO_RAR[r]}</b> · ${GEO_TYPES[t].names[0]} ×${S.geoBox[k]}</span>
        <span class="sub" style="color:${usable?"var(--green)":"var(--dim)"}">${usable?"valid":"too rare"}</span></div>`;
    }).join("")||'<div class="sub">duplicate None — Turn the gurney around.</div>';
  metaOpen("Artelle. elder",
    "Target absorbs material equal to or less than rarity And it’s growing up. — for legendary people.",
    `<div class="metarow"><span>In the case: <b class="r${S.geo.r}">${S.geo.n}</b>${(S.geo.asc||0)?' <span style="color:var(--gold)">✦'+S.geo.asc+'</span>':''}
       <br><span class="sub">Lv.${S.geo.lv||1} · +${Math.round(geoPct(S.geo))}% ${g.stat.toUpperCase()}</span></span></div>
     <div class="metarow"><span>Artifact material</span>
       <button class="btn btn-soft" onclick="mergeGeo()" ${mats>0?"":"disabled"} ${mats>0?"":'style="opacity:.45"'}>Splitting ${mats} → +${mats} Lv.</button></div>
     <div class="metarow"><span>Ascension ✦${(S.geo.asc||0)+1}<br><span class="sub">+${B.ascendPct}% to bonus, level in 1</span></span>
       <button class="btn btn-hard" onclick="ascendGeo()" ${ascOk?"":"disabled"} ${ascOk?"":'style="opacity:.45"'}>${B.ascendGems}💎</button></div>
     ${ascWhy?`<div class="sub" style="color:#e8a24a;margin-bottom:8px">Ascent: ${ascWhy}</div>`:""}
     <div class="sub" style="margin-top:10px">Collection duplicate:</div>${box}`);
  Platform.logEvent("geo_guild",{});
}
function openPets(){
  const cur=S.pet?(function(){ const d=petDot();
    return `<div class="metarow"><span>In the case: <b class="r${S.pet.r}">${PET_TYPES[S.pet.t].n}</b> (${PET_RAR[S.pet.r]})
      <br><span class="sub">+${PET_TYPES[S.pet.t].pct[S.pet.r]}% ${PET_TYPES[S.pet.t].stat.toUpperCase()} · ${d.name} Under rock</span></span></div>`;
  })():"";
  const keys=Object.keys(S.petBox||{}).filter(k=>S.petBox[k]>0)
    .sort((a,b)=>Number(b.split("_")[1])-Number(a.split("_")[1]));
  const rows=keys.map(k=>{
    const [t,r]=k.split("_").map(Number), c=S.petBox[k];
    const maxed=r>=PET_MERGE_MAX;
    const ok=canMergePet(t,r);
    const btn=maxed
      ? `<button class="btn btn-soft" disabled style="opacity:.4">max</button>`
      : `<button class="btn btn-soft" onclick="mergePet(${t},${r})" ${ok?"":"disabled"} ${ok?"":'style="opacity:.45"'}>Splitting 3 → ${PET_RAR[r+1]}</button>`;
    const need=maxed?"":`<div class="sub" style="margin:2px 0 0">copies ${c}/${BALANCE.merge.petCost}</div>`;
    return `<div class="metarow"><span><b class="r${r}">${PET_RAR[r]}</b> · ${PET_TYPES[t].n} ×${c}${need}</span>${btn}</div>`;
  }).join("")||'<div class="sub">The collection is empty. egg.</div>';
  const craftBtn = petCraftUnlocked()
    ? `<div class="metarow"><span>⚗ Craft Exotic<br><span class="sub">Under Legendary of each family + ${BALANCE.petCraft.gems} 💎</span></span>
        <button class="btn btn-hard" onclick="craftPetExotic()" ${petCraftReady()?"":"disabled"} ${petCraftReady()?"":'style="opacity:.45"'}>Craft</button></div>`
    : `<div class="sub" style="margin-top:8px">Craft Exotic to be opened after ${BALANCE.petCraft.needLegendaries} legendary pet (there are) ${S.petLegSeen||0}).</div>`;
  metaOpen("Pets","The Pity of the Mountain · roll: "+(S.petRolls||0)+". 3 Same → 1 random next rarity; Exotic — Just the kraft.",
    cur+rows+craftBtn+`<div style="text-align:center;padding:10px 0"><button class="btn btn-hard" onclick="rollPet()" ${(S.eggs||0)<1?"disabled":""}>Roll · 🥚1 (East ${S.eggs||0})</button></div>`);
}

const boxKey=(t,r)=>t+"_"+r;
function boxAdd(box,t,r,n){ const k=boxKey(t,r); box[k]=(box[k]||0)+(n||1); }
function boxCountAt(box,t,r){ return box[boxKey(t,r)]||0; }

function canMergePet(t,r){
  return r < PET_MERGE_MAX && boxCountAt(S.petBox,t,r) >= BALANCE.merge.petCost;
}
function mergePet(t,r){
  if(r>=PET_MERGE_MAX){ showToast(petIcon(t),"Limit of merger","","Exotic Craft only","3× Legendary + "+BALANCE.petCraft.gems+" 💎"); return false; }
  if(boxCountAt(S.petBox,t,r)<BALANCE.merge.petCost){
    showToast(petIcon(t),"Few copies","","I do. "+BALANCE.merge.petCost+"× "+PET_TYPES[t].n,"have "+boxCountAt(S.petBox,t,r));
    return false;
  }
  S.petBox[boxKey(t,r)]-=BALANCE.merge.petCost;
  if(S.petBox[boxKey(t,r)]<=0) delete S.petBox[boxKey(t,r)];
  const nt=Math.floor(Math.random()*PET_TYPES.length), nr=r+1;
  boxAdd(S.petBox,nt,nr,1);
  equipBestPet();
  showToast(petIcon(nt),"Merger!","r"+nr,PET_TYPES[nt].n+" ("+PET_RAR[nr]+")","3× "+PET_TYPES[t].n+" Going to the mountain",true);
  Platform.logEvent("pet_merge",{from:r,to:nr}); sfxGear(); save(); render(); renderGear();
  return true;
}

function equipBestPet(){
  let best=null;
  for(const k in S.petBox){ if(S.petBox[k]<=0) continue;
    const [t,r]=k.split("_").map(Number);
    if(!best || r>best.r || (r===best.r && PET_TYPES[t].pct[r]>PET_TYPES[best.t].pct[best.r])) best={t,r};
  }
  if(best) S.pet=best;
  return best;
}

function geoPct(g){
  if(!g) return 0;
  const base=GEO_TYPES[g.t].pct[g.r];
  const lv=(g.lv||1)-1, asc=g.asc||0;
  return base*(1+lv*BALANCE.merge.geoLvPct/100)*(1+asc*BALANCE.merge.ascendPct/100);
}
function geoMaterials(){
  if(!S.geo) return 0;
  let n=0;
  for(const k in S.geoBox){ const r=Number(k.split("_")[1]); if(r<=S.geo.r) n+=S.geoBox[k]; }
  return n;
}
function mergeGeo(){
  if(!S.geo){ showToast("👷","No one to rock.","","First hire elder"); return false; }
  const have=geoMaterials();
  if(have<1){ showToast("👷","No material","","Needed duplicate rarity ≤ "+GEO_RAR[S.geo.r]); return false; }
  let eaten=0;
  for(const k in S.geoBox){
    const r=Number(k.split("_")[1]);
    if(r>S.geo.r) continue;
    eaten+=S.geoBox[k]; delete S.geoBox[k];
  }
  S.geo.lv=(S.geo.lv||1)+eaten;
  showToast("👷","Merger!","r"+S.geo.r,S.geo.n+" Lv."+S.geo.lv,"absorbed "+eaten+" · +"+geoPct(S.geo).toFixed(0)+"% "+GEO_TYPES[S.geo.t].stat.toUpperCase(),true);
  Platform.logEvent("geo_merge",{lv:S.geo.lv,eaten}); sfxGear(); save(); render();
  return true;
}
function canAscendGeo(){
  return !!S.geo && S.geo.r===GEO_RAR.length-1
    && (S.geo.lv||1)>=BALANCE.merge.ascendLv
    && (S.gems||0)>=BALANCE.merge.ascendGems;
}
function ascendGeo(){
  if(!S.geo || S.geo.r!==GEO_RAR.length-1){ showToast("👷","I need a legendary one.","","Ascension only with "+GEO_RAR[GEO_RAR.length-1]); return false; }
  if((S.geo.lv||1)<BALANCE.merge.ascendLv){ showToast("👷","Low level","","I need a ur."+BALANCE.merge.ascendLv,"have "+(S.geo.lv||1)); return false; }
  if((S.gems||0)<BALANCE.merge.ascendGems){ showToast("👷","Few crystals","","I do. "+BALANCE.merge.ascendGems+" 💎","have "+fmt(S.gems||0)); return false; }
  S.gems-=BALANCE.merge.ascendGems;
  S.geo.asc=(S.geo.asc||0)+1;
  S.geo.lv=1;
  showToast("👷","AH, CLIMBING!","r5",S.geo.n,"step "+S.geo.asc+" · +"+geoPct(S.geo).toFixed(0)+"%",true);
  Platform.logEvent("geo_ascend",{asc:S.geo.asc}); try{ jingleSet(); }catch(e){}
  save(); render();
  return true;
}

function petCraftUnlocked(){ return (S.petLegSeen||0)>=BALANCE.petCraft.needLegendaries; }
function petCraftReady(){
  if(!petCraftUnlocked()) return false;
  if((S.gems||0)<BALANCE.petCraft.gems) return false;
  for(let t=0;t<PET_TYPES.length;t++) if(boxCountAt(S.petBox,t,3)<1) return false;
  return true;
}

function buyStickerPack(){
  if((S.gems||0)<STICKER_PACK_GEMS){ showToast("🃏","Few crystals","","Stickers pack: "+STICKER_PACK_GEMS+" 💎"); return false; }
  S.gems-=STICKER_PACK_GEMS; S.stickers=S.stickers||{};
  const got=[];
  for(let i=0;i<STICKER_PACK_N;i++){ const s=STICKERS[Math.floor(Math.random()*STICKERS.length)];
    S.stickers[s.id]=(S.stickers[s.id]||0)+1; got.push(s.ic); }
  showToast("🃏","Pack’s open.","",STICKER_PACK_N+" Stickers",got.join(" "),true);
  Platform.logEvent("sticker_pack",{}); sfxGear(); save(); render(); openStickers();
  return true;
}

function giftStickers(){
  const d=stickerDupes();
  if(d<1){ showToast("🃏","None duplicate","","Nothing to give"); return false; }
  const o=S.stickers; for(const k in o) if(o[k]>1) o[k]=1;
  addGymXP(d*GYM_XP.perGift);
  showToast("🎁","Dumped into the hall","",d+"× duplicate","+"+(d*GYM_XP.perGift)+" Gym XP");
  Platform.logEvent("sticker_gift",{n:d}); save(); render(); openStickers();
  return true;
}
function openProfile(){
  const w=beardWisdom(), depth=S.stageIdx*3;
  const setName="var v=document.getElementById('profName').value.trim().slice(0,18); if(v){S.playerName=v; save(); openProfile();}";
  $("profCard").innerHTML=
    '<div style="text-align:center;margin-bottom:10px"><div style="font-size:40px">🧔</div>'+
    '<h3 style="margin:4px 0">'+esc(playerName())+'</h3>'+
    '<div class="sub">'+w.title+((S.prestigeLv||0)?(" · ⛰ Prestige "+S.prestigeLv):"")+'</div></div>'+
    '<div class="metarow"><span>Deep run</span><span><b>'+Math.min(S.stageIdx,BALANCE.run.len)+'/'+BALANCE.run.len+'</b></span></div>'+
    '<div class="metarow"><span>Deep record</span><span><b>'+fmt(S.bestDepth||depth)+' m</b></span></div>'+
    '<div class="metarow"><span>Prestige · descent</span><span>'+(S.prestigeLv||0)+' · '+(S.prestigeRuns||0)+'</span></div>'+
    '<div class="metarow"><span>Wisdom beard</span><button class="btn btn-soft" onclick="openBeard()">'+w.title+'</button></div>'+
    '<div class="metarow"><span>BEAUTY</span><button class="btn btn-soft" onclick="openCharSheet()">List · Total '+(S.specialPool||0)+'</button></div>'+
    '<div class="metarow"><span>Conference</span><span>Lv.'+gymLevel()+' · +'+gymPerkPct()+'%</span></div>'+
    '<div class="metarow"><span>Winning in PvP · Cup</span><span>'+(S.pvpWins||0)+' · '+fmt(S.trophies||0)+'</span></div>'+
    '<div class="metarow"><span>Name</span><span><input id="profName" value="'+esc(playerName())+'" maxlength="18" style="width:120px;background:#12151d;border:1px solid var(--line);color:var(--txt);border-radius:6px;padding:6px;font-size:14px"><button class="btn btn-soft" style="margin-left:6px" onclick="'+setName+'">✓</button></span></div>';
  $("profModal").style.display="flex"; Platform.logEvent("profile_view",{});
}

const CHEST_STAT_LBL=STAT_LBL;
let chestPending=null;
function chestStatVal(v){ return v>=100?Math.round(v):(v>=10?v.toFixed(1):v.toFixed(2)); }
function chestChanceRows(lvl){
  const w=bagWeights(lvl);
  let h="";
  for(let r=0;r<8;r++){
    const p=w[r];
    if(p<0.05) continue;
    const pct=p>=10?Math.round(p):p.toFixed(1);
    h+='<div class="chRow"><span class="chNm r'+r+'">'+RAR_NAMES[r]+'</span>'
      +'<div class="chBar"><div class="chFill br'+r+'b" style="width:'+Math.min(100,p).toFixed(1)+'%"></div></div>'
      +'<span class="chPc">'+pct+'%</span></div>';
  }
  return h;
}

function chestPendingParts(it){
  const sl=SLOTS.find(s=>s.id===it.s);
  const old=S.gear[it.s];
  let stats="";
  for(const k in sl.st){
    const nv=itemStat(it,k);
    const ov=old?itemStat(old,k):0;
    const d=nv-ov;
    let pill;
    if(!old){
      pill='<span class="chPill up">+'+chestStatVal(nv)+'</span>';
    } else {
      const cls=d>1e-6?"up":(d<-1e-6?"dn":"eq");
      const sign=d>0?"+":"";
      pill='<span class="chPill '+cls+'">'+sign+chestStatVal(d)+'</span>';
    }
    stats+='<div class="chSt"><span>'+(CHEST_STAT_LBL[k]||k)+'</span>'+pill+'</div>';
  }
  const better=!old||itemPower(it)>itemPower(old);
  const cmp=old
    ?('<div class="chCmp '+(better?"up":"dn")+'">'+(better?"▲ More dressed":"▼ weaker than the wearer")+'</div>')
    :'<div class="chCmp up">The slot was empty.</div>';
  return {sl,stats,cmp,better,old};
}
function chestPendingCardHtml(it){
  const p=chestPendingParts(it);
  return '<div class="chDrop br'+it.r+'">'
    +'<div class="chDropTop"><span class="chIc">'+p.sl.ic+'</span>'
    +'<div><b class="r'+it.r+'">'+RAR_NAMES[it.r]+'</b><div class="sub">'+(it.n||p.sl.n)+'</div></div></div>'
    +'<div class="chSts">'+p.stats+'</div>'+p.cmp
    +'<div class="btnrow" style="margin-top:10px">'
    +'<button class="btn btn-hard" onclick="sellChestItem()">Sell<small>'+fmt(sellPrice(it))+' 🪙</small></button>'
    +'<button class="btn btn-soft" onclick="equipChestItem()">Put on<small>Equipment</small></button>'
    +'</div></div>';
}
function renderDropCard(){
  const el=$("dropCard"); if(!el||!chestPending) return;
  const tit=$("dropTitle"); if(tit) tit.textContent="NEW FIND";
  el.innerHTML=chestPendingCardHtml(chestPending);
}
function showDropDecide(){
  renderDropCard();
  const m=$("dropModal"); if(m) m.style.display="flex";
  try{ if(typeof updateFtueHint==="function") updateFtueHint(); }catch(e){}
}
function closeDropDecide(){
  const m=$("dropModal"); if(m) m.style.display="none";
  try{ if(typeof updateFtueHint==="function") updateFtueHint(); }catch(e){}
}
function renderChestCard(){
  const el=$("chestCard"); if(!el) return;
  const lvl=S.bag, atCap=lvl>=50, c=bagCost(), upNow=bagUpgrading();
  const canUp=!atCap && !upNow && (S.gold||0)>=c;
  const nb=nextBagName(lvl);
  const upSec=(upNow && S.bagActive && S.bagActive.dur)||bagUpgradeSec();
  const timerPct=upNow? Math.max(0,100*(1-bagUpgradeLeft()/upSec)) : 0;
  const timerLbl=upNow
    ? ("Upgrading… "+fmtClock(bagUpgradeLeft()*1000)+" · skip 💎"+bagSkipGems()+" or −1h via ad")
    : ("~"+fmtClock(upSec*1000)+" after pay");
  let pend="";
  if(chestPending){
    pend=chestPendingCardHtml(chestPending);
  }
  const openBtn=S.autoRoll
    ? '<button class="btn btn-soft" disabled>Auto is clearing.</button>'
    : ((S.bags||0)>0
    ? '<button class="btn btn-soft" onclick="chestOpenOne()">Open bag · 🎒'+(S.bags||0)+'</button>'
    : '<button class="btn btn-soft" disabled>No bags · 🎒0</button>');
  const autoUnlocked=autoRollUnlocked();
  const autoRow=autoUnlocked
    ? ('<button type="button" class="btn '+(S.autoRoll?"btn-hard":"btn-soft")+'" onclick="toggleAutoRoll();renderChestCard()" style="margin-left:6px">'+(S.autoRoll?"Auto ✓":"Auto")+'</button>'
      +'<button type="button" class="btn btn-soft" onclick="openAutoTierModal()" style="margin-left:6px">threshold: <span class="r'+(S.autoRollTier||0)+'">'+RAR_NAMES[S.autoRollTier||0]+'</span>+</button>'
      +(typeof adSlotOk==="function"&&adSlotOk("auto_turbo")&&!autoTurboActive()
        ? ('<button type="button" class="btn btn-soft" onclick="startAutoTurboAd()" style="margin-left:6px">📺 Turbo · '+adSlotLeft("auto_turbo")+'</button>')
        : (autoTurboActive()?('<span class="sub" style="margin-left:6px;color:var(--gold)">📺 Turbo '+fmtClock((S.autoTurboUntil||0)-Date.now())+'</span>'):"")))
    : ('<button type="button" class="btn btn-soft" disabled style="margin-left:6px;opacity:.55" title="'+autoLockHint()+'">Auto 🔒</button>');
  let upBlock='';
  if(atCap){
    upBlock='<div class="chUp"><div class="sub" style="text-align:center">The Thread of Greed is achieved — The chest is pumped to the end.</div></div>';
  } else {
    const adLeft=typeof adSlotLeft==="function"?adSlotLeft("bag_skip"):0;
    const adOk=typeof adSlotOk==="function"&&adSlotOk("bag_skip");
    upBlock='<div class="chUp">'
      +'<div class="chUpHead"><span class="chUpTitle">Drop odds</span><span class="chUpLvl">Lv.'+lvl+' → '+(lvl+1)+'</span></div>'
      +'<div class="chCols"><div class="chCol"><div class="chColT">current</div>'+chestChanceRows(lvl)+'</div>'
      +'<div class="chCol"><div class="chColT">next</div>'+chestChanceRows(lvl+1)+'</div></div>'
      +(nb?('<div class="sub" style="margin-top:6px;text-align:center">up to «'+nb[1]+'»: '+(nb[0]-lvl)+' Lv.</div>'):'')
      +'<div class="sub" style="margin-top:4px;text-align:center;opacity:.75">Odds by bag level · gold upgrades only · no paid gacha</div>'
      +'<div class="chTimer"><div class="chTimerBar"><div class="chTimerFill" style="width:'+timerPct.toFixed(1)+'%"></div></div>'
      +'<span class="sub" id="chTimerLbl">'+timerLbl+'</span></div>'
      +'<div class="btnrow" style="margin-top:8px">'
      +'<button class="btn btn-hard" id="chUpBtn" onclick="chestUpgrade()" '+(atCap||upNow?'disabled':'')+'>'
      +(upNow
        ? ("Running… "+fmtClock(bagUpgradeLeft()*1000))
        : ("Upgrade · "+fmt(c)+" 🪙"))
      +'</button>'
      +'<button id="chSkipBtn" onclick="chestSkip()" '+(upNow?'':'disabled')+' title="skip for gems">Skip ⏩ · 💎'+bagSkipGems()+'</button>'
      +'<button type="button" class="btn btn-soft" onclick="bagSkipAdHour()" '+(upNow&&adOk?'':'disabled')+' title="cut 1 hour">📺 −1h'+(adOk?(' · '+adLeft):'')+'</button>'
      +'</div></div>';
  }
  el.innerHTML='<div class="uiSub" style="margin-bottom:10px">Find Bag · Lv.'+lvl+' · Higher levels improve rarity</div>'
    +'<div class="chOpen">'+openBtn+autoRow+'</div>'
    +pend+upBlock;
  const tit=$("chestTitle"); if(tit) tit.textContent="🧰 "+bagName(lvl);
  const act=$("chestHeadAct"); if(act) act.innerHTML='<span class="uiPill">Lv.'+lvl+'</span>';
}
function bagItemNeedsDecide(it){
  if(!it || it.s==="pet") return false;
  const old=S.gear[it.s];
  if(!old) return true;
  return itemPower(it)>itemPower(old);
}
function openNextBagDecide(opts){
  opts=opts||{};
  if(S.autoRoll){
    if(!opts.quiet) showToast("🎒","Auto on.","","Turn off the Auto to open manually");
    return false;
  }
  if(chestPending){
    if(!opts.quiet){ showToast("🎒","First decide.","","Put on or sell the find."); showDropDecide(); }
    return false;
  }
  if((S.bags||0)<1){
    if(!opts.quiet && !opts.chain) showToast("🎒","No bags","","Bags drop from veins");
    return false;
  }
  let opened=0;
  while((S.bags||0)>=1){
    S.bags--; dailyProgress("bag",1); opened++;
    if(S.ftue&&!S.ftue.c){ S.ftue.c=1; const lc=$("lootChest"); if(lc&&lc.classList) lc.classList.remove("pulse"); }
    const it=makeItem(rollGearSlot().id);
    if(bagItemNeedsDecide(it)){
      chestPending=it;
      Platform.logEvent("chest_open",{r:it.r,quick:opts.quick?1:0,chain:!!opts.chain});
      save(); render();
      if(opts.inChest){ renderChestCard(); }
      else showDropDecide();
      if($("chestModal")&&$("chestModal").style.display==="flex") renderChestCard();
      return true;
    }
    dropGearItem(it, true);
  }
  if(opened){
    flushSales();
    Platform.logEvent("chest_open_batch",{n:opened,auto:1});
    save(); render();
    if(opts.inChest || ($("chestModal")&&$("chestModal").style.display==="flex")) renderChestCard();
  }
  return opened>0;
}
function quickOpenBag(){
  return openNextBagDecide({quick:true});
}
function openChest(forceModal){
  if(S.ftue&&!S.ftue.c){ S.ftue.c=1;
    const lc=$("lootChest"); if(lc&&lc.classList) lc.classList.remove("pulse"); }
  if(!forceModal && (S.bags||0)>0){
    quickOpenBag();
    return;
  }

  if(!forceModal) return;
  renderChestCard(); $("chestModal").style.display="flex";
  try{ if(typeof UIS!=="undefined"&&UIS.setChrome) UIS.setChrome(true); }catch(e){}
  try{ if(typeof updateFtueHint==="function") updateFtueHint(); }catch(e){}
  Platform.logEvent("chest_view",{lv:S.bag});
}
function closeChest(){
  const m=$("chestModal"); if(m) m.style.display="none";
  try{ if(typeof UIS!=="undefined"&&!UIS.id&&UIS.setChrome) UIS.setChrome(false); }catch(e){}
  try{ if(typeof updateFtueHint==="function") updateFtueHint(); }catch(e){}
}
function chestOpenOne(){
  openNextBagDecide({inChest:true});
}
function finishChestDecide(){
  chestPending=null;
  closeDropDecide();
  save(); render();
  const inChest=$("chestModal")&&$("chestModal").style.display==="flex";
  if(inChest) renderChestCard();
  if((S.bags||0)>0 && !S.autoRoll){
    openNextBagDecide({quiet:true, chain:true, quick:!inChest, inChest:!!inChest});
  }
}
function equipChestItem(){
  if(!chestPending) return;
  if(chestPending.s==="pet") chestPending=makeItem(rollGearSlot().id);
  const it=chestPending, old=S.gear[it.s];
  if(it.s==="pick"&&it.n){ S.pickLog=S.pickLog||{}; S.pickLog[it.n]=true; }
  S.gear[it.s]=it;
  if(old){ S.gold+=sellPrice(old); }
  finishChestDecide();
}
function sellChestItem(){
  if(!chestPending) return;
  const it=chestPending, p=sellPrice(it); S.gold+=p;
  finishChestDecide();
}
function chestUpgrade(){
  if(bagUpgrading()){ renderChestCard(); return; }
  if(!startBagUpgrade()) return;
  renderChestCard();
}
function chestSkip(){
  if(!bagUpgrading()){ showToast("⏩","Nothing to skip","","Start an upgrade first"); return; }
  skipBagUpgrade();
  renderChestCard();
}

function openGym(){
  const lv=gymLevel(), xp=S.gymXP||0;
  const nextAt=GYM_LEVELS[lv+1], atCur=GYM_LEVELS[lv]||0;
  const pct=nextAt!=null? Math.min(100, Math.round((xp-atCur)/(nextAt-atCur)*100)) : 100;
  const perks=GYM_PERKS.map(pk=>{ const on=lv>=pk.lv;
    return `<div class="metarow" style="${on?'':'opacity:.45'}"><span>${on?"✓":"🔒"} <b class="${on?'r5':''}">${pk.n}</b> · Lv.${pk.lv}</span>
      <span class="sub">+${pk.pct}% All statues</span></div>`; }).join("");
  metaOpen("🏋 Conference",
    "Level "+lv+" · A bonus to all statues +"+gymPerkPct()+"%. Gym XP: Training, winning PvP, Dilicks, stickers.",
    `<div class="metarow"><span>Gym XP</span><span><b>${fmt(xp)}</b>${nextAt!=null?(" / "+fmt(nextAt)):""}</span></div>
     <div class="setBar"><div style="width:${pct}%;background:var(--gold)"></div></div>
     <div class="sub" style="margin:10px 0 4px">perk Room:</div>${perks}
     <div class="sub" style="margin-top:10px">The clan, chat and wars — online version.</div>`);
  Platform.logEvent("gym_view",{lv});
}
function openStickers(){
  const owned=S.stickers||{};
  const have=STICKERS.filter(s=>(owned[s.id]||0)>0).length;
  const rows=STICKERS.map(s=>{ const c=owned[s.id]||0;
    const nm=statLbl(s.stat);
    return `<div class="metarow" style="${c?'':'opacity:.4'}"><span>${s.ic} <b class="r${s.r}">${s.n}</b>${c>1?(" ×"+c):""}
      <br><span class="sub">${c?"+"+s.val+" "+nm:"not found"}</span></span></div>`;
  }).join("");
  metaOpen("🃏 Stickers",
    "Collected "+have+"/"+STICKERS.length+" · duplicate "+stickerDupes()+". The statues are affected, duplicate They’re all in the room.",
    `<div class="btnrow"><button class="btn btn-hard" onclick="buyStickerPack()" ${(S.gems||0)<STICKER_PACK_GEMS?"disabled":""}>Park ${STICKER_PACK_N} · ${STICKER_PACK_GEMS} 💎</button>
       <button onclick="giftStickers()" ${stickerDupes()<1?"disabled":""}>Give duplicate</button></div>
     <div style="margin-top:10px">${rows}</div>`);
  Platform.logEvent("stickers_view",{});
}
function craftPetExotic(){
  if(!petCraftUnlocked()){ showToast("⚗","Craft closed","","I do. "+BALANCE.petCraft.needLegendaries+" legendary pet","have "+(S.petLegSeen||0)); return false; }
  if((S.gems||0)<BALANCE.petCraft.gems){ showToast("⚗","Few crystals","","Kraft: "+BALANCE.petCraft.gems+" 💎"); return false; }
  for(let t=0;t<PET_TYPES.length;t++) if(boxCountAt(S.petBox,t,3)<1){
    showToast("⚗","Missing material","","I need it. Legendary "+PET_TYPES[t].n); return false; }
  for(let t=0;t<PET_TYPES.length;t++){ const k=boxKey(t,3); S.petBox[k]-=1; if(S.petBox[k]<=0) delete S.petBox[k]; }
  S.gems-=BALANCE.petCraft.gems;
  const nt=Math.floor(Math.random()*PET_TYPES.length);
  boxAdd(S.petBox,nt,4,1); equipBestPet();
  showToast("⚗","KRAFT!","r4",PET_TYPES[nt].n+" (Exotic)","−Under Legendary each · −"+BALANCE.petCraft.gems+" 💎",true);
  Platform.logEvent("pet_craft",{}); try{ jingleSet(); }catch(e){}
  save(); render(); renderGear(); openPets();
  return true;
}
function rollPet(){
  if(!requireFeat("pets")) return;
  if((S.eggs||0)<1){
    if(adSlotOk("pet_roll")){
      offerAdReward("pet_roll", ()=>{ S.eggs=(S.eggs||0)+1; rollPet(); }, {limitMsg:"egg for today’s ads."});
      return;
    }
    showToast("🥚","No eggs.","","egg — c vein · or 📺 for roll"); return;
  }
  S.eggs--;
  const r=rollRarity(geoWeights(S.petRolls||0)); S.petRolls=(S.petRolls||0)+1;
  const t=Math.floor(Math.random()*PET_TYPES.length);
  boxAdd(S.petBox,t,r,1);
  if(r===3) S.petLegSeen=(S.petLegSeen||0)+1;
  const wasBetter=!S.pet||r>S.pet.r||(r===S.pet.r&&PET_TYPES[t].pct[r]>PET_TYPES[S.pet.t].pct[S.pet.r]);
  equipBestPet();
  showToast(petIcon(t),PET_RAR[r],"r"+r,PET_TYPES[t].n,
    wasBetter?("I’m a little bit of a girl, but I’m a little bit of a girl. +"+PET_TYPES[t].pct[r]+"% "+PET_TYPES[t].stat.toUpperCase())
             :("to collection · Copys: "+boxCountAt(S.petBox,t,r)));
  Platform.logEvent("pet_roll",{r}); sfxGear(); save(); render(); renderGear(); openPets();
  try{ unlockPlayAchievement("first_pet"); }catch(e){}
}

const WK_PATH_NAME=STAT_LBL;
let _wkRefreshT=0, _drinkCdUntil=0;
function workoutCost(path){
  const W=BALANCE.workouts, lv=(S.workouts&&S.workouts[path])||0;
  return (W.costBase||10)+(W.costPerLv||5)*lv;
}
function mugTier(){
  ensureWorkouts(S);
  const M=(BALANCE.workouts&&BALANCE.workouts.mug)||[{mul:1}];
  const i=Math.min(S.mugLv|0, M.length-1);
  return {i, mul:(M[i].mul||1), next:i+1<M.length?M[i+1]:null, max:i>=M.length-1};
}
function mugDrinkCost(){ return (BALANCE.workouts.drinkCost|5)*mugTier().mul; }
function mugDrinkPts(){ return (BALANCE.workouts.drinkPts|5)*mugTier().mul; }
function upgradeMug(){
  ensureWorkouts(S);
  const t=mugTier();
  if(t.max||!t.next){ showToast("🍺","mug Maximum","","×"+t.mul+" For a sip."); return false; }
  const cost=t.next.gems|0;
  if((S.gems||0)<cost){ showToast("💎","Few crystals","","need "+cost+" 💎, have "+fmt(S.gems||0)); return false; }
  S.gems-=cost;
  S.mugLv=(S.mugLv|0)+1;
  const mul=mugTier().mul;
  showToast("🍺","mug Yes!","","Now. ×"+mul+" For the slip.","−"+cost+" 💎");
  Platform.logEvent("mug_upgrade",{lv:S.mugLv,mul,cost});
  sfxGear(); save(); render();
  if(typeof UIS!=="undefined" && UIS.id==="tavern") UIS.render();
  const mm=$("metaModal");
  if(mm&&mm.style.display==="flex"&&($("metaTitle")||{}).textContent==="Training") openWorkouts();
  if(_skillsShellTab==="train") openSkills("train");
  return true;
}
function drinkBeer(){
  ensureWorkouts(S);
  const W=BALANCE.workouts, mul=mugTier().mul;
  const cost=(W.drinkCost|0)*mul, pts=(W.drinkPts|0)*mul;
  if(Date.now()<_drinkCdUntil){ showToast("🍺","Swallow","","Wait a moment."); return false; }
  if((S.protein||0)<cost){ showToast("🍺","Not enough beer.","","need "+cost+" 🍺, have "+Math.floor(S.protein||0)); return false; }
  S.protein-=cost;
  S.wkPts=(S.wkPts||0)+pts;
  _drinkCdUntil=Date.now()+Math.round((W.drinkCdSec||1.2)*1000);
  const mug=$("aleMug");
  if(mug){
    mug.src=MUG_ICON;
    mug.classList.remove("sip"); void mug.offsetWidth; mug.classList.add("sip");
    clearTimeout(drinkBeer._t); drinkBeer._t=setTimeout(()=>mug.classList.remove("sip"),2450);
  }
  aleAnim=2.4;
  const eGain=0.08*Math.min(mul,5);
  S.energy=Math.min(stat("energy"), S.energy+stat("energy")*eGain);
  dailyProgress("drink",mul);
  sayQuip(beerLoreQuip(), 4);
  jingleFind();
  showToast("🍺",mul>1?("Screw you. ×"+mul):"Drink","r1","+"+pts+" Training point","Total "+(S.wkPts|0));
  Platform.logEvent("ale_drink",{pts, cost, mul});
  save(); render();
  const onTrain=typeof UIS!=="undefined" && UIS.id==="panel"
    && (/Training|skill/.test(($("uiTitle")&&$("uiTitle").textContent)||""));
  const mm=$("metaModal");
  if(_skillsShellTab==="train" || onTrain || (mm&&mm.style.display==="flex"&&($("metaTitle")||{}).textContent==="Training")) refreshWorkoutsUi();
  if(typeof UIS!=="undefined" && UIS.id==="tavern") UIS.render();
  return true;
}
function workoutsPanelHtml(){
  ensureWorkouts(S);
  const W=BALANCE.workouts, beer=Math.floor(S.protein||0), pts=S.wkPts|0;
  const drinkCost=mugDrinkCost(), drinkPts=mugDrinkPts(), mul=mugTier().mul;
  const canDrink=beer>=drinkCost && Date.now()>=_drinkCdUntil;
  const head=`<div class="metarow" style="align-items:stretch;gap:8px">
    <div style="flex:1;text-align:center;padding:8px;background:#120e0a;border:1px solid #5a4830;border-radius:8px">
      <div style="font-size:11px;color:var(--dim)">Beer</div>
      <div style="font-size:22px;color:var(--gold);font-family:var(--font-display)">🍺 ${beer}</div>
      <div style="font-size:10px;color:var(--dim)">+${W.proteinPerHour}/a/ · Cap ${W.proteinCapH*W.proteinPerHour}</div>
    </div>
    <div style="flex:1;text-align:center;padding:8px;background:#120e0a;border:1px solid #5a4830;border-radius:8px">
      <div style="font-size:11px;color:var(--dim)">Training glasses</div>
      <div style="font-size:22px;color:#8fce6a;font-family:var(--font-display)">💪 ${pts}</div>
      <div style="font-size:10px;color:var(--dim)">mug ×${mul}</div>
    </div>
  </div>
  <button class="btn btn-hard btn-wide" style="margin:8px 0 12px;min-height:48px;font-size:16px"
    onclick="drinkBeer()" ${canDrink?"":"disabled"}>Drink <img class="uiMugArt sm" src="art/ic_mug.png?v=2" alt="">${drinkCost} → +${drinkPts} - Okay.</button>`;
  const rows=BALANCE.workoutPaths.map((p,i)=>{
    const lv=(S.workouts&&S.workouts[p])||0;
    const active=S.wkActive&&S.wkActive.path===p;
    const cost=workoutCost(p);
    const maxed=lv>=(W.maxLv||W.step||50);
    const nm=WK_PATH_NAME[p]||p.toUpperCase();
    let btn;
    if(active){
      const left=Math.max(0,Math.ceil((S.wkActive.end-Date.now())/1000));
      const skip=W.skipGems||5;
      btn=left>0
        ?`<button class="btn btn-soft" onclick="skipWorkout()">⏱ ${left}c · 💎${skip}</button>`
        :`<button class="btn btn-soft" onclick="claimWorkout()">Claim +${BALANCE.workoutStepPct[i]}%</button>`;
    } else if(maxed){
      btn=`<button class="btn btn-soft" disabled>MAX</button>`;
    } else {
      btn=`<button class="btn btn-soft" onclick="startWorkout('${p}')" ${pts<cost||S.wkActive?"disabled":""}>+${BALANCE.workoutStepPct[i]}% · 💪${cost}</button>`;
    }
    return `<div class="metarow"><span><b>${nm}</b> · Lv.${lv}<br><span style="color:var(--dim)">Post. · Now. +${workoutBonus(p)}%</span></span>${btn}</div>`;
  }).join("");
  return head+rows;
}
function refreshWorkoutsUi(){
  if(_skillsShellTab==="train") openSkills("train");
  else openWorkouts();
}
function workoutsBindRefresh(){
  clearInterval(_wkRefreshT);
  if(!S.wkActive){ _wkRefreshT=0; return; }
  _wkRefreshT=setInterval(()=>{
    if(_skillsShellTab==="train"){
      const on=typeof UIS!=="undefined" && UIS.id==="panel"
        && /skill/.test(($("uiTitle")&&$("uiTitle").textContent)||"");
      if(!on){ clearInterval(_wkRefreshT); _wkRefreshT=0; return; }
      if(!S.wkActive){ clearInterval(_wkRefreshT); _wkRefreshT=0; openSkills("train"); return; }
      openSkills("train");
      return;
    }
    const m=$("metaModal"), ttl=$("metaTitle");
    const onPanel=typeof UIS!=="undefined" && UIS.id==="panel"
      && /Training/.test(($("uiTitle")&&$("uiTitle").textContent)||"");
    if(!onPanel && (!m||m.style.display!=="flex"||!ttl||ttl.textContent!=="Training")){
      clearInterval(_wkRefreshT); _wkRefreshT=0; return;
    }
    if(!S.wkActive){ clearInterval(_wkRefreshT); _wkRefreshT=0; openWorkouts(); return; }
    openWorkouts();
  },1000);
}
function openWorkouts(){
  ensureWorkouts(S);
  _skillsShellTab=null;
  clearInterval(_wkRefreshT);
  metaOpen("Training",
    "Drink it. beer → Get your glasses. → - I’m sorry, but I’m not sure. +"+BALANCE.workouts.proteinPerHour+" 🍺/p.m.",
    workoutsPanelHtml());
  workoutsBindRefresh();
}
function startWorkout(path){
  ensureWorkouts(S);
  if(S.wkActive){ showToast("💪","You’re already training.","",WK_PATH_NAME[S.wkActive.path]||S.wkActive.path); return false; }
  if(BALANCE.workoutPaths.indexOf(path)<0) return false;
  const W=BALANCE.workouts, lv=(S.workouts&&S.workouts[path])||0;
  if(lv>=(W.maxLv||W.step||50)){ showToast("🔒","Ceiling of the road","",WK_PATH_NAME[path]||path); return false; }
  const cost=workoutCost(path);
  if((S.wkPts||0)<cost){ showToast("💪","Few points","","need "+cost+", have "+(S.wkPts|0)+" · Have a beer."); return false; }
  S.wkPts-=cost;
  S.wkActive={path, end:Date.now()+Math.round((W.timerSec||30)*1000)};
  Platform.logEvent("workout_start",{path,cost});
  showToast("💪","Training", "", WK_PATH_NAME[path]||path, "−"+cost+" - Okay.");
  save(); render(); refreshWorkoutsUi();
  return true;
}
function claimWorkout(){
  if(!S.wkActive||Date.now()<S.wkActive.end) return false;
  const p=S.wkActive.path; S.workouts=S.workouts||{}; S.workouts[p]=(S.workouts[p]||0)+1;
  S.wkActive=null;
  S.chestKeys=(S.chestKeys||0)+1;
  addGymXP(GYM_XP.perWorkout);
  dailyProgress("feast",1);
  showToast("🗝","The key to the bark","","Training is over. · +"+workoutBonus(p)+"% "+(WK_PATH_NAME[p]||p),"All keys: "+S.chestKeys);
  sfxGear(); Platform.logEvent("workout_done",{path:p}); save(); render(); renderGear(); refreshWorkoutsUi();
  return true;
}
function skipWorkout(){
  const W=BALANCE.workouts, cost=W.skipGems||5;
  if(!S.wkActive) return false;
  if((S.gems||0)>=cost){
    S.gems-=cost; S.wkActive.end=Date.now();
    save(); render(); refreshWorkoutsUi();
    return true;
  }
  if(adSlotOk("workout_skip")){
    offerAdReward("workout_skip", ()=>{
      if(!S.wkActive) return;
      S.wkActive.end=Date.now();
      showToast("📺","Training speeded up","","Take the key.");
      save(); render(); refreshWorkoutsUi();
    });
    return true;
  }
  showToast("💎","Few crystals","","need "+cost+" or 📺");
  return false;
}
function workoutBonus(id){ const lv=(S.workouts&&S.workouts[id])||0; if(!lv) return 0;
  const i=BALANCE.workoutPaths.indexOf(id); return i<0?0:BALANCE.workoutStepPct[i]*lv; }

function dailyReset(){ const t=todayStr(); if(!S.daily) S.daily={day:t,prog:{},tok:0,claimed:[],adTok:false,boostUsed:false};
  if(S.daily.day!==t){ S.daily={day:t,prog:{},tok:0,claimed:[],adTok:false,boostUsed:false}; }
  if(S.daily.adTok==null) S.daily.adTok=false;
  if(S.daily.boostUsed==null) S.daily.boostUsed=false; }
function dailyBoostQuest(qid){
  dailyReset();
  if(S.daily.boostUsed){ showToast("📺","Already used","","1 Daydale bashing."); return; }
  const q=BALANCE.dailyQuests.find(x=>x.id===qid); if(!q) return;
  const cur=S.daily.prog[qid]||0;
  if(cur>=q.need){ showToast("📕","Already ready.","","Quest accomplished"); return; }
  offerAdReward("daily_boost", ()=>{
    dailyReset();
    S.daily.boostUsed=true;
    S.daily.prog[qid]=q.need;
    showToast("📺","Delick is closed.","","«"+q.n+"» implemented");
    Platform.logEvent("daily_boost",{id:qid});
    save(); render(); openDaily();
  }, {limitMsg:"The Daily for the Advertisement for Today"});
}
function dailyQuestMaxTok(){
  return BALANCE.dailyQuests.reduce((s,q)=>s+(q.tok|0),0)+(BALANCE.dailyAdTok|0);
}
function dailyProgress(id,amt){ dailyReset(); const q=BALANCE.dailyQuests.find(x=>x.id===id); if(!q) return;
  const p=S.daily.prog; const was=p[id]||0; if(was>=q.need) return;
  p[id]=was+amt;
  if(p[id]>=q.need && was<q.need){
    S.daily.tok+=q.tok;
    showToast("✓","Mission!","",q.ic?q.ic+" "+q.n:q.n,"+"+q.tok+" Piece of cakes");
  }
}
function openDaily(){
  if(!requireFeat("daily")) return;
  dailyReset();
  const maxTok=dailyQuestMaxTok();
  const tok=S.daily.tok||0;
  const doneN=BALANCE.dailyQuests.filter(q=>(S.daily.prog[q.id]||0)>=q.need).length;
  const tip=[
    "Borin: beer Not for beauty. — Save your glasses. — Kick it. feast.",
    "Borin: vein without impact — How mug No foam. pickaxe.",
    "Borin She whispers: elder Remembers those who don’t forget comb.",
    "Borin: Winners drink in the arena. — water."
  ][(Math.floor(Date.now()/60000)+doneN)%4];
  const head='<div style="padding:10px 8px;margin-bottom:8px;background:#120e0a;border:1px solid #5a4830;border-radius:10px">'
    +'<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">'
    +'<span style="font-family:var(--font-display);color:var(--gold);font-size:15px">The Chest Tonight</span>'
    +'<b style="color:var(--gold)">'+tok+'</b><span style="color:var(--dim);font-size:12px">/ '+maxTok+'</span></div>'
    +'<div class="uiBar" style="margin-top:6px"><div class="uiBarFill" style="width:'+Math.min(100,tok/150*100)+'%;background:linear-gradient(90deg,#8a5a28,#e0b35a)"></div></div>'
    +'<div style="margin-top:6px;font-size:11px;color:var(--dim)">Done '+doneN+'/'+BALANCE.dailyQuests.length
    +' · track to 150 · Publicity +'+(BALANCE.dailyAdTok|30)+'</div></div>'
    +'<div style="padding:8px 10px;margin-bottom:10px;border:1px dashed #6a5438;border-radius:8px;font-size:12px;color:#c9a66a;line-height:1.35">'
    +esc(tip)+'</div>';
  let boostQid=null;
  if(!S.daily.boostUsed && typeof adSlotOk==="function" && adSlotOk("daily_boost")){
    const pending=BALANCE.dailyQuests.find(q=>(S.daily.prog[q.id]||0)<q.need);
    if(pending) boostQid=pending.id;
  }
  const qrows=BALANCE.dailyQuests.map(q=>{
    const p=Math.min(S.daily.prog[q.id]||0,q.need);
    const ok=p>=q.need, pct=Math.round(p/q.need*100);
    const boostBtn=(q.id===boostQid)
      ? ('<button class="btn btn-soft" style="margin-top:4px;font-size:11px;padding:4px 8px" onclick="dailyBoostQuest(\''+q.id+'\')">📺 Close for advertising</button>')
      : "";
    return '<div class="metarow" style="align-items:flex-start;flex-direction:column;gap:4px">'
      +'<div style="display:flex;width:100%;justify-content:space-between;gap:8px;align-items:flex-start">'
      +'<span><b>'+(q.ic||"·")+' '+esc(q.n)+'</b><br>'
      +'<span style="color:var(--dim);font-size:11px">'+(q.lore?esc(q.lore)+" · ":"")+p+'/'+q.need+'</span></span>'
      +'<span style="color:'+(ok?"var(--green)":"var(--gold)")+';white-space:nowrap">'+(ok?"✓ +"+q.tok:"+"+q.tok+" (Signed) J. J. W. M. M.")+'</span></div>'
      +'<div class="uiBar" style="width:100%"><div class="uiBarFill" style="width:'+pct+'%;background:'+(ok?"#4a9a5a":"#8a6230")+'"></div></div>'
      +boostBtn
      +'</div>';
  }).join("");
  const trows='<div style="margin:10px 0 4px;font-size:12px;color:var(--dim);letter-spacing:.4px">PIECE OF CAKES</div>'
    +BALANCE.dailyTrack.map(([need,rew],i)=>{
      const done=(S.daily.claimed||[]).includes(i), can=tok>=need && !done;
      return '<div class="metarow"><span>'+need+' (Signed) J. J. W. M. M. → '+esc(rew)+'</span>'
        +(done?'<span style="color:var(--green)">✓</span>'
          :'<button class="btn btn-soft" onclick="claimDaily('+i+','+need+')" '+(can?"":"disabled")+'>Claim</button>')
        +'</div>';
    }).join("");
  const adTok=BALANCE.dailyAdTok|30;
  const adDone=!!S.daily.adTok;
  const ad='<div class="metarow" style="margin-top:6px"><span>📺 Promotion · +'+adTok+' Piece of cakes'
    +'<br><span style="color:var(--dim);font-size:11px">1 once a day · The track is still pressing.</span></span>'
    +(adDone?'<span style="color:var(--green)">✓</span>'
      :'<button class="btn btn-soft" onclick="claimDailyAd()">Watch</button>');
  metaOpen("Daileks",
    "Change with dawn · Burn beer, rock the artel, hit vein",
    head+qrows+'<div style="height:6px"></div>'+trows+ad);
}
function claimDailyAd(){
  dailyReset();
  if(S.daily.adTok){ showToast("📺","Already taken.","","tomorrow again."); return; }
  const grant=()=>{
    dailyReset();
    if(S.daily.adTok) return;
    S.daily.adTok=true;
    const n=BALANCE.dailyAdTok|30;
    S.daily.tok=(S.daily.tok||0)+n;
    showToast("📺","Chestnuts!","","+"+n+" To the dilick track");
    Platform.logEvent("daily_ad",{tok:n});
    save(); render(); openDaily();
  };
  try{
    if(Platform&&Platform.showRewarded){ Platform.showRewarded(ok=>{ if(ok) grant(); }, "daily_tok"); return; }
  }catch(e){}
  grant();
}
function claimDaily(i,need){ dailyReset(); if((S.daily.tok||0)<need||(S.daily.claimed||[]).includes(i)) return;
  S.daily.claimed.push(i); addGymXP(GYM_XP.perDaily);
  const G=BALANCE.gacha||{};
  if(i===0){ S.keys=(S.keys||0)+1; S.chestKeys=(S.chestKeys||0)+1; }
  else if(i===1){ S.eggs=(S.eggs||0)+(G.eggDailyReward||3); showToast("🥚","Award","","+"+(G.eggDailyReward||3)+" egg"); }
  else if(i===2) S.gems+=50;
  else { S.combs=(S.combs||0)+(G.combDailyReward||2); S.gold+=veinReward()*50;
    showToast("🪮","Award","","+"+(G.combDailyReward||2)+" comb · +"+fmt(veinReward()*50)+" 🪙"); }
  Platform.logEvent("daily_claim",{i}); save(); render(); openDaily(); }

function fpStoreOpened(){
  try{ Platform.logEvent("iap_open_store", {}); }catch(e){}
  try{
    if(!(S.growth&&S.growth.starterBought))
      Platform.logEvent("iap_offer", { type_offer:"starter", product:"starter_pack", offer_name:"starter" });
  }catch(e){}
}
function iapCatalog(productId){
  const gems=BALANCE.shop.gemPacks||[];
  const packs=BALANCE.shop.comeback||[];
  const table={
    gems_1999:{ amt:"19.99", product:"gems", name:"gems", rewards:{gems:gems[0]||0} },
    gems_5999:{ amt:"59.99", product:"gems", name:"gems", rewards:{gems:gems[1]||0} },
    gems_19999:{ amt:"199.99", product:"gems", name:"gems", rewards:{gems:gems[2]||0} },
    pack_699:{ amt:"6.99", product:"pack", name:"pack", rewards:{gems:packs[0]?packs[0][0]:0, gold:packs[0]?packs[0][1]:0} },
    pack_1699:{ amt:"16.99", product:"pack", name:"pack", rewards:{gems:packs[1]?packs[1][0]:0, gold:packs[1]?packs[1][1]:0} },
    pack_2499:{ amt:"24.99", product:"pack", name:"pack", rewards:{gems:packs[2]?packs[2][0]:0, gold:packs[2]?packs[2][1]:0} },
    noads_4999:{ amt:String(BALANCE.noAdsPrice), product:"no_ads", name:"no_ads", rewards:{} },
    starter_pack_499:{ amt:"4.99", product:"starter_pack", name:"starter", rewards:{
      gems:BALANCE.growth.starterPack.gems, gold:BALANCE.growth.starterPack.gold, bags:BALANCE.growth.starterPack.bags
    } }
  };
  return table[productId]||{ amt:"0", product:productId, name:productId, rewards:{} };
}
function iapParams(productId, extra){
  const m=iapCatalog(productId);
  return Object.assign({
    sku:productId, product:m.product, iap_name:m.name, iap_category:"shop",
    iap_rewards:m.rewards, iap_store:"google_play", iap_show_trigger:"manual",
    iap_show_type:"manual", placement:"shop", cur:"USD",
    amt_cur:m.amt, amt_usd:m.amt, is_subscription:0
  }, extra||{});
}
function openShop(){
  fpStoreOpened();
  const gems=BALANCE.shop.gemPacks.map((g,i)=>`<div class="metarow"><span>💎 ${g} crystals</span><button class="btn btn-hard" onclick="buyGems(${i})">$${[19.99,59.99,199.99][i]}</button></div>`).join("");
  const cb=BALANCE.shop.comeback.slice(0,3).map(([g,gold],i)=>`<div class="metarow"><span>Pack: 💎${g} + 🪙${fmt(gold)}</span><button class="btn btn-hard" onclick="buyPack(${i})">$${[6.99,16.99,24.99][i]}</button></div>`).join("");
  const na=S.noAds?"<div class='metarow'><span>✓ The ad’s offline.</span></div>":`<div class="metarow"><span>Disable advertising</span><button class="btn btn-hard" onclick="buyNoAds()">$${BALANCE.noAdsPrice}</button></div>`;
  metaOpen("Shop","gems, paki and calm without advertising",gems+"<div style='height:8px'></div>"+cb+na);
}
function shopFreeReset(){
  ensureBags(S);
  const t=todayStr();
  if(!S.shopFree||S.shopFree.day!==t) S.shopFree={day:t,taken:{}};
}
function shopDailyDef(id){
  const D=BALANCE.shopDaily||{};
  return D[id]||null;
}
function shopDailyKeys(){
  return Object.keys(BALANCE.shopDaily||{});
}
function shopDailyTaken(id, viaAd){
  shopFreeReset();
  return !!(S.shopFree.taken&&S.shopFree.taken[id+(viaAd?"_ad":"_free")]);
}
function shopDailyAnyLeft(id){
  if(id) return !shopDailyTaken(id,false)||!shopDailyTaken(id,true);
  return shopDailyKeys().some(k=>shopDailyAnyLeft(k));
}
function grantShopStickers(n){
  S.stickers=S.stickers||{};
  const got=[];
  for(let i=0;i<(n|0);i++){
    const s=STICKERS[Math.floor(Math.random()*STICKERS.length)];
    S.stickers[s.id]=(S.stickers[s.id]||0)+1;
    got.push(s.ico? (s.ico+" "+(s.n||s.id)) : (s.n||s.id));
  }
  return got;
}
function applyShopReward(rew){
  if(!rew) return "";
  const parts=[];
  let gold=rew.gold|0;
  if(rew.goldMul) gold+=Math.max(1, Math.round(veinReward()*rew.goldMul));
  if(gold){ S.gold=(S.gold||0)+gold; parts.push("+"+fmt(gold)+" 🪙"); }
  if(rew.gems){ S.gems=(S.gems||0)+rew.gems; parts.push("+"+rew.gems+" 💎"); }
  if(rew.bags){ grantBags(rew.bags); parts.push("+"+rew.bags+" 🎒"); }
  if(rew.eggs){ S.eggs=(S.eggs||0)+rew.eggs; parts.push("+"+rew.eggs+" 🥚"); }
  if(rew.combs){ S.combs=(S.combs||0)+rew.combs; parts.push("+"+rew.combs+" 🪮"); }
  if(rew.protein){ S.protein=(S.protein||0)+rew.protein; parts.push("+"+rew.protein+" 🍺"); }
  if(rew.chestKeys){ S.chestKeys=(S.chestKeys||0)+rew.chestKeys; parts.push("+"+rew.chestKeys+" 🗝"); }
  if(rew.stickers){
    const g=grantShopStickers(rew.stickers);
    if(g.length) parts.push(g.join(" · "));
  }
  return parts.join(" · ");
}
function shopRewardPreview(rew){
  if(!rew) return "";
  const parts=[];
  if(rew.gold||rew.goldMul){
    const g=(rew.gold|0)+(rew.goldMul?Math.max(1,Math.round(veinReward()*rew.goldMul)):0);
    parts.push("+"+fmt(g)+" 🪙");
  }
  if(rew.gems) parts.push("+"+rew.gems+" 💎");
  if(rew.bags) parts.push("+"+rew.bags+" 🎒");
  if(rew.eggs) parts.push("+"+rew.eggs+" 🥚");
  if(rew.combs) parts.push("+"+rew.combs+" 🪮");
  if(rew.protein) parts.push("+"+rew.protein+" 🍺");
  if(rew.chestKeys) parts.push("+"+rew.chestKeys+" 🗝");
  if(rew.stickers) parts.push("Artifact ×"+rew.stickers);
  return parts.join(" · ");
}
function claimShopFree(offerId, viaAd){
  shopFreeReset();
  const def=shopDailyDef(offerId);
  if(!def){ showToast("🎁","No loper.","",String(offerId)); return; }
  const key=offerId+(viaAd?"_ad":"_free");
  if(S.shopFree.taken[key]){ showToast("🎁","Already taken.","","Tomorrow again. · Go to another section."); return; }
  const rew=viaAd?def.ad:def.free;
  const grant=()=>{
    S.shopFree.taken[key]=1;
    const line=applyShopReward(rew);
    showToast(def.ic||"🎁", viaAd?"For advertising":"Free of charge", "", def.title, line||"received", true);
    Platform.logEvent("shop_free",{offerId,viaAd:!!viaAd,tab:offerId});
    save(); render();
    if(typeof UIS!=="undefined"&&UIS.id==="shop") UIS.render("shop");
  };
  if(viaAd){
    try{ if(Platform&&typeof Platform.showRewarded==="function"){
      Platform.showRewarded(function(ok){ if(ok) grant(); }, "shop_free_"+offerId);
      return;
    } }catch(e){}
  }
  grant();
}

function shopDailyCardHtml(id){
  const def=shopDailyDef(id); if(!def) return "";
  const freeDone=shopDailyTaken(id,false), adDone=shopDailyTaken(id,true);
  const freePrev=shopRewardPreview(def.free), adPrev=shopRewardPreview(def.ad);
  return '<div class="uiCard shopDaily">'
    +'<div class="uiCardIc">'+(def.ic||"🎁")+'</div>'
    +'<div class="uiCardBody"><b>'+esc(def.title)+'</b>'
    +'<div class="uiSub">'+(def.sub?esc(def.sub)+" · ":"")+'Daily discharge</div>'
    +'<div class="uiBtnStack" style="margin-top:8px">'
    +'<button type="button" class="btn btn-soft" onclick="claimShopFree(\''+id+'\',false)" '+(freeDone?"disabled":"")+'>'
    +(freeDone?"✓ free of charge":("Free of charge · "+freePrev))+'</button>'
    +'<button type="button" class="btn btn-hard" onclick="claimShopFree(\''+id+'\',true)" '+(adDone?"disabled":"")+'>'
    +(adDone?"✓ Publicity":("× Publicity · "+adPrev))+'</button>'
    +'</div></div></div>';
}
function requestPurchase(productId, grant){
  const native=(typeof diggyNative==="function")?diggyNative():null;
  if(native && typeof native.purchase==="function"){
    const id="iap"+((Platform._n=(Platform._n||0)+1));
    Platform._cbs=Platform._cbs||{};
    Platform._cbs[id]=function(ok){
      if(ok) grant();
      else try{ Platform.logEvent("iap_buy_error", iapParams(productId, { error_text:"declined" })); }catch(e){}
    };
    try{ native.purchase(productId, id); }catch(e){ delete Platform._cbs[id]; }
    return;
  }
  Platform.buy(productId);
  grant();
}
function applyShopPurchase(productId, opts){
  opts=opts||{};
  try{
    const p=iapParams(productId);
    Platform.logEvent("iap_buy", { placement:p.placement, sku:p.sku, cur:p.cur, amt_cur:p.amt_cur, product:p.product, amt_usd:p.amt_usd });
    Platform.logEvent("iap_buy_ok", p);
  }catch(e){}
  if(productId==="gems_1999"||productId==="gems_5999"||productId==="gems_19999"){
    const i={gems_1999:0,gems_5999:1,gems_19999:2}[productId];
    growthTrackPurchase([1999,5999,19999][i], productId);
    S.gems+=BALANCE.shop.gemPacks[i];
    showToast("💎","Purchase","",BALANCE.shop.gemPacks[i]+" crystals","Thank you!");
    save(); render(); if(!opts.quiet) openShop();
    return;
  }
  if(productId==="pack_699"||productId==="pack_1699"||productId==="pack_2499"){
    const i={pack_699:0,pack_1699:1,pack_2499:2}[productId];
    growthTrackPurchase([699,1699,2499][i], productId);
    const [g,gold]=BALANCE.shop.comeback[i];
    S.gems+=g; S.gold+=gold;
    showToast("🎁","Pack bought","","+"+g+"💎 +"+fmt(gold)+"🪙","Thank you!");
    save(); render(); if(!opts.quiet) openShop();
    return;
  }
  if(productId==="noads_4999"){
    growthTrackPurchase(Math.round(parseFloat(BALANCE.noAdsPrice)*100), productId);
    S.noAds=true;
    try{ Platform.syncAds(); }catch(e){}
    showToast("🚫","No advertising","","Advertisement disabled","Thank you!");
    save(); render(); if(!opts.quiet) openShop();
    return;
  }
  if(productId==="starter_pack_499"){
    ensureGrowth(S);
    if(S.growth.starterBought) return;
    const p=BALANCE.growth.starterPack;
    growthTrackPurchase(p.cents, productId);
    S.gems=(S.gems||0)+p.gems; S.gold=(S.gold||0)+p.gold; S.bags=(S.bags||0)+p.bags;
    S.loot2xUntil=Date.now()+p.loot2xMin*60000; S.growth.starterBought=true;
    showToast("🎁","Start pack","","+"+p.gems+" 💎 · Repayment rate D1");
    Platform.logEvent("starter_pack",{}); save(); render();
    if(!opts.quiet && typeof UIS!=="undefined"&&UIS.id==="shop") UIS.render("shop");
  }
}
function buyGems(i){ const id="gems_"+[1999,5999,19999][i]; try{ Platform.logEvent("iap_buy_click", iapParams(id)); }catch(e){} requestPurchase(id, function(){ applyShopPurchase(id); }); }
function buyPack(i){ const id="pack_"+[699,1699,2499][i]; try{ Platform.logEvent("iap_buy_click", iapParams(id)); }catch(e){} requestPurchase(id, function(){ applyShopPurchase(id); }); }
function buyNoAds(){ try{ Platform.logEvent("iap_buy_click", iapParams("noads_4999")); }catch(e){} requestPurchase("noads_4999", function(){ applyShopPurchase("noads_4999"); }); }
function buyStarterPack(){
  ensureGrowth(S);
  if(S.growth.starterBought){ showToast("🎁","Already bought.","","Start pack — one-time"); return; }
  try{ Platform.logEvent("iap_buy_click", iapParams("starter_pack_499")); }catch(e){}
  requestPurchase("starter_pack_499", function(){ applyShopPurchase("starter_pack_499"); });
}

let aleNext=25+Math.random()*20, aleAnim=0;
const ALE_QUIPS=["To the mountain! *Sip*","beer I’m honest.","Ahh. beerThe barn didn’t fail!","Dust in the throat — No trouble.","One sip for Grandpa."];

const EX_QUIPS=[
  "The ex said, beard It’s coming down. beard Longer than our relationship.",
  "I hope his ears are cold!",
  "My ex was like a rare stone: glitter, dig. — I’m just a debt.",
  "I remember her eyes... and her name. — No, El’s guilty, I guess.",
  "She said, “Pick a place. — Me or pickaxe». pickaxe At least the brain’s not drinking.",
  "To the courtfigh of the third hall! pickaxe I’ve been beating more painfully than words.",
  "The ex left with my gold. beard I’m here, huh!",
  "She wanted a diamond, I found it, for herself, the right decision.",
  "They say the courtfichiers love the rich, so I’m almost irresistible!",
  "They got divorced because of snoring. — How cave-inOf course."
];
const BORIN_GOSSIP_QUIPS=[
  "Crystals hallSomeone switched the Mifrill with a red glass again.",
  "Tan from the fifth hall He swears he was arguing with Gora personally.",
  "Yup. trader Nori’s purse is thicker than his conscience, so his scales are crooked.",
  "In the Besdnas, they found a helmet without a courtman, Casca was more sober than the master.",
  "The arena has a new champion, but he drinks like an elf, and he won’t last long.",
  "I was sitting here yesterday, and I told him the stones were talking to him.",
  "They say, “In mine The zoo of the rat stole egg petRat’s the champion of the arena now.",
  "Nori swears he’s honest. — Until he sees someone else. bag.",
  "Someone leaked a legendary geologist into an artifact... and then cried into the same one. mug.",
  "Third hall They’re arguing again, whose beard Longer. — Ale is over."
];
const BORIN_LORE_QUIPS=[
  "The first pillar in these caves was assembled from a broken wagon and doors of an old mine.",
  "If you can hear ale dripping in silence, it’s just somewhere close to you. vein.",
  "The old clans measured wealth not with gold, but with how many cups would survive the victory.",
  "beard It’s not from years, but from depths you haven’t flickered at.",
  "Used to be ale so much in Podgorne Fire they could clean pickaxe.",
  "Mountain has a longer memory than any beardEverything she’s got is fair, she’s returning it to her.",
  "The deylic jeton. — It’s not a coin. It’s an oath.",
  "Artelle. elder Remembers names. — Shame on the clan, no combing.",
  "feast It’s not the muscles that rock. — Respect. Mountain counts as louder than gold.",
  "They say the first cup was taken out of the pickaxe The fallen champion, drank from it only standing."
];
const BORIN_JOKE_QUIPS=[
  "The ex said, beard It’s coming down. beard Longer than our relationship.",
  "I hope his ears are cold!",
  "My ex was like a rare stone: glitter, dig. — I’m just a debt.",
  "She said, “Pick a place. — Me or pickaxe». pickaxe At least the brain’s not drinking.",
  "The ex left with my gold. beard I’m here, huh!",
  "She wanted a diamond, I found it, for herself, the right decision.",
  "They got divorced because of snoring. — How cave-inOf course.",
  "Elf ordered a “low down.“ He poured water. He got offended. Me too.",
  "The client asked, “Is this kraft?“ I said, “It’s mountain.“ He nodded like a smart guy.",
  "I’ve been drinking to health. digI am — behind him with mug."
];
const BORIN_HINT_QUIPS=[
  "beer Not for beauty. — Save your glasses. — Kick it. feast.",
  "The stand remembers everyone. Respect grows from training., PvP And the dilicks.",
  "Inset skill It’s cheaper on the leaf. — beer glasses, glasses are strong.",
  "Empty mug is not applicable: +5 🍺/- He’s dripping himself while you’re in dig.",
  "Auto-sip in dig It happens too. — Mountain He doesn’t like dry sips.",
  "Deylicks’ rackets — You can get the track, and the ad goes into the cup once a day."
];
function beerLoreQuip(){
  const roll=Math.random();
  const pool=roll<0.22 ? ALE_QUIPS
    : roll<0.48 ? BORIN_JOKE_QUIPS
    : roll<0.74 ? BORIN_GOSSIP_QUIPS
    : BORIN_LORE_QUIPS;
  const line=pool[Math.floor(Math.random()*pool.length)];
  if(pool===ALE_QUIPS) return line;
  if(pool===BORIN_JOKE_QUIPS) return "Borin He’s kidding. "+line;
  if(pool===BORIN_GOSSIP_QUIPS) return "Borin whispers: "+line;
  return "Borin And the story is, "+line;
}

function borinBarTalk(){
  const packs=[
    {tag:"Borin He’s kidding.", pool:BORIN_JOKE_QUIPS},
    {tag:"Borin Poisoning gossip.", pool:BORIN_GOSSIP_QUIPS},
    {tag:"Borin He’s pulling the bass.", pool:BORIN_LORE_QUIPS},
    {tag:"Borin He’s advising.", pool:BORIN_HINT_QUIPS}
  ];
  const tick=Math.floor(Date.now()/45000);
  const salt=((S&&S.wkPts)|0)+((S&&S.daily&&S.daily.tok)|0)*3+((S&&S.veinsBroken)|0);
  const i=(tick*7+salt*11)>>>0;
  const pack=packs[i%packs.length];
  const line=pack.pool[(i+tick)%pack.pool.length];
  return {tag:pack.tag, text:line};
}
function sipAle(){
  const mug=$("aleMug");
  if(mug){
    mug.src=MUG_ICON;
    mug.classList.remove("sip"); void mug.offsetWidth; mug.classList.add("sip");
    clearTimeout(sipAle._t); sipAle._t=setTimeout(()=>mug.classList.remove("sip"),2450);
  }
  aleAnim=2.4;
  S.energy=Math.min(stat("energy"), S.energy+stat("energy")*0.12);
  sayQuip(beerLoreQuip(), 4);
  jingleFind();
  Platform.logEvent("ale_sip",{});
}
function openBeard(){
  const w=beardWisdom(); const need=beardNextXP(w.lv), have=S.beardXP||0;
  const isMax=w.lv>=BEARD_RANKS.length-1;
  metaOpen("Wisdom beard","The longer and the gray beard — The higher the rank and the stronger the bonus.",
    `<div class="metarow"><span>Rang: <b class="r5">${w.title}</b> (${w.lv}/${BEARD_RANKS.length-1})</span></div>
     <div class="metarow"><span>Bonus: <b style="color:var(--gold)">+${w.goldPct}% Income · +${w.luckAdd.toFixed(1)} Good luck.</b></span></div>
     <div class="metarow"><span>Progress</span><span>${isMax?"MAX ✓":fmt(have)+" / "+fmt(need)+" XP"}</span></div>
     <div class="sub" style="margin-top:10px">beard growing from loot veinThe lengths and days of the line. HUD And on the bragging card.</div>`);
  Platform.logEvent("beard_view",{lv:w.lv});
}

const SET_ART={
  berserk: {c:"#e05555", em:"⚔", fi:["🦷","😬","📣","🔥"]},
  greed:   {c:"#e8b93c", em:"💰", fi:["🪙","⚖️","🏷️","🎒"]},
  guardian:{c:"#5aa7e8", em:"🛡", fi:["🛡️","🪖","🌿","🔏"]},
  lucky:   {c:"#5fd068", em:"🍀", fi:["🍀","🧲","🪙","☄️"]},
  mythic:  {c:"#b97ae8", em:"⚒", fi:["🔨","💨","🪨","✨"]}
};
function openSetCard(id){
  const s=BALANCE.dungeonSets.find(x=>x.id===id); if(!s) return;
  const art=SET_ART[id]||{c:"#8a93a3",em:"⚒",fi:["▢","▢","▢","▢"]};
  const fr=(S.frags||{})[id]||{};
  const have=s.frags.filter((f,i)=>fr[i]).length;
  const done=!!(S.sets||{})[id];
  const pct=Math.round(have/s.frags.length*100);

  const frags=s.frags.map((f,i)=>{
    const on=!!fr[i];
    return `<div class="frag${on?" on":""}" style="${on?`border-color:${art.c}`:""}">
      ${on?'<span class="tick">✓</span>':""}
      <div class="fi">${on?art.fi[i]:"🔒"}</div>
      <div class="fn">${f}</div>
    </div>`;
  }).join("");

  $("setCard").innerHTML=`
    <div class="setHead">
      <div class="setEmblem" style="color:${art.c};border-color:${art.c};background:${art.c}1a">${art.em}</div>
      <div style="min-width:0">
        <div class="sh-n" style="color:${art.c}">${s.n}</div>
        <div class="sh-s">${done?"BUILD ACTIVE ✓":"COLLECTED "+have+" OF "+s.frags.length}</div>
      </div>
    </div>
    <div class="setBar"><div style="width:${pct}%;background:${art.c}"></div></div>
    <div class="setFrags">${frags}</div>
    <div class="setBonus">
      <div class="bl">A UNIQUE PROPERTY</div>
      <div class="bv" style="color:${done?art.c:"#4a5261"}">${s.bonus}</div>
    </div>
    <div class="setNote">${done
      ? "Property works all the time while the bill is assembled."
      : "The fragments fall from loot boxThe remaining items are: "+(s.frags.length-have)+"."}</div>`;
  $("setModal").style.display="flex";
  Platform.logEvent("set_view",{id});
}
function boxCount(t){ return (S.boxes||[]).filter(x=>x===t).length; }

function stoneFuseCost(t){ return 4+t; }
function dupStones(r){ let n=0; for(const k in S.col){ const c=(S.col[k]||{})[r]||0; if(c>1) n+=c-1; } return n; }
function spendStones(r,n){
  for(const k in S.col){ if(n<=0) break;
    const c=(S.col[k]||{})[r]||0, can=Math.max(0,c-1), take=Math.min(can,n);
    if(take>0){ S.col[k][r]=c-take; n-=take; } }
  return n<=0;
}

function craftBoxCost(r){ return 25+25*r; }
function craftBoxFromStones(r){
  if(r<1||r>7){ showToast("⚒","You can’t.","","Común Doesn’t turn into boxing."); return; }
  const need=craftBoxCost(r), have=dupStones(r);
  if(have<need){ showToast("⚒","Few stones","",need+"× "+RAR_NAMES[r]+" (duplicate)","have "+have); return; }
  spendStones(r,need);
  S.boxes=S.boxes||[]; S.boxes.push(r);
  showToast("⚒","loot box You’re all set!","r"+r,"📦 :: . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . "+r+" ("+RAR_NAMES[r]+")","−"+need+"× Stones",true);
  Platform.logEvent("lootbox_craft",{r}); sfxGear(); save(); render();
  if($("colModal")&&$("colModal").style.display==="flex") openCollection();
}
function upgradeBoxWithStones(tier){
  if(tier>=7){ showToast("⚗","Limit","","Cosmic — Nowhere above."); return; }
  if(boxCount(tier)<1){ showToast("⚗","No boxing.","","I need it. 1× :: . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . "+tier); return; }
  const need=stoneFuseCost(tier), have=dupStones(tier);
  if(have<need){ showToast("⚗","Few stones","",need+"× "+RAR_NAMES[tier]+" (duplicate)","have "+have); return; }
  let removed=0; S.boxes=S.boxes.filter(x=>{ if(x===tier&&removed<1){removed++;return false;} return true; });
  spendStones(tier,need);
  S.boxes.push(Math.min(7,tier+1));
  showToast("⚗","Boxing’s been improved!","r"+(tier+1),":: . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . "+tier+" → "+(tier+1),"−"+need+"× "+RAR_NAMES[tier],true);
  Platform.logEvent("lootbox_stone_upgrade",{tier}); sfxGear(); save(); render(); openLoot();
}
function grantFragment(){
  const sets=BALANCE.dungeonSets;
  const incomplete=sets.map((s,si)=>({si,s})).filter(o=>!(S.sets||{})[o.s.id]);
  const pool=incomplete.length?incomplete:sets.map((s,si)=>({si,s}));
  const pick=pool[Math.floor(Math.random()*pool.length)];
  const s=pick.s; S.frags=S.frags||{}; S.frags[s.id]=S.frags[s.id]||{};
  const missing=s.frags.map((f,i)=>i).filter(i=>!S.frags[s.id][i]);
  const idx=missing.length?missing[Math.floor(Math.random()*missing.length)]:Math.floor(Math.random()*s.frags.length);
  S.frags[s.id][idx]=true;
  const complete=s.frags.every((f,i)=>S.frags[s.id][i]);
  if(complete && !(S.sets||{})[s.id]){ S.sets=S.sets||{}; S.sets[s.id]=true;
    showToast("⚒","SETH IS ASSEMBLED!","",s.n,s.bonus,true); sayQuip("Bild. «"+s.n+"» Power!",5);
    Platform.logEvent("dungeon_set",{id:s.id}); jingleSet(); }
  return {set:s.n, frag:s.frags[idx], complete};
}
function openBox(tier){
  const rolls=1+(Math.random()<(tier-1)*0.15?1:0);
  let last; for(let k=0;k<rolls;k++) last=grantFragment();
  return last;
}
function openOneBox(){
  if(!(S.boxes||[]).length) return;
  const tier=S.boxes.pop(); const r=openBox(tier);
  showToast("📦","Open loot box","","freckle: "+r.frag,r.complete?"→ SETH COMPLETE!":"Set: "+r.set);
  save(); render(); openLoot();
}
function openAllBoxes(){
  if(!(S.boxes||[]).length) return;
  const n=S.boxes.length; let done=0;
  while(S.boxes.length){ const t=S.boxes.pop(); const r=openBox(t); if(r.complete) done++; }
  showToast("📦","Open "+n+" loot box","",done?done+" Set is assembled!":"Parts added","Check the bills.");
  Platform.logEvent("lootbox_open_all",{n}); save(); render(); openLoot();
}
function fuseBoxes(tier){
  const cost=BALANCE.fuseCost(tier);
  const have=boxCount(tier), sh=S.shards||0;
  if(have<3){ showToast("⚗","Not enough boxing.","","I do. 3× :: . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . "+tier,"have "+have); return; }
  if(sh<cost){ showToast("⚗","Not enough. shard","","I do. "+fmt(cost)+" 💠","have "+fmt(sh)); return; }
  let removed=0; S.boxes=S.boxes.filter(x=>{ if(x===tier&&removed<3){removed++;return false;} return true; });
  S.boxes.push(Math.min(7,tier+1)); S.shards-=cost;
  showToast("⚗","Alloy!","","3× :: . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . "+tier+" → 1× :: . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . "+(tier+1),"−"+cost+" 💠");
  Platform.logEvent("lootbox_fuse",{tier}); save(); render(); openLoot();
}

var TABS=["Mine","Hero","Meta"];

function syncBottomNav(){
  const ui=$("uiScreen");
  const uiOpen=!!(typeof UIS!=="undefined" && UIS && UIS.id && ui
    && (ui.style.display==="flex" || (ui.classList && ui.classList.contains("open"))));
  const uiId=uiOpen?UIS.id:null;
  const skillsOn=!!(uiOpen && (
    (uiId==="panel" && typeof _skillsShellTab!=="undefined" && _skillsShellTab!=null)
    || (typeof charSheetOpen==="function" && charSheetOpen() && uiId==="panel")
  ));
  const pairs=[["navShop","shop"],["navMines","mines"],["navTavBtn","tavern"],["navPvp","pvp"]];
  for(let i=0;i<pairs.length;i++){
    const btnId=pairs[i][0], scr=pairs[i][1];
    const el=$(btnId); if(!el||!el.classList) continue;
    const on=uiId===scr;
    el.classList.toggle("on", on);
    if(el.setAttribute) el.setAttribute("aria-current", on?"page":"false");
  }
  const sk=$("navSkills");
  if(sk&&sk.classList){
    sk.classList.toggle("on", skillsOn);
    if(sk.setAttribute) sk.setAttribute("aria-current", skillsOn?"page":"false");
  }
}
function switchTab(name){
  if(!TABS.includes(name)) name="Mine";
  for(const t of TABS){
    const panel=$("tab"+t), btn=$("tab"+t+"Btn");
    if(panel&&panel.classList) panel.classList.toggle("on", t===name);
    if(btn&&btn.classList) btn.classList.toggle("on", t===name);
  }
  {
    const onMine = name==="Mine";
    const sc=$("scene"); if(sc&&sc.style) sc.style.display = onMine ? "" : "none";
    const pw=$("pwStrip"); if(pw&&pw.style) pw.style.display = onMine ? "" : "none";
    const ss=$("statStrip"); if(ss&&ss.style) ss.style.display = onMine ? "" : "none";
    const fp=$("feedPanel"); if(fp&&fp.style) fp.style.display = onMine ? "" : "none";
    const lw=$("logWrap"); if(lw&&lw.style) lw.style.display = onMine ? "" : "none";
  }
  if(S&&S.ftue&&name==="Meta"&&!S.ftue.t){ S.ftue.t=1; save(); }

  try{ if(typeof syncBottomNav==="function") syncBottomNav(); }catch(e){}
  const v=$("view"); if(v) v.scrollTop=0;
  if(S){ S.tab=name; save(); }
  togglePaperdoll(false);
  Platform.logEvent("tab",{t:name});
}

function badges(){
  const skillReady = SKILL_DEFS.some(d=>canUpSkill(d.id)) || (S.chestKeys||0)>0 || (S.skillPts||0)>0 || (S.perkPicks||0)>0;
  const petReady   = Object.keys(S.petBox||{}).some(k=>{ const [t,r]=k.split("_").map(Number); return canMergePet(t,r); });
  const geoReady   = !!S.geo && (geoMaterials()>0 || canAscendGeo());
  const lootReady  = (S.boxes||[]).length>0;
  const workReady  = !!S.wkActive && Date.now()>=S.wkActive.end;
  const dailyReady = (function(){ try{ dailyReset();
      return BALANCE.dailyTrack.some(([need],i)=>(S.daily.tok||0)>=need && !(S.daily.claimed||[]).includes(i)); }catch(e){ return false; } })();
  const bagsReady  = (S.bags||0)>0 && !S.autoRoll;
  const upgReady   = UPGRADES.some(u=>!statCapped(u.id) && S.gold>=upCost(u));
  const shopReady  = (function(){ try{ return shopDailyAnyLeft(); }catch(e){ return false; } })();
  return { skillReady, petReady, geoReady, lootReady, workReady, dailyReady, bagsReady, upgReady, shopReady,
    prestigeReady: canPrestige(),
    mine: upgReady||bagsReady,
    hero: false,
    meta: skillReady||petReady||geoReady||lootReady||workReady||dailyReady||canPrestige() };
}
function renderBadges(){
  const b=badges();
  const setDot=(id,on)=>{ const el=$(id); if(el&&el.classList) el.classList.toggle("on",!!on); };
  setDot("dotMine",b.mine); setDot("dotHero",b.hero); setDot("dotMeta",b.meta);
  setDot("ndotMine",b.mine); setDot("ndotHero",b.hero); setDot("ndotMeta",b.meta);
  setDot("ndotPets",b.petReady||b.geoReady);
  setDot("dotSkills",b.skillReady); setDot("dotPets",b.petReady||b.geoReady);
  setDot("dotWork",b.workReady); setDot("dotDaily",b.dailyReady); setDot("dotDailySide",b.dailyReady); setDot("dotLoot",b.lootReady);
  setDot("dotShop",b.shopReady);
  { const up=$("skillsUp"); if(up&&up.classList) up.classList.toggle("on", !!(S.skillPts>0 || (S.perkPicks||0)>0 || SKILL_DEFS.some(d=>canUpSkill(d.id)))); }
  try{ updateGrowthDot(); }catch(e){}
}

const PD_POS={
  helm: [-20, 8], robe: [-20, 30], pack: [-20, 52], boots:[-20, 74], pants:[-20, 96],
  pick: [120, 8], glove:[120, 30], lamp: [120, 52], pet:  [120, 74]
};
let _gearSlotOpen=null, _gearSlotSig="";
function openBagFromGearSlot(){
  openChest(false);
  if(_gearSlotOpen) openGearSlot(_gearSlotOpen);
}
function refreshGearSlotIfOpen(){
  if(!_gearSlotOpen) return;
  if(typeof UIS==="undefined"||UIS.id!=="panel"){ _gearSlotOpen=null; _gearSlotSig=""; return; }
  if(!UIS._lastMeta||UIS._lastMeta.kind!=="gearSlot"){ _gearSlotOpen=null; _gearSlotSig=""; return; }
  const it=S.gear[_gearSlotOpen];
  const sig=_gearSlotOpen+"|"+((S.bags||0)|0)+"|"+(it?((it.r|0)+"|"+itemPower(it).toFixed(3)):"");
  if(sig===_gearSlotSig) return;
  openGearSlot(_gearSlotOpen);
}
function refreshEventsIfOpen(){
  if(typeof UIS==="undefined"||UIS.id!=="panel") return;
  if(!UIS._lastMeta||UIS._lastMeta.kind!=="events") return;
  refillKeys();
  const sig=(S.keys||0)+"|"+keyTimerStr()+"|"+(S.eventRun?(S.eventRun.id+"|"+S.eventRun.wave):"");
  if(UIS._lastMeta._evSig===sig) return;
  openEvents();
  try{ if(UIS._lastMeta) UIS._lastMeta._evSig=sig; }catch(e){}
}
function openGearSlot(id){
  if(id==="pet"){
    if(typeof UIS!=="undefined"&&UIS.open) UIS.open("pets","gacha");
    else if(typeof openPets==="function") openPets();
    return;
  }
  const sl=SLOTS.find(s=>s.id===id); if(!sl) return;
  const it=S.gear[id];
  const bags=(S.bags||0)|0;
  const canUp=slotCanBagUp(it);
  const bagCap=Math.min(7, 1+Math.floor((S.bag||1)/7));
  const statLines=Object.keys(sl.st).map(k=>{
    const base=sl.st[k]; const v=it?itemStat(it,k):0;
    const nm=statLbl(k);
    return `<div class="metarow"><span>${nm}</span><span>${it?("+"+(v>=100?fmt(v):v.toFixed(1))):"—"}</span></div>`;
  }).join("");
  const head=it
    ? `<div class="metarow"><span>Inspired: <b class="r${it.r}">${RAR_NAMES[it.r]}</b>${(id==="pick"&&it.n)?(" «"+it.n+"»"):""}</span><span>Power ${fmt(itemPower(it))}</span></div>`
    : `<div class="sub">Slot’s empty. bag — I’m sure it’ll be better, the porch will wear it.</div>`;
  let tip="";
  if(bags<1) tip="No bags · they drop from veins and appear above the inventory.";
  else if(canUp) tip="Green ↑ means a bag may improve this slot.";
  else if(it && it.r>=bagCap) tip="This slot has reached its rarity cap. Bag Lv."+(S.bag||1)+" · Upgrade the bag to raise it.";
  else tip="Bags available · use the 📦 button above the inventory.";
  const bagBtn=bags>0
    ? '<button type="button" class="btn btn-hard" onclick="openBagFromGearSlot()">📦 Open bag · '+bags+'</button>'
    : '<button type="button" class="btn btn-soft" disabled style="opacity:.45">📦 No bags</button>';
  const bagCta='<div class="btnrow" style="margin-top:12px">'+bagBtn+'</div>'
    +'<div class="uiSub" style="margin-top:8px">'+tip+'</div>';
  _gearSlotOpen=id;
  _gearSlotSig=id+"|"+bags+"|"+(it?((it.r|0)+"|"+itemPower(it).toFixed(3)):"");
  metaOpen(sl.ic+" "+sl.n,
    "What’s out is on. — If you’re better than the one you’re doing."+(sl.extra?(" Special: "+sl.extra+"."):""),
    gearSlotArtHtml(sl,it)+head+statLines+gearSlotFluffHtml(sl,it)+bagCta);
  try{ if(typeof UIS!=="undefined"&&UIS._lastMeta) UIS._lastMeta.kind="gearSlot"; }catch(e){}
  Platform.logEvent("paperdoll_slot",{id});
}

const SPECIMENS=(()=>{const o={};for(const k of ["g1","g2","g3","g4","o1","o2","o3","o4"])o[k]="art/spec_"+k+".webp";return o;})();
let sciTask=null, sciLastId=null;

function sciReliability(){
  const s=S.science||{};
  return (( s.goldOk||0)+1)/(((s.goldTotal)||0)+2);
}
function sciWeight(){
  const r=sciReliability();
  return r<BALANCE.science.minRel ? 0 : r;
}
function sciNextTask(){
  const all=Platform.scienceTasks();
  const open=all.filter(t=>t.gold==null && Platform._sci.retired[t.id]==null);
  const gold=all.filter(t=>t.gold!=null);
  const wantGold = gold.length && (!open.length || Math.random()<BALANCE.science.goldRate);
  let pool = wantGold ? gold : open;
  if(!pool.length){ sciTask=null; return null; }

  if(pool.length>1 && sciLastId!=null){
    const alt=pool.filter(t=>t.id!==sciLastId);
    if(alt.length) pool=alt;
  }
  sciTask = pool[Math.floor(Math.random()*pool.length)];
  sciLastId = sciTask.id;
  return sciTask;
}
function sciAnswer(idx){
  if(!sciTask) return false;
  const t=sciTask, sc=S.science;
  let msg;
  if(t.gold!=null){
    sc.goldTotal=(sc.goldTotal||0)+1;
    const ok = idx===t.gold;
    if(ok) sc.goldOk=(sc.goldOk||0)+1;
    msg = ok ? "Control passed" : "Control didn’t get together.";
  } else {
    const w=sciWeight();
    const r=Platform.scienceSubmit(t.id, idx, w);
    msg = (w===0) ? "Voice not accounted for: low reliability"
        : (r.consensus ? "Consensus achieved!" : "adopted");
  }
  sc.done=(sc.done||0)+1;
  const rel=sciReliability();
  const sh=Math.round(BALANCE.science.rewardShards*rel);
  const pr=Math.round(BALANCE.science.rewardProtein*rel);
  S.shards=(S.shards||0)+sh; S.protein=(S.protein||0)+pr;
  showToast("🔬","Ruddoznather","",msg,"+"+sh+" 💠 · +"+pr+" 🍺");
  Platform.logEvent("science_answer",{gold:t.gold!=null});
  sciTask=null; sciNextTask();
  save(); render(); openGuild();
  return true;
}

function sciSkip(){
  if(!sciTask) return false;
  Platform.logEvent("science_skip",{});
  sciTask=null; sciNextTask();
  showToast("🔬","Model missing","","Honestly, guessing is worse than admitting");
  openGuild();
  return true;
}
function sciConsent(){
  S.science.on=true;
  showToast("🔬","Guild open","","Thank you for helping with science.");
  save(); openGuild();
}
function openGuild(){
  const sc=S.science;
  if(!sc.on){
    metaOpen("🔬 Ore-Sage Guild",
      "Not a job for people who only trust eyesight.",
      `<div class="sub" style="line-height:1.9">
         Dwarves see what no camera can: <b>shape and meaning</b>.
         In the Guild you mark rock samples — simple questions —
         and many dwarves’ answers become a consensus.
         <br><br>
         Sometimes you get a sample the Mountain <b>already knows</b>.
         It checks your eye and decides how much your voice weighs.
         <br><br>
         <b style="color:var(--gold)">Nothing runs in the background.</b>
         Your phone works only when this screen is open — your eye, not a silent drain.
         <br><br>
         <span style="color:#8a93a3">Samples come from the Mountain archive. New batches arrive when Ore-Sages bring fresh finds.</span>
       </div>
       <div style="text-align:center;padding:14px 0">
         <button class="btn btn-hard" onclick="sciConsent()" style="max-width:280px">I agree, join</button>
       </div>`);
    Platform.logEvent("guild_consent_view",{});
    return;
  }
  const t=sciTask||sciNextTask();
  const rel=sciReliability();
  const relPct=Math.round(rel*100);
  const weak=sciWeight()===0;
  if(!t){
    metaOpen("🔬 Ore-Sage Guild","Reliability: "+relPct+"%",
      '<div class="sub">All samples marked. The Mountain thanks you.</div>');
    return;
  }
  const img=SPECIMENS[t.id];
  const opts=t.opts.map((o,i)=>
    `<button class="btn btn-soft" onclick="sciAnswer(${i})" style="margin:3px 0">${o}</button>`).join("");

  metaOpen("🔬 Ore-Sage Guild",
    "Look at the sample and say what you see — that is how science starts.",
    `<div class="specWrap">
       ${img?`<img class="specImg" src="${img}" alt="Rock sample">`:""}
       <div class="specCap">SAMPLE №${(sc.done||0)+1} · MAG ×40</div>
     </div>
     <div class="specQ">${t.q}</div>
     <div class="specHint">${t.hint||""}</div>
     <div style="display:flex;flex-direction:column;gap:2px">${opts}</div>
     <button onclick="sciSkip()" style="margin-top:6px;font-size:12px">I can’t tell · Skip</button>
     ${weak?'<div class="sub" style="color:#e8a24a;margin-top:10px">Your answers are not counting yet — too often off the tested samples. Use “I can’t tell” when unsure.</div>':''}
     <div class="relBar"><div style="width:${relPct}%"></div></div>
     <div class="sciStat"><span>Labeled: <b style="color:var(--txt)">${sc.done||0}</b></span>
       <span>Reliability: <b style="color:var(--txt)">${relPct}%</b></span></div>
     <div class="sub" style="margin-top:8px;line-height:1.7">
       Confidence grows when your answer matches already-tested samples.
       Higher confidence means a louder voice and better rewards.
     </div>`);
  Platform.logEvent("guild_view",{});
}

const CODEX=[
  ["About props","Props go up not for beauty — for not dying. The first dwarf to fall in a mine is never the weakest. It’s the one who said “five more minutes.”"],
  ["About beards","Underground, a beard is not hair — it is a workbook. Belt-length means elder. Dig-hard means handyman. The Mountain Patriarch greets you first. No beard? They call you “Fly” and keep you off the floor."],
  ["About ale","A dwarf drinks ale for joy. A dwarf also drinks ale to stand up at the face again. Everything after the third mug — the ex, the elf, “his ears are freezing” — is not in the Charter and not up for debate."],
  ["About Auto","Once a dwarf weighed every scrap, thought, sorted. Now a tick says “auto-sell below rare.” Thirty years of craft, a dynasty, granddad’s will — reduced to one slider. Progress, citizen. Dig quiet."],
  ["About prestige","Deep Call is simple. You dug seven thousand floors, wore cosmic gear, knew every stone by name. You press the button — and you are back on floor one, empty bag, starter pick. But with multipliers. The Mountain does not erase what you earned. It converts it to power."],
  ["About the cart","The cart fills, rolls out, comes back empty. Don’t ask. Some mine questions are asked only once."],
  ["About loot boxes","Upgrade boxes with duplicate stones. The first of each stone stays in the collection — it pays a quiet loot bonus. Dig with one hand; with the other, guard the museum fund."],
  ["About elders","Hiring an elder is luck. You roll Hilda the Healer. You roll again — Bodri the Brewer, weaker. The weak are not fired: they join the artel as material. The target elder takes the material and grows. What really happens — closed question."],
  ["Offline income","You sleep. You work. You live. The dwarf digs — exactly two hours — then stops and waits in the dark. Not tired. The Charter says: two hours alone, then only together."],
  ["Meaning","Rock grows harder the deeper you go. Six seconds a vein is called “endless complexity.” In the mine it is just called work."]
];
function showIntro(){
  const list=$("introList");
  if(list) list.innerHTML=CODEX.map(([t,s],i)=>
    `<div class="iitem"><b>${i+1}. ${t}</b><span>${s}</span></div>`).join("");
  try{
    if(typeof UIS!=="undefined"&&UIS.id&&UIS.close) UIS.close();
  }catch(e){}
  const sm=$("setModal2"); if(sm&&sm.style) sm.style.display="none";
  const ov=$("introOv"); if(ov&&ov.classList) ov.classList.add("on");
  try{ if(typeof updateFtueHint==="function") updateFtueHint(); }catch(e){}
  Platform.logEvent("intro_open",{});
}

function maybeAutoIntro(){
  if(S && S.introSeen===false){ S.introSeen=true; save(); }
}
function closeIntro(){
  const ov=$("introOv");
  const wasOpen=ov&&ov.classList&&ov.classList.contains("on");
  if(ov&&ov.classList) ov.classList.remove("on");
  if(S){ S.introSeen=true; save(); }
  if(wasOpen) Platform.logEvent("intro_done",{});
  if(wasOpen) try{
    if(typeof UIS!=="undefined"&&UIS.setChrome) UIS.setChrome(!!UIS.id);
    if(typeof updateFtueHint==="function") updateFtueHint();
  }catch(e){}
}
function togglePaperdoll(force){
  const pd=$("paperdoll"); if(!pd||!pd.classList) return;
  const on=(force!==undefined)?force:!pd.classList.contains("on");
  pd.classList.toggle("on",on);
  Platform.logEvent("paperdoll_toggle",{on});
  return on;
}
function renderPaperdoll(){
  const pd=$("paperdoll"); if(!pd||!pd.appendChild) return;
  let sig="";
  for(const sl of SLOTS){ const it=S.gear[sl.id]; sig+=(it?(it.r+"|"+(it.n||"")):"-")+";"; }
  if(pd._gearSig===sig) return;
  pd._gearSig=sig;
  while(pd.firstChild && pd.removeChild) pd.removeChild(pd.firstChild);
  for(const sl of SLOTS){
    const pos=PD_POS[sl.id]; if(!pos) continue;
    const it=S.gear[sl.id];
    const m=document.createElement("div");
    m.className="pdm "+(it?("r"+it.r):"empty");
    m.style.left=pos[0]+"%"; m.style.top=pos[1]+"%";
    const src=it?gearArtSrc(sl.id, it.r):(SLOT_ART[sl.id]||null);
    const ic=src?`<img src="${src}" class="slotArt">`:sl.ic;
    m.innerHTML=ic;
    if(m.setAttribute) m.setAttribute("title", sl.n+(it?(" · "+RAR_NAMES[it.r]):" · empty"));
    m.onclick=(e)=>{ if(e&&e.stopPropagation) e.stopPropagation(); openGearSlot(sl.id); };
    pd.appendChild(m);
  }
}
function renderSetFx(){
  const active=BALANCE.dungeonSets.filter(s=>(S.sets||{})[s.id]);
  const aura=$("setAura"), ring=$("setRing");
  const ids=active.map(s=>s.id).join(",");
  const lv=S.prestigeLv||0;
  const sig=ids+"|"+lv+"|"+fmt(prestigeMult());
  if(aura&&aura.style){
    if(active.length){ if(aura.style.display!=="block") aura.style.display="block";
      const c=(SET_ART[active[0].id]||{}).c||"#e8b93c";
      if(aura._auraC!==c){ aura._auraC=c; aura.style.setProperty("--auraC",c); }
    }
    else if(aura.style.display!=="none") aura.style.display="none";
  }
  if(ring){
    const html=active.map(s=>{
      const a=SET_ART[s.id]||{c:"var(--gold)",em:"⚒"};
      return `<span style="color:${a.c}" title="${s.n}">${a.em}</span>`;
    }).join("");
    setHtml(ring, html);
  }
  const pm=$("prestigeMark");
  if(pm){
    if(lv>0){
      if(pm.style.display!=="block") pm.style.display="block";
      setTxt(pm,"⛰ PRESTIGE "+lv+" · ×"+fmt(prestigeMult()));
    } else if(pm.style.display!=="none") pm.style.display="none";
  }
}
function openWall(){
  if(!requireFeat("artifacts")) return;
  const me=playerName();
  submitMyScore();
  const lb=Platform.getLeaderboard();
  const myRank=lb.findIndex(e=>e.name===me);
  const rows=lb.slice(0,20).map((e,i)=>{
    const mine=e.name===me;
    const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":("#"+(i+1));
    return `<div class="metarow" ${mine?'style="background:#1c2230;border-radius:6px"':''}>
      <span>${medal} ${mine?"<b style=\"color:var(--gold)\">":""}${esc(e.name)}${mine?"</b>":""}
        <br><span class="sub">⛰${e.prestige} · ${fmt(e.depth)} m</span></span></div>`;
  }).join("");
  metaOpen("🏔 Mountain Wall",
    "Who’s got a deeper and higher. "+fmt(S.stageIdx*3)+" m · prestige "+(S.prestigeLv||0)
      +(myRank>=0?(" · place #"+(myRank+1)):""),
    `<div class="btnrow" style="margin-bottom:10px">
       <input id="lbName" value="${esc(me)}" maxlength="18"
         style="flex:1;background:#12151d;border:1px solid var(--line);color:var(--txt);border-radius:6px;padding:8px;font-size:14px">
       <button class="btn btn-soft" onclick="setPlayerName()">Name</button></div>
     ${rows}
     <div class="sub" style="margin-top:10px">The wall remembers those who left a name in this mine.</div>`);
  Platform.logEvent("wall_view",{});
}
function setPlayerName(){ const el=$("lbName"); if(!el) return;
  const v=(el.value||"").trim().slice(0,18); if(!v) return;
  const old=playerName(); S.playerName=v;
  try{ const lb=Platform.getLeaderboard().filter(e=>e.name!==old);
    localStorage.setItem(Platform.LB_KEY,JSON.stringify(lb)); }catch(e){}
  submitMyScore();
  showToast("🏔","Name on the Wall","",esc(v)); save(); openWall();
}
function openFairness(){
  const f=S.fair;
  const lastNonce=Math.max(0,f.nonce-1);
  metaOpen("🔐 Gacha fairness",
    "Each roll is considered according to the Mountain formula: server + Your seat. + Checked. — Nothing’s going to blow.",
    `<div class="metarow"><span>Integrity regime</span>
       <button class="btn ${f.on?"btn-hard":"btn-soft"}" onclick="toggleFair()">${f.on?"INCLUDING ✓":"off"}</button></div>
     <div class="metarow"><span>Mountain seal (hash)</span></div>
     <div class="sub" style="word-break:break-all;color:#7ae8dc">${f.serverHash}</div>
     <div class="metarow" style="margin-top:8px"><span>Your personal seat.</span></div>
     <div class="btnrow"><input id="fairClient" value="${f.client}"
        style="flex:1;background:#12151d;border:1px solid var(--line);color:var(--txt);border-radius:6px;padding:8px;font-size:14px">
       <button class="btn btn-soft" onclick="setFairClient()">Set</button></div>
     <div class="metarow" style="margin-top:8px"><span>roll done</span><span><b>${f.nonce}</b></span></div>
     <div class="sub" style="margin-top:10px">Check past roll: count
       <br><code style="color:#e8b93c">SHA256("seat_servers:${f.client}:${lastNonce}")</code>
       <br>First 8 hex ÷ 2³² = Number roll in [0,1).</div>
     <div style="text-align:center;padding:12px 0">
       <button class="btn btn-hard" onclick="revealFair()" style="max-width:280px">Open the seat and change (check)</button>
     </div>
     <div class="sub">The autopsy shows the old server seat. — Check his hash with a seal above — And it gives out a new one.</div>`);
  Platform.logEvent("fair_view",{on:f.on});
}
function toggleFair(){ S.fair.on=!S.fair.on;
  showToast("🔐",S.fair.on?"IFC honesty":"Honesty’s off.","",S.fair.on?"Gucha is considered for hash":"Regular Random");
  save(); openFairness(); }
function setFairClient(){ const el=$("fairClient"); if(!el) return;
  const v=(el.value||"").trim().slice(0,64)||randSeed();
  S.fair.client=v; S.fair.nonce=0;
  showToast("🔐","Client seat assigned","",v,"The counter is dropped."); save(); openFairness(); }
function revealFair(){ const r=rotateFairSeed();
  showToast("🔐","Sid’s been exposed.","","Old server: "+r.revealed,"hash matches the previous commite.",true);
  openFairness(); }
function openPrestige(){
  const gain=prestigeGain(), lv=S.prestigeLv||0, ok=canPrestige();
  const now=prestigeMult(), next=Math.pow(BALANCE.prestige.powPerLevel, lv+gain);
  const echoAdd=echoFromGear();
  const nextLvStage=Math.pow(lv+1,2)*BALANCE.prestige.div;
  metaOpen("⛰️ Deep Zow (presence) "+lv+")",
    "Mountain He’s letting the paddle go upstairs so he can come down again. — Harder.",
    `<div class="metarow"><span>Attack multiplier (prestigation)</span><span><b style="color:var(--gold)">×${fmt(now)}</b></span></div>
     <div class="metarow"><span>Echo of the old curls</span><span><b>+${fmt(S.echo||0)} Attacks</b></span></div>
     <div class="metarow"><span>Deduction made</span><span>${S.prestigeRuns||0}</span></div>
     <div class="sub" style="margin-top:12px">${ok
       ? `Ready to go down: <b style="color:var(--gold)">+${gain} Lv.</b> · force will become <b style="color:var(--gold)">×${fmt(next)}</b> · Echo <b>+${fmt(echoAdd)} ATK</b>`
       : `Next level — during phase <b>${fmt(nextLvStage)}</b> (Now. ${fmt(S.stageIdx)}).`}</div>
     <div class="metarow" style="margin-top:12px"><span style="color:#e05555">Dropped</span>
       <span class="sub" style="text-align:right">depth · Gold · Equipment · Upgrades · bag</span></div>
     <div class="metarow"><span style="color:var(--green)">It’s forever.</span>
       <span class="sub" style="text-align:right">skill · elder · pet · Collection · Networks · beard · crystals</span></div>
     <div style="text-align:center;padding:12px 0">
       <button class="btn btn-hard" onclick="confirmPrestige()" ${ok?"":"disabled"} style="max-width:260px">
         ${ok?("Go down again (+"+gain+" (c)"):"It’s not time yet."}</button>
     </div>`);
  Platform.logEvent("prestige_view",{lv});
}
function confirmPrestige(){
  if(!canPrestige()) return;
  if(doPrestige()){ if(typeof UIS!=="undefined") UIS.close(); const m=$("metaModal"); if(m) m.style.display="none"; }
}
function openLoot(){
  const boxes=S.boxes||[];
  const byTier={}; boxes.forEach(t=>byTier[t]=(byTier[t]||0)+1);
  let boxRows=Object.keys(byTier).sort((a,b)=>a-b).map(t=>{
    t=+t; const c=byTier[t], fc=BALANCE.fuseCost(t);
    const needBox=Math.max(0,3-c), needSh=Math.max(0,fc-(S.shards||0));
    const canFuse=needBox===0&&needSh===0;
    const why=canFuse?"" :
      `<div class="sub" style="margin:2px 0 0;color:#e8a24a">- I’m missing: ${[
        needBox?needBox+"× Boxes":"",
        needSh?fmt(needSh)+" 💠":""].filter(Boolean).join(" · ")}</div>`;
    const sNeed=stoneFuseCost(t), sHave=dupStones(t), canStone=t<7&&sHave>=sNeed;
    const stoneBtn = t<7
      ? `<button class="btn btn-soft" onclick="upgradeBoxWithStones(${t})" ${canStone?"":"disabled"} ${canStone?"":'style="opacity:.45"'}>Improve · ${sNeed}× <span class="r${t}">${RAR_NAMES[t]}</span></button>`
      : "";
    const stoneWhy = (t<7&&!canStone)
      ? `<div class="sub" style="margin:2px 0 0;color:#8a93a3">Rocks (in millions of United States dollars)duplicate): ${sHave}/${sNeed}</div>` : "";
    return `<div class="metarow"><span>📦 Tyre ${t} (<b class="r${t}">${RAR_NAMES[t]}</b>) ×${c}${why}${stoneWhy}</span>
      <span style="display:flex;flex-direction:column;gap:6px;flex:none">
        <button onclick="fuseBoxes(${t})" ${canFuse?"":"disabled"} ${canFuse?"":'style="opacity:.45"'}>Alloy 3→${t+1} · ${fc}💠</button>
        ${stoneBtn}
      </span></div>`;
  }).join("")||'<div class="sub">loot box No, put it on. 8 Part slots one rarity — It’s gonna fall. loot box.</div>';
  const openBtns=boxes.length?`<div class="btnrow"><button class="btn btn-soft" onclick="openOneBox()">Open 1</button><button class="btn btn-hard" onclick="openAllBoxes()">Open All (${boxes.length})</button></div>`:"";
  const setRows=BALANCE.dungeonSets.map(s=>{
    const fr=(S.frags||{})[s.id]||{}; const have=s.frags.filter((f,i)=>fr[i]).length;
    const done=(S.sets||{})[s.id];
    const art=SET_ART[s.id]||{c:"var(--gold)",em:"⚒"};
    const chips=s.frags.map((f,i)=>`<span style="color:${fr[i]?art.c:"#4a5261"}">${fr[i]?f:"▢"}</span>`).join(" · ");
    return `<div class="metarow setrow" onclick="openSetCard('${s.id}')">
      <span class="setline">
        <span class="sl-t"><span style="color:${art.c}">${art.em}</span> <b style="color:${done?art.c:"inherit"}">${s.n}</b> (${have}/4)</span>
        <span class="sl-f">${chips}</span>
        <span class="sl-b">${s.bonus}</span>
      </span>
      <span style="flex:none;color:${done?"var(--green)":"var(--dim)"}">${done?"✓":"›"}</span></div>`;
  }).join("");
  metaOpen("loot box and the Subterranean Sets",
    "shard 💠 "+fmt(S.shards||0)+" · alloy 3→1 for shardOr improve one boxing for duplicate A collection of stones.",
    boxRows+openBtns+"<div style='height:10px'></div><div class='sub'>The Bilds (4 Scratch → A unique property:</div>"+setRows);
  Platform.logEvent("loot_view",{});
}

function growthInviteCode(){ ensureGrowth(S); return S.growth.code; }
function growthInviteLink(){
  const code=growthInviteCode();
  try{ return (location.href.split("?")[0].split("#")[0])+"?ref="+code; }catch(e){ return "?ref="+code; }
}
function growthCoopMult(){
  ensureGrowth(S);
  const until=S.growth.coopUntil||0, pct=BALANCE.growth.referral.coopBoostPct;
  return (Date.now()<until)?(1+pct/100):1;
}
function growthAdDayReset(){
  ensureGrowth(S);
  const t=todayStr();
  if(S.growth.ads.day!==t) S.growth.ads={day:t,count:0,bySlot:{}};
  if(!S.growth.ads.bySlot) S.growth.ads.bySlot={};
}
function adsDailyCap(){
  return (BALANCE.ads&&BALANCE.ads.dailyCap)||(BALANCE.growth.ads&&BALANCE.growth.ads.dailyCap)||30;
}
function adSlotKey(slot){ return String(slot||"").indexOf("shop_free_")===0?"shop_free":String(slot||"unknown"); }
function adSlotDef(slot){
  const slots=BALANCE.ads&&BALANCE.ads.slots;
  const key=adSlotKey(slot);
  return (slots&&slots[key])||{};
}
function adSlotUsed(slot){
  growthAdDayReset();
  return (S.growth.ads.bySlot[adSlotKey(slot)]|0);
}
function adSlotCap(slot){
  const c=adSlotDef(slot).cap;
  return c==null?adsDailyCap():c;
}
function adSlotLeft(slot){
  return Math.max(0, adSlotCap(slot)-adSlotUsed(slot));
}
function adSlotOk(slot){
  if(S.noAds) return true;
  if(!growthAdCapOk()) return false;
  return adSlotUsed(slot)<adSlotCap(slot);
}
function adSlotBump(slot){
  growthAdDayReset();
  const key=adSlotKey(slot);
  S.growth.ads.bySlot[key]=(S.growth.ads.bySlot[key]|0)+1;
}
function offerAdReward(slot, grantFn, opts){
  opts=opts||{};
  if(typeof grantFn!=="function") return;
  if(S.noAds){ grantFn(); return; }
  if(!adSlotOk(slot)){
    showToast("📺", opts.limitMsg||"Advertisement Limited","","tomorrow again. · "+adViewsToday()+"/"+adsDailyCap());
    return;
  }
  try{
    if(Platform&&typeof Platform.showRewarded==="function"){
      Platform.showRewarded(ok=>{ if(ok) grantFn(); }, slot);
      return;
    }
  }catch(e){}
  grantFn();
}
function adViewsToday(){
  growthAdDayReset();
  return S.growth.ads.count|0;
}
const AD_HUB_LABELS={
  vein_double:"×2 gold after vein", exhaust_refill:"Second breath (smoking)",
  collapse_recover:"Unload after cave-in", durab_free:"supports for advertising",
  offline_x2:"Offline ×2", bonus_x2:"Bonus chest ×2", loot2x:"2× loot 30 min",
  wheel_free:"Free turn", pvp_reroll:"New Opponents PvP",
  pet_roll:"egg for roll", beard_roll:"comb for roll",
  workout_skip:"Training grounds", event_key:"The key to the Yventa",
  daily_tok:"Deylicks’ rackets", daily_boost:"Close the file", bag_skip:"Band Upload Pass",
  speed:"Acceleration ×2+", shop_free:"Market · Allowances",
  auto_turbo:"Turbo bag removal", mine_raid_ready:"Level mine Right."
};
let adHubSeen=false;
function adPulseWanted(){
  if(S.noAds || adHubSeen) return false;
  if(!growthAdCapOk()) return false;
  if(adViewsToday()>=adsDailyCap()/2) return false;
  try{
    const slots=BALANCE.ads&&BALANCE.ads.slots||{};
    for(const k in slots){ if(adSlotLeft(k)>0) return true; }
  }catch(e){}
  return false;
}
function openAdHub(){
  adHubSeen=true;
  growthAdDayReset();
  const cap=adsDailyCap(), used=adViewsToday();
  const slots=BALANCE.ads&&BALANCE.ads.slots||{};
  const rows=Object.keys(slots).map(k=>{
    const left=adSlotLeft(k);
    const lab=AD_HUB_LABELS[k]||k;
    return `<div class="metarow"><span>${lab}</span><span><b>${left}</b> / ${adSlotCap(k)}</span></div>`;
  }).join("");
  metaOpen("📺 Ad bonuses",
    (S.noAds?"The ad’s offline. (VIP) · Non-roller bonuses":"Today "+used+"/"+cap+" View · Tap the slots in the game."),
    (S.noAds?'<div class="sub">Thanks for the support. — All 📺-The buttons give the award at once.</div>'
      :rows+'<div class="sub" style="margin-top:10px">After each vein, under cave-insmoke, lack of resources — Look for the button. 📺.</div>'));
  try{
    const adCell=$("statAdCell");
    if(adCell&&adCell.classList) adCell.classList.remove("pulse");
  }catch(e){}
}
function growthAdCapOk(){
  growthAdDayReset();
  return S.growth.ads.count<adsDailyCap();
}
function growthTrackAd(slot){
  growthAdDayReset();
  S.growth.ads.count=(S.growth.ads.count||0)+1;
  if(slot) adSlotBump(slot);
  S.growth.adViewsLifetime=(S.growth.adViewsLifetime||0)+1;
  try{ trackPlayEvent("ads_watched",1); }catch(e){}
  Platform.trackRevenue(BALANCE.growth.ads.revCents,"rewarded_ad",{ad:true,slot:slot||""});
  save();
}
function growthTrackPurchase(cents,product){
  ensureGrowth(S);
  S.growth.revenueCents=(S.growth.revenueCents||0)+cents;
  Platform.trackRevenue(cents,product,{iap:true});
}
function growthBumpInviter(code){
  code=(code||"").trim().toUpperCase(); if(!code) return;
  try{
    const k="oredeep_ref_"+code, n=Math.min(BALANCE.growth.referral.inviterCap, Number(localStorage.getItem(k)||0)+1);
    localStorage.setItem(k,String(n));
    ensureGrowth(S);
    if(S.growth.code===code) S.growth.invites=n;
  }catch(e){}
}
function growthApplyReferral(code, silent){
  ensureGrowth(S);
  code=(code||"").trim().toUpperCase();
  if(!code||code.length<4){ if(!silent) showToast("👥","Code","","Enter friend code"); return false; }
  if(code===growthInviteCode()){ if(!silent) showToast("👥","That's your code","","Invite someone else."); return false; }
  if(S.growth.referredBy){
    if(!silent) showToast("👥","Already referred","","From "+S.growth.referredBy);
    return false;
  }
  const r=BALANCE.growth.referral;
  S.growth.referredBy=code; S.growth.organic=true;
  S.gems=(S.gems||0)+r.welcomeGems; S.protein=(S.protein||0)+r.welcomeProtein;
  S.growth.coopUntil=Date.now()+r.coopBoostMin*60000;
  growthBumpInviter(code);
  Platform.trackAttribution("referral",{code,organic:true});
  Platform.logEvent("referral_accept",{code});
  if(!silent) showToast("👥","Co-op vein","","+"+r.welcomeGems+" 💎 · boost "+r.coopBoostMin+" min");
  save(); render(); return true;
}
function growthJoinWaitlist(silent){
  ensureGrowth(S);
  if(S.growth.waitlist.joined) return;
  S.growth.waitlist.joined=true; S.growth.waitlist.at=Date.now(); S.growth.organic=true;
  Platform.trackAttribution("waitlist",{organic:true});
  Platform.logEvent("waitlist_join",{});
  if(!silent) showToast("📋","Waitlist","","Bonus waiting in Friends.");
  save(); updateGrowthDot();
}
function claimWaitlistBonus(){
  ensureGrowth(S);
  const w=BALANCE.growth.waitlist;
  if(!S.growth.waitlist.joined){ showToast("📋","Waitlist","","Join first."); return; }
  if(S.growth.waitlist.claimed){ showToast("📋","Already claimed","","Thanks for early access."); return; }
  S.gems=(S.gems||0)+w.bonusGems; S.eggs=(S.eggs||0)+w.eggs; S.combs=(S.combs||0)+w.combs;
  S.loot2xUntil=Date.now()+w.loot2xMin*60000;
  S.growth.waitlist.claimed=true;
  Platform.logEvent("waitlist_claim",{});
  showToast("📋","Early access","","+"+w.bonusGems+" 💎 · 2× "+w.loot2xMin+" min");
  save(); render(); updateGrowthDot();
  if(typeof UIS!=="undefined"&&UIS.id==="profile") UIS.render("profile");
}
function claimInviteMilestones(){
  ensureGrowth(S); growthSyncInvites();
  const ms=BALANCE.growth.referral.milestones; let gems=0;
  for(let i=0;i<ms.length;i++){
    if(S.growth.milestones.includes(i)) continue;
    if((S.growth.invites||0)>=ms[i].n){
      S.growth.milestones.push(i); S.gems=(S.gems||0)+ms[i].gems; gems+=ms[i].gems;
    }
  }
  if(gems){ showToast("👥","Invite milestone","","+"+gems+" 💎"); Platform.logEvent("referral_milestone",{gems}); save(); render(); }
  else showToast("👥","Milestones","","Invite more friends.");
  updateGrowthDot();
  if(typeof UIS!=="undefined"&&UIS.id==="profile") UIS.render("profile");
}
function growthSyncInvites(){
  ensureGrowth(S);
  try{
    if(S.growth.code){
      const cap=BALANCE.growth.referral.inviterCap;
      const n=Number(localStorage.getItem("oredeep_ref_"+S.growth.code)||0);
      const fromLs=isFinite(n)?n:0;
      S.growth.invites=Math.min(cap, Math.max(S.growth.invites||0, fromLs));
    }
  }catch(e){}
}
function shareInvite(){
  const url=growthInviteLink(), code=growthInviteCode();
  const text="Dig with me in Mountain King! Code: "+code;
  if(navigator.share){ navigator.share({title:"Mountain King",text,url}).catch(()=>{}); }
  else { try{ navigator.clipboard.writeText(url); showToast("👥","Invite link","","Copied"); }catch(e){ showToast("👥","Code",code,url); } }
  Platform.logEvent("invite_share",{code});
}
function growthCaptureUrl(){
  let ref="", wl="";
  try{ const p=new URLSearchParams(location.search||""); ref=p.get("ref")||""; wl=p.get("wl")||""; }catch(e){}
  if(wl==="1") growthJoinWaitlist(true);
  if(ref){
    ensureGrowth(S);
    if(!S.growth.referredBy) growthApplyReferral(ref, false);
  }
}
function growthUnitEcon(){
  ensureGrowth(S);
  const g=S.growth, B=BALANCE.growth;
  const days=Math.max(1, Math.ceil((Date.now()-(g.installAt||Date.now()))/86400000));
  const adRev=(g.adViewsLifetime||0)*B.ads.revCents;
  const total=(g.revenueCents||0)+adRev;
  const cac=B.cacTargetCents, ltv=B.ltvTargetCents;
  const paybackOk=total>=cac && days<=B.paybackDay;
  return { days, totalCents:total, revenueIap:g.revenueCents||0, adRev, cac, ltv,
    paybackOk, ltvRatio:total/cac, k:(g.invites||0)/days, organic:!!g.organic };
}
function growthInviteMilestonesReady(){
  ensureGrowth(S);
  const ms=BALANCE.growth.referral.milestones;
  for(let i=0;i<ms.length;i++){
    if(S.growth.milestones.includes(i)) continue;
    if((S.growth.invites||0)>=ms[i].n) return true;
  }
  return false;
}

function growthDotShouldShow(){
  if(!S) return false;
  ensureGrowth(S);
  if(S.growth.waitlist.joined && !S.growth.waitlist.claimed) return true;
  if(growthInviteMilestonesReady()) return true;
  if(!S.ftue.g && !S.growth.waitlist.joined && (S.stageIdx||1)<=5) return true;
  return false;
}
function updateGrowthDot(){
  const dot=$("dotGrowthSide"); if(!dot) return;
  const show=growthDotShouldShow();
  if(dot.style) dot.style.display="";
  if(dot.classList) dot.classList.toggle("on", !!show);
  else if(dot.style) dot.style.display=show?"block":"none";
}
function growthOnBoot(){
  if(!S) return;
  ensureGrowth(S); growthCaptureUrl(); growthSyncInvites();
  updateGrowthDot();
}
(function(){
  const base=Platform.showRewarded;
  Platform.showRewarded=function(cb, slot){
    slot=slot||"rewarded";
    const placement=adSlotKey(slot);
    const place=placement&&placement!=="unknown"?placement:"rewarded";
    const adBase={ med:"applovin", placement:place };
    try{ Platform.logEvent("ad_offer",{slot:place}); }catch(e){}
    try{ Platform.logEvent("ad_reward_needed", adBase); }catch(e){}
    if(S.noAds){
      try{ Platform.logEvent("ad_complete",{slot:place,noads:true}); }catch(e){}
      cb(true);
      return;
    }
    if(!adSlotOk(slot)){
      try{ Platform.logEvent("ad_blocked",{slot:place,reason:"cap"}); }catch(e){}
      showToast("📺","Advertisement Limited","","Slot or day · "+adViewsToday()+"/"+adsDailyCap());
      cb(false); return;
    }
    if(!growthAdCapOk()){
      try{ Platform.logEvent("ad_blocked",{slot:place,reason:"cap"}); }catch(e){}
      showToast("📺","Advertisement Limited","","tomorrow again. — CPA under control"); cb(false); return;
    }
    try{ Platform.logEvent("ad_reward_try_show", adBase); }catch(e){}
    base(function(ok, reason){
      if(ok){
        growthTrackAd(slot);
        const n=(S.growth&&S.growth.adViewsLifetime)|0;
        try{
          Platform.logEvent("ad_complete",{slot:place});
          Platform.logEvent("ad_reward_show", adBase);
          Platform.logEvent("ad_reward_close", adBase);
          Platform.logEvent("af_ad_reward", { af_rewarded_count:n });
          if(n===5||n===10) Platform.logEvent("af_ad_reward"+n, { af_rewarded_count:n });
        }catch(e){}
      } else {
        try{
          Platform.logEvent("ad_fail",{slot:place, reason:reason||"not_shown"});
          Platform.logEvent("ad_reward_show_error", Object.assign({ errtext:reason||"not_shown" }, adBase));
        }catch(e){}
        if(reason==="not_ready" || reason==="unavailable"){
          showToast("📺","Ad not ready","","Try again in a moment");
        }
      }
      cb(ok);
    }, slot);
  };
})();

load();
try{ switchTab((S&&S.tab)||"Mine"); }catch(e){}
try{ maybeAutoIntro(); }catch(e){}
try{ buildUpgrades(); }catch(e){}
try{ renderFeed(); }catch(e){}
try{ renderGear(); }catch(e){}
try{ newRock(); }catch(e){}
try{ render(); }catch(e){}
try{ renderCart(); }catch(e){}
try{ checkOffline(); }catch(e){}
try{ growthOnBoot(); }catch(e){}
try{ checkStreak(); }catch(e){}
try{ checkPlayAchievements(); }catch(e){}
try{ bindPlayKeyboard(); }catch(e){}
try{ scheduleBonusNotify(); }catch(e){}
try{ scheduleBagReadyNotify(); }catch(e){}
{ const sm=$("setMusic"); if(sm) sm.textContent=musicOn?"🔊 on":"🔇 off"; }
{ if(typeof syncToastToggleBtns==="function") syncToastToggleBtns(); }
const SPEEDS=[1,2,3,10,100];
{ const sb=$("speedBtn");
  if(sb) sb.onclick=()=>{
  const cur=S.speed||1, i=SPEEDS.indexOf(cur);
  const next=SPEEDS[(i+1)%SPEEDS.length];
  const applySpeed=()=>{
    Platform.logEvent("speed_toggle",{speed:next});
    S.speed=next;
    flushSales();
    const q={1:"Calm pace, meditation.",2:"Double speed! beard It’s getting better!",
      3:"- Hold the helmet!",10:"×10! pickaxe It’s melting!",100:"×100! MOUNTAIN ♪ I’M SHAKING ♪ ♪ I’M SHAKING ♪ ♪ I’M SHAKING ♪"};
    sayQuip(q[S.speed]||("×"+S.speed+"!"),3);
    save();
  };
  if(next<=1){ applySpeed(); return; }

  try{
    if(Platform && typeof Platform.showRewarded==="function"){
      Platform.showRewarded(ok=>{ if(ok) applySpeed(); }, "speed");
      return;
    }
  }catch(e){}
  applySpeed();
  };
}
requestAnimationFrame(loop);
setInterval(save, 3000);
bindSaveLifecycle();

(function(){
  const EV_KEY="oredeep_admin_events";
  const EV_MAX=300;
  const STAT_KEY="oredeep_admin_stats";
  const CH_NAME="oredeep-admin";
  const ALLOW={
    gold:1,gems:1,bags:1,eggs:1,combs:1,keys:1,chestKeys:1,protein:1,shards:1,
    trophies:1,stageIdx:1,stage:1,mine:1,bag:1,prestigeLv:1,prestigeRuns:1,echo:1,
    energy:1,durab:1,playerName:1,introSeen:1,noAds:1,autoRoll:1,autoRollTier:1,
    speed:1,beard:1,beardXP:1,wheelSpins:1,pvpWins:1,pvpFights:1,bestDepth:1
  };
  const VIEW_MAP={
    ui_screen:(p)=>"ui:"+(p&&p.id||"?")+(p&&p.tab?":"+p.tab:""),
    tab:(p)=>"tab:"+(p&&p.t||"?"),
    profile_view:()=>"profile", chest_view:()=>"chest", gym_view:()=>"tavern",
    stickers_view:()=>"artifacts", beard_view:()=>"beards", set_view:()=>"set",
    guild_view:()=>"guild", guild_consent_view:()=>"guild_consent",
    wall_view:()=>"wall", fair_view:()=>"fairness", prestige_view:()=>"prestige",
    loot_view:()=>"loot", intro_open:()=>"intro", pick_gallery:()=>"picks",
    offline_return:()=>"offline"
  };
  function emptyStats(){
    return { v:1, since:Date.now(), lastAt:0, sessions:1,
      events:{}, screens:{}, clicks:{},
      revenue:{ totalCents:0, bySource:{} },
      ads:{ offer:0, complete:0, fail:0, blocked:0, bySlot:{} } };
  }
  function loadStats(){
    try{
      const raw=localStorage.getItem(STAT_KEY);
      if(!raw) return emptyStats();
      const s=JSON.parse(raw);
      if(!s||typeof s!=="object") return emptyStats();
      s.events=s.events||{}; s.screens=s.screens||{}; s.clicks=s.clicks||{};
      s.revenue=s.revenue||{totalCents:0,bySource:{}};
      s.revenue.bySource=s.revenue.bySource||{};
      s.ads=s.ads||{offer:0,complete:0,fail:0,blocked:0,bySlot:{}};
      s.ads.bySlot=s.ads.bySlot||{};
      return s;
    }catch(e){ return emptyStats(); }
  }
  function saveStats(st){
    try{ localStorage.setItem(STAT_KEY, JSON.stringify(st)); }catch(e){}
  }
  function bump(map, key, n){
    if(!key) return;
    key=String(key).slice(0,64);
    map[key]=(map[key]|0)+(n||1);
  }
  function ingest(name, params){
    const st=loadStats();
    st.lastAt=Date.now();
    bump(st.events, name, 1);
    const mk=VIEW_MAP[name];
    if(mk) bump(st.screens, mk(params||{}), 1);
    if(name==="ui_click") bump(st.clicks, (params&&params.id)||"?", 1);
    if(name==="revenue"){
      const c=Math.max(0, Math.floor(+(params&&params.cents)||0));
      const src=String((params&&params.source)||"other").slice(0,40);
      st.revenue.totalCents=(st.revenue.totalCents|0)+c;
      bump(st.revenue.bySource, src, c);
    }
    if(name==="ad_offer"){ st.ads.offer=(st.ads.offer|0)+1; bump(st.ads.bySlot, (params&&params.slot)||"?", 1); }
    if(name==="ad_complete"){ st.ads.complete=(st.ads.complete|0)+1; bump(st.ads.bySlot, ((params&&params.slot)||"?")+"_ok", 1); }
    if(name==="ad_fail") st.ads.fail=(st.ads.fail|0)+1;
    if(name==="ad_blocked") st.ads.blocked=(st.ads.blocked|0)+1;
    saveStats(st);
  }
  function pushEvent(name,params){
    try{
      const raw=localStorage.getItem(EV_KEY);
      const arr=raw?JSON.parse(raw):[];
      arr.unshift({t:Date.now(),name:String(name||""),params:params||{}});
      localStorage.setItem(EV_KEY, JSON.stringify(arr.slice(0,EV_MAX)));
    }catch(e){}
    try{ ingest(name, params||{}); }catch(e){}
  }
  const _log=Platform.logEvent;
  Platform.logEvent=function(name,params){
    try{ _log.call(Platform,name,params); }catch(e){}
    pushEvent(name,params);
  };

  let _clickGate=0;
  document.addEventListener("click", function(e){
    const now=Date.now();
    if(now-_clickGate<80) return;
    const t=e.target && e.target.closest && e.target.closest("button,[role=button],.btn,.tabs button,.navbtn");
    if(!t || t.id==="ftueTip") return;
    if(t.closest && t.closest("#adminIgnore")) return;
    _clickGate=now;
    let id=t.id||"";
    if(!id){
      const txt=(t.textContent||"").replace(/\s+/g," ").trim().slice(0,28);
      const cls=(t.className&&String(t.className).split(/\s+/).slice(0,3).join("."))||t.tagName;
      id=txt?("txt:"+txt):("cls:"+cls);
    }
    try{ Platform.logEvent("ui_click",{id, tag:t.tagName}); }catch(err){}
  }, true);

  function snapshot(){
    if(!S) return null;
    return {
      playerName:S.playerName, gold:S.gold, gems:S.gems, bags:S.bags, eggs:S.eggs,
      combs:S.combs, keys:S.keys, chestKeys:S.chestKeys, protein:S.protein, shards:S.shards,
      trophies:S.trophies, stageIdx:S.stageIdx, stage:S.stage, mine:S.mine, bag:S.bag,
      prestigeLv:S.prestigeLv, echo:S.echo, energy:S.energy, durab:S.durab,
      introSeen:S.introSeen, noAds:S.noAds, autoRoll:S.autoRoll, speed:S.speed,
      bestDepth:S.bestDepth, beard:S.beard, pvpWins:S.pvpWins,
      growth:S.growth?{invites:S.growth.invites,adViewsLifetime:S.growth.adViewsLifetime,
        revenueCents:S.growth.revenueCents,organic:S.growth.organic,
        starterBought:S.growth.starterBought,installAt:S.growth.installAt,
        ads:S.growth.ads}:null,
      unitEcon: typeof growthUnitEcon==="function"?growthUnitEcon():null,
      lvls:S.lvls?Object.assign({},S.lvls):null,
      analytics: loadStats()
    };
  }
  function applyPatch(patch){
    if(!S||!patch||typeof patch!=="object") return false;
    for(const k of Object.keys(patch)){
      if(k==="lvls" && patch.lvls && typeof patch.lvls==="object"){
        S.lvls=S.lvls||{};
        for(const id of Object.keys(patch.lvls)){
          const n=+patch.lvls[id]; if(isFinite(n) && n>=0) S.lvls[id]=Math.floor(n);
        }
        continue;
      }
      if(!ALLOW[k]) continue;
      let v=patch[k];
      if(typeof S[k]==="boolean" || k==="introSeen"||k==="noAds"||k==="autoRoll")
        v=!!v;
      else if(typeof v==="string" && k==="playerName") v=String(v).slice(0,24);
      else { v=+v; if(!isFinite(v)) continue; if(k!=="echo") v=Math.floor(v); }
      S[k]=v;
    }
    try{ save(); }catch(e){}
    try{ if(typeof newRock==="function") newRock(); }catch(e){}
    try{ if(typeof renderGear==="function") renderGear(); }catch(e){}
    try{ if(typeof render==="function") render(); }catch(e){}
    return true;
  }
  try{
    const ch=new BroadcastChannel(CH_NAME);
    ch.onmessage=function(ev){
      const m=ev&&ev.data; if(!m||!m.type) return;
      if(m.type==="ping"){ ch.postMessage({type:"pong", at:Date.now(), snap:snapshot()}); return; }
      if(m.type==="apply"){ ch.postMessage({type:"applied", ok:applyPatch(m.patch||{})}); return; }
      if(m.type==="stats"){ ch.postMessage({type:"stats", stats:loadStats()}); return; }
      if(m.type==="reload"){
        try{ load(); if(typeof newRock==="function") newRock();
          if(typeof renderGear==="function") renderGear(); if(typeof render==="function") render();
          ch.postMessage({type:"reloaded", ok:true, snap:snapshot()});
        }catch(e){ ch.postMessage({type:"reloaded", ok:false}); }
      }
    };
    window.__oreAdmin={ snapshot, applyPatch, pushEvent, loadStats };
  }catch(e){
    window.__oreAdmin={ snapshot, applyPatch, pushEvent, loadStats };
  }
})();
