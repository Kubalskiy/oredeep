"use strict";
/* Свип-охота на баги. Не чек-лист, а поиск: гоняем игру в крайних режимах и
   после каждого шага проверяем инварианты, которые обязаны держаться всегда. */

let issues = [];
const BUG = (where, what) => { issues.push(where + " — " + what); console.log("  БАГ  " + where + " — " + what); };
const OK  = (what) => console.log("  ок   " + what);
const frame = (ms) => { __vclock += ms; const cb = __rafCb; __rafCb = null; if (cb) cb(__vclock); };

/* ---- инварианты состояния ---- */
const NUM_FIELDS = ["gold","gems","shards","protein","trophies","keys","chestKeys","bags",
                    "stageIdx","stage","mine","bag","energy","rockHP","durab","echo",
                    "prestigeLv","beardXP","cartFill"];
function checkState(tag) {
  for (const f of NUM_FIELDS) {
    const v = S[f];
    if (v === undefined || v === null) continue;
    if (typeof v !== "number") { BUG(tag, `S.${f} не число: ${typeof v}`); continue; }
    if (Number.isNaN(v)) BUG(tag, `S.${f} = NaN`);
    if (!Number.isFinite(v)) BUG(tag, `S.${f} = ${v > 0 ? "Infinity" : "-Infinity"}`);
    if (["gold","gems","shards","protein","trophies","keys","chestKeys","bags","energy","echo"].includes(f) && v < 0)
      BUG(tag, `S.${f} отрицательно: ${v}`);
  }
  if (S.durab < -1e-9 || S.durab > MINE_DURAB.max + 1e-9) BUG(tag, `крепь вне [0,100]: ${S.durab}`);
  const maxE = stat("energy");
  if (Number.isFinite(maxE) && S.energy > maxE + 1e-6) BUG(tag, `энергия выше максимума: ${S.energy} > ${maxE}`);
  for (const id of ["atk","energy","spd","tough","crit","luck","mining","stone"]) {
    const v = stat(id);
    if (!Number.isFinite(v)) BUG(tag, `stat("${id}") = ${v}`);
    const cap = STAT_CAPS[id];
    if (cap != null && v > cap + 1e-6) BUG(tag, `stat("${id}")=${v} пробил кап ${cap}`);
  }
  if (rock && S.rockHP > rock.hp + 1e-6) BUG(tag, `rockHP > максимума жилы`);
}

/* ---- 1. Длинный прогон на всех скоростях ---- */
console.log("\n[1] Длинный прогон: 4 скорости × 3000 кадров, инварианты каждые 100");
for (const sp of [1, 3, 10, 100]) {
  localStorage.removeItem("oredeep_v3"); load(); render();
  S.speed = sp; dead = false;
  for (let i = 0; i < 3000; i++) {
    if (pendingDrop) { (Math.random() < 0.5 ? __ids.dropEquip : __ids.dropSell).onclick(); }
    if (dead) closeOverlay();
    frame(16);
    if (i % 100 === 0) checkState(`прогон ×${sp}, кадр ${i}`);
  }
  OK(`×${sp}: этап ${S.stageIdx}, золото ${fmt(S.gold)}`);
}

/* ---- 2. Все экраны во всех состояниях ---- */
console.log("\n[2] Все модалки открываются без исключений");
const SCREENS = ["openSkills","openPets","openWheel","openWorkouts","openDaily","openShop",
                 "openPvp","openEvents","openLoot","openPrestige","openFairness","openWall",
                 "openGuild","openGeoGuild","openUpgradesModal","showIntro","openPickGallery"];
function tryScreens(tag) {
  for (const name of SCREENS) {
    const fn = (typeof eval(`typeof ${name}`) === "function") ? eval(name) : null;
    if (!fn) continue;
    try { fn(); } catch (e) { BUG(tag + " → " + name + "()", e.message); }
  }
}
localStorage.removeItem("oredeep_v3"); load(); render();
tryScreens("новый игрок");
OK("новый игрок: все экраны открылись");

// нищий
S.gold = 0; S.gems = 0; S.shards = 0; S.protein = 0; S.keys = 0; S.chestKeys = 0; S.bags = 0;
S.geo = null; S.pet = null; S.petBox = {}; S.geoBox = {}; S.boxes = []; S.skillCards = {};
render(); tryScreens("нищий");
OK("нищий: все экраны открылись");

// богач на глубине
S.gold = 1e30; S.gems = 1e9; S.shards = 1e9; S.protein = 1e6; S.keys = 99; S.chestKeys = 99;
S.bags = 500; S.stageIdx = BALANCE.run.len; S.prestigeLv = 12; S.boxes = [1,1,1,7]; S.bag = 50;
SLOTS.forEach(sl => { S.gear[sl.id] = { s: sl.id, r: 7, m: 1.1, i: BALANCE.run.len }; });
S.geo = { t: 0, r: 3, n: "Дед", lv: 9, asc: 2 }; S.pet = { t: 0, r: 3 };
newRock(); render(); tryScreens("богач на глубине");
OK("богач: все экраны открылись");

/* ---- 3. Престиж-цикл ---- */
console.log("\n[3] Десять престижей подряд");
localStorage.removeItem("oredeep_v3"); load();
S.skills = { atk_up: 3 }; S.col = { 0: { 1: 2 } }; S.gems = 500; S.beardXP = 999;
for (let i = 0; i < 10; i++) {
  S.stageIdx = Math.max(BALANCE.prestige.minStage, Math.pow(S.prestigeLv + 1, 2) * BALANCE.prestige.div) + 10;
  SLOTS.forEach(sl => { S.gear[sl.id] = { s: sl.id, r: 5, m: 1, i: S.stageIdx }; });
  if (!canPrestige()) { BUG("престиж " + i, "недоступен на расчётной глубине " + S.stageIdx); break; }
  doPrestige();
  checkState("после престижа " + (i + 1));
}
if (S.skills.atk_up !== 3 || S.col[0][1] !== 2 || S.gems !== 500 || S.beardXP !== 999)
  BUG("престиж", "мета не пережила 10 циклов");
else OK(`10 престижей: ур. ${S.prestigeLv}, множитель ×${fmt(prestigeMult())}, мета цела`);
if (!Number.isFinite(prestigeMult())) BUG("престиж", "множитель ушёл в Infinity");
if (!Number.isFinite(S.echo)) BUG("престиж", "эхо ушло в Infinity");

if (BALANCE.prestige.minStage !== BALANCE.prestige.div)
  BUG("престиж", `minStage=${BALANCE.prestige.minStage} не равен div=${BALANCE.prestige.div}: игрок увидит «+1 ур.» при заблокированной кнопке`);
else OK("порог входа в престиж совпадает с этапом первого уровня");

/* ---- 4. Сохранение/загрузка ---- */
console.log("\n[4] Round-trip сохранения");
localStorage.removeItem("oredeep_v3"); load();
S.gold = 123456; S.bags = 7; S.chestKeys = 3; S.petBox = { "0_1": 2 }; S.science.done = 5;
S.fair.client = "тест"; S.fair.nonce = 11; S.prestigeLv = 4; S.echo = 42.5; S.tab = "Meta";
save();
const before = JSON.stringify(S);
load();
const after = JSON.stringify(S);
if (before !== after) {
  const b = JSON.parse(before), a = JSON.parse(after);
  const diff = Object.keys(b).filter(k => JSON.stringify(b[k]) !== JSON.stringify(a[k]));
  BUG("save/load", "поля не пережили round-trip: " + diff.join(", "));
} else OK("состояние идентично после save/load");
{
  const raw = localStorage.getItem("oredeep_v3") || "";
  const kb = (raw.length / 1024).toFixed(1);
  if (raw.length > 4 * 1024 * 1024) BUG("save", `сейв ${kb} КБ — близко к лимиту localStorage`);
  else OK(`размер сейва: ${kb} КБ`);
}

/* ---- 5. Экономика: ресурсы не уходят в минус ---- */
console.log("\n[5] Покупки при нуле ресурсов ничего не тратят");
localStorage.removeItem("oredeep_v3"); load();
S.gold = 0; S.gems = 0; S.shards = 0; S.protein = 0; S.keys = 0; S.chestKeys = 0; S.bags = 0;
const snap0 = JSON.stringify({ g: S.gold, gm: S.gems, sh: S.shards, pr: S.protein, k: S.keys, ck: S.chestKeys });
try { openBag(); } catch (e) { BUG("openBag при 0", e.message); }
try { reinforceMine(); } catch (e) { BUG("reinforceMine при 0", e.message); }
try { openSkillChest("wood"); openSkillChest("mith"); } catch (e) { BUG("openSkillChest при 0", e.message); }
try { upSkill("atk_up"); } catch (e) { BUG("upSkill при 0", e.message); }
try { S.eggs=0; rollPet(); } catch (e) { BUG("rollPet при 0", e.message); }
try { mergeGeo(); ascendGeo(); } catch (e) { BUG("merge при 0", e.message); }
try { craftBoxFromStones(1); upgradeBoxWithStones(1); fuseBoxes(1); } catch (e) { BUG("боксы при 0", e.message); }
const snap1 = JSON.stringify({ g: S.gold, gm: S.gems, sh: S.shards, pr: S.protein, k: S.keys, ck: S.chestKeys });
if (snap0 !== snap1) BUG("экономика", "покупка при нуле изменила ресурсы: " + snap0 + " -> " + snap1);
else OK("ни одна покупка при нуле не сработала");
checkState("после попыток покупок при нуле");

/* ---- 6. Крепь: эмпирический темп обвала против расчётного ---- */
console.log("\n[6] Крепь: обвал, восстановление, темп риска");
{
  // 40 испытаний по 5 виртуальных минут при нулевой крепи
  let collapses = 0, trials = 40, minutes = 5;
  for (let t = 0; t < trials; t++) {
    localStorage.removeItem("oredeep_v3"); load();
    S.gold = 1e6; S.durab = 0; dead = false; durabTimer = 0;
    const frames = minutes * 60 / 0.05;
    for (let i = 0; i < frames && !dead; i++) frame(50);
    if (dead) { collapses++; if (S.gold < 0) BUG("обвал", "золото ушло в минус"); closeOverlay();
      if (Math.abs(S.durab - MINE_DURAB.max) > 1e-9) BUG("обвал", "крепь не восстановлена после откопки"); }
  }
  const empirical = 1 - Math.pow(1 - collapses / trials, 1 / minutes);   // на минуту
  S.durab = 0;
  const designed = collapseRiskPerMin();
  if (collapses === 0) BUG("крепь", "за 200 виртуальных минут ни одного обвала при нулевой крепи");
  else if (Math.abs(empirical - designed) > designed * 0.6)
    BUG("крепь", `темп обвала ${(empirical*100).toFixed(1)}%/мин расходится с расчётным ${(designed*100).toFixed(1)}%/мин`);
  else OK(`обвал: ${collapses}/${trials} за ${minutes} мин, темп ${(empirical*100).toFixed(1)}%/мин ≈ расчётный ${(designed*100).toFixed(1)}%/мин`);
}
localStorage.removeItem("oredeep_v3"); load();
S.durab = MINE_DURAB.max; dead = false;
if (collapseRiskPerMin() !== 0) BUG("крепь", "при полной крепи риск обвала не нулевой");
else OK("при 100% крепи риск обвала = 0");

/* ---- 7. Auto Roll обязан УСПЕВАТЬ за приходом сумок ---- */
console.log("\n[7] Auto Roll: очередь не растёт даже у переусиленного дворфа");
localStorage.removeItem("oredeep_v3"); load();
S.bag = 16; S.autoRoll = true; S.autoRollTier = 7; S.speed = 100; S.bags = 0; S.gold = 0;
S.stageIdx = 300; S.lvls.atk = 200; S.lvls.energy = 500; S.lvls.luck = 200; newRock(); dead = false;
{
  let peak = 0, lines = 0;
  const _st = showToast; showToast = function () { lines++; };
  for (let i = 0; i < 600; i++) { if (dead) closeOverlay(); frame(16); peak = Math.max(peak, S.bags); }
  showToast = _st;
  if (S.bags > 50) BUG("AutoRoll", `очередь не разбирается: осталось ${S.bags} сумок`);
  else if (peak > BALANCE.bags.maxPerTick) BUG("AutoRoll", `очередь разрослась до ${peak} (потолок ${BALANCE.bags.maxPerTick})`);
  else OK(`очередь удержана: пик ${peak}, осталось ${S.bags}, золото ${fmt(S.gold)}`);
  if (lines > 200) BUG("лог", `на ×100 за 10 секунд ${lines} строк — авто-продажи не свёрнуты`);
  else OK(`лог свёрнут: ${lines} строк за 600 кадров ×100`);
}
// накопленная очередь разбирается после включения Auto
localStorage.removeItem("oredeep_v3"); load();
S.bag = 16; S.bags = 495; S.autoRoll = true; S.autoRollTier = 7; S.speed = 1; dead = false; newRock();
for (let i = 0; i < 400; i++) frame(50);
if (S.bags !== 0) BUG("AutoRoll", `накопленные 495 сумок не разобраны за 20 сек: осталось ${S.bags}`);
else OK("накопленные 495 сумок разобраны");
S.bags = 0; S.autoRoll = false;
checkState("после Auto Roll");

/* ---- 8. Гильдия: 200 ответов ---- */
console.log("\n[8] Гильдия: 200 ответов подряд");
localStorage.removeItem("oredeep_v3"); load();
S.science.on = true;
Platform._sci = { votes: {}, retired: {} };
for (let i = 0; i < 200; i++) {
  const t = sciTask || sciNextTask();
  if (!t) break;
  sciAnswer(Math.floor(Math.random() * t.opts.length));
}
const rel = sciReliability();
if (!Number.isFinite(rel) || rel < 0 || rel > 1) BUG("гильдия", "надёжность вне [0,1]: " + rel);
else OK(`200 ответов: надёжность ${(rel * 100).toFixed(0)}%, размечено ${S.science.done}`);
checkState("после 200 ответов гильдии");

/* ---- 9. Provably-fair под нагрузкой ---- */
console.log("\n[9] Честная гача: 2000 роллов");
localStorage.removeItem("oredeep_v3"); load();
S.fair.on = true;
let lo = 1, hi = 0, bad = 0;
for (let i = 0; i < 2000; i++) {
  const v = grandom();
  if (!(v >= 0 && v < 1)) bad++;
  lo = Math.min(lo, v); hi = Math.max(hi, v);
}
if (bad) BUG("fair", bad + " роллов вне [0,1)");
else OK(`2000 роллов в [0,1): min ${lo.toFixed(4)}, max ${hi.toFixed(4)}, nonce ${S.fair.nonce}`);
if (S.fair.nonce !== 2000) BUG("fair", "nonce не совпал с числом роллов: " + S.fair.nonce);

/* ---- 10. Битый сейв не роняет игру ---- */
console.log("\n[10] Битые и древние сейвы");
for (const raw of ['{"gold":"много"}', '{"lvls":null}', '{"gear":{"pick":null}}',
                   '{"gold":-500,"energy":-1}', 'не json вовсе', '{}']) {
  try {
    localStorage.setItem("oredeep_v3", raw);
    load(); render();
    if (!S || typeof S.gold !== "number" || !Number.isFinite(S.gold))
      BUG("битый сейв " + raw.slice(0, 24), "S.gold невалиден: " + S.gold);
    if (!S.lvls || typeof S.lvls !== "object") BUG("битый сейв " + raw.slice(0, 24), "S.lvls невалиден");
    else { S.gold += 10; if (typeof S.gold !== "number" || Number.isNaN(S.gold))
             BUG("битый сейв " + raw.slice(0, 24), "арифметика по gold сломалась: " + S.gold); }
    for (const k of ["gold","gems","shards","protein","bags","keys","chestKeys"])
      if (typeof S[k] === "number" && S[k] < 0) BUG("битый сейв " + raw.slice(0, 24), `${k} отрицательно`);
    try { stat("stone"); stat("atk"); } catch (e) { BUG("битый сейв " + raw.slice(0, 24), "stat() упал: " + e.message); }
  } catch (e) { BUG("битый сейв " + raw.slice(0, 24), e.message); }
}
OK("битые сейвы обработаны");
localStorage.removeItem("oredeep_v3");

/* ---- 11. Ограниченный прогон: числа читаемы, свод держит ---- */
console.log("\n[11] Ограниченный прогон");
{
  const peakHP = rockStatsAt(BALANCE.run.len, false).hp;
  if (peakHP >= 1e9 || fmt(peakHP).includes("e")) BUG("прогон", `пиковая HP нечитаема: ${fmt(peakHP)}`);
  else OK(`пик HP прогона ${fmt(peakHP)} (читаемо, без экспоненты)`);
  const past = rockStatsAt(BALANCE.run.len + 5000, false).hp;
  if (Math.abs(peakHP - past) > 1e-6) BUG("прогон", "за сводом HP продолжает расти");
  else OK("за сводом HP заморожена");
  // симулируем полный прогон и смотрим максимум золота
  localStorage.removeItem("oredeep_v3"); load();
  S.speed = 100; dead = false;
  let maxGold = 0;
  for (let i = 0; i < 4000; i++) { if (dead) closeOverlay(); frame(16); maxGold = Math.max(maxGold, S.gold); if (S.runDone) break; }
  if (!Number.isFinite(maxGold) || maxGold >= 1e15) BUG("прогон", `золото за прогон нечитаемо: ${fmt(maxGold)}`);
  else OK(`золото за прогон ≤ ${fmt(maxGold)}, этап ${S.stageIdx}, свод ${S.runDone ? "достигнут" : "нет"}`);
}

/* ---- ИТОГ ---- */
console.log("\n========== СВИП: " + (issues.length ? issues.length + " БАГ(ОВ)" : "БАГОВ НЕ НАЙДЕНО") + " ==========");
issues.forEach((s, i) => console.log((i + 1) + ") " + s));
globalThis.__sweepFail = issues.length;
