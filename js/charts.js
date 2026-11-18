/**
 * @fileoverview Pure inline SVG chart renderers for MHQ analytical reports and print/PDF export.
 * Zero external charting libraries required; all styling attributes are self-contained inside SVG.
 * @license MIT
 */

import { MHQ_TIERS } from './mhq-data.js';

function escapeXML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatScore(score) {
  const num = Math.round(Number(score));
  return num > 0 ? `+${num}` : `${num}`;
}

/**
 * Maps an MHQ score in [-100, +200] to an x-coordinate on a linear bar.
 * @param {number} score
 * @param {number} startX
 * @param {number} width
 * @returns {number}
 */
function mapScoreToX(score, startX, width) {
  const clamped = Math.min(200, Math.max(-100, Number(score)));
  const ratio = (clamped + 100) / 300;
  return startX + ratio * width;
}

/**
 * Renders the horizontal -100 to +200 MHQ Spectrum Gauge SVG segmented across the 6 tiers.
 *
 * @param {number} overallScore
 * @returns {string} Pure SVG markup string.
 */
export function renderSpectrumGaugeSVG(overallScore) {
  const svgW = 760;
  const svgH = 152;
  const barX = 36;
  const barY = 58;
  const barW = 688;
  const barH = 28;

  const clampedScore = Math.min(200, Math.max(-100, Math.round(Number(overallScore))));
  const pointerX = mapScoreToX(clampedScore, barX, barW);

  const tierSegments = MHQ_TIERS.map((tier) => {
    const x1 = mapScoreToX(tier.min, barX, barW);
    const x2 = mapScoreToX(tier.max, barX, barW);
    const segW = x2 - x1;
    const midX = x1 + segW / 2;
    return `
      <rect x="${x1.toFixed(1)}" y="${barY}" width="${segW.toFixed(1)}" height="${barH}" fill="${tier.color}" opacity="0.88" stroke="#ffffff" stroke-width="1.5" />
      <text x="${midX.toFixed(1)}" y="${barY + barH + 18}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#334155">${escapeXML(tier.label)}</text>
    `;
  }).join('');

  const ticks = [-100, -50, 0, 50, 100, 150, 200]
    .map((tick) => {
      const tx = mapScoreToX(tick, barX, barW);
      const isZero = tick === 0;
      return `
        <line x1="${tx.toFixed(1)}" y1="${barY - 4}" x2="${tx.toFixed(1)}" y2="${barY + barH + 4}" stroke="${isZero ? '#0f172a' : '#64748b'}" stroke-width="${isZero ? 2.5 : 1}" />
        <text x="${tx.toFixed(1)}" y="${barY + barH + 36}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="${isZero ? '700' : '500'}" fill="${isZero ? '#0f172a' : '#64748b'}">${formatScore(tick)}</text>
      `;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="100%" role="img" aria-label="Overall MHQ Spectrum Gauge showing score ${formatScore(clampedScore)}">
  <title>Overall MHQ Spectrum Gauge: ${formatScore(clampedScore)}</title>
  <rect x="0" y="0" width="${svgW}" height="${svgH}" rx="12" fill="#f8fafc" />
  <text x="${barX}" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#475569">MHQ Spectrum (-100 Clinical Distress to +200 Optimal Thriving)</text>
  <text x="${barX + barW}" y="24" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#0f172a">0 = Functional Baseline</text>
  ${tierSegments}
  ${ticks}
  <g transform="translate(${pointerX.toFixed(1)}, ${barY - 6})">
    <rect x="-32" y="-30" width="64" height="22" rx="11" fill="#0f172a" />
    <text x="0" y="-15" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#ffffff">${formatScore(clampedScore)}</text>
    <polygon points="-7,-7 7,-7 0,3" fill="#0f172a" />
  </g>
</svg>`;
}

/**
 * Renders a 6-axis hexagonal radar polygon SVG chart comparing dimension scores
 * against the 0 functional baseline ring and +100 / +200 reference rings.
 *
 * @param {Array<{id: string, title: string, shortTitle?: string, score: number, color: string}>} dimensionScores
 * @returns {string} Pure SVG markup string.
 */
export function renderRadarChartSVG(dimensionScores) {
  const size = 380;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const maxR = 118;
  const count = dimensionScores.length || 6;

  // Map score [-100, +200] -> radius [16, maxR] so -100 remains visible near center
  const scoreToRadius = (score) => {
    const clamped = Math.min(200, Math.max(-100, Number(score)));
    return 18 + ((clamped + 100) / 300) * (maxR - 18);
  };

  const angleFor = (idx) => -Math.PI / 2 + (idx * 2 * Math.PI) / count;

  const polygonPoints = (radius) =>
    dimensionScores
      .map((_, i) => {
        const a = angleFor(i);
        return `${(cx + radius * Math.cos(a)).toFixed(1)},${(cy + radius * Math.sin(a)).toFixed(1)}`;
      })
      .join(' ');

  const ringScores = [-100, 0, 100, 200];
  const rings = ringScores
    .map((val) => {
      const r = scoreToRadius(val);
      const isBaseline = val === 0;
      const isOuter = val === 200;
      return `
        <polygon points="${polygonPoints(r)}" fill="none" stroke="${isBaseline ? '#0f172a' : '#cbd5e1'}" stroke-width="${isBaseline ? 1.8 : isOuter ? 1.4 : 1}" stroke-dasharray="${isBaseline ? '5 3' : ''}" />
        <text x="${(cx + 4).toFixed(1)}" y="${(cy - r + 11).toFixed(1)}" font-family="system-ui, -apple-system, sans-serif" font-size="9.5" font-weight="${isBaseline ? '700' : '500'}" fill="${isBaseline ? '#0f172a' : '#64748b'}">${formatScore(val)}</text>
      `;
    })
    .join('');

  const axesAndLabels = dimensionScores
    .map((dim, i) => {
      const a = angleFor(i);
      const xEnd = cx + maxR * Math.cos(a);
      const yEnd = cy + maxR * Math.sin(a);
      const labelR = maxR + 26;
      const lx = cx + labelR * Math.cos(a);
      const ly = cy + labelR * Math.sin(a);
      const cosA = Math.cos(a);
      const anchor = Math.abs(cosA) < 0.2 ? 'middle' : cosA > 0 ? 'start' : 'end';
      const label = dim.shortTitle || dim.title;

      return `
        <line x1="${cx}" y1="${cy}" x2="${xEnd.toFixed(1)}" y2="${yEnd.toFixed(1)}" stroke="#e2e8f0" stroke-width="1.2" />
        <text x="${lx.toFixed(1)}" y="${(ly - 2).toFixed(1)}" text-anchor="${anchor}" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="600" fill="#1e293b">${escapeXML(label)}</text>
        <text x="${lx.toFixed(1)}" y="${(ly + 12).toFixed(1)}" text-anchor="${anchor}" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="${dim.score < 0 ? '#c2410c' : '#0f766e'}">${formatScore(dim.score)}</text>
      `;
    })
    .join('');

  const dataPoints = dimensionScores
    .map((dim, i) => {
      const a = angleFor(i);
      const r = scoreToRadius(dim.score);
      return {
        x: cx + r * Math.cos(a),
        y: cy + r * Math.sin(a),
        dim
      };
    });

  const dataPoly = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const dots = dataPoints
    .map(
      (p) =>
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="${p.dim.score < 0 ? '#ea580c' : '#0f766e'}" stroke="#ffffff" stroke-width="2" />`
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" role="img" aria-label="6-Dimension MHQ Radar Chart">
  <title>6-Dimension MHQ Radar Profile</title>
  <rect x="0" y="0" width="${size}" height="${size}" rx="12" fill="#ffffff" />
  <text x="${cx}" y="22" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#475569">Dashed Ring = 0 Baseline</text>
  ${rings}
  ${axesAndLabels}
  <polygon points="${dataPoly}" fill="rgba(15, 118, 110, 0.20)" stroke="#0f766e" stroke-width="2.5" stroke-linejoin="round" />
  ${dots}
</svg>`;
}

/**
 * Renders horizontal diverging bars anchored at 0 (-100 left, +200 right) for all 6 dimensions.
 *
 * @param {Array<{id: string, title: string, score: number, tier: {label: string, color: string}}>} dimensionScores
 * @returns {string} Pure SVG markup string.
 */
export function renderDivergingBarsSVG(dimensionScores) {
  const svgW = 540;
  const rowH = 44;
  const topPad = 40;
  const bottomPad = 36;
  const svgH = topPad + dimensionScores.length * rowH + bottomPad;

  const labelW = 165;
  const plotX = labelW + 12;
  const plotW = svgW - plotX - 46;
  const zeroX = mapScoreToX(0, plotX, plotW);

  const gridTicks = [-100, -50, 0, 50, 100, 150, 200]
    .map((tick) => {
      const gx = mapScoreToX(tick, plotX, plotW);
      const isZero = tick === 0;
      return `
        <line x1="${gx.toFixed(1)}" y1="${topPad - 6}" x2="${gx.toFixed(1)}" y2="${svgH - bottomPad + 6}" stroke="${isZero ? '#0f172a' : '#e2e8f0'}" stroke-width="${isZero ? 2 : 1}" />
        <text x="${gx.toFixed(1)}" y="${svgH - 12}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="${isZero ? '700' : '500'}" fill="${isZero ? '#0f172a' : '#64748b'}">${formatScore(tick)}</text>
      `;
    })
    .join('');

  const rows = dimensionScores
    .map((dim, idx) => {
      const y = topPad + idx * rowH;
      const barY = y + 10;
      const barH = 22;
      const score = Math.min(200, Math.max(-100, Math.round(Number(dim.score))));
      const valX = mapScoreToX(score, plotX, plotW);
      const rectX = score >= 0 ? zeroX : valX;
      const rectW = Math.max(2, Math.abs(valX - zeroX));
      const fill = dim.tier?.color || (score < 0 ? '#ea580c' : '#0f766e');
      const textX = score >= 0 ? valX + 6 : valX - 6;
      const textAnchor = score >= 0 ? 'start' : 'end';

      return `
        <rect x="8" y="${y + 4}" width="${svgW - 16}" height="${rowH - 8}" rx="6" fill="${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}" />
        <text x="${labelW}" y="${barY + 15}" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#1e293b">${escapeXML(dim.title)}</text>
        <rect x="${rectX.toFixed(1)}" y="${barY}" width="${rectW.toFixed(1)}" height="${barH}" rx="4" fill="${fill}" opacity="0.9" />
        <text x="${textX.toFixed(1)}" y="${barY + 15}" text-anchor="${textAnchor}" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="700" fill="#0f172a">${formatScore(score)}</text>
      `;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="100%" role="img" aria-label="Dimension Diverging Bar Chart">
  <title>Dimension MHQ Scores Relative to Functional Baseline (0)</title>
  <rect x="0" y="0" width="${svgW}" height="${svgH}" rx="12" fill="#ffffff" />
  <text x="${zeroX.toFixed(1)}" y="20" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="700" fill="#0f172a">Baseline (0)</text>
  ${rows}
  ${gridTicks}
</svg>`;
}

/**
 * Renders a chronological SVG trend line chart of historical overall MHQ scores.
 *
 * @param {Array<{id: string, overallScore: number, createdAt: string, metadata?: {assessmentDate?: string, participantAlias?: string}}>} reports
 * @returns {string} Pure SVG markup string.
 */
export function renderHistoryTrendSVG(reports) {
  const svgW = 720;
  const svgH = 220;
  const padL = 54;
  const padR = 28;
  const padT = 26;
  const padB = 40;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const sorted = [...(reports || [])].sort((a, b) =>
    String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
  );

  if (sorted.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="100%" role="img" aria-label="Empty Longitudinal MHQ History Chart">
  <title>Longitudinal MHQ History</title>
  <rect x="0" y="0" width="${svgW}" height="${svgH}" rx="12" fill="#f8fafc" />
  <text x="${svgW / 2}" y="${svgH / 2}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#64748b">Save at least 2 reports locally to visualize longitudinal MHQ trends.</text>
</svg>`;
  }

  const scoreToY = (score) => {
    const clamped = Math.min(200, Math.max(-100, Number(score)));
    const ratio = (clamped + 100) / 300;
    return padT + plotH - ratio * plotH;
  };

  const yTicks = [-100, 0, 100, 200]
    .map((val) => {
      const y = scoreToY(val);
      const isZero = val === 0;
      return `
        <line x1="${padL}" y1="${y.toFixed(1)}" x2="${svgW - padR}" y2="${y.toFixed(1)}" stroke="${isZero ? '#0f172a' : '#e2e8f0'}" stroke-width="${isZero ? 1.8 : 1}" stroke-dasharray="${isZero ? '5 3' : ''}" />
        <text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="${isZero ? '700' : '500'}" fill="${isZero ? '#0f172a' : '#64748b'}">${formatScore(val)}</text>
      `;
    })
    .join('');

  const points = sorted.map((rep, idx) => {
    const x =
      sorted.length === 1
        ? padL + plotW / 2
        : padL + (idx / (sorted.length - 1)) * plotW;
    const y = scoreToY(rep.overallScore);
    const dateLabel =
      rep.metadata?.assessmentDate ||
      (rep.createdAt ? rep.createdAt.slice(0, 10) : `#${idx + 1}`);
    return { x, y, score: rep.overallScore, dateLabel };
  });

  const polylineAttr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const pointDots = points
    .map((p) => {
      const color = p.score < 0 ? '#c2410c' : '#0f766e';
      return `
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5.5" fill="${color}" stroke="#ffffff" stroke-width="2" />
        <text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#0f172a">${formatScore(p.score)}</text>
        <text x="${p.x.toFixed(1)}" y="${svgH - 14}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="#475569">${escapeXML(p.dateLabel)}</text>
      `;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="100%" role="img" aria-label="Longitudinal MHQ Score Trend Chart">
  <title>Longitudinal MHQ Trend Across ${sorted.length} Assessments</title>
  <rect x="0" y="0" width="${svgW}" height="${svgH}" rx="12" fill="#ffffff" />
  ${yTicks}
  ${points.length > 1 ? `<polyline points="${polylineAttr}" fill="none" stroke="#0f766e" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />` : ''}
  ${pointDots}
</svg>`;
}
