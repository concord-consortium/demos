# Wildfire Explorer — Textured Terrain

Deployed build of an exploration that renders the Wildfire Explorer terrain with
abstract map-symbol textures instead of flat per-cell color, based on the Concord
Consortium `wildfire-model` app.

**Live demo:** https://models-resources.concord.org/demos/branch/wildfire-explorer-textured-terrain/

## What to look at

Each vegetation type gets a glyph — a tuft for grass, a lobed clump for shrub, a
conifer for forest, and the conifer overprinted with diagonal hatching for
forest-with-suppression. The glyphs are grayscale luminance maps; their color is
derived per-fragment from the terrain color itself, so each drought level gets
glyphs in its own color family at a target contrast ratio.

Burnt ground re-uses the same tiles rather than separate artwork, so a burnt cell
keeps the glyph of whatever grew there — burnt grass still reads as grass — and
only the color changes. The burn perimeter is thresholded against noise, which
turns the simulation's one-value-per-500ft-cell fire state into a ragged edge
instead of a soft gradient ring.

Two controls sit in the bottom-left corner:

- **Texture size** scales how much ground one tile covers, i.e. how large the
  glyphs render.
- **Stroke width** re-rasterizes the artwork at a different line weight. This is
  separate from texture size because the stroke is baked into the tile bitmap —
  shrinking a tile shrinks its strokes too, so the two are compensated
  independently.

## Notes

- This build defaults `texturedTerrain` to **on**, which is the point of the
  demo. Append `?texturedTerrain=false` to see the stock untextured terrain for
  comparison — the two are byte-identical to the unmodified app when the flag is
  off. In the source repo the flag defaults to off.
- The grass and shrub tiles are hand-drawn; forest and forest-with-suppression
  are generated. All four live as plain SVGs under `terrain-textures/` and are
  fetched at runtime, so they can be swapped without a rebuild.

This branch holds the compiled output only. Source lives in the `terrain-textures`
branch of a local `wildfire-model` working copy. To update: rebuild
(`npm run build`) and copy the `dist/` contents here, then push — CI deploys
automatically via `.github/workflows/ci.yml`.
