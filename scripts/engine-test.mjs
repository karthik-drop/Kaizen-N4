import assert from 'node:assert/strict';
import {sample,eligible} from '../app/js/exam-engine.js';
import {readFileSync} from 'node:fs';
const pool=Array.from({length:30},(_,id)=>({id,lesson:1+id%3}));
for(const n of [0,1,10,30]){const r=sample(pool,n,{hard:x=>x.id<15,seed:42});assert.equal(r.items.length,n);assert.equal(new Set(r.items.map(x=>x.id)).size,n);}
assert.equal(sample(pool,10,{hard:x=>x.id<15}).hard,5);
assert.equal(sample(pool,10,{hard:x=>x.id<2}).hard,2);
assert.equal(sample(pool,'all').items.length,30);assert.equal(sample(pool,30,{hard:x=>x.id<20}).items.length,30);assert.equal(sample(pool,30,{hard:()=>true}).items.length,30);
assert.throws(()=>sample(pool,-1));assert.throws(()=>sample(pool,31));
assert.deepEqual(sample(pool,10,{seed:123}),sample(pool,10,{seed:123}));
assert.equal(sample([...pool,...pool],30).items.length,30);
assert(eligible(pool,1,1).every(x=>x.lesson===1));
const get=n=>JSON.parse(readFileSync('app/data/'+n+'.json'));
assert.equal(get('n5/kanji').kanji.length,120);
const k=get('n4/kanji').kanji;assert.equal(k.length,200);assert.equal(new Set(k.map(x=>x.k)).size,200);assert(k.every((x,i)=>x.number===i+1&&x.on&&x.kun));
const g=get('n4/grammar').points;assert.equal(new Set(g.map(x=>x.lesson)).size,25);
assert(g.every(x=>x.source&&x.slide&&x.q.o.includes(x.q.o[x.q.a])));
assert(get('n4/vocab').words.every(x=>!/[一-鿿]/.test(x.kana+x.en)));
console.log('PASS: sampling boundaries, Hard reservation, insufficient pool, all, seeded randomness, deduplication, range filters and source data integrity.');
