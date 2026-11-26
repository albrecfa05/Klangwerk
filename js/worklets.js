/* Klangwerk – Audio-Engine (AudioWorklet-Quelltexte).
   Werden zur Laufzeit als Modul geladen; im Kompatibilitätsmodus im Hauptthread ausgeführt. */
window.KW_SRC={
synth:`
const TAU=Math.PI*2;
function wv(w,p,pw){if(w===0)return Math.sin(TAU*p);if(w===1)return p<0.5?4*p-1:3-4*p;if(w===2)return 2*p-1;return p<pw?1:-1;}
// PolyBLEP-Oszillator mit einem Sample Verzögerung, damit Sprünge (auch Hard-Sync) auf beiden Seiten geglättet werden
function tick(o,inc,w,pw,sd){
  const p0=o.p;let p,cp=0,cc=0;o.wd=-1;
  if(w===4){p=p0+inc;if(p>=1){p-=1;o.wd=p/inc;}o.p=p;const out=o.y;o.y=Math.random()*2-1;return out;}
  if(sd>=0){
    let pe=p0+inc*(1-sd);
    if(pe>=1){const d=(p0+inc-1)/inc,h=w===2?-2:w===3?2:0;if(h){cp+=0.5*h*d*d;cc-=0.5*h*(1-d)*(1-d);}pe-=1;}
    else if(w===3&&p0<pw&&pe>=pw){const d=(p0+inc-pw)/inc;cp-=d*d;cc+=(1-d)*(1-d);}
    const h=wv(w,0,pw)-wv(w,pe,pw);cp+=0.5*h*sd*sd;cc-=0.5*h*(1-sd)*(1-sd);
    p=inc*sd;
  }else{
    p=p0+inc;
    if(w===3&&p0<pw&&p>=pw){const d=(p-pw)/inc;cp-=d*d;cc+=(1-d)*(1-d);}
    if(p>=1){p-=1;const d=p/inc;o.wd=d;const h=w===2?-2:w===3?2:0;if(h){cp+=0.5*h*d*d;cc-=0.5*h*(1-d)*(1-d);}}
  }
  const cur=wv(w,p,pw);const out=o.y+cp;o.y=cur+cc;o.p=p;return out;
}
function et(e,ca,cd,s,cr){const st=e.st;if(st===1){e.v+=(1.3-e.v)*ca;if(e.v>=1){e.v=1;e.st=2;}}else if(st===2){e.v+=(s-e.v)*cd;}else if(st===3){e.v-=e.v*cr;if(e.v<1e-5){e.v=0;e.st=0;}}return e.v;}
const W1=[1,2,3,3],W2=[0,2,3,4];
class P8 extends AudioWorkletProcessor{
  constructor(){
    super();this.sr=sampleRate;this.P={};this.V=[];
    for(let i=0;i<8;i++)this.V.push({i,note:60,tgt:60,cur:60,vel:1,gate:false,sus:false,on:false,age:0,
      o1:{p:Math.random(),y:0,wd:-1},o2:{p:Math.random(),y:0,wd:-1},s:[0,0,0,0],hs:0,e1:{st:0,v:0},e2:{st:0,v:0},
      tOn:0,dr:0,drT:0,drC:0,kc:0,f1:0.005,f2:0.005,G:0.1,b:0.9,cv:1+(Math.random()*2-1)*0.05,uni:0,c:[1,1,1,1,1,1],gl:0.7,gr:0.7});
    this.age=0;this.bend=0;this.modw=0;this.susOn=false;this.stack=[];this.lfoP=0;this.rnd=0;this.last=60;
    this.run=false;this.tStart=0;this.arpN=[];this.phys=new Set();this.arpStep=-1;this.arpI=0;this.arpCur=null;this.arpOrigin=0;this.arpVel=0.8;
    this.lb=new Float32Array(128);
    this.port.onmessage=e=>this.msg(e.data);
  }
  msg(m){
    switch(m.t){
      case'p':{const had=this.P.arpMode,mo=this.P.mode;Object.assign(this.P,m.p);
        if(('mode'in m.p&&m.p.mode!==mo)||('arpMode'in m.p&&!!m.p.arpMode!==!!had)){this.allOff(false);this.arpN=[];this.phys.clear();}
        break;}
      case'on':this.on(m.n,m.v);break;
      case'off':this.off(m.n);break;
      case'sus':this.susOn=m.v;if(!m.v)for(const x of this.V)if(x.sus)this.gOff(x);break;
      case'bend':this.bend=m.v*2;break;
      case'mod':this.modw=m.v;break;
      case'tr':this.run=m.run;this.tStart=m.start;this.arpStep=-1;break;
      case'panic':this.allOff(true);this.arpN=[];this.phys.clear();break;
    }
  }
  on(n,v){
    if(this.P.arpMode>0){
      if(this.phys.size===0){if(this.P.arpHold)this.arpN=[];if(this.arpN.length===0){this.arpI=0;this.arpOrigin=currentFrame;this.arpStep=-1;}}
      this.phys.add(n);if(!this.arpN.includes(n))this.arpN.push(n);this.arpVel=v;return;
    }
    this.play(n,v);
  }
  off(n){
    if(this.P.arpMode>0){this.phys.delete(n);if(!this.P.arpHold){const i=this.arpN.indexOf(n);if(i>=0)this.arpN.splice(i,1);}return;}
    this.rel(n);
  }
  play(n,v){
    const P=this.P;
    if(P.mode===0){
      let v0=null;for(const x of this.V)if(x.on&&x.note===n){v0=x;break;}
      if(!v0){let bs=-Infinity;for(const x of this.V){const sc=(!x.on?3e9:!x.gate?2e9:1e9)-x.age;if(sc>bs){bs=sc;v0=x;}}}
      this.start(v0,n,v,0,false);
    }else{
      const i=this.stack.indexOf(n);if(i>=0)this.stack.splice(i,1);this.stack.push(n);
      const vs=P.mode===1?this.V:[this.V[0]],N=vs.length;const legato=vs.some(x=>x.gate);
      vs.forEach((x,j)=>this.start(x,n,v,N>1?(j/(N-1)*2-1)*P.uniDet:0,legato));
    }
    this.last=n;
  }
  start(x,n,v,uni,legato){
    const P=this.P;x.uni=uni;
    if(P.porta<=0.001)x.cur=n;else if(!x.on&&P.mode===0)x.cur=this.last;
    x.note=n;x.tgt=n;
    if(legato&&x.gate)return;
    x.vel=v;x.gate=true;x.sus=false;x.e1.st=1;x.e2.st=1;x.tOn=0;x.on=true;x.age=++this.age;this.coef(x);
  }
  rel(n){
    const P=this.P;
    if(P.mode===0){for(const x of this.V)if(x.gate&&x.note===n){if(this.susOn)x.sus=true;else this.gOff(x);}return;}
    const i=this.stack.indexOf(n);if(i<0)return;this.stack.splice(i,1);
    const vs=P.mode===1?this.V:[this.V[0]];
    if(this.stack.length){const m=this.stack[this.stack.length-1];for(const x of vs){x.note=m;x.tgt=m;if(P.porta<=0.001)x.cur=m;}}
    else for(const x of vs){if(this.susOn)x.sus=true;else this.gOff(x);}
  }
  rel2(n){const s=this.susOn;this.susOn=false;this.rel(n);this.susOn=s;}
  gOff(x){if(!x.gate&&!x.sus)return;x.gate=false;x.sus=false;x.e1.st=3;x.e2.st=3;}
  allOff(hard){for(const x of this.V){x.gate=false;x.sus=false;if(x.e1.st)x.e1.st=3;if(x.e2.st)x.e2.st=3;if(hard){x.e2.v=0;x.e2.st=0;x.e1.st=0;x.e1.v=0;x.on=false;x.s.fill(0);x.hs=0;}}this.stack=[];this.arpCur=null;}
  coef(x){
    const P=this.P,sr=this.sr,kf=Math.pow(2,-(x.note-60)/12*(P.envKf||0));
    const c=x.c,A=(t)=>1-Math.exp(-1.466/(Math.max(t*kf,0.0005)*sr)),D=(t)=>1-Math.exp(-4.6/(Math.max(t*kf,0.001)*sr));
    c[0]=A(P.a1);c[1]=D(P.d1);c[2]=D(P.r1);c[3]=A(P.a2);c[4]=D(P.d2);c[5]=D(P.r2);
  }
  seq(){
    const P=this.P,b=[...this.arpN].sort((a,c)=>a-c),up=[];
    for(let o=0;o<=P.arpRange;o++)for(const n of b)up.push(n+12*o);
    if(P.arpMode===2)return up.reverse();
    if(P.arpMode===3&&up.length>2)return up.concat(up.slice(1,-1).reverse());
    return up;
  }
  arp(fr){
    const P=this.P;if(!P.arpMode)return;
    if(!this.arpN.length){if(this.arpCur!==null){this.rel2(this.arpCur);this.arpCur=null;}return;}
    const beat=Math.round(this.sr*60/P.bpm),sl=beat/[1,2,3,4][P.arpDiv];
    const rel=fr-(this.run?this.tStart:this.arpOrigin);if(rel<0)return;
    const step=Math.floor(rel/sl);
    if(step!==this.arpStep){
      this.arpStep=step;if(this.arpCur!==null)this.rel2(this.arpCur);
      const s=this.seq();const n=P.arpMode===4?s[Math.floor(Math.random()*s.length)]:s[this.arpI%s.length];this.arpI++;
      this.play(n,this.arpVel);this.arpCur=n;
    }else if(this.arpCur!==null&&rel-step*sl>=P.arpGate*sl){this.rel2(this.arpCur);this.arpCur=null;}
  }
  process(ins,outs){
    const o=outs[0],L=o[0],R=o[1]||o[0],n=L.length,P=this.P,sr=this.sr;
    if(P.cutoff===undefined)return true;
    const fr0=currentFrame,LF=this.lb;
    for(let i=0;i<n;i++){this.lfoP+=P.lfoRate/sr;if(this.lfoP>=1){this.lfoP-=1;this.rnd=Math.random()*2-1;}const p=this.lfoP;
      LF[i]=P.lfoWave===0?Math.sin(TAU*p):P.lfoWave===1?1-2*p:P.lfoWave===2?(p<0.5?1:-1):this.rnd;}
    const gc=P.porta>0.001?1-Math.exp(-1/(P.porta*sr*0.25)):1;
    const gh=Math.tan(Math.PI*Math.min(P.hpf,sr*0.4)/sr),Gh=gh/(1+gh);
    const w1=W1[P.v1Wave],w2=W2[P.v2Wave],sq1=P.v1Wave===3,sy=!!P.sync;
    const k24=P.res*4.15,k12=P.res*5,s24=P.slope===1,amp0=0.3*(P.mode===1?0.42:1);
    for(const x of this.V){if(!x.on)continue;this.coef(x);
      x.drC-=n;if(x.drC<=0){x.drC=sr*(0.25+Math.random()*0.75);x.drT=(Math.random()*2-1)*P.analog*0.12;}
      x.dr+=(x.drT-x.dr)*0.03;
      const sp=P.spread*((x.i%2?1:-1)*(0.35+0.65*(x.i>>1)/3));x.gl=Math.sqrt(0.5*(1-sp));x.gr=Math.sqrt(0.5*(1+sp));}
    for(let i=0;i<n;i++){
      this.arp(fr0+i);
      const lf=LF[i];let l=0,r=0;
      for(const x of this.V){
        if(!x.on)continue;
        x.cur+=(x.tgt-x.cur)*gc;
        const c=x.c,e1=et(x.e1,c[0],c[1],P.s1,c[2]),e2=et(x.e2,c[3],c[4],P.s2,c[5]);
        if(x.e2.st===0){x.on=false;x.s.fill(0);x.hs=0;continue;}
        x.tOn+=1/sr;const lv=lf*(P.lfoDelay>0.01?Math.min(1,x.tOn/P.lfoDelay):1);
        if((x.kc=(x.kc+1)&3)===0||x.tOn<5e-5){
          const base=x.cur+this.bend+x.dr+x.uni*0.01,pm=lv*P.modLfo+lf*this.modw*0.6+e1*P.modEnv;
          const s1=base+P.v1Oct*12+(P.modDest!==1?pm:0),s2=base+P.v2Oct*12+P.v2Semi+P.v2Fine*0.01+(P.modDest!==0?pm:0);
          x.f1=8.1757989*Math.exp(s1*0.0577622650)/sr;x.f2=8.1757989*Math.exp(s2*0.0577622650)/sr;
          const oc=P.envAmt*7*e1+P.lfoF*3*lv+P.keyF*(x.cur-60)/12+P.velF*(x.vel-0.7)*3;
          let fc=P.cutoff*x.cv*Math.exp(oc*0.6931472);fc=fc<12?12:fc>sr*0.42?sr*0.42:fc;
          const g=Math.tan(Math.PI*fc/sr);x.G=g/(1+g);x.b=1/(1+g);
        }
        const ps=P.pwmSrc===0?lv:P.pwmSrc===1?e1:1;let pw=0.5-P.pwmAmt*0.45*ps;pw=pw<0.04?0.04:pw>0.96?0.96:pw;
        let i2=x.f2;i2=i2>0.45?0.45:i2;
        const y2=tick(x.o2,i2,w2,pw,-1);
        let i1=x.f1;if(P.xmod>0)i1*=1+P.xmod*5*y2;i1=i1<1e-6?1e-6:i1>0.45?0.45:i1;
        const y1=tick(x.o1,i1,w1,sq1?0.5:pw,sy?x.o2.wd:-1);
        let m=y1*P.mix1+y2*P.mix2;
        {const v=(m-x.hs)*Gh,lp=v+x.hs;x.hs=lp+v;m-=lp;}
        const G=x.G,b=x.b,s=x.s,xin=m*0.45;let y,t,a;
        if(s24){const G2=G*G,G4=G2*G2,S=G2*G*b*s[0]+G2*b*s[1]+G*b*s[2]+b*s[3];y=(G4*xin+S)/(1+k24*G4);const u=Math.tanh(xin-k24*y);
          t=(u-s[0])*G;a=t+s[0];s[0]=a+t;t=(a-s[1])*G;a=t+s[1];s[1]=a+t;t=(a-s[2])*G;a=t+s[2];s[2]=a+t;t=(a-s[3])*G;a=t+s[3];s[3]=a+t;y=a*(1+k24*0.3);}
        else{const G2=G*G,S=G*b*s[0]+b*s[1];y=(G2*xin+S)/(1+k12*G2);const u=Math.tanh(xin-k12*y);
          t=(u-s[0])*G;a=t+s[0];s[0]=a+t;t=(a-s[1])*G;a=t+s[1];s[1]=a+t;y=a*(1+k12*0.1);}
        y*=e2*P.level*(1-P.vcaLfo*0.5*(1+lv))*(1-P.velA+P.velA*x.vel)*amp0;
        l+=y*x.gl;r+=y*x.gr;
      }
      L[i]=l;R[i]=r;
    }
    if(!(Math.abs(L[0])<20)){for(const x of this.V){x.s.fill(0);x.hs=0;x.o1.y=0;x.o2.y=0;}L.fill(0);R.fill(0);}
    return true;
  }
}
registerProcessor('p8-synth',P8);
`,
loop:`
// 8-Spur-Looper. Eingang: 8 Kanäle = Part A (L,R), Part B (L,R), Drums (L,R), Audio-Eingang (L,R)
class Looper extends AudioWorkletProcessor{
  constructor(){
    super();this.sr=sampleRate;this.bpm=120;this.beats=4;this.run=false;this.start=0;this.metro=false;this.quant=true;this.after='play';
    this.T=[];for(let i=0;i<8;i++)this.T.push({L:null,R:null,uL:null,uR:null,st:'empty',bars:2,src:0,mute:false,solo:false,stop:false,pStop:false,pStart:false,rev:false,vol:0.85,pan:0,gl:1,gr:1,fb:1,undo:false,redo:false,has:false,left:0,minRel:0});
    this.click=0;this.cf=1000;this.cph=0;this.cnt=0;this.pend=[];this.spans=[];
    this.port.onmessage=e=>this.msg(e.data);
  }
  dims(){const beat=Math.round(this.sr*60/this.bpm);return{beat,bar:beat*this.beats};}
  relNow(){return this.run?Math.max(0,currentFrame-this.start):0;}
  span(i){const t=this.T[i];if(t.r0===undefined||t.r0<0)return;const r1=this.relNow();if(r1>t.r0)this.spans.push({t:'span',i,r0:t.r0,r1,src:t.src});t.r0=-1;}
  flushSpans(){while(this.spans.length)this.port.postMessage(this.spans.shift());}
  free(t){t.L=t.R=t.uL=t.uR=null;t.st='empty';t.undo=t.redo=false;t.has=false;t.stop=t.pStop=t.pStart=false;}
  backup(t){if(!t.uL||t.uL.length!==t.L.length){t.uL=new Float32Array(t.L.length);t.uR=new Float32Array(t.L.length);}t.uL.set(t.L);t.uR.set(t.R);t.undo=true;t.redo=false;}
  msg(m){
    const t=this.T[m.i];
    switch(m.t){
      case'cfg':if(this.T.every(x=>!x.L))this.bpm=m.bpm;this.metro=m.metro;this.quant=m.quant;this.after=m.after;break;
      case'tr':this.run=m.run;this.start=m.start;
        if(!m.run)this.T.forEach((x,k)=>{if(x.st==='arm'){if(x.has)x.st='play';else this.free(x);}else if(x.st==='rec'){x.st='play';x.has=true;this.pend.push(k);this.span(k);}else if(x.st==='od'){x.st='play';this.pend.push(k);this.span(k);}});this.flushSpans();
        break;
      case'rec':this.rec(m.i,m.ci);this.flushSpans();break;
      case'inject':if(t&&t.L&&m.d){const len=t.L.length,n=m.n,d=m.d;for(let k=0;k<n;k++){const p=(((m.r0+k)%len)+len)%len,j=t.rev?len-1-p:p;t.L[j]+=d[k];t.R[j]+=d[n+k];}this.peaks(m.i);}break;
      case'stop':{if(!t.has)break;const tg=t.pStop?true:t.pStart?false:t.stop;const want=m.v!==undefined?m.v:!tg;
        if(this.quant&&this.run){if(want===t.stop){t.pStop=t.pStart=false;}else{t.pStop=want;t.pStart=!want;}}else{t.stop=want;t.pStop=t.pStart=false;}
        break;}
      case'set':Object.assign(t,m.v);if('pan'in m.v){const a=(t.pan+1)*Math.PI/4;t.gl=Math.cos(a)*1.4142;t.gr=Math.sin(a)*1.4142;}break;
      case'bars':if(!t.L)t.bars=m.v;break;
      case'clear':this.free(t);this.port.postMessage({t:'peaks',i:m.i,d:null});break;
      case'clearAll':this.T.forEach((x,k)=>{this.free(x);this.port.postMessage({t:'peaks',i:k,d:null});});break;
      case'undo':if(t.L&&t.uL&&(t.undo||t.redo)&&t.st!=='rec'&&t.st!=='od'){let a=t.L;t.L=t.uL;t.uL=a;a=t.R;t.R=t.uR;t.uR=a;const u=t.undo;t.undo=t.redo;t.redo=u;this.peaks(m.i);}break;
      case'export':{let len=0;for(const x of this.T)if(x.has&&x.L.length>len)len=x.L.length;
        const L=new Float32Array(len),R=new Float32Array(len);const solo=this.T.some(x=>x.solo&&x.has);
        for(const x of this.T){if(!x.has||x.mute||x.stop||(solo&&!x.solo))continue;const n=x.L.length;
          for(let i=0;i<len;i++){const p=i%n,j=x.rev?n-1-p:p;L[i]+=x.L[j]*x.vol*x.gl;R[i]+=x.R[j]*x.vol*x.gr;}}
        this.port.postMessage({t:'mix',any:len>0,L,R,sr:this.sr},[L.buffer,R.buffer]);break;}
    }
    this.report();
  }
  rec(i,ci){
    const t=this.T[i],{bar}=this.dims();
    switch(t.st){
      case'empty':{const len=bar*t.bars;t.L=new Float32Array(len);t.R=new Float32Array(len);t.has=false;t.undo=t.redo=false;
        const r=this.run?currentFrame-this.start:0;t.minRel=ci?Math.ceil(Math.max(r,0)/bar)*bar+bar:0;
        t.st=(this.quant||ci)?'arm':'rec';t.left=len;t.stop=false;t.r0=-1;break;}
      case'arm':if(t.has)t.st='play';else this.free(t);break;
      case'rec':t.has=true;this.span(i);t.st=this.after==='od'?'od':'play';if(t.st==='od'){this.backup(t);t.r0=this.relNow();}this.pend.push(i);break;
      case'play':t.stop=false;t.pStart=t.pStop=false;this.backup(t);t.st='od';t.r0=this.relNow();break;
      case'od':this.span(i);t.st='play';this.pend.push(i);break;
    }
  }
  peaks(i){
    const t=this.T[i];if(!t.L)return;const N=360,d=new Float32Array(N),len=t.L.length,step=len/N;
    for(let b=0;b<N;b++){let m=0;const s=Math.floor(b*step),e=Math.floor((b+1)*step);for(let j=s;j<e;j+=6){const v=Math.abs(t.L[j])+Math.abs(t.R[j]);if(v>m)m=v;}d[t.rev?N-1-b:b]=m*0.5;}
    this.port.postMessage({t:'peaks',i,d});
  }
  report(){this.port.postMessage({t:'st',s:this.T.map(x=>({st:x.st,mute:x.mute,solo:x.solo,stop:x.stop,pStop:x.pStop,pStart:x.pStart,rev:x.rev,undo:x.undo,redo:x.redo,has:x.has,bars:x.bars,src:x.src,vol:x.vol,pan:x.pan,fb:x.fb,len:x.L?x.L.length:0}))});}
  process(ins,outs){
    const inp=ins[0]||[],oL=outs[0][0],oR=outs[0][1]||outs[0][0],n=oL.length;
    const{beat,bar}=this.dims();const c=k=>inp[k]||null;
    const a0=c(0),a1=c(1),b0=c(2),b1=c(3),d0=c(4),d1=c(5),i0=c(6),i1=c(7);
    let changed=false,rel=-1;const solo=this.T.some(x=>x.solo&&x.has);let ci=false;for(const x of this.T)if(x.st==='arm'&&x.minRel>0)ci=true;
    for(let i=0;i<n;i++){
      let l=0,r=0;
      if(this.run){
        rel=currentFrame+i-this.start;
        if(rel>=0){
          const isBar=rel%bar===0;
          const AL=a0?a0[i]:0,AR=a1?a1[i]:AL,BL=b0?b0[i]:0,BR=b1?b1[i]:BL,DL=d0?d0[i]:0,DR=d1?d1[i]:DL,IL=i0?i0[i]:0,IR=i1?i1[i]:IL;
          for(let k=0;k<8;k++){
            const t=this.T[k];if(!t.L)continue;
            const len=t.L.length,pos=rel%len,idx=t.rev?len-1-pos:pos;
            if(isBar){if(t.pStop){t.stop=true;t.pStop=false;changed=true;}if(t.pStart){t.stop=false;t.pStart=false;changed=true;}}
            let xl,xr;switch(t.src){case 1:xl=AL;xr=AR;break;case 2:xl=BL;xr=BR;break;case 3:xl=DL;xr=DR;break;case 4:xl=IL;xr=IR;break;case 5:case 10:case 11:case 12:case 13:case 14:case 15:case 16:case 17:xl=0;xr=0;break;default:xl=AL+BL+DL+IL;xr=AR+BR+DR+IR;}
            const st=t.st;
            if(st==='arm'&&isBar&&rel>=t.minRel){t.st='rec';t.left=len;changed=true;}
            if(t.st==='rec'){if(t.r0<0)t.r0=rel;t.L[idx]=xl;t.R[idx]=xr;if(--t.left<=0){t.has=true;this.spans.push({t:'span',i:k,r0:t.r0,r1:rel+1,src:t.src});t.r0=-1;t.st=this.after==='od'?'od':'play';if(t.st==='od'){this.backup(t);t.r0=rel+1;}this.pend.push(k);changed=true;}}
            else if(st==='play'||st==='od'){
              const a=t.L[idx],b=t.R[idx];
              if(st==='od'){t.L[idx]=a*t.fb+xl;t.R[idx]=b*t.fb+xr;}
              if(!t.mute&&!t.stop&&(!solo||t.solo)){l+=a*t.vol*t.gl;r+=b*t.vol*t.gr;}
            }
          }
          if((this.metro||ci)&&rel%beat===0){this.click=1;this.cph=0;this.cf=rel%bar===0?1760:1100;}
        }
      }
      if(this.click>0.001){this.cph+=this.cf/this.sr;const cl=Math.sin(6.2831853*this.cph)*this.click*0.28;this.click*=0.9982;l+=cl;r+=cl;}
      oL[i]=l;oR[i]=r;
    }
    if(changed)this.report();
    while(this.pend.length)this.peaks(this.pend.shift());
    this.flushSpans();
    if(++this.cnt%6===0)this.port.postMessage({t:'pos',rel:this.run?rel:-1,beat,bar,run:this.run});
    return true;
  }
}
registerProcessor('p8-looper',Looper);
`
};
