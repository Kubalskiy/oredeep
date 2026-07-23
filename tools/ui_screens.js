/* ============================================================
   UI SHELLS — Boxer-style mobile screens (visual only)
   ============================================================ */
"use strict";

const UI_MINES=[
  {id:0,ic:"🪙",n:"Забой новичка",   sub:"🪙 золото · находки", theme:"t0"},
  {id:1,ic:"💠",n:"Эхо-Дум",         sub:"💠 осколки · дубликаты", theme:"t1"},
  {id:2,ic:"🍺",n:"Подгорный Огонь", sub:"🍺 пиво · тренировки", theme:"t2"},
  {id:3,ic:"◎",n:"Хрустальные",      sub:"◎ крутки · колесо", theme:"t3"},
  {id:4,ic:"🗝",n:"Бездна",          sub:"🗝 ключи · скилл-лари", theme:"t4"}
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
  setChrome(hidden){
    /* Футер (#bottomNav) всегда виден — гасим только верхнюю шапку. */
    const app=this.$("app"), nav=this.$("bottomNav");
    if(app&&app.classList) app.classList.toggle("uiOpen", !!hidden);
    if(nav){
      nav.style.display="";
      nav.removeAttribute("aria-hidden");
    }
  },
  show(){
    if(typeof closeIntro==="function") closeIntro();
    const el=this.$("uiScreen"); if(!el) return;
    el.style.display="flex";
    el.style.pointerEvents="auto";
    if(el.classList) el.classList.add("open");
    this.setChrome(true);
    Platform.logEvent("ui_screen",{id:this.id,tab:this.tab});
    try{ if(typeof updateFtueHint==="function") updateFtueHint(); }catch(e){}
  },
  close(){
    if(typeof closeIntro==="function") closeIntro();
    const el=this.$("uiScreen");
    if(el){
      el.style.display="none";
      el.style.pointerEvents="none";
      if(el.classList) el.classList.remove("open");
    }
    this.setChrome(false);
    this.id=null; this.tab=null;
    try{ if(typeof updateFtueHint==="function") updateFtueHint(); }catch(e){}
  },
  setTab(t){
    this.tab=t;
    if(this.id) this.render(this.id);
  },
  open(id, tab){
    this.id=id; this.tab=tab||null;
    this.render(id); this.show();
    if(typeof S!=="undefined"&&S&&S.ftue){
      if(id==="tavern"&&!S.ftue.t){ S.ftue.t=1; save(); }
      if(id==="profile"&&this.tab==="growth"&&!S.ftue.g){ S.ftue.g=1; save(); }
      try{ updateFtueHint(); }catch(e){}
    }
  },
  bar(pct, col){
    const w=Math.max(0,Math.min(100,pct||0));
    return '<div class="uiBar"><div class="uiBarFill" style="width:'+w+'%;background:'+(col||"var(--gold)")+'"></div></div>';
  },
  tabs(keys, labels, active){
    return '<div class="uiTabs">'+keys.map((k,i)=>
      '<button type="button" class="btn btn-tab'+(k===active?" on":"")+'" onclick="UIS.setTab(\''+k+'\')">'+labels[i]+'</button>'
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
    return '<button type="button" class="uiSlot'+(cls?" "+cls:"")+'"'+(onclick?' onclick="'+onclick+'"':"")+'>'
      +'<span class="uiSlotIc">'+ic+'</span><span class="uiSlotNm">'+nm+'</span>'
      +(sub?'<span class="uiSlotSub">'+sub+'</span>':"")+'</button>';
  },

  renderProfile(){
    const tab=this.tab||"main";
    if(tab==="growth"){
      ensureGrowth(S); growthSyncInvites();
      const code=growthInviteCode(), coop=growthCoopMult()>1;
      const ms=BALANCE.growth.referral.milestones;
      const msHtml=ms.map((m,i)=>{
        const done=S.growth.milestones.includes(i), ok=(S.growth.invites||0)>=m.n;
        return this.row(m.n+" друзей",(done?"✓ +"+m.gems+" 💎":(ok?"готово!":"—")));
      }).join("");
      const wl=S.growth.waitlist;
      this.$("uiTitle").textContent="Друзья";
      this.$("uiHeadAct").innerHTML="";
      this.$("uiTabs").innerHTML=this.tabs(["main","growth"],["Профиль","Друзья"],"growth");
      this.$("uiBody").innerHTML=
        '<div class="uiBanner">Органический рост: рефералы и вейтлист без рекламного бюджета</div>'
        +this.row("Твой код",'<b>'+code+'</b>')
        +this.row("Приглашено",'<b>'+(S.growth.invites||0)+'</b> / '+BALANCE.growth.referral.inviterCap)
        +(S.growth.referredBy?this.row("Пригласил",'<b>'+esc(S.growth.referredBy)+'</b>'):"")
        +(coop?this.row("Кооп-буст",'<b style="color:var(--green)">+'+BALANCE.growth.referral.coopBoostPct+'% доход</b>'):"")
        +'<div class="uiBtnStack">'
        +'<button class="btn btn-hard btn-wide" onclick="shareInvite()">Поделиться ссылкой</button>'
        +'<button class="btn btn-soft btn-wide" onclick="claimInviteMilestones()">Забрать вехи рефералов</button></div>'
        +'<div class="uiSec">Вехи</div>'+msHtml
        +'<div class="uiSec">Вейтлист (ранний доступ)</div>'
        +(wl.joined
          ?(wl.claimed?this.row("Статус","✓ бонус получен"):this.card("📋","Ранний доступ","органика без CPI",
            '<button class="btn btn-hard btn-wide" onclick="claimWaitlistBonus()">Забрать бонус</button>'))
          :this.card("📋","Вейтлист","бонус за органический спрос",
            '<button class="btn btn-hard btn-wide" onclick="growthJoinWaitlist(false);UIS.render(\'profile\')">Вступить</button>'))
        +'<div class="uiSec">Пришёл по коду?</div>'
        +'<div class="uiRow"><span><input id="uiRefInp" class="uiInp wide" maxlength="8" placeholder="КОД"></span>'
        +'<button class="btn btn-soft btn-tiny" onclick="growthApplyReferral(document.getElementById(\'uiRefInp\').value);UIS.render(\'profile\')">✓</button></div>';
      return;
    }
    const w=beardWisdom(), depth=(S.stageIdx||1)*3;
    const setName="var v=document.getElementById('uiProfName').value.trim().slice(0,18);if(v){S.playerName=v;save();UIS.render('profile');}";
    this.$("uiTitle").textContent="Профиль";
    this.$("uiHeadAct").innerHTML="";
    this.$("uiTabs").innerHTML=this.tabs(["main","growth"],["Профиль","Друзья"],"main");
    this.$("uiBody").innerHTML=
      '<div class="uiHero"><div class="uiHeroArt">🧔</div>'
      +'<b>'+esc(playerName())+'</b><div class="uiSub">'+w.title+((S.prestigeLv||0)?(" · ⛰ "+S.prestigeLv):"")+'</div></div>'
      +this.row("Глубина прогона",'<b>'+Math.min(S.stageIdx||1,BALANCE.run.len)+'/'+BALANCE.run.len+'</b>')
      +this.row("Рекорд",'<b>'+fmt(S.bestDepth||depth)+' м</b>')
      +this.row("PvP · кубки",(S.pvpWins||0)+' побед · 🏆 '+fmt(S.trophies||0))
      +this.row("Зал",'ур. '+gymLevel()+' · +'+gymPerkPct()+'%')
      +'<div class="uiRow"><span>Имя таверны</span><span><input id="uiProfName" class="uiInp" maxlength="18" value="'+esc(playerName())+'">'
      +'<button class="btn btn-soft btn-tiny" onclick="'+setName+'">✓</button></span></div>'
      +'<div class="uiBtnStack">'
      +'<button class="btn btn-soft" onclick="UIS.open(\'beards\')">💇 Бороды</button>'
      +'<button onclick="UIS.setTab(\'growth\');UIS.render(\'profile\')">👥 Пригласи друзей</button>'
      +'<button onclick="openWall()">🏔 Стена Горы</button></div>';
  },

  renderSettings(){
    const ue=(typeof growthUnitEcon==="function")?growthUnitEcon():{};
    const fmtUsd=c=>"$"+(c/100).toFixed(2);
    this.$("uiTitle").textContent="Настройки";
    this.$("uiHeadAct").innerHTML="";
    this.$("uiTabs").innerHTML="";
    this.$("uiBody").innerHTML=
      this.row("Музыка",'<button id="uiSetMusic" onclick="toggleMusic();UIS.render(\'settings\')">'+(musicOn?"🔊 вкл":"🔇 выкл")+'</button>')
      +this.row("Устав Горы",'<button onclick="showIntro()">📜 читать</button>')
      +this.row("Админка",'<button type="button" onclick="location.href=\'admin.html\'">⛏ открыть</button>')
      +this.row("Честность гачи",'<button onclick="openFairness()">🔐 открыть</button>')
      +'<div class="uiSec">Юнит-экономика (демо)</div>'
      +this.row("День с инсталла","D"+(ue.days||1))
      +this.row("Выручка",fmtUsd(ue.totalCents||0)+" · IAP "+fmtUsd(ue.revenueIap||0))
      +this.row("CAC цель",fmtUsd(ue.cac||0)+" · LTV цель "+fmtUsd(ue.ltv||0))
      +this.row("LTV/CAC","×"+((ue.ltvRatio||0).toFixed(1)))
      +this.row("Окупаемость",(ue.paybackOk?"✓ до D"+BALANCE.growth.paybackDay:"ещё нет"))
      +this.row("K-фактор",((ue.k||0).toFixed(2))+" · "+(ue.organic?"органика":"платный"))
      +this.row("Реклама сегодня",(S.growth&&S.growth.ads?S.growth.ads.count:0)+"/"+BALANCE.growth.ads.dailyCap)
      +this.row("Прогресс",'<span class="uiSub">автосейв · резервная копия</span>')
      +this.row("Версия",'<span class="uiSub">ORE DEEP · UI shells</span>')
      +'<button class="btn btn-danger" style="margin-top:14px;width:100%" onclick="UIS.close();resetProgress()">↺ Всё сначала</button>';
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
        +'<button class="btn btn-hard btn-wide" onclick="rollPet()" '+(S.eggs<1?"disabled":"")+'>Приручить · 🥚 1</button>';
    } else if(tab==="merge"){
      const keys=Object.keys(S.petBox||{}).filter(k=>S.petBox[k]>0)
        .sort((a,b)=>Number(b.split("_")[1])-Number(a.split("_")[1]));
      body=cur+(keys.length?keys.map(k=>{
        const [t,r]=k.split("_").map(Number), c=S.petBox[k], ok=canMergePet(t,r);
        const maxed=r>=PET_MERGE_MAX;
        return this.card("🐕",PET_RAR[r]+" · "+PET_TYPES[t].n,"×"+c+' · нужно '+BALANCE.merge.petCost+' для слияния',
          maxed?'<button class="btn btn-soft btn-wide" disabled style="opacity:.4">предел</button>'
            :'<button class="btn btn-soft btn-wide" onclick="mergePet('+t+','+r+')" '+(ok?"":'disabled style="opacity:.45"')+'>Слить 3 → '+PET_RAR[r+1]+'</button>');
      }).join(""):'<div class="uiEmpty">Коллекция пуста — крути яйца на вкладке Гача.</div>');
    } else if(tab==="craft"){
      const unlocked=petCraftUnlocked();
      body=(unlocked
        ? this.card("⚗","Крафт Exotic","По Legendary каждого семейства + "+BALANCE.petCraft.gems+" 💎",
            '<button class="btn btn-hard btn-wide" onclick="craftPetExotic()" '+(petCraftReady()?"":"disabled")+'>Крафтнуть</button>')
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
        +'<button class="btn btn-hard btn-wide" onclick="hireGeo();UIS.render(\'beards\')" '+(S.combs<1?"disabled":"")+'>Нанять · 🪮 1</button>';
    } else if(tab==="merge"){
      body=cur+(S.geo
        ? this.card("👷",S.geo.n,"ур. "+(S.geo.lv||1)+" · материал: "+geoMaterials(),
            '<button class="btn btn-soft btn-wide" onclick="mergeGeo();UIS.render(\'beards\')" '+(geoMaterials()<1?"disabled":"")+'>Поглотить дубликаты</button>')
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
    const curAbs=S.mine||0;
    const cur=curAbs%MINES.length;
    const cycle=Math.floor(curAbs/MINES.length);
    this.$("uiBody").innerHTML=
      '<div class="uiSub" style="margin-bottom:8px">Чертоги идут по кругу (5 штолен). Внутри текущего круга можно вернуться в уже пройденные.</div>'
      +'<div class="uiMineList">'+UI_MINES.map(m=>
        '<button class="btn btn-mine '+m.theme+(m.id===cur?" sel":"")+'" onclick="'+(m.id<=cur
          ? ('switchMine('+m.id+');UIS.close();')
          : ('showToast(\"⛏\",\"Закрыто\",\"\",\"Дойди до этого чертога\",\"в текущем круге: '+(cur+1)+'/5\")'))+'">'
        +'<span class="uiMineIc">'+m.ic+'</span><b>'+m.n+'</b><span class="uiSub">'+m.sub+'</span>'
        +(m.id===cur?'<span class="uiTag on">здесь</span>':(m.id<=cur?'<span class="uiTag">доступно</span>':'<span class="uiTag">🔒</span>'))
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
    const raceSec=BALANCE.pvp.raceSec||180;
    this.$("uiTitle").textContent="PvP · ИИ-агенты";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">🏆 '+fmt(S.trophies||0)+'</span>';
    this.$("uiTabs").innerHTML="";
    const opps=pvpSlate.map((o,i)=>{
      const fav=me>=o.power;
      const rec=typeof pvpBotRec==="function"?pvpBotRec(o.id):{w:0,l:0};
      return '<div class="uiOpp '+(fav?"fav":"")+'"><div><b>'+(o.ic||"🤖")+' '+o.name+'</b>'
        +'<div class="uiSub">'+esc(o.tag||"ИИ")+' · Power '+fmt(o.power)+' · ~'+fmt(pvpMineOrePerSec(o.power))+'/с</div>'
        +'<div class="uiSub">счёт '+rec.w+':'+rec.l+(o.fluff?(" · "+esc(o.fluff)):"")+'</div></div>'
        +'<button class="btn btn-soft" onclick="pvpFight('+i+')" '+(left<1?"disabled":"")+'>⛏ '+raceSec+'с</button></div>';
    }).join("");
    this.$("uiBody").innerHTML=
      '<div class="uiHero compact"><div class="uiHeroArt">🤖</div><b>'+esc(playerName())+'</b>'
      +'<div class="uiSub">5 ИИ-агентов · гонка добычи '+raceSec+'с</div></div>'
      +this.card("🏆","Лига: "+BALANCE.pvp.names[li],"твоя добыча ~"+fmt(pvpMineOrePerSec(me))+"/с · попыток "+left+"/"+BALANCE.pvpDayLimit,
        this.bar(pct,"var(--blue)")+'<div class="uiSub" style="margin-top:4px">до '+BALANCE.pvp.names[nextLi]+': '+fmt(Math.max(0,nextReq-(S.trophies||0)))+' 🏆</div>')
      +'<div class="uiSec">Выбери ИИ-соперника</div>'
      +(left>0?opps:'<div class="uiEmpty" style="color:#e8a24a">Бои на сегодня кончились. Возвращайся завтра.</div>')
      +(left>0?'<button class="btn btn-wide" onclick="pvpRerollSlate();UIS.render(\'pvp\')">Обновить форму дня</button>':'')
      +'<button class="btn btn-hard btn-wide" style="margin-top:8px" onclick="openWall()">🏔 Лидерборд</button>';
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
        '<button class="btn btn-soft btn-wide" onclick="sipAle()">Выпить</button><div class="uiSub" style="margin-top:6px">Следующий тост через ~'+Math.ceil(aleNext||20)+' ударов</div>');
    } else if(tab==="feast"){
      body+=this.card("💪","Застолья · тренировки","7 путей · 🍺 "+(S.protein||0),
        '<button class="btn btn-hard btn-wide" onclick="openWorkouts()">Открыть тренировки</button>');
      body+=this.card("🏋","Gym XP · уважение",fmt(xp)+(nextAt!=null?(" / "+fmt(nextAt)):""),
        this.bar(gymPct)+'<div class="uiSub" style="margin-top:4px">+'+gymPerkPct()+'% ко всем статам</div>');
    } else if(tab==="mates"){
      const geoSlot=S.geo
        ? this.slot("💇",S.geo.n,"+"+geoPct(S.geo).toFixed(0)+"%","r"+S.geo.r,"UIS.open('beards','merge')")
        : this.slot("❔","Вакансия","найми бороду","","UIS.open('beards','gacha')");
      const petSlot=S.pet
        ? this.slot("🐕",PET_TYPES[S.pet.t].n,PET_RAR[S.pet.r],"r"+S.pet.r,"UIS.open('pets','gacha')")
        : this.slot("❔","Питомец","яйца","","UIS.open('pets','gacha')");
      body+=this.grid([
        this.slot("🧔","Борин","наставник","","showIntro()"),
        geoSlot,
        petSlot,
        this.slot("👥","Клан","скоро","","UIS.setTab('friends')")
      ]);
    } else if(tab==="friends"){
      const addFn="var c=document.getElementById('uiFriendCode').value.trim();if(c){showToast('🤝','Код принят','',c,'друг добавится в сетевой версии');}";
      body='<div class="uiSub">Добавить друга по коду</div>'
        +'<div class="uiRow"><input id="uiFriendCode" class="uiInp wide" placeholder="ORE-XXXX" maxlength="12">'
        +'<button class="btn btn-soft btn-tiny" onclick="'+addFn+'">+</button></div>'
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
    this.$("uiTabs").innerHTML='<button class="btn btn-tab" onclick="UIS.tab=\'pick\';UIS.render(\'artifacts\')">‹ Коллекции</button>';
    const owned=S.stickers||{};
    const slots=STICKERS.filter(s=>s.n&&s.n.length).slice(0,12).map(s=>{
      const c=owned[s.id]||0;
      return this.slot(s.ic,s.n,c?("+"+s.val): "—",c?"r"+s.r:" lock");
    });
    this.$("uiBody").innerHTML=
      '<div class="uiColHead" style="--acc:'+col.c+'"><span>'+col.ic+'</span><b>'+col.n+'</b></div>'
      +this.grid(slots)
      +'<div class="uiBtnStack"><button class="btn btn-hard" onclick="buyStickerPack()">Пак · '+STICKER_PACK_GEMS+' 💎</button>'
      +'<button onclick="giftStickers()">Подарить дубликаты</button></div>';
  },

  renderShop(){
    /* AGENTS 5.13: Офферы · Артефакты · Бочки · Самоцветы · Бесплатные */
    const tab=this.tab||"offers";
    this.$("uiTitle").textContent="Рынок";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">💎 '+fmt(S.gems||0)+'</span>';
    this.$("uiTabs").innerHTML=this.tabs(["offers","art","barrels","gems","free"],
      ["Офферы","Артеф.","Бочки","Самоцв.","Беспл."],tab);
    let body="";
    if(tab==="offers"){
      const sp=BALANCE.growth.starterPack;
      body=(S.growth&&S.growth.starterBought
        ? this.card("✓","Стартовый пак","куплен · D1 payback","")
        : this.card("⚡","Стартовый пак","💎"+sp.gems+" + 🪙"+fmt(sp.gold)+" + 🎒"+sp.bags+" · 2× "+sp.loot2xMin+" мин",
          '<div class="uiSub" style="margin-bottom:6px">разовый · окупается раньше следующего CPI</div>'
          +'<button class="btn btn-hard btn-wide" onclick="buyStarterPack()">$'+sp.price+'</button>'))
      +BALANCE.shop.comeback.slice(0,3).map(([g,gold],i)=>this.card("🎁","Пак "+(i+1)+" · скидка","💎"+g+" + 🪙"+fmt(gold),
        '<button class="btn btn-hard btn-wide" onclick="buyPack('+i+')">$'+[6.99,16.99,24.99][i]+'</button>')).join("")
        +(S.noAds
          ? this.card("✓","Реклама отключена","No-Ads активен","")
          : this.card("🚫","Отключить рекламу","навсегда",
            '<button class="btn btn-hard btn-wide" onclick="buyNoAds()">$'+BALANCE.noAdsPrice+'</button>'));
    } else if(tab==="art"){
      body=this.card("💎","Пак артефактов","5 случайных · "+STICKER_PACK_GEMS+" 💎",
        '<button class="btn btn-hard btn-wide" onclick="buyStickerPack()">Купить пак ×5</button>'
        +'<button class="btn btn-wide" style="margin-top:6px" onclick="UIS.open(\'artifacts\')">К коллекциям</button>');
    } else if(tab==="barrels"){
      body=BALANCE.skillChests.map(ch=>{
        const ok=ch.keyCost?(S.chestKeys||0)>=ch.keyCost:(S.gems||0)>=ch.gemCost;
        const price=ch.keyCost?(ch.keyCost+" 🗝"):(ch.gemCost+" 💎");
        return this.card("🛢",ch.n,ch.cards+" карт · гарантия "+SKILL_RAR[ch.minR]+"+",
          '<button class="btn '+(ch.keyCost?"btn-soft":"btn-hard")+' btn-wide" onclick="openSkillChest(\''+ch.id+'\');UIS.render(\'shop\')" '
          +(ok?"":"disabled")+'>'+price+'</button>');
      }).join("");
    } else if(tab==="gems"){
      const packs=BALANCE.shop.gemPacks;
      const prices=[19.99,59.99,199.99];
      const baseRate=packs[0]/prices[0];
      body=packs.map((g,i)=>{
        const fair=Math.round(prices[i]*baseRate);
        const bonus=Math.max(0,g-fair);
        const pct=i===0?0:(i===1?15:30);
        const sub=i===0
          ? ("базовый пак · "+g+" 💎")
          : ("выгода +"+pct+"% · +"+fmt(bonus)+" 💎 к честной цене");
        return this.card("💎",fmt(g)+" самоцветов",sub,
          '<div class="uiSub" style="margin-bottom:6px">'+(bonus>0?("абсолютная выгода: +"+fmt(bonus)+" 💎"):"без надбавки")+'</div>'
          +'<button class="btn btn-hard btn-wide" onclick="buyGems('+i+')">$'+prices[i]+'</button>');
      }).join("");
    } else {
      if(typeof shopFreeReset==="function") shopFreeReset();
      const taken=(S.shopFree&&S.shopFree.taken)||{};
      const row=(id,title,sub)=>{
        const freeDone=!!taken[id+"_free"], adDone=!!taken[id+"_ad"];
        return this.card("🎁",title,sub,
          '<div class="uiBtnStack">'
          +'<button class="btn btn-soft" onclick="claimShopFree(\''+id+'\',false)" '+(freeDone?"disabled":"")+'>'+(freeDone?"✓ бесплатно":"Бесплатно")+'</button>'
          +'<button class="btn btn-hard" onclick="claimShopFree(\''+id+'\',true)" '+(adDone?"disabled":"")+'>'+(adDone?"✓ реклама":"За рекламу")+'</button>'
          +'</div>');
      };
      body='<div class="uiSub" style="margin-bottom:8px">2 предложения · каждое бесплатно + за рекламу · сброс ежедневно</div>'
        +row("a","Яйцо + расчёска","🥚1 · 🪮1")
        +row("b","Пиво + сумка","🍺40 · 🎒1");
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
  },

  /* Sprint 2: legacy metaModal content → uiScreen panel */
  openPanel(title, sub, html){
    this._lastMeta={title, sub, html};
    this.id="panel";
    this.tab=null;
    this.$("uiTitle").textContent=title;
    this.$("uiHeadAct").innerHTML="";
    this.$("uiTabs").innerHTML="";
    this.$("uiBody").innerHTML=(sub?'<div class="uiSub" style="margin-bottom:10px;line-height:1.6">'+sub+'</div>':"")+html;
    this.show();
  },
  refresh(){
    if(this.id==="panel"&&this._lastMeta){
      this.openPanel(this._lastMeta.title,this._lastMeta.sub,this._lastMeta.html);
    } else if(this.id) this.render(this.id);
  }
};

function modalOpen(){
  const ui=document.getElementById("uiScreen");
  if(ui&&ui.style.display==="flex") return true;
  const m=document.getElementById("metaModal");
  return !!(m&&m.style.display==="flex");
}
function modalBodyHtml(){
  const ui=document.getElementById("uiScreen");
  if(ui&&ui.style.display==="flex") return document.getElementById("uiBody")?.innerHTML||"";
  return document.getElementById("metaBody")?.innerHTML||"";
}
function modalTitleText(){
  const ui=document.getElementById("uiScreen");
  if(ui&&ui.style.display==="flex") return document.getElementById("uiTitle")?.textContent||"";
  return document.getElementById("metaTitle")?.textContent||"";
}
function closeAllPanels(){
  UIS.close();
  const m=document.getElementById("metaModal");
  if(m) m.style.display="none";
}

function uiWire(){
  if($("avatar")) $("avatar").onclick=()=>UIS.open("profile");
  if($("menu")) $("menu").onclick=()=>UIS.open("settings");
  if($("navTavBtn")) $("navTavBtn").onclick=()=>UIS.open("tavern","ale");
  if($("navPvp")) $("navPvp").onclick=()=>UIS.open("pvp");
  if($("navShop")) $("navShop").onclick=()=>UIS.open("shop","offers");
  if($("navSkills")) $("navSkills").onclick=()=>openSkills();
  if($("navMines")) $("navMines").onclick=()=>UIS.open("mines");
  const ml=$("mineLabel");
  if(ml){ ml.style.cursor="pointer"; ml.title="Штольни"; ml.onclick=(e)=>{ if(e&&e.stopPropagation) e.stopPropagation(); UIS.open("mines"); }; }
  const sm=$("statMine");
  if(sm){ sm.style.cursor="pointer"; sm.onclick=()=>UIS.open("mines"); }
}
function uiWrap(name){
  const prev=globalThis[name];
  if(typeof prev!=="function") return;
  globalThis[name]=function(){
    const r=prev.apply(this,arguments);
    if(UIS.id) try{ UIS.refresh(); }catch(e){}
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
openShop=function(tab){ UIS.open("shop", tab||(UIS.id==="shop"?UIS.tab:null)||"offers"); };
openGym=function(){ UIS.open("tavern","feast"); };
openStickers=function(){ UIS.tab=null; UIS.open("artifacts"); };
openBeard=function(){ UIS.open("beards","rank"); };
openProfile=function(){ UIS.open("profile"); Platform.logEvent("profile_view",{}); };

if(typeof metaOpen==="function"){
  metaOpen=function(title,sub,html){ UIS.openPanel(title,sub,html); };
}

["rollPet","mergePet","craftPetExotic","pvpFight","pvpRerollSlate","mergeGeo","buyGems","buyPack","claimDaily",
 "chestOpenOne","chestUpgrade","chestSkip","upSkill","openSkillChest","spinWheel","playEvent","sciAnswer","sciSkip",
 "sciConsent","fuseBoxes","openOneBox","openAllBoxes","upgradeBoxWithStones","skipWorkout","claimWorkout",
 "toggleFair","setFairClient","revealFair","setPlayerName","buyStickerPack","giftStickers","sipAle"].forEach(uiWrap);
