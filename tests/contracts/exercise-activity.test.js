import test from 'node:test';
import assert from 'node:assert/strict';

import { parseExerciseRootHeading, wrapExercisesSemantic } from '../../scripts/lib/components.js';

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
