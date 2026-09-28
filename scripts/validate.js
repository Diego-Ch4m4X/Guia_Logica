import fs from 'node:fs/promises';
import path from 'node:path';
import { distDir } from './lib/paths.js';

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
function idsFrom(html) { return [...html.matchAll(/\sid=["']([^"']+)["']/g)].map(m => m[1]); }
function duplicateIds(html) { const ids = idsFrom(html); return ids.length - new Set(ids).size; }
function refsFrom(html) { return [...html.matchAll(/\s(?:href|src)=["']([^"']+)["']/g)].map(m => m[1]); }
function duplicateHtmlAttributes(html) {
  const duplicates = [];
  for (const match of html.matchAll(/<[A-Za-z][^>]*>/g)) {
    const seen = new Set();
    for (const attr of match[0].matchAll(/\s([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=/g)) {
      const name = attr[1].toLowerCase();
      if (seen.has(name)) duplicates.push({ name, tag:match[0].slice(0, 180) });
      seen.add(name);
    }
  }
  return duplicates;
}

function htmlHeadingJumps(html) {
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map(match => Number(match[1]));
  const jumps = [];
  for (let i = 1; i < headings.length; i += 1) {
    if (headings[i] > headings[i - 1] + 1) jumps.push(`h${headings[i - 1]}->h${headings[i]}`);
  }
  return jumps;
}


async function targetFor(fromFile, raw) {
  if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(raw)) return null;
  const hashAt = raw.indexOf('#');
  const queryAt = raw.indexOf('?');
  const cut = Math.min(...[hashAt, queryAt].filter(x => x >= 0), raw.length);
  const pathname = raw.slice(0, cut);
  const fragment = hashAt >= 0 ? decodeURIComponent(raw.slice(hashAt + 1)) : '';
  let file = fromFile;
  if (pathname) {
    file = path.resolve(path.dirname(fromFile), pathname);
    try { if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html'); } catch {}
  }
  return { file, fragment, raw };
}

async function brokenLocalRefs(rel, html) {
  const from = path.join(distDir, rel);
  const broken = [];
  for (const raw of refsFrom(html)) {
    const target = await targetFor(from, raw);
    if (!target) continue;
    if (!await exists(target.file)) { broken.push(`${rel}: missing ${raw}`); continue; }
    if (target.fragment && target.file.endsWith('.html')) {
      const targetHtml = target.file === from ? html : await fs.readFile(target.file, 'utf8');
      if (!new Set(idsFrom(targetHtml)).has(target.fragment)) broken.push(`${rel}: broken fragment ${raw}`);
    }
  }
  return broken;
}

async function main() {
  const expected = ['index.html','sitemap.xml','data/topics.json','data/search-index.json','data/package.json'];
  for (let n=1; n<=35; n += 1) expected.push(`topicos/t${String(n).padStart(2,'0')}/index.html`);
  const missing = [];
  for (const rel of expected) if (!await exists(path.join(distDir, rel))) missing.push(rel);
  if (missing.length) throw new Error(`missing generated files: ${missing.join(', ')}`);

  const topics = JSON.parse(await fs.readFile(path.join(distDir,'data/topics.json'),'utf8'));
  const search = JSON.parse(await fs.readFile(path.join(distDir,'data/search-index.json'),'utf8'));
  const pkg = JSON.parse(await fs.readFile(path.join(distDir,'data/package.json'),'utf8'));
  const errors = [];
  if (topics.length !== 35) errors.push(`topics.json=${topics.length}`);
  if (topics.filter(x => x.url).length !== 35) errors.push(`published topics=${topics.filter(x => x.url).length}`);
  for (let n=1; n<=35; n += 1) {
    const expectedUrl = `topicos/t${String(n).padStart(2,'0')}/`;
    if (topics.find(x => x.number === n)?.url !== expectedUrl) errors.push(`T${String(n).padStart(2,'0')} url mismatch`);
  }
  if (!Array.isArray(search) || !search.length) errors.push('search index empty');
  if (pkg.version !== '1.2.0') errors.push('data/package.json version mismatch');
  const expectedVersion = '1.2.0';
  const versionRef = /\?v=([0-9A-Za-z.-]+)/g;
  const versionMismatches = [];
  for (const rel of ['index.html', ...Array.from({length:35}, (_,i) => `topicos/t${String(i+1).padStart(2,'0')}/index.html`)]) {
    const html = await fs.readFile(path.join(distDir, rel), 'utf8');
    for (const match of html.matchAll(versionRef)) if (match[1] !== expectedVersion) versionMismatches.push(`${rel}:${match[1]}`);
  }
  for (const name of await fs.readdir(path.join(distDir, 'assets/js'))) {
    if (!name.endsWith('.js')) continue;
    const js = await fs.readFile(path.join(distDir, 'assets/js', name), 'utf8');
    for (const match of js.matchAll(versionRef)) if (match[1] !== expectedVersion) versionMismatches.push(`assets/js/${name}:${match[1]}`);
  }
  if (versionMismatches.length) errors.push(`cache-buster mismatch: ${versionMismatches.slice(0,10).join(', ')}`);
  const home = await fs.readFile(path.join(distDir,'index.html'),'utf8');
  if ((home.match(/class=\"home-topic-card\"/g) || []).length !== 35) errors.push('home topic cards != 35');

  const pages = [{ rel:'index.html', html:home }];
  for (let n=1; n<=35; n += 1) {
    const id = `T${String(n).padStart(2,'0')}`;
    const rel = `topicos/${id.toLowerCase()}/index.html`;
    const html = await fs.readFile(path.join(distDir,rel),'utf8');
    pages.push({ rel, html });
    if (!html.includes('id="conteudo-principal"')) errors.push(`${id}: main missing`);
    if (!html.includes(`${id} · `)) errors.push(`${id}: article metadata missing`);
    if (!html.includes('class="chapter-title"')) errors.push(`${id}: no chapter-title`);
    if (html.includes('{{')) errors.push(`${id}: unresolved template token`);
  }

  for (const {rel, html} of pages) {
    const dup = duplicateIds(html);
    if (dup) errors.push(`${rel}: duplicate ids=${dup}`);

    if (rel !== 'index.html') {
      const duplicateAttributes = duplicateHtmlAttributes(html);
      if (duplicateAttributes.length) {
        errors.push(`${rel}: duplicate HTML attributes=${duplicateAttributes.length}`);
      }
      const headingJumps = htmlHeadingJumps(html);
      if (headingJumps.length) {
        errors.push(`${rel}: heading hierarchy jumps=${headingJumps.length} (${headingJumps.slice(0, 8).join(', ')})`);
      }
    }

    errors.push(...await brokenLocalRefs(rel, html));
  }

  const htmlCache = new Map();
  const idCache = new Map();
  for (const { rel, html } of pages) {
    const abs = path.resolve(distDir, rel);
    htmlCache.set(abs, html);
    idCache.set(abs, new Set(idsFrom(html)));
  }

  for (const item of search) {
    const target = await targetFor(path.join(distDir,'index.html'), item.url || '');
    if (!target) { errors.push(`search target invalid: ${item.url}`); continue; }
    const abs = path.resolve(target.file);
    if (!htmlCache.has(abs)) {
      if (!await exists(abs)) { errors.push(`search target missing: ${item.url}`); continue; }
      if (abs.endsWith('.html')) {
        const targetHtml = await fs.readFile(abs,'utf8');
        htmlCache.set(abs, targetHtml);
        idCache.set(abs, new Set(idsFrom(targetHtml)));
      }
    }
    if (target.fragment && abs.endsWith('.html') && !idCache.get(abs)?.has(target.fragment)) {
      errors.push(`search fragment missing: ${item.url}`);
    }
  }

  if (errors.length) {
    console.error('VALIDATE: FAIL');
    for (const e of errors) console.error(`- ${e}`);
    process.exitCode = 1;
    return;
  }
  console.log('VALIDATE: PASS');
  console.log('topics: 35/35');
  console.log('generated topic pages: 35/35');
  console.log('broken local links/fragments: 0');
  console.log('duplicate ids: 0');
  console.log('duplicate HTML attributes: 0');
  console.log('heading hierarchy jumps: 0');
  console.log(`search-index targets: ${search.length}/${search.length}`);
  console.log('generated pages: Home + T01–T35 staging');
}

main().catch(error => { console.error(`VALIDATE: FAIL\n${error.stack || error}`); process.exitCode = 1; });
