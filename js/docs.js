/*
 * docs.js — the Docs panel.
 *
 * The prototype travels as a single shared link, so the markdown that goes with
 * it has to travel inside the page: js/docs-content.js is generated from the
 * real .md files and the real .svg assets by tools/gen-docs.js.
 *
 * The renderer below covers exactly the markdown these documents use —
 * headings, paragraphs, lists, tables, fenced code, blockquotes, rules, links
 * and inline emphasis. It is not a general-purpose markdown parser.
 */
(function (global) {
  "use strict";

  function esc(t) {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function inline(t) {
    return esc(t)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(/(^|[\s(])_([^_\n]+)_/g, "$1<em>$2</em>");
  }

  function cells(row) {
    return row.replace(/^\||\|$/g, "").split("|").map(function (c) { return c.trim(); });
  }

  function markdown(src) {
    var lines = src.replace(/\r/g, "").split("\n");
    var out = [], i = 0;

    function flushParagraph(buf) {
      if (buf.length) out.push("<p>" + inline(buf.join(" ")) + "</p>");
      buf.length = 0;
    }

    while (i < lines.length) {
      var line = lines[i];

      if (/^```/.test(line)) {                                    // fenced code
        var code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
        i++;
        out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>");
        continue;
      }

      if (/^#{1,6}\s/.test(line)) {                               // heading
        var level = line.match(/^#+/)[0].length;
        out.push("<h" + level + ">" + inline(line.replace(/^#+\s*/, "")) + "</h" + level + ">");
        i++;
        continue;
      }

      if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { out.push("<hr>"); i++; continue; }

      if (/^\|/.test(line) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || "")) {   // table
        var head = cells(line);
        i += 2;
        var body = [];
        while (i < lines.length && /^\|/.test(lines[i])) body.push(cells(lines[i++]));
        out.push('<div class="doc-table-wrap"><table><thead><tr>' +
          head.map(function (c) { return "<th>" + inline(c) + "</th>"; }).join("") +
          "</tr></thead><tbody>" +
          body.map(function (r) {
            return "<tr>" + r.map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>";
          }).join("") + "</tbody></table></div>");
        continue;
      }

      if (/^\s*>/.test(line)) {                                   // blockquote
        var quote = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ""));
        out.push("<blockquote>" + inline(quote.join(" ")) + "</blockquote>");
        continue;
      }

      if (/^\s*([-*]|\d+\.)\s/.test(line)) {                      // list
        var ordered = /^\s*\d+\./.test(line);
        var items = [];
        while (i < lines.length && (/^\s*([-*]|\d+\.)\s/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
          if (/^\s*([-*]|\d+\.)\s/.test(lines[i])) items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
          else items[items.length - 1] += " " + lines[i].trim();   // continuation line
          i++;
        }
        out.push("<" + (ordered ? "ol" : "ul") + ">" +
          items.map(function (it) { return "<li>" + inline(it) + "</li>"; }).join("") +
          "</" + (ordered ? "ol" : "ul") + ">");
        continue;
      }

      if (!line.trim()) { i++; continue; }

      var para = [];                                              // paragraph
      while (i < lines.length && lines[i].trim() &&
             !/^(#{1,6}\s|```|\||\s*>|\s*([-*]|\d+\.)\s|\s*---+\s*$)/.test(lines[i])) {
        para.push(lines[i++].trim());
      }
      flushParagraph(para);
    }
    return out.join("\n");
  }

  /* ------------------------------------------------------------------ panel */

  var Docs = {
    open: false,
    current: "readme",

    mount: function () {
      this.root = document.getElementById("docs-panel");
      this.trigger = document.getElementById("docs-button");
      this.docs = global.DocsContent || [];

      this.trigger.addEventListener("click", function () { Docs.toggle(); });
      document.addEventListener("keydown", function (e) {
        if (!Docs.open) return;
        if (e.key === "Escape") { Docs.close(); return; }
        if (e.key !== "Tab") return;
        // aria-modal only tells assistive tech the rest of the page is inert;
        // it does not stop Tab. Keep focus inside the dialog (WCAG 2.4.3).
        var items = [].slice.call(Docs.root.querySelectorAll(
          'button, a[href], [tabindex]:not([tabindex="-1"])'))
          .filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
        if (!items.length) return;
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !Docs.root.contains(document.activeElement))) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      });
      this.build();
    },

    toggle: function () { this.open ? this.close() : this.show(); },

    show: function () {
      this.open = true;
      this.root.hidden = false;
      this.trigger.setAttribute("aria-expanded", "true");
      document.body.classList.add("docs-open");
      var nav = this.root.querySelector(".doc-nav button[aria-current='true']");
      if (nav) nav.focus();
    },

    close: function () {
      this.open = false;
      this.root.hidden = true;
      this.trigger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("docs-open");
      this.trigger.focus();
    },

    build: function () {
      var self = this;
      this.root.innerHTML =
        '<div class="doc-backdrop"></div>' +
        '<div class="doc-dialog" role="dialog" aria-modal="true" aria-label="Prototype documents">' +
          '<div class="doc-sidebar">' +
            '<div class="doc-sidebar-title">Documents</div>' +
            '<div class="doc-nav"></div>' +
            '<p class="doc-hint">These are the files that ship with the prototype, embedded here so they travel with the link.</p>' +
          '</div>' +
          '<div class="doc-main"><div class="doc-body" id="doc-body" tabindex="-1"></div></div>' +
          '<button class="doc-close" type="button" aria-label="Close documents">&times;</button>' +
        '</div>';

      this.root.querySelector(".doc-backdrop").addEventListener("click", function () { self.close(); });
      this.root.querySelector(".doc-close").addEventListener("click", function () { self.close(); });

      var nav = this.root.querySelector(".doc-nav");
      this.docs.forEach(function (d) {
        var b = document.createElement("button");
        b.type = "button";
        b.dataset.id = d.id;
        b.innerHTML = "<span class='doc-nav-title'>" + d.title + "</span>" +
                      "<span class='doc-nav-blurb'>" + d.blurb + "</span>";
        b.addEventListener("click", function () { self.select(d.id); });
        nav.appendChild(b);
      });
      this.select(this.current);
    },

    select: function (id) {
      var self = this;
      this.current = id;
      this.root.querySelectorAll(".doc-nav button").forEach(function (b) {
        b.setAttribute("aria-current", String(b.dataset.id === id));
      });
      var doc = this.docs.filter(function (d) { return d.id === id; })[0];
      var body = this.root.querySelector("#doc-body");
      if (!doc) { body.innerHTML = ""; return; }

      if (doc.type === "shapes") {
        body.innerHTML = "<h1>Shape SVGs</h1><p>The seven exported assets, straight out of " +
          "<code>assets/shapes/</code>. Same geometry as the plotted points and the Point Shape menu. " +
          "Fill and stroke are placeholders — both are set at runtime.</p>" +
          '<div class="svg-grid">' + doc.files.map(function (f) {
            return '<figure class="svg-card">' +
              '<div class="svg-preview">' + global.Shapes.svgMarkup(f.id, { size: 56, radius: 18, fill: "#e6805b", stroke: "#ffffff", strokeWidth: 1 }) + "</div>" +
              "<figcaption>" + f.label + " <span>" + f.name + "</span></figcaption>" +
              '<pre><code>' + esc(f.source) + "</code></pre>" +
              '<button class="svg-copy" type="button" data-id="' + f.id + '">Copy SVG</button>' +
              "</figure>";
          }).join("") + "</div>";
        body.querySelectorAll(".svg-copy").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var file = doc.files.filter(function (f) { return f.id === btn.dataset.id; })[0];
            self.copy(btn, file.source);
          });
        });
      } else {
        body.innerHTML = markdown(doc.body);
      }
      body.scrollTop = 0;
      body.focus();
    },

    copy: function (btn, text) {
      var done = function (msg) {
        var was = btn.textContent;
        btn.textContent = msg;
        setTimeout(function () { btn.textContent = was; }, 2200);
      };
      try {
        navigator.clipboard.writeText(text).then(function () { done("Copied"); }, function () { select(); });
      } catch (e) { select(); }

      function select() {
        var pre = btn.parentNode.querySelector("pre");
        var range = document.createRange();
        range.selectNodeContents(pre);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        done("Selected — press ⌘C");
      }
    }
  };

  global.Docs = Docs;
})(typeof window !== "undefined" ? window : globalThis);
