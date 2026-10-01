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
  showToast("⏰","I’ll remind you again. "+min+" min","","«"+lab+"» · slip 📺 In a hat");
  try{ Platform.logEvent("ad_snooze",{slot,min}); }catch(e){}
  if(typeof __vclock!=="undefined") return;
  _adSnoozeTimer=setTimeout(()=>{
    _adSnoozeTimer=null;
    showToast("📺","The ad’s waiting.","","«"+lab+"» · Open the bonuses.",true);
    try{ if(typeof openAdHub==="function") openAdHub(); }catch(e){}
  }, min*60*1000);
}
function snoozeVeinAd(min){
  min=Math.max(1, min|0);
  skipVeinAd();
  const st=typeof veinAdBurstState==="function"?veinAdBurstState():null;
  if(st){ st.coolAt=Date.now()+min*60*1000; st.n=0; }
  if(_adSnoozeTimer){ clearTimeout(_adSnoozeTimer); _adSnoozeTimer=null; }
  showToast("⏰","I’ll remind you again. "+min+" min","","×2 Gold with vein");
  try{ Platform.logEvent("vein_ad_snooze",{min}); }catch(e){}
  if(typeof __vclock!=="undefined") return;
  _adSnoozeTimer=setTimeout(()=>{
    _adSnoozeTimer=null;
    showToast("📺","×2 vein Waits.","","Break it. vein — Let’s say double again.",true);
  }, min*60*1000);
}
function showAdPlaque(slot, cb){
  if(typeof __vclock!=="undefined"){ cb(true); return; }
  if(_adPlaqueCb){ try{ _adPlaqueCb(false); }catch(e){} }
  _adPlaqueCb=cb;
  _adPlaqueSlot=slot||"";
  const ov=$("adPlaque"); if(!ov){ cb(true); return; }
  const lab=(typeof AD_HUB_LABELS!=="undefined"&&AD_HUB_LABELS[typeof adSlotKey==="function"?adSlotKey(slot):slot])||slot||"";
  setTxt("adPlaqueSlot", lab?("Slot · "+lab):"");
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
  window.__diggyGrant=function(productId){
    try{ if(typeof applyShopPurchase==="function") applyShopPurchase(productId,{quiet:true}); }catch(e){}
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
      {name:"Balin Stonerook",depth:186000,prestige:41},
      {name:"Dwine Cedobeard",depth:97200,prestige:33},
      {name:"Thorin Molot",depth:52800,prestige:27},
      {name:"Gimley from Moria",depth:23400,prestige:19},
      {name:"Nori Shrek",depth:9600,prestige:12},
      {name:"Beer Bomber",depth:4200,prestige:7},
      {name:"Oin Lightlighter",depth:1800,prestige:3},
      {name:"Puffy-pumper",depth:300,prestige:0}
    ];
    try{ localStorage.setItem(Platform.LB_KEY,JSON.stringify(seed)); }catch(e){}
    return seed;
  },

  scienceTasks(){
    return [

      {id:"g1", q:"How many separate crystals are there on the breakage?", hint:"Consider the bright, sharp-cut lights.",
        opts:["0","1","2","3 and above"], gold:2},
      {id:"g2", q:"rock lighted by its own light?", hint:"Look for a pork around a rock, not a blick on top.",
        opts:["Yes","none"], gold:1},
      {id:"g3", q:"Is the break even or stairwell?", hint:"Look at the right edge of the slice.",
        opts:["level","step"], gold:1},
      {id:"g4", q:"Do you seeveinWhat’s the other color?", hint:"Thin threads going through the stone.",
        opts:["Yes","none"], gold:0},

      {id:"o1", q:"Which type should I say?", hint:"The layers are hinting of sedimentary, glassyness. — Magmatical.",
        opts:["sediment","Magmatical","Metamorphic","Not defined"]},
      {id:"o2", q:"Are there any traces of water on the cut?", hint:"Round carpets and sweats — There’s water traces.",
        opts:["Yes","none","No sign of him."]},
      {id:"o3", q:"Assess the grains.", hint:"How big the grains are visible to the eye.",
        opts:["Small","Average","Large"]},
      {id:"o4", q:"Is the sample suitable for date?", hint:"Interference — cracks; assistance — a large net inclusion.",
        opts:["Yes","none","doubtful"]}
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
