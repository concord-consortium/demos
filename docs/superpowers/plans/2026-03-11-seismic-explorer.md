# Seismic Explorer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone HTML page for exploring a year of procedurally generated seismic data with multi-resolution tiled zoom.

**Architecture:** Single `index.html` file with all JS/CSS inline. uPlot from CDN handles charting. A tile-based data generation system produces seismic envelopes at three zoom levels (L0/L1/L2), generating finer detail on demand within parent envelope constraints.

**Tech Stack:** Vanilla JS, uPlot (CDN), HTML5 Canvas (via uPlot)

**Spec:** `docs/superpowers/specs/2026-03-11-seismic-explorer-design.md`

---

## File Structure

- **Create:** `index.html` — the entire application (HTML structure, CSS styles, JS logic)

All code lives in one file. Logically the JS is organized into these sections:
1. **Seeded RNG** — deterministic random number generator
2. **Event Schedule** — generates seismic events for the year
3. **Tile Cache** — stores and retrieves generated tiles
4. **L0/L1/L2 Generators** — tile generation at each resolution
5. **Zoom Controller** — determines which level to use, which tiles to load
6. **uPlot Setup** — chart configuration, rendering, interaction hooks

Since there's no test framework (standalone HTML demo), verification at each step is: open in browser, check the browser console for errors, and visually confirm the output.

---

## Chunk 1: Foundation — RNG, Events, L0, and First Render

### Task 1: HTML Scaffold with uPlot and Dark Styling

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create the HTML file with basic structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seismic Explorer</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/uplot@1.6.31/dist/uPlot.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #1a1a2e;
      color: #e0e0e0;
      font-family: 'Courier New', monospace;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    #toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: #16213e;
      border-bottom: 1px solid #0f3460;
    }
    #toolbar button {
      background: #0f3460;
      color: #e0e0e0;
      border: 1px solid #533483;
      padding: 4px 12px;
      cursor: pointer;
      font-family: inherit;
      font-size: 16px;
      border-radius: 3px;
    }
    #toolbar button:hover { background: #533483; }
    #time-range { font-size: 13px; color: #a0a0c0; }
    #chart-container { flex: 1; padding: 8px; }
  </style>
</head>
<body>
  <div id="toolbar">
    <button id="zoom-out">−</button>
    <button id="zoom-in">+</button>
    <span id="time-range"></span>
  </div>
  <div id="chart-container"></div>
  <script src="https://cdn.jsdelivr.net/npm/uplot@1.6.31/dist/uPlot.iife.min.js"></script>
  <script>
    // Application code will go here
    console.log('Seismic Explorer loaded');
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser**

Run: `open index.html` (or use a local server)
Expected: Dark page with toolbar containing − and + buttons, no console errors.

- [ ] **Step 3: Commit**

```bash
git init
git add index.html
git commit -m "feat: HTML scaffold with uPlot CDN and dark styling"
```

---

### Task 2: Seeded RNG

**Files:**
- Modify: `index.html` (inside the `<script>` tag)

- [ ] **Step 1: Implement the seeded RNG**

Replace the `// Application code will go here` comment with the RNG implementation. Uses a multiply-xorshift (mulberry32) PRNG seeded by a string hash (FNV-1a).

```javascript
// ============================================================
// Seeded RNG (FNV-1a hash + mulberry32 PRNG)
// ============================================================
function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function createRng(seed) {
  let s = typeof seed === 'string' ? hashString(seed) : seed;
  return function() {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 2: Add a quick console test and verify**

Add after the RNG code:
```javascript
// Quick RNG verification (remove later)
const testRng = createRng('test-seed');
console.log('RNG test (should be same every reload):', testRng(), testRng(), testRng());
```

Run: Open in browser, reload twice.
Expected: Same three numbers printed each time.

- [ ] **Step 3: Remove the console test, commit**

Remove the RNG verification lines.

```bash
git add index.html
git commit -m "feat: seeded RNG with FNV-1a hash and mulberry32 PRNG"
```

---

### Task 3: Seismic Event Schedule

**Files:**
- Modify: `index.html` (inside the `<script>` tag, after RNG)

- [ ] **Step 1: Define time constants and generate the event schedule**

```javascript
// ============================================================
// Time Constants
// ============================================================
const YEAR = 2025;
const YEAR_START = Date.UTC(YEAR, 0, 1) / 1000;           // Jan 1 00:00:00 UTC, in seconds
const YEAR_END = Date.UTC(YEAR + 1, 0, 1) / 1000;         // Jan 1 next year
const YEAR_DURATION = YEAR_END - YEAR_START;               // seconds in the year

// ============================================================
// Seismic Event Schedule
// ============================================================
function generateEventSchedule(masterSeed) {
  const rng = createRng(masterSeed);
  const numEvents = 50 + Math.floor(rng() * 51); // 50–100 events
  const events = [];
  for (let i = 0; i < numEvents; i++) {
    const timestamp = YEAR_START + rng() * YEAR_DURATION;  // seconds since epoch
    const magnitude = 1 + rng() * 6;                       // 1.0 – 7.0
    // Duration scales with magnitude: small quakes ~10s, large ~300s
    const duration = (5 + magnitude * 40) * (0.5 + rng());
    events.push({ timestamp, magnitude, duration });
  }
  // Sort by time for efficient lookup
  events.sort((a, b) => a.timestamp - b.timestamp);
  return events;
}

const events = generateEventSchedule('seismic-demo-2025');
console.log(`Generated ${events.length} seismic events`);
```

- [ ] **Step 2: Verify in browser**

Run: Open in browser.
Expected: Console shows "Generated NN seismic events" where NN is 50–100. Same number on every reload.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: deterministic seismic event schedule generation"
```

---

### Task 4: Tile Cache and L0 Generation

**Files:**
- Modify: `index.html` (inside the `<script>` tag, after event schedule)

- [ ] **Step 1: Implement the tile cache**

```javascript
// ============================================================
// Tile Cache
// ============================================================
const tileCache = new Map();

function getTile(key) {
  return tileCache.get(key);
}

function setTile(key, data) {
  tileCache.set(key, data);
  return data;
}
```

- [ ] **Step 2: Implement L0 tile generation**

```javascript
// ============================================================
// L0 Generation — min/max per 10 minutes, 1 tile = 1 day
// ============================================================
const L0_WINDOW = 600;       // 10 minutes in seconds
const L0_TILE_DURATION = 86400; // 1 day in seconds
const L0_PAIRS_PER_TILE = 144;  // 24 hours * 6 windows/hour

function getEnvelopeAtTime(t) {
  // Baseline: diurnal noise pattern
  const hourOfDay = ((t - YEAR_START) % 86400) / 3600;
  // Higher during "daytime" (6am–10pm), lower at night
  const diurnal = 0.3 + 0.7 * Math.max(0, Math.sin((hourOfDay - 6) / 16 * Math.PI));
  // Slow seasonal variation
  const dayOfYear = (t - YEAR_START) / 86400;
  const seasonal = 0.8 + 0.2 * Math.sin(dayOfYear / 365 * 2 * Math.PI);

  let baseline = 0.02 * diurnal * seasonal;

  // Add event contributions
  for (const ev of events) {
    const dt = t - ev.timestamp;
    if (dt < -10 || dt > ev.duration * 3) continue; // skip irrelevant events
    if (dt < 0) {
      // Slight pre-arrival
      baseline += 0.001 * ev.magnitude * Math.exp(dt * 2);
    } else {
      // Sharp attack + exponential decay
      const attack = Math.min(1, dt / (ev.duration * 0.05));
      const decay = Math.exp(-dt / (ev.duration * 0.4));
      const amp = ev.magnitude * 0.15 * attack * decay;
      baseline += amp;
    }
  }

  return baseline;
}

function generateL0Tile(tileIndex) {
  const key = `L0-${tileIndex}`;
  const cached = getTile(key);
  if (cached) return cached;

  const rng = createRng(key);
  const tileStart = YEAR_START + tileIndex * L0_TILE_DURATION;
  // Store as [min0, max0, min1, max1, ...] — 288 values
  const data = new Float32Array(L0_PAIRS_PER_TILE * 2);

  for (let i = 0; i < L0_PAIRS_PER_TILE; i++) {
    const windowStart = tileStart + i * L0_WINDOW;
    const windowMid = windowStart + L0_WINDOW / 2;
    const envelope = getEnvelopeAtTime(windowMid);
    // Add per-tile randomness for visual variety
    const noise = 1 + (rng() - 0.5) * 0.3;
    const amp = envelope * noise;
    data[i * 2] = -amp;      // min
    data[i * 2 + 1] = amp;   // max
  }

  return setTile(key, data);
}

// Generate all 365 L0 tiles on load
const NUM_L0_TILES = Math.ceil(YEAR_DURATION / L0_TILE_DURATION);
for (let i = 0; i < NUM_L0_TILES; i++) {
  generateL0Tile(i);
}
console.log(`Generated ${NUM_L0_TILES} L0 tiles`);
```

- [ ] **Step 3: Verify in browser**

Run: Open in browser.
Expected: Console shows "Generated 365 L0 tiles" (or 366 if boundary math rounds up). No errors. Should load near-instantly.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: tile cache and L0 envelope generation for full year"
```

---

### Task 5: Render L0 Data in uPlot — First Visible Chart

**Files:**
- Modify: `index.html` (inside the `<script>` tag, after L0 generation)

This is the milestone where we see something on screen: the full year of seismic envelope data rendered as a filled band.

- [ ] **Step 1: Implement data assembly for the visible range**

```javascript
// ============================================================
// Data Assembly — collect tile data for visible range
// ============================================================
function assembleL0Data(startTime, endTime) {
  const times = [];
  const mins = [];
  const maxs = [];

  const firstTile = Math.max(0, Math.floor((startTime - YEAR_START) / L0_TILE_DURATION));
  const lastTile = Math.min(NUM_L0_TILES - 1, Math.floor((endTime - YEAR_START) / L0_TILE_DURATION));

  for (let ti = firstTile; ti <= lastTile; ti++) {
    const tile = generateL0Tile(ti);
    const tileStart = YEAR_START + ti * L0_TILE_DURATION;
    for (let i = 0; i < L0_PAIRS_PER_TILE; i++) {
      const t = tileStart + i * L0_WINDOW + L0_WINDOW / 2;
      if (t < startTime || t > endTime) continue;
      times.push(t);
      mins.push(tile[i * 2]);
      maxs.push(tile[i * 2 + 1]);
    }
  }

  return [times, mins, maxs];
}
```

- [ ] **Step 2: Set up uPlot with band rendering**

```javascript
// ============================================================
// uPlot Setup
// ============================================================
const chartContainer = document.getElementById('chart-container');

function getChartSize() {
  return {
    width: chartContainer.clientWidth,
    height: chartContainer.clientHeight || (window.innerHeight - 50),
  };
}

const initialData = assembleL0Data(YEAR_START, YEAR_END);

const opts = {
  ...getChartSize(),
  cursor: { drag: { x: true, y: false } },
  scales: {
    x: { time: true, min: YEAR_START, max: YEAR_END },
    y: { auto: true },
  },
  axes: [
    {
      stroke: '#a0a0c0',
      grid: { stroke: 'rgba(160,160,192,0.1)' },
      ticks: { stroke: 'rgba(160,160,192,0.2)' },
    },
    {
      stroke: '#a0a0c0',
      grid: { stroke: 'rgba(160,160,192,0.1)' },
      ticks: { stroke: 'rgba(160,160,192,0.2)' },
    },
  ],
  series: [
    {}, // x-axis (time)
    {
      label: 'Min',
      stroke: 'rgba(0,255,136,0.6)',
      fill: 'rgba(0,255,136,0.15)',
      width: 1,
      band: true,
    },
    {
      label: 'Max',
      stroke: 'rgba(0,255,136,0.6)',
      fill: 'rgba(0,255,136,0.15)',
      width: 1,
    },
  ],
  hooks: {},
};

let uplot = new uPlot(opts, initialData, chartContainer);

// Handle window resize
window.addEventListener('resize', () => {
  const size = getChartSize();
  uplot.setSize(size);
});
```

- [ ] **Step 3: Verify in browser**

Run: Open in browser.
Expected: A dark chart fills the page showing a full year (Jan–Dec 2025) of seismic envelope data as a green filled band. The band should show variation — quiet periods and bursts from seismic events.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: render full year L0 envelope data in uPlot"
```

---

## Chunk 2: Interaction and Multi-Resolution

### Task 6: Zoom Buttons and Time Range Display

**Files:**
- Modify: `index.html` (inside the `<script>` tag, after uPlot setup)

- [ ] **Step 1: Implement zoom buttons and time range label**

```javascript
// ============================================================
// Toolbar — Zoom Buttons and Time Range
// ============================================================
const timeRangeLabel = document.getElementById('time-range');

function formatTimeRange(minTime, maxTime) {
  const fmt = (t) => {
    const d = new Date(t * 1000);
    const opts = { year: 'numeric', month: 'short', day: 'numeric',
                   hour: '2-digit', minute: '2-digit', second: '2-digit',
                   timeZone: 'UTC' };
    return d.toLocaleString('en-US', opts);
  };
  const duration = maxTime - minTime;
  let durStr;
  if (duration >= 86400) durStr = `${(duration / 86400).toFixed(1)} days`;
  else if (duration >= 3600) durStr = `${(duration / 3600).toFixed(1)} hours`;
  else if (duration >= 60) durStr = `${(duration / 60).toFixed(1)} min`;
  else durStr = `${duration.toFixed(1)} sec`;

  return `${fmt(minTime)}  —  ${fmt(maxTime)}  (${durStr})`;
}

function updateTimeRangeLabel() {
  const xScale = uplot.scales.x;
  timeRangeLabel.textContent = formatTimeRange(xScale.min, xScale.max);
}

updateTimeRangeLabel();

document.getElementById('zoom-in').addEventListener('click', () => {
  const xScale = uplot.scales.x;
  const mid = (xScale.min + xScale.max) / 2;
  const halfRange = (xScale.max - xScale.min) / 4; // 2x zoom in
  const newMin = Math.max(YEAR_START, mid - halfRange);
  const newMax = Math.min(YEAR_END, mid + halfRange);
  uplot.setScale('x', { min: newMin, max: newMax });
});

document.getElementById('zoom-out').addEventListener('click', () => {
  const xScale = uplot.scales.x;
  const mid = (xScale.min + xScale.max) / 2;
  const halfRange = (xScale.max - xScale.min); // 2x zoom out
  const newMin = Math.max(YEAR_START, mid - halfRange);
  const newMax = Math.min(YEAR_END, mid + halfRange);
  uplot.setScale('x', { min: newMin, max: newMax });
});
```

- [ ] **Step 2: Verify in browser**

Run: Open in browser.
Expected: Time range label shows "Jan 1, 2025 ... — Dec 31, 2025 ... (365.0 days)". Clicking + zooms in, − zooms out. The chart currently only shows L0 data at all zoom levels (multi-resolution comes next).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: zoom buttons and time range display"
```

---

### Task 7: Zoom Level Selection and setScale Hook

**Files:**
- Modify: `index.html` (inside the `<script>` tag)

This task adds the logic that determines which zoom level to use based on the visible range, and hooks into uPlot's scale changes to update data.

- [ ] **Step 1: Implement zoom level selection**

Add before the uPlot setup section. Note: L1/L2 constants are duplicated here for the zoom level calculation; they are also defined in their respective generator tasks (Tasks 8 and 9). In the final file they'll appear once — in this section, before the generators.

```javascript
// ============================================================
// Zoom Level Selection and Level Constants
// ============================================================
const L1_WINDOW = 10;            // 10 seconds
const L1_TILE_DURATION = 3600;   // 1 hour in seconds
const L1_PAIRS_PER_TILE = 360;

const L2_SAMPLE_RATE = 100;      // 100 Hz
const L2_TILE_DURATION = 60;     // 1 minute in seconds
const L2_SAMPLES_PER_TILE = 6000;

function selectZoomLevel(visibleDuration) {
  // Pick the finest level that produces <= ~4000 points
  const l2Points = visibleDuration * L2_SAMPLE_RATE;
  if (l2Points <= 4000) return 2;
  const l1Points = (visibleDuration / L1_WINDOW) * 2; // *2 for min/max pairs
  if (l1Points <= 4000) return 1;
  return 0;
}
```

- [ ] **Step 2: Implement the data update function**

Add after zoom level selection:

```javascript
// ============================================================
// Data Update on Viewport Change
// ============================================================
let currentLevel = 0;

function updateData() {
  const xScale = uplot.scales.x;
  const startTime = xScale.min;
  const endTime = xScale.max;
  const duration = endTime - startTime;
  const level = selectZoomLevel(duration);

  let data;
  if (level === 0) {
    data = assembleL0Data(startTime, endTime);
  } else if (level === 1) {
    data = assembleL1Data(startTime, endTime);
  } else {
    data = assembleL2Data(startTime, endTime);
  }

  currentLevel = level;
  uplot.setData(data, false);
  updateTimeRangeLabel();
}
```

- [ ] **Step 3: Add the setScale hook to the uPlot opts**

Modify the `opts.hooks` in the uPlot setup to:

```javascript
  hooks: {
    setScale: [
      (u, key) => {
        if (key === 'x') {
          updateData();
        }
      },
    ],
  },
```

- [ ] **Step 4: Verify in browser**

Run: Open in browser.
Expected: The full year view still renders. Zooming in will fail with "assembleL1Data is not defined" in console — that's expected, we implement it next. The zoom level selection logic is in place.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: zoom level selection and viewport change hook"
```

---

### Task 8: L1 Tile Generation

**Files:**
- Modify: `index.html` (inside the `<script>` tag, after the zoom level constants from Task 7)

- [ ] **Step 1: Implement L1 tile generation**

```javascript
// ============================================================
// L1 Generation — min/max per 10 sec, 1 tile = 1 hour
// ============================================================
function getL0EnvelopeAt(t) {
  // Look up the L0 envelope value for time t, with linear interpolation
  // between adjacent windows for smooth transitions at 10-min boundaries
  const tileIndex = Math.floor((t - YEAR_START) / L0_TILE_DURATION);
  const tile = generateL0Tile(tileIndex);
  const tileStart = YEAR_START + tileIndex * L0_TILE_DURATION;
  const exactIndex = (t - tileStart) / L0_WINDOW - 0.5; // center of window
  const i0 = Math.max(0, Math.min(L0_PAIRS_PER_TILE - 1, Math.floor(exactIndex)));
  const i1 = Math.min(L0_PAIRS_PER_TILE - 1, i0 + 1);
  const frac = Math.max(0, Math.min(1, exactIndex - i0));
  const v0 = tile[i0 * 2 + 1]; // positive envelope
  const v1 = tile[i1 * 2 + 1];
  return v0 + (v1 - v0) * frac;
}

function generateL1Tile(tileIndex) {
  const key = `L1-${tileIndex}`;
  const cached = getTile(key);
  if (cached) return cached;

  const rng = createRng(key);
  const tileStart = YEAR_START + tileIndex * L1_TILE_DURATION;
  const data = new Float32Array(L1_PAIRS_PER_TILE * 2);

  for (let i = 0; i < L1_PAIRS_PER_TILE; i++) {
    const windowStart = tileStart + i * L1_WINDOW;
    const windowMid = windowStart + L1_WINDOW / 2;

    // Get parent L0 envelope and interpolate for smooth transitions
    const parentEnv = getL0EnvelopeAt(windowMid);

    // Add sub-window variation within parent bounds
    const variation = 0.3 + rng() * 0.7; // 30%–100% of parent envelope
    const amp = parentEnv * variation;

    data[i * 2] = -amp;
    data[i * 2 + 1] = amp;
  }

  return setTile(key, data);
}

function assembleL1Data(startTime, endTime) {
  const times = [];
  const mins = [];
  const maxs = [];

  const firstTile = Math.max(0, Math.floor((startTime - YEAR_START) / L1_TILE_DURATION));
  const lastTile = Math.min(
    Math.ceil(YEAR_DURATION / L1_TILE_DURATION) - 1,
    Math.floor((endTime - YEAR_START) / L1_TILE_DURATION)
  );

  for (let ti = firstTile; ti <= lastTile; ti++) {
    const tile = generateL1Tile(ti);
    const tileStart = YEAR_START + ti * L1_TILE_DURATION;
    for (let i = 0; i < L1_PAIRS_PER_TILE; i++) {
      const t = tileStart + i * L1_WINDOW + L1_WINDOW / 2;
      if (t < startTime || t > endTime) continue;
      times.push(t);
      mins.push(tile[i * 2]);
      maxs.push(tile[i * 2 + 1]);
    }
  }

  return [times, mins, maxs];
}
```

- [ ] **Step 2: Verify in browser**

Run: Open in browser. Zoom in a few times with the + button.
Expected: When zoomed to under ~11 hours, the chart should switch to L1 data — more detail visible within the envelope. The transition should feel natural (L1 data stays within L0 bounds).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: L1 tile generation with parent envelope constraint"
```

---

### Task 9: L2 Tile Generation — Raw Waveform

**Files:**
- Modify: `index.html` (inside the `<script>` tag, after L1 generation)

- [ ] **Step 1: Implement L2 tile generation**

```javascript
// ============================================================
// L2 Generation — raw 100Hz samples, 1 tile = 1 minute
// ============================================================
function getL1EnvelopeAt(t) {
  // Linear interpolation across 10-sec window boundaries
  const tileIndex = Math.floor((t - YEAR_START) / L1_TILE_DURATION);
  const tile = generateL1Tile(tileIndex);
  const tileStart = YEAR_START + tileIndex * L1_TILE_DURATION;
  const exactIndex = (t - tileStart) / L1_WINDOW - 0.5;
  const i0 = Math.max(0, Math.min(L1_PAIRS_PER_TILE - 1, Math.floor(exactIndex)));
  const i1 = Math.min(L1_PAIRS_PER_TILE - 1, i0 + 1);
  const frac = Math.max(0, Math.min(1, exactIndex - i0));
  const v0 = tile[i0 * 2 + 1];
  const v1 = tile[i1 * 2 + 1];
  return v0 + (v1 - v0) * frac;
}

function generateL2Tile(tileIndex) {
  const key = `L2-${tileIndex}`;
  const cached = getTile(key);
  if (cached) return cached;

  const rng = createRng(key);
  const tileStart = YEAR_START + tileIndex * L2_TILE_DURATION;
  const data = new Float32Array(L2_SAMPLES_PER_TILE);

  // Generate band-limited noise (~1-10 Hz at 100Hz sample rate)
  // Use multiple sine waves at random phases for a naturalistic waveform
  const numFreqs = 8;
  const freqs = [];
  const phases = [];
  const amps = [];
  for (let f = 0; f < numFreqs; f++) {
    freqs.push(1 + rng() * 9);     // 1–10 Hz
    phases.push(rng() * Math.PI * 2);
    amps.push(0.5 + rng() * 0.5);
  }

  for (let i = 0; i < L2_SAMPLES_PER_TILE; i++) {
    const t = tileStart + i / L2_SAMPLE_RATE;
    const envelope = getL1EnvelopeAt(t);

    // Sum of sinusoids for band-limited noise
    let sample = 0;
    for (let f = 0; f < numFreqs; f++) {
      sample += amps[f] * Math.sin(2 * Math.PI * freqs[f] * (i / L2_SAMPLE_RATE) + phases[f]);
    }
    // Normalize and scale to envelope
    sample = (sample / numFreqs) * envelope;

    // Add a small amount of high-frequency jitter
    sample += (rng() - 0.5) * envelope * 0.1;

    data[i] = sample;
  }

  return setTile(key, data);
}

function assembleL2Data(startTime, endTime) {
  const times = [];
  const values = [];

  const firstTile = Math.max(0, Math.floor((startTime - YEAR_START) / L2_TILE_DURATION));
  const lastTile = Math.min(
    Math.ceil(YEAR_DURATION / L2_TILE_DURATION) - 1,
    Math.floor((endTime - YEAR_START) / L2_TILE_DURATION)
  );

  for (let ti = firstTile; ti <= lastTile; ti++) {
    const tile = generateL2Tile(ti);
    const tileStart = YEAR_START + ti * L2_TILE_DURATION;
    for (let i = 0; i < L2_SAMPLES_PER_TILE; i++) {
      const t = tileStart + i / L2_SAMPLE_RATE;
      if (t < startTime || t > endTime) continue;
      times.push(t);
      values.push(tile[i]);
    }
  }

  return [times, values, values]; // Same data for both series (line, not band)
}
```

- [ ] **Step 2: Verify in browser**

Run: Open in browser. Zoom in repeatedly with + until at ~40 seconds range.
Expected: Chart transitions to showing a raw waveform line instead of a filled band. The waveform should look like a seismogram — oscillating signal whose amplitude matches the envelope visible at coarser zoom levels.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: L2 raw waveform generation at 100Hz with parent envelope constraint"
```

---

## Chunk 3: Polish and Refinement

### Task 10: Visual Transition Between Envelope and Line Rendering

**Files:**
- Modify: `index.html` (refactor uPlot setup and updateData to support chart recreation)

uPlot does not reliably support mutating series config (band, fill, stroke) after construction. Instead, we destroy and recreate the uPlot instance when crossing the L2 boundary. This is fast (<10ms) and gives clean transitions.

- [ ] **Step 1: Refactor uPlot creation into a `createChart` function**

Replace the existing uPlot setup code (from Task 5) with a factory function. The `updateData` function (from Task 7) is also replaced.

```javascript
// ============================================================
// uPlot Chart Factory — supports band (L0/L1) and line (L2) modes
// ============================================================
const chartContainer = document.getElementById('chart-container');

function getChartSize() {
  return {
    width: chartContainer.clientWidth,
    height: chartContainer.clientHeight || (window.innerHeight - 50),
  };
}

let uplot = null;
let currentMode = 'band'; // 'band' for L0/L1, 'line' for L2
let currentLevel = 0;

function buildSeriesConfig(mode) {
  if (mode === 'band') {
    return [
      {}, // x-axis
      {
        label: 'Min',
        stroke: 'rgba(0,255,136,0.6)',
        fill: 'rgba(0,255,136,0.15)',
        width: 1,
        band: true,
      },
      {
        label: 'Max',
        stroke: 'rgba(0,255,136,0.6)',
        fill: 'rgba(0,255,136,0.15)',
        width: 1,
      },
    ];
  } else {
    return [
      {}, // x-axis
      {
        label: 'Amplitude',
        stroke: 'rgba(0,255,136,0.9)',
        width: 1,
      },
    ];
  }
}

function createChart(data, mode, scaleMin, scaleMax) {
  if (uplot) {
    uplot.destroy();
  }

  const opts = {
    ...getChartSize(),
    cursor: {
      drag: { x: false, y: false },
    },
    scales: {
      x: { time: true, min: scaleMin, max: scaleMax },
      y: { auto: true },
    },
    axes: [
      {
        stroke: '#a0a0c0',
        grid: { stroke: 'rgba(160,160,192,0.1)' },
        ticks: { stroke: 'rgba(160,160,192,0.2)' },
      },
      {
        stroke: '#a0a0c0',
        grid: { stroke: 'rgba(160,160,192,0.1)' },
        ticks: { stroke: 'rgba(160,160,192,0.2)' },
      },
    ],
    series: buildSeriesConfig(mode),
    hooks: {
      setScale: [
        (u, key) => {
          if (key === 'x') updateData();
        },
      ],
      init: [
        (u) => { attachInteractionHandlers(u); },
      ],
    },
  };

  currentMode = mode;
  uplot = new uPlot(opts, data, chartContainer);
}
```

- [ ] **Step 2: Update `assembleL2Data` to return a 2-array (not 3-array)**

```javascript
function assembleL2Data(startTime, endTime) {
  const times = [];
  const values = [];

  const firstTile = Math.max(0, Math.floor((startTime - YEAR_START) / L2_TILE_DURATION));
  const lastTile = Math.min(
    Math.ceil(YEAR_DURATION / L2_TILE_DURATION) - 1,
    Math.floor((endTime - YEAR_START) / L2_TILE_DURATION)
  );

  for (let ti = firstTile; ti <= lastTile; ti++) {
    const tile = generateL2Tile(ti);
    const tileStart = YEAR_START + ti * L2_TILE_DURATION;
    for (let i = 0; i < L2_SAMPLES_PER_TILE; i++) {
      const t = tileStart + i / L2_SAMPLE_RATE;
      if (t < startTime || t > endTime) continue;
      times.push(t);
      values.push(tile[i]);
    }
  }

  return [times, values]; // 2 arrays for line mode (no band)
}
```

- [ ] **Step 3: Rewrite `updateData` to handle chart recreation on mode change**

```javascript
let updatePending = false;

function updateData() {
  if (updatePending) return;
  updatePending = true;
  requestAnimationFrame(() => {
    updatePending = false;
    _doUpdateData();
  });
}

function _doUpdateData() {
  const xScale = uplot.scales.x;
  const startTime = xScale.min;
  const endTime = xScale.max;
  const duration = endTime - startTime;
  const level = selectZoomLevel(duration);
  const needMode = (level === 2) ? 'line' : 'band';

  let data;
  if (level === 0) {
    data = assembleL0Data(startTime, endTime);
  } else if (level === 1) {
    data = assembleL1Data(startTime, endTime);
  } else {
    data = assembleL2Data(startTime, endTime);
  }

  currentLevel = level;

  if (needMode !== currentMode) {
    // Mode changed — must recreate chart with new series config
    createChart(data, needMode, startTime, endTime);
  } else {
    uplot.setData(data, false);
  }

  updateTimeRangeLabel();
}
```

Note: `requestAnimationFrame` throttling prevents excessive chart recreation during rapid pan/zoom.

- [ ] **Step 4: Update initial chart creation**

Replace the old `new uPlot(...)` call with:
```javascript
const initialData = assembleL0Data(YEAR_START, YEAR_END);
createChart(initialData, 'band', YEAR_START, YEAR_END);
```

- [ ] **Step 5: Verify in browser**

Run: Open in browser. Zoom all the way in to L2 level (~40 sec range), then zoom back out.
Expected: At L0/L1 zoom, the data shows as a filled green band (min/max envelope). At L2 zoom, it shows as a single bright green line. Transitions between modes should be clean — the chart briefly rebuilds but this is imperceptible.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: visual transition between envelope band and raw line rendering"
```

---

### Task 11: Pan Support and Scroll Zoom

**Files:**
- Modify: `index.html` (uPlot opts)

We need wheel-to-zoom and drag-to-pan. Since the chart may be recreated on mode transitions (Task 10), interaction handlers are extracted into `attachInteractionHandlers(u)` which is called from the `init` hook in `createChart`.

- [ ] **Step 1: Implement `attachInteractionHandlers`**

Add before `createChart`:

```javascript
// ============================================================
// Interaction — Wheel Zoom and Drag-to-Pan
// ============================================================
function attachInteractionHandlers(u) {
  const over = u.over; // The chart's overlay element

  // Wheel zoom centered on cursor
  over.addEventListener('wheel', (e) => {
    e.preventDefault();
    const xScale = u.scales.x;
    const range = xScale.max - xScale.min;
    const cursor = u.posToVal(u.cursor.left, 'x');
    const factor = e.deltaY > 0 ? 1.25 : 0.8; // zoom out / in
    const newRange = Math.min(YEAR_DURATION, range * factor);
    // Keep cursor position stable
    const cursorFrac = (cursor - xScale.min) / range;
    const newMin = Math.max(YEAR_START, cursor - cursorFrac * newRange);
    const newMax = Math.min(YEAR_END, newMin + newRange);
    u.setScale('x', { min: newMin, max: newMax });
  }, { passive: false });

  // Drag to pan
  let dragStart = null;
  let dragStartMin = null;
  let dragStartMax = null;

  over.addEventListener('mousedown', (e) => {
    dragStart = e.clientX;
    dragStartMin = u.scales.x.min;
    dragStartMax = u.scales.x.max;
    over.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (dragStart === null) return;
    const dx = e.clientX - dragStart;
    const pxRange = u.bbox.width / devicePixelRatio;
    const timeRange = dragStartMax - dragStartMin;
    const dt = -(dx / pxRange) * timeRange;
    let newMin = dragStartMin + dt;
    let newMax = dragStartMax + dt;
    // Clamp to year
    if (newMin < YEAR_START) { newMax += YEAR_START - newMin; newMin = YEAR_START; }
    if (newMax > YEAR_END) { newMin -= newMax - YEAR_END; newMax = YEAR_END; }
    u.setScale('x', { min: newMin, max: newMax });
  });

  window.addEventListener('mouseup', () => {
    dragStart = null;
    over.style.cursor = 'crosshair';
  });

  over.style.cursor = 'crosshair';
}
```

Note: The `cursor.drag` and `hooks` configuration is already handled in `createChart` (Task 10). This task only adds the `attachInteractionHandlers` function that's referenced there.

- [ ] **Step 2: Verify in browser**

Run: Open in browser.
Expected: Mouse wheel zooms in/out centered on cursor position. Click and drag pans horizontally. Zoom buttons still work. Time range label updates on all interactions.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: wheel zoom and drag-to-pan interaction"
```

---

### Task 12: Final Polish

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add a zoom level indicator to the toolbar**

Add a `<span id="zoom-level"></span>` to the toolbar HTML. Update `updateData` to show the current level:

```javascript
const zoomLevelLabel = document.getElementById('zoom-level');
// In updateData():
const levelNames = ['Year Overview (10-min envelope)', 'Detail (10-sec envelope)', 'Raw Waveform (100Hz)'];
zoomLevelLabel.textContent = levelNames[level];
```

- [ ] **Step 2: Add keyboard shortcuts**

```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === '+' || e.key === '=') document.getElementById('zoom-in').click();
  if (e.key === '-') document.getElementById('zoom-out').click();
});
```

- [ ] **Step 3: Verify y-axis auto-scales correctly**

The y-axis should auto-scale because `scales.y.auto: true` is set in the chart options, and `setData(data, false)` with `false` only preserves the x-scale (not y). If the y-axis is not auto-scaling when panning between quiet and active regions, pass `true` as the second argument to `setData` (which lets uPlot auto-fit all scales) and then re-set the x-scale explicitly afterward.

- [ ] **Step 4: Verify everything end-to-end**

Run: Open in browser and test the full experience:
- Full year view shows filled envelope band with visible seismic events
- Scroll zoom works centered on cursor
- Drag panning works smoothly
- Zoom buttons work (centered on midpoint)
- Keyboard +/- shortcuts work
- Zooming through L0 → L1 → L2 transitions look smooth and consistent
- L2 waveforms stay within parent envelope bounds
- Time range label and zoom level indicator update correctly
- Same data appears on page reload (deterministic RNG)

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: final polish — zoom level indicator, keyboard shortcuts"
```
