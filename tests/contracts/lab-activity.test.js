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

test('semantic LAB wrapper renders compact, sectioned and structured variants intentionally', () => {
  const compact = wrapLabsSemantic([
    '<h2 id="lab-compacto">🧪 Laboratório 1 — Compacto</h2>',
    '<p>Executar a tarefa e registrar o resultado.</p>',
    '<h2 id="seguinte">Seção seguinte</h2>',
  ].join(''), 'T01');
  assert.equal((compact.match(/data-activity="lab"/g) || []).length, 1);
  assert.match(compact, /class="learning-activity lab-activity lab-activity--compact"/);
  assert.match(compact, /data-lab-layout="compact"/);
  assert.match(compact, /class="lab-compact-body"/);
  assert.match(compact, /<h2 id="seguinte">Seção seguinte<\/h2>/);

  const sectioned = wrapLabsSemantic([
    '<h2 id="lab-secionado">🧪 Laboratório 2 — Seções próprias</h2>',
    '<h3 id="objetivo">Objetivo</h3><p>Praticar.</p>',
    '<h3 id="parte-a">Parte A</h3><p>Conteúdo próprio.</p>',
    '<hr><a aria-hidden="true" class="anchor-alias" id="-seguinte"></a>',
    '<h2 id="seguinte">Seção seguinte</h2>',
  ].join(''), 'T01');
  assert.equal((sectioned.match(/data-activity="lab"/g) || []).length, 1);
  assert.match(sectioned, /class="learning-activity lab-activity lab-activity--sectioned"/);
  assert.match(sectioned, /data-lab-layout="sectioned"/);
  assert.match(sectioned, /class="lab-section-list"/);
  assert.match(sectioned, /data-lab-part="objective"/);
  assert.doesNotMatch(sectioned, /lab-section--semantic/, 'semantic sections use data-lab-part instead of an unstyled marker class');
  assert.match(sectioned, /data-lab-section="custom"/);
  assert.match(sectioned, /id="parte-a"/);
  assert.doesNotMatch(sectioned, /class="lab-compact-body"/);
  assert.doesNotMatch(sectioned, /class="lab-summary-grid"/);
  assert.match(sectioned, /<\/section><\/div><\/div><hr><a aria-hidden="true" class="anchor-alias" id="-seguinte"><\/a><h2 id="seguinte">/);
  assert.match(sectioned, /<h2 id="seguinte">Seção seguinte<\/h2>/);

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
  assert.doesNotMatch(structured, /data-lab-layout=/);
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

test('every non-structured LAB has an explicit compact or sectioned presentation', async () => {
  let totalLabs = 0;
  let totalStructured = 0;
  let totalSectioned = 0;
  let totalCompact = 0;

  for (let number = 1; number <= 35; number += 1) {
    const id = `t${String(number).padStart(2, '0')}`;
    const html = await readFile(path.join(ROOT, `dist/topicos/${id}/index.html`), 'utf8');
    const labs = (html.match(/data-activity="lab"/g) || []).length;
    const sectioned = (html.match(/data-lab-layout="sectioned"/g) || []).length;
    const compact = (html.match(/data-lab-layout="compact"/g) || []).length;
    const structured = labs - sectioned - compact;

    assert.ok(structured >= 0, `${id}: LAB layout accounting underflow`);
    assert.equal(labs, structured + sectioned + compact, `${id}: LAB layout accounting mismatch`);
    assert.doesNotMatch(html, /lab-activity--sectioned[^"\n]*lab-activity--compact|lab-activity--compact[^"\n]*lab-activity--sectioned/, `${id}: ambiguous LAB layout class`);

    totalLabs += labs;
    totalStructured += structured;
    totalSectioned += sectioned;
    totalCompact += compact;
  }

  assert.equal(totalLabs, 302, 'canonical LAB corpus changed unexpectedly');
  assert.equal(totalStructured, 159, 'previously structured LABs must remain structured');
  assert.equal(totalSectioned + totalCompact, 143, 'non-structured LAB baseline changed unexpectedly');

  const t01 = await readFile(path.join(ROOT, 'dist/topicos/t01/index.html'), 'utf8');
  assert.equal((t01.match(/data-lab-layout="sectioned"/g) || []).length, 3, 'T01 custom-section LABs must use the sectioned presentation');

  const t25 = await readFile(path.join(ROOT, 'dist/topicos/t25/index.html'), 'utf8');
  assert.equal((t25.match(/data-activity="lab"/g) || []).length, 8);
  assert.doesNotMatch(t25, /data-lab-layout=/, 'T25 structured LAB baseline must remain on the approved layout');
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

test('T25 LAB 2, 3 and 6 content compatibility remains covered by the golden', async () => {
  const components = await readFile(path.join(ROOT, 'scripts/lib/components.js'), 'utf8');
  const actual = await readFile(path.join(ROOT, 'dist/topicos/t25/index.html'), 'utf8');
  const golden = await readFile(path.join(ROOT, 'tests/fixtures/t25/golden.html'), 'utf8');
  const codeBlocks = html => [...html.matchAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g)]
    .map(match => match[1].replaceAll('&#x27;', "'").replaceAll('&#39;', "'"));
  const actualBlocks = codeBlocks(actual);
  const goldenBlocks = codeBlocks(golden);

  assert.match(components, /function applyT25LabContentCompatibility\(/);
  for (const index of [127, 128, 131]) assert.equal(actualBlocks[index], goldenBlocks[index], `T25 code block ${index + 1}`);
});

test('structured LAB markup exposes stable semantic hooks for adaptive summary layout', () => {
  const asymmetric = wrapLabsSemantic([
    '<h1 class="chapter-title" id="lab-asymmetric">🧪 LAB 1 — Assimétrico</h1>',
    '<h2 id="objective-asymmetric">Objetivo</h2><p>Objetivo curto.</p>',
    '<h2 id="prerequisites-asymmetric">Pré-requisitos</h2><p>Nenhum.</p>',
    '<h2 id="state-asymmetric">Estado inicial</h2><p>Casos:</p><blockquote><p>A</p></blockquote><p>B:</p><blockquote><p>B</p></blockquote><p>C:</p><blockquote><p>C</p></blockquote>',
    '<h2 id="task-asymmetric">Tarefa</h2><p>Resolver.</p>',
    '<h2 id="procedure-asymmetric">Procedimento</h2><p>Executar.</p>',
    '<h2 id="observe-asymmetric">O que observar</h2><p>Saída.</p>',
    '<h2 id="tests-asymmetric">Testes</h2><p>Casos.</p>',
    '<h2 id="evidence-asymmetric">Evidência</h2><pre><code>resultado</code></pre>',
    '<h2 id="transfer-asymmetric">Variação / transferência</h2><p>Variar.</p>',
  ].join(''), 'T01');

  assert.match(asymmetric, /class="lab-summary-grid"/);
  assert.match(asymmetric, /data-lab-part="state"/);
  assert.match(asymmetric, /data-lab-part="task"/);
  assert.match(asymmetric, /data-lab-part="evidence"/);
  assert.match(asymmetric, /data-lab-part="transfer"/);
  assert.doesNotMatch(asymmetric, /data-lab-layout=/, 'adaptive structured LABs must not be reclassified');

  const balanced = wrapLabsSemantic([
    '<h1 class="chapter-title" id="lab-balanced">🧪 LAB 2 — Equilibrado</h1>',
    '<h2 id="objective-balanced">Objetivo</h2><p>A</p>',
    '<h2 id="prerequisites-balanced">Pré-requisitos</h2><p>B</p>',
    '<h2 id="state-balanced">Estado inicial</h2><p>C</p>',
    '<h2 id="task-balanced">Tarefa</h2><p>D</p>',
    '<h2 id="procedure-balanced">Procedimento</h2><p>E</p>',
    '<h2 id="observe-balanced">O que observar</h2><p>F</p>',
    '<h2 id="tests-balanced">Testes</h2><p>G</p>',
    '<h2 id="explanation-balanced">Explicação</h2><p>H</p>',
    '<h2 id="transfer-balanced">Variação / transferência</h2><p>I</p>',
    '<h2 id="cleanup-balanced">Limpeza</h2><p>J</p>',
  ].join(''), 'T25');

  assert.match(balanced, /class="lab-summary-grid"/);
  assert.match(balanced, /class="lab-validation-grid"/);
  assert.match(balanced, /class="lab-reflection-grid"/);
  assert.doesNotMatch(balanced, /data-lab-layout=/, 'balanced T25-like LABs must remain structured');
});
