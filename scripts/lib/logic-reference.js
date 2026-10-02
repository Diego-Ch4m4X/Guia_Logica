import { escapeAttribute, escapeHtml } from './html.js';

const LANGUAGES = new Set(['pt-BR', 'en']);
const REPRESENTATIONS = new Set(['boolean', 'bit']);
const OPERATIONS = new Set(['and', 'or', 'not', 'xor']);
const ALLOWED_KEYS = new Set(['language', 'representation', 'operations', 'combined']);

const OPERATION_DATA = {
  and: {
    labels:{ pt:'AND · E', en:'AND' },
    rows:[[true,true,true],[true,false,false],[false,true,false],[false,false,false]],
  },
  or: {
    labels:{ pt:'OR · OU', en:'OR' },
    rows:[[true,true,true],[true,false,true],[false,true,true],[false,false,false]],
  },
  not: {
    labels:{ pt:'NOT · NÃO', en:'NOT' },
    rows:[[true,false],[false,true]],
  },
  xor: {
    labels:{ pt:'XOR · OU exclusivo', en:'XOR' },
    rows:[[true,true,false],[true,false,true],[false,true,true],[false,false,false]],
  },
};

const COPY = {
  result:{ pt:'Resultado', en:'Result' },
  language:{ pt:'Idioma', en:'Language' },
  representation:{ pt:'Representação', en:'Representation' },
};

function fail(message) {
  throw new Error(`logic-reference: ${message}`);
}

export function parseLogicReference(source) {
  let config;
  try {
    config = JSON.parse(String(source).trim());
  } catch (error) {
    fail(`JSON inválido (${error.message})`);
  }
  if (!config || typeof config !== 'object' || Array.isArray(config)) fail('a configuração deve ser um objeto JSON');
  for (const key of Object.keys(config)) {
    if (!ALLOWED_KEYS.has(key)) fail(`campo desconhecido: ${key}`);
  }
  if (!LANGUAGES.has(config.language)) fail(`language deve ser "pt-BR" ou "en"; recebido: ${String(config.language)}`);
  if (!REPRESENTATIONS.has(config.representation)) fail(`representation deve ser "boolean" ou "bit"; recebido: ${String(config.representation)}`);
  if (!Array.isArray(config.operations) || config.operations.length === 0) fail('operations deve ser uma lista não vazia');
  const unique = new Set();
  for (const operation of config.operations) {
    if (!OPERATIONS.has(operation)) fail(`operação não suportada: ${String(operation)}`);
    if (unique.has(operation)) fail(`operação duplicada: ${operation}`);
    unique.add(operation);
  }
  if (typeof config.combined !== 'boolean') fail('combined deve ser boolean');
  return {
    language:config.language,
    representation:config.representation,
    operations:[...config.operations],
    combined:config.combined,
  };
}

function localizedCopy(pt, en, language) {
  return language === 'en' ? en : pt;
}

function truthLabel(value, language, representation) {
  if (representation === 'bit') return value ? '1' : '0';
  if (language === 'en') return value ? 'True' : 'False';
  return value ? 'Verdadeiro' : 'Falso';
}

function dynamicCopy(pt, en, language, className = '') {
  const classAttr = className ? ` class="${escapeAttribute(className)}"` : '';
  return `<span${classAttr} data-logic-copy="" data-pt="${escapeAttribute(pt)}" data-en="${escapeAttribute(en)}">${escapeHtml(localizedCopy(pt, en, language))}</span>`;
}

function truthCell(value, language, representation, tag = 'td') {
  const booleanPt = value ? 'Verdadeiro' : 'Falso';
  const booleanEn = value ? 'True' : 'False';
  const bit = value ? '1' : '0';
  return `<${tag} data-logic-value="" data-boolean-pt="${booleanPt}" data-boolean-en="${booleanEn}" data-bit="${bit}">${truthLabel(value, language, representation)}</${tag}>`;
}

function operationTable(operation, config) {
  const meta = OPERATION_DATA[operation];
  const isUnary = operation === 'not';
  const heading = dynamicCopy(meta.labels.pt, meta.labels.en, config.language, 'logic-operation-title');
  const header = isUnary
    ? `<tr><th scope="col">A</th><th scope="col">${dynamicCopy(COPY.result.pt, COPY.result.en, config.language)}</th></tr>`
    : `<tr><th scope="col">A</th><th scope="col">B</th><th scope="col">${dynamicCopy(COPY.result.pt, COPY.result.en, config.language)}</th></tr>`;
  const rows = meta.rows.map(values => {
    const inputCount = isUnary ? 1 : 2;
    const inputs = values.slice(0, inputCount).map(value => truthCell(value, config.language, config.representation)).join('');
    const result = truthCell(values[values.length - 1], config.language, config.representation);
    return `<tr>${inputs}${result}</tr>`;
  }).join('');
  const caption = dynamicCopy(meta.labels.pt, meta.labels.en, config.language);
  return `<article class="logic-operation" data-logic-operation="${operation}"><div class="logic-operation-head" role="heading" aria-level="5">${heading}</div><div class="logic-table-wrap"><table><caption class="sr-only">${caption}</caption><thead>${header}</thead><tbody>${rows}</tbody></table></div></article>`;
}

export function renderLogicReference(source) {
  const config = parseLogicReference(source);
  const languagePressed = config.language;
  const representationPressed = config.representation;
  const controls = `<div class="logic-reference-controls" data-logic-controls="" hidden=""><div class="logic-control-group" role="group" aria-label="Idioma / Language"><span class="logic-control-label">${dynamicCopy(COPY.language.pt, COPY.language.en, config.language)}</span><div class="logic-control-actions"><button class="logic-toggle" type="button" data-logic-language-choice="pt-BR" aria-pressed="${languagePressed === 'pt-BR'}">Português</button><button class="logic-toggle" type="button" data-logic-language-choice="en" aria-pressed="${languagePressed === 'en'}">English</button></div></div><div class="logic-control-group" role="group" aria-label="Representação / Representation"><span class="logic-control-label">${dynamicCopy(COPY.representation.pt, COPY.representation.en, config.language)}</span><div class="logic-control-actions"><button class="logic-toggle" type="button" data-logic-representation-choice="boolean" aria-pressed="${representationPressed === 'boolean'}">${dynamicCopy('Booleano', 'Boolean', config.language)}</button><button class="logic-toggle" type="button" data-logic-representation-choice="bit" aria-pressed="${representationPressed === 'bit'}">Bit</button></div></div></div>`;
  const operations = config.operations.map(operation => operationTable(operation, config)).join('');
  return `<section class="logic-reference" data-logic-reference="" lang="${escapeAttribute(config.language)}" data-language="${escapeAttribute(config.language)}" data-representation="${escapeAttribute(config.representation)}" data-combined="${config.combined}">${controls}<div class="logic-reference-grid">${operations}</div><p class="sr-only" data-logic-status="" aria-live="polite"></p></section>`;
}
