"use strict";
/* Монте-Карло прогон прототипа v0.2: игрок жадно покупает апгрейды,
   носит лучший дроп, качает сумку, крутит гачу. Проверяем: прогресс
   идёт, стены есть, но проходимы; экономика не убегает. */
const ANCHOR_IDX=[1,2000,20000,50000],ANCHOR_HP=[225,200000,2000000,10000000],
ANCHOR_ABR=[45,20000,200000,1000000],ANCHOR_HARD=[11,5000,50000,250000],
ANCHOR_RESP=[1,1.2,2,2],EASE_K=1.35,DMG_HARD_K=.5,DRAIN_K=.08,CRIT_MULT=2.2;
const lerp=(a,b,u)=>a+(b-a)*u,growthLerp=(a,b,t)=>lerp(a,b,Math.pow(t,EASE_K));
function anchored(arr,idx){if(idx<=1)return arr[0];if(idx>=50000)return arr[3];
let i=0;while(ANCHOR_IDX[i+1]<idx)i++;
return growthLerp(arr[i],arr[i+1],(idx-ANCHOR_IDX[i])/(ANCHOR_IDX[i+1]-ANCHOR_IDX[i]));}
const BAG_LVLS=[1,2,3,4,5,10,15,20,25,30,35,40,45,50];
const BAG_W=[[100,0,0,0,0,0,0,0],[99,1,0,0,0,0,0,0],[97,3,0,0,0,0,0,0],[95,4.9,.1,0,0,0,0,0],[90,9.8,.2,0,0,0,0,0],[70,28.9,1,.1,0,0,0,0],[50,46.4,3,.5,.1,0,0,0],[30,63.4,5,1,.5,.1,0,0],[10,75.4,10,3,1,.5,.1,0],[0,70.4,20,5,3,1,.5,.1],[0,50.5,30,10,5,3,1,.5],[0,26,35,20,10,5,3,1],[0,2,30,30,20,10,5,3],[0,0,15,30,20,20,10,5]];
function bagWeights(l){l=Math.max(1,Math.min(50,l));let i=0;
while(i<BAG_LVLS.length-1&&BAG_LVLS[i+1]<l)i++;
if(BAG_LVLS[i]===l||i===BAG_LVLS.length-1)return BAG_W[Math.min(i,13)].slice();
const t=(l-BAG_LVLS[i])/(BAG_LVLS[i+1]-BAG_LVLS[i]);
const w=BAG_W[i].map((v,j)=>lerp(v,BAG_W[i+1][j],t));const s=w.reduce((a,b)=>a+b,0);
return w.map(v=>v/s*100);}
function rollRarity(w){const s=w.reduce((a,b)=>a+b,0);let r=Math.random()*s;
for(let i=0;i<w.length;i++){r-=w[i];if(r<=0)return i;}return 0;}
const RAR_POW=[1,2.2,4.8,10,22,48,110,250],RAR_MULT=[1,3,9,27,80,220,600,1500];
const SLOTS=[{id:"pick",st:{atk:8}},{id:"helm",st:{energy:30,tough:2}},{id:"pet",st:{luck:1.5,mining:3}},{id:"robe",st:{tough:2.5}},{id:"pack",st:{stone:14}},{id:"boots",st:{spd:.35}},{id:"glove",st:{crit:1.6}},{id:"lamp",st:{mining:2,luck:1}}];
const STAT_CAPS={crit:60,luck:45,mining:80,spd:14};
const itemStat=(it,st)=>{const b=SLOTS.find(s=>s.id===it.s).st[st]||0;return b*RAR_POW[it.r]*(1+it.i/60)*it.m;};
const BASE={atk:10,spd:4.5,mining:10,crit:5,luck:10,stone:120,energy:70,tough:0};
const UPG=[{id:"atk",step:3,base:25,g:1.35},{id:"energy",step:20,base:20,g:1.32},{id:"spd",step:.3,base:40,g:1.5},{id:"tough",step:2,base:35,g:1.45},{id:"crit",step:1,base:50,g:1.6},{id:"luck",step:1,base:50,g:1.55},{id:"mining",step:2,base:45,g:1.5},{id:"stone",step:10,base:30,g:1.4}];
const GEO_PITY_X=[0,25,50,100,250],GEO_PITY_W=[[80,20,0,0],[65,30,5,0],[50,35,13,2],[40,35,20,5],[15,20,45,20]];
function geoWeights(r){const x=Math.max(0,Math.min(250,r));let i=0;
while(i<4&&GEO_PITY_X[i+1]<x)i++;if(i===4)return GEO_PITY_W[4].slice();
const t=(x-GEO_PITY_X[i])/(GEO_PITY_X[i+1]-GEO_PITY_X[i]);
return GEO_PITY_W[i].map((v,j)=>lerp(v,GEO_PITY_W[i+1][j],t));}
const GEO_TYPES=[{stat:"atk",pct:[12,36,108,324]},{stat:"energy",pct:[15,45,135,405]},{stat:"stone",pct:[10,30,90,270]}];

const S={gold:0,stageIdx:1,mine:0,stage:1,bag:1,lvls:{atk:0,energy:0,spd:0,tough:0,crit:0,luck:0,mining:0,stone:0},gear:{},geo:null,geoRolls:0};
function stat(id){const u=UPG.find(x=>x.id===id);
let v=BASE[id]+(u?u.step*S.lvls[id]:0);
for(const k in S.gear)v+=itemStat(S.gear[k],id);
if(S.geo&&GEO_TYPES[S.geo.t].stat===id)v*=1+GEO_TYPES[S.geo.t].pct[S.geo.r]/100;
if(id==="spd")v=Math.max(1,Math.min(14,v));
else if(STAT_CAPS[id])v=Math.min(STAT_CAPS[id],v);
return v;}
const upCost=u=>Math.round(u.base*Math.pow(u.g,S.lvls[u.id]));
const vein=()=>Math.max(5,anchored(ANCHOR_HP,S.stageIdx)/12*(stat("stone")/100));
const idle=()=>Math.max(1,Math.round(vein()/25));
const bagCost=()=>Math.round(vein()*(4+S.bag));
const geoCost=()=>Math.round(vein()*8);
const pickR=()=>S.gear.pick?S.gear.pick.r:0;
const findCh=()=>Math.min(50,8+pickR()*4+stat("luck")-10);

function beat(boss){
  const r={hp:anchored(ANCHOR_HP,S.stageIdx)*(boss?1.5:1),abr:anchored(ANCHOR_ABR,S.stageIdx),hard:anchored(ANCHOR_HARD,S.stageIdx),resp:anchored(ANCHOR_RESP,S.stageIdx)};
  const hit=Math.max(stat("atk")*.15,stat("atk")-r.hard*DMG_HARD_K)*(1+stat("crit")/100*(CRIT_MULT-1))*(1+stat("mining")/100);
  const tKill=r.hp/(hit*stat("spd"));
  const drain=Math.max(1,r.abr*DRAIN_K-stat("tough"))*(1-stat("luck")/100)*r.resp;
  return {ok:tKill<stat("energy")/drain,tKill};
}
function buyGreedy(){
  let bought=true,n=0;
  while(bought&&n<500){bought=false;
    // приоритет: сумка если можем, потом дешёвый стат-апгрейд, потом гача
    if(S.bag<50&&S.gold>bagCost()){S.gold-=bagCost();S.bag++;bought=true;n++;continue;}
    let best=null,bc=1/0;
    for(const u of UPG){const c=upCost(u);if(c<bc){bc=c;best=u;}}
    if(S.gold>=bc*1.2){S.gold-=bc;S.lvls[best.id]++;bought=true;n++;continue;}
    if(S.gold>geoCost()*2){S.gold-=geoCost();
      const r=rollRarity(geoWeights(S.geoRolls));S.geoRolls++;
      const t=Math.floor(Math.random()*3);
      if(!S.geo||r>S.geo.r)S.geo={t,r};else S.gold+=Math.round(geoCost()*.4);
      bought=true;n++;}
  }
}
let time=0,stuckTotal=0;
const marks=[600,1800,3600,7200,14400];let mi=0;
while(time<14400){
  const boss=S.stage===5;
  let b=beat(boss);
  if(!b.ok){ // стена: копим идл, покупаем, повторяем
    const t0=time;
    let guard=0;
    while(!b.ok&&guard<2000){
      const need=Math.min(...UPG.map(upCost));
      const wait=Math.max(1,(need*1.2-S.gold)/idle());
      time+=wait;S.gold+=idle()*wait;buyGreedy();b=beat(boss);guard++;
      if(time>14400)break;
    }
    stuckTotal+=time-t0;
    if(time>14400)break;
  }
  time+=b.tKill;
  S.gold+=vein()*(boss?1.5:1)+idle()*b.tKill;
  if(Math.random()*100<findCh()){ // камень: ожидаемая нормировка
    const w=bagWeights(Math.min(50,S.bag+pickR()*3));
    const ri=rollRarity(w);
    const avg=w.reduce((a,wi,i)=>a+wi*RAR_MULT[i],0)/100;
    S.gold+=Math.max(vein()*.15,vein()*.15*RAR_MULT[ri]/(findCh()/100*avg));
  }
  if(Math.random()*100<(boss?100:35)){ // дроп
    const sl=SLOTS[Math.floor(Math.random()*8)];
    const it={s:sl.id,r:rollRarity(bagWeights(S.bag)),m:.85+Math.random()*.3,i:S.stageIdx};
    const old=S.gear[sl.id];
    const sum=x=>Object.keys(sl.st).reduce((a,st)=>a+itemStat(x,st),0);
    if(!old||sum(it)>sum(old)){if(old)S.gold+=vein()*(.5+old.r*1.5);S.gear[sl.id]=it;}
    else S.gold+=vein()*(.5+it.r*1.5);
  }
  buyGreedy();
  S.stageIdx++;S.stage=S.stage===5?1:S.stage+1;if(S.stage===1)S.mine++;
  while(mi<marks.length&&time>=marks[mi]){
    console.log((marks[mi]/60)+" мин: этап "+S.stageIdx+", шахта "+(S.mine+1)+", BAG "+S.bag+", ATK "+Math.round(stat("atk"))+", золото "+S.gold.toExponential(2)+", застревал сумм. "+Math.round(stuckTotal/60)+" мин");
    mi++;
  }
}
console.log("\nИтог 4ч: этап "+S.stageIdx+", шахта "+(S.mine+1)+", BAG "+S.bag+", геолог r"+(S.geo?S.geo.r:"-")+" (роллов "+S.geoRolls+"), время в стенах: "+Math.round(stuckTotal/60)+" мин ("+Math.round(stuckTotal/144)+"% времени)");
const g=S.gear;console.log("Снаряжение:",Object.keys(g).map(k=>k+":r"+g[k].r).join(" "));
