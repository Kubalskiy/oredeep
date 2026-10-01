"use strict";
/* Auto-split from index.html — edit here; keep load order: balance → platform → game → ui_screens */

const BALANCE = {
  idle:{ base:100000, growth:2.5, damp:0.65, capSec:7200, minSec:60 },
  combat:{ maxHitsPerFrame:250, baseAPS:1.0, maxAPS:4.5, comboInner:0.1, maxCombo:4,
           bossEvery:20, critMul:2.2, hitChance:1.0 },
  venueStride:50, startProtein:200, shardRollCost:10, autoQueueMax:15,
  /* Drop chances by bag level 1..50 (sum ≈100). Source: GDD spreadsheet. */
  bagWeights:[
    [100,0,0,0,0,0,0,0],
    [99,1,0,0,0,0,0,0],
    [97,3,0,0,0,0,0,0],
    [95,4.9,0.1,0,0,0,0,0],
    [90,9.8,0.2,0,0,0,0,0],
    [86,13.62,0.36,0.02,0,0,0,0],
    [82,17.44,0.52,0.04,0,0,0,0],
    [78,21.26,0.68,0.06,0,0,0,0],
    [74,25.08,0.84,0.08,0,0,0,0],
    [70,28.9,1,0.1,0,0,0,0],
    [66,32.4,1.4,0.18,0.02,0,0,0],
    [62,35.9,1.8,0.26,0.04,0,0,0],
    [58,39.4,2.2,0.34,0.06,0,0,0],
    [54,42.9,2.6,0.42,0.08,0,0,0],
    [50,46.4,3,0.5,0.1,0,0,0],
    [46,49.8,3.4,0.6,0.18,0.02,0,0],
    [42,53.2,3.8,0.7,0.26,0.04,0,0],
    [38,56.6,4.2,0.8,0.34,0.06,0,0],
    [34,60,4.6,0.9,0.42,0.08,0,0],
    [30,63.4,5,1,0.5,0.1,0,0],
    [26,65.8,6,1.4,0.6,0.18,0.02,0],
    [22,68.2,7,1.8,0.7,0.26,0.04,0],
    [18,70.6,8,2.2,0.8,0.34,0.06,0],
    [14,73,9,2.6,0.9,0.42,0.08,0],
    [10,75.4,10,3,1,0.5,0.1,0],
    [8,74.4,12,3.4,1.4,0.6,0.18,0.02],
    [6,73.4,14,3.8,1.8,0.7,0.26,0.04],
    [4,72.4,16,4.2,2.2,0.8,0.34,0.06],
    [2,71.4,18,4.6,2.6,0.9,0.42,0.08],
    [0,70.4,20,5,3,1,0.5,0.1],
    [0,66.42,22,6,3.4,1.4,0.6,0.18],
    [0,62.44,24,7,3.8,1.8,0.7,0.26],
    [0,58.46,26,8,4.2,2.2,0.8,0.34],
    [0,54.48,28,9,4.6,2.6,0.9,0.42],
    [0,50.5,30,10,5,3,1,0.5],
    [0,45.6,31,12,6,3.4,1.4,0.6],
    [0,40.7,32,14,7,3.8,1.8,0.7],
    [0,35.8,33,16,8,4.2,2.2,0.8],
    [0,30.9,34,18,9,4.6,2.6,0.9],
    [0,26,35,20,10,5,3,1],
    [0,21.2,34,22,12,6,3.4,1.4],
    [0,16.4,33,24,14,7,3.8,1.8],
    [0,11.6,32,26,16,8,4.2,2.2],
    [0,6.8,31,28,18,9,4.6,2.6],
    [0,2,30,30,20,10,5,3],
    [0,1.6,27,28,22,12,6,3.4],
    [0,1.2,24,26,24,14,7,3.8],
    [0,0.8,21,24,26,16,8,4.2],
    [0,0.4,18,22,28,18,9,4.6],
    [0,0,15,20,30,20,10,5]
  ],
  avatars:[
    {rar:"COMMON",gems:50,skill:1,pet:1},{rar:"RARE",gems:250,skill:2,pet:2},
    {rar:"EPIC",gems:600,skill:2,pet:2},{rar:"LEGENDARY",gems:1800,skill:3,pet:3}],
  gymPerks:["WORKOUT_SPEED","IDLE_CASH","HP_GEAR_BOOST","ATK_GEAR_BOOST","DEF_GEAR_BOOST","COMBO_STAT"],
  gymTiers:["Slate","Bronze","Silver","Gold","Amethyst","Amber"],
  chestCosts:{ rare:100, epic:300, legendary:700 },
  petPower:[1,3,9,27],
  workoutPaths:["energy","atk","tough","mining","crit","stone","luck"],
  workoutStepPct:[15,12,10,8,6,10,5],

  dailyQuests:[
    {id:"break",ic:"⛏",n:"Take it out. 30 vein",need:30,tok:10,
      lore:"Mountain Feeds those who knock without fatigue."},
    {id:"find",ic:"💎",n:"Take it out. 5 stones rock",need:5,tok:10,
      lore:"gems in vein — Sign that Mountain Hey, hey, hey, hey, hey."},
    {id:"bag",ic:"🎒",n:"Open it. 15 bag",need:15,tok:10,
      lore:"trader Nori’s already warming the curved scales."},
    {id:"drink",ic:"🍺",n:"Swallow beer at the Borina ×5",need:5,tok:10,
      lore:"Burning his throat, saving his glasses. feastEnergy too."},
    {id:"feast",ic:"💪",n:"Finish it. 1 feast",need:1,tok:10,
      lore:"Respect for the hall grows at the table, not at the speech."},
    {id:"pvp",ic:"⚔",n:"Winning 2 In the arena",need:2,tok:10,
      lore:"Only winners drink in the arena."}],
  dailyTrack:[[25,"🗝 key ×1"],[50,"🥚 egg ×3"],[100,"💎 crystals ×50"],[150,"🪮 comb ×2"]],
  dailyAdTok:30,
  noAdsPrice:"49.99",
  shardYield:[0,0,5,15,40,100,250,600],
  fuseCost:(t)=>Math.round(15*Math.pow(3,t)),

  run:{ len:1000, wallMsg:"The City of Porgon" },
  prestige:{ minStage:300, div:300, powPerLevel:2.5, echoFrac:0.05 },

  bags:{ starter:20, perVein:1, perBoss:3, autoSec:3, autoOpenPerTick:1,
    offlineSecPerBag:9, cap:9999, maxPerTick:400,
    /* Seconds for upgrade L → L+1 (index = L, 1..49). Source: GDD spreadsheet. */
    upgradeSecFrom:[0,
      60,300,600,1200,1800,2700,3600,7200,14400,
      28800,43200,50400,57600,64800,72000,79200,86400,86400,86400,
      86400,86400,86400,86400,86400,86400,86400,86400,86400,86400,
      86400,86400,86400,86400,86400,86400,86400,86400,86400,86400,
      86400,86400,86400,86400,86400,86400,86400,86400,86400,86400],
    skipSecPerGem:1800,
    adSkipSec:3600,
    autoUnlockSlots:8, autoUnlockRares:3 },

  unlocks:{
    auto:8,
    pets:18,
    beards:28,
    daily:40,
    mines:50,
    skills:65,
    artifacts:90,
    pvp:120,
    social:160
  },

  special:{
    start:5, pool:5, attrMax:10, attrPct:1.2, attrPctCap:12,
    veinsPerLv:35, maxLv:40, ptsBase:5, ptsPerInt:1,

    tagSlots:9, tagCost:1, untagCost:2, trainMult:0.5, trainCap:15
  },

  perks:{ everyLv:3, pct:2, pctCap:16, maxOwned:12,
    buyGoldBase:8000, buyGoldG:1.55, buyPtsBase:10, buyPtsG:1.35 },

  traits:{ maxOwned:99,
    buyGoldBase:5000, buyGoldG:1.5, buyPtsBase:6, buyPtsG:1.3 },

  gacha:{ eggDropPct:2, combDropPct:2, eggBossPct:6, combBossPct:6,
    eggDailyReward:2, combDailyReward:1 },

  science:{ goldRate:0.3, consensusWeight:2.0, minRel:0.35, rewardShards:3, rewardProtein:5 },

  merge:{ petCost:3, geoLvPct:12, ascendLv:8, ascendGems:1200, ascendPct:100 },

  petDot:{ dpsFrac:[0.06,0.14,0.30,0.60,1.10], defCut:[0.05,0.10,0.18,0.30,0.45], spdCut:[0.04,0.08,0.14,0.24,0.38] },
  petCraft:{ needLegendaries:3, gems:1000 },

  skillChests:[
    { id:"wood",  n:"Pretty lair.",  cards:1, minR:0, keyCost:1, gemCost:0   },
    { id:"iron",  n:"Occurator",cards:3, minR:1, keyCost:0, gemCost:150 },
    { id:"mith",  n:"Mifril lair",cards:5, minR:2, keyCost:0, gemCost:600 }
  ],
  skillCardProtein:[0,20,45,80,130,200,300,440,620,850],
  dungeonSets:[
    {id:"berserk", n:"Fury dig",  frags:["Titty","The Rock","The Riv","Anger"],       bonus:"+50% ATK, +20% CRIT"},
    {id:"greed",   n:"Greedy Nedra",  frags:["Slipper","Weights","Stamp","Bag"],   bonus:"×2 Greed (golden for the vein)"},
    {id:"guardian",n:"Mountain Apple",     frags:["Shield","Armour","The root","Print"],    bonus:"+80% Energy"},
    {id:"lucky",   n:"The Starlor’s Fart", frags:["Clever.","Stuff","A coin","Comet"],bonus:"+25% Good luck, ×1.5 Find"},
    {id:"mythic",  n:"The Ancestor’s Indignity",frags:["A hammer","Mech.","Coal","Spark"],   bonus:"+40% Equipment"}
  ],
  gearRarityMul:[1,2.2,4.8,10,22,48,110,250],
  gearStat:{
    rarityExp:0.38, stageDiv:120,
    overflowToMult:0.6, overflowFrac:0.4, maxOverflowMult:50,
    overflowMultOn:{ spd:false },
    overflowRoute:{ crit:"atk", luck:"stone", mining:"atk", spd:"energy", stamina:"regen" },
    routeScale:{ atk:0.12, stone:1.5, energy:6, regen:0.4 }
  },
  skillCosts:[1,2,3,4,6,8,11,15,20,26,34,44,57,75],
  skillUpMul:0.7, skillRollW:[0.56,0.27,0.12,0.05],
  geo:{ power:[1,3,9,27], levels:15,
    thresholds:[100,175,275,400,550,750,1000,1300,1650,2100,2650,3350,4250,5350,7000],

    pityX:[0,50,100,180,400],
    pityW:[[85,15,0,0],[72,26,2,0],[55,32,11,2],[42,34,16,8],[18,24,38,20]] },
  wheel:{ cost:[30,50,70,100,140,190,250,320,400,490,590,700,820], centerMul:1500 },

  workouts:{
    paths:7, step:50, weeklyCapMin:10080,
    proteinPerHour:5, proteinCapH:8,
    drinkCost:5, drinkPts:5, drinkCdSec:1.2,

    mug:[{mul:1},{mul:2,gems:40},{mul:5,gems:120},{mul:10,gems:350},{mul:20,gems:900}],
    costBase:30, costPerLv:15, timerSec:240, skipGems:25,
    maxLv:50
  },
  pvpDayLimit:10, pvpCandidates:5,
  pvp:{ raceSec:180,
    brawl:{ hitMs:380, hpBase:100, hpScale:0.32, dmgScale:0.0625, maxRounds:40 },
    thresholds:[100,150,200,250,300,350,400,450,500,1000],
        rewards:[0,200,500,1000,2000,3500,5000,7500,10000,12500],
        names:["ROOKIE","BRONZE","SILVER","GOLD","PLATINUM","DIAMOND","CHAMP I","CHAMP II","CHAMP III","DEEP LORD"] },

  pvpBots:[
    {id:"slag",  ic:"🪓", n:"Slag Beardless", tag:"Newcomer",  mul:0.72, grit:0.15, fluff:"He digs fast, he gets tired early."},
    {id:"borin", ic:"📐", n:"Borin the Counter",   tag:"calculation",   mul:0.95, grit:0.55, fluff:"No surprises, steady pace."},
    {id:"grom",  ic:"🦷", n:"Grom Irontooth",  tag:"The aggressor", mul:1.08, grit:0.30, fluff:"Going forward, breaking supports"},
    {id:"mira",  ic:"✦", n:"Mira Rune",     tag:"Technical",  mul:1.22, grit:0.70, fluff:"rarely misses vein"},
    {id:"durin", ic:"⛰", n:"Durin Deep", tag:"Patriarch", mul:1.48, grit:0.85, fluff:"vein Remembers his name."}
  ],

  shopDaily:{
    offers:{ ic:"🎁", title:"A gift from the trench", sub:"gold and bag",
      free:{ goldMul:8, bags:1 }, ad:{ goldMul:20, bags:2, gems:5 } },
    art:{ ic:"💎", title:"Collection Shard", sub:"accidental artifacts",
      free:{ stickers:1 }, ad:{ stickers:2, gems:15 } },
    barrels:{ ic:"🛢", title:"The Generousness of the Lail", sub:"key and beer",
      free:{ chestKeys:1 }, ad:{ chestKeys:1, protein:40 } },
    gems:{ ic:"✨", title:"Small gems", sub:"No purchase",
      free:{ gems:5 }, ad:{ gems:20 } },
    a:{ ic:"🥚", title:"egg + comb", sub:"gacha resources",
      free:{ eggs:1, combs:1 }, ad:{ eggs:1, combs:1 } },
    b:{ ic:"🍺", title:"beer + bag", sub:"Training and lute",
      free:{ protein:40, bags:1 }, ad:{ protein:40, bags:1 } }
  },
  shopFreeN:6,

  bonus:{
    fib:[1,1,2,3,5,8,13],
    timerUnitSec:3600,
    goldVeinMul:3,
    bags:1
  },

  growth:{
    cacTargetCents:150, ltvTargetCents:600, paybackDay:3,
    ads:{ dailyCap:30, revCents:2 },
    starterPack:{ price:4.99, cents:499, gems:600, gold:50000, bags:5, loot2xMin:180 },
    referral:{
      welcomeGems:25, welcomeProtein:30, coopBoostPct:15, coopBoostMin:120, inviterCap:50,
      milestones:[{n:3,gems:50},{n:10,gems:150},{n:25,gems:400}]
    },
    waitlist:{ bonusGems:100, eggs:3, combs:3, loot2xMin:1440 }
  },

  /* Rewarded-Advertisement: → day cap (Total ceiling growth.ads.dailyCap) */
  ads:{
    dailyCap:30,
    collapseRecoverPct:0.72,
    exhaustEnergyPct:0.48,
    autoTurboMin:10,
    autoTurboSec:2,
    autoTurboPerTick:2,
    veinBurst:2,
    veinBurstCdSec:300,
    slots:{
      offline_x2:{cap:4}, bonus_x2:{cap:4}, loot2x:{cap:5}, bag_skip:{cap:6},
      daily_tok:{cap:3}, event_key:{cap:4}, speed:{cap:10}, shop_free:{cap:12},
      exhaust_refill:{cap:5}, collapse_recover:{cap:3}, vein_double:{cap:8},
      durab_free:{cap:4}, pvp_reroll:{cap:2}, workout_skip:{cap:2}, wheel_free:{cap:1},
      pet_roll:{cap:2}, beard_roll:{cap:2}, auto_turbo:{cap:2},
      mine_raid_ready:{cap:5}, daily_boost:{cap:1}
    }
  },

  events:{
    hpMul:3,
    rockfall:{ maxLvl:10, total:50000, first:200, currency:"shard", res:"shards", ic:"💠", waveSize:5 },
    lavaVein:{ maxLvl:100, total:1500000, first:200, currency:"beer", res:"protein", ic:"🍺", waveSize:3 },
    prospectorFair:{ maxLvl:5, total:2500, first:200, currency:"crystals", res:"gems", ic:"💎", waveSize:1 },
    crystalCave:{ maxLvl:10, total:0, first:0, currency:"crystals", res:"gems", ic:"💎", flat:10, waveSize:5 },
    critterDen:{ maxLvl:10, total:8000, first:100, currency:"gold", res:"gold", ic:"🪙", mult:50, waveSize:4 } },
  keyMax:2, keyRefillSec:Math.round(6*3600),
  eventKeyGem:50,

  mineRaid:{
    hpMul:5,
    timerUnitSec:1800,
    fib:[1,1,2,3,5,8,13],
    raids:[
      {id:0, ic:"🎒", n:"bag",     res:"bags",     base:3,  g:1.12, label:"🎒"},
      {id:1, ic:"💎", n:"Gems", res:"gems",     base:20, g:1.10, label:"💎"},
      {id:2, ic:"🥚", n:"egg",      res:"eggs",     base:1,  g:1.08, label:"🥚"},
      {id:3, ic:"🪮", n:"comb",  res:"combs",    base:1,  g:1.08, label:"🪮"},
      {id:4, ic:"🍺", n:"Beer",      res:"protein",  base:50, g:1.10, label:"🍺"}
    ]
  },

  minesExtra:[
    null,
    { res:"shards",    ic:"💠", name:"shard",     label:"💠", pct:18, vein:3, boss:10 },
    { res:"protein",   ic:"🍺", name:"Beer",        label:"🍺", pct:14, vein:5, boss:15 },
    { res:"wheelSpins",ic:"◎",  name:"Roll",      label:"◎",  pct:10, vein:1, boss:2  },
    { res:"chestKeys", ic:"🗝", name:"The key to the bark", label:"🗝", pct:8,  vein:1, boss:2  }
  ],
  shop:{ gemPacks:[250,900,3500],
    comeback:[[250,10000],[900,50000],[1500,100000],[2500,175000],[4000,300000],[10000,1000000]],

    combPacks:[[5,60],[20,200],[80,700]] },
};

/* Play Games Level Up catalogs — map IDs in Play Console to these keys. */
const PLAY_ACHIEVEMENTS={
  first_vein:{ id:"achievement_first_vein", n:"First Crack", desc:"Break your first vein.", hour1:true },
  bags_10:{ id:"achievement_bags_10", n:"Pack Rat", desc:"Open 10 bags.", hour1:true },
  depth_30:{ id:"achievement_depth_30", n:"Thirty Metres", desc:"Reach stage 10 (~30 m).", hour1:true },
  bag_lv5:{ id:"achievement_bag_lv5", n:"Better Sack", desc:"Upgrade the bag to Lv.5.", hour1:true },
  upgrade_atk:{ id:"achievement_upgrade_atk", n:"Sharper Pick", desc:"Buy an ATK upgrade.", hour1:true },
  depth_100:{ id:"achievement_depth_100", n:"Hundred Metres", desc:"Reach stage 34." },
  first_pet:{ id:"achievement_first_pet", n:"Companions", desc:"Equip or hatch a pet." },
  first_beard:{ id:"achievement_first_beard", n:"Whiskers", desc:"Roll or grow a beard." },
  prestige_1:{ id:"achievement_prestige_1", n:"Deep Call", desc:"Complete a prestige." },
  pvp_win:{ id:"achievement_pvp_win", n:"Arena Dust", desc:"Win a PvP dig." },
  streak_7:{ id:"achievement_streak_7", n:"Week in the Dark", desc:"7-day login streak." },
  cosmic_slot:{ id:"achievement_cosmic_slot", n:"Cosmic Fit", desc:"Equip a cosmic item." }
};
const PLAY_EVENTS={
  veins_broken:{ id:"event_veins_broken", n:"Veins broken" },
  bags_opened:{ id:"event_bags_opened", n:"Bags opened" },
  gold_earned:{ id:"event_gold_earned", n:"Gold earned" },
  ads_watched:{ id:"event_ads_watched", n:"Rewarded ads" },
  pvp_fights:{ id:"event_pvp_fights", n:"PvP fights" },
  depth_best:{ id:"event_depth_best", n:"Best depth", progression:true }
};
const PLAY_REWARDS={
  pick_magma:{ id:"reward_pick_magma", kind:"single", n:"Magma Pick Skin", grant:"pick_skin_magma" },
  beard_royal:{ id:"reward_beard_royal", kind:"single", n:"Royal Beard Style", grant:"beard_style_royal" },
  weekly_gold:{ id:"reward_weekly_gold", kind:"repeatable", n:"Weekly Gold Cache", grant:"gold_weekly", goldMul:80 }
};
