import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const canonicalKey = 'logic.guide.checks.v1';
const legacyKey = 'logic.t25.checks.v1';
const read = file => readFile(path.join(root, file), 'utf8');

const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
Object.defineProperty(globalThis, 'document', { configurable:true, value:{ documentElement:{} } });
const { initChecklists } = await import('../../src/assets/js/checklists.js');
if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
else delete globalThis.document;

function makeBox(checkKey) {
  return {
    dataset:{ checkKey },
    checked:false,
    listeners:{},
    addEventListener(type, listener) { this.listeners[type] = listener; },
  };
}

function setupChecklist(t, { initial = {}, boxes = [], getErrors = [], setError = false, storageGetterError = false } = {}) {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const previousDocumentForTest = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const values = new Map(Object.entries(initial));
  const writes = [];
  let restored = false;
  const storage = {
    getItem(key) {
      if (getErrors.includes(key)) throw new Error('getItem unavailable');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      writes.push(key);
      if (setError) throw new Error('setItem unavailable');
      values.set(key, value);
    },
  };
  const restore = () => {
    if (restored) return;
    restored = true;
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else delete globalThis.localStorage;
    if (previousDocumentForTest) Object.defineProperty(globalThis, 'document', previousDocumentForTest);
    else delete globalThis.document;
  };

  Object.defineProperty(globalThis, 'document', {
    configurable:true,
    value:{ querySelectorAll:() => boxes, getElementById:() => null },
  });
  if (storageGetterError) {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable:true,
      get() { throw new Error('localStorage unavailable'); },
    });
  } else {
    Object.defineProperty(globalThis, 'localStorage', { configurable:true, value:storage });
  }
  t.after(restore);
  initChecklists();
  return { values, writes, restore };
}

function parsedState(values, key = canonicalKey) {
  return JSON.parse(values.get(key));
}

test('topic overview is shared and uses no topic-specific selector', async () => {
  const source = await read('scripts/build.js');
  const start = source.indexOf('function topicOverview(');
  const end = source.indexOf('\nfunction related(', start);
  assert.ok(start >= 0 && end > start);
  const renderer = source.slice(start, end);
  assert.doesNotMatch(renderer, /topic\.(?:number|id|title|slug)\b/);
  assert.doesNotMatch(renderer, /href\s*=\s*[`'"].*#/);
});

test('all 35 generated topics have the shared overview with valid local fragments and data', async () => {
  const topicNames = (await readdir(path.join(root, 'dist/topicos'))).sort();
  assert.equal(topicNames.length, 35);

  for (const topicName of topicNames) {
    const html = await read(`dist/topicos/${topicName}/index.html`);
    const start = html.indexOf('class="topic-overview"');
    const end = html.indexOf('<div class="article-body', start);
    assert.ok(start >= 0 && end > start, topicName);
    const overview = html.slice(html.lastIndexOf('<section', start), end);
    const version = html.match(/<span>Versão ([^<]+)<\/span>/)?.[1];
    assert.ok(version, topicName);
    assert.match(overview, /class="quick-answer"/);
    assert.match(overview, /class="stat-grid"/);
    assert.match(overview, /class="info-grid"/);

    const statCards = [...overview.matchAll(/class="stat-card"><strong>([^<]*)<\/strong><span>([^<]*)<\/span>/g)];
    assert.equal(statCards.length, 2, topicName);
    assert.equal(Number(statCards[0][1]), (html.match(/data-activity="lab"/g) || []).length, `${topicName}: LAB count`);
    assert.equal(statCards[1][1], version, `${topicName}: version`);

    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${topicName}: duplicate IDs`);
    const idSet = new Set(ids);
    for (const link of html.matchAll(/href="#([^"]+)"/g)) {
      const fragment = link[1].replaceAll('&amp;', '&');
      let target = fragment;
      try { target = decodeURIComponent(fragment); } catch (error) {}
      assert.ok(idSet.has(target), `${topicName}: broken fragment #${fragment}`);
    }

    const headings = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map(match => Number(match[1]));
    assert.equal(headings.filter(level => level === 1).length, 1, `${topicName}: H1 count`);
    for (let index = 1; index < headings.length; index += 1) {
      assert.ok(headings[index] <= headings[index - 1] + 1, `${topicName}: heading jump`);
    }
  }
});

test('checklist states remain isolated by topic in generated pages', async () => {
  const topicNames = (await readdir(path.join(root, 'dist/topicos'))).sort();
  const seen = new Set();
  for (const topicName of topicNames) {
    const topicId = topicName.toLowerCase();
    const html = await read(`dist/topicos/${topicName}/index.html`);
    const keys = [...html.matchAll(/data-check-key="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(keys).size, keys.length, `${topicName}: duplicate check keys`);
    for (const key of keys) {
      assert.match(key, new RegExp(`^${topicId}-check-\\d+$`), `${topicName}: ${key}`);
      assert.ok(!seen.has(key), `cross-topic check collision: ${key}`);
      seen.add(key);
    }
  }
});

test('canonical-only checklist state loads and changes persist under the canonical key', t => {
  const box = makeBox('t01-check-001');
  const env = setupChecklist(t, {
    initial:{ [canonicalKey]:JSON.stringify({ 't01-check-001':true }) },
    boxes:[box],
  });
  assert.equal(box.checked, true);
  box.checked = false;
  box.listeners.change();
  assert.equal(parsedState(env.values)['t01-check-001'], false);
  assert.deepEqual(env.writes, [canonicalKey, canonicalKey]);
  assert.equal(env.values.has(legacyKey), false);
});

test('legacy-only checklist state migrates without removing its source', t => {
  const box = makeBox('t25-check-004');
  const legacyValue = JSON.stringify({ 't25-check-004':true, 't01-check-001':true });
  const env = setupChecklist(t, { initial:{ [legacyKey]:legacyValue }, boxes:[box] });
  assert.equal(box.checked, true);
  assert.deepEqual(parsedState(env.values), { 't25-check-004':true, 't01-check-001':true });
  assert.equal(env.values.get(legacyKey), legacyValue);
  box.checked = false;
  box.listeners.change();
  assert.deepEqual(env.writes, [canonicalKey, canonicalKey]);
  assert.equal(env.values.get(legacyKey), legacyValue);
});

test('canonical state wins conflicts while legacy-only and T25 state are retained', t => {
  const boxes = [makeBox('t25-check-004'), makeBox('t25-check-005')];
  const legacyValue = JSON.stringify({ 't25-check-004':true, 't25-check-005':true, 't02-check-002':true });
  const env = setupChecklist(t, {
    initial:{
      [canonicalKey]:JSON.stringify({ 't25-check-004':false, 't01-check-001':true }),
      [legacyKey]:legacyValue,
    },
    boxes,
  });
  assert.equal(boxes[0].checked, false);
  assert.equal(boxes[1].checked, true);
  assert.deepEqual(parsedState(env.values), {
    't25-check-004':false,
    't25-check-005':true,
    't02-check-002':true,
    't01-check-001':true,
  });
  assert.equal(env.values.get(legacyKey), legacyValue);
});

test('invalid JSON and non-object checklist values become empty state', t => {
  for (const invalid of ['{invalid', '[]', 'null', '42', '"text"']) {
    const box = makeBox('t01-check-001');
    const env = setupChecklist(t, { initial:{ [canonicalKey]:invalid }, boxes:[box] });
    assert.equal(box.checked, false, invalid);
    assert.deepEqual(parsedState(env.values), {}, invalid);
    env.restore();
  }
});

test('storage getter, getItem, and setItem failures leave checkboxes usable in memory', t => {
  const inaccessibleBox = makeBox('t01-check-001');
  const inaccessible = setupChecklist(t, { boxes:[inaccessibleBox], storageGetterError:true });
  inaccessibleBox.checked = true;
  assert.doesNotThrow(() => inaccessibleBox.listeners.change());
  assert.equal(inaccessibleBox.checked, true);
  inaccessible.restore();

  const getFailureBox = makeBox('t02-check-002');
  const getFailure = setupChecklist(t, { boxes:[getFailureBox], getErrors:[legacyKey, canonicalKey] });
  getFailureBox.checked = true;
  assert.doesNotThrow(() => getFailureBox.listeners.change());
  assert.equal(getFailureBox.checked, true);
  getFailure.restore();

  const setFailureBox = makeBox('t03-check-003');
  const setFailure = setupChecklist(t, { boxes:[setFailureBox], setError:true });
  setFailureBox.checked = true;
  assert.doesNotThrow(() => setFailureBox.listeners.change());
  assert.equal(setFailureBox.checked, true);
  setFailure.restore();
});