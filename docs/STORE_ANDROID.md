# Google Play: сборка AAB для ORE DEEP

Capacitor Android. Package: `com.oredeep.game`. Версия в `android/app/build.gradle`
(`versionCode` / `versionName`) — держи вровень с `package.json`.

## Что уже сделано в репо

- [x] `npx cap add android` → папка `android/`
- [x] `versionCode 12` / `versionName 0.12.0`
- [x] `targetSdkVersion 35` (до **31.08.2026** для новых/апдейтов нужен **36**)
- [x] release-подпись через `android/keystore.properties` (пример рядом)
- [ ] Android Studio / SDK на машине
- [ ] release keystore создан и забэкаплен
- [ ] иконка/сплеш из `resources/` залиты в mipmap
- [ ] privacy policy URL + контентный рейтинг в Play Console
- [ ] AAB загружен в internal testing

## 0. Один раз: тулчейн

1. Поставь [Android Studio](https://developer.android.com/studio) (SDK 35 + build-tools).
2. Открой проект: `npm run android` (sync + Studio).
3. В Studio: SDK Manager → Android 15 (API 35), Platform Tools.

Без Studio CLI-сборка не взлетит — сейчас на машине SDK не найден.

## 1. Keystore (один на жизнь приложения)

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

Тексты, feature graphic и план скринов — [`STORE_LISTING_RU.md`](./STORE_LISTING_RU.md).
Файлы: `assets/store/icon-512.png`, `assets/store/feature-graphic-1024x500.png`.

1. [play.google.com/console](https://play.google.com/console) → создать приложение **ORE DEEP**.
2. Пакет: **`com.oredeep.game`** (уже в `capacitor.config.json` — не меняй после релиза).
3. **Internal testing** → создать релиз → загрузить `.aab`.
4. Обязательные формы:
   - Privacy policy (URL)
   - Data safety
   - Content rating (IARC)
   - Target audience
   - Store listing: short/full description, screenshots (телефон), feature graphic 1024×500, иконка 512×512
5. Страны / цена (бесплатно + IAP позже через Billing).
6. Когда ок на internal → closed/open production.

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
```
