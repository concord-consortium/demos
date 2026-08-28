# CODAP — Data Point Shape (UX prototype)

An interactive prototype of a new **Point Shape** control for the CODAP graph
inspector, together with a proposed reorganization of the **Format** menu and
per-category formatting when the graph has a legend.

It opens on the structure agreed with Kirk and Kate on 25 Aug. The Google
Sheets model from the design notes is also built, one click away under
*Format menu → Series selector*, as a reference for the comparison — not as an
alternative proposal.

It exists so the project lead and the developer can *use* the proposed
interaction before any of it is built in CODAP.

> This is a UX prototype. It is not CODAP, it does not talk to CODAP, and no
> code here is meant to ship.

## Running it

It is static — no build step, no dependencies.

```bash
# from this folder
python3 -m http.server 8000
# then open http://localhost:8000/
```

Opening `index.html` straight off disk works too.

Deployed from the [demos repo](https://github.com/concord-consortium/demos)
convention (one branch per demo, `index.html` at the root):

```
https://models-resources.concord.org/demos/branch/codap-data-point-shapes/
```

### Putting it in the demos repo

The demos repo deploys one branch per demo, `index.html` at the branch root, no
build step — which is exactly the shape of this folder.

```bash
git clone https://github.com/concord-consortium/demos.git
cd demos
git checkout -b codap-data-point-shapes
cp -R /path/to/codap-data-point-shapes/. .    # keeps .github/workflows/ci.yml from main
git add -A && git commit -m "CODAP data point shape UX prototype"
git push -u origin codap-data-point-shapes
```

The prototype bar has a **View** switch: *Prototype* and *Shape geometry* —
the latter renders every shape at every CODAP point radius, with border
behavior, dark-background and metrics. Worth looking at before arguing about
legibility.

## What to try

The dark bar at the top is prototype scaffolding, not proposed UI. It switches:

* **Format menu** — *Per-category rows* (the proposal, and where it opens) or
  *Series selector* (the Sheets comparison, reference only)
* **View** — the prototype, or the shape geometry sheet

**Docs**, top right, opens the read me, the design findings, the asset spec and
the seven SVG assets with their source. They are embedded in the page, so they
travel with a shared link — Kirk does not need the repo or the zip to read them.
Edit the `.md` files and re-run `node tools/gen-docs.js` to refresh them.
* **Legend** — a 3-category legend (`Habitat`) vs a single series
* **Legend keys** — CODAP's color squares vs keys that carry the shape
* **Menu width** — 216 px (Michael's Zeplin spec) vs 256 px (proposed 25 Aug)

Then work in the **Format** panel on the right of the graph tile. Everything
redraws immediately. Click a point to select it (Shift-click to add) to see
the shapes under CODAP's selection styling.

### The proposal — per-category rows

The structure agreed on 25 Aug. Point size and border color stay global; each
legend category gets a row with a shape dropdown and a color dropdown side by
side, in a list that scrolls at 2.5 rows:

```
Data Points
  Point Size             [ ————O———— ]
  land                   [ ▲ ▾ ] [ ▨ ▾ ]
  water                  [ ◆ ▾ ] [ ▨ ▾ ]
  both                   [ ★ ▾ ] [ ▨ ▾ ]      ← scrolls
  Point Border Color     [ ▨ ▾ ]
  ☑ Border color same as fill
Graph
  Background Color       [ ▨ ▾ ]
  ☐ Transparent
```

The shape dropdown in these rows is **icon-only** — a text label squeezes the
category name to about 55 px, and "water" truncates. See `FINDINGS.md` §3.

### The reference — series selector

The Google Sheets model from the design notes: one set of controls plus a
*Series* dropdown at the top. Built and working, kept for the comparison, and
labeled as reference in the prototype because it is a larger change to build
and it has a scoping problem (`FINDINGS.md` §2):

```
Data Points
  Series                 [ Apply to all series ▾ ]
  Point Size             [ ————O———— ]
  Point Shape            [ ● Circle ▾ ]
  Point Fill Color       [ ▨ ▾ ]
  Point Border Color     [ ▨ ▾ ]
  ☑ Border color same as fill
Graph
  ...
```

## Sources used

| Source | Used for |
|---|---|
| Granola notes, *CODAP Data Point Icon Design*, 25 Aug 2026 | The proposed structure, the agreed shape set, filled Plus/X, 2.5-row scroll, 256 px width, "graph background color" relabel, point size and border color staying global |
| Google Doc, *Notes - CODAP Data Point Icon Design* | The series-selector reference, the idea of section headings, the control list, the shape list |
| Live document [`zHNMicIaW2qz9EryyQTB`](https://codap.concord.org/app/?v=3#shared=https%3A%2F%2Fcfm-shared.concord.org%2FzHNMicIaW2qz9EryyQTB%2Ffile.json) | Measured directly: palette 220 × 275, category list 200 × 75 (≈2 rows), tile 428 × 420, title bar 34, legend swatch 15 × 15, tick text 12 px sans-serif `#242424`, attribute labels 500 14 px Roboto `#222`, axis background `#f9f9f9`, zero line `#444` @ 0.8, the three legend colors |
| [concord-consortium/codap](https://github.com/concord-consortium/codap) `v3/src` | `components/vars.scss` (all tokens), `inspector-panel.scss` (panel, palette, slider, select, popover, checkbox), `component-title-bar.scss`, `codap-component.scss`, `graph/components/graph.scss`, `data-display/inspector/*` (the current Format panel), `common/color-picker-palette.tsx` (the 16 swatches), `utilities/color-utils.ts` (defaults, kelly colors), `data-display/data-display-utils.ts` (`computePointRadius`, point styling), `assets/icons/inspector-panel/*.svg` (the five toolbar icons, verbatim), `translation/lang/en-US.json5` (the shipped label strings) |
| [Zeplin, *CODAP v3 UI – Graph Tile – PART 1*](https://app.zeplin.io/project/5e4baae7fb685faac9bf4a0a/screen/68bb06fadbce4439b6cbcb60) | The Format Button Inspector Palette board: basic form and the two categorical-legend variants; **Total Width: 216** |

### Discrepancies found between sources

1. **Palette width.** Zeplin says total width **216 px**. The shipped CSS uses
   `min-width: 220px` and the live app renders **220 px**. The prototype offers
   both 216 and 256 rather than picking one silently.
2. **Category scroll window.** Zeplin's >2-category variant shows a clipped
   third row (the "2.5 items" Kate remembered). The implementation uses a fixed
   `height: 75px` against a 38 px row, which lands at **1.97 rows** — the third
   row is invisible, so the list does not look scrollable. The prototype
   measures the row and uses `2.5 × rowHeight`.
3. **Labels.** Shipped CODAP says *Point Size*, *Fill Color*, *Border Color*,
   *Background Color*. The design notes say *Point Fill Color*, *Point Border
   Color*, *Graph Background Color*. The prototype takes the design notes'
   *Point* prefixes — they earn their keep once shape and fill sit in the same
   row — but keeps *Background Color* as it ships, because the new **Graph**
   section heading already says which background it is (see `FINDINGS.md` §4).

## What's in here

```
index.html            the prototype (and the shape geometry sheet)
css/codap.css         styles transcribed from the CODAP v3 source
css/prototype.css     harness chrome (the dark bar) — not proposed UI
js/shapes.js          THE shape geometry; one source for points, menu, assets
js/data.js            40-case Mammals-shaped sample dataset
js/state.js           session-only formatting state
js/graph.js           SVG scatter plot + legend
js/palette.js         the Format palette: the proposal, and the reference
js/geometry.js        the shape geometry sheet view
js/docs.js            the Docs panel and its markdown renderer
js/docs-content.js    GENERATED - the .md files and .svg assets, inlined
js/icons.js           inspector icons, verbatim from the CODAP repo
js/app.js             wiring
assets/shapes/        the seven SVGs + sprite + metrics JSON
tools/gen-assets.js   regenerates assets/shapes from js/shapes.js
tools/gen-docs.js     regenerates js/docs-content.js from the .md and .svg files
tools/bundle.js       builds dist/ single-file versions (runs gen-docs first)
ASSET-SPEC.md         dimensions, sizing rule, fill/stroke, Sketch/Zeplin notes
FINDINGS.md           design issues, decisions, open questions
```

## Limitations

* Session-only. No CODAP document model, no serialization, no undo/redo, no
  plugin API, no persistence across reload.
* Only the **Format** inspector button opens anything. Rescale / View /
  Measure / Image are chrome.
* One plot type (scatter with a categorical legend, or single-series). No dot
  plots, no bar charts, no split panes, no numeric legends, no maps.
* Points are SVG, not PIXI/canvas. Fine for 40 points; CODAP's renderer would
  need shape support added to the point texture cache.
* Fused points and the fuse-to-bars animation are out of scope by agreement —
  `FINDINGS.md` records what they imply.
* The color picker's *more* button opens the browser's native color input
  rather than CODAP's expanded picker.

## Accessibility notes

Audited against WCAG 2.1 AA on 26 Aug with measured contrast ratios and
keyboard traversal, not by eye. What the prototype does:

* **Keyboard.** Every control is a real focusable element. Tab reaches every
  control in the Format panel; dropdowns open with Enter / Space / Down, move
  with Up, Down, Home, End, commit with Enter, close with Escape and return
  focus to their trigger. The open listbox reports the active option through
  `aria-activedescendant`. The Docs dialog contains focus and releases it on
  Escape.
* **Contrast.** All text passes AA against its real painted ground; the lowest
  is 4.82:1 on the prototype bar's unselected segment buttons. Graph tick and
  attribute labels are above 14:1. Control borders are above 3:1 for 1.4.11.
* **Focus.** Visible rings everywhere, using CODAP's `$focus-outline-color`
  (`#0957d0`) at its 2px offset.
* **Motion.** The menu fade is suppressed under `prefers-reduced-motion`.
* **Structure.** One `h1`, `header` / `main` / `footer` landmarks, `lang="en"`,
  labelled controls, and decorative SVG marked `aria-hidden`.
* **Targets.** Every interactive target is at least 26px tall. The legend key
  keeps CODAP's 15px swatch and gains its hit area from padding.

Known and deliberate, all inherited from CODAP rather than introduced here:

* **Plotted points are not keyboard reachable.** The graph is exposed as one
  labelled image with a summary. CODAP's own points are not keyboard navigable
  either, and changing that is well outside this ticket.
* **The color swatch button's border is 2.6:1 against its own fill**, below the
  3:1 in 1.4.11. That is CODAP's shipped `color-picker-thumb`. The disclosure
  caret next to it carries enough contrast to identify the control, so the
  practical impact is low, but it is worth a ticket of its own.
* **The layout does not reflow below about 900px.** The graph tile, inspector
  and palette are fixed-width, as they are in CODAP, which is a desktop
  application. 1.4.10 Reflow is not met at 400% zoom.

The reason the feature matters for accessibility: shape is a second visual
encoding alongside color, so a graph no longer has to depend on color alone to
separate categories. That argument only holds if the legend carries the shape
too, which is why the legend key style is a switch in the prototype and an open
question in `FINDINGS.md` §9 rather than an assumption. It also only holds at
sizes where the shapes are still distinguishable, which is §7.
