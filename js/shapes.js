/*
 * shapes.js — CODAP data-point shape library (prototype)
 * ---------------------------------------------------------------------------
 * ONE source of geometry for every place a shape appears: the plotted points,
 * the Point Shape menu, the legend keys and the exported SVG assets.
 *
 * Geometry contract
 * -----------------
 * Every shape is expressed as a function of `r`, the CODAP point radius
 * (`computePointRadius()` in data-display-utils.ts: 10 - log2(nCases), clamped
 * to [3, 10], multiplied by the Point Size slider value 0..2).
 *
 * The circle is the reference and is UNCHANGED from today's CODAP: radius r.
 * Every other shape is normalized to ~0.90 x the circle's area. Straight-edged
 * and pointed shapes read heavier than a circle of identical area, so a small
 * negative correction is what makes them look like the same size point.
 *
 * All paths are centered on (0, 0) so a point is placed with a single translate.
 */
(function (global) {
  "use strict";

  var DEG = Math.PI / 180;

  function poly(pts) {
    return "M" + pts.map(function (p) {
      return round(p[0]) + "," + round(p[1]);
    }).join("L") + "Z";
  }

  function round(n) {
    return Math.round(n * 1000) / 1000;
  }

  // Cross/plus built from an arm half-width `a` and a half-length `L`.
  function crossPoints(a, L, rotationDeg) {
    var pts = [
      [-a, -L], [a, -L], [a, -a], [L, -a], [L, a], [a, a],
      [a, L], [-a, L], [-a, a], [-L, a], [-L, -a], [-a, -a]
    ];
    if (!rotationDeg) return pts;
    var c = Math.cos(rotationDeg * DEG), s = Math.sin(rotationDeg * DEG);
    return pts.map(function (p) {
      return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
    });
  }

  function starPoints(R, innerRatio) {
    var pts = [], i, ang, rad;
    for (i = 0; i < 10; i++) {
      ang = (-90 + i * 36) * DEG;
      rad = (i % 2 === 0) ? R : R * innerRatio;
      pts.push([Math.cos(ang) * rad, Math.sin(ang) * rad]);
    }
    return pts;
  }

  // --- tuned constants (multiples of r) -------------------------------------
  var K = {
    square:   1.700,  // side
    diamond:  1.200,  // half-diagonal
    triangle: 2.550,  // side of the equilateral triangle
    star:     1.420,  // outer radius
    starInner: 0.48,  // inner/outer ratio - chunkier than the golden 0.382 so
                      // the points survive at r = 3
    plusArm:  0.410,  // arm half-width
    plusLen:  1.080   // arm half-length
  };

  var DEFS = {
    circle: {
      id: "circle",
      label: "Circle",
      path: function (r) {
        var v = round(r);
        return "M" + -v + ",0A" + v + "," + v + " 0 1 0 " + v + ",0A" + v + "," + v + " 0 1 0 " + -v + ",0Z";
      },
      area: function (r) { return Math.PI * r * r; },
      extent: function (r) { return { w: 2 * r, h: 2 * r }; }
    },

    square: {
      id: "square",
      label: "Square",
      path: function (r) {
        var h = K.square * r / 2;
        return poly([[-h, -h], [h, -h], [h, h], [-h, h]]);
      },
      area: function (r) { return Math.pow(K.square * r, 2); },
      extent: function (r) { return { w: K.square * r, h: K.square * r }; }
    },

    triangle: {
      id: "triangle",
      label: "Triangle",
      path: function (r) {
        var s = K.triangle * r, h = s * Math.sqrt(3) / 2;
        // Bounding-box centered: predictable hit area, and the shape sits on the
        // same visual baseline as the square when the two are mixed.
        return poly([[0, -h / 2], [s / 2, h / 2], [-s / 2, h / 2]]);
      },
      area: function (r) { return Math.sqrt(3) / 4 * Math.pow(K.triangle * r, 2); },
      extent: function (r) {
        var s = K.triangle * r;
        return { w: s, h: s * Math.sqrt(3) / 2 };
      }
    },

    diamond: {
      id: "diamond",
      label: "Diamond",
      path: function (r) {
        var d = K.diamond * r;
        return poly([[0, -d], [d, 0], [0, d], [-d, 0]]);
      },
      area: function (r) { return 2 * Math.pow(K.diamond * r, 2); },
      extent: function (r) {
        var d = K.diamond * r;
        return { w: 2 * d, h: 2 * d };
      }
    },

    star: {
      id: "star",
      label: "Star",
      path: function (r) { return poly(starPoints(K.star * r, K.starInner)); },
      area: function (r) {
        var R = K.star * r;
        return 5 * K.starInner * R * R * Math.sin(36 * DEG);
      },
      extent: function (r) {
        var R = K.star * r;
        return { w: 2 * R * Math.sin(72 * DEG), h: R * (1 + Math.cos(36 * DEG)) };
      }
    },

    plus: {
      id: "plus",
      label: "Plus",
      path: function (r) { return poly(crossPoints(K.plusArm * r, K.plusLen * r, 0)); },
      area: function (r) {
        var a = K.plusArm * r, L = K.plusLen * r;
        return 8 * a * L - 4 * a * a;
      },
      extent: function (r) {
        var L = K.plusLen * r;
        return { w: 2 * L, h: 2 * L };
      }
    },

    x: {
      id: "x",
      label: "X",
      // Identical geometry to Plus, rotated 45 degrees. Same ink, same weight,
      // one set of numbers for the developer to maintain.
      path: function (r) { return poly(crossPoints(K.plusArm * r, K.plusLen * r, 45)); },
      area: function (r) { return DEFS.plus.area(r); },
      extent: function (r) {
        var a = K.plusArm * r, L = K.plusLen * r, e = (L + a) * Math.SQRT2 / 2;
        return { w: 2 * e, h: 2 * e };
      }
    }
  };

  var ORDER = ["circle", "square", "triangle", "diamond", "star", "plus", "x"];

  var Shapes = {
    order: ORDER,
    defs: DEFS,
    constants: K,
    /** Artboard used for the exported SVG assets. */
    asset: { size: 24, referenceRadius: 8, safeBox: 22 },
    get: function (id) { return DEFS[id] || DEFS.circle; },
    /**
     * The same geometry expressed in absolute artboard coordinates (no
     * transform), which is what a clean exported asset wants.
     */
    pathAbs: function (id, r, cx, cy) {
      if (id === "circle") {
        return "M" + round(cx - r) + "," + round(cy) +
          "a" + round(r) + "," + round(r) + " 0 1 0 " + round(2 * r) + ",0" +
          "a" + round(r) + "," + round(r) + " 0 1 0 " + round(-2 * r) + ",0Z";
      }
      return Shapes.path(id, r).replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, function (m, x, y) {
        return round(parseFloat(x) + cx) + "," + round(parseFloat(y) + cy);
      });
    },
    label: function (id) { return Shapes.get(id).label; },
    path: function (id, r) { return Shapes.get(id).path(r); },
    /** All shapes, in menu order. */
    list: function () { return ORDER.map(function (id) { return DEFS[id]; }); },
    /**
     * A stand-alone <svg> string for a shape, sized to the asset artboard.
     * Used by the Point Shape menu, the legend keys and the asset export so
     * there is literally one implementation of each icon.
     */
    svgMarkup: function (id, opts) {
      opts = opts || {};
      var size = opts.size || Shapes.asset.size;
      var r = opts.radius || Shapes.asset.referenceRadius;
      var c = size / 2;
      var fill = opts.fill || "currentColor";
      var stroke = opts.stroke || "none";
      var sw = opts.strokeWidth == null ? 0 : opts.strokeWidth;
      return '<svg class="shape-glyph" viewBox="0 0 ' + size + ' ' + size + '" width="' + size +
        '" height="' + size + '" aria-hidden="true" focusable="false">' +
        '<g transform="translate(' + c + ' ' + c + ')">' +
        '<path d="' + Shapes.path(id, r) + '" fill="' + fill + '" stroke="' + stroke +
        '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
        '</g></svg>';
    }
  };

  global.Shapes = Shapes;
  if (typeof module !== "undefined" && module.exports) module.exports = Shapes;
})(typeof window !== "undefined" ? window : globalThis);
