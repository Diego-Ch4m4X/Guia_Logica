import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderMarkdown, splitTableRow } from '../../scripts/lib/markdown.js';
import {
  classifyLabPartHeading,
  normalizeSemanticHeading,
  parseExerciseRootHeading,
  parseLabHeading,
  renderGlossary,
  renderReferences,
} from '../../scripts/lib/components.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('semantic heading normalization preserves display text while exposing editorial prefixes', () => {
  assert.deepEqual(
    normalizeSemanticHeading('40. 🧪 Laboratório 1 — Requisito → operações → estrutura'),
    {
      original:'40. 🧪 Laboratório 1 — Requisito → operações → estrutura',
      sectionPrefix:'40.',
      semantic:'Laboratório 1 — Requisito → operações → estrutura',
      hasLabEmoji:true,
    },
  );
  assert.deepEqual(
    normalizeSemanticHeading('40.9 Variação / transferência'),
    {
      original:'40.9 Variação / transferência',
      sectionPrefix:'40.9',
      semantic:'Variação / transferência',
      hasLabEmoji:false,
    },
  );
});

test('LAB heading parser accepts corpus variants without depending on topic or section number', () => {
  const cases = [
    ['🧪 LAB 1 — contador', 1, 'contador'],
    ['36. 🧪 LAB 2 — Rastrear busca linear', 2, 'Rastrear busca linear'],
    ['30. LAB 3 — Visualizar crescimento', 3, 'Visualizar crescimento'],
    ['40. 🧪 Laboratório 4 — Requisito → operações', 4, 'Requisito → operações'],
  ];
  for (const [source, activityIndex, title] of cases) {
    const parsed = parseLabHeading(source);
    assert.ok(parsed, source);
    assert.equal(parsed.kind, 'lab');
    assert.equal(parsed.activityIndex, activityIndex);
    assert.equal(parsed.title, title);
  }
  assert.equal(parseLabHeading('PARTE VI — LABs, exercícios e critérios de domínio'), null);
  assert.equal(parseLabHeading('40. LAB 1 - separador ASCII não contratado'), null);
});

test('exercise root parser accepts numbered and qualified roots but rejects chapter prose', () => {
  assert.equal(parseExerciseRootHeading('20. Exercícios')?.qualifier, '');
  assert.equal(parseExerciseRootHeading('44. Exercícios fundamentais')?.qualifier, 'fundamentais');
  assert.equal(
    parseExerciseRootHeading('45. Exercícios de transferência entre linguagens')?.qualifier,
    'de transferência entre linguagens',
  );
  assert.equal(parseExerciseRootHeading('PARTE VI — LABs, exercícios e critérios de domínio'), null);
});

test('LAB part classifier normalizes only aliases proven by the corpus', () => {
  const cases = [
    ['Objetivo', 'objective'],
    ['Testes / autoverificação', 'tests'],
    ['40.7 Testes', 'tests'],
    ['Transferência', 'transfer'],
    ['Variação / transferência', 'transfer'],
    ['Limpeza, quando aplicável', 'cleanup'],
    ['40.10 Limpeza', 'cleanup'],
    ['Critérios de aceite', 'criteria'],
    ['Evidência', 'evidence'],
  ];
  for (const [source, expected] of cases) {
    assert.equal(classifyLabPartHeading(source), expected, source);
  }
  assert.equal(classifyLabPartHeading('Parte A'), null);
  assert.equal(classifyLabPartHeading('Registre'), null);
});

test('table rows preserve escaped pipes and pipes inside code spans', () => {
  assert.deepEqual(
    splitTableRow('| `int | None` | left \\| right |'),
    ['`int | None`', 'left | right'],
  );
  assert.deepEqual(
    splitTableRow('| `|V|` | `|E|` |'),
    ['`|V|`', '`|E|`'],
  );
  assert.deepEqual(
    splitTableRow('| unmatched ` | still a separator |'),
    ['unmatched `', 'still a separator'],
  );

  const html = renderMarkdown([
    '| Expressão | Significado |',
    '| --- | --- |',
    '| `int | None` | união |',
    '| left \\| right | pipe literal |',
  ].join('\n'), { skipFirstH1:false }).html;

  assert.match(html, /<td><code>int \| None<\/code><\/td>/);
  assert.match(html, /<td>left \| right<\/td>/);
});

test('standalone checklist rendering uses a neutral prefix when no topicId is supplied', () => {
  const html = renderMarkdown('- [ ] item', { skipFirstH1:false }).html;
  assert.match(html, /data-check-key="content-check-001"/);
  assert.doesNotMatch(html, /data-check-key="t25-check-/);
});

test('canonical glossary renderer preserves pipe-bearing technical notation', () => {
  const source = [
    '# 52. Glossário',
    '',
    '| Termo | Definição |',
    '| --- | --- |',
    '| Tamanho da entrada | Usa `|V|` vértices e `|E|` arestas |',
  ].join('\n');

  for (const topicId of ['T25', 'T24']) {
    const html = renderGlossary(source, topicId);
    assert.match(html, /Usa <code>\|V\|<\/code> vértices e <code>\|E\|<\/code> arestas/);
  }
});

test('canonical reference renderer links canonical URL forms', () => {
  const body = [
    '# 55. Referências',
    '',
    '## 55.2 Literatura local efetivamente consultada',
    '',
    '- https://example.com/direct',
    '- Manual: <https://example.com/manual>;',
    '- [Especificação](https://example.com/spec)',
    '',
    '## 55.3 Python — documentação oficial',
    '',
    '- Python: <https://docs.python.org/3/>',
    '',
    '## 55.4 JavaScript / ECMAScript — especificação e referência',
    '',
    '- referência final sem URL',
    '',
    '**Fim — teste**',
  ].join('\n');

  const html = renderReferences(body, body);
  assert.match(html, /href="https:\/\/example\.com\/direct"/);
  assert.match(html, /href="https:\/\/example\.com\/manual"/);
  assert.match(html, /href="https:\/\/example\.com\/spec"/);
  assert.match(html, /href="https:\/\/docs\.python\.org\/3\/"/);
});

test('generated corpus preserves known pipe-bearing expressions', async () => {
  const t03 = await readFile(path.join(ROOT, 'dist/topicos/t03/index.html'), 'utf8');
  const t24 = await readFile(path.join(ROOT, 'dist/topicos/t24/index.html'), 'utf8');
  const t32 = await readFile(path.join(ROOT, 'dist/topicos/t32/index.html'), 'utf8');

  assert.match(t03, /<code>age: int \| None = None<\/code>/);
  assert.match(t24, /<code>\|V\|<\/code>/);
  assert.match(t24, /<code>\|E\|<\/code>/);
  assert.match(t32, /<code>Θ\(\|V\|²\)<\/code>/);
});

test('generated no-link reference cards never contain explicit HTTP URLs', async () => {
  for (let n = 1; n <= 35; n += 1) {
    const id = `t${String(n).padStart(2, '0')}`;
    const html = await readFile(path.join(ROOT, `dist/topicos/${id}/index.html`), 'utf8');
    const noLinkCards = [...html.matchAll(/<div class="reference-card no-link">([\s\S]*?)<\/div>/g)];
    for (const card of noLinkCards) {
      assert.doesNotMatch(card[1], /https?:\/\//, `${id}: URL explícita permaneceu sem link`);
    }
  }
});
