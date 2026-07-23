"use strict";
/* Аудит UI shells: node tools/audit_ui_shells.js
   Проверяет, что все экраны открываются через #uiScreen, а не #metaModal. */
(function () {
  let pass = 0, fail = 0;
  const T = (name, cond, info) => {
    if (cond) { pass++; console.log("  PASS " + name); }
    else { fail++; console.log("  FAIL " + name + (info ? " — " + info : "")); }
  };

  console.log("\n[UI-SHELLS] Единая оболочка UIS");
  localStorage.removeItem("oredeep_v3"); load();

  const native = [
    ["profile", () => openProfile()],
    ["settings", () => UIS.open("settings")],
    ["pets", () => UIS.open("pets", "gacha")],
    ["beards", () => UIS.open("beards", "gacha")],
    ["mines", () => UIS.open("mines")],
    ["pvp", () => UIS.open("pvp")],
    ["tavern", () => UIS.open("tavern", "ale")],
    ["artifacts", () => UIS.open("artifacts")],
    ["shop", () => UIS.open("shop", "free")]
  ];

  for (const [id, open] of native) {
    closeAllPanels();
    open();
    T(id + " → uiScreen", document.getElementById("uiScreen").style.display === "flex");
    T(id + " metaModal закрыт", document.getElementById("metaModal").style.display !== "flex");
    T(id + " uiBody не пуст", (document.getElementById("uiBody").innerHTML || "").length > 20);
    T(id + " футер на месте", document.getElementById("app").classList.contains("uiOpen")
      && document.getElementById("bottomNav").style.display !== "none");
  }

  const metaPanels = [
    ["skills", () => openSkills()],
    ["wheel", () => openWheel()],
    ["events", () => openEvents()],
    ["workouts", () => openWorkouts()],
    ["daily", () => openDaily()],
    ["guild", () => openGuild()],
    ["loot", () => openLoot()],
    ["prestige", () => openPrestige()],
    ["fairness", () => openFairness()],
    ["wall", () => openWall()],
    ["gear-slot", () => openGearSlot("pick")]
  ];

  for (const [id, open] of metaPanels) {
    closeAllPanels();
    open();
    T(id + " (legacy) → uiScreen", document.getElementById("uiScreen").style.display === "flex");
    T(id + " metaModal не используется", document.getElementById("metaModal").style.display !== "flex");
    T(id + " (legacy) футер на месте", document.getElementById("bottomNav").style.display !== "none");
  }

  closeAllPanels();
  T("UIS.close закрывает экран", document.getElementById("uiScreen").style.display !== "flex");
  T("UIS.close снимает uiOpen", !document.getElementById("app").classList.contains("uiOpen"));

  console.log("\n========== UI SHELLS: " + pass + " PASS, " + fail + " FAIL ==========");
  globalThis.__uiShellFail = fail;
})();
