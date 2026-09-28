import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectVersion } from '../../scripts/lib/config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = relative => readFile(path.join(root, relative), 'utf8');
const names = relative => readdir(path.join(root, relative));

test('font inventory contains only the five supported faces and CSS resolves each file', async () => {
  const expected = [
    'ibm-plex-sans-400.ttf', 'ibm-plex-sans-600.ttf', 'ibm-plex-sans-700.ttf',
    'jetbrains-mono-400.ttf', 'jetbrains-mono-600.ttf',
  ];
  assert.deepEqual((await names('src/assets/fonts')).sort(), expected.sort());
  assert.deepEqual((await names('dist/assets/fonts')).sort(), expected);
  const css = await read('src/assets/css/fonts.css');
  const faces = [...css.matchAll(/@font-face\{([^}]*)\}/g)].map(match => match[1]);
  assert.equal(faces.length, 5);
  const referenced = [];
  for (const face of faces) {
    const file = face.match(/url\("\.\.\/fonts\/([^"?]+)\.ttf\?v=__ASSET_VERSION__"\)/)?.[1];
    assert.ok(file, `unversioned or malformed font face: ${face}`);
    referenced.push(`${file}.ttf`);
  }
  assert.deepEqual(referenced.sort(), expected);
  assert.ok(!css.includes('font-weight:500'));
});

test('official font notices and current vendor notices are present, orphan notices absent', async () => {
  const expected = [
    'IBM-Plex-OFL-1.1.txt', 'JetBrains-Mono-OFL-1.1.txt',
    'highlight.js-BSD-3-Clause.txt', 'mermaid-MIT.txt',
  ];
  for (const directory of ['src/assets/vendor/licenses', 'dist/assets/vendor/licenses']) {
    assert.deepEqual((await names(directory)).sort(), expected.sort());
  }
  for (const name of expected.slice(0, 2)) {
    const notice = await read(`src/assets/vendor/licenses/${name}`);
    assert.match(notice, /SIL OPEN FONT LICENSE Version 1\.1/);
    assert.match(notice, /Copyright/);
    assert.match(notice, /Reserved Font Name/);
  }
});

test('local vendor versions and Mermaid CDN are pinned without floating versions', async () => {
  assert.deepEqual((await names('src/assets/vendor')).filter(name => name.endsWith('.js')).sort(), [
    'highlight-11.12.0.min.js', 'mermaid-11.17.2.min.js',
  ]);
  const highlight = await read('src/assets/js/highlight-loader.js');
  const mermaid = await read('src/assets/js/mermaid-loader.js');
  assert.match(highlight, /highlight-11\.12\.0\.min\.js\?v=__ASSET_VERSION__/);
  assert.match(mermaid, /https:\/\/cdn\.jsdelivr\.net\/npm\/mermaid@11\.17\.2\/dist\/mermaid\.min\.js/);
  assert.match(mermaid, /mermaid-11\.17\.2\.min\.js\?v=__ASSET_VERSION__/);
  assert.doesNotMatch(mermaid, /mermaid@(?:latest|11\/|11\.17\/)/);
  assert.match(mermaid, /script\.integrity='sha384-[A-Za-z0-9+/=]+'/);
  assert.match(mermaid, /script\.crossOrigin='anonymous'/);
  assert.match(mermaid, /setTimeout\([^,]+,5000\)/);
  assert.match(mermaid, /\.catch\(\(\)=>loadMermaidScript\(local\)\)/);
  assert.match(mermaid, /if\(mermaidPromise\)return mermaidPromise/);
});

test('published CSS, Home SVGs and JS loaders use the package version with no unresolved token', async () => {
  const version = projectVersion();
  for (const directory of ['dist/assets/js', 'dist/assets/css']) {
    for (const name of await names(directory)) {
      if (!/\.(?:js|css)$/.test(name)) continue;
      assert.ok(!(await read(`${directory}/${name}`)).includes('__ASSET_VERSION__'), name);
    }
  }
  const fonts = await read('dist/assets/css/fonts.css');
  assert.equal((fonts.match(new RegExp(`\\?v=${version.replaceAll('.', '\\.')}`, 'g')) || []).length, 5);
  const homeCss = await read('dist/assets/css/home.css');
  assert.ok(homeCss.includes(`../img/project-cover-hero.webp?v=${version}`));
  const home = await read('dist/index.html');
  for (const language of ['python', 'javascript', 'java', 'bash']) {
    const expected = `assets/img/languages/${language}-mono.svg?v=${version}`;
    assert.equal(home.split(expected).length - 1, 2, expected);
  }
  assert.ok((await read('dist/assets/js/mermaid-loader.js')).includes(`mermaid-11.17.2.min.js?v=${version}`));
  assert.ok((await read('dist/assets/js/highlight-loader.js')).includes(`highlight-11.12.0.min.js?v=${version}`));
});
