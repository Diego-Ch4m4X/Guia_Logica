import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectVersion } from '../../scripts/lib/config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => readFile(path.join(root, relative), 'utf8');

async function filesUnder(relative) {
  const result = [];
  for (const entry of await readdir(path.join(root, relative), { withFileTypes:true })) {
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(name));
    else result.push(name);
  }
  return result;
}

test('package version is the only operational release literal', async () => {
  const version = JSON.parse(await read('package.json')).version;
  assert.equal(projectVersion(), version);
  const operational = [
    'scripts/build.js', 'scripts/validate.js', 'tests/contracts/build.test.js',
    '.github/workflows/pages.yml',
    ...(await filesUnder('src/assets/js')).filter(name => name.endsWith('.js')),
  ];
  for (const file of operational) {
    assert.ok(!(await read(file)).includes(version), `${file} duplicates the package version`);
  }
});

test('project JavaScript sources use version tokens and published JavaScript resolves them', async () => {
  const version = projectVersion();
  let tokenized = 0;
  for (const file of (await filesUnder('src/assets/js')).filter(name => name.endsWith('.js'))) {
    const source = await read(file);
    const published = await read(file.replace(/^src[\\/]assets/, 'dist/assets'));
    tokenized += (source.match(/__ASSET_VERSION__/g) || []).length;
    assert.ok(!source.includes(`?v=${version}`), file);
    assert.ok(!published.includes('__ASSET_VERSION__'), file);
    assert.equal(published, source.replaceAll('__ASSET_VERSION__', version), file);
    for (const match of published.matchAll(/\?v=([0-9A-Za-z.-]+)/g)) {
      assert.equal(match[1], version, file);
    }
  }
  assert.ok(tokenized > 0, 'at least one project import must be tokenized');
});

test('search dialog has one template source and appears once per published page', async () => {
  const base = await read('src/templates/base.html');
  assert.equal((base.match(/<dialog\b[^>]*id="searchDialog"/g) || []).length, 1);
  for (const template of ['home.html', 'topic.html']) {
    assert.ok(!(await read(`src/templates/${template}`)).includes('id="searchDialog"'));
  }
  for (const page of ['dist/index.html', ...Array.from({length:35}, (_,i) => `dist/topicos/t${String(i+1).padStart(2,'0')}/index.html`)]) {
    assert.equal(((await read(page)).match(/<dialog\b[^>]*id="searchDialog"/g) || []).length, 1, page);
  }
});

test('search empty state is defined once and reused by JavaScript', async () => {
  const source = await read('src/assets/js/search.js');
  const base = await read('src/templates/base.html');
  assert.match(source, /const emptyState=results\.innerHTML;/);
  assert.match(source, /results\.innerHTML=emptyState/);
  assert.ok(!source.includes('Digite para buscar nas'));
  assert.equal((base.match(/Digite para buscar nas/g) || []).length, 1);
  for (const dir of ['src', 'dist']) {
    for (const file of await filesUnder(dir)) {
      if (!/\.(?:html|js|json)$/.test(file)) continue;
      assert.ok(!(await read(file)).includes('neste piloto'), file);
    }
  }
});

test('shared brand, action and social fragments stay centralized', async () => {
  const partials = {
    'brand-mark.html':['{{LOGO_MASK_ID}}', '<mask'],
    'search-theme-actions.html':['id="openSearch"', 'id="themeToggle"'],
    'social-links.html':['Perfis externos', 'LinkedIn'],
  };
  for (const [name, expected] of Object.entries(partials)) {
    const source = await read(`src/templates/partials/${name}`);
    for (const fragment of expected) assert.ok(source.includes(fragment), name);
  }
  for (const name of ['home.html', 'topic.html']) {
    const template = await read(`src/templates/${name}`);
    for (const marker of ['{{BRAND_MARK_HEADER}}', '{{BRAND_MARK_FOOTER}}', '{{SEARCH_THEME_ACTIONS}}', '{{FOOTER_SOCIAL_LINKS}}']) {
      assert.ok(template.includes(marker), `${name}: ${marker}`);
    }
    for (const duplicated of ['<mask', 'id="openSearch"', 'Perfis externos']) {
      assert.ok(!template.includes(duplicated), `${name} duplicates ${duplicated}`);
    }
  }
});
