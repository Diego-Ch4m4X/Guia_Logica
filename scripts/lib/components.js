import { escapeAttribute, escapeHtml } from './html.js';
import { portableBaseSlug } from './slug.js';
import { renderInline, splitTableRow } from './markdown.js';

const SEMANTIC_LAB_PARTS = new Map([
  ['objetivo', 'objective'],
  ['pré-requisitos', 'prerequisites'],
  ['estado inicial', 'state'],
  ['tarefa', 'task'],
  ['procedimento', 'procedure'],
  ['o que observar', 'observe'],
  ['testes', 'tests'],
  ['testes / autoverificação', 'tests'],
  ['explicação', 'explanation'],
  ['variação / transferência', 'transfer'],
  ['transferência', 'transfer'],
  ['limpeza', 'cleanup'],
  ['limpeza, quando aplicável', 'cleanup'],
  ['critérios de aceite', 'criteria'],
  ['evidência', 'evidence'],
]);

const LANGUAGE_TAB_META = {
  python:{ key:'python', label:'Python' },
  javascript:{ key:'javascript', label:'JavaScript' },
  java:{ key:'java', label:'Java' },
  shell:{ key:'shell', label:'Shell / GNU Bash' },
};

const LANGUAGE_CONTEXT_EXCLUSION = /(?:referencias|bibliografia|documentacao|fontes?\s+(?:oficiais|primarias)|exercicios|evidencias?\s+de\s+dominio|glossario|troubleshooting|problemas reais|historico|apendic|laboratorio|\blab\b)/i;

export function normalizeSemanticHeading(value) {
  const original = String(value ?? '').replace(/\s+/g, ' ').trim();
  const numbered = original.match(/^(\d+(?:\.\d+)*\.?)\s+(.+)$/);
  const sectionPrefix = numbered?.[1] || '';
  let semantic = (numbered?.[2] || original).trim();
  const hasLabEmoji = /^🧪\s*/u.test(semantic);
  if (hasLabEmoji) semantic = semantic.replace(/^🧪\s*/u, '').trim();
  return { original, sectionPrefix, semantic, hasLabEmoji };
}

export function parseLabHeading(value) {
  const normalized = normalizeSemanticHeading(value);
  const match = normalized.semantic.match(/^(LAB|Laboratório)\s+(\d+)\s+—\s+(.+)$/iu);
  if (!match) return null;
  return {
    ...normalized,
    kind: 'lab',
    label: match[1],
    activityIndex: Number(match[2]),
    title: match[3].trim(),
  };
}

export function parseExerciseRootHeading(value) {
  const normalized = normalizeSemanticHeading(value);
  const match = normalized.semantic.match(/^Exercícios(?:\s+(.+))?$/iu);
  if (!match) return null;
  return {
    ...normalized,
    kind: 'exercises',
    qualifier: (match[1] || '').trim(),
  };
}

export function classifyLabPartHeading(value) {
  const { semantic } = normalizeSemanticHeading(value);
  return SEMANTIC_LAB_PARTS.get(semantic.toLocaleLowerCase('pt-BR')) || null;
}

export function classifyLanguageHeading(value) {
  const { semantic } = normalizeSemanticHeading(value);
  const plain = semantic.replace(/`/g, '').trim();
  if (/^Python(?:$|\s|[—:/])/iu.test(plain)) return 'python';
  if (/^(?:JavaScript|ECMAScript)(?:$|\s|[—:/])/iu.test(plain)) return 'javascript';
  if (/^Java(?:$|\s|[—:/])/iu.test(plain)) return 'java';
  if (/^(?:GNU\s+)?Bash(?:$|\s|[—:/])/iu.test(plain)) return 'shell';
  if (/^Shell\s*\/\s*GNU\s+Bash(?:$|\s|[—:/])/iu.test(plain)) return 'shell';
  return null;
}

export function offsetTopicHeadings(html) {
  return html.replace(/<h([1-6])(\b[^>]*)>([\s\S]*?)<\/h\1>/gi, (heading, level, attributes, content) => {
    const next = Number(level) + 1;
    if (next > 6) throw new Error('Cannot offset a topic h6 heading');
    return `<h${next}${attributes}>${content}</h${next}>`;
  });
}

const LAB_ICONS = {
  objective:'<span aria-hidden="true" class="lab-panel-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"></circle><circle cx="12" cy="12" r="4.5"></circle><circle cx="12" cy="12" r="1.2"></circle></svg></span>',
  prerequisites:'<span aria-hidden="true" class="lab-panel-icon"><svg viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="17" rx="2"></rect><path d="M8 8h8M8 12h8M8 16h5"></path></svg></span>',
  state:'<span aria-hidden="true" class="lab-panel-icon"><svg viewBox="0 0 24 24"><path d="M12 3v6m-3-3 3 3 3-3"></path><rect x="4" y="11" width="16" height="9" rx="2"></rect></svg></span>',
  task:'<span aria-hidden="true" class="lab-panel-icon"><svg viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="16" rx="2"></rect><path d="M9 4h6M9 10h6M9 14h4"></path></svg></span>',
  procedure:'<span aria-hidden="true" class="lab-panel-icon"><svg viewBox="0 0 24 24"><path d="M8 6h11M8 12h11M8 18h11"></path><circle cx="4" cy="6" r="1"></circle><circle cx="4" cy="12" r="1"></circle><circle cx="4" cy="18" r="1"></circle></svg></span>',
  observe:'<span aria-hidden="true" class="lab-panel-icon"><svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg></span>',
  tests:'<span aria-hidden="true" class="lab-panel-icon"><svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5 8a3 3 0 0 0 2.6 4h8.8A3 3 0 0 0 19 17l-5-8V3M8 14h8"></path></svg></span>',
  explanation:'<span aria-hidden="true" class="lab-panel-icon"><svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M8 14c-1.2-1-2-2.6-2-4.3A6 6 0 0 1 12 4a6 6 0 0 1 6 5.7c0 1.7-.8 3.3-2 4.3-.8.7-1 1.2-1.3 2H9.3c-.3-.8-.5-1.3-1.3-2Z"></path></svg></span>',
  transfer:'<span aria-hidden="true" class="lab-panel-icon"><svg viewBox="0 0 24 24"><path d="M7 7h11m-4-3 4 3-4 3M17 17H6m4-3-4 3 4 3"></path></svg></span>',
  cleanup:'<span aria-hidden="true" class="lab-panel-icon"><svg viewBox="0 0 24 24"><path d="M4 20h8M14 4h3l3 3-9 9-4 1 1-4 6-9Z"></path><path d="m12.5 6.5 3 3"></path></svg></span>',
  evidence:'<span aria-hidden="true" class="lab-panel-icon"><svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"></path></svg></span>',
  criteria:'<span aria-hidden="true" class="lab-panel-icon"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="m8.5 12 2.3 2.3 5-5"></path></svg></span>'
};

const LAB_PARTS = new Map([
  ['Objetivo','objective'], ['Pré-requisitos','prerequisites'], ['Estado inicial','state'], ['Tarefa','task'],
  ['Procedimento','procedure'], ['O que observar','observe'], ['Testes','tests'], ['Explicação','explanation'],
  ['Variação / transferência','transfer'], ['Limpeza','cleanup'], ['Critérios de aceite','criteria']
]);

function decodeText(html) {
  return html.replace(/<code>(.*?)<\/code>/g, '$1').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
}

function headingStart(html, id) {
  const marker = `id="${id}"`;
  const at = html.indexOf(marker);
  if (at < 0) return -1;
  return html.lastIndexOf('<h', at);
}

function sectionSlice(html, startId, endId) {
  const start = headingStart(html, startId);
  if (start < 0) return null;
  const end = endId ? headingStart(html, endId) : html.length;
  return { start, end: end < 0 ? html.length : end, text: html.slice(start, end < 0 ? html.length : end) };
}

function firstHeadingToPanel(segment) {
  if (/^<h1/.test(segment)) {
    return segment.replace(/^<h1([^>]*)>/, '<h2$1>').replace(/<\/h1>/, '</h2>');
  }
  return segment;
}

function wrapTabGroup(html, config) {
  const whole = sectionSlice(html, config.panels[0].id, config.endId);
  if (!whole) return html;
  const panels = [];
  for (let i = 0; i < config.panels.length; i += 1) {
    const here = config.panels[i];
    const next = config.panels[i + 1]?.id || config.endId;
    const part = sectionSlice(html, here.id, next);
    if (!part) return html;
    panels.push({ ...here, content:firstHeadingToPanel(part.text) });
  }
  const buttons = panels.map((p,i) => `<button aria-controls="${config.key}-panel-${p.key}" aria-selected="${i===0?'true':'false'}" class="tab" id="${config.key}-tab-${p.key}" role="tab" tabindex="${i===0?'0':'-1'}" type="button">${p.label}</button>`).join('');
  const content = panels.map((p,i) => `<div aria-labelledby="${config.key}-tab-${p.key}" class="tab-panel" id="${config.key}-panel-${p.key}" role="tabpanel"${i===0?'':' hidden=""'}>${p.content}</div>`).join('');
  const wrapped = `<section aria-label="Comparação por linguagem — ${config.key}" class="language-tabs" data-tabs=""><div aria-label="Linguagens" class="tab-list" role="tablist">${buttons}</div>${content}</section>`;
  return html.slice(0, whole.start) + wrapped + html.slice(whole.end);
}

function foldLanguageContext(value) {
  return normalizeSemanticHeading(value).semantic
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('pt-BR');
}

function languageHeadingAliasStart(html, start) {
  const before = html.slice(0, start);
  const aliases = before.match(/(?:<a aria-hidden="true" class="anchor-alias" id="[^"]+"><\/a>)+$/);
  return aliases ? start - aliases[0].length : start;
}

function languageHeadingTree(html) {
  const re = /<h([1-5])([^>]*)\bid="([^"]+)"([^>]*)>([\s\S]*?)<\/h\1>/g;
  const nodes = [];
  const stack = [];

  for (const match of html.matchAll(re)) {
    const node = {
      level:Number(match[1]),
      id:match[3],
      text:decodeText(match[5]),
      inner:match[5],
      start:match.index,
      aliasStart:languageHeadingAliasStart(html, match.index),
      heading:match[0],
      parent:null,
      children:[],
      end:html.length,
    };
    node.language = classifyLanguageHeading(node.text);
    while (stack.length && stack.at(-1).level >= node.level) stack.pop();
    node.parent = stack.at(-1) || null;
    if (node.parent) node.parent.children.push(node);
    nodes.push(node);
    stack.push(node);
  }

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      if (nodes[j].level <= nodes[i].level) {
        nodes[i].end = nodes[j].aliasStart;
        break;
      }
    }
  }
  return nodes;
}

function languageGroupContexts(parent, siblings, index) {
  if (parent) {
    const contexts = [];
    let current = parent;
    while (current) {
      contexts.push(current);
      current = current.parent;
    }
    return contexts;
  }

  const contexts = [];
  for (let i = index - 1; i >= 0 && contexts.length < 2; i -= 1) {
    if (!siblings[i].language) contexts.push(siblings[i]);
  }
  return contexts;
}

function eligibleLanguageContext(contexts) {
  return contexts.every(context => {
    if (parseLabHeading(context.text) || parseExerciseRootHeading(context.text)) return false;
    return !LANGUAGE_CONTEXT_EXCLUSION.test(foldLanguageContext(context.text));
  });
}

function languageGroupBaseKey(contexts) {
  for (const context of contexts) {
    const folded = foldLanguageContext(context.text);
    if (folded.includes('transferencia') && (folded.includes('linguag') || /python.*javascript.*java.*bash/.test(folded))) return 'transferencia';
    if (folded.includes('biblioteca')) return 'bibliotecas';
    if (folded.includes('mapeamento') || folded.includes('dicionario')) return 'mapeamento';
    if (/\bfila\b/.test(folded)) return 'fila';
  }
  const fallback = contexts[0]?.text || 'linguagens';
  const semantic = normalizeSemanticHeading(fallback).semantic.normalize('NFD').replace(/\p{M}/gu, '');
  return portableBaseSlug(semantic) || 'linguagens';
}

function allocateLanguageGroupKey(base, used, occupiedIds) {
  let key = base;
  let suffix = 2;
  const collides = candidate => used.has(candidate)
    || Object.values(LANGUAGE_TAB_META).some(meta =>
      occupiedIds.has(`${candidate}-tab-${meta.key}`) || occupiedIds.has(`${candidate}-panel-${meta.key}`),
    );
  while (collides(key)) {
    key = `${base}-${suffix}`;
    suffix += 1;
  }
  used.add(key);
  return key;
}

function languagePanelContent(html, panel, end) {
  const aliases = html.slice(panel.aliasStart, panel.start);
  const body = html.slice(panel.start, end);
  return aliases + firstHeadingToPanel(body);
}

export function wrapLanguageTabsSemantic(html) {
  const original = html;
  const nodes = languageHeadingTree(original);
  const roots = nodes.filter(node => !node.parent);
  const containers = [{ children:roots, parent:null, end:original.length }, ...nodes.map(node => ({
    children:node.children,
    parent:node,
    end:node.end,
  }))];

  const candidates = [];
  for (const container of containers) {
    const siblings = container.children;
    for (let i = 0; i + 3 < siblings.length;) {
      const panels = siblings.slice(i, i + 4);
      const languages = panels.map(panel => panel.language);
      const isGroup = languages.every(Boolean) && new Set(languages).size === 4;
      if (!isGroup) {
        i += 1;
        continue;
      }

      const contexts = languageGroupContexts(container.parent, siblings, i);
      if (eligibleLanguageContext(contexts)) {
        candidates.push({
          start:panels[0].aliasStart,
          end:siblings[i + 4]?.aliasStart ?? container.end,
          panels,
          contexts,
        });
      }
      i += 4;
    }
  }

  candidates.sort((a, b) => a.start - b.start || b.end - a.end);
  const selected = [];
  for (const candidate of candidates) {
    if (selected.length && candidate.start < selected.at(-1).end) continue;
    selected.push(candidate);
  }
  if (!selected.length) return html;

  const occupiedIds = new Set([...original.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  const usedKeys = new Set();
  const replacements = selected.map(group => {
    const base = languageGroupBaseKey(group.contexts);
    const key = allocateLanguageGroupKey(base, usedKeys, occupiedIds);
    const panels = group.panels.map((panel, index) => {
      const meta = LANGUAGE_TAB_META[panel.language];
      const end = group.panels[index + 1]?.aliasStart ?? group.end;
      return { ...meta, content:languagePanelContent(original, panel, end) };
    });

    const buttons = panels.map((panel, index) =>
      `<button aria-controls="${key}-panel-${panel.key}" aria-selected="${index === 0 ? 'true' : 'false'}" class="tab" id="${key}-tab-${panel.key}" role="tab" tabindex="${index === 0 ? '0' : '-1'}" type="button">${panel.label}</button>`,
    ).join('');
    const content = panels.map((panel, index) =>
      `<div aria-labelledby="${key}-tab-${panel.key}" class="tab-panel" id="${key}-panel-${panel.key}" role="tabpanel"${index === 0 ? '' : ' hidden=""'}>${panel.content}</div>`,
    ).join('');
    const replacement = `<section aria-label="Comparação por linguagem — ${key}" class="language-tabs" data-tabs=""><div aria-label="Linguagens" class="tab-list" role="tablist">${buttons}</div>${content}</section>`;
    return { start:group.start, end:group.end, replacement };
  });

  let out = '';
  let cursor = 0;
  for (const item of replacements) {
    out += original.slice(cursor, item.start) + item.replacement;
    cursor = item.end;
  }
  return out + original.slice(cursor);
}

function splitH2Sections(segment) {
  const re = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;
  const matches = [...segment.matchAll(re)];
  return matches.map((m,i) => ({ id:m[1], title:decodeText(m[2]), heading:m[0], content:segment.slice(m.index + m[0].length, matches[i+1]?.index ?? segment.length) }));
}

function panelHtml(section, part) {
  const extra = part === 'procedure' ? ' lab-panel--procedure' : part === 'criteria' ? ' lab-panel--criteria' : '';
  const heading = `<h2 id="${escapeAttribute(section.id)}">${LAB_ICONS[part]}<span class="lab-panel-heading-text">${escapeHtml(section.title)}</span></h2>`;
  return `<section class="lab-panel${extra}" data-lab-part="${part}">${heading}${section.content}</section>`;
}

function decorateDisclosure(html) {
  return html.replace(/<details>/g, (m, offset, whole) => {
    const tail = whole.slice(offset, offset + 240);
    if (tail.includes('💡 Dica')) return '<details class="activity-disclosure activity-hint">';
    if (tail.includes('Solução de referência') || tail.includes('Respostas esperadas')) return '<details class="activity-disclosure activity-solution">';
    return '<details class="activity-disclosure">';
  });
}

function wrapLabs(html, topicId='T25') {
  const original = html;
  const labRe = /<h1 class="chapter-title" id="([^"]+)">(\d+)\.\s*🧪\s*LAB\s+(\d+)\s+—\s+([\s\S]*?)<\/h1>/g;
  const matches = [...original.matchAll(labRe)];
  if (!matches.length) return html;
  const replacements = [];
  for (let x = 0; x < matches.length; x += 1) {
    const m = matches[x];
    const start = m.index;
    const afterRoot = start + m[0].length;
    let end;
    if (matches[x + 1]) end = matches[x + 1].index;
    else {
      const next = original.indexOf('<h1 class="chapter-title"', afterRoot);
      end = next < 0 ? original.length : next;
    }
    const body = original.slice(afterRoot, end);
    const sections = splitH2Sections(body);
    if (sections.length < 10) continue;
    const byPart = new Map();
    for (const sec of sections) {
      const part = LAB_PARTS.get(sec.title);
      if (part) byPart.set(part, sec);
    }
    const criteria = byPart.get('criteria');
    if (!criteria) continue;
    let criteriaContent = criteria.content;
    const disclosureAt = criteriaContent.indexOf('<details');
    let disclosures = '';
    if (disclosureAt >= 0) {
      disclosures = criteriaContent.slice(disclosureAt);
      criteriaContent = criteriaContent.slice(0, disclosureAt);
      criteria.content = criteriaContent;
    }
    let footer = '';
    const footerMatch = disclosures.match(/<p><a href="#(?:índice|%C3%ADndice)">↑ Voltar ao índice<\/a><\/p>\s*$/);
    if (footerMatch) {
      footer = `<footer class="activity-footer"><a href="#%C3%ADndice">↑ Voltar ao índice</a></footer>`;
      disclosures = disclosures.slice(0, footerMatch.index);
    }
    disclosures = decorateDisclosure(disclosures);
    const summary = ['objective','prerequisites','state','task'].map(part => panelHtml(byPart.get(part), part)).join('');
    const procedure = panelHtml(byPart.get('procedure'),'procedure');
    const validation = ['observe','tests'].map(part => panelHtml(byPart.get(part), part)).join('');
    const reflection = ['explanation','transfer','cleanup'].map(part => panelHtml(byPart.get(part), part)).join('');
    const criteriaPanel = panelHtml(criteria,'criteria');
    const titleHtml = m[4];
    if (m[3] === '2') disclosures = disclosures.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, code) => `<pre><code>${code.replace(/\n\n+/g, '\n')}</code></pre>`);
    if (m[3] === '3') disclosures = disclosures.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, code) => `<pre><code>${code.replace(/\n\n+/g, '\n').replace(/^    /gm, '')}</code></pre>`);
    if (m[3] === '6') disclosures = disclosures.replace(/queue_enqueue B\n\nprintf/, 'queue_enqueue B\nprintf');
    const replacement = `<div aria-labelledby="${m[1]}" class="learning-activity lab-activity" data-activity="lab" data-lab="${m[3]}" role="region"><header class="activity-header"><p class="activity-kicker">LAB ${m[3]}<span>${topicId} · atividade prática</span></p><h1 class="chapter-title" id="${m[1]}">${titleHtml}</h1></header><div class="lab-summary-grid">${summary}</div>${procedure}<div class="lab-validation-grid">${validation}</div><div class="lab-reflection-grid">${reflection}</div>${criteriaPanel}<div class="lab-disclosures">${disclosures}</div>${footer}</div>`;
    replacements.push({ start, end, replacement });
  }
  let out = '';
  let cursor = 0;
  for (const item of replacements) {
    out += original.slice(cursor, item.start) + item.replacement;
    cursor = item.end;
  }
  return out + original.slice(cursor);
}

function wrapExercises(html, topicId='T25') {
  const whole = sectionSlice(html, '49-exercícios', '50-evidências-de-domínio');
  if (!whole) return html;
  const rootEnd = whole.text.indexOf('</h1>') + 5;
  const root = whole.text.slice(0, rootEnd);
  const rest = whole.text.slice(rootEnd);
  const sections = splitH2Sections(rest).filter(x => /^49[1-4]-/.test(x.id));
  if (sections.length !== 4) return html;
  let suiteFooter = '';
  const pieces = sections.map((sec,i) => {
    const n = `49.${i+1}`;
    let body = decorateDisclosure(sec.content);
    if (i === 2) body = body.replace('<blockquote>', '<blockquote class="exercise-rubric">');
    if (i === 3) {
      const footerMatch = body.match(/<p><a href="#(?:índice|%C3%ADndice)">↑ Voltar ao índice<\/a><\/p>\s*$/);
      if (footerMatch) {
        suiteFooter = `<p class="exercise-suite-footer"><a href="#%C3%ADndice">↑ Voltar ao índice</a></p>`;
        body = body.slice(0, footerMatch.index);
      }
    }
    return `<div aria-labelledby="${sec.id}" class="learning-activity exercise-activity" data-activity="exercise" data-exercise="${n}" data-exercise-step="${i+1}" role="region"><span aria-hidden="true" class="exercise-marker">${i+1}</span><header class="activity-header"><p class="activity-kicker">ATIVIDADE DE CONSOLIDAÇÃO<span>${topicId} · exercícios</span></p>${sec.heading}</header><div class="exercise-body">${body}</div></div>`;
  }).join('');
  return html.slice(0,whole.start) + root + `<div class="exercise-suite">${pieces}${suiteFooter}</div>` + html.slice(whole.end);
}

function decorateExerciseBody(html) {
  const decorated = decorateDisclosure(html);
  return decorated.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (whole, content) => {
    return /rubrica de autoavaliação/i.test(decodeText(content))
      ? `<blockquote class="exercise-rubric">${content}</blockquote>`
      : whole;
  });
}

function extractExerciseFooter(segment) {
  const match = segment.match(/<p><a href="#(?:índice|%C3%ADndice)">↑ Voltar ao índice<\/a><\/p>\s*$/);
  if (!match) return { body:segment, footer:'' };
  return {
    body:segment.slice(0, match.index),
    footer:'<p class="exercise-suite-footer"><a href="#%C3%ADndice">↑ Voltar ao índice</a></p>',
  };
}

function exercisePrefixMode(prefix) {
  const normalized = prefix
    .replace(/<a aria-hidden="true" class="anchor-alias" id="[^"]+"><\/a>/g, '')
    .trim();
  if (!normalized) return 'none';
  return /<(?:ol|ul|pre|details|blockquote|table)\b|class="(?:code-block|table-wrap)"/i.test(normalized)
    ? 'activity'
    : 'intro';
}

function exerciseSectionKey(section, index) {
  return normalizeSemanticHeading(section.title).sectionPrefix || String(index + 1);
}

function exerciseActivityHtml(section, step, topicId) {
  const key = exerciseSectionKey(section, step);
  const body = decorateExerciseBody(section.content);
  return `<div aria-labelledby="${section.id}" class="learning-activity exercise-activity" data-activity="exercise" data-exercise="${escapeAttribute(key)}" data-exercise-step="${step + 1}" role="region"><span aria-hidden="true" class="exercise-marker">${step + 1}</span><header class="activity-header"><p class="activity-kicker">ATIVIDADE DE CONSOLIDAÇÃO<span>${topicId} · exercícios</span></p>${section.heading}</header><div class="exercise-body">${body}</div></div>`;
}

function exerciseGroupHtml(rootId, body, step, topicId) {
  return `<div aria-labelledby="${rootId}" class="learning-activity exercise-activity exercise-activity--group" data-activity="exercise" data-exercise-step="${step + 1}" role="region"><span aria-hidden="true" class="exercise-marker">${step + 1}</span><header class="activity-header"><p class="activity-kicker">ATIVIDADE DE CONSOLIDAÇÃO<span>${topicId} · exercícios</span></p></header><div class="exercise-body">${decorateExerciseBody(body)}</div></div>`;
}

export function wrapExercisesSemantic(html, topicId) {
  const original = html;
  const rootRe = /<h1([^>]*)\bid="([^"]+)"([^>]*)>([\s\S]*?)<\/h1>/g;
  const matches = [...original.matchAll(rootRe)]
    .map(match => ({ match, parsed: parseExerciseRootHeading(decodeText(match[4])) }))
    .filter(item => item.parsed);
  if (!matches.length) return html;

  const replacements = [];
  for (const { match:m } of matches) {
    const start = m.index;
    const afterRoot = start + m[0].length;
    const tail = original.slice(afterRoot);
    const boundary = tail.match(/<h1\b/);
    const end = boundary ? afterRoot + boundary.index : original.length;
    const extracted = extractExerciseFooter(original.slice(afterRoot, end));
    const split = splitHeadingSectionsSemantic(extracted.body, 2);
    const prefixMode = exercisePrefixMode(split.prefix);
    const rootId = m[2];

    let suite;
    if (!split.sections.length) {
      const card = `<div aria-labelledby="${rootId}" class="learning-activity exercise-activity exercise-activity--flat" data-activity="exercise" role="region"><header class="activity-header"><p class="activity-kicker">ATIVIDADE DE CONSOLIDAÇÃO<span>${topicId} · exercícios</span></p></header><div class="exercise-body">${decorateExerciseBody(extracted.body)}</div></div>`;
      suite = `<div class="exercise-suite exercise-suite--flat">${card}${extracted.footer}</div>`;
    } else {
      let step = 0;
      let intro = '';
      const pieces = [];
      if (prefixMode === 'intro') {
        intro = `<div class="exercise-suite-intro">${decorateExerciseBody(split.prefix)}</div>`;
      } else if (prefixMode === 'activity') {
        pieces.push(exerciseGroupHtml(rootId, split.prefix, step, topicId));
        step += 1;
      }
      for (const section of split.sections) {
        pieces.push(exerciseActivityHtml(section, step, topicId));
        step += 1;
      }
      suite = `${intro}<div class="exercise-suite">${pieces.join('')}${extracted.footer}</div>`;
    }

    replacements.push({ start, end, replacement:m[0] + suite });
  }

  let out = '';
  let cursor = 0;
  for (const item of replacements) {
    out += original.slice(cursor, item.start) + item.replacement;
    cursor = item.end;
  }
  return out + original.slice(cursor);
}

function enhanceTopicHtml(html, topicId='T25') {
  html = wrapLanguageTabsSemantic(html);
  html = wrapLabsSemantic(html, topicId);
  html = wrapExercisesSemantic(html, topicId);
  return html;
}

function publicationSlices(body) {
  const normalized = String(body).replace(/\r\n?/g,'\n');
  const glossaryAt = normalized.search(/^# 52\. Glossário\s*$/m);
  const appendixAt = normalized.search(/^# APÊNDICES\b.*$/m);
  if (glossaryAt < 0 || appendixAt < 0) return { core:normalized, postGlossary:'', glossarySource:'' };
  const between = normalized.slice(glossaryAt, appendixAt);
  const returnMatch = between.match(/^\[↑ Voltar ao índice\]\(#índice\)\s*$/m);
  const rel = returnMatch ? returnMatch.index : between.length;
  let core = normalized.slice(0, glossaryAt);
  core = core.replace(/^### Gate de Cobertura Prática \/ Operacional\s*$[\s\S]*?(?=^\[↑ Voltar ao índice\]\(#índice\)\s*$)/m, '');
  core = core.replace(/^<a id=["']apendices["']><\/a>\s*$/m, '');
  core = core.replace('- [APÊNDICES — auditoria, referências, QA e histórico](#apendices)', '- [Referências](#referências)');
  core = core.replace('- [52. Glossário](#52-glossário)', `- [52. Glossário](#52-glossário)
- [Referências](#referências)
  - [Bibliografia](#bibliografia)
  - [Python — documentação oficial](#python--documentação-oficial)
  - [JavaScript / ECMAScript — especificação e referência](#javascript--ecmascript--especificação-e-referência)
  - [Java — documentação oficial](#java--documentação-oficial)
  - [GNU Bash — documentação oficial](#gnu-bash--documentação-oficial)`);
  core = core.split('\n').filter(line => {
    const m = line.match(/^\s*-\s+\[(5[3-7](?:\.|\s))/);
    if (m) return false;
    if (/\]\(#apendices\)\s*$/.test(line)) return false;
    return true;
  }).join('\n');
  return {
    core,
    glossarySource: between.slice(0, rel),
    postGlossary: between.slice(rel).replace(/^<a id=["']apendices["']><\/a>\s*$/m, ''),
  };
}

export function renderGlossary(glossarySource, topicId='T25') {
  const rows = glossarySource.split('\n').filter(line => /^\|/.test(line)).slice(2);
  const entries = rows.map(splitTableRow).filter(x=>x.length>=2);
  const groups = [];
  const map = new Map();
  for (const [term, definition] of entries) {
    const letter = term.replace(/`/g,'').trim().charAt(0).toUpperCase();
    if (!map.has(letter)) { map.set(letter,[]); groups.push(letter); }
    map.get(letter).push([term,definition]);
  }
  const lower = topicId.toLowerCase();
  const nav = groups.map(l => `<a href="#gloss-${lower}-${portableBaseSlug(l)}">${escapeHtml(l)}</a>`).join('');
  const content = groups.map(letter => {
    const items = map.get(letter).map(([term,def]) => `<article class="glossary-item" id="gloss-${lower}-${portableBaseSlug(term.replace(/`/g,''))}"><h4>${renderInline(term)}</h4><p>${renderInline(def)}</p></article>`).join('');
    return `<section class="glossary-letter-group" id="gloss-${lower}-${portableBaseSlug(letter)}"><h3 class="glossary-letter">${escapeHtml(letter)}</h3><div class="glossary-grid">${items}</div></section>`;
  }).join('');
  return `<h1 class="chapter-title" id="52-glossário">52. Glossário</h1><h2 id="52-1-glossário-a-z">52.1 Glossário A–Z</h2><p class="glossary-intro">Termos do ${topicId} em ordem alfabética, com navegação direta por letra.</p><nav aria-label="Índice alfabético do glossário" class="glossary-letters">${nav}</nav>${content}`;
}

function referenceSection(body, headingPattern) {
  const match = body.match(new RegExp(`^## ${headingPattern}\\s*$([\\s\\S]*?)(?=^## |^# |\\Z)`, 'm'));
  return match ? match[1] : '';
}

function listItems(source) {
  return source.split('\n').map(x=>x.match(/^\s*-\s+(.+)$/)?.[1]).filter(Boolean);
}

function trimReferenceUrl(value) {
  let url = String(value);
  while (/[.,;:]$/.test(url)) url = url.slice(0, -1);
  while (url.endsWith(')')) {
    const opens = (url.match(/\(/g) || []).length;
    const closes = (url.match(/\)/g) || []).length;
    if (closes <= opens) break;
    url = url.slice(0, -1);
  }
  return url;
}

function cleanReferenceLabel(value) {
  return String(value).replace(/[\s:;,.]+$/g, '').trim();
}

function referenceTarget(item) {
  const text = String(item).trim();

  const autolink = text.match(/<((?:https?):\/\/[^>\s]+)>/);
  if (autolink) {
    const label = cleanReferenceLabel(text.replace(autolink[0], ''));
    return { url:autolink[1], label:label || autolink[1] };
  }

  const markdown = text.match(/\[([^\]]+)\]\(((?:https?):\/\/[^\s)]+)(?:\s+"[^"]*")?\)/);
  if (markdown) {
    const label = cleanReferenceLabel(text.replace(markdown[0], markdown[1]));
    return { url:markdown[2], label:label || markdown[1] };
  }

  const bare = text.match(/(?:^|\s)(https?:\/\/[^\s<>]+)/);
  if (bare) {
    const url = trimReferenceUrl(bare[1]);
    const label = cleanReferenceLabel(text.replace(bare[1], ''));
    return { url, label:label || url };
  }

  return null;
}

function referenceCard(item, kind, domainLabel='') {
  const target = referenceTarget(item);
  if (!target) {
    const cleaned = item.replace(/ disponível na File Library\.?$/, '.');
    return `<div class="reference-card no-link"><span class="reference-kind">${kind}</span><span class="reference-title">${renderInline(cleaned)}</span><span class="reference-domain">${domainLabel || 'Referência bibliográfica'}</span></div>`;
  }
  let domain = '';
  try { domain = new URL(target.url).hostname; } catch { domain = domainLabel; }
  return `<div class="reference-card"><span class="reference-kind">${kind}</span><a class="reference-title" href="${escapeAttribute(target.url)}" rel="noopener noreferrer" target="_blank">${renderInline(target.label)}</a><span class="reference-domain">${escapeHtml(domain)}</span></div>`;
}

export function renderReferences(body) {
  const configs = [
    ['55\\.2 Literatura local efetivamente consultada','Bibliografia','REFERÊNCIA','Referência bibliográfica'],
    ['55\\.3 Python — documentação oficial','Python — documentação oficial','FONTE OFICIAL',''],
    ['55\\.4 JavaScript / ECMAScript — especificação e referência','JavaScript / ECMAScript — especificação e referência','FONTE OFICIAL',''],
    ['55\\.5 Java — documentação oficial','Java — documentação oficial','FONTE OFICIAL',''],
    ['55\\.6 GNU Bash — documentação oficial','GNU Bash — documentação oficial','FONTE OFICIAL',''],
  ];
  const sections = configs.map(([pattern,title,kind,domain],idx) => {
    const items = listItems(referenceSection(body,pattern));
    const id = idx === 0 ? 'bibliografia' : portableBaseSlug(title);
    return `<section class="reference-section"><h2 id="${id}">${escapeHtml(title)}</h2><div class="reference-directory">${items.map(item=>referenceCard(item,kind,domain)).join('')}</div></section>`;
  }).join('');
  const end = body.match(/^\*\*Fim — ([^\n]+)\*\*\s*$/m)?.[0] || '';
  return `<h1 class="chapter-title" id="referências">Referências</h1>${sections}<hr>${end ? `<p>${renderInline(end)}</p>` : ''}`;
}

export function headingsFromHtml(html) {
  const re = /<h([1-6])([^>]*)id="([^"]+)"([^>]*)>([\s\S]*?)<\/h\1>/g;
  const out=[];
  for (const m of html.matchAll(re)) {
    out.push({ level:Number(m[1]), id:m[3], text:decodeText(m[5]), chapter:/class="[^"]*chapter-title/.test(m[2]+m[4]) });
  }
  return out;
}


function splitHeadingSectionsGeneric(segment, level) {
  const re = new RegExp(`<h${level} id="([^"]+)">([\\s\\S]*?)<\\/h${level}>`, 'g');
  const matches = [...segment.matchAll(re)];
  return matches.map((m, i) => ({
    id: m[1],
    title: decodeText(m[2]),
    heading: m[0],
    content: segment.slice(m.index + m[0].length, matches[i + 1]?.index ?? segment.length),
  }));
}

function panelHtmlGeneric(section, part, level) {
  if (!section) return '';
  const extra = part === 'procedure' ? ' lab-panel--procedure' : part === 'criteria' ? ' lab-panel--criteria' : '';
  const heading = `<h${level} id="${escapeAttribute(section.id)}">${LAB_ICONS[part]}<span class="lab-panel-heading-text">${escapeHtml(section.title)}</span></h${level}>`;
  return `<section class="lab-panel${extra}" data-lab-part="${part}">${heading}${section.content}</section>`;
}

function wrapLabsGeneric(html, topicId) {
  const original = html;
  const labRe = /<h([1-5])([^>]*)id="([^"]+)"([^>]*)>\s*🧪\s*LAB\s+(\d+)\s+—\s+([\s\S]*?)<\/h\1>/g;
  const matches = [...original.matchAll(labRe)];
  if (!matches.length) return html;
  const replacements = [];
  for (let x = 0; x < matches.length; x += 1) {
    const m = matches[x];
    const rootLevel = Number(m[1]);
    let start = m.index;
    const provisionalLabId = m[3].startsWith('lab-') ? `-${m[3]}` : m[3];
    const aliasHtml = `<a aria-hidden="true" class="anchor-alias" id="${escapeAttribute(provisionalLabId)}"></a>`;
    if (original.slice(0, start).endsWith(aliasHtml)) start -= aliasHtml.length;
    const afterRoot = m.index + m[0].length;
    let end = matches[x + 1]?.index ?? original.length;
    if (!matches[x + 1]) {
      const tail = original.slice(afterRoot);
      const boundary = tail.match(new RegExp(`<h[1-${rootLevel}]\\b`));
      if (boundary) end = afterRoot + boundary.index;
    }
    const body = original.slice(afterRoot, end);
    const partLevel = Math.min(rootLevel + 1, 6);
    const sections = splitHeadingSectionsGeneric(body, partLevel);
    const byPart = new Map();
    for (const sec of sections) {
      const part = LAB_PARTS.get(sec.title);
      if (part) byPart.set(part, sec);
    }
    const required = ['objective','prerequisites','state','task','procedure','observe','tests','explanation','transfer','cleanup'];
    if (!required.every(part => byPart.has(part))) continue;
    const summary = ['objective','prerequisites','state','task'].map(part => panelHtmlGeneric(byPart.get(part), part, partLevel)).join('');
    const procedure = panelHtmlGeneric(byPart.get('procedure'), 'procedure', partLevel);
    const validation = ['observe','tests'].map(part => panelHtmlGeneric(byPart.get(part), part, partLevel)).join('');
    const reflection = ['explanation','transfer','cleanup'].map(part => panelHtmlGeneric(byPart.get(part), part, partLevel)).join('');
    const criteria = byPart.get('criteria') ? panelHtmlGeneric(byPart.get('criteria'), 'criteria', partLevel) : '';
    const titleHtml = m[6];
    const titleClass = rootLevel === 1 ? ' class="chapter-title"' : '';
    const labId = provisionalLabId;
    const replacement = `<div aria-labelledby="${labId}" class="learning-activity lab-activity" data-activity="lab" data-lab="${m[5]}" role="region"><header class="activity-header"><p class="activity-kicker">LAB ${m[5]}<span>${topicId} · atividade prática</span></p><h${rootLevel}${titleClass} id="${labId}">${titleHtml}</h${rootLevel}></header><div class="lab-summary-grid">${summary}</div>${procedure}<div class="lab-validation-grid">${validation}</div><div class="lab-reflection-grid">${reflection}</div>${criteria}</div>`;
    replacements.push({ start, end, replacement });
  }
  let out = '';
  let cursor = 0;
  for (const item of replacements) {
    out += original.slice(cursor, item.start) + item.replacement;
    cursor = item.end;
  }
  return out + original.slice(cursor);
}

function splitHeadingSectionsSemantic(segment, level) {
  const re = new RegExp(`<h${level}([^>]*)\\bid="([^"]+)"([^>]*)>([\\s\\S]*?)<\\/h${level}>`, 'g');
  const matches = [...segment.matchAll(re)];
  return {
    prefix: matches.length ? segment.slice(0, matches[0].index) : segment,
    sections: matches.map((m, i) => ({
      id: m[2],
      title: decodeText(m[4]),
      heading: m[0],
      content: segment.slice(m.index + m[0].length, matches[i + 1]?.index ?? segment.length),
    })),
  };
}

function extractActivityFooter(segment) {
  const match = segment.match(/<p><a href="#(?:índice|%C3%ADndice)">↑ Voltar ao índice<\/a><\/p>\s*$/);
  if (!match) return { body:segment, footer:'' };
  return {
    body:segment.slice(0, match.index),
    footer:'<footer class="activity-footer"><a href="#%C3%ADndice">↑ Voltar ao índice</a></footer>',
  };
}

function aliasOnly(segment) {
  return segment
    .replace(/<a aria-hidden="true" class="anchor-alias" id="[^"]+"><\/a>/g, '')
    .trim() === '';
}

function labTitleHtml(innerHtml, fallback) {
  const at = innerHtml.indexOf('—');
  return at >= 0 ? innerHtml.slice(at + 1).trim() : escapeHtml(fallback);
}

function applyT25LabContentCompatibility(html, topicId, labIndex) {
  if (topicId !== 'T25') return html;
  let out = html;
  if (labIndex === 2) {
    out = out.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, code) => `<pre><code>${code.replace(/\n\n+/g, '\n')}</code></pre>`);
  }
  if (labIndex === 3) {
    out = out.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, code) => `<pre><code>${code.replace(/\n\n+/g, '\n').replace(/^    /gm, '')}</code></pre>`);
  }
  if (labIndex === 6) out = out.replace(/queue_enqueue B\n\nprintf/, 'queue_enqueue B\nprintf');
  return out;
}

export function wrapLabsSemantic(html, topicId) {
  const original = html;
  const headingRe = /<h([1-5])([^>]*)\bid="([^"]+)"([^>]*)>([\s\S]*?)<\/h\1>/g;
  const matches = [...original.matchAll(headingRe)]
    .map(match => ({ match, parsed:parseLabHeading(decodeText(match[5])) }))
    .filter(item => item.parsed);
  if (!matches.length) return html;

  const replacements = [];
  for (const { match:m, parsed } of matches) {
    const rootLevel = Number(m[1]);
    let start = m.index;
    const provisionalLabId = m[3].startsWith('lab-') ? `-${m[3]}` : m[3];
    const aliasHtml = `<a aria-hidden="true" class="anchor-alias" id="${escapeAttribute(provisionalLabId)}"></a>`;
    if (original.slice(0, start).endsWith(aliasHtml)) start -= aliasHtml.length;

    const afterRoot = m.index + m[0].length;
    const tail = original.slice(afterRoot);
    const boundary = tail.match(new RegExp(`<h[1-${rootLevel}]\\b`));
    const end = boundary ? afterRoot + boundary.index : original.length;
    const extracted = extractActivityFooter(original.slice(afterRoot, end));
    const body = extracted.body;
    const partLevel = Math.min(rootLevel + 1, 6);
    const split = splitHeadingSectionsSemantic(body, partLevel);
    const mapped = split.sections.map(section => ({ section, part:classifyLabPartHeading(section.title) }));
    const uniqueParts = new Set(mapped.map(item => item.part).filter(Boolean));
    const structured = mapped.length >= 6
      && mapped.every(item => item.part)
      && uniqueParts.size === mapped.length
      && aliasOnly(split.prefix);

    const titleClass = rootLevel === 1 ? ' class="chapter-title"' : '';
    const titleHtml = labTitleHtml(m[5], parsed.title);
    const labId = provisionalLabId;
    const header = `<header class="activity-header"><p class="activity-kicker">LAB ${parsed.activityIndex}<span>${topicId} · atividade prática</span></p><h${rootLevel}${titleClass} id="${labId}">${titleHtml}</h${rootLevel}></header>`;

    let content;
    if (!structured) {
      content = `<div class="lab-compact-body">${decorateDisclosure(body)}</div>${extracted.footer}`;
    } else {
      const byPart = new Map(mapped.map(({ section, part }) => [part, { ...section }]));
      let disclosures = '';
      const criteria = byPart.get('criteria');
      if (criteria) {
        const disclosureAt = criteria.content.indexOf('<details');
        if (disclosureAt >= 0) {
          disclosures = criteria.content.slice(disclosureAt);
          criteria.content = criteria.content.slice(0, disclosureAt);
        }
      }
      disclosures = applyT25LabContentCompatibility(decorateDisclosure(disclosures), topicId, parsed.activityIndex);

      const summary = ['objective','prerequisites','state','task']
        .map(part => panelHtmlGeneric(byPart.get(part), part, partLevel)).join('');
      const procedure = panelHtmlGeneric(byPart.get('procedure'), 'procedure', partLevel);
      const validation = ['observe','tests','evidence']
        .map(part => panelHtmlGeneric(byPart.get(part), part, partLevel)).join('');
      const reflection = ['explanation','transfer','cleanup']
        .map(part => panelHtmlGeneric(byPart.get(part), part, partLevel)).join('');
      const criteriaPanel = panelHtmlGeneric(criteria, 'criteria', partLevel);
      const summaryGrid = summary ? `<div class="lab-summary-grid">${summary}</div>` : '';
      const validationGrid = validation ? `<div class="lab-validation-grid">${validation}</div>` : '';
      const reflectionGrid = reflection ? `<div class="lab-reflection-grid">${reflection}</div>` : '';
      const disclosureBlock = disclosures ? `<div class="lab-disclosures">${disclosures}</div>` : '';
      content = `${split.prefix}${summaryGrid}${procedure}${validationGrid}${reflectionGrid}${criteriaPanel}${disclosureBlock}${extracted.footer}`;
    }

    const replacement = `<div aria-labelledby="${labId}" class="learning-activity lab-activity" data-activity="lab" data-lab="${parsed.activityIndex}" role="region">${header}${content}</div>`;
    replacements.push({ start, end, replacement });
  }

  let out = '';
  let cursor = 0;
  for (const item of replacements) {
    out += original.slice(cursor, item.start) + item.replacement;
    cursor = item.end;
  }
  return out + original.slice(cursor);
}

export function enhanceTopicHtmlGeneric(html, topicId) {
  if (topicId === 'T25') return enhanceTopicHtml(html, topicId);
  let out = wrapLanguageTabsSemantic(html);
  out = wrapLabsSemantic(out, topicId);
  out = wrapExercisesSemantic(out, topicId);
  const realIds = new Set([...out.matchAll(/<(?!a\b)[A-Za-z][^>]*\sid="([^"]+)"[^>]*>/g)].map(m => m[1]));
  out = out.replace(/<a aria-hidden="true" class="anchor-alias" id="([^"]+)"><\/a>/g, (whole, id) => realIds.has(id) ? '' : whole);
  return out;
}

function topLevelSection(source, headingPattern) {
  const re = new RegExp(`^# ${headingPattern}\\s*$`, 'm');
  const m = source.match(re);
  if (!m) return null;
  const start = m.index;
  const after = start + m[0].length;
  const tail = source.slice(after);
  const next = tail.search(/^# /m);
  const end = next < 0 ? source.length : after + next;
  return { start, end, text: source.slice(start, end), heading: m[0] };
}

export function publicationSlicesGeneric(body, topicId = '') {
  if (topicId === 'T25') {
    const legacy = publicationSlices(body);
    return { ...legacy, referencesSource: '' };
  }
  const normalized = String(body).replace(/\r\n?/g, '\n');
  const glossary = topLevelSection(normalized, '\\d+\\. Glossário');
  const references = topLevelSection(normalized, '\\d+\\. Referências');
  if (!glossary || !references) return { core: normalized, glossarySource: '', referencesSource: '', postGlossary: '' };
  let core = normalized.slice(0, glossary.start);
  const refNum = references.heading.match(/^# (\d+)\./)?.[1];
  if (refNum) {
    core = core.replace(new RegExp(`^- \\[${refNum}\\. Referências\\]\\(#${refNum}-referências\\)\\s*$`, 'm'), '- [Referências](#referências)');
  }
  const appendixAnchor = normalized.indexOf('<a id="apendices"></a>');
  const appendixOmitted = appendixAnchor >= 0 && appendixAnchor > glossary.start;
  core = core.split('\n').filter(line => {
    if (appendixOmitted && /\]\(#apendices\)/.test(line)) return false;
    const m = line.match(/\]\(#(\d+)-/);
    if (!m) return true;
    const n = Number(m[1]);
    if (n < Number(glossary.heading.match(/^# (\d+)\./)?.[1] || 999)) return true;
    if (refNum && n === Number(refNum) && /\]\(#referências\)/.test(line)) return true;
    return false;
  }).join('\n');
  return { core, glossarySource: glossary.text, referencesSource: references.text, postGlossary: '' };
}

export function renderGlossaryGeneric(glossarySource, topicId) {
  if (topicId === 'T25') return renderGlossary(glossarySource, topicId);
  const number = glossarySource.match(/^# (\d+)\. Glossário\s*$/m)?.[1] || '';
  const rows = glossarySource.split('\n').filter(line => /^\|/.test(line)).slice(2);
  const entries = rows.map(splitTableRow).filter(x => x.length >= 2);
  const groups = [];
  const map = new Map();
  for (const [term, definition] of entries) {
    const letter = term.replace(/`/g,'').trim().charAt(0).toUpperCase();
    if (!map.has(letter)) { map.set(letter, []); groups.push(letter); }
    map.get(letter).push([term, definition]);
  }
  const lower = topicId.toLowerCase();
  const nav = groups.map(l => `<a href="#gloss-${lower}-letter-${portableBaseSlug(l)}">${escapeHtml(l)}</a>`).join('');
  const glossaryIdCounts = new Map();
  const content = groups.map(letter => {
    const items = map.get(letter).map(([term, def]) => {
      const base = `gloss-${lower}-${portableBaseSlug(term.replace(/`/g,''))}`;
      const n = glossaryIdCounts.get(base) || 0;
      glossaryIdCounts.set(base, n + 1);
      const id = n === 0 ? base : `${base}-${n}`;
      return `<article class="glossary-item" id="${escapeAttribute(id)}"><h4>${renderInline(term)}</h4><p>${renderInline(def)}</p></article>`;
    }).join('');
    return `<section class="glossary-letter-group" id="gloss-${lower}-letter-${portableBaseSlug(letter)}"><h3 class="glossary-letter">${escapeHtml(letter)}</h3><div class="glossary-grid">${items}</div></section>`;
  }).join('');
  const rootId = `${number}-glossário`;
  const subId = `${number}-1-glossário-a-z`;
  return `<h1 class="chapter-title" id="${rootId}">${number}. Glossário</h1><h2 id="${subId}">${number}.1 Glossário A–Z</h2><p class="glossary-intro">Termos do ${topicId} em ordem alfabética, com navegação direta por letra.</p><nav aria-label="Índice alfabético do glossário" class="glossary-letters">${nav}</nav>${content}<p><a href="#%C3%ADndice">↑ Voltar ao índice</a></p>`;
}

export function renderReferencesGeneric(referenceSource, fullBody, topicId = '') {
  if (topicId === 'T25') return renderReferences(fullBody);
  const number = referenceSource.match(/^# (\d+)\. Referências\s*$/m)?.[1] || '';
  const sectionRe = new RegExp(`^## ${number}\\.(\\d+)\\s+(.+?)\\s*$([\\s\\S]*?)(?=^## ${number}\\.|\\Z)`, 'gm');
  const sections = [];
  const idCounts = new Map();
  for (const m of referenceSource.matchAll(sectionRe)) {
    const sub = Number(m[1]);
    if (sub < 2 || sub > 6) continue;
    const title = m[2].trim();
    const items = listItems(m[3]);
    if (!items.length) continue;
    const isBibliography = /literatura|bibliografia/i.test(title);
    const cleanTitle = topicId === 'T24' && isBibliography ? 'Bibliografia' : title;
    const baseId = topicId === 'T24' && isBibliography ? 'bibliografia' : (portableBaseSlug(cleanTitle) || 'referencia');
    const n = idCounts.get(baseId) || 0;
    const id = n === 0 ? baseId : `${baseId}-${n}`;
    idCounts.set(baseId, n + 1);
    const kind = isBibliography ? 'REFERÊNCIA' : 'FONTE OFICIAL';
    sections.push(`<section class="reference-section"><h2 id="${escapeAttribute(id)}">${escapeHtml(cleanTitle)}</h2><div class="reference-directory">${items.map(item => referenceCard(item, kind, isBibliography ? 'Referência bibliográfica' : '')).join('')}</div></section>`);
  }
  const end = String(fullBody).match(/^\*\*Fim — ([^\n]+)\*\*\s*$/m)?.[0] || '';
  return `<h1 class="chapter-title" id="referências">Referências</h1>${sections.join('')}<hr>${end ? `<p>${renderInline(end)}</p>` : ''}`;
}
