/*
 * graph.js — a CODAP-looking scatter plot rendered as SVG.
 *
 * SVG rather than PIXI/canvas so that the exact same path geometry from
 * shapes.js is used for the plotted points, the Point Shape menu and the
 * legend keys. Metrics were read off the live CODAP document:
 *   tick labels        12px sans-serif  #242424
 *   attribute labels   500 14px Roboto  #222222
 *   axis lines / ticks #d3d3d3
 *   zero line          #444444 @ 0.8
 *   axis background    #f9f9f9
 *   legend key swatch  15 x 15
 */
(function (global) {
  "use strict";

  var D = global.CodapData, Store = global.Store, Shapes = global.Shapes;
  var NS = "http://www.w3.org/2000/svg";

  var M = { top: 10, right: 16, bottom: 48, left: 62 };

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name), k;
    for (k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function niceTicks(min, max, step) {
    var out = [], v = Math.ceil(min / step) * step;
    for (; v <= max + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
    return out;
  }

  var Graph = {
    mount: function (container, legendContainer) {
      this.container = container;
      this.legendContainer = legendContainer;
      this.render();
      Store.subscribe(function () { Graph.render(); });
    },

    render: function () {
      var s = Store.get();
      var box = this.container.getBoundingClientRect();
      var W = Math.round(box.width) || 480;
      var H = Math.round(box.height) || 330;
      var pw = W - M.left - M.right;
      var ph = H - M.top - M.bottom;

      this.container.innerHTML = "";
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H }, this.container);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label",
        D.y.name + " by " + D.x.name + " for " + D.cases.length + " mammals" +
        (s.hasLegend ? ", colored and shaped by " + D.legend.name : ""));

      el("rect", { class: "axis-background", x: 0, y: 0, width: W, height: H }, svg);

      // plot cell
      if (s.isTransparent) {
        var defs = el("defs", {}, svg);
        var pat = el("pattern", { id: "checker", width: 12, height: 12, patternUnits: "userSpaceOnUse" }, defs);
        el("rect", { width: 12, height: 12, fill: "#ffffff" }, pat);
        el("rect", { width: 6, height: 6, fill: "#e4e4e4" }, pat);
        el("rect", { x: 6, y: 6, width: 6, height: 6, fill: "#e4e4e4" }, pat);
        el("rect", { class: "plot-cell-background", x: M.left, y: M.top, width: pw, height: ph,
          fill: "url(#checker)" }, svg);
      } else {
        el("rect", { class: "plot-cell-background", x: M.left, y: M.top, width: pw, height: ph,
          fill: s.plotBackgroundColor }, svg);
      }

      var xs = function (v) { return M.left + (v - D.x.min) / (D.x.max - D.x.min) * pw; };
      var ys = function (v) { return M.top + ph - (v - D.y.min) / (D.y.max - D.y.min) * ph; };

      // --- gridlines
      // .grid .tick line { stroke: lightgrey; stroke-opacity: 0.7 } in graph.scss.
      // CODAP shows these by default; one per tick on both axes.
      var grid = el("g", { class: "grid" }, svg);
      niceTicks(D.x.min, D.x.max, D.x.tick).forEach(function (v) {
        var g = el("g", { class: "tick" }, grid);
        el("line", { x1: xs(v), y1: M.top, x2: xs(v), y2: M.top + ph }, g);
      });
      niceTicks(D.y.min, D.y.max, D.y.tick).forEach(function (v) {
        var g = el("g", { class: "tick" }, grid);
        el("line", { x1: M.left, y1: ys(v), x2: M.left + pw, y2: ys(v) }, g);
      });

      // --- bottom axis
      var bottom = el("g", { class: "axis" }, svg);
      el("line", { class: "axis-line", x1: M.left, y1: M.top + ph, x2: M.left + pw, y2: M.top + ph }, bottom);
      niceTicks(D.x.min, D.x.max, D.x.tick).forEach(function (v) {
        var x = xs(v);
        el("line", { x1: x, y1: M.top + ph, x2: x, y2: M.top + ph + 4 }, bottom);
        var t = el("text", { x: x, y: M.top + ph + 17, "text-anchor": "middle" }, bottom);
        t.textContent = String(v);
      });

      // --- left axis
      var left = el("g", { class: "axis" }, svg);
      el("line", { class: "axis-line", x1: M.left, y1: M.top, x2: M.left, y2: M.top + ph }, left);
      niceTicks(D.y.min, D.y.max, D.y.tick).forEach(function (v) {
        var y = ys(v);
        el("line", { x1: M.left - 4, y1: y, x2: M.left, y2: y }, left);
        var t = el("text", { x: M.left - 7, y: y + 4, "text-anchor": "end" }, left);
        t.textContent = String(v);
      });

      // --- zero lines
      var zero = el("g", { class: "zero" }, svg);
      if (D.y.min < 0 && D.y.max > 0) {
        el("line", { class: "tick-line", x1: M.left, y1: ys(0), x2: M.left + pw, y2: ys(0) }, zero);
      }
      if (D.x.min < 0 && D.x.max > 0) {
        el("line", { class: "tick-line", x1: xs(0), y1: M.top, x2: xs(0), y2: M.top + ph }, zero);
      }

      // --- attribute labels
      var xl = el("text", { class: "attribute-label", x: M.left + pw / 2, y: H - 8,
        "text-anchor": "middle" }, svg);
      xl.textContent = D.x.name + " (" + D.x.units + ")  \u25be";
      var yl = el("text", { class: "attribute-label", x: 14, y: M.top + ph / 2,
        "text-anchor": "middle", transform: "rotate(-90 14 " + (M.top + ph / 2) + ")" }, svg);
      yl.textContent = D.y.name + " (" + D.y.units + ")";

      // --- points
      var r = Store.pointRadius();
      var layer = el("g", { class: "points" }, svg);
      // Unselected first, selected on top - CODAP raises selected points.
      var ordered = D.cases.slice().sort(function (a, b) {
        return (s.selection[a.id] ? 1 : 0) - (s.selection[b.id] ? 1 : 0);
      });
      ordered.forEach(function (c) {
        var st = Store.styleForCase(c);
        var rr = st.selected ? r + 1 : r;
        var g = el("g", {
          class: "data-point",
          transform: "translate(" + xs(c[D.x.key]).toFixed(2) + " " + ys(c[D.y.key]).toFixed(2) + ")",
          tabindex: "-1"
        }, layer);
        g.setAttribute("aria-label", c.name + ": " + c[D.x.key] + " " + D.x.units + ", " +
          c[D.y.key] + " " + D.y.units + (s.hasLegend ? ", " + c[D.legend.key] : "") +
          ", " + Shapes.label(st.shape));
        el("path", {
          d: Shapes.path(st.shape, rr),
          fill: st.fill,
          stroke: st.stroke,
          "stroke-width": st.strokeWidth,
          "stroke-opacity": st.strokeOpacity,
          "stroke-linejoin": "round"
        }, g);
        var title = el("title", {}, g);
        title.textContent = c.name;
        g.addEventListener("click", function (e) {
          e.stopPropagation();
          Store.toggleSelection(c.id, e.shiftKey);
        });
      });

      svg.addEventListener("click", function () { Store.clearSelection(); });

      this.renderLegend();
    },

    renderLegend: function () {
      var s = Store.get();
      var host = this.legendContainer;
      host.innerHTML = "";
      if (!s.hasLegend) {
        host.style.display = "none";
        return;
      }
      host.style.display = "";
      var title = document.createElement("div");
      title.className = "legend-title";
      title.innerHTML = D.legend.name + '<span class="caret" style="width:0;height:0;' +
        'border-left:4px solid transparent;border-right:4px solid transparent;"></span>';
      host.appendChild(title);

      var keys = document.createElement("div");
      keys.className = "legend-keys";
      s.categories.forEach(function (cat) {
        var selected = Store.allCasesForCategoryAreSelected(cat.name);

        // A real button: clicking a legend key selects that category's cases,
        // exactly as categorical-legend.tsx does today.
        var k = document.createElement("button");
        k.type = "button";
        k.className = "legend-key" + (selected ? " selected" : "");
        k.setAttribute("aria-pressed", String(selected));
        k.setAttribute("aria-label", "Select the " + cat.name + " cases");
        k.title = "Select the " + cat.name + " cases (Shift-click to add to the selection)";

        var sw = document.createElement("span");
        sw.className = "key-swatch";
        if (s.legendKeys === "shapes") {
          // Proposed: the key carries the shape as well as the color, so the
          // encoding survives for anyone who cannot separate the colors.
          sw.innerHTML = Shapes.svgMarkup(cat.shape, {
            size: 15, radius: 5.4,
            fill: cat.fill,
            stroke: s.pointStrokeSameAsFill ? cat.fill : s.pointStrokeColor,
            strokeWidth: 1
          });
        } else {
          // CODAP today: a 15 x 15 color square (keySize = 15).
          var box = document.createElement("span");
          box.className = "key-square";
          box.style.backgroundColor = cat.fill;
          sw.appendChild(box);
        }

        var label = document.createElement("span");
        label.textContent = cat.name;
        k.appendChild(sw);
        k.appendChild(label);
        k.addEventListener("click", function (e) {
          e.stopPropagation();
          Store.selectCategory(cat.name, e.shiftKey);
        });
        keys.appendChild(k);
      });
      host.appendChild(keys);
    }
  };

  global.Graph = Graph;
})(typeof window !== "undefined" ? window : globalThis);
