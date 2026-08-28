/*
 * state.js — client-side only. No persistence, no CODAP document model.
 *
 * Mirrors the shape of the real CODAP models so the mapping is obvious:
 *   pointSizeMultiplier / pointStrokeColor / pointStrokeSameAsFill
 *      -> DisplayItemDescriptionModel
 *   per-category fill
 *      -> dataConfiguration.setLegendColorForCategory()
 *   per-category shape (NEW)
 *      -> would need the same treatment as legend color: a per-category map
 *         on the data configuration, not a single value on the point description.
 */
(function (global) {
  "use strict";

  var D = global.CodapData;

  var listeners = [];

  var defaults = function () {
    return {
      /* --- prototype harness ------------------------------------------- */
      // "category" = the structure agreed 25 Aug (the proposal, and the default)
      // "series"   = the Google Sheets model from the design notes, kept as a
      //              reference to answer "what about the Sheets approach?"
      strategy: "category",
      hasLegend: true,
      paletteWidth: 256,         // 216 = Zeplin spec, 256 = agreed on 25 Aug
      palettePinned: true,
      legendKeys: "shapes",      // "squares" = CODAP today | "shapes" = proposed

      /* --- graph formatting -------------------------------------------- */
      pointSizeMultiplier: 1,    // DG.Inspector.pointSize, 0..2
      pointStrokeColor: "#ffffff",
      pointStrokeSameAsFill: true,
      plotBackgroundColor: "#ffffff",
      isTransparent: false,

      /* single-series (no legend) formatting */
      single: { shape: "circle", fill: "#e6805b" },

      /* per-legend-category formatting */
      categories: D.legend.categories.map(function (c) {
        return { name: c.name, shape: "circle", fill: c.fill };
      }),

      /* which series the Format panel is currently editing (Strategy A) */
      selectedSeries: "__all__",

      selection: {}              // caseId -> true
    };
  };

  var state = defaults();

  var Store = {
    get: function () { return state; },

    reset: function () {
      var keep = {
        strategy: state.strategy,
        hasLegend: state.hasLegend,
        paletteWidth: state.paletteWidth,
        palettePinned: state.palettePinned,
        legendKeys: state.legendKeys
      };
      state = Object.assign(defaults(), keep);
      Store.emit("reset");
    },

    subscribe: function (fn) { listeners.push(fn); },

    emit: function (reason) {
      listeners.forEach(function (fn) { fn(state, reason); });
    },

    /** Every series the Format panel can address, in legend order. */
    seriesList: function () {
      return state.hasLegend ? state.categories : [state.single];
    },

    seriesByName: function (name) {
      if (!state.hasLegend) return state.single;
      return state.categories.filter(function (c) { return c.name === name; })[0];
    },

    /** Formatting for one plotted case. */
    styleForCase: function (c) {
      var series = state.hasLegend ? Store.seriesByName(c[D.legend.key]) : state.single;
      var fill = series ? series.fill : "#e6805b";
      var shape = series ? series.shape : "circle";
      var selected = !!state.selection[c.id];
      return {
        shape: shape,
        fill: selected && !state.hasLegend ? "#4682b4" : fill,
        stroke: selected ? "#ff0000" : (state.pointStrokeSameAsFill ? fill : state.pointStrokeColor),
        strokeWidth: selected ? 2 : 1,
        strokeOpacity: selected ? 1 : 0.4,
        selected: selected
      };
    },

    /**
     * computePointRadius() from
     * v3/src/components/data-display/data-display-utils.ts
     */
    pointRadius: function (extra) {
      var n = D.cases.length, r = 10, i;
      for (i = 2; i <= n; i = i * 2) { --r; if (r <= 3) break; }
      return r * state.pointSizeMultiplier + (extra || 0);
    },

    /* --- writes ------------------------------------------------------- */

    /** Targets currently addressed by the Format panel. */
    targets: function () {
      if (!state.hasLegend) return [state.single];
      if (state.strategy === "category") return state.categories;   // rows write individually
      return state.selectedSeries === "__all__"
        ? state.categories
        : [Store.seriesByName(state.selectedSeries)].filter(Boolean);
    },

    setShape: function (shapeId, seriesName) {
      var list = seriesName ? [Store.seriesByName(seriesName)] : Store.targets();
      list.forEach(function (s) { if (s) s.shape = shapeId; });
      Store.emit("shape");
    },

    setFill: function (color, seriesName) {
      var list = seriesName ? [Store.seriesByName(seriesName)] : Store.targets();
      list.forEach(function (s) { if (s) s.fill = color; });
      Store.emit("fill");
    },

    set: function (key, value) {
      state[key] = value;
      Store.emit(key);
    },

    toggleSelection: function (caseId, additive) {
      if (!additive) {
        var wasOnly = state.selection[caseId] && Object.keys(state.selection).length === 1;
        state.selection = {};
        if (wasOnly) { Store.emit("selection"); return; }
      }
      if (state.selection[caseId]) delete state.selection[caseId];
      else state.selection[caseId] = true;
      Store.emit("selection");
    },

    /** Case ids belonging to one legend category. */
    casesForCategory: function (name) {
      return D.cases.filter(function (c) { return c[D.legend.key] === name; })
                    .map(function (c) { return c.id; });
    },

    allCasesForCategoryAreSelected: function (name) {
      var ids = Store.casesForCategory(name);
      return ids.length > 0 && ids.every(function (id) { return !!state.selection[id]; });
    },

    /**
     * The legend-key click, transcribed from
     * data-display/components/legend/categorical-legend.tsx:
     *   shift-click -> selectCases()      (adds to the selection)
     *   plain click -> setSelectedCases() (replaces the selection)
     * Note there is no toggle: clicking a key twice re-selects the same set.
     */
    selectCategory: function (name, extend) {
      var ids = Store.casesForCategory(name);
      if (!extend) state.selection = {};
      ids.forEach(function (id) { state.selection[id] = true; });
      Store.emit("selection");
    },

    clearSelection: function () {
      if (!Object.keys(state.selection).length) return;
      state.selection = {};
      Store.emit("selection");
    },

    /**
     * "Mixed" reporting for Strategy A. When the panel addresses more than one
     * series and they disagree, the control has to say so rather than lying
     * about one of them.
     */
    common: function (prop) {
      var list = Store.targets(), first;
      if (!list.length) return null;
      first = list[0][prop];
      for (var i = 1; i < list.length; i++) {
        if (list[i][prop] !== first) return null;   // null === mixed
      }
      return first;
    }
  };

  global.Store = Store;
})(typeof window !== "undefined" ? window : globalThis);
