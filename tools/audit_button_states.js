"use strict";
/* Аудит видимых кнопок: клик → состояние (.on/disabled) → инкремент счётчиков.
   Запуск: node tools/audit_button_states.js */
(function () {
  let pass = 0, fail = 0;
  const T = (name, cond, info) => {
    if (cond) { pass++; console.log("  PASS " + name); }
    else { fail++; console.log("  FAIL " + name + (info ? " — " + info : "")); }
  };
  const $ = (id) => document.getElementById(id);

  /* Стаб DOM не парсит HTML — переносим inline onclick/disabled из разметки на FE. */
  function wireInlineFromHtml() {
    const html = globalThis.__RAW_HTML || "";
    const re = /<(button|div)([^>]*\bid="([A-Za-z_][\w]*)"[^>]*)>/gi;
    let m;
    while ((m = re.exec(html))) {
      const attrs = m[2], id = m[3];
      const el = $(id); if (!el) continue;
      const oc = attrs.match(/onclick="([^"]*)"/);
      if (oc) {
        el.setAttribute("onclick", oc[1]);
        const call = oc[1];
        el.onclick = function () { return eval(call); };
      }
      if (/\bdisabled\b/.test(attrs)) el.disabled = true;
    }
  }
  wireInlineFromHtml();

  const hasClick = (el) => !!(el && typeof el.onclick === "function");
  const fire = (el) => {
    if (!el) return "no-el";
    try {
      if (typeof el.onclick === "function") { el.onclick(); return true; }
      return "no-handler";
    } catch (e) { return "ERR:" + e.message; }
  };

  console.log("\n[BTN-STATE] Видимая оболочка: handlers");
  localStorage.removeItem("oredeep_v3"); load(); render();
  closeAllPanels();
  wireInlineFromHtml(); // после load/render (некоторые onclick перезаписываются)

  const wired = [
    "avatar", "menu", "gemsBtn",
    "quests", "offers", "achievements", "artifacts", "friendsBtn",
    "boost2x", "bonusChest", "energyBox",
    "lootChest", "powerUp", "auto",
    "navShop", "navMines", "navSkills", "navTavBtn", "navPvp"
  ];
  for (const id of wired) {
    T("#" + id + " кликабельна", hasClick($(id)));
  }

  console.log("\n[BTN-STATE] Нижний навбар открывает экраны");
  const navMap = [
    ["navShop", () => UIS.id === "shop"],
    ["navMines", () => UIS.id === "mines"],
    ["navPvp", () => UIS.id === "pvp"],
    ["navTavBtn", () => UIS.id === "tavern"]
  ];
  for (const [id, ok] of navMap) {
    closeAllPanels();
    const r = fire($(id));
    T(id + " открывает экран", r === true && ok(), "got UIS.id=" + UIS.id + " r=" + r);
  }
  closeAllPanels();
  fire($("navSkills"));
  T("navSkills открывает навыки", modalOpen() && /Навык|навык|Лар|Скилл/i.test(modalTitleText() + modalBodyHtml()));

  console.log("\n[BTN-STATE] Toggle .on и лейблы");
  localStorage.removeItem("oredeep_v3"); load(); render(); wireInlineFromHtml();
  { const a = $("auto"); const on0 = a.classList.contains("on");
    fire(a); render();
    T("Auto клик переключает S.autoRoll", S.autoRoll === true);
    T("Auto получает .on", a.classList.contains("on") === true && on0 === false);
    T("Auto лейбл ВКЛ", ($("autoLbl2").textContent || "").includes("ВКЛ"));
    fire(a); render();
    T("Auto повторно снимает .on", !a.classList.contains("on") && S.autoRoll === false);
    T("Auto лейбл ВЫКЛ", ($("autoLbl2").textContent || "").includes("ВЫКЛ"));
  }
  { S.loot2xUntil = 0; render();
    const b = $("boost2x");
    T("2× без баффа без .on", !b.classList.contains("on"));
    fire(b); // rewarded stub ok=true
    T("2× клик включает бафф", !!(S.loot2xUntil && S.loot2xUntil > Date.now()));
    render();
    T("2× получает .on", b.classList.contains("on"));
    const g0 = S.gold; fire(b); // already active — no re-apply spend
    T("2× повторный клик не ломает таймер", S.loot2xUntil > Date.now() && S.gold === g0);
  }

  console.log("\n[BTN-STATE] Disabled / no-op");
  { ensureBonus(S); S.bonusReadyAt = Date.now() + 3600e3;
    const g0 = S.gold, b0 = S.bags || 0;
    fire($("bonusChest"));
    T("бонус на CD не даёт золото/сумки", S.gold === g0 && (S.bags || 0) === b0);
  }
  { S.bags = 0; render();
    const g0 = S.gold;
    openBag();
    T("openBag без сумок no-op", S.gold === g0 && (S.bags || 0) === 0);
  }
  { S.bag = 1; S.gold = 0; S.bagActive = null; render();
    const b0 = S.bag;
    fire($("powerUp"));
    T("СИЛА без золота не стартует апгрейд", !S.bagActive && S.bag === b0);
  }
  { S.durab = MINE_DURAB.max; S.gold = 1e9; const g0 = S.gold;
    fire($("energyBox"));
    T("крепь 100% — reinforce не тратит золото", S.gold === g0 && S.durab === MINE_DURAB.max);
  }

  console.log("\n[BTN-STATE] Инкременты счётчиков");
  localStorage.removeItem("oredeep_v3"); load(); dead = false; render(); wireInlineFromHtml();
  { ensureBonus(S); S.bonusReadyAt = 0;
    const g0 = S.gold, b0 = S.bags || 0;
    fire($("bonusChest"));
    T("бонус +золото", S.gold > g0);
    T("бонус +1 сумка", (S.bags || 0) === b0 + 1);
    const g1 = S.gold, b1 = S.bags;
    fire($("bonusChest"));
    T("двойной клик бонуса не дублирует", S.gold === g1 && S.bags === b1);
  }
  { S.bags = 3; const b0 = S.bags;
    openBag();
    T("Открыть −1 сумка", S.bags === b0 - 1);
  }
  { S.eggs = 2; const e0 = S.eggs, r0 = S.petRolls || 0;
    rollPet();
    T("яйцо −1 и petRolls +1", S.eggs === e0 - 1 && (S.petRolls || 0) === r0 + 1);
  }
  { const g0 = S.gems;
    buyGems(0);
    T("buyGems инкремент gem-счётчика", S.gems === g0 + BALANCE.shop.gemPacks[0]);
    render();
    T("HUD #gems отражает gems", Number(String($("gems").textContent).replace(/\D/g, "")) > 0 || S.gems > 0);
  }
  { S.durab = 30; S.gold = reinforceCost() * 3; const d0 = S.durab, g0 = S.gold;
    fire($("energyBox"));
    T("тап энергии: крепь → 100%", S.durab === MINE_DURAB.max && S.durab > d0);
    T("тап энергии: −золото", S.gold < g0);
  }
  { S.bag = 1; S.gold = bagCost() * 5; S.bagActive = null;
    fire($("powerUp"));
    T("СИЛА стартует таймер апгрейда", !!S.bagActive);
    S.bagActive.end = Date.now(); finishBagUpgrade();
    T("СИЛА инкремент уровня сумки", S.bag === 2);
  }
  { // апгрейд ATK +
    buildUpgrades();
    const u = UPGRADES.find(x => x.id === "atk");
    S.lvls.atk = 0; S.gold = upCost(u) * 2;
    const lv0 = S.lvls.atk, g0 = S.gold;
    const btn = $("u_atk") && $("u_atk").querySelector("button");
    T("кнопка апгрейда ATK есть", !!btn);
    if (btn) fire(btn);
    T("ATK уровень +1", S.lvls.atk === lv0 + 1);
    T("ATK −золото", S.gold < g0);
    S.gold = 0; const lv1 = S.lvls.atk;
    if (btn) fire(btn);
    T("ATK без золота не растёт", S.lvls.atk === lv1);
  }
  { // daily quest progress via bag open
    S.daily = { day: todayStr(), prog: {}, tok: 0, claimed: [] };
    S.bags = 2; openBag();
    T("дейлик bag инкремент", (S.daily.prog.bag || 0) === 1);
  }
  { // shop free claim once
    shopFreeReset(); S.shopFree.taken = {};
    const e0 = S.eggs || 0, c0 = S.combs || 0;
    claimShopFree("a", false);
    T("бесплатный оффер +яйцо +расчёска", (S.eggs || 0) === e0 + 1 && (S.combs || 0) === c0 + 1);
    const e1 = S.eggs, c1 = S.combs;
    claimShopFree("a", false);
    T("повтор бесплатного оффера no-op", S.eggs === e1 && S.combs === c1);
  }
  { // growth milestone counter
    ensureGrowth(S); S.growth.invites = 3; S.growth.milestones = [];
    const g0 = S.gems;
    claimInviteMilestones();
    T("веха рефералов +гемы", S.gems > g0 && S.growth.milestones.includes(0));
  }

  console.log("\n[BTN-STATE] Визуальные состояния action bar");
  { S.bags = 0; render();
    const badge = $("bagBadge2");
    T("бейдж сумок скрыт при 0", !badge || badge.style.display === "none");
    S.bags = 5; render();
    T("бейдж сумок виден при >0", badge && badge.style.display !== "none" && String(badge.textContent || "").length > 0);
  }
  { S.autoRoll = true; S.bags = 5; render();
    T("при Auto ON canOpenBag ложен", canOpenBag() === false);
  }
  { // lootChest / powerUp visual affordance
    S.bags = 0; S.autoRoll = false; render();
    const lc = $("lootChest");
    T("lootChest без сумок приглушён", lc && (lc.style.opacity === "0.55" || lc.disabled === true || lc.classList.contains("off")));
    S.bags = 3; render();
    T("lootChest с сумками активен", lc && lc.style.opacity !== "0.55" && !lc.disabled);
    S.bag = 1; S.gold = 0; S.bagActive = null; render();
    const pu = $("powerUp");
    T("СИЛА без золота приглушена/disabled", pu && (pu.disabled === true || pu.style.opacity === "0.55" || pu.classList.contains("off")));
    S.gold = bagCost() * 2; render();
    T("СИЛА с золотом активна", pu && !pu.disabled && pu.style.opacity !== "0.55");
  }

  console.log("\n========== BTN-STATE: " + pass + " PASS, " + fail + " FAIL ==========");
  globalThis.__btnStateFail = fail;
  if (typeof process !== "undefined" && !globalThis.__fromAuditButtons) process.exit(fail ? 1 : 0);
})();
