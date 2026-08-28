/* Builds single-file versions of the prototype.
   node tools/bundle.js
     dist/codap-data-point-shapes.html   complete standalone document
     dist/artifact-body.html             same page, without the document wrapper
*/
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");

// The Docs panel reads from a generated file; keep it current on every build.
require("./gen-docs.js");

let html = read("index.html");

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) =>
  `<style>\n/* ${href} */\n${read(href)}\n</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) =>
  `<script>\n/* ${src} */\n${read(src)}\n</script>`);

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist", "codap-data-point-shapes.html"), html);

// Artifact form: the publisher supplies <!doctype>, <head> and <body>.
let body = html
  .replace(/^[\s\S]*?<title>[\s\S]*?<\/title>/, "<title>CODAP Point Shapes</title>")
  .replace(/<\/head>\s*<body>/, "")
  .replace(/<\/body>\s*<\/html>\s*$/, "")
  .replace(/<meta[^>]*>\s*/g, "")
  .replace(/<link rel="preconnect"[^>]*>\s*/g, "");
fs.writeFileSync(path.join(root, "dist", "artifact-body.html"), body.trim() + "\n");

const kb = f => (fs.statSync(path.join(root, "dist", f)).size / 1024).toFixed(1) + " KB";
console.log("dist/codap-data-point-shapes.html", kb("codap-data-point-shapes.html"));
console.log("dist/artifact-body.html         ", kb("artifact-body.html"));
