// Budget report for the built site (run by `npm run build`). Numbers are gzip KB.
// Ceilings come from docs/ARCHITECTURE.md section 8. Fonts: only the subsets a page needs are fetched, so the
// "all font files" figure is an upper bound; measure real transfer in the browser for the true first view.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = new URL('../dist/', import.meta.url).pathname;
if (!existsSync(dist)) { console.error('No dist/ folder. Run `npm run build` first.'); process.exit(1); }

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const gz = (p) => gzipSync(readFileSync(p)).length;
const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB';
const files = walk(dist);

const sum = (pred) => files.filter(pred).reduce((a, p) => a + gz(p), 0);
const ext = (p) => extname(p).toLowerCase();

const jsFiles = files.filter((p) => ext(p) === '.js');
const isEager = (p) => p.includes('Base.astro_astro_type_script');
const eager = jsFiles.filter(isEager).reduce((a, p) => a + gz(p), 0);
const lazy = jsFiles.filter((p) => !isEager(p)).reduce((a, p) => a + gz(p), 0);

console.log('\nBuild size report (gzip)');
console.log('------------------------');
for (const page of ['index.html', 'ar/index.html', 'lab/index.html', 'ar/lab/index.html']) {
  const p = join(dist, page);
  if (existsSync(p)) console.log(`HTML  ${page.padEnd(20)} ${kb(gz(p))}`);
}
console.log(`CSS   all                  ${kb(sum((p) => ext(p) === '.css'))}`);
console.log(`JS    first load           ${kb(eager)}   ceiling 55 KB (GSAP + ScrollTrigger + SplitText + Lenis)`);
console.log(`JS    lazy (world, stage, 3D) ${kb(lazy)}   loaded only where used; ceiling 40 KB`);
const model = join(dist, 'models/car.json');
if (existsSync(model)) console.log(`3D model (car.json)       ${kb(gz(model))}   fetched only when the stage is near; ceiling 80 KB`);
for (const p of jsFiles.sort((a, b) => gz(b) - gz(a)).slice(0, 6)) console.log(`        ${p.replace(dist, '').padEnd(62)} ${kb(gz(p))}`);
const fonts = files.filter((p) => ['.woff2', '.woff'].includes(ext(p)));
console.log(`Fonts all files (${fonts.length})      ${kb(fonts.reduce((a, p) => a + statSync(p).size, 0))}   upper bound; ceiling 250 KB per language set`);
console.log(`Images                    ${kb(files.filter((p) => ['.jpg', '.png', '.webp', '.avif', '.svg'].includes(ext(p))).reduce((a, p) => a + statSync(p).size, 0))}`);
console.log('');
