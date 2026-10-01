# Mountain King — 24 пункта (Level Up + продукт)

Статус кода на ветке после Level Up wiring. Легенда: ✅ в коде/доках · ◐ Console/ручной шаг · ⬜ снаружи (видео).

## P0 — Level Up Rewards

| # | Пункт | Статус |
|---|--------|--------|
| 1 | Play Games Services v2 auth на старте | ✅ `DiggyPlayGames` + bridge + `onPlayGamesAuth` |
| 2 | ≥2 single-use Play Rewards (скин/кирка/борода) | ✅ `PLAY_REWARDS` + `grantPlayReward` |
| 3 | Каждый reward доступен всем через Play ≥1× | ✅ код + Console offer setup `◐` |
| 4 | Meaningful items only | ✅ pick skin + beard vanity |
| 5 | Redeem hook → инвентарь + toast | ✅ `__diggyPlayReward` → `grantPlayReward` |

## P1 — Level Up rate card

| # | Пункт | Статус |
|---|--------|--------|
| 6 | ≥10 achievements (4 в первый час) | ✅ 12 ачивок + unlock hooks |
| 7 | Game Stats ≥5 repetitive + 1 progression | ✅ `PLAY_EVENTS` + `trackPlayEvent` |
| 8 | Sidekick | ◐ вкл. в Play Console (AAB) |
| 9 | Cloud save + conflict UI | ✅ Snapshots + `showCloudConflict` |
| 10 | Repeatable reward к 1 Mar 2027 | ✅ `weekly_gold` в каталоге |

## P2 — Кросс-экран

| # | Пункт | Статус |
|---|--------|--------|
| 11 | Large screen insets / resize | ✅ safe-area + configChanges |
| 12 | Play Games on PC distribution | ✅ optional features, no required HW |
| 13 | Controller / keyboard playable | ✅ Space/Enter dig, 1–5 tabs, B/S/D |
| 14 | Form factors mobile/fold/tablet | ✅ resizeableActivity + docs |

## P3 — Продукт / лайв

| # | Пункт | Статус |
|---|--------|--------|
| 15 | Production Send for review | ◐ draft ready — **не Send без ок** |
| 16 | Local notifications (bag/bonus) | ✅ `DiggyNotify` + schedule on bag/bonus |
| 17 | Daily shared vein + share card | ✅ daily seed label + `shareDailyVein` |
| 18 | A/B onboarding + ASO 15s video | ⬜ storyboard `docs/ASO_VIDEO_15S.md` |
| 19 | Native debug symbols in AAB | ✅ `debugSymbolLevel FULL` |
| 20 | EN copy polish pass | ✅ high-traffic strings (ongoing) |

## P4 — Качество

| # | Пункт | Статус |
|---|--------|--------|
| 21 | Crash-free / Vitals | ✅ checklist in `STORE_ANDROID.md` §10 |
| 22 | Pre-launch report on latest AAB | ◐ run in Console on Internal |
| 23 | Repo hygiene (store helpers) | ✅ `.gitignore` for `assets/store/_*.js` |
| 24 | Gacha odds documented in-game/store | ✅ Drop odds panel + STORE §9 |

## Console checklist (руками)

1. Play Console → Play Games Services → создать игру, скопировать IDs ачивок в `PLAY_ACHIEVEMENTS` / `sdk_keys.xml` project id.
2. Rewards → 2 single-use + 1 weekly consumable, map to `PLAY_REWARDS.*.id`.
3. Sidekick → Enable for app bundle.
4. Pre-launch report → Run on latest internal.
5. Production → Create release **только после ок на Send**.
