import puppeteer from 'puppeteer-core';
const url = process.argv[2] || 'http://localhost:8766/';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 800, isMobile: true, hasTouch: true });
const errors = []; p.on('pageerror', e => errors.push('PAGE ' + e.message)); p.on('console', m => m.type() === 'error' && errors.push('CON ' + m.text()));
const wait = ms => new Promise(r => setTimeout(r, ms));
const R = {}; const ok = (n, v) => { R[n] = v; };
const txt = () => p.evaluate(() => document.querySelector('#app').innerText);
const click = async sel => { await p.waitForSelector(sel, { timeout: 4000 }); await p.click(sel); await wait(250); };
const hash = async h => { await p.evaluate(h => { if (location.hash === h) dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = h; }, h); await wait(500); };
await p.goto(url, { waitUntil: 'networkidle0' }); await wait(500);
// every route renders
for (const h of ['#/', '#/learn', '#/vocab', '#/kanji', '#/grammar', '#/dokkai', '#/chokai', '#/exams', '#/progress', '#/settings', '#/review']) { await hash(h); const t = await txt(); ok('route ' + h, t.length > 20 && !/went wrong/.test(t)); }
// vocab: range selector + flashcards + quiz
await hash('#/vocab'); await p.select('#rf', '28'); await p.select('#rt', '26'); await wait(200);
ok('vocab reverse summary', /down to/.test(await txt()));
await p.select('#rf', '26'); await p.select('#rt', '27'); await wait(200); ok('vocab count 26-27', / words selected/.test(await txt()));
await click('#m-flash'); await click('#fc'); ok('flash flipped', await p.evaluate(() => document.querySelector('#fc').classList.contains('f')));
await click('[data-s=known]'); ok('flash status saved', await p.evaluate(() => Object.values(JSON.parse(localStorage.getItem('kaizen.v1')).items).some(i => i.st === 'known')));
const nokanji = await p.evaluate(() => !/[一-鿿]/.test(document.querySelector('#app').innerText)); ok('vocab flash has no kanji', nokanji);
await hash('#/vocab'); await click('#m-quiz'); for (let i = 0; i < 20; i++) { await p.waitForSelector('.opt'); await p.click('.opt'); await wait(60); const nx = await p.$('#nx'); if (nx) await nx.click(); else await p.click('#fin'); await wait(60); }
await wait(300); ok('vocab quiz result', /Result/.test(await txt()));
// type quiz
await hash('#/vocab'); await click('#fmt [data-f=type]'); await click('#m-quiz'); await p.type('#ti', 'zzz'); await click('#nx'); ok('type quiz feedback', /Answer:/.test(await txt()));
// kanji
await hash('#/kanji'); await click('#kg [data-k]'); ok('kanji detail', /When is each reading used/.test(await txt()));
await click('[data-m=kread]'); ok('kanji reading quiz starts', /how is this word read/i.test(await txt()));
await hash('#/kanji'); await click('[data-m=flash]'); ok('kanji flash', !!(await p.$('#fc')));
// grammar
await hash('#/grammar'); await click('#gs'); ok('grammar notes', (await p.$$('details.card')).length >= 20);
await click('#g2'); ok('grammar mondai2 starts', /STAR|★/.test(await txt()));
// dokkai
await hash('#/dokkai'); await click('[data-d]'); await click('.opt'); ok('dokkai feedback', /Correct|Not quite/.test(await txt()));
// chokai
await hash('#/chokai'); await click('[data-c]'); await click('.opt'); await click('#ck'); ok('chokai transcript', /Transcript/.test(await txt()));
// settings theme + persistence
await hash('#/settings'); await click('[data-t=dark]'); ok('dark theme', await p.evaluate(() => document.documentElement.dataset.theme === 'dark'));
await click('[data-t=light]'); ok('light theme', await p.evaluate(() => document.documentElement.dataset.theme === 'light'));
// full mock exam
await hash('#/exams'); await p.evaluate(() => { window.confirm = () => true; });
await click('[data-p="1"]'); await wait(400);
for (let s = 0; s < 3; s++) {
  await click('#go'); 
  for (let g = 0; g < 80; g++) { const o = await p.$('.opt'); if (o) await o.click(); await wait(20); const nx = await p.$('#nx'); if (nx) { await nx.click(); await wait(20); } else break; }
  await p.click('#fs'); await wait(500);
}
ok('exam -> score', /Score report/.test(await txt()) && /Reference information/.test(await txt()));
const att = await p.evaluate(() => JSON.parse(localStorage.getItem('kaizen.v1')).exams[1].attempts[0]);
ok('exam saved', att && att.total >= 0 && att.rev.length >= 50); ok('exam sections', `${att.lk}/${att.rd}/${att.ls} total ${att.total}`);
await hash('#/'); ok('home after exam', /1 of 10 mock exams done/.test(await txt()));
// persistence across reload
await p.reload({ waitUntil: 'networkidle0' }); await hash('#/progress'); ok('persist after reload', /Mock exam trend/.test(await txt()) && /1 attempt/.test(await txt()));
// overflow + offline
await wait(1500); await p.reload({ waitUntil: 'networkidle0' });
ok('sw controlling', await p.evaluate(() => !!navigator.serviceWorker.controller));
await p.setOfflineMode(true);
for (const h of ['#/vocab', '#/kanji', '#/exams']) { await p.goto(url + h, { waitUntil: 'networkidle0' }).catch(() => {}); await wait(500); ok('offline ' + h, (await txt()).length > 40); }
ok('overflow390', !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)));
console.log(JSON.stringify({ results: R, errors }, null, 1)); await b.close();
