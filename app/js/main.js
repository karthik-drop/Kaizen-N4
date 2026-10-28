import { custom, hard } from './custom.js';
import { I } from './icons.js';
import { store } from './store.js';
import { nav, $, loading, onSet, emptyState, screen } from './ui.js';
import * as V from './views.js';
import { load, esc, shuffle } from './data.js';
import { daily } from './daily.js';

const NAV = [['#/', 'home', 'Home'], ['#/learn', 'book', 'Learn'], ['#/exams', 'clip', 'Exams'], ['#/progress', 'chart', 'Progress'], ['#/settings', 'sliders', 'Settings']];
const SECT = { '': '#/', learn: '#/learn', vocab: '#/learn', kanji: '#/learn', grammar: '#/learn', dokkai: '#/learn', chokai: '#/learn', exams: '#/exams', progress: '#/progress', settings: '#/settings', review: '#/' };
const mq = matchMedia('(prefers-color-scheme: dark)');
export function applyPrefs() {
  const t = store.pref('theme'), dark = t === 'dark' || (t === 'system' && mq.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'; document.documentElement.style.setProperty('--fs', store.pref('fs'));
  document.querySelector('meta[name=theme-color]').setAttribute('content', dark ? '#090d18' : '#f5f7fb');
}
mq.addEventListener('change', applyPrefs); applyPrefs();
let hide = false;
function chrome(h) {
  const cur = SECT[(h.split('/')[1] || '')] || '#/';
  const html = NAV.map(([href, ic, l]) => `<a href="${href}" class="${href === cur ? 'on' : ''}" ${href === cur ? 'aria-current="page"' : ''}>${I(ic)}<span>${l}</span></a>`).join('');
  $('#tab').innerHTML = html; $('#sb').innerHTML = `<div class="brand"><div class="logo">K</div>Kaizen N4</div>${html}`;
  $('#tab').style.display = hide ? 'none' : ''; $('#sb').style.display = hide ? 'none' : '';
}
onSet(h => { hide = h; $('#tab').style.display = h ? 'none' : ''; if (innerWidth >= 900) $('#sb').style.display = h ? 'none' : ''; document.body.style.paddingLeft = h && innerWidth >= 900 ? '0' : ''; });
const R = { custom, hard, '': V.home, learn: V.learn, vocab: V.vocab, kanji: V.kanji, grammar: V.grammar, dokkai: V.dokkai, chokai: V.chokai, exams: V.exams, review: V.review, progress: V.progress, settings: (s) => V.settings(s, applyPrefs) };
let seq = 0;
async function route() {
  const h = location.hash || '#/', seg = h.split('/').slice(1), me = ++seq;
  window._kbd = null; window._studyBack = null; hide = false; document.body.style.paddingLeft = ''; chrome(h); loading();
  try { const fn = R[seg[0] || '']; if (!fn) return V.home(); await fn(seg.slice(1)); }
  catch (e) { if (me !== seq) return; console.error(e); screen({ big: 'Something went wrong', body: emptyState('Could not load this screen', `${e.message || e}. If you are offline, open this section once while online so it can be saved.`, '<button class="btn pri" onclick="location.reload()">Try again</button>') }); }
  chrome(location.hash || '#/');
}
addEventListener('hashchange', route);
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); nav(g.dataset.go); } const lv = e.target.closest('[data-lv]'); if (lv) { nav('#/kanji'); } });
document.addEventListener('keydown', e => { if (window._kbd && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) window._kbd(e); if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][tabindex],[role=link][tabindex]')) { e.preventDefault(); e.target.click(); } });
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
addEventListener('online', () => $('#net').hidden = true); addEventListener('offline', () => $('#net').hidden = false); $('#net').hidden = navigator.onLine;
route();
daily();

window.kaizenBack = () => { if(window._studyBack) return window._studyBack(); const back=document.querySelector('.hdr .back[data-go]'); if(back) return back.click(); const quit=document.querySelector('#quit') || [...document.querySelectorAll('#ex')].find(b=>/exit/i.test(b.textContent)); if(quit) return quit.click(); if(location.hash && location.hash!=='#/') nav('#/'); };
addEventListener('keydown', e=>{if(e.altKey&&e.key==='ArrowLeft'){e.preventDefault();window.kaizenBack();}});
