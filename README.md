# Nor'easter Riley Simulation — Prototype

An interactive simulation prototype for the **Nor'easter Riley Performance Task** (MA DESE / The Concord Consortium). Students watch a nor'easter form along the U.S. East Coast in two coordinated views: a satellite sea-surface-temperature map showing *where* the storm forms, and a particle-level cross-section showing *why* — two air masses colliding and being forced upward over the warm Gulf Stream.

**Status:** prototype for educator/client review, not a production release.

## Files

| File | Description |
|------|-------------|
| `index.html` | Main prototype. Two-column layout: map and cross-section side by side as portrait panels, with their legends below and a shared toolbar. |
| `index-v1.html` | Earlier stacked layout (map row above cross-section row, legends in side columns). Same content and animation; kept for layout comparison. |
| `README.md` | This file. |

Both are fully self-contained single-file HTML — no build step, no local assets, no dependencies to install. Open directly in a browser or deploy as-is.

## Deployment

Deploys to the `concord-consortium/demos` repository, one branch per demo, with `index.html` at the branch root:

```bash
git clone https://github.com/concord-consortium/demos
cd demos
git checkout -b noreaster-simulation
# copy index.html (and optionally index-v1.html) into the repo root
git add index.html index-v1.html
git commit -m "Add Nor'easter Riley simulation prototype"
git push -u origin noreaster-simulation
```

Auto-deploys to `https://models-resources.concord.org/demos/branch/noreaster-simulation/`.

## Layout & design system (MassSims AP Full Width)

The prototype conforms to the **AP Full Width** footprint defined by the MassSims layout harness (`demos` repo, `masssims` branch, deployed at `models-resources.concord.org/demos/branch/masssims/`):

- Above everything: a slim review header (title left; "Prepared for MA DESE SPA Reviewers · Prototype by [CC logo] · Last updated …" right-aligned). The timestamp comes from `document.lastModified` — the file's Last-Modified header, i.e. the S3 upload time on the deployed site — so it refreshes automatically on every deploy with no build step
- Content area: **1044 × 562 px**, preceded by a 36px teal (`#047a99`) header bar reading "Nor'easter Riley Simulation (Prototype for DESE Review)"
- 50px sim title bar: sim name + short description on the left; MA DESE logo, Concord Consortium logo, and an "About" button (info icon + label, harness v0.2 style) on the right. About opens a floating, draggable 400px panel anchored top-right inside the content area (no backdrop) — toggle/Esc to close, Alt+Arrow keyboard dragging, scrollable body with a focus ring. Panel content lives in the `<template id="infoContent">` element
- Panels use the harness treatment: gray `#e8e8e8` boxes, 2px `#555` borders, 8px radius, centered overlapping title tabs
- Fonts: **Lato** for sim content, **Barlow / Barlow Condensed** for UI chrome (Google Fonts)
- Focus outlines: `#005FCC`, 3px (matches harness)
- Smallest target device is a Chromebook (1366×768 minus browser chrome ≈ 609px tall), so the 562px content height fits all MassSims target devices

## External (hot-linked) assets

All remote; nothing ships with the file. If any of these move, the sim degrades gracefully (the map falls back to a CSS gradient) but should be updated:

| Asset | Source | Notes |
|-------|--------|-------|
| SST basemap | `assets.science.nasa.gov/.../0/681/gulf_stream_modis_lrg.gif` | NASA Earth Observatory "Temperature of the Gulf Stream" (MODIS, May 8 2000). Public domain. Covers ~42.1N→33N, ~75.8W→62.5W. |
| DESE + CC logos, Info + Close icons | `models-resources.concord.org/demos/branch/masssims/icons/` | Shared design assets on the masssims branch — referenced there intentionally so they stay in sync with the design source. |
| Fonts | Google Fonts (Lato, Barlow, Barlow Condensed) | |

The comma-cloud storm icon, snowflakes, raindrops, and all other graphics are inline SVG — no external dependency.

### Map georeferencing

The map overlay (SVG `viewBox 0 0 503 282`, `preserveAspectRatio="none"`) sits over the image displayed with `object-fit: cover; object-position: top`, which shows the top ~84% of the image at width-fit scale (≈0.327 px per source px). Useful anchors in overlay coordinates: Massachusetts south coast ≈ (163, 15); Long Island ≈ x 45–112, y 24–43; the red Gulf Stream core sweeps from lower-left to mid-right. Annotation positions are schematic, placed against the real geography by eye — if you swap the basemap, re-derive positions (lat ≈ 37.3 px/°, lon ≈ 38.1 px/° from the top-left at 42.09N, 75.76W).

## How the animation works

One `requestAnimationFrame` loop drives everything from two clocks:

- `elapsed` — the 20-second timeline (`DUR = 20000`). Play/Pause/Rewind control this. Progress `p = elapsed/DUR` gates every visual via `smooth(start, end, p)` ramps.
- `clock` — ambient time driving continuous motion (Gulf Stream dash flow, particle jitter, falling precipitation). **Freezes when `elapsed >= DUR`**, so the sim ends on a still frame.

### Timeline (fractions of `p`, ≈ seconds at 20s)

| When | What happens |
|------|--------------|
| 0.02–0.08 (~0.4–1.6s) | Convergence flow ramps up; map air-mass arrows fade in (0.04–0.10) |
| < 0.26 (to ~5.2s) | Particles stream from both sides toward the center and **wait there** (path parameter capped at 0.53) — the air masses meet in the middle |
| 0.26 (~5.2s) | Release: collision forces air upward. Cloud band (0.26–0.34), red "L" badge (0.27–0.35), map comma cloud (0.28–0.37) fade in |
| 0.32–0.40 (~6.4–8s) | Precipitation ramps in |
| 0.32–0.875 (~6.4–17.5s) | Individual flakes/drops switch on one-by-one (`onP` per particle) — precipitation volume grows |
| 0.35–0.95 | Inflow/updraft speed multiplier ramps 1× → 2.5× — the cycle visibly accelerates |
| 1.0 (20s) | Everything freezes (freeze-frame of the mature storm) |

### Cross-section particle model

Modeled on the classic AccuWeather "Low Pressure Area" diagram and DESE feedback. Each particle loops along a parameterized path `u ∈ [0,1)`:

1. **Approach** (`u < 0.55`): from a side spawn point, sweep along a curve down toward the surface center — cold (blue, more dense) from the land side, warm (red, less dense) from the ocean side
2. **Collision/warming** (`0.55–0.62`): at the L, cold particles transition blue → red (warming over the warm ocean; `smooth(0.50, 0.62, u)`)
3. **Rise** (`0.62–0.96`): up the central column with a slight wiggle
4. **Cooling aloft** (`0.86–0.96`): all particles fade red → blue (rising air cools, moisture condenses)
5. **Fade & respawn** (`u ≥ 0.96`): dissolve into the cloud, reappear at the side (air rushing in to replace rising air)

Particles are staggered, so every stage is visible simultaneously. Colors interpolate via `mixCol(t)` between `#1f5fbf` (cool/dense) and `#c0392b` (warm/less dense).

### Useful tuning constants (in the `<script>`)

| Constant / expression | Meaning |
|----------------------|---------|
| `DUR` | Total timeline (ms) |
| `CYCLE` | Base duration of one particle loop (ms) |
| `COLD_N`, `WARM_N` | Particle counts per air mass |
| `SNOW_N`, `RAIN_N` | Precipitation counts |
| `flowSpd = smooth(0.02,0.08,p)*(1+1.5*smooth(0.35,0.95,p))` | Flow start ramp × intensification (max ≈ 2.5×) |
| `if(p<0.26 && fp.u>0.53)` | When the collided masses release upward |
| `onP` per flake/drop | Timeline fraction when that piece of precipitation turns on |
| `COMMA_BODY` | The comma-cloud SVG path (64×64 box; dry slot + eye applied via `#nfCommaMask`) |

## Content & legend decisions (client-driven)

These came from DESE feedback (May 26, 2026 MassSims design meeting) and subsequent reviews — don't revert them casually:

- Terminology is **"more dense / less dense"**, not "warm/cold" (assessment-developer review of terminology still pending)
- Time is fixed to **March 2018 (Nor'easter Riley)** — the Season dropdown was deliberately removed
- The storm icon is a **comma cloud** (nor'easters form comma clouds, not hurricane spirals)
- Cross-section is intentionally minimal: no flow arrows, no front line, no rotation marker (all removed as distracting); the story is told by the particles, cloud, precipitation, and the red "L" badge
- Map legend tracks the Map overlay dropdown (SST scale ↔ ocean currents) and explains the dashed Gulf Stream flow line
- Gulf Stream flow line is white-on-dark-outline for contrast against the red current band
- Snow falls over the cold/land side; rain over the warm/ocean side

## Accessibility

- All controls are native `<button>`/`<select>` elements with visible `#005FCC` focus outlines
- A visually-hidden `aria-live` region narrates the three stages as they occur (including the warm-rise-cool-condense story)
- Color is never the only channel: density labels, the legend's shape-coded keys, text halos (`paint-order: stroke`) over the busy satellite image
- `prefers-reduced-motion` disables jitter, flow advancement, dash motion, and falling precipitation (state changes still fade with the timeline)
- The basemap has descriptive alt text; the About panel documents the model, NGSS alignment (MS-ESS2-5, MS-ESS2-6, MS-ESS3-2), and image credit, and is itself fully keyboard-operable (toggle, Esc-to-close with focus return, focusable scroll region, Alt+Arrow repositioning)

## Known gaps / next steps

- The NASA basemap is from May 2000 (nearly cloud-free, classic teaching image) — not March, and Massachusetts is partly cloud-covered at the top edge. A March, MA-framed SST image would be ideal if one with similar quality can be found
- Map annotation geography is approximate (see georeferencing note above)
- Assessment-developer review of particle terminology was pending as of late May 2026
- The harness's Standalone and AP 2-Column layouts have not been built — only AP Full Width
- No student-facing question integration yet (Part 2B-style questions live in the Activity Player layer, intentionally out of scope for this prototype)
