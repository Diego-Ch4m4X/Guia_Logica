import { escapeAttribute, escapeHtml } from './html.js';
import { portableBaseSlug } from './slug.js';
import { renderInline } from './markdown.js';

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
    return segment.replace(/^<h1([^>]*)>/, '<h2 class="chapter-title"$1>').replace(/<\/h1>/, '</h2>');
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

export function enhanceTopicHtml(html, topicId='T25') {
  const groups = [
    { key:'transferencia', endId:'19-mesmo-adt-mecanismos-diferentes', panels:[
      {id:'15-python--abstração-e-implementação-concreta',key:'python',label:'Python'},
      {id:'16-javascript--contrato-sem-queue-padrão',key:'javascript',label:'JavaScript'},
      {id:'17-java--interface-e-implementação-explícitas',key:'java',label:'Java'},
      {id:'18-gnu-bash--abstração-por-disciplina-de-funções-e-estado',key:'shell',label:'Shell / GNU Bash'}]},
    { key:'bibliotecas', endId:'parte-v--contratos-substituição-decisão-e-diagnóstico', panels:[
      {id:'21-python--list-deque-dict-e-a-camada-correta',key:'python',label:'Python'},
      {id:'22-javascript--semântica-padronizada-não-implica-layout-padronizado',key:'javascript',label:'JavaScript'},
      {id:'23-java--uma-interface-pode-ter-várias-implementações',key:'java',label:'Java'},
      {id:'24-bash--indexed-array-e-associative-array-não-são-adts-universais',key:'shell',label:'Shell / GNU Bash'}]},
    { key:'mapeamento', endId:'257-mesma-intenção-semânticas-diferentes', panels:[
      {id:'253-python',key:'python',label:'Python'}, {id:'254-javascript',key:'javascript',label:'JavaScript'},
      {id:'255-java',key:'java',label:'Java'}, {id:'256-bash',key:'shell',label:'Shell / GNU Bash'}]},
    { key:'fila', endId:'396-o-que-foi-transferido', panels:[
      {id:'392-python',key:'python',label:'Python'}, {id:'393-javascript',key:'javascript',label:'JavaScript'},
      {id:'394-java',key:'java',label:'Java'}, {id:'395-bash',key:'shell',label:'Shell / GNU Bash'}]}
  ];
  for (const group of groups) html = wrapTabGroup(html, group);
  html = wrapLabs(html, topicId);
  html = wrapExercises(html, topicId);
  return html;
}

export function publicationSlices(body) {
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
  const entries = rows.map(line => line.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim())).filter(x=>x.length>=2);
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

function referenceCard(item, kind, domainLabel='') {
  const m = item.match(/^(.*?):\s*<((?:https?):\/\/[^>]+)>\s*$/);
  if (!m) {
    const cleaned = item.replace(/ disponível na File Library\.?$/, '.');
    return `<div class="reference-card no-link"><span class="reference-kind">${kind}</span><span class="reference-title">${renderInline(cleaned)}</span><span class="reference-domain">${domainLabel || 'Referência bibliográfica'}</span></div>`;
  }
  const label = m[1] + ':';
  const url = m[2];
  let domain = '';
  try { domain = new URL(url).hostname; } catch { domain = domainLabel; }
  return `<div class="reference-card"><span class="reference-kind">${kind}</span><a class="reference-title" href="${escapeAttribute(url)}" rel="noopener noreferrer" target="_blank">${renderInline(label)}</a><span class="reference-domain">${escapeHtml(domain)}</span></div>`;
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

export function enhanceTopicHtmlGeneric(html, topicId) {
  let out = wrapLabsGeneric(html, topicId);
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

export function publicationSlicesGeneric(body) {
  const normalized = String(body).replace(/\r\n?/g, '\n');
  const glossary = topLevelSection(normalized, '\\d+\\. Glossário');
  const references = topLevelSection(normalized, '\\d+\\. Referências');
  if (!glossary || !references) return { core: normalized, glossarySource: '', referencesSource: '' };
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
  return { core, glossarySource: glossary.text, referencesSource: references.text };
}

export function renderGlossaryGeneric(glossarySource, topicId) {
  const number = glossarySource.match(/^# (\d+)\. Glossário\s*$/m)?.[1] || '';
  const rows = glossarySource.split('\n').filter(line => /^\|/.test(line)).slice(2);
  const entries = rows.map(line => line.trim().replace(/^\||\|$/g,'').split('|').map(x => x.trim())).filter(x => x.length >= 2);
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
