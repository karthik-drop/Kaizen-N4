import {load,esc,shuffle} from './data.js';
import {store} from './store.js';
import {screen,$,nav,deck,toast} from './ui.js';
import {eligible,sample} from './exam-engine.js';
const SAVE='kaizen.custom.active', CONFIG='kaizen.custom.config';
const keys={v:x=>'v:'+x.id,g:x=>'g:'+x.id,k:x=>'k:'+x.id};
export async function custom() {
 const [v,g,n4,n5]=await Promise.all(['n4/vocab','n4/grammar','n4/kanji','n5/kanji'].map(load));
 const pools={v:v.words,g:g.points,k:n4.kanji};
 let cfg;try{cfg=JSON.parse(localStorage.getItem(CONFIG)||'null');}catch{}
 cfg=cfg||Object.fromEntries([...Object.entries(pools).map(([s,p])=>{const nums=p.map(x=>s==='k'?x.number:x.lesson);return [s,{from:Math.min(...nums),to:Math.max(...nums),count:String(Math.min(10,p.length))}];}),['n5',false]]);
 const fields=Object.entries(pools).map(([s,p])=>{
 const nums=[...new Set(p.map(x=>s==='k'?x.number:x.lesson))].sort((a,b)=>a-b), c=cfg[s];
 return '<div class="card"><h3>'+({v:'Vocabulary',g:'Grammar',k:'N4 Kanji'}[s])+'</h3><div class="grid2">'+['from','to'].map(f=>'<label>'+f+'<select id="'+s+f+'">'+nums.map(n=>'<option '+(n===c[f]?'selected':'')+'>'+n+'</option>').join('')+'</select></label>').join('')+'</div><label>Questions (0 to omit)<input id="'+s+'count" type="number" min="0" value="'+(c.count==='all'?'0':c.count)+'"></label><label><input id="'+s+'all" type="checkbox" '+(c.count==='all'?'checked':'')+'> All eligible</label><p id="'+s+'avail" class="sm mut"></p></div>';
 }).join('');
 screen({back:'#/exams',big:'Custom Mock Exam',body:fields+'<label class="card"><input type="checkbox" id="n5" '+(cfg.n5?'checked':'')+'> N5 Kanjis · 120 entries</label><p class="tip">Hard items reserve up to half of each section. Grammar has equal priority because the sources supply no importance ranking. Incorrect answers update accuracy, not your manual classification.</p><p id="err" role="alert"></p><button class="btn pri blk" id="preview">Review configuration</button><button class="btn blk" id="resume">Resume saved exam</button>'});
 const read=()=>{for(const s of ['v','g','k'])cfg[s]={from:+$('#'+s+'from').value,to:+$('#'+s+'to').value,count:$('#'+s+'all').checked?'all':$('#'+s+'count').value}; cfg.n5=$('#n5').checked;localStorage.setItem(CONFIG,JSON.stringify(cfg));return Object.fromEntries(Object.entries(pools).map(([s,p])=>[s,s==='k'?[...new Map([...eligible(p,cfg.k.from,cfg.k.to,'number'),...(cfg.n5?n5.kanji:[])].map(x=>[x.k,x])).values()]:eligible(p,cfg[s].from,cfg[s].to)]));};
 const update=()=>{const ps=read();for(const s in ps)$('#'+s+'avail').textContent=ps[s].length+' available · '+ps[s].filter(x=>store.item(keys[s](x)).st==='difficult').length+' Hard';};
 document.querySelectorAll('#app input,#app select').forEach(e=>e.onchange=update);update();
 $('#resume').disabled=!localStorage.getItem(SAVE);$('#resume').onclick=()=>{try{run(JSON.parse(localStorage.getItem(SAVE)));}catch{toast('Saved exam could not be read','bad');}};
 $('#preview').onclick=()=>{try{
 const ps=read(), chosen=Object.fromEntries(Object.entries(ps).map(([s,p])=>[s,sample(p,cfg[s].count,{hard:x=>store.item(keys[s](x)).st==='difficult'})]));
 const qs=[];
 for(const [s,selection] of Object.entries(chosen)) for(const x of selection.items) {
  let prompt,answer,options,explain;
  if(s==='v'){prompt=x.kana;answer=x.en;options=shuffle([answer,...shuffle([...new Set(ps.v.map(y=>y.en))].filter(y=>y!==answer)).slice(0,3)]);explain=x.kana+' — '+x.en;}
  if(s==='k'){prompt=x.k+' · '+x.level;answer=x.en;options=shuffle([answer,...shuffle([...new Set(ps.k.map(y=>y.en))].filter(y=>y!==answer)).slice(0,3)]);explain=x.en+' · On: '+x.on.join(' / ')+' · Kun: '+x.kun.join(' / ');}
  if(s==='g'){
   answer=x.form;
   const ex=x.ex.find(e=>e[0].includes(x.p.replace(/^～/,'')));
   const part=x.p.replace(/^～/,'');
   if(ex) answer=part;
   prompt=ex?ex[0].replace(part,'＿＿')+' ('+ex[1]+')':x.m+' — Choose the source sentence structure.';
   options=shuffle([answer,...shuffle([...new Set(ps.g.map(y=>ex?y.p.replace(/^～/,''):y.form))].filter(y=>y!==answer)).slice(0,3)]);explain=x.note+' '+x.form;
  }
  qs.push({key:keys[s](x),section:s,prompt,answer,options,explain,hard:store.item(keys[s](x)).st==='difficult'});
 }
 if(!qs.length)throw Error('Select at least one question.');
 const state={qs:shuffle(qs),answers:{},i:0,config:cfg};
 screen({back:'#/custom',big:'Exam summary',body:Object.entries(chosen).map(([s,c])=>'<div class="card">'+s.toUpperCase()+': '+c.items.length+' questions · '+c.hard+' Hard · range '+cfg[s].from+'–'+cfg[s].to+'</div>').join('')+'<p>N5: '+(cfg.n5?'included':'excluded')+' · Total '+qs.length+'</p><button id="begin" class="btn pri blk">Start exam</button><button class="btn blk" data-go="#/custom">Edit configuration</button>'});
 $('#begin').onclick=()=>run(state);
 }catch(e){$('#err').textContent=e.message;}};
}
function run(state) {
 const persist=()=>localStorage.setItem(SAVE,JSON.stringify(state));
 const draw=()=>{persist(); const q=state.qs[state.i];
 window._studyBack=()=>{if(state.i>0){state.i--;draw();}else nav('#/custom');};
 screen({back:'#/custom',big:'Question '+(state.i+1)+' of '+state.qs.length,sub:({v:'Vocabulary',g:'Grammar',k:'Kanji'}[q.section]),hideNav:true,body:'<div class="card jp">'+esc(q.prompt)+'</div>'+q.options.map((o,i)=>'<button class="opt '+(state.answers[state.i]===o?'sel':'')+'" data-answer="'+i+'">'+esc(o)+'</button>').join(''),dock:'<button class="btn" id="prev" '+(state.i?'':'disabled')+'>Previous</button><button class="btn pri" id="next">'+(state.i===state.qs.length-1?'Submit':'Next')+'</button>'});
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{state.answers[state.i]=q.options[+b.dataset.answer];draw();});
 $('#prev').onclick=()=>{state.i--;draw();};
 $('#next').onclick=()=>{if(state.i<state.qs.length-1){state.i++;draw();}else if(confirm('Submit this exam? Unanswered questions count as incorrect.'))finish(state);};
 };draw();
}
function finish(state) {
 window._studyBack=null;localStorage.removeItem(SAVE);
 const wrong=state.qs.filter((q,i)=>state.answers[i]!==q.answer), correct=state.qs.length-wrong.length;
 state.qs.forEach((q,i)=>store.grade(q.key,state.answers[i]===q.answer,'Custom '+q.section,false));
 store.addResult({mode:'Custom Mock Exam',score:correct,total:state.qs.length});
 screen({back:'#/custom',big:'Exam result',sub:correct+' / '+state.qs.length+' · '+Math.round(correct/state.qs.length*100)+'%',body:['v','g','k'].map(s=>{const a=state.qs.filter(q=>q.section===s);return '<p>'+({v:'Vocabulary',g:'Grammar',k:'Kanji'}[s])+': '+a.filter(q=>state.answers[state.qs.indexOf(q)]===q.answer).length+'/'+a.length+'</p>';}).join('')+'<button class="btn pri" id="retry" '+(wrong.length?'':'disabled')+'>Retry incorrect</button><button class="btn" data-go="#/hard">Revise Hard</button><button class="btn" data-go="#/custom">New exam</button>'+state.qs.map((q,i)=>'<div class="card"><b>'+esc(q.prompt)+'</b><p>'+ (state.answers[i]===q.answer?'Correct':'Incorrect')+(q.hard?' · Hard item':'')+'</p><p>Your answer: '+esc(state.answers[i]??'Unanswered')+'</p><p>Correct: '+esc(q.answer)+'</p><p>'+esc(q.explain)+'</p></div>').join('')});
 $('#retry').onclick=()=>run({qs:wrong,answers:{},i:0});
}
export async function hard() {
 const [v,g,k4,k5]=await Promise.all(['n4/vocab','n4/grammar','n4/kanji','n5/kanji'].map(load));
 const all=[...v.words.map(x=>({key:'v:'+x.id,front:x.kana,back:x.en,lesson:x.lesson,type:'Vocabulary'})),...g.points.map(x=>({key:'g:'+x.id,front:x.p,back:x.m+' · '+x.form,lesson:x.lesson,type:'Grammar'})),...[...k4.kanji,...k5.kanji].map(x=>({key:'k:'+x.id,front:x.k,back:x.en+' · '+x.on.join(' / ')+' · '+x.kun.join(' / '),lesson:x.lessonNo,type:x.level+' Kanji'}))].filter(x=>store.item(x.key).st==='difficult');
 screen({back:'#/learn',big:'Revise Hard',body:'<label>Content<select id="kind"><option>All</option>'+['Vocabulary','Grammar','N4 Kanji','N5 Kanji'].map(x=>'<option>'+x+'</option>').join('')+'</select></label><div class="grid2"><label>From lesson/day<input id="hf" type="number" min="1" value="1"></label><label>To lesson/day<input id="ht" type="number" min="1" value="50"></label></div><p id="hardcount"></p><button class="btn pri" id="hardstart">Start revision</button>'});
 const pick=()=>eligible(all.filter(x=>$('#kind').value==='All'||x.type===$('#kind').value),+$('#hf').value,+$('#ht').value);
 const update=()=>$('#hardcount').textContent=pick().length+' Hard items available';
 document.querySelectorAll('#app input,#app select').forEach(e=>e.onchange=update); update();
 $('#hardstart').onclick=()=>deck({title:'Revise Hard',back:'#/hard',items:pick(),key:x=>x.key,front:x=>esc(x.front),reveal:x=>esc(x.back),drop:s=>s!=='difficult'});
}
