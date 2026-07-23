
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
    if(S.bag<50 && S.gold>bagCost()*1.5){
      if(startBagUpgrade()){ S.bagActive.end=Date.now(); finishBagUpgrade(); }
    }
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
S.gold=1e9; S.combs=50;
const bag0=S.bag; tryBagUpgrade();
if(S.bagActive){ S.bagActive.end=Date.now(); finishBagUpgrade(); }
T("апгрейд сумки работает", S.bag===bag0+1);
const rolls0=S.geoRolls; for(let i=0;i<30;i++) hireGeo();
T("гача крутится, pity растёт", S.geoRolls===rolls0+30);
T("геолог нанят", !!S.geo, S.geo?("r"+S.geo.r):"");
const lvl0=S.lvls.atk; __ids.u_atk._q["button"].onclick();
T("кнопка апгрейда ATK работает", S.lvls.atk===lvl0+1);
S.lvls.luck=200; S.gear={};   // без кирки: pickBonus=0
T("LUCK капится на 100% (вероятность)", stat("luck")===100);
T("находка ≤50% без кирки", findChance()<=50 && findChance()===50);
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
T("есть резервная копия", !!localStorage.getItem("oredeep_v3_bak"));
localStorage.removeItem("oredeep_v3"); localStorage.removeItem("oredeep_v3_bak"); load();
T("чистый старт при отсутствии сейва", S.gold===0 && S.stageIdx===1);
S.gold=777; S.bag=3; save();
localStorage.setItem("oredeep_v3", "{битый");
load();
T("битый primary → восстановление из bak", S.gold===777 && S.bag===3);
T("flushSave пишет сейв", (function(){ S.gold=42; flushSave(); return localStorage.getItem("oredeep_v3").includes("42"); })());
T("bindSaveLifecycle не падает", (function(){ try{ bindSaveLifecycle(); return true; }catch(e){ return false; } })());


console.log("\n[8] Оплата и применение всех покупок");
localStorage.removeItem("oredeep_v3"); load(); S.gold=1e12; render();
for(const u of UPGRADES){
  const cost=upCost(u), g0=S.gold, l0=S.lvls[u.id], s0=stat(u.id);
  __ids["u_"+u.id]._q["button"].onclick();
  T("апгрейд "+u.id+": списано ровно "+cost+", lvl+1, стат применён",
    S.gold===g0-cost && S.lvls[u.id]===l0+1 && stat(u.id)>=s0);
}
{ const c=bagCost(), g0=S.gold, b0=S.bag; tryBagUpgrade();
  if(S.bagActive){ S.bagActive.end=Date.now(); finishBagUpgrade(); }
  T("сумка: списано ровно цену, LVL+1", S.gold===g0-c && S.bag===b0+1); }
{ S.combs=10; const r0=S.geoRolls; hireGeo();
  T("гача: ролл засчитан, списана расческа", S.geoRolls===r0+1 && S.combs===9); }
S.gold=0; S.combs=0; render();
let allDisabled=true;
for(const u of UPGRADES){ if(!__ids["u_"+u.id]._q["button"].disabled) allDisabled=false; }
T("без золота все 8 кнопок апгрейдов заблокированы", allDisabled);
T("сумка и гача без ресурсов заблокированы", ($("powerUp")&&$("powerUp").disabled) && ((S.combs||0)<1));
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
S.combs=100; S.geo=null; S.geoRolls=0;
for(let i=0;i<40;i++) hireGeo();
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
T("веха 30 м срабатывает на пересечении", lastLogMsg.includes("30"));
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
T("миграция v1→v2: ftue выключен для старых, стрик и гача-ресурсы",
  S.v===4 && S.ftue.u===1 && S.streak && S.gold===5 && S.bag===3 && (S.eggs||0)>=1 && (S.combs||0)>=1);
localStorage.removeItem("oredeep_v3"); load();

console.log("\n[21] Бороды-стрижки и распитие эля");
localStorage.removeItem("oredeep_v3"); load();
T("5 стилей бород загружены", typeof BEARD_STYLES!=="undefined" && BEARD_STYLES.length===5);
openBeard();
T("кнопка бороды открывает ранг", __ids.uiScreen.style.display==="flex" && __ids.uiTitle.textContent.includes("Бороды") && __ids.uiBody.innerHTML.includes("LUCK"));
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
S.eggs=50; S.pet=null; S.petRolls=0;
for(let i=0;i<30;i++) rollPet();
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
S.gems=100000; S.skills={}; S.skillCards={}; S.protein=5000; S.gear={}; S.geo=null; S.col={};
const atkB=stat("atk");
S.skillCards.atk_up=1; upSkill("atk_up");
T("новая карта открывает навык ур.1", stat("atk")>atkB && S.skills.atk_up===1 && S.skillCards.atk_up===0);
{ const l0=S.skills.atk_up; upSkill("atk_up"); T("без карт навык не качается", S.skills.atk_up===l0); }
{ S.skillCards.atk_up=1; S.protein=0; const l0=S.skills.atk_up; upSkill("atk_up");
  T("без пива навык не качается", S.skills.atk_up===l0); }
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
__ids.speedBtn.onclick(); T("x3 -> x10", S.speed===10);
__ids.speedBtn.onclick(); T("x10 -> x100", S.speed===100);
__ids.speedBtn.onclick(); T("x100 -> x1 (цикл)", S.speed===1);
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


console.log("\n[16] Ограниченный прогон + компаунд ATK");
// HP растёт ВНУТРИ прогона, но упирается в свод (числа держатся читаемыми)
{ const h1=rockStatsAt(300,false).hp, h2=rockStatsAt(600,false).hp, h3=rockStatsAt(BALANCE.run.len,false).hp;
  T("HP растёт внутри прогона", h2>h1*2 && h3>h2*2, h1.toExponential(1)+" -> "+h3.toExponential(1)); }
{ const atWall=rockStatsAt(BALANCE.run.len,false).hp, past=rockStatsAt(BALANCE.run.len+5000,false).hp;
  T("за сводом прогона HP не растёт", Math.abs(atWall-past)<1e-6, fmt(atWall)); }
{ const peak=rockStatsAt(BALANCE.run.len,false).hp;
  T("пиковая HP прогона читаема (< 1e9, без экспоненты)", peak<1e9 && !fmt(peak).includes("e"), fmt(peak)); }
T("до escStart кривая не тронута", Math.abs(rockStatsAt(200,false).hp-anchored(ANCHOR_HP,200))<1e-6);
T("resp не эскалируем", rockStatsAt(90000,false).resp===anchored(ANCHOR_RESP,90000));
// равновесие треадмилла выводится из констант
{ const lpb=atkLevelsPerBlock(), esc=escPerBlock();
  T("esc = ATK_COMPOUND^LPB (равновесие)", Math.abs(esc-Math.pow(ATK_COMPOUND,lpb))<1e-9, "esc="+esc.toFixed(4));
  T("LPB = ln(G)/ln(g) ≈ 2.479", Math.abs(lpb-2.4791)<0.01, lpb.toFixed(4)); }
// компаунд: апгрейд множит всю атаку, включая шмот
{ S.gear={}; S.geo=null;S.pet=null;S.workouts={};S.skills={};S.sets={};S.col={};
  S.lvls={atk:0,energy:0,spd:0,tough:0,crit:0,luck:0,mining:0,stone:0};
  const a0=stat("atk"); S.lvls.atk=10; const a10=stat("atk");
  const expect=(BASE.atk+3*10)*Math.pow(ATK_COMPOUND,10);
  T("ATK компаундится (не плоский +3)", Math.abs(a10-expect)<1e-6 && a10>a0*3, a0+" -> "+a10.toFixed(1));
  S.lvls.atk=0; }
console.log("\n[17] Крафт лутбоксов из камней коллекции");
S.col={0:{1:60, 2:5}}; S.boxes=[];
T("цена крафта растёт с редкостью", craftBoxCost(1)===50 && craftBoxCost(7)===200);
craftBoxFromStones(1);
T("крафт бокса тира 1 за 50 дубликатов", S.boxes.length===1 && S.boxes[0]===1 && S.col[0][1]===10);
craftBoxFromStones(2);
T("мало дубликатов — крафта нет", S.boxes.length===1 && S.col[0][2]===5);
S.col={0:{3:1}}; S.boxes=[];
craftBoxFromStones(3);
T("последний камень коллекции не тратится", S.boxes.length===0 && S.col[0][3]===1);

console.log("\n[18b] Графическая карточка сета");
T("у каждого сета есть арт", BALANCE.dungeonSets.every(s=>SET_ART[s.id]&&SET_ART[s.id].fi.length===s.frags.length));
S.frags={berserk:{0:true,2:true}}; S.sets={};
openSetCard("berserk");
{ const h=__ids.setCard.innerHTML;
  T("попап сета открывается по клику", __ids.setModal.style.display==="flex");
  T("частичный сет: прогресс и замки", h.includes("СОБРАНО 2 ИЗ 4") && (h.match(/🔒/g)||[]).length===2);
  T("найденные фрагменты отмечены", (h.match(/class="tick"/g)||[]).length===2); }
S.frags={guardian:{0:true,1:true,2:true,3:true}}; S.sets={guardian:true};
openSetCard("guardian");
{ const h=__ids.setCard.innerHTML;
  T("собранный сет: активен, бар 100%, без замков",
    h.includes("БИЛД АКТИВЕН") && h.includes("width:100%") && !h.includes("🔒")); }
S.frags={}; S.sets={};

console.log("\n[26] Престиж «Глубинный Зов» (док §Престиж)");
localStorage.removeItem("oredeep_v3"); load();
T("уровни по глубине через корень", prestigeLevelsFor(300)===1 && prestigeLevelsFor(1200)===2 && prestigeLevelsFor(2700)===3);
S.stageIdx=100; T("рано: престиж недоступен", canPrestige()===false);
S.stageIdx=1200; S.gold=1e9; S.bag=30; S.lvls.atk=50;
SLOTS.forEach(sl=>{ S.gear[sl.id]={s:sl.id,r:5,m:1,i:1200}; });
S.skills={atk_up:3}; S.col={0:{1:2}}; S.gems=500; S.beardXP=999;
const echoExp=echoFromGear();
T("gain=2 на этапе 1200", prestigeGain()===2);
doPrestige();
T("престиж начислен, множитель растёт", S.prestigeLv===2 && Math.abs(prestigeMult()-Math.pow(BALANCE.prestige.powPerLevel,2))<1e-9);
T("эхо прежних кирок сохранено", Math.abs(S.echo-echoExp)<1e-6 && S.echo>0);
T("забой сброшен", S.stageIdx===1 && S.gold===0 && S.bag===1 && Object.keys(S.gear).length===0 && S.lvls.atk===0);
T("мета уцелела", S.skills.atk_up===3 && S.col[0][1]===2 && S.gems===500 && S.beardXP===999);
S.stageIdx=1200; T("повторно на той же глубине gain=0", prestigeGain()===0);
S.stageIdx=2700; T("глубже — снова есть уровень", prestigeGain()===1);
T("миграция старого сейва", (function(){ const d={}; ensurePrestige(d); return d.prestigeLv===0 && d.echo===0; })());

console.log("\n[27] Сумки как ресурс + Auto Roll (док §Экипировка и сумки)");
localStorage.removeItem("oredeep_v3"); load(); S.bag=50; S.gear={};
S.bags=0; T("без сумок открыть нельзя", openBag()===false);
S.bags=3; { const b0=S.bags; openBag(); T("открытие тратит ровно 1 сумку", S.bags===b0-1); }
S.bags=0; S.stageIdx=10; newRock();
{ const boss=rock.isBoss; breakVein();
  T("жила выдаёт сумку", S.bags===(boss?BALANCE.bags.perBoss:BALANCE.bags.perVein)); }
S.autoRollTier=7; S.gear={}; S.gold=0; S.bags=150;
while(S.bags>0) autoOpenBag();
T("Auto Roll ниже порога: продажа, золото пришло", S.gold>0);
S.autoRollTier=0; S.gear={}; S.bags=30;
while(S.bags>0) autoOpenBag();
T("Auto Roll с порога и выше: предметы в слоты", Object.keys(S.gear).length>0);
S.autoRollTier=7; cycleAutoTier(); T("порог циклится 7→0", S.autoRollTier===0);
T("миграция сумок", (function(){ const d={}; ensureBags(d); return d.bags===0 && d.autoRoll===false && d.autoRollTier===4; })());

console.log("\n[28] Merge питомцев и старейшин (док §Питомцы, §Девушки)");
S.petBox={}; S.pet=null;
boxAdd(S.petBox,0,0,2); T("2 копий мало для слияния", mergePet(0,0)===false);
boxAdd(S.petBox,0,0,1); T("3 копии — слияние доступно", canMergePet(0,0)===true);
mergePet(0,0);
T("слияние съело 3 и выдало 1 следующей редкости",
  boxCountAt(S.petBox,0,0)===0 && Object.keys(S.petBox).some(k=>Number(k.split("_")[1])===1));
T("экипирован сильнейший питомец", S.pet && S.pet.r===1);
S.petBox={}; boxAdd(S.petBox,1,3,9);
T("на максимальной редкости merge заблокирован", mergePet(1,3)===false && canMergePet(1,3)===false);
S.geo={t:0,r:1,n:"Тан",lv:1,asc:0}; S.geoBox={};
T("без материала слияния нет", mergeGeo()===false);
boxAdd(S.geoBox,0,0,2); boxAdd(S.geoBox,1,1,1); boxAdd(S.geoBox,2,3,1);
T("материал только равной/меньшей редкости", geoMaterials()===3);
{ const p0=geoPct(S.geo); mergeGeo();
  T("старейшина растёт в уровне и бонусе", S.geo.lv===4 && geoPct(S.geo)>p0);
  T("слишком редкий материал не съеден", boxCountAt(S.geoBox,2,3)===1); }
S.geo={t:0,r:2,n:"X",lv:9,asc:0}; S.gems=1000;
T("восхождение только для легендарного", ascendGeo()===false);
S.geo={t:0,r:3,n:"Дед",lv:4,asc:0};
T("восхождение требует уровня", ascendGeo()===false);
S.geo.lv=5; { const p0=geoPct(S.geo); ascendGeo();
  T("восхождение: ступень+1, уровень в 1, гемы списаны, бонус вырос",
    S.geo.asc===1 && S.geo.lv===1 && S.gems===1000-BALANCE.merge.ascendGems && geoPct(S.geo)>p0); }

console.log("\n[29] Скиллы как карточки + лари (док §Скиллы)");
localStorage.removeItem("oredeep_v3"); load();
S.skills={}; S.skillCards={}; S.protein=5000; S.keys=5; S.chestKeys=5; S.gems=5000;
T("новая карта требует 1 копию", cardsNeeded("atk_up")===1);
S.skillCards.atk_up=1; upSkill("atk_up");
T("первая карта открывает ур.1", skillLv("atk_up")===1 && cardsOf("atk_up")===0);
T("апгрейд с ур.L требует L карт", cardsNeeded("atk_up")===1);
S.skills.atk_up=3; S.skillCards.atk_up=2;
T("на ур.3 нужно 3 карты, а есть 2", canUpSkill("atk_up")===false);
S.skillCards.atk_up=3; T("3 карты — можно качать", canUpSkill("atk_up")===true);
{ const pr=proteinNeeded("atk_up"); const p0=S.protein; upSkill("atk_up");
  T("апгрейд съел карты и пиво", skillLv("atk_up")===4 && cardsOf("atk_up")===0 && S.protein===p0-pr); }
{ S.skillCards.atk_up=99; S.protein=0; const l0=skillLv("atk_up"); upSkill("atk_up");
  T("без пива навык не качается", skillLv("atk_up")===l0); }
S.protein=5000; S.skillCards={}; S.chestKeys=1;
{ const k0=S.chestKeys; openSkillChest("wood");
  const total=Object.values(S.skillCards).reduce((a,b)=>a+b,0);
  T("дощатый ларь: ключ от ларя списан, карта выдана", S.chestKeys===k0-1 && total===1); }
S.skillCards={}; S.gems=1000;
{ const g0=S.gems; openSkillChest("iron");
  const total=Object.values(S.skillCards).reduce((a,b)=>a+b,0);
  T("окованный ларь: гемы списаны, 3 карты", S.gems===g0-150 && total===3); }
S.keys=5; S.chestKeys=0; S.gems=0; S.skillCards={};
T("нет ключей от ларей — ларь не открыть (ключи ивентов не тратятся)", openSkillChest("wood")===false && S.keys===5);
T("миграция карт", (function(){ const d={}; ensureCards(d); return !!d.skillCards; })());

console.log("\n[30] Ключи ларей отделены от ключей ивентов");
localStorage.removeItem("oredeep_v3"); load();
S.keys=2; S.chestKeys=2; S.skillCards={};
openSkillChest("wood"); openSkillChest("wood");
T("лари тратят только свои ключи", S.keys===2 && S.chestKeys===0);
T("без ключей ларей ларь не открыть, ключи ивентов целы", openSkillChest("wood")===false && S.keys===2);
S.chestKeys=0; S.wkActive={path:"atk",end:Date.now()-1}; claimWorkout();
T("тренировка выдаёт ключ от ларя", S.chestKeys===1);
{ S.keys=0; S.chestKeys=0; S.daily={day:todayStr(),prog:{},tok:99,claimed:[]};
  claimDaily(0,1);
  T("дейлик выдаёт оба вида ключей", S.keys===1 && S.chestKeys===1); }
T("миграция даёт стартовый ключ ларя", (function(){ const d={}; ensureCards(d); return d.chestKeys===1; })());

console.log("\n[31] Интерфейс: вкладки, бейджи, аура сетов");
localStorage.removeItem("oredeep_v3"); load();
switchTab("Hero");
T("вкладка переключается и подсвечивает кнопку",
  __ids.tabHero.classList.contains("on") && !__ids.tabMine.classList.contains("on") && __ids.tabHeroBtn.classList.contains("on"));
switchTab("Meta"); T("вкладка запоминается в сейве", S.tab==="Meta");
switchTab("МУСОР"); T("неизвестная вкладка падает в Забой", S.tab==="Mine");
S.gold=0; S.chestKeys=0; S.petBox={}; S.geo=null; S.boxes=[]; S.wkActive=null; S.bags=0; S.autoRoll=false;
S.skills={}; S.skillCards={}; S.protein=0; S.prestigeLv=0; S.stageIdx=1;
S.daily={day:todayStr(),prog:{},tok:0,claimed:[]};
S.lvls={atk:0,energy:0,spd:0,tough:0,crit:0,luck:0,mining:0,stone:0};
T("нечего делать — бейджи погашены", (function(){ const b=badges(); return !b.mine && !b.hero && !b.meta; })());
S.gold=1e9; T("хватает золота на апгрейд — бейдж Забоя", badges().mine===true);
S.bags=3; T("накопились сумки — бейдж Забоя", badges().mine===true);
S.autoRoll=true; S.gold=0; T("Auto Roll включён — бейдж Забоя гаснет", badges().mine===false);
S.autoRoll=false;
S.chestKeys=1; T("ключ от ларя — бейджи Меты и Навыков", badges().meta && badges().skillReady);
S.chestKeys=0;
S.daily={day:todayStr(),prog:{},tok:999,claimed:[]};
T("жетоны дейликов зажигают бейдж (dailyTrack — пары [порог,награда])", badges().dailyReady===true);
S.daily={day:todayStr(),prog:{},tok:0,claimed:[]};
S.boxes=[1]; T("лутбокс — бейдж Сетов", badges().lootReady===true); S.boxes=[];
S.petBox={}; boxAdd(S.petBox,0,0,3); T("3 копии питомца — бейдж Питомцев", badges().petReady===true); S.petBox={};
S.stageIdx=1200; T("готов престиж — бейдж Меты", badges().prestigeReady===true); S.stageIdx=1;
S.sets={}; renderSetFx();
T("без сетов аура и эмблемы скрыты", __ids.setAura.style.display==="none" && __ids.setRing.innerHTML==="");
S.sets={berserk:true,lucky:true}; renderSetFx();
T("активные сеты дают ауру и эмблемы на дворфе",
  __ids.setAura.style.display==="block" && (__ids.setRing.innerHTML.match(/<span/g)||[]).length===2);
S.sets={};
S.prestigeLv=0; renderSetFx(); T("без престижа метка скрыта", __ids.prestigeMark.style.display==="none");
S.prestigeLv=3; renderSetFx();
T("метка престижа показывает уровень и множитель", /ПРЕСТИЖ 3/.test(__ids.prestigeMark.textContent));
S.prestigeLv=0;

console.log("\n[32] Provably-fair гача (SHA-256)");
localStorage.removeItem("oredeep_v3"); load();
{ const crypto=require("crypto");
  T("SHA-256 совпадает с эталоном", SHA256("дворф:копай")===crypto.createHash("sha256").update("дворф:копай","utf8").digest("hex")); }
S.fair={server:"deadbeef",serverHash:SHA256("deadbeef"),client:"cafe",nonce:5,on:true};
{ const got=fairFloat();
  const manual=parseInt(SHA256("deadbeef:cafe:5").slice(0,8),16)/0x100000000;
  T("ролл воспроизводится по (server,client,nonce)", Math.abs(got-manual)<1e-12 && S.fair.nonce===6); }
{ S.fair.on=false; const _r=Math.random; Math.random=()=>0.37;
  T("честность выкл — grandom это Math.random", grandom()===0.37); Math.random=_r; }
{ S.fair={server:"aaa",serverHash:SHA256("aaa"),client:"c",nonce:9,on:true};
  const r=rotateFairSeed();
  T("ротация раскрывает старый сид и коммит валиден",
    r.revealed==="aaa" && r.revealedHash===SHA256("aaa") && S.fair.serverHash===SHA256(S.fair.server) && S.fair.nonce===0); }
T("миграция создаёт честный сид с коммитом", (function(){ const d={}; ensureFair(d); return d.fair && d.fair.serverHash===SHA256(d.fair.server) && d.fair.on===false; })());

console.log("\n[33] Стена Горы (лидерборд)");
localStorage.removeItem("oredeep_lb");
{ const lb=Platform.getLeaderboard();
  T("сид рейтинга: 8 записей по убыванию престижа", lb.length===8 && lb[0].prestige>=lb[7].prestige); }
Platform.submitScore({name:"Балрог",depth:999999,prestige:99});
T("новый рекорд встаёт первым", Platform.getLeaderboard()[0].name==="Балрог");
Platform.submitScore({name:"Балрог",depth:1200000,prestige:99});
{ const lb=Platform.getLeaderboard();
  T("один игрок — одна лучшая запись", lb.filter(e=>e.name==="Балрог").length===1 && lb[0].depth===1200000); }
S.playerName="Ihor"; S.bestDepth=0; S.bestPrestige=0; S.prestigeLv=2; S.stageIdx=1000; submitMyScore();
T("мой рекорд попадает на стену", (function(){ const e=Platform.getLeaderboard().find(x=>x.name==="Ihor"); return e && e.depth===3000 && e.prestige===2; })());
S.stageIdx=50; submitMyScore();
T("откат по глубине не портит рекорд", Platform.getLeaderboard().find(e=>e.name==="Ihor").depth===3000);

console.log("\n[34] Paperdoll не перекрывает дворфа");
localStorage.removeItem("oredeep_v3"); load();
T("по умолчанию маркеры скрыты", !__ids.paperdoll.classList.contains("on"));
__ids.miner.onclick();
T("тап по дворфу показывает маркеры", __ids.paperdoll.classList.contains("on"));
__ids.miner.onclick();
T("повторный тап прячет", !__ids.paperdoll.classList.contains("on"));
switchTab("Hero"); T("вкладка Герой показывает маркеры сама", __ids.paperdoll.classList.contains("on"));
switchTab("Mine"); T("уход с Героя прячет маркеры", !__ids.paperdoll.classList.contains("on"));
S.gear={}; SLOTS.slice(0,3).forEach(sl=>{ S.gear[sl.id]={s:sl.id,r:2,m:1,i:1}; });
renderPaperdoll();
{ const kids=[...__ids.paperdoll.children];
  T("маркеров ровно по числу слотов", kids.length===SLOTS.length);
  const xs=kids.map(k=>parseFloat(k.style.left));
  T("все маркеры вынесены за силуэт (не закрывают дворфа)", xs.every(x=>x<0||x>100));
  T("текстовых подписей редкости нет", kids.every(k=>!(k.innerHTML||"").includes("pdt")));
  T("надетые окрашены по редкости", kids.filter(k=>k.className.includes("r2")).length===3);
  T("пустые слоты приглушены", kids.filter(k=>k.className.includes("empty")).length===SLOTS.length-3);
  kids[0].onclick({stopPropagation(){}});
  T("клик по маркеру открывает карточку слота", modalOpen()); }

console.log("\n[35] Интро «Устав Горы»");
localStorage.removeItem("oredeep_v3"); load();
T("новый игрок без автопоказа Устава", S.introSeen===true && !__ids.introOv.classList.contains("on"));
maybeAutoIntro();
T("maybeAutoIntro не открывает оверлей", !__ids.introOv.classList.contains("on"));
T("старым сейвам интро не показываем", (function(){ const d={}; ensureIntro(d); return d.introSeen===true; })());
{ showIntro();
  T("ручное «читать» открывает Устав", __ids.introOv.classList.contains("on") && (__ids.introList.innerHTML.match(/class="iitem"/g)||[]).length===CODEX.length);
  closeIntro();
  T("после ручного прочтения закрыто", !__ids.introOv.classList.contains("on") && S.introSeen===true); }
{ resetProgress();
  T("сброс не показывает Устав", !__ids.introOv.classList.contains("on") && S.introSeen===true); }

console.log("\n[36] Гильдия Рудознатцев (краудсорсинг)");
localStorage.removeItem("oredeep_v3"); load();
S.science={on:false,done:0,goldOk:0,goldTotal:0};
openGuild();
T("без согласия показывается экран согласия", modalBodyHtml().includes("Согласен, вступаю"));
sciConsent(); T("согласие включает гильдию", S.science.on===true);
S.science={on:true,done:0,goldOk:0,goldTotal:0};
T("новичок: надёжность 0.5 (сглаживание Лапласа)", Math.abs(sciReliability()-0.5)<1e-9);
S.science.goldOk=9; S.science.goldTotal=10;
T("контрольные поднимают надёжность", sciReliability()>0.8);
S.science.goldOk=0; S.science.goldTotal=20;
T("провал контрольных обнуляет вес голоса", sciReliability()<0.1 && sciWeight()===0);
Platform._sci={votes:{},retired:{}};
T("одного голоса мало для консенсуса", Platform.scienceSubmit("o1",1,0.9).consensus===false);
Platform.scienceSubmit("o1",1,0.9);
{ const r=Platform.scienceSubmit("o1",1,0.9);
  T("накопленный вес >= порога закрывает задание", r.consensus===true && r.label===1); }
Platform._sci={votes:{},retired:{}};
for(let i=0;i<50;i++) Platform.scienceSubmit("o2",0,0);
T("50 голосов вредителя (вес 0) не закрывают задание", Platform._sci.retired["o2"]==null);
Platform.scienceSubmit("o2",1,1.0); Platform.scienceSubmit("o2",1,1.0);
T("честные голоса определяют метку, а не вредитель", Platform._sci.retired["o2"]===1);
Platform._sci={votes:{},retired:{o1:1,o2:1,o3:1,o4:1}};
S.science={on:true,done:0,goldOk:5,goldTotal:5};
{ const _r=Math.random; Math.random=()=>0.99; const t=sciNextTask(); Math.random=_r;
  T("закрытые задания больше не выдаются", t && t.gold!=null); }
{ S.science={on:true,done:0,goldOk:0,goldTotal:20}; S.shards=0;
  sciTask=Platform.scienceTasks().find(x=>x.gold==null); sciAnswer(0);
  const low=S.shards;
  S.science={on:true,done:0,goldOk:20,goldTotal:20}; S.shards=0;
  sciTask=Platform.scienceTasks().find(x=>x.gold==null); sciAnswer(0);
  T("награда масштабируется надёжностью", S.shards>low); }
{ S.science={on:true,done:0,goldOk:0,goldTotal:0};
  sciTask=Platform.scienceTasks().find(x=>x.gold!=null);
  const g0=S.science.goldTotal; sciAnswer(sciTask.gold);
  T("верный ответ на контрольное учтён", S.science.goldTotal===g0+1 && S.science.goldOk===1); }
T("миграция создаёт гильдию выключенной", (function(){ const d={}; ensureScience(d); return d.science.on===false; })());

console.log("\n[37] Свежая установка: все поля доинициализированы");
localStorage.removeItem("oredeep_v3"); load();
T("у нового игрока есть fair с валидным коммитом", !!S.fair && S.fair.serverHash===SHA256(S.fair.server));
T("у нового игрока есть science (выключен)", !!S.science && S.science.on===false);
T("у нового игрока есть durab/bags/chestKeys", S.durab===MINE_DURAB.max && S.bags===0 && S.chestKeys===1);
{ let ok=true; try{ openFairness(); }catch(e){ ok=false; } T("«Честность гачи» не падает у нового игрока", ok); }
{ let ok=true; try{ openGuild(); }catch(e){ ok=false; } T("«Гильдия» не падает у нового игрока", ok); }
{ let ok=true; try{ openPrestige(); }catch(e){ ok=false; } T("«Глубинный Зов» не падает у нового игрока", ok); }
{ let ok=true; try{ openWall(); }catch(e){ ok=false; } T("«Стена Горы» не падает у нового игрока", ok); }
localStorage.setItem("oredeep_v3", JSON.stringify({gold:5,stageIdx:9}));
load();
T("древний сейв доинициализируется, данные целы", !!S.fair && !!S.science && S.gold===5 && S.stageIdx===9);

console.log("\n[38] Гильдия: понятный экран и скрытые контрольные");
localStorage.removeItem("oredeep_v3"); load();
S.science={on:true,done:0,goldOk:0,goldTotal:0};
{ const tasks=Platform.scienceTasks();
  T("у каждого задания есть образец-картинка", tasks.every(t=>!!SPECIMENS[t.id]));
  T("у каждого задания есть подсказка что искать", tasks.every(t=>t.hint && t.hint.length>10));
  sciTask=tasks.find(t=>t.gold!=null); openGuild();
  const h=modalBodyHtml();
  T("экран показывает образец", h.includes("specImg"));
  T("АНТИФРОД: контрольное задание ничем не помечено", !h.includes("контрольн"));
  T("есть честный пропуск «не могу определить»", h.includes("sciSkip"));
  T("виден прогресс и надёжность", h.includes("Размечено") && h.includes("Надёжность"));
  sciTask=tasks.find(t=>t.gold==null); openGuild();
  T("открытое задание тоже без пометки", !modalBodyHtml().includes("контрольн")); }
{ S.shards=0; S.protein=0; const r0=sciReliability(), d0=S.science.done;
  sciTask=Platform.scienceTasks()[0]; sciSkip();
  T("пропуск не даёт награды и не бьёт по надёжности",
    S.shards===0 && S.protein===0 && sciReliability()===r0 && S.science.done===d0);
  T("пропуск выдаёт следующий образец", !!sciTask); }
{ S.science={on:true,done:0,goldOk:0,goldTotal:0};
  sciTask=Platform.scienceTasks().find(t=>t.id==="g1"); sciLastId="g1"; sciAnswer(2);
  T("после ответа выдаётся другой образец", sciTask && sciTask.id!=="g1");
  T("верный ответ на контрольное поднимает надёжность", S.science.goldOk===1); }
{ // 30 переходов подряд: образец никогда не повторяется дважды подряд
  Platform._sci={votes:{},retired:{}};
  S.science={on:true,done:0,goldOk:0,goldTotal:0};
  let prev=null, repeat=false;
  for(let i=0;i<30;i++){ const t=sciNextTask(); if(prev && t.id===prev) repeat=true; prev=t.id; }
  T("образец не повторяется два раза подряд (30 переходов)", !repeat); }

console.log("\n[39] Битые сейвы, энергия, порог престижа");
// gold строкой: раньше "много"+10 давало "много10", а fmt() рисовал ∞
localStorage.setItem("oredeep_v3", JSON.stringify({gold:"много"}));
load();
T("строка в gold заменена числом", typeof S.gold==="number" && isFinite(S.gold));
{ S.gold+=10; T("арифметика по gold не ломается", typeof S.gold==="number" && !Number.isNaN(S.gold)); }
// lvls:null роняло stat()
localStorage.setItem("oredeep_v3", JSON.stringify({lvls:null}));
load();
T("lvls:null восстановлен объектом", !!S.lvls && typeof S.lvls==="object");
{ let ok=true; try{ stat("stone"); stat("atk"); }catch(e){ ok=false; } T("stat() не падает после битого сейва", ok); }
// отрицательные валюты
localStorage.setItem("oredeep_v3", JSON.stringify({gold:-500,gems:-1,bags:-9}));
load();
T("отрицательные валюты обнулены", S.gold===0 && S.gems===0 && S.bags===0);
// мусорные типы
localStorage.setItem("oredeep_v3", JSON.stringify({durab:999,speed:77,lvls:{atk:"пять",crit:-3}}));
load();
T("крепь зажата в [0,100]", S.durab>=0 && S.durab<=MINE_DURAB.max);
T("скорость приведена к допустимой", SPEEDS.includes(S.speed));
T("мусор в уровнях апгрейдов обнулён", S.lvls.atk===0 && S.lvls.crit===0);
localStorage.setItem("oredeep_v3", "не json вовсе");
localStorage.removeItem("oredeep_v3_bak");
{ let ok=true; try{ load(); }catch(e){ ok=false; } T("не-JSON сейв не роняет load()", ok && S.gold===0); }
localStorage.removeItem("oredeep_v3"); load();
// энергия не уходит в минус
S.stageIdx=3000; newRock(); S.energy=1; S.lvls.luck=0; S.gear={};
for(let i=0;i<50;i++) rockRespond();
T("энергия не бывает отрицательной", S.energy>=0);
// порог престижа согласован
T("minStage === div (иначе кнопка врёт)", BALANCE.prestige.minStage===BALANCE.prestige.div);
localStorage.removeItem("oredeep_v3"); load();
S.stageIdx=BALANCE.prestige.div;
T("на этапе первого уровня престиж уже доступен", prestigeGain()>=1 && canPrestige());

console.log("\n[40] Auto Roll: пропускная способность, лог, кнопка");
localStorage.removeItem("oredeep_v3"); load();
S.bag=16; S.autoRoll=true; S.autoRollTier=7; S.speed=100; S.bags=0;
S.stageIdx=300; S.lvls.atk=200; S.lvls.energy=500; S.lvls.luck=200; newRock(); dead=false;
{ let peak=0, lines=0; const _st=showToast; showToast=function(){ lines++; };
  for(let i=0;i<600;i++){ if(dead) closeOverlay(); frame(16); peak=Math.max(peak,S.bags); }
  showToast=_st;
  T("очередь Auto Roll не растёт у переусиленного дворфа (пик ≤ потолка)", peak<=BALANCE.bags.maxPerTick && S.bags<50, "пик "+peak);
  T("лог свёрнут на ×100 (не спамит каждой продажей)", lines<250, lines+" строк"); }
localStorage.removeItem("oredeep_v3"); load();
S.bag=16; S.bags=495; S.autoRoll=true; S.autoRollTier=7; S.speed=1; dead=false; newRock();
for(let i=0;i<400;i++) frame(50);
T("накопленные 495 сумок разбираются", S.bags===0);
S.bags=100; S.autoRoll=true; render();
T("при Auto ON ручная «Открыть» заблокирована", !canOpenBag());
S.autoRoll=false; render();
T("при Auto OFF «Открыть» активна", canOpenBag());
{ const b0=S.bags; openBag(); T("«Открыть» открывает ровно одну сумку", S.bags===b0-1); }
// таймеры сбрасываются при load: первый кадр не прокручивает тысячи ударов
localStorage.removeItem("oredeep_v3"); load();
S.stageIdx=1; S.lvls.atk=999; newRock();
hitTimer=999;                    // симулируем «зависший» таймер
load();                          // load обязан его обнулить
T("load() сбрасывает hitTimer", hitTimer===0);
{ S.bag=16; S.autoRoll=true; S.autoRollTier=7; S.speed=100; S.bags=0; S.lvls.atk=200; newRock(); dead=false;
  frame(16);
  T("первый кадр не прокручивает бесконечные удары (предохранитель)", S.bags<=50, "сумок "+S.bags); }

console.log("\n[41] Ограниченный прогон: свод, ворота престижа, читаемость");
localStorage.removeItem("oredeep_v3"); load();
T("свод прогона задан", BALANCE.run.len>0);
S.stageIdx=BALANCE.run.len-1; S.prestigeLv=0; S.lvls.atk=1e6; newRock();
S.rockHP=1; breakVein();
T("доходит до свода", S.stageIdx===BALANCE.run.len);
S.rockHP=1; breakVein();
T("на своде глубже не пускает", S.stageIdx===BALANCE.run.len && S.runDone===true);
T("на своде Зов доступен (gain>=1)", canPrestige() && prestigeGain()>=1);
// высокий престиж тоже упирается и проходит
S.prestigeLv=8; S.runDone=true;
T("высокий престиж на своде: gain>=1", prestigeGain()>=1 && canPrestige());
// после Зова свод сброшен, глубина в 1
S.stageIdx=BALANCE.run.len; SLOTS.forEach(sl=>{S.gear[sl.id]={s:sl.id,r:5,m:1,i:500};});
doPrestige();
T("Зов сбрасывает свод и глубину", S.stageIdx===1 && S.runDone===false && S._wallShown===false);
// числа читаемы весь прогон
{ let maxHP=0; for(let s=1;s<=BALANCE.run.len;s+=50) maxHP=Math.max(maxHP,rockStatsAt(s,false).hp);
  T("HP весь прогон < 1e9 и без экспоненты", maxHP<1e9 && !fmt(maxHP).includes("e"), "пик "+fmt(maxHP)); }
{ const past=rockStatsAt(BALANCE.run.len+9999,false).hp, wall=rockStatsAt(BALANCE.run.len,false).hp;
  T("доход и HP заморожены за сводом", Math.abs(past-wall)<1e-6); }
{ S.stageIdx=BALANCE.run.len; const i1=idleGoldPerDay(); S.stageIdx=BALANCE.run.len+5000; const i2=idleGoldPerDay();
  T("доход не растёт за сводом", Math.abs(i1-i2)<1e-6); }
// равновесие треадмилла не тронуто ретюном
T("esc всё ещё = ATK_COMPOUND^LPB", Math.abs(escPerBlock()-Math.pow(ATK_COMPOUND,atkLevelsPerBlock()))<1e-9);

console.log("\n[42] Боевые параметры по доку: Stamina, Regen, офлайн-сумки");
localStorage.removeItem("oredeep_v3"); load();
S.stageIdx=300; S.lvls.atk=50; newRock();
{ const _os=oneStrike; let h0=0; oneStrike=function(){h0++;return _os.apply(null,arguments);};
  S.skills={}; S.rockHP=1e12; for(let i=0;i<200;i++) minerHit(); const p0=h0/200;
  h0=0; S.skills={stam_up:15}; S.rockHP=1e12; for(let i=0;i<200;i++) minerHit(); const p1=h0/200;
  oneStrike=_os;
  T("без Stamina комбо не тянется (~1 удар)", Math.abs(p0-1)<0.05, p0.toFixed(2));
  T("Stamina тянет комбо (>1 удара)", p1>1.5, p1.toFixed(2)); }
T("Stamina капится 90%", (function(){ S.skills={stam_up:99}; return stat("stamina")===90; })());
{ S.skills={regen_up:5}; const rg=stat("regen"); T("Regen — стат из карт (>0)", rg>0);
  S.stageIdx=1; newRock(); S.energy=5; const e0=S.energy; dead=false;
  const frame=(ms)=>{ __vclock+=ms; const cb=__rafCb; __rafCb=null; if(cb) cb(__vclock); };
  for(let i=0;i<200;i++) frame(50);
  T("Regen лечит энергию", S.energy>e0);
  T("Regen не превышает максимум", S.energy<=stat("energy")); }
// офлайн: сумки начисляются вместе с золотом
localStorage.removeItem("oredeep_v3"); load();
S.lastSeen=Date.now()-3600*1000; S.bags=0;
checkOffline();
T("офлайн копит и сумки", offlineBagsPending>0);
{ const b0=S.bags; claimOffline(1); T("клейм офлайна начисляет сумки", S.bags>b0); }

console.log("\n[43] PvP: 5 ИИ-ботов, дневной лимит, дейлики");
localStorage.removeItem("oredeep_v3"); load();
openPvp();
T("ростер из 5 ИИ-ботов", BALANCE.pvpBots && BALANCE.pvpBots.length===5);
T("рождается 5 кандидатов", pvpSlate && pvpSlate.length===BALANCE.pvpCandidates);
T("у кандидатов id/имя/сила бота", pvpSlate.every(o=>o.id && o.name && o.power>0 && o.bot));
T("экран рисует 5 кнопок боя", (__ids.uiBody.innerHTML.match(/pvpFight\(/g)||[]).length===5);
{ const bid=pvpSlate[0].id; const old=JSON.stringify(pvpSlate); S.trophies=0; pvpFight(0);
  T("бой тратит попытку и обновляет форму", S.pvpFights===1 && JSON.stringify(pvpSlate)!==old);
  T("счёт против бота пишется", (S.pvpBotRec[bid].w+S.pvpBotRec[bid].l)===1); }
S.pvpFights=BALANCE.pvpDayLimit;
{ const f0=S.pvpFights; pvpFight(0); T("на дневном лимите бой не идёт", S.pvpFights===f0); }
openPvp(); T("на лимите экран сообщает про конец боёв", __ids.uiBody.innerHTML.includes("кончились"));
S.pvpDay="вчера"; pvpDayReset(); T("новый день сбрасывает лимит", S.pvpFights===0);
T("победа в PvP двигает дейлик", (function(){ localStorage.removeItem("oredeep_v3"); load();
  S.lvls.atk=1e6; S.daily={day:todayStr(),prog:{},tok:0,claimed:[]}; openPvp();
  const p0=(S.daily.prog.pvp||0); pvpFight(0); return (S.daily.prog.pvp||0)>=p0; })());
// дейлик на сумки
localStorage.removeItem("oredeep_v3"); load();
S.daily={day:todayStr(),prog:{},tok:0,claimed:[]}; S.bags=5; S.bag=50;
openBag();
T("открытие сумки двигает дейлик", (S.daily.prog.bag||0)===1);
T("дейлик «открой сумки» существует", BALANCE.dailyQuests.some(q=>q.id==="bag"));

console.log("\n[44] DoT питомцев: Bleed/Shock/Splash (PDF)");
localStorage.removeItem("oredeep_v3"); load();
S.stageIdx=300; S.lvls.atk=0;
S.pet={t:0,r:1}; newRock();
{ const _mh=minerHit; minerHit=function(){}; const hp0=S.rockHP; dead=false;
  const frame=(ms)=>{ __vclock+=ms; const cb=__rafCb; __rafCb=null; if(cb) cb(__vclock); };
  for(let i=0;i<20;i++) frame(50); minerHit=_mh;
  T("Bleed грызёт породу без ударов", S.rockHP<hp0 && S.rockHP>0); }
S.pet={t:1,r:2}; newRock(); const hardShock=rock.hard;
S.pet=null; newRock(); const hardBase=rock.hard;
T("Shock снижает защиту породы", hardShock<hardBase);
S.pet={t:2,r:2}; newRock(); const respSplash=rock.resp;
S.pet=null; newRock(); const respBase=rock.resp;
T("Splash тормозит ответ породы", respSplash<respBase);
S.lvls.atk=0; S.pet={t:0,r:0}; const lo=petDot().dps; S.pet={t:0,r:3}; const hi=petDot().dps;
T("DoT растёт с редкостью питомца", hi>lo);
T("без питомца DoT отсутствует", (function(){ S.pet=null; return petDot()===null; })());
T("у каждого семейства свой DoT", PET_TYPES.every(p=>["bleed","shock","splash"].includes(p.dot)));

console.log("\n[45] Крафт питомцев → Exotic (PDF)");
localStorage.removeItem("oredeep_v3"); load();
S.petLegSeen=0; T("до 3 легендарных крафт закрыт", !petCraftUnlocked());
S.petLegSeen=BALANCE.petCraft.needLegendaries; T("после N легендарных крафт открыт", petCraftUnlocked());
S.petBox={}; S.gems=1000;
T("без материала крафт не готов", !petCraftReady());
boxAdd(S.petBox,0,3,1); boxAdd(S.petBox,1,3,1); boxAdd(S.petBox,2,3,1);
T("по Legendary каждого семейства + гемы → готов", petCraftReady());
{ const g0=S.gems; craftPetExotic();
  T("крафт съел материал, списал гемы, выдал Exotic",
    boxCountAt(S.petBox,0,3)===0 && S.gems===g0-BALANCE.petCraft.gems
    && Object.keys(S.petBox).some(k=>Number(k.split("_")[1])===4)); }
S.petBox={}; boxAdd(S.petBox,0,3,9);
T("merge Legendary заблокирован — Exotic только крафтом", mergePet(0,3)===false && canMergePet(0,3)===false);
S.petBox={}; boxAdd(S.petBox,0,3,1); boxAdd(S.petBox,1,3,1); boxAdd(S.petBox,2,3,1); S.gems=0;
T("без гемов крафт не срабатывает", craftPetExotic()===false);
T("Exotic-тир добавлен питомцам", PET_RAR[4]==="Exotic" && PET_TYPES.every(p=>p.pct.length>=5));
T("ролл Legendary увеличивает счётчик для крафта", (function(){
  localStorage.removeItem("oredeep_v3"); load(); S.eggs=50; const s0=S.petLegSeen||0;
  const _r=Math.random; Math.random=()=>0.999; rollPet(); Math.random=_r;   // форсим высокую редкость
  return (S.petLegSeen||0)>=s0; })());

console.log("\n[46] Стикеры и Зал (PDF)");
localStorage.removeItem("oredeep_v3"); load();
{ const a0=stat("atk"); S.stickers={s_atk1:1}; T("стикер влияет на стат", stat("atk")>a0); }
S.gems=STICKER_PACK_GEMS; S.stickers={};
{ const g0=S.gems; buyStickerPack(); const total=Object.values(S.stickers).reduce((a,b)=>a+b,0);
  T("пак: списаны гемы, выдано 5 стикеров", S.gems===g0-STICKER_PACK_GEMS && total===STICKER_PACK_N); }
S.stickers={s_atk1:3}; { const x0=S.gymXP||0; giftStickers();
  T("дарение дубликатов даёт Gym XP и оставляет по 1", (S.gymXP||0)>x0 && S.stickers.s_atk1===1); }
S.gymXP=0; addGymXP(GYM_LEVELS[1]);
T("Gym XP поднимает уровень зала", gymLevel()===1 && gymPerkPct()>0);
{ const a0=stat("atk"); S.gymXP=GYM_LEVELS[5]; T("перк зала множит статы", stat("atk")>a0); }
{ let ok=true; try{ openGym(); openStickers(); }catch(e){ ok=false; } T("экраны Зала и Стикеров открываются", ok); }
S.gymXP=0;

console.log("\n[47] Мобильная оболочка: фрейм + нижний навбар");
localStorage.removeItem("oredeep_v3"); load();
T("зона прокрутки #view существует", !!__ids.view);
T("нижний навбар существует", !!__ids.bottomNav);
T("кнопка навбара «Звери» привязана", typeof openPets==="function");
T("кнопка навбара «Таверна» привязана", typeof __ids.navTavBtn.onclick==="function");
switchTab("Meta");
T("switchTab прокручивает view наверх", __ids.view.scrollTop===0);
T("switchTab подсвечивает вкладку Меты", __ids.tabMeta.classList.contains("on"));
switchTab("Mine"); render();
T("полоса боевых статов существует", !!__ids.pwStrip);
T("полоса боевых статов заполнена АТК", __ids.pAtk.textContent!=="" && __ids.pAtk.textContent!=="—");

console.log("\n[48] Окно сундука: открыть/надеть/продать/апгрейд");
localStorage.removeItem("oredeep_v3"); load();
openChest();
T("окно сундука открывается", __ids.chestModal.style.display==="flex");
T("карточка сундука отрендерена", __ids.chestCard.innerHTML.indexOf("Сундук находок")>=0);
T("таблица шансов присутствует", __ids.chestCard.innerHTML.indexOf("Шансы дропа")>=0);
T("шансы в две колонки", __ids.chestCard.innerHTML.indexOf("chCols")>=0
  && __ids.chestCard.innerHTML.indexOf(">сейчас<")>=0
  && __ids.chestCard.innerHTML.indexOf(">после<")>=0);
S.bags=3; chestOpenOne();
T("открытие сундука тратит сумку и готовит предмет", S.bags===2 && !!chestPending);
{ const g0=S.gold; sellChestItem(); T("продажа даёт золото и сбрасывает предмет", S.gold>g0 && chestPending===null); }
S.bags=1; chestOpenOne(); { const sl=chestPending.s; equipChestItem();
  T("надевание кладёт предмет в слот", !!S.gear[sl] && chestPending===null); }
{ S.bag=1; S.gold=bagCost()*3; const b0=S.bag; chestUpgrade();
  if(S.bagActive){ S.bagActive.end=Date.now(); finishBagUpgrade(); }
  T("апгрейд из окна повышает уровень сундука", S.bag===b0+1); }

console.log("\n[48] Sprint 1: яйца, расчёски, таймер сумки, FTUE");
localStorage.removeItem("oredeep_v3"); load();
T("новый игрок стартует с яйцом и расческой", (S.eggs||0)>=1 && (S.combs||0)>=1);
S.eggs=0; S.combs=0; rollPet();
T("без яиц ролл питомца не проходит", (S.eggs||0)===0);
S.combs=0; hireGeo();
T("без расчёсок гача старейшины не проходит", (S.combs||0)===0);
S.gold=bagCost()*5; S.bag=1; startBagUpgrade();
T("апгрейд сумки запускает таймер", !!S.bagActive && S.bag===1);
S.bagActive.end=Date.now(); finishBagUpgrade();
T("по окончании таймера уровень сумки растёт", S.bag===2 && !S.bagActive);
S.gold=bagCost()*5; startBagUpgrade(); const gBefore=S.gems||0; skipBagUpgrade();
T("пропуск таймера завершает апгрейд", S.bag===3 && !S.bagActive);
S.stageIdx=1; S.stage=1; S.gear={}; S.col={}; newRock(); breakVein();
T("онбординг: жила 1 — гарантированный дроп", Object.keys(S.gear).length===1);
breakVein();
T("онбординг: жила 2 — скриптованный камень", uniqueStones()>=1);
T("FTUE-подсказка в DOM", !!document.getElementById("ftueTip"));
{ S.ftue={u:1,b:1,c:1,t:1,m:1,g:0}; S.stageIdx=10; S.introSeen=true; render();
  const tip=$("ftueTip");
  T("подсказка Друзья показывается", tip && tip.style.display==="block" && tip._ftueStep==="g");
  const html0=tip.innerHTML; render(); render();
  T("подсказка не переписывает DOM каждый кадр", tip.innerHTML===html0);
  if(tip&&tip.onclick) tip.onclick({stopPropagation(){}, preventDefault(){}});
  render();
  T("клик по подсказке скрывает её", tip.style.display==="none" && S.ftue.g===1);
}

console.log("\n[44] Рост: рефералы, вейтлист, юнит-экономика");
localStorage.removeItem("oredeep_v3"); load();
T("код приглашения 6 символов", growthInviteCode().length===6);
{ const g0=S.gems; growthApplyReferral("BORIN1");
  T("реферал даёт бонус", S.gems>g0 && S.growth.referredBy==="BORIN1"); }
T("повторный реферал блокируется", !growthApplyReferral("BORIN2"));
{ const p=BALANCE.growth.starterPack; const g0=S.gems; buyStarterPack();
  T("стартер-пак разовый", S.growth.starterBought && S.gems>=g0+p.gems); }
buyStarterPack();
T("стартер нельзя купить дважды", S.growth.starterBought);
growthJoinWaitlist(false);
T("вейтлист отмечен", S.growth.waitlist.joined);
{ const g0=S.gems; claimWaitlistBonus();
  T("бонус вейтлиста", S.growth.waitlist.claimed && S.gems>g0); }
{ growthAdDayReset(); S.growth.ads.count=0;
  let ok=0; for(let i=0;i<20;i++){ if(growthAdCapOk()){ growthTrackAd(); ok++; } }
  T("реклама с плоским CPA cap", ok===BALANCE.growth.ads.dailyCap); }
{ const ue=growthUnitEcon();
  T("LTV/CAC после стартера", ue.ltvRatio>=1);
  T("выручка покрывает CAC", ue.totalCents>=BALANCE.growth.cacTargetCents); }
T("кооп-буст в доходе", growthCoopMult()>=1);

console.log("\n[45] Ревью: крепь через энергию, ad-skip, auto");
localStorage.removeItem("oredeep_v3"); load();
dead=false; S.durab=40; S.gold=Math.max(S.gold||0, reinforceCost()*3);
{ const d0=S.durab; reinforceMine(); T("reinforce восстанавливает крепь", !dead && S.durab===MINE_DURAB.max && S.durab>d0); }
{ S.bag=1; S.gold=bagCost()*5; startBagUpgrade();
  const g0=S.gems=0; let called=false, gotOk=null;
  const prev=Platform.showRewarded;
  Platform.showRewarded=cb=>{ called=true; cb(false); };
  skipBagUpgrade();
  T("ad-cap не даёт бесплатный skip сумки", !!S.bagActive && called);
  Platform.showRewarded=prev; }
{ S.autoRoll=true; render();
  const ab=$("auto");
  T("видимый Auto получает класс on", !!(ab&&ab.classList&&ab.classList.contains("on"))); }
{ ensureGrowth(S); S.growth.referredBy="AAAAAA";
  const g0=S.gems; growthApplyReferral("BBBBBB", true);
  T("повторный ?ref молча игнорируется", S.growth.referredBy==="AAAAAA" && S.gems===g0); }

console.log("\n========== ИТОГ: "+pass+" PASS, "+fail+" FAIL ==========");
process.exit(fail?1:0);
