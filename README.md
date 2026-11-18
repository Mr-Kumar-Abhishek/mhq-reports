# MHQ Reports — Offline-First Mental Health Quotient PWA

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](./LICENSE)

A **100% client-side, zero-dependency, offline-first Progressive Web Application (PWA)** for conducting multi-dimensional Mental Health Quotient (MHQ) assessments, generating interactive and printable vector SVG analytical reports, and tracking longitudinal history privately on-device via IndexedDB.

---

## Documentation (SRS & SDLC)

- **[License (`LICENSE`)](./LICENSE)** — MIT License
- **[Software Requirements Specification (`docs/SRS.md`)](./docs/SRS.md)** — IEEE 830 / ISO 29148 functional/non-functional requirements (`FR-01`–`FR-07`, `NFR-01`–`NFR-05`), mathematical model, IndexedDB schema, and Requirements Traceability Matrix (RTM).
- **[Software Development Life Cycle (`docs/SDLC.md`)](./docs/SDLC.md)** — 6-phase Privacy-By-Design, Offline-First Agile SDLC, Mermaid Service Worker and Assessment-to-PDF sequence diagrams, risk register, and release readiness checklist.

---

## Key Features

- **Six Core Wellbeing Dimensions (24 Items):**
  - *Mood & Outlook* (`mood_outlook`)
  - *Social Self* (`social_self`)
  - *Drive & Motivation* (`drive_motivation`)
  - *Cognition* (`cognition`)
  - *Adaptability & Resilience* (`adaptability_resilience`)
  - *Mind-Body Connection* (`mind_body`)
- **Asymmetric `-100` to `+200` MHQ Scoring Engine (`js/scoring-engine.js`):**
  - Piecewise linear mapping anchored at rating `4 -> 0` (Functional Baseline):
    - `1..4` maps to `[-100, 0]` via `((r - 4) / 3) * 100`
    - `4..9` maps to `[0, +200]` via `((r - 4) / 5) * 200`
  - Six standardized spectrum tiers: *Clinical* `[-100, -50)`, *Struggling* `[-50, 0)`, *Enduring* `[0, 50)`, *Managing* `[50, 100)`, *Succeeding* `[100, 150)`, *Thriving* `[150, 200]`.
- **Pure Vector SVG Visualizations (`js/charts.js`):**
  - Overall MHQ Spectrum Gauge
  - 6-Dimension Hexagonal Radar Chart
  - Dimension Diverging Bar Chart (anchored at `0`)
  - Longitudinal History Trend Line Chart
- **Offline-First & Private (`sw.js`, `js/db.js`):**
  - Cache-First Service Worker (`mhq-pwa-v1`) precaches the full App Shell with zero external CDNs.
  - Persistent local IndexedDB storage (`mhq_reports_db` v1) with `localStorage` and memory fallbacks.
  - Print / Export to PDF (`@media print`) preserving vector charts and pagination.

---

## Repository Structure

```text
mhq-reports/
├── LICENSE                   # MIT License
├── README.md                 # Project documentation & usage guide
├── index.html                # Offline-first SPA shell
├── manifest.webmanifest      # Standalone PWA manifest
├── sw.js                     # Cache-First Service Worker
├── assets/
│   ├── icon-192.svg          # PWA vector icon (192x192)
│   └── icon-512.svg          # PWA vector icon (512x512)
├── css/
│   └── styles.css            # Responsive UI + @media print rules
├── docs/
│   ├── SRS.md                # Software Requirements Specification
│   └── SDLC.md               # Software Development Life Cycle
├── js/
│   ├── mhq-data.js           # 6 dimensions, 24 items, tiers, recommendations, presets
│   ├── scoring-engine.js     # Deterministic -100 to +200 scoring engine
│   ├── charts.js             # Pure SVG visual chart renderers
│   ├── db.js                 # IndexedDB persistence + fallbacks
│   └── app.js                # UI controller & SW registration
├── scripts/
│   └── build-local.mjs       # Local syntax, NFR-03 budget, verification & gh-pages sync
└── tests/
    └── verify.mjs            # Zero-dependency Node.js verification suite
```

---

## Running Locally & Testing Offline Mode

Service Workers require a Secure Context (`https://` or `http://localhost`). Serve the root directory using Python or Node:

```powershell
python -m http.server 8080
```

Then open `http://localhost:8080` in Chrome/Edge/Firefox:
1. Verify **Online — Offline Ready** appears in the header.
2. Open DevTools -> **Application** -> **Service Workers** and toggle **Offline** (or disconnect Wi-Fi) and reload the page—the full app boots cleanly offline.
3. Try a 1-click Demo Profile (*Thriving*, *Managing*, *Struggling*) or answer all 24 questions, generate a report, and click **Print / Export PDF**.

### Local Build, Verification & GitHub Pages Sync

All syntax checks, verification assertions, NFR-03 `< 100ms` performance checks, and `gh-pages` static asset packaging run locally without spawning extra CI runner VMs:

```powershell
# Run syntax checks + offline PWA & NFR-03 verification locally
node scripts/build-local.mjs

# Verify locally and sync static PWA files onto the local gh-pages branch
node scripts/build-local.mjs --sync-gh-pages

# Push updated branches when ready
git push origin main master develop gh-pages
```

---

## License

Licensed under the [MIT License](./LICENSE).
