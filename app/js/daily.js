// Daily warm-up: 3 vocabulary meanings when the app opens. Skippable.
import { store } from './store.js';
import { load, esc, shuffle } from './data.js';
import { I } from './icons.js';

const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Which words to ask: yesterday's missed ones (flashcards marked Hard / quiz mistakes) first;
// if nothing was missed, words from yesterday's quizzes; then flashcards. Falls back to the most recent earlier study day.
export function pickWords(logs, today = new Date()) {
  const t = dayKey(today), days = [...new Set(logs.map(l => l.d))].filter(d => d < t).sort().reverse();
  const y = new Date(today); y.setDate(y.getDate() - 1); const yk = dayKey(y);
  const day = days.includes(yk) ? yk : days[0];
  if (!day) return [];
  const L = logs.filter(l => l.d === day), uniq = a => [...new Set(a)];
  const missed = uniq(L.filter(l => l.r === 'qmiss' || l.r === 'cmiss').map(l => l.k));
  const quiz = uniq(L.filter(l => l.r === 'qok').map(l => l.k)), cards = uniq(L.filter(l => l.r === 'cok').map(l => l.k));
  const out = shuffle(missed).slice(0, 3);
  for (const pool of [quiz, cards]) for (const k of shuffle(pool)) { if (out.length >= 3) break; if (!out.includes(k)) out.push(k); }
  return out;
}

export async function daily() {
  const today = dayKey(new Date());
  if (store.daily() === today || sessionStorage.getItem('k4-daily') === '1') return;
  sessionStorage.setItem('k4-daily', '1');
  let keys = pickWords(store.logs());
  if (!keys.length) return;
  let data; try { data = await load('n4/vocab'); } catch (e) { return; }
  const words = keys.map(k => data.words.find(w => w.id === +k.slice(2))).filter(Boolean);
  if (!words.length) return;
  const qs = words.map(w => ({ w, opts: shuffle([w.en, ...shuffle(data.words.filter(x => x.cat === w.cat && x.en !== w.en)).slice(0, 40).map(x => x.en).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3)]) }));
  let i = 0, ok = 0, answered = 0;
  const el = document.createElement('div'); el.className = 'modal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Daily vocabulary check');
  document.body.appendChild(el);
  const close = (finished) => { if (finished) store.setDaily(today); el.remove(); };
  const draw = () => {
    if (i >= qs.length) { el.innerHTML = `<div class="sheet"><div class="c"><div style="font-size:44px;font-weight:800;color:var(--acc)">${ok} / ${answered || qs.length}</div><h3 style="margin:6px 0">${ok === answered && answered ? 'Perfect warm-up' : 'Warm-up done'}</h3><p class="mut sm">${answered ? 'Missed words will come back in your spaced review.' : 'No problem. See you tomorrow.'}</p></div><button class="btn pri blk" id="dn">Start studying</button></div>`; el.querySelector('#dn').onclick = () => close(true); return; }
    const q = qs[i], g = q._g;
    el.innerHTML = `<div class="sheet"><div class="row between"><span class="tag">Daily check · ${i + 1} of ${qs.length}</span><button class="back" id="sk" style="margin-left:auto;padding:4px 0">Skip all</button></div>
    <div class="xs mut" style="margin-top:14px;font-weight:600;letter-spacing:.06em">WHAT DOES THIS MEAN?</div><div style="font-size:40px;font-weight:700;letter-spacing:-.02em;margin:6px 0 4px">${esc(q.w.kana)}</div><div class="xs mut">Lesson ${q.w.lesson}</div>
    <div>${q.opts.map((o, k) => { let c = ''; if (g != null) c = o === q.w.en ? 'right' : o === g ? 'wrong' : ''; return `<button class="opt ${c}" data-o="${k}" ${g != null ? 'disabled' : ''}><span class="k">${'ABCD'[k]}</span>${esc(o)}</button>`; }).join('')}</div>
    <div class="row" style="margin-top:10px"><button class="btn grow" id="sq">${g != null ? 'Next' : "Skip this word"}</button></div></div>`;
    el.querySelector('#sk').onclick = () => close(false);
    el.querySelector('#sq').onclick = () => { i++; draw(); };
    el.querySelectorAll('.opt').forEach(b => b.onclick = () => { const o = q.opts[+b.dataset.o]; q._g = o; answered++; const right = o === q.w.en; if (right) ok++; store.grade('v:' + q.w.id, right, 'Vocab: daily check'); draw(); });
  };
  draw();
}
