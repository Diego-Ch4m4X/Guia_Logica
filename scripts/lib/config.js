import fs from 'node:fs';
import path from 'node:path';
import { projectRoot } from './paths.js';

export function projectVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  if (typeof pkg.version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(pkg.version)) {
    throw new Error('package.json.version must be a non-empty release version');
  }
  return pkg.version;
}
