const REQUIRED = [
  'title', 'slug', 'description', 'category', 'status', 'version',
  'contract', 'taxonomy', 'languages', 'difficulty', 'tags',
  'created', 'last_reviewed',
];
const OPTIONAL = ['node_classification', 'editorial_status', 'learning_architecture', 'status_scope'];
const CATEGORIES = new Set([
  'Lógica de Programação',
  'Fundamentos de Programação',
  'Algoritmos e Estruturas de Dados',
]);
const LANGUAGES = ['python', 'javascript', 'java', 'bash'];

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

function validIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function validateTopicMetadata(metadata, { filename = 'metadata', fileVersion } = {}) {
  const errors = [];
  const error = (field, cause) => errors.push(`${filename}: ${field}: ${cause}`);
  const closed = (value, field, allowed) => {
    if (!object(value)) { error(field, 'must be an object'); return false; }
    for (const key of Object.keys(value)) if (!allowed.includes(key)) error(`${field}.${key}`, 'unknown field');
    return true;
  };

  if (!object(metadata)) { error('front matter', 'must be an object'); return errors; }
  for (const key of REQUIRED) if (!Object.hasOwn(metadata, key)) error(key, 'required field missing');
  for (const key of Object.keys(metadata)) {
    if (![...REQUIRED, ...OPTIONAL].includes(key)) error(key, 'unknown field');
  }

  for (const key of ['title', 'description', 'status', 'version']) {
    if (!nonempty(metadata[key])) error(key, 'must be a non-empty string');
  }
  for (const key of OPTIONAL.filter(key => key !== 'node_classification')) {
    if (Object.hasOwn(metadata, key) && !nonempty(metadata[key])) error(key, 'must be a non-empty string');
  }
  if (typeof metadata.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.slug)) {
    error('slug', 'must use lowercase hyphenated words');
  }
  if (!CATEGORIES.has(metadata.category)) error('category', 'unknown category');
  if (typeof metadata.version === 'string' && !/^\d+\.\d+\.\d+$/.test(metadata.version)) {
    error('version', 'must be numeric SemVer');
  }
  if (fileVersion && metadata.version !== fileVersion) error('version', `does not match filename version ${fileVersion}`);

  if (closed(metadata.contract, 'contract', ['source']) && !nonempty(metadata.contract.source)) {
    error('contract.source', 'must be a non-empty string');
  }
  if (closed(metadata.taxonomy, 'taxonomy', ['source', 'nodes', 'classification'])) {
    if (!nonempty(metadata.taxonomy.source)) error('taxonomy.source', 'must be a non-empty string');
    if (Object.hasOwn(metadata.taxonomy, 'classification') && !nonempty(metadata.taxonomy.classification)) {
      error('taxonomy.classification', 'must be a non-empty string');
    }
    const nodes = metadata.taxonomy.nodes;
    if (!Array.isArray(nodes) || nodes.length === 0 || nodes.some(node => typeof node !== 'string' || !/^\d+(?:\.\d+)*$/.test(node))) {
      error('taxonomy.nodes', 'must be a non-empty array of numeric node paths');
    } else if (new Set(nodes).size !== nodes.length) {
      error('taxonomy.nodes', 'must not contain duplicates');
    }
  }
  if (closed(metadata.languages, 'languages', LANGUAGES)) {
    for (const key of LANGUAGES) {
      if (!Object.hasOwn(metadata.languages, key)) error(`languages.${key}`, 'required language missing');
      else if (typeof metadata.languages[key] !== 'boolean') error(`languages.${key}`, 'must be boolean');
    }
  }
  if (!Array.isArray(metadata.difficulty) || metadata.difficulty.length === 0 || metadata.difficulty.some(item => !nonempty(item))) {
    error('difficulty', 'must be a non-empty array of strings');
  }
  if (!Array.isArray(metadata.tags) || metadata.tags.some(tag => !nonempty(tag))) {
    error('tags', 'must be an array of non-empty strings');
  }
  for (const key of ['created', 'last_reviewed']) {
    if (!validIsoDate(metadata[key])) error(key, 'must be a valid YYYY-MM-DD date');
  }
  if (Object.hasOwn(metadata, 'node_classification')) {
    const classification = metadata.node_classification;
    if (!object(classification)) error('node_classification', 'must be a node-to-string map');
    else {
      const nodes = new Set(Array.isArray(metadata.taxonomy?.nodes) ? metadata.taxonomy.nodes : []);
      for (const [node, value] of Object.entries(classification)) {
        if (!nodes.has(node)) error(`node_classification.${node}`, 'node is absent from taxonomy.nodes');
        if (!nonempty(value)) error(`node_classification.${node}`, 'must be a non-empty string');
      }
    }
  }
  return errors;
}
