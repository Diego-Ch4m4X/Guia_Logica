import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { offsetTopicHeadings } from '../../scripts/lib/components.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => readFile(path.join(root, file), 'utf8');

test('mobile drawers use conforming dialog containers', async () => {
  const template = await read('src/templates/topic.html');
  for (const id of ['guideDrawer', 'tocDrawer']) {
    const tag = template.match(new RegExp(`<div\\b[^>]*\\bid="${id}"[^>]*>`))?.[0];
    assert.ok(tag, `${id}: div container missing`);
    for (const attribute of ['role="dialog"', 'aria-modal="true"', 'aria-hidden="true"', 'inert=""']) {
      assert.ok(tag.includes(attribute), `${id}: ${attribute} missing`);
    }
  }
  assert.doesNotMatch(template, /<aside\b[^>]*\brole="dialog"/i);
});

test('topic heading offset keeps text, IDs and paired tags', () => {
  assert.equal(offsetTopicHeadings('<h1 class="chapter-title" id="a">Capítulo</h1><h4 id="b"><code>x</code></h4>'),
    '<h2 class="chapter-title" id="a">Capítulo</h2><h5 id="b"><code>x</code></h5>');
  assert.throws(() => offsetTopicHeadings('<h6 id="overflow">x</h6>'), /Cannot offset/);
});

test('all published pages have one H1 and no heading jumps', async () => {
  const names = (await readdir(path.join(root, 'dist/topicos'))).sort();
  assert.equal(names.length, 35);
  for (const name of names) {
    const html = await read(`dist/topicos/${name}/index.html`);
    const headings = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map(match => Number(match[1]));
    assert.equal(headings.filter(level => level === 1).length, 1, name);
    assert.match(html, /<header class="article-head">[\s\S]*?<h1>[^<]+<\/h1>/, name);
    assert.doesNotMatch(html.slice(html.indexOf('<div class="article-body')), /<h1\b/i, name);
    for (let i = 1; i < headings.length; i += 1) {
      assert.ok(headings[i] <= headings[i - 1] + 1, `${name}: h${headings[i - 1]} -> h${headings[i]}`);
    }
  }
  const home = await read('dist/index.html');
  assert.equal([...home.matchAll(/<h1\b/gi)].length, 1);
});

test('unchecked activity checkbox borders meet 3:1 contrast in both themes', async () => {
  const css = await read('src/assets/css/topic-reference.css');
  assert.match(css, /\.interactive-check\{[^}]*border:1px solid var\(--fil-text-muted\)/);
  const tokens = await read('src/assets/css/tokens.css');
  const luminance = hex => {
    const channels = hex.match(/[0-9a-f]{2}/gi).map(part => parseInt(part, 16) / 255);
    const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  for (const rule of [...tokens.matchAll(/:root(?:\[data-theme="dark"\])?\{([^}]+)\}/g)].slice(0, 2)) {
    const border = rule[1].match(/--fil-text-muted:(#[0-9a-f]{6})/i)?.[1];
    const surface = rule[1].match(/--fil-surface:(#[0-9a-f]{6})/i)?.[1];
    assert.ok(border && surface);
    const [lighter, darker] = [luminance(border), luminance(surface)].sort((a, b) => b - a);
    assert.ok((lighter + 0.05) / (darker + 0.05) >= 3);
  }
});

test('continuous SMIL animations pause and resume, including cloned nodes', async () => {
  globalThis.document = { documentElement:{} };
  const { syncContinuousMotion } = await import('../../src/assets/js/theme.js');
  const animation = begin => ({
    begin,
    ended:0,
    started:0,
    getAttribute(name) { return name === 'begin' ? this.begin : null; },
    setAttribute(name, value) { if (name === 'begin') this.begin = value; },
    removeAttribute(name) { if (name === 'begin') this.begin = null; },
    endElement() { this.ended += 1; },
    beginElement() { this.started += 1; },
  });
  const logo = animation(null);
  const icon = animation('0s');
  syncContinuousMotion([logo], true);
  syncContinuousMotion([logo, icon], true);
  assert.equal(logo.begin, 'indefinite');
  assert.equal(icon.begin, 'indefinite');
  assert.ok(logo.ended >= 1 && icon.ended >= 1);
  syncContinuousMotion([logo, icon], false);
  assert.equal(logo.begin, null);
  assert.equal(icon.begin, '0s');
  assert.equal(logo.started, 1);
  assert.equal(icon.started, 1);
  delete globalThis.document;
});

test('checklists use a shared key and retain the legacy key for migration', async () => {
  const source = await read('src/assets/js/checklists.js');
  assert.match(source, /logic\.guide\.checks\.v1/);
  assert.match(source, /logic\.t25\.checks\.v1/);
  assert.doesNotMatch(source, /const storageKey\s*=\s*['"]logic\.t25\.checks\.v1/);
});

test('direct topic H5 headings retain the former H4 visual metrics', async () => {
  const topicCss = await read('src/assets/css/topic.css');
  const baseCss = await read('src/assets/css/base.css');
  const declaration = source => Object.fromEntries(
    source.split(';').map(item => item.split(':').map(part => part.trim())).filter(parts => parts.length === 2)
  );
  const oldH4 = declaration(baseCss.match(/(?:^|})h4\{([^}]*)\}/)?.[1] || '');
  const directH5 = declaration(topicCss.match(/\.topic-article \.article-body > h5\{([^}]*)\}/)?.[1] || '');
  assert.equal(directH5['font-size'], oldH4['font-size']);
  assert.equal(directH5['margin-top'], oldH4['margin-top']);
  assert.equal(directH5['margin-bottom'], '1.33em');
  assert.equal(directH5['font-weight'], undefined);
  assert.equal(directH5['line-height'], undefined);
  assert.equal(directH5.color, undefined);
  assert.equal(directH5['letter-spacing'], undefined);
});

test('dead build helpers and internal-only exports stay removed', async () => {
  const pairs = [
    ['scripts/lib/metadata.js', ['splitFrontMatter', 'parseYamlSubset']],
    ['scripts/lib/paths.js', ['srcDir']],
    ['scripts/lib/seo.js', ['canonicalForHome', 'canonicalForTopic', 'buildHomeJsonLd', 'buildTopicJsonLd']],
  ];
  for (const [file, names] of pairs) {
    const source = await read(file);
    for (const name of names) assert.doesNotMatch(source, new RegExp(`export\\s+(?:function|const)\\s+${name}\\b`), file);
  }
  assert.doesNotMatch(await read('scripts/lib/markdown.js'), /\banalyzeHeadings\b/);
  assert.doesNotMatch(await read('scripts/lib/paths.js'), /\btopicDistDir\b/);
  assert.doesNotMatch(await read('src/assets/js/theme.js'), /\bsystem:\s*['"]Tema do sistema/);
  const home = await read('src/assets/js/home.js');
  assert.doesNotMatch(home, /\bupdateHash\b|\bif\(open&&focus\)/);
});
