// Production build: copies app/ -> dist/, versions the service worker with a content hash and precaches every file.
import { cpSync, rmSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
const src = 'app', out = 'dist';
rmSync(out, { recursive: true, force: true });
cpSync(src, out, { recursive: true });
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(out).map(p => relative(out, p)).filter(f => f !== 'sw.js').sort();
const h = createHash('sha1');
for (const f of files) h.update(f).update(readFileSync(join(out, f)));
const version = 'k4-' + h.digest('hex').slice(0, 10);
const list = ['./', ...files.map(f => f)];
writeFileSync(join(out, 'sw.js'), readFileSync(join(src, 'sw.js'), 'utf8').replace('__VERSION__', version).replace('__FILES__', JSON.stringify(list)));
writeFileSync(join(out, '_redirects'), '/*    /index.html   200\n');
console.log(`built ${files.length} files → ${out}/ (cache ${version})`);
