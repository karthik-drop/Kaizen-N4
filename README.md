# Kaizen N4 — JLPT N4 preparation app
Offline-first PWA + Android app (Capacitor). Vanilla ES modules, no framework, no server needed.

## Structure
- `app/` source: `js/` (store, data loaders, ui widgets, views), `css/app.css` (theme tokens, light default + dark), `data/<level>/*.json` (content), `data/levels.json` (level registry: N3/N2 slots reserved).
- `content/` authoring sources (vocab text, grammar, reading, listening, Paper 1) → `python3 scripts/build_data.py` regenerates `app/data`.
- `scripts/build.mjs` production build to `dist/` (versioned service worker, precache). `scripts/e2e.mjs` real-Chrome end-to-end test.

## Commands
```bash
npm install
python3 scripts/build_data.py     # rebuild JSON content
node scripts/build.mjs            # -> dist/
node scripts/e2e.mjs http://localhost:8766/   # serve dist/ first
# Android (JDK 17 + Android SDK, ANDROID_HOME set):
npx cap sync android && cd android && ./gradlew assembleDebug   # -> app/build/outputs/apk/debug/app-debug.apk
```
## Adding content
- More vocab lessons: append `# n|Topic` blocks to `content/vocab_n4.txt` (kana only; build fails if kanji appear).
- More exam papers: add `paperN.py` (same shape as `paper1.py`) and register it in `scripts/build_data.py`.
- N3/N2: add `app/data/n3/*.json`, flip the level in `levels.json`; views read data per level folder.
