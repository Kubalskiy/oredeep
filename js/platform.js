"use strict";
/* Auto-split from index.html — edit here; keep load order: balance → platform → game → ui_screens */

let _adPlaqueCb=null, _adPlaqueTimer=null, _adPlaqueT0=0, _adPlaqueSlot="", _adSnoozeTimer=null;
const AD_PLAQUE_MS=1800;
function finishAdPlaque(ok){
  const ov=$("adPlaque"); if(ov){ ov.style.display="none"; ov.setAttribute("aria-hidden","true"); }
  if(_adPlaqueTimer){ clearInterval(_adPlaqueTimer); _adPlaqueTimer=null; }
  const cb=_adPlaqueCb; _adPlaqueCb=null;
  const okBtn=$("adPlaqueOk"); if(okBtn) okBtn.disabled=true;
  if(typeof cb==="function") try{ cb(!!ok); }catch(e){}
}
function snoozeAdPlaque(min){
  min=Math.max(1, min|0);
  const slot=_adPlaqueSlot||"";
  const lab=(typeof AD_HUB_LABELS!=="undefined"&&AD_HUB_LABELS[typeof adSlotKey==="function"?adSlotKey(slot):slot])||slot||"bonus";
  finishAdPlaque(false);
  if(_adSnoozeTimer){ clearTimeout(_adSnoozeTimer); _adSnoozeTimer=null; }
  showToast("⏰","Reminding you in "+min+" min","","«"+lab+"» · tap 📺 in the header");
  try{ Platform.logEvent("ad_snooze",{slot,min}); }catch(e){}
  if(typeof __vclock!=="undefined") return;
  _adSnoozeTimer=setTimeout(()=>{
    _adSnoozeTimer=null;
    showToast("📺","Ad is waiting","","«"+lab+"» · open bonuses",true);
    try{ if(typeof openAdHub==="function") openAdHub(); }catch(e){}
  }, min*60*1000);
}
function snoozeVeinAd(min){
  min=Math.max(1, min|0);
  skipVeinAd();
  const st=typeof veinAdBurstState==="function"?veinAdBurstState():null;
  if(st){ st.coolAt=Date.now()+min*60*1000; st.n=0; }
  if(_adSnoozeTimer){ clearTimeout(_adSnoozeTimer); _adSnoozeTimer=null; }
  showToast("⏰","Reminding you in "+min+" min","","×2 gold from vein");
  try{ Platform.logEvent("vein_ad_snooze",{min}); }catch(e){}
  if(typeof __vclock!=="undefined") return;
  _adSnoozeTimer=setTimeout(()=>{
    _adSnoozeTimer=null;
    showToast("📺","×2 vein awaits","","Break a vein — we’ll offer doubling again",true);
  }, min*60*1000);
}
function showAdPlaque(slot, cb){
  if(typeof __vclock!=="undefined"){ cb(true); return; }
  if(_adPlaqueCb){ try{ _adPlaqueCb(false); }catch(e){} }
  _adPlaqueCb=cb;
  _adPlaqueSlot=slot||"";
  const ov=$("adPlaque"); if(!ov){ cb(true); return; }
  const lab=(typeof AD_HUB_LABELS!=="undefined"&&AD_HUB_LABELS[typeof adSlotKey==="function"?adSlotKey(slot):slot])||slot||"";
  setTxt("adPlaqueSlot", lab?("slot · "+lab):"");
  const bar=$("adPlaqueBar"); if(bar) bar.style.width="0%";
  const okBtn=$("adPlaqueOk"); if(okBtn){ okBtn.disabled=true; okBtn.textContent="…"; }
  ov.style.display="flex"; ov.setAttribute("aria-hidden","false");
  _adPlaqueT0=Date.now();
  if(_adPlaqueTimer) clearInterval(_adPlaqueTimer);
  _adPlaqueTimer=setInterval(()=>{
    const p=Math.min(1,(Date.now()-_adPlaqueT0)/AD_PLAQUE_MS);
    if(bar) bar.style.width=(p*100).toFixed(1)+"%";
    if(p>=1){
      clearInterval(_adPlaqueTimer); _adPlaqueTimer=null;
      if(okBtn){ okBtn.disabled=false; okBtn.textContent="Claim"; }
    }
  }, 40);
}
const PRIVACY_POLICY_URL="https://loveplaygames.com/games/android/privacy/en/";
function openPrivacyPolicy(){
  const native=diggyNative();
  if(native && typeof native.openPrivacy==="function"){
    try{ native.openPrivacy(); return; }catch(e){}
  }
  try{ window.open(PRIVACY_POLICY_URL, "_blank", "noopener"); }catch(e){}
}
function openPrivacySettings(){
  const native=diggyNative();
  if(native && typeof native.showPrivacyOptions==="function"){
    try{ native.showPrivacyOptions(); return; }catch(e){}
  }
  openPrivacyPolicy();
}
function diggyNative(){
  try{ return (typeof DiggyNative!=="undefined" && DiggyNative) ? DiggyNative : null; }catch(e){ return null; }
}
try{
  window.__diggyNativeCb=function(id, ok, reason){
    const bag=Platform._cbs&&Platform._cbs[id];
    if(!bag) return;
    delete Platform._cbs[id];
    try{ bag(!!ok, reason||""); }catch(e){}
  };
  window.__diggyNativeCbJson=function(id, ok, payload, reason){
    const bag=Platform._cbs&&Platform._cbs[id];
    if(!bag) return;
    delete Platform._cbs[id];
    try{ bag(!!ok, payload||"", reason||""); }catch(e){}
  };
  window.__diggyGrant=function(productId){
    try{ if(typeof applyShopPurchase==="function") applyShopPurchase(productId,{quiet:true}); }catch(e){}
  };
  window.__diggyPlayReward=function(rewardId){
    try{ if(typeof grantPlayReward==="function") grantPlayReward(rewardId); }catch(e){}
  };
  window.__diggyPgs=function(event, ok, reason){
    try{ if(typeof onPlayGamesAuth==="function") onPlayGamesAuth(!!ok, reason||""); }catch(e){}
  };
}catch(e){}
const Platform={
  logEvent:(name,params)=>{
    try{ console.log("[analytics]",name,params||{}); }catch(e){}
    try{
      const native=diggyNative();
      if(native && typeof native.logEvent==="function") native.logEvent(String(name||""), JSON.stringify(params||{}));
    }catch(e){}
  },
  trackRevenue(cents,source,meta){ this.logEvent("revenue",{cents,source,...meta}); },
  trackAttribution(channel,meta){ this.logEvent("attribution",{channel,...meta}); },
  unitEcon(){ return (typeof growthUnitEcon==="function")?growthUnitEcon():{}; },
  unlockAchievement(id){
    try{
      const native=diggyNative();
      if(native && typeof native.unlockAchievement==="function") native.unlockAchievement(String(id||""));
    }catch(e){}
  },
  incrementEvent(id, amount){
    try{
      const native=diggyNative();
      if(native && typeof native.incrementEvent==="function") native.incrementEvent(String(id||""), amount|0);
    }catch(e){}
  },
  cloudSave(json, cb){
    const native=diggyNative();
    if(native && typeof native.cloudSave==="function"){
      const id="cs"+((Platform._n=(Platform._n||0)+1));
      Platform._cbs=Platform._cbs||{};
      Platform._cbs[id]=function(ok, reason){ if(cb) cb(!!ok, reason||""); };
      try{ native.cloudSave(String(json||""), id); return; }catch(e){ delete Platform._cbs[id]; }
    }
    if(cb) cb(false, "unavailable");
  },
  cloudLoad(cb){
    const native=diggyNative();
    if(native && typeof native.cloudLoad==="function"){
      const id="cl"+((Platform._n=(Platform._n||0)+1));
      Platform._cbs=Platform._cbs||{};
      Platform._cbs[id]=function(ok, payload, reason){ if(cb) cb(!!ok, payload||"", reason||""); };
      try{ native.cloudLoad(id); return; }catch(e){ delete Platform._cbs[id]; }
    }
    if(cb) cb(false, "", "unavailable");
  },
  scheduleNotify(title, body, whenMs){
    try{
      const native=diggyNative();
      if(native && typeof native.scheduleNotify==="function"){
        native.scheduleNotify(String(title||""), String(body||""), whenMs|0);
      }
    }catch(e){}
  },
  showRewarded:(cb, slot)=>{
    const native=diggyNative();
    if(native && typeof native.showRewarded==="function"){
      const id="ad"+((Platform._n=(Platform._n||0)+1));
      Platform._cbs=Platform._cbs||{};
      Platform._cbs[id]=cb;
      try{ native.showRewarded(String(slot||""), id); }catch(e){ delete Platform._cbs[id]; showAdPlaque(slot, cb); }
      return;
    }
    showAdPlaque(slot, cb);
  },
  showInterstitial:(cb)=>{
    const native=diggyNative();
    if(native && typeof native.showInterstitial==="function"){
      const id="int"+((Platform._n=(Platform._n||0)+1));
      Platform._cbs=Platform._cbs||{};
      Platform._cbs[id]=cb||function(){};
      try{ native.showInterstitial(id); }catch(e){ delete Platform._cbs[id]; if(cb) cb(false); }
      return;
    }
    if(cb) cb(false);
  },
  syncAds(){
    try{
      const native=diggyNative();
      if(native && typeof native.setNoAds==="function" && typeof S!=="undefined" && S) native.setNoAds(!!S.noAds);
    }catch(e){}
  },
  buy:(productId)=>Promise.resolve({ok:false,stub:true}),

  LB_KEY:"oredeep_lb",
  _seedLB(){
    const seed=[
      {name:"Balin Stonehand",depth:186000,prestige:41},
      {name:"Dwalin Greybeard",depth:97200,prestige:33},
      {name:"Thorin Hammer",depth:52800,prestige:27},
      {name:"Gimli of Moria",depth:23400,prestige:19},
      {name:"Nori Drift",depth:9600,prestige:12},
      {name:"Bombur the Brewer",depth:4200,prestige:7},
      {name:"Oin the Lamplighter",depth:1800,prestige:3},
      {name:"Fluff the Apprentice",depth:300,prestige:0}
    ];
    try{ localStorage.setItem(Platform.LB_KEY,JSON.stringify(seed)); }catch(e){}
    return seed;
  },

  scienceTasks(){
    return [

      {id:"g1", q:"How many separate crystals are on the break?", hint:"Count the bright pointed inclusions.",
        opts:["0","1","2","3 or more"], gold:2},
      {id:"g2", q:"Does the rock glow with its own light?", hint:"Look for a halo around the stone, not a glare on top.",
        opts:["yes","no"], gold:1},
      {id:"g3", q:"Is the break smooth or stepped?", hint:"Look at the right edge of the chip.",
        opts:["smooth","stepped"], gold:1},
      {id:"g4", q:"Are there veins of another color?", hint:"Thin threads running through the stone.",
        opts:["yes","no"], gold:0},

      {id:"o1", q:"What type is this sample?", hint:"Layers hint at sedimentary, glassiness at igneous.",
        opts:["sedimentary","igneous","metamorphic","can’t tell"]},
      {id:"o2", q:"Any traces of water on the cut?", hint:"Rounded cavities and streaks are traces of water.",
        opts:["yes","no","none visible"]},
      {id:"o3", q:"Judge the grain", hint:"How large the grains are to the naked eye.",
        opts:["fine","medium","coarse"]},
      {id:"o4", q:"Is the sample fit for dating?", hint:"Hindrance — cracks; help — a large clean inclusion.",
        opts:["yes","no","doubtful"]}
    ];
  },
  _sci:{ votes:{}, retired:{} },
  scienceSubmit(id, idx, weight){
    const V=Platform._sci.votes;
    V[id]=V[id]||{};
    V[id][idx]=(V[id][idx]||0)+weight;
    let bestIdx=-1, bestW=0;
    for(const k in V[id]) if(V[id][k]>bestW){ bestW=V[id][k]; bestIdx=Number(k); }
    if(bestW>=BALANCE.science.consensusWeight && Platform._sci.retired[id]==null){
      Platform._sci.retired[id]=bestIdx;
      return { consensus:true, label:bestIdx };
    }
    return { consensus:false, label:null };
  },
  getLeaderboard(){
    try{ const raw=localStorage.getItem(Platform.LB_KEY);
      if(raw) return JSON.parse(raw); }catch(e){}
    return Platform._seedLB();
  },
  submitScore(entry){
    let lb=Platform.getLeaderboard();
    lb=lb.filter(e=>e.name!==entry.name);
    lb.push(entry);
    lb.sort((a,b)=> b.prestige-a.prestige || b.depth-a.depth);
    lb=lb.slice(0,50);
    try{ localStorage.setItem(Platform.LB_KEY,JSON.stringify(lb)); }catch(e){}
    return lb;
  }
};
