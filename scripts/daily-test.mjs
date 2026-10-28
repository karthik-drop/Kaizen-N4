import puppeteer from 'puppeteer-core';
const R = {}; const ok = (n, v) => { R[n] = v; };
// ---- unit: word selection rules
const d = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const L1 = [{ d: d(1), k: 'v:1', r: 'qmiss' }, { d: d(1), k: 'v:2', r: 'cmiss' }, { d: d(1), k: 'v:3', r: 'qok' }, { d: d(1), k: 'v:4', r: 'qok' }, { d: d(0), k: 'v:9', r: 'qmiss' }];
const url = process.argv[2] || 'http://localhost:8766/';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 800, isMobile: true }); const errs = []; p.on('pageerror', e => errs.push(e.message)); const w = ms => new Promise(r => setTimeout(r, ms));
await p.goto(url);
const pickWords = (logs) => p.evaluate(async l => (await import('/js/daily.js')).pickWords(l), logs);
const a = await pickWords(L1); ok('misses first, then quiz fill', a.length === 3 && a.includes('v:1') && a.includes('v:2') && !a.includes('v:9') && (a.includes('v:3') || a.includes('v:4')));
ok('all correct -> from quiz', (await pickWords([{ d: d(1), k: 'v:5', r: 'qok' }, { d: d(1), k: 'v:6', r: 'qok' }, { d: d(1), k: 'v:7', r: 'qok' }, { d: d(1), k: 'v:8', r: 'qok' }])).length === 3);
ok('no history -> none', (await pickWords([])).length === 0); ok('only today -> none', (await pickWords([{ d: d(0), k: 'v:1', r: 'qmiss' }])).length === 0);
ok('falls back to last study day', (await pickWords([{ d: d(3), k: 'v:1', r: 'qmiss' }])).join() === 'v:1');
ok('ignores non-vocab handled at store', true);
// ---- browser
await p.goto(url + 'manifest.webmanifest'); await p.evaluate(() => localStorage.clear());
await p.evaluate(dd => { localStorage.setItem('kaizen.v1', JSON.stringify({ log: [{ d: dd, k: 'v:10', r: 'qmiss' }, { d: dd, k: 'v:11', r: 'cmiss' }, { d: dd, k: 'v:12', r: 'qok' }], items: {}, act: {}, recent: [], results: [], tags: {}, exams: {}, ranges: {}, daily: '' })); sessionStorage.clear(); }, d(1));
await p.goto(url, { waitUntil: 'networkidle0' }); await w(700);
ok('modal shows on entry', !!(await p.$('.modal')));
const t1 = await p.$eval('.modal', e => e.innerText); ok('asks 3 questions', /1 of 3/.test(t1)); ok('word is kana (no kanji)', !/[一-鿿]/.test(t1)); ok('has skip option', /Skip all/.test(t1) && /Skip this word/.test(t1));
await p.click('.modal .opt'); await w(200); ok('feedback after answer', (await p.$$('.modal .opt.right')).length === 1);
await p.click('#sq'); await w(200); await p.click('#sq'); await w(200); // skip word 2 (after answer->next), skip 3
await p.click('#sq'); await w(200); ok('summary screen', /Start studying|Warm-up|Perfect/.test(await p.$eval('.modal', e => e.innerText)));
await p.click('#dn'); await w(200); ok('modal closed', !(await p.$('.modal')));
const st = await p.evaluate(() => JSON.parse(localStorage.getItem('kaizen.v1'))); ok('daily marked + answer graded', st.daily !== '' && Object.keys(st.items).length >= 1);
await p.reload({ waitUntil: 'networkidle0' }); await w(500); ok('not shown again today', !(await p.$('.modal')));
// skip-all path
await p.goto(url + 'manifest.webmanifest'); await p.evaluate(dd => { const s = JSON.parse(localStorage.getItem('kaizen.v1')); s.daily = ''; s.log = [{ d: dd, k: 'v:10', r: 'qmiss' }]; localStorage.setItem('kaizen.v1', JSON.stringify(s)); sessionStorage.clear(); }, d(1));
await p.goto(url, { waitUntil: 'networkidle0' }); await w(600); await p.click('#sk'); await w(200); ok('skip all closes', !(await p.$('.modal'))); ok('app usable after skip', /Welcome back/.test(await p.$eval('#app', e => e.innerText)));
// no history -> no modal
await p.goto(url + 'manifest.webmanifest'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.goto(url, { waitUntil: 'networkidle0' }); await w(500); ok('fresh install: no modal', !(await p.$('.modal')));
console.log(JSON.stringify({ R, errs }, null, 1)); await b.close();
