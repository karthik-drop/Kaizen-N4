const cache = {};
export const load = path => cache[path] || (cache[path] = fetch(`data/${path}.json`).then(r => { if (!r.ok) throw new Error(`Could not load ${path} (${r.status})`); return r.json(); }).catch(e => { delete cache[path]; throw e; }));
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const fmtKun = r => r.replace('.', '(') + (r.includes('.') ? ')' : '');
// {漢字|よみ} -> <ruby>, «x» -> <u>x</u>; everything else escaped
export const rich = s => esc(s).replace(/\{([^|}]+)\|([^}]+)\}/g, (m, k, r) => k === r ? k : `<ruby>${k}<rt>${r}</rt></ruby>`).replace(/«([^»]+)»/g, '<u>$1</u>');
export const plain = s => String(s).replace(/\{([^|}]+)\|[^}]+\}/g, '$1');
// ---- Japanese text-to-speech for the listening practice (uses the device's built-in voices)
export const tts = {
  ok: () => 'speechSynthesis' in window,
  voice() { const v = speechSynthesis.getVoices().filter(x => /^ja/i.test(x.lang)); return v[0] || null; },
  speak(lines, { onLine, onEnd, rate = .9 } = {}) {
    speechSynthesis.cancel(); let i = 0, stop = false;
    const next = () => { if (stop) return; if (i >= lines.length) return onEnd && onEnd(true); const [who, text] = lines[i]; onLine && onLine(i / lines.length);
      const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; const v = this.voice(); if (v) u.voice = v; u.rate = rate; u.pitch = who === 'f' ? 1.3 : who === 'm' ? .75 : 1;
      u.onend = () => { i++; setTimeout(next, 450); }; u.onerror = () => { i++; next(); }; speechSynthesis.speak(u); };
    next(); return () => { stop = true; speechSynthesis.cancel(); onEnd && onEnd(false); };
  },
};
