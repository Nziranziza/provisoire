/**
 * Prepare PWA assets before build:
 * - Generate icons (PNG + SVG)
 * - Copy question bank JSON for service-worker precache
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const iconScript = path.join(__dirname, 'generate-pwa-icons.mjs');
const iconResult = spawnSync(process.execPath, [iconScript], {
  cwd: root,
  stdio: 'inherit',
});
if (iconResult.status !== 0) {
  process.exit(iconResult.status ?? 1);
}

const questionsSrc = path.join(root, 'questions.json');
const dataDir = path.join(root, 'public', 'data');
const questionsDest = path.join(dataDir, 'questions.json');

if (!fs.existsSync(questionsSrc)) {
  console.error('questions.json not found at project root');
  process.exit(1);
}

fs.mkdirSync(dataDir, { recursive: true });
fs.copyFileSync(questionsSrc, questionsDest);

const manifestSrc = path.join(root, 'public', 'manifest.webmanifest');
const manifestDest = path.join(root, 'public', 'manifest.json');
if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, manifestDest);
}

const sizeKb = Math.round(fs.statSync(questionsDest).size / 1024);
console.log(
  `Copied questions.json → public/data/questions.json (${sizeKb} KB)`,
);
