import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { projectRoot, contentDir, templateDir, assetDir, distDir, dataDir } from './lib/paths.js';
import { parseDocument, topicIdFromFilename } from './lib/metadata.js';
import { renderMarkdown } from './lib/markdown.js';
import {
  headingsFromHtml,
  publicationSlicesGeneric,
  enhanceTopicHtmlGeneric,
  renderGlossaryGeneric,
  renderReferencesGeneric,
  offsetTopicHeadings,
} from './lib/components.js';
import { buildGuide, buildToc, buildDrawer } from './lib/navigation.js';
import { applyTemplate, extractSlot, escapeHtml } from './lib/html.js';
import { renderHomeSeoHead, renderTopicSeoHead, renderSitemap } from './lib/seo.js';
import { renderHomeTopicGrid } from './lib/home.js';
import { projectVersion } from './lib/config.js';

const ASSET_VERSION = projectVersion();
const HOME_TITLE = 'Lógica, Fundamentos, Algoritmos e Estruturas de Dados';
const HOME_DESCRIPTION = 'Coleção técnica de 35 tópicos sobre lógica, fundamentos, algoritmos e estruturas de dados.';

async function read(file) { return fs.readFile(file, 'utf8'); }
async function write(file, content) { await fs.mkdir(path.dirname(file), { recursive:true }); await fs.writeFile(file, content, 'utf8'); }

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive:true });
  for (const entry of await fs.readdir(src, { withFileTypes:true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(from, to);
    else if ((path.relative(assetDir, from).startsWith(`js${path.sep}`) && entry.name.endsWith('.js'))
      || (path.relative(assetDir, from).startsWith(`css${path.sep}`) && entry.name.endsWith('.css'))) {
      const source = await read(from);
      await write(to, source.replaceAll('__ASSET_VERSION__', ASSET_VERSION));
    } else await fs.copyFile(from, to);
  }
}

async function loadTopics() {
  const names = (await fs.readdir(contentDir)).filter(n => n.endsWith('.md')).sort();
  const topics = [];
  for (const name of names) {
    const source = await read(path.join(contentDir, name));
    const parsed = parseDocument(source);
    const file = topicIdFromFilename(name);
    topics.push({ ...parsed.metadata, number:file.number, id:file.id, file:name, heading:parsed.metadata.title, sourceBody:parsed.body });
  }
  return topics.sort((a,b) => a.number - b.number);
}

function articleHead(topic) {
  const labels = { python:'Python', javascript:'JavaScript', java:'Java', bash:'GNU Bash' };
  const langs = Object.entries(topic.languages || {}).filter(([,enabled]) => enabled).map(([name]) => labels[name] || name);
  return `<p class="eyebrow">${topic.id} · ${escapeHtml(topic.category)}</p><h1>${escapeHtml(topic.title)}</h1><p class="lead">${escapeHtml(topic.description)}</p><div class="meta-row"><span class="badge brand">${escapeHtml(topic.status)}</span><span>Versão ${escapeHtml(topic.version)}</span><span>${escapeHtml(langs.join(' · '))}</span></div><div class="mobile-context-bar"><button class="mobile-context-btn" id="openGuideDrawer" type="button">Neste tópico</button><button class="mobile-context-btn" id="openTocDrawer" type="button">Nesta página</button></div>`;
}

function topicOverview(topic, body) {
  const labs = (body.match(/^#{1,6}\s+.*(?:LAB|Laboratório)\s+\d+/gmi) || []).length;
  const enabledLanguages = Object.entries(topic.languages || {})
    .filter(([, enabled]) => enabled)
    .map(([language]) => ({ python:'Python', javascript:'JavaScript', java:'Java', bash:'GNU Bash' })[language] || language);
  const difficulty = Array.isArray(topic.difficulty) ? topic.difficulty : topic.difficulty ? [topic.difficulty] : [];
  const scopeItems = [
    topic.category && `Categoria: ${topic.category}`,
    ...difficulty.map(level => `Nível: ${level}`),
  ].filter(Boolean);
  const infoCards = [
    ['Escopo', scopeItems],
    ['Linguagens', enabledLanguages],
  ].filter(([, items]) => items.length)
    .map(([title, items]) => `<section class="info-card"><h2>${escapeHtml(title)}</h2><ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`)
    .join('');
  const infoGrid = infoCards ? `<div class="info-grid">${infoCards}</div>` : '';

  return `<div class="quick-answer"><h2 class="quick-kicker"><span aria-hidden="true" class="quick-symbol"></span>Visão geral</h2><p>${escapeHtml(topic.description)}</p></div><div class="stat-grid"><div class="stat-card"><strong>${labs}</strong><span>LABs</span></div><div class="stat-card"><strong>${escapeHtml(topic.version)}</strong><span>Versão do material</span></div></div>${infoGrid}`;
}

function related(topic, topics) {
  const prev = topics.find(x => x.number === topic.number - 1);
  const next = topics.find(x => x.number === topic.number + 1);
  const card = (label, t) => t ? `<a class="related-card" href="../${t.id.toLowerCase()}/"><span class="related-type">${label} · ${t.id}</span><span class="related-title">${escapeHtml(t.title)}</span></a>` : '';
  return `<h2 id="related-title">Continue explorando</h2><div class="related-grid">${card('Anterior',prev)}${card('Próximo',next)}</div>`;
}

async function renderPage(base, pageTemplate, pageValues, baseValues, partials) {
  const suffix = pageValues.TOPIC_ID_LOWER || 'home';
  const values = {
    ...pageValues,
    BRAND_MARK_HEADER:applyTemplate(partials.brandMark, { LOGO_MASK_ID:`filomatia-logo-header-${suffix}` }),
    BRAND_MARK_FOOTER:applyTemplate(partials.brandMark, { LOGO_MASK_ID:`filomatia-logo-footer-${suffix}` }),
    SEARCH_THEME_ACTIONS:partials.searchThemeActions,
    FOOTER_SOCIAL_LINKS:partials.socialLinks,
  };
  const slots = {};
  for (const slot of ['HEAD_STYLES','HEADER','MAIN','FOOTER','PAGE_TEMPLATES','PAGE_SCRIPTS']) {
    slots[slot] = applyTemplate(extractSlot(pageTemplate, slot), values);
  }
  return applyTemplate(base, { ...baseValues, ...slots });
}

function breadcrumb(topic) {
  return `<nav aria-label="Breadcrumb"><ol class="breadcrumb"><li><a href="../../">Início</a></li><li><span aria-hidden="true">/</span></li><li><span>${escapeHtml(topic.category)}</span></li><li><span aria-hidden="true">/</span></li><li aria-current="page">${topic.id}</li></ol></nav>`;
}

function topicPath(topic) { return path.join(distDir, 'topicos', topic.id.toLowerCase(), 'index.html'); }

function homeSearchEntries() {
  return [
    ['Sobre o projeto','01-sobre-o-projeto'],
    ['Por que estudar estes fundamentos','02-por-que-estudar-estes-fundamentos'],
    ['Quatro linguagens, os mesmos fundamentos','03-quatro-linguagens-os-mesmos-fundamentos'],
    ['Como usar este guia','04-como-usar-este-guia'],
    ['Visão panorâmica','05-visão-panorâmica'],
    ['Mapa curricular','mapa-curricular-title'],
    ['Os 35 tópicos','06-os-35-tópicos'],
    ['Parte I — Lógica de Programação · T01–T12','parte-i--lógica-de-programação--t01t12'],
    ['Parte II — Fundamentos de Programação · T13–T23','parte-ii--fundamentos-de-programação--t13t23'],
    ['Parte III — Algoritmos e Estruturas de Dados · T24–T35','parte-iii--algoritmos-e-estruturas-de-dados--t24t35'],
    ['Como o conteúdo é construído','07-como-o-conteúdo-é-construído'],
    ['Fontes normativas e oficiais','08-fontes-normativas-e-oficiais'],
    ['Python','python'],
    ['JavaScript / ECMAScript','javascript--ecmascript'],
    ['Java','java'],
    ['Shell / GNU Bash','shell--gnu-bash'],
    ['JSON e YAML','json-e-yaml'],
    ['Web e publicação','web-e-publicação'],
  ].map(([title,id]) => ({ title, section:'Home', summary:title, url:`index.html#${id}` }));
}

function searchEntriesForTopic(topic, html, sourceHeadingText) {
  const entries = headingsFromHtml(html)
    .filter(h => h.id !== 'related-title')
    .map(h => {
      const title = sourceHeadingText.get(h.id) || h.text;
      return { title, section:topic.id, summary:title, url:`topicos/${topic.id.toLowerCase()}/#${h.id}` };
    });
  entries.push({
    title:`${topic.id} — ${topic.title}`,
    section:'Página técnica',
    summary:topic.description,
    url:`topicos/${topic.id.toLowerCase()}/`,
  });
  return entries;
}

function topicContent(topic) {
  const slices = publicationSlicesGeneric(topic.sourceBody, topic.id);
  const core = renderMarkdown(slices.core, {
    topicId:topic.id,
    canonicalAliases:topic.number !== 24 && topic.number !== 25,
    normalizeHeadingJumps:topic.number !== 24,
  });
  let html = enhanceTopicHtmlGeneric(core.html, topic.id);
  html += renderGlossaryGeneric(slices.glossarySource, topic.id);
  if (slices.postGlossary) html += renderMarkdown(slices.postGlossary, { topicId:topic.id }).html;
  html += renderReferencesGeneric(slices.referencesSource, topic.sourceBody, topic.id);
  return { html:offsetTopicHeadings(html), sourceHeadingText:new Map(core.headings.map(h => [h.id, h.text])) };
}

async function renderTopic(topic, topics, base, topicTpl, partials) {
  const built = topicContent(topic);
  const renderedHeadings = headingsFromHtml(built.html);
  const guideHeadings = renderedHeadings.map(h => ({ ...h, text:built.sourceHeadingText.get(h.id) || h.text }));
  const guide = buildGuide(guideHeadings);
  const guideDrawerTree = guide.replace(/^<nav[^>]*>/, '').replace(/<\/nav>$/, '');
  const values = {
    SITE_ROOT:'../../', ASSET_VERSION,
    TOPIC_ID:topic.id,
    TOPIC_ID_LOWER:topic.id.toLowerCase(),
    TOPIC_URL:`topicos/${topic.id.toLowerCase()}/`,
    TOPIC_SHORT_TITLE:topic.title,
    BREADCRUMBS:breadcrumb(topic),
    GUIDE_CONTENT:guide,
    ARTICLE_HEAD:articleHead(topic),
    TOPIC_OVERVIEW:topicOverview(topic, topic.sourceBody),
    TOPIC_CONTENT:built.html,
    RELATED_CONTENT:related(topic, topics),
    TOC_CONTENT:buildToc(renderedHeadings, 'dynamicToc'),
    GUIDE_DRAWER_CONTENT:buildDrawer('Neste tópico', guideDrawerTree),
    TOC_DRAWER_CONTENT:buildDrawer('Nesta página', buildToc(renderedHeadings, 'dynamicTocDrawer'), 'right'),
  };
  const html = await renderPage(base, topicTpl, values, {
    LANG:'pt-BR', META_DESCRIPTION:topic.description, SITE_ROOT:'../../',
    PAGE_TITLE:`${topic.id} — ${topic.title}`, SEO_HEAD:renderTopicSeoHead(topic), ASSET_VERSION, BODY_CLASS:'topic-page',
  }, partials);
  await write(topicPath(topic), html);
  return { html, sourceHeadingText:built.sourceHeadingText };
}

async function main() {
  const preflightPath = path.join(projectRoot, 'scripts', 'preflight.js');

  const pre = spawnSync(
    process.execPath,
    [preflightPath],
    {
      encoding: 'utf8',
      cwd: projectRoot,
    }
  );
  if (pre.status !== 0) throw new Error(`Preflight required before build:\n${pre.stdout}${pre.stderr}`);

  const topics = await loadTopics();
  if (topics.length !== 35) throw new Error(`Expected 35 topics, found ${topics.length}`);

  await fs.rm(distDir, { recursive:true, force:true });
  await fs.mkdir(distDir, { recursive:true });
  await copyDir(assetDir, path.join(distDir, 'assets'));
  await fs.copyFile(path.join(projectRoot, 'README.md'), path.join(distDir, 'README.md'));

  const base = await read(path.join(templateDir, 'base.html'));
  const homeTpl = await read(path.join(templateDir, 'home.html'));
  const topicTpl = await read(path.join(templateDir, 'topic.html'));
  const partials = {
    brandMark:await read(path.join(templateDir, 'partials', 'brand-mark.html')),
    searchThemeActions:await read(path.join(templateDir, 'partials', 'search-theme-actions.html')),
    socialLinks:await read(path.join(templateDir, 'partials', 'social-links.html')),
  };

  const homeValues = {
    SITE_ROOT:'./', ASSET_VERSION,
    TOPICS_GRID_1:renderHomeTopicGrid(topics,1),
    TOPICS_GRID_2:renderHomeTopicGrid(topics,2),
    TOPICS_GRID_3:renderHomeTopicGrid(topics,3),
  };
  const homeHtml = await renderPage(base, homeTpl, homeValues, {
    LANG:'pt-BR', META_DESCRIPTION:HOME_DESCRIPTION,
    SITE_ROOT:'./', PAGE_TITLE:HOME_TITLE, SEO_HEAD:renderHomeSeoHead({ title:HOME_TITLE, description:HOME_DESCRIPTION }), ASSET_VERSION, BODY_CLASS:'home-page',
  }, partials);
  await write(path.join(distDir,'index.html'), homeHtml);

  const rendered = new Map();
  for (const topic of topics) {
    rendered.set(topic.id, await renderTopic(topic, topics, base, topicTpl, partials));
  }

  const topicsJson = topics.map(({ sourceBody, id, ...t }) => ({ ...t, url:`topicos/${id.toLowerCase()}/` }));
  await fs.mkdir(dataDir, { recursive:true });
  await write(path.join(dataDir,'topics.json'), `${JSON.stringify(topicsJson, null, 2)}\n`);

  const search = [...homeSearchEntries()];
  for (const topic of topics) {
    const info = rendered.get(topic.id);
    search.push(...searchEntriesForTopic(topic, info.html, info.sourceHeadingText));
  }
  search.push({ title:'Mapa curricular', section:'Home', summary:'Taxonomia canônica T01 a T35', url:'index.html#mapa-curricular' });
  await write(path.join(dataDir,'search-index.json'), `${JSON.stringify(search, null, 2)}\n`);
  await write(path.join(dataDir,'package.json'), `${JSON.stringify({ version:ASSET_VERSION }, null, 2)}\n`);
  await write(path.join(distDir,'sitemap.xml'), renderSitemap(topics));

  console.log('BUILD: PASS');
  console.log('generated: Home + T01–T35');
  console.log('topics.json: 35');
  console.log(`search-index.json: ${search.length}`);
  console.log('sitemap.xml: 36');
}

main().catch(error => { console.error(`BUILD: FAIL\n${error.stack || error}`); process.exitCode = 1; });
