# Storm Explorer

An interactive prototype built for the **APLUS project** team's review. Storm Explorer is designed for adult learners to explore how different storm characteristics — starting location, intensity, ocean temperatures, and atmospheric pressure — influence a hurricane's behavior, including its intensity, duration, and path.

**Live demo:** https://models-resources.concord.org/demos/branch/storm-explorer/

## Overview

Storm Explorer places learners in the role of a meteorologist working with a real-time map of the Atlantic basin. By adjusting the environmental conditions before a storm runs, learners develop intuitions about the physical forces that govern hurricane intensity and movement: sea surface temperatures, atmospheric pressure systems, wind patterns, and seasonal variation.

## How It Works

Students interact with two main areas: a **Storm Setup panel** for configuring initial conditions, and a **map** for positioning the storm and observing environmental context.

**Storm Setup (configure before running):**

1. **Storm Start Location** — Drag the hurricane marker to a starting position within the tropical Atlantic drop zone. The prototype reports the approximate starting location (e.g., "near the Cape Verde Islands").
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
- **Draggable pressure systems:** H and L markers can be repositioned freely on the map, giving students direct control over the steering environment without requiring numerical inputs.
- **Regional SST controls:** Rather than a single global temperature slider, four independent regional controls let students explore how localized warm or cool patches affect a storm differently depending on its path.
- **Season as a shortcut:** The season selector encodes a realistic combination of SST and wind shear conditions, letting students quickly compare early- vs. late-season storm environments without manually adjusting every variable.
- **Panel-pushes-map layout:** Opening the Storm Setup panel shifts the map to the right rather than overlaying it, keeping the full map always visible alongside the configuration controls.

## Technical Details

The prototype is a single self-contained HTML file with no external dependencies — all CSS, SVG assets, and JavaScript are inline. It runs entirely client-side with no server communication. Icons use SVGs from the Concord Consortium design system.

## Status

This is an interactive prototype intended for APLUS project team review and feedback. It is not a production release.

---

*A [Concord Consortium](https://concord.org) prototype.*
