import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cssDir = path.join(root, 'src/assets/css');
const css = name => readFile(path.join(cssDir, name), 'utf8');
const withoutComments = source => source.replace(/\/\*[\s\S]*?\*\//g, '');
const rule = (source, selector) => [...withoutComments(source).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .find(match => match[1].trim() === selector)?.[2] ?? '';

test('published CSS has no !important declarations', async () => {
  for (const name of (await readdir(cssDir)).filter(name => name.endsWith('.css'))) {
    assert.doesNotMatch(withoutComments(await css(name)), /!\s*important\b/i, name);
  }
});

test('LAB presentation has one CSS owner and explicit compact/sectioned contracts', async () => {
  const names = (await readdir(cssDir)).filter(name => name.endsWith('.css'));
  const labSelector = /\.(?:learning-activity|lab-activity|lab-compact-body|lab-section(?:-lead|-list|-heading-text|--semantic|--custom)?|lab-summary-grid|lab-validation-grid|lab-reflection-grid|lab-panel(?:-icon|-heading-text|--procedure|--criteria)?|lab-disclosures)\b/;

  for (const name of names.filter(name => name !== 'activities.css')) {
    assert.doesNotMatch(withoutComments(await css(name)), labSelector, `${name} must not own LAB presentation`);
  }

  const activities = await css('activities.css');
  assert.match(activities, /\.lab-activity--sectioned,\.lab-activity--compact\{/);
  assert.match(activities, /\.lab-section-list\{/);
  assert.match(activities, /\.lab-section--custom>:is\(h3,h4,h5,h6\)\{/);
  assert.match(activities, /\.lab-compact-body>:is\(h3,h4,h5,h6\)\{/);
});

test('technical side panel has one structural owner and an inner scroller', async () => {
  const topic = await css('topic.css');
  const reference = await css('topic-reference.css');
  assert.doesNotMatch(reference, /\.side-panel|\.panel-scroll/);
  const shell = rule(topic, '.side-panel');
  assert.match(shell, /position:sticky/);
  assert.match(shell, /height:calc\(100vh/);
  assert.match(shell, /display:flex/);
  assert.match(shell, /flex-direction:column/);
  assert.match(shell, /overflow:hidden/);
  assert.doesNotMatch(topic, /\.side-panel::-webkit-scrollbar/);
  const scroller = rule(topic, '.topic-page .panel-scroll');
  assert.match(scroller, /min-height:0/);
  assert.match(scroller, /overflow:auto/);
  assert.match(scroller, /scrollbar-width:thin/);
  assert.match(topic, /\.topic-page \.panel-scroll::-webkit-scrollbar-thumb/);
});

test('mobile shell states and panel hiding have one owner', async () => {
  const topic = await css('topic.css');
  const responsive = await css('responsive-reference.css');
  assert.doesNotMatch(responsive, /\.page-shell|\.toc-panel|\.guide-panel/);
  assert.match(topic, /@media\(max-width:1279px\)[\s\S]*?\.toc-panel\{display:none\}/);
  assert.match(topic, /@media\(max-width:900px\)[\s\S]*?\.guide-panel\{display:none\}/);
  const mobileShell = topic.split('@media(max-width:900px){')[1]?.split('.article{')[0] ?? '';
  for (const state of ['', '.guide-collapsed', '.toc-collapsed', '.guide-collapsed.toc-collapsed']) {
    assert.match(mobileShell, new RegExp(`\\.topic-page${state.replaceAll('.', '\\.')} \\.page-shell`));
  }
  assert.match(mobileShell, /\{grid-template-columns:minmax\(0,1fr\)\}/);
});

test('code scrollbar and mobile tooltip are owned by code.css', async () => {
  const code = await css('code.css');
  const responsive = await css('responsive-reference.css');
  assert.doesNotMatch(responsive, /\.code-viewport/);
  assert.match(rule(code, '.code-viewport'), /scrollbar-color:var\(--fil-code-scroll-thumb\) var\(--fil-code-scroll-track\)/);
  assert.match(rule(code, '.code-viewport::-webkit-scrollbar-track'), /background:var\(--fil-code-scroll-track\)/);
  assert.match(rule(code, '.code-viewport::-webkit-scrollbar-thumb'), /background:var\(--fil-code-scroll-thumb\)/);
  assert.equal((code.match(/@media\(max-width:767px\)/g) ?? []).length, 1);
  assert.match(code, /\.code-action:hover::after,\.code-action:focus-visible::after\{transform:translateY\(0\)\}/);
});

test('selection uses semantic tokens with unchanged theme values', async () => {
  const base = await css('base.css');
  const tokens = await css('tokens.css');
  assert.match(base, /::selection\{background:var\(--fil-selection-bg\);color:var\(--fil-selection-text\)\}/);
  for (const block of tokens.match(/:root(?:\[data-theme="(?:dark|system)"\])?\{[^{}]+\}/g) ?? []) {
    const value = name => block.match(new RegExp(`--${name}:([^;]+)`))?.[1];
    assert.equal(value('fil-selection-bg'), value('fil-brand'));
    assert.equal(value('fil-selection-text'), value('fil-on-action'));
  }
  for (const name of ['surface-strong', 'info-bg', 'success', 'success-bg', 'warning-bg', 'danger', 'danger-bg']) {
    assert.doesNotMatch(tokens, new RegExp(`--fil-${name}:`));
  }
});
