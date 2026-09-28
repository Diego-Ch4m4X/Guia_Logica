import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { distDir } from './lib/paths.js';

const reviewedPath = new URL('./external-link-exceptions.json', import.meta.url);

export function classifyExternalResponse(url, status, finalUrl, reviewed) {
  if (finalUrl?.startsWith('http://')) return 'FAIL';
  if (status >= 200 && status < 300) return 'PASS';
  if (status === 404 || status === 410 || status >= 500 && status < 600) return 'FAIL';
  const entry = reviewed.find(item => item.url === url);
  if (entry?.classification === 'automation-restricted' && entry.expected.includes(status)) return 'RESTRICTED_REVIEWED';
  if ([401, 403, 429, 999].includes(status)) return 'INDETERMINATE';
  return 'FAIL';
}

async function main() {
  const reviewed = JSON.parse(await fs.readFile(reviewedPath, 'utf8')).reviewed;
  if (new Set(reviewed.map(item => item.url)).size !== reviewed.length) throw new Error('duplicate reviewed URL');
  const pages = ['index.html', ...Array.from({ length: 35 }, (_, i) => `topicos/t${String(i + 1).padStart(2, '0')}/index.html`)];
  const occurrences = [];
  for (const page of pages) {
    const html = await fs.readFile(path.join(distDir, page), 'utf8');
    for (const tag of html.matchAll(/<a\b[^>]*>/gi)) {
      const href = tag[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
      if (href && /^https?:\/\//i.test(href)) occurrences.push(href);
    }
  }
  const urls = [...new Set(occurrences)].sort();
  const domains = new Set(urls.map(url => new URL(url).hostname));
  const http = urls.filter(url => url.startsWith('http://'));
  const results = { PASS: [], RESTRICTED_REVIEWED: [], FAIL: http.map(url => ({ url, observed: 'HTTP URL', attempts: 0 })), INDETERMINATE: [] };
  let retries = 0;

  async function check(url) {
    let observed;
    let finalUrl;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(url, {
          redirect: 'follow',
          signal: AbortSignal.timeout(15_000),
          headers: {
            'User-Agent': 'Guia-Logica-link-check/1.0 (+https://github.com/Diego-Ch4m4X/Guia_Logica)',
            Accept: 'text/html,application/xhtml+xml,application/pdf,*/*;q=0.8',
          },
        });
        observed = response.status;
        finalUrl = response.url;
        await response.body?.cancel();
        const classification = classifyExternalResponse(url, observed, finalUrl, reviewed);
        if (classification === 'PASS' || observed === 404 || observed === 410 || finalUrl.startsWith('http://')) {
          results[classification].push({ url, observed, attempts: attempt, finalUrl });
          return;
        }
      } catch (error) {
        observed = error.cause?.code || error.name || String(error);
        finalUrl = undefined;
      }
      if (attempt < 3) { retries += 1; await new Promise(resolve => setTimeout(resolve, 500 * attempt)); }
      else {
        const classification = typeof observed === 'number'
          ? classifyExternalResponse(url, observed, finalUrl, reviewed) : 'FAIL';
        results[classification].push({ url, observed, attempts: attempt, ...(finalUrl && { finalUrl }) });
      }
    }
  }

  let next = 0;
  await Promise.all(Array.from({ length: Math.min(8, urls.length) }, async () => {
    while (next < urls.length) {
      const url = urls[next++];
      if (url.startsWith('https://')) await check(url);
    }
  }));

  console.log(`pages: ${pages.length}`);
  console.log(`occurrences: ${occurrences.length}`);
  console.log(`unique URLs: ${urls.length}`);
  console.log(`domains: ${domains.size}`);
  console.log(`http: ${http.length}`);
  console.log(`https: ${urls.length - http.length}`);
  console.log(`verified: ${results.PASS.length}`);
  console.log(`restricted-reviewed: ${results.RESTRICTED_REVIEWED.length}`);
  console.log(`failed: ${results.FAIL.length}`);
  console.log(`indeterminate: ${results.INDETERMINATE.length}`);
  console.log(`retries: ${retries}`);
  for (const item of results.RESTRICTED_REVIEWED) console.log(`RESTRICTED_REVIEWED ${item.url} observed: ${item.observed}`);
  for (const item of [...results.FAIL, ...results.INDETERMINATE]) console.error(JSON.stringify(item));
  if (results.FAIL.length || results.INDETERMINATE.length) { console.error('EXTERNAL_LINKS: FAIL'); process.exitCode = 1; }
  else console.log('EXTERNAL_LINKS: PASS');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`EXTERNAL_LINKS: FAIL\n${error.stack || error}`); process.exitCode = 1; });
}
