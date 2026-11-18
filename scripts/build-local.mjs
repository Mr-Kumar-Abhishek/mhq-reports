/**
 * @fileoverview Local build, verification, NFR-03 performance budget check, and gh-pages sync script.
 * Eliminates redundant GitHub Actions CI runner usage for this zero-dependency static PWA.
 *
 * Usage:
 *   node scripts/build-local.mjs
 *   node scripts/build-local.mjs --sync-gh-pages
 *
 * @license MIT
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const JS_FILES = [
  'js/mhq-data.js',
  'js/scoring-engine.js',
  'js/charts.js',
  'js/db.js',
  'js/app.js',
  'sw.js',
  'tests/verify.mjs',
  'scripts/build-local.mjs'
];

const GH_PAGES_PATHS = [
  'LICENSE',
  'README.md',
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'assets',
  'css',
  'docs',
  'js'
];

const EXCLUDED_FROM_GH_PAGES = ['.github', 'tests', 'scripts'];

function run(cmd, args, options = {}) {
  return execFileSync(cmd, args, {
    cwd: ROOT,
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: 'utf8'
  });
}

function verifyLocally() {
  console.log('1. Running Node syntax checks...');
  for (const relPath of JS_FILES) {
    if (fs.existsSync(path.join(ROOT, relPath))) {
      run(process.execPath, ['--check', relPath]);
    }
  }
  console.log('   Syntax checks passed.');

  console.log('2. Running offline PWA verification & NFR-03 local performance suite...');
  run(process.execPath, ['tests/verify.mjs']);
}

function syncGhPages() {
  const dirty = run('git', ['status', '--porcelain'], { capture: true }).trim();
  if (dirty) {
    throw new Error(
      'Working tree must be clean before running --sync-gh-pages. Commit or stash changes first.'
    );
  }

  const sourceBranch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { capture: true }).trim();
  if (!sourceBranch || sourceBranch === 'gh-pages') {
    throw new Error(`Run --sync-gh-pages from main/master/develop (current branch: "${sourceBranch}").`);
  }

  console.log(`3. Syncing verified static PWA build from "${sourceBranch}" to "gh-pages"...`);
  const existingPages = run('git', ['branch', '--list', 'gh-pages'], { capture: true }).trim();
  if (existingPages) {
    run('git', ['checkout', 'gh-pages']);
  } else {
    run('git', ['checkout', '-b', 'gh-pages']);
  }

  try {
    run('git', ['rm', '-rf', '--ignore-unmatch', ...GH_PAGES_PATHS, ...EXCLUDED_FROM_GH_PAGES], {
      capture: true
    });

    for (const rel of GH_PAGES_PATHS) {
      const existsInSource = run('git', ['ls-tree', '-r', sourceBranch, '--', rel], {
        capture: true
      }).trim();
      if (existsInSource) {
        run('git', ['checkout', sourceBranch, '--', rel]);
      }
    }

    const pagesDiff = run('git', ['status', '--porcelain'], { capture: true }).trim();
    if (pagesDiff) {
      const shortSha = run('git', ['rev-parse', '--short', sourceBranch], { capture: true }).trim();
      run('git', ['commit', '-m', `chore(gh-pages): sync verified local build (${shortSha})`]);
      console.log('   Committed updated static PWA bundle to gh-pages.');
    } else {
      console.log('   gh-pages is already up to date with verified static files.');
    }
  } finally {
    run('git', ['checkout', sourceBranch]);
  }
}

const args = process.argv.slice(2);
const shouldSyncPages = args.includes('--sync-gh-pages');

verifyLocally();
if (shouldSyncPages) {
  syncGhPages();
}
console.log('\nLocal build completed successfully.');
