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
- **Cases (rows 1–7):** each child is embedded with `tabindex="0"`, `tabindex="-1"`,
  or no `tabindex` attribute, to compare whether and how focus descends into the
  iframe, lands on the iframe element, targets an inner scroll container, or is
  skipped entirely. Behavior varies by browser (Chrome, Firefox, Safari).
- **Row 8 — focus moved during a Tab handler:** `AFTER 8` has a Tab keydown
  handler that moves focus to a `tabindex="-1"` sentinel placed *before* the
  iframe and does **not** call `preventDefault`. This tests whether the browser's
  default Tab navigation continues from the newly-focused element (wrapping
  forward into the iframe's first button) or from the original one.
- **Row 9 — focus moved to the iframe element:** like row 8, but the `AFTER 9`
  Tab handler focuses the iframe element itself (no sentinel) without
  `preventDefault`. An `EXTRA 9` button between the iframe and `AFTER 9`
  distinguishes "focus descended into the iframe" (its first button) from "the
  iframe content was skipped" (the EXTRA button).
- **Rows 10–12 — hidden sentinel:** repeat row 8 with a hidden sentinel, to see
  whether the hiding method changes the behavior. Row 10 uses the screen-reader
  `sr-only` pattern (visually hidden but still focusable); row 11 uses
  `display:none` (not focusable, so `focus()` is a no-op); row 12 collapses the
  sentinel to a zero-size box (`width:0; height:0; overflow:hidden;
  position:absolute`), where focusability is browser-dependent.
- **Row 13 — cross-origin focus-steal from an `<input>`:** typing in an input and
  pressing Enter posts the focus-first-button message to the iframe. Per
  [Mozilla bug 656026](https://bugzilla.mozilla.org/show_bug.cgi?id=656026),
  Firefox blocks a cross-origin iframe from stealing focus away from an input
  element (unlike the `m` key, whose focus source is a link). Run with
  `?xorigin=1` to test the cross-origin case.
- **Row 14 — cross-origin focus-steal triggered by a click:** clicking a button
  with the mouse posts the same message, but in pointer modality instead of
  keyboard. Compares against the keyboard-triggered cases (the `m` key and row
  13's Enter) to see whether modality affects whether the steal is allowed.
- **Row 15 — async focus-steal while typing:** clicking `ARM` starts a 2-second
  `setTimeout`; when it fires it posts the message with no user gesture driving
  the steal. Click `ARM`, then type in the input — the steal attempt lands
  mid-typing, the real-world focus-stealing case browsers are most likely to
  block. Run with `?xorigin=1` for the cross-origin case.

### How to use it

For each row, click the `BEFORE N` marker and press **Tab** (forward), or click
`AFTER N` and press **Shift+Tab** (reverse), then read the tracker bar. Safari
requires Full Keyboard Access (System Settings → Keyboard → Keyboard navigation),
or hold Option while pressing Tab.

With a `BEFORE N` marker focused you can also press **f** to call `iframe.focus()`
from JavaScript, **b** to call `focus()` on the first button inside the iframe
(same-origin only), or **m** to `postMessage` the iframe asking it to focus its own
first button (the cross-origin-safe version of **b** — works under `?xorigin=1`).
These reveal how scripted focus interacts with the iframe. For row 8, click
`AFTER 8` and press **Tab** to run the wrapping-loop test described above.

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
