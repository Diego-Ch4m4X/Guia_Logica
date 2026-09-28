import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectVersion } from '../../scripts/lib/config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => readFile(path.join(root, relative), 'utf8');

async function cacheVersionParser() {
  const source = await read('scripts/validate.js');
  const declaration = source.match(/const versionRef = \/(.+)\/g;/);
  assert.ok(declaration, 'validator must declare its cache query parser');
  return new RegExp(declaration[1], 'g');
}

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
  const versionRef = await cacheVersionParser();
  let tokenized = 0;
  for (const file of (await filesUnder('src/assets/js')).filter(name => name.endsWith('.js'))) {
    const source = await read(file);
    const published = await read(file.replace(/^src[\\/]assets/, 'dist/assets'));
    tokenized += (source.match(/__ASSET_VERSION__/g) || []).length;
    assert.ok(!source.includes(`?v=${version}`), file);
    assert.ok(!published.includes('__ASSET_VERSION__'), file);
    assert.equal(published, source.replaceAll('__ASSET_VERSION__', version), file);
    for (const match of published.matchAll(versionRef)) {
      assert.equal(match[1], version, file);
    }
  }
  assert.ok(tokenized > 0, 'at least one project import must be tokenized');
});

test('only projectVersion validates SemVer and consumers preserve build metadata', async () => {
  const config = await read('scripts/lib/config.js');
  const validate = await read('scripts/validate.js');
  const workflow = await read('.github/workflows/pages.yml');
  const grammar = config.match(/!\/(.+)\/\.test\(pkg\.version\)/);
  assert.ok(grammar, 'projectVersion must own the release grammar');
  const canonicalFormat = new RegExp(grammar[1]);
  const cacheRef = await cacheVersionParser();
  for (const version of ['1.2.3+build.5', '1.2.3-rc.1+build.5']) {
    assert.ok(canonicalFormat.test(version), `${version} must be accepted by projectVersion grammar`);
    const references = [...`app.js?v=${version}&next=1`.matchAll(cacheRef)].map(match => match[1]);
    assert.deepEqual(references, [version], `${version} must be captured and compared in full`);
    assert.equal(references[0], version);
  }
  assert.ok(validate.includes('const expectedVersion = projectVersion();'));
  assert.doesNotMatch(validate, /\\d\+\\\.\\d\+/);
  assert.match(workflow, /test -n "\$published_version"/);
  assert.doesNotMatch(workflow, /\$published_version"\s*=~/);
  assert.match(workflow, /grep -Fq "\?v=\$\{published_version\}"/);
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
