import sys, json, re, os
sys.path.insert(0, 'content')
from grammar_n4 import G, O
from reading_n4 import R
from listening_n4 import L
import paper1 as P
K = re.compile(r'[一-鿿]')
out = 'app/data'
def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(obj, open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
# ---- vocab (from the user's N4 Vocabs PDF; kana only, validated)
vocab, lessons, lesson, seen = [], [], 0, {}
IADJ = re.compile(r'(い)$')
def category(k, en, raw):
    if '［な］' in raw: return 'na-adjective'
    if re.search(r'(ます|ません)(［.*］)?$', k) or re.search(r'ます$', re.sub(r'［.*?］', '', raw)): return 'verb'
    if re.fullmatch(r'[ァ-ヶー・]+', k.replace('〜', '')): return 'loanword'
    if re.search(r'[。？]$', k) or k.startswith('〜') and ' ' in k: return 'phrase'
    return 'noun/other'
IADJ_SET = set('うれしい かなしい さびしい こわい うるさい おかしい かわいい ひどい きびしい はずかしい うつくしい すばらしい いい ちかい ふとい ほそい あつい うすい こい うまい まずい つまらない きたない ただしい めずらしい くわしい あぶない やさしい えらい ねむい かたい やわらかい わかい ながい みじかい あかるい くらい ほしい まるい にがい いや'.split())
for line in open('content/vocab_src.txt', encoding='utf-8'):
    line = line.strip()
    if line.startswith('#'):
        lesson = int(line[1:]); lessons.append({'n': lesson, 'name': f'Lesson {lesson}'}); continue
    if not line: continue
    raw, en = line.split('|')
    k = raw.strip().replace('［な］', '')
    assert not K.search(k) and not K.search(en), line
    cat = category(k, en, raw)
    if cat == 'noun/other' and k in IADJ_SET: cat = 'i-adjective'
    key = (k, en, lesson)
    if key in seen: continue
    seen[key] = 1
    vocab.append({'id': len(vocab) + 1, 'kana': k, 'en': en, 'cat': cat, 'lesson': lesson})
dump(f'{out}/n4/vocab.json', {'lessons': lessons, 'words': vocab})
# ---- grammar
pts = [{'id': g[0], 'lesson': g[1], 'p': g[2], 'm': g[3], 'form': g[4], 'note': g[5], 'ex': g[6], 'q': {'s': g[7][0], 'o': g[7][1], 'a': g[7][2], 'e': g[7][3]}} for g in G]
order = [{'id': i + 1, 's': o[0], 'parts': o[1], 'e': o[2]} for i, o in enumerate(O)]
dump(f'{out}/n4/grammar.json', {'points': pts, 'ordering': order})
dump(f'{out}/n4/dokkai.json', R)
dump(f'{out}/n4/chokai.json', L)
# ---- paper 1
def mc(items, sub, mondai, instr):
    return {'mondai': mondai, 'instr': instr, 'sub': sub, 'qs': [{'q': q[0], 'o': q[1], 'a': q[2], 'e': q[3]} for q in items]}
def ordering(items):
    qs = []
    for s, parts, ans in items:
        qs.append({'q': s, 'order': True, 'o': parts, 'a': 2, 'e': f'Correct order: {ans}. The star is the 3rd block ({parts[2]}).'})
    return {'mondai': 2, 'instr': 'Put the four blocks in the right order. Choose the one that goes in the ★ (third) space.', 'sub': 'grammar', 'qs': qs}
g3 = P.G3
read_parts = []
for d in R:
    read_parts.append({'mondai': d['m'], 'instr': {4: 'Read the short passage and answer.', 5: 'Read the passage and answer.', 6: 'Read the information and answer.'}[d['m']], 'sub': 'reading', 'passage': d['text'],
                       'qs': [{'q': q['q'], 'o': q['o'], 'a': q['a'], 'e': q['e'], 'rich': True} for q in d['qs']]})
listen_parts = []
for c in L:
    listen_parts.append({'mondai': c['m'], 'instr': {1: 'Listen, then choose the best answer.', 2: 'Listen to the point being asked, then choose.', 3: 'Listen to the situation, then choose what to say.', 4: 'Listen to the sentence and choose the best response.'}[c['m']], 'sub': 'listening', 'audio': c['lines'], 'spoken_q': c['q'],
                        'qs': [{'q': c['q'] or 'Choose the best response.', 'o': c['o'], 'a': c['a'], 'e': c['e']}]})
paper = {'id': 1, 'title': 'Paper 1', 'status': 'ready', 'sample': True, 'sections': [
    {'id': 's1', 'name': 'Language Knowledge: Vocabulary', 'minutes': 15, 'parts': [mc(P.V1, 'vocab', 1, 'Choose the correct reading of the underlined word.'), mc(P.V2, 'vocab', 2, 'Choose the correct way to write the underlined word.'), mc(P.V3, 'vocab', 3, 'Choose the best word for the blank.'), mc(P.V4, 'vocab', 4, 'Choose the sentence closest in meaning.'), mc(P.V5, 'vocab', 5, 'Choose the sentence that uses the word correctly.')]},
    {'id': 's2', 'name': 'Language Knowledge: Grammar and Reading', 'minutes': 30, 'parts': [mc(P.G1, 'grammar', 1, 'Choose the best answer for the blank.'), ordering(P.G2),
        {'mondai': 3, 'instr': 'Read the passage and choose the best word for each (1)–(3).', 'sub': 'grammar', 'passage': g3['text'], 'qs': [{'q': f'({i+1})', 'o': q[0], 'a': q[1], 'e': q[2]} for i, q in enumerate(g3['qs'])]}] + read_parts},
    {'id': 's3', 'name': 'Listening', 'minutes': 12, 'parts': listen_parts}]}
papers = {'level': 'N4', 'scoring': {'sectionMax': 60, 'total': 180, 'passTotal': 90, 'passSection': 19},
          'papers': [paper] + [{'id': i, 'title': f'Paper {i}', 'status': 'planned'} for i in range(2, 11)]}
nq = sum(len(p['qs']) for s in paper['sections'] for p in s['parts'])
dump(f'{out}/n4/papers.json', papers)
# ---- N5 kanji (from the earlier N5 app)
k = json.load(open('../jlpt-app/app/data/kanji.json', encoding='utf-8'))
def ln(l):
    m = re.match(r'Day (\d+)', l); return int(m.group(1)) if m else {'Final': 19, 'Remaining 23': 20}[l]
for e in k: e['level'] = 'N5'; e['lessonNo'] = ln(e['lesson']); e['id'] = 'n5-%d' % e['id']
dump(f'{out}/n5/kanji.json', {'level': 'N5', 'lessons': sorted({e['lessonNo'] for e in k}), 'kanji': k})
dump(f'{out}/levels.json', {'levels': [{'id': 'N5', 'status': 'partial', 'has': ['kanji']}, {'id': 'N4', 'status': 'active', 'has': ['vocab', 'grammar', 'dokkai', 'chokai', 'exams', 'kanji']}, {'id': 'N3', 'status': 'soon'}, {'id': 'N2', 'status': 'soon'}]})
print('vocab', len(vocab), 'grammar', len(pts), 'ordering', len(order), 'paper1 questions', nq, 'kanji', len(k))
