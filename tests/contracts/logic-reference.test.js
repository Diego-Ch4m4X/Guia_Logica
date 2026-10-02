import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLogicReference, renderLogicReference } from '../../scripts/lib/logic-reference.js';
import { renderMarkdown } from '../../scripts/lib/markdown.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = relative => readFile(path.join(root, relative), 'utf8');

const canonical = JSON.stringify({
  language:'pt-BR',
  representation:'boolean',
  operations:['and','or','not','xor'],
  combined:true,
});

test('logic-reference parser accepts the canonical contract and rejects drift', () => {
  assert.deepEqual(parseLogicReference(canonical), {
    language:'pt-BR', representation:'boolean', operations:['and','or','not','xor'], combined:true,
  });
  for (const source of [
    '{',
    JSON.stringify({ language:'pt', representation:'boolean', operations:['and'], combined:true }),
    JSON.stringify({ language:'pt-BR', representation:'bits', operations:['and'], combined:true }),
    JSON.stringify({ language:'pt-BR', representation:'boolean', operations:['nand'], combined:true }),
    JSON.stringify({ language:'pt-BR', representation:'boolean', operations:['and','and'], combined:true }),
    JSON.stringify({ language:'pt-BR', representation:'boolean', operations:['and'], combined:'true' }),
    JSON.stringify({ language:'pt-BR', representation:'boolean', operations:['and'], combined:true, topic:'T05' }),
  ]) {
    assert.throws(() => parseLogicReference(source), /logic-reference:/);
  }
});

test('logic-reference renders a static Portuguese Boolean fallback with no JavaScript dependency', () => {
  const html = renderLogicReference(canonical);
  assert.match(html, /class="logic-reference"/);
  assert.match(html, /lang="pt-BR" data-language="pt-BR"/);
  assert.match(html, /role="heading" aria-level="5"/);
  assert.match(html, /data-representation="boolean"/);
  assert.match(html, /data-logic-controls="" hidden=""/);
  assert.equal((html.match(/class="logic-operation"/g) || []).length, 4);
  assert.match(html, />Verdadeiro</);
  assert.match(html, />Falso</);
  assert.match(html, /data-bit="1"/);
  assert.match(html, /data-boolean-en="True"/);
  assert.match(html, /AND · E/);
  assert.match(html, /XOR · OU exclusivo/);
  assert.doesNotMatch(html, /<script\b/);
});



test('logic-reference keeps the static fallback language semantically declared', () => {
  const english = JSON.stringify({ language:'en', representation:'boolean', operations:['not'], combined:false });
  const html = renderLogicReference(english);
  assert.match(html, /lang="en" data-language="en"/);
  assert.match(html, />True</);
  assert.match(html, />False</);
  assert.doesNotMatch(html, />Verdadeiro</);
});

test('Markdown renderer consumes logic-reference as a component instead of a code block', () => {
  const markdown = `#### Consulta\n\n\`\`\`logic-reference\n${canonical}\n\`\`\`\n`;
  const rendered = renderMarkdown(markdown, { skipFirstH1:false }).html;
  assert.match(rendered, /data-logic-reference=""/);
  assert.doesNotMatch(rendered, /data-language="logic-reference"/);
  assert.doesNotMatch(rendered, /<pre><code>\{&quot;language&quot;/);
});

test('published T05 materializes exactly one generic logic reference with all four operations', async () => {
  const sourceFiles = (await readdir(path.join(root, 'content/topics'))).filter(name => /^T05_/.test(name));
  assert.deepEqual(sourceFiles, ['T05_EXPRESSOES_E_OPERADORES_v0.4.9.md']);
  const source = await read(`content/topics/${sourceFiles[0]}`);
  assert.equal((source.match(/```logic-reference/g) || []).length, 1);

  const page = await read('dist/topicos/t05/index.html');
  assert.equal((page.match(/data-logic-reference=""/g) || []).length, 1);
  for (const operation of ['and','or','not','xor']) {
    assert.equal((page.match(new RegExp(`data-logic-operation="${operation}"`, 'g')) || []).length, 1, operation);
  }
  assert.match(page, /data-logic-controls="" hidden=""/);
  assert.match(page, /assets\/css\/logic-reference\.css\?v=/);
  assert.match(page, /assets\/js\/logic-reference\.js\?v=/);
  const t01 = await read('dist/topicos/t01/index.html');
  assert.doesNotMatch(t01, /assets\/(?:css|js)\/logic-reference\.(?:css|js)\?v=/);
});

test('logic-reference implementation is generic and capability-loaded', async () => {
  const renderer = await read('scripts/lib/logic-reference.js');
  const runtime = await read('src/assets/js/logic-reference.js');
  const build = await read('scripts/build.js');
  const app = await read('src/assets/js/app.js');
  for (const source of [renderer, runtime]) assert.doesNotMatch(source, /\bT(?:0[1-9]|[12]\d|3[0-5])\b/i);
  const capabilityLines = build.split('\n').filter(line => line.includes('TOPIC_EXTRA_STYLE') || line.includes('TOPIC_EXTRA_SCRIPT'));
  assert.equal(capabilityLines.length, 2);
  for (const line of capabilityLines) {
    assert.match(line, /built\.html\.includes\('data-logic-reference=/);
    assert.doesNotMatch(line, /\bT(?:0[1-9]|[12]\d|3[0-5])\b/i);
  }
  assert.doesNotMatch(app, /logic-reference/);
  assert.match(runtime, /if\(typeof document!==['"]undefined['"]\)initLogicReference\(\)/);
});

test('logic-reference runtime exposes independent language and representation controls', async () => {
  const runtime = await read('src/assets/js/logic-reference.js');
  assert.match(runtime, /data-logic-language-choice/);
  assert.match(runtime, /data-logic-representation-choice/);
  assert.match(runtime, /root\.dataset\.language=/);
  assert.match(runtime, /root\.dataset\.representation=/);
  assert.match(runtime, /controls\.hidden=false/);
  assert.doesNotMatch(runtime, /innerHTML\s*=/);
});
