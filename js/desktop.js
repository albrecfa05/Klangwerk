/* Klangwerk – Brücke zur Desktop-App (JUCE).
   Im normalen Browser passiert hier nichts. In der Desktop-App:
   - window.KWD: Aufrufe an die App (Plugins laden, Fenster öffnen, Audio-Einstellungen …)
   - navigator.requestMIDIAccess wird durch die nativen MIDI-Geräte der App ersetzt */
(function(){
  const J=window.__JUCE__;
  const fns=(J&&J.initialisationData&&J.initialisationData.__juce__functions)||[];
  if(!J||!J.backend||!fns.includes('kwInfo'))return;
  const B=J.backend;let pid=1;const pend=new Map();
  B.addEventListener('__juce__complete',p=>{const r=pend.get(p.promiseId);if(r){pend.delete(p.promiseId);r(p.result);}});
  const call=(name,...params)=>new Promise(res=>{const id=pid++;pend.set(id,res);B.emitEvent('__juce__invoke',{name,params,resultId:id});});
  window.KWD={call,emit:(e,o)=>B.emitEvent(e,o),on:(e,f)=>B.addEventListener(e,f)};

  /* Web-MIDI-Ersatz: gleiche Schnittstelle, aber Geräte kommen aus der App */
  const inputs=new Map(),outputs=new Map();
  const access={inputs,outputs,sysexEnabled:true,onstatechange:null};
  function sync(d){
    const ins=(d&&d.ins)||[],outs=(d&&d.outs)||[];
    for(const k of [...inputs.keys()])if(!ins.includes(k))inputs.delete(k);
    for(const n of ins)if(!inputs.has(n))inputs.set(n,{id:n,name:n,type:'input',state:'connected',onmidimessage:null});
    for(const k of [...outputs.keys()])if(!outs.includes(k))outputs.delete(k);
    for(const n of outs)if(!outputs.has(n))outputs.set(n,{id:n,name:n,type:'output',state:'connected',send:data=>B.emitEvent('kwMidiOut',{d:n,m:Array.from(data)})});
    if(typeof access.onstatechange==='function')access.onstatechange({});
  }
  B.addEventListener('kwMidiDevices',sync);
  B.addEventListener('kwMidiIn',p=>{const i=inputs.get(p.d);if(i&&i.onmidimessage)i.onmidimessage({data:new Uint8Array(p.m),target:i});});
  try{Object.defineProperty(navigator,'requestMIDIAccess',{configurable:true,value:async()=>{sync(await call('kwMidiDevices'));return access;}});}
  catch(e){navigator.requestMIDIAccess=async()=>{sync(await call('kwMidiDevices'));return access;};}
  document.documentElement.classList.add('desktop');
})();
