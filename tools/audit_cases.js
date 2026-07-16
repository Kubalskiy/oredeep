"use strict";
/* Тело аудита кнопок. Запускается из tools/audit_buttons.js в общей области
   видимости со стабом DOM и кодом игры (иначе eval не отдаёт наружу const). */
let pass = 0, fail = 0;
const T = (name, cond, info) => {
  if (cond) { pass++; console.log("  PASS " + name); }
  else { fail++; console.log("  FAIL " + name + (info ? " — " + info : "")); }
};
const frame = (ms) => { __vclock += ms; const cb = __rafCb; __rafCb = null; if (cb) cb(__vclock); };

const snap = () => JSON.stringify({
  gold: S.gold, gems: S.gems, keys: S.keys, protein: Math.floor(S.protein || 0),
  shards: S.shards, bags: S.bags, boxes: (S.boxes || []).length,
  skills: S.skills, cards: S.skillCards, petBox: S.petBox, geoBox: S.geoBox,
  geo: S.geo, prestigeLv: S.prestigeLv, echo: S.echo, stageIdx: S.stageIdx
});

/* ---------- 1. Все inline onclick ссылаются на существующие функции ---------- */
console.log("\n[A] Целостность inline onclick");
const onclicks = [...__RAW_HTML.matchAll(/onclick="([a-zA-Z_$][\w$]*)\s*\(/g)].map(m => m[1]);
const uniq = [...new Set(onclicks)].sort();
const missing = uniq.filter(fn => { try { return typeof eval(fn) !== "function"; } catch(e){ return true; } });
T("все " + uniq.length + " onclick-функций определены", missing.length === 0,
  missing.length ? "нет: " + missing.join(", ") : "");
console.log("      " + uniq.join(", "));

/* ---------- 2. Обработчики привязаны к элементам ---------- */
console.log("\n[B] Обработчики .onclick привязаны");
for (const id of ["geoName", "geoDesc", "navSkills", "speedBtn",
                  "tabMineBtn", "tabHeroBtn", "tabMetaBtn", "introGo", "miner",
                  "lootChest", "powerUp", "auto", "avatar", "menu",
                  "navShop", "navMines", "navTavBtn", "navPvp"]) {
  const el = document.getElementById(id);
  T("#" + id + " имеет onclick", !!(el && typeof el.onclick === "function"));
}
T("hireGeo функция", typeof hireGeo === "function");
T("tryBagUpgrade функция", typeof tryBagUpgrade === "function");
T("openCollection функция", typeof openCollection === "function");
T("resetProgress функция", typeof resetProgress === "function");
T("openPrestige функция", typeof openPrestige === "function");
T("openBag / canOpenBag", typeof openBag === "function" && typeof canOpenBag === "function");
T("cycleAutoTier функция", typeof cycleAutoTier === "function");

/* Собрать кнопки из отрендеренной модалки: [{fn, args, disabled}] */
function modalButtons() {
  const out = [];
  const scan = (html) => {
    const re = /<button([^>]*)onclick="([^"]+)"([^>]*)>/g;
    let m;
    while ((m = re.exec(html || ""))) {
      const attrs = m[1] + m[3];
      out.push({ call: m[2], disabled: /(^|\s)disabled(\s|=|>|$)/.test(attrs) });
    }
  };
  const metaM = document.getElementById("metaModal");
  if (metaM && metaM.style.display === "flex") scan(document.getElementById("metaBody")?.innerHTML);
  const uiM = document.getElementById("uiScreen");
  if (uiM && (uiM.style.display === "flex" || uiM.classList?.contains("open")))
    scan(document.getElementById("uiBody")?.innerHTML);
  return out;
}
/* Клик по модальной кнопке = выполнить её onclick-выражение */
const click = expr => { try { eval(expr); return true; } catch (e) { return "ERR: " + e.message; } };

/* ---------- 2b. Вкладки переключаются кликом ---------- */
console.log("\n[B2] Вкладки");
document.getElementById("tabHeroBtn").onclick();
T("клик по «Герой» открывает панель героя",
  document.getElementById("tabHero").classList.contains("on") && !document.getElementById("tabMine").classList.contains("on"));
document.getElementById("tabMetaBtn").onclick();
T("клик по «Мета» открывает мету", document.getElementById("tabMeta").classList.contains("on"));
document.getElementById("tabMineBtn").onclick();
T("клик по «Забой» возвращает забой", document.getElementById("tabMine").classList.contains("on"));

/* ---------- 3. Престиж ---------- */
console.log("\n[C] Престиж: кнопка и защита от преждевременного клика");
localStorage.removeItem("oredeep_v3"); load();
S.stageIdx = 100;
openPrestige();
{
  const btns = modalButtons();
  const pb = btns.find(b => b.call.startsWith("confirmPrestige"));
  T("модалка престижа рисует кнопку", !!pb);
  T("на этапе 100 кнопка заблокирована", pb && pb.disabled === true);
  const before = snap();
  click(pb.call);                                  // клик по заблокированной
  T("клик по заблокированной не даёт престиж", snap() === before, "состояние изменилось");
}
S.stageIdx = 1200; S.gold = 1e6; SLOTS.forEach(sl => { S.gear[sl.id] = { s: sl.id, r: 4, m: 1, i: 1200 }; });
openPrestige();
{
  const pb = modalButtons().find(b => b.call.startsWith("confirmPrestige"));
  T("на этапе 1200 кнопка активна", pb && pb.disabled === false);
  click(pb.call);
  T("клик даёт престиж и сбрасывает забой", S.prestigeLv === 2 && S.stageIdx === 1 && S.gold === 0);
  T("модалка престижа закрылась после клика", !modalOpen());
  T("после престижа canPrestige ложен на старте", (function () { render(); return !canPrestige() || S.stageIdx < BALANCE.prestige.minStage; })());
}

/* ---------- 4. Сумки и Auto Roll ---------- */
console.log("\n[D] Сумки: Открыть / Auto / порог");
localStorage.removeItem("oredeep_v3"); load(); S.bag = 50;
S.bags = 0; render();
T("«Открыть» заблокирована без сумок", !canOpenBag());
{ const before = snap(); openBag();
  T("клик без сумок ничего не тратит", snap() === before); }
S.bags = 2; S.autoRoll = false; render();
T("«Открыть» активна при сумках", canOpenBag());
{ const b0 = S.bags; openBag();
  T("«Открыть» тратит ровно 1 сумку", S.bags === b0 - 1); }
{ const on0 = S.autoRoll; toggleAutoRoll();
  T("«Auto» переключает режим", S.autoRoll === !on0);
  render();
  T("«Auto» подсвечена при включении", $("auto").classList.contains("on")); }
{ const t0 = S.autoRollTier; cycleAutoTier();
  T("порог сдвигается на следующую редкость", S.autoRollTier === (t0 + 1) % 8);
  S.autoRollTier = 7; cycleAutoTier();
  T("порог заворачивается Cosmic → Common", S.autoRollTier === 0); }
{ // авто-открытие крутится в игровом цикле
  S.autoRoll = true; S.autoRollTier = 7; S.bags = 3; S.gold = 0; dead = false;
  const b0 = S.bags;
  for (let i = 0; i < 200; i++) frame(50);           // 10 виртуальных секунд
  T("Auto Roll сам тратит сумки в цикле", S.bags < b0, "было " + b0 + ", стало " + S.bags);
  S.autoRoll = false; }

/* ---------- 5. Питомцы: merge ---------- */
console.log("\n[E] Питомцы: кнопки слияния");
S.gold = 0; S.petBox = {}; S.pet = null; boxAdd(S.petBox, 0, 0, 2);
openPets("merge");
{
  const mb = modalButtons().filter(b => b.call.startsWith("mergePet"));
  T("модалка питомцев рисует кнопку слияния", mb.length === 1);
  T("при 2 копиях слияние заблокировано", mb[0].disabled === true);
  const before = snap(); click(mb[0].call);
  T("клик по заблокированной не тратит копии", snap() === before);
}
boxAdd(S.petBox, 0, 0, 1); openPets("merge");
{
  const mb = modalButtons().find(b => b.call.startsWith("mergePet"));
  T("при 3 копиях слияние доступно", mb.disabled === false);
  click(mb.call);
  T("слияние съело 3 и выдало следующую редкость",
    boxCountAt(S.petBox, 0, 0) === 0 && Object.keys(S.petBox).some(k => +k.split("_")[1] === 1));
}
S.petBox = {}; boxAdd(S.petBox, 1, 3, 5); openPets("merge");
{
  const mb = modalButtons().find(b => b.call.startsWith("mergePet"));
  T("на Legendary кнопки слияния нет (предел)", !mb);
}
{ // кнопка ролла яйца (валюта — 🥚, не золото)
  S.eggs = 0; openPets("gacha");
  const rb = modalButtons().find(b => b.call.startsWith("rollPet"));
  T("«Яйцо» заблокировано без яиц", rb && rb.disabled === true);
  const before = snap(); click(rb.call);
  T("клик без яиц не крутит гачу", snap() === before);
  S.eggs = 5; openPets("gacha");
  const rb2 = modalButtons().find(b => b.call.startsWith("rollPet"));
  const r0 = S.petRolls; click(rb2.call);
  T("«Яйцо» при наличии яиц крутит ролл", S.petRolls === r0 + 1);
}

/* ---------- 6. Артель старейшин: merge + восхождение ---------- */
console.log("\n[F] Старейшины: слияние и восхождение");
S.geo = { t: 0, r: 1, n: "Тан", lv: 1, asc: 0 }; S.geoBox = {}; S.gems = 0;
document.getElementById("geoName").onclick();
{
  const mg = modalButtons().find(b => b.call.startsWith("mergeGeo"));
  const ag = modalButtons().find(b => b.call.startsWith("ascendGeo"));
  T("артель рисует обе кнопки", !!mg && !!ag);
  T("без материала слияние заблокировано", mg.disabled === true);
  T("не легендарный — восхождение заблокировано", ag.disabled === true);
  const before = snap(); click(mg.call); click(ag.call);
  T("клики по заблокированным ничего не меняют", snap() === before);
}
boxAdd(S.geoBox, 0, 0, 3); openGeoGuild();
{
  const mg = modalButtons().find(b => b.call.startsWith("mergeGeo"));
  T("с материалом слияние активно", mg.disabled === false);
  click(mg.call);
  T("слияние подняло уровень на число материалов", S.geo.lv === 4);
}
S.geo = { t: 0, r: 3, n: "Дед", lv: 5, asc: 0 }; S.gems = BALANCE.merge.ascendGems; openGeoGuild();
{
  const ag = modalButtons().find(b => b.call.startsWith("ascendGeo"));
  T("легендарный с ур.5 и гемами — восхождение активно", ag.disabled === false);
  const g0 = S.gems; click(ag.call);
  T("восхождение списало гемы и подняло ступень", S.geo.asc === 1 && S.geo.lv === 1 && S.gems === g0 - BALANCE.merge.ascendGems);
}
S.geo = { t: 0, r: 3, n: "Дед", lv: 5, asc: 0 }; S.gems = 0; openGeoGuild();
{
  const ag = modalButtons().find(b => b.call.startsWith("ascendGeo"));
  T("без гемов восхождение заблокировано", ag.disabled === true);
  const before = snap(); click(ag.call);
  T("клик без гемов не даёт ступень", snap() === before);
}

/* ---------- 7. Скиллы: карты и лари ---------- */
console.log("\n[G] Скиллы: лари и апгрейд карт");
localStorage.removeItem("oredeep_v3"); load();
S.skills = {}; S.skillCards = {}; S.protein = 0; S.keys = 0; S.chestKeys = 0; S.gems = 0;
openSkills();
{
  const chests = modalButtons().filter(b => b.call.startsWith("openSkillChest"));
  T("рисуются все три ларя", chests.length === BALANCE.skillChests.length);
  T("без ключей и гемов все лари заблокированы", chests.every(c => c.disabled === true));
  const before = snap(); chests.forEach(c => click(c.call));
  T("клики по заблокированным ларям ничего не тратят", snap() === before);
}
S.chestKeys = 1; openSkills();
{
  const wood = modalButtons().find(b => b.call.includes("'wood'"));
  T("дощатый ларь активен при ключе", wood.disabled === false);
  const k0 = S.chestKeys; click(wood.call);
  const total = Object.values(S.skillCards).reduce((a, b) => a + b, 0);
  T("ларь списал ключ от ларя и выдал карту", S.chestKeys === k0 - 1 && total === 1);
}
S.gems = BALANCE.skillChests[2].gemCost; S.skillCards = {}; openSkills();
{
  const mith = modalButtons().find(b => b.call.includes("'mith'"));
  T("мифриловый ларь активен при гемах", mith.disabled === false);
  const g0 = S.gems; click(mith.call);
  const total = Object.values(S.skillCards).reduce((a, b) => a + b, 0);
  T("мифриловый списал гемы и выдал 5 карт", S.gems === g0 - BALANCE.skillChests[2].gemCost && total === 5);
}
S.skills = {}; S.skillCards = { atk_up: 1 }; S.protein = 0; openSkills();
{
  // по доку первая карта открывает Lv1, и пива она не стоит (таблица начинается с 0)
  const up = modalButtons().find(b => b.call.includes("'atk_up'"));
  T("первая карта открывает навык без пива", up.disabled === false && proteinNeeded("atk_up") === 0);
  click(up.call);
  T("апгрейд открыл навык ур.1 и съел карту", skillLv("atk_up") === 1 && cardsOf("atk_up") === 0);
}
S.skillCards.atk_up = 1; S.protein = 0; openSkills();
{
  // а вот ур.2 уже требует пива
  const up = modalButtons().find(b => b.call.includes("'atk_up'"));
  T("ур.2 без пива заблокирован", proteinNeeded("atk_up") > 0 && up.disabled === true);
  const before = snap(); click(up.call);
  T("клик без пива не качает навык", snap() === before);
}
S.protein = 5000; openSkills();
{
  const up = modalButtons().find(b => b.call.includes("'atk_up'"));
  T("с картой и пивом апгрейд активен", up.disabled === false);
  const p0 = S.protein, need = proteinNeeded("atk_up");
  click(up.call);
  T("апгрейд поднял до ур.2, съел карту и пиво",
    skillLv("atk_up") === 2 && cardsOf("atk_up") === 0 && S.protein === p0 - need);
}
{ // навык на капе не даёт тратить
  S.skills = { luck_up: 1 }; S.skillCards = { luck_up: 99 }; S.protein = 1e6; S.lvls.luck = 500;
  openSkills();
  const up = modalButtons().find(b => b.call.includes("'luck_up'"));
  T("на капе LUCK кнопка навыка заблокирована", !up || up.disabled === true);
  const before = snap(); if (up) click(up.call);
  T("клик на капе не тратит карты и пиво", snap() === before);
  S.lvls.luck = 0;
}

/* ---------- 8. Крафт лутбоксов из камней ---------- */
console.log("\n[H] Крафт лутбоксов из камней");
S.col = { 0: { 1: 60 } }; S.boxes = []; S.mine = 0;
openCollection();
{
  const h = document.getElementById("colList").innerHTML || "";
  const btns = [...h.matchAll(/<button([^>]*)onclick="(craftBoxFromStones\(\d+\))"([^>]*)>/g)]
    .map(m => ({ call: m[2], disabled: /(^|\s)disabled(\s|=|>|$)/.test(m[1] + m[3]) }));
  T("коллекция рисует кнопки крафта", btns.length > 0);
  const r1 = btns.find(b => b.call.includes("(1)"));
  T("крафт тира 1 активен при 60 дубликатах", r1 && r1.disabled === false);
  click(r1.call);
  T("крафт создал бокс и съел дубликаты", S.boxes.length === 1 && S.col[0][1] === 60 - craftBoxCost(1));
  const r2 = btns.find(b => b.call.includes("(2)"));
  T("крафт тира 2 без камней заблокирован", r2 && r2.disabled === true);
  const before = snap(); if (r2) click(r2.call);
  T("клик по заблокированному крафту ничего не тратит", snap() === before);
}

/* ---------- 9. Карточка сета ---------- */
console.log("\n[I] Попап сета");
S.frags = { berserk: { 0: true } }; S.sets = {};
openLoot();
{
  const h = modalBodyHtml() || "";
  const rows = [...h.matchAll(/onclick="openSetCard\('(\w+)'\)"/g)].map(m => m[1]);
  T("строки сетов кликабельны", rows.length === BALANCE.dungeonSets.length);
  openSetCard("berserk");
  T("попап сета открывается", document.getElementById("setModal").style.display === "flex");
  T("попап показывает прогресс и замки",
    /СОБРАНО 1 ИЗ 4/.test(document.getElementById("setCard").innerHTML));
}

/* ---------- 10. Тулбар: четыре кнопки открываются и работают ---------- */
console.log("\n[J] Тулбар: Глубинный Зов / Гильдия / Устав / Честность");
localStorage.removeItem("oredeep_v3"); load(); render();

// --- Глубинный Зов ---
{
  closeAllPanels();
  openPrestige();
  T("«Глубинный Зов» открывает модалку", modalOpen());
  const b = modalButtons().find(x => x.call.startsWith("confirmPrestige"));
  T("внутри есть кнопка престижа", !!b);
  T("на мелководье она заблокирована (но экран открылся)", b.disabled === true);
  T("заголовок про престиж", /Глубинный Зов/.test(modalTitleText()));
}

// --- Гильдия ---
{
  S.science = { on:false, done:0, goldOk:0, goldTotal:0 };
  closeAllPanels();
  sciTask=null; openGuild();
  T("«Гильдия» открывает экран согласия", modalOpen()
    && modalBodyHtml().includes("Согласен, вступаю"));
  const consent = modalButtons().find(x => x.call.startsWith("sciConsent"));
  T("кнопка согласия есть и активна", consent && consent.disabled === false);
  click(consent.call);
  T("согласие включает гильдию и рисует задание", S.science.on === true
    && modalButtons().some(x => x.call.startsWith("sciAnswer")));
  const opts = modalButtons().filter(x => x.call.startsWith("sciAnswer"));
  T("вариантов ответа не меньше двух", opts.length >= 2);
  T("на экране есть образец и кнопка пропуска",
    modalBodyHtml().includes("specImg")
    && modalButtons().some(x => x.call.startsWith("sciSkip")));
  T("контрольные не помечены (антифрод)", !modalBodyHtml().includes("контрольн"));
  const done0 = S.science.done, sh0 = S.shards || 0;
  click(opts[0].call);
  T("ответ засчитан и награда начислена", S.science.done === done0 + 1 && (S.shards || 0) >= sh0);
  T("после ответа выдано следующее задание", modalButtons().some(x => x.call.startsWith("sciAnswer")));
}

// --- Устав Горы ---
{
  document.getElementById("introOv").classList.remove("on");
  showIntro();
  T("«Устав Горы» открывает оверлей", document.getElementById("introOv").classList.contains("on"));
  T("нарисованы все 10 пунктов",
    (document.getElementById("introList").innerHTML.match(/class="iitem"/g) || []).length === CODEX.length);
  document.getElementById("introGo").onclick();
  T("кнопка «Спуститься в Гору» закрывает интро",
    !document.getElementById("introOv").classList.contains("on") && S.introSeen === true);
}

// --- Честность гачи ---
{
  closeAllPanels();
  openFairness();
  T("«Честность гачи» открывает модалку", modalOpen());
  const h = modalBodyHtml();
  T("показан коммит серверного сида", h.includes(S.fair.serverHash));
  const tg = modalButtons().find(x => x.call.startsWith("toggleFair"));
  const rv = modalButtons().find(x => x.call.startsWith("revealFair"));
  const sc = modalButtons().find(x => x.call.startsWith("setFairClient"));
  T("есть кнопки: режим / сид / раскрытие", !!tg && !!sc && !!rv);
  const was = S.fair.on;
  click(tg.call);
  T("переключатель честности работает", S.fair.on === !was);
  document.getElementById("fairClient").value = "мойсид";
  click(modalButtons().find(x => x.call.startsWith("setFairClient")).call);
  T("клиентский сид задаётся и сбрасывает счётчик", S.fair.client === "мойсид" && S.fair.nonce === 0);
  const oldServer = S.fair.server, oldHash = S.fair.serverHash;
  click(modalButtons().find(x => x.call.startsWith("revealFair")).call);
  T("раскрытие меняет сид и коммит валиден",
    S.fair.server !== oldServer && S.fair.serverHash === SHA256(S.fair.server) && oldHash === SHA256(oldServer));
  // при включённой честности гача реально идёт через хэш
  S.fair.on = true; S.fair.server = "aaa"; S.fair.client = "bbb"; S.fair.nonce = 0;
  const expect = parseInt(SHA256("aaa:bbb:0").slice(0, 8), 16) / 0x100000000;
  T("гача считается по хэшу, а не Math.random", Math.abs(grandom() - expect) < 1e-12);
  S.fair.on = false;
}

console.log("\n========== АУДИТ КНОПОК: " + pass + " PASS, " + fail + " FAIL ==========");
globalThis.__auditFail = fail;
