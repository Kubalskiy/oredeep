"use strict";
/* Запуск: node tools/audit_button_states_run.js */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const game = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const stub = fs.readFileSync(path.join(__dirname, "test_stub.js"), "utf8");
const ui = fs.readFileSync(path.join(__dirname, "ui_screens.js"), "utf8");
const audit = fs.readFileSync(path.join(__dirname, "audit_button_states.js"), "utf8");
const ids = [...html.replace(game, "").matchAll(/id="([A-Za-z_]+)"/g)].map(m => m[1]);
globalThis.__HTML_IDS = ids;
globalThis.__RAW_HTML = html;
eval(stub + game + ui + audit);
