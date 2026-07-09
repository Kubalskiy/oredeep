# Сторонние материалы

Часть конфигурации `.claude/` заимствована из проекта
[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
(MIT License, © 2026 Donchitos). Текст лицензии — `docs/templates/LICENSE-CCGS`.

## Что взято как есть

- `docs/templates/economy-model.md`
- `docs/templates/difficulty-curve.md`

## Что взято за основу и переработано под ORE DEEP

- `agents/economy-designer.md` — исходный агент имел `disallowedTools: Bash` и мог
  только читать файлы. Здесь Bash разрешён: баланс проекта исполняемый, агент
  обязан запускать `tools/calibrate_atk.js` и `tools/run_tests.js`, а не рассуждать.
- `skills/balance-check/SKILL.md` — переписан под реальные объекты
  (`BALANCE`, `DEPTH`, `ATK_COMPOUND`, `UPGRADES`) и под наш headless-харнесс.
- `hooks/validate-commit.sh` — вместо проверки JSON и формата TODO прогоняет
  174 теста, проверяет синтаксис `<script>` и стережёт равновесие треадмилла.
- `settings.json` — оставлены только нужные разрешения и один хук.

## Что сознательно не взято

49 агентов, 73 скилла, специалисты по Godot/Unity/Unreal, правила для
шейдеров, сети и нарратива, статуслайн, журнал агентов, церемония
session-state. Для игры в один HTML-файл это оверинжиниринг.
