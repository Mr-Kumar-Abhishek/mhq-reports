/**
 * @fileoverview Zero-dependency verification suite for MHQ Reports PWA, SRS & SDLC deliverables.
 * Run with: node tests/verify.mjs
 * @license MIT
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MHQ_DIMENSIONS,
  MHQ_QUESTIONS,
  MHQ_TIERS,
  SAMPLE_PROFILES
} from '../js/mhq-data.js';
import {
  scoreItemToMHQ,
  getTierForScore,
  calculateMHQReport
} from '../js/scoring-engine.js';
import {
  renderSpectrumGaugeSVG,
  renderRadarChartSVG,
  renderDivergingBarsSVG,
  renderHistoryTrendSVG
} from '../js/charts.js';
import { MHQStorage } from '../js/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`PASS: ${name}`);
}

await test('1. MIT LICENSE exists first and contains standard MIT terms', () => {
  const licensePath = path.join(ROOT, 'LICENSE');
  assert.ok(fs.existsSync(licensePath), 'LICENSE file must exist');
  const text = fs.readFileSync(licensePath, 'utf8');
  assert.ok(text.includes('MIT License'), 'LICENSE must declare MIT License');
  assert.ok(text.includes('Permission is hereby granted, free of charge'), 'LICENSE must contain standard MIT permission text');
});

await test('2. Documentation (SRS.md, SDLC.md, README.md) and core PWA files exist and are non-empty', () => {
  const requiredFiles = [
    'docs/SRS.md',
    'docs/SDLC.md',
    'README.md',
    'index.html',
    'manifest.webmanifest',
    'sw.js',
    'css/styles.css',
    'js/mhq-data.js',
    'js/scoring-engine.js',
    'js/charts.js',
    'js/db.js',
    'js/app.js',
    'assets/icon-192.svg',
    'assets/icon-512.svg'
  ];

  for (const rel of requiredFiles) {
    const abs = path.join(ROOT, rel);
    assert.ok(fs.existsSync(abs), `Missing required file: ${rel}`);
    const stat = fs.statSync(abs);
    assert.ok(stat.size > 50, `File appears empty or too small: ${rel}`);
  }

  const srs = fs.readFileSync(path.join(ROOT, 'docs/SRS.md'), 'utf8');
  assert.ok(srs.includes('FR-01') && srs.includes('FR-07'), 'SRS.md must define FR-01 through FR-07');
  assert.ok(srs.includes('NFR-01') && srs.includes('NFR-05'), 'SRS.md must define NFR-01 through NFR-05');
  assert.ok(srs.includes('Requirements Traceability Matrix'), 'SRS.md must contain RTM');

  const sdlc = fs.readFileSync(path.join(ROOT, 'docs/SDLC.md'), 'utf8');
  assert.ok(sdlc.includes('Phase 1') && sdlc.includes('Phase 6'), 'SDLC.md must cover Phases 1-6');
  assert.ok(sdlc.includes('Risk Register'), 'SDLC.md must contain Risk Register');
});

await test('3. Psychometric domain defines 6 dimensions and 24 items (4 per dimension)', () => {
  assert.equal(MHQ_DIMENSIONS.length, 6);
  assert.equal(MHQ_QUESTIONS.length, 24);
  for (const dim of MHQ_DIMENSIONS) {
    const dimQs = MHQ_QUESTIONS.filter((q) => q.dimensionId === dim.id);
    assert.equal(dimQs.length, 4, `Dimension ${dim.id} must have exactly 4 items`);
  }
  assert.equal(MHQ_TIERS.length, 6);
});

await test('4. scoreItemToMHQ satisfies exact asymmetric [-100, +200] boundary anchors', () => {
  assert.equal(scoreItemToMHQ(1), -100);
  assert.equal(scoreItemToMHQ(2.5), -50);
  assert.equal(scoreItemToMHQ(4), 0);
  assert.equal(scoreItemToMHQ(6.5), 100);
  assert.equal(scoreItemToMHQ(9), 200);

  assert.throws(() => scoreItemToMHQ(0), RangeError);
  assert.throws(() => scoreItemToMHQ(9.5), RangeError);
  assert.throws(() => scoreItemToMHQ(Number.NaN), RangeError);
});

await test('5. getTierForScore classifies all tier boundary cutoffs accurately', () => {
  assert.equal(getTierForScore(-100).id, 'clinical');
  assert.equal(getTierForScore(-51).id, 'clinical');
  assert.equal(getTierForScore(-50).id, 'struggling');
  assert.equal(getTierForScore(-1).id, 'struggling');
  assert.equal(getTierForScore(0).id, 'enduring');
  assert.equal(getTierForScore(49).id, 'enduring');
  assert.equal(getTierForScore(50).id, 'managing');
  assert.equal(getTierForScore(99).id, 'managing');
  assert.equal(getTierForScore(100).id, 'succeeding');
  assert.equal(getTierForScore(149).id, 'succeeding');
  assert.equal(getTierForScore(150).id, 'thriving');
  assert.equal(getTierForScore(200).id, 'thriving');
});

await test('6. calculateMHQReport accurately scores all 3 sample profiles and longitudinal deltas', () => {
  const thriving = calculateMHQReport(SAMPLE_PROFILES.thriving.responses, {
    ...SAMPLE_PROFILES.thriving.metadata,
    assessmentDate: '2026-11-10'
  });
  assert.equal(thriving.overallTier.id, 'thriving');
  assert.ok(thriving.overallScore >= 150 && thriving.overallScore <= 200);
  assert.equal(thriving.strengths.length, 2);
  assert.equal(thriving.priorityAreas.length, 2);
  assert.equal(thriving.needsSupportAlert, false);

  const managing = calculateMHQReport(
    SAMPLE_PROFILES.managing.responses,
    { ...SAMPLE_PROFILES.managing.metadata, assessmentDate: '2026-11-14' },
    thriving
  );
  assert.equal(managing.overallTier.id, 'managing');
  assert.ok(managing.overallScore >= 50 && managing.overallScore < 100);
  assert.ok(managing.deltaFromPrevious);
  assert.equal(managing.deltaFromPrevious.overallDelta, managing.overallScore - thriving.overallScore);

  const struggling = calculateMHQReport(
    SAMPLE_PROFILES.struggling.responses,
    { ...SAMPLE_PROFILES.struggling.metadata, assessmentDate: '2026-11-18' },
    managing
  );
  assert.equal(struggling.overallTier.id, 'struggling');
  assert.ok(struggling.overallScore >= -50 && struggling.overallScore < 0);
  assert.equal(struggling.needsSupportAlert, true);
  assert.equal(struggling.deltaFromPrevious.overallDelta, struggling.overallScore - managing.overallScore);
});

await test('7. Pure SVG chart renderers produce valid vector markup for all dimensions and history', () => {
  const report = calculateMHQReport(SAMPLE_PROFILES.managing.responses, {
    participantAlias: 'SVG Test <Safe>',
    assessmentDate: '2026-11-18'
  });

  // Warm up V8 JIT once so NFR-03 measures steady-state rendering rather than cold module compile
  renderSpectrumGaugeSVG(report.overallScore);
  renderRadarChartSVG(report.dimensions);
  renderDivergingBarsSVG(report.dimensions);
  renderHistoryTrendSVG([report]);

  const t0 = performance.now();
  const gauge = renderSpectrumGaugeSVG(report.overallScore);
  const radar = renderRadarChartSVG(report.dimensions);
  const bars = renderDivergingBarsSVG(report.dimensions);
  const trend = renderHistoryTrendSVG([
    { id: 'r1', overallScore: -20, createdAt: '2026-10-01T10:00:00Z', metadata: { assessmentDate: '2026-10-01' } },
    report
  ]);
  const elapsedMs = performance.now() - t0;

  for (const [name, svg] of [
    ['gauge', gauge],
    ['radar', radar],
    ['bars', bars],
    ['trend', trend]
  ]) {
    assert.ok(svg.startsWith('<svg') && svg.trim().endsWith('</svg>'), `${name} must be well-formed SVG`);
  }

  assert.ok(gauge.includes(`+${report.overallScore}`), 'Spectrum gauge must display formatted score');
  for (const dim of report.dimensions) {
    const escapedTitle = dim.title.replace(/&/g, '&amp;');
    assert.ok(bars.includes(escapedTitle), `Diverging bars must include dimension "${dim.title}"`);
    assert.ok(radar.includes(dim.shortTitle), `Radar chart must include short title "${dim.shortTitle}"`);
  }
  assert.ok(elapsedMs < 100, `SVG rendering exceeded 100ms NFR-03 budget: ${elapsedMs.toFixed(2)}ms`);
});

await test('8. MHQStorage operates reliably in fallback mode (save, list, getById, delete, clear)', async () => {
  const storage = new MHQStorage();
  const r1 = calculateMHQReport(SAMPLE_PROFILES.struggling.responses, {
    id: 'test-rep-1',
    createdAt: '2026-11-01T10:00:00.000Z',
    assessmentDate: '2026-11-01'
  });
  const r2 = calculateMHQReport(SAMPLE_PROFILES.thriving.responses, {
    id: 'test-rep-2',
    createdAt: '2026-11-18T10:00:00.000Z',
    assessmentDate: '2026-11-18'
  });

  await storage.saveReport(r1);
  await storage.saveReport(r2);

  const all = await storage.getAllReports();
  assert.equal(all.length, 2);
  assert.equal(all[0].id, 'test-rep-2', 'Newest report must sort first');

  const fetched = await storage.getReportById('test-rep-1');
  assert.equal(fetched.overallScore, r1.overallScore);

  await storage.deleteReport('test-rep-1');
  assert.equal((await storage.getAllReports()).length, 1);

  await storage.clearAllReports();
  assert.equal((await storage.getAllReports()).length, 0);
});

await test('9. Manifest JSON, Service Worker precache paths, and Zero-CDN offline purity pass', () => {
  const manifestRaw = fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8');
  const manifest = JSON.parse(manifestRaw);
  assert.equal(manifest.display, 'standalone');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);
  for (const icon of manifest.icons) {
    const iconAbs = path.join(ROOT, icon.src.replace(/^\.\//, ''));
    assert.ok(fs.existsSync(iconAbs), `Manifest icon missing on disk: ${icon.src}`);
  }

  const swSource = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const arrayMatch = swSource.match(/PRECACHE_ASSETS\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(arrayMatch, 'sw.js must define PRECACHE_ASSETS array');
  const assetPaths = [...arrayMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(assetPaths.length >= 10, 'sw.js must precache full App Shell');

  for (const asset of assetPaths) {
    const rel = asset === './' ? 'index.html' : asset.replace(/^\.\//, '');
    const abs = path.join(ROOT, rel);
    assert.ok(fs.existsSync(abs), `Precache asset missing on disk: ${asset}`);
  }

  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(ROOT, 'css/styles.css'), 'utf8');
  assert.ok(!/https?:\/\//i.test(indexHtml), 'index.html must contain zero external HTTP/HTTPS CDN dependencies');
  assert.ok(!/https?:\/\//i.test(stylesCss), 'css/styles.css must contain zero external HTTP/HTTPS CDN dependencies');
  assert.ok(stylesCss.includes('@media print'), 'css/styles.css must define @media print rules');
});

console.log(`\nAll ${passed} verification tests passed successfully.`);
