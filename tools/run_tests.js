"use strict";
/* Функциональные тесты прототипа: node tools/run_tests.js
   Фейковый DOM + js/{balance,platform,game} + ui_screens + test_cases. */
const fs=require("fs"), path=require("path");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const balance=read("js/balance.js");
const platform=read("js/platform.js");
const game=read("js/game.js");
const stub=read("tools/test_stub.js");
const cases=read("tools/test_cases.js");
const ui=read("tools/ui_screens.js");
const ids=[...html.matchAll(/id="([A-Za-z_]+)"/g)].map(m=>m[1]);
globalThis.__HTML_IDS=[...new Set(ids)];
eval(stub+balance+platform+game+ui+cases);
