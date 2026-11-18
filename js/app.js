/**
 * @fileoverview Main SPA controller for the Offline-First MHQ Report Generation PWA.
 * Connects psychometric data, scoring engine, pure SVG charts, IndexedDB persistence,
 * Service Worker registration, and printable report generation.
 * @license MIT
 */

import {
  MHQ_DIMENSIONS,
  MHQ_QUESTIONS,
  MHQ_SCALE_ANCHORS,
  MHQ_TIERS,
  SAMPLE_PROFILES
} from './mhq-data.js';
import { calculateMHQReport } from './scoring-engine.js';
import {
  renderSpectrumGaugeSVG,
  renderRadarChartSVG,
  renderDivergingBarsSVG,
  renderHistoryTrendSVG
} from './charts.js';
import { mhqStorage } from './db.js';

const state = {
  activeView: 'assessment',
  responses: {},
  currentPreset: null,
  currentReport: null,
  history: [],
  deferredInstallPrompt: null
};

function escapeHTML(str) {
  return String(str ?? '')
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

function getTodayLocalDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 3200);
}

function switchView(viewName) {
  state.activeView = viewName;
  document.querySelectorAll('.nav-tab').forEach((btn) => {
    const isMatch = btn.dataset.view === viewName;
    btn.classList.toggle('active', isMatch);
    btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
  });
  document.querySelectorAll('.view-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `view-${viewName}`);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressUI() {
  const total = MHQ_QUESTIONS.length;
  const answered = Object.keys(state.responses).length;
  const pct = Math.round((answered / total) * 100);

  const textEl = document.getElementById('progress-text');
  const fillEl = document.getElementById('progress-bar-fill');
  const trackEl = document.getElementById('progress-bar-track');

  if (textEl) textEl.textContent = `${answered} / ${total} items answered (${pct}%)`;
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (trackEl) trackEl.setAttribute('aria-valuenow', String(answered));
}

function renderQuestions() {
  const container = document.getElementById('questions-container');
  if (!container) return;

  const html = MHQ_DIMENSIONS.map((dim, dimIdx) => {
    const dimQuestions = MHQ_QUESTIONS.filter((q) => q.dimensionId === dim.id);
    const itemsHTML = dimQuestions
      .map((q, qIdx) => {
        const selectedVal = state.responses[q.id];
        const optionsHTML = MHQ_SCALE_ANCHORS.map((anchor) => {
          const inputId = `${q.id}_opt_${anchor.value}`;
          const checked = Number(selectedVal) === anchor.value ? 'checked' : '';
          const baselineClass = anchor.value === 4 ? 'baseline-opt' : '';
          return `
            <div class="rating-option ${baselineClass}">
              <input type="radio" id="${inputId}" name="${q.id}" value="${anchor.value}" ${checked} />
              <label for="${inputId}" title="${escapeHTML(anchor.label)}">
                <span>${anchor.value}</span>
                <small>${anchor.mhqHint}</small>
              </label>
            </div>
          `;
        }).join('');

        return `
          <div class="question-item" data-question-id="${q.id}">
            <div class="question-prompt">${dimIdx + 1}.${qIdx + 1} ${escapeHTML(q.prompt)}</div>
            <div class="rating-scale" role="radiogroup" aria-label="${escapeHTML(q.prompt)}">
              ${optionsHTML}
            </div>
            <div class="anchors-row">
              <span>1: ${escapeHTML(q.lowAnchor)}</span>
              <span>4: Functional Baseline (0)</span>
              <span>9: ${escapeHTML(q.highAnchor)}</span>
            </div>
          </div>
        `;
      })
      .join('');

    return `
      <section class="card dimension-section" style="--dim-color: ${dim.color};">
        <div class="dimension-header">
          <div>
            <h3>${dimIdx + 1}. ${escapeHTML(dim.title)}</h3>
            <p class="dimension-desc">${escapeHTML(dim.description)}</p>
          </div>
          <span class="meta-chip">${dimQuestions.length} items</span>
        </div>
        ${itemsHTML}
      </section>
    `;
  }).join('');

  container.innerHTML = html;

  container.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener('change', (e) => {
      const target = e.target;
      state.responses[target.name] = Number(target.value);
      const itemEl = target.closest('.question-item');
      if (itemEl) itemEl.classList.remove('unanswered-highlight');
      document.getElementById('form-error-banner').hidden = true;
      updateProgressUI();
    });
  });

  updateProgressUI();
}

function applySamplePreset(presetKey) {
  const preset = SAMPLE_PROFILES[presetKey];
  if (!preset) return;

  state.currentPreset = presetKey;
  state.responses = { ...preset.responses };

  const aliasEl = document.getElementById('participant-alias');
  const ageEl = document.getElementById('age-group');
  const dateEl = document.getElementById('assessment-date');
  const notesEl = document.getElementById('session-notes');

  if (aliasEl) aliasEl.value = preset.metadata.participantAlias;
  if (ageEl) ageEl.value = preset.metadata.ageGroup;
  if (dateEl && !dateEl.value) dateEl.value = getTodayLocalDate();
  if (notesEl) notesEl.value = preset.metadata.notes;

  document.getElementById('form-error-banner').hidden = true;
  renderQuestions();
  showToast(`Loaded "${preset.label}" responses.`);
}

function resetAssessmentForm() {
  state.responses = {};
  state.currentPreset = null;
  document.getElementById('mhq-form')?.reset();
  const dateEl = document.getElementById('assessment-date');
  if (dateEl) dateEl.value = getTodayLocalDate();
  document.getElementById('form-error-banner').hidden = true;
  renderQuestions();
  showToast('Assessment form cleared.');
}

function renderReport(report) {
  const emptyEl = document.getElementById('report-empty-state');
  const contentEl = document.getElementById('report-content');
  if (!emptyEl || !contentEl) return;

  if (!report) {
    emptyEl.hidden = false;
    contentEl.hidden = true;
    contentEl.innerHTML = '';
    return;
  }

  emptyEl.hidden = true;
  contentEl.hidden = false;

  const printTs = document.getElementById('print-timestamp');
  if (printTs) {
    printTs.textContent = `Report ID: ${report.id} • Date: ${report.metadata.assessmentDate}`;
  }

  const gaugeSVG = renderSpectrumGaugeSVG(report.overallScore);
  const radarSVG = renderRadarChartSVG(report.dimensions);
  const barsSVG = renderDivergingBarsSVG(report.dimensions);

  const deltaBadge = report.deltaFromPrevious
    ? (() => {
        const d = report.deltaFromPrevious.overallDelta;
        const cls = d > 0 ? 'delta-positive' : d < 0 ? 'delta-negative' : '';
        const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '●';
        return `<div class="delta-badge ${cls}">${arrow} ${formatScore(d)} vs prior (${escapeHTML(
          report.deltaFromPrevious.previousDate
        )})</div>`;
      })()
    : '';

  const supportBanner = report.needsSupportAlert
    ? `
      <div class="alert alert-warning" role="note">
        <strong>Supportive Guidance Notice:</strong> One or more domains scored below the functional baseline (0).
        If you or the participant are experiencing persistent distress, consider connecting with a licensed mental health
        professional, primary care clinician, or trusted support network.
      </div>
    `
    : '';

  const notesBlock = report.metadata.notes
    ? `<p class="muted" style="margin-top: 0.6rem;"><strong>Session Notes:</strong> ${escapeHTML(
        report.metadata.notes
      )}</p>`
    : '';

  const strengthDims = report.strengths
    .map((id) => report.dimensions.find((d) => d.id === id))
    .filter(Boolean);
  const priorityDims = report.priorityAreas
    .map((id) => report.dimensions.find((d) => d.id === id))
    .filter(Boolean);

  const dimCardsHTML = report.dimensions
    .map((dim) => {
      const dimDelta = report.deltaFromPrevious?.dimensionDeltas?.[dim.id];
      const dimDeltaHTML =
        typeof dimDelta === 'number'
          ? `<span class="delta-badge ${
              dimDelta > 0 ? 'delta-positive' : dimDelta < 0 ? 'delta-negative' : ''
            }">Δ ${formatScore(dimDelta)}</span>`
          : '';

      return `
        <article class="card dim-card" style="--dim-color: ${dim.color};">
          <div class="dim-card-top">
            <div>
              <h4>${escapeHTML(dim.title)}</h4>
              <span class="tier-badge" style="color: ${dim.tier.color}; background: ${dim.tier.bgColor}; border-color: ${dim.tier.borderColor};">
                ${escapeHTML(dim.tier.label)}
              </span>
              ${dimDeltaHTML}
            </div>
            <div class="dim-score-num" style="color: ${dim.tier.color};">
              ${formatScore(dim.score)}
            </div>
          </div>
          <div class="dim-meter-track" aria-label="Normalized position ${dim.normalizedPercent}% across MHQ spectrum">
            <div class="dim-meter-fill" style="width: ${dim.normalizedPercent}%; background: ${dim.tier.color};"></div>
          </div>
          <p class="muted" style="font-size: 0.84rem;">${escapeHTML(dim.description)}</p>
          <div class="dim-guidance">
            <strong>Actionable Focus:</strong> ${escapeHTML(dim.recommendation)}
          </div>
        </article>
      `;
    })
    .join('');

  contentEl.innerHTML = `
    <div class="card">
      <div class="report-exec-header">
        <div>
          <h2 id="report-heading" style="margin: 0;">Mental Health Quotient (MHQ) Report</h2>
          <div class="report-meta-pills">
            <span class="meta-chip"><strong>Participant:</strong> ${escapeHTML(report.metadata.participantAlias)}</span>
            <span class="meta-chip"><strong>Age Group:</strong> ${escapeHTML(report.metadata.ageGroup)}</span>
            <span class="meta-chip"><strong>Assessment Date:</strong> ${escapeHTML(report.metadata.assessmentDate)}</span>
            <span class="meta-chip"><strong>Report ID:</strong> ${escapeHTML(report.id)}</span>
          </div>
        </div>
        <div class="overall-score-box" style="background: ${report.overallTier.bgColor}; border-color: ${report.overallTier.borderColor};">
          <div>
            <div style="font-size: 0.78rem; font-weight: 700; color: #475569; text-transform: uppercase;">Composite MHQ</div>
            <div class="overall-score-value" style="color: ${report.overallTier.color};">${formatScore(report.overallScore)}</div>
            ${deltaBadge}
          </div>
          <div>
            <span class="tier-badge" style="color: ${report.overallTier.color}; background: #ffffff; border-color: ${report.overallTier.borderColor};">
              ${escapeHTML(report.overallTier.label)}
            </span>
            <div style="font-size: 0.74rem; color: #475569; margin-top: 0.25rem;">
              Band: ${formatScore(report.overallTier.min)} to ${formatScore(report.overallTier.max)}
            </div>
          </div>
        </div>
      </div>

      <p style="margin: 0.4rem 0 0;">${escapeHTML(report.executiveSummary)}</p>
      ${notesBlock}
    </div>

    ${supportBanner}

    <div class="card">
      <h3 class="section-title">Overall MHQ Spectrum Position (-100 to +200)</h3>
      <div class="svg-wrapper">${gaugeSVG}</div>
    </div>

    <div class="charts-grid">
      <div class="card" style="margin-bottom: 0;">
        <h3 class="section-title">6-Dimension Radar Profile</h3>
        <div class="svg-wrapper">${radarSVG}</div>
      </div>
      <div class="card" style="margin-bottom: 0;">
        <h3 class="section-title">Dimension Scores vs. Functional Baseline (0)</h3>
        <div class="svg-wrapper">${barsSVG}</div>
      </div>
    </div>

    <div class="insights-grid">
      <div class="card highlight-card" style="margin-bottom: 0;">
        <h3 class="section-title">Top Protective Strengths</h3>
        <ul class="highlight-list">
          ${strengthDims
            .map(
              (d) =>
                `<li><span>${escapeHTML(d.title)}</span><span style="color: ${d.tier.color};">${formatScore(d.score)} (${escapeHTML(d.tier.label)})</span></li>`
            )
            .join('')}
        </ul>
      </div>
      <div class="card highlight-card priority" style="margin-bottom: 0;">
        <h3 class="section-title">Priority Focus Areas</h3>
        <ul class="highlight-list">
          ${priorityDims
            .map(
              (d) =>
                `<li><span>${escapeHTML(d.title)}</span><span style="color: ${d.tier.color};">${formatScore(d.score)} (${escapeHTML(d.tier.label)})</span></li>`
            )
            .join('')}
        </ul>
      </div>
    </div>

    <h3 class="section-title" style="margin: 0.5rem 0 0.75rem;">Dimension-by-Dimension Clinical &amp; Wellbeing Breakdown</h3>
    <div class="dimensions-grid">
      ${dimCardsHTML}
    </div>

    <div class="card disclaimer-box">
      <strong>Methodological &amp; Non-Diagnostic Disclaimer:</strong> The Mental Health Quotient (MHQ) report summarizes
      self-reported functioning across six wellbeing domains on an asymmetric -100 to +200 spectrum anchored at 0.
      This PWA executes 100% locally in your browser without transmitting health reflections to external servers.
      It is intended solely for personal insight, wellness tracking, and practitioner-guided reflection—not formal medical diagnosis.
    </div>
  `;
}

async function refreshHistoryUI() {
  state.history = await mhqStorage.getAllReports();

  const countBadge = document.getElementById('history-count-badge');
  if (countBadge) countBadge.textContent = String(state.history.length);

  const storageLabel = document.getElementById('storage-mode-label');
  if (storageLabel) {
    const mode = mhqStorage.getStorageMode();
    storageLabel.textContent =
      mode === 'indexeddb'
        ? 'IndexedDB (mhq_reports_db)'
        : mode === 'localstorage'
          ? 'localStorage Fallback'
          : 'In-Memory Session Store';
  }

  const trendEl = document.getElementById('history-trend-chart');
  if (trendEl) {
    trendEl.innerHTML = renderHistoryTrendSVG(state.history);
  }

  const tableEl = document.getElementById('history-table-container');
  if (!tableEl) return;

  if (state.history.length === 0) {
    tableEl.innerHTML =
      '<p class="muted">No saved MHQ reports yet. Complete an assessment or load a demo profile to store your first report locally.</p>';
    return;
  }

  const rowsHTML = state.history
    .map((rep) => {
      return `
        <tr>
          <td>${escapeHTML(rep.metadata?.assessmentDate || rep.createdAt?.slice(0, 10))}</td>
          <td><strong>${escapeHTML(rep.metadata?.participantAlias || 'Anonymous')}</strong></td>
          <td><strong>${formatScore(rep.overallScore)}</strong></td>
          <td>
            <span class="tier-badge" style="color: ${rep.overallTier.color}; background: ${rep.overallTier.bgColor}; border-color: ${rep.overallTier.borderColor};">
              ${escapeHTML(rep.overallTier.label)}
            </span>
          </td>
          <td style="white-space: nowrap;">
            <button type="button" class="btn btn-outline btn-sm" data-open-report="${escapeHTML(rep.id)}">View Report</button>
            <button type="button" class="btn btn-danger-outline btn-sm" data-delete-report="${escapeHTML(rep.id)}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join('');

  tableEl.innerHTML = `
    <div class="table-scroll">
      <table class="spec-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Participant</th>
            <th>MHQ Score</th>
            <th>Tier</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    </div>
  `;

  tableEl.querySelectorAll('[data-open-report]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const rep = await mhqStorage.getReportById(btn.dataset.openReport);
      if (rep) {
        state.currentReport = rep;
        renderReport(rep);
        switchView('report');
      }
    });
  });

  tableEl.querySelectorAll('[data-delete-report]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await mhqStorage.deleteReport(btn.dataset.deleteReport);
      if (state.currentReport?.id === btn.dataset.deleteReport) {
        state.currentReport = null;
        renderReport(null);
      }
      await refreshHistoryUI();
      showToast('Report removed from local storage.');
    });
  });
}

function renderTierSpecTable() {
  const tbody = document.getElementById('tier-spec-tbody');
  if (!tbody) return;
  tbody.innerHTML = MHQ_TIERS.map(
    (t) => `
    <tr>
      <td>
        <span class="tier-badge" style="color: ${t.color}; background: ${t.bgColor}; border-color: ${t.borderColor};">
          ${escapeHTML(t.label)}
        </span>
      </td>
      <td><code>[${formatScore(t.min)}, ${formatScore(t.max)}${t.inclusiveMax ? ']' : ')'}</code></td>
      <td>${escapeHTML(t.summary)}</td>
    </tr>
  `
  ).join('');
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const errorBanner = document.getElementById('form-error-banner');

  const unanswered = MHQ_QUESTIONS.filter((q) => !state.responses[q.id]);
  if (unanswered.length > 0) {
    errorBanner.textContent = `Please rate all 24 items before generating a report (${unanswered.length} remaining). Highlighted below.`;
    errorBanner.hidden = false;

    document.querySelectorAll('.question-item').forEach((el) => el.classList.remove('unanswered-highlight'));
    unanswered.forEach((q) => {
      document.querySelector(`.question-item[data-question-id="${q.id}"]`)?.classList.add('unanswered-highlight');
    });

    const firstEl = document.querySelector(`.question-item[data-question-id="${unanswered[0].id}"]`);
    firstEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const metadata = {
    participantAlias: document.getElementById('participant-alias')?.value || '',
    ageGroup: document.getElementById('age-group')?.value || 'Prefer not to say',
    assessmentDate: document.getElementById('assessment-date')?.value || getTodayLocalDate(),
    notes: document.getElementById('session-notes')?.value || '',
    profilePreset: state.currentPreset
  };

  const previousReport = state.history.length > 0 ? state.history[0] : null;
  const report = calculateMHQReport(state.responses, metadata, previousReport);

  await mhqStorage.saveReport(report);
  state.currentReport = report;

  await refreshHistoryUI();
  renderReport(report);
  switchView('report');
  showToast(`Report generated (${formatScore(report.overallScore)}) and saved locally.`);
}

function updateConnectivityBadge() {
  const badge = document.getElementById('connectivity-badge');
  const text = document.getElementById('connectivity-text');
  if (!badge || !text) return;

  const isOnline = navigator.onLine;
  badge.classList.toggle('status-online', isOnline);
  badge.classList.toggle('status-offline', !isOnline);
  text.textContent = isOnline ? 'Online — Offline Ready' : 'Offline Mode Active';
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js', { scope: './' });
    } catch {
      // Service Worker unavailable (e.g., file:// protocol); core client features continue normally.
    }
  }
}

function bindEvents() {
  document.querySelectorAll('.nav-tab').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => applySamplePreset(btn.dataset.preset));
  });

  document.getElementById('reset-form-btn')?.addEventListener('click', resetAssessmentForm);
  document.getElementById('mhq-form')?.addEventListener('submit', handleFormSubmit);

  document.getElementById('back-to-assessment-btn')?.addEventListener('click', () => switchView('assessment'));
  document.getElementById('go-assess-from-empty')?.addEventListener('click', () => switchView('assessment'));

  document.getElementById('print-report-btn')?.addEventListener('click', () => {
    window.print();
  });

  document.getElementById('save-report-btn')?.addEventListener('click', async () => {
    if (!state.currentReport) return;
    await mhqStorage.saveReport(state.currentReport);
    await refreshHistoryUI();
    showToast('Report verified in local IndexedDB storage.');
  });

  document.getElementById('clear-history-btn')?.addEventListener('click', async () => {
    if (state.history.length === 0) return;
    const confirmed = window.confirm('Permanently delete all locally saved MHQ reports from this browser?');
    if (!confirmed) return;
    await mhqStorage.clearAllReports();
    state.currentReport = null;
    renderReport(null);
    await refreshHistoryUI();
    showToast('All local MHQ history cleared.');
  });

  window.addEventListener('online', updateConnectivityBadge);
  window.addEventListener('offline', updateConnectivityBadge);

  const installBtn = document.getElementById('install-pwa-btn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredInstallPrompt = e;
    if (installBtn) installBtn.hidden = false;
  });

  installBtn?.addEventListener('click', async () => {
    if (!state.deferredInstallPrompt) return;
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    installBtn.hidden = true;
  });
}

async function init() {
  const dateEl = document.getElementById('assessment-date');
  if (dateEl) dateEl.value = getTodayLocalDate();

  renderQuestions();
  renderTierSpecTable();
  renderReport(null);
  bindEvents();
  updateConnectivityBadge();
  await refreshHistoryUI();
  await registerServiceWorker();
}

document.addEventListener('DOMContentLoaded', init);
