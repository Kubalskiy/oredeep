#!/usr/bin/env bash
# Создаёт release-keystore для Google Play (один раз на всё жизнь приложения).
# Потеряешь файл/пароли → больше не обновишь приложение в Play под тем же signing.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/android/oredeep-release.keystore"
PROPS="$ROOT/android/keystore.properties"

if [[ -f "$OUT" ]]; then
  echo "Уже есть: $OUT"
  echo "Не перезаписывай — это ключ продакшена."
  exit 1
fi

ALIAS="${KEY_ALIAS:-oredeep}"
echo "Создаю keystore → $OUT"
keytool -genkeypair -v \
  -keystore "$OUT" \
  -alias "$ALIAS" \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=ORE DEEP, OU=Mobile, O=OreDeep, L=City, ST=State, C=RU"

if [[ ! -f "$PROPS" ]]; then
  cat > "$PROPS" <<EOF
storeFile=oredeep-release.keystore
storePassword=ЗАПОЛНИ_ПАРОЛЬ_ИЗ_KEYTOOL
keyAlias=$ALIAS
keyPassword=ЗАПОЛНИ_ПАРОЛЬ_ИЗ_KEYTOOL
EOF
  echo "Шаблон: $PROPS — впиши пароли вручную."
fi

echo "Готово. Бэкапни $OUT + пароли в password manager (1Password и т.п.)."
echo "Дальше: npm run sync && npm run aab"
