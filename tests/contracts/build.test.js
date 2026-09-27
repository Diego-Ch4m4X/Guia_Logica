import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function readJson(rel) {
  return JSON.parse(await readFile(path.join(ROOT, rel), 'utf8'));
}

async function sha256(rel) {
  const data = await readFile(path.join(ROOT, rel));
  return createHash('sha256').update(data).digest('hex');
}

test('release metadata is synchronized', async () => {
  const pkg = await readJson('package.json');
  const lock = await readJson('package-lock.json');
  const distPkg = await readJson('dist/data/package.json');
  const nodeVersion = (await readFile(path.join(ROOT, '.node-version'), 'utf8')).trim();

  assert.equal(pkg.version, '1.1.2');
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
  assert.equal(distPkg.version, pkg.version);
  assert.equal(nodeVersion, '24.21.0');
  assert.match(pkg.engines.node, /^>=24 <25$/);
});

test('all 35 topic routes exist and are published', async () => {
  const topics = await readJson('dist/data/topics.json');
  assert.equal(topics.length, 35);

  const homeHtml = await readFile(path.join(ROOT, 'dist/index.html'), 'utf8');
  assert.ok(
    homeHtml.includes('<a class="footer-link" href="https://github.com/Diego-Ch4m4X/Guia_Logica">README</a>'),
    'Home README footer link must target the Guia_Logica repository',
  );
  assert.ok(
    homeHtml.includes('<a class="footer-social-link" href="https://diego-ch4m4x.github.io/">'),
    'Home GitHub footer link must target the GitHub Pages profile',
  );

  for (let n = 1; n <= 35; n += 1) {
    const expectedUrl = `topicos/t${String(n).padStart(2, '0')}/`;
    const topic = topics.find((item) => item.number === n);
    assert.ok(topic, `missing topic T${String(n).padStart(2, '0')}`);
    assert.equal(topic.url, expectedUrl);
    const page = path.join(ROOT, 'dist', expectedUrl, 'index.html');
    const info = await stat(page);
    assert.ok(info.isFile(), `${expectedUrl}index.html must be a regular file`);
    const topicHtml = await readFile(page, 'utf8');
    assert.ok(
      topicHtml.includes('<a class="footer-social-link" href="https://diego-ch4m4x.github.io/">'),
      `${expectedUrl} GitHub footer link must target the GitHub Pages profile`,
    );
  }
});

test('golden fixtures remain byte-for-byte frozen', async () => {
  const baselines = await readJson('tests/contracts/baselines.json');
  for (const fixture of Object.values(baselines.fixtures)) {
    assert.equal(await sha256(fixture.path), fixture.sha256, fixture.path);
  }
});

test('derived search index is non-empty and only targets published site paths', async () => {
  const search = await readJson('dist/data/search-index.json');
  assert.equal(search.length, 11551);
  for (const entry of search) {
    assert.equal(typeof entry.url, 'string');
    assert.ok(entry.url.startsWith('index.html') || entry.url.startsWith('topicos/t'), `unexpected search target: ${entry.url}`);
  }
});
