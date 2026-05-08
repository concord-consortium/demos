# Storm Explorer

An interactive prototype built for the **APLUS project** team's review. Storm Explorer is designed for adult learners to explore how different storm characteristics — starting location, intensity, ocean temperatures, and atmospheric pressure — influence a hurricane's behavior, including its intensity, duration, and path.

**Live demo:** https://models-resources.concord.org/demos/branch/storm-explorer/

## Overview

Storm Explorer places learners in the role of a meteorologist working with a real-time map of the Atlantic basin. By adjusting the environmental conditions before a storm runs, learners develop intuitions about the physical forces that govern hurricane intensity and movement: sea surface temperatures, atmospheric pressure systems, wind patterns, and seasonal variation.

## How It Works

Students interact with two main areas: a **Storm Setup panel** for configuring initial conditions, and a **map** for positioning the storm and observing environmental context.

**Storm Setup (configure before running):**

1. **Storm Start Location** — Drag the hurricane marker to a starting position within the tropical Atlantic drop zone, or type a latitude and longitude directly into the coordinate fields (decimal degrees). The fields update when the storm is dragged, and the storm moves when coordinates are committed (Enter or blur). The prototype also reports the approximate named location (e.g., "near the Cape Verde Islands").
2. **Starting Category** — Use the color-coded slider to set the storm's initial intensity, from Tropical Storm (TS) through Category 5. The hurricane symbol on the map updates color in real time to match the Saffir-Simpson scale.
3. **Starting Season** — Choose Summer, Early Fall, or Late Fall. Season affects sea surface temperatures and wind shear across the basin. Late Fall generally provides the most energy for storm intensification.
4. **Sea Surface Temp Anomalies** — Independently adjust ocean temperatures (±5°F from baseline) across four regions: the Gulf of Mexico, Caribbean, Central Atlantic, and Coastal Africa. Warmer SSTs fuel stronger storms; cooler SSTs can weaken them.
5. **Pressure Systems** — Reposition the H (high) and L (low) pressure markers on the map and adjust their strength using vertical sliders. High pressure systems steer the storm's track; repositioning them changes the projected path.

**Map overlays (bottom control bar):**

- **Wind Direction and Speed** — Toggle animated wind field arrows showing upper-level flow across the basin.
- **Hurricane Image** — Toggle a satellite-style storm imagery overlay.
- **Temp** — Toggle a sea surface temperature overlay.
- **Playback controls** — Reload, Restart, and Start the simulation run.
- **Hurricane Scale** — A persistent legend showing the Saffir-Simpson categories (TS through Cat 5) with color-coded wind speed ranges.

## Key Design Decisions

- **Color-coded intensity:** The hurricane symbol uses the same color scale as the bottom-bar legend (gray → pale yellow → yellow → orange → dark orange → red), so students can visually connect the symbol's color to the category label at all times.
- **Dual-mode storm positioning:** Students can place the storm by dragging directly on the map or by typing decimal-degree coordinates into Lat/Lon fields. Both inputs stay in sync — dragging updates the fields, and committing a typed value moves the marker. Out-of-bounds coordinates are clamped to the drop zone.
- **Draggable pressure systems:** H and L markers can be repositioned freely on the map, giving students direct control over the steering environment without requiring numerical inputs. Markers are always visible on the map (dimmed when the Pressure Systems step is not active) so students maintain spatial context throughout setup.
- **Regional SST controls:** Rather than a single global temperature slider, four independent regional controls let students explore how localized warm or cool patches affect a storm differently depending on its path.
- **Season as a shortcut:** The season selector encodes a realistic combination of SST and wind shear conditions, letting students quickly compare early- vs. late-season storm environments without manually adjusting every variable.
- **Panel-pushes-map layout:** Opening the Storm Setup panel shifts the map to the right rather than overlaying it, keeping the full map always visible alongside the configuration controls.

## Technical Details

The prototype now uses a **two-file structure**: `index.html` plus an `assets/` folder containing all SVG icons. Both must be deployed together. The HTML references assets by relative path (e.g., `assets/drag.svg`), so the folder structure must be preserved on the server.

All logic is client-side with no server communication. The `storm-explorer-prototype.html` file is the canonical working copy; `index.html` is kept in sync for deployment.

### Asset inventory (`assets/`)

| File | Used for |
|------|----------|
| `cc-logo-small.svg` | Concord Consortium logo in the bottom bar |
| `drag.svg` | 9-dot drag affordance on pressure markers and storm |
| `high.svg` | H pressure system symbol (blue) |
| `low.svg` | L pressure system symbol (red) |
| `hurricane.svg` | Hurricane symbol (full detailed version) |
| `reload.svg` | Reload playback button icon |
| `restart.svg` | Restart playback button icon |
| `start.svg` | Start playback button icon |
| `pause.svg` | Pause playback button icon (reserved) |
| `slider-vertical.svg` | Circular thumb for pressure-system vertical sliders |
| `thermometer.svg` | Temperature tab icon in bottom bar |
| `thermometer-hover.svg` | Temperature tab hover state (reserved) |
| `season.svg` | Starting Season section icon (Material Design sun/weather) |
| `sst-anomalies.svg` | Sea Surface Temp Anomalies section icon (thermometer) |
| `pressure.svg` | Pressure Systems section icon (bidirectional arrows) |

## Recent Updates

### Hurricane-model visual styling (May 2026)

A comprehensive visual refresh to align the prototype's look and feel with the Concord Consortium hurricane-model production app. Key changes for future developers:

- **Asset folder introduced** — SVG icons moved out of inline HTML and into `assets/`. All icons are referenced by relative path. The `assets/` folder must travel with `index.html` on any deployment.
- **Lato font** — Typography switched from Roboto Condensed to Lato (loaded via Google Fonts), matching the hurricane-model primary typeface.
- **Bottom bar widget groups** — Each control group now pops 11 px above the bar using the hurricane-model `widgetGroup` pattern: `height: 76px`, `margin-top: -11px`, `border-top-left-radius: 9px`, `border-top-right-radius: 9px`, 3-sided `#797979` border (no bottom border), `::before`/`::after` pseudo-elements covering the side borders with 66 px white blocks at the bar level.
- **Playback controls split into widget groups** — Reload + Restart share one widget group; Start has its own; Hurricane Scale occupies the remaining flex space in a third widget group.
- **Playback icon color** — Icons use CSS `filter: invert(1) brightness(0.475)` to render at `#797979`. Disabled state adds `opacity: 0.25` to the icon.
- **Panel header** — Background changed to `#ff9900`, text and gear icon fill to `#434343`.
- **Panel section icons** — Emoji placeholders replaced with inline SVGs. The Starting Category icon dynamically updates its fill color to match the currently selected Saffir-Simpson category. All icons use `#797979` fill; hovering the row adds a `box-shadow: 0 0 0 1.5px rgba(255,255,255,0.5)` outline ring around the icon.
- **Season selected color** — Active season button uses `#ff9900` fill (was `#434343`).
- **SST minus (−) button hover** — Blue hover effect (`#e8f0ff` background, `#2255cc` border/text) to indicate cooling intent, mirroring the existing red hover on `+` for warming.
- **H/L pressure letters** — Replaced inline text characters with `assets/high.svg` and `assets/low.svg` image tags. The JS pressure-slider handler now reads the icon type from the `alt` attribute of the `<img>` element rather than `textContent` of a `<span>`.

### Earlier updates

- **Lat/Lon coordinate entry** — Added Lat and Lon text inputs to the Storm Start Location step. Values display in decimal degrees (e.g., 15.00°N, -23.00°W). Typing and pressing Enter (or tabbing away) moves the storm; dragging the storm updates the fields. Invalid or out-of-range coordinates are clamped to the nearest valid drop zone position.
- **Pressure marker visibility** — H and L markers are now always visible on the map, not just during the Pressure Systems step. They dim to 18% opacity when another step is active, making it easy to see the pressure environment at a glance throughout setup.
- **Pressure slider fix** — The circular grab-handle overlay on pressure markers now sits behind the letter and strength slider in the z-order, so the vertical slider remains fully interactive in PS mode.

## Status

This is an interactive prototype intended for APLUS project team review and feedback. It is not a production release.

---

*A [Concord Consortium](https://concord.org) prototype.*
