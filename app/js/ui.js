import { I } from './icons.js';
import { store } from './store.js';
import { esc, shuffle, rich } from './data.js';
export const nav = h => { if (location.hash === h) dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = h; };
export const $ = s => document.querySelector(s);
export const $$ = s => [...document.querySelectorAll(s)];
export const bar = p => `<div class="bar"><i style="width:${Math.max(0, Math.min(100, p))}%"></i></div>`;
export const toast = (m, kind = '') => { const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = m; t.setAttribute('role', 'status'); document.body.appendChild(t); setTimeout(() => t.remove(), 2400); };
export const ST = { known: ['Known', 'ok'], learning: ['Learning', 'warn'], difficult: ['Difficult', 'bad'] };
export const stTag = st => st ? `<span class="tag ${ST[st][1]}">${ST[st][0]}</span>` : '';
let setHook = () => {}; export const onSet = f => setHook = f;
export function screen({ back, big, sub, right, body, dock, hideNav }) {
  const app = $('#app');
  app.innerHTML = `<div class="hdr">${back ? `<button class="back" data-go="${back}">${I('left')}Back</button>` : ''}<span class="grow"></span>${right || ''}</div><div class="scr">${big ? `<h1>${big}</h1><div class="mut" style="margin-bottom:12px">${sub || ''}</div>` : ''}${body}</div>${dock ? `<div class="dock">${dock}</div>` : ''}`;
  if (dock) document.body.style.paddingBottom = '96px'; else document.body.style.paddingBottom = '';
  setHook(!!hideNav); scrollTo(0, 0); return app;
}
export const loading = () => { $('#app').innerHTML = '<div class="scr"><div class="spin" role="status" aria-label="Loading"></div><p class="c mut">Loading…</p></div>'; };
export const emptyState = (title, text, action) => `<div class="card empty"><div class="ico">${I('info')}</div><h3>${title}</h3><p class="mut">${text}</p>${action || ''}</div>`;

// ---------- Range selector (lesson From / To, All, shuffle) ----------
export function range(host, { key, unit = 'Lesson', nums, label = (n) => `${unit} ${n}`, count, noun = 'items', extra = '' }) {
  const min = nums[0], max = nums[nums.length - 1];
  let st = { all: true, from: min, to: max, shuffle: store.pref('shuffle'), ...store.range(key, {}) };
  if (!nums.includes(st.from) || !nums.includes(st.to)) st = { ...st, all: true, from: min, to: max };
  const list = () => { const a = nums.filter(n => n >= Math.min(st.from, st.to) && n <= Math.max(st.from, st.to)); return st.from > st.to ? a.reverse() : a; };
  const paint = () => {
    if (st.all) { st.from = min; st.to = max; }
    store.setRange(key, st); const sel = list(); const n = count(sel);
    host.innerHTML = `<div class="card"><div class="row between"><h3>${unit} range</h3><button class="chip ${st.all ? 'on' : ''}" data-r="all">All ${unit.toLowerCase()}s</button></div>
    <div class="grid2" style="margin-top:14px"><div><label class="l" for="rf">From</label><select id="rf">${nums.map(x => `<option value="${x}" ${x === st.from ? 'selected' : ''}>${label(x)}</option>`).join('')}</select></div><div><label class="l" for="rt">To</label><select id="rt">${nums.map(x => `<option value="${x}" ${x === st.to ? 'selected' : ''}>${label(x)}</option>`).join('')}</select></div></div>
    <div class="chips" style="margin-top:14px"><button class="chip" data-r="first5">First 5</button><button class="chip" data-r="first10">First 10</button><button class="chip ${st.from > st.to ? 'on' : ''}" data-r="rev">Reverse order</button></div>
    <div class="line" style="margin-top:14px;border-top:1px solid var(--line);border-bottom:0;padding-bottom:0"><div><b>Shuffle</b><div class="xs mut">Randomise the order each session</div></div><button class="toggle ${st.shuffle ? 'on' : ''}" role="switch" aria-checked="${st.shuffle}" aria-label="Shuffle" data-r="shuf"></button></div>
    ${extra}<div class="row" style="margin-top:12px;background:var(--surf2);border-radius:12px;padding:10px 12px">${I('target', 'sm')}<span class="sm"><b>${n}</b> ${noun} selected · ${label(st.from)} ${st.from > st.to ? 'down to' : 'to'} ${label(st.to)}${st.shuffle ? ' · shuffled' : ''}</span></div></div>`;
    host.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const r = b.dataset.r; if (r === 'all') { st.all = !st.all; if (!st.all) { st.from = min; st.to = max; } } else if (r === 'first5') { st.all = false; st.from = min; st.to = nums[Math.min(4, nums.length - 1)]; } else if (r === 'first10') { st.all = false; st.from = min; st.to = nums[Math.min(9, nums.length - 1)]; } else if (r === 'rev') { st.all = false; [st.from, st.to] = [st.to, st.from]; if (st.from === st.to) { st.from = max; st.to = min; } } else if (r === 'shuf') st.shuffle = !st.shuffle; paint(); });
    host.querySelector('#rf').onchange = e => { st.all = false; st.from = +e.target.value; paint(); }; host.querySelector('#rt').onchange = e => { st.all = false; st.to = +e.target.value; paint(); };
  };
  paint();
  return { get: () => ({ nums: list(), shuffle: st.shuffle }) };
}
export const order = (items, sel, key, shuf) => { const idx = new Map(sel.map((n, i) => [n, i])); let a = items.filter(x => idx.has(x[key])); a = shuf ? shuffle(a) : a.sort((x, y) => idx.get(x[key]) - idx.get(y[key])); return a; };

// ---------- Flashcard deck ----------
export function deck(o) {
  let list = o.items.slice(), i = 0, flip = false, dir = 'a', track = store.pref('trackLearning') !== false;
  const draw = () => {
    if (!list.length) return screen({ back: o.back, body: emptyState('Nothing to show', o.empty || 'No cards match this selection.', `<button class="btn pri" data-go="${o.back}">Back</button>`) });
    i = (i + list.length) % list.length; const it = list[i], k = o.key(it), st = store.item(k).st;
    const front = dir === 'a' ? o.front(it) : o.reveal(it), back = dir === 'a' ? o.reveal(it) : o.front(it);
    screen({ back: o.back, big: o.title, sub: `${i + 1} of ${list.length}${o.sub ? ' · ' + o.sub : ''}`, hideNav: true, body: `${bar((i + 1) / list.length * 100)}
    <div class="row" style="margin-top:12px"><button class="chip ${dir === 'a' ? 'on' : ''}" id="d1">${o.dirA || 'Front to back'}</button><button class="chip ${dir === 'b' ? 'on' : ''}" id="d2">${o.dirB || 'Back to front'}</button><button class="chip" id="sh">${I('shuffle', 'sm')} Shuffle</button></div>
    <div class="flipw"><div class="flip ${flip ? 'f' : ''}" id="fc" role="button" tabindex="0" aria-label="Flip card"><div class="face">${front}</div><div class="face bk">${back}${st ? `<div>${stTag(st)}</div>` : ''}</div></div></div>
    <label class="row"><input type="checkbox" id="track" ${track ? 'checked' : ''}> Track Learning</label><div class="sm mut">${Object.keys(ST).map(s => ST[s][0]+': '+list.filter(x=>store.item(o.key(x)).st===s).length).join(' · ')}</div><div class="grid3" ${track ? '' : 'hidden'}><button class="btn bad" data-s="difficult">${I('alert', 'sm')}Hard</button><button class="btn warn" data-s="learning">${I('redo', 'sm')}Learning</button><button class="btn ok" data-s="known">${I('check', 'sm')}Known</button></div>
    <div class="row between" style="margin-top:14px"><button class="btn sm" id="pv">${I('left', 'sm')}Previous</button><button class="btn sm" id="nx">Next${I('right', 'sm')}</button></div><div class="note">Space flips · arrow keys move · 1 / 2 / 3 rate</div>` });
    $('#track').onchange=e=>{track=e.target.checked;store.setPref('trackLearning',track);draw();};
    const card=$('#fc');let start=null,swiped=false;
    card.style.touchAction='pan-y';
    card.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};swiped=false;});
    card.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(track&&Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5){swiped=true;document.querySelector('[data-s='+ (dx>0?'known':'learning') +']').click();}});
    $('#fc').onclick = () => { if(swiped)return; flip = !flip; $('#fc').classList.toggle('f', flip); if (flip) store.touch(k); };
    $('#d1').onclick = () => { dir = 'a'; flip = false; draw(); }; $('#d2').onclick = () => { dir = 'b'; flip = false; draw(); };
    $('#sh').onclick = () => { list = shuffle(list); i = 0; flip = false; toast('Shuffled'); draw(); };
    $('#pv').onclick = () => { i--; flip = false; draw(); }; $('#nx').onclick = () => { i++; flip = false; draw(); };
    $$('[data-s]').forEach(b => b.onclick = () => { if(!track)return; store.setStatus(k, b.dataset.s); toast(ST[b.dataset.s][0]); if (o.drop && o.drop(b.dataset.s)) list.splice(i, 1); else i++; flip = false; draw(); });
  };
  window._kbd = e => { if (!$('#fc')) return; if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); $('#fc').click(); } else if (e.key === 'ArrowRight') $('#nx').click(); else if (e.key === 'ArrowLeft') $('#pv').click(); else if (track && ['1', '2', '3'].includes(e.key)) $$('[data-s]')[+e.key - 1].click(); };
  draw();
}

// ---------- Quiz runner (exam-style or instant feedback) ----------
const norm = s => String(s || '').replace(/[\s　・･]/g, '');
export const isRight = (q, g) => q.type === 'type' ? norm(g) === norm(q.answer) : g === q.answer;
export function quiz({ title, back, questions, examMode, mode, sub }) {
  const A = {}, locked = {}; let i = 0;
  if (!questions.length) return screen({ back, body: emptyState('No questions available', 'Choose a wider range or different options.', `<button class="btn pri" data-go="${back}">Back</button>`) });
  const finish = () => {
    let score = 0; questions.forEach((q, n) => { q.ok = isRight(q, A[n]); if (q.ok) score++; if (examMode || !locked[n]) store.grade(q.key, q.ok, q.tag); });
    store.addResult({ mode: mode || title, score, total: questions.length });
    const pct = Math.round(score / questions.length * 100), weak = {}; questions.filter(q => !q.ok).forEach(q => weak[q.tag] = (weak[q.tag] || 0) + 1);
    screen({ back, big: 'Result', sub: title, hideNav: true, body: `<div class="card c" style="padding:26px"><div style="font-size:54px;font-weight:800;letter-spacing:-.03em;color:var(--${pct >= 80 ? 'ok' : pct < 50 ? 'bad' : 'acc'})">${score}<span class="mut" style="font-size:22px"> / ${questions.length}</span></div><div class="mut">${pct}% · ${pct >= 80 ? 'Excellent' : pct >= 50 ? 'Getting there. Review the misses below.' : 'Keep going. Missed items are scheduled for review.'}</div>${Object.keys(weak).length ? `<div class="xs mut" style="margin-top:8px">Weak topics: ${Object.entries(weak).map(([t, n]) => `${esc(t)} (${n})`).join(', ')}</div>` : ''}</div>
    <div class="grid2"><button class="btn pri" id="again">${I('redo', 'sm')}Try again</button><button class="btn" data-go="${back}">Done</button></div><h2>Review</h2>
    ${questions.map((q, n) => `<div class="card" style="border-left:4px solid var(--${q.ok ? 'ok' : 'bad'})"><div class="xs mut">Question ${n + 1} · ${esc(q.tag)}</div>${q.prompt}<div class="sm" style="margin-top:8px">Your answer: <b style="color:var(--${q.ok ? 'ok' : 'bad'})">${esc(A[n] || 'no answer')}</b></div>${q.ok ? '' : `<div class="sm">Correct: <b style="color:var(--ok)">${esc(q.answer)}</b></div>`}<div class="tip">${q.explain}</div></div>`).join('')}` });
    $('#again').onclick = () => quiz({ title, back, questions: questions.map(q => ({ ...q, options: q.options && !q.fixed ? shuffle(q.options) : q.options })), examMode, mode, sub });
  };
  const draw = () => {
    const q = questions[i], g = A[i], lk = locked[i], n = questions.length, answered = Object.keys(A).length;
    const opts = q.type === 'mc' ? `<div role="radiogroup">${q.options.map((o, k) => { let c = g === o ? 'sel' : ''; if (lk) c = o === q.answer ? 'right' : g === o ? 'wrong' : ''; return `<button class="opt ${c}" role="radio" aria-checked="${g === o}" data-o="${k}" ${lk ? 'disabled' : ''}><span class="k">${'ABCD'[k] || k + 1}</span>${esc(o)}</button>`; }).join('')}</div>` : `<input id="ti" class="tin" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ja" placeholder="Type in kana" value="${esc(g || '')}" ${lk ? 'disabled' : ''} aria-label="Your answer">${lk ? `<div class="c sm" style="margin-top:8px">Answer: <b style="color:var(--ok)">${esc(q.answer)}</b></div>` : ''}`;
    screen({ back: null, big: null, hideNav: true, right: `<button class="back" id="quit" style="margin-left:auto">${I('x', 'sm')}Exit</button>`, body: `<div class="row between"><div><div class="xs mut" style="font-weight:600">${esc(title).toUpperCase()}</div><div class="sm">Question ${i + 1} of ${n}</div></div>${sub ? `<span class="tag">${esc(sub)}</span>` : ''}</div><div style="margin:10px 0">${bar((i + 1) / n * 100)}</div>
    <div class="card c" style="padding:26px 18px">${q.prompt}</div>${opts}
    ${lk ? `<div class="tip" role="status">${q.explain}</div>` : ''}${examMode ? `<div class="pal" style="margin-top:16px">${questions.map((_, k) => `<button class="${k === i ? 'c' : A[k] ? 'a' : ''}" data-p="${k}" aria-label="Question ${k + 1}">${k + 1}</button>`).join('')}</div>` : ''}`,
    dock: `<button class="btn" id="pv" ${i ? '' : 'disabled'} aria-label="Previous">${I('left', 'sm')}</button>${i < n - 1 ? `<button class="btn pri grow" id="nx">${examMode || lk ? 'Next' : (q.type === 'type' ? 'Check' : 'Skip')}${I('right', 'sm')}</button>` : `<button class="btn pri grow" id="fin">${examMode ? `Submit (${answered}/${n} answered)` : 'See results'}</button>`}` });
    $$('.opt').forEach(b => b.onclick = () => { A[i] = q.options[+b.dataset.o]; if (!examMode) { locked[i] = true; store.grade(q.key, isRight(q, A[i]), q.tag); } draw(); });
    const stash = () => { const t = $('#ti'); if (t && !lk) { const v = t.value.trim(); if (v) A[i] = v; else delete A[i]; } };
    const advance = () => { stash(); if (!examMode && q.type === 'type' && A[i] && !locked[i]) { locked[i] = true; store.grade(q.key, isRight(q, A[i]), q.tag); return draw(); } if (i < n - 1) { i++; draw(); } };
    if ($('#nx')) $('#nx').onclick = advance; if ($('#ti')) { $('#ti').focus(); $('#ti').onkeydown = e => { if (e.key === 'Enter') advance(); }; }
    $('#pv').onclick = () => { stash(); i--; draw(); }; $$('[data-p]').forEach(b => b.onclick = () => { stash(); i = +b.dataset.p; draw(); });
    if ($('#fin')) $('#fin').onclick = () => { stash(); const un = n - Object.keys(A).length; if (un && !confirm(`${un} question${un > 1 ? 's are' : ' is'} unanswered and will count as wrong. Finish anyway?`)) return; finish(); };
    $('#quit').onclick = () => { if (confirm('Exit this quiz? Progress in this quiz will be lost.')) nav(back); };
  };
  window._kbd = null; draw();
}
