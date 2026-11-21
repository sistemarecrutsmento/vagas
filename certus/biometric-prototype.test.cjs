'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const page=fs.readFileSync(path.join(__dirname,'biometric-prototype.html'),'utf8');
const terminal=fs.readFileSync(path.join(__dirname,'terminal.html'),'utf8');
const scripts=[...page.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);

test('Certus prototype is clearly labelled, synthetic-only and has no real attendance integration',()=>{
 assert.match(page,/Certus · Protótipo biométrico|CERTUS · PONTO FACIAL · V0\.1/);
 assert.match(page,/demonstração sintética/i);
 assert.match(page,/não usa câmera real/i);
 assert.match(page,/Nenhuma marcação será criada/);
 assert.match(page,/Nenhum evento foi criado/);
 assert.doesNotMatch(page,/getUserMedia|fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
 assert.doesNotMatch(page,/clock-events|face-verification|face-enrollment/);
});

test('prototype flow always ends unavailable and never declares PAD or identity success',async()=>{
 assert.equal(scripts.length,1);
 const run=new vm.Script(scripts[0]);
 const nodes=new Map();
 const makeNode=()=>({className:'',textContent:'',disabled:false,attrs:{},listeners:{},children:[],classList:{toggle(){},add(){},remove(){}},setAttribute(k,v){this.attrs[k]=v},querySelector(sel){if(sel==='.result-symbol')return this.symbol||(this.symbol=makeNode());if(sel==='strong')return this.strong||(this.strong=makeNode());if(sel==='p')return this.p||(this.p=makeNode());},addEventListener(k,fn){this.listeners[k]=fn}});
 for(const id of ['result','startDemo','resetDemo','cameraState','cameraCaption'])nodes.set(id,makeNode());
 const result=nodes.get('result');result.symbol=makeNode();result.strong=makeNode();result.p=makeNode();
 const stepNodes=Array.from({length:4},()=>makeNode());
 const sandbox={document:{getElementById:id=>nodes.get(id),querySelectorAll:()=>stepNodes},setTimeout:fn=>{fn();return 1},Promise};
 run.runInNewContext(sandbox);
 await nodes.get('startDemo').listeners.click();
 assert.match(result.className,/bad/);
 assert.match(result.strong.textContent,/Sem marcação/);
 assert.match(result.p.textContent,/Nenhum evento foi criado/);
 assert.equal(nodes.get('startDemo').disabled,false);
});

test('terminal shows an isolated prototype link only with explicit lab query flag',()=>{
 assert.match(terminal,/href="\.\/biometric-prototype\.html\?v=20261121-prototype-v1" hidden/);
 assert.match(terminal,/get\('certus-lab'\)==='1'/);
 assert.match(terminal,/Laboratório biométrico · Protótipo/);
});
