/* Regenerates assets/shapes/*.svg from js/shapes.js. Run: node tools/gen-assets.js */
const fs = require("fs");
const path = require("path");
const S = require("../js/shapes.js");

const SIZE = S.asset.size;            // 24 x 24 artboard
const R = S.asset.referenceRadius;    // 8  -> reference circle diameter 16
const C = SIZE / 2;
const FILL = "#E6805B";               // CODAP defaultPointColor
const STROKE = "#FFFFFF";             // CODAP defaultStrokeColor
const outDir = path.join(__dirname, "..", "assets", "shapes");
fs.mkdirSync(outDir, { recursive: true });

const rows = [];
S.order.forEach(id => {
  const def = S.defs[id];
  const e = def.extent(R);
  const d = S.pathAbs(id, R, C, C);
  fs.writeFileSync(path.join(outDir, `point-${id}.svg`),
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-labelledby="title-${id}">
  <title id="title-${id}">${def.label}</title>
  <path d="${d}" fill="${FILL}" stroke="${STROKE}" stroke-width="1" stroke-linejoin="round"/>
</svg>
`);
  rows.push({ id, label: def.label, area: def.area(R), pct: 100 * def.area(R) / (Math.PI * R * R), w: e.w, h: e.h });
});

// One sprite sheet in absolute coordinates (no transforms) for a single import.
const sprite =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE * S.order.length} ${SIZE}" width="${SIZE * S.order.length}" height="${SIZE}">
${S.order.map((id, i) =>
  `  <path id="point-${id}" d="${S.pathAbs(id, R, i * SIZE + C, C)}" fill="${FILL}" stroke="${STROKE}" stroke-width="1" stroke-linejoin="round"/>`
).join("\n")}
</svg>
`;
fs.writeFileSync(path.join(outDir, "point-shapes-sprite.svg"), sprite);

// Machine-readable metrics, quoted by ASSET-SPEC.md
fs.writeFileSync(path.join(outDir, "shape-metrics.json"), JSON.stringify({
  artboard: SIZE, referenceRadius: R, safeBox: S.asset.safeBox,
  constants: S.constants,
  shapes: rows.map(r => ({ id: r.id, label: r.label, area: +r.area.toFixed(2),
    percentOfCircleArea: +r.pct.toFixed(1), width: +r.w.toFixed(2), height: +r.h.toFixed(2) }))
}, null, 2) + "\n");

console.log("shape".padEnd(10), "area".padStart(7), "vs circle".padStart(10), "extent @ r=8".padStart(16));
rows.forEach(r => console.log(r.id.padEnd(10), r.area.toFixed(1).padStart(7), (r.pct.toFixed(0) + "%").padStart(10),
  (r.w.toFixed(2) + " x " + r.h.toFixed(2)).padStart(16)));
