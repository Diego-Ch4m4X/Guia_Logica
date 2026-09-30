import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { distDir } from './lib/paths.js';

const reviewedPath = new URL('./external-link-exceptions.json', import.meta.url);

const TRANSIENT_TRANSPORT_CODES = new Set([
  'ABORT_ERR',
  'ECONNRESET',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'TimeoutError',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
]);

const DEFAULT_CHECK_OPTIONS = Object.freeze({
  attempts: 3,
  timeoutMs: 15_000,
  retryBaseMs: 1_000,
  globalConcurrency: 6,
  perHostConcurrency: 1,
  transientHostThreshold: 2,
  maxTransientHosts: 1,
});

export function classifyExternalResponse(url, status, finalUrl, reviewed) {
  if (finalUrl?.startsWith('http://')) return 'FAIL';
  if (status >= 200 && status < 300) return 'PASS';
  if (status === 404 || status === 410 || status >= 500 && status < 600) return 'FAIL';
  const entry = reviewed.find(item => item.url === url);
  if (entry?.classification === 'automation-restricted' && entry.expected.includes(status)) return 'RESTRICTED_REVIEWED';
  if ([401, 403, 429, 999].includes(status)) return 'INDETERMINATE';
  return 'FAIL';
}

export function classifyExternalTransport(observed) {
  return TRANSIENT_TRANSPORT_CODES.has(String(observed)) ? 'TRANSIENT_UNVERIFIED' : 'FAIL';
}

export function externalLinkCheckFails(results, maxTransientHosts = DEFAULT_CHECK_OPTIONS.maxTransientHosts) {
  if (results.FAIL.length || results.INDETERMINATE.length) return true;
  if (!results.TRANSIENT_UNVERIFIED.length) return false;
  const reachable = results.PASS.length + results.RESTRICTED_REVIEWED.length;
  if (reachable === 0) return true;
  const transientHosts = new Set(results.TRANSIENT_UNVERIFIED.map(item => item.host || new URL(item.url).hostname));
  return transientHosts.size > maxTransientHosts;
}

function createLimiter(limit) {
  let active = 0;
  const waiters = [];
  return async function run(task) {
    if (active >= limit) await new Promise(resolve => waiters.push(resolve));
    active += 1;
    try {
      return await task();
    } finally {
      active -= 1;
      waiters.shift()?.();
    }
  };
}

function observedFromError(error) {
  return error?.cause?.code || error?.code || error?.name || String(error);
}

function resultItem(url, observed, attempts, finalUrl) {
  return {
    url,
    observed,
    attempts,
    host: new URL(url).hostname,
    ...(finalUrl && { finalUrl }),
  };
}

export async function checkExternalUrls(urls, reviewed, options = {}) {
  const config = { ...DEFAULT_CHECK_OPTIONS, ...options };
  const fetchImpl = options.fetchImpl || fetch;
  const sleep = options.sleep || (ms => new Promise(resolve => setTimeout(resolve, ms)));
  const results = { PASS: [], RESTRICTED_REVIEWED: [], FAIL: [], INDETERMINATE: [], TRANSIENT_UNVERIFIED: [] };
  const globalLimit = createLimiter(config.globalConcurrency);
  const hostLimiters = new Map();
  const hostStates = new Map();
  let retries = 0;

  function limiterFor(host) {
    if (!hostLimiters.has(host)) hostLimiters.set(host, createLimiter(config.perHostConcurrency));
    return hostLimiters.get(host);
  }

  function stateFor(host) {
    if (!hostStates.has(host)) hostStates.set(host, { transientFailures: 0, open: false });
    return hostStates.get(host);
  }

  async function check(url) {
    let observed;
    let finalUrl;
    for (let attempt = 1; attempt <= config.attempts; attempt += 1) {
      try {
        const response = await fetchImpl(url, {
          redirect: 'follow',
          signal: AbortSignal.timeout(config.timeoutMs),
          headers: {
            'User-Agent': 'Guia-Logica-link-check/1.0 (+https://github.com/Diego-Ch4m4X/Guia_Logica)',
            Accept: 'text/html,application/xhtml+xml,application/pdf,*/*;q=0.8',
          },
        });
        observed = response.status;
        finalUrl = response.url;
        await response.body?.cancel?.();
        const classification = classifyExternalResponse(url, observed, finalUrl, reviewed);
        const terminal = classification === 'PASS'
          || classification === 'RESTRICTED_REVIEWED'
          || observed === 404
          || observed === 410
          || finalUrl?.startsWith('http://');
        if (terminal) return { classification, item: resultItem(url, observed, attempt, finalUrl) };
      } catch (error) {
        observed = observedFromError(error);
        finalUrl = undefined;
      }

      if (attempt < config.attempts) {
        retries += 1;
        await sleep(config.retryBaseMs * (2 ** (attempt - 1)));
      } else {
        const classification = typeof observed === 'number'
          ? classifyExternalResponse(url, observed, finalUrl, reviewed)
          : classifyExternalTransport(observed);
        return { classification, item: resultItem(url, observed, attempt, finalUrl) };
      }
    }
    throw new Error(`unreachable external-link state for ${url}`);
  }

  await Promise.all(urls.map(url => {
    const host = new URL(url).hostname;
    const hostLimit = limiterFor(host);
    const state = stateFor(host);
    return hostLimit(async () => {
      if (state.open) {
        results.TRANSIENT_UNVERIFIED.push(resultItem(url, 'HOST_TRANSIENT_CIRCUIT_OPEN', 0));
        return;
      }
      const outcome = await globalLimit(async () => {
        if (state.open) return { classification: 'TRANSIENT_UNVERIFIED', item: resultItem(url, 'HOST_TRANSIENT_CIRCUIT_OPEN', 0) };
        return check(url);
      });
      results[outcome.classification].push(outcome.item);
      if (outcome.classification === 'TRANSIENT_UNVERIFIED') {
        state.transientFailures += 1;
        if (state.transientFailures >= config.transientHostThreshold) state.open = true;
      } else if (typeof outcome.item.observed === 'number') {
        state.transientFailures = 0;
      }
    });
  }));

  return { results, retries };
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
  const https = urls.filter(url => url.startsWith('https://'));
  const { results, retries } = await checkExternalUrls(https, reviewed);
  results.FAIL.unshift(...http.map(url => resultItem(url, 'HTTP URL', 0)));
  const transientHosts = new Set(results.TRANSIENT_UNVERIFIED.map(item => item.host));
  const blocked = externalLinkCheckFails(results);

  console.log(`pages: ${pages.length}`);
  console.log(`occurrences: ${occurrences.length}`);
  console.log(`unique URLs: ${urls.length}`);
  console.log(`domains: ${domains.size}`);
  console.log(`http: ${http.length}`);
  console.log(`https: ${https.length}`);
  console.log(`verified: ${results.PASS.length}`);
  console.log(`restricted-reviewed: ${results.RESTRICTED_REVIEWED.length}`);
  console.log(`failed: ${results.FAIL.length}`);
  console.log(`indeterminate: ${results.INDETERMINATE.length}`);
  console.log(`transient-unverified: ${results.TRANSIENT_UNVERIFIED.length}`);
  console.log(`transient-hosts: ${transientHosts.size}`);
  console.log(`retries: ${retries}`);
  for (const item of results.RESTRICTED_REVIEWED) console.log(`RESTRICTED_REVIEWED ${item.url} observed: ${item.observed}`);
  for (const item of [...results.FAIL, ...results.INDETERMINATE]) console.error(JSON.stringify(item));
  for (const item of results.TRANSIENT_UNVERIFIED) console.warn(`TRANSIENT_UNVERIFIED ${JSON.stringify(item)}`);

  if (blocked) {
    console.error('EXTERNAL_LINKS: FAIL');
    process.exitCode = 1;
  } else if (results.TRANSIENT_UNVERIFIED.length) {
    console.log('EXTERNAL_LINKS: PASS_WITH_TRANSIENT');
  } else {
    console.log('EXTERNAL_LINKS: PASS');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`EXTERNAL_LINKS: FAIL\n${error.stack || error}`); process.exitCode = 1; });
}
