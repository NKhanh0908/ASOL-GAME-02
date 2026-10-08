function rnd(seed){let s=seed;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}}
const SPARK="M0,-10 L2.2,-2.2 L10,0 L2.2,2.2 L0,10 L-2.2,2.2 L-10,0 L-2.2,-2.2Z";
function stars(g,n,seed,W=360,H=640,opts={}){
  const r=rnd(seed),ns="http://www.w3.org/2000/svg";
  for(let i=0;i<n;i++){
    const x=r()*W,y=r()*H,big=r()<(opts.bigP??.07),rad=big?0:(.4+r()*1.1);
    const col=["#fff","#cfe6ff","#ffe8b8","#d9c6ff"][Math.floor(r()*4)];
    let e;
    if(big){e=document.createElementNS(ns,"path");e.setAttribute("d",SPARK);const k=.35+r()*.5;
      e.setAttribute("transform",`translate(${x} ${y}) scale(${k})`);e.setAttribute("fill",col);e.setAttribute("opacity",.7+r()*.3)}
    else{e=document.createElementNS(ns,"circle");e.setAttribute("cx",x);e.setAttribute("cy",y);e.setAttribute("r",rad);e.setAttribute("fill",col);e.setAttribute("opacity",.35+r()*.6)}
    g.appendChild(e)}
}
function emblem(cx,cy,s=1,opts={}){
  const a=opts.a||["#CFEFFF","#7DB7FF"],b=opts.b||["#FFE8A6","#FFC857"];
  return `<g transform="translate(${cx} ${cy}) scale(${s})">
  <defs><linearGradient id="eA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a[0]}"/><stop offset="1" stop-color="${a[1]}"/></linearGradient>
  <linearGradient id="eB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b[0]}"/><stop offset="1" stop-color="${b[1]}"/></linearGradient></defs>
  <circle r="86" fill="${opts.halo||'#7db7ff'}" opacity=".16"/>
  <path d="M-72 0 L-20 -52 L32 0 L-20 52Z" fill="url(#eA)" opacity=".95"/>
  <path d="M-32 0 L20 -52 L72 0 L20 52Z" fill="url(#eB)" opacity=".95"/>
  <path d="M-26 0 L0 -26 L26 0 L0 26Z" fill="${opts.hole||'#14215E'}"/>
  <path d="M-26 0 L0 -26 L26 0 L0 26Z" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>
  </g>`}
const NS="http://www.w3.org/2000/svg";
function spark(x,y,k,fill="#fff",op=1){return `<path d="${SPARK}" transform="translate(${x} ${y}) scale(${k})" fill="${fill}" opacity="${op}"/>`}
function menuOverlay(){
  const L=s=>[...s].map(c=>`<span>${c}</span>`).join('');
  return `<div class="pill" style="left:16px;top:18px"><b style="background:#FFC857;color:#22145A;border-radius:10px;padding:0 8px">VI</b>&nbsp;EN</div>
  <div class="pill" style="right:16px;top:18px;width:32px;justify-content:center;padding:0">⚙</div>
  <div class="lg">${L('MIRROR')}</div><div class="mbar"></div><div class="lgr">${L('MIRROR')}</div>
  <div class="fact">◆ Một ngày trên sao Kim dài hơn một năm của nó</div>
  <div class="cta"><b>Tiếp tục</b><i>1-1 · Sao Trời</i></div>
  <div class="sec">Chọn màn chơi</div>
  <div class="foot">v0.9 · ASOL</div>`}
function menuEmblem(opts){return `<svg class="layer" viewBox="0 0 360 640">${emblem(180,300,1.15,opts||{halo:'#ffffff'})}</svg>`}
