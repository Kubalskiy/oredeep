# Google Play — Mountain King store listing

**Live on Console (en-US)** · Package: `com.diggy.dwarf` · App name: **Mountain King**  
Developer: Karate Gorilla · Site: `https://loveplaygames.com/`  
Privacy: `https://loveplaygames.com/games/android/privacy/en/`  
Contact: `privacy@loveplaygames.com`

Assets in `assets/store/`:
- `icon-512.png` — 512×512
- `feature-graphic-en-1024x500.png` — feature graphic (live combat crop)
- `screenshots/01-mine.png` … `08-hero.png` — phone 1080×1920 (9∶16), **8/8 on listing**

Reshoot: `node tools/capture_store_shots.js` → `python3 tools/polish_store_shots.py`.

Listing status (Sep 30, 2026): **Ready to send for review** (graphics + copy saved).

---

## Short description (en-US, live)

```
Idle dwarf miner. Dig veins, upgrade your pick, and drink ale.
```
(62 / 80)

---

## Full description (en-US, live)

```
Mountain King is an idle mining RPG. Send your dwarf into the deep: crack ore veins, haul gold and chests, and upgrade your pickaxe, gear, pets, and beards.

Open the tavern for ale and skills, visit the market for packs, and dig deeper every day. Offline progress keeps the haul coming while you are away.

Simple to tap, deep to master. Grab your pick and dig.
```

---

## Category & tags (live)

| Field | Value |
|------|----------|
| Category | Game → **Role Playing** |
| Tags | Adventure, Casual, Idle role-playing, Incremental, Role-playing |
| Target age | 18 and older (Console) |
| Content rating | Questionnaire submitted (pending review bundle) |

---

## Phone screenshots (live · 8/8)

| # | File | Caption / beat |
|---|------|----------------|
| 1 | `01-mine.png` | DIG THE VEIN — boss vein, myth gear |
| 2 | `02-combat.png` | MYTHIC LOADOUT — combat frame |
| 3 | `03-mines.png` | SPECIAL MINES — mines list |
| 4 | `04-skills.png` | FOREVER SKILLS — skills |
| 5 | `05-tavern.png` | THE TAVERN — Borin |
| 6 | `06-pvp.png` | ARENA DIG — PvP (opp faces player) |
| 7 | `07-market.png` | DAILY MARKET — shop |
| 8 | `08-hero.png` | YOUR DWARF — hero |

Feature graphic: `feature-graphic-en-1024x500.png` (1024×500).  
Promo video: none yet (optional CVR lift).

---

## RU draft (optional locale later)

### Short (≤80)

```
Idle RPG: дворф копает жилы, качает кирку и пьёт эль у Борина.
```

### Full

```
Mountain King — idle / incremental RPG про дворфа-рудокопа.

Бей жилу, собирай золото и сундуки, качай кирку, шмот, питомцев и бороды. Оффлайн копит добычу, пока тебя нет. В таверне — эль и навыки, на рынке — паки, в штольнях — особые забеги.

Просто тапнуть — глубоко освоить. Бери кирку и копай.
```

---

## Data safety (when Ads / Billing live)

| Question | Answer |
|----------|--------|
| Collects data? | Yes if AdMob / Analytics / Billing on — declare Ads ID, purchases, diagnostics |
| Shared with third parties? | Ad / attribution SDKs as wired in `sdk_keys.xml` |
| Encryption in transit | Yes (HTTPS) |
| Deletion | Uninstall / clear app data; contact privacy@ for account-linked asks |

Stub-only local progress: still declare accurately once MAX/AdMob ships in the store build.

---

## Privacy policy

Public URL (live): `https://loveplaygames.com/games/android/privacy/en/`  
Contact: `privacy@loveplaygames.com`

---

## Release notes (v0.12.4 / versionCode 21)

```
Mountain King 0.12.4
• Brand rename to Mountain King
• Magma-fist icon + mining screenshots
• Analytics after UMP consent; rewarded + banner only
• Slim AAB ~14MB
```

Internal testing: **0.12.4 (21)** available to testers (published Sep 30, 2026).
