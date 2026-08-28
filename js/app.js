/* app.js — wires the tile chrome, the inspector toolbar and the prototype bar. */
(function (global) {
  "use strict";

  var Store = global.Store, Graph = global.Graph, Palette = global.Palette, Icons = global.Icons;

  var BUTTONS = [
    { id: "rescale", label: "Rescale", icon: "rescale", tip: "Rescale display to show all the data", top: true },
    { id: "view", label: "View", icon: "view", tip: "Show all cases or hide selected/unselected cases" },
    { id: "measure", label: "Measure", icon: "measure", tip: "Change what is shown along with the points" },
    { id: "format", label: "Format", icon: "format", tip: "Change the appearance of the display" },
    { id: "image", label: "Image", icon: "image", tip: "Save the display as an image", bottom: true }
  ];

  function buildInspector(host, paletteHost) {
    host.innerHTML = "";
    BUTTONS.forEach(function (b, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "inspector-tool-button" + (b.top ? " top" : "") + (b.bottom ? " bottom" : "");
      btn.title = b.tip;
      btn.dataset.id = b.id;
      btn.innerHTML = Icons[b.icon] + '<span class="inspector-button-label">' + b.label + "</span>";
      if (b.id === "format") {
        btn.setAttribute("aria-expanded", "true");
        btn.setAttribute("aria-controls", "graph-format-palette");
        btn.classList.add("active");
        btn.addEventListener("click", function () {
          var open = paletteHost.hidden;
          paletteHost.hidden = !open;
          btn.setAttribute("aria-expanded", String(open));
          btn.classList.toggle("active", open);
          Store.set("palettePinned", open);
        });
      } else {
        btn.addEventListener("click", function () {
          announce(b.label + " is out of scope for this prototype.");
        });
      }
      host.appendChild(btn);
      // position the palette arrow against the Format button
      if (b.id === "format") {
        requestAnimationFrame(function () {
          paletteHost.style.top = (btn.offsetTop - 6) + "px";
        });
      }
    });
  }

  function announce(msg) {
    var live = document.getElementById("live-status");
    if (live) { live.textContent = ""; live.textContent = msg; }
  }

  function seg(container, options, getValue, setValue) {
    container.innerHTML = "";
    options.forEach(function (o) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = o.label;
      b.title = o.tip || "";
      b.setAttribute("aria-pressed", String(getValue() === o.value));
      if (o.secondary) b.classList.add("secondary");
      b.addEventListener("click", function () {
        setValue(o.value);
        seg(container, options, getValue, setValue);
      });
      container.appendChild(b);
    });
  }

  function init() {
    var paletteHost = document.getElementById("format-palette");
    buildInspector(document.getElementById("inspector-panel"), paletteHost);

    Graph.mount(document.getElementById("plot"), document.getElementById("legend"));
    Palette.mount(paletteHost);
    global.Docs.mount();

    var noteProposal = document.getElementById("note-proposal");
    var noteReference = document.getElementById("note-reference");
    function syncNotes() {
      var isReference = Store.get().strategy === "series";
      noteProposal.hidden = isReference;
      noteReference.hidden = !isReference;
    }
    seg(document.getElementById("seg-strategy"), [
      { value: "category", label: "Per-category rows",
        tip: "The proposal: shape + fill per legend category, agreed 25 Aug" },
      { value: "series", label: "Series selector", secondary: true,
        tip: "Reference only: the Google Sheets model from the design notes" }
    ], function () { return Store.get().strategy; }, function (v) {
      Store.set("strategy", v);
      syncNotes();
    });
    syncNotes();

    seg(document.getElementById("seg-legend"), [
      { value: true, label: "Habitat (3)", tip: "Points colored by a categorical legend attribute" },
      { value: false, label: "No legend", tip: "Single series - the basic form of the palette" }
    ], function () { return Store.get().hasLegend; }, function (v) {
      Store.set("hasLegend", v);
      Store.set("selectedSeries", "__all__");
    });

    seg(document.getElementById("seg-keys"), [
      { value: "shapes", label: "Shapes", tip: "Proposed: the key carries the shape as well as the color" },
      { value: "squares", label: "Squares", tip: "CODAP today: a 15 x 15 color square" }
    ], function () { return Store.get().legendKeys; }, function (v) { Store.set("legendKeys", v); });

    seg(document.getElementById("seg-width"), [
      { value: 216, label: "216px", tip: "Michael's Zeplin total width" },
      { value: 256, label: "256px", tip: "Width proposed on 25 Aug to fit a shape + color row" }
    ], function () { return Store.get().paletteWidth; }, function (v) { Store.set("paletteWidth", v); });

    var protoView = document.getElementById("prototype-view");
    var geoView = document.getElementById("geometry-view");
    var currentView = "prototype";
    seg(document.getElementById("seg-view"), [
      { value: "prototype", label: "Prototype" },
      { value: "geometry", label: "Shape geometry", tip: "Every shape at every CODAP point radius" }
    ], function () { return currentView; }, function (v) {
      currentView = v;
      protoView.hidden = v !== "prototype";
      geoView.hidden = v !== "geometry";
      document.querySelectorAll(".proto-note").forEach(function (n) {
        n.hidden = v !== "prototype" || (n.id === "note-reference") === (Store.get().strategy !== "series");
      });
      if (v === "geometry") global.GeometrySheet.render();
    });

    document.getElementById("proto-reset").addEventListener("click", function () {
      Store.reset();
      announce("Formatting reset to defaults.");
    });

    Store.subscribe(function (s, reason) {
      if (reason === "shape" || reason === "fill" || reason === "pointSizeMultiplier") {
        announce("Graph redrawn.");
      }
    });

    window.addEventListener("resize", function () { Graph.render(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof window !== "undefined" ? window : globalThis);
