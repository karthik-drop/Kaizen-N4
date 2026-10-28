import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
const p=await b.newPage();await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
const errors=[];p.on('pageerror',e=>errors.push(e.message));
const wait=()=>new Promise(r=>setTimeout(r,250));
const go=async h=>{await p.goto('http://127.0.0.1:8080/'+h);await wait();};
await go('#/custom');await p.waitForSelector('#preview');
assert.equal(await p.$eval('#kavail',e=>e.textContent),'200 available · 0 Hard');
await p.$eval('#vcount',e=>{e.value=2;e.dispatchEvent(new Event('change'));});
await p.$eval('#gcount',e=>{e.value=3;e.dispatchEvent(new Event('change'));});
await p.$eval('#kcount',e=>{e.value=4;e.dispatchEvent(new Event('change'));});
await p.$eval('#n5',e=>{e.checked=true;e.dispatchEvent(new Event('change'));});assert.match(await p.$eval('#kavail',e=>e.textContent),/available/);
await p.click('#preview');await p.click('#begin');
let state=await p.evaluate(()=>JSON.parse(localStorage.getItem('kaizen.custom.active')));
assert.equal(state.qs.length,9);assert.equal(state.qs.filter(q=>q.section==='g').length,3);
assert.equal(new Set(state.qs.map(q=>q.key)).size,9);
p.on('dialog',d=>d.accept());
for(let i=0;i<9;i++){await p.click('.opt');await p.click('#next');}
assert.match(await p.$eval('#app',e=>e.innerText),/Exam result/);
assert.equal(await p.evaluate(()=>localStorage.getItem('kaizen.custom.active')),null);
await go('#/kanji');await p.click('#level4');await wait();assert.equal((await p.$$('#kg button')).length,200);
await p.click('[data-m=flash]');await p.waitForSelector('#track');
await p.evaluate(()=>{const c=document.querySelector('#fc');c.dispatchEvent(new PointerEvent('pointerdown',{clientX:90,clientY:200,bubbles:true}));c.dispatchEvent(new PointerEvent('pointerup',{clientX:230,clientY:210,bubbles:true}));});
await wait();assert(await p.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('kaizen.v1')).items).some(i=>i.st==='known')));
await p.click('[data-s=difficult]');await go('#/hard');assert.match(await p.$eval('#hardcount',e=>e.textContent),/1 Hard/);
await p.click('#hardstart');await p.click('[data-s=learning]');assert.match(await p.$eval('#app',e=>e.innerText),/Nothing to show/);
await go('#/custom');await p.$eval('#vcount',e=>e.value=-1);await p.click('#preview');assert.match(await p.$eval('#err',e=>e.textContent),/Request/);
assert.deepEqual(errors,[]);
await go('#/custom');await p.screenshot({path:'/tmp/kaizen-custom.png',fullPage:true});
console.log('PASS custom independent counts, source ranges, N5 toggle, generation, submit/result, swipe classification, Hard revision removal, validation and no page errors');
}finally{await b.close();}
