# Seismic Explorer Demo — Design Spec

A standalone HTML page for exploring a year of generated seismic data with smooth multi-resolution zoom.

## Goals

- Experience what it's like to explore a year of seismic data on a single zoomable graph
- No real data download — all data is procedurally generated
- Memory-efficient tiled generation: only visible data is generated, coarser at wide zoom
- Top-down hierarchical consistency: zooming in never contradicts what was shown zoomed out

## Tech Stack

- Single `index.html` file (HTML + CSS + JS)
- uPlot (CDN) for charting — fast time-series rendering with native pan/zoom
- No other dependencies

## Data Model — Three Zoom Levels

| Level | Resolution | Tile size | Points/tile | Tiles/year | Format |
|-------|-----------|-----------|-------------|------------|--------|
| L0 | min/max per 10 min | 1 day | 288 (144 pairs) | 365 | Float32Array |
| L1 | min/max per 10 sec | 1 hour | 720 (360 pairs) | 8,760 | Float32Array |
| L2 | 100 samples/sec | 1 minute | 6,000 | 525,600 | Float32Array |

### Tile Cache

`Map<string, Float32Array>` keyed by `"L{level}-{tileIndex}"`. No eviction policy.

### Zoom Level Transitions

Pick the finest level whose total point count for the visible range stays at or below ~4,000 points. Concretely:

- **L2** (raw): visible range < ~40 seconds (4,000 samples at 100Hz)
- **L1** (mid envelope): visible range < ~11 hours (4,000 / 360 pairs per hour ≈ 11 tiles)
- **L0** (coarse envelope): everything wider

This keeps rendered point counts in a performant range at every zoom level with no large jumps at transitions.

## Data Generation

### Seeded RNG

FNV-1a string hash + mulberry32 PRNG. Each tile gets a deterministic seed from `"L{level}-{index}"`. Regenerating a tile always produces identical data.

### Seismic Event Schedule

Generated once from a master seed:
- ~50–100 events across the year
- Each event: timestamp, magnitude, duration
- Used by all levels to ensure events appear consistently

### L0 Generation (coarse — year overview)

All 365 tiles generated synchronously on page load. For each 10-minute window:
- **Baseline**: Diurnal noise pattern (higher during daytime) with seasonal variation
- **Events**: Sharp attack + exponential decay envelope, scaled by magnitude
- **Symmetry**: min = -envelope, max = +envelope

### L1 Generation (mid — hours)

On demand. Generation is recursive: generating an L1 tile first ensures its parent L0 tile exists. For each 10-second window within an hour tile:
- Look up parent L0 envelope bounds for the enclosing 10-min window
- Linear interpolation between adjacent L0 windows for smooth transitions at 10-min boundaries
- Generate finer variation (30%–100% of parent envelope) within those bounds

### L2 Generation (raw — seconds)

On demand. Generation is recursive: generating an L2 tile first ensures its parent L1 tile exists. For each sample at 100Hz within a minute tile:
- Look up parent L1 envelope bounds for the enclosing 10-sec window, with linear interpolation across boundaries
- Sum of 8 random-frequency sinusoids (1–10 Hz) for band-limited noise, plus high-frequency jitter
- Use parent envelope as amplitude modulator
- Waveform details are at implementer's discretion — the constraint is visual plausibility, not geophysical accuracy

### Key Principle

Generation flows top-down. Coarser levels define the envelope; finer levels fill in consistent detail. We never summarize finer data upward.

## Rendering

### Visual Style

- Dark background (#1a1a2e)
- Bright trace color (green, rgba(0,255,136))
- Subtle grid lines

### Chart Rendering

- **L0/L1 (envelope)**: uPlot band/fill series showing min-max region
- **L2 (raw)**: Standard line series
- **Mode transition**: uPlot instance is destroyed and recreated when crossing the L2 boundary, because uPlot does not support dynamic series config changes (band vs line). This is fast (<10ms) and imperceptible.
- **Throttling**: Data updates are throttled via `requestAnimationFrame` to avoid excessive redraws during rapid pan/zoom.

### Y-Axis

Fixed range: -0.5 to 0.5. No auto-scaling — this keeps the view stable and avoids disorientation when panning between quiet and active regions.

### Layout

- Full-width chart, most of viewport
- Toolbar above: zoom out (−), zoom in (+), zoom level indicator, current visible time range label
- Time axis: Jan 1 – Dec 31, 2025 (UTC, no DST) when fully zoomed out

## Interaction

### Pan & Zoom

- **Mouse wheel**: Zoom time axis centered on cursor position. Custom handler (not uPlot native). Speed: 2% per scroll tick for fine control.
- **Click-drag**: Pan horizontally. Custom handler (uPlot's native drag is select-to-zoom, which we disable).
- **Zoom in button (+)**: 2x narrower range, centered on midpoint
- **Zoom out button (−)**: 2x wider range, centered on midpoint
- **Keyboard**: +/= to zoom in, - to zoom out
- **Clamped to year boundaries** (cannot pan beyond Jan 1 – Dec 31)
- **Zoom-in limit**: Defined by screen resolution — 20 pixels per 10ms of real time. On a 1200px chart, minimum visible range is ~0.6 seconds.

### Data Loading Flow

1. `setScale` hook fires on viewport change
2. `requestAnimationFrame` throttle coalesces rapid updates
3. Read new visible time range
4. Determine appropriate zoom level from range duration
5. Determine rendering mode (band for L0/L1, line for L2)
6. Compute needed tiles for visible range
7. Generate any uncached tiles (recursive: ensures parent tiles exist)
8. Assemble visible data array
9. If mode changed: recreate uPlot instance with new series config; otherwise: update data in place
