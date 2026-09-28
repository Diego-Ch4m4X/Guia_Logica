import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src/assets/js');

async function discover(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await discover(absolute));
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(absolute);
  }
  return files;
}

const files = (await discover(source)).sort();
if (!files.length) throw new Error('no browser JavaScript files found');
let failures = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failures += 1;
    console.error(`${path.relative(root, file)}: ${result.stderr || result.stdout || result.error}`);
  }
}
if (failures) {
  console.error(`JS_SYNTAX: FAIL (${failures}/${files.length})`);
  process.exitCode = 1;
} else {
  console.log('JS_SYNTAX: PASS');
  console.log(`files: ${files.length}`);
}
