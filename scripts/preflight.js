import fs from 'node:fs/promises';
import path from 'node:path';
import { contentDir } from './lib/paths.js';
import { parseDocument, topicIdFromFilename } from './lib/metadata.js';

const REQUIRED = ['title','slug','description','category','status','version','contract','taxonomy','languages','difficulty','tags','created','last_reviewed'];
const ALLOWED_HTML = new Set(['a','details','summary','strong']);

function findRawTagsOutsideFences(body) {
  const tags = [];
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  let inFence = false;
  let fenceChar = '';
  let fenceLen = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const fm = lines[i].match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fm) {
      if (!inFence) { inFence = true; fenceChar = fm[1][0]; fenceLen = fm[1].length; }
      else if (fm[1][0] === fenceChar && fm[1].length >= fenceLen) inFence = false;
      continue;
    }
    if (inFence) continue;
    const visible = lines[i].replace(/`+[^`]*`+/g, '');
    for (const m of visible.matchAll(/<\/?([A-Za-z][A-Za-z0-9-]*)(?:\s+[^>]*)?>/g)) {
      if (!ALLOWED_HTML.has(m[1].toLowerCase())) tags.push({ line: i + 1, tag: m[1], raw: m[0] });
    }
  }
  return tags;
}

async function main() {
  const names = (await fs.readdir(contentDir)).filter(n => n.endsWith('.md')).sort();
  const ids = [];
  const slugs = [];
  const errors = [];
  let unsupported = 0;
  let nfcErrors = 0;

  for (const name of names) {
    const source = await fs.readFile(path.join(contentDir, name), 'utf8');
    const { metadata, body } = parseDocument(source);
    const file = topicIdFromFilename(name);
    ids.push(file.id);
    slugs.push(metadata.slug);

    for (const key of REQUIRED) if (!(key in metadata)) errors.push(`${name}: missing metadata ${key}`);
    if (metadata.version !== file.version) errors.push(`${name}: filename/frontmatter version mismatch`);
    if (source.normalize('NFC') !== source) { nfcErrors += 1; errors.push(`${name}: not NFC`); }
    const raw = findRawTagsOutsideFences(body);
    unsupported += raw.length;
    for (const item of raw) errors.push(`${name}:${item.line}: unsupported raw HTML ${item.raw}`);
  }

  const expected = Array.from({ length: 35 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`);
  if (names.length !== 35) errors.push(`topics: expected 35, got ${names.length}`);
  if (JSON.stringify([...ids].sort()) !== JSON.stringify(expected)) errors.push('topic ids are not exactly T01-T35');
  if (new Set(ids).size !== ids.length) errors.push('duplicate topic ids');
  if (new Set(slugs).size !== slugs.length) errors.push('duplicate slugs');

  if (errors.length) {
    console.error('PREFLIGHT: FAIL');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log('PREFLIGHT: PASS');
  console.log(`topics: ${names.length}/35`);
  console.log('duplicate topic ids: 0');
  console.log('metadata errors: 0');
  console.log(`unsupported constructs: ${unsupported}`);
  console.log(`unicode normalization errors: ${nfcErrors}`);
}

main().catch(error => { console.error(`PREFLIGHT: FAIL\n${error.stack || error}`); process.exitCode = 1; });
