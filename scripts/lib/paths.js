import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(here, '../..');
export const contentDir = path.join(projectRoot, 'content', 'topics');
const srcDir = path.join(projectRoot, 'src');
export const templateDir = path.join(srcDir, 'templates');
export const assetDir = path.join(srcDir, 'assets');
export const distDir = path.join(projectRoot, 'dist');
export const dataDir = path.join(distDir, 'data');
