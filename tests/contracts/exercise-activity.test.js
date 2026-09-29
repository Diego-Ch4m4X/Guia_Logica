import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


import { parseExerciseRootHeading, wrapExercisesSemantic } from '../../scripts/lib/components.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function sourceExerciseModel(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const roots = [];
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

    const root = lines[i].match(/^#\s+(.+?)\s*$/);
    if (!root || !parseExerciseRootHeading(root[1])) continue;

    let end = lines.length;
    for (let j = i + 1; j < lines.length; j += 1) {
      if (/^#\s+/.test(lines[j])) {
        end = j;
        break;
      }
    }

    const segment = lines.slice(i + 1, end);
    const childIndexes = segment
      .map((line, index) => /^##\s+/.test(line) ? index : -1)
      .filter(index => index >= 0);
    const prefix = childIndexes.length ? segment.slice(0, childIndexes[0]) : segment;
    const prefixActivity = prefix.some(line =>
      /^\s*(?:\d+\.\s+|[-*]\s+|```|~~~|>|<details\b|\|)/.test(line),
    );

    roots.push({
      flat:childIndexes.length === 0,
      activities:childIndexes.length === 0 ? 1 : childIndexes.length + (prefixActivity ? 1 : 0),
    });
  }

  return {
    roots:roots.length,
    flat:roots.filter(root => root.flat).length,
    activities:roots.reduce((total, root) => total + root.activities, 0),
  };
}

test('semantic ExerciseSuite supports structured, flat, mixed and multiple roots', () => {
  const html = wrapExercisesSemantic([
    '<h1 class="chapter-title" id="10-exercícios">10. Exercícios</h1>',
    '<p>Introdução.</p>',
    '<h2 id="101-conceitos">10.1 Conceitos</h2><ol><li>A</li></ol>',
    '<h2 id="102-transferencia">10.2 Transferência</h2><ul><li>B</li></ul>',
    '<h1 class="chapter-title" id="11-exercícios-de-fixação">11. Exercícios de fixação</h1>',
    '<ol><li>Questão 1</li><li>Questão 2</li></ol>',
    '<h1 class="chapter-title" id="12-exercícios">12. Exercícios</h1>',
    '<ol><li>Grupo inicial</li></ol>',
    '<h2 id="diagnostico">Exercícios de diagnóstico e decisão</h2><ol><li>Diagnóstico</li></ol>',
    '<h1 class="chapter-title" id="13-evidências">13. Evidências</h1>',
  ].join(''), 'T99');

  assert.equal((html.match(/class="exercise-suite"/g) || []).length, 2);
  assert.equal((html.match(/class="exercise-suite exercise-suite--flat"/g) || []).length, 1);
  assert.equal((html.match(/data-activity="exercise"/g) || []).length, 5);
  assert.match(html, /class="exercise-suite-intro"><p>Introdução\.<\/p><\/div>/);
  assert.match(html, /class="learning-activity exercise-activity exercise-activity--group"/);
  assert.match(html, /id="13-evidências">13\. Evidências<\/h1>/);
});

test('exercise rubric styling is semantic instead of tied to section number', () => {
  const html = wrapExercisesSemantic([
    '<h1 class="chapter-title" id="7-exercícios">7. Exercícios</h1>',
    '<h2 id="79-transferencia">7.9 Transferência</h2>',
    '<blockquote><p><strong>🧭 Rubrica de autoavaliação</strong></p><ul><li>Critério</li></ul></blockquote>',
  ].join(''), 'T07');

  assert.match(html, /<blockquote class="exercise-rubric">/);
  assert.match(html, /data-exercise="7\.9"/);
});

test('parseExerciseRootHeading accepts qualified exercise root headings', () => {
  assert.equal(parseExerciseRootHeading('20. Exercícios')?.qualifier, '');
  assert.equal(parseExerciseRootHeading('44. Exercícios fundamentais')?.qualifier, 'fundamentais');
  assert.equal(parseExerciseRootHeading('45. Exercícios de transferência entre linguagens')?.qualifier, 'de transferência entre linguagens');
  assert.equal(parseExerciseRootHeading('PARTE VI — LABs, exercícios e critérios de domínio'), null);
});

test('every canonical exercise root is rendered as an ExerciseSuite in T01-T35', async () => {
  const dir = path.join(ROOT, 'content/topics');
  const names = (await readdir(dir)).filter(name => name.endsWith('.md')).sort();
  assert.equal(names.length, 35);

  for (const name of names) {
    const source = await readFile(path.join(dir, name), 'utf8');
    const expected = sourceExerciseModel(source);
    const id = name.match(/^(T\d{2})_/i)?.[1]?.toLowerCase();
    assert.ok(id, `topic id not found in ${name}`);
    assert.ok(expected.roots > 0, `${id}: expected at least one exercise root`);

    const html = await readFile(path.join(ROOT, `dist/topicos/${id}/index.html`), 'utf8');
    const suites = (html.match(/class="exercise-suite(?:\s|")/g) || []).length;
    const activities = (html.match(/data-activity="exercise"/g) || []).length;
    const flat = (html.match(/class="exercise-suite exercise-suite--flat"/g) || []).length;

    assert.equal(suites, expected.roots, `${id}: exercise root/suite count mismatch`);
    assert.equal(activities, expected.activities, `${id}: exercise source/render activity mismatch`);
    assert.equal(flat, expected.flat, `${id}: flat exercise suite count mismatch`);
  }
});

test('exercise CSS has no T25 section-number visual coupling', async () => {
  const css = await readFile(path.join(ROOT, 'src/assets/css/activities.css'), 'utf8');
  assert.doesNotMatch(css, /data-exercise\s*=\s*["']49\./);
  assert.doesNotMatch(css, /exercise-activity\[data-exercise/);
});
