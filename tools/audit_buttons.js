"use strict";
/* Аудит кнопок новых фич: node tools/audit_buttons.js
   Проверяет, что inline onclick ссылаются на существующие функции, что
   обработчики привязаны к элементам, и что disabled-кнопка ничего не тратит. */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const game = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const stub = fs.readFileSync(path.join(__dirname, "test_stub.js"), "utf8");
const cases = fs.readFileSync(path.join(__dirname, "audit_cases.js"), "utf8");
const ids = [...html.replace(game, "").matchAll(/id="([A-Za-z_]+)"/g)].map(m => m[1]);
globalThis.__HTML_IDS = ids;
globalThis.__RAW_HTML = html;
eval(stub + game + cases);
process.exit(globalThis.__auditFail ? 1 : 0);
