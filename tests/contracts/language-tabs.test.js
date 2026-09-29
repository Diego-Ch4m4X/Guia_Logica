import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classifyLanguageHeading,
  parseExerciseRootHeading,
  parseLabHeading,
  wrapLanguageTabsSemantic,
} from '../../scripts/lib/components.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const META_CONTEXT = /(?:referencias|bibliografia|documentacao|fontes?\s+(?:oficiais|primarias)|exercicios|evidencias?\s+de\s+dominio|glossario|troubleshooting|problemas reais|historico|apendic|laboratorio|\blab\b)/i;

function fold(value) {
  return String(value)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('pt-BR');
}

function sourceHeadingTree(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const nodes = [];
  const stack = [];
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

    const heading = lines[i].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!heading) continue;
    const node = {
      level:heading[1].length,
      text:heading[2],
      language:classifyLanguageHeading(heading[2]),
      parent:null,
      children:[],
    };
    while (stack.length && stack.at(-1).level >= node.level) stack.pop();
    node.parent = stack.at(-1) || null;
    if (node.parent) node.parent.children.push(node);
    nodes.push(node);
    stack.push(node);
  }
  return nodes;
}

function sourceContexts(parent, siblings, index) {
  if (parent) {
    const contexts = [];
    let current = parent;
    while (current) {
      contexts.push(current);
      current = current.parent;
    }
    return contexts;
  }

  const contexts = [];
  for (let i = index - 1; i >= 0 && contexts.length < 2; i -= 1) {
    if (!siblings[i].language) contexts.push(siblings[i]);
  }
  return contexts;
}

function sourceContextEligible(contexts) {
  return contexts.every(context => {
    if (parseLabHeading(context.text) || parseExerciseRootHeading(context.text)) return false;
    return !META_CONTEXT.test(fold(context.text));
  });
}

function expectedLanguageGroups(source) {
  const nodes = sourceHeadingTree(source);
  const roots = nodes.filter(node => !node.parent);
  const containers = [{ children:roots, parent:null }, ...nodes.map(node => ({
    children:node.children,
    parent:node,
  }))];

  let groups = 0;
  for (const container of containers) {
    const siblings = container.children;
    for (let i = 0; i + 3 < siblings.length;) {
      const languages = siblings.slice(i, i + 4).map(node => node.language);
      const isGroup = languages.every(Boolean) && new Set(languages).size === 4;
      if (!isGroup) {
        i += 1;
        continue;
      }
      if (sourceContextEligible(sourceContexts(container.parent, siblings, i))) groups += 1;
      i += 4;
    }
  }
  return groups;
}

function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1] || '';
}

test('language heading classifier accepts canonical corpus labels and rejects prose', () => {
  const cases = [
    ['15. Python — abstração', 'python'],
    ['JavaScript/Node.js — exemplo', 'javascript'],
    ['ECMAScript 2026', 'javascript'],
    ['Java SE 27', 'java'],
    ['GNU Bash — fila', 'shell'],
    ['Bash POSIX ERE', 'shell'],
    ['Shell / GNU Bash', 'shell'],
  ];
  for (const [heading, expected] of cases) {
    assert.equal(classifyLanguageHeading(heading), expected, heading);
  }
  assert.equal(classifyLanguageHeading('Exemplo Python'), null);
  assert.equal(classifyLanguageHeading('JavaScript e Java — comparação'), 'javascript');
  assert.equal(classifyLanguageHeading('PARTE IV — Transferência entre linguagens'), null);
});

test('semantic LanguageTabs preserves aliases, hierarchy and T25-compatible theme keys', () => {
  const html = wrapLanguageTabsSemantic([
    '<h1 class="chapter-title" id="parte-iv">PARTE IV — Transferência entre linguagens</h1>',
    '<h1 class="chapter-title" id="quatro-linguagens">14. Quatro linguagens — mecanismos diferentes</h1>',
    '<a aria-hidden="true" class="anchor-alias" id="python-legado"></a><h1 class="chapter-title" id="15-python">15. Python — abstração</h1><p>P</p>',
    '<h1 class="chapter-title" id="16-javascript">16. JavaScript — contrato</h1><p>JS</p>',
    '<h1 class="chapter-title" id="17-java">17. Java — interface</h1><p>J</p>',
    '<h1 class="chapter-title" id="18-bash">18. GNU Bash — disciplina</h1><p>B</p>',
    '<h1 class="chapter-title" id="19-depois">19. Depois</h1>',
  ].join(''));

  assert.equal((html.match(/class="language-tabs"/g) || []).length, 1);
  assert.match(html, /id="transferencia-tab-python"/);
  assert.match(html, /id="transferencia-panel-shell"/);
  assert.match(html, /role="tabpanel"><a aria-hidden="true" class="anchor-alias" id="python-legado"><\/a><h2 class="chapter-title" id="15-python">/);
  assert.match(html, /<h1 class="chapter-title" id="19-depois">19\. Depois<\/h1>/);
});

test('semantic LanguageTabs excludes references, documentation, exercises and LAB context', () => {
  const html = wrapLanguageTabsSemantic([
    '<h1 id="1-comparacao">1. Comparação prática</h1>',
    '<h2 id="11-python">1.1 Python</h2><p>P</p><h2 id="12-js">1.2 JavaScript</h2><p>JS</p><h2 id="13-java">1.3 Java</h2><p>J</p><h2 id="14-bash">1.4 Bash</h2><p>B</p>',
    '<h1 id="2-referencias">2. Referências</h1>',
    '<h2 id="21-python">2.1 Python</h2><p>P</p><h2 id="22-js">2.2 JavaScript</h2><p>JS</p><h2 id="23-java">2.3 Java</h2><p>J</p><h2 id="24-bash">2.4 Bash</h2><p>B</p>',
    '<h1 id="3-documentacao">3. Documentação oficial</h1>',
    '<h2 id="31-python">3.1 Python</h2><h2 id="32-js">3.2 JavaScript</h2><h2 id="33-java">3.3 Java</h2><h2 id="34-bash">3.4 Bash</h2>',
    '<h1 id="4-exercicios">4. Exercícios</h1>',
    '<h2 id="41-python">4.1 Python</h2><h2 id="42-js">4.2 JavaScript</h2><h2 id="43-java">4.3 Java</h2><h2 id="44-bash">4.4 Bash</h2>',
    '<h1 id="5-lab">5. 🧪 LAB 1 — comparação</h1>',
    '<h2 id="51-python">Python</h2><h2 id="52-js">JavaScript</h2><h2 id="53-java">Java</h2><h2 id="54-bash">Bash</h2>',
  ].join(''));

  assert.equal((html.match(/class="language-tabs"/g) || []).length, 1);
  assert.match(html, /id="11-python"/);
  assert.match(html, /id="21-python"/);
  assert.match(html, /id="31-python"/);
  assert.match(html, /id="41-python"/);
  assert.match(html, /id="51-python"/);
});

test('canonical T01-T35 language groups have source/render parity and valid ARIA pairs', async () => {
  const dir = path.join(ROOT, 'content/topics');
  const names = (await readdir(dir)).filter(name => name.endsWith('.md')).sort();
  assert.equal(names.length, 35);

  let totalExpected = 0;
  for (const name of names) {
    const source = await readFile(path.join(dir, name), 'utf8');
    const expected = expectedLanguageGroups(source);
    totalExpected += expected;

    const id = name.match(/^(T\d{2})_/i)?.[1]?.toLowerCase();
    assert.ok(id, `topic id not found in ${name}`);
    const html = await readFile(path.join(ROOT, `dist/topicos/${id}/index.html`), 'utf8');

    const groups = (html.match(/class="language-tabs"/g) || []).length;
    const tabTags = [...html.matchAll(/<button\b[^>]*\brole="tab"[^>]*>/g)].map(match => match[0]);
    const panelTags = [...html.matchAll(/<div\b[^>]*\brole="tabpanel"[^>]*>/g)].map(match => match[0]);
    assert.equal(groups, expected, `${id}: language group source/render mismatch`);
    assert.equal(tabTags.length, groups * 4, `${id}: expected four tabs per language group`);
    assert.equal(panelTags.length, groups * 4, `${id}: expected four panels per language group`);

    const panelIds = new Set(panelTags.map(tag => attr(tag, 'id')));
    const tabIds = new Set(tabTags.map(tag => attr(tag, 'id')));
    for (const tag of tabTags) {
      const control = attr(tag, 'aria-controls');
      assert.ok(panelIds.has(control), `${id}: tab controls missing panel ${control}`);
    }
    for (const tag of panelTags) {
      const labelledBy = attr(tag, 'aria-labelledby');
      assert.ok(tabIds.has(labelledBy), `${id}: panel label missing tab ${labelledBy}`);
    }
  }

  assert.equal(totalExpected, 188, 'canonical semantic language-group inventory drifted');
});

test('T25 keeps its four approved LanguageTabs keys and excludes documentation/reference lookalikes', async () => {
  const html = await readFile(path.join(ROOT, 'dist/topicos/t25/index.html'), 'utf8');
  assert.equal((html.match(/class="language-tabs"/g) || []).length, 4);
  for (const key of ['transferencia', 'bibliotecas', 'mapeamento', 'fila']) {
    assert.match(html, new RegExp(`id="${key}-tab-python"`));
    assert.match(html, new RegExp(`id="${key}-panel-shell"`));
  }
});

test('semantic LanguageTabs has one shared call path without a legacy T25 configuration', async () => {
  const source = await readFile(path.join(ROOT, 'scripts/lib/components.js'), 'utf8');
  assert.equal((source.match(/\bwrapTabGroup\(/g) || []).length, 1, 'legacy wrapper must have definition only');
  assert.doesNotMatch(source, /15-python--abstração-e-implementação-concreta/);
  assert.doesNotMatch(source, /253-python/);
  assert.equal((source.match(/\bwrapLanguageTabsSemantic\(/g) || []).length, 2, 'semantic wrapper must have one definition and one active call');
});
