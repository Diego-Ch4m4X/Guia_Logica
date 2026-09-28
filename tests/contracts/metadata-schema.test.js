import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument, topicIdFromFilename } from '../../scripts/lib/metadata.js';
import { validateTopicMetadata } from '../../scripts/lib/metadata-schema.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, 'content/topics');

async function topic(number) {
  const prefix = `T${String(number).padStart(2, '0')}_`;
  const filename = (await readdir(directory)).find(name => name.startsWith(prefix));
  assert.ok(filename, `${prefix} fixture missing`);
  const { metadata } = parseDocument(await readFile(path.join(directory, filename), 'utf8'));
  return { metadata, filename, fileVersion:topicIdFromFilename(filename).version };
}

function valid(metadata, context) {
  assert.deepEqual(validateTopicMetadata(metadata, context), []);
}

function invalid(metadata, context, field) {
  const errors = validateTopicMetadata(metadata, context);
  assert.ok(errors.some(message => message.includes(`${context.filename}: ${field}:`)), `${field}: ${errors.join('; ')}`);
}

test('all 35 canonical topics satisfy the metadata schema without mutation', async () => {
  const sources = await Promise.all(Array.from({ length:35 }, (_,index) => topic(index + 1)));
  for (const { metadata, filename, fileVersion } of sources) valid(metadata, { filename, fileVersion });
  const categories = Object.groupBy(sources, ({ metadata }) => metadata.category);
  assert.deepEqual(Object.values(categories).map(items => items.length).sort((a,b) => a-b), [11,12,12]);
});

test('empty tags, absent editorial fields and historical contract sources remain valid', async () => {
  assert.deepEqual(parseDocument('---\ntags: []\n---\n').metadata.tags, []);
  assert.deepEqual(parseDocument('---\r\ntags: []\r\n---\r\n').metadata.tags, []);
  const early = await topic(1);
  const middle = await topic(7);
  const late = await topic(25);
  assert.ok(!Object.hasOwn(early.metadata, 'editorial_status'));
  assert.ok(!Object.hasOwn(early.metadata, 'node_classification'));
  valid({ ...early.metadata, tags:[] }, early);
  for (const fixture of [early, middle, late]) valid(fixture.metadata, fixture);
  assert.deepEqual([early,middle,late].map(item => item.metadata.contract.source.match(/v(\d+\.\d+\.\d+)\.md$/)?.[1]), ['1.10.0','1.11.0','1.12.0']);
});

test('explicit node classifications are valid without classification inheritance or a rigid enum', async () => {
  const fixture = await topic(13);
  const metadata = structuredClone(fixture.metadata);
  metadata.taxonomy.classification = 'descrição geral';
  metadata.node_classification = { [metadata.taxonomy.nodes[0]]:'[E — didático]' };
  valid(metadata, fixture);
  delete metadata.node_classification;
  valid(metadata, fixture);
  assert.ok(!Object.hasOwn(metadata, 'node_classification'));
});

test('unknown, missing and mistyped fields fail with field and filename context', async () => {
  const fixture = await topic(1);
  const cases = [
    ['title', metadata => { delete metadata.title; }],
    ['langauges', metadata => { metadata.langauges = {}; }],
    ['title', metadata => { metadata.title = 42; }],
    ['tags', metadata => { metadata.tags = [true]; }],
    ['difficulty', metadata => { metadata.difficulty = 'fundamental'; }],
    ['status', metadata => { metadata.status = ''; }],
    ['editorial_status', metadata => { metadata.editorial_status = null; }],
    ['status_scope', metadata => { metadata.status_scope = []; }],
    ['learning_architecture', metadata => { metadata.learning_architecture = 1; }],
    ['contract.sources', metadata => { metadata.contract.sources = 'typo'; }],
    ['contract.source', metadata => { metadata.contract.source = ''; }],
    ['taxonomy.node', metadata => { metadata.taxonomy.node = '1'; }],
    ['taxonomy.nodes', metadata => { metadata.taxonomy.nodes = ['invalid-node']; }],
    ['taxonomy.nodes', metadata => { metadata.taxonomy.nodes = '1.1'; }],
    ['taxonomy.classification', metadata => { metadata.taxonomy.classification = ''; }],
    ['languages.java', metadata => { delete metadata.languages.java; }],
    ['languages.shell', metadata => { metadata.languages.shell = true; }],
    ['languages.python', metadata => { metadata.languages.python = 'true'; }],
    ['node_classification.99', metadata => { metadata.node_classification = { '99':'[D]' }; }],
    ['node_classification.1', metadata => { metadata.node_classification = { '1':'' }; }],
    ['created', metadata => { metadata.created = '2026-02-30'; }],
    ['last_reviewed', metadata => { metadata.last_reviewed = '26-09-2026'; }],
    ['category', metadata => { metadata.category = 'Categoria nova'; }],
    ['version', metadata => { metadata.version = 'v1.2'; }],
    ['version', metadata => { metadata.version = '9.9.9'; }],
  ];
  for (const [field, mutate] of cases) {
    const metadata = structuredClone(fixture.metadata);
    mutate(metadata);
    invalid(metadata, fixture, field);
  }
});
