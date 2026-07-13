/* ============================================================
   UI SHELLS — Boxer-style mobile screens (visual only)
   ============================================================ */
"use strict";

const UI_MINES=[
  {id:0,ic:"🪙",n:"Золотая жила",   sub:"монеты · чертог "+((S&&S.mine)||0)+1, theme:"t0", on:true},
  {id:1,ic:"💎",n:"Кристальная",    sub:"осколки · скоро", theme:"t1", on:false},
  {id:2,ic:"🔥",n:"Лавовая",        sub:"крит · скоро", theme:"t2", on:false},
  {id:3,ic:"❄️",n:"Ледяная",        sub:"выносливость · скоро", theme:"t3", on:false},
  {id:4,ic:"✨",n:"Эфирная",        sub:"удача · скоро", theme:"t4", on:false}
];

const UI_ART_COLS=[
  {id:"mountain",n:"Гора",ic:"⛰",c:"#e8b93c"},
  {id:"deep",n:"Глубины",ic:"🕳",c:"#5aa7e8"},
  {id:"forge",n:"Кузня",ic:"🔨",c:"#ff8a4a"},
  {id:"tavern",n:"Таверна",ic:"🍺",c:"#7ae8dc"}
];

const UI_TAV_RANKS=[
  {n:"Каменный Кубок",xp:1200,r:1},{n:"Медный Кубок",xp:980,r:2},{n:"Железный Кубок",xp:760,r:3},
  {n:"Серебряный Кубок",xp:540,r:4},{n:"Золотой Кубок",xp:320,r:5},{n:"Платиновый Кубок",xp:110,r:6}
];

const UIS={
  id:null, tab:null,
  $(id){ return document.getElementById(id); },
  show(){
    const el=this.$("uiScreen"); if(!el) return;
    el.style.display="flex";
    if(el.classList) el.classList.add("open");
    Platform.logEvent("ui_screen",{id:this.id,tab:this.tab});
  },
  close(){
    const el=this.$("uiScreen"); if(el){ el.style.display="none"; if(el.classList) el.classList.remove("open"); }
    this.id=null; this.tab=null;
  },
  setTab(t){
    this.tab=t;
    if(this.id) this.render(this.id);
  },
  open(id, tab){
    this.id=id; this.tab=tab||null;
    this.render(id); this.show();
  },
  bar(pct, col){
    const w=Math.max(0,Math.min(100,pct||0));
    return '<div class="uiBar"><div class="uiBarFill" style="width:'+w+'%;background:'+(col||"var(--gold)")+'"></div></div>';
  },
  tabs(keys, labels, active){
    return '<div class="uiTabs">'+keys.map((k,i)=>
      '<button class="uiTab'+(k===active?" on":"")+'" onclick="UIS.setTab(\''+k+'\')">'+labels[i]+'</button>'
    ).join("")+'</div>';
  },
  card(ic, title, sub, body, cls){
    return '<div class="uiCard'+(cls?" "+cls:"")+'">'
      +(ic?'<div class="uiCardIc">'+ic+'</div>':"")
      +'<div class="uiCardBody"><b>'+title+'</b>'
      +(sub?'<div class="uiSub">'+sub+'</div>':"")
      +(body||"")+'</div></div>';
  },
  row(l, r){ return '<div class="uiRow"><span>'+l+'</span><span>'+r+'</span></div>'; },
  grid(items){ return '<div class="uiGrid">'+items.join("")+'</div>'; },
  slot(ic, nm, sub, cls, onclick){
    return '<button class="uiSlot'+(cls?" "+cls:"")+'"'+(onclick?' onclick="'+onclick+'"':"")+'>'
      +'<span class="uiSlotIc">'+ic+'</span><span class="uiSlotNm">'+nm+'</span>'
      +(sub?'<span class="uiSlotSub">'+sub+'</span>':"")+'</button>';
  },

  renderProfile(){
    const w=beardWisdom(), depth=(S.stageIdx||1)*3;
    const setName="var v=document.getElementById('uiProfName').value.trim().slice(0,18);if(v){S.playerName=v;save();UIS.render('profile');}";
    this.$("uiTitle").textContent="Профиль";
    this.$("uiHeadAct").innerHTML="";
    this.$("uiTabs").innerHTML="";
    this.$("uiBody").innerHTML=
      '<div class="uiHero"><div class="uiHeroArt">🧔</div>'
      +'<b>'+esc(playerName())+'</b><div class="uiSub">'+w.title+((S.prestigeLv||0)?(" · ⛰ "+S.prestigeLv):"")+'</div></div>'
      +this.row("Глубина прогона",'<b>'+Math.min(S.stageIdx||1,BALANCE.run.len)+'/'+BALANCE.run.len+'</b>')
      +this.row("Рекорд",'<b>'+fmt(S.bestDepth||depth)+' м</b>')
      +this.row("PvP · кубки",(S.pvpWins||0)+' побед · 🏆 '+fmt(S.trophies||0))
      +this.row("Зал",'ур. '+gymLevel()+' · +'+gymPerkPct()+'%')
      +'<div class="uiRow"><span>Имя таверны</span><span><input id="uiProfName" class="uiInp" maxlength="18" value="'+esc(playerName())+'">'
      +'<button class="buy uiTiny" onclick="'+setName+'">✓</button></span></div>'
      +'<div class="uiBtnStack">'
      +'<button class="buy" onclick="UIS.open(\'beards\')">💇 Бороды</button>'
      +'<button onclick="openWall()">🏔 Стена Горы</button></div>';
  },

  renderSettings(){
    this.$("uiTitle").textContent="Настройки";
    this.$("uiHeadAct").innerHTML="";
    this.$("uiTabs").innerHTML="";
    this.$("uiBody").innerHTML=
      this.row("Музыка",'<button id="uiSetMusic" onclick="toggleMusic();UIS.render(\'settings\')">'+(musicOn?"🔊 вкл":"🔇 выкл")+'</button>')
      +this.row("Устав Горы",'<button onclick="showIntro()">📜 читать</button>')
      +this.row("Честность гачи",'<button onclick="openFairness()">🔐 открыть</button>')
      +this.row("Версия",'<span class="uiSub">ORE DEEP · UI shells</span>')
      +'<button class="red" style="margin-top:14px;width:100%" onclick="UIS.close();document.getElementById(\'resetBtn\').onclick&&document.getElementById(\'resetBtn\').onclick()">↺ Всё сначала</button>';
  },

  renderPets(){
    const tab=this.tab||"gacha";
    this.$("uiTitle").textContent="Питомцы";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">🥚 '+(S.eggs||0)+'</span>';
    this.$("uiTabs").innerHTML=this.tabs(["gacha","merge","craft","bag"],
      ["Гача","Слияние","Крафт","Клетка"],tab);
    let body="";
    const cur=S.pet?('<div class="uiBanner r'+S.pet.r+'">В бою: '+PET_TYPES[S.pet.t].n
      +' · +'+PET_TYPES[S.pet.t].pct[S.pet.r]+'% '+PET_TYPES[S.pet.t].stat.toUpperCase()+'</div>'):"";
    if(tab==="gacha"){
      body=cur+'<div class="uiGachaStage"><div class="uiGachaEgg">🥚</div></div>'
        +'<div class="uiSub" style="text-align:center;margin:8px 0">Роллов: '+(S.petRolls||0)+' · жалость Горы</div>'
        +'<button class="gold uiWide" onclick="rollPet()" '+(S.eggs<1?"disabled":"")+'>Приручить · 🥚 1</button>';
    } else if(tab==="merge"){
      const keys=Object.keys(S.petBox||{}).filter(k=>S.petBox[k]>0)
        .sort((a,b)=>Number(b.split("_")[1])-Number(a.split("_")[1]));
      body=cur+(keys.length?keys.map(k=>{
        const [t,r]=k.split("_").map(Number), c=S.petBox[k], ok=canMergePet(t,r);
        return this.card("🐕",PET_RAR[r]+" · "+PET_TYPES[t].n,"×"+c+' · нужно '+BALANCE.merge.petCost+' для слияния',
          ok?'<button class="buy uiWide" onclick="mergePet('+t+','+r+');UIS.render(\'pets\')">Слить 3 → '+PET_RAR[r+1]+'</button>'
            :'<button class="buy uiWide" disabled style="opacity:.45">Слить 3 → '+PET_RAR[Math.min(r+1,PET_MERGE_MAX)]+'</button>');
      }).join(""):'<div class="uiEmpty">Коллекция пуста — крути яйца на вкладке Гача.</div>');
    } else if(tab==="craft"){
      const unlocked=petCraftUnlocked();
      body=(unlocked
        ? this.card("⚗","Крафт Exotic","По Legendary каждого семейства + "+BALANCE.petCraft.gems+" 💎",
            '<button class="gold uiWide" onclick="craftPetExotic()" '+(petCraftReady()?"":"disabled")+'>Крафтнуть</button>')
        : '<div class="uiEmpty">🔒 Крафт откроется после '+BALANCE.petCraft.needLegendaries+' легендарных (есть '+(S.petLegSeen||0)+').</div>');
    } else {
      const slots=PET_TYPES.map((p,i)=>{
        let bestR=-1; for(const k in S.petBox||{}){ const [t,r]=k.split("_").map(Number); if(t===i&&r>bestR) bestR=r; }
        const ic=bestR>=0?"🐕":"❔", sub=bestR>=0?PET_RAR[bestR]:"нет";
        return this.slot(ic,p.n,sub,bestR>=0?"r"+bestR:"");
      });
      body=cur+this.grid(slots);
    }
    this.$("uiBody").innerHTML=body;
  },

  renderBeards(){
    const tab=this.tab||"gacha";
    this.$("uiTitle").textContent="Бороды";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">🪮 '+(S.combs||0)+'</span>';
    this.$("uiTabs").innerHTML=this.tabs(["gacha","merge","rank","gallery"],
      ["Гача","Слияние","Ранг","Галерея"],tab);
    let body="";
    const cur=S.geo?('<div class="uiBanner r'+S.geo.r+'">'+S.geo.n+' · +'+geoPct(S.geo).toFixed(0)+'% '+GEO_TYPES[S.geo.t].stat.toUpperCase()+'</div>'):"";
    if(tab==="gacha"){
      body=cur+'<div class="uiGachaStage"><div class="uiGachaEgg">🪮</div></div>'
        +'<div class="uiSub" style="text-align:center;margin:8px 0">Роллов: '+(S.geoRolls||0)+'</div>'
        +'<button class="gold uiWide" onclick="var b=document.getElementById(\'geoBtn\');if(b&&b.onclick)b.onclick()" '+(S.combs<1?"disabled":"")+'>Нанять · 🪮 1</button>';
    } else if(tab==="merge"){
      body=cur+(S.geo
        ? this.card("👷",S.geo.n,"ур. "+(S.geo.lv||1)+" · материал: "+geoMaterials(),
            '<button class="buy uiWide" onclick="mergeGeo();UIS.render(\'beards\')" '+(geoMaterials()<1?"disabled":"")+'>Поглотить дубликаты</button>')
        : '<div class="uiEmpty">Сначала найми бороду на вкладке Гача.</div>');
    } else if(tab==="rank"){
      const w=beardWisdom(), need=beardNextXP(w.lv), have=S.beardXP||0;
      const pct=w.lv>=BEARD_RANKS.length-1?100:Math.min(100,Math.round(have/need*100));
      body=this.card("🧔",w.title,"+"+w.goldPct+"% доход · +"+w.luckAdd.toFixed(1)+" LUCK",this.bar(pct)+
        '<div class="uiSub" style="margin-top:6px">'+(w.lv>=BEARD_RANKS.length-1?"МАКСИМУМ":fmt(have)+" / "+fmt(need)+" XP")+'</div>');
    } else {
      body=this.grid(GEO_TYPES.map((g,i)=>this.slot("💇",g.names[0],g.stat.toUpperCase(),"")));
    }
    this.$("uiBody").innerHTML=body;
  },

  renderMines(){
    this.$("uiTitle").textContent="Штольни";
    this.$("uiHeadAct").innerHTML="";
    this.$("uiTabs").innerHTML="";
    const cur=S.mine||0;
    this.$("uiBody").innerHTML=
      '<div class="uiSub" style="margin-bottom:8px">5 видов штолен — по ресурсу. Пока UI-заглушки.</div>'
      +'<div class="uiMineList">'+UI_MINES.map(m=>
        '<button class="uiMineCard '+m.theme+(m.id===cur?" sel":"")+'" onclick="'+(m.on?"switchTab('Mine');UIS.close();":'showToast("⛏","Скоро","","Штольня «'+m.n+'» — в следующем спринте")')+'">'
        +'<span class="uiMineIc">'+m.ic+'</span><b>'+m.n+'</b><span class="uiSub">'+m.sub+'</span>'
        +(m.id===cur?'<span class="uiTag on">здесь</span>':(m.on?'':'<span class="uiTag">🔒</span>'))
        +'</button>').join("")+'</div>';
  },

  renderPvp(){
    pvpDayReset(); if(!pvpSlate) pvpRollSlate();
    const li=pvpLeagueIdx(), me=powerScore();
    const left=Math.max(0,BALANCE.pvpDayLimit-(S.pvpFights||0));
    const nextLi=Math.min(BALANCE.pvp.names.length-1,li+1);
    const tr=BALANCE.pvp.thresholds||[0];
    const curReq=tr[li]||0, nextReq=tr[nextLi]||tr[li]||100;
    const pct=li>=BALANCE.pvp.names.length-1?100:Math.min(100,Math.round(((S.trophies||0)-curReq)/Math.max(1,nextReq-curReq)*100));
    this.$("uiTitle").textContent="PvP · Таверна";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">🏆 '+fmt(S.trophies||0)+'</span>';
    this.$("uiTabs").innerHTML="";
    const opps=pvpSlate.map((o,i)=>{
      const fav=me>=o.power;
      return '<div class="uiOpp '+(fav?"fav":"")+'"><div><b>'+o.name+'</b><div class="uiSub">Power '+fmt(o.power)+'</div></div>'
        +'<button class="buy" onclick="pvpFight('+i+');UIS.render(\'pvp\')" '+(left<1?"disabled":"")+'>⚔</button></div>';
    }).join("");
    this.$("uiBody").innerHTML=
      '<div class="uiHero compact"><div class="uiHeroArt">🍺</div><b>'+esc(playerName())+'</b>'
      +'<div class="uiSub">«'+esc(playerName())+'» — таверна игрока</div></div>'
      +this.card("🏆","Лига: "+BALANCE.pvp.names[li],"боёв сегодня: "+left+"/"+BALANCE.pvpDayLimit,
        this.bar(pct,"var(--blue)")+'<div class="uiSub" style="margin-top:4px">до '+BALANCE.pvp.names[nextLi]+': '+fmt(Math.max(0,nextReq-(S.trophies||0)))+' 🏆</div>')
      +'<div class="uiSec">Выбери соперника</div>'
      +(left>0?opps:'<div class="uiEmpty" style="color:#e8a24a">Бои на сегодня кончились. Возвращайся завтра.</div>')
      +(left>0?'<button class="uiWide" onclick="pvpRerollSlate();UIS.render(\'pvp\')">Сменить претендентов</button>':'')
      +'<button class="gold uiWide" style="margin-top:8px" onclick="openWall()">🏔 Лидерборд</button>';
  },

  renderTavern(){
    const tab=this.tab||"ale";
    const lv=gymLevel(), xp=S.gymXP||0;
    const nextAt=GYM_LEVELS[lv+1], atCur=GYM_LEVELS[lv]||0;
    const gymPct=nextAt!=null?Math.min(100,Math.round((xp-atCur)/(nextAt-atCur)*100)):100;
    this.$("uiTitle").textContent="Таверна";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">Gym '+lv+'</span>';
    this.$("uiTabs").innerHTML=this.tabs(["ale","feast","mates","friends","rank"],
      ["Эль","Застолья","Союзники","Друзья","Рейтинг"],tab);
    let body='<div class="uiTavExt"><div class="uiTavRoof">🍺</div><div class="uiTavSign">'+esc(playerName())+'</div></div>';
    if(tab==="ale"){
      body+=this.card("🍺","Пассивный эль","+12% энергии за глоток",
        '<button class="buy uiWide" onclick="sipAle()">Выпить</button><div class="uiSub" style="margin-top:6px">Следующий тост через ~'+Math.ceil(aleNext||20)+' ударов</div>');
    } else if(tab==="feast"){
      body+=this.card("💪","Застолья · тренировки","7 путей · 🍺 "+(S.protein||0),
        '<button class="gold uiWide" onclick="openWorkouts()">Открыть тренировки</button>');
      body+=this.card("🏋","Gym XP · уважение",fmt(xp)+(nextAt!=null?(" / "+fmt(nextAt)):""),
        this.bar(gymPct)+'<div class="uiSub" style="margin-top:4px">+'+gymPerkPct()+'% ко всем статам</div>');
    } else if(tab==="mates"){
      body+=this.grid([
        this.slot("🧔","Борин","наставник",""),
        S.geo?this.slot("💇",S.geo.n,"+"+geoPct(S.geo).toFixed(0)+"%","r"+S.geo.r):this.slot("❔","Вакансия","найми бороду",""),
        S.pet?this.slot("🐕",PET_TYPES[S.pet.t].n,PET_RAR[S.pet.r],"r"+S.pet.r):this.slot("❔","Питомец","яйца",""),
        this.slot("👥","Кlan stub","сеть","")
      ]);
    } else if(tab==="friends"){
      const addFn="var c=document.getElementById('uiFriendCode').value.trim();if(c){showToast('🤝','Код принят','',c,'друг добавится в сетевой версии');}";
      body='<div class="uiSub">Добавить друга по коду</div>'
        +'<div class="uiRow"><input id="uiFriendCode" class="uiInp wide" placeholder="ORE-XXXX" maxlength="12">'
        +'<button class="buy uiTiny" onclick="'+addFn+'">+</button></div>'
        +'<div class="uiEmpty" style="margin-top:12px">Список собутыльников — в сетевой версии.</div>';
    } else {
      body+='<div class="uiSec">Рейтинг таверн</div>'
        +UI_TAV_RANKS.map((t,i)=>'<div class="uiRankRow"><span class="uiRankN">'+(i+1)+'</span><b>'+t.n+'</b><span class="uiSub">'+t.xp+' Gym XP</span></div>').join("")
        +'<div class="uiSub" style="margin-top:8px;text-align:center">+ фейковые таверны для атмосферы</div>';
    }
    this.$("uiBody").innerHTML=body;
  },

  renderArtifacts(){
    const tab=this.tab||"pick";
    this.$("uiTitle").textContent="Артефакты";
    this.$("uiHeadAct").innerHTML="";
    if(tab==="pick"){
      this.$("uiTabs").innerHTML="";
      this.$("uiBody").innerHTML='<div class="uiSub" style="margin-bottom:8px">Выбери коллекцию</div>'
        +this.grid(UI_ART_COLS.map(c=>
          '<button class="uiColPick" style="--acc:'+c.c+'" onclick="UIS.tab=\''+c.id+'\';UIS.render(\'artifacts\')">'
          +'<span class="uiColEm">'+c.ic+'</span><b>'+c.n+'</b></button>'));
      return;
    }
    const col=UI_ART_COLS.find(c=>c.id===tab)||UI_ART_COLS[0];
    this.$("uiTabs").innerHTML='<button class="uiTab" onclick="UIS.tab=\'pick\';UIS.render(\'artifacts\')">‹ Коллекции</button>';
    const owned=S.stickers||{};
    const slots=STICKERS.filter(s=>s.n&&s.n.length).slice(0,12).map(s=>{
      const c=owned[s.id]||0;
      return this.slot(s.ic,s.n,c?("+"+s.val): "—",c?"r"+s.r:" lock");
    });
    this.$("uiBody").innerHTML=
      '<div class="uiColHead" style="--acc:'+col.c+'"><span>'+col.ic+'</span><b>'+col.n+'</b></div>'
      +this.grid(slots)
      +'<div class="uiBtnStack"><button class="gold" onclick="buyStickerPack()">Пак · '+STICKER_PACK_GEMS+' 💎</button>'
      +'<button onclick="giftStickers()">Подарить дубликаты</button></div>';
  },

  renderShop(){
    const tab=this.tab||"free";
    this.$("uiTitle").textContent="Магазин";
    this.$("uiHeadAct").innerHTML="";
    this.$("uiTabs").innerHTML=this.tabs(["free","cur","offers","chests","art"],
      ["Беспл.","Валюта","Офферы","Сундуки","Артеф."],tab);
    let body="";
    if(tab==="free"){
      body=this.grid([
        this.slot("🎁","Ежедневный подарок","+яйца","", "openDaily()"),
        this.slot("📺","×2 оффлайн","реклама","", "Platform.showRewarded(function(){})"),
        this.slot("🎡","Колесо","бесплатно","", "openWheel()")
      ]);
    } else if(tab==="cur"){
      body=BALANCE.shop.gemPacks.map((g,i)=>this.card("💎",g+" кристаллов","IAP-stub",
        '<button class="gold uiWide" onclick="buyGems('+i+')">$'+[19.99,59.99,199.99][i]+'</button>')).join("");
    } else if(tab==="offers"){
      body=BALANCE.shop.comeback.slice(0,3).map(([g,gold],i)=>this.card("🎁","Пак "+(i+1),"💎"+g+" + 🪙"+fmt(gold),
        '<button class="gold uiWide" onclick="buyPack('+i+')">$'+[6.99,16.99,24.99][i]+'</button>')).join("")
        +(S.noAds?"":this.card("🚫","No-Ads","убрать рекламу",
          '<button class="gold uiWide" onclick="buyNoAds()">$'+BALANCE.noAdsPrice+'</button>'));
    } else if(tab==="chests"){
      body=this.card("🎒","Сундук находок","ур. "+(S.bag||1)+" · сумок "+(S.bags||0),
        '<button class="buy uiWide" onclick="openChest()">Открыть окно сундука</button>');
    } else {
      body=this.card("🃏","Паки артефактов","стикеры · коллекции",
        '<button class="gold uiWide" onclick="UIS.open(\'artifacts\')">К коллекциям</button>');
    }
    this.$("uiBody").innerHTML=body;
  },

  render(id){
    const fn={
      profile:this.renderProfile, settings:this.renderSettings,
      pets:this.renderPets, beards:this.renderBeards, mines:this.renderMines,
      pvp:this.renderPvp, tavern:this.renderTavern, artifacts:this.renderArtifacts, shop:this.renderShop
    }[id];
    if(fn) fn.call(this);
  }
};

function uiWire(){
  if($("profChip")) $("profChip").onclick=()=>UIS.open("profile");
  if($("settingsBtn")) $("settingsBtn").onclick=()=>UIS.open("settings");
  if($("navPetsBtn")) $("navPetsBtn").onclick=()=>UIS.open("pets","gacha");
  if($("navTavBtn")) $("navTavBtn").onclick=()=>UIS.open("tavern","ale");
  if($("navPets")) $("navPets").onclick=()=>UIS.open("pets","gacha");
  if($("navPvp")) $("navPvp").onclick=()=>UIS.open("pvp");
  if($("navShop")) $("navShop").onclick=()=>UIS.open("shop","free");
  if($("stickBtn")) $("stickBtn").onclick=()=>{ UIS.tab=null; UIS.open("artifacts"); };
  if($("gymBtn")) $("gymBtn").onclick=()=>UIS.open("tavern","feast");
  if($("navMines")) $("navMines").onclick=()=>UIS.open("mines");
  const ml=$("mineLabel");
  if(ml){ ml.style.cursor="pointer"; ml.title="Штольни"; ml.onclick=(e)=>{ if(e&&e.stopPropagation) e.stopPropagation(); UIS.open("mines"); }; }
}
function uiWrap(name){
  const prev=globalThis[name];
  if(typeof prev!=="function") return;
  globalThis[name]=function(){
    const r=prev.apply(this,arguments);
    if(UIS.id) try{ UIS.render(UIS.id); }catch(e){}
    return r;
  };
}

uiWire();
if(typeof switchTab==="function"){
  const _switchTab=switchTab;
  switchTab=function(name){
    if(typeof closeIntro==="function") closeIntro();
    UIS.close();
    return _switchTab(name);
  };
}

openPets=function(tab){ UIS.open("pets", tab||(UIS.id==="pets"?UIS.tab:null)||"gacha"); };
openPvp=function(){ UIS.open("pvp"); };
openShop=function(tab){ UIS.open("shop", tab||(UIS.id==="shop"?UIS.tab:null)||"free"); };
openGym=function(){ UIS.open("tavern","feast"); };
openStickers=function(){ UIS.tab=null; UIS.open("artifacts"); };
openBeard=function(){ UIS.open("beards","rank"); };

["rollPet","mergePet","craftPetExotic","pvpFight","pvpRerollSlate","mergeGeo","buyGems","buyPack","claimDaily","chestOpenOne","chestUpgrade","chestSkip"].forEach(uiWrap);
