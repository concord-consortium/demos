# Point shape assets — specification

Seven data-point shapes for the CODAP graph, intended to be recreated in Sketch
and published through Zeplin for the developer to download.

Everything here is generated from one source, `js/shapes.js`, by
`node tools/gen-assets.js`. The plotted points in the prototype, the icons in
the Point Shape menu, the legend keys and the exported SVGs all use that same
geometry — there is no second implementation to drift.

---

## Files

| Asset name | File | Notes |
|---|---|---|
| Circle | `assets/shapes/point-circle.svg` | Reference shape; unchanged from today's CODAP |
| Square | `assets/shapes/point-square.svg` | |
| Triangle | `assets/shapes/point-triangle.svg` | Equilateral, bounding-box centered |
| Diamond | `assets/shapes/point-diamond.svg` | |
| Star | `assets/shapes/point-star.svg` | 5-pointed, inner/outer radius 0.48 |
| Plus | `assets/shapes/point-plus.svg` | Solid, thick — not an outline |
| X | `assets/shapes/point-x.svg` | Plus rotated 45°, identical geometry |
| — | `assets/shapes/point-shapes-sprite.svg` | All seven side by side, one import |
| — | `assets/shapes/shape-metrics.json` | The numbers below, machine-readable |

The **Shape geometry** view in `index.html` renders every shape at every CODAP point radius
(3–20) plus border and dark-background cases. Open it before deciding anything
about legibility.

---

## Artboard

| | |
|---|---|
| Artboard / viewBox | `0 0 24 24` — identical for all seven |
| Center | `(12, 12)` |
| Reference radius | **8** (the circle is 16 across) |
| Safe box | 22 × 22 (±11 from center). The largest shape, Star, is 21.61 wide, leaving ~1.2px for a centered 1px stroke |
| Padding | Whatever the safe box leaves; it is *not* uniform per shape, by design (see "Sizing rule") |
| Transforms | None. Every path is in absolute artboard coordinates |
| Raster content | None |
| Paths per asset | One |

## Sizing rule — the important part

CODAP sizes points by **radius**, not by bounding box:

```
computePointRadius(nCases, multiplier)
  = clamp(10 − floor(log2(nCases)), 3, 10) × pointSizeMultiplier   // multiplier 0…2
```

So the shapes are defined as **functions of that radius `r`**, not as fixed
artboards, and the artboard above is simply those functions evaluated at
`r = 8`.

The circle stays exactly `r` — existing documents must not change. Every other
shape is normalized to **≈ 90 % of the circle's area**. Equal area is not the
right target: straight edges and points read heavier than a circle of identical
ink, so a small negative correction is what makes a triangle look like the same
size point as a circle. The bounding boxes therefore differ between shapes, and
that is intentional.

| Shape | Geometry, in multiples of `r` | Area @ r=8 | vs circle | Extent @ r=8 |
|---|---|---|---|---|
| Circle | radius `1.000 r` | 201.1 | 100 % | 16.00 × 16.00 |
| Square | side `1.700 r` | 185.0 | 92 % | 13.60 × 13.60 |
| Triangle | equilateral, side `2.550 r` (height `2.208 r`) | 180.2 | 90 % | 20.40 × 17.67 |
| Diamond | half-diagonal `1.200 r` | 184.3 | 92 % | 19.20 × 19.20 |
| Star | outer radius `1.420 r`, inner `0.48 ×` outer | 182.0 | 91 % | 21.61 × 20.55 |
| Plus | arm half-width `0.410 r`, half-length `1.080 r` | 183.7 | 91 % | 17.28 × 17.28 |
| X | Plus rotated 45° | 183.7 | 91 % | 16.86 × 16.86 |

To scale an asset to a CODAP radius `r`, multiply the artboard by `r / 8`.

## Fill and stroke behavior

All seven are **filled shapes with a single closed outline**, so the existing
point styling maps onto them unchanged:

| Property | Value in CODAP today | Applies to the new shapes |
|---|---|---|
| `fill` | point fill color (per case, from the legend) | yes, unchanged |
| `stroke` | `pointStrokeColor`, or the fill when *Border color same as fill* | yes, unchanged |
| `stroke-width` | `1` | yes |
| `stroke-opacity` | `0.4` | yes |
| selected | stroke `#ff0000`, width `2`, opacity `1`, radius `+1` | yes |
| `stroke-linejoin` | n/a for a circle | **`round`** — required, see below |

Two things a developer needs to know:

1. **`stroke-linejoin: round` is not optional.** With the default `miter`, the
   36° points of the Star and the 45° corners of the X grow long spikes at
   small radii. Rounding the joins is what keeps them stable from r=3 to r=20.
2. **Plus and X have a much longer perimeter than a circle of the same area**
   (roughly 2.4×). At a 1px, 40 %-opacity border this does not matter. With a
   contrasting border color at 2px — which is what CODAP uses for a *selected*
   point — the interior of a Plus almost disappears. See "Open questions" in
   `FINDINGS.md`; the prototype ships the uniform behavior and flags it rather
   than silently special-casing those two.

They are deliberately **solid, thick shapes rather than line symbols**, per the
25 Aug decision: keeping every shape filled means the Point Shape menu does not
have to split into "filled" and "line" sections, and it means fill color,
border color and *Border color same as fill* behave identically for all seven.

## Export

| | |
|---|---|
| Recommended format | SVG (as supplied). PDF is a fine second export from Sketch |
| Color in the supplied files | fill `#E6805B` (CODAP `defaultPointColor`), stroke `#FFFFFF` (`defaultStrokeColor`) — placeholders; both are set at runtime |
| PNG, if needed | export at 1× 24 px, 2× 48 px, 3× 72 px, but SVG is strongly preferred because point radius is continuous |
| Naming in Sketch / Zeplin | `point-shape/circle`, `point-shape/square`, … so they group into one Zeplin folder |

## Rebuilding in Sketch

1. One 24 × 24 artboard per shape, art centered on (12, 12).
2. Paste the `d` attribute from each SVG, or place the SVG and release it — the
   paths are plain absolute-coordinate polygons (the circle is one arc pair).
3. Do not "optimize" by snapping vertices to the pixel grid. The half-pixel
   coordinates carry the area normalization; snapping them changes the relative
   visual weight of the set.
4. Keep fill and stroke as separate, overridable properties on the single path.
   Kirk needs to drive interior and border independently.
5. If a shape is edited, edit `js/shapes.js` too and re-run
   `node tools/gen-assets.js` so the prototype, the menu icons and the assets
   stay identical.
