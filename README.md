# ORE DEEP

Idle-игра про добычу золота и драгоценных камней. Полный рескин баланса
`com.tapnine.idleboxer` v1.18: все формулы, кривые и шансы — 1:1 из референса.
Единственное техническое отличие — слой редких камней от кирки.

## Структура

| Путь | Что это |
|---|---|
| `index.html` | Играбельный прототип core loop (один файл, открывается в любом браузере, прогресс в localStorage) |
| `docs/ORE_DEEP_GDD.docx` | Полный GDD с числами из байткода референса |
| `docs/ORE_DEEP_краткое_ТЗ.docx` | Краткое ТЗ для разработчиков |
| `tools/balance_sim.js` | Монте-Карло симуляция прогрессии игрока (`node tools/balance_sim.js`) |

## Что реализовано в прототипе

- Кривая породы: 4 якоря + `growthLerp` (GDD §2.2, §4)
- Энергия как HP, истощение = рестарт этапа (§3, §5)
- Экономика, привязанная к кривой сложности (доход/HP = const)
- Сумка находок: таблица редкостей, 14 якорей с интерполяцией (§6.3)
- Дроп деталей в 8 слотов снаряжения, продать/надеть (§6.2)
- Слой редких камней от кирки, вклад 10–20% дохода (§6bis)
- Гача геологов с pity-кривой (§7.2)
- Смена шахт с пулами камней, коллекции, боссы

Коэффициенты, помеченные в коде `CALIB`, соответствуют значениям «≈» в GDD
и калибруются плейтестами.

## Запуск

Открыть `index.html` в браузере. Всё.

## Сборка мобильного приложения (Capacitor)

```bash
npm install                 # capacitor core + cli + android
npm run build               # index.html -> www/
npx cap add android         # один раз: генерирует android/
npm run android             # sync + открыть в Android Studio
```

APK/AAB собирается из Android Studio (или `cd android && ./gradlew assembleRelease`).

### Слой интеграций (Platform)

В `index.html` объект `Platform` — единая точка для нативных SDK.
Web-стабы уже проложены по коду, при сборке подменяются плагинами:

| Метод | События/точки | Продакшен-плагин |
|---|---|---|
| `Platform.logEvent(name, params)` | boss_kill, mine_enter, set_complete, bag_upgrade, exhaust, speed_toggle, geo_hire | Firebase Analytics (`@capacitor-firebase/analytics`) |
| `Platform.showRewarded(cb)` | скорость ×2/×3 | AdMob (`@capacitor-community/admob`) |
| `Platform.buy(productId)` | паки кристаллов, no-ads (V5 роадмапа) | Play Billing / RevenueCat |

### Арт-пайплайн

`npm run art` — регенерирует пиксель-арт (`art/*.png`, затем base64 в
`index.html`). Вся графика собственная (генератор `tools/gen_pixel_art.py`),
лицензионно чистая для коммерческого использования.
