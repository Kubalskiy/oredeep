# Google Play: сборка AAB для Mountain King

Capacitor Android. Витрина Play: **Mountain King**, пакет **`com.diggy.dwarf`**
(консоль уже Registered). Сайт разработчика в карточке: `https://loveplaygames.com/`.

`applicationId` в `android/app/build.gradle` и `appId` в `capacitor.config.json` должны
остаться `com.diggy.dwarf`. Java-namespace `com.oredeep.game` не равен пакету стора
и после релиза его можно не трогать. Версия (`versionCode` / `versionName`) — вровень
с `package.json`.

Ключи партнёров лежат в `android/app/src/main/res/values/sdk_keys.xml`
(Facebook, AppMetrica, GameAnalytics, AppsFlyer, AppLovin, AdMob, Amazon).
В манифесте — AdMob app id, Facebook app id/client token и AppLovin SDK key.
Нативные SDK (AppsFlyer, AppMetrica, GameAnalytics, Facebook, UMP, MAX и сетки, Billing)
подключены в `android/app`. Игра зовёт их через `DiggyNative`.

## Что уже сделано в репо

- [x] `npx cap add android` → папка `android/`
- [x] `versionCode 17` / `versionName 0.12.0`
- [x] `targetSdkVersion 36`
- [x] release-подпись через `android/keystore.properties` (пример рядом)
- [ ] Android Studio / SDK на машине
- [ ] release keystore создан и забэкаплен
- [ ] иконка/сплеш из `resources/` залиты в mipmap
- [x] privacy policy: `https://loveplaygames.com/games/android/privacy/en/`
- [x] store listing en-US: Mountain King short/full + icon + feature + **8/8** phone screenshots
- [x] category Role Playing · tags Adventure / Casual / Idle role-playing / Incremental / Role-playing
- [x] App content «Need attention» empty (declarations filled; pending review bundle)
- [x] AAB versionCode **18** / 0.12.1 (store-ready EN package · Sep 30, 2026)
- [ ] production: страны soft-launch → confirm release → Send for review

## 0. Один раз: тулчейн

1. Поставь [Android Studio](https://developer.android.com/studio) (SDK 35 + build-tools).
2. Открой проект: `npm run android` (sync + Studio).
3. В Studio: SDK Manager → Android 15 (API 35), Platform Tools.

Без Studio CLI-сборка не взлетит — сейчас на машине SDK не найден.

## 1. Keystore (один на жизнь приложения)

В Console → Android developer verification для `com.diggy.dwarf` уже Verified три
сертификата. Локальный `android/oredeep-release.keystore` (alias `oredeep`,
SHA-256 `54:C3:A0:EB:…:6B:43`) **в этот список не входит**. AAB, подписанный им,
Play для этого пакета не примет. Нужен keystore, чей SHA-256 совпадает с одним
из Verified в консоли (или upload key, который выдаст владелец аккаунта).
Новый keystore не генерировать.

```bash
chmod +x scripts/make_release_keystore.sh
./scripts/make_release_keystore.sh
# затем заполни пароли в android/keystore.properties
```

Если keystore уже создан агентом/скриптом: пароль лежит в **`android/KEYSTORE_BACKUP.txt`**
(в `.gitignore`). Скопируй в 1Password и удали файл с диска.

Файлы **не в git**: `*.keystore`, `keystore.properties`, `KEYSTORE_BACKUP.txt`.
Потеря = нельзя обновить апп в Play.

Альтернатива: **Play App Signing** — Google хранит app key, ты грузишь upload-key
(рекомендуется при создании приложения в Console).

## 2. Собрать web → sync → AAB

```bash
npm test                 # 0 FAIL
npm run sync             # www + cap sync
npm run aab              # ./gradlew bundleRelease
```

Артефакт:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Проверка подписи:

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

## 3. Иконка и сплеш

Сейчас в проекте дефолтные Capacitor-иконки. Исходники: `resources/icon.png`, `resources/splash.png`.

Вариант A — вручную в Android Studio (Image Asset).  
Вариант B:

```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --android
```

## 4. Play Console (чеклист заливки)

Тексты и ассеты витрины — [`STORE_LISTING_RU.md`](./STORE_LISTING_RU.md) (снимок live en-US).
Файлы: `assets/store/icon-512.png`, `feature-graphic-en-1024x500.png`, `screenshots/01`…`08`.

1. Приложение в Console: **Mountain King** / **`com.diggy.dwarf`** (listing **Ready to send for review**).
2. Пакет не менять. Сайт: `https://loveplaygames.com/` · контакт витрины: `privacy@loveplaygames.com`.
3. AAB: `versionCode 17` / `0.12.0` → Internal / Production по чеклисту релиза.
4. Обязательные формы (заполнены, в pending change bundle до Send):
   - Privacy policy URL
   - Data safety · Content rating · Target audience · Ads · Health
   - Store listing: short/full EN, 8 phone shots, feature 1024×500, icon 512×512
5. Страны soft-launch (KZ/PH) / цена free (+ IAP через Billing).
6. Send for review — только когда dashboard green (не раньше).

## 5. Что ещё не подключено (не блокер soft-launch)

| Фича | Сейчас | Для стора |
|------|--------|-----------|
| AdMob / rewarded | `Platform.showRewarded` stub | `@capacitor-community/admob` |
| IAP | `Platform.buy` stub | Google Play Billing plugin |
| Analytics | `Platform.logEvent` stub | Firebase / Amplitude |
| Push | нет | FCM + `google-services.json` |

Soft launch без рекламы/IAP ок. Перед монетизацией — плагины + политики.

## 6. Версии при каждом релизе

1. `package.json` → bump `version`
2. `android/app/build.gradle` → `versionName` то же, **`versionCode` +1** (только вверх)
3. `npm run sync && npm run aab`
4. Upload AAB → release notes

## 7. Типичные отказы Play

- targetSdk слишком старый
- нет privacy policy при доступе к данным / рекламе
- дефолтная иконка / пустые скрины
- «Incomplete store listing»
- подписан debug-ключом (нет `keystore.properties` → unsigned/debug)

## 8. Level Up / Play Games (Console, руками)

Код готов: `DiggyPlayGames`, `PLAY_*` в `js/balance.js`, cloud conflict UI, local notify.

1. Play Console → Play Games Services → создать игру, поставить реальный `play_games_project_id` в `sdk_keys.xml`.
2. Создать 12 achievements + 6 events + 2 single-use rewards + 1 weekly — IDs = значения `PLAY_*.id`.
3. Sidekick → Enable for app bundle.
4. Pre-launch report на latest Internal AAB.
5. **Production Send for review — только после явного «ок».** Не жать Send вслепую.

## 9. Gacha odds (store + in-game)

In-game: Bag / Chest modal → **Drop odds** (current vs next bag level).
Store listing (Data safety / About): bag drops use rarity curves by bag level; Auto-sell never spends paid currency; upgrades spend gold only. Full curves live in `BALANCE` / bag level tables.

## 10. Crash / Vitals checklist

- Native debug symbols: `debugSymbolLevel 'FULL'` in release.
- Keep ANR under control: no blocking JS on WebView thread for cloud I/O (callbacks async).
- After each Internal: Android Vitals → crash-free ≥ 99%, ANR rate green.
- Log `[analytics]` + `Platform.logEvent` for ad/billing failures (`ad_fail`, `not_ready`).

## Быстрый TL;DR

```bash
# 1) тулчейн
# установи Android Studio

# 2) ключ
./scripts/make_release_keystore.sh   # + пароли в keystore.properties

# 3) билд
npm test && npm run sync && npm run aab

# 4) файл
open android/app/build/outputs/bundle/release/
# → app-release.aab в Play Console → Internal testing
# Production Send — только после ок
```
