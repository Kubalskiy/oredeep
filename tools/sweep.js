"use strict";
/* Свип-охота на баги: node tools/sweep.js */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const game = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const stub = fs.readFileSync(path.join(__dirname, "test_stub.js"), "utf8");
const cases = fs.readFileSync(path.join(__dirname, "sweep_cases.js"), "utf8");
const ids = [...html.replace(game, "").matchAll(/id="([A-Za-z_]+)"/g)].map(m => m[1]);
globalThis.__HTML_IDS = ids;
eval(stub + game + cases);
process.exit(globalThis.__sweepFail ? 1 : 0);
