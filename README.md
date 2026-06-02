# Demos

A shared repository for creating quick demos that are automatically deployed to S3.

---

## This branch: iframe `tabindex` / focus behavior tests

This demo probes how browsers handle keyboard **Tab** traversal into `<iframe>`
elements, and how the `tabindex` attribute on the iframe affects it. It's a
manual, cross-browser test page — open it, tab through the rows, and watch the
sticky tracker bar report `document.activeElement`.

### What it tests

A parent page (`index.html`) embeds the same three child pages under different
conditions:

- **Children:**
  - `child-buttons.html` — three focusable buttons.
  - `child-empty.html` — no focusables, no scrollable content.
  - `child-scroll.html` — a scrollable container, no focusables.
- **Cases (7 rows):** each child is embedded with `tabindex="0"`, `tabindex="-1"`,
  or no `tabindex` attribute, to compare whether and how focus descends into the
  iframe, lands on the iframe element, targets an inner scroll container, or is
  skipped entirely. Behavior varies by browser (Chrome, Firefox, Safari).

### How to use it

For each row, click the `BEFORE N` marker and press **Tab** (forward), or click
`AFTER N` and press **Shift+Tab** (reverse), then read the tracker bar. Safari
requires Full Keyboard Access (System Settings → Keyboard → Keyboard navigation),
or hold Option while pressing Tab.

**Focus rings:** a red outline means `:focus` matches (the element is focused); an
added blue ring with a white spacer means `:focus-visible` also matches (the
browser deems focus should be visible — i.e. keyboard-driven). So *red only* =
mouse-focused, *red + blue* = keyboard-focused.

### Cross-origin mode

Append `?xorigin=1` to load the iframes from a second origin that serves the same
files, so the parent can no longer read into them (the tracker shows
"(cross-origin — cannot read inner)", matching a real cross-origin embed). The
page only swaps the origin (protocol + host), keeping the path intact:

- **Local:** `localhost` ⇄ `127.0.0.1` (same dev server, two origins).
- **Deployed:** `models-resources.concord.org` ⇄ `models-resources.s3.amazonaws.com`
  (the demo is published to both).

---

## How It Works

Each branch is deployed to its own folder on S3. To create a demo:

1. Clone this repository.
2. Create a new branch for your demo (e.g. `git checkout -b my-demo-name`).
3. Add your HTML, CSS, and JavaScript files.
4. Push your branch.

Your demo will be automatically deployed to:
```
https://models-resources.concord.org/demos/branch/<your-branch-name>/
```

The entry point is `index.html` at the root of your branch.

## Instructions for using this repo with Claude
- Make a new directory and run Claude in this directory
- Tell Claude: "Clone https://github.com/concord-consortium/demos into the current directory"
- Tell Claude: "Create a new branch named something-cool" (The branch name will be the path where the demo is available when it is deployed.)
- Copy your HTML, CSS, and JS files into this directory if you've already got them. Or work with Claude to make your demo.
- Tell Claude: "Commit and push these changes, setting upstream if needed"

Your demo will be automatically deployed to:
```
https://models-resources.concord.org/demos/branch/<your-branch-name>/
```

If you have an `index.html` file, it will be loaded from the link above. If you name your file something else, you need to add it to the end of the URL above.

## Deploying a Subfolder Instead of the Whole Repo

If your demo has a build step or you only want to deploy a specific folder, you can
modify the workflow in `.github/workflows/ci.yml` on your branch:

- Change `build` from `"true"` to your build command (e.g. `npm run build`).
- Change `folderToDeploy` from `"."` to the output folder (e.g. `dist`).

For example, if you have a Vite project:
```yaml
      - uses: actions/setup-node@v4
      # add this step before the s3-deploy-action step
      - name: Install Dependencies
        run: npm ci
      # then update the s3-deploy-action inputs:
      - uses: concord-consortium/s3-deploy-action@v1
        with:
          build: npm run build
          folderToDeploy: dist
          # ... keep other inputs the same
```
