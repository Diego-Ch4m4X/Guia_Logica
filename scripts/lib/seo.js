import { escapeAttribute } from './html.js';

export const SEO = Object.freeze({
  rootUrl: 'https://diego-ch4m4x.github.io/',
  rootWebsiteId: 'https://diego-ch4m4x.github.io/#website',
  rootPersonId: 'https://diego-ch4m4x.github.io/#person',
  guideUrl: 'https://diego-ch4m4x.github.io/Guia_Logica/',
  guidePageId: 'https://diego-ch4m4x.github.io/Guia_Logica/#webpage',
  siteName: 'Diego Ch4m4X',
  guideTitle: 'Lógica, Fundamentos, Algoritmos e Estruturas de Dados',
  imageUrl: 'https://diego-ch4m4x.github.io/Guia_Logica/assets/img/project-cover-hero.webp',
  imageType: 'image/webp',
  imageWidth: 1672,
  imageHeight: 941,
  imageAlt: 'Capa do guia Lógica, Fundamentos, Algoritmos e Estruturas de Dados',
  language: 'pt-BR',
  ogLocale: 'pt_BR',
});

function jsonForScript(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function metaProperty(property, content) {
  return `<meta property="${escapeAttribute(property)}" content="${escapeAttribute(content)}">`;
}

function metaName(name, content) {
  return `<meta name="${escapeAttribute(name)}" content="${escapeAttribute(content)}">`;
}

function canonicalTag(url) {
  return `<link rel="canonical" href="${escapeAttribute(url)}">`;
}

function structuredData(value) {
  return `<script type="application/ld+json">${jsonForScript(value)}</script>`;
}

function commonSocial({ title, description, canonical, type }) {
  return [
    canonicalTag(canonical),
    metaProperty('og:title', title),
    metaProperty('og:type', type),
    metaProperty('og:image', SEO.imageUrl),
    metaProperty('og:url', canonical),
    metaProperty('og:locale', SEO.ogLocale),
    metaProperty('og:site_name', SEO.siteName),
    metaProperty('og:description', description),
    metaProperty('og:image:type', SEO.imageType),
    metaProperty('og:image:width', SEO.imageWidth),
    metaProperty('og:image:height', SEO.imageHeight),
    metaProperty('og:image:alt', SEO.imageAlt),
    metaName('twitter:card', 'summary_large_image'),
    metaName('twitter:title', title),
    metaName('twitter:description', description),
    metaName('twitter:image', SEO.imageUrl),
    metaName('twitter:image:alt', SEO.imageAlt),
  ];
}

export function canonicalForHome() {
  return SEO.guideUrl;
}

export function canonicalForTopic(topic) {
  return `${SEO.guideUrl}topicos/${topic.id.toLowerCase()}/`;
}

export function buildHomeJsonLd({ title, description }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': SEO.guidePageId,
    url: SEO.guideUrl,
    name: title,
    description,
    inLanguage: SEO.language,
    isPartOf: { '@id': SEO.rootWebsiteId },
    creator: {
      '@type': 'Person',
      '@id': SEO.rootPersonId,
      name: SEO.siteName,
      url: SEO.rootUrl,
    },
  };
}

export function buildTopicJsonLd(topic) {
  const canonical = canonicalForTopic(topic);
  const webpageId = `${canonical}#webpage`;
  const articleId = `${canonical}#article`;
  const breadcrumbId = `${canonical}#breadcrumb`;
  const pageTitle = `${topic.id} — ${topic.title}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: canonical,
        name: pageTitle,
        description: topic.description,
        inLanguage: SEO.language,
        isPartOf: { '@id': SEO.rootWebsiteId },
        mainEntity: { '@id': articleId },
        breadcrumb: { '@id': breadcrumbId },
        lastReviewed: topic.last_reviewed,
      },
      {
        '@type': 'Article',
        '@id': articleId,
        headline: topic.title,
        description: topic.description,
        image: SEO.imageUrl,
        articleSection: topic.category,
        keywords: topic.tags,
        inLanguage: SEO.language,
        dateCreated: topic.created,
        author: {
          '@type': 'Person',
          '@id': SEO.rootPersonId,
          name: SEO.siteName,
          url: SEO.rootUrl,
        },
        mainEntityOfPage: { '@id': webpageId },
        isPartOf: { '@id': SEO.guidePageId },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SEO.siteName, item: SEO.rootUrl },
          { '@type': 'ListItem', position: 2, name: SEO.guideTitle, item: SEO.guideUrl },
          { '@type': 'ListItem', position: 3, name: pageTitle, item: canonical },
        ],
      },
    ],
  };
}

export function renderHomeSeoHead({ title, description }) {
  const lines = commonSocial({
    title,
    description,
    canonical: canonicalForHome(),
    type: 'website',
  });
  lines.push(structuredData(buildHomeJsonLd({ title, description })));
  return lines.map(line => `  ${line}`).join('\n');
}

export function renderTopicSeoHead(topic) {
  const title = `${topic.id} — ${topic.title}`;
  const lines = commonSocial({
    title,
    description: topic.description,
    canonical: canonicalForTopic(topic),
    type: 'article',
  });
  lines.push(structuredData(buildTopicJsonLd(topic)));
  return lines.map(line => `  ${line}`).join('\n');
}

export function renderSitemap(topics) {
  const urls = [canonicalForHome(), ...topics.map(canonicalForTopic)];
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const url of urls) {
    lines.push('  <url>', `    <loc>${escapeAttribute(url)}</loc>`, '  </url>');
  }
  lines.push('</urlset>');
  return `${lines.join('\n')}\n`;
}
