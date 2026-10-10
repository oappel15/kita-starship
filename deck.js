(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s);},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var slides=$$(".slide"),N=slides.length,cur=0,pres=null;
var counter=$("#counter"),prog=$("#progress"),sec=$("#section"),prevB=$("#prev"),nextB=$("#next");
var npanel=$("#npanel"),nbody=$("#nbody"),nslide=$("#nslide"),notesB=$("#notes-btn");
function titleOf(s){var h=s.querySelector("h2,h1");return h?h.textContent.replace(/\s+/g," ").trim():"";}
function notesOf(s){var n=s.querySelector(".notes");return n?n.innerHTML:"<p>(No notes)</p>";}
function idx(key){if(!key)return -1;var n=parseInt(key,10);if(String(n)===key)return Math.max(0,Math.min(N-1,n-1));for(var i=0;i<N;i++)if(slides[i].id===key)return i;return -1;}
function pauseVideos(s){$$("iframe",s).forEach(function(f){try{f.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}',"*");}catch(e){}});}
function loadVideos(s){$$("iframe[data-src]",s).forEach(function(f){if(!f.getAttribute("src"))f.setAttribute("src",f.getAttribute("data-src"));});}
function go(i,noHash){
  i=Math.max(0,Math.min(N-1,i));
  if(slides[cur]&&cur!==i)pauseVideos(slides[cur]);
  cur=i;
  slides.forEach(function(s,k){var on=k===i;s.classList.toggle("active",on);s.setAttribute("aria-hidden",on?"false":"true");if(on)s.removeAttribute("inert");else s.setAttribute("inert","");});
  var s=slides[i];s.scrollTop=0;loadVideos(s);
  counter.textContent=(i+1)+" / "+N;prog.style.width=((i+1)/N*100)+"%";
  sec.textContent=s.getAttribute("data-section")||"";
  prevB.disabled=i===0;nextB.disabled=i===N-1;
  nslide.textContent=(i+1)+". "+titleOf(s);nbody.innerHTML=notesOf(s);
  if(!noHash){try{history.replaceState(null,"","#"+s.id);}catch(e){}}
  document.title=titleOf(s)+" | Starship | Kita";
  updatePresenter();
}
function next(){go(cur+1);}function prev(){go(cur-1);}
nextB.addEventListener("click",next);prevB.addEventListener("click",prev);
function toggleNotes(){var open=npanel.hidden;npanel.hidden=!open;notesB.setAttribute("aria-pressed",open?"true":"false");}
notesB.addEventListener("click",toggleNotes);$("#nclose").addEventListener("click",toggleNotes);
function toggleFS(){try{if(!document.fullscreenElement){document.documentElement.requestFullscreen();}else{document.exitFullscreen();}}catch(e){}}
$("#fs-btn").addEventListener("click",toggleFS);
document.addEventListener("keydown",function(e){
  if(e.target.closest&&e.target.closest("input,textarea,select"))return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  var k=e.key;
  if(k==="ArrowRight"||k==="PageDown"||k===" "||k==="Spacebar"){e.preventDefault();next();}
  else if(k==="ArrowLeft"||k==="PageUp"){e.preventDefault();prev();}
  else if(k==="Home"){e.preventDefault();go(0);}else if(k==="End"){e.preventDefault();go(N-1);}
  else if(k==="f"||k==="F"){toggleFS();}else if(k==="n"||k==="N"){toggleNotes();}else if(k==="p"||k==="P"){openPresenter();}
});
/* click on empty slide area: right 60% = next, left 40% = prev */
$("#deck").addEventListener("click",function(e){
  if(e.target.closest("a,button,iframe,.video,.vframe,input,label"))return;
  if(window.getSelection&&String(window.getSelection()).length)return;
  var r=this.getBoundingClientRect();if(e.clientX-r.left<r.width*0.4)prev();else next();
});
/* swipe */
var tx=null,ty=0;
$("#deck").addEventListener("touchstart",function(e){if(e.target.closest(".vframe")){tx=null;return;}tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
$("#deck").addEventListener("touchend",function(e){if(tx==null)return;var dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;tx=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.4){if(dx<0)next();else prev();}},{passive:true});
addEventListener("hashchange",function(){var i=idx(location.hash.slice(1));if(i>=0&&i!==cur)go(i,true);});
/* presenter view: a popup window showing notes, next slide, and a timer */
var t0=Date.now();
function openPresenter(){
  if(pres&&!pres.closed){pres.focus();return;}
  pres=window.open("","kita-presenter","width=720,height=640");
  if(!pres)return;
  pres.document.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Presenter view · Starship</title><style>body{margin:0;font:16px/1.5 Inter,system-ui,Arial,sans-serif;background:#04050B;color:#F4F6FB;padding:18px}h1{font:700 22px Oswald,Arial Narrow,sans-serif;margin:0 0 4px;text-transform:uppercase}.row{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.time{font:700 28px Oswald,monospace;color:#FF7A1A}.next{color:#A9A9B8;margin:6px 0 12px}.notes{background:#17171C;border:1px solid #2E2E38;border-left:5px solid #F2C14E;border-radius:12px;padding:10px 16px;font-size:18px}button{font:inherit;font-weight:700;color:#fff;background:#FF7A1A;color:#111;border:0;border-radius:999px;padding:8px 18px;cursor:pointer;margin-right:6px}button.g{background:#1F1F26;border:1px solid #2E2E38}</style></head><body><div class="row"><div><h1 id="t"></h1><div class="next" id="n"></div></div><div class="time" id="clock">0:00</div></div><div><button class="g" id="p">← Prev</button><button id="x">Next →</button><button class="g" id="r">Reset timer</button></div><div class="notes" id="b"></div></body></html>');
  pres.document.close();
  pres.document.getElementById("p").onclick=prev;pres.document.getElementById("x").onclick=next;pres.document.getElementById("r").onclick=function(){t0=Date.now();};
  pres.document.addEventListener("keydown",function(e){if(e.key==="ArrowRight"||e.key===" "){e.preventDefault();next();}else if(e.key==="ArrowLeft"){e.preventDefault();prev();}});
  updatePresenter();
}
function updatePresenter(){
  if(!pres||pres.closed)return;var d=pres.document;if(!d.getElementById("t"))return;
  d.getElementById("t").textContent=(cur+1)+" / "+N+" · "+titleOf(slides[cur]);
  d.getElementById("n").textContent=cur<N-1?("Next: "+titleOf(slides[cur+1])):"Last slide";
  d.getElementById("b").innerHTML=notesOf(slides[cur]);
}
setInterval(function(){if(pres&&!pres.closed){var s=Math.floor((Date.now()-t0)/1000),el=pres.document.getElementById("clock");if(el)el.textContent=Math.floor(s/60)+":"+("0"+s%60).slice(-2);}},1000);
$("#pres-btn").addEventListener("click",openPresenter);
window.KitaDeck={go:go,next:next,prev:prev,current:function(){return cur;},count:N};
var start=idx(location.hash.slice(1));go(start>=0?start:0,true);
})();
/* Subtle animated starfield (respects prefers-reduced-motion) */
(function(){
  var c=document.getElementById("stars");if(!c||!c.getContext)return;
  var x=c.getContext("2d"),W=0,H=0,S=[],dpr=Math.min(window.devicePixelRatio||1,2);
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function size(){W=c.clientWidth;H=c.clientHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);
    var n=Math.round(W*H/5200);S=[];for(var i=0;i<n;i++)S.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2+.2,a:Math.random()*.7+.2,s:Math.random()*.15+.02,t:Math.random()*6.28});}
  function draw(t){x.clearRect(0,0,W,H);for(var i=0;i<S.length;i++){var s=S[i];
      if(!reduce){s.x-=s.s;if(s.x<0)s.x=W;}
      var tw=reduce?1:(.65+.35*Math.sin(t/900+s.t));x.globalAlpha=s.a*tw;x.fillStyle=s.r>1.1?"#FFE4C4":"#DDE8FF";x.beginPath();x.arc(s.x,s.y,s.r,0,6.283);x.fill();}
    if(!reduce)requestAnimationFrame(draw);}
  size();addEventListener("resize",size);requestAnimationFrame(draw);
})();
