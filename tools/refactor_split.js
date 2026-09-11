"use strict";
/* One-shot architecture split: extract BALANCE + game script from index.html,
   restore bag L1–50 tables, write js/{balance,platform,game}.js and rewire HTML. */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "index.html");
let html = fs.readFileSync(htmlPath, "utf8");

const scriptRe = /<script>\n"use strict";\n([\s\S]*?)\n<\/script>\n<script src="tools\/ui_screens/;
const m = html.match(scriptRe);
if (!m) {
  console.error("Main game <script> block not found");
  process.exit(1);
}
let body = m[1];

const BAG_WEIGHTS = `  /* Drop chances by bag level 1..50 (sum ≈100). Source: GDD spreadsheet. */
  bagWeights:[
    [100,0,0,0,0,0,0,0],
    [99,1,0,0,0,0,0,0],
    [97,3,0,0,0,0,0,0],
    [95,4.9,0.1,0,0,0,0,0],
    [90,9.8,0.2,0,0,0,0,0],
    [86,13.62,0.36,0.02,0,0,0,0],
    [82,17.44,0.52,0.04,0,0,0,0],
    [78,21.26,0.68,0.06,0,0,0,0],
    [74,25.08,0.84,0.08,0,0,0,0],
    [70,28.9,1,0.1,0,0,0,0],
    [66,32.4,1.4,0.18,0.02,0,0,0],
    [62,35.9,1.8,0.26,0.04,0,0,0],
    [58,39.4,2.2,0.34,0.06,0,0,0],
    [54,42.9,2.6,0.42,0.08,0,0,0],
    [50,46.4,3,0.5,0.1,0,0,0],
    [46,49.8,3.4,0.6,0.18,0.02,0,0],
    [42,53.2,3.8,0.7,0.26,0.04,0,0],
    [38,56.6,4.2,0.8,0.34,0.06,0,0],
    [34,60,4.6,0.9,0.42,0.08,0,0],
    [30,63.4,5,1,0.5,0.1,0,0],
    [26,65.8,6,1.4,0.6,0.18,0.02,0],
    [22,68.2,7,1.8,0.7,0.26,0.04,0],
    [18,70.6,8,2.2,0.8,0.34,0.06,0],
    [14,73,9,2.6,0.9,0.42,0.08,0],
    [10,75.4,10,3,1,0.5,0.1,0],
    [8,74.4,12,3.4,1.4,0.6,0.18,0.02],
    [6,73.4,14,3.8,1.8,0.7,0.26,0.04],
    [4,72.4,16,4.2,2.2,0.8,0.34,0.06],
    [2,71.4,18,4.6,2.6,0.9,0.42,0.08],
    [0,70.4,20,5,3,1,0.5,0.1],
    [0,66.42,22,6,3.4,1.4,0.6,0.18],
    [0,62.44,24,7,3.8,1.8,0.7,0.26],
    [0,58.46,26,8,4.2,2.2,0.8,0.34],
    [0,54.48,28,9,4.6,2.6,0.9,0.42],
    [0,50.5,30,10,5,3,1,0.5],
    [0,45.6,31,12,6,3.4,1.4,0.6],
    [0,40.7,32,14,7,3.8,1.8,0.7],
    [0,35.8,33,16,8,4.2,2.2,0.8],
    [0,30.9,34,18,9,4.6,2.6,0.9],
    [0,26,35,20,10,5,3,1],
    [0,21.2,34,22,12,6,3.4,1.4],
    [0,16.4,33,24,14,7,3.8,1.8],
    [0,11.6,32,26,16,8,4.2,2.2],
    [0,6.8,31,28,18,9,4.6,2.6],
    [0,2,30,30,20,10,5,3],
    [0,1.6,27,28,22,12,6,3.4],
    [0,1.2,24,26,24,14,7,3.8],
    [0,0.8,21,24,26,16,8,4.2],
    [0,0.4,18,22,28,18,9,4.6],
    [0,0,15,20,30,20,10,5]
  ],`;

const BAGS_CFG = `  bags:{ starter:20, perVein:1, perBoss:3, autoSec:3, autoOpenPerTick:1,
    offlineSecPerBag:9, cap:9999, maxPerTick:400,
    /* Seconds for upgrade L → L+1 (index = L, 1..49). Source: GDD spreadsheet. */
    upgradeSecFrom:[0,
      60,300,600,1200,1800,2700,3600,7200,14400,
      28800,43200,50400,57600,64800,72000,79200,86400,86400,86400,
      86400,86400,86400,86400,86400,86400,86400,86400,86400,86400,
      86400,86400,86400,86400,86400,86400,86400,86400,86400,86400,
      86400,86400,86400,86400,86400,86400,86400,86400,86400,86400],
    skipSecPerGem:1800,
    adSkipSec:3600,
    autoUnlockSlots:8, autoUnlockRares:3 },`;

body = body.replace(
  /  bagAnchors:\[[^\]]+\],\s*bagWeights:\[[\s\S]*?\],\s*avatars:/,
  BAG_WEIGHTS + "\n  avatars:"
);
body = body.replace(
  /  bags:\{ starter:20[\s\S]*?autoUnlockSlots:8, autoUnlockRares:3 \},/,
  BAGS_CFG
);

const BAG_WEIGHTS_FN = `function bagWeights(lvl){
  const W=BALANCE.bagWeights;
  lvl=Math.max(1,Math.min(50,lvl|0));
  const row=W[lvl-1];
  return row?row.slice():[100,0,0,0,0,0,0,0];
}
`;

body = body.replace(
  /const BAG_LVLS=BALANCE\.bagAnchors;\s*const BAG_W=BALANCE\.bagWeights;\s*function bagWeights\(lvl\)\{[\s\S]*?return w\.map\(v=>v\/s\*100\);\s*\}\s*/,
  BAG_WEIGHTS_FN
);

const BAG_TIMER_FNS = `function bagUpgradeSec(lv){
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
`;

body = body.replace(
  /function bagUpgradeSec\(lv\)\{[\s\S]*?let bagSkipArmed=false;/,
  BAG_TIMER_FNS
);

const SKIP_FNS = `function skipBagUpgrade(){
  if(!S.bagActive) return false;
  const gems=bagSkipGems();
  if((S.gems||0)<gems){
    showToast("💎","Мало кристаллов","","Нужно "+gems+" 💎","или −1ч за рекламу");
    return false;
  }
  S.gems-=gems;
  S.bagActive.end=Date.now();
  bagSkipArmed=false;
  Platform.logEvent("bag_skip",{gems, paid:true});
  showToast("⏩","Пропущено!","","−"+gems+" 💎","сумка → ур."+(S.bag+1));
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
      showToast("⏩","Таймер закрыт","","−"+fmtClock(cut*1000),"сумка → ур."+(S.bag+1));
      finishBagUpgrade();
    } else {
      showToast("⏩","−1 час","","осталось "+fmtClock(bagUpgradeLeft()*1000));
      save(); render();
      if($("chestModal")&&$("chestModal").style.display==="flex") renderChestCard();
    }
  }, {limitMsg:"Пропуск −1ч недоступен"});
  return true;
}
`;

body = body.replace(
  /function skipBagUpgrade\(\)\{[\s\S]*?return false;\s*\}\s*function rollVeinExtras/,
  SKIP_FNS + "function rollVeinExtras"
);

body = body.replace(
  /function tryBagUpgrade\(\)\{[\s\S]*?startBagUpgrade\(\);\s*return true;\s*\}/,
  `function tryBagUpgrade(){
  if(bagUpgrading()){
    openChest(true);
    return false;
  }
  bagSkipArmed=false;
  if(S.bag>=50) return false;
  if((S.gold||0)<bagCost()) return false;
  startBagUpgrade();
  return true;
}`
);

body = body.replace(
  /function chestUpgrade\(\)\{[\s\S]*?renderChestCard\(\);\s*\}\s*function chestSkip\(\)\{[\s\S]*?renderChestCard\(\);\s*\}/,
  `function chestUpgrade(){
  if(bagUpgrading()){ renderChestCard(); return; }
  if(!startBagUpgrade()) return;
  renderChestCard();
}
function chestSkip(){
  if(!bagUpgrading()){ showToast("⏩","Нечего пропускать","","Сначала запусти апгрейд"); return; }
  skipBagUpgrade();
  renderChestCard();
}`
);

/* Split BALANCE object */
const balStart = body.indexOf("const BALANCE = {");
if (balStart < 0) { console.error("BALANCE not found"); process.exit(1); }
let i = balStart + "const BALANCE = {".length;
let depth = 1;
while (i < body.length && depth > 0) {
  const ch = body[i++];
  if (ch === "{") depth++;
  else if (ch === "}") depth--;
  else if (ch === '"' || ch === "'" || ch === "`") {
    const q = ch;
    while (i < body.length) {
      if (body[i] === "\\") { i += 2; continue; }
      if (body[i] === q) { i++; break; }
      i++;
    }
  }
}
while (i < body.length && /[\s;]/.test(body[i])) i++;
const balanceSrc = body.slice(balStart, i).replace(/;\s*$/, "") + ";";
let rest = body.slice(0, balStart) + body.slice(i);

/* Split Platform + ad plaque helpers that Platform needs */
const platMarker = "const Platform={";
const platAt = rest.indexOf(platMarker);
let platformSrc = "";
let gameSrc = rest;
if (platAt >= 0) {
  /* include ad plaque helpers just above Platform if present */
  let platBlockStart = platAt;
  const adAnchor = rest.lastIndexOf("let _adPlaqueCb", platAt);
  if (adAnchor >= 0) platBlockStart = adAnchor;

  let j = rest.indexOf("{", platAt) + 1;
  let d = 1;
  while (j < rest.length && d > 0) {
    const ch = rest[j++];
    if (ch === "{") d++;
    else if (ch === "}") d--;
    else if (ch === '"' || ch === "'" || ch === "`") {
      const q = ch;
      while (j < rest.length) {
        if (rest[j] === "\\") { j += 2; continue; }
        if (rest[j] === q) { j++; break; }
        j++;
      }
    }
  }
  while (j < rest.length && /[\s;]/.test(rest[j])) j++;
  platformSrc = rest.slice(platBlockStart, j).replace(/;\s*$/, "") + ";";
  gameSrc = rest.slice(0, platBlockStart) + rest.slice(j);
}

const jsDir = path.join(root, "js");
fs.mkdirSync(jsDir, { recursive: true });

const header = `"use strict";
/* Auto-split from index.html — edit here; keep load order: balance → platform → game → ui_screens */
`;

fs.writeFileSync(path.join(jsDir, "balance.js"), header + "\n" + balanceSrc + "\n");
fs.writeFileSync(path.join(jsDir, "platform.js"), header + "\n" + platformSrc + "\n");
fs.writeFileSync(path.join(jsDir, "game.js"), header + "\n" + gameSrc.trim() + "\n");

const tags =
  `<script src="js/balance.js"></script>\n` +
  `<script src="js/platform.js"></script>\n` +
  `<script src="js/game.js"></script>\n` +
  `<script src="tools/ui_screens.js?v=18"></script>`;

html = html.replace(scriptRe, tags + "\n<script src=\"tools/ui_screens");
/* fix accidental double ui_screens from replace */
html = html.replace(
  /<script src="tools\/ui_screens\.js\?v=18"><\/script>\n<script src="tools\/ui_screens\.js\?v=\d+"><\/script>/,
  `<script src="tools/ui_screens.js?v=18"></script>`
);

fs.writeFileSync(htmlPath, html);

/* Ensure ui_screens exports bagSkipAdHour */
const uiPath = path.join(root, "tools", "ui_screens.js");
let ui = fs.readFileSync(uiPath, "utf8");
if (!ui.includes('"bagSkipAdHour"')) {
  ui = ui.replace(
    '"chestOpenOne","chestUpgrade","chestSkip"',
    '"chestOpenOne","chestUpgrade","chestSkip","bagSkipAdHour"'
  );
  fs.writeFileSync(uiPath, ui);
}

console.log("OK: js/balance.js, js/platform.js, js/game.js written; index.html rewired");
console.log("balance bytes", balanceSrc.length, "platform", platformSrc.length, "game", gameSrc.length);
