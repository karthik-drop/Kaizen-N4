// All progress lives on-device (localStorage). Everything shown in the UI is derived from this.
const KEY = 'kaizen.v1';
const DAY = 86400000, INTERVALS = [0, 1, 2, 4, 8, 16, 32];
const DEF = { prefs: { theme: 'light', fs: 1, furigana: true, shuffle: true, examMode: false, goal: 20, examDate: '', n5kanji: true, level: 'N4' }, items: {}, act: {}, recent: [], results: [], tags: {}, exams: {}, ranges: {}, log: [], daily: '' };
let S = JSON.parse(JSON.stringify(DEF));
try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); S = { ...S, ...o, prefs: { ...S.prefs, ...(o.prefs || {}) } }; } } catch (e) {}
let t = 0;
const flush = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const save = () => { clearTimeout(t); t = setTimeout(flush, 120); };
addEventListener('pagehide', flush); document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
const day = (d = Date.now()) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const store = {
  pref: k => S.prefs[k], setPref(k, v) { S.prefs[k] = v; save(); }, prefs: () => S.prefs,
  range(key, def) { return S.ranges[key] || def; }, setRange(key, v) { S.ranges[key] = v; save(); },
  item: k => S.items[k] || { box: 0, due: 0, ok: 0, miss: 0, seen: 0, st: null },
  bump() { const d = day(); S.act[d] = (S.act[d] || 0) + 1; },
  touch(k) { const it = this.item(k); it.seen++; S.items[k] = it; this.bump(); save(); },
  logv(k, r) { if (!k.startsWith('v:')) return; S.log.push({ d: day(), k, r }); if (S.log.length > 3000) S.log = S.log.slice(-2000); },
  daily: () => S.daily, setDaily(v) { S.daily = v; save(); },
  logs: () => S.log,
  setStatus(k, st) {
    this.logv(k, st === 'difficult' ? 'cmiss' : 'cok');
    const it = this.item(k); it.st = st; it.seen = Math.max(1, it.seen);
    if (st === 'known') { it.box = Math.max(it.box, 4); it.due = Date.now() + INTERVALS[it.box] * DAY; } else if (st === 'learning') { it.box = Math.max(1, Math.min(it.box, 2)); it.due = Date.now() + DAY; } else { it.box = 0; it.due = Date.now(); }
    S.items[k] = it; this.bump(); save();
  },
  grade(k, ok, tag, classify = true) {
    this.logv(k, ok ? 'qok' : 'qmiss');
    const it = this.item(k); it.seen++;
    if (ok) { it.ok++; it.box = Math.min(6, it.box + 1); it.due = Date.now() + INTERVALS[it.box] * DAY; if (classify && it.st === 'difficult' && it.box >= 3) it.st = 'learning'; } else { it.miss++; it.box = 0; it.due = Date.now() + 600000; if(classify) it.st = 'difficult'; }
    S.items[k] = it;
    if (tag) { const g = S.tags[tag] || { ok: 0, all: 0 }; g.all++; if (ok) g.ok++; S.tags[tag] = g; }
    this.bump(); save();
  },
  count(prefix, pred) { return Object.entries(S.items).filter(([k, v]) => k.startsWith(prefix) && pred(v)).length; },
  keys(prefix, pred) { return Object.entries(S.items).filter(([k, v]) => k.startsWith(prefix) && pred(v)).map(([k]) => k); },
  due(prefixes) { const n = Date.now(); return Object.entries(S.items).filter(([k, v]) => prefixes.some(p => k.startsWith(p)) && v.seen && v.due <= n).map(([k]) => k); },
  recent(label, href) { S.recent = [{ label, href, t: Date.now() }, ...S.recent.filter(r => r.label !== label)].slice(0, 6); save(); },
  recents: () => S.recent, tags: () => S.tags,
  addResult(r) { S.results = [{ ...r, t: Date.now() }, ...S.results].slice(0, 100); save(); }, results: () => S.results,
  exam(id) { return S.exams[id] || { attempts: [] }; },
  addExam(id, a) { const e = this.exam(id); e.attempts = [a, ...e.attempts].slice(0, 20); e.best = Math.max(e.best || 0, a.total); S.exams[id] = e; this.bump(); save(); },
  exams: () => S.exams,
  todayCount: () => S.act[day()] || 0,
  streak() { let n = 0, d = Date.now(); if (!S.act[day(d)]) d -= DAY; while (S.act[day(d)]) { n++; d -= DAY; } return n; },
  export: () => JSON.stringify({ app: 'kaizen-n4', v: 1, data: S }),
  import(text) { const o = JSON.parse(text); if (!o || o.app !== 'kaizen-n4' || !o.data || typeof o.data.items !== 'object') throw new Error('This is not a Kaizen backup file.'); S = { ...JSON.parse(JSON.stringify(DEF)), ...o.data, prefs: { ...DEF.prefs, ...(o.data.prefs || {}) } }; flush(); },
  reset() { S = JSON.parse(JSON.stringify(DEF)); flush(); },
};
