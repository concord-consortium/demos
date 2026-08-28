/*
 * palette.js — the Format inspector palette.
 *
 * Two structures are prototyped side by side because the meeting notes and the
 * design notes describe two different answers to "how do you format more than
 * one series?".  The reviewer switches between them from the prototype bar.
 *
 *   Per-category rows  (agreed 25 Aug with Kirk and Kate) - THE PROPOSAL
 *       point size + border color stay global; each legend category gets a
 *       row with a shape dropdown and a color dropdown side by side
 *   Series selector    (design notes, Google Sheets model) - REFERENCE ONLY
 *       one set of controls + a Series dropdown at the top. Kept so the
 *       Sheets comparison can be shown on demand; it is a larger change to
 *       build and it is not the recommendation.
 *
 * Everything below is plain DOM. Widgets are styled to match React Aria's
 * markup contract in CODAP (data-focused, aria-expanded, aria-selected) so the
 * CSS transcribed from inspector-panel.scss applies unchanged.
 */
(function (global) {
  "use strict";

  var Store = global.Store, Shapes = global.Shapes, D = global.CodapData;

  /* CODAP's 16 named palette colors (common/color-picker-palette.tsx) */
  var PALETTE = [
    ["#000000", "Black"], ["#a9a9a9", "Dark gray"], ["#d3d3d3", "Light gray"], ["#ffffff", "White"],
    ["#ad2323", "Red"], ["#ff9632", "Orange"], ["#ffee33", "Yellow"], ["#1d6914", "Green"],
    ["#2a4bd7", "Blue"], ["#814a19", "Brown"], ["#8126c0", "Purple"], ["#29d0d0", "Cyan"],
    ["#e9debb", "Cream"], ["#ffcdf3", "Pink"], ["#9dafff", "Light blue"], ["#81c57a", "Light green"]
  ];

  /* ------------------------------------------------------------- popovers  */
  /*
   * Popovers are portalled to a layer on <body> and positioned as
   * `position: fixed` from the trigger's rect.
   *
   * This is not decoration. The category list is a scroll container
   * (`overflow-y: auto` on .cat-color-setting) and the palette itself is a
   * bounded box, so a popover rendered as a child of a row is clipped by both:
   * open the shape menu on the "land" row and you see one and a half options.
   * CODAP has the same requirement and solves it the same way — React Aria
   * renders <Popover> into a portal outside the palette's DOM tree, which is
   * why inspector-panel.scss styles `.react-aria-Popover` at the top level
   * rather than nested under `.codap-inspector-palette`.
   */
  var openPopover = null;
  var portalLayer = null;
  var uid = 0;

  function layer() {
    if (!portalLayer) {
      portalLayer = document.createElement("div");
      portalLayer.className = "popover-layer";
      document.body.appendChild(portalLayer);
    }
    return portalLayer;
  }

  var GUTTER = 8, OFFSET = 4;

  function positionPopover(btn, pop, alignRight) {
    var r = btn.getBoundingClientRect();
    pop.style.maxHeight = "";
    var w = pop.offsetWidth, h = pop.offsetHeight;
    var vw = window.innerWidth, vh = window.innerHeight;

    var left = alignRight ? r.right - w : r.left;
    left = Math.max(GUTTER, Math.min(left, vw - w - GUTTER));

    var below = vh - r.bottom - OFFSET - GUTTER;
    var above = r.top - OFFSET - GUTTER;
    var top;
    if (h <= below || below >= above) {
      top = r.bottom + OFFSET;
      if (h > below) pop.style.maxHeight = below + "px";
    } else {
      if (h > above) { pop.style.maxHeight = above + "px"; h = above; }
      top = r.top - OFFSET - h;
    }
    pop.style.left = Math.round(left) + "px";
    pop.style.top = Math.round(Math.max(GUTTER, top)) + "px";
  }

  function showPopover(o) {
    closeOpenPopover();
    layer().appendChild(o.pop);
    o.pop.hidden = false;
    positionPopover(o.btn, o.pop, o.alignRight);
    o.btn.setAttribute("aria-expanded", "true");
    openPopover = o;
  }

  function closeOpenPopover() {
    if (!openPopover) return;
    var o = openPopover;
    openPopover = null;
    o.pop.hidden = true;
    o.pop.style.maxHeight = "";
    o.btn.setAttribute("aria-expanded", "false");
    if (o.root && o.pop.parentNode === portalLayer) o.root.appendChild(o.pop);
  }

  document.addEventListener("click", function (e) {
    if (!openPopover) return;
    if (openPopover.pop.contains(e.target) || openPopover.btn.contains(e.target)) return;
    closeOpenPopover();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openPopover) {
      var b = openPopover.btn;
      closeOpenPopover();
      b.focus();
    }
  });
  // Keep an open popover pinned to its trigger; close it if the trigger scrolls
  // away inside the category list, which is what CODAP's closeTrigger does.
  window.addEventListener("resize", function () {
    if (openPopover) positionPopover(openPopover.btn, openPopover.pop, openPopover.alignRight);
  });
  document.addEventListener("scroll", function (e) {
    if (!openPopover) return;
    var t = e.target;
    if (t && t.classList && t.classList.contains("cat-color-setting")) closeOpenPopover();
    else positionPopover(openPopover.btn, openPopover.pop, openPopover.alignRight);
  }, true);

  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------------------------------------------------------------- select */
  /**
   * @param opts.items  [{ value, label, glyph? }]
   * @param opts.value  current value, or null for "mixed"
   */
  function Select(opts) {
    var root = h("div", "pt-select" + (opts.className ? " " + opts.className : ""));
    var btn = h("button", null);
    btn.type = "button";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", opts.ariaLabel || opts.label || "");
    if (opts.fkey) btn.setAttribute("data-fkey", opts.fkey);
    var value = h("span", "select-value");
    var arrow = h("span", "select-arrow");
    btn.appendChild(value);
    btn.appendChild(arrow);

    var listId = "ptlist-" + (++uid);
    var pop = h("div", "pt-popover");
    pop.hidden = true;
    var list = h("ul", "pt-listbox");
    list.id = listId;
    list.setAttribute("role", "listbox");
    list.tabIndex = -1;
    list.setAttribute("aria-label", opts.ariaLabel || opts.label || "");
    pop.appendChild(list);

    function paint() {
      var item = opts.items.filter(function (i) { return i.value === opts.value; })[0];
      value.innerHTML = "";
      if (!item) {
        value.appendChild(h("span", null, opts.mixedLabel || "Mixed"));
        btn.setAttribute("aria-label", (opts.ariaLabel || "") + ": mixed across series");
      } else {
        if (item.glyph) {
          var g = h("span", "glyph");
          g.innerHTML = item.glyph;
          value.appendChild(g);
        }
        if (!opts.hideLabel) value.appendChild(h("span", null, item.label));
        btn.setAttribute("aria-label", (opts.ariaLabel || "") + ": " + item.label);
      }
    }

    opts.items.forEach(function (item, idx) {
      var li = h("li", null);
      li.id = listId + "-opt" + idx;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(item.value === opts.value));
      li.dataset.index = idx;
      if (item.glyph) {
        var g = h("span", "glyph");
        g.innerHTML = item.glyph;
        li.appendChild(g);
      }
      li.appendChild(h("span", null, item.label));
      li.addEventListener("click", function () {
        closeOpenPopover();
        btn.focus();
        opts.onChange(item.value);
      });
      list.appendChild(li);
    });

    var focusIdx = -1;
    function focusItem(i) {
      var lis = list.querySelectorAll("li");
      if (!lis.length) return;
      focusIdx = Math.max(0, Math.min(lis.length - 1, i));
      lis.forEach(function (n) { n.removeAttribute("data-focused"); });
      lis[focusIdx].setAttribute("data-focused", "true");
      // The list keeps DOM focus, so tell assistive tech which option is active.
      list.setAttribute("aria-activedescendant", lis[focusIdx].id);
      lis[focusIdx].scrollIntoView({ block: "nearest" });
    }

    function open() {
      pop.style.minWidth = root.getBoundingClientRect().width + "px";
      showPopover({ root: root, pop: pop, btn: btn, alignRight: !!opts.alignRight });
      var cur = opts.items.map(function (i) { return i.value; }).indexOf(opts.value);
      focusItem(cur < 0 ? 0 : cur);
      list.focus();
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (pop.hidden) open(); else closeOpenPopover();
    });
    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
    list.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); focusItem(focusIdx + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); focusItem(focusIdx - 1); }
      else if (e.key === "Home") { e.preventDefault(); focusItem(0); }
      else if (e.key === "End") { e.preventDefault(); focusItem(opts.items.length - 1); }
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        var item = opts.items[focusIdx];
        closeOpenPopover(); btn.focus();
        if (item) opts.onChange(item.value);
      }
    });

    paint();
    root.appendChild(btn);
    root.appendChild(pop);
    return root;
  }

  /* ----------------------------------------------------------- shape select */
  function shapeGlyph(id, fill, stroke) {
    return Shapes.svgMarkup(id, {
      size: 20, radius: 7,
      fill: fill || "#606060",
      stroke: stroke || "none",
      strokeWidth: stroke ? 1 : 0
    });
  }

  function ShapeSelect(opts) {
    return Select({
      className: "shape-select" + (opts.iconOnly ? " icon-only" : ""),
      hideLabel: !!opts.iconOnly,
      fkey: opts.fkey,
      ariaLabel: opts.ariaLabel || "Point shape",
      value: opts.value,
      mixedLabel: "Mixed",
      alignRight: opts.alignRight,
      items: Shapes.list().map(function (def) {
        return { value: def.id, label: def.label, glyph: shapeGlyph(def.id, opts.swatchColor) };
      }),
      onChange: opts.onChange
    });
  }

  /* ---------------------------------------------------------- color swatch */
  function ColorControl(opts) {
    var root = h("div", "pt-select color-control");
    var btn = h("button", "color-picker-thumb");
    btn.type = "button";
    if (opts.fkey) btn.setAttribute("data-fkey", opts.fkey);
    btn.setAttribute("aria-haspopup", "dialog");
    btn.setAttribute("aria-expanded", "false");
    var sw = h("div", "color-picker-thumb-swatch");
    btn.appendChild(sw);

    if (opts.value == null && opts.mixedColors) {
      sw.classList.add("mixed");
      sw.style.setProperty("--mix-a", opts.mixedColors[0] || "#ccc");
      sw.style.setProperty("--mix-b", opts.mixedColors[1] || "#999");
      sw.style.setProperty("--mix-c", opts.mixedColors[2] || "#666");
      btn.setAttribute("aria-label", opts.label + ": mixed across series");
    } else {
      sw.style.setProperty("--swatch-color", opts.value);
      btn.setAttribute("aria-label", opts.label + ": " + opts.value);
    }
    if (opts.disabled) { btn.disabled = true; }

    var pop = h("div", "pt-popover");
    pop.hidden = true;
    pop.style.padding = "0";
    var pal = h("div", "color-picker-palette");
    var grid = h("div", "color-swatch-grid");
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", "Color swatches");
    PALETTE.forEach(function (p) {
      var cell = h("button", "color-swatch-cell");
      cell.type = "button";
      cell.style.backgroundColor = p[0];
      cell.title = p[1];
      cell.setAttribute("aria-label", p[1]);
      cell.setAttribute("aria-pressed", String((opts.value || "").toLowerCase() === p[0]));
      cell.addEventListener("click", function (e) {
        e.stopPropagation();
        closeOpenPopover();
        btn.focus();
        opts.onChange(p[0]);
      });
      grid.appendChild(cell);
    });
    // 17th cell: whatever non-standard color is currently in use
    if (opts.value && !PALETTE.some(function (p) { return p[0] === opts.value.toLowerCase(); })) {
      var custom = h("button", "color-swatch-cell");
      custom.type = "button";
      custom.style.backgroundColor = opts.value;
      custom.setAttribute("aria-pressed", "true");
      custom.setAttribute("aria-label", "Current color " + opts.value);
      grid.appendChild(custom);
    }
    pal.appendChild(grid);

    var footer = h("div", "color-swatch-footer");
    var more = h("button", "color-picker-more-button", "more");
    more.type = "button";
    var native = document.createElement("input");
    native.type = "color";
    native.value = opts.value || "#e6805b";
    native.style.cssText = "position:absolute;opacity:0;width:0;height:0;";
    more.addEventListener("click", function (e) {
      e.stopPropagation();
      // The OS color panel streams input events while it is open; keep the
      // palette (and this input) alive until the user is done with it.
      var released = false;
      var release = function () {
        if (released) return;
        released = true;
        window.removeEventListener("focus", release);
        resumeRender();
      };
      suspendRender();
      window.addEventListener("focus", release);
      native.addEventListener("change", release, { once: true });
      native.click();
    });
    native.addEventListener("input", function () { opts.onChange(native.value); });
    footer.appendChild(more);
    footer.appendChild(native);
    pal.appendChild(footer);
    pop.appendChild(pal);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (pop.hidden) showPopover({ root: root, pop: pop, btn: btn, alignRight: !!opts.alignRight });
      else closeOpenPopover();
    });

    root.appendChild(btn);
    root.appendChild(pop);
    return root;
  }

  /* -------------------------------------------------------------- checkbox */
  function Checkbox(opts) {
    var label = h("label", "palette-checkbox");
    var input = document.createElement("input");
    input.type = "checkbox";
    if (opts.fkey) input.setAttribute("data-fkey", opts.fkey);
    input.checked = !!opts.checked;
    input.addEventListener("change", function () { opts.onChange(input.checked); });
    var ind = h("span", "checkbox-indicator");
    label.appendChild(input);
    label.appendChild(ind);
    label.appendChild(h("span", null, opts.label));
    return label;
  }

  /* ---------------------------------------------------------------- slider */
  function PointSizeSlider() {
    var s = Store.get();
    var row = h("div", "palette-row slider-row");
    var lab = h("label", "form-label", "Point Size");
    lab.htmlFor = "point-size-slider";
    var wrap = h("div", "pt-slider");
    var input = document.createElement("input");
    input.type = "range";
    input.id = "point-size-slider";
    input.min = "0"; input.max = "2"; input.step = "0.01";
    input.value = String(s.pointSizeMultiplier);
    input.setAttribute("aria-label", "Point size");
    input.setAttribute("aria-valuetext", s.pointSizeMultiplier.toFixed(2) + " times default");
    input.addEventListener("input", function () {
      input.setAttribute("aria-valuetext", parseFloat(input.value).toFixed(2) + " times default");
      Store.set("pointSizeMultiplier", parseFloat(input.value));
    });
    // Hold the DOM still for the whole gesture — pointer drag or held arrow key.
    input.addEventListener("pointerdown", function () {
      suspendRender();
      document.addEventListener("pointerup", function up() {
        document.removeEventListener("pointerup", up);
        resumeRender();
      });
    });
    input.addEventListener("focus", function () {
      suspendRender();
      input.addEventListener("blur", function off() {
        input.removeEventListener("blur", off);
        resumeRender();
      });
    });
    wrap.appendChild(input);
    row.appendChild(lab);
    row.appendChild(wrap);
    return row;
  }

  /* ------------------------------------------------------------- assembly  */

  function labeledRow(labelText, control, opts) {
    opts = opts || {};
    var row = h("div", "palette-row control-row" + (opts.disabled ? " disabled" : ""));
    var lab = h("label", "form-label color-picker", labelText);
    if (opts.hint) {
      var hint = h("span", "scope-hint", opts.hint);
      lab.appendChild(hint);
    }
    row.appendChild(lab);
    row.appendChild(control);
    return row;
  }

  function section(titleText) {
    var sec = h("div", "palette-section");
    sec.appendChild(h("div", "palette-section-title", titleText));
    return sec;
  }

  function graphSection() {
    var s = Store.get();
    var sec = section("Graph");
    sec.appendChild(labeledRow("Background Color", ColorControl({
      label: "Background color",
      fkey: "bg-color",
      value: s.plotBackgroundColor,
      alignRight: true,
      disabled: s.isTransparent,
      onChange: function (c) { Store.set("plotBackgroundColor", c); }
    }), { disabled: s.isTransparent }));
    sec.appendChild(Checkbox({
      label: "Transparent",
      fkey: "transparent",
      checked: s.isTransparent,
      onChange: function (v) { Store.set("isTransparent", v); }
    }));
    return sec;
  }

  function borderControls() {
    var s = Store.get();
    var frag = document.createDocumentFragment();
    frag.appendChild(labeledRow("Point Border Color", ColorControl({
      label: "Point border color",
      fkey: "border-color",
      value: s.pointStrokeColor,
      alignRight: true,
      disabled: s.pointStrokeSameAsFill,
      onChange: function (c) { Store.set("pointStrokeColor", c); }
    }), { disabled: s.pointStrokeSameAsFill }));
    frag.appendChild(Checkbox({
      label: "Border color same as fill",
      fkey: "same-as-fill",
      checked: s.pointStrokeSameAsFill,
      onChange: function (v) { Store.set("pointStrokeSameAsFill", v); }
    }));
    return frag;
  }

  /* --- Series selector (reference) ---------------------------------------- */
  function buildSeriesStrategy(form) {
    var s = Store.get();
    var sec = section("Data Points");

    if (s.hasLegend) {
      var items = [{ value: "__all__", label: "Apply to all series" }].concat(
        s.categories.map(function (c) {
          return { value: c.name, label: c.name, glyph: shapeGlyph(c.shape, c.fill) };
        })
      );
      sec.appendChild(labeledRow("Series", Select({
        ariaLabel: "Series to format",
        fkey: "series",
        value: s.selectedSeries,
        items: items,
        alignRight: true,
        onChange: function (v) { Store.set("selectedSeries", v); }
      })));
    }

    sec.appendChild(PointSizeSlider());

    var shapeValue = Store.common("shape");
    var fillValue = Store.common("fill");
    var targets = Store.targets();

    sec.appendChild(labeledRow("Point Shape", ShapeSelect({
      ariaLabel: "Point shape",
      fkey: "shape-all",
      value: shapeValue,
      alignRight: true,
      swatchColor: fillValue || "#606060",
      onChange: function (v) { Store.setShape(v); }
    })));

    sec.appendChild(labeledRow("Point Fill Color", ColorControl({
      label: "Point fill color",
      fkey: "fill-all",
      value: fillValue,
      mixedColors: targets.map(function (t) { return t.fill; }),
      alignRight: true,
      onChange: function (c) { Store.setFill(c); }
    })));

    sec.appendChild(borderControls());

    // The design question this prototype exists to surface: the Series
    // dropdown sits above five controls but only scopes two of them.
    if (s.hasLegend && s.selectedSeries !== "__all__") {
      sec.appendChild(h("div", "palette-footnote",
        "Point Size and Point Border Color always apply to all series."));
    }

    form.appendChild(sec);
    form.appendChild(graphSection());
  }

  /* --- Per-category rows (the proposal) ------------------------------------ */
  function buildCategoryStrategy(form) {
    var s = Store.get();
    var sec = section("Data Points");
    sec.appendChild(PointSizeSlider());

    if (!s.hasLegend) {
      var row = h("div", "cat-row");
      row.appendChild(h("span", "cat-name", "Points"));
      var ctrls = h("div", "cat-controls");
      ctrls.appendChild(ShapeSelect({
        ariaLabel: "Point shape",
        iconOnly: true,
        fkey: "shape-single",
        value: s.single.shape,
        swatchColor: s.single.fill,
        onChange: function (v) { s.single.shape = v; Store.emit("shape"); }
      }));
      ctrls.appendChild(ColorControl({
        label: "Point fill color",
        fkey: "fill-single",
        value: s.single.fill,
        onChange: function (c) { s.single.fill = c; Store.emit("fill"); }
      }));
      row.appendChild(ctrls);
      sec.appendChild(row);
    } else {
      var listWrap = h("div", "cat-color-setting");
      listWrap.setAttribute("role", "group");
      listWrap.setAttribute("aria-label", D.legend.name + " categories");
      s.categories.forEach(function (cat) {
        var r = h("div", "cat-row");
        r.appendChild(h("span", "cat-name", cat.name));
        var c = h("div", "cat-controls");
        c.appendChild(ShapeSelect({
          ariaLabel: cat.name + " point shape",
          iconOnly: true,
          fkey: "shape-" + cat.name,
          value: cat.shape,
          swatchColor: cat.fill,
          onChange: function (v) { Store.setShape(v, cat.name); }
        }));
        c.appendChild(ColorControl({
          label: cat.name + " fill color",
          fkey: "fill-" + cat.name,
          value: cat.fill,
          onChange: function (col) { Store.setFill(col, cat.name); }
        }));
        r.appendChild(c);
        listWrap.appendChild(r);
      });
      sec.appendChild(listWrap);
    }

    sec.appendChild(borderControls());
    form.appendChild(sec);
    form.appendChild(graphSection());
  }

  /* ------------------------------------------------------------------ API  */
  /*
   * The palette rebuilds its DOM on every state change, which is fine for a
   * click but fatal for a drag: replacing the <input type="range"> mid-gesture
   * makes the browser drop the drag, so the slider moves once and then sticks.
   * React keeps the element identity across renders; here we suspend rendering
   * for the life of the interaction and render once when it ends.
   */
  var suspendCount = 0;
  var pendingRender = false;

  function suspendRender() { suspendCount++; }
  function resumeRender() {
    if (suspendCount > 0) suspendCount--;
    // Only rebuild if a change was actually suppressed. Rendering on every
    // blur destroyed the element the browser was tabbing away from, which
    // bounced focus back to the slider and made everything below it
    // unreachable by keyboard (WCAG 2.1.1, 2.1.2).
    if (!suspendCount && pendingRender) { pendingRender = false; Palette.render(); }
  }

  var Palette = {
    suspend: suspendRender,
    resume: resumeRender,

    mount: function (host) {
      this.host = host;
      this.render();
      Store.subscribe(function (st, reason) {
        if (reason === "selection") return;    // selecting points changes no control
        if (suspendCount) { pendingRender = true; return; }   // a drag is in progress
        Palette.render();
      });
    },

    render: function () {
      var s = Store.get();
      // Remember which control had focus so a rebuild does not drop the
      // keyboard user back to the top of the document.
      var active = document.activeElement;
      var focusKey = active && this.host.contains(active)
        ? (active.getAttribute("data-fkey") || active.id || null) : null;
      var scrollTop = 0;
      var existingList = this.host.querySelector(".cat-color-setting");
      if (existingList) scrollTop = existingList.scrollTop;
      closeOpenPopover();
      if (portalLayer) portalLayer.innerHTML = "";

      this.host.innerHTML = "";
      this.host.style.setProperty("--palette-width", s.paletteWidth + "px");

      var pointer = h("div", "palette-pointer arrow-left");
      var pal = h("div", "codap-inspector-palette");
      pal.setAttribute("role", "dialog");
      pal.setAttribute("aria-label", "Format");

      var header = h("div", "codap-inspector-palette-header");
      var icon = h("span", "codap-inspector-palette-icon");
      icon.innerHTML = global.Icons.format;
      header.appendChild(icon);
      header.appendChild(h("span", "codap-inspector-palette-header-title", "Format"));
      pal.appendChild(header);

      var form = h("div", "palette-form");
      if (s.strategy === "series") buildSeriesStrategy(form);
      else buildCategoryStrategy(form);
      pal.appendChild(form);

      this.host.appendChild(pointer);
      this.host.appendChild(pal);

      if (focusKey) {
        var restore = this.host.querySelector('[data-fkey="' + focusKey + '"]') ||
                      document.getElementById(focusKey);
        if (restore) restore.focus();
      }

      var list = this.host.querySelector(".cat-color-setting");
      if (list) {
        var firstRow = list.querySelector(".cat-row");
        if (firstRow) {
          list.style.setProperty("--cat-row-h", firstRow.getBoundingClientRect().height + "px");
        }
        list.scrollTop = scrollTop;
      }
    }
  };

  global.Palette = Palette;
})(typeof window !== "undefined" ? window : globalThis);
