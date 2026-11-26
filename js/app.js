/* Klangwerk – Hauptprogramm. Läuft ohne Build direkt im Browser (Chrome/Edge). */
{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toastEl=$('#toast');let toastT;
function toast(t){toastEl.textContent=t;toastEl.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('show'),2800);}
const infoEl=$('#info');function info(t){infoEl.textContent=t;}
const clamp01=x=>x<0?0:x>1?1:x;

/* ================= Parameter ================= */
const M={
  lin:(a,b)=>[n=>a+(b-a)*n,x=>(x-a)/(b-a)],
  exp:(a,b)=>[n=>a*Math.pow(b/a,n),x=>Math.log(Math.max(x,a)/a)/Math.log(b/a)],
  sq:(a,b)=>[n=>a+(b-a)*n*n,x=>Math.sqrt(Math.max(0,(x-a)/(b-a)))],
  time:()=>[n=>0.001*Math.pow(10000,n),x=>Math.log(Math.max(x,0.001)/0.001)/Math.log(10000)]
};
const FMT={hz:x=>x>=1000?(x/1000).toFixed(x>=10000?1:2)+'k':x.toFixed(x<10?2:0),s:x=>x<1?Math.round(x*1000)+'ms':x.toFixed(2)+'s',
  pct:x=>Math.round(x*100)+'%',st:x=>(x>0?'+':'')+x.toFixed(1),ct:x=>(x>0?'+':'')+Math.round(x)+'c',semi:x=>(x>0?'+':'')+Math.round(x),bip:x=>(x>0?'+':'')+Math.round(x*100)};
const S=(k,l,m,d,f)=>({k,l,t:'s',m,d,f}),Gp=(k,l,o,d,v)=>({k,l,t:'g',o,d,v});
const LAGE=["32'","16'","8'","4'","2'"],LV=[-2,-1,0,1,2];
const OR='#e8642c',YE='#e6b93a',CR='#e9e2cf',RD='#d9452f',BL='#9fc8d0';
const SECT=[
  {n:'LFO',c:OR,ctl:[S('lfoRate','Rate',M.exp(0.05,30),5,'hz'),S('lfoDelay','Delay',M.lin(0,5),0,'s'),Gp('lfoWave','Wave',['SINE','SAW','SQUARE','RANDOM'],0)]},
  {n:'VCO Modulator',c:OR,ctl:[S('modLfo','LFO',M.sq(0,12),0,'st'),S('modEnv','ENV-1',M.lin(-24,24),0,'st'),Gp('modDest','Ziel',['VCO-1','VCO-2','1 + 2'],2),S('pwmAmt','PWM',M.lin(0,1),0,'pct'),Gp('pwmSrc','PWM-Quelle',['LFO','ENV-1','MAN'],0)]},
  {n:'VCO-1',c:YE,ctl:[Gp('v1Wave','Wave',['TRI','SAW','PULSE','SQUARE'],1),Gp('v1Oct','Range',LAGE,2,LV),S('xmod','Cross Mod',M.sq(0,1),0,'pct'),Gp('sync','Sync',['OFF','ON'],0)]},
  {n:'VCO-2',c:YE,ctl:[Gp('v2Wave','Wave',['SINE','SAW','PULSE','NOISE'],1),Gp('v2Oct','Range',LAGE,2,LV),S('v2Semi','Interval',M.lin(-12,12),0,'semi'),S('v2Fine','Fine',M.lin(-50,50),7,'ct')]},
  {n:'Mixer · HPF',c:CR,ctl:[S('mix1','VCO-1',M.lin(0,1),0.8,'pct'),S('mix2','VCO-2',M.lin(0,1),0.6,'pct'),S('hpf','HPF',M.exp(20,2000),20,'hz')]},
  {n:'VCF',c:RD,ctl:[S('cutoff','Cutoff',M.exp(20,20000),1800,'hz'),S('res','Reso',M.lin(0,1),0.15,'pct'),Gp('slope','Slope',['−12 dB','−24 dB'],1),S('envAmt','ENV-1',M.lin(-1,1),0.35,'bip'),S('lfoF','LFO',M.sq(0,1),0,'pct'),S('keyF','Key',M.lin(0,1),0.5,'pct'),S('velF','Vel',M.lin(0,1),0.2,'pct')]},
  {n:'VCA',c:RD,ctl:[S('level','Level',M.lin(0,1),0.8,'pct'),S('vcaLfo','LFO',M.sq(0,1),0,'pct'),S('velA','Vel',M.lin(0,1),0.5,'pct')]},
  {n:'ENV-1',c:CR,ctl:[S('a1','A',M.time(),0.005,'s'),S('d1','D',M.time(),0.6,'s'),S('s1','S',M.lin(0,1),0.3,'pct'),S('r1','R',M.time(),0.4,'s')]},
  {n:'ENV-2',c:CR,ctl:[S('a2','A',M.time(),0.003,'s'),S('d2','D',M.time(),0.5,'s'),S('s2','S',M.lin(0,1),0.8,'pct'),S('r2','R',M.time(),0.35,'s')]},
  {n:'Voice',c:OR,ctl:[Gp('mode','Mode',['POLY','UNISON','SOLO'],0),S('uniDet','Detune',M.lin(0,50),12,'ct'),S('porta','Glide',M.sq(0,2),0,'s'),S('analog','Analog',M.lin(0,1),0.4,'pct'),S('spread','Stereo',M.lin(0,1),0.4,'pct'),S('envKf','Env Key',M.lin(0,1),0,'pct')]},
  {n:'Arpeggio',c:YE,ctl:[Gp('arpMode','Mode',['OFF','UP','DOWN','UP/DN','RANDOM'],0),Gp('arpRange','Range',['1 OKT','2 OKT','3 OKT','4 OKT'],0),Gp('arpDiv','Rate',['1/4','1/8','1/8 T','1/16'],3),S('arpGate','Gate',M.lin(0.05,1),0.5,'pct'),Gp('arpHold','Hold',['OFF','ON'],0)]},
  {n:'Effekte',c:BL,ctl:[Gp('chorus','Chorus',['OFF','I','II'],0),S('dlyMix','Delay',M.lin(0,1),0,'pct'),Gp('dlyTime','Time',['1/4','1/8','3/16','1/16','1/8 T'],2),S('dlyFb','Feedb.',M.lin(0,0.9),0.35,'pct'),S('revMix','Hall',M.lin(0,1),0.15,'pct'),S('revSize','Größe',M.lin(0.5,6),2.5,'s')]}
];
const C={},CSEC={};for(const s of SECT)for(const c of s.ctl){C[c.k]=c;CSEC[c.k]=s.n;}
const FX=new Set(['chorus','dlyMix','dlyTime','dlyFb','revMix','revSize']);

const FACT=[
 {n:'Jump Brass',v:{v1Wave:1,v2Wave:1,v2Fine:8,mix1:.8,mix2:.7,cutoff:500,res:.12,envAmt:.42,keyF:.5,a1:.06,d1:.55,s1:.35,r1:.35,a2:.03,d2:.6,s2:.85,r2:.3,revMix:.18}},
 {n:"Strings 8'",v:{v1Wave:1,v2Wave:2,pwmAmt:.55,pwmSrc:0,lfoRate:.7,v2Fine:-6,cutoff:3200,res:.05,envAmt:.08,hpf:180,a1:.8,d1:1,s1:.8,r1:1.2,a2:.55,d2:1,s2:1,r2:1.3,chorus:2,revMix:.35,revSize:3.5,velF:.1}},
 {n:'Sync Lead',v:{v1Wave:1,v2Wave:1,sync:1,modEnv:19,modDest:0,mix1:1,mix2:.15,cutoff:4500,res:.22,envAmt:.15,a1:.001,d1:.7,s1:.15,r1:.3,a2:.005,d2:.4,s2:.9,r2:.25,mode:2,porta:.07,dlyMix:.25,dlyTime:2,revMix:.15}},
 {n:'Unison Bass',v:{v1Wave:1,v1Oct:1,v2Wave:2,v2Oct:1,pwmAmt:.3,pwmSrc:2,mode:1,uniDet:14,cutoff:260,res:.38,envAmt:.5,a1:.001,d1:.28,s1:0,r1:.15,a2:.002,d2:.3,s2:1,r2:.08,keyF:.3,revMix:0,spread:.7}},
 {n:'X-Mod Glocke',v:{v1Wave:0,v2Wave:0,v2Oct:3,v2Semi:7,xmod:.35,mix1:1,mix2:0,cutoff:9000,res:0,envAmt:0,a2:.001,d2:2.8,s2:0,r2:2.2,velA:.8,revMix:.45,revSize:4,dlyMix:.15}},
 {n:'Sweep Pad',v:{v1Wave:1,v2Wave:1,v2Fine:-9,cutoff:350,res:.55,envAmt:.38,lfoF:.25,lfoRate:.18,a1:2.5,d1:4,s1:.35,r1:3,a2:1.2,d2:2,s2:1,r2:3,chorus:1,revMix:.5,revSize:5,dlyMix:.15}},
 {n:'Pluck Arp',v:{arpMode:3,arpRange:1,arpDiv:3,arpGate:.45,v1Wave:2,v2Wave:1,v2Oct:3,pwmAmt:.25,pwmSrc:2,mix2:.4,cutoff:800,res:.35,envAmt:.55,a1:.001,d1:.22,s1:0,r1:.2,a2:.001,d2:.35,s2:0,r2:.3,dlyMix:.35,dlyTime:2,dlyFb:.45,revMix:.2}},
 {n:'Square Keys',v:{v1Wave:3,v2Wave:2,v2Oct:3,pwmAmt:.2,pwmSrc:2,mix1:.8,mix2:.35,cutoff:4200,res:.05,envAmt:.1,a2:.004,d2:.3,s2:1,r2:.08,chorus:1,revMix:.2}},
 /* Sounds im Stil von Depeche Mode (Annäherungen, keine Originalklänge) */
 {n:"DM-Stil · Can't Get Enough Lead",v:{v1Wave:1,v2Wave:1,v2Fine:6,mix1:1,mix2:.35,slope:0,cutoff:2300,res:.12,envAmt:.18,keyF:.6,a1:.001,d1:.35,s1:0,r1:.25,a2:.001,d2:.45,s2:0,r2:.3,velA:.3,dlyMix:.12,dlyTime:1,dlyFb:.25,revMix:.15}},
 {n:"DM-Stil · Can't Get Enough Bass",v:{v1Wave:2,v1Oct:1,pwmAmt:.25,pwmSrc:2,v2Wave:1,v2Oct:1,mix2:.5,cutoff:380,res:.2,envAmt:.45,a1:.001,d1:.2,s1:0,r1:.1,a2:.001,d2:.25,s2:.5,r2:.08,keyF:.4,revMix:0}},
 {n:'DM-Stil · Silence Bass',v:{mode:2,v1Wave:1,v1Oct:1,v2Wave:2,v2Oct:1,v2Fine:-5,cutoff:300,res:.3,envAmt:.32,a1:.001,d1:.35,s1:.25,r1:.15,a2:.001,d2:.5,s2:.7,r2:.1,porta:.02,keyF:.4,revMix:.05}},
 {n:'DM-Stil · Silence Chor',v:{v1Wave:2,v2Wave:2,v2Fine:-8,pwmAmt:.5,pwmSrc:0,lfoRate:.35,hpf:300,slope:0,cutoff:1500,res:.28,envAmt:.05,keyF:.3,a1:.5,d1:1,s1:.7,r1:1.2,a2:.45,d2:1,s2:1,r2:1.2,modLfo:.08,lfoDelay:.8,chorus:2,revMix:.45,revSize:4}},
 {n:'DM-Stil · Streicher',v:{v1Wave:1,v2Wave:1,v2Fine:-7,cutoff:2600,res:.05,envAmt:.1,hpf:220,a1:.7,d1:1,s1:.8,r1:1.4,a2:.7,d2:1,s2:1,r2:1.5,chorus:2,revMix:.42,revSize:4.5,velF:.15}},
 {n:'DM-Stil · Big Brass',v:{v1Wave:1,v2Wave:1,v2Fine:10,cutoff:700,res:.1,envAmt:.45,a1:.07,d1:.4,s1:.45,r1:.3,a2:.02,d2:.5,s2:.85,r2:.25,chorus:1,revMix:.25,velF:.4}},
 {n:'DM-Stil · Metall-Percussion',v:{v1Wave:2,v2Wave:0,v2Oct:3,v2Semi:6,xmod:.55,mix1:1,mix2:.2,cutoff:6000,res:.2,envAmt:0,a2:.001,d2:.9,s2:0,r2:.6,velA:.7,revMix:.3,dlyMix:.2,dlyTime:1}},
 {n:'DM-Stil · Weicher Lead',v:{mode:2,porta:.05,v1Wave:3,v2Wave:0,mix2:.4,slope:0,cutoff:2600,envAmt:.1,a2:.02,d2:.5,s2:.9,r2:.4,modLfo:.25,lfoRate:5.5,lfoDelay:.5,dlyMix:.25,dlyTime:2,revMix:.3}},
 /* Orchester-Bank (Annäherungen mit dem Synth; für echte Orchesterklänge MIDI-Ausgang + VST nutzen) */
 {n:'Orchester · Streicher-Ensemble',v:{v1Wave:1,v2Wave:1,v2Fine:-9,mix1:.8,mix2:.8,slope:0,cutoff:2800,res:.05,envAmt:.12,keyF:.5,velF:.35,hpf:150,a1:.6,d1:1.5,s1:.75,r1:1.2,a2:.45,d2:1,s2:1,r2:1.1,modLfo:.12,lfoRate:5,lfoDelay:.9,chorus:2,revMix:.5,revSize:5.5,spread:.8,analog:.6}},
 {n:'Orchester · Celli & Kontrabässe',v:{v1Wave:1,v1Oct:1,v2Wave:1,v2Oct:1,v2Fine:-7,slope:1,cutoff:700,res:.08,envAmt:.2,keyF:.4,velF:.45,a1:.25,d1:1.2,s1:.6,r1:.6,a2:.2,d2:1,s2:1,r2:.7,modLfo:.1,lfoRate:4.8,lfoDelay:.8,chorus:1,revMix:.4,revSize:5,spread:.6}},
 {n:'Orchester · Hörner',v:{v1Wave:1,v2Wave:2,pwmAmt:.15,pwmSrc:2,v2Fine:6,mix2:.6,slope:1,cutoff:520,res:.1,envAmt:.32,keyF:.5,velF:.55,a1:.18,d1:.9,s1:.5,r1:.5,a2:.12,d2:1,s2:.95,r2:.6,modLfo:.06,lfoRate:5,lfoDelay:1,chorus:1,revMix:.45,revSize:5,spread:.5}},
 {n:'Orchester · Tiefes Blech',v:{v1Wave:1,v1Oct:1,v2Wave:1,v2Oct:1,v2Fine:5,slope:1,cutoff:420,res:.12,envAmt:.4,keyF:.45,velF:.6,a1:.09,d1:.8,s1:.45,r1:.4,a2:.06,d2:.8,s2:.9,r2:.45,velA:.6,revMix:.4,revSize:5,spread:.4}},
 {n:'Orchester · Sub-Fundament',v:{mode:2,porta:.1,v1Wave:0,v1Oct:0,v2Wave:0,v2Oct:1,mix1:.8,mix2:.7,cutoff:180,res:0,envAmt:0,keyF:.3,a2:.4,d2:1,s2:1,r2:1.5,revMix:.1,spread:0}},
 {n:'Orchester · Felt-Klavier',v:{v1Wave:0,v2Wave:0,v2Oct:3,v2Fine:3,mix1:1,mix2:.25,slope:1,cutoff:1800,res:0,envAmt:.35,keyF:.8,velF:.6,a1:.001,d1:1.8,s1:0,r1:.5,a2:.002,d2:4,s2:0,r2:.7,velA:.8,envKf:.5,revMix:.45,revSize:4,dlyMix:.1}},
 {n:'Orchester · Chor Aah',v:{v1Wave:2,v2Wave:1,v2Fine:-8,pwmAmt:.45,pwmSrc:0,lfoRate:.3,hpf:350,slope:0,cutoff:1200,res:.35,envAmt:.05,keyF:.35,a1:.7,d1:1,s1:.8,r1:1.5,a2:.7,d2:1,s2:1,r2:1.5,modLfo:.07,lfoDelay:1,chorus:2,revMix:.55,revSize:5.5,spread:.7}},
 {n:'Orchester · Puls-Ostinato',v:{arpMode:1,arpRange:0,arpDiv:1,arpGate:.55,v1Wave:1,v2Wave:1,v2Fine:-6,cutoff:900,res:.25,envAmt:.35,a1:.001,d1:.25,s1:.1,r1:.2,a2:.003,d2:.3,s2:.6,r2:.25,dlyMix:.25,dlyTime:1,revMix:.35}}
];
const SETUPS=[{n:'Depeche Mode · Synth-Pop (A: Lead, B: Bass)',a:8,b:9,kit:0},{n:'Orchester · Time-Stil (A: Streicher, B: Tiefes Blech)',a:16,b:19,kit:1,bpm:62},
  {n:'Orchester · Hörner + Celli (A: Hörner, B: Celli/Bässe)',a:18,b:17,kit:1,bpm:62},{n:'Orchester · Klavier + Streicher (A: Felt-Klavier, B: Streicher)',a:21,b:16,kit:1,bpm:62}];
let USER=LS.get('kw.presets',[]);
const allPresets=()=>FACT.concat(USER);
function presetToSt(p){const st={};for(const k in C){const d=C[k],r=(p.v&&k in p.v)?p.v[k]:d.d;st[k]=d.t==='s'?clamp01(d.m[1](r)):Math.max(0,Math.min(d.o.length-1,r|0));}return st;}
function real(st,k){const d=C[k];if(d.t==='s'){const r=d.m[0](st[k]);return k==='v2Semi'?Math.round(r):r;}return d.v?d.v[st[k]]:st[k];}
function stToReal(st){const v={};for(const k in C)v[k]=real(st,k);return v;}
const parts=[{st:presetToSt(FACT[8]),preset:8},{st:presetToSt(FACT[10]),preset:10}];
let ed=0;

/* ================= Synth-Panel ================= */
const rows=$('#rows');
rows.innerHTML=SECT.map(s=>`<fieldset class="sec" style="--bc:${s.c}"><legend>${esc(s.n)}</legend><div class="ctls">${s.ctl.map(c=>c.t==='s'?
 `<div class="ctl" data-learn="p:${c.k}" data-name="${esc(s.n+' '+c.l)}"><div class="fd" tabindex="0" data-k="${c.k}" role="slider" aria-label="${esc(s.n+' '+c.l)}"><div class="cap"></div></div><div class="val" data-v="${c.k}"></div><div class="lbl">${esc(c.l)}</div></div>`:
 `<div class="ctl g" data-learn="p:${c.k}" data-name="${esc(s.n+' '+c.l)}"><div class="sw" data-k="${c.k}">${c.o.map((o,i)=>`<button data-i="${i}"><i></i>${esc(o)}</button>`).join('')}</div><div class="lbl">${esc(c.l)}</div></div>`).join('')}</div></fieldset>`).join('');
function render(k){const d=C[k],st=parts[ed].st;
  if(d.t==='s'){const f=rows.querySelector(`.fd[data-k="${k}"]`),txt=FMT[d.f](real(st,k));f.style.setProperty('--n',st[k]);f.setAttribute('aria-valuetext',txt);rows.querySelector(`[data-v="${k}"]`).textContent=txt;}
  else rows.querySelectorAll(`.sw[data-k="${k}"] button`).forEach((b,i)=>b.classList.toggle('on',i===st[k]));}
function renderAll(){for(const k in C)render(k);renderKnobs();}
function setP(k,v,pi=ed){const p=parts[pi];p.st[k]=C[k].t==='s'?clamp01(v):v;if(pi===ed){render(k);renderKnobs();}apply(pi,k);}
const learning=()=>document.body.classList.contains('learn');
rows.addEventListener('click',e=>{const b=e.target.closest('.sw button');if(!b||learning())return;setP(b.parentNode.dataset.k,+b.dataset.i);});
rows.addEventListener('pointerdown',e=>{const f=e.target.closest('.fd');if(!f||learning())return;
  f.setPointerCapture(e.pointerId);f.focus();const k=f.dataset.k;
  const mv=ev=>{const r=f.getBoundingClientRect();setP(k,1-(ev.clientY-r.top-9)/(r.height-18));};mv(e);
  const up=()=>{f.removeEventListener('pointermove',mv);f.removeEventListener('pointerup',up);f.removeEventListener('pointercancel',up);};
  f.addEventListener('pointermove',mv);f.addEventListener('pointerup',up);f.addEventListener('pointercancel',up);});
rows.addEventListener('wheel',e=>{const f=e.target.closest('.fd');if(!f)return;e.preventDefault();const k=f.dataset.k;setP(k,parts[ed].st[k]-e.deltaY*0.0007);},{passive:false});
rows.addEventListener('keydown',e=>{const f=e.target.closest('.fd');if(!f)return;const k=f.dataset.k,s=e.shiftKey?0.002:0.02;
  if(e.key==='ArrowUp'||e.key==='ArrowRight'){setP(k,parts[ed].st[k]+s);e.preventDefault();}if(e.key==='ArrowDown'||e.key==='ArrowLeft'){setP(k,parts[ed].st[k]-s);e.preventDefault();}});
rows.addEventListener('dblclick',e=>{const f=e.target.closest('.fd');if(!f)return;const k=f.dataset.k;setP(k,C[k].m[1](C[k].d));});

/* ================= Audio ================= */
let A=null,NODE=null;
const DLY=[1,.5,.75,.25,1/3];
async function loadEngine(ctx){
  const src=id=>window.KW_SRC[id==='w-synth'?'synth':'loop'];
  const tries=[id=>'data:text/javascript;charset=utf-8,'+encodeURIComponent(src(id)),id=>URL.createObjectURL(new Blob([src(id)],{type:'text/javascript'}))];
  if(ctx.audioWorklet)for(const mk of tries){try{await ctx.audioWorklet.addModule(mk('w-synth'));await ctx.audioWorklet.addModule(mk('w-loop'));
    return(c,name,inCh)=>new AudioWorkletNode(c,name,inCh?{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2],channelCount:inCh,channelCountMode:'explicit',channelInterpretation:'discrete'}:{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2]});}
    catch(e){console.warn('Worklet-Variante fehlgeschlagen',e);}}
  const classes={};let nextPort=null,frame=0;
  const scope={sampleRate:ctx.sampleRate,get currentFrame(){return frame;},registerProcessor:(n,c)=>{classes[n]=c;},AudioWorkletProcessor:class{constructor(){this.port=nextPort;}}};
  for(const id of ['w-synth','w-loop'])new Function('scope','with(scope){'+src(id)+'}')(scope);
  toast('Kompatibilitätsmodus: etwas mehr Latenz');
  return(c,name,inCh)=>{
    const ic=inCh||1,sp=c.createScriptProcessor(512,ic,2),a={onmessage:null},b={onmessage:null};
    sp.channelInterpretation='discrete';
    a.postMessage=m=>{b.onmessage&&b.onmessage({data:m});};b.postMessage=m=>{a.onmessage&&a.onmessage({data:m});};
    nextPort=b;const proc=new classes[name]();sp.port=a;
    if(!inCh&&c.createConstantSource){const z=c.createConstantSource();z.offset.value=0;z.connect(sp);z.start();}
    sp.onaudioprocess=e=>{const ib=[];for(let k=0;k<ic;k++)ib.push(e.inputBuffer.getChannelData(k));
      const oL=e.outputBuffer.getChannelData(0),oR=e.outputBuffer.getChannelData(1),f0=Math.round(e.playbackTime*c.sampleRate);
      for(let o=0;o<oL.length;o+=128){frame=f0+o;proc.process([ib.map(x=>x.subarray(o,o+128))],[[oL.subarray(o,o+128),oR.subarray(o,o+128)]]);}};
    return sp;};
}
function makeIR(ctx,sec){const sr=ctx.sampleRate,n=Math.floor(sr*sec),b=ctx.createBuffer(2,n,sr);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);let lp=0;for(let i=0;i<n;i++){lp+=((Math.random()*2-1)-lp)*0.55;d[i]=lp*Math.pow(1-i/n,2.6)*(i<sr*0.012?i/(sr*0.012):1);}}return b;}
function buildPart(ctx,bus){
  const syn=NODE(ctx,'p8-synth',0);
  const ch={inp:ctx.createGain(),out:ctx.createGain(),dry:ctx.createGain(),wet:ctx.createGain(),lfo:ctx.createOscillator(),dep:ctx.createGain()};
  syn.connect(ch.inp);ch.inp.connect(ch.dry).connect(ch.out);ch.lfo.connect(ch.dep);ch.lfo.start();
  const inv=ctx.createGain();inv.gain.value=-1;ch.dep.connect(inv);
  for(const [mod,pan] of [[ch.dep,-0.85],[inv,0.85]]){const d=ctx.createDelay(0.05);d.delayTime.value=0.0035;mod.connect(d.delayTime);const p=ctx.createStereoPanner();p.pan.value=pan;ch.inp.connect(d).connect(p).connect(ch.wet);}
  ch.wet.connect(ch.out);ch.wet.gain.value=0;ch.out.connect(bus);
  const dS=ctx.createGain(),dl=ctx.createDelay(2),fb=ctx.createGain(),dlp=ctx.createBiquadFilter();dlp.type='lowpass';dlp.frequency.value=4200;
  ch.out.connect(dS).connect(dl).connect(dlp).connect(fb).connect(dl);dlp.connect(bus);
  const rS=ctx.createGain(),cv=ctx.createConvolver();cv.buffer=makeIR(ctx,2.5);ch.out.connect(rS).connect(cv).connect(bus);
  return{syn,ch,dS,dl,fb,rS,cv,irT:0};
}
async function initAudio(){
  const ctx=new AudioContext({latencyHint:'interactive'});
  NODE=await loadEngine(ctx);
  const G=()=>ctx.createGain();
  const live=G(),master=G(),comp=ctx.createDynamicsCompressor();
  comp.threshold.value=-6;comp.knee.value=4;comp.ratio.value=12;comp.attack.value=0.003;comp.release.value=0.15;
  live.connect(master);master.connect(comp).connect(ctx.destination);
  const merger=ctx.createChannelMerger(8);
  const tap=(node,c)=>{const sp=ctx.createChannelSplitter(2);node.connect(sp);sp.connect(merger,0,c);sp.connect(merger,1,c+1);};
  const loop=NODE(ctx,'p8-looper',8);merger.connect(loop);loop.connect(master);
  /* Mixer-Kanäle: Eingang -> Panorama -> Fader -> Meter -> Summe (und in den Looper) */
  const chan=(c,toLive=true)=>{const inp=G(),pan=ctx.createStereoPanner(),g=G(),an=ctx.createAnalyser();an.fftSize=512;inp.connect(pan).connect(g).connect(an);if(toLive)g.connect(live);tap(g,c);return{inp,pan,g,an};};
  const CHN={A:chan(0),B:chan(2),D:chan(4),I:chan(6,false)};
  const mon=G();mon.gain.value=0;CHN.I.g.connect(mon).connect(master);
  const man=ctx.createAnalyser();man.fftSize=512;comp.connect(man);
  A={ctx,sr:ctx.sampleRate,master,loop,drums:CHN.D.inp,inGain:CHN.I.inp,mon,CHN,man,P:[buildPart(ctx,CHN.A.inp),buildPart(ctx,CHN.B.inp)],inStream:null,inSrc:null};
  applyMix();
  loop.port.onmessage=e=>onLoop(e.data);
  makeDrums();
  sendAll(0);sendAll(1);sendCfg();
}
function sendAll(pi){const st=parts[pi].st,p={bpm};for(const k in C)if(!FX.has(k))p[k]=real(st,k);A.P[pi].syn.port.postMessage({t:'p',p});for(const k of FX)fx(pi,k);}
function apply(pi,k){if(!A)return;if(FX.has(k))fx(pi,k);else A.P[pi].syn.port.postMessage({t:'p',p:{[k]:real(parts[pi].st,k)}});}
function fx(pi,k){const P=A.P[pi],st=parts[pi].st,t=A.ctx.currentTime,v=real(st,k);
  if(k==='chorus'){const c=P.ch;c.wet.gain.setTargetAtTime(v?0.6:0,t,0.02);c.dry.gain.setTargetAtTime(v?0.82:1,t,0.02);c.lfo.frequency.value=v===2?0.83:0.5;c.dep.gain.value=v===2?0.0024:0.0016;}
  else if(k==='dlyMix')P.dS.gain.setTargetAtTime(v,t,0.02);
  else if(k==='dlyFb')P.fb.gain.setTargetAtTime(v,t,0.02);
  else if(k==='dlyTime')P.dl.delayTime.setTargetAtTime(Math.min(1.99,60/bpm*DLY[v]),t,0.05);
  else if(k==='revMix')P.rS.gain.setTargetAtTime(v,t,0.02);
  else if(k==='revSize'){clearTimeout(P.irT);P.irT=setTimeout(()=>{P.cv.buffer=makeIR(A.ctx,v);},200);}}

/* ================= Drums ================= */
function bq(x,type,f,q,sr){const w=2*Math.PI*f/sr,cs=Math.cos(w),al=Math.sin(w)/(2*q);let b0,b1,b2;
  if(type==='hp'){b0=(1+cs)/2;b1=-(1+cs);b2=b0;}else{b0=al;b1=0;b2=-al;}
  const a0=1+al,a1=-2*cs,a2=1-al;let x1=0,x2=0,y1=0,y2=0;for(let i=0;i<x.length;i++){const y=(b0*x[i]+b1*x1+b2*x2-a1*y1-a2*y2)/a0;x2=x1;x1=x[i];y2=y1;y1=y;x[i]=y;}return x;}
const noise=n=>{const a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;return a;};
const KITS=[{n:'Elektro',p:[{n:'Kick'},{n:'Snare'},{n:'Hat zu',ch:1},{n:'Hat offen',ch:1},{n:'Clap'},{n:'Tom'},{n:'Rim'},{n:'Cowbell'}]},
  {n:'Orchester',p:[{n:'Pauke tief'},{n:'Pauke hoch'},{n:'Gran Cassa'},{n:'Taiko'},{n:'Becken-Swell'},{n:'Becken'},{n:'Tam-Tam'},{n:'Orchester-Hit'}]}];
let kit=0,pads=KITS[0].p;
function setKit(k){kit=k;pads=KITS[k].p;$$('#kits button').forEach(b=>b.classList.toggle('on',+b.dataset.kit===k));renderPads();}
function makeDrums(){
  const sr=A.sr,T=Math.PI*2,pads=KITS[0].p,O=KITS[1].p;
  const mk=(sec,fn)=>{const n=Math.floor(sec*sr),b=A.ctx.createBuffer(2,n,sr),L=b.getChannelData(0);fn(L,n);b.getChannelData(1).set(L);return b;};
  pads[0].buf=mk(0.6,(L,n)=>{let ph=0;for(let i=0;i<n;i++){const t=i/sr;ph+=(46+135*Math.exp(-t*30))/sr;L[i]=Math.tanh(1.6*(Math.sin(T*ph)*Math.exp(-t*5.5)+(t<0.004?(Math.random()*2-1)*0.35*(1-t/0.004):0)))*0.85;}});
  pads[1].buf=mk(0.4,(L,n)=>{const z=bq(noise(n),'hp',1300,0.7,sr);for(let i=0;i<n;i++){const t=i/sr;L[i]=(Math.sin(T*185*t)*Math.exp(-t*22)*0.5+Math.sin(T*330*t)*Math.exp(-t*30)*0.22+z[i]*Math.exp(-t*13)*0.65)*0.9;}});
  pads[2].buf=mk(0.15,(L,n)=>{const z=bq(bq(noise(n),'hp',7000,0.7,sr),'hp',7000,0.7,sr);for(let i=0;i<n;i++)L[i]=z[i]*Math.exp(-i/sr*55)*0.7;});
  pads[3].buf=mk(0.7,(L,n)=>{const z=bq(bq(noise(n),'hp',6500,0.7,sr),'hp',6500,0.7,sr);for(let i=0;i<n;i++)L[i]=z[i]*Math.exp(-i/sr*6.5)*0.55;});
  pads[4].buf=mk(0.45,(L,n)=>{const z=bq(noise(n),'bp',1200,1.1,sr);for(let i=0;i<n;i++){const t=i/sr,e=t<0.03?Math.exp(-(t%0.01)*320):Math.exp(-(t-0.03)*16);L[i]=z[i]*e*1.6;}});
  pads[5].buf=mk(0.6,(L,n)=>{let ph=0;for(let i=0;i<n;i++){const t=i/sr;ph+=(92+60*Math.exp(-t*12))/sr;L[i]=Math.sin(T*ph)*Math.exp(-t*7)*0.8;}});
  pads[6].buf=mk(0.12,(L,n)=>{const z=bq(noise(n),'bp',3200,1.5,sr);for(let i=0;i<n;i++){const t=i/sr;L[i]=Math.sin(T*1700*t)*Math.exp(-t*90)*0.6+z[i]*Math.exp(-t*120)*0.5;}});
  pads[7].buf=mk(0.5,(L,n)=>{for(let i=0;i<n;i++){const t=i/sr;L[i]=((t*545%1<0.5?1:-1)+(t*815%1<0.5?1:-1))*0.5;}bq(L,'bp',820,2.2,sr);for(let i=0;i<n;i++)L[i]*=Math.exp(-i/sr*9)*1.2;});
  /* Orchester-Schlagwerk (synthetisch) */
  const timp=(f0,sec)=>mk(sec,(L,n)=>{const z=bq(noise(n),'bp',f0*3,0.8,sr);let p1=0,p2=0,p3=0;for(let i=0;i<n;i++){const t=i/sr,f=f0*(1+0.06*Math.exp(-t*9));p1+=f/sr;p2+=f*1.505/sr;p3+=f*1.99/sr;
    L[i]=(Math.sin(T*p1)*Math.exp(-t*1.3)+0.45*Math.sin(T*p2)*Math.exp(-t*2.2)+0.25*Math.sin(T*p3)*Math.exp(-t*3)+z[i]*Math.exp(-t*30)*0.6)*0.75;}});
  O[0].buf=timp(65,3);O[1].buf=timp(98,2.6);
  O[2].buf=mk(3,(L,n)=>{const z=bq(noise(n),'bp',90,0.7,sr);let ph=0;for(let i=0;i<n;i++){const t=i/sr;ph+=(42+18*Math.exp(-t*6))/sr;L[i]=Math.tanh((Math.sin(T*ph)*Math.exp(-t*1.4)+z[i]*Math.exp(-t*2.5)*1.2)*1.3)*0.85;}});
  O[3].buf=mk(1.2,(L,n)=>{const z=bq(noise(n),'bp',320,1,sr);let ph=0;for(let i=0;i<n;i++){const t=i/sr;ph+=(62+70*Math.exp(-t*14))/sr;L[i]=Math.tanh((Math.sin(T*ph)*Math.exp(-t*3.6)+z[i]*Math.exp(-t*12)*1.4)*2)*0.8;}});
  O[4].buf=mk(3,(L,n)=>{const z=bq(bq(noise(n),'hp',3500,0.7,sr),'bp',7000,0.5,sr);for(let i=0;i<n;i++){const t=i/sr,e=t<2.8?Math.pow(t/2.8,2.5):Math.max(0,1-(t-2.8)/0.05);L[i]=z[i]*e*1.4;}});
  O[5].buf=mk(3.5,(L,n)=>{const z=bq(noise(n),'hp',3200,0.7,sr),z2=bq(noise(n),'bp',5200,3,sr);for(let i=0;i<n;i++){const t=i/sr;L[i]=(z[i]*Math.exp(-t*1.6)*0.6+z2[i]*Math.exp(-t*1.1)*0.8)*(t<0.004?t/0.004:1);}});
  O[6].buf=mk(5.5,(L,n)=>{const fr=Array.from({length:24},()=>60+Math.random()*700),ph=fr.map(()=>Math.random());for(let i=0;i<n;i++){const t=i/sr;let v=0;for(let k=0;k<24;k++)v+=Math.sin(T*(fr[k]*t+ph[k]))*Math.exp(-t*(0.5+k*0.04));L[i]=v/9*Math.min(1,t/0.06)*Math.exp(-t*0.45);}});
  O[7].buf=mk(1,(L,n)=>{const fs=[65.4,130.8,155.6,196,261.6,311.1,392,523.3],z=bq(noise(n),'bp',1500,0.7,sr);for(let i=0;i<n;i++){const t=i/sr;let v=0;for(const f of fs)v+=2*((t*f*(1+0.002*Math.sin(f)))%1)-1;L[i]=Math.tanh((v/5+z[i]*Math.exp(-t*25))*1.5)*Math.exp(-t*3.2)*0.8;}bq(L,'bp',900,0.4,sr);});
}
const chokes={};
function playDrum(i,vel,k=kit){const p=KITS[k].p[i];if(!A||!p.buf)return;const s=A.ctx.createBufferSource(),g=A.ctx.createGain();s.buffer=p.buf;g.gain.value=0.25+0.75*vel;s.connect(g).connect(A.drums);
  if(p.ch){const o=chokes[p.ch];if(o)try{o.g.gain.setTargetAtTime(0,A.ctx.currentTime,0.01);o.s.stop(A.ctx.currentTime+0.06);}catch(e){}chokes[p.ch]={s,g};}s.start();}

/* ================= Presets / Patch-Bank ================= */
const BANKC=['#d9452f','#e8642c','#eda23a','#e6c93a','#e9e2cf','#9fc8d0','#6a9fd8','#8a74c8'];
const bankEl=$('#bank');
bankEl.innerHTML=Array.from({length:16},(_,i)=>`<button class="pb" style="--bc:${BANKC[i%8]}" data-pb="${i}" data-learn="a:patch${i}" data-name="Patch ${i+1}"><i></i>${i+1}</button>`).join('');
let bankPg=0;
$('#bankPg').addEventListener('click',()=>{if(learning())return;bankPg=(bankPg+1)%Math.max(1,Math.ceil(allPresets().length/16));renderPresetList();});
const presetSel=$('#preset');
function renderPresetList(){const pl=allPresets();presetSel.innerHTML=pl.map((p,i)=>`<option value="${i}">${String(i+1).padStart(2,'0')} ${i<FACT.length?'':'★ '}${esc(p.n)}</option>`).join('');presetSel.value=parts[ed].preset;
  $('#bankPg').textContent='Bank '+(bankPg+1);
  $$('.pb').forEach((b,i)=>{const j=bankPg*16+i;b.title=pl[j]?pl[j].n:'';b.lastChild.textContent=j+1;b.disabled=!pl[j];b.classList.toggle('on',parts[ed].preset===j);});renderLCD();}
function renderLCD(){const o=typeof outSel!=='undefined'?outSel[ed]:null;
  if(o&&o.mode==='ext'){const sl=SLOTS[o.slot];$('#lcd').innerHTML=`${ed?'B':'A'}-VST<small>${esc(('Slot '+(o.slot+1)+': '+(sl?sl.name:'')).toUpperCase())}</small>`;return;}
  const p=allPresets()[parts[ed].preset];$('#lcd').innerHTML=`${ed?'B':'A'}-${String(parts[ed].preset+1).padStart(2,'0')}<small>${esc((p?p.n:'').toUpperCase())}${o&&o.mode==='both'?' + VST':''}</small>`;}
function loadPresetIdx(i,pi=ed){const pl=allPresets();if(!pl[i])return;parts[pi].preset=i;if(pi===ed)bankPg=Math.floor(i/16);parts[pi].st=presetToSt(pl[i]);if(pi===ed){renderAll();renderPresetList();}if(A)sendAll(pi);renderPads();info((pi?'Part B':'Part A')+': '+pl[i].n);}
bankEl.addEventListener('click',e=>{const b=e.target.closest('.pb');if(b&&!learning())loadPresetIdx(bankPg*16+(+b.dataset.pb));});
$('#setup').innerHTML='<option value="">Setup laden …</option>'+SETUPS.map((x,i)=>`<option value="${i}">${esc(x.n)}</option>`).join('');
$('#setup').addEventListener('change',e=>{const x=SETUPS[+e.target.value];e.target.value='';if(!x)return;
  loadPresetIdx(x.a,0);loadPresetIdx(x.b,1);setKit(x.kit);if(x.bpm&&!locked())setBpm(x.bpm);bankPg=Math.floor(x.a/16);setEd(0);toast('Setup: '+x.n);});
presetSel.addEventListener('change',()=>loadPresetIdx(+presetSel.value));
$('#psave').addEventListener('click',()=>{const n=$('#pname').value.trim()||('Eigenes '+(USER.length+1));const ex=USER.findIndex(p=>p.n===n);const p={n,v:stToReal(parts[ed].st)};
  if(ex>=0)USER[ex]=p;else USER.push(p);LS.set('kw.presets',USER);parts[ed].preset=FACT.length+(ex>=0?ex:USER.length-1);renderPresetList();renderPads();toast('Preset „'+n+'“ gespeichert');});
$('#pdel').addEventListener('click',()=>{const i=+presetSel.value;if(i<FACT.length){toast('Werks-Presets lassen sich nicht löschen');return;}const n=USER[i-FACT.length].n;USER.splice(i-FACT.length,1);LS.set('kw.presets',USER);parts[ed].preset=0;renderPresetList();renderPads();toast('„'+n+'“ gelöscht');});
function download(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);}
$('#exp').addEventListener('click',()=>download('klangwerk-einstellungen.json',new Blob([JSON.stringify({presets:USER,maps,roles,padmap:PADMAP,slots:SLOTS,songs:SONGS,out:outSel,partA:stToReal(parts[0].st),partB:stToReal(parts[1].st)},null,1)],{type:'application/json'})));
$('#impBtn').addEventListener('click',()=>$('#imp').click());
$('#imp').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());
  if(Array.isArray(j.presets)){USER=j.presets.filter(p=>p&&typeof p.n==='string'&&p.v);LS.set('kw.presets',USER);}
  if(j.maps&&typeof j.maps==='object'){maps=j.maps;LS.set('kw.maps',maps);}
  if(j.roles&&typeof j.roles==='object'){roles=j.roles;LS.set('kw.roles',roles);}
  if(j.padmap&&j.padmap.L&&j.padmap.R){PADMAP=j.padmap;LS.set('kw.padmap',PADMAP);}
  if(Array.isArray(j.slots)){SLOTS=j.slots;LS.set('kw.slots',SLOTS);}
  if(Array.isArray(j.songs)){SONGS=j.songs.filter(okSong);saveSongs();renderSongs();}
  if(Array.isArray(j.out)&&j.out.length===2&&j.out[0].slot!==undefined){outSel=j.out;LS.set('kw.out',outSel);}
  if(j.partA)parts[0].st=presetToSt({v:j.partA});if(j.partB)parts[1].st=presetToSt({v:j.partB});
  renderPresetList();renderAll();renderPads();renderMaps();renderDevs();renderCtl();if(A){sendAll(0);sendAll(1);}toast('Einstellungen importiert');}catch(err){toast('Datei ist keine gültige Klangwerk-Datei');}e.target.value='';});
function setEd(p){ed=p;document.body.classList.toggle('partB',p===1);$$('#parts button').forEach(b=>b.classList.toggle('on',+b.dataset.p===p));renderAll();renderPresetList();renderPads();}
$('#parts').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!learning())setEd(+b.dataset.p);});

/* ================= Transport ================= */
let bpm=120,running=false,metro=false,quant=true,countIn=false,after='play';
const bpmEl=$('#bpm');
const TC=['#ff6a2b','#ffc23d','#3ec7c2','#7fd46b','#6a9fd8','#b48cff','#ff6fae','#e9e2cf'];
const LT=Array.from({length:8},()=>({st:'empty',mute:false,solo:false,stop:false,pStop:false,pStart:false,rev:false,undo:false,redo:false,has:false,bars:2,src:0,vol:.85,pan:0,fb:1,len:0,peaks:null}));
let pos={rel:-1,beat:24000,bar:96000,t:0,run:false},selT=0;
const locked=()=>LT.some(t=>t.st!=='empty');
function sendCfg(){if(A)A.loop.port.postMessage({t:'cfg',bpm,metro,quant,after});}
function setBpm(v){v=Math.max(40,Math.min(240,Math.round(v)));if(locked()){toast('Tempo gesperrt, solange Spuren belegt sind');bpmEl.value=bpm;return;}
  bpm=v;bpmEl.value=v;if(A)for(let pi=0;pi<2;pi++){A.P[pi].syn.port.postMessage({t:'p',p:{bpm}});fx(pi,'dlyTime');}sendCfg();}
bpmEl.addEventListener('change',()=>setBpm(+bpmEl.value));
let tStart=0;
function transport(run){if(!A)return;running=run;const start=Math.round((A.ctx.currentTime+0.06)*A.sr);tStart=start;
  const m={t:'tr',run,start};A.loop.port.postMessage(m);A.P[0].syn.port.postMessage(m);A.P[1].syn.port.postMessage(m);
  const b=$('#play');b.textContent=run?'Stop':'Start';b.classList.toggle('on',run);}
let taps=[];
function tap(){const t=performance.now();taps=taps.filter(x=>t-x<2500);taps.push(t);if(taps.length>=2)setBpm(60000/((taps[taps.length-1]-taps[0])/(taps.length-1)));if(taps.length>5)taps.shift();}
function toggleMetro(){metro=!metro;$('#metro').classList.toggle('on',metro);sendCfg();}
$('#quant').addEventListener('click',()=>{quant=!quant;$('#quant').classList.toggle('on',quant);sendCfg();});
$('#cntIn').addEventListener('click',()=>ACT.countIn());
$('#after').addEventListener('change',e=>{after=e.target.value;sendCfg();});
$('#vol').addEventListener('input',e=>{MX.M.n=+e.target.value;applyMix();renderMixer();});

/* ================= Looper ================= */
const lanesEl=$('#lanes');
const DESK=!!window.KWD;
const SRC=DESK?['Alles inkl. VST','Part A','Part B','Drums','Eingang']:['Alles','Part A','Part B','Drums','Eingang'],BARS=[1,2,4,8,16];
const SRCX={6:'Eingang 1',7:'Eingang 2'};
const srcName=k=>k>=10?'VST-Slot '+(k-9):SRCX[k]||SRC[k]||'';
const srcOpts=()=>SRC.map((s,k)=>`<option value="${k}">${k===4?'Eingang (beide)':s}</option>`).join('')+'<option value="6">Eingang 1</option><option value="7">Eingang 2</option>'+(DESK?'<optgroup label="Nur Plugin">'+Array.from({length:8},(_,k)=>`<option value="${10+k}">VST-Slot ${k+1}</option>`).join('')+'</optgroup>':'');
lanesEl.innerHTML=TC.map((c,i)=>`<div class="lane" data-i="${i}" style="--tc:${c}">
 <div class="ln"><b>${i+1}</b><span>leer</span></div>
 <div class="lcfg"><select data-src aria-label="Quelle Spur ${i+1}">${srcOpts()}</select><select data-bars aria-label="Länge Spur ${i+1}">${BARS.map(b=>`<option value="${b}"${b===2?' selected':''}>${b} Takt${b>1?'e':''}</option>`).join('')}</select></div>
 <canvas></canvas>
 <div class="lbtn"><button class="recb" data-act="rec${i}" data-learn="a:rec${i}" data-name="Spur ${i+1} Rec">Rec</button><button data-act="stop${i}" data-learn="a:stop${i}" data-name="Spur ${i+1} Stop/Start">Stop</button><button data-act="mute${i}" data-learn="a:mute${i}" data-name="Spur ${i+1} Mute">M</button><button data-act="solo${i}" data-learn="a:solo${i}" data-name="Spur ${i+1} Solo">S</button><button data-act="rev${i}" data-learn="a:rev${i}" data-name="Spur ${i+1} Rückwärts">Rev</button><button data-act="undo${i}" data-learn="a:undo${i}" data-name="Spur ${i+1} Undo">Undo</button><button data-act="clear${i}" data-learn="a:clear${i}" data-name="Spur ${i+1} Löschen">Leeren</button></div>
 <div class="lmix"><span>Vol</span><input type="range" data-k="vol" min="0" max="1.25" step="0.01" value="0.85" aria-label="Lautstärke Spur ${i+1}"><span>Pan</span><input type="range" data-k="pan" min="-1" max="1" step="0.01" value="0" aria-label="Panorama Spur ${i+1}"><span>Dub</span><input type="range" data-k="fb" min="0.5" max="1" step="0.01" value="1" aria-label="Overdub-Abklingen Spur ${i+1}"></div>
</div>`).join('');
const lanes=$$('.lane');
function loopMsg(t,i,extra){if(A)A.loop.port.postMessage({t,i,...extra});}
function loopSet(i,v){Object.assign(LT[i],v);loopMsg('set',i,{v});}
function loopRec(i){if(!A)return;selectT(i);const ci=countIn&&LT[i].st==='empty';if(!running)transport(true);loopMsg('rec',i,{ci});}
function selectT(i){selT=(i+8)%8;lanes.forEach((l,k)=>l.classList.toggle('sel',k===selT));}
lanesEl.addEventListener('input',e=>{const l=e.target.closest('.lane');if(!l||!e.target.dataset.k)return;const v={[e.target.dataset.k]:+e.target.value};loopSet(+l.dataset.i,v);if(e.target.dataset.k==='vol')renderKnobs();});
lanesEl.addEventListener('change',e=>{const l=e.target.closest('.lane');if(!l)return;const i=+l.dataset.i;
  if('src'in e.target.dataset)loopSet(i,{src:+e.target.value});
  if('bars'in e.target.dataset){if(LT[i].st!=='empty'){toast('Länge erst nach „Leeren“ änderbar');e.target.value=LT[i].bars;return;}loopMsg('bars',i,{v:+e.target.value});}});
lanesEl.addEventListener('click',e=>{const l=e.target.closest('.lane');if(l&&!e.target.closest('button,select,input'))selectT(+l.dataset.i);});
const LST={empty:'leer',arm:'wartet',rec:'Aufnahme',play:'läuft',od:'Overdub'};
function renderLanes(){lanes.forEach((el,i)=>{const t=LT[i],s=el.querySelector('.ln span');
  let txt=LST[t.st];if(t.has&&t.st==='play'){if(t.stop)txt='gestoppt';if(t.pStop)txt='stoppt …';if(t.pStart)txt='startet …';}
  if(t.st==='arm'&&countIn)txt='Einzähler';s.textContent=txt;s.className=t.stop&&t.st==='play'?'':t.st;
  const r=el.querySelector('.recb');r.textContent={empty:'Rec',arm:'Abbruch',rec:'Stopp',play:'Dub',od:'Dub aus'}[t.st];r.className='recb '+t.st;
  const q=a=>el.querySelector(`[data-act="${a}${i}"]`);
  q('stop').textContent=t.stop?'Start':'Stop';q('stop').disabled=!t.has;q('stop').classList.toggle('on',t.pStop||t.pStart);
  q('mute').classList.toggle('on',t.mute);q('solo').classList.toggle('on',t.solo);q('rev').classList.toggle('on',t.rev);
  q('undo').disabled=!(t.undo||t.redo);q('undo').textContent=t.redo?'Redo':'Undo';
  el.querySelector('[data-src]').value=t.src;el.querySelector('[data-bars]').value=t.bars;el.querySelector('[data-bars]').disabled=t.st!=='empty';
  for(const k of ['vol','pan','fb']){const inp=el.querySelector(`[data-k="${k}"]`);if(document.activeElement!==inp)inp.value=t[k];}});
  bpmEl.disabled=locked();}
/* Desktop: Plugin-Klang in den Looper holen. Die App schneidet jeden Slot mit; nach einer Aufnahme
   wird genau der gehörte Abschnitt geholt und in die Spur gemischt. */
let vstOff=+LS.get('kw.vstOff',0)||0;
function slotsForSrc(src){const has=i=>SLOTS[i]&&SLOTS[i].plugin;
  if(src>=10)return has(src-10)?[src-10]:[];
  if(src===0)return SLOTS.map((_,i)=>i).filter(has);
  if(src===1||src===2){const o=outSel[src-1];return o.mode!=='int'&&has(o.slot)?[o.slot]:[];}
  return[];}
function frameToEpoch(f){const ts=A.ctx.getOutputTimestamp();return performance.timeOrigin+ts.performanceTime+(f/A.sr-ts.contextTime)*1000;}
function vstIntoLoop(m){if(!DESK||!A)return;const sl=slotsForSrc(m.src);if(!sl.length)return;
  const t0=frameToEpoch(tStart+m.r0)+vstOff,t1=frameToEpoch(tStart+m.r1)+vstOff;
  setTimeout(()=>{KWD.call('kwCapture',sl,t0,t1,A.sr).then(r=>{if(!r||!r.id){toast('Plugin-Klang konnte nicht übernommen werden');return;}
    return fetch('capture/'+r.id).then(x=>x.arrayBuffer()).then(buf=>{const d=new Float32Array(buf);A.loop.port.postMessage({t:'inject',i:m.i,r0:m.r0,n:r.n,d},[d.buffer]);});}).catch(()=>toast('Plugin-Klang konnte nicht übernommen werden'));},450);}
function onLoop(m){
  if(m.t==='st'){m.s.forEach((x,i)=>Object.assign(LT[i],x));renderLanes();renderPads();renderKnobs();}
  else if(m.t==='span')vstIntoLoop(m);
  else if(m.t==='peaks')LT[m.i].peaks=m.d;
  else if(m.t==='pos')pos={rel:m.rel,beat:m.beat,bar:m.bar,t:A.ctx.currentTime,run:m.run};
  else if(m.t==='mix'){if(!m.any){toast('Keine Spuren zum Exportieren');return;}download('klangwerk-loop.wav',wav(m.L,m.R,m.sr));}
}
function wav(L,R,sr){const n=L.length,b=new ArrayBuffer(44+n*4),v=new DataView(b);const ws=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
  ws(0,'RIFF');v.setUint32(4,36+n*4,true);ws(8,'WAVE');ws(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,sr,true);v.setUint32(28,sr*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);ws(36,'data');v.setUint32(40,n*4,true);
  let o=44;for(let i=0;i<n;i++){for(const x of [L[i],R[i]]){const s=Math.max(-1,Math.min(1,x));v.setInt16(o,s<0?s*32768:s*32767,true);o+=2;}}return new Blob([b],{type:'audio/wav'});}
$('#wavBtn').addEventListener('click',()=>{if(A)A.loop.port.postMessage({t:'export'});});
$('#clrAll').addEventListener('click',()=>{if(!A)return;const b=$('#clrAll');if(b.dataset.c){A.loop.port.postMessage({t:'clearAll'});b.textContent='Alle löschen';delete b.dataset.c;toast('Alle Spuren gelöscht');}else{b.dataset.c=1;b.textContent='Wirklich?';setTimeout(()=>{b.textContent='Alle löschen';delete b.dataset.c;},2500);}});
/* ===== Audio-Eingang (Interface, z. B. Komplete Audio 2) mit Vocal-Hall ===== */
const IN=Object.assign({dev:'',mode:'1',gain:1,lowcut:true,rev:'mon',revMix:.3,revSize:2.2},LS.get('kw.in',{}));
let inC=null;
function saveIn(){LS.set('kw.in',IN);}
function inChain(){if(inC||!A)return inC;const c=A.ctx,G=()=>c.createGain();
  inC={split:c.createChannelSplitter(2),g1:G(),g2:G(),merge:c.createChannelMerger(2),lc:c.createBiquadFilter(),trim:G(),dry:G(),send:G(),conv:c.createConvolver(),wet:G(),src:null};
  inC.lc.type='highpass';inC.lc.Q.value=0.7;
  inC.merge.connect(inC.lc).connect(inC.trim);inC.trim.connect(inC.dry).connect(A.inGain);
  inC.trim.connect(inC.send).connect(inC.conv).connect(inC.wet);
  inC.conv.buffer=makeIR(c,IN.revSize);applyIn();return inC;}
function routeIn(){if(!inC)return;const {split,g1,g2,merge}=inC;try{split.disconnect();g1.disconnect();g2.disconnect();}catch(e){}
  split.connect(g1,0);split.connect(g2,1);
  const m=IN.mode;g1.gain.value=m==='m'?0.5:1;g2.gain.value=m==='m'?0.5:1;
  if(m==='1'){g1.connect(merge,0,0);g1.connect(merge,0,1);}
  else if(m==='2'){g2.connect(merge,0,0);g2.connect(merge,0,1);}
  else if(m==='m'){g1.connect(merge,0,0);g1.connect(merge,0,1);g2.connect(merge,0,0);g2.connect(merge,0,1);}
  else{g1.connect(merge,0,0);g2.connect(merge,0,1);}}
function applyIn(){if(!inC)return;const t=A.ctx.currentTime;
  inC.trim.gain.setTargetAtTime(IN.gain,t,0.02);inC.lc.frequency.value=IN.lowcut?90:10;
  try{inC.wet.disconnect();}catch(e){}
  if(IN.rev==='rec')inC.wet.connect(A.inGain);else if(IN.rev==='mon')inC.wet.connect(A.master);
  inC.send.gain.setTargetAtTime(IN.rev==='off'?0:IN.revMix,t,0.02);routeIn();}
let irT=0;function setRevSize(v){IN.revSize=v;saveIn();clearTimeout(irT);irT=setTimeout(()=>{if(inC)inC.conv.buffer=makeIR(A.ctx,v);},200);}
async function startInput(){if(!A)return false;inChain();
  try{if(A.inStream){A.inStream.getTracks().forEach(t=>t.stop());try{inC.src.disconnect();}catch(e){}}
    const s=await navigator.mediaDevices.getUserMedia({audio:{deviceId:IN.dev?{exact:IN.dev}:undefined,channelCount:{ideal:2},echoCancellation:false,noiseSuppression:false,autoGainControl:false,latency:{ideal:0.005}}});
    A.inStream=s;inC.src=A.ctx.createMediaStreamSource(s);inC.src.connect(inC.split);routeIn();
    $('#inBtn').classList.add('on');const st=s.getAudioTracks()[0],cc=(st.getSettings&&st.getSettings().channelCount)||'?';
    toast('Audio-Eingang aktiv: '+(st.label||'Standardgerät')+' ('+cc+' Kanal'+(cc===1?'':'e')+')');renderIn();return true;}
  catch(e){toast(IN.dev?'Gerät nicht verfügbar – Standardgerät wählen oder Interface prüfen':'Kein Zugriff auf den Audio-Eingang');return false;}}
function stopInput(){if(!A||!A.inStream)return;A.inStream.getTracks().forEach(t=>t.stop());try{inC.src.disconnect();}catch(e){}A.inStream=null;$('#inBtn').classList.remove('on');renderIn();}
async function renderIn(){const el=$('#inPanel');if(!el)return;let devs=[];
  try{devs=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audioinput');}catch(e){}
  const on=!!(A&&A.inStream);
  el.innerHTML=`<h3>Audio-Eingang (Interface)</h3>
   <div class="inrow"><button id="inOn" class="${on?'on':''}">${on?'Eingang an':'Eingang aus'}</button>
   <label>Gerät <select id="inDev"><option value="">Standard-Aufnahmegerät</option>${devs.map(d=>`<option value="${esc(d.deviceId)}"${d.deviceId===IN.dev?' selected':''}>${esc(d.label||'Eingang '+d.deviceId.slice(0,6))}</option>`).join('')}</select></label>
   <label>Kanäle <select id="inMode">${[['1','Eingang 1 (Mono)'],['2','Eingang 2 (Mono)'],['m','1 + 2 zusammen (Mono)'],['s','1 + 2 getrennt (Stereo L/R)']].map(([k,l])=>`<option value="${k}"${IN.mode===k?' selected':''}>${l}</option>`).join('')}</select></label>
   <label>Gain <input type="range" id="inGain" min="0" max="4" step="0.01" value="${IN.gain}"><span class="tm" id="inGainV">${dB(IN.gain)} dB</span></label>
   <label><input type="checkbox" id="inLc"${IN.lowcut?' checked':''}> Low-Cut 90 Hz</label>
   <button id="inMon" class="${A&&A.mon.gain.value>0.5?'on':''}">Mithören (trocken)</button></div>
   <div class="inrow"><b class="cond" style="letter-spacing:.1em">VOCAL-HALL</b>
   <label><select id="inRev">${[['off','Aus'],['mon','Nur zum Abhören'],['rec','Mit aufnehmen']].map(([k,l])=>`<option value="${k}"${IN.rev===k?' selected':''}>${l}</option>`).join('')}</select></label>
   <label>Anteil <input type="range" id="inRevMix" min="0" max="1" step="0.01" value="${IN.revMix}"></label>
   <label>Raumgröße <input type="range" id="inRevSize" min="0.5" max="6" step="0.1" value="${IN.revSize}"><span class="tm" id="inRevSizeV">${(+IN.revSize).toFixed(1)} s</span></label></div>
   <p class="hint">Tipp: Am Komplete Audio 2 den Direct-Monitor einschalten (verzögerungsfrei) und hier „Mithören“ aus lassen. Der Hall „nur zum Abhören“ kommt dann vom Computer dazu, aufgenommen wird trocken. Im Looper als Quelle „Eingang 1“, „Eingang 2“ oder „Eingang (beide)“ wählen. Bei „1 + 2 getrennt“ kannst du z. B. Gesang und Gitarre auf zwei Spuren gleichzeitig aufnehmen.</p>`;}
$('#inBtn').addEventListener('click',async()=>{if(!A)return;if(A.inStream)stopInput();else await startInput();});
document.addEventListener('click',async e=>{if(!e.target.closest('#inPanel'))return;const id=e.target.id;
  if(id==='inOn'){if(A&&A.inStream)stopInput();else await startInput();}
  if(id==='inMon'&&A){const on=A.mon.gain.value<0.5;A.mon.gain.value=on?1:0;$('#monBtn').classList.toggle('on',on);e.target.classList.toggle('on',on);}});
document.addEventListener('change',async e=>{if(!e.target.closest('#inPanel'))return;const t=e.target;
  if(t.id==='inDev'){IN.dev=t.value;saveIn();if(A&&A.inStream)await startInput();}
  if(t.id==='inMode'){IN.mode=t.value;saveIn();routeIn();}
  if(t.id==='inLc'){IN.lowcut=t.checked;saveIn();applyIn();}
  if(t.id==='inRev'){IN.rev=t.value;saveIn();applyIn();}});
document.addEventListener('input',e=>{if(!e.target.closest('#inPanel'))return;const t=e.target;
  if(t.id==='inGain'){IN.gain=+t.value;saveIn();applyIn();$('#inGainV').textContent=dB(IN.gain)+' dB';}
  if(t.id==='inRevMix'){IN.revMix=+t.value;saveIn();applyIn();}
  if(t.id==='inRevSize'){setRevSize(+t.value);$('#inRevSizeV').textContent=(+t.value).toFixed(1)+' s';}});
$('#monBtn').addEventListener('click',()=>{if(!A)return;const on=A.mon.gain.value<0.5;A.mon.gain.value=on?1:0;$('#monBtn').classList.toggle('on',on);});
const scenes=LS.get('kw.scenes',[null,null,null,null]);let scSave=false;
$('#scSave').addEventListener('click',()=>{scSave=!scSave;$('#scSave').classList.toggle('on',scSave);info(scSave?'Szene wählen, um den aktuellen Zustand zu speichern':'');});
function scene(k){if(scSave){scenes[k]=LT.map(t=>({mute:t.mute,stop:t.stop}));LS.set('kw.scenes',scenes);scSave=false;$('#scSave').classList.remove('on');info('');toast('Szene '+(k+1)+' gespeichert');return;}
  const s=scenes[k];if(!s){toast('Szene '+(k+1)+' ist noch leer');return;}
  s.forEach((x,i)=>{if(!LT[i].has)return;if(LT[i].mute!==x.mute)loopSet(i,{mute:x.mute});if(LT[i].stop!==x.stop)loopMsg('stop',i,{v:x.stop});});toast('Szene '+(k+1));}
$('#scenes').addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(b&&!learning())scene(+b.dataset.s);});

/* ================= Oxygen-Regler ================= */
let kMode='mix';
const MACROS=[{l:'Cutoff',k:['cutoff']},{l:'Reso',k:['res']},{l:'Filter-Env',k:['envAmt']},{l:'Attack',k:['a1','a2']},{l:'Decay',k:['d1','d2']},{l:'Release',k:['r1','r2']},{l:'Delay',k:['dlyMix']},{l:'Hall',k:['revMix']}];
const oxyEl=$('#oxy');
oxyEl.innerHTML=Array.from({length:8},(_,i)=>`<div class="kn" data-learn="a:knob${i}" data-name="Regler ${i+1}"><div class="dial"></div><span></span><small></small></div>`).join('');
function renderKnobs(){$$('#kModes button').forEach(b=>b.classList.toggle('on',b.dataset.k===kMode));
  oxyEl.querySelectorAll('.kn').forEach((el,i)=>{let v,l,s;
    if(kMode==='mix'){v=LT[i].vol/1.25;l='Spur '+(i+1);s=Math.round(LT[i].vol*100)+'%';el.style.setProperty('--kc',TC[i]);}
    else{const m=MACROS[i];v=parts[ed].st[m.k[0]];l=m.l;s=FMT[C[m.k[0]].f](real(parts[ed].st,m.k[0]));el.style.setProperty('--kc',ed?'var(--b)':'var(--acc)');}
    el.querySelector('.dial').style.setProperty('--v',v);el.querySelector('span').textContent=l;el.querySelector('small').textContent=s;});}
function knobTurn(i,v){if(kMode==='mix'){loopSet(i,{vol:v*1.25});renderLanes();}else for(const k of MACROS[i].k)setP(k,v);renderKnobs();}
function setKMode(m){kMode=m;renderKnobs();info('Oxygen-Regler: '+(m==='mix'?'Mixer (Spur 1–8)':'Synth (Part '+(ed?'B':'A')+')'));}
$('#kModes').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!learning())setKMode(b.dataset.k);});

/* ================= Pads ================= */
const PADC=['#e8452c','#f07a24','#f5b82e','#ebe4d2','#7fc4d8','#4f8fe0','#9b6fd0','#d65a9a'];
let padMode=2;
const padsEl=$('#pads');
padsEl.innerHTML=PADC.map((c,i)=>`<button class="pad" style="--c:${c}" data-learn="a:pad${i}" data-name="Pad ${i+1}" data-pad="${i}"><b></b><small>Pad ${i+1}</small></button>`).join('');
function renderPads(){
  const pl=allPresets();
  $$('.pad').forEach((el,i)=>{const b=el.querySelector('b');el.className='pad';
    if(padMode===0)b.textContent=pads[i].n;
    else if(padMode===1){b.textContent=pl[i]?pl[i].n.replace('DM-Stil · ','DM · '):'–';if(parts[ed].preset===i)el.classList.add('st-play');}
    else if(padMode===3){const sg=SONGS[curSong],sc=sg&&sg.sections[i];b.textContent=sc?sc.name:'–';if(sc&&i===curSec)el.classList.add('st-play');}
    else{const t=LT[i];b.textContent='Spur '+(i+1)+(t.st==='empty'?' · Rec':t.st==='play'?(t.stop?' · aus':' · Dub'):t.st==='od'?' · Dub aus':' · '+LST[t.st]);if(t.st!=='empty')el.classList.add('st-'+(t.stop&&t.st==='play'?'mute':t.st));if(t.mute)el.classList.add('st-mute');}});
  $$('#padModes button').forEach(b=>b.classList.toggle('on',+b.dataset.m===padMode));
  $('#kits').hidden=padMode!==0;$('#padHint').textContent=['Drums ('+KITS[kit].n+'). Eigene Samples: Audiodatei auf ein Pad ziehen.','Pads laden Preset 1–8 in den gewählten Part.','Pads = Spur 1–8: Rec → Dub → Dub aus. Gilt auch für die Oxygen-Pads.','Pads = Sektionen des aktuellen Songs (Presets auf Knopfdruck).'][padMode];
}
function setPadMode(m){padMode=m;renderPads();}
function flash(i){const el=padsEl.children[i];el.classList.add('hit');setTimeout(()=>el.classList.remove('hit'),90);}
function padHit(i,vel=1,mode=padMode){flash(i);if(mode===0)playDrum(i,vel);else if(mode===1)loadPresetIdx(i,ed);else if(mode===3)recallSection(i);else loopRec(i);}
padsEl.addEventListener('pointerdown',e=>{const p=e.target.closest('.pad');if(!p||learning())return;padHit(+p.dataset.pad,0.9);});
$('#kits').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!learning())setKit(+b.dataset.kit);});
$('#padModes').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!learning())setPadMode(+b.dataset.m);});
padsEl.addEventListener('dragover',e=>{const p=e.target.closest('.pad');if(p){e.preventDefault();p.classList.add('drop');}});
padsEl.addEventListener('dragleave',e=>{const p=e.target.closest('.pad');if(p)p.classList.remove('drop');});
padsEl.addEventListener('drop',async e=>{const p=e.target.closest('.pad');if(!p)return;e.preventDefault();p.classList.remove('drop');const f=e.dataTransfer.files[0];if(!f)return;
  if(!A){toast('Erst Audio starten');return;}
  try{const buf=await A.ctx.decodeAudioData(await f.arrayBuffer());const i=+p.dataset.pad;pads[i].buf=buf;pads[i].n=f.name.replace(/\.[^.]+$/,'').slice(0,18);pads[i].ch=0;setPadMode(0);toast('Sample auf Pad '+(i+1)+' geladen');}
  catch(err){toast('Datei konnte nicht gelesen werden');}});

/* ================= Noten & Klaviatur ================= */
const BLACK=[0,1,0,1,0,0,1,0,1,0,1,0];
const NN={de:['C','Cis','D','Dis','E','F','Fis','G','Gis','A','B','H'],en:['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']};
let names='de';
const nName=n=>(NN[names==='en'?'en':'de'])[n%12]+(Math.floor(n/12)-1);
const userHeld=[new Set(),new Set()],autoCol=new Map(),want=new Set();
let pLo=36,pHi=96,geo={};
const piano=$('#piano');
function buildGeo(){const wh=[];for(let n=pLo;n<=pHi;n++)if(!BLACK[n%12])wh.push(n);const WN=wh.length;geo={};let w=0;
  for(let n=pLo;n<=pHi;n++){if(BLACK[n%12])geo[n]={x:(w-0.31)/WN,w:0.62/WN,b:1};else{geo[n]={x:w/WN,w:1/WN,b:0};w++;}}}
function renderPiano(){buildGeo();roll._dirty=true;let h='';
  for(let n=pLo;n<=pHi;n++){const g=geo[n],lab=names==='off'?(n%12===0?nName(n):''):nName(n);
    h+=`<div class="${g.b?'k':'w'}" data-n="${n}" style="left:${g.x*100}%;width:${g.w*100}%">${lab&&(!g.b||names!=='off')?`<span>${g.b?lab.replace(/\d+$/,''):lab}</span>`:''}</div>`;}
  piano.innerHTML=h;for(let n=pLo;n<=pHi;n++)paintKey(n);}
function paintKey(n){const el=piano.querySelector(`[data-n="${n}"]`);if(!el)return;
  const c=userHeld[0].has(n)?'var(--acc)':userHeld[1].has(n)?'var(--b)':autoCol.get(n)||null;
  el.classList.toggle('lit',!!c);if(c)el.style.setProperty('--kc',c);el.classList.toggle('want',want.has(n));}
function setRange(lo,hi){pLo=Math.max(21,lo);pHi=Math.min(108,hi);renderPiano();}
function applyRange(){const v=$('#kRange').value;
  if(v==='auto'){if(SG.song){let mn=127,mx=0;for(const n of SG.song.notes)if(SG.song.groups[n.g].mode!=='off'&&!SG.song.groups[n.g].drum){mn=Math.min(mn,n.n);mx=Math.max(mx,n.n);}
      if(mx>=mn){let lo=Math.floor((mn-1)/12)*12,hi=Math.ceil((mx+1)/12)*12;while(hi-lo<36){lo-=12;if(hi-lo<36)hi+=12;}setRange(lo,hi);return;}}setRange(36,96);return;}
  ({25:()=>setRange(48,72),37:()=>setRange(48,84),49:()=>setRange(36,84),61:()=>setRange(36,96),88:()=>setRange(21,108)})[v]();}
$('#kRange').addEventListener('change',applyRange);
$('#nNames').addEventListener('change',e=>{names=e.target.value;renderPiano();});

const trails=[];
const recS={on:false,t0:0,notes:[],open:new Map()};
/* Ausgabe pro Part: intern (Klangwerk-Synth) und/oder an einen VST-Slot (MIDI-Port + Kanal, z. B. FL Studio) */
let PLUGINS=[];
let SLOTS=LS.get('kw.slots',Array.from({length:8},(_,i)=>({name:'VST '+(i+1),port:'',ch:i+1,pc:0})));
let outSel=LS.get('kw.out2',[{mode:'int',slot:0},{mode:'int',slot:1}]);
function outPort(sl){if(!midi||!sl||!sl.port)return null;return[...midi.outputs.values()].find(x=>x.name===sl.port)||null;}
function slotSend(si,data){const sl=SLOTS[si];if(!sl)return;if(window.KWD&&sl.plugin){KWD.emit('kwSlotMidi',{s:si,m:Array.from(data)});return;}const o=outPort(sl);if(o)try{o.send(data);}catch(e){}}
function pSend(pi,m){const o=outSel[pi];if(o.mode!=='ext'&&A)A.P[pi].syn.port.postMessage(m);
  if(o.mode!=='int'){const sl=SLOTS[o.slot];if(!sl)return;const ch=(sl.ch-1)&15;
    const f={on:()=>[0x90|ch,m.n,Math.max(1,Math.min(127,Math.round(m.v*127)))],off:()=>[0x80|ch,m.n,0],sus:()=>[0xB0|ch,64,m.v?127:0],mod:()=>[0xB0|ch,1,Math.round(m.v*127)],
      bend:()=>{const b=Math.max(0,Math.min(16383,Math.round((m.v+1)*8192)));return[0xE0|ch,b&127,b>>7];},panic:()=>[0xB0|ch,123,0]}[m.t];
    if(f){slotSend(o.slot,f());if(m.t==='panic')slotSend(o.slot,[0xB0|ch,64,0]);}}}
function nOn(pi,n,v,who='u'){if(!A||n<0||n>127)return;pSend(pi,{t:'on',n,v});
  if(who==='u'){userHeld[pi].add(n);trails.push({n,pi,t0:performance.now(),t1:0});if(trails.length>400)trails.shift();songHit(n);
    if(recS.on)recS.open.set(pi+':'+n,{t:(performance.now()-recS.t0)/1000,n,v,g:pi});}
  paintKey(n);}
function nOff(pi,n,who='u'){if(!A)return;pSend(pi,{t:'off',n});
  if(who==='u'){userHeld[pi].delete(n);for(let i=trails.length-1;i>=0;i--)if(trails[i].n===n&&trails[i].pi===pi&&!trails[i].t1){trails[i].t1=performance.now();break;}
    const k=pi+':'+n,o=recS.open.get(k);if(o){recS.open.delete(k);o.d=Math.max(0.03,(performance.now()-recS.t0)/1000-o.t);recS.notes.push(o);}}
  paintKey(n);}
function panic(){if(!A)return;for(let pi=0;pi<2;pi++){pSend(pi,{t:'panic'});userHeld[pi].clear();}autoCol.clear();SG.sound.clear();renderPiano();}
let ptr=new Map();
piano.addEventListener('pointerdown',e=>{const k=e.target.closest('[data-n]');if(!k)return;piano.setPointerCapture(e.pointerId);const n=+k.dataset.n;ptr.set(e.pointerId,n);nOn(ed,n,0.8);});
piano.addEventListener('pointermove',e=>{if(!ptr.has(e.pointerId))return;const el=document.elementFromPoint(e.clientX,e.clientY),k=el&&el.closest('#piano [data-n]');if(!k)return;const n=+k.dataset.n,o=ptr.get(e.pointerId);if(n!==o){nOff(ed,o);nOn(ed,n,0.8);ptr.set(e.pointerId,n);}});
const pUp=e=>{if(!ptr.has(e.pointerId))return;nOff(ed,ptr.get(e.pointerId));ptr.delete(e.pointerId);};
piano.addEventListener('pointerup',pUp);piano.addEventListener('pointercancel',pUp);

/* ---- Songs ---- */
const GC=['#3ec7c2','#ff6a2b','#ffc23d','#b48cff','#7fd46b','#ff6fae','#6a9fd8','#e9e2cf'];
const GMODES=[['me','Ich spiele'],['A','Autoplay Part A'],['B','Autoplay Part B'],['show','Nur anzeigen'],['off','Ausblenden'],['drum','Drums (Pads)']];
const GMDRUM={35:0,36:0,38:1,40:1,37:6,39:4,42:2,44:2,46:3,41:5,43:5,45:5,47:5,48:5,50:5,49:3,51:3,57:3,56:7};
const SG={song:null,t:0,play:false,speed:1,wait:false,waiting:false,chord:null,evs:[],evI:0,me:[],meI:0,hits:0,A:null,B:null,sound:new Map(),last:performance.now(),pps:170};
function mkSong(name,notes,groups){notes.sort((a,b)=>a.t-b.t||a.n-b.n);groups.forEach((g,i)=>{g.color=g.color||GC[i%GC.length];g.count=notes.filter(n=>n.g===i).length;});
  return{name,notes,groups,dur:notes.reduce((m,n)=>Math.max(m,n.t+n.d),0)};}
function loadSong(sg){songPause();releaseAuto();SG.song=sg;SG.A=SG.B=null;$('#sAB').classList.remove('on');$('#sSave').disabled=false;buildEvents();renderGroups();applyRange();seek(0);toast('Geladen: '+sg.name);}
function buildEvents(){const sg=SG.song;SG.evs=[];SG.me=[];
  for(const n of sg.notes){const m=sg.groups[n.g].mode;if(m==='A'||m==='B'||m==='drum')SG.evs.push({t:n.t,on:1,x:n,m},{t:n.t+Math.max(0.03,n.d)-0.005,on:0,x:n,m});if(m==='me')SG.me.push(n);}
  SG.evs.sort((a,b)=>a.t-b.t||a.on-b.on);syncPtr();}
function syncPtr(){let i=0;while(i<SG.evs.length&&SG.evs[i].t<SG.t)i++;SG.evI=i;let j=0;while(j<SG.me.length&&SG.me[j].t<SG.t-0.001)j++;SG.meI=j;
  for(let k=j;k<SG.me.length;k++)SG.me[k].hit=false;SG.waiting=false;setWant([]);}
function releaseAuto(){for(const [k,v] of SG.sound){const [pi,n]=k.split(':').map(Number);if(A)pSend(pi,{t:'off',n});}SG.sound.clear();const ks=[...autoCol.keys()];autoCol.clear();ks.forEach(paintKey);}
function seek(t){roll._dirty=true;releaseAuto();SG.t=Math.max(0,Math.min(t,SG.song?SG.song.dur:0));if(SG.song)syncPtr();if(SG.A===null)SG.hits=0;updPos();}
function fire(e){const n=e.x;
  if(e.m==='drum'){if(e.on&&GMDRUM[n.n]!==undefined){playDrum(GMDRUM[n.n],n.v);flash(GMDRUM[n.n]);}return;}
  const pi=e.m==='B'?1:0,k=pi+':'+n.n,c=SG.song.groups[n.g].color;
  if(e.on){if(A)pSend(pi,{t:'on',n:n.n,v:n.v});SG.sound.set(k,(SG.sound.get(k)||0)+1);autoCol.set(n.n,c);}
  else{const cnt=(SG.sound.get(k)||1)-1;if(A)pSend(pi,{t:'off',n:n.n});if(cnt<=0){SG.sound.delete(k);autoCol.delete(n.n);}else SG.sound.set(k,cnt);}
  paintKey(n.n);}
function setWant(arr){roll._dirty=true;const old=[...want];want.clear();arr.forEach(n=>want.add(n));old.forEach(paintKey);arr.forEach(paintKey);}
function chordAt(i){const t0=SG.me[i].t,ch=[];for(let k=i;k<SG.me.length&&SG.me[k].t<=t0+0.06;k++)ch.push(SG.me[k]);return ch;}
function songHit(n){roll._dirty=true;if(!SG.song||!SG.me.length)return;
  for(let k=Math.max(0,SG.meI-12);k<Math.min(SG.me.length,SG.meI+24);k++){const x=SG.me[k];if(!x.hit&&x.n===n&&Math.abs(x.t-SG.t)<0.25*Math.max(1,SG.speed)+(SG.waiting?0.1:0)){x.hit=true;SG.hits++;break;}}
  if(SG.waiting&&SG.chord&&SG.chord.every(x=>x.hit)){SG.meI+=SG.chord.length;SG.waiting=false;SG.chord=null;setWant([]);}}
setInterval(()=>{const now=performance.now(),dt=Math.min(0.1,(now-SG.last)/1000);SG.last=now;if(!SG.play||!SG.song)return;
  if(!SG.waiting)SG.t+=dt*SG.speed;
  if(SG.wait){if(SG.meI<SG.me.length){const n0=SG.me[SG.meI];if(SG.t>=n0.t){const ch=chordAt(SG.meI);if(ch.every(x=>x.hit)){SG.meI+=ch.length;SG.waiting=false;setWant([]);}else{SG.t=n0.t;if(!SG.waiting){SG.waiting=true;SG.chord=ch;setWant(ch.filter(x=>!x.hit).map(x=>x.n));}}}}}
  else while(SG.meI<SG.me.length&&SG.t>SG.me[SG.meI].t+0.3)SG.meI++;
  while(SG.evI<SG.evs.length&&SG.evs[SG.evI].t<=SG.t)fire(SG.evs[SG.evI++]);
  if(SG.A!==null&&SG.B!==null&&SG.B>SG.A&&SG.t>=SG.B){seek(SG.A);}
  else if(SG.t>=SG.song.dur+0.4){songPause();seek(SG.A??0);}
},8);
function songPlay(){if(!SG.song){toast('Erst eine MIDI-Datei oder ein Beispiel laden');return;}SG.play=true;SG.last=performance.now();$('#sPlay').textContent='Pause';$('#sPlay').classList.add('on');}
function songPause(){SG.play=false;releaseAuto();$('#sPlay').textContent='Abspielen';$('#sPlay').classList.remove('on');}
const fmtT=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
function updPos(){const d=SG.song?SG.song.dur:0;$('#sTime').textContent=fmtT(SG.t)+' / '+fmtT(d);if(document.activeElement!==$('#sPos'))$('#sPos').value=d?Math.round(SG.t/d*1000):0;
  $('#score').innerHTML=SG.song?`<b>${esc(SG.song.name)}</b> · Treffer: <b>${SG.hits}</b> von ${SG.meI} ${SG.waiting?'· <span style="color:var(--yel)">wartet auf dich</span>':''}`:'–';}
setInterval(()=>{if(VIS.keyboard&&!document.hidden)updPos();},150);
$('#sPos').addEventListener('input',e=>{if(SG.song)seek(+e.target.value/1000*SG.song.dur);});
$('#sTempo').addEventListener('input',e=>{SG.speed=+e.target.value/100;$('#sTempoV').textContent=e.target.value+'%';});
$('#sZoom').addEventListener('input',e=>{SG.pps=+e.target.value;roll._dirty=true;});
$('#sWait').addEventListener('click',()=>{SG.wait=!SG.wait;$('#sWait').classList.toggle('on',SG.wait);if(!SG.wait){SG.waiting=false;setWant([]);}});
$('#sA').addEventListener('click',()=>{SG.A=SG.t;$('#sAB').classList.toggle('on',SG.B!==null);toast('Punkt A: '+fmtT(SG.t));});
$('#sB').addEventListener('click',()=>{if(SG.A===null)SG.A=0;SG.B=SG.t;if(SG.B<=SG.A){toast('B muss hinter A liegen');SG.B=null;return;}$('#sAB').classList.add('on');toast('Schleife '+fmtT(SG.A)+' – '+fmtT(SG.B));});
$('#sAB').addEventListener('click',()=>{SG.A=SG.B=null;$('#sAB').classList.remove('on');});
function renderGroups(){const sg=SG.song;if(!sg)return;
  $('#groups').innerHTML=sg.groups.map((g,i)=>g.count?`<div class="gchip" style="--gc:${g.color}"><span>${esc(g.name)} <small style="color:var(--dim)">(${g.count})</small></span><select data-g="${i}">${GMODES.filter(m=>m[0]!=='drum'||g.drum).map(m=>`<option value="${m[0]}"${g.mode===m[0]?' selected':''}>${m[1]}</option>`).join('')}</select></div>`:'').join('');}
$('#groups').addEventListener('change',e=>{roll._dirty=true;const s=e.target.closest('[data-g]');if(!s||!SG.song)return;SG.song.groups[+s.dataset.g].mode=s.value;releaseAuto();buildEvents();applyRange();});
$('#sDemo').addEventListener('change',e=>{const v=e.target.value;e.target.value='';if(v==='bach')loadSong(demoBach());if(v==='ode')loadSong(demoOde());});
$('#sLoad').addEventListener('click',()=>$('#sFile').click());
async function loadMidiFile(f){try{const sg=parseMidi(await f.arrayBuffer());sg.name=f.name.replace(/\.midi?$/i,'');loadSong(sg);}catch(err){toast('MIDI-Datei konnte nicht gelesen werden: '+err.message);}}
$('#sFile').addEventListener('change',e=>{const f=e.target.files[0];if(f)loadMidiFile(f);e.target.value='';});
const stage=$('.stage');
stage.addEventListener('dragover',e=>{e.preventDefault();});
stage.addEventListener('drop',e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f&&/\.midi?$/i.test(f.name))loadMidiFile(f);});
$('#sRec').addEventListener('click',()=>{const b=$('#sRec');
  if(!recS.on){recS.on=true;recS.t0=performance.now();recS.notes=[];recS.open.clear();b.classList.add('on');b.textContent='Aufnahme beenden';toast('Aufnahme läuft – spiel los');return;}
  recS.on=false;b.classList.remove('on');b.textContent='Aufnehmen';const end=(performance.now()-recS.t0)/1000;
  for(const o of recS.open.values()){o.d=Math.max(0.03,end-o.t);recS.notes.push(o);}recS.open.clear();
  if(!recS.notes.length){toast('Keine Noten aufgenommen');return;}
  const t0=Math.min(...recS.notes.map(n=>n.t));recS.notes.forEach(n=>n.t-=t0);
  const d=new Date();loadSong(mkSong('Aufnahme '+d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}),recS.notes.map(n=>({...n})),[{name:'Part A',mode:'A'},{name:'Part B',mode:'B'}]));});
$('#sSave').addEventListener('click',()=>{if(SG.song)download((SG.song.name||'klangwerk').replace(/[^\w\- ]+/g,'_')+'.mid',writeMidi(SG.song));});

/* ---- MIDI-Dateien lesen / schreiben ---- */
function parseMidi(buf){
  const d=new Uint8Array(buf);let p=0;
  const u32=()=>{const v=((d[p]<<24)|(d[p+1]<<16)|(d[p+2]<<8)|d[p+3])>>>0;p+=4;return v;},u16=()=>{const v=(d[p]<<8)|d[p+1];p+=2;return v;},
    str=n=>{let s='';for(let i=0;i<n;i++)s+=String.fromCharCode(d[p+i]);p+=n;return s;},
    vlq=()=>{let v=0,b;do{b=d[p++];v=(v*128)+(b&127);}while(b&128&&p<d.length);return v;};
  if(str(4)!=='MThd')throw new Error('keine Standard-MIDI-Datei');
  const hl=u32(),fmt=u16(),nt=u16(),div=u16();p=8+hl;
  if(div&0x8000)throw new Error('SMPTE-Zeitbasis wird nicht unterstützt');
  const tempos=[],raw=[],tnames=[];
  for(let tr=0;tr<nt&&p+8<=d.length;tr++){
    const id=str(4),len=u32(),end=Math.min(d.length,p+len);if(id!=='MTrk'){p=end;continue;}
    let tick=0,rs=0;
    while(p<end){tick+=vlq();let st=d[p];if(st<0x80)st=rs;else p++;
      if(st===0xFF){const ty=d[p++],l=vlq();if(ty===0x51&&l===3)tempos.push({tick,us:(d[p]<<16)|(d[p+1]<<8)|d[p+2]});else if(ty===0x03&&!tnames[tr]){let s='';for(let i=0;i<l;i++)s+=String.fromCharCode(d[p+i]);tnames[tr]=s.trim();}p+=l;}
      else if(st===0xF0||st===0xF7){const l=vlq();p+=l;}
      else if(st>=0x80){rs=st;const ty=st&0xF0,ch=st&15,a=d[p++],b=(ty===0xC0||ty===0xD0)?0:d[p++];if(ty===0x90||ty===0x80)raw.push({tick,on:ty===0x90&&b>0,n:a,v:b,ch,tr});}
      else break;}
    p=end;}
  tempos.sort((a,b)=>a.tick-b.tick);if(!tempos.length||tempos[0].tick>0)tempos.unshift({tick:0,us:500000});
  const segs=[];let sec=0;tempos.forEach((t,i)=>{if(i)sec+=(t.tick-tempos[i-1].tick)*tempos[i-1].us/1e6/div;segs.push({tick:t.tick,sec,us:t.us});});
  const toSec=tk=>{let lo=0,hi=segs.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(segs[m].tick<=tk)lo=m;else hi=m-1;}const s=segs[lo];return s.sec+(tk-s.tick)*s.us/1e6/div;};
  const groups=[],gmap=new Map();
  const gid=e=>{const k=(fmt===0?'c'+e.ch:'t'+e.tr)+(e.ch===9?'d':'');if(!gmap.has(k)){gmap.set(k,groups.length);groups.push({name:e.ch===9?'Schlagzeug':(fmt===0?'Kanal '+(e.ch+1):(tnames[e.tr]||'Spur '+(groups.length+1))),drum:e.ch===9,mode:'A'});}return gmap.get(k);};
  for(const e of raw)if(e.on)gid(e);
  raw.sort((a,b)=>a.tick-b.tick||(a.on-b.on));
  const open=new Map(),notes=[];const push=(o,et)=>{const t=toSec(o.tick);notes.push({t,d:Math.max(0.03,toSec(et)-t),n:o.n,v:Math.max(0.05,o.v/127),g:gid(o)});};
  for(const e of raw){const k=e.tr+':'+e.ch+':'+e.n;if(e.on){if(open.has(k))push(open.get(k),e.tick);open.set(k,e);}else{const o=open.get(k);if(o){open.delete(k);push(o,e.tick);}}}
  for(const o of open.values())push(o,o.tick+div);
  if(!notes.length)throw new Error('keine Noten gefunden');
  let best=-1,bp=-1;groups.forEach((g,i)=>{if(g.drum){g.mode='drum';return;}const ns=notes.filter(n=>n.g===i);const av=ns.reduce((a,n)=>a+n.n,0)/Math.max(1,ns.length);if(ns.length&&av>bp){bp=av;best=i;}});
  if(best>=0)groups[best].mode='me';
  return mkSong('MIDI',notes,groups);
}
function writeMidi(song){
  const tps=960,vlq=v=>{const b=[v&127];while(v>=128){v=Math.floor(v/128);b.unshift((v&127)|128);}return b;};
  const chunk=(id,bytes)=>[...id].map(c=>c.charCodeAt(0)).concat([(bytes.length>>>24)&255,(bytes.length>>>16)&255,(bytes.length>>>8)&255,bytes.length&255],bytes);
  const tracks=[[0,0xFF,0x51,3,0x07,0xA1,0x20,0,0xFF,0x2F,0]];let chn=0;
  song.groups.forEach((g,gi)=>{const ev=[],ch=g.drum?9:(chn++===9?chn++:chn-1)%16;
    for(const n of song.notes)if(n.g===gi){ev.push([Math.round(n.t*tps),0x90|ch,n.n,Math.max(1,Math.min(127,Math.round(n.v*127)))],[Math.round((n.t+n.d)*tps),0x80|ch,n.n,0]);}
    if(!ev.length)return;ev.sort((a,b)=>a[0]-b[0]||((a[1]&0xF0)-(b[1]&0xF0)));
    const nm=[...String(g.name)].map(c=>c.charCodeAt(0)<128?c.charCodeAt(0):63).slice(0,100);const bytes=[0,0xFF,0x03,nm.length,...nm];
    let last=0;for(const e of ev){bytes.push(...vlq(e[0]-last),e[1],e[2],e[3]);last=e[0];}bytes.push(0,0xFF,0x2F,0);tracks.push(bytes);});
  let all=chunk('MThd',[0,1,0,tracks.length,1,224]);for(const t of tracks)all=all.concat(chunk('MTrk',t));
  return new Blob([new Uint8Array(all)],{type:'audio/midi'});
}
/* Gemeinfreie Übungsstücke */
function demoBach(){const C=[[60,64,67,72,76],[60,62,69,74,77],[59,62,67,74,77],[60,64,67,72,76],[60,64,69,76,81],[60,62,66,69,74],[59,62,67,74,79],[59,60,64,67,72],[57,60,64,67,72],[50,57,62,66,72],[55,59,62,67,71]];
  const s=60/66/4,notes=[];C.forEach((c,bi)=>{for(let h=0;h<2;h++){const t0=(bi*16+h*8)*s;notes.push({t:t0,d:8*s*0.97,n:c[0],v:.55,g:0},{t:t0+s,d:7*s*0.96,n:c[1],v:.5,g:0});[2,3,4,2,3,4].forEach((k,j)=>notes.push({t:t0+(2+j)*s,d:s*0.92,n:c[k],v:.6,g:1}));}});
  return mkSong('Bach – Präludium C-Dur BWV 846, T. 1–11',notes,[{name:'Linke Hand',mode:'A'},{name:'Rechte Hand',mode:'me'}]);}
function demoOde(){const q=0.5,mel=[[64,1],[64,1],[65,1],[67,1],[67,1],[65,1],[64,1],[62,1],[60,1],[60,1],[62,1],[64,1],[64,1.5],[62,.5],[62,2],[64,1],[64,1],[65,1],[67,1],[67,1],[65,1],[64,1],[62,1],[60,1],[60,1],[62,1],[64,1],[62,1.5],[60,.5],[60,2]];
  let t=0;const notes=[];for(const [n,b] of mel){notes.push({t:t*q,d:b*q*0.92,n,v:.7,g:1});t+=b;}
  [48,43,48,43,48,43,48,48].forEach((n,i)=>notes.push({t:i*4*q,d:4*q*0.95,n,v:.45,g:0},{t:i*4*q,d:4*q*0.95,n:n+7,v:.4,g:0}));
  return mkSong('Beethoven – Ode an die Freude',notes,[{name:'Linke Hand',mode:'A'},{name:'Rechte Hand',mode:'me'}]);}

/* ---- Notenrolle zeichnen ---- */
const roll=$('#roll');
function drawRoll(){
  const dpr=devicePixelRatio||1,W=Math.round(roll.clientWidth*dpr),H=Math.round(roll.clientHeight*dpr);if(!W)return;
  if(roll.width!==W||roll.height!==H){roll.width=W;roll.height=H;}
  const g=roll.getContext('2d');g.clearRect(0,0,W,H);
  for(let n=pLo;n<=pHi;n++){const k=geo[n];if(!k)continue;if(n%12===0||n%12===5){g.fillStyle=n%12===0?'#ffffff18':'#ffffff0a';g.fillRect(Math.round(k.x*W),0,1,H);}if(k.b){g.fillStyle='#ffffff05';g.fillRect(k.x*W,0,k.w*W,H);}}
  const pps=SG.pps*dpr,font=Math.round(11*dpr)+'px "Barlow Condensed",sans-serif';g.font=font;g.textAlign='center';g.textBaseline='bottom';
  if(SG.song){const sg=SG.song,t=SG.t;
    for(const x of sg.notes){const gr=sg.groups[x.g];if(gr.mode==='off'||gr.drum)continue;const k=geo[x.n];if(!k)continue;
      const y0=H-(x.t-t)*pps;if(y0<-2)break;const y1=H-(x.t+x.d-t)*pps;if(y1>H)continue;
      const xx=k.x*W+1,ww=Math.max(3,k.w*W-2),top=Math.max(y1,-4),hh=Math.min(y0,H)-top;
      g.globalAlpha=gr.mode==='show'?0.45:1;g.fillStyle=k.b?shade(gr.color):gr.color;
      g.beginPath();g.roundRect?g.roundRect(xx,top,ww,Math.max(2,hh),Math.min(5*dpr,ww/2)):g.rect(xx,top,ww,Math.max(2,hh));g.fill();
      if(x.hit){g.strokeStyle='#fff';g.lineWidth=2*dpr;g.stroke();}
      else if(gr.mode==='me'&&SG.waiting&&SG.chord&&SG.chord.includes(x)){g.strokeStyle='#ffc23d';g.lineWidth=3*dpr;g.stroke();}
      if(names!=='off'&&hh>14*dpr&&ww>12*dpr){g.fillStyle='#111';g.fillText(nName(x.n).replace(/\d+$/,''),xx+ww/2,Math.min(y0,H)-3*dpr);}
      g.globalAlpha=1;}}
  if(!SG.play){const now=performance.now(),sp=120*dpr;
    for(let i=trails.length-1;i>=0;i--){const tr=trails[i],k=geo[tr.n];const yb=tr.t1?H-(now-tr.t1)/1000*sp:H,yt=H-(now-tr.t0)/1000*sp;if(yb<0){trails.splice(i,1);continue;}if(!k)continue;
      g.fillStyle=tr.pi?'#3ec7c2':'#ff6a2b';g.globalAlpha=0.85;g.beginPath();const xx=k.x*W+1,ww=Math.max(3,k.w*W-2);g.roundRect?g.roundRect(xx,Math.max(0,yt),ww,Math.max(2,yb-Math.max(0,yt)),Math.min(5*dpr,ww/2)):g.rect(xx,Math.max(0,yt),ww,yb-yt);g.fill();g.globalAlpha=1;}}
  const gl=g.createLinearGradient(0,H-24*dpr,0,H);gl.addColorStop(0,'#ff3b1f00');gl.addColorStop(1,'#ff3b1f55');g.fillStyle=gl;g.fillRect(0,H-24*dpr,W,24*dpr);
}
function shade(c){return 'color-mix(in srgb,'+c+' 72%,#000)';}

/* ================= Computer-Tastatur ================= */
const KEYS={KeyA:0,KeyW:1,KeyS:2,KeyE:3,KeyD:4,KeyF:5,KeyT:6,KeyG:7,KeyY:8,KeyH:9,KeyU:10,KeyJ:11,KeyK:12,KeyO:13,KeyL:14,KeyP:15,Semicolon:16};
let qOct=60;const qDown=new Map();
addEventListener('keydown',e=>{if(e.target.matches('input[type=text],input[type=number],select')||e.metaKey||e.ctrlKey||e.altKey)return;
  if(e.repeat){if(KEYS[e.code]!==undefined||e.code==='Space')e.preventDefault();return;}
  if(e.code in KEYS){const n=qOct+KEYS[e.code];qDown.set(e.code,[ed,n]);nOn(ed,n,0.8);e.preventDefault();return;}
  if(e.code==='KeyZ'){qOct=Math.max(24,qOct-12);toast('Tastatur-Oktave C'+(qOct/12-1));return;}
  if(e.code==='KeyX'){qOct=Math.min(96,qOct+12);toast('Tastatur-Oktave C'+(qOct/12-1));return;}
  const d=/^Digit([1-8])$/.exec(e.code);if(d){padHit(+d[1]-1,0.9);return;}
  if(e.code==='Space'&&!e.target.closest('button')){e.preventDefault();ACT.transport();}});
addEventListener('keyup',e=>{const q=qDown.get(e.code);if(q){nOff(q[0],q[1]);qDown.delete(e.code);}});
addEventListener('blur',()=>{qDown.forEach(([p,n])=>nOff(p,n));qDown.clear();});

/* ================= Aktionen ================= */
const ACT={transport:()=>transport(!running),play:()=>{if(!running)transport(true);},stop:()=>{if(running)transport(false);},tap,metro:toggleMetro,panic,
  presetNext:()=>loadPresetIdx((parts[ed].preset+1)%allPresets().length),presetPrev:()=>{const n=allPresets().length;loadPresetIdx((parts[ed].preset-1+n)%n);},
  padMode:()=>setPadMode((padMode+1)%4),partA:()=>setEd(0),partB:()=>setEd(1),knobMode:()=>setKMode(kMode==='mix'?'syn':'mix'),
  countIn:()=>{countIn=!countIn;$('#cntIn').classList.toggle('on',countIn);},
  selPrev:()=>{selectT(selT-1);info('Spur '+(selT+1)+' gewählt');},selNext:()=>{selectT(selT+1);info('Spur '+(selT+1)+' gewählt');},recSel:()=>loopRec(selT),
  stopAll:()=>LT.forEach((t,i)=>{if(t.has)loopMsg('stop',i,{v:true});}),startAll:()=>LT.forEach((t,i)=>{if(t.has)loopMsg('stop',i,{v:false});}),
  songPlay:()=>SG.play?songPause():songPlay(),songHome:()=>seek(SG.A??0)};
for(let i=0;i<8;i++){ACT['pad'+i]=v=>padHit(i,v??0.9);ACT['rec'+i]=()=>loopRec(i);ACT['stop'+i]=()=>loopMsg('stop',i);ACT['mute'+i]=()=>loopSet(i,{mute:!LT[i].mute});ACT['solo'+i]=()=>loopSet(i,{solo:!LT[i].solo});
  ACT['rev'+i]=()=>loopSet(i,{rev:!LT[i].rev});ACT['undo'+i]=()=>loopMsg('undo',i);ACT['clear'+i]=()=>loopMsg('clear',i);}
for(let i=0;i<16;i++)ACT['patch'+i]=()=>loadPresetIdx(bankPg*16+i);
for(let i=0;i<4;i++)ACT['scene'+i]=()=>scene(i);
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||learning())return;ACT[b.dataset.act]();});


let midi=null,maps=LS.get('kw.maps',{}),roles=LS.get('kw.roles',{});

/* ================= Ansichten ================= */
const VIEWS=['alles','synth','looper','mixer','keyboard','songs','steuerung'];
const VIS={synth:true,looper:true,mixer:true,keyboard:true,songs:false,steuerung:false};
const viewSecs=$$('section[data-view]');
function setView(v,push=true){
  if(!VIEWS.includes(v))v='alles';
  document.body.dataset.view=v;
  for(const k in VIS)VIS[k]=v==='alles'?['synth','looper','mixer','keyboard'].includes(k):k===v;
  viewSecs.forEach(s=>{s.hidden=!VIS[s.dataset.view];});
  $$('#views button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  if(push&&location.hash!=='#'+v)try{history.replaceState(null,'','#'+v);}catch(e){}
  if(VIS.songs)renderSongs();if(VIS.steuerung)renderCtl();if(VIS.mixer){renderMixer();renderIn();}roll._dirty=true;
  if(!TR.on)scrollTo(0,0);
}
$('#views').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setView(b.dataset.v);});
addEventListener('hashchange',()=>setView(location.hash.slice(1)||'alles',false));

/* ================= Mixer ================= */
const MXC=[{k:'A',n:'Part A',c:'#ff6a2b'},{k:'B',n:'Part B',c:'#3ec7c2'},{k:'D',n:'Drums',c:'#ffc23d'},{k:'I',n:'Eingang',c:'#7fd46b'}];
const MX=Object.assign({A:{n:.79,p:0,m:false,s:false},B:{n:.79,p:0,m:false,s:false},D:{n:.75,p:0,m:false,s:false},I:{n:.79,p:0,m:false,s:false},M:{n:.8},xf:.5},LS.get('kw.mix',{}));
const gOf=n=>n*n*1.6;
const dB=g=>g<=0.0001?'−∞':(g>=1?'+':'')+(20*Math.log10(g)).toFixed(1);
let mixT=0;
function applyMix(){
  clearTimeout(mixT);mixT=setTimeout(()=>LS.set('kw.mix',MX),400);
  $('#vol').value=MX.M.n;$('#xfade').value=MX.xf;
  if(!A)return;const t=A.ctx.currentTime,solo=MXC.some(c=>MX[c.k].s);
  for(const c of MXC){const m=MX[c.k];let g=gOf(m.n);if(m.m||(solo&&!m.s))g=0;if(c.k==='A')g*=Math.min(1,2*(1-MX.xf));if(c.k==='B')g*=Math.min(1,2*MX.xf);
    A.CHN[c.k].g.gain.setTargetAtTime(g,t,0.015);A.CHN[c.k].pan.pan.setTargetAtTime(m.p,t,0.015);}
  A.master.gain.setTargetAtTime(MX.M.n,t,0.015);
}
const mixEl=$('#mixStrips');
const STR=[...MXC,...TC.map((c,i)=>({k:'L'+i,n:'Loop '+(i+1),c})),{k:'M',n:'Master',c:'#e9e2cf'}];
mixEl.innerHTML=STR.map(c=>`<div class="strip${c.k==='M'?' mst':''}" style="--sc:${c.c}" data-s="${c.k}"><b>${c.n}</b>
 <div class="row2"><canvas data-meter="${c.k}" width="10" height="150"></canvas><div class="fd" tabindex="0" role="slider" aria-label="${c.n} Lautstärke" data-mx="${c.k}" data-learn="a:mixvol${c.k}" data-name="${c.n} Lautstärke"><div class="cap"></div></div></div>
 <div class="val" data-mv="${c.k}"></div>
 ${c.k==='M'?'<div class="gap"></div>':`<input type="range" min="-1" max="1" step="0.01" value="0" data-pan="${c.k}" aria-label="${c.n} Panorama"><div class="ms"><button data-mute="${c.k}" data-act="mmute${c.k}" data-learn="a:mmute${c.k}" data-name="${c.n} Mute">M</button><button data-solo="${c.k}" data-act="msolo${c.k}" data-learn="a:msolo${c.k}" data-name="${c.n} Solo">S</button></div>`}</div>`).join('');
const mixRefs=STR.map(c=>({k:c.k,fd:mixEl.querySelector(`[data-mx="${c.k}"]`),val:mixEl.querySelector(`[data-mv="${c.k}"]`),pan:mixEl.querySelector(`[data-pan="${c.k}"]`),
  mute:mixEl.querySelector(`[data-mute="${c.k}"]`),solo:mixEl.querySelector(`[data-solo="${c.k}"]`),cv:mixEl.querySelector(`[data-meter="${c.k}"]`),lv:0}));
function getN(k){if(k==='M')return MX.M.n;if(k[0]==='L')return LT[+k[1]].vol/1.25;return MX[k].n;}
function setN(k,n){n=clamp01(n);if(k==='M'){MX.M.n=n;applyMix();}else if(k[0]==='L'){loopSet(+k[1],{vol:n*1.25});renderKnobs();}else{MX[k].n=n;applyMix();}renderMixer();}
function setMS(k,f){if(k[0]==='L'){const i=+k[1];loopSet(i,{[f]:!LT[i][f]});renderLanes();}else{MX[k][f==='mute'?'m':'s']=!MX[k][f==='mute'?'m':'s'];applyMix();}renderMixer();}
function renderMixer(){if(!VIS.mixer)return;
  for(const r of mixRefs){const n=getN(r.k);r.fd.style.setProperty('--n',n);
    r.val.textContent=r.k==='M'?dB(n)+' dB':r.k[0]==='L'?dB(LT[+r.k[1]].vol)+' dB':dB(gOf(n))+' dB';
    if(r.pan&&document.activeElement!==r.pan)r.pan.value=r.k[0]==='L'?LT[+r.k[1]].pan:MX[r.k].p;
    if(r.mute){const L=r.k[0]==='L'?LT[+r.k[1]]:null;r.mute.classList.toggle('on',L?L.mute:MX[r.k].m);r.solo.classList.toggle('on',L?L.solo:MX[r.k].s);}}}
for(const c of STR){ACT['mmute'+c.k]=()=>setMS(c.k,'mute');ACT['msolo'+c.k]=()=>setMS(c.k,'solo');ACT['mixvol'+c.k]=v=>setN(c.k,v??1);}
mixEl.addEventListener('pointerdown',e=>{const f=e.target.closest('.fd');if(!f||learning())return;f.setPointerCapture(e.pointerId);f.focus();const k=f.dataset.mx;
  const mv=ev=>{const r=f.getBoundingClientRect();setN(k,1-(ev.clientY-r.top-9)/(r.height-18));};mv(e);
  const up=()=>{f.removeEventListener('pointermove',mv);f.removeEventListener('pointerup',up);f.removeEventListener('pointercancel',up);};
  f.addEventListener('pointermove',mv);f.addEventListener('pointerup',up);f.addEventListener('pointercancel',up);});
mixEl.addEventListener('wheel',e=>{const f=e.target.closest('.fd');if(!f)return;e.preventDefault();setN(f.dataset.mx,getN(f.dataset.mx)-e.deltaY*0.0007);},{passive:false});
mixEl.addEventListener('keydown',e=>{const f=e.target.closest('.fd');if(!f)return;const k=f.dataset.mx,s=e.shiftKey?0.005:0.03;
  if(e.key==='ArrowUp'||e.key==='ArrowRight'){setN(k,getN(k)+s);e.preventDefault();}if(e.key==='ArrowDown'||e.key==='ArrowLeft'){setN(k,getN(k)-s);e.preventDefault();}});
mixEl.addEventListener('dblclick',e=>{const f=e.target.closest('.fd');if(!f)return;const k=f.dataset.mx;setN(k,k==='M'?.8:k[0]==='L'?.68:.79);});
mixEl.addEventListener('input',e=>{const p=e.target.dataset.pan;if(!p)return;const v=+e.target.value;if(p[0]==='L')loopSet(+p[1],{pan:v});else{MX[p].p=v;applyMix();}});
mixEl.addEventListener('dblclick',e=>{const p=e.target.dataset&&e.target.dataset.pan;if(!p)return;e.target.value=0;e.target.dispatchEvent(new Event('input',{bubbles:true}));});
$('#xfade').addEventListener('input',e=>{MX.xf=+e.target.value;applyMix();});
$('#xfC').addEventListener('click',()=>{MX.xf=.5;applyMix();});
/* kontinuierliche Ziele für Regler/Fader (DDJ, Oxygen, MIDI-Learn) */
const CONT={volA:v=>setN('A',v),volB:v=>setN('B',v),xfade:v=>{MX.xf=v;applyMix();},master:v=>setN('M',v),
  cutA:v=>setP('cutoff',v,0),cutB:v=>setP('cutoff',v,1),resA:v=>setP('res',v,0),resB:v=>setP('res',v,1),
  revA:v=>setP('revMix',v,0),revB:v=>setP('revMix',v,1),dlyA:v=>setP('dlyMix',v,0),dlyB:v=>setP('dlyMix',v,1)};
for(let i=0;i<8;i++)CONT['knob'+i]=v=>knobTurn(i,v);
const CONT_N={volA:'Lautstärke Part A',volB:'Lautstärke Part B',xfade:'Crossfader A/B',master:'Master',cutA:'Cutoff Part A',cutB:'Cutoff Part B',resA:'Resonanz Part A',resB:'Resonanz Part B',revA:'Hall Part A',revB:'Hall Part B',dlyA:'Delay Part A',dlyB:'Delay Part B'};

/* ================= Songs & Setlist ================= */
const DEMO_SONGS=[
 {name:'Synth-Pop-Set (DM-Stil)',bpm:120,notes:'Beispiel: Sektionen mit Presets belegen und per Pad (Modus „Song“), DDJ-Hot-Cue-Pads links oder die Leiste oben abrufen.',
  sections:[{name:'Intro',a:8,b:9,kit:0,scene:-1},{name:'Strophe',a:14,b:10,kit:0,scene:-1},{name:'Refrain',a:13,b:9,kit:0,scene:-1},{name:'Bridge',a:11,b:10,kit:0,scene:-1}]},
 {name:'Orchester (Time-Stil)',bpm:62,notes:'Klavier gern direkt vom FP-30. Für echte Orchesterklänge Part A/B auf VST-Slots legen (Steuerung → VST über FL Studio).',
  sections:[{name:'Anfang',a:21,b:20,kit:1,scene:-1},{name:'Aufbau',a:16,b:17,kit:1,scene:-1},{name:'Höhepunkt',a:18,b:19,kit:1,scene:-1},{name:'Ausklang',a:16,b:20,kit:1,scene:-1}]}
];
const okSong=x=>x&&typeof x.name==='string'&&Array.isArray(x.sections);
let SONGS=LS.get('kw.songs',null);if(!Array.isArray(SONGS)||!SONGS.length||!SONGS.every(okSong))SONGS=JSON.parse(JSON.stringify(DEMO_SONGS));
let curSong=Math.max(0,Math.min(LS.get('kw.curSong',0),SONGS.length-1)),curSec=-1;
const SC=TC;
function saveSongs(){LS.set('kw.songs',SONGS);LS.set('kw.curSong',curSong);}
const isX=v=>typeof v==='string'&&v[0]==='x';
function targetLabel(v){if(isX(v)){const sl=SLOTS[+v.slice(1)];return 'VST: '+(sl?sl.name:'?');}const p=allPresets()[v];return p?p.n:'unverändert';}
function applyTarget(pi,v){
  if(v===''||v===null||v===undefined||v===-1||v==='-1')return;
  if(isX(v)){const si=+v.slice(1);pSend(pi,{t:'panic'});outSel[pi]={mode:'ext',slot:si,bySec:true};LS.set('kw.out2',outSel);const sl=SLOTS[si];if(sl&&sl.pc>0)slotSend(si,[0xC0|((sl.ch-1)&15),(sl.pc-1)&127]);if(VIS.steuerung)renderCtl();return;}
  /* Nur zurück auf „intern“, wenn eine Song-Sektion den VST-Slot gesetzt hatte – eine Einstellung unter „Steuerung“ bleibt bestehen */
  if(outSel[pi].mode==='ext'&&outSel[pi].bySec){pSend(pi,{t:'panic'});outSel[pi].mode='int';outSel[pi].bySec=false;LS.set('kw.out2',outSel);if(VIS.steuerung)renderCtl();}
  loadPresetIdx(+v,pi);renderLCD();
}
function applyScene(k){const s=scenes[k];if(!s)return;s.forEach((x,i)=>{if(!LT[i].has)return;if(LT[i].mute!==x.mute)loopSet(i,{mute:x.mute});if(LT[i].stop!==x.stop)loopMsg('stop',i,{v:x.stop});});}
function recallSection(i){const sg=SONGS[curSong];if(!sg||!sg.sections[i])return;const sc=sg.sections[i];curSec=i;
  applyTarget(0,sc.a);applyTarget(1,sc.b);if(sc.kit>=0)setKit(+sc.kit);if(sc.scene>=0)applyScene(+sc.scene);
  renderPerf();renderPads();if(VIS.songs)renderSongEd();info(sg.name+' · '+sc.name);}
function selectSong(i,silent){if(!SONGS.length)return;curSong=(i+SONGS.length)%SONGS.length;curSec=-1;const sg=SONGS[curSong];
  if(sg.bpm&&!locked())setBpm(sg.bpm);saveSongs();if(sg.sections.length)recallSection(0);else{renderPerf();renderPads();}if(VIS.songs)renderSongs();if(!silent)toast('Song: '+sg.name);}
const pfSecs=$('#pfSecs');
pfSecs.innerHTML=Array.from({length:8},(_,i)=>`<button data-act="sec${i}" data-learn="a:sec${i}" data-name="Sektion ${i+1}" style="--sc:${SC[i]}">${i+1}</button>`).join('');
const pfBtns=[...pfSecs.children];
function renderPerf(){const sg=SONGS[curSong];$('#pfSong').textContent=sg?(curSong+1)+'. '+sg.name:'–';
  pfBtns.forEach((b,i)=>{const sc=sg&&sg.sections[i];b.textContent=sc?(i+1)+' · '+sc.name:String(i+1);b.disabled=!sc;b.title=sc?targetLabel(sc.a)+' | '+targetLabel(sc.b):'';b.classList.toggle('on',i===curSec);});}
for(let i=0;i<8;i++)ACT['sec'+i]=()=>recallSection(i);
Object.assign(ACT,{secNext:()=>{const sg=SONGS[curSong];if(sg&&curSec<sg.sections.length-1)recallSection(curSec+1);},secPrev:()=>{if(curSec>0)recallSection(curSec-1);},
  songNext:()=>selectSong(curSong+1),songPrev:()=>selectSong(curSong-1)});
function presetOpts(sel,allowNone){const pl=allPresets();let h=allowNone?`<option value="-1"${sel==-1?' selected':''}>unverändert</option>`:'';
  h+=pl.map((p,i)=>`<option value="${i}"${!isX(sel)&&+sel===i?' selected':''}>${String(i+1).padStart(2,'0')} ${esc(p.n)}</option>`).join('');
  h+='<optgroup label="VST über FL Studio">'+SLOTS.map((s,i)=>`<option value="x${i}"${sel==='x'+i?' selected':''}>VST: ${esc(s.name)}</option>`).join('')+'</optgroup>';return h;}
function renderSongs(){if(!VIS.songs)return;
  $('#sgList').innerHTML=SONGS.map((s,i)=>`<button data-sg="${i}" class="${i===curSong?'on':''}">${i+1}. ${esc(s.name)}<small>${s.bpm?s.bpm+' BPM · ':''}${s.sections.length} Sekt.</small></button>`).join('')+
    `<div style="display:flex;gap:4px;margin-top:8px"><button id="sgUp" style="flex:1">Nach oben</button><button id="sgDn" style="flex:1">Nach unten</button></div>`;
  renderSongEd();}
function renderSongEd(){const sg=SONGS[curSong];const el=$('#sgEd');if(!sg){el.innerHTML='<p class="hint">Noch keine Songs – „Neuer Song“ anlegen.</p>';return;}
  el.innerHTML=`<div class="fr"><label>Name <input type="text" id="seName" value="${esc(sg.name)}" style="width:240px"></label><label>BPM <input type="number" id="seBpm" min="40" max="240" value="${sg.bpm||''}" style="width:80px"></label>
    <button id="seLoad" class="on">Song laden</button><button id="seCap">+ Sektion aus aktuellem Klang</button><button id="seAdd">+ Leere Sektion</button></div>
   <table class="st"><thead><tr><th></th><th>Sektion</th><th>Part A</th><th>Part B</th><th>Drums</th><th>Looper-Szene</th><th></th></tr></thead><tbody>${sg.sections.map((s,i)=>`<tr data-r="${i}" class="${i===curSec?'cur':''}" style="--sc:${SC[i%8]}">
     <td class="n">${i+1}</td><td><input type="text" data-f="name" value="${esc(s.name)}" aria-label="Name Sektion ${i+1}"></td>
     <td><select data-f="a" aria-label="Part A">${presetOpts(s.a,true)}</select></td><td><select data-f="b" aria-label="Part B">${presetOpts(s.b,true)}</select></td>
     <td><select data-f="kit" aria-label="Drum-Kit"><option value="-1">unverändert</option><option value="0"${s.kit==0?' selected':''}>Elektro</option><option value="1"${s.kit==1?' selected':''}>Orchester</option></select></td>
     <td><select data-f="scene" aria-label="Szene"><option value="-1">keine</option>${[0,1,2,3].map(k=>`<option value="${k}"${s.scene==k?' selected':''}>Szene ${k+1}</option>`).join('')}</select></td>
     <td class="acts"><button data-ra="load">Laden</button><button data-ra="up" aria-label="Nach oben">▲</button><button data-ra="down" aria-label="Nach unten">▼</button><button data-ra="del">Entfernen</button></td></tr>`).join('')}</tbody></table>
   ${sg.sections.length>8?'<p class="hint">Sektionen ab 9 sind nur hier im Editor abrufbar (Pads und Leiste zeigen 1–8).</p>':''}
   <label style="display:block;margin-top:12px;color:var(--dim)">Notizen (Ablauf, Tonart, Einsätze …)<textarea id="seNotes">${esc(sg.notes||'')}</textarea></label>`;}
function curTarget(pi){return outSel[pi].mode==='ext'?'x'+outSel[pi].slot:parts[pi].preset;}
$('#songs').addEventListener('click',e=>{if(learning())return;const sg=SONGS[curSong];
  const b=e.target.closest('[data-sg]');if(b){curSong=+b.dataset.sg;curSec=-1;saveSongs();renderSongs();renderPerf();renderPads();return;}
  const id=e.target.id;
  if(id==='sgNew'){SONGS.push({name:'Neuer Song '+(SONGS.length+1),bpm:bpm,notes:'',sections:[]});curSong=SONGS.length-1;saveSongs();renderSongs();renderPerf();return;}
  if(id==='sgDup'&&sg){SONGS.splice(curSong+1,0,JSON.parse(JSON.stringify({...sg,name:sg.name+' (Kopie)'})));curSong++;saveSongs();renderSongs();renderPerf();return;}
  if(id==='sgDel'&&sg){const btn=e.target;if(!btn.dataset.c){btn.dataset.c=1;btn.textContent='Wirklich löschen?';setTimeout(()=>{btn.textContent='Löschen';delete btn.dataset.c;},2500);return;}
    SONGS.splice(curSong,1);curSong=Math.max(0,curSong-1);curSec=-1;saveSongs();renderSongs();renderPerf();renderPads();btn.textContent='Löschen';delete btn.dataset.c;return;}
  if((id==='sgUp'||id==='sgDn')&&sg){const j=curSong+(id==='sgUp'?-1:1);if(j<0||j>=SONGS.length)return;[SONGS[curSong],SONGS[j]]=[SONGS[j],SONGS[curSong]];curSong=j;saveSongs();renderSongs();renderPerf();return;}
  if(id==='sgExp'){download('klangwerk-setlist.json',new Blob([JSON.stringify({klangwerkSetlist:1,songs:SONGS},null,1)],{type:'application/json'}));return;}
  if(id==='sgImpB'){$('#sgImp').click();return;}
  if(!sg)return;
  if(id==='seLoad'){selectSong(curSong);return;}
  if(id==='seCap'||id==='seAdd'){sg.sections.push(id==='seCap'?{name:'Sektion '+(sg.sections.length+1),a:curTarget(0),b:curTarget(1),kit,scene:-1}:{name:'Sektion '+(sg.sections.length+1),a:-1,b:-1,kit:-1,scene:-1});saveSongs();renderSongEd();renderPerf();renderPads();return;}
  const r=e.target.closest('[data-ra]');if(!r)return;const i=+r.closest('tr').dataset.r,a=r.dataset.ra;
  if(a==='load'){recallSection(i);return;}
  if(a==='del'){sg.sections.splice(i,1);if(curSec>=sg.sections.length)curSec=-1;}
  if(a==='up'&&i>0)[sg.sections[i-1],sg.sections[i]]=[sg.sections[i],sg.sections[i-1]];
  if(a==='down'&&i<sg.sections.length-1)[sg.sections[i+1],sg.sections[i]]=[sg.sections[i],sg.sections[i+1]];
  saveSongs();renderSongEd();renderPerf();renderPads();});
$('#songs').addEventListener('change',e=>{const sg=SONGS[curSong];if(!sg)return;const t=e.target;
  if(t.id==='seName'){sg.name=t.value.trim()||'Ohne Titel';saveSongs();renderSongs();renderPerf();return;}
  if(t.id==='seBpm'){const v=Math.round(+t.value);sg.bpm=v>=40&&v<=240?v:null;saveSongs();renderSongs();return;}
  if(t.id==='seNotes'){sg.notes=t.value;saveSongs();return;}
  if(t.id==='sgImp'){const f=t.files[0];t.value='';if(!f)return;f.text().then(x=>{const j=JSON.parse(x);const arr=(Array.isArray(j)?j:j.songs||[]).filter(okSong);if(!arr.length)throw 0;SONGS=arr;curSong=0;curSec=-1;saveSongs();renderSongs();renderPerf();renderPads();toast(arr.length+' Songs importiert');}).catch(()=>toast('Keine gültige Setlist-Datei'));return;}
  const tr=t.closest('tr[data-r]');if(!tr||!t.dataset.f)return;const s=sg.sections[+tr.dataset.r],f=t.dataset.f;
  if(f==='name')s.name=t.value.trim()||'Sektion';else if(f==='a'||f==='b')s[f]=t.value[0]==='x'?t.value:+t.value;else s[f]=+t.value;
  saveSongs();renderPerf();renderPads();});

/* ================= Steuerung: Pad-Belegung, VST-Slots, geführte Einrichtung ================= */
const PADFN={pads:'Pads (aktueller Pad-Modus)',drums:'Drums Elektro',drumsO:'Drums Orchester',rec:'Looper: Rec/Dub Spur 1–8',stop:'Looper: Stop/Start Spur 1–8',mute:'Looper: Mute Spur 1–8',solo:'Looper: Solo Spur 1–8',sec:'Song-Sektionen 1–8',presA:'Patches → Part A',presB:'Patches → Part B'};
const FNV={pads:'looper',drums:'looper',drumsO:'looper',rec:'looper',stop:'looper',mute:'looper',solo:'looper',sec:'alles',presA:'synth',presB:'synth'};
const FNHL={pads:'#pads',drums:'#pads',drumsO:'#pads',rec:'#lanes',stop:'#lanes',mute:'#lanes',solo:'#lanes',sec:'#pfSecs',presA:'#bank',presB:'#bank'};
const DMODE={hc:'HOT CUE',bl:'BEAT LOOP',bj:'BEAT JUMP',sp:'SAMPLER'};
let PADMAP=LS.get('kw.padmap',{L:{hc:'sec',bl:'rec',bj:'stop',sp:'drums'},R:{hc:'presB',bl:'mute',bj:'presA',sp:'drumsO'}});
function padFn(fn,i,v){switch(fn){case'pads':padHit(i,v);break;case'drums':flash(i);playDrum(i,v,0);break;case'drumsO':flash(i);playDrum(i,v,1);break;case'rec':loopRec(i);break;
  case'stop':loopMsg('stop',i);break;case'mute':ACT['mute'+i]();break;case'solo':ACT['solo'+i]();break;case'sec':recallSection(i);break;
  case'presA':loadPresetIdx(bankPg*16+i,0);break;case'presB':loadPresetIdx(bankPg*16+i,1);break;}}
const OUTM=[['int','Intern (Klangwerk-Synth)'],['both','Intern + VST-Slot'],['ext','Nur VST-Slot']];
const TOURS={
 oxy:{n:'M-Audio Oxygen 25',m:/Oxygen|M-Audio/i,steps:()=>[
  {t:'note',v:'keyboard',hl:'#piano',ti:'Tastatur',tx:'Die Tasten spielen den Synth (voreingestellt Part B, unter MIDI änderbar). Pitch- und Mod-Rad biegen die Tonhöhe bzw. geben Vibrato.',ask:'Spiel eine beliebige Taste.'},
  ...Array.from({length:8},(_,i)=>({t:'btn',v:'looper',hl:`.pad[data-pad="${i}"]`,ti:'Pad '+(i+1),tx:'Die Pads folgen dem Pad-Modus: Drums, Presets, Looper-Spur '+(i+1)+' oder Song-Sektion '+(i+1)+'.',ask:'Schlag Pad '+(i+1)+' an.',map:'a:pad'+i})),
  ...Array.from({length:8},(_,i)=>({t:'cc',v:'looper',hl:`#oxy .kn:nth-child(${i+1})`,ti:'Regler '+(i+1),tx:'Modus Mixer: Lautstärke Looper-Spur '+(i+1)+'. Modus Synth: '+MACROS[i].l+' des gewählten Parts.',ask:'Dreh Regler '+(i+1)+'.',map:'c:knob'+i})),
  {t:'btn',v:'alles',hl:'#play',ti:'Play',tx:'Startet den Takt: Looper, Arpeggiator und Metronom laufen los.',ask:'Drück die Play-Taste.',map:'a:play'},
  {t:'btn',v:'alles',hl:'#play',ti:'Stop',tx:'Hält den Takt an.',ask:'Drück die Stop-Taste.',map:'a:stop'},
  {t:'btn',v:'looper',hl:'#lanes .lane.sel',ti:'Record',tx:'Nimmt auf der gewählten Looper-Spur auf. Nochmal drücken = Overdub.',ask:'Drück die Record-Taste.',map:'a:recSel'},
  {t:'btn',v:'looper',hl:'#kModes',ti:'Loop',tx:'Schaltet die 8 Regler zwischen Mixer und Synth um.',ask:'Drück die Loop-Taste.',map:'a:knobMode'},
  {t:'btn',v:'looper',hl:'#lanes',ti:'Zurückspulen',tx:'Wählt die vorige Looper-Spur.',ask:'Drück die Zurückspulen-Taste (<<).',map:'a:selPrev'},
  {t:'btn',v:'looper',hl:'#lanes',ti:'Vorspulen',tx:'Wählt die nächste Looper-Spur.',ask:'Drück die Vorspulen-Taste (>>).',map:'a:selNext'}]},
 ddj:{n:'Pioneer DDJ-400',m:/DDJ/i,steps:()=>{const st=[];
  for(const side of ['L','R']){const sn=side==='L'?'linke Seite (Deck 1)':'rechte Seite (Deck 2)',sh=side==='L'?'links':'rechts',P=side==='L'?'A':'B';
   for(const md of ['hc','bl','bj','sp']){const fn=PADMAP[side][md];
    st.push({t:'pad1',side,md,v:FNV[fn],hl:FNHL[fn],ti:DMODE[md]+' · '+sh,tx:`Auf der ${sn} steuern die 8 Pads im Modus ${DMODE[md]}: ${PADFN[fn]}. Die Belegung kannst du unter „Steuerung“ ändern.`,ask:`Drück oben ${sh} „${DMODE[md]}“ und dann Pad 1 (oben links).`,map:`d:${side}:${md}:0`},
     {t:'pad8',side,md,v:FNV[fn],hl:FNHL[fn],ti:DMODE[md]+' · '+sh,tx:`Damit Klangwerk alle 8 Pads in diesem Modus kennt.`,ask:'Jetzt Pad 8 (unten rechts).',map:`d:${side}:${md}:7`});}
   st.push({t:'btn',v:'alles',hl:side==='L'?'#play':'#pfSecs',ti:'PLAY/PAUSE · '+sh,tx:side==='L'?'Startet und stoppt den Takt (Looper, Arpeggiator, Metronom).':'Springt zur nächsten Song-Sektion.',ask:`Drück PLAY/PAUSE ${sh}.`,map:side==='L'?'a:transport':'a:secNext'},
    {t:'btn',v:'alles',hl:side==='L'?'#beats':'#pfSecs',ti:'CUE · '+sh,tx:side==='L'?'Tap-Tempo: mehrmals im Takt drücken.':'Springt zur vorigen Song-Sektion.',ask:`Drück CUE ${sh}.`,map:side==='L'?'a:tap':'a:secPrev'},
    {t:'cc',v:'mixer',hl:`[data-s="${P}"]`,ti:'Kanal-Fader · '+sh,tx:`Lautstärke von Part ${P} im Mixer.`,ask:`Schieb den Kanal-Fader ${sh}.`,map:'c:vol'+P},
    {t:'cc',v:'synth',hl:'.fd[data-k="cutoff"]',ti:'FILTER-Regler · '+sh,tx:`Filter-Cutoff von Part ${P}.`,ask:`Dreh den FILTER-Regler ${sh}.`,map:'c:cut'+P},
    {t:'cc',v:'synth',hl:'.fd[data-k="revMix"]',ti:'EQ HI · '+sh,tx:`Hall-Anteil von Part ${P}.`,ask:`Dreh EQ HI ${sh}.`,map:'c:rev'+P},
    {t:'cc',v:'synth',hl:'.fd[data-k="dlyMix"]',ti:'EQ MID · '+sh,tx:`Delay-Anteil von Part ${P}.`,ask:`Dreh EQ MID ${sh}.`,map:'c:dly'+P},
    {t:'cc',v:'synth',hl:'.fd[data-k="res"]',ti:'EQ LOW · '+sh,tx:`Filter-Resonanz von Part ${P}.`,ask:`Dreh EQ LOW ${sh}.`,map:'c:res'+P});}
  st.push({t:'cc',v:'mixer',hl:'#xfade',ti:'Crossfader',tx:'Blendet zwischen Part A (links) und Part B (rechts).',ask:'Schieb den Crossfader.',map:'c:xfade'});return st;}},
 fp:{n:'Roland FP-30',m:/FP-?30|Roland|Digital Piano/i,steps:()=>[
  {t:'note',v:'keyboard',hl:'#piano',ti:'Klaviatur',tx:'Das FP-30 spielt Part A. Tipp: Lautstärke am Piano runter, damit der interne Klang nicht mitklingt – oder bewusst hoch, wenn du den FP-30-Flügel dazu willst.',ask:'Spiel eine Taste.'},
  {t:'sus',v:'keyboard',hl:'#piano',ti:'Sustain-Pedal',tx:'Das Pedal hält die Töne des Synths.',ask:'Tritt das Sustain-Pedal.'}]}
};
const profOf=name=>Object.keys(TOURS).find(k=>TOURS[k].m.test(name));
let toured=LS.get('kw.toured',[]),askedTour=new Set();
const TR={on:false,prof:null,dev:null,steps:[],i:0,hold:0,used:new Set(),c:[],tm:0,p1:{}};
let hlEl=null;
function startTour(prof,dev){const T=TOURS[prof];if(!T)return;$('#tourAsk').hidden=true;
  if(!dev&&midi){const inp=[...midi.inputs.values()].find(x=>T.m.test(x.name));dev=inp?inp.name:null;}
  Object.assign(TR,{on:true,prof,dev,steps:T.steps(),i:0,hold:0,used:new Set(),c:[],p1:{}});$('#tour').hidden=false;renderTour();
  if(!dev)toast('Gerät nicht erkannt – ich höre auf alle Geräte');}
function renderTour(){const st=TR.steps[TR.i];if(!st){endTour(true);return;}
  if(!VIS[st.v]&&st.v!=='alles')setView(st.v);else if(st.v==='alles'&&!['alles'].includes(document.body.dataset.view)&&!$(st.hl)?.offsetParent)setView('alles');
  if(hlEl)hlEl.classList.remove('tourhl');hlEl=$(st.hl);if(hlEl){hlEl.classList.add('tourhl');hlEl.scrollIntoView({block:'center',behavior:'smooth'});}
  $('#tDev').textContent=TOURS[TR.prof].n+(TR.dev?' · '+TR.dev:'')+' · Schritt '+(TR.i+1)+' von '+TR.steps.length;
  $('#tTitle').textContent=st.ti;$('#tTxt').textContent=st.tx;$('#tAsk').textContent=st.ask;
  $('#tProg').innerHTML=TR.steps.map((s,i)=>`<i class="${i<TR.i?'d':i===TR.i?'c':''}"></i>`).join('');}
function endTour(done){TR.on=false;$('#tour').hidden=true;if(hlEl){hlEl.classList.remove('tourhl');hlEl=null;}
  if(done&&!toured.includes(TR.prof)){toured.push(TR.prof);LS.set('kw.toured',toured);}
  renderMaps();markMapped();if(VIS.steuerung)renderCtl();toast(done?'Einrichtung fertig: '+TOURS[TR.prof].n:'Einrichtung beendet');}
function tAssign(key,tgt){const dev=key.split('|')[0];for(const k in maps)if(maps[k]===tgt&&k.startsWith(dev+'|'))delete maps[k];maps[key]=tgt;LS.set('kw.maps',maps);TR.used.add(key);}
function tAdv(){TR.i++;TR.hold=performance.now()+260;renderTour();}
function tourIn(dev,kind,ch,d1,d2,key){
  const st=TR.steps[TR.i];if(!st||performance.now()<TR.hold)return;
  if(st.t==='note'){if(kind==='on')tAdv();return;}
  if(st.t==='sus'){if(kind==='cc'&&d1===64)tAdv();return;}
  if(st.t==='cc'){if(kind!=='cc'||d1===1||d1===64)return;TR.c.push(d1);clearTimeout(TR.tm);
    TR.tm=setTimeout(()=>{const n=Math.min(...TR.c);TR.c=[];const k=dev+'|cc:'+ch+':'+n;if(TR.used.has(k)||TR.steps[TR.i]!==st)return;tAssign(k,st.map);TR.used.add(dev+'|cc:'+ch+':'+(n+32));tAdv();},150);return;}
  const press=kind==='on'||kind==='mmc'||(kind==='cc'&&d2>=64&&d1!==1&&d1!==64);if(!press||TR.used.has(key))return;
  tAssign(key,st.map);
  if(st.t==='pad1')TR.p1[st.side+st.md]={ch,n:d1,kind};
  if(st.t==='pad8'){const p=TR.p1[st.side+st.md];
    if(p&&p.kind==='on'&&kind==='on'&&p.ch===ch&&d1-p.n===7){for(let k=1;k<7;k++)tAssign(dev+'|n:'+ch+':'+(p.n+k),`d:${st.side}:${st.md}:${k}`);}
    else{const extra=[];for(let k=1;k<7;k++)extra.push({...st,t:'btn',ask:'Jetzt Pad '+(k+1)+'.',map:`d:${st.side}:${st.md}:${k}`});TR.steps.splice(TR.i+1,0,...extra);}}
  tAdv();}
$('#tBack').addEventListener('click',()=>{if(TR.i>0){TR.i--;renderTour();}});
$('#tSkip').addEventListener('click',()=>tAdv());
$('#tEnd').addEventListener('click',()=>endTour(TR.i>=TR.steps.length-1));
$('#oxyWiz').addEventListener('click',()=>{if(!learning())startTour('oxy');});
function askTour(name){const p=profOf(name);if(!p||toured.includes(p)||askedTour.has(p)||TR.on)return;askedTour.add(p);const el=$('#tourAsk');
  el.innerHTML=`<div class="tdev">Neues Gerät erkannt</div><div class="ttitle">${esc(name)}</div><div class="ttxt">Soll ich dir jede Funktion einmal zeigen? Du drückst dann jeweils den passenden Knopf am Gerät (${TOURS[p].steps().length} Schritte, überspringen jederzeit möglich).</div><div class="mrow" style="margin-top:12px"><button data-tl="later">Später</button><button data-tl="${p}" class="on">Jetzt einrichten</button></div>`;
  el.hidden=false;}
$('#tourAsk').addEventListener('click',e=>{const b=e.target.closest('[data-tl]');if(!b)return;$('#tourAsk').hidden=true;if(b.dataset.tl!=='later')startTour(b.dataset.tl);});
function renderCtl(){if(!VIS.steuerung)return;
  const ins=midi?[...midi.inputs.values()]:[],outs=midi?[...midi.outputs.values()]:[];
  $('#ctlDevs').innerHTML=Object.entries(TOURS).map(([k,T])=>{const inp=ins.find(x=>T.m.test(x.name));
    return`<div class="dev"><b>${T.n}</b><span class="${inp?'ok':'no'}">${inp?'verbunden':'nicht verbunden'}</span><span class="no">${toured.includes(k)?'eingerichtet':''}</span>${inp?`<select data-dev="${esc(inp.name)}" aria-label="Rolle">${Object.entries(ROLE_L).map(([r,l])=>`<option value="${r}"${roleOf(inp.name)===r?' selected':''}>${l}</option>`).join('')}</select>`:''}<button data-tour="${k}">Geführte Einrichtung</button></div>`;}).join('')+
    ins.filter(x=>!profOf(x.name)).map(x=>`<div class="dev"><b>${esc(x.name)}</b><span class="ok">verbunden</span><select data-dev="${esc(x.name)}" aria-label="Rolle">${Object.entries(ROLE_L).map(([r,l])=>`<option value="${r}"${roleOf(x.name)===r?' selected':''}>${l}</option>`).join('')}</select><span class="no">Einzelne Knöpfe per MIDI-Learn</span></div>`).join('')+
    (midi?'':'<p class="hint">Erst „Audio starten“, dann erscheinen die Geräte hier.</p>');
  $('#padmapT').innerHTML=`<thead><tr><th>Modus</th><th>Links (Deck 1)</th><th>Rechts (Deck 2)</th></tr></thead><tbody>${Object.entries(DMODE).map(([m,l])=>`<tr><td>${l}</td>${['L','R'].map(s=>`<td><select data-pm="${s}:${m}" aria-label="${l} ${s}">${Object.entries(PADFN).map(([f,n])=>`<option value="${f}"${PADMAP[s][m]===f?' selected':''}>${n}</option>`).join('')}</select></td>`).join('')}</tr>`).join('')}</tbody>`;
  $('#partOuts').innerHTML=[0,1].map(pi=>`<label><b style="color:var(--ink)">Part ${pi?'B':'A'}</b><select data-om="${pi}">${OUTM.map(([k,l])=>`<option value="${k}"${outSel[pi].mode===k?' selected':''}>${l}</option>`).join('')}</select>
    <select data-os="${pi}" aria-label="Slot">${SLOTS.map((s,i)=>`<option value="${i}"${outSel[pi].slot===i?' selected':''}>Slot ${i+1}: ${esc(s.name)}</option>`).join('')}</select></label>`).join('');
  const D=!!window.KWD;
  if(D){$('#vstH').textContent='VST-Plugins (direkt in Klangwerk)';$('#vstP').innerHTML='Wähle pro Slot ein VST3-Plugin. „Fenster“ öffnet die Oberfläche des Plugins. Alternativ kann ein Slot weiter per MIDI-Port an FL Studio gehen. <span style="white-space:nowrap"><button id="kwScanB">Plugins suchen</button> <button id="kwAudioB">Audio-Einstellungen</button> <span id="kwScanS" class="hint"></span></span><br><label style="display:inline-flex;gap:6px;align-items:center;margin-top:6px">Looper-Ausgleich für Plugins (ms) <input type="number" id="vstOffI" value="'+vstOff+'" step="1" style="width:80px"></label> <span class="hint">positiv = Plugin-Spur später, negativ = früher</span>';}
  const plugOpts=s=>'<option value="">– kein Plugin –</option>'+[...PLUGINS].sort((a,b)=>(b.instrument-a.instrument)||a.name.localeCompare(b.name)).map(p=>`<option value="${esc(p.id)}"${s.plugin===p.id?' selected':''}>${p.instrument?'':'(Effekt) '}${esc(p.name)} – ${esc(p.vendor)}</option>`).join('');
  $('#slotT').innerHTML=`<thead><tr><th>Slot</th>${D?'<th>Plugin</th>':''}<th>${D?'Name':'Instrument in FL Studio'}</th><th>MIDI-Port</th><th>Kanal</th><th>Programm</th><th></th></tr></thead><tbody>${SLOTS.map((s,i)=>`<tr data-sl="${i}"><td>${i+1}</td>
    ${D?`<td><select data-plug="${i}" aria-label="Plugin Slot ${i+1}">${plugOpts(s)}</select></td>`:''}
    <td><input type="text" data-sf="name" value="${esc(s.name)}" aria-label="Name Slot ${i+1}"></td>
    <td><select data-sf="port" aria-label="Port Slot ${i+1}"><option value="">– wählen –</option>${outs.map(o=>`<option${s.port===o.name?' selected':''}>${esc(o.name)}</option>`).join('')}${s.port&&!outs.some(o=>o.name===s.port)?`<option selected>${esc(s.port)}</option>`:''}</select></td>
    <td><select data-sf="ch" aria-label="Kanal Slot ${i+1}">${Array.from({length:16},(_,c)=>`<option value="${c+1}"${s.ch===c+1?' selected':''}>${c+1}</option>`).join('')}</select></td>
    <td><input type="number" data-sf="pc" min="0" max="128" value="${s.pc||0}" title="0 = aus, sonst Program Change beim Umschalten" aria-label="Programm Slot ${i+1}"></td>
    <td style="white-space:nowrap">${D?`<button data-ed="${i}"${s.plugin?'':' disabled'}>Fenster</button> `:''}<button data-test="${i}">Test-Ton</button></td></tr>`).join('')}</tbody>`+(midi&&!outs.length?'<tfoot><tr><td colspan="6" class="hint">Keine MIDI-Ausgänge gefunden. Windows: loopMIDI installieren und einen Port anlegen (z. B. „Klangwerk A“), dann die Seite neu laden.</td></tr></tfoot>':'');}
$('#steuerung').addEventListener('click',e=>{const t=e.target.closest('[data-tour]');if(t){startTour(t.dataset.tour);return;}
  if(window.KWD){const ed=e.target.closest('[data-ed]');if(ed){KWD.call('kwEditor',+ed.dataset.ed).then(ok=>{if(!ok)toast('Erst ein Plugin laden');});return;}
    if(e.target.id==='kwScanB'){KWD.call('kwScan');$('#kwScanS').textContent='Suche läuft …';return;}
    if(e.target.id==='kwAudioB'){KWD.call('kwAudioSettings');return;}}
  const tt=e.target.closest('[data-test]');if(tt){const i=+tt.dataset.test,sl=SLOTS[i],ch=(sl.ch-1)&15;if(!(window.KWD&&sl.plugin)&&!outPort(sl)){toast('Für diesen Slot ist weder ein Plugin noch ein MIDI-Port gewählt');return;}
    slotSend(i,[0x90|ch,60,100]);setTimeout(()=>slotSend(i,[0x80|ch,60,0]),450);toast('Test-Ton an '+sl.name+' (Kanal '+sl.ch+')');}});
$('#steuerung').addEventListener('change',e=>{const t=e.target;
  if(t.dataset.dev){roles[t.dataset.dev]=t.value;LS.set('kw.roles',roles);panic();return;}
  if(t.dataset.pm){const [s,m]=t.dataset.pm.split(':');PADMAP[s][m]=t.value;LS.set('kw.padmap',PADMAP);return;}
  if(t.id==='vstOffI'){vstOff=Math.max(-500,Math.min(500,+t.value||0));LS.set('kw.vstOff',vstOff);return;}
  if(t.dataset.plug!==undefined&&window.KWD){const i=+t.dataset.plug,id=t.value;t.disabled=true;
    KWD.call('kwLoad',i,id).then(r=>{t.disabled=false;if(r&&r.ok){SLOTS[i].plugin=id;if(id)SLOTS[i].name=r.name;LS.set('kw.slots',SLOTS);renderCtl();if(VIS.songs)renderSongEd();toast(id?'Geladen: '+r.name+' (Slot '+(i+1)+')':'Slot '+(i+1)+' geleert');}else{toast((r&&r.err)||'Plugin ließ sich nicht laden');renderCtl();}});return;}
  if(t.dataset.om!==undefined){const pi=+t.dataset.om;pSend(pi,{t:'panic'});if(A)A.P[pi].syn.port.postMessage({t:'panic'});outSel[pi].mode=t.value;outSel[pi].bySec=false;LS.set('kw.out2',outSel);renderLCD();toast('Part '+(pi?'B':'A')+': '+OUTM.find(x=>x[0]===t.value)[1]);return;}
  if(t.dataset.os!==undefined){pSend(+t.dataset.os,{t:'panic'});outSel[+t.dataset.os].slot=+t.value;LS.set('kw.out2',outSel);return;}
  const tr=t.closest('tr[data-sl]');if(tr&&t.dataset.sf){const s=SLOTS[+tr.dataset.sl],f=t.dataset.sf;s[f]=f==='name'?(t.value.trim()||'VST'):f==='port'?t.value:Math.max(0,Math.round(+t.value));if(f==='ch')s.ch=Math.max(1,Math.min(16,s.ch));LS.set('kw.slots',SLOTS);if(f==='name'){renderCtl();if(VIS.songs)renderSongEd();}}});

/* ================= MIDI ================= */
const ROLE_L={A:'Part A',B:'Part B',AB:'A + B',ctl:'Nur Steuerung'};
function roleOf(name){if(roles[name])return roles[name];if(/DDJ|Pioneer/i.test(name))return'ctl';if(/Oxygen|M-Audio/i.test(name))return'B';return'A';}
const ledEl=$('#midiLed');let ledT=0,ledOn=false;
async function initMIDI(){
  if(!navigator.requestMIDIAccess){toast('Web MIDI wird hier nicht unterstützt – bitte Chrome oder Edge verwenden');return;}
  try{midi=await navigator.requestMIDIAccess({sysex:true});}catch(e){try{midi=await navigator.requestMIDIAccess({sysex:false});}catch(e2){toast('MIDI-Zugriff wurde verweigert');return;}}
  const bind=()=>{for(const inp of midi.inputs.values()){inp.onmidimessage=ev=>onMidi(ev,inp);askTour(inp.name);}renderDevs();renderCtl();ledEl.classList.toggle('ok',midi.inputs.size>0);};
  midi.onstatechange=bind;bind();if(midi.inputs.size)toast(midi.inputs.size+' MIDI-Gerät(e) verbunden');}
function renderDevs(){if(!midi||$('#drawer').hidden)return;const ins=[...midi.inputs.values()];
  $('#devs').innerHTML=ins.length?ins.map(d=>`<div class="row"><span>${esc(d.name)}</span><select data-dev="${esc(d.name)}">${Object.entries(ROLE_L).map(([k,l])=>`<option value="${k}"${roleOf(d.name)===k?' selected':''}>${l}</option>`).join('')}</select></div>`).join(''):'<div class="row"><span>Noch keine Geräte erkannt.</span></div>';}
$('#devs').addEventListener('change',e=>{const s=e.target.closest('select[data-dev]');if(!s)return;roles[s.dataset.dev]=s.value;LS.set('kw.roles',roles);panic();});
const monEl=$('#mon'),monLines=[];
function monitor(dev,txt){if($('#drawer').hidden)return;monLines.push(dev.slice(0,16).padEnd(17)+txt);if(monLines.length>80)monLines.shift();monEl.textContent=monLines.join('\n');monEl.scrollTop=1e9;}
const lastCC={};
const MMC={1:'stop',2:'play',3:'play',4:'selNext',5:'selPrev',6:'recSel',9:'stop'};
function onMidi(ev,inp){
  const d=ev.data,s=d[0],dev=inp.name||'MIDI';
  if(!ledOn){ledOn=true;ledEl.classList.add('hit');setTimeout(()=>{ledOn=false;ledEl.classList.remove('hit');},60);}
  if(s===0xF0){if(d[1]===0x7F&&d[3]===0x06){const cmd=d[4],key=dev+'|mmc:'+cmd;monitor(dev,'MMC      #'+cmd);
      if(TR.on&&(!TR.dev||TR.dev===dev)){tourIn(dev,'mmc',0,cmd,127,key);return;}
      const mp=maps[key];if(mp){runMap(mp,1,'on');return;}if(MMC[cmd])ACT[MMC[cmd]]();}return;}
  if(s>=0xF0)return;
  const type=s&0xf0,ch=(s&15)+1,d1=d[1],d2=d.length>2?d[2]:0;
  const kind=type===0x90&&d2>0?'on':(type===0x80||type===0x90)?'off':type===0xb0?'cc':type===0xe0?'bend':null;
  monitor(dev,(kind==='on'?'Note an ':kind==='off'?'Note aus':kind==='cc'?'CC      ':kind==='bend'?'Bend    ':'Sonst.  ')+' K'+String(ch).padStart(2)+'  #'+String(d1).padStart(3)+'  '+d2);
  if(!kind)return;
  const key=dev+'|'+(kind==='cc'?'cc':'n')+':'+ch+':'+d1;
  if(TR.on&&(!TR.dev||TR.dev===dev)){const st=TR.steps[TR.i];tourIn(dev,kind,ch,d1,d2,key);if(!(st&&(st.t==='note'||st.t==='sus')))return;}
  if(learn.on&&learn.tgt&&(kind==='on'||kind==='cc')){learnIn(dev,kind,ch,d1);return;}
  const lv=lastCC[key]||0;if(kind==='cc')lastCC[key]=d2;
  const mp=maps[key];if(mp&&kind!=='bend'){if(kind==='cc')runMap(mp,d2/127,'cc',lv);else runMap(mp,d2/127,kind);return;}
  if(kind==='on'||kind==='off'){const r=defRoute(dev,ch,d1);if(r){if(kind==='on'){if(r.act)ACT[r.act]();else if(r.d)padFn(PADMAP[r.d[0]][r.d[1]],r.d[2],d2/127);else padHit(r.pad,d2/127);}return;}}
  const role=roleOf(dev);if(role==='ctl')return;
  for(const pi of role==='A'?[0]:role==='B'?[1]:[0,1]){
    if(kind==='on')nOn(pi,d1,d2/127);
    else if(kind==='off')nOff(pi,d1);
    else if(kind==='bend'&&A)pSend(pi,{t:'bend',v:(((d2<<7)|d1)-8192)/8192});
    else if(kind==='cc'&&A){if(d1===64)pSend(pi,{t:'sus',v:d2>=64});else if(d1===1)pSend(pi,{t:'mod',v:d2/127});else if(d1===123||d1===120)pSend(pi,{t:'panic'});}
  }
}
/* Vorbelegung ohne Einrichtung (übliche Werkseinstellungen; die geführte Einrichtung überschreibt das) */
function defRoute(dev,ch,n){
  if(/DDJ/i.test(dev)){
    if(ch===8||ch===10){const side=ch===8?'L':'R';if(n<8)return{d:[side,'hc',n]};if(n>=0x60&&n<0x68)return{d:[side,'bl',n-0x60]};if(n>=0x20&&n<0x28)return{d:[side,'bj',n-0x20]};if(n>=0x30&&n<0x38)return{d:[side,'sp',n-0x30]};}
    if(n===0x0B&&(ch===1||ch===2))return{act:ch===1?'transport':'secNext'};
    if(n===0x0C&&(ch===1||ch===2))return{act:ch===1?'tap':'secPrev'};
    return null;}
  if(ch===10&&n>=36&&n<44)return{pad:n-36};
  return null;
}
function runMap(mp,v,kind,lv){
  const t=mp[0],k=mp.slice(2);
  if(t==='p'){const d=C[k];if(!d)return;
    if(kind==='cc')setP(k,d.t==='s'?v:Math.min(d.o.length-1,Math.floor(v*d.o.length)));
    else if(kind==='on')setP(k,d.t==='s'?(parts[ed].st[k]>0.5?0:1):(parts[ed].st[k]+1)%d.o.length);return;}
  if(t==='c'){if(kind==='cc'&&CONT[k])CONT[k](v);return;}
  if(t==='d'){if(kind==='on'){const [side,md,i]=k.split(':');padFn(PADMAP[side][md],+i,v);}return;}
  if(/^knob\d$/.test(k)){if(kind==='cc')knobTurn(+k.slice(4),v);return;}
  if(/^mixvol/.test(k)&&kind==='cc'){ACT[k](v);return;}
  if(ACT[k]){if(kind==='on')ACT[k](v);else if(kind==='cc'&&v>=0.5&&lv<64)ACT[k](1);}
}
/* MIDI-Learn */
const learn={on:false,tgt:null,el:null,c:[],tm:0};
function tgtName(el){return el.dataset.name||el.textContent.trim().slice(0,24);}
function mapName(v){const el=document.querySelector(`[data-learn="${v}"]`);if(el)return tgtName(el);const t=v[0],k=v.slice(2);
  if(t==='c')return k.startsWith('knob')?'Regler '+(+k.slice(4)+1):(CONT_N[k]||k);
  if(t==='d'){const [s,m,i]=k.split(':');return`DDJ ${s==='L'?'links':'rechts'} ${DMODE[m]} Pad ${+i+1} → ${PADFN[PADMAP[s][m]]}`;}
  return v;}
$('#learnBtn').addEventListener('click',()=>{learn.on=!learn.on;document.body.classList.toggle('learn',learn.on);$('#learnBtn').classList.toggle('on',learn.on);
  if(learn.el)learn.el.classList.remove('tgt');learn.tgt=learn.el=null;markMapped();info(learn.on?'MIDI-Learn: Ziel anklicken, dann Regler oder Taste am Gerät bewegen':'');});
document.addEventListener('pointerdown',e=>{if(!learn.on)return;const el=e.target.closest('[data-learn]');if(!el||e.target.closest('#learnBtn'))return;
  e.preventDefault();e.stopPropagation();if(learn.el)learn.el.classList.remove('tgt');learn.el=el;learn.tgt=el.dataset.learn;el.classList.add('tgt');info('Ziel: '+tgtName(el)+' – jetzt am Gerät bewegen oder drücken');},true);
function learnIn(dev,kind,ch,num){
  const done=(kd,n)=>{for(const k in maps)if(maps[k]===learn.tgt&&k.startsWith(dev+'|'))delete maps[k];
    maps[dev+'|'+kd+':'+ch+':'+n]=learn.tgt;LS.set('kw.maps',maps);info('Zugewiesen: '+(kd==='cc'?'CC '+n:'Note '+n)+' (Kanal '+ch+') → '+tgtName(learn.el));renderMaps();markMapped();};
  if(kind==='on'){done('n',num);return;}
  learn.c.push(num);clearTimeout(learn.tm);learn.tm=setTimeout(()=>{const n=Math.min(...learn.c);learn.c=[];if(learn.tgt)done('cc',n);},140);}
function markMapped(){if(!learn.on)return;const set=new Set(Object.values(maps));$$('[data-learn]').forEach(el=>el.classList.toggle('mapped',set.has(el.dataset.learn)));}
function renderMaps(){if($('#drawer').hidden)return;const e=Object.entries(maps);
  $('#maps').innerHTML=e.length?e.map(([k,v])=>{const [dev,m]=k.split('|');return`<div class="row"><span>${esc(dev)} · ${esc(m.replace('n:','Note K').replace('cc:','CC K').replace('mmc:','MMC #').replace(/:(\d+)$/,' #$1'))} → ${esc(mapName(v))}</span><button data-del="${esc(k)}">Entfernen</button></div>`;}).join(''):'<div class="row"><span>Noch keine Zuweisungen.</span></div>';}
$('#maps').addEventListener('click',e=>{const b=e.target.closest('[data-del]');if(!b)return;delete maps[b.dataset.del];LS.set('kw.maps',maps);renderMaps();markMapped();});
$('#mapClr').addEventListener('click',()=>{maps={};LS.set('kw.maps',maps);toured=[];LS.set('kw.toured',toured);renderMaps();markMapped();toast('Alle Zuweisungen gelöscht');});
$('#midiBtn').addEventListener('click',()=>{const d=$('#drawer');d.hidden=!d.hidden;if(!d.hidden){renderDevs();renderMaps();monEl.textContent=monLines.join('\n');}});
$('#drawerX').addEventListener('click',()=>{$('#drawer').hidden=true;});

/* ================= Zeichnen (nur Sichtbares, Größen per ResizeObserver) ================= */
const SZ=new WeakMap();
const ro=new ResizeObserver(es=>{for(const e of es){const c=e.target,dpr=Math.min(2,devicePixelRatio||1),W=Math.round(c.clientWidth*dpr),H=Math.round(c.clientHeight*dpr);SZ.set(c,{W,H,dpr});if(c.width!==W)c.width=W;if(c.height!==H)c.height=H;c._dirty=true;}});
new ResizeObserver(()=>{roll._dirty=true;}).observe(roll);
const laneCv=lanes.map(l=>l.querySelector('canvas'));laneCv.forEach(c=>ro.observe(c));
const beatEls=$$('#beats i');let lastBeat=-2,looping=false;
const tbuf=new Float32Array(512);
function laneImg(i,c){const t=LT[i],s=SZ.get(c);if(!s||!s.W)return null;
  const col=(t.mute||t.stop)?'#4a4a4e':t.st==='rec'?'#ff3b1f':t.st==='od'?'#ffc23d':t.st==='arm'?'#ff9a3d':TC[i];
  const key=s.W+'x'+s.H+col+t.st+t.bars+t.src+(t.peaks?t.peaks.length+':'+t.peaks[0]+':'+t.peaks[100]:'0');
  if(c._key===key&&c._img)return c._img;
  const im=c._img||document.createElement('canvas');im.width=s.W;im.height=s.H;const g=im.getContext('2d');g.clearRect(0,0,s.W,s.H);
  g.fillStyle='#1d1e22';for(let b=1;b<t.bars;b++)g.fillRect(Math.round(b/t.bars*s.W),0,1,s.H);
  if(t.peaks){g.fillStyle=col;const N=t.peaks.length;let mx=0;for(let k=0;k<N;k++)if(t.peaks[k]>mx)mx=t.peaks[k];const sc=Math.min(12,0.9/Math.max(mx,1e-4));
    for(let k=0;k<N;k++){const h=Math.min(1,t.peaks[k]*sc)*s.H*0.92;g.fillRect(k/N*s.W,(s.H-h)/2,Math.max(1,s.W/N-0.4),Math.max(1,h));}}
  else if(t.st==='empty'){g.fillStyle='#3a3b40';g.font=Math.round(12*s.dpr)+'px Barlow,sans-serif';g.textBaseline='middle';g.fillText('leer · '+srcName(t.src)+' · '+t.bars+' Takt'+(t.bars>1?'e':''),8*s.dpr,s.H/2);}
  c._img=im;c._key=key;return im;}
function drawLanes(rel){for(let i=0;i<8;i++){const c=laneCv[i],s=SZ.get(c);if(!s||!s.W)continue;const t=LT[i];
  const ph=(t.len&&rel>=0&&t.st!=='empty')?(rel%t.len)/t.len:-1;const k=Math.round(ph*s.W);
  if(!c._dirty&&c._ph===k&&c._key&&laneImg(i,c)===c._img&&c._lk===c._key)continue;
  const im=laneImg(i,c);const g=c.getContext('2d');g.clearRect(0,0,s.W,s.H);if(im)g.drawImage(im,0,0);
  if(ph>=0){if(t.st==='rec'){g.fillStyle='#ff3b1f30';g.fillRect(0,0,ph*s.W,s.H);}g.fillStyle='#fff';g.fillRect(Math.round((t.rev?1-ph:ph)*s.W),0,Math.max(1,s.dpr),s.H);}
  c._ph=k;c._dirty=false;c._lk=c._key;}}
function drawMeters(rel){if(!A)return;
  for(const r of mixRefs){let pk=0;
    if(r.k==='M'){A.man.getFloatTimeDomainData(tbuf);for(let i=0;i<512;i+=2){const a=Math.abs(tbuf[i]);if(a>pk)pk=a;}}
    else if(r.k[0]==='L'){const t=LT[+r.k[1]];if(t.peaks&&t.len&&rel>=0&&!t.mute&&!t.stop){const N=t.peaks.length;pk=t.peaks[Math.min(N-1,Math.floor((rel%t.len)/t.len*N))]*t.vol*1.4;}}
    else{A.CHN[r.k].an.getFloatTimeDomainData(tbuf);for(let i=0;i<512;i+=2){const a=Math.abs(tbuf[i]);if(a>pk)pk=a;}}
    const lv=Math.max(pk,r.lv*0.9);if(Math.abs(lv-r.lv)<0.002&&lv<0.002&&r.lv<0.002)continue;r.lv=lv;
    const g=r.cv.getContext('2d'),H=150,h=Math.min(1,Math.sqrt(lv))*H;g.clearRect(0,0,10,H);g.fillStyle=lv>0.95?'#ff3b1f':lv>0.5?'#ffc23d':'#3ee07a';g.fillRect(0,H-h,10,h);}}
function draw(){
  if(document.hidden){looping=false;return;}
  requestAnimationFrame(draw);
  let rel=-1;if(A&&pos.run&&pos.rel>=0)rel=pos.rel+(A.ctx.currentTime-pos.t)*A.sr;
  const beatN=rel>=0?Math.floor(rel/pos.beat)%4:-1;
  if(beatN!==lastBeat){lastBeat=beatN;beatEls.forEach((d,i)=>{d.classList.toggle('on',i===beatN);d.classList.toggle('one',i===0);});}
  if(VIS.looper)drawLanes(rel);
  if(VIS.keyboard&&(SG.play||trails.length||roll._dirty)){roll._dirty=false;drawRoll();}
  if(VIS.mixer)drawMeters(rel);
}
function startDraw(){if(!looping&&!document.hidden){looping=true;requestAnimationFrame(draw);}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&A)startDraw();});

/* ================= Start ================= */
renderAll();renderPresetList();renderPads();renderLanes();selectT(0);renderPiano();renderKnobs();renderPerf();
setView(location.hash.slice(1)||'alles',false);
if(window.KWD){
  KWD.call('kwPlugins').then(l=>{PLUGINS=l||[];renderCtl();});
  KWD.call('kwSlots').then(l=>{(l||[]).forEach((x,i)=>{if(!SLOTS[i])return;SLOTS[i].plugin=x.id||'';if(x.id)SLOTS[i].name=x.name;});LS.set('kw.slots',SLOTS);renderCtl();});
  KWD.on('kwScan',p=>{const el=$('#kwScanS');if(p.done){if(el)el.textContent=(p.count||0)+' Plugins gefunden';KWD.call('kwPlugins').then(l=>{PLUGINS=l||[];renderCtl();});}else if(el)el.textContent='Prüfe '+Math.round(p.progress*100)+'%: '+p.name;});
  document.title='Klangwerk Desktop';
}
$('#go').addEventListener('click',async()=>{$('#go').disabled=true;$('#go').textContent='Lädt …';
  try{await initAudio();await A.ctx.resume();$('#start').remove();initMIDI();startDraw();renderMixer();}
  catch(e){console.error(e);$('#go').disabled=false;$('#go').textContent='Audio starten';toast('Audio konnte nicht starten: '+e.message);}});
}
