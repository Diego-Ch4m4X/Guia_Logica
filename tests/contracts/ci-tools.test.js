import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkExternalUrls,
  classifyExternalResponse,
  classifyExternalTransport,
  externalLinkCheckFails,
} from '../../scripts/check-external-links.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => readFile(path.join(root, file), 'utf8');

function fakeResponse(status, url) {
  return { status, url, body:{ cancel:async () => {} } };
}

function transportError(code) {
  const error = new TypeError('fetch failed');
  error.cause = { code };
  return error;
}

test('workflow keeps one build per PR and gates before Pages upload', async () => {
  const workflow = await read('.github/workflows/pages.yml');
  assert.match(workflow, /on:\s*\n\s*push:\s*\n\s*branches:\s*\n\s*- main\s*\n\s*pull_request:\s*\n\s*branches:\s*\n\s*- main\s*\n\s*workflow_dispatch:/);
  assert.match(workflow, /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020/);
  assert.match(workflow, /actions\/setup-java@de7274f081f381c8f8158605e0321c36c376e2e6/);
  assert.match(workflow, /node-version-file: \.node-version/);
  assert.match(workflow, /distribution: temurin\s*\n\s*java-version: '17'/);
  assert.match(workflow, /java -version/);
  assert.match(workflow, /npm ci --ignore-scripts/);
  assert.doesNotMatch(workflow, /run: npm run preflight/);
  const ordered = ['npm run build', 'npm run validate', 'npm run validate:html', 'npm run validate:js', 'npm test', 'npm run validate:pages', 'npm run check:external-links', 'actions/upload-pages-artifact@'];
  let previous = -1;
  for (const step of ordered) {
    const index = workflow.indexOf(step);
    assert.ok(index > previous, `${step} missing or out of order`);
    previous = index;
  }
  assert.match(workflow, /if: github\.event_name != 'pull_request' && github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /needs: deploy/);
  assert.match(workflow, /production routes: 36\/36/);
});

test('local runtime supports source and package roots without pilot contracts', async () => {
  const start = await read('tools/static-runtime/start.ps1');
  const stop = await read('tools/static-runtime/stop.ps1');
  for (const old of [/LOGICA_HOME_T25_PILOTO_v/, /88 SVG/, /activity-flow/, /\^\\d\+\\\.\\d\+/]) {
    assert.doesNotMatch(start, old);
  }
  assert.match(start, /dist\\data\\package\.json/);
  assert.match(start, /Join-Path \$projectRoot 'data\\package\.json'/);
  assert.match(start, /\[switch\]\$NoBrowser/);
  assert.match(start, /1\.\.35/);
  assert.match(start, /X-Filomatia-Package/);
  assert.match(start, /no-store/);
  assert.match(start, /X-Content-Type-Options/);
  assert.match(stop, /dist\\data\\package\.json/);
  assert.match(stop, /Test-OwnedProcess/);
  assert.match(await read('.gitignore'), /^\.runtime\/$/m);
});

test('reviewed external restrictions are exact URL and status only', async () => {
  const reviewed = JSON.parse(await read('scripts/external-link-exceptions.json')).reviewed;
  assert.equal(reviewed.length, 3);
  for (const item of reviewed) {
    assert.match(item.url, /^https:\/\//);
    assert.equal(item.classification, 'automation-restricted');
    assert.ok(item.reason);
    assert.equal(classifyExternalResponse(item.url, item.expected[0], item.url, reviewed), 'RESTRICTED_REVIEWED');
    assert.equal(classifyExternalResponse(item.url, 404, item.url, reviewed), 'FAIL');
    assert.equal(classifyExternalResponse(item.url, 500, item.url, reviewed), 'FAIL');
  }
  assert.equal(classifyExternalResponse('https://example.org/new', 403, 'https://example.org/new', reviewed), 'INDETERMINATE');
  assert.equal(classifyExternalResponse('https://example.org/new', 429, 'https://example.org/new', reviewed), 'INDETERMINATE');
  assert.equal(classifyExternalResponse('https://example.org/new', 999, 'https://example.org/new', reviewed), 'INDETERMINATE');
  assert.equal(classifyExternalResponse(reviewed[0].url, 200, reviewed[0].url, reviewed), 'PASS');
  assert.equal(classifyExternalResponse(reviewed[0].url, 200, 'http://example.org/', reviewed), 'FAIL');
});

test('transport failures distinguish transient network conditions from hard failures', () => {
  for (const code of ['ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET', 'TimeoutError']) {
    assert.equal(classifyExternalTransport(code), 'TRANSIENT_UNVERIFIED', code);
  }
  for (const code of ['ENOTFOUND', 'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'TypeError']) {
    assert.equal(classifyExternalTransport(code), 'FAIL', code);
  }
});

test('external link gate tolerates one transient host but not hard or broad uncertainty', () => {
  const empty = () => ({ PASS: [], RESTRICTED_REVIEWED: [], FAIL: [], INDETERMINATE: [], TRANSIENT_UNVERIFIED: [] });

  const oneHost = empty();
  oneHost.PASS.push({ url:'https://ok.example/', host:'ok.example' });
  oneHost.TRANSIENT_UNVERIFIED.push({ url:'https://slow.example/a', host:'slow.example' });
  assert.equal(externalLinkCheckFails(oneHost), false);

  const twoHosts = empty();
  twoHosts.PASS.push({ url:'https://ok.example/', host:'ok.example' });
  for (const host of ['a.example', 'b.example']) {
    twoHosts.TRANSIENT_UNVERIFIED.push({ url:`https://${host}/`, host });
  }
  assert.equal(externalLinkCheckFails(twoHosts), true);

  const noReachableEvidence = empty();
  noReachableEvidence.TRANSIENT_UNVERIFIED.push({ url:'https://slow.example/', host:'slow.example' });
  assert.equal(externalLinkCheckFails(noReachableEvidence), true);

  const broken = empty();
  broken.PASS.push({ url:'https://ok.example/', host:'ok.example' });
  broken.FAIL.push({ url:'https://broken.example/', host:'broken.example', observed:404 });
  assert.equal(externalLinkCheckFails(broken), true);

  const indeterminate = empty();
  indeterminate.PASS.push({ url:'https://ok.example/', host:'ok.example' });
  indeterminate.INDETERMINATE.push({ url:'https://blocked.example/', host:'blocked.example', observed:403 });
  assert.equal(externalLinkCheckFails(indeterminate), true);
});

test('checker limits same-host concurrency and opens a transient host circuit', async () => {
  const calls = new Map();
  const urls = [
    'https://slow.example/a',
    'https://slow.example/b',
    'https://slow.example/c',
    'https://slow.example/d',
    'https://ok.example/',
  ];
  let slowActive = 0;
  let maxSlowActive = 0;

  const fetchImpl = async url => {
    const host = new URL(url).hostname;
    calls.set(host, (calls.get(host) || 0) + 1);
    if (host === 'slow.example') {
      slowActive += 1;
      maxSlowActive = Math.max(maxSlowActive, slowActive);
      await Promise.resolve();
      slowActive -= 1;
      throw transportError('ETIMEDOUT');
    }
    return fakeResponse(200, url);
  };

  const { results, retries } = await checkExternalUrls(urls, [], {
    fetchImpl,
    sleep: async () => {},
    attempts: 1,
    globalConcurrency: 4,
    perHostConcurrency: 1,
    transientHostThreshold: 2,
  });

  assert.equal(results.PASS.length, 1);
  assert.equal(results.TRANSIENT_UNVERIFIED.length, 4);
  assert.equal(calls.get('slow.example'), 2);
  assert.equal(maxSlowActive, 1);
  assert.equal(retries, 0);
  assert.equal(externalLinkCheckFails(results), false);
  assert.equal(results.TRANSIENT_UNVERIFIED.filter(item => item.observed === 'HOST_TRANSIENT_CIRCUIT_OPEN').length, 2);
});

test('checker preserves hard HTTP failures and retries transient status responses', async () => {
  let status500Calls = 0;
  const urls = ['https://broken.example/not-found', 'https://temporary.example/server-error'];
  const fetchImpl = async url => {
    if (url.includes('not-found')) return fakeResponse(404, url);
    status500Calls += 1;
    return fakeResponse(500, url);
  };
  const { results, retries } = await checkExternalUrls(urls, [], {
    fetchImpl,
    sleep: async () => {},
    attempts: 3,
    globalConcurrency: 2,
    perHostConcurrency: 1,
  });
  assert.equal(results.FAIL.length, 2);
  assert.equal(status500Calls, 3);
  assert.equal(retries, 2);
  assert.equal(externalLinkCheckFails(results), true);
});
