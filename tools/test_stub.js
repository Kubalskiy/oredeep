
"use strict";
/* ---- фейковый DOM для headless-прогона ---- */
const __ids = {};
class FE {
  constructor(tag){ this.tag=tag; this._id=null; this.children=[];
    this.textContent=""; this._innerHTML=""; this.disabled=false; this.onclick=null; this.dataset={}; this.src=""; this.scrollTop=0; this.scrollHeight=0;
    this.offsetWidth=0; this._q={};
    const self=this;
    this.style=new Proxy({}, {get:(t,k)=> k==="setProperty"?((a,b)=>{t[a]=b}):t[k], set:(t,k,v)=>{t[k]=v;return true}});
    this._cls=new Set();
    this.classList={ add:c=>self._cls.add(c), remove:c=>self._cls.delete(c),
      toggle:(c,f)=>{ if(f===undefined) f=!self._cls.has(c); f?self._cls.add(c):self._cls.delete(c); },
      contains:c=>self._cls.has(c) };
  }
  set id(v){ this._id=v; __ids[v]=this; }
  get id(){ return this._id; }
  set className(v){ this._cls=new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className(){ return [...this._cls].join(" "); }
  appendChild(c){ this.children.push(c); return c; }
  removeChild(c){ const i=this.children.indexOf(c); if(i>=0) this.children.splice(i,1); return c; }
  get firstChild(){ return this.children[0]; }
  setAttribute(k,v){ this._attrs=this._attrs||{}; this._attrs[k]=v; }
  getAttribute(k){ return (this._attrs||{})[k]; }
  remove(){}
  addEventListener(){}
  removeEventListener(){}
  querySelector(sel){ if(!this._q[sel]) this._q[sel]=new FE("q"); return this._q[sel]; }
  getBoundingClientRect(){
    return { left:40, top:120, right:100, bottom:180, width:60, height:60, x:40, y:120 };
  }
}
const document={ getElementById:id=>{ if(!__ids[id]) __ids[id]=new FE("static"); return __ids[id]; },
  createElement:tag=>new FE(tag), addEventListener:()=>{}, visibilityState:"visible" };
const window={ addEventListener:()=>{}, removeEventListener:()=>{} };
__HTML_IDS.forEach(i=>document.getElementById(i));
const __store={};
const localStorage={
  getItem:k=>(k in __store)?__store[k]:null,
  setItem:(k,v)=>{__store[k]=String(v)},
  removeItem:k=>{
    delete __store[k];
    // сброс основного сейва в тестах всегда чистит и резерв
    if(k==="oredeep_v3") delete __store["oredeep_v3_bak"];
  }
};
let __vclock=0;
const performance={ now:()=>__vclock };
let __rafCb=null;
const requestAnimationFrame=cb=>{ __rafCb=cb; };
const confirm=()=>true;
const navigator={};
const Image=class{set src(v){ if(this.onload) setTimeout(this.onload,0); }};
const setInterval=(f,t)=>0; // no-op: автосейв в тесте не нужен
