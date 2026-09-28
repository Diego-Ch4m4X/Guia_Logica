import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function markdownHeadingJumps(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const headings = [];
  let inFence = false;
  let fenceChar = '';
  let fenceLen = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const fence = lines[i].match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceChar = fence[1][0];
        fenceLen = fence[1].length;
      } else if (fence[1][0] === fenceChar && fence[1].length >= fenceLen) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;

    const heading = lines[i].match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) headings.push({ level:heading[1].length, line:i + 1, text:heading[2].trim() });
  }

  const jumps = [];
  for (let i = 1; i < headings.length; i += 1) {
    if (headings[i].level > headings[i - 1].level + 1) {
      jumps.push({ previous:headings[i - 1], current:headings[i] });
    }
  }
  return jumps;
}

function duplicateHtmlAttributes(html) {
  const duplicates = [];
  for (const match of html.matchAll(/<[A-Za-z][^>]*>/g)) {
    const seen = new Set();
    for (const attr of match[0].matchAll(/\s([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=/g)) {
      const name = attr[1].toLowerCase();
      if (seen.has(name)) duplicates.push({ name, tag:match[0] });
      seen.add(name);
    }
  }
  return duplicates;
}

function htmlHeadingJumps(html) {
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map(match => Number(match[1]));
  const jumps = [];
  for (let i = 1; i < headings.length; i += 1) {
    if (headings[i] > headings[i - 1] + 1) {
      jumps.push(`h${headings[i - 1]}->h${headings[i]}`);
    }
  }
  return jumps;
}

function count(html, re) {
  return (html.match(re) || []).length;
}

test('canonical Markdown has no heading-level jumps', async () => {
  const dir = path.join(ROOT, 'content/topics');
  const names = (await readdir(dir)).filter(name => name.endsWith('.md')).sort();
  assert.equal(names.length, 35);

  const failures = [];
  for (const name of names) {
    const source = await readFile(path.join(dir, name), 'utf8');
    for (const jump of markdownHeadingJumps(source)) {
      failures.push(`${name}:${jump.current.line} h${jump.previous.level}->h${jump.current.level}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('T25 generated HTML preserves approved structural contracts', async () => {
  const actual = await readFile(path.join(ROOT, 'dist/topicos/t25/index.html'), 'utf8');
  const golden = await readFile(path.join(ROOT, 'tests/fixtures/t25/golden.html'), 'utf8');

  assert.deepEqual(duplicateHtmlAttributes(actual), []);
  assert.deepEqual(htmlHeadingJumps(actual), []);

  const contracts = [
    ['language tabs', /class="language-tabs"/g],
    ['tab panels', /role="tabpanel"/g],
    ['LAB activities', /data-activity="lab"/g],
    ['exercise activities', /data-activity="exercise"/g],
    ['exercise suite', /class="exercise-suite"/g],
    ['interactive checks', /class="interactive-check"/g],
    ['glossary items', /class="glossary-item"/g],
    ['glossary letter groups', /class="glossary-letter-group"/g],
    ['reference cards', /class="reference-card"/g],
    ['chapter titles', /class="chapter-title"/g],
  ];

  for (const [label, pattern] of contracts) {
    assert.equal(count(actual, pattern), count(golden, pattern), `${label} drifted from T25 structural baseline`);
  }

  assert.equal(count(actual, /class="language-tabs"/g), 4);
  assert.equal(count(actual, /role="tabpanel"/g), 16);
  assert.equal(count(actual, /data-activity="lab"/g), 8);
  assert.equal(count(actual, /data-activity="exercise"/g), 4);
  assert.equal(count(actual, /class="exercise-suite"/g), 1);

  const values = (html, pattern) => [...html.matchAll(pattern)].map(match => match[1]);
  const codeBlocks = html => values(html, /<pre><code>([\s\S]*?)<\/code><\/pre>/g)
    .map(block => block.replaceAll('&#x27;', "'").replaceAll('&#39;', "'"));
  const goldenCode = codeBlocks(golden);
  const actualCode = codeBlocks(actual);
  assert.deepEqual(actualCode, goldenCode, 'T25 code blocks drifted');

  const actualIds = new Set(values(actual, /\bid="([^"]+)"/g));
  for (const id of values(golden, /\bid="([^"]+)"/g)) {
    assert.ok(actualIds.has(id), `T25 approved anchor disappeared: ${id}`);
  }
  const actualLocalLinks = new Set(values(actual, /href="(#[^"]+)"/g));
  for (const link of values(golden, /href="(#[^"]+)"/g)) {
    assert.ok(actualLocalLinks.has(link), `T25 approved local link disappeared: ${link}`);
  }
});

test('build uses one topic content pipeline and no dedicated golden T25 branch', async () => {
  const source = await readFile(path.join(ROOT, 'scripts/build.js'), 'utf8');
  assert.doesNotMatch(source, /goldenT25Content/);
  assert.doesNotMatch(source, /genericTopicContent/);
  assert.match(source, /function topicContent\(topic\)/);
  assert.match(source, /const built = topicContent\(topic\);/);
});
