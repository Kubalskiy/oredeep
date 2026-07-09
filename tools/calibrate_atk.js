"use strict";
/* Калибровка бесконечной сложности: node tools/calibrate_atk.js
 *
 * Теория. Доход растёт ×G за блок (50 этапов), G = 2.5·0.65^0.4 ≈ 2.099.
 * Цена ATK-апгрейда растёт ×g за уровень (g=1.35), значит число доступных
 * уровней за блок ≈ ln(G)/ln(g) = LPB. Если апгрейд даёт компаунд ×c за уровень,
 * то ATK за блок растёт ×c^LPB. Единственная устойчивая бесконечная сложность:
 *
 *     escPerBlock = c^LPB
 *
 * Тогда сек/жилу выходит на константу на любой глубине. Уровень этой константы
 * задаётся множителем hpMul. Ниже подбираем c и hpMul.
 */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const game = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const stub = fs.readFileSync(path.join(__dirname, "test_stub.js"), "utf8");
const ids = [...html.replace(game, "").matchAll(/id="([A-Za-z_]+)"/g)].map(m => m[1]);
globalThis.__HTML_IDS = ids;

const BUDGET_H = 1;                                   // игрок вкладывает 1 час дохода в ATK
const STAGES = [400, 800, 1500, 3000, 6000, 12000, 20000];   // глубже double переполняется
const TARGET_T = 6;   // целевые сек/жилу у вкладывающегося                                   // целевые сек/жилу

const patched = game
  .replace(/const ATK_COMPOUND=[\d.]+;.*/, "const ATK_COMPOUND_REF={v:1.15}; const ATK_COMPOUND=1.15;")
  .replace('if(id==="atk") v*=Math.pow(ATK_COMPOUND,S.lvls.atk||0);',
           'if(id==="atk") v*=Math.pow(ATK_COMPOUND_REF.v,S.lvls.atk||0);')
  .replace("return Math.pow(ATK_COMPOUND, atkLevelsPerBlock());","return Math.pow(ATK_COMPOUND_REF.v, atkLevelsPerBlock());")
  + `
globalThis.__run = function(c, esc, hpMul){
  ATK_COMPOUND_REF.v = c;
  DEPTH.hpMul = hpMul;
  const U = UPGRADES.find(u=>u.id==="atk");
  const out=[];
  for (const s of __STAGES){
    S.stageIdx=s;
    S.lvls={atk:0,energy:0,spd:400,tough:0,crit:0,luck:0,mining:0,stone:0};
    S.geo=null;S.pet=null;S.workouts={};S.skills={};S.sets={};S.col={};S.gear={};

    // РЕАЛИСТИЧНЫЙ шмот: редкость из таблицы сумки, сумка растёт с глубиной
    const bag = Math.min(50, Math.max(1, Math.round(s/25)));
    const w = bagWeights(bag);
    const expPow = w.reduce((a,wi,i)=>a+wi*RAR_POW[i],0)/100;   // ожидаемый множитель редкости
    let gearAtk=0;
    for(const sl of SLOTS) gearAtk += (sl.st.atk||0)*expPow*(1+s/60);

    const hp = rockStatsAt(s,false).hp * hpMul;
    const budget = idlePerSec()*3600*__BUDGET_H;
    let spent=0,n=0;
    for(;;){ const cst=U.base*Math.pow(U.g,n); if(!isFinite(cst)||spent+cst>budget) break; spent+=cst; n++; if(n>50000) break; }

    const spd = BALANCE.combat.maxAPS;
    const atkInv  = (BASE.atk + U.step*n + gearAtk) * Math.pow(c,n);
    const atkLazy = (BASE.atk + gearAtk);
    out.push({s,n,hp,bag,tInv:hp/(atkInv*spd),tLazy:hp/(atkLazy*spd)});
  }
  return out;
};
globalThis.__LPB = function(){
  const G = BALANCE.idle.growth * Math.pow(BALANCE.idle.damp,0.4);   // рост дохода за блок
  const g = UPGRADES.find(u=>u.id==="atk").g;
  return { G, g, lpb: Math.log(G)/Math.log(g) };
};
`;
globalThis.__STAGES=STAGES; globalThis.__BUDGET_H=BUDGET_H;
eval(stub + patched);

const { G, g, lpb } = globalThis.__LPB();
console.log("рост дохода за блок G = " + G.toFixed(4));
console.log("рост цены за уровень g = " + g);
console.log("уровней за блок LPB = ln(G)/ln(g) = " + lpb.toFixed(4) + "\n");

// геом. среднее tInv по глубоким стадиям + мера «плоскости»
function evaluate(rows) {
  const deep = rows.filter(r => r.s >= 3000 && isFinite(r.tInv) && r.tInv > 0);
  if (deep.length < 3) return null;
  const logs = deep.map(r => Math.log(r.tInv));
  const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
  const varr = logs.reduce((a, b) => a + (b - mean) ** 2, 0) / logs.length;
  return { geo: Math.exp(mean), flat: Math.sqrt(varr) };   // flat -> 0 = идеальный треадмилл
}

let best = null;
for (const c of [1.08, 1.10, 1.12, 1.15, 1.18, 1.20, 1.25]) {
  const esc = Math.pow(c, lpb);                       // информативно; игра считает сама
  // подбираем hpMul так, чтобы геом. среднее tInv = TARGET_T
  let rows = globalThis.__run(c, esc, 1);
  const ev0 = evaluate(rows);
  if (!ev0) continue;
  const hpMul = TARGET_T / ev0.geo;
  rows = globalThis.__run(c, esc, hpMul);
  const ev = evaluate(rows);
  if (!ev) continue;
  const lazyRatio = Math.min(...rows.filter(r => r.s >= 3000).map(r => r.tLazy / r.tInv));
  const scoreV = ev.flat;                             // чем ровнее, тем лучше
  if (!best || scoreV < best.flat) best = { c, esc, hpMul, flat: ev.flat, geo: ev.geo, lazyRatio, rows };
}

console.log("подбор c (компаунд ATK), esc = c^LPB, hpMul под " + TARGET_T + " сек/жилу:\n");
console.log("ЛУЧШЕЕ: atkCompound=" + best.c + "  escPerBlock=" + best.esc.toFixed(4) +
  "  hpMul=" + best.hpMul.toExponential(3));
console.log("разброс сек/жилу (лог-сигма) = " + best.flat.toFixed(3) + "  (0 = идеально ровно)");
console.log("забивший медленнее вложившегося минимум в " + best.lazyRatio.toExponential(1) + " раз\n");

console.log("этап    | ур.ATK |   HP породы | сек/жилу (вложился) | сек/жилу (забил)");
for (const r of best.rows) {
  console.log(
    String(r.s).padStart(7) + " | " + String(r.n).padStart(6) + " | " +
    r.hp.toExponential(2).padStart(11) + " | " +
    (isFinite(r.tInv) ? r.tInv.toFixed(1) : "∞").padStart(19) + " | " +
    (isFinite(r.tLazy) ? r.tLazy.toExponential(1) : "∞").padStart(16));
}
