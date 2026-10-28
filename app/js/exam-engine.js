export function random(seed=Date.now()) { let s=seed>>>0; return () => { s=(Math.imul(s,1664525)+1013904223)>>>0; return s/4294967296; }; }
export function mix(items,rng=Math.random) { const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
export function eligible(items,from,to,field='lesson') { return items.filter(x=>x[field]>=Math.min(from,to)&&x[field]<=Math.max(from,to)); }
export function sample(items,count,{key=x=>x.id,hard=()=>false,seed=Date.now()}={}) {
 const pool=[...new Map(items.map(x=>[key(x),x])).values()], n=count==='all'?pool.length:Number(count);
 if(!Number.isInteger(n)||n<0||n>pool.length) throw Error('Request 0–'+pool.length+' questions, or select All.');
 const rng=random(seed), h=mix(pool.filter(hard),rng), normal=mix(pool.filter(x=>!hard(x)),rng);
 const chosen=h.slice(0,Math.min(Math.ceil(n/2),h.length));
 const reserved=chosen.length;
 chosen.push(...normal.slice(0,n-chosen.length));
 if(chosen.length<n) chosen.push(...h.slice(reserved,reserved+n-chosen.length));
 return {items:mix(chosen,rng),available:pool.length,hard:chosen.filter(hard).length};
}
