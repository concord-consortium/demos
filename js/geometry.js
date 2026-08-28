/* geometry.js — the shape geometry sheet view. Renders every shape at every
   CODAP point radius plus border and dark-background cases, from js/shapes.js. */
(function (global) {
  "use strict";
  var S = global.Shapes;

  function cell(id, r, fill, stroke, sw, cap) {
    var box = Math.max(46, Math.round(r * 3.2));
    return '<div class="cell"><svg width="' + box + '" height="' + box + '" viewBox="0 0 ' + box + ' ' + box + '">' +
      '<g transform="translate(' + box / 2 + ' ' + box / 2 + ')"><path d="' + S.path(id, r) + '" fill="' + fill +
      '" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round"/></g></svg>' +
      (cap ? '<div class="cap">' + cap + '</div>' : '') + '</div>';
  }

  global.GeometrySheet = {
    render: function () {
      if (this.done) return;
      this.done = true;

      document.getElementById("geo-sizes").innerHTML = [3, 5, 6, 8, 10, 14, 20].map(function (r) {
        return '<div class="row">' + S.order.map(function (id) {
          return cell(id, r, "#e6805b", "#ffffff", 1, "");
        }).join("") + '<div class="cap radius">r = ' + r + "</div></div>";
      }).join("");

      document.getElementById("geo-stroked").innerHTML = S.order.map(function (id) {
        return cell(id, 8, "#e6805b", "#2a4bd7", 2, S.defs[id].label);
      }).join("");

      document.getElementById("geo-dark").innerHTML = S.order.map(function (id) {
        return cell(id, 8, "#ffee33", "#33404a", 1, "");
      }).join("");

      var R = S.asset.referenceRadius;
      document.getElementById("geo-metrics").innerHTML =
        "<tr><th>Shape</th><th>Area @ r=8</th><th>vs circle</th><th>Extent</th><th>Asset</th></tr>" +
        S.order.map(function (id) {
          var d = S.defs[id], e = d.extent(R);
          return "<tr><td>" + d.label + "</td><td>" + d.area(R).toFixed(1) + "</td><td>" +
            (100 * d.area(R) / (Math.PI * R * R)).toFixed(0) + "%</td><td>" + e.w.toFixed(2) +
            " &times; " + e.h.toFixed(2) + "</td><td>point-" + id + ".svg</td></tr>";
        }).join("");
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
