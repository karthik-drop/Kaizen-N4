import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try {
 const p=await b.newPage();await p.goto('http://127.0.0.1:8080/#/custom');await p.waitForSelector('#preview');await p.click('#preview');await p.click('#begin');await p.click('.opt');await p.click('#next');
 const saved=await p.evaluate(()=>localStorage.getItem('kaizen.custom.active'));
 await p.reload();await p.waitForSelector('#resume');await p.click('#resume');
 assert.equal(await p.evaluate(()=>localStorage.getItem('kaizen.custom.active')),saved);
 await p.evaluate(()=>window.kaizenBack());
 assert.match(await p.$eval('h1',e=>e.textContent),/Question 1 of/);
 await p.evaluate(()=>window.kaizenBack());await p.waitForSelector('#preview');
 assert(await p.evaluate(()=>!!localStorage.getItem('kaizen.custom.active')));
 await p.goto('http://127.0.0.1:8080/#/settings');await p.waitForSelector('#ex');await p.evaluate(()=>window.kaizenBack());await p.waitForFunction(()=>location.hash==='#/');
 console.log('PASS custom answer resume after reload, native JS back handler previous question and config without losing answers, settings back returns home');
} finally {await b.close();}
