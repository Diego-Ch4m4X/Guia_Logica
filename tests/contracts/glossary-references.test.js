import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  publicationSlicesGeneric,
  renderGlossaryGeneric,
  renderReferencesGeneric,
} from '../../scripts/lib/components.js';
import { splitTableRow } from '../../scripts/lib/markdown.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function topLevelSection(source, label) {
  const match = source.match(new RegExp(`^# (\\d+)\\. ${label}\\s*$`, 'm'));
  if (!match) return null;
  const start = match.index;
  const after = start + match[0].length;
  const tail = source.slice(after);
  const next = tail.search(/^# /m);
  const end = next < 0 ? source.length : after + next;
  return { number:match[1], text:source.slice(start, end) };
}

function glossaryRowCount(source) {
  const section = topLevelSection(source, 'Glossário');
  if (!section) return 0;
  const rows = section.text.split('\n')
    .filter(line => /^\|/.test(line))
    .slice(2)
    .map(splitTableRow)
    .filter(row => row.length >= 2)
    .length;
  if (rows) return rows;
  return [...section.text.matchAll(new RegExp(`^## ${section.number}\\.\\d+\\s+`, 'gm'))].length;
}

function referenceCardCount(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let referenceNumber = '';
  let inReferences = false;
  let subsection = 0;
  let total = 0;

  for (const line of lines) {
    if (!inReferences) {
      const root = line.match(/^# (\d+)\. (.+?)\s*$/);
      const title = root?.[2].normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR');
      if (title === 'referencias') {
        referenceNumber = root[1];
        inReferences = true;
      }
      continue;
    }
    if (/^# /.test(line)) break;

    if (line.startsWith('## ')) {
      const heading = line.match(new RegExp(`^## ${referenceNumber}\\.(\\d+)\\s+`));
      subsection = heading && !/^## \d+\.\d+\s+Estado de QA\b/i.test(line)
        ? Number(heading[1])
        : 0;
    } else if (subsection >= 2 && subsection <= 6 && /^\s*-\s+.+$/.test(line)) {
      total += 1;
    }
  }
  return total;
}

test('unified glossary renderer preserves compact and generic anchor contracts', () => {
  const compact = [
    '# 52. Glossário',
    '',
    '| Termo | Definição |',
    '| --- | --- |',
    '| Array | sequência |',
    '| Busca | procura |',
  ].join('\n');
  const regular = compact.replace('# 52. Glossário', '# 23. Glossário')
    + '\n\n[↑ Voltar ao índice](#índice)\n';

  const t25 = renderGlossaryGeneric(compact, 'T25');
  assert.match(t25, /id="gloss-t25-a"/);
  assert.doesNotMatch(t25, /id="gloss-t25-letter-a"/);
  assert.doesNotMatch(t25, /↑ Voltar ao índice/);

  const t01 = renderGlossaryGeneric(regular, 'T01');
  assert.match(t01, /id="gloss-t01-letter-a"/);
  assert.match(t01, /↑ Voltar ao índice/);
});

test('unified glossary renderer de-duplicates repeated term IDs without losing entries', () => {
  const source = [
    '# 10. Glossário',
    '',
    '| Termo | Definição |',
    '| --- | --- |',
    '| Map | primeira |',
    '| Map | segunda |',
    '',
    '[↑ Voltar ao índice](#índice)',
  ].join('\n');
  const html = renderGlossaryGeneric(source, 'T99');
  assert.match(html, /id="gloss-t99-map"/);
  assert.match(html, /id="gloss-t99-map-1"/);
  assert.equal((html.match(/class="glossary-item"/g) || []).length, 2);
});

test('unified reference renderer normalizes bibliography semantically and links canonical URL forms', () => {
  const source = [
    '# 55. Referências',
    '',
    '## 55.2 Literatura local efetivamente consultada',
    '',
    '- Livro sem URL',
    '- Manual: <https://example.com/manual>;',
    '',
    '## 55.3 Python — documentação oficial',
    '',
    '- [Python](https://docs.python.org/3/)',
  ].join('\n');
  const html = renderReferencesGeneric(source, '**Fim — teste**', 'T99');
  assert.match(html, /<h2 id="bibliografia">Bibliografia<\/h2>/);
  assert.match(html, /class="reference-card no-link"/);
  assert.match(html, /href="https:\/\/example\.com\/manual"/);
  assert.match(html, /href="https:\/\/docs\.python\.org\/3\/"/);
});

test('reference renderer excludes QA evidence headings from reference sections', () => {
  const source = [
    '# 49. Referências',
    '',
    '## 49.2 Documentação oficial',
    '- Manual: <https://example.com/manual>',
    '',
    '## 49.5 Estado de QA e evidência da revisão',
    '- PASS: validação executada',
  ].join('\n');
  const html = renderReferencesGeneric(source, '', 'T20');

  assert.equal((html.match(/class="reference-section"/g) || []).length, 1);
  assert.match(html, /id="documentação-oficial"/);
  assert.doesNotMatch(html, /Estado de QA/);
});

test('T25 publication compatibility now supplies the canonical references section to the unified renderer', () => {
  const source = [
    '# 1. Núcleo',
    '',
    '- [52. Glossário](#52-glossário)',
    '- [APÊNDICES — auditoria, referências, QA e histórico](#apendices)',
    '',
    '# 52. Glossário',
    '',
    '| Termo | Definição |',
    '| --- | --- |',
    '| ADT | contrato |',
    '',
    '[↑ Voltar ao índice](#índice)',
    '',
    '> fechamento',
    '',
    '<a id="apendices"></a>',
    '',
    '# APÊNDICES — Auditoria, referências, QA e histórico',
    '',
    '# 55. Referências',
    '',
    '## 55.2 Literatura local efetivamente consultada',
    '',
    '- Livro',
    '',
    '## 55.3 Python — documentação oficial',
    '',
    '- <https://docs.python.org/3/>',
    '',
    '# 56. QA e evidências',
  ].join('\n');

  const slices = publicationSlicesGeneric(source, 'T25');
  assert.match(slices.glossarySource, /^# 52\. Glossário/m);
  assert.doesNotMatch(slices.glossarySource, /↑ Voltar ao índice/);
  assert.match(slices.postGlossary, /↑ Voltar ao índice/);
  assert.match(slices.referencesSource, /^# 55\. Referências/m);
  assert.doesNotMatch(slices.referencesSource, /^# 56\./m);
});

test('canonical T01-T35 glossary rows and reference cards have source/render parity', async () => {
  const dir = path.join(ROOT, 'content/topics');
  const names = (await readdir(dir)).filter(name => name.endsWith('.md')).sort();
  assert.equal(names.length, 35);

  for (const name of names) {
    const source = await readFile(path.join(dir, name), 'utf8');
    const id = name.match(/^(T\d{2})_/i)?.[1]?.toLowerCase();
    assert.ok(id, `topic id not found in ${name}`);

    const expectedGlossary = glossaryRowCount(source);
    const expectedReferences = referenceCardCount(source);
    assert.ok(expectedGlossary > 0, `${id}: glossary not found`);
    assert.ok(expectedReferences > 0, `${id}: references not found`);

    const html = await readFile(path.join(ROOT, `dist/topicos/${id}/index.html`), 'utf8');
    assert.equal(
      (html.match(/class="glossary-item"/g) || []).length,
      expectedGlossary,
      `${id}: glossary source/render mismatch`,
    );
    assert.equal(
      (html.match(/class="reference-card(?:\s|")/g) || []).length,
      expectedReferences,
      `${id}: reference source/render mismatch`,
    );
    assert.equal((html.match(/id="referências"/g) || []).length, 1, `${id}: references root`);
  }
});

test('T25 uses unified glossary/reference renderers while legacy renderers stay inactive for P05 cleanup', async () => {
  const source = await readFile(path.join(ROOT, 'scripts/lib/components.js'), 'utf8');
  assert.doesNotMatch(source, /return renderGlossary\(glossarySource,\s*topicId\)/);
  assert.doesNotMatch(source, /return renderReferences\(fullBody\)/);
  assert.equal((source.match(/export function renderGlossary\(/g) || []).length, 1);
  assert.equal((source.match(/export function renderReferences\(/g) || []).length, 1);
});
