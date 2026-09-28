import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderMarkdown, splitTableRow } from '../../scripts/lib/markdown.js';
import {
  renderGlossary,
  renderGlossaryGeneric,
  renderReferences,
  renderReferencesGeneric,
} from '../../scripts/lib/components.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

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

test('both glossary renderers preserve pipe-bearing technical notation', () => {
  const source = [
    '# 52. Glossário',
    '',
    '| Termo | Definição |',
    '| --- | --- |',
    '| Tamanho da entrada | Usa `|V|` vértices e `|E|` arestas |',
  ].join('\n');

  for (const html of [renderGlossary(source, 'T25'), renderGlossaryGeneric(source, 'T24')]) {
    assert.match(html, /Usa <code>\|V\|<\/code> vértices e <code>\|E\|<\/code> arestas/);
  }
});

test('both reference renderers link canonical URL forms', () => {
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

  const genericSource = body;
  for (const html of [renderReferences(body), renderReferencesGeneric(genericSource, body, 'T24')]) {
    assert.match(html, /href="https:\/\/example\.com\/direct"/);
    assert.match(html, /href="https:\/\/example\.com\/manual"/);
    assert.match(html, /href="https:\/\/example\.com\/spec"/);
    assert.match(html, /href="https:\/\/docs\.python\.org\/3\/"/);
  }
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
