# Audit and implementation record
Existing architecture: vanilla ES modules (main/router, views, UI helpers, data loader, localStorage store); static production build and precaching service worker; Capacitor 6 Android wrapper. Existing progress key kaizen.v1 is retained.
Initial findings: no native back override; detail screens render without history entries; only fixed Paper 1; N4 kanji missing; data command refers to nonexistent scripts; grammar syllabus incomplete.
Plan: import Desktop presentations with source provenance; reuse canonical IDs; add shared seeded exam sampling, independent section ranges/counts, resumable exam; add tracking swipes and Hard revision; native back bridge; run unit/browser regressions and Android build.
Vocabulary attachment is byte-identical to sources/n4_vocabs.pdf (50 scanned pages). Existing kana dataset retained to preserve stable progress IDs. Text extraction yields no usable text; full manual/OCR verification of all 1,133 entries is not claimed.

## Implemented
- Desktop importer: 40 kanji decks -> 200 unique N4 kanji, source day/order/readings/meaning/usage notes; 25 grammar decks -> 140 source patterns with source filename and slide. Repeated import uses stable IDs. N5 dataset verified at 120.
- Existing PDF-derived 1,133 kana vocabulary entries and lesson ranges retained. Kanji-free vocabulary fields checked automatically.
- New custom exam configuration: independent ranges and counts, All/zero support, N5 inclusion, available counts, validation, summary, seeded reusable Hard sampler and canonical deduplication. Source grammar cloze questions where a pattern can be matched; otherwise source-form recognition. Source supplies no importance rank, so grammar priority is explicitly equal.
- Answers and active custom exam saved separately without changing kaizen.v1. Resume after reload, previous/next, submission confirmation, section scores, answer explanations, incorrect retry and Hard revision.
- Tracking toggle, right/left pointer swipes, persistent Known/Learning/Hard statuses and counts. Hard revision supports content and lesson/day filtering; reclassification removes items from the active Hard deck.
- N4/N5 kanji switch, grammar flashcards, native Android back callback, home exit confirmation, keyboard Alt+Left. Custom exam answers survive navigation to configuration. Native back previously had no app override.
- Corrected npm data command. Existing fixed sample exam preserved alongside the custom exam.

## Verification
Executed: build; scripts/engine-test.mjs; scripts/enhancement-test.mjs in mobile Chrome; original scripts/e2e.mjs; original scripts/daily-test.mjs. All reported checks passed with zero recorded browser page errors. Android debug build passed with local JDK 17.
New browser coverage: 2 vocabulary / 3 grammar / 4 kanji counts, N5 inclusion, unique generation, submit/results, right-swipe Known, Hard revision/reclassification, invalid count validation.
Original regression covers all 11 routes, study modes, fixed exam, saved progress, offline use, themes and mobile overflow.
Mobile custom-exam screenshot inspected. Physical Android system gestures and audible Japanese speech are not verified; no connected device/emulator exists.

## Remaining limitations
- Chokai audio, questionnaire and pictures from all five supplied videos are deferred per user's delivery priority. No video downloads were made.
- Vocabulary PDF is scanned; byte identity verified, but every entry has not been visually checked against all 50 pages.
- Grammar importer preserves source examples and usage notes, which may contain errors in the supplied slides. Source-based form recognition is used when a safe cloze match is unavailable.
- Source-only N4 kanji compound example reading pairs are not fabricated; reading quizzes fall back to the supplied individual-kanji readings. Usage examples are retained in notes.
- Old grammar progress remains stored under its original IDs; it is not automatically reassigned to new source IDs because the former lesson mapping differs.
- Native back returns to the section parent for existing in-place study screens. Complete restoration of every prior flashcard/detail state across browser history is not implemented.
- Legacy sentence-building drills retain their existing dataset; they are not mapped to unverified source lessons.
- Legacy fixed-exam incorrect answers retain the original automatic Difficult behavior; the new custom exams keep manual statuses separate.

## Run
npm run build
python3 -m http.server 8080 --bind 127.0.0.1 --directory dist
node scripts/engine-test.mjs
node scripts/enhancement-test.mjs
node scripts/e2e.mjs http://127.0.0.1:8080/
node scripts/daily-test.mjs http://127.0.0.1:8080/
JAVA_HOME=/Users/karthikchowdary/jlpt-toolchain/jdk/jdk-17.0.20.1+1/Contents/Home npm run android:debug

Final checks: scripts/navigation-test.mjs passed custom-exam refresh/resume, previous-question back, configuration back with answers retained, and Settings back to Home. Final enhancement browser test and daily suite passed. Final Android build passed. APK signature verified with Android SDK apksigner. N4 study range now selects source kanji numbers as well as the custom exam's numbered range.
Deliverable: release/Kaizen-N4-Enhanced.apk (debug-signed build).
