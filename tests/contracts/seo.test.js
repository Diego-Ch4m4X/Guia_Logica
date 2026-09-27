import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GUIDE = 'https://diego-ch4m4x.github.io/Guia_Logica/';
const ROOT_WEBSITE_ID = 'https://diego-ch4m4x.github.io/#website';
const ROOT_PERSON_ID = 'https://diego-ch4m4x.github.io/#person';
const REQUIRED_OG = ['og:title','og:type','og:image','og:url','og:locale','og:site_name','og:description','og:image:type','og:image:width','og:image:height','og:image:alt'];
const REQUIRED_TWITTER = ['twitter:card','twitter:title','twitter:description','twitter:image','twitter:image:alt'];

async function read(rel) { return readFile(path.join(ROOT, rel), 'utf8'); }
async function readJson(rel) { return JSON.parse(await read(rel)); }
function occurrences(html, re) { return [...html.matchAll(re)]; }
function attrMeta(html, attr, value) {
  const re = new RegExp(`<meta\\s+${attr}=["']${value.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}["']\\s+content=["']([^"']*)["']`, 'g');
  return occurrences(html, re).map(m => m[1]);
}
function canonical(html) {
  const found = occurrences(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/g);
  assert.equal(found.length, 1, 'each page must have exactly one canonical');
  return found[0][1];
}
function jsonLd(html) {
  const found = occurrences(html, /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/g);
  assert.equal(found.length, 1, 'each page must have exactly one JSON-LD script');
  return JSON.parse(found[0][1]);
}
function graphNode(doc, type) {
  return (doc['@graph'] || []).find(node => node['@type'] === type);
}

async function pages() {
  const out = [{ rel:'index.html', expected:GUIDE, kind:'home' }];
  for (let n=1; n<=35; n+=1) {
    const id=`T${String(n).padStart(2,'0')}`;
    out.push({ rel:`topicos/${id.toLowerCase()}/index.html`, expected:`${GUIDE}topicos/${id.toLowerCase()}/`, kind:'topic', id, number:n });
  }
  return out;
}

test('SEO metadata is complete and canonical on all 36 pages', async () => {
  const seen = new Set();
  for (const page of await pages()) {
    const html = await read(`dist/${page.rel}`);
    const url = canonical(html);
    assert.equal(url, page.expected, `${page.rel} canonical`);
    assert.match(url, /^https:\/\//);
    assert.ok(!/[?#]/.test(url), `${page.rel} canonical must have no query/fragment`);
    assert.ok(!seen.has(url), `${page.rel} duplicate canonical`);
    seen.add(url);

    for (const property of REQUIRED_OG) assert.equal(attrMeta(html,'property',property).length,1,`${page.rel} ${property}`);
    for (const name of REQUIRED_TWITTER) assert.equal(attrMeta(html,'name',name).length,1,`${page.rel} ${name}`);
    assert.equal(attrMeta(html,'property','og:url')[0],url,`${page.rel} og:url`);
    assert.equal(attrMeta(html,'property','og:type')[0],page.kind === 'home' ? 'website' : 'article');
    assert.equal(attrMeta(html,'name','twitter:card')[0],'summary_large_image');
    assert.ok(!html.includes('{{'), `${page.rel} unresolved template token`);
    jsonLd(html);
  }
  assert.equal(seen.size,36);
});

test('Guide home JSON-LD is a CollectionPage belonging to the root WebSite', async () => {
  const doc=jsonLd(await read('dist/index.html'));
  assert.equal(doc['@type'],'CollectionPage');
  assert.equal(doc['@id'],`${GUIDE}#webpage`);
  assert.equal(doc.url,GUIDE);
  assert.equal(doc.isPartOf?.['@id'],ROOT_WEBSITE_ID);
  assert.equal(doc.creator?.['@id'],ROOT_PERSON_ID);
  assert.notEqual(doc['@type'],'WebSite');
  assert.ok(!(doc['@graph']||[]).some(node=>node['@type']==='WebSite'));
});

test('topic JSON-LD matches canonical topic metadata', async () => {
  const topics=await readJson('dist/data/topics.json');
  assert.equal(topics.length,35);
  for (const topic of topics) {
    const id=`T${String(topic.number).padStart(2,'0')}`;
    const canonicalUrl=`${GUIDE}topicos/${id.toLowerCase()}/`;
    const doc=jsonLd(await read(`dist/topicos/${id.toLowerCase()}/index.html`));
    const webPage=graphNode(doc,'WebPage');
    const article=graphNode(doc,'Article');
    const breadcrumb=graphNode(doc,'BreadcrumbList');
    assert.ok(webPage && article && breadcrumb,`${id} required graph nodes`);
    assert.equal(webPage.url,canonicalUrl);
    assert.equal(webPage.description,topic.description);
    assert.equal(webPage.lastReviewed,topic.last_reviewed);
    assert.equal(webPage.isPartOf?.['@id'],ROOT_WEBSITE_ID);
    assert.equal(article.headline,topic.title);
    assert.equal(article.description,topic.description);
    assert.equal(article.articleSection,topic.category);
    assert.deepEqual(article.keywords,topic.tags);
    assert.equal(article.dateCreated,topic.created);
    assert.equal(article.author?.['@id'],ROOT_PERSON_ID);
    assert.equal(article.mainEntityOfPage?.['@id'],`${canonicalUrl}#webpage`);
    assert.equal(article.isPartOf?.['@id'],`${GUIDE}#webpage`);
    assert.equal(breadcrumb.itemListElement?.length,3);
    assert.equal(breadcrumb.itemListElement?.[0]?.item,'https://diego-ch4m4x.github.io/');
    assert.equal(breadcrumb.itemListElement?.[1]?.item,GUIDE);
    assert.equal(breadcrumb.itemListElement?.[2]?.item,canonicalUrl);
  }
});

test('sitemap is exactly the ordered set of 36 canonicals', async () => {
  const xml=await read('dist/sitemap.xml');
  assert.match(xml,/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml,/<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  const locs=occurrences(xml,/<loc>([^<]+)<\/loc>/g).map(m=>m[1]);
  const expected=(await pages()).map(page=>page.expected);
  assert.deepEqual(locs,expected);
  assert.equal(new Set(locs).size,36);
  assert.ok(locs.every(url=>url.startsWith('https://')));
  assert.ok(!xml.includes('<priority>'));
  assert.ok(!xml.includes('<changefreq>'));
  assert.ok(!xml.includes('<lastmod>'));
});
