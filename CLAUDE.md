# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

ORE DEEP — idle-игра про дворфа-рудокопа. Полный рескин баланса `com.tapnine.idleboxer` v1.18: все формулы, кривые и шансы — 1:1 из реверса байткода референса. Единственное техническое отличие — слой редких камней от кирки. Мобильная оболочка — Capacitor (Android). Язык интерфейса и комментариев — русский.

## Commands

```bash
# Тесты (ОБЯЗАТЕЛЬНО перед коммитом — хук это проверяет)
node tools/run_tests.js           # все функциональные тесты, ожидание: 0 FAIL

# Баланс
node tools/calibrate_atk.js       # свип треадмилла: сек/жилу по глубинам, лог-сигма ровности
node tools/balance_sim.js          # Монте-Карло симуляция прогрессии игрока
node tools/audit_buttons.js        # аудит привязки кнопок и onclick

# Арт
npm run art                        # python3 tools/gen_pixel_art.py → art/*.png → base64 в index.html

# Мобильная сборка
npm install && npm run sync && npx cap open android
```

Запуск в браузере: просто открыть `index.html`. Всё работает из файла, прогресс в localStorage.

## Architecture

**Оболочка:** `index.html` — CSS + DOM. **Логика** разнесена без бандлера (порядок скриптов важен):

1. `js/balance.js` — `BALANCE`, единый источник чисел (idle, комбат, сумка L1–50, навыки, ивенты, PvP, престиж, магазин, Gym, стикеры, DoT, крафт)
2. `js/platform.js` — мост к нативным SDK (AdMob/Billing stubs) + плашка rewarded; `scienceTasks()`, лидерборд
3. `js/game.js` — кривая породы, лут, SHA-256/fair RNG, состояние `S`, `stat()`, боевой тик, UI-рендер, сейв
4. `tools/ui_screens.js` — экраны вкладок (рынок, штольни, таверна, …)

`npm run build` копирует `index.html` + `js/*` + `tools/ui_screens.js` + `art/` в `www/` для Capacitor.

### Ключевое равновесие (треадмилл)

```
escPerBlock() = ATK_COMPOUND ^ atkLevelsPerBlock()
atkLevelsPerBlock() = ln(G) / ln(g)   где G = idle.growth · idle.damp^0.4, g = UPGRADES.atk.g
```

Это выводится из констант, а не хардкодится. Ломается равенство → игра или ваншотит, или стена. См. `.claude/rules/balance-constants.md`.

### Ограниченный прогон

Глубина зажата `BALANCE.run.len` (1000 этапов). Пиковая HP < 1e9 — числа читаемы без экспонент. Дальше свода двигает только Глубинный Зов (престиж). Прогресс живёт в целом уровне престижа, а не в экспоненте.

## Testing

Тестовый харнесс (`tools/run_tests.js`) грузит `js/balance.js` + `js/platform.js` + `js/game.js` + `tools/ui_screens.js`, прогоняет через `eval()` с фейковым DOM (`tools/test_stub.js`) и тест-кейсами (`tools/test_cases.js`). Нет Node-модулей, нет jest/mocha — всё vanilla.

Чтобы подменить рандом в тестах: `Math.random = () => 0.5;` (работает, если `S.fair.on` выключен — тогда `grandom()` делегирует к `Math.random`).

Хук `.claude/hooks/validate-commit.sh` блокирует `git commit` при FAIL.

## Balance Rules

Полные правила — в `.claude/rules/balance-constants.md`. Ключевое:

- Числа живут ТОЛЬКО в `BALANCE`, `DEPTH`, `ATK_COMPOUND`, `UPGRADES`, `STAT_CAPS`, `ANCHOR_*`, `MINE_DURAB`
- Магическое число в теле функции — дефект. Временная калибровка помечается `CALIB`
- `resp` НЕ эскалируется по глубине
- Вероятности капятся 100%. Крафт/апгрейд лутбоксов тратят только дубликаты
- Порядок правки: калибратор «до» → правка → калибратор «после» (лог-сигма не растёт) → тесты 0 FAIL → новый инвариант закрепить тестом

## Existing Claude Tooling

- **Agent** `.claude/agents/economy-designer.md` — балансировщик с доступом к Bash (прогоняет инструменты, а не рассуждает)
- **Skill** `/balance-check [treadmill|upgrades|economy|loot|all]` — балансовый аудит
- **Hook** `validate-commit.sh` — pre-commit: тесты + синтаксис + треадмилл
- Шаблоны в `.claude/docs/templates/` для economy-model и difficulty-curve

## Key Documents

- `AGENTS.md` — продуктовый контекст для ИИ (системы, экраны, инварианты UI; источник правды по механикам)
- `docs/REVERSE_ECONOMY.md` — реверс байткода Idle Boxer, значения с пометками [точно]/[вывод]/[≈]
- `docs/PDF_СВЕРКА.md` — сверка с дизайн-доком, статусы ✅/◐/⬜/↺ по каждой механике
- `docs/ROADMAP.md` — продуктовый роадмап до релиза (фазы 0–5)
- `docs/MECHANICS_ROADMAP.md` — механики залипательности и виральности (P0/P1/P2)
