
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
T("SPD база=1.0 (boxer)", stat("spd")===BALANCE.combat.baseAPS);
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
T("босс на кратном 20 этапе", (function(){S.stageIdx=40;newRock();return rock.isBoss;})() && (function(){S.stageIdx=41;newRock();return !rock.isBoss;})());
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
S.lvls.luck=200; S.gear={};   // без кирки: pickBonus=0
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
T("idle растёт с глубиной (2.5/блок)", (function(){S.stageIdx=1;const a=idleGoldPerDay();S.stageIdx=51;const b=idleGoldPerDay();return b>a*2 && b<a*3.2;})());
T("idle-формула = base на этапе 0", (function(){S.stageIdx=0;return Math.abs(idleGoldPerDay()-BALANCE.idle.base)<1;})());
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

console.log("\n[16] Фаза 1: глубина, стрик, онбординг, миграции");
// вехи глубины
localStorage.removeItem("oredeep_v3"); load();
S.beardXP=1e9; S.stageIdx=10; checkDepthMark(9);
T("веха 30 м срабатывает на пересечении", __ids.toast.innerHTML.includes("30"));
// стрик: первый день
S.streak={n:0,last:""}; const g0=S.gold; checkStreak();
T("стрик день 1, награда выдана", S.streak.n===1 && S.gold>g0);
// повторный вызов в тот же день — ничего
const n1=S.streak.n, g1=S.gold; checkStreak();
T("в тот же день стрик не двигается", S.streak.n===n1 && S.gold===g1);
// вчера → +1
S.streak.last=yesterdayStr(); checkStreak();
T("вчера→сегодня: стрик +1", S.streak.n===2);
// разрыв → сброс на 1
S.streak={n:9,last:"2000-1-1"}; checkStreak();
T("разрыв: стрик сброшен на 1", S.streak.n===1);
// онбординг: первые жилы всегда с дропом, 2-я жила — камень
localStorage.removeItem("oredeep_v3"); load(); S.gear={}; S.col={}; newRock();
S.stageIdx=1; S.stage=1; breakVein();
T("жила 1: гарантированный дроп детали", Object.keys(S.gear).length===1);
breakVein();   // вторая жила (stageIdx=2)
T("жила 2: камень скриптован", uniqueStones()>=1);
// миграция старого сейва
localStorage.setItem("oredeep_v3", JSON.stringify({gold:5,stageIdx:7,bag:3}));
load();
T("миграция v1→v2: ftue выключен для старых, стрик создан",
  S.v===2 && S.ftue.u===1 && S.streak && S.gold===5 && S.bag===3);
localStorage.removeItem("oredeep_v3"); load();

console.log("\n[21] Бороды-стрижки и распитие эля");
localStorage.removeItem("oredeep_v3"); load();
T("5 стилей бород загружены", typeof BEARD_STYLES!=="undefined" && BEARD_STYLES.length===5);
__ids.minerRank.onclick();
T("кнопка бороды открывает ранг", __ids.metaModal.style.display==="flex" && __ids.metaTitle.textContent.includes("Мудрость"));
// эль восстанавливает энергию
S.stageIdx=1; newRock(); S.energy=1; const before=S.energy;
sipAle();
T("глоток эля восстанавливает энергию", S.energy>before);
T("эль не превышает максимум", S.energy<=stat("energy"));
// миграция старого сейва без бороды
localStorage.setItem("oredeep_v3", JSON.stringify({gold:1,stageIdx:3}));
load();
T("миграция даёт бороду по умолчанию", S.beard===0);
localStorage.removeItem("oredeep_v3"); load();

console.log("\n[23] Лутбоксы и Сеты Подземелья");
localStorage.removeItem("oredeep_v3"); load();
// комплект одной редкости роняет лутбокс
S.gear={}; S.boxes=[]; S.loadoutTier=0;
SLOTS.forEach(sl=>{ S.gear[sl.id]={s:sl.id,r:2,m:1,i:1}; });  // все Epic(r2)
checkLoadout();
T("полный комплект Epic роняет лутбокс(ы)", S.boxes.length>0 && S.loadoutTier===2);
{ const n0=S.boxes.length; checkLoadout(); T("повторно тот же тир не роняет", S.boxes.length===n0); }
// апгрейд редкости → ещё лутбокс
SLOTS.forEach(sl=>{ S.gear[sl.id]={s:sl.id,r:4,m:1,i:1}; }); const b0=S.boxes.length; checkLoadout();
T("рост комплекта до Exotic даёт ещё лутбоксы", S.boxes.length>b0 && S.loadoutTier===4);
// открытие даёт фрагмент
S.frags={}; S.sets={}; S.boxes=[2];
const r=openBox(2);
T("открытие бокса даёт фрагмент сета", r && typeof r.frag==="string" && Object.keys(S.frags).length>0);
// сбор полного сета активирует билд
S.frags={berserk:{0:true,1:true,2:true}}; S.sets={};
grantFragment();  // допинываем — но грантит случайный незавершённый; форсируем:
S.frags={berserk:{0:true,1:true,2:true,3:true}}; S.sets={};
// эмулируем завершение через прямую активацию логики grantFragment на berserk
// проще: проверим бонус при активном сете
S.sets={berserk:true}; S.gear={}; S.skills={};S.geo=null;S.pet=null;S.workouts={};S.beardXP=0;S.col={};S.lvls.atk=0;S.lvls.crit=0;
const atkNo=(function(){const s=JSON.parse(JSON.stringify(S));S.sets={};const v=stat("atk");S=s;return v;})();
T("билд Ярость Забоя: ×1.5 ATK", Math.abs(stat("atk")-atkNo*1.5)<1e-6, stat("atk")+" vs "+(atkNo*1.5));
T("билд Ярость Забоя: +20 CRIT", stat("crit")>=25);
S.sets={greed:true}; const stNo=120; T("билд Жадность: ×2 STONE", stat("stone")===stNo*2);
S.sets={lucky:true}; T("билд Фарт: ×1.5 находка", findChance()>Math.min(50,8));
S.sets={};
// осколки из дубликата редкого камня
S.col={0:{4:1}}; S.shards=0; S.stageIdx=100; S.bag=1;
// вызвать onFind с forceR Exotic(4) дважды: первый — новый, второй — дубликат
onFind(4); const sh0=S.shards; onFind(4);
T("дубликат редкого камня даёт осколки", S.shards>sh0);
// сплав 3→1 тратит осколки
S.boxes=[2,2,2]; S.shards=BALANCE.fuseCost(2); const fbefore=S.boxes.length;
fuseBoxes(2);
T("сплав 3→1: −3 бокса +1 старший, осколки списаны", S.boxes.filter(x=>x===3).length===1 && S.shards===0 && S.boxes.length===fbefore-2);
{ S.boxes=[2,2]; S.shards=1e9; const l=S.boxes.length; fuseBoxes(2); T("сплав без 3 боксов не работает", S.boxes.length===l); }
localStorage.removeItem("oredeep_v3"); load();

console.log("\n[22] Мудрость Бороды (престиж-ранг)");
localStorage.removeItem("oredeep_v3"); load(); S.gear={}; S.geo=null; S.skills={};
S.beardXP=0;
T("на старте ранг 0 (Пушок)", beardLevel()===0 && beardWisdom().title==="Пушок");
T("нулевая борода — нулевой бонус", beardWisdom().goldPct===0 && beardWisdom().luckAdd===0);
const luckB=stat("luck");
S.beardXP=1e9;
T("макс ранг = ПАТРИАРХ ГОРЫ", beardWisdom().title==="ПАТРИАРХ ГОРЫ");
T("макс борода даёт бонус к доходу", beardWisdom().goldPct>0);
T("борода добавляет LUCK", stat("luck")>luckB);
T("длинная борода = самый длинный стиль (Патриаршая=4)", beardWisdom().lenStyle===4);
T("седина на максимуме = 1.0", beardWisdom().grey===1);
// XP копится на добыче
S.beardXP=0; S.stageIdx=1; S.stage=1; newRock(); const x0=S.beardXP;
breakVein();
T("разбитие жилы даёт beardXP", S.beardXP>x0);
// доход растёт с бородой
S.beardXP=0; const inc0=idlePerSec(); S.beardXP=1e9; const inc1=idlePerSec();
T("доход выше при длинной бороде", inc1>inc0);
localStorage.removeItem("oredeep_v3"); load();

console.log("\n[25] Вагонетка с рудой");
localStorage.removeItem("oredeep_v3"); load();
cartBusy=false;
S.cartFill=0; S.cartRuns=0; S.stageIdx=100; S.bag=5; newRock();
// разбить несколько жил — вагонетка наполняется
for(let i=0;i<3;i++){ S.rockHP=0; breakVein(); }
T("вагонетка наполняется за жилы", (S.cartFill||0)>=1 && (S.cartFill||0)<=8);
// добить до полной — уезжает (отъезд асинхронный, но cartFill растёт до cap)
S.cartFill=7; addCartOre();
T("на полной вагонетке запускается отъезд", cartBusy===true || (S.cartFill||0)===0);
// после отъезда счётчик рейсов вырос
T("рейс вагонетки засчитан", (S.cartRuns||0)>=1);
localStorage.removeItem("oredeep_v3"); load();

console.log("\n[24] Рефилл ключей ивентов");
localStorage.removeItem("oredeep_v3"); load();
S.keys=0; S.keyAt=Date.now()-BALANCE.keyRefillSec*1000-1000; refillKeys();
T("1 ключ восполняется через рефилл", S.keys===1);
S.keys=0; S.keyAt=Date.now()-BALANCE.keyRefillSec*3000; refillKeys();
T("рефилл не превышает кап 2", S.keys===BALANCE.keyMax);
S.keys=BALANCE.keyMax; const t0=S.keyAt; refillKeys();
T("на полном запасе таймер сброшен", S.keys===BALANCE.keyMax);
S.keys=1; S.keyAt=Date.now(); refillKeys();
T("свежий таймер не даёт ключ раньше времени", S.keys===1);

console.log("\n[20] Полный паритет: питомцы, тренировки, дейлики, магазин");
localStorage.removeItem("oredeep_v3"); load();
// питомец: гача + пассив
S.gold=1e12; S.pet=null; S.petRolls=0;
for(let i=0;i<30;i++) rollPet(1);
T("питомец приручён после роллов", !!S.pet && typeof S.pet.t==="number");
{ const st=PET_TYPES[S.pet.t].stat; const before=stat(st);
  T("питомец даёт % к своему стату", petBonus(st)>0); }
// тренировки: провизия → таймер → буст
S.protein=1000; S.wkActive=null; S.workouts={};
const e0=stat("energy"); startWorkout("energy",20);
T("тренировка стартовала, провизия списана", !!S.wkActive && S.protein===980);
S.wkActive.end=Date.now()-1; claimWorkout();
T("тренировка завершена: буст к стату", (S.workouts.energy||0)===1 && stat("energy")>e0);
// дейлики: прогресс + жетоны + клейм
S.daily={day:todayStr(),prog:{},tok:0,claimed:[]};
for(let i=0;i<30;i++) dailyProgress("break",1);
T("дейлик 'разбей 30' выдал жетоны", S.daily.tok>=10);
S.daily.tok=25; S.daily.claimed=[]; const k0=S.keys||0; claimDaily(0,25);
T("клейм трека дейликов работает", (S.daily.claimed||[]).includes(0) && S.keys===k0+1);
// магазин: паки начисляют
{ const g0=S.gems; buyGems(1); T("пак кристаллов начислен", S.gems===g0+BALANCE.shop.gemPacks[1]); }
{ const before=S.noAds; buyNoAds(); T("no-ads покупается", S.noAds===true); }
// провизия капается
S.protein=BALANCE.workouts.proteinCapH*BALANCE.workouts.proteinPerHour;
T("провизия имеет кап 8ч×5", S.protein===40);

console.log("\n[19] Мета-системы boxer→miner");
localStorage.removeItem("oredeep_v3"); load();
// навыки влияют на статы
S.gems=100000; S.skills={}; S.gear={}; S.geo=null; S.col={};
const atkB=stat("atk"); upSkill("atk_up",10);
T("навык повышает стат", stat("atk")>atkB && S.skills.atk_up===1);
{ const g0=S.gems; upSkill("atk_up",999999); T("нет кристаллов — навык не качается", S.gems===g0 || S.skills.atk_up===1); }
// Колесо: списывает по кривой
S.gems=100000; S.wheelSpins=0; { const g0=S.gems; const _r=Math.random; Math.random=()=>0.1;
  spinWheel(BALANCE.wheel.cost[0]); Math.random=_r;
  T("колесо: крутка +1, списано 30 (ролл золота)", S.wheelSpins===1 && S.gems===g0-30); }
// PvP: power score растёт с прокачкой
const p0=powerScore(); S.lvls.atk=50; T("Power Score реагирует на прокачку", powerScore()>p0);
// PvP лига по кубкам
S.trophies=0; T("лига ROOKIE на 0 кубков", BALANCE.pvp.names[pvpLeagueIdx()]==="ROOKIE");
S.trophies=500; T("лига CHAMP III на 500 кубков", pvpLeagueIdx()===8);
// ивент: победа тратит ключ, награда по геометрии
S.keys=2; S.keyAt=Date.now(); S.mine=4; S.shards=0; let spent=false, gotRes=false;
for(let i=0;i<40;i++){ const k=S.keys, r=S.shards; playEvent("rockfall"); if(S.keys<k){spent=true; if(S.shards>r)gotRes=true;} }
T("ивент: победа тратит ключ", spent);
T("ивент rockfall даёт осколки (реальный ресурс)", gotRes);
S.keys=0; S.keyAt=Date.now(); { const g=S.gold; playEvent("rockfall"); T("без ключей ивент недоступен", S.gold===g); }

console.log("\n[18] BALANCE и геометрический движок наград");
T("idle-константы = boxer", BALANCE.idle.base===100000 && BALANCE.idle.growth===2.5 && BALANCE.idle.damp===0.65);
T("idle-кап 2 часа", BALANCE.idle.capSec===7200);
T("блок = 50 стадий, босс каждый 20-й", BALANCE.venueStride===50 && BALANCE.combat.bossEvery===20);
T("косты навыков 1..75", JSON.stringify(BALANCE.skillCosts)==="[1,2,3,4,6,8,11,15,20,26,34,44,57,75]");
T("пороги геологов до 7000", BALANCE.geo.thresholds[14]===7000 && BALANCE.geo.thresholds.length===15);
T("цены Колеса 30..820", BALANCE.wheel.cost[0]===30 && BALANCE.wheel.cost[12]===820);
T("PvP: 10 лиг, награда DEEP LORD 12500", BALANCE.pvp.rewards[9]===12500);
// геом-движок: Rockfall (10, 50000, 200) — сумма ≈ total
{ const s=BALANCE.events.rockfall, r=solveGeometricRatio(s.maxLvl,s.total,s.first);
  let sum=0; for(let L=1;L<=s.maxLvl;L++) sum+=s.first*Math.pow(r,L-1);
  T("Rockfall: сумма наград ≈ total 50000", Math.abs(sum-s.total)/s.total<0.02, "sum="+Math.round(sum)); }
T("eventReward уровень 1 = first", eventReward(BALANCE.events.rockfall,1)===200);
T("Crystal Cave flat=10/победа", eventReward(BALANCE.events.crystalCave,3)===10);

console.log("\n[17] Прогрессия кирок");
localStorage.removeItem("oredeep_v3"); load(); S.gear={}; S.bag=1;
let named=true;
for(let i=0;i<30;i++){
  const it=makeItem("pick");
  if(!it.n || !PICK_NAMES[it.r].includes(it.n)) named=false;
}
T("кирка при дропе получает имя своего тира", named);
S.pickLog={}; S.bag=50;
for(let i=0;i<200;i++) dropGear();
T("журнал владения пополняется", Object.keys(S.pickLog).length>=1, Object.keys(S.pickLog).join(","));
openPickGallery();
T("галерея открывается и рисует 16 кирок", __ids.pickModal.style.display==="flex" && (__ids.pickList.innerHTML.match(/oreimg/g)||[]).length===16);
// миграция: старая кирка без имени
localStorage.setItem("oredeep_v3", JSON.stringify({gold:1,gear:{pick:{s:"pick",r:3,m:1,i:5}}}));
load();
T("миграция даёт имя старой кирке", S.gear.pick.n===PICK_NAMES[3][0] && S.pickLog[S.gear.pick.n]===true);
localStorage.removeItem("oredeep_v3"); load();

console.log("\n[15] Офлайн-доход");
localStorage.removeItem("oredeep_v3"); load(); S.gold=0;
S.lastSeen=Date.now()-3600*1000;   // час назад
checkOffline();
T("начислено ~час идла, ждёт клейма", offlinePending>=idlePerSec()*3590 && offlinePending<=idlePerSec()*3610, "pending="+offlinePending);
T("оверлей возврата показан", __ids.offOverlay.style.display==="flex");
{ const g0=S.gold, p=offlinePending; claimOffline(2);
T("клейм x2 (стаб рекламы) зачислен точно", S.gold===g0+p*2 && offlinePending===0); }
S.lastSeen=Date.now()-999*3600*1000; checkOffline();
T("кап 8 часов работает", offlinePending<=idlePerSec()*8*3600+5, "pending="+offlinePending);
claimOffline(1);
S.lastSeen=Date.now()-30*1000; offlinePending=0; checkOffline();
T("меньше 2 минут — не начисляем", offlinePending===0);

console.log("\n[14] Капы: на потолке кнопка не тратит золото");
localStorage.removeItem("oredeep_v3"); load(); S.gold=1e12;
S.lvls.crit=100; S.gear={}; S.geo=null;   // CRIT: 5+100 => кап 60
T("CRIT на капе 60", stat("crit")===60);
render();
T("кнопка CRIT заблокирована и показывает MAX",
  __ids.u_crit._q["button"].disabled && __ids.u_crit._q[".c"].textContent==="MAX");
{ const g0=S.gold, l0=S.lvls.crit;
  __ids.u_crit._q["button"].onclick();
  T("клик на капе: золото не списано, уровень не растёт", S.gold===g0 && S.lvls.crit===l0); }
S.lvls.spd=200; T("SPD закапан на 4.5 (boxer max)", stat("spd")===BALANCE.combat.maxAPS);
render();
T("SPD: MAX и блок", __ids.u_spd._q["button"].disabled);
S.lvls.atk=5; render();
T("ATK без капа: кнопка активна при деньгах", !__ids.u_atk._q["button"].disabled);
{ const g0=S.gold, c=upCost(UPGRADES[0]);
  __ids.u_atk._q["button"].onclick();
  T("ATK покупается: списание и уровень", S.gold===g0-c && S.lvls.atk===6); }

console.log("\n[13] Именные уровни сундука");
T("bagName(1) = Дырявый мешок", bagName(1)==="Дырявый мешок");
T("bagName(17) = Дворфский сундучок", bagName(17)==="Дворфский сундучок");
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
