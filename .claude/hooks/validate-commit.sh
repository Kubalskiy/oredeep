#!/bin/bash
# Claude Code PreToolUse hook (Bash): проверка перед `git commit`.
# stdin: { "tool_name":"Bash", "tool_input": { "command": "git commit -m ..." } }
# exit 0 = разрешить, exit 2 = заблокировать (stderr увидит Claude).
#
# Адаптировано из Claude-Code-Game-Studios (MIT, (c) 2026 Donchitos)
# под ORE DEEP: главное отличие — реально прогоняем тесты, а не только линтим.

set -u

# --- вытащить команду (jq, иначе grep) ---
INPUT="$(cat)"
if command -v jq >/dev/null 2>&1; then
    COMMAND="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)"
else
    COMMAND="$(printf '%s' "$INPUT" | grep -oE '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*:[[:space:]]*"//; s/"$//')"
fi

# не git commit — выходим молча
echo "$COMMAND" | grep -qE '(^|[[:space:]])git[[:space:]]+commit' || exit 0

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$REPO_ROOT" || exit 0

STAGED="$(git diff --cached --name-only 2>/dev/null)"
[ -z "$STAGED" ] && exit 0

WARNINGS=""
BLOCKERS=""

# --- 1. Тесты обязаны быть зелёными, если тронут код игры или тесты ---
if echo "$STAGED" | grep -qE '^(index\.html|tools/)'; then
    if command -v node >/dev/null 2>&1 && [ -f tools/run_tests.js ]; then
        TEST_OUT="$(node tools/run_tests.js 2>&1)"
        # ВАЖНО: якорим на начало строки — иначе строка итога «0 FAIL» блокирует зелёный коммит
        if echo "$TEST_OUT" | grep -qE '^[[:space:]]+FAIL'; then
            FAILED="$(echo "$TEST_OUT" | grep -E '^[[:space:]]+FAIL' | head -5)"
            SUMMARY="$(echo "$TEST_OUT" | grep 'ИТОГ' | tail -1)"
            BLOCKERS="$BLOCKERS
ТЕСТЫ КРАСНЫЕ — коммит заблокирован.
$SUMMARY
$FAILED"
        fi
        if [ -f tools/audit_buttons.js ]; then
            AUDIT_OUT="$(node tools/audit_buttons.js 2>&1)"
            if echo "$AUDIT_OUT" | grep -qE '^[[:space:]]+FAIL'; then
                BAD="$(echo "$AUDIT_OUT" | grep -E '^[[:space:]]+FAIL' | head -5)"
                BLOCKERS="$BLOCKERS
АУДИТ КНОПОК КРАСНЫЙ — коммит заблокирован.
$BAD"
            fi
        fi
    else
        WARNINGS="$WARNINGS
node или tools/run_tests.js недоступны — тесты не прогнаны."
    fi
fi

# --- 2. Синтаксис игрового скрипта ---
if echo "$STAGED" | grep -q '^index\.html$' && command -v node >/dev/null 2>&1; then
    if command -v python3 >/dev/null 2>&1; then
        python3 - <<'PY' >/tmp/_oredeep_game.js 2>/dev/null
import re,sys
h=open('index.html',encoding='utf-8').read()
m=re.search(r'<script>(.*?)</script>',h,re.S)
sys.stdout.write(m.group(1) if m else '')
PY
        if [ -s /tmp/_oredeep_game.js ] && ! node --check /tmp/_oredeep_game.js 2>/dev/null; then
            BLOCKERS="$BLOCKERS
index.html: <script> не парсится (node --check упал)."
        fi
        rm -f /tmp/_oredeep_game.js
    fi
fi

# --- 3. Балансовые инварианты: равновесие треадмилла ---
if echo "$STAGED" | grep -q '^index\.html$'; then
    if ! grep -q 'Math.pow(ATK_COMPOUND, atkLevelsPerBlock())' index.html; then
        WARNINGS="$WARNINGS
БАЛАНС: escPerBlock() больше не выводится как ATK_COMPOUND^LPB.
  Это единственное устойчивое равновесие треадмилла — сложность станет
  либо стеной, либо ваншотом. Прогони: node tools/calibrate_atk.js"
    fi
    if ! grep -q 'gearComp' index.html; then
        WARNINGS="$WARNINGS
БАЛАНС: пропал gearComp — линейный рост шмота (1+idx/60) больше не компенсирован."
    fi
fi

# --- 4. Магические числа: калибровки должны быть помечены ---
CHANGED_HTML="$(git diff --cached -U0 -- index.html 2>/dev/null | grep -E '^\+' | grep -vE '^\+\+\+')"
if [ -n "$CHANGED_HTML" ]; then
    SUSPECT="$(printf '%s' "$CHANGED_HTML" | grep -nE '(escPerBlock|hpMul|rampBlocks|escStart|ATK_COMPOUND)[[:space:]]*[:=][[:space:]]*[0-9]' | grep -v 'CALIB' | head -3)"
    if [ -n "$SUSPECT" ]; then
        WARNINGS="$WARNINGS
БАЛАНС: правишь константы сложности без пометки CALIB и без прогона калибратора:
$SUSPECT"
    fi
fi

# --- 5. Отладочный мусор ---
if printf '%s' "$CHANGED_HTML" | grep -qE 'console\.log|debugger'; then
    WARNINGS="$WARNINGS
В index.html добавлен console.log/debugger."
fi

# --- вывод ---
if [ -n "$BLOCKERS" ]; then
    printf '%b\n' "$BLOCKERS" >&2
    [ -n "$WARNINGS" ] && printf '%b\n' "$WARNINGS" >&2
    exit 2
fi

if [ -n "$WARNINGS" ]; then
    printf 'Предупреждения (коммит разрешён):%b\n' "$WARNINGS" >&2
fi

exit 0
