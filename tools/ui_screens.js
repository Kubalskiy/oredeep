/* ============================================================
   UI SHELLS — Boxer-style mobile screens (visual only)
   ============================================================ */
"use strict";

const UI_MINES=[
  {id:0,ic:"🪙",n:"Забой новичка",   sub:"золото · находки",     theme:"t0", rock:"🪨"},
  {id:1,ic:"💠",n:"Эхо-Дум",         sub:"осколки · дубликаты", theme:"t1", rock:"⛰️"},
  {id:2,ic:"🍺",n:"Подгорный Огонь", sub:"пиво · тренировки",   theme:"t2", rock:"🌋"},
  {id:3,ic:"◎", n:"Хрустальные",     sub:"крутки · колесо",     theme:"t3", rock:"🧊"},
  {id:4,ic:"🗝",n:"Бездна",          sub:"ключи · скилл-лари",  theme:"t4", rock:"🗿"}
];

const UI_ART_COLS=[
  {id:"mountain",n:"Гора",ic:"⛰",c:"#e8b93c"},
  {id:"deep",n:"Глубины",ic:"🕳",c:"#5aa7e8"},
  {id:"forge",n:"Кузня",ic:"🔨",c:"#ff8a4a"},
  {id:"tavern",n:"Таверна",ic:"🍺",c:"#7ae8dc"}
];

const UI_TAV_RANKS=[
  {n:"Каменный Кубок",xp:1200},{n:"Медный Кубок",xp:980},{n:"Железный Кубок",xp:760},
  {n:"Серебряный Кубок",xp:540},{n:"Золотой Кубок",xp:320},{n:"Платиновый Кубок",xp:110}
];
const UI_TAV_TIPS=[
  "Борин: эль не для красоты. Пей — копи очки — качай застолье.",
  "Стойка помнит каждого. Уважение (Gym XP) растёт от тренировок, PvP и дейликов.",
  "Тегнутый навык на листе дешевле. А тут — пиво в очки, очки в силу.",
  "Пустой кружки не бывает: +5 🍺/ч капается само, пока ты в забое."
];

/* Фейковый PvP-рейтинг по кубкам (отдельно от Стены Горы по глубине) */
const UI_PVP_BOARD=[
  {n:"Дурин Глубинный", ic:"⛰", t:1180},
  {n:"Мира Рунная",     ic:"✦", t:860},
  {n:"Гром Железозуб",  ic:"🦷", t:640},
  {n:"Борин-Счётчик",   ic:"📐", t:410},
  {n:"Шлак Безбородый", ic:"🪓", t:180},
  {n:"Баба Глыба",      ic:"🪨", t:95},
  {n:"Нори Скупщик",    ic:"💰", t:55}
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
    this.id=null; this.tab=null; this._stack=[]; this._lastMeta=null;
    try{ if(typeof updateFtueHint==="function") updateFtueHint(); }catch(e){}
  },
  /** Назад: из panel/push → предыдущий экран (напр. Союзники); иначе закрыть. */
  back(){
    const prev=(this._stack||[]).pop();
    if(!prev){ this.close(); return; }
    if(prev.kind==="panel"){
      this.openPanel(prev.title, prev.sub, prev.html, true);
      return;
    }
    this.id=prev.id; this.tab=prev.tab||null;
    this.render(this.id); this.show();
  },
  setTab(t){
    this.tab=t;
    if(this.id) this.render(this.id);
  },
  /** Сброс стека — для нижнего навбара и «корневых» входов. */
  open(id, tab){
    this._stack=[];
    this._go(id, tab);
  },
  /** Вложенный переход: назад вернёт на текущий экран (Союзники → Бороды и т.п.). */
  push(id, tab){
    if(this.id && this.id!=="panel"){
      (this._stack=this._stack||[]).push({kind:"screen", id:this.id, tab:this.tab});
    } else if(this.id==="panel" && this._lastMeta){
      (this._stack=this._stack||[]).push({
        kind:"panel", title:this._lastMeta.title, sub:this._lastMeta.sub, html:this._lastMeta.html
      });
    }
    this._go(id, tab);
  },
  _go(id, tab){
    this.id=id; this.tab=tab||null;
    this.render(id); this.show();
    if(typeof S!=="undefined"&&S&&S.ftue){
      if(id==="tavern"&&!S.ftue.t){ S.ftue.t=1; save(); }
      if(id==="profile"&&this.tab==="growth"&&!S.ftue.g){ S.ftue.g=1; save(); }
      try{ if(typeof updateGrowthDot==="function") updateGrowthDot(); }catch(e){}
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
      try{ if(typeof updateGrowthDot==="function") updateGrowthDot(); }catch(e){}
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
      +'<button class="btn btn-soft" onclick="openCharSheet()">🧬 Лист · КРАСАВА</button>'
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
      +this.row("Всплывающие окна",'<button id="uiSetToasts" onclick="toggleToasts();UIS.render(\'settings\')">'+(typeof toastToggleLabel==="function"?toastToggleLabel():(toastsOn?"💬 вкл":"🚫 выкл"))+'</button>')
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
      +' · '+petSkinOf(S.pet).n
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
    this.$("uiTabs").innerHTML=this.tabs(["gacha","merge","ascend","rank","gallery"],
      ["Гача","Слияние","Восхожд.","Ранг","Галерея"],tab);
    let body="";
    const cur=S.geo?('<div class="uiBanner r'+S.geo.r+'">'+S.geo.n
      +((S.geo.asc||0)?' ✦'+S.geo.asc:'')
      +' · +'+geoPct(S.geo).toFixed(0)+'% '+GEO_TYPES[S.geo.t].stat.toUpperCase()+'</div>'):"";
    if(tab==="gacha"){
      body=cur+'<div class="uiGachaStage"><div class="uiGachaEgg">🪮</div></div>'
        +'<div class="uiSub" style="text-align:center;margin:8px 0">Роллов: '+(S.geoRolls||0)+'</div>'
        +'<button class="btn btn-hard btn-wide" onclick="hireGeo();UIS.render(\'beards\')" '+(S.combs<1?"disabled":"")+'>Нанять · 🪮 1</button>';
    } else if(tab==="merge"){
      body=cur+(S.geo
        ? this.card("👷",S.geo.n,"ур. "+(S.geo.lv||1)+" · материал: "+geoMaterials(),
            '<button class="btn btn-soft btn-wide" onclick="mergeGeo();UIS.render(\'beards\')" '+(geoMaterials()<1?"disabled":"")+'>Поглотить дубликаты</button>')
        : '<div class="uiEmpty">Сначала найми бороду на вкладке Гача.</div>');
    } else if(tab==="ascend"){
      const B=BALANCE.merge;
      if(!S.geo){
        body='<div class="uiEmpty">Сначала найми бороду на вкладке Гача.</div>';
      } else {
        const isLeg=S.geo.r===GEO_RAR.length-1;
        const ascOk=canAscendGeo();
        const why=!isLeg ? ("нужен "+GEO_RAR[GEO_RAR.length-1])
          : ((S.geo.lv||1)<B.ascendLv ? ("нужен ур."+B.ascendLv+" (есть "+(S.geo.lv||1)+")")
          : ((S.gems||0)<B.ascendGems ? ("нужно "+B.ascendGems+" 💎 (есть "+fmt(S.gems||0)+")") : ""));
        body=cur+this.card("✦","Восхождение ✦"+((S.geo.asc||0)+1),
          "+"+B.ascendPct+"% к бонусу · уровень сбрасывается в 1 · "+B.ascendGems+" 💎",
          (isLeg
            ? '<button class="btn btn-hard btn-wide" onclick="ascendGeo()" '+(ascOk?"":"disabled")+'>Восхождение · '+B.ascendGems+' 💎</button>'
              +(why?'<div class="uiSub" style="margin-top:8px;color:#e8a24a">'+why+'</div>':"")
            : '<div class="uiEmpty">🔒 Только для '+GEO_RAR[GEO_RAR.length-1]+'. Сливай дубликаты на вкладке Слияние до легендарки.</div>'));
      }
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
    const curAbs=S.mine||0;
    const cur=curAbs%MINES.length;
    const cycle=Math.floor(curAbs/MINES.length)+1;
    const stride=BALANCE.venueStride||50;
    const stage=Math.min(stride, S.stage||1);
    const stagePct=Math.min(100, Math.round(stage/stride*100));
    const depth=S.stageIdx||1;
    const best=S.bestDepth||depth;
    const colOf=id=>Object.keys((S.col&&S.col[id])||{}).length;
    const here=MINES[cur]||{};
    const hereGot=colOf(cur);
    const hereSet=SET_BONUS[cur];
    const totalCol=UI_MINES.reduce((a,m)=>a+colOf(m.id),0);
    const setsDone=UI_MINES.filter(m=>typeof setDone==="function"&&setDone(m.id)).length;

    this.$("uiHeadAct").innerHTML='<span class="uiPill">круг '+cycle+'</span>';
    this.$("uiTabs").innerHTML="";

    const overview=
      '<div class="uiMineHero">'
      +'<div class="uiMineHeroTop">'
      +'<span class="uiMineHeroRock">'+(UI_MINES[cur]&&UI_MINES[cur].rock||"⛏")+'</span>'
      +'<div><b>'+esc((UI_MINES[cur]&&UI_MINES[cur].n)||here.n||"Штольня")+'</b>'
      +'<div class="uiSub">'+(here.n||"")+' · этап '+stage+'/'+stride+'</div></div>'
      +'<span class="uiTag on">здесь</span></div>'
      +this.bar(stagePct)
      +'<div class="uiMineStats">'
      +'<div><span class="k">Глубина</span><b>'+fmt(depth)+'</b></div>'
      +'<div><span class="k">Рекорд</span><b>'+fmt(best)+'</b></div>'
      +'<div><span class="k">Коллекция</span><b>'+hereGot+'/8</b></div>'
      +'<div><span class="k">Сеты</span><b>'+setsDone+'/5</b></div>'
      +'</div>'
      +(hereSet?('<div class="uiSub uiMineSetHint">'+(hereGot>=8?"✓ активен: ":"сет 8/8 → ")+esc(hereSet.label)+'</div>'):"")
      +'</div>';

    const cards=UI_MINES.map(m=>{
      const unlocked=m.id<=cur;
      const hereNow=m.id===cur;
      const got=colOf(m.id);
      const done=typeof setDone==="function"&&setDone(m.id);
      const bonus=SET_BONUS[m.id];
      const mine=MINES[m.id];
      const click=unlocked
        ? ("switchMine("+m.id+");UIS.close();")
        : ("showToast(\"⛏\",\"Закрыто\",\"\",\"Дойди до этого чертога\",\"сейчас "+(cur+1)+"/5 в круге\")");
      const badge=hereNow
        ? '<span class="uiTag on">здесь</span>'
        : (unlocked?'<span class="uiTag go">войти</span>':'<span class="uiTag">🔒</span>');
      const colTxt=done?("✓ сет собран"):("камни "+got+"/8");
      return '<button type="button" class="btn btn-mine uiMineCard '+m.theme
        +(hereNow?" sel":"")+(unlocked?"":" locked")+'" onclick="'+click+'">'
        +'<span class="uiMineIc">'+(m.ic||"⛏")+'</span>'
        +'<div class="uiMineMain">'
        +'<div class="uiMineTop"><b>'+esc(m.n)+'</b>'+badge+'</div>'
        +'<div class="uiSub">'+esc(m.sub)+(mine&&mine.rock?(" · "+mine.rock):"")+'</div>'
        +'<div class="uiMineColRow"><span>'+colTxt+'</span>'
        +(bonus?'<span class="uiMineBonusShort">'+(done?"✓ ":"")+esc((bonus.label||"").split("—")[0].trim())+'</span>':"")
        +'</div>'
        +this.bar(got/8*100, done?"var(--income)":"var(--mc,var(--gold))")
        +'</div></button>';
    }).join("");

    const setStrip='<div class="uiMineStrip">'
      +UI_MINES.map(m=>{
        const got=colOf(m.id);
        const done=typeof setDone==="function"&&setDone(m.id);
        return '<div class="uiMineChip '+m.theme+(done?" done":"")+(m.id===cur?" on":"")+'" title="'+esc(m.n)+'">'
          +'<span>'+m.ic+'</span><b>'+got+'/8</b></div>';
      }).join("")
      +'</div>';

    const foot=
      '<div class="uiSec">Сводка круга</div>'
      +setStrip
      +'<div class="uiSub" style="margin-top:8px">Камней собрано '+totalCol+'/40 · полный сет чертога даёт вечный бонус.</div>'
      +'<div class="uiSub">Чертоги по кругу (5). Внутри круга можно вернуться в уже открытые.</div>';

    this.$("uiBody").innerHTML=overview
      +'<div class="uiSec">Выбор штольни</div>'
      +'<div class="uiMineList">'+cards+'</div>'
      +foot;
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
    const winGold=typeof pvpWinGold==="function"?pvpWinGold(li):(BALANCE.pvp.rewards[li]||0)*100;
    const nextGold=typeof pvpWinGold==="function"?pvpWinGold(nextLi):(BALANCE.pvp.rewards[nextLi]||0)*100;
    const atMax=li>=BALANCE.pvp.names.length-1;
    const leagueSub=atMax
      ? ("макс · победа +" + fmt(winGold) + " 🪙")
      : ("победа +" + fmt(winGold) + " 🪙 · в " + BALANCE.pvp.names[nextLi] + " уже +" + fmt(nextGold) + " 🪙");
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
      +this.card("🏆","Лига: "+BALANCE.pvp.names[li], leagueSub,
        this.bar(pct,"var(--blue)")
        +'<div class="uiSub" style="margin-top:4px">'+(atMax
          ? ("вершина арены · "+fmt(S.trophies||0)+" 🏆")
          : ("до "+BALANCE.pvp.names[nextLi]+": "+fmt(Math.max(0,nextReq-(S.trophies||0)))+" 🏆"))+'</div>'
        +'<div class="uiSub" style="margin-top:4px">попыток '+left+"/"+BALANCE.pvpDayLimit
          +" · твоя добыча ~"+fmt(pvpMineOrePerSec(me))+"/с</div>")
      +'<div class="uiSec">Выбери ИИ-соперника</div>'
      +(left>0?opps:'<div class="uiEmpty" style="color:#e8a24a">Бои на сегодня кончились. Возвращайся завтра.</div>')
      +(left>0?'<button class="btn btn-wide" onclick="pvpRerollSlate();UIS.render(\'pvp\')">Обновить форму дня</button>':'')
      +'<button class="btn btn-hard btn-wide" style="margin-top:8px" onclick="openPvpBoard()">⚔ Рейтинг PvP</button>'
      +'<button class="btn btn-wide" style="margin-top:6px" onclick="openWall()">🏔 Стена Горы</button>';
  },

  renderTavern(){
    const tab=this.tab||"ale";
    const lv=gymLevel(), xp=S.gymXP||0;
    const nextAt=GYM_LEVELS[lv+1], atCur=GYM_LEVELS[lv]||0;
    const gymPct=nextAt!=null?Math.min(100,Math.round((xp-atCur)/(nextAt-atCur)*100)):100;
    const beer=Math.floor(S.protein||0), pts=S.wkPts|0;
    const W=BALANCE.workouts||{}, drinkCost=W.drinkCost||5, drinkPts=W.drinkPts||5;
    const names=(typeof WK_PATH_NAME==="object"&&WK_PATH_NAME)||{};
    const tip=UI_TAV_TIPS[(Math.floor(Date.now()/60000)+lv)%UI_TAV_TIPS.length];
    const facade='<div class="uiTavExt"><div class="uiTavRoof">🍺</div><div class="uiTavSign">'+esc(playerName())+'</div></div>';
    const meters='<div class="uiTavMeters">'
      +'<div class="uiTavMeter"><span class="k">ПИВО</span><span class="v">🍺 '+beer+'</span><span class="s">+'+((W.proteinPerHour)|5)+'/ч</span></div>'
      +'<div class="uiTavMeter"><span class="k">ОЧКИ</span><span class="v">💪 '+pts+'</span><span class="s">из глотков</span></div>'
      +'<div class="uiTavMeter"><span class="k">ЗАЛ</span><span class="v">'+lv+'</span><span class="s">+'+gymPerkPct()+'% статы</span></div>'
      +'</div>';
    const gymCard=this.card("🏋","Уважение · зал ур."+lv,
      fmt(xp)+(nextAt!=null?(" / "+fmt(nextAt)+" XP"):" · макс"),
      this.bar(gymPct)
      +'<div class="uiSub" style="margin-top:4px">Тренировки, PvP, дейлики, дарение артефактов</div>',
      "tav");

    this.$("uiTitle").textContent="Таверна";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">Зал '+lv+' · +'+gymPerkPct()+'%</span>';
    this.$("uiTabs").innerHTML=this.tabs(
      ["ale","feast","mates","friends","rank"],
      ["Стойка","Застолья","Стол","Друзья","Кубки"],
      tab);

    let body="";
    if(tab==="ale"){
      const eCur=Math.floor(S.energy||0), eMax=Math.floor(stat("energy")||1);
      body=facade+meters
        +'<div class="uiTavTip"><b>Борин у стойки.</b> '+esc(tip)+'</div>'
        +this.card("🍺","Выпить кружку",
          "−"+drinkCost+" 🍺 → +"+drinkPts+" очк. тренировок · чуть энергии",
          '<button class="btn btn-hard btn-wide" style="min-height:48px;font-size:15px" onclick="drinkBeer()">Выпить 🍺'+drinkCost+'</button>'
          +'<div class="uiSub" style="margin-top:6px">Энергия '+eCur+'/'+eMax+' · авто-глоток в забое тоже бывает</div>',
          "tav")
        +'<div class="uiBtnStack">'
        +'<button class="btn btn-soft btn-wide" onclick="UIS.setTab(\'feast\')">💪 К застольям</button>'
        +'<button class="btn btn-soft btn-wide" onclick="openCharSheet()">🧬 Лист · навыки</button>'
        +'</div>';
    } else if(tab==="feast"){
      const active=S.wkActive;
      let activeHtml="";
      if(active){
        const left=Math.max(0,Math.ceil((active.end-Date.now())/1000));
        const nm=names[active.path]||active.path;
        activeHtml=this.card("⏱","Идёт: "+nm, left>0?("осталось "+left+"с"):"готово — забери!",
          left>0
            ?('<button class="btn btn-soft btn-wide" onclick="skipWorkout()">Пропуск 💎'+(W.skipGems||5)+'</button>')
            :('<button class="btn btn-hard btn-wide" onclick="claimWorkout()">Забрать награду</button>'),
          "tav");
      }
      const paths=(BALANCE.workoutPaths||[]).slice(0,4).map((p,i)=>{
        const lvP=(S.workouts&&S.workouts[p])||0;
        const cost=typeof workoutCost==="function"?workoutCost(p):((W.costBase||10)+(W.costPerLv||5)*lvP);
        const pct=(BALANCE.workoutStepPct&&BALANCE.workoutStepPct[i])||0;
        const nm=names[p]||p;
        const busy=!!S.wkActive;
        const maxed=lvP>=(W.maxLv||W.step||50);
        const btn=maxed
          ?'<button class="btn btn-soft" disabled>МАКС</button>'
          :(busy
            ?'<button class="btn btn-soft" disabled>занято</button>'
            :'<button class="btn btn-soft" onclick="startWorkout(\''+p+'\')" '+(pts<cost?"disabled":"")+'>💪'+cost+'</button>');
        return '<div class="uiTavPath"><div><b>'+esc(nm)+'</b><div class="uiSub">ур.'+lvP+' · +'+pct+'%/ур · сейчас +'+(typeof workoutBonus==="function"?workoutBonus(p):0)+'%</div></div>'+btn+'</div>';
      }).join("");
      body=meters
        +activeHtml
        +this.card("💪","Застолье",
          "Пиво → очки → путь. Полный список из "+(BALANCE.workoutPaths||[]).length+" путей.",
          '<button class="btn btn-soft btn-wide" onclick="drinkBeer()">Выпить 🍺'+drinkCost+' → +'+drinkPts+' очк.</button>'
          +'<button class="btn btn-hard btn-wide" style="margin-top:8px" onclick="openWorkouts()">Все тренировки</button>',
          "tav")
        +'<div class="uiSec tav">Быстрые пути</div>'
        +'<div class="uiCard tav" style="display:block;padding:4px 8px">'+paths+'</div>'
        +gymCard;
    } else if(tab==="mates"){
      const geoSlot=S.geo
        ? this.slot("💇",S.geo.n,"+"+geoPct(S.geo).toFixed(0)+"%","r"+S.geo.r,"UIS.push('beards','merge')")
        : this.slot("❔","Борода","найми старейшину","","UIS.push('beards','gacha')");
      const petSlot=S.pet
        ? this.slot("🐕",PET_TYPES[S.pet.t].n,PET_RAR[S.pet.r],"r"+S.pet.r,"UIS.push('pets','gacha')")
        : this.slot("❔","Питомец","яйца ждут","","UIS.push('pets','gacha')");
      body=facade
        +'<div class="uiTavTip"><b>Стол компании.</b> Наставник, борода, зверь и будущий клан — кто сидит рядом в забое.</div>'
        +'<div class="uiSec tav">Кто за столом</div>'
        +'<div class="uiGrid tav">'
        +this.slot("🧔","Борин","наставник","","openBorinMentor()")
        +geoSlot+petSlot
        +this.slot("👥","Клан","скоро","","openClanSoon()")
        +'</div>';
    } else if(tab==="friends"){
      const code=(typeof growthInviteCode==="function")?growthInviteCode():"ORE-????";
      const addFn="var c=document.getElementById('uiFriendCode').value.trim();if(c){showToast('🤝','Код принят','',c,'друг добавится в сетевой версии');}";
      body=facade
        +'<div class="uiTavTip"><b>Собутыльники.</b> Пока сеть варится — зови по коду. Рефералы и вехи живут в профиле.</div>'
        +this.card("🤝","Код друга","введи чужой — или отдай свой",
          '<div class="uiRow" style="border:0;padding:6px 0"><input id="uiFriendCode" class="uiInp wide" placeholder="ORE-XXXX" maxlength="12" style="max-width:100%">'
          +'<button class="btn btn-soft btn-tiny" onclick="'+addFn+'">+</button></div>'
          +'<div class="uiSub">Твой код роста: <b style="color:var(--gold)">'+esc(code)+'</b></div>',
          "tav")
        +'<div class="uiBtnStack">'
        +'<button class="btn btn-hard btn-wide" onclick="UIS.open(\'profile\',\'growth\')">👥 Рефералы и вехи</button>'
        +(typeof shareInvite==="function"
          ?'<button class="btn btn-soft btn-wide" onclick="shareInvite()">Поделиться ссылкой</button>':"")
        +'</div>'
        +'<div class="uiEmpty" style="padding:16px 8px">Список собутыльников онлайн — в сетевой версии.</div>';
    } else {
      /* Кубки: игрок вставлен в таблицу по Gym XP */
      const mine={n:playerName(), xp:xp, me:true};
      const board=UI_TAV_RANKS.map(t=>({n:t.n, xp:t.xp, me:false})).concat([mine])
        .sort((a,b)=>b.xp-a.xp);
      const rows=board.map((t,i)=>
        '<div class="uiRankRow'+(t.me?" me":"")+'"><span class="uiRankN">'+(i+1)+'</span><b>'
        +esc(t.n)+(t.me?" · ты":"")+'</b><span class="uiSub">'+fmt(t.xp)+' XP</span></div>'
      ).join("");
      const nextPerk=GYM_PERKS.find(pk=>lv<pk.lv);
      body=facade+gymCard
        +'<div class="uiSec tav">Рейтинг таверн</div>'
        +rows
        +'<div class="uiSub" style="margin-top:8px;text-align:center">'
        +(nextPerk
          ?('Следующий перк зала: «'+nextPerk.n+'» (+'+nextPerk.pct+'%) с ур.'+nextPerk.lv)
          :'Перки зала на максимуме')
        +'</div>';
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
        +this.grid(UI_ART_COLS.map(c=>{
          const p=typeof stickerColProgress==="function"?stickerColProgress(c.id):{have:0,total:0};
          return '<button class="uiColPick" style="--acc:'+c.c+'" onclick="UIS.tab=\''+c.id+'\';UIS.render(\'artifacts\')">'
            +'<span class="uiColEm">'+c.ic+'</span><b>'+c.n+'</b>'
            +'<span class="uiSub">'+p.have+'/'+p.total+'</span></button>';
        }));
      return;
    }
    const col=UI_ART_COLS.find(c=>c.id===tab)||UI_ART_COLS[0];
    this.$("uiTabs").innerHTML='<button class="btn btn-tab" onclick="UIS.tab=\'pick\';UIS.render(\'artifacts\')">‹ Коллекции</button>';
    const owned=S.stickers||{};
    const list=typeof stickersInCol==="function"?stickersInCol(col.id):STICKERS.filter(s=>s.col===col.id);
    const slots=list.map(s=>{
      const c=owned[s.id]||0;
      return this.slot(s.ic,s.n,c?("+"+s.val): "—",c?"r"+s.r:" lock");
    });
    const prog=typeof stickerColProgress==="function"?stickerColProgress(col.id):{have:0,total:list.length};
    this.$("uiBody").innerHTML=
      '<div class="uiColHead" style="--acc:'+col.c+'"><span>'+col.ic+'</span><b>'+col.n+'</b>'
      +'<span class="uiSub" style="margin-left:8px">'+prog.have+'/'+prog.total+'</span></div>'
      +(slots.length?this.grid(slots):'<div class="uiEmpty">В этой коллекции пока пусто</div>')
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
  openPanel(title, sub, html, silent){
    if(!silent && this.id && this.id!=="panel"){
      (this._stack=this._stack||[]).push({kind:"screen", id:this.id, tab:this.tab});
    }
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
      this.openPanel(this._lastMeta.title,this._lastMeta.sub,this._lastMeta.html, true);
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
  if($("navSkills")) $("navSkills").onclick=()=>openCharSheet();
  if($("navMines")) $("navMines").onclick=()=>UIS.open("mines");
  const ml=$("mineLabel");
  if(ml){ ml.style.cursor="pointer"; ml.title="Штольни"; ml.onclick=(e)=>{ if(e&&e.stopPropagation) e.stopPropagation(); UIS.open("mines"); }; }
  const sm=$("statMine");
  if(sm){ sm.style.cursor="pointer"; sm.onclick=()=>UIS.open("mines"); }
  const rank=$("statMinerCell")||$("statMiner");
  if(rank){
    rank.style.cursor="pointer";
    rank.title="Бороды · звание";
    rank.onclick=()=>UIS.open("beards","rank");
  }
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
openBeard=function(tab){ UIS.open("beards", tab||(UIS.id==="beards"?UIS.tab:null)||"rank"); };
openProfile=function(){ UIS.open("profile"); Platform.logEvent("profile_view",{}); };
openGeoGuild=function(){ UIS.open("beards", S.geo && S.geo.r===GEO_RAR.length-1 ? "ascend" : "merge"); };

/** Наставник из Союзников — своя карточка, не вкладка Застолья/Устав. */
function openBorinMentor(){
  const w=typeof beardWisdom==="function"?beardWisdom():{title:"—",goldPct:0,luckAdd:0};
  UIS.openPanel("Борин · наставник",
    "Старый дворф у стойки. Учит рангу бороды и следит, чтобы ты не забыл, зачем спустился в Гору.",
    '<div class="uiCard"><div class="uiCardIc">🧔</div><div class="uiCardBody"><b>'+esc(w.title)+'</b>'
    +'<div class="uiSub">+'+w.goldPct+'% доход · +'+Number(w.luckAdd||0).toFixed(1)+' LUCK</div></div></div>'
    +'<div class="uiBtnStack" style="margin-top:10px">'
    +'<button class="btn btn-hard btn-wide" onclick="UIS.push(\'beards\',\'rank\')">Мудрость Бороды</button>'
    +'</div>');
}
/** Клан из Союзников — заглушка, не вкладка Друзья. */
function openClanSoon(){
  UIS.openPanel("Клан",
    "Артель дворфов: общий забой, чат и войны кланов.",
    '<div class="uiEmpty">👥 Скоро — в сетевой версии</div>'
    +'<div class="uiSub" style="margin-top:8px;text-align:center">Пока зови друзей по коду во вкладке «Друзья» таверны.</div>');
}

if(typeof metaOpen==="function"){
  metaOpen=function(title,sub,html){ UIS.openPanel(title,sub,html); };
}

["rollPet","mergePet","craftPetExotic","pvpFight","pvpRerollSlate","mergeGeo","ascendGeo","hireGeo","buyGems","buyPack","claimDaily",
 "chestOpenOne","chestUpgrade","chestSkip","upSkill","openSkillChest","spinWheel","playEvent","sciAnswer","sciSkip",
 "sciConsent","fuseBoxes","openOneBox","openAllBoxes","upgradeBoxWithStones","skipWorkout","claimWorkout","startWorkout","drinkBeer",
 "toggleFair","setFairClient","revealFair","setPlayerName","buyStickerPack","giftStickers","sipAle"].forEach(uiWrap);
