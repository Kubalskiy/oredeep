/* ============================================================
   UI SHELLS — Boxer-style mobile screens (visual only)
   ============================================================ */
"use strict";

const UI_MINES=[
  {id:0,ic:"🎒",n:"Забой новичка",   sub:"особый камень → сумки",     theme:"t0", rock:"🪨", raidRes:"bags"},
  {id:1,ic:"💎",n:"Эхо-Дум",         sub:"особый камень → самоцветы", theme:"t1", rock:"⛰️", raidRes:"gems"},
  {id:2,ic:"🥚",n:"Подгорный Огонь", sub:"особый камень → яйца",      theme:"t2", rock:"🌋", raidRes:"eggs"},
  {id:3,ic:"🪮",n:"Хрустальные",     sub:"особый камень → расчёски",  theme:"t3", rock:"🧊", raidRes:"combs"},
  {id:4,ic:"🍺",n:"Бездна",          sub:"особый камень → пиво",      theme:"t4", rock:"🗿", raidRes:"protein"}
];

const UI_ART_COLS=[
  {id:"mountain",n:"Гора",   ic:'<img class="uiColArt" src="art/ic_col_mountain.png" alt="">',c:"#e8b93c"},
  {id:"deep",    n:"Глубины",ic:'<img class="uiColArt" src="art/ic_col_deep.png" alt="">',    c:"#5aa7e8"},
  {id:"forge",   n:"Кузня",  ic:'<img class="uiColArt" src="art/ic_col_forge.png" alt="">',   c:"#ff8a4a"},
  {id:"tavern",  n:"Таверна",ic:'<img class="uiColArt" src="art/ic_col_tavern.png" alt="">',  c:"#7ae8dc"}
];

const UI_TAV_RANKS=[
  {n:"Каменный Кубок",xp:1200},{n:"Медный Кубок",xp:980},{n:"Железный Кубок",xp:760},
  {n:"Серебряный Кубок",xp:540},{n:"Золотой Кубок",xp:320},{n:"Платиновый Кубок",xp:110}
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
    el.dataset.scr=this.id||"";   // фоновая живопись экрана подбирается по id
    if(el.classList) el.classList.add("open");
    this.setChrome(true);
    try{ if(typeof syncBottomNav==="function") syncBottomNav(); }catch(e){}
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
    try{ if(typeof _skillsShellTab!=="undefined") _skillsShellTab=null; }catch(e){}
    try{ if(typeof syncBottomNav==="function") syncBottomNav(); }catch(e){}
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
    if(typeof requireFeat==="function"){
      const feat=typeof FEAT_SCREEN!=="undefined"?FEAT_SCREEN[id]:null;
      if(feat && !requireFeat(feat)) return;
      if(id==="profile" && tab==="growth" && !featUnlocked("social")){
        featLockToast("social");
        tab="main";
      }
    }
    /* Уход с листа навыков — снять маркер, иначе подсветка Навыков залипнет */
    if(id!=="panel"){
      try{ if(typeof _skillsShellTab!=="undefined") _skillsShellTab=null; }catch(e){}
    }
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
    const rarRU=["Обычная","Редкая","Эпическая","Легендарная"];
    this.$("uiTitle").textContent="Бороды";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">🪮 '+(S.combs||0)+'</span>';
    this.$("uiTabs").innerHTML=this.tabs(["gacha","merge","ascend","rank","gallery"],
      ["Гача","Слияние","Восхожд.","Ранг","Галерея"],tab);

    const w=(typeof beardWisdom==="function")?beardWisdom():{lv:0,goldPct:0,luckAdd:0,title:"—"};
    const enMax=(typeof stat==="function")?Math.max(1,stat("energy")|0):1;
    const enCur=Math.max(0,Math.min(enMax,(S.energy!=null?S.energy:enMax)|0));
    const enPct=enMax?Math.round(enCur/enMax*100):0;

    const cur=S.geo?('<div class="uiBanner r'+S.geo.r+'">'+S.geo.n
      +((S.geo.asc||0)?' ✦'+S.geo.asc:'')
      +' · +'+geoPct(S.geo).toFixed(0)+'% '+(typeof statLbl==="function"?statLbl(GEO_TYPES[S.geo.t].stat):GEO_TYPES[S.geo.t].stat)+'</div>'):"";

    const rolls=S.geoRolls||0;
    const pityXs=(BALANCE.geo&&BALANCE.geo.pityX)||[];
    let pityI=0; while(pityI<pityXs.length-1 && rolls>=pityXs[pityI+1]) pityI++;
    const pityX0=pityXs[pityI]??0, pityX1=pityXs[Math.min(pityI+1,pityXs.length-1)]??pityX0;
    const pityPct=(pityX1===pityX0)?100:Math.max(0,Math.min(100,Math.round((rolls-pityX0)/(pityX1-pityX0)*100)));
    const geoW=(typeof geoWeights==="function")?geoWeights(rolls):[25,25,25,25];
    const geoWSum=geoW.reduce((a,b)=>a+b,0)||1;
    const geoOddsPct=geoW.map(v=>v/geoWSum*100);

    let body="";
    const healthLine='<div class="uiSub" style="margin-top:8px;color:var(--dim);line-height:1.35">' +
      'Энергия убывает в забое (каждый «выстрел» породы её сжигает). ' +
      'Чтобы борода росла без пауз — держи энергию в зелёной зоне: пей 🍺 и качай Реген/Защиту.</div>';

    if(tab==="gacha"){
      body=cur
        +this.card("🪮","Жалость Горы","Шансы на редкость растут по числу роллов",
          '<div class="uiSub" style="margin-bottom:6px">Роллов: '+rolls+' · порог: '+pityX1+' → Leg ~'+geoOddsPct[3].toFixed(2)+'%</div>' +
          this.bar(pityPct) +
          rarRU.map((nm,i)=>this.row(nm,'~'+geoOddsPct[i].toFixed(2)+'%')).join("")
        )
        +'<div class="uiGachaStage"><img class="uiGachaArt" src="art/ic_beard.png" alt=""></div>'
        +'<button class="btn btn-hard btn-wide" onclick="hireGeo();UIS.render(\'beards\')" '+(S.combs<1?"disabled":"")+'>Нанять · 🪮 1</button>'
        +'<div class="uiSub" style="text-align:center;margin:8px 0">Энергия: '+enCur+' / '+enMax+' ('+enPct+'%)</div>'
        +healthLine;
    } else if(tab==="merge"){
      if(!S.geo){
        body='<div class="uiEmpty">Сначала найми бороду на вкладке Гача.</div>';
      } else {
        const total=geoMaterials();
        const counts=[0,0,0,0];
        for(const k in (S.geoBox||{})){
          if(!S.geoBox[k]) continue;
          const r=Number(k.split("_")[1]);
          if(r<=S.geo.r) counts[r]=(counts[r]||0)+S.geoBox[k];
        }
        const newLv=(S.geo.lv||1)+total;
        body=cur
          +this.card("👷",S.geo.n,"ур. "+(S.geo.lv||1)+" → после слияния ур. "+newLv+" · материал: "+total,
            rarRU.map((nm,r)=>this.row(nm, String(counts[r]||0))).join("")
            +'<div class="uiSub" style="margin-top:6px">Кормятся материалы редкости ≤ '+rarRU[S.geo.r]+'.</div>'
            +'<button class="btn btn-soft btn-wide" onclick="mergeGeo();UIS.render(\'beards\')" '+(total<1?"disabled":"")+'>Поглотить дубликаты</button>'
          )
          +healthLine;
      }
    } else if(tab==="ascend"){
      const B=BALANCE.merge;
      if(!S.geo){
        body='<div class="uiEmpty">Сначала найми бороду на вкладке Гача.</div>';
      } else {
        const isLeg=S.geo.r===GEO_RAR.length-1;
        const ascOk=canAscendGeo();
        const lv=(S.geo.lv||1);
        const lvOk=lv>=B.ascendLv;
        const gemsHave=S.gems||0;
        const gemsOk=gemsHave>=B.ascendGems;
        const why=!isLeg ? ("нужен "+GEO_RAR[GEO_RAR.length-1])
          : (!lvOk ? ("нужен ур."+B.ascendLv+" (есть "+lv+")")
          : (!gemsOk ? ("нужно "+B.ascendGems+" 💎 (есть "+fmt(gemsHave)+")") : ""));
        const lvPct=isLeg?Math.min(100,Math.round(lv/B.ascendLv*100)):0;
        const gemsPct=isLeg?Math.min(100,Math.round(gemsHave/B.ascendGems*100)):0;
        const afterPct=geoPct({t:S.geo.t,r:S.geo.r,lv:1,asc:(S.geo.asc||0)+1});
        const ascStep=(S.geo.asc||0)+1;
        body=cur+this.card("✦","Восхождение ✦"+ascStep,
          "+"+B.ascendPct+"% к бонусу · уровень сбрасывается в 1 · "+B.ascendGems+" 💎",
          (isLeg
            ? '<div class="uiSub">Прогресс: уровень '+lv+'/'+B.ascendLv+'</div>' + this.bar(lvPct) +
              '<div class="uiSub" style="margin-top:6px">Гемы: '+fmt(gemsHave)+' / '+fmt(B.ascendGems)+'</div>' + this.bar(gemsPct) +
              '<div class="uiSub" style="margin-top:8px">После восхождения: ~'+afterPct.toFixed(0)+'% '+GEO_TYPES[S.geo.t].stat.toUpperCase()+'</div>' +
              '<button class="btn btn-hard btn-wide" onclick="ascendGeo()" '+(ascOk?"":"disabled")+'>Восхождение · '+B.ascendGems+' 💎</button>'
              +(why?'<div class="uiSub" style="margin-top:8px;color:#e8a24a">'+why+'</div>':"")
            : '<div class="uiEmpty">🔒 Только для '+GEO_RAR[GEO_RAR.length-1]+'. Сливай дубликаты на вкладке Слияние до легендарки.</div>'));
      }
    } else if(tab==="rank"){
      const need=beardNextXP(w.lv), have=S.beardXP||0;
      const maxLv=BEARD_RANKS.length-1;
      const pct=w.lv>=maxLv?100:Math.min(100,Math.round(have/need*100));
      const remXp=Math.max(0,need-have);
      const untilVeins=Math.ceil(remXp/2);
      const untilBoss=Math.ceil(remXp/12);
      const nextRank=Math.min(maxLv,w.lv+1);
      const nextGold=nextRank*3, nextLuck=nextRank*0.4;
      body=cur+this.card("🧔",w.title,
        "+"+w.goldPct+"% доход · +"+w.luckAdd.toFixed(1)+" удачи",
        this.bar(pct) +
        '<div class="uiSub" style="margin-top:6px">'+(w.lv>=maxLv?"МАКСИМУМ":fmt(have)+" / "+fmt(need)+" XP · осталось "+fmt(remXp)+" XP")+'</div>' +
        '<div class="uiSub" style="margin-top:8px">Рост ранга: +2 XP за обычную жилу, +12 XP за босса.</div>' +
        '<div class="uiSub" style="margin-top:6px;color:#e8a24a">До следующего ранга: ~'+untilVeins+' жил или ~'+untilBoss+' босса.</div>'
      )
      +this.card("⚙️","Сложность & токеномика",
        "бороды = гем-сток + фарм частоты (энергия)",
        '<div class="uiSub">Твой бонус к доходу растёт с рангом, а восхождение старейшины тратит гемы: '+BALANCE.merge.ascendGems+'💎 за ступень.</div>' +
        '<div class="uiSub" style="margin-top:8px">Главное топливо прогресса — не гемы, а частота забоя: если энергия упадёт в ноль, ты остановишься.</div>' +
        '<div class="uiSub" style="margin-top:8px">Держи Энергию: сейчас '+enCur+'/'+enMax+' ('+enPct+'%).</div>' +
        healthLine
      );
    } else {
      const totalGeoMats=Object.values(S.geoBox||{}).reduce((a,b)=>a+(b||0),0);
      const curT=S.geo?S.geo.t:null;
      const dealTxt=S.geo
        ? (S.geo.n+" · "+rarRU[S.geo.r]+" · ур."+(S.geo.lv||1)+(S.geo.asc||0?(" ✦"+S.geo.asc):""))
        : "пока никого";
      const FAMILY_LORE={
        atk:"Дворф учится бить точнее: атака растёт — и забой быстрее отдаёт жилу.",
        energy:"Знахарки не «лечат» магией — они не дают энергии падать слишком быстро.",
        stone:"Счёт камням ведут с уважением: больше жадности — жирнее награда."
      };

      body=cur
        +this.card("📚","Галерея старейшин","Коллекция расчёсочных материалов · всего в запасе: "+totalGeoMats,
          '<div class="uiSub">В деле: '+dealTxt+'</div>' +
          '<div class="uiSub" style="margin-top:8px">Старейшины — это твоя артель. Один в работе, остальные копятся в запасе как дубликаты.</div>' +
          '<div class="uiSub" style="margin-top:8px">Как читается дорога: роллы 🪮 дают либо нового старейшину в дело, либо материалы редкости ≤ твоей.</div>' +
          '<div class="uiSub" style="margin-top:8px">Слияние превращает дубликаты в уровень и жирит бонус. Восхождение на Легендарной — гем-сток за «ступень ✦».</div>' +
          '<div class="uiSub" style="margin-top:8px;color:#e8a24a">Лор-напоминание: энергия убывает в забое — держи её зелёной зоной, иначе рост встанет.</div>'
        )
        +this.grid(GEO_TYPES.map((g,i)=>{
          let bestR=-1, cnt=0;
          for(const k in (S.geoBox||{})){
            if(!S.geoBox[k]) continue;
            const [t,r]=k.split("_").map(Number);
            if(t!==i) continue;
            cnt+=(S.geoBox[k]||0);
            if(r>bestR) bestR=r;
          }
          const inDeal = !!S.geo && S.geo.t===i;
          if(inDeal) bestR=(S.geo.r||bestR);
          const sub=inDeal
            ? ("в деле · "+(bestR>=0?rarRU[bestR]:"")+" · ур."+(S.geo.lv||1)+(S.geo.asc||0?(" ✦"+S.geo.asc):"")+
              " · +"+Math.round(geoPct(S.geo))+"%")
            : (bestR>=0
              ? ("в сундуке · "+rarRU[bestR]+" · +"+(GEO_TYPES[i].pct[bestR]||0)+"% (lv1) · дубликатов "+cnt)
              : "пока пусто · нанять на «Гача»");
          const cls=(bestR>=0||inDeal?"":"lock");
          return this.slot("💇",g.names[0],g.stat.toUpperCase(),
            sub+(bestR>=0?(" · "+FAMILY_LORE[g.stat]):""), cls);
        }));
    }
    this.$("uiBody").innerHTML=body;
  },

  renderMines(){
    this.$("uiTitle").textContent="Штольни";
    if(typeof mineRaidReset==="function") mineRaidReset();
    const curAbs=S.mine||0;
    const cur=curAbs%MINES.length;
    const cycle=Math.floor(curAbs/MINES.length)+1;
    const fibArr=(typeof mineRaidFib==="function"?mineRaidFib():null)||(BALANCE.mineRaid&&BALANCE.mineRaid.fib)||[1,1,2,3,5,8,13];
    const unitSec=(BALANCE.mineRaid&&BALANCE.mineRaid.timerUnitSec)||1800;
    const raidOn=!!S.mineRaid;
    const raidDef=typeof mineRaidDef==="function"?mineRaidDef(cur):null;
    const slot=typeof mineRaidSlot==="function"?mineRaidSlot(cur):{step:0,ready:true,done:false,fib:1,leftMs:0,max:fibArr.length};
    const raidAmt=raidDef&&typeof mineRaidRewardAmt==="function"?mineRaidRewardAmt(raidDef, slot.step):0;
    const colOf=id=>Object.keys((S.col&&S.col[id])||{}).length;
    const here=MINES[cur]||{};
    const hereGot=colOf(cur);
    const hereSet=SET_BONUS[cur];
    const totalCol=UI_MINES.reduce((a,m)=>a+colOf(m.id),0);
    const setsDone=UI_MINES.filter(m=>typeof setDone==="function"&&setDone(m.id)).length;
    const fibLine=fibArr.map((n,i)=>'<span class="'+(i<slot.step?"done":(i===slot.step?"on":""))+'">'+n+'</span>').join(" → ");

    this.$("uiHeadAct").innerHTML='<span class="uiPill">круг '+cycle+'</span>';
    this.$("uiTabs").innerHTML="";

    const how=
      '<div class="uiMineHow">'
      +'<b>Как это работает</b>'
      +'<div class="uiSub">Особый камень выдаётся <b>по нарастающей</b>: и пауза, и награда — <b>Фибоначчи</b> ('+fibArr.join(", ")+'). Единица таймера — '+(unitSec>=3600?(unitSec/3600)+"ч":(unitSec/60)+"м")+' · F. У каждого чертога свой ряд ступеней на день.</div>'
      +'<div class="uiMineFib">'+fibLine+'</div>'
      +'</div>';

    let raidCta;
    if(raidOn){
      const snap=S.mineRaid;
      raidCta='<div class="uiMineRaid on">'
        +'<div class="uiMineRaidTop"><span>'+(snap.ic||"🔑")+'</span><div><b>Особый камень активен</b>'
        +'<div class="uiSub">'+esc(snap.n||"награда")+' · +'+(snap.amt|0)+' '+(snap.label||snap.ic||"")+' · ×'+(snap.fib||1)
        +' · вернись в шахту и разбей</div></div></div>'
        +'<button type="button" class="btn btn-cta" onclick="UIS.close()">К камню</button></div>';
    } else if(slot.ready){
      raidCta='<div class="uiMineRaid">'
        +'<div class="uiMineRaidTop"><span>'+(raidDef&&raidDef.ic||"🔑")+'</span><div><b>Ступень '+(slot.step+1)+'/'+slot.max+' · ×'+slot.fib+'</b>'
        +'<div class="uiSub">награда: '+raidAmt+' '+(raidDef&&(raidDef.label||raidDef.n)||"")+'</div></div></div>'
        +'<button type="button" class="btn btn-cta" onclick="startMineRaid('+cur+')">Разбить особый камень</button></div>';
    } else if(slot.done){
      raidCta='<div class="uiMineRaid empty">'
        +'<div class="uiSub">Все '+slot.max+' ступеней Фибоначчи за сегодня пройдены. Завтра снова с ×1.</div></div>';
    } else {
      raidCta='<div class="uiMineRaid empty">'
        +'<div class="uiMineRaidTop"><span>⏱</span><div><b>До ступени '+(slot.step+1)+' · ×'+slot.fib+'</b>'
        +'<div class="uiSub">осталось '+fmtClock(slot.leftMs)+' · награда ~'+raidAmt+' '+(raidDef&&raidDef.ic||"")+'</div></div></div></div>';
    }

    const overview=
      '<div class="uiMineHero">'
      +'<div class="uiMineHeroTop">'
      +'<span class="uiMineHeroRock">'+(UI_MINES[cur]&&UI_MINES[cur].rock||"⛏")+'</span>'
      +'<div><b>'+esc((UI_MINES[cur]&&UI_MINES[cur].n)||here.n||"Штольня")+'</b>'
      +'<div class="uiSub">'+(here.n||"")+' · ты здесь</div></div>'
      +'<span class="uiTag on">здесь</span></div>'
      +'<div class="uiMineStats">'
      +'<div><span class="k">Ступень</span><b>'+Math.min(slot.step+1,slot.max)+'/'+slot.max+'</b></div>'
      +'<div><span class="k">Множитель</span><b>×'+slot.fib+'</b></div>'
      +'<div><span class="k">Коллекция</span><b>'+hereGot+'/8</b></div>'
      +'<div><span class="k">Круг</span><b>'+cycle+'</b></div>'
      +'</div>'
      +(hereSet?('<div class="uiSub uiMineSetHint">'+(hereGot>=8?"✓ активен: ":"сет 8/8 → ")+esc(hereSet.label)+'</div>'):"")
      +'</div>';

    const cards=UI_MINES.map(m=>{
      const unlocked=m.id<=cur;
      const hereNow=m.id===cur;
      const got=colOf(m.id);
      const doneSet=typeof setDone==="function"&&setDone(m.id);
      const bonus=SET_BONUS[m.id];
      const def=typeof mineRaidDef==="function"?mineRaidDef(m.id):null;
      const sl=typeof mineRaidSlot==="function"?mineRaidSlot(m.id):{step:0,ready:false,done:true,fib:1,leftMs:0,max:fibArr.length};
      const amt=def&&typeof mineRaidRewardAmt==="function"?mineRaidRewardAmt(def, sl.step):0;
      const enterClick=unlocked
        ? ("switchMine("+m.id+");UIS.open(\"mines\");")
        : ("showToast(\"⛏\",\"Закрыто\",\"\",\"Дойди до этого чертога\",\"сейчас "+(cur+1)+"/5 в круге\")");
      const raidClick=unlocked
        ? ("startMineRaid("+m.id+")")
        : ("showToast(\"⛏\",\"Закрыто\",\"\",\"Дойди до этого чертога\",\"сейчас "+(cur+1)+"/5 в круге\")");
      const badge=hereNow
        ? '<span class="uiTag on">здесь</span>'
        : (unlocked?'<span class="uiTag go">войти</span>':'<span class="uiTag">🔒</span>');
      const statusPill=sl.done
        ? '<span class="uiPill">готово</span>'
        : (sl.ready
          ? '<span class="uiPill">×'+sl.fib+' гот.</span>'
          : '<span class="uiPill">⏱ '+fmtClock(sl.leftMs)+'</span>');
      let raidBtn="";
      if(unlocked && raidOn && (S.mineRaid.mineId|0)===m.id){
        raidBtn='<div class="uiSub">идёт особый камень · ×'+(S.mineRaid.fib||1)+'</div>';
      } else if(unlocked && sl.ready && !raidOn){
        raidBtn='<button type="button" class="btn uiMineRaidBtn" onclick="event.stopPropagation();'+raidClick+'">Ступень '+(sl.step+1)+' · ×'+sl.fib+' → +'+amt+' '+(def&&def.ic||"")+'</button>';
      } else if(unlocked && !sl.done && !sl.ready){
        raidBtn='<div class="uiSub">далее ×'+sl.fib+' через '+fmtClock(sl.leftMs)+'</div>';
      } else if(unlocked && sl.done){
        raidBtn='<div class="uiSub">ряд Фибоначчи на сегодня закрыт</div>';
      }
      return '<div class="uiMineCard '+m.theme+(hereNow?" sel":"")+(unlocked?"":" locked")+'">'
        +'<button type="button" class="btn btn-mine uiMineEnter" onclick="'+enterClick+'">'
        +'<span class="uiMineIc">'+(m.ic||"⛏")+'</span>'
        +'<div class="uiMineMain">'
        +'<div class="uiMineTop"><b>'+esc(m.n)+'</b>'+badge+'</div>'
        +'<div class="uiSub">'+esc(m.sub)+'</div>'
        +'<div class="uiMineColRow"><span>камни '+got+'/8'+(doneSet?" ✓":"")+'</span>'+statusPill+'</div>'
        +(bonus?'<div class="uiMineBonusShort">'+(doneSet?"✓ ":"")+esc((bonus.label||"").split("—")[0].trim())+'</div>':"")
        +'</div></button>'
        +raidBtn
        +'</div>';
    }).join("");

    const setStrip='<div class="uiMineStrip">'
      +UI_MINES.map(m=>{
        const sl=typeof mineRaidSlot==="function"?mineRaidSlot(m.id):{fib:1,ready:false,done:true};
        const doneSet=typeof setDone==="function"&&setDone(m.id);
        const lab=sl.done?"✓":(sl.ready?"×"+sl.fib:("⏱"));
        return '<div class="uiMineChip '+m.theme+(doneSet?" done":"")+(m.id===cur?" on":"")+'" title="'+esc(m.n)+'">'
          +'<span>'+m.ic+'</span><b>'+lab+'</b></div>';
      }).join("")
      +'</div>';

    const foot=
      '<div class="uiSec">Ступени по чертогам</div>'
      +setStrip
      +'<div class="uiSub" style="margin-top:8px">Камней коллекции '+totalCol+'/40. Обычная добыча отдельно; особый камень — Фибоначчи-лестница.</div>';

    this.$("uiBody").innerHTML=how+overview+raidCta
      +'<div class="uiSec">Пять чертогов</div>'
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
        +'<div class="uiSub">'+esc(o.tag||"ИИ")+' · сила арены '+fmt(o.power)+' · ~'+fmt(pvpMineOrePerSec(o.power))+'/с</div>'
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
    const W=BALANCE.workouts||{};
    const mug=typeof mugTier==="function"?mugTier():{mul:1,max:true,next:null};
    const drinkCost=typeof mugDrinkCost==="function"?mugDrinkCost():(W.drinkCost||5);
    const drinkPts=typeof mugDrinkPts==="function"?mugDrinkPts():(W.drinkPts||5);
    const names=(typeof WK_PATH_NAME==="object"&&WK_PATH_NAME)||{};
    const talk=(typeof borinBarTalk==="function")
      ? borinBarTalk()
      : {tag:"Борин у стойки.", text:"Пиво не для красоты. Пей — копи очки — качай застолье."};
    /* Пиксель-арт «стена Бреттос»: подсвеченные цветные бутылки на полках,
       фонарь, бочки и Борин за стойкой. Сетка 240×80, рисуем rect'ами. */
    const TAV_COLS=["#f0a028","#4a8ce0","#f4cc42","#58c04c","#e0503c","#9a62d8","#46c8c8","#f07830"];
    let tavBtls="";
    [[10,94],[140,224]].forEach((u,ui)=>{
      [8,24,40].forEach((y,ri)=>{
        for(let x=u[0],i=0;x<=u[1];x+=9,i++)
          tavBtls+='<use href="#tavBtl" x="'+x+'" y="'+y+'" fill="'+TAV_COLS[(i+ri*3+ui*5)%TAV_COLS.length]+'"/>';
      });
    });
    const facade='<div class="uiTavExt">'
      +'<svg class="uiTavArt" viewBox="0 0 240 80" preserveAspectRatio="none" aria-hidden="true">'
      +'<defs>'
      +'<g id="tavBtl"><rect x="0" y="3" width="5" height="7"/><rect x="1" y="0" width="3" height="3" fill="#241a12"/><rect x="1" y="4" width="1" height="5" fill="#ffffff59"/></g>'
      +'<radialGradient id="tavGlow"><stop offset="0%" stop-color="#ffe2a0c8"/><stop offset="35%" stop-color="#f2b45f3d"/><stop offset="100%" stop-color="#f2b45f00"/></radialGradient>'
      +'<radialGradient id="tavVig"><stop offset="0%" stop-color="#00000000"/><stop offset="62%" stop-color="#00000000"/><stop offset="100%" stop-color="#000000c9"/></radialGradient>'
      +'<linearGradient id="tavBarG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8a5a2c"/><stop offset="55%" stop-color="#4a2b14"/><stop offset="100%" stop-color="#1c0f08"/></linearGradient>'
      +'</defs>'
      +'<g shape-rendering="crispEdges">'
      +'<rect width="240" height="80" fill="#160e08"/>'
      +'<rect x="0" y="21" width="240" height="1" fill="#0c0805"/><rect x="0" y="37" width="240" height="1" fill="#0c0805"/><rect x="0" y="53" width="240" height="1" fill="#0c0805"/>'
      +'</g>'
      +'<ellipse cx="120" cy="22" rx="128" ry="62" fill="url(#tavGlow)"/>'
      +'<g shape-rendering="crispEdges">'
      +'<rect x="9" y="8" width="94" height="10" fill="#f8d288" opacity=".16"/><rect x="9" y="24" width="94" height="10" fill="#f8d288" opacity=".13"/><rect x="9" y="40" width="94" height="10" fill="#f8d288" opacity=".10"/>'
      +'<rect x="137" y="8" width="94" height="10" fill="#f8d288" opacity=".16"/><rect x="137" y="24" width="94" height="10" fill="#f8d288" opacity=".13"/><rect x="137" y="40" width="94" height="10" fill="#f8d288" opacity=".10"/>'
      +tavBtls
      +'<rect x="6" y="18" width="98" height="3" fill="#5a3a1e"/><rect x="6" y="18" width="98" height="1" fill="#8a5c2e"/>'
      +'<rect x="6" y="34" width="98" height="3" fill="#5a3a1e"/><rect x="6" y="34" width="98" height="1" fill="#8a5c2e"/>'
      +'<rect x="6" y="50" width="98" height="3" fill="#5a3a1e"/><rect x="6" y="50" width="98" height="1" fill="#8a5c2e"/>'
      +'<rect x="136" y="18" width="98" height="3" fill="#5a3a1e"/><rect x="136" y="18" width="98" height="1" fill="#8a5c2e"/>'
      +'<rect x="136" y="34" width="98" height="3" fill="#5a3a1e"/><rect x="136" y="34" width="98" height="1" fill="#8a5c2e"/>'
      +'<rect x="136" y="50" width="98" height="3" fill="#5a3a1e"/><rect x="136" y="50" width="98" height="1" fill="#8a5c2e"/>'
      +'<rect x="6" y="4" width="228" height="2" fill="#3a2412"/>'
      +'<rect x="6" y="4" width="3" height="49" fill="#3a2412"/><rect x="101" y="4" width="3" height="49" fill="#3a2412"/>'
      +'<rect x="136" y="4" width="3" height="49" fill="#3a2412"/><rect x="231" y="4" width="3" height="49" fill="#3a2412"/>'
      +'<rect x="104" y="6" width="32" height="48" fill="#1b120a"/>'
      +'<rect x="104" y="6" width="2" height="48" fill="#2c1c10"/><rect x="134" y="6" width="2" height="48" fill="#2c1c10"/>'
      +'<rect x="119" y="2" width="2" height="4" fill="#4c4438"/>'
      +'<rect x="115" y="6" width="10" height="2" fill="#2c2620"/>'
      +'<rect x="114" y="8" width="12" height="10" fill="#3a3128"/>'
      +'<rect x="116" y="10" width="8" height="6" fill="#ffdf96"/>'
      +'<rect x="119" y="11" width="2" height="4" fill="#fff6d0"/>'
      +'</g>'
      +'<path d="M112 18 L100 58 L140 58 L128 18 Z" fill="#ffdf9a2b"/>'
      +'<ellipse cx="120" cy="34" rx="14" ry="12" fill="#f7c46c26"/>'
      +'<g shape-rendering="crispEdges">'
      +'<rect x="105" y="46" width="30" height="12" fill="#4c3018"/>'
      +'<rect x="112" y="46" width="16" height="12" fill="#6d4526"/>'
      +'<rect x="113" y="26" width="14" height="4" fill="#b97c22"/>'
      +'<rect x="111" y="31" width="2" height="3" fill="#d99c63"/><rect x="127" y="31" width="2" height="3" fill="#d99c63"/>'
      +'<rect x="113" y="29" width="14" height="10" fill="#ecb37c"/>'
      +'<rect x="115" y="31" width="4" height="1" fill="#8a5c1c"/><rect x="121" y="31" width="4" height="1" fill="#8a5c1c"/>'
      +'<rect x="116" y="32" width="2" height="2" fill="#201409"/><rect x="122" y="32" width="2" height="2" fill="#201409"/>'
      +'<rect x="119" y="33" width="2" height="3" fill="#d9985f"/>'
      +'<rect x="114" y="37" width="12" height="2" fill="#eab33a"/>'
      +'<rect x="111" y="39" width="18" height="7" fill="#d89b26"/>'
      +'<rect x="113" y="46" width="14" height="5" fill="#c98d1e"/>'
      +'<rect x="115" y="51" width="10" height="4" fill="#b87d18"/>'
      +'<rect x="112" y="42" width="2" height="9" fill="#b87d18"/><rect x="126" y="42" width="2" height="9" fill="#b87d18"/>'
      +'<rect x="85" y="46" width="9" height="3" fill="#fff3d8"/><rect x="86" y="49" width="7" height="7" fill="#d9a441"/><rect x="93" y="51" width="2" height="4" fill="#b9873a"/>'
      +'<rect x="146" y="46" width="9" height="3" fill="#fff3d8"/><rect x="147" y="49" width="7" height="7" fill="#d9a441"/><rect x="145" y="51" width="2" height="4" fill="#b9873a"/>'
      +'<rect x="0" y="56" width="240" height="2" fill="#c08a46"/>'
      +'<rect x="0" y="58" width="240" height="7" fill="url(#tavBarG)"/>'
      +'<rect x="40" y="58" width="1" height="7" fill="#3a2110"/><rect x="80" y="58" width="1" height="7" fill="#3a2110"/><rect x="160" y="58" width="1" height="7" fill="#3a2110"/><rect x="200" y="58" width="1" height="7" fill="#3a2110"/>'
      +'<rect x="0" y="65" width="240" height="15" fill="#1c1109"/>'
      +'<rect x="0" y="65" width="240" height="1" fill="#5a3a1c"/>'
      +'<rect x="8" y="60" width="24" height="20" fill="#6b4423"/>'
      +'<rect x="8" y="60" width="2" height="2" fill="#160e08"/><rect x="30" y="60" width="2" height="2" fill="#160e08"/>'
      +'<rect x="8" y="64" width="24" height="2" fill="#2a1a0c"/><rect x="8" y="74" width="24" height="2" fill="#2a1a0c"/>'
      +'<rect x="15" y="60" width="1" height="20" fill="#55351b"/><rect x="24" y="60" width="1" height="20" fill="#55351b"/>'
      +'<rect x="208" y="60" width="24" height="20" fill="#6b4423"/>'
      +'<rect x="208" y="60" width="2" height="2" fill="#160e08"/><rect x="230" y="60" width="2" height="2" fill="#160e08"/>'
      +'<rect x="208" y="64" width="24" height="2" fill="#2a1a0c"/><rect x="208" y="74" width="24" height="2" fill="#2a1a0c"/>'
      +'<rect x="215" y="60" width="1" height="20" fill="#55351b"/><rect x="224" y="60" width="1" height="20" fill="#55351b"/>'
      +'<rect x="58" y="28" width="1" height="1" fill="#ffe9b7" opacity=".55"/><rect x="176" y="24" width="1" height="1" fill="#ffe9b7" opacity=".5"/><rect x="98" y="12" width="1" height="1" fill="#ffe9b7" opacity=".45"/><rect x="150" y="43" width="1" height="1" fill="#ffe9b7" opacity=".4"/>'
      +'</g>'
      +'<rect width="240" height="80" fill="url(#tavVig)"/>'
      +'</svg>'
      +'</div>';
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
      const eCur=Math.floor(S.energy||0), eMax=Math.max(1,Math.floor(stat("energy")||1));
      const ePct=Math.min(100,Math.round(eCur/eMax*100));
      const canDrink=beer>=drinkCost;
      const sips=Math.floor(beer/Math.max(1,drinkCost));
      const up=mug.next
        ? ('<button type="button" class="btn btn-soft btn-wide uiTavMugUp" onclick="upgradeMug()" '
          +((S.gems||0)>=(mug.next.gems|0)?"":"disabled")+'>'
          +'Ап кружки → ×'+mug.next.mul+' · 💎'+(mug.next.gems|0)+'</button>')
        : '<div class="uiSub" style="margin-top:8px;text-align:center">Кружка макс · ×'+mug.mul+' за тап</div>';
      const drinkBody=
        '<div class="uiTavDeal">'
        +'<span class="uiTavChip cost">−'+drinkCost+' пива</span>'
        +'<span class="uiTavChip gain">+'+drinkPts+' очков</span>'
        +'<span class="uiTavChip soft">×'+mug.mul+' глоток'+(mug.mul>1?"а":"")+'</span>'
        +'</div>'
        +'<button type="button" class="uiTavDrinkBtn" onclick="drinkBeer()" '+(canDrink?"":"disabled")+'>'
        +'<span>Выпить '+(mug.mul>1?("×"+mug.mul):"кружку")+'</span>'
        +'<span class="cost">🍺 '+drinkCost+'</span>'
        +'</button>'
        +up
        +'<div class="uiTavEnergy">'
        +'<div class="row"><span>Энергия</span><b>'+eCur+' / '+eMax+'</b></div>'
        +'<div class="uiBar"><div class="uiBarFill" style="width:'+ePct+'%"></div></div>'
        +'<div class="uiSub" style="margin-top:6px">Авто-глоток в забое · кружка ур.'+(mug.i+1)+'</div>'
        +'</div>';
      body=facade+meters
        +'<div class="uiTavTip"><b>'+esc(talk.tag)+'</b> '+esc(talk.text)+'</div>'
        +'<div class="uiTavDrink">'+this.card("🍺","Кружка ×"+mug.mul,
          canDrink?("В запасе "+beer+" · хватит на "+sips+" тап"+(sips===1?"":"а"))
            :("Мало пива · нужно "+drinkCost+", есть "+beer),
          drinkBody,"tav")+'</div>'
        +'<div class="uiBtnStack">'
        +'<button class="btn btn-soft btn-wide" onclick="UIS.setTab(\'feast\')">К застольям</button>'
        +'<button class="btn btn-soft btn-wide" onclick="openCharSheet()">Лист · навыки</button>'
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
    /* AGENTS 5.13: Офферы · Артефакты · Бочки · Самоцветы · Бесплатные
       В каждом разделе — своё free + rewarded (привычка обходить вкладки). */
    const tab=this.tab||"offers";
    this.$("uiTitle").textContent="Рынок";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">💎 '+fmt(S.gems||0)+'</span>';
    const mark=(id,label)=> (typeof shopDailyAnyLeft==="function"&&shopDailyAnyLeft(id)?("🎁 "+label):label);
    this.$("uiTabs").innerHTML=this.tabs(["offers","art","barrels","gems","free"],
      [mark("offers","Офферы"), mark("art","Артеф."), mark("barrels","Бочки"),
       mark("gems","Самоцв."), (typeof shopDailyAnyLeft==="function"&&(shopDailyAnyLeft("a")||shopDailyAnyLeft("b")||shopDailyAnyLeft("offers")||shopDailyAnyLeft("art")||shopDailyAnyLeft("barrels")||shopDailyAnyLeft("gems"))?"🎁 Беспл.":"Беспл.")],
      tab);
    const daily=(id)=> (typeof shopDailyCardHtml==="function"?shopDailyCardHtml(id):"");
    let body="";
    if(tab==="offers"){
      const sp=BALANCE.growth.starterPack;
      body=daily("offers")
      +(S.growth&&S.growth.starterBought
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
      body=daily("art")
        +this.card("💎","Пак артефактов","5 случайных · "+STICKER_PACK_GEMS+" 💎",
        '<button class="btn btn-hard btn-wide" onclick="buyStickerPack()">Купить пак ×5</button>'
        +'<button class="btn btn-wide" style="margin-top:6px" onclick="UIS.open(\'artifacts\')">К коллекциям</button>');
    } else if(tab==="barrels"){
      body=daily("barrels")
        +BALANCE.skillChests.map(ch=>{
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
      body=daily("gems")
        +packs.map((g,i)=>{
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
      const left=typeof shopDailyKeys==="function"?shopDailyKeys().filter(k=>shopDailyAnyLeft(k)).length:0;
      body='<div class="uiSub" style="margin-bottom:8px">Обход разделов: в каждом — бесплатно и за рекламу · осталось '
        +left+' · сброс ежедневно</div>'
        +(typeof shopDailyCardHtml==="function"
          ? ["offers","art","barrels","gems","a","b"].map(shopDailyCardHtml).join("")
          : "");
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
  function navGo(id, openFn){
    return function(){
      try{ if(typeof closeCharSheet==="function") closeCharSheet(); }catch(e){}
      /* Повторный тап по активному пункту → назад в забой */
      if(UIS.id===id){
        UIS.close();
        try{ if(typeof syncBottomNav==="function") syncBottomNav(); }catch(e){}
        return;
      }
      openFn();
      try{ if(typeof syncBottomNav==="function") syncBottomNav(); }catch(e){}
    };
  }
  if($("navTavBtn")) $("navTavBtn").onclick=navGo("tavern", ()=>{
    if(typeof requireFeat==="function"&&!requireFeat("social")) return;
    UIS.open("tavern","ale");
  });
  if($("navPvp")) $("navPvp").onclick=navGo("pvp", ()=>{
    if(typeof requireFeat==="function"&&!requireFeat("pvp")) return;
    UIS.open("pvp");
  });
  if($("navShop")) $("navShop").onclick=navGo("shop", ()=>UIS.open("shop","offers"));
  if($("navMines")) $("navMines").onclick=navGo("mines", ()=>{
    if(typeof requireFeat==="function"&&!requireFeat("mines")) return;
    UIS.open("mines");
  });
  if($("navSkills")) $("navSkills").onclick=function(){
    if(typeof requireFeat==="function"&&!requireFeat("skills")) return;
    /* Повторный тап по Навыкам → забой */
    const skillsOpen=(UIS.id==="panel" && typeof _skillsShellTab!=="undefined" && _skillsShellTab!=null)
      || (typeof charSheetOpen==="function" && charSheetOpen());
    if(skillsOpen){
      try{ if(typeof closeCharSheet==="function") closeCharSheet(); }catch(e){}
      UIS.close();
      try{ if(typeof syncBottomNav==="function") syncBottomNav(); }catch(e){}
      return;
    }
    try{ if(typeof closeCharSheet==="function") closeCharSheet(); }catch(e){}
    if(UIS.id) UIS.close();
    openSkills("sheet");
    try{ if(typeof syncBottomNav==="function") syncBottomNav(); }catch(e){}
  };
  const ml=$("mineLabel");
  if(ml){ ml.style.cursor="pointer"; ml.title="Штольни"; ml.onclick=(e)=>{
    if(e&&e.stopPropagation) e.stopPropagation();
    if(typeof requireFeat==="function"&&!requireFeat("mines")) return;
    UIS.open("mines");
  }; }
  const sm=$("statMine");
  if(sm){ sm.style.cursor="pointer"; sm.onclick=()=>{
    if(typeof requireFeat==="function"&&!requireFeat("mines")) return;
    UIS.open("mines");
  }; }
  const rank=$("statMinerCell")||$("statMiner");
  if(rank){
    rank.style.cursor="pointer";
    rank.title="Бороды · звание";
    rank.onclick=()=>{
      if(typeof requireFeat==="function"&&!requireFeat("beards")) return;
      UIS.open("beards","rank");
    };
  }
  try{ syncBottomNav(); }catch(e){}
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
    +'<div class="uiSub">+'+w.goldPct+'% доход · +'+Number(w.luckAdd||0).toFixed(1)+' удачи</div></div></div>'
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
 "sciConsent","fuseBoxes","openOneBox","openAllBoxes","upgradeBoxWithStones","skipWorkout","claimWorkout","startWorkout","drinkBeer","upgradeMug",
 "spendSpecial",
 "toggleFair","setFairClient","revealFair","setPlayerName","buyStickerPack","giftStickers","sipAle"].forEach(uiWrap);
