import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('dist');
const MAX_SUPPORTED_BYTES = 1024 ** 3; // GitHub Pages documented supported max: 1 GiB.
let files = 0;
let directories = 0;
let bytes = 0;
const violations = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const info = await lstat(full);
    if (info.isSymbolicLink()) {
      violations.push(`symbolic link: ${path.relative(ROOT, full)}`);
      continue;
    }
    if (info.isDirectory()) {
      directories += 1;
      await walk(full);
      continue;
    }
    if (!info.isFile()) {
      violations.push(`unsupported filesystem entry: ${path.relative(ROOT, full)}`);
      continue;
    }
    if (info.nlink !== 1) {
      violations.push(`hard-linked file (nlink=${info.nlink}): ${path.relative(ROOT, full)}`);
    }
    files += 1;
    bytes += info.size;
  }
}

await walk(ROOT);
if (files === 0) violations.push('dist/ contains no files');
if (bytes > MAX_SUPPORTED_BYTES) {
  violations.push(`artifact input exceeds 1 GiB: ${bytes} bytes`);
}
if (violations.length) {
  console.error('PAGES_ARTIFACT: FAIL');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}
console.log('PAGES_ARTIFACT: PASS');
console.log(`files: ${files}`);
console.log(`directories: ${directories}`);
console.log(`bytes: ${bytes}`);
console.log('symbolic links: 0');
console.log('hard links: 0');
