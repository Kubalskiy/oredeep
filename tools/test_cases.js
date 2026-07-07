
/* ================= ТЕСТЫ ================= */
let pass=0, fail=0;
const T=(name,cond,info)=>{ if(cond){pass++;console.log("  PASS "+name);} else {fail++;console.log("  FAIL "+name+(info?" — "+info:""));} };
const frame=(ms)=>{ __vclock+=ms; const cb=__rafCb; __rafCb=null; if(cb) cb(__vclock); };
const clickDrop=()=>{ if(pendingDrop){ (Math.random()<0.6?__ids.dropEquip:__ids.dropSell).onclick(); } };

console.log("\n[1] Таблицы и формулы против GDD");
T("сумка lvl1 = 100% Common", JSON.stringify(bagWeights(1))===JSON.stringify([100,0,0,0,0,0,0,0]));
T("сумка lvl50 без Common/Rare", bagWeights(50)[0]===0 && bagWeights(50)[1]===0);
let sumsOk=true;
for(let l=1;l<=50;l++){ const s=bagWeights(l).reduce((a,b)=>a+b,0); if(Math.abs(s-100)>0.7){sumsOk=false;break;} }
T("веса сумки нормированы (1..50)", sumsOk);
T("pity(0) = [80,20,0,0]", JSON.stringify(geoWeights(0))===JSON.stringify([80,20,0,0]));
T("pity(250) = [15,20,45,20]", JSON.stringify(geoWeights(250))===JSON.stringify([15,20,45,20]));
T("pity(50) Epic=13", Math.abs(geoWeights(50)[2]-13)<0.01);
T("множители деталей ×2.2 (8 тиров)", RAR_POW.length===8 && RAR_POW[7]===250);
T("ценности камней 1..1500", RAR_MULT[0]===1 && RAR_MULT[7]===1500);
T("якоря породы: HP(1)=225, HP(50000)=1e7", anchored(ANCHOR_HP,1)===225 && anchored(ANCHOR_HP,50000)===1e7);
T("экстраполяция краем: HP(999999)=1e7", anchored(ANCHOR_HP,999999)===1e7);
T("fmt без экспоненты до Dc", fmt(5.58e9)==="5.58B" && !fmt(2.7e14).includes("e") && !fmt(3.1e22).includes("e"));
T("fmt сверхбольшие → компактная экспонента", fmt(5.58e41).includes("e41"));

console.log("\n[2] Базовые статы (GDD §3, 1:1)");
T("ATK=10", stat("atk")===10);
T("Energy=70", stat("energy")===70);
T("SPD=4.5", stat("spd")===4.5);
T("CRIT=5, LUCK=10, STONE=120", stat("crit")===5&&stat("luck")===10&&stat("stone")===120);
T("шанс находки старт = 8%", findChance()===8);

console.log("\n[3] Core loop: 30 виртуальных минут");
const gold0=S.gold, stage0=S.stageIdx;
let drops=0, finds0=0, bossSeen=false, framesRun=0;
for(let i=0;i<36000 && framesRun<36000;i++){
  if(pendingDrop){ drops++; clickDrop(); }
  if(S.stage===5 && rock && rock.isBoss) bossSeen=true;
  frame(50); framesRun++;
  // жадные покупки как игрок
  if(i%20===0){
    for(const u of UPGRADES){ const c=upCost(u); if(S.gold>c*2){ S.gold-=c; S.lvls[u.id]++; } }
    if(S.bag<50 && S.gold>bagCost()*1.5){ __ids.bagBtn.onclick&&0; S.gold-=bagCost(); S.bag++; }
  }
}
T("прогресс идёт: этап вырос", S.stageIdx>stage0+20, "этап "+S.stageIdx);
T("золото зарабатывается", S.gold>gold0);
T("дропы случаются (модалки+авто)", drops+Object.keys(S.gear).length>5, drops+" модалок, "+Object.keys(S.gear).length+" слотов");
T("боссы встречаются", bossSeen);
T("снаряжение надевается", Object.keys(S.gear).length>=3, Object.keys(S.gear).length+" слотов");
const findsTotal=Object.values(S.col).reduce((a,m)=>a+Object.values(m).reduce((x,y)=>x+y,0),0);
T("камни находятся, коллекция растёт", findsTotal>3, findsTotal+" камней");
T("энергия в допустимых пределах", S.energy<=stat("energy"));

console.log("\n[4] Кнопки: сумка, гача, апгрейды");
S.gold=1e9;
const bag0=S.bag; __ids.bagBtn.onclick(); T("апгрейд сумки работает", S.bag===bag0+1);
const rolls0=S.geoRolls; for(let i=0;i<30;i++) __ids.geoBtn.onclick();
T("гача крутится, pity растёт", S.geoRolls===rolls0+30);
T("геолог нанят", !!S.geo, S.geo?("r"+S.geo.r):"");
const lvl0=S.lvls.atk; __ids.u_atk._q["button"].onclick();
T("кнопка апгрейда ATK работает", S.lvls.atk===lvl0+1);
S.lvls.luck=200;
T("находка ≤50% без кирки (LUCK кап 45)", findChance()<=50 && findChance()===43);
S.gear.pick={s:"pick",r:7,m:1,i:1};
T("кап находки 50% с Cosmic-киркой", findChance()===50);
S.gear={}; S.lvls.luck=0;
S.lvls.crit=500; T("кап CRIT 60%", stat("crit")===60); S.lvls.crit=0;

console.log("\n[5] Истощение и рестарт");
S.gear={}; S.lvls={atk:0,energy:0,spd:0,tough:0,crit:0,luck:0,mining:0,stone:0}; S.geo=null;
S.stageIdx=2000; S.stage=1; newRock();
let died=false;
for(let i=0;i<4000;i++){ if(pendingDrop) clickDrop(); frame(50); if(dead){died=true;break;} }
T("истощение срабатывает на непосильной породе", died);
T("оверлей показан", __ids.overlay.style.display==="flex");
closeOverlay();
T("продолжение: энергия восстановлена, этап тот же", !dead && S.energy===stat("energy") && S.stageIdx===2000);

console.log("\n[6] Экономика на глубине");
const v=veinReward(), hp=anchored(ANCHOR_HP,S.stageIdx);
T("доход/HP = STONE/1200 (константа)", Math.abs(v/hp - stat("stone")/100/12)<1e-9);
const w=stoneWeights(); const avg=w.reduce((a,wi,i)=>a+wi*RAR_MULT[i],0)/100;
let expShare=0; for(let i=0;i<8;i++){ expShare+=w[i]/100*Math.max(0.15, 0.15*RAR_MULT[i]/(findChance()/100*avg)); }
expShare*=findChance()/100;
T("вклад камней в коридоре 10–25%", expShare>0.1&&expShare<0.25, (expShare*100).toFixed(1)+"%");

console.log("\n[7] Сохранение/загрузка");
S.gold=12345; S.bag=7; save();
S.gold=0; S.bag=1; load();
T("состояние восстановлено", S.gold===12345 && S.bag===7);
localStorage.removeItem("oredeep_v3"); load();
T("чистый старт при отсутствии сейва", S.gold===0 && S.stageIdx===1);


console.log("\n[8] Оплата и применение всех покупок");
localStorage.removeItem("oredeep_v3"); load(); S.gold=1e12; render();
for(const u of UPGRADES){
  const cost=upCost(u), g0=S.gold, l0=S.lvls[u.id], s0=stat(u.id);
  __ids["u_"+u.id]._q["button"].onclick();
  T("апгрейд "+u.id+": списано ровно "+cost+", lvl+1, стат применён",
    S.gold===g0-cost && S.lvls[u.id]===l0+1 && stat(u.id)>=s0);
}
{ const c=bagCost(), g0=S.gold, b0=S.bag; __ids.bagBtn.onclick();
  T("сумка: списано ровно цену, LVL+1", S.gold===g0-c && S.bag===b0+1); }
{ const c=geoCost(), g0=S.gold, r0=S.geoRolls; __ids.geoBtn.onclick();
  T("гача: ролл засчитан, списание корректно (± возврат 40% за слабого)",
    S.geoRolls===r0+1 && (S.gold===g0-c || S.gold===g0-c+Math.round(c*0.4))); }
S.gold=0; render();
let allDisabled=true;
for(const u of UPGRADES){ if(!__ids["u_"+u.id]._q["button"].disabled) allDisabled=false; }
T("без золота все 8 кнопок апгрейдов заблокированы", allDisabled);
T("сумка и гача без золота заблокированы", __ids.bagBtn.disabled && __ids.geoBtn.disabled);
{ const g0=S.gold, l0=S.lvls.atk; __ids.u_atk._q["button"].onclick();
  T("клик по заблокированной кнопке ничего не делает", S.gold===g0 && S.lvls.atk===l0); }

console.log("\n[9] Авто-экипировка и авто-продажа (без модалок)");
S.gold=0; S.gear={};
dropGear();
T("пустой слот: надето автоматически", pendingDrop===null && Object.keys(S.gear).length===1);
S.gear={pick:{s:"pick",r:7,m:1.15,i:99999}}; S.bag=1; S.gold=0;
let flowOk=true;
for(let i=0;i<60;i++){
  dropGear();
  if(pendingDrop!==null) flowOk=false;
  if(S.gear.pick.r<7) flowOk=false;
}
T("слабый шмот продаётся сам, кирка не тронута, модалок нет", flowOk);
T("золото от скупщика начислено", S.gold>0);
S.gear={pick:{s:"pick",r:0,m:0.85,i:1}}; S.bag=50;
let autoUp=false;
for(let i=0;i<400 && !autoUp;i++){
  dropGear();
  if(pendingDrop!==null) flowOk=false;
  if(S.gear.pick.r>0) autoUp=true;
}
T("строго лучшая кирка надета автоматически", autoUp && flowOk);

console.log("\n[10] Старейшины: пул имён");
S.gold=1e12; S.geo=null; S.geoRolls=0;
for(let i=0;i<40;i++) __ids.geoBtn.onclick();
T("старейшина нанят, у него есть имя", !!S.geo && typeof S.geo.n==="string" && S.geo.n.length>2, S.geo?S.geo.n:"");
T("имя из пула его типа", GEO_TYPES[S.geo.t].names.includes(S.geo.n));
render();
T("карточка показывает имя нанятого", __ids.geoName.innerHTML.includes(S.geo.n));
S.geo={t:0,r:1}; render();
T("старый сейв без имени не ломает карточку", __ids.geoName.innerHTML.includes(GEO_TYPES[0].names[0]));

console.log("\n[13] Именные уровни сундука");
T("bagName(1) = Дырявый мешок", bagName(1)==="Дырявый мешок");
T("bagName(17) = Гномий сундучок", bagName(17)==="Гномий сундучок");
T("bagName(50) = СУНДУК СУНДУКОВ", bagName(50)==="СУНДУК СУНДУКОВ");
T("nextBagName(15) → Окованный сундук на 20", nextBagName(15)[0]===20);
T("nextBagName(50) = null (предел)", nextBagName(50)===null);

console.log("\n[12] Скорость x1/x2/x3");
S.speed=1;
__ids.speedBtn.onclick(); T("x1 -> x2", S.speed===2);
__ids.speedBtn.onclick(); T("x2 -> x3", S.speed===3);
__ids.speedBtn.onclick(); T("x3 -> x1 (цикл)", S.speed===1);
render();
T("кнопка показывает текущую скорость", __ids.speedBtn.textContent.includes("×1"));

console.log("\n[11] Коллекции: пассив и сет-бонусы");
S.col={}; S.geo=null; S.gear={};
const stone0=stat("stone");
S.col={0:{0:1,1:1,2:1}};   // 3 уникальных камня
T("+2% STONE за каждый уникальный камень", stat("stone")===stone0+6, stat("stone")+" vs "+(stone0+6));
const atk0=stat("atk");
S.col={0:{0:1,1:1,2:1,3:1,4:1,5:1,6:1,7:1}};   // полный сет чертога 1
T("сет чертога 1: массивный ×2 ATK", Math.abs(stat("atk")-atk0*2)<1e-9, stat("atk")+" vs "+(atk0*2));
const luck0=(S.col={},stat("luck"));
S.col={3:{0:1,1:1,2:1,3:1,4:1,5:1,6:1,7:1}};   // сет чертога 4: +5 LUCK flat
T("сет чертога 4: +15% LUCK (с капом 45)", stat("luck")===Math.min(45,luck0+15), "luck="+stat("luck"));
S.col={};

console.log("\n========== ИТОГ: "+pass+" PASS, "+fail+" FAIL ==========");
process.exit(fail?1:0);
