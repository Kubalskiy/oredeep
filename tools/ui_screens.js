
"use strict";

const UI_MINES=[
  {id:0,ic:"🎒",n:"Greenhorn Dig",   sub:"special rock → bags",     theme:"t0", rock:"🪨", raidRes:"bags"},
  {id:1,ic:"💎",n:"Doom Echo",         sub:"special rock → gems", theme:"t1", rock:"⛰️", raidRes:"gems"},
  {id:2,ic:"🥚",n:"Undermountain Fire", sub:"special rock → eggs",      theme:"t2", rock:"🌋", raidRes:"eggs"},
  {id:3,ic:"🪮",n:"Crystal Depths",     sub:"special rock → combs",  theme:"t3", rock:"🧊", raidRes:"combs"},
  {id:4,ic:"🍺",n:"The Abyss",          sub:"special rock → beer",      theme:"t4", rock:"🗿", raidRes:"protein"}
];

const UI_ART_COLS=[
  {id:"mountain",n:"Mountain",   ic:'<img class="uiColArt" src="art/ic_col_mountain.png" alt="">',c:"#e8b93c"},
  {id:"deep",    n:"Depths",ic:'<img class="uiColArt" src="art/ic_col_deep.png" alt="">',    c:"#5aa7e8"},
  {id:"forge",   n:"Forge",  ic:'<img class="uiColArt" src="art/ic_col_forge.png" alt="">',   c:"#ff8a4a"},
  {id:"tavern",  n:"Tavern",ic:'<img class="uiColArt" src="art/ic_col_tavern.png" alt="">',  c:"#7ae8dc"}
];
const UI_MUG_IC='<img class="uiMugArt" src="art/ic_mug.png?v=2" alt="">';
const UI_MUG_IC_SM='<img class="uiMugArt sm" src="art/ic_mug.png?v=2" alt="">';

const UI_TAV_RANKS=[
  {n:"Stone Cup",xp:1200},{n:"Copper Cup",xp:980},{n:"Iron Cup",xp:760},
  {n:"Silver Cup",xp:540},{n:"Gold Cup",xp:320},{n:"Platinum Cup",xp:110}
];

const UI_PVP_BOARD=[
  {n:"Durin Deep", ic:"⛰", t:1180},
  {n:"Mira Rune",     ic:"✦", t:860},
  {n:"Grom Irontooth",  ic:"🦷", t:640},
  {n:"Borin the Counter",   ic:"📐", t:410},
  {n:"Slag Beardless", ic:"🪓", t:180},
  {n:"Granite Granny",      ic:"🪨", t:95},
  {n:"Nori the Trader",    ic:"💰", t:55}
];

const UIS={
  id:null, tab:null,
  $(id){ return document.getElementById(id); },
  setChrome(hidden){
    
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
    el.dataset.scr=this.id||"";   
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
    try{ if(typeof _gearSlotOpen!=="undefined"){ _gearSlotOpen=null; _gearSlotSig=""; } }catch(e){}
    try{ const b=this.$("uiBody"); if(b&&b.classList) b.classList.remove("foLock"); }catch(e){}
    try{ if(typeof _skillsShellTab!=="undefined") _skillsShellTab=null; }catch(e){}
    try{ if(typeof syncBottomNav==="function") syncBottomNav(); }catch(e){}
    try{ if(typeof updateFtueHint==="function") updateFtueHint(); }catch(e){}
  },
  
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
  
  open(id, tab){
    this._stack=[];
    this._go(id, tab);
  },
  
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
    
    if(id!=="panel"){
      try{ if(typeof _skillsShellTab!=="undefined") _skillsShellTab=null; }catch(e){}
      try{ const b=this.$("uiBody"); if(b&&b.classList) b.classList.remove("foLock"); }catch(e){}
    }
    this.id=id; this.tab=tab||null;
    this.render(id); this.show();
    if(id==="shop" && typeof fpStoreOpened==="function") fpStoreOpened("market");
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
        return this.row(m.n+" Friends",(done?"✓ +"+m.gems+" 💎":(ok?"Ready!":"—")));
      }).join("");
      const wl=S.growth.waitlist;
      this.$("uiTitle").textContent="Friends";
      this.$("uiHeadAct").innerHTML="";
      this.$("uiTabs").innerHTML=this.tabs(["main","growth"],["Profile","Friends"],"growth");
      this.$("uiBody").innerHTML=
        '<div class="uiBanner">Organic growth: referrals and waitlist, no ad budget needed</div>'
        +this.row("Your code",'<b>'+code+'</b>')
        +this.row("Invited",'<b>'+(S.growth.invites||0)+'</b> / '+BALANCE.growth.referral.inviterCap)
        +(S.growth.referredBy?this.row("Referred by",'<b>'+esc(S.growth.referredBy)+'</b>'):"")
        +(coop?this.row("Co-op boost",'<b style="color:var(--green)">+'+BALANCE.growth.referral.coopBoostPct+'% income</b>'):"")
        +'<div class="uiBtnStack">'
        +'<button class="btn btn-hard btn-wide" onclick="shareInvite()">Share invite link</button>'
        +'<button class="btn btn-soft btn-wide" onclick="claimInviteMilestones()">Claim referral milestones</button></div>'
        +'<div class="uiSec">Milestones</div>'+msHtml
        +'<div class="uiSec">Waitlist (early access)</div>'
        +(wl.joined
          ?(wl.claimed?this.row("Status","✓ bonus received"):this.card("📋","Early access","Early signup bonus",
            '<button class="btn btn-hard btn-wide" onclick="claimWaitlistBonus()">Claim bonus</button>'))
          :this.card("📋","Waitlist","A bonus for organic demand",
            '<button class="btn btn-hard btn-wide" onclick="growthJoinWaitlist(false);UIS.render(\'profile\')">Join</button>'))
        +'<div class="uiSec">Have an invite code?</div>'
        +'<div class="uiRow"><span><input id="uiRefInp" class="uiInp wide" maxlength="8" placeholder="CODE"></span>'
        +'<button class="btn btn-soft btn-tiny" onclick="growthApplyReferral(document.getElementById(\'uiRefInp\').value);UIS.render(\'profile\')">✓</button></div>';
      try{ if(typeof updateGrowthDot==="function") updateGrowthDot(); }catch(e){}
      return;
    }
    const w=beardWisdom(), depth=(S.stageIdx||1)*3;
    const setName="var v=document.getElementById('uiProfName').value.trim().slice(0,18);if(v){S.playerName=v;save();UIS.render('profile');}";
    this.$("uiTitle").textContent="Profile";
    this.$("uiHeadAct").innerHTML="";
    this.$("uiTabs").innerHTML=this.tabs(["main","growth"],["Profile","Friends"],"main");
    this.$("uiBody").innerHTML=
      '<div class="uiHero"><div class="uiHeroArt">🧔</div>'
      +'<b>'+esc(playerName())+'</b><div class="uiSub">'+w.title+((S.prestigeLv||0)?(" · ⛰ "+S.prestigeLv):"")+'</div></div>'
      +this.row("Run depth",'<b>'+Math.min(S.stageIdx||1,BALANCE.run.len)+'/'+BALANCE.run.len+'</b>')
      +this.row("Record",'<b>'+fmt(S.bestDepth||depth)+' m</b>')
      +this.row("PvP · cups",(S.pvpWins||0)+' wins · 🏆 '+fmt(S.trophies||0))
      +this.row("Hall",'Lv. '+gymLevel()+' · +'+gymPerkPct()+'%')
      +'<div class="uiRow"><span>Tavern name</span><span><input id="uiProfName" class="uiInp" maxlength="18" value="'+esc(playerName())+'">'
      +'<button class="btn btn-soft btn-tiny" onclick="'+setName+'">✓</button></span></div>'
      +'<div class="uiBtnStack">'
      +'<button class="btn btn-soft" onclick="openCharSheet()">🧬 Character Sheet · KRASAVA</button>'
      +'<button class="btn btn-soft" onclick="UIS.open(\'beards\')">💇 Beards</button>'
      +'<button onclick="UIS.setTab(\'growth\');UIS.render(\'profile\')">👥 Invite your friends.</button>'
      +'<button onclick="openWall()">🏔 Mountain Wall</button></div>';
  },

  renderSettings(){
    this.$("uiTitle").textContent="Settings";
    this.$("uiHeadAct").innerHTML="";
    this.$("uiTabs").innerHTML="";
    this.$("uiBody").innerHTML=
      this.row("Music",'<button id="uiSetMusic" onclick="toggleMusic();UIS.render(\'settings\')">'+(musicOn?"🔊 on":"🔇 off")+'</button>')
      +this.row("Pop-up messages",'<button id="uiSetToasts" onclick="toggleToasts();UIS.render(\'settings\')">'+(typeof toastToggleLabel==="function"?toastToggleLabel():(toastsOn?"💬 on":"🚫 off"))+'</button>')
      +this.row("Mountain Charter",'<button onclick="showIntro()">📜 read</button>')
      +this.row("Gacha fairness",'<button onclick="openFairness()">🔐 open</button>')
      +this.row("Mountain Wall",'<button onclick="openWall()">🏔 leaderboard</button>')
      +this.row("Privacy policy",'<button onclick="openPrivacyPolicy()">open</button>')
      +this.row("Privacy Settings",'<button onclick="openPrivacySettings()">open</button>')
      +this.row("Progress",'<span class="uiSub">saved automatically</span>')
      +this.row("Version",'<span class="uiSub">Mountain King · 0.12.4</span>')
      +'<button class="btn btn-danger" style="margin-top:14px;width:100%" onclick="UIS.close();resetProgress()">↺ Start over</button>';
  },

  renderPets(){
    const tab=this.tab||"gacha";
    this.$("uiTitle").textContent="Pets";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">🥚 '+(S.eggs||0)+'</span>';
    this.$("uiTabs").innerHTML=this.tabs(["gacha","merge","craft","bag"],
      ["Gacha","Merge","Craft","Stable"],tab);
    let body="";
    const cur=S.pet?('<div class="uiBanner r'+S.pet.r+'">In battle: '+petIcon(S.pet.t)+' '+PET_TYPES[S.pet.t].n
      +' · '+petSkinOf(S.pet).n
      +' · +'+PET_TYPES[S.pet.t].pct[S.pet.r]+'% '+PET_TYPES[S.pet.t].stat.toUpperCase()+'</div>'):"";
    if(tab==="gacha"){
      body=cur+'<div class="uiGachaStage"><div class="uiGachaEgg">🥚</div></div>'
        +'<div class="uiSub" style="text-align:center;margin:8px 0">Rolls: '+(S.petRolls||0)+' · Mountain pity</div>'
        +'<button class="btn btn-hard btn-wide" onclick="rollPet()" '+(S.eggs<1?"disabled":"")+'>Tame · 🥚 1</button>';
    } else if(tab==="merge"){
      const keys=Object.keys(S.petBox||{}).filter(k=>S.petBox[k]>0)
        .sort((a,b)=>Number(b.split("_")[1])-Number(a.split("_")[1]));
      body=cur+(keys.length?keys.map(k=>{
        const [t,r]=k.split("_").map(Number), c=S.petBox[k], ok=canMergePet(t,r);
        const maxed=r>=PET_MERGE_MAX;
        return this.card(petIcon(t),PET_RAR[r]+" · "+PET_TYPES[t].n,"×"+c+' · need '+BALANCE.merge.petCost+' to merge',
          maxed?'<button class="btn btn-soft btn-wide" disabled style="opacity:.4">max</button>'
            :'<button class="btn btn-soft btn-wide" onclick="mergePet('+t+','+r+')" '+(ok?"":'disabled style="opacity:.45"')+'>Merge 3 → '+PET_RAR[r+1]+'</button>');
      }).join(""):'<div class="uiEmpty">Collection empty — hatch eggs on the Gacha tab.</div>');
    } else if(tab==="craft"){
      const unlocked=petCraftUnlocked();
      body=(unlocked
        ? this.card("⚗","Craft Exotic","One Legendary from each family + "+BALANCE.petCraft.gems+" 💎",
            '<button class="btn btn-hard btn-wide" onclick="craftPetExotic()" '+(petCraftReady()?"":"disabled")+'>Craft</button>')
        : '<div class="uiEmpty">🔒 Crafting unlocks after '+BALANCE.petCraft.needLegendaries+' Legendaries (owned: '+(S.petLegSeen||0)+').</div>');
    } else {
      const slots=PET_TYPES.map((p,i)=>{
        let bestR=-1; for(const k in S.petBox||{}){ const [t,r]=k.split("_").map(Number); if(t===i&&r>bestR) bestR=r; }
        const ic=bestR>=0?petIcon(i):"❔", sub=bestR>=0?PET_RAR[bestR]:"none";
        return this.slot(ic,p.n,sub,bestR>=0?"r"+bestR:"");
      });
      body=cur+this.grid(slots);
    }
    this.$("uiBody").innerHTML=body;
  },

  renderBeards(){
    const tab=this.tab||"gacha";
    const rarRU=["Common","Rare","Epic","Legendary"];
    this.$("uiTitle").textContent="Beards";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">🪮 '+(S.combs||0)+'</span>';
    this.$("uiTabs").innerHTML=this.tabs(["gacha","merge","ascend","rank","gallery"],
      ["Gacha","Merge","Ascension","Rank","Gallery"],tab);

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
      'Energy drains while mining whenever the rock strikes. ' +
      'Keep energy in the green: drink 🍺 and upgrade Regen/Defense so your beard keeps growing.</div>';

    if(tab==="gacha"){
      body=cur
        +this.card("🪮","The Pity of the Mountain","Rarity odds improve with every roll",
          '<div class="uiSub" style="margin-bottom:6px">Rolls: '+rolls+' · threshold: '+pityX1+' → Leg ~'+geoOddsPct[3].toFixed(2)+'%</div>' +
          this.bar(pityPct) +
          rarRU.map((nm,i)=>this.row(nm,'~'+geoOddsPct[i].toFixed(2)+'%')).join("")
        )
        +'<div class="uiGachaStage"><img class="uiGachaArt" src="art/ic_beard.png" alt=""></div>'
        +'<button class="btn btn-hard btn-wide" onclick="hireGeo();UIS.render(\'beards\')" '+(S.combs<1?"disabled":"")+'>Hire · 🪮 1</button>'
        +'<div class="uiSub" style="text-align:center;margin:8px 0">Energy: '+enCur+' / '+enMax+' ('+enPct+'%)</div>'
        +healthLine;
    } else if(tab==="merge"){
      if(!S.geo){
        body='<div class="uiEmpty">Hire an elder on the Gacha tab first.</div>';
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
          +this.card("👷",S.geo.n,"Lv. "+(S.geo.lv||1)+" → after merge Lv. "+newLv+" · material: "+total,
            rarRU.map((nm,r)=>this.row(nm, String(counts[r]||0))).join("")
            +'<div class="uiSub" style="margin-top:6px">Consumes materials of rarity ≤ '+rarRU[S.geo.r]+'.</div>'
            +'<button class="btn btn-soft btn-wide" onclick="mergeGeo();UIS.render(\'beards\')" '+(total<1?"disabled":"")+'>Merge duplicates</button>'
          )
          +healthLine;
      }
    } else if(tab==="ascend"){
      const B=BALANCE.merge;
      if(!S.geo){
        body='<div class="uiEmpty">Hire an elder on the Gacha tab first.</div>';
      } else {
        const isLeg=S.geo.r===GEO_RAR.length-1;
        const ascOk=canAscendGeo();
        const lv=(S.geo.lv||1);
        const lvOk=lv>=B.ascendLv;
        const gemsHave=S.gems||0;
        const gemsOk=gemsHave>=B.ascendGems;
        const why=!isLeg ? ("need "+GEO_RAR[GEO_RAR.length-1])
          : (!lvOk ? ("need Lv. "+B.ascendLv+" (have "+lv+")")
          : (!gemsOk ? ("need "+B.ascendGems+" 💎 (have "+fmt(gemsHave)+")") : ""));
        const lvPct=isLeg?Math.min(100,Math.round(lv/B.ascendLv*100)):0;
        const gemsPct=isLeg?Math.min(100,Math.round(gemsHave/B.ascendGems*100)):0;
        const afterPct=geoPct({t:S.geo.t,r:S.geo.r,lv:1,asc:(S.geo.asc||0)+1});
        const ascStep=(S.geo.asc||0)+1;
        body=cur+this.card("✦","Ascension ✦"+ascStep,
          "+"+B.ascendPct+"% to bonus · drop to 1 · "+B.ascendGems+" 💎",
          (isLeg
            ? '<div class="uiSub">Progress: level '+lv+'/'+B.ascendLv+'</div>' + this.bar(lvPct) +
              '<div class="uiSub" style="margin-top:6px">Gems: '+fmt(gemsHave)+' / '+fmt(B.ascendGems)+'</div>' + this.bar(gemsPct) +
              '<div class="uiSub" style="margin-top:8px">After ascension: ~'+afterPct.toFixed(0)+'% '+GEO_TYPES[S.geo.t].stat.toUpperCase()+'</div>' +
              '<button class="btn btn-hard btn-wide" onclick="ascendGeo()" '+(ascOk?"":"disabled")+'>Ascension · '+B.ascendGems+' 💎</button>'
              +(why?'<div class="uiSub" style="margin-top:8px;color:#e8a24a">'+why+'</div>':"")
            : '<div class="uiEmpty">🔒 Only for '+GEO_RAR[GEO_RAR.length-1]+'. Merge duplicates on the Merge tab until Legendary.</div>'));
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
        "+"+w.goldPct+"% income · +"+w.luckAdd.toFixed(1)+" luck",
        this.bar(pct) +
        '<div class="uiSub" style="margin-top:6px">'+(w.lv>=maxLv?"MAX":fmt(have)+" / "+fmt(need)+" XP · remaining "+fmt(remXp)+" XP")+'</div>' +
        '<div class="uiSub" style="margin-top:8px">Rank XP: +2 per normal vein, +12 per boss.</div>' +
        '<div class="uiSub" style="margin-top:6px;color:#e8a24a">To next rank: ~'+untilVeins+' veins or ~'+untilBoss+' bosses.</div>'
      )
      +this.card("⚙️","Progression",
        "Beards reward steady mining and consume gems",
        '<div class="uiSub">Your income bonus grows with rank, and your climbing. elder Spends gem: '+BALANCE.merge.ascendGems+'💎 - I’m going to step up.</div>' +
        '<div class="uiSub" style="margin-top:8px">Main fuel for progress — not gemand frequency dig: If the energy falls to zero, you stop.</div>' +
        '<div class="uiSub" style="margin-top:8px">Here’s the energy: now. '+enCur+'/'+enMax+' ('+enPct+'%).</div>' +
        healthLine
      );
    } else {
      const totalGeoMats=Object.values(S.geoBox||{}).reduce((a,b)=>a+(b||0),0);
      const curT=S.geo?S.geo.t:null;
      const dealTxt=S.geo
        ? (S.geo.n+" · "+rarRU[S.geo.r]+" · Lv."+(S.geo.lv||1)+(S.geo.asc||0?(" ✦"+S.geo.asc):""))
        : "None yet.";
      const FAMILY_LORE={
        atk:"The fighter dwarf hits cleaner: attack climbs — and veins crack faster.",
        energy:"Healers don’t cast magic fluff. They keep your energy from falling too fast.",
        stone:"Stone is counted with respect: more greed — fatter haul."
      };

      body=cur
        +this.card("📚","Elder Gallery","Comb collection · duplicates: "+totalGeoMats,
          '<div class="uiSub">Equipped: '+dealTxt+'</div>' +
          '<div class="uiSub" style="margin-top:8px">elder — One in the office, the rest of you are digging up like duplicate.</div>' +
          '<div class="uiSub" style="margin-top:8px">As the road reads: roll 🪮 give either new elder in case or material rarity ≤ Yours.</div>' +
          '<div class="uiSub" style="margin-top:8px">Merger turns duplicate To the level and fattens the bonus. — gem- the end for the step ✦».</div>' +
          '<div class="uiSub" style="margin-top:8px;color:#e8a24a">Laure reminder: energy is losing in dig — Keep her green, or she’ll grow up.</div>'
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
            ? ("in case · "+(bestR>=0?rarRU[bestR]:"")+" · Lv."+(S.geo.lv||1)+(S.geo.asc||0?(" ✦"+S.geo.asc):"")+
              " · +"+Math.round(geoPct(S.geo))+"%")
            : (bestR>=0
              ? ("In the chest · "+rarRU[bestR]+" · +"+(GEO_TYPES[i].pct[bestR]||0)+"% (lv1) · duplicate "+cnt)
              : "Empty · hire through Gacha");
          const cls=(bestR>=0||inDeal?"":"lock");
          return this.slot("💇",g.names[0],g.stat.toUpperCase(),
            sub+(bestR>=0?(" · "+FAMILY_LORE[g.stat]):""), cls);
        }));
    }
    this.$("uiBody").innerHTML=body;
  },

  renderMines(){
    this.$("uiTitle").textContent="mine";
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

    this.$("uiHeadAct").innerHTML='<span class="uiPill">circle '+cycle+'</span>';
    this.$("uiTabs").innerHTML="";

    const how=
      '<div class="uiMineHow">'
      +'<b>How it works</b>'
      +'<div class="uiSub">Special stone is being released <b>by an increasing increase</b>: The height of the step — The longer the pause and the more reward ('+fibArr.join(", ")+'). Timer Unit — '+(unitSec>=3600?(unitSec/3600)+"h":(unitSec/60)+"m")+' One step in the row. hall I’m going to be in a row of steps for the day.</div>'
      +'<div class="uiMineFib">'+fibLine+'</div>'
      +'</div>';

    let raidCta;
    if(raidOn){
      const snap=S.mineRaid;
      raidCta='<div class="uiMineRaid on">'
        +'<div class="uiMineRaidTop"><span>'+(snap.ic||"🔑")+'</span><div><b>Special rock active</b>'
        +'<div class="uiSub">'+esc(snap.n||"Award")+' · +'+(snap.amt|0)+' '+(snap.label||snap.ic||"")+' · ×'+(snap.fib||1)
        +' · Go back to the mine and break it.</div></div></div>'
        +'<button type="button" class="btn btn-cta" onclick="UIS.close()">To the stone</button></div>';
    } else if(slot.ready){
      raidCta='<div class="uiMineRaid">'
        +'<div class="uiMineRaidTop"><span>'+(raidDef&&raidDef.ic||"🔑")+'</span><div><b>Level '+(slot.step+1)+'/'+slot.max+' · ×'+slot.fib+'</b>'
        +'<div class="uiSub">Award: '+raidAmt+' '+(raidDef&&(raidDef.label||raidDef.n)||"")+'</div></div></div>'
        +'<button type="button" class="btn btn-cta" onclick="startMineRaid('+cur+')">Break a special stone</button></div>';
    } else if(slot.done){
      raidCta='<div class="uiMineRaid empty">'
        +'<div class="uiSub">All '+slot.max+' The steps are over today. ×1.</div></div>';
    } else {
      raidCta='<div class="uiMineRaid empty">'
        +'<div class="uiMineRaidTop"><span>⏱</span><div><b>Up to stage '+(slot.step+1)+' · ×'+slot.fib+'</b>'
        +'<div class="uiSub">remaining '+fmtClock(slot.leftMs)+' · Award ~'+raidAmt+' '+(raidDef&&raidDef.ic||"")+'</div></div></div>'
        +(typeof mineRaidAdOk==="function"&&mineRaidAdOk(cur)
          ? ('<button type="button" class="btn btn-soft" style="margin-top:8px" onclick="mineRaidReadyAd('+cur+');UIS.render(\'mines\')">📺 Step at once · '+adSlotLeft("mine_raid_ready")+'</button>')
          : "")
        +'</div>';
    }

    const overview=
      '<div class="uiMineHero">'
      +'<div class="uiMineHeroTop">'
      +'<span class="uiMineHeroRock">'+(UI_MINES[cur]&&UI_MINES[cur].rock||"⛏")+'</span>'
      +'<div><b>'+esc((UI_MINES[cur]&&UI_MINES[cur].n)||here.n||"mine")+'</b>'
      +'<div class="uiSub">'+(here.n||"")+' · You’re here.</div></div>'
      +'<span class="uiTag on">Here.</span></div>'
      +'<div class="uiMineStats">'
      +'<div><span class="k">Level</span><b>'+Math.min(slot.step+1,slot.max)+'/'+slot.max+'</b></div>'
      +'<div><span class="k">Multiplier</span><b>×'+slot.fib+'</b></div>'
      +'<div><span class="k">Collection</span><b>'+hereGot+'/8</b></div>'
      +'<div><span class="k">Circle</span><b>'+cycle+'</b></div>'
      +'</div>'
      +(hereSet?('<div class="uiSub uiMineSetHint">'+(hereGot>=8?"✓ active: ":"Seth 8/8 → ")+esc(hereSet.label)+'</div>'):"")
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
        : ("showToast(\"⛏\",\"Closed\",\"\",\"Go to that. hall\",\"Now. "+(cur+1)+"/5 In a circle\")");
      const raidClick=unlocked
        ? ("startMineRaid("+m.id+")")
        : ("showToast(\"⛏\",\"Closed\",\"\",\"Go to that. hall\",\"Now. "+(cur+1)+"/5 In a circle\")");
      const badge=hereNow
        ? '<span class="uiTag on">Here.</span>'
        : (unlocked?'<span class="uiTag go">Come in.</span>':'<span class="uiTag">🔒</span>');
      const statusPill=sl.done
        ? '<span class="uiPill">Ready.</span>'
        : (sl.ready
          ? '<span class="uiPill">×'+sl.fib+' Goth.</span>'
          : '<span class="uiPill">⏱ '+fmtClock(sl.leftMs)+'</span>');
      let raidBtn="";
      if(unlocked && raidOn && (S.mineRaid.mineId|0)===m.id){
        raidBtn='<div class="uiSub">There’s a special stone coming. · ×'+(S.mineRaid.fib||1)+'</div>';
      } else if(unlocked && sl.ready && !raidOn){
        raidBtn='<button type="button" class="btn uiMineRaidBtn" onclick="event.stopPropagation();'+raidClick+'">Level '+(sl.step+1)+' · ×'+sl.fib+' → +'+amt+' '+(def&&def.ic||"")+'</button>';
      } else if(unlocked && !sl.done && !sl.ready){
        raidBtn='<div class="uiSub">Further ×'+sl.fib+' Through '+fmtClock(sl.leftMs)+'</div>'
          +(typeof mineRaidAdOk==="function"&&mineRaidAdOk(m.id)
            ? ('<button type="button" class="btn btn-soft uiMineRaidBtn" onclick="event.stopPropagation();mineRaidReadyAd('+m.id+');UIS.render(\'mines\')">📺 Immediately. · '+adSlotLeft("mine_raid_ready")+'</button>')
            : "");
      } else if(unlocked && sl.done){
        raidBtn='<div class="uiSub">Steps closed for the time being</div>';
      }
      return '<div class="uiMineCard '+m.theme+(hereNow?" sel":"")+(unlocked?"":" locked")+'">'
        +'<button type="button" class="btn btn-mine uiMineJoin" onclick="'+enterClick+'">'
        +'<span class="uiMineIc">'+(m.ic||"⛏")+'</span>'
        +'<div class="uiMineMain">'
        +'<div class="uiMineTop"><b>'+esc(m.n)+'</b>'+badge+'</div>'
        +'<div class="uiSub">'+esc(m.sub)+'</div>'
        +'<div class="uiMineColRow"><span>stones '+got+'/8'+(doneSet?" ✓":"")+'</span>'+statusPill+'</div>'
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
      '<div class="uiSec">Level hallm</div>'
      +setStrip
      +'<div class="uiSub" style="margin-top:8px">Collection Stones '+totalCol+'/40. Normal loot Separate; Special Stone — The stairs of the steps.</div>';

    this.$("uiBody").innerHTML=how+overview+raidCta
      +'<div class="uiSec">Five. hall</div>'
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
    const winGold=typeof pvpWinGold==="function"?pvpWinGold(li):(BALANCE.pvp.rewards[li]||0)*100;
    const nextGold=typeof pvpWinGold==="function"?pvpWinGold(nextLi):(BALANCE.pvp.rewards[nextLi]||0)*100;
    const atMax=li>=BALANCE.pvp.names.length-1;
    const leagueSub=atMax
      ? ("max · win +" + fmt(winGold) + " 🪙")
      : ("win +" + fmt(winGold) + " 🪙 · in " + BALANCE.pvp.names[nextLi] + " already. +" + fmt(nextGold) + " 🪙");
    this.$("uiTitle").textContent="PvP · Arena";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">🏆 '+fmt(S.trophies||0)+'</span>';
    this.$("uiTabs").innerHTML="";
    const opps=pvpSlate.map((o,i)=>{
      const fav=me>=o.power;
      const rec=typeof pvpBotRec==="function"?pvpBotRec(o.id):{w:0,l:0};
      const chance=typeof pvpWinChance==="function"?pvpWinChance(me,o.power):50;
      return '<div class="uiOpp '+(fav?"fav":"")+'"><div><b>'+(o.ic||"🤖")+' '+o.name+'</b>'
        +'<div class="uiSub">'+esc(o.tag||"AND")+' · force '+fmt(o.power)+' · A chance. ~'+chance+'%</div>'
        +'<div class="uiSub">Account '+rec.w+':'+rec.l+(o.fluff?(" · "+esc(o.fluff)):"")+'</div></div>'
        +'<button class="btn btn-soft" onclick="pvpFight('+i+')" '+(left<1?"disabled":"")+'>⚔ Fight.</button></div>';
    }).join("");
    this.$("uiBody").innerHTML=
      '<div class="uiHero compact"><div class="uiHeroArt">⚔</div><b>'+esc(playerName())+'</b>'
      +'<div class="uiSub">Quick fight. pickaxeMee. · Aimation and result</div></div>'
      +this.card("🏆","League: "+BALANCE.pvp.names[li], leagueSub,
        this.bar(pct,"var(--blue)")
        +'<div class="uiSub" style="margin-top:4px">'+(atMax
          ? ("top of the arena · "+fmt(S.trophies||0)+" 🏆")
          : ("up to "+BALANCE.pvp.names[nextLi]+": "+fmt(Math.max(0,nextReq-(S.trophies||0)))+" 🏆"))+'</div>'
        +'<div class="uiSub" style="margin-top:4px">attempts '+left+"/"+BALANCE.pvpDayLimit
          +" · Your power "+fmt(me)+"</div>")
      +'<div class="uiSec">Choose your opponent.</div>'
      +(left>0?opps:'<div class="uiEmpty" style="color:#e8a24a">Fights are finished for today.</div>')
      +(left>0?'<button class="btn btn-wide" onclick="pvpRerollSlate();UIS.render(\'pvp\')">Update Form (free)</button>'
        +(typeof adSlotOk==="function"&&adSlotOk("pvp_reroll")
          ?'<button class="btn btn-hard btn-wide" style="margin-top:6px" onclick="pvpRerollAd();UIS.render(\'pvp\')">📺 New Opponents · '
            +(typeof adSlotLeft==="function"?adSlotLeft("pvp_reroll"):"")+'</button>':"")
        :'')
      +'<button class="btn btn-hard btn-wide" style="margin-top:8px" onclick="openPvpBoard()">⚔ PvP Leaderboard</button>'
      +'<button class="btn btn-wide" style="margin-top:6px" onclick="openWall()">🏔 Mountain Wall</button>';
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
      : {tag:"Borin At the counter.", text:"beer Not for beauty. — Save your glasses. — Kick it. feast."};
    
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
      +'<div class="uiTavMeter"><span class="k">BEER</span><span class="v">🍺 '+beer+'</span><span class="s">+'+((W.proteinPerHour)|5)+'/h</span></div>'
      +'<div class="uiTavMeter"><span class="k">GLASSES</span><span class="v">💪 '+pts+'</span><span class="s">From the throats</span></div>'
      +'<div class="uiTavMeter"><span class="k">ROOM</span><span class="v">'+lv+'</span><span class="s">+'+gymPerkPct()+'% Statistics</span></div>'
      +'</div>';
    const gymCard=this.card("🏋","Respect · Room"+lv,
      fmt(xp)+(nextAt!=null?(" / "+fmt(nextAt)+" XP"):" · max"),
      this.bar(gymPct)
      +'<div class="uiSub" style="margin-top:4px">Training, PvP, Deylics, Artifact giving</div>',
      "tav");

    this.$("uiTitle").textContent="Tavern";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">Hall '+lv+' · +'+gymPerkPct()+'%</span>';
    this.$("uiTabs").innerHTML=this.tabs(
      ["ale","feast","mates","friends","rank"],
      ["Stop","Пир","Table","Friends","Cups"],
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
          +'Ap mug → ×'+mug.next.mul+' · 💎'+(mug.next.gems|0)+'</button>')
        : '<div class="uiSub" style="margin-top:8px;text-align:center">mug max · ×'+mug.mul+' For the slip.</div>';
      const drinkBody=
        '<div class="uiTavDeal">'
        +'<span class="uiTavChip cost">−'+drinkCost+' Beer</span>'
        +'<span class="uiTavChip gain">+'+drinkPts+' glasses</span>'
        +'<span class="uiTavChip soft">×'+mug.mul+' Sip'+(mug.mul>1?"a":"")+'</span>'
        +'</div>'
        +'<button type="button" class="uiTavDrinkBtn" onclick="drinkBeer()" '+(canDrink?"":"disabled")+'>'
        +'<span>Drink '+(mug.mul>1?("×"+mug.mul):"mug")+'</span>'
        +'<span class="cost">'+UI_MUG_IC_SM+' '+drinkCost+'</span>'
        +'</button>'
        +up
        +'<div class="uiTavEnergy">'
        +'<div class="row"><span>Energy</span><b>'+eCur+' / '+eMax+'</b></div>'
        +'<div class="uiBar"><div class="uiBarFill" style="width:'+ePct+'%"></div></div>'
        +'<div class="uiSub" style="margin-top:6px">Auto-sip in dig · '+UI_MUG_IC_SM+' mug Ur.'+(mug.i+1)+'</div>'
        +'</div>';
      body=facade+meters
        +'<div class="uiTavTip"><b>'+esc(talk.tag)+'</b> '+esc(talk.text)+'</div>'
        +'<div class="uiTavDrink">'+this.card(UI_MUG_IC,"mug ×"+mug.mul,
          canDrink?("Reserved "+beer+" · enough for "+sips+" slip"+(sips===1?"":"a"))
            :("Not enough beer. · I need to. "+drinkCost+", have "+beer),
          drinkBody,"tav")+'</div>'
        +'<div class="uiBtnStack">'
        +'<button class="btn btn-soft btn-wide" onclick="UIS.setTab(\'feast\')">Пир!</button>'
        +'<button class="btn btn-soft btn-wide" onclick="openCharSheet()">List · skill</button>'
        +'</div>';
    } else if(tab==="feast"){
      const active=S.wkActive;
      let activeHtml="";
      if(active){
        const left=Math.max(0,Math.ceil((active.end-Date.now())/1000));
        const nm=names[active.path]||active.path;
        activeHtml=this.card("⏱","Done: "+nm, left>0?("remaining "+left+"c"):"Ready. — Take it!",
          left>0
            ?('<button class="btn btn-soft btn-wide" onclick="skipWorkout()">Pass 💎'+(W.skipGems||5)+'</button>')
            :('<button class="btn btn-hard btn-wide" onclick="claimWorkout()">Take the award</button>'),
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
          ?'<button class="btn btn-soft" disabled>MAX</button>'
          :(busy
            ?'<button class="btn btn-soft" disabled>occupied</button>'
            :'<button class="btn btn-soft" onclick="startWorkout(\''+p+'\')" '+(pts<cost?"disabled":"")+'>💪'+cost+'</button>');
        return '<div class="uiTavPath"><div><b>'+esc(nm)+'</b><div class="uiSub">Lv.'+lvP+' · +'+pct+'%/Ur · Now. +'+(typeof workoutBonus==="function"?workoutBonus(p):0)+'%</div></div>'+btn+'</div>';
      }).join("");
      body=meters
        +activeHtml
        +this.card("💪","feast",
          "beer → glasses → The complete list of the "+(BALANCE.workoutPaths||[]).length+" The way.",
          '<button class="btn btn-soft btn-wide" onclick="drinkBeer()">Drink '+UI_MUG_IC_SM+drinkCost+' → +'+drinkPts+' - Okay.</button>'
          +'<button class="btn btn-hard btn-wide" style="margin-top:8px" onclick="openWorkouts()">All training</button>',
          "tav")
        +'<div class="uiSec tav">Faster Paths</div>'
        +'<div class="uiCard tav" style="display:block;padding:4px 8px">'+paths+'</div>'
        +gymCard;
    } else if(tab==="mates"){
      const geoSlot=S.geo
        ? this.slot("💇",S.geo.n,"+"+geoPct(S.geo).toFixed(0)+"%","r"+S.geo.r,"UIS.push('beards','merge')")
        : this.slot("❔","beard","hire me. elder","","UIS.push('beards','gacha')");
      const petSlot=S.pet
        ? this.slot(petIcon(S.pet.t),PET_TYPES[S.pet.t].n,PET_RAR[S.pet.r],"r"+S.pet.r,"UIS.push('pets','gacha')")
        : this.slot("❔","pet","egg Waiting","","UIS.push('pets','gacha')");
      body=facade
        +'<div class="uiTavTip"><b>The company desk.</b> A mentor, beardthe beast and the future clan — Who sits next to you in the dig.</div>'
        +'<div class="uiSec tav">Who’s at the table?</div>'
        +'<div class="uiGrid tav">'
        +this.slot("🧔","Borin","mentor","","openBorinMentor()")
        +geoSlot+petSlot
        +this.slot("👥","Clan","Soon.","","openClanSoon()")
        +'</div>';
    } else if(tab==="friends"){
      const code=(typeof growthInviteCode==="function")?growthInviteCode():"ORE-????";
      const addFn="var c=document.getElementById('uiFriendCode').value.trim();if(c){showToast('🤝','Code accepted','',c,'A friend will be added to the online version');}";
      body=facade
        +'<div class="uiTavTip"><b>The watermelons.</b> As long as the network boils — The files and the milestones live in a profile.</div>'
        +this.card("🤝","Friend code","Inject someone else. — Or give me yours.",
          '<div class="uiRow" style="border:0;padding:6px 0"><input id="uiFriendCode" class="uiInp wide" placeholder="ORE-XXXX" maxlength="12" style="max-width:100%">'
          +'<button class="btn btn-soft btn-tiny" onclick="'+addFn+'">+</button></div>'
          +'<div class="uiSub">Your height code: <b style="color:var(--gold)">'+esc(code)+'</b></div>',
          "tav")
        +'<div class="uiBtnStack">'
        +'<button class="btn btn-hard btn-wide" onclick="UIS.open(\'profile\',\'growth\')">👥 Reference and milestones</button>'
        +(typeof shareInvite==="function"
          ?'<button class="btn btn-soft btn-wide" onclick="shareInvite()">Share invite link</button>':"")
        +'</div>'
        +'<div class="uiEmpty" style="padding:16px 8px">List of online drinking agents — online version.</div>';
    } else {
      
      const mine={n:playerName(), xp:xp, me:true};
      const board=UI_TAV_RANKS.map(t=>({n:t.n, xp:t.xp, me:false})).concat([mine])
        .sort((a,b)=>b.xp-a.xp);
      const rows=board.map((t,i)=>
        '<div class="uiRankRow'+(t.me?" me":"")+'"><span class="uiRankN">'+(i+1)+'</span><b>'
        +esc(t.n)+(t.me?" · You.":"")+'</b><span class="uiSub">'+fmt(t.xp)+' XP</span></div>'
      ).join("");
      const nextPerk=GYM_PERKS.find(pk=>lv<pk.lv);
      body=facade+gymCard
        +'<div class="uiSec tav">Tavern rating</div>'
        +rows
        +'<div class="uiSub" style="margin-top:8px;text-align:center">'
        +(nextPerk
          ?('Next perk Room: «'+nextPerk.n+'» (+'+nextPerk.pct+'%) cc.'+nextPerk.lv)
          :'perk maximum room')
        +'</div>';
    }
    this.$("uiBody").innerHTML=body;
  },

  renderArtifacts(){
    const tab=this.tab||"pick";
    this.$("uiTitle").textContent="Artifacts";
    this.$("uiHeadAct").innerHTML="";
    if(tab==="pick"){
      this.$("uiTabs").innerHTML="";
      this.$("uiBody").innerHTML='<div class="uiSub" style="margin-bottom:8px">Choose a collection</div>'
        +this.grid(UI_ART_COLS.map(c=>{
          const p=typeof stickerColProgress==="function"?stickerColProgress(c.id):{have:0,total:0};
          return '<button class="uiColPick" style="--acc:'+c.c+'" onclick="UIS.tab=\''+c.id+'\';UIS.render(\'artifacts\')">'
            +'<span class="uiColEm">'+c.ic+'</span><b>'+c.n+'</b>'
            +'<span class="uiSub">'+p.have+'/'+p.total+'</span></button>';
        }));
      return;
    }
    const col=UI_ART_COLS.find(c=>c.id===tab)||UI_ART_COLS[0];
    this.$("uiTabs").innerHTML='<button class="btn btn-tab" onclick="UIS.tab=\'pick\';UIS.render(\'artifacts\')">‹ Collections</button>';
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
      +(slots.length?this.grid(slots):'<div class="uiEmpty">This collection is empty.</div>')
      +'<div class="uiBtnStack"><button class="btn btn-hard" onclick="buyStickerPack()">Park · '+STICKER_PACK_GEMS+' 💎</button>'
      +'<button onclick="giftStickers()">Give duplicate</button></div>';
  },

  renderShop(){
    
    const tab=this.tab||"offers";
    this.$("uiTitle").textContent="Market";
    this.$("uiHeadAct").innerHTML='<span class="uiPill">💎 '+fmt(S.gems||0)+'</span>';
    const mark=(id,label)=> (typeof shopDailyAnyLeft==="function"&&shopDailyAnyLeft(id)?("🎁 "+label):label);
    this.$("uiTabs").innerHTML=this.tabs(["offers","art","barrels","gems","free"],
      [mark("offers","Divisions"), mark("art","Artef."), mark("barrels","Batteries"),
       mark("gems","Same-ass."), (typeof shopDailyAnyLeft==="function"&&(shopDailyAnyLeft("a")||shopDailyAnyLeft("b")||shopDailyAnyLeft("offers")||shopDailyAnyLeft("art")||shopDailyAnyLeft("barrels")||shopDailyAnyLeft("gems"))?"🎁 No need.":"No need.")],
      tab);
    const daily=(id)=> (typeof shopDailyCardHtml==="function"?shopDailyCardHtml(id):"");
    let body="";
    if(tab==="offers"){
      const sp=BALANCE.growth.starterPack;
      body=daily("offers")
      +(S.growth&&S.growth.starterBought
        ? this.card("✓","Start pack","purchased · D1 payback","")
        : this.card("⚡","Start pack","💎"+sp.gems+" + 🪙"+fmt(sp.gold)+" + 🎒"+sp.bags+" · 2× "+sp.loot2xMin+" min",
          '<div class="uiSub" style="margin-bottom:6px">One-off start-up kit</div>'
          +'<button class="btn btn-hard btn-wide" onclick="buyStarterPack()">$'+sp.price+'</button>'))
      +BALANCE.shop.comeback.slice(0,3).map(([g,gold],i)=>this.card("🎁","Park "+(i+1)+" · discount","💎"+g+" + 🪙"+fmt(gold),
        '<button class="btn btn-hard btn-wide" onclick="buyPack('+i+')">$'+[6.99,16.99,24.99][i]+'</button>')).join("")
        +(S.noAds
          ? this.card("✓","The ad’s offline.","Slowly dig.","")
          : this.card("🚫","Disable advertising","Forever",
            '<button class="btn btn-hard btn-wide" onclick="buyNoAds()">$'+BALANCE.noAdsPrice+'</button>'));
    } else if(tab==="art"){
      body=daily("art")
        +this.card("💎","Park Artifacts","5 accidental · "+STICKER_PACK_GEMS+" 💎",
        '<button class="btn btn-hard btn-wide" onclick="buyStickerPack()">Buy a pack. ×5</button>'
        +'<button class="btn btn-wide" style="margin-top:6px" onclick="UIS.open(\'artifacts\')">Collections</button>');
    } else if(tab==="barrels"){
      body=daily("barrels")
        +BALANCE.skillChests.map(ch=>{
        const ok=ch.keyCost?(S.chestKeys||0)>=ch.keyCost:(S.gems||0)>=ch.gemCost;
        const price=ch.keyCost?(ch.keyCost+" 🗝"):(ch.gemCost+" 💎");
        return this.card("🛢",ch.n,ch.cards+" Maps · guarantee "+SKILL_RAR[ch.minR]+"+",
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
          ? ("Basic pack · "+g+" 💎")
          : ("Benefits +"+pct+"% · +"+fmt(bonus)+" 💎 fair price");
        return this.card("💎",fmt(g)+" gems",sub,
          '<div class="uiSub" style="margin-bottom:6px">'+(bonus>0?("Absolute benefit: +"+fmt(bonus)+" 💎"):"No allowance")+'</div>'
          +'<button class="btn btn-hard btn-wide" onclick="buyGems('+i+')">$'+prices[i]+'</button>');
      }).join("");
    } else {
      if(typeof shopFreeReset==="function") shopFreeReset();
      const left=typeof shopDailyKeys==="function"?shopDailyKeys().filter(k=>shopDailyAnyLeft(k)).length:0;
      body='<div class="uiSub" style="margin-bottom:8px">Scattering: each — free and for advertising · remaining '
        +left+' · Daily discharge</div>'
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

  
  openPanel(title, sub, html, silent){
    if(!silent && this.id && this.id!=="panel"){
      (this._stack=this._stack||[]).push({kind:"screen", id:this.id, tab:this.tab});
    }
    const bodyEl=this.$("uiBody");
    // Keep scroll when refreshing an already-open panel (stat/perk/skill buys rebuild HTML).
    let keepScroll=null;
    if(this.id==="panel" && bodyEl){
      keepScroll={ body: bodyEl.scrollTop||0 };
      const fo=bodyEl.querySelector(".foScroll");
      if(fo) keepScroll.fo=fo.scrollTop||0;
    }
    this._lastMeta={title, sub, html};
    this.id="panel";
    this.tab=null;
    this.$("uiTitle").textContent=title;
    this.$("uiHeadAct").innerHTML="";
    this.$("uiTabs").innerHTML="";
    if(bodyEl&&bodyEl.classList) bodyEl.classList.remove("foLock");
    bodyEl.innerHTML=(sub?'<div class="uiSub" style="margin-bottom:10px;line-height:1.6">'+sub+'</div>':"")+html;
    this.show();
    if(keepScroll && bodyEl){
      bodyEl.scrollTop=keepScroll.body;
      const fo2=bodyEl.querySelector(".foScroll");
      if(fo2 && keepScroll.fo!=null) fo2.scrollTop=keepScroll.fo;
    }
  },
  refresh(){
    if(this.id==="panel"&&this._lastMeta){
      if(this._lastMeta.kind==="gearSlot"&&typeof openGearSlot==="function"&&typeof _gearSlotOpen!=="undefined"&&_gearSlotOpen){
        openGearSlot(_gearSlotOpen);
        return;
      }
      this.openPanel(this._lastMeta.title,this._lastMeta.sub,this._lastMeta.html, true);
    } else if(this.id){
      const bodyEl=this.$("uiBody");
      const keepY=bodyEl?bodyEl.scrollTop:0;
      this.render(this.id);
      if(bodyEl) bodyEl.scrollTop=keepY;
    }
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
  if(ml){ ml.style.cursor="pointer"; ml.title="mine"; ml.onclick=(e)=>{
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
    rank.title="Beards · rank";
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

function openBorinMentor(){
  const w=typeof beardWisdom==="function"?beardWisdom():{title:"—",goldPct:0,luckAdd:0};
  UIS.openPanel("Borin · mentor",
    "Old courtman at the bar. beard And make sure you don’t forget why you came down to Mount.",
    '<div class="uiCard"><div class="uiCardIc">🧔</div><div class="uiCardBody"><b>'+esc(w.title)+'</b>'
    +'<div class="uiSub">+'+w.goldPct+'% income · +'+Number(w.luckAdd||0).toFixed(1)+' luck</div></div></div>'
    +'<div class="uiBtnStack" style="margin-top:10px">'
    +'<button class="btn btn-hard btn-wide" onclick="UIS.push(\'beards\',\'rank\')">Wisdom beard</button>'
    +'</div>');
}

function openClanSoon(){
  UIS.openPanel("Clan",
    "Garbage Archer: Total dig, chat rooms and clan wars.",
    '<div class="uiEmpty">👥 Soon. — online version</div>'
    +'<div class="uiSub" style="margin-top:8px;text-align:center">While you’re at it, call your friends by code in the Tavern Friends tab.</div>');
}

if(typeof metaOpen==="function"){
  metaOpen=function(title,sub,html){ UIS.openPanel(title,sub,html); };
}

["rollPet","mergePet","craftPetExotic","pvpFight","pvpRerollSlate","mergeGeo","ascendGeo","hireGeo","buyGems","buyPack","claimDaily",
 "chestOpenOne","chestUpgrade","chestSkip","bagSkipAdHour","upSkill","openSkillChest","spinWheel","playEvent","claimEventKey","buyEventKey","sciAnswer","sciSkip",
 "sciConsent","fuseBoxes","openOneBox","openAllBoxes","upgradeBoxWithStones","skipWorkout","claimWorkout","startWorkout","drinkBeer","upgradeMug",
 "spendSpecial",
 "toggleFair","setFairClient","revealFair","setPlayerName","buyStickerPack","giftStickers","sipAle"].forEach(uiWrap);

/** Android/hardware Back: close top overlay / previous menu. true = consumed. */
function handleHardwareBack(){
  try{
    const vis=id=>{
      const el=typeof $==="function"?$(id):document.getElementById(id);
      if(!el) return false;
      if(id==="introOv") return !!(el.classList&&el.classList.contains("on"));
      const d=el.style&&el.style.display;
      return d==="flex"||d==="block";
    };
    if(vis("adPlaque")){
      if(typeof finishAdPlaque==="function") finishAdPlaque(false);
      return true;
    }
    if(vis("introOv")){ if(typeof closeIntro==="function") closeIntro(); return true; }
    if(vis("pvpOverlay")){
      if(typeof pvpCloseBrawl==="function") pvpCloseBrawl();
      else { const ov=document.getElementById("pvpOverlay"); if(ov) ov.style.display="none"; }
      return true;
    }
    if(typeof perkPickOpen==="function"&&perkPickOpen()){
      if(typeof closePerkPick==="function") closePerkPick();
      return true;
    }
    if(vis("dropModal")){
      if(typeof chestPending!=="undefined"&&chestPending){
        if(typeof showToast==="function") showToast("🎒","First decide.","","Put on or sell the find.");
        return true;
      }
      if(typeof closeDropDecide==="function") closeDropDecide();
      return true;
    }
    if(vis("charModal")){ if(typeof closeCharSheet==="function") closeCharSheet(); return true; }
    if(vis("veinAdOverlay")){ if(typeof skipVeinAd==="function") skipVeinAd(); return true; }
    if(vis("pickModal")){ const m=document.getElementById("pickModal"); if(m) m.style.display="none"; return true; }
    if(vis("setModal")){ const m=document.getElementById("setModal"); if(m) m.style.display="none"; return true; }
    if(vis("setModal2")){ const m=document.getElementById("setModal2"); if(m) m.style.display="none"; return true; }
    if(vis("colModal")){ const m=document.getElementById("colModal"); if(m) m.style.display="none"; return true; }
    if(vis("profModal")){ const m=document.getElementById("profModal"); if(m) m.style.display="none"; return true; }
    if(vis("chestModal")){ if(typeof closeChest==="function") closeChest(); return true; }
    if(vis("metaModal")){ const m=document.getElementById("metaModal"); if(m) m.style.display="none"; return true; }
    if(vis("offOverlay")){ if(typeof claimOffline==="function") claimOffline(1); return true; }
    if(vis("overlay")){ if(typeof closeOverlay==="function") closeOverlay(); return true; }
    if(typeof UIS!=="undefined"&&UIS&&UIS.id){ UIS.back(); return true; }
  }catch(e){}
  return false;
}
