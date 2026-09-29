import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { wrapLabsSemantic } from '../../scripts/lib/components.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function markdownLabCount(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let count = 0;
  let inFence = false;
  let fenceChar = '';
  let fenceLen = 0;

  for (const line of lines) {
    const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/);
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

    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!heading) continue;
    const semantic = heading[1]
      .replace(/^\d+(?:\.\d+)*\.?\s+/, '')
      .replace(/^🧪\s*/u, '')
      .trim();
    if (/^(?:LAB|Laboratório)\s+\d+\s+—\s+.+$/iu.test(semantic)) count += 1;
  }
  return count;
}

test('semantic LAB wrapper preserves compact variants and enriches structured variants', () => {
  const compact = wrapLabsSemantic([
    '<h2 id="lab-compacto">🧪 Laboratório 1 — Compacto</h2>',
    '<h3 id="objetivo">Objetivo</h3><p>Praticar.</p>',
    '<h3 id="parte-a">Parte A</h3><p>Conteúdo próprio.</p>',
    '<h2 id="seguinte">Seção seguinte</h2>',
  ].join(''), 'T01');
  assert.equal((compact.match(/data-activity="lab"/g) || []).length, 1);
  assert.match(compact, /class="lab-compact-body"/);
  assert.match(compact, /id="parte-a">Parte A<\/h3>/);
  assert.match(compact, /<h2 id="seguinte">Seção seguinte<\/h2>/);

  const structured = wrapLabsSemantic([
    '<h1 class="chapter-title" id="36-lab-2">36. 🧪 LAB 2 — Rastrear busca linear</h1>',
    '<h2 id="361-objetivo">36.1 Objetivo</h2><p>Objetivo.</p>',
    '<h2 id="362-prerequisitos">36.2 Pré-requisitos</h2><p>Pré.</p>',
    '<h2 id="363-estado">36.3 Estado inicial</h2><p>Estado.</p>',
    '<h2 id="364-tarefa">36.4 Tarefa</h2><p>Tarefa.</p>',
    '<h2 id="365-procedimento">36.5 Procedimento</h2><p>Passos.</p>',
    '<h2 id="366-testes">36.6 Testes</h2><p>Teste.</p>',
  ].join(''), 'T26');
  assert.equal((structured.match(/data-activity="lab"/g) || []).length, 1);
  assert.match(structured, /class="lab-summary-grid"/);
  assert.match(structured, /class="lab-panel lab-panel--procedure"/);
  assert.match(structured, /class="lab-validation-grid"/);
  assert.doesNotMatch(structured, /class="lab-compact-body"/);
});

test('every canonical LAB heading is rendered as a LabActivity in T01-T35', async () => {
  const dir = path.join(ROOT, 'content/topics');
  const names = (await readdir(dir)).filter(name => name.endsWith('.md')).sort();
  assert.equal(names.length, 35);

  for (const name of names) {
    const source = await readFile(path.join(dir, name), 'utf8');
    const expected = markdownLabCount(source);
    const id = name.match(/^(T\d{2})_/i)?.[1]?.toLowerCase();
    assert.ok(id, `topic id not found in ${name}`);
    assert.ok(expected > 0, `${id}: expected at least one canonical LAB heading`);
    const html = await readFile(path.join(ROOT, `dist/topicos/${id}/index.html`), 'utf8');
    const actual = (html.match(/data-activity="lab"/g) || []).length;
    assert.equal(actual, expected, `${id}: LAB source/render count mismatch`);
  }
});

test('semantic LAB wrapper keeps the approved T25 structural shape available', () => {
  const html = wrapLabsSemantic([
    '<h1 class="chapter-title" id="41-lab-1">41. 🧪 LAB 1 — Separar ADT, estrutura e implementação</h1>',
    '<h2 id="objetivo">Objetivo</h2><p>A</p>',
    '<h2 id="pre">Pré-requisitos</h2><p>B</p>',
    '<h2 id="estado">Estado inicial</h2><p>C</p>',
    '<h2 id="tarefa">Tarefa</h2><p>D</p>',
    '<h2 id="procedimento">Procedimento</h2><p>E</p>',
    '<h2 id="observar">O que observar</h2><p>F</p>',
    '<h2 id="testes">Testes</h2><p>G</p>',
    '<h2 id="explicacao">Explicação</h2><p>H</p>',
    '<h2 id="transferencia">Variação / transferência</h2><p>I</p>',
    '<h2 id="limpeza">Limpeza</h2><p>J</p>',
    '<h2 id="criterios">Critérios de aceite</h2><ul><li>K</li></ul>',
  ].join(''), 'T25');
  assert.match(html, /class="lab-summary-grid"/);
  assert.match(html, /class="lab-validation-grid"/);
  assert.match(html, /class="lab-reflection-grid"/);
  assert.match(html, /class="lab-panel lab-panel--criteria"/);
});
