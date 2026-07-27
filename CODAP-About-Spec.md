# CODAP "About" Experience — Implementation Spec (v0.1)

Status: draft for team review. Companion file: `codap-about-mockup.html` (interactive).

## 1. Goal
Give CODAP a discoverable, legally accurate "About" surface that states the software and content licenses, links to Concord licensing, and lists third‑party libraries — without cluttering the everyday UI. Reuse one dialog component for both the startup greeting and the About reference.

## 2. Entry points
1. **Help menu → "About CODAP…"** — new item appended after the existing entries (Help Pages and Videos…, Help Forum…, The CODAP Project…, Privacy Page…), below a divider (About is conventionally last). The Help menu lives at the top‑right of the top bar, alongside Settings and the language selector; the dropdown opens directly beneath the Help button, left‑aligned to it.
2. **Startup modal → "About & licensing"** footer link — opens the same About dialog.

## 3. Component architecture
Single dialog component, two modes and (in About mode) two views:

- `mode="welcome"` — startup greeting: logo, one‑line welcome/beta copy, **"Don't show this again"** checkbox, `About & licensing` link, `Get started` primary button.
- `mode="about"` — reference:
  - **Primary view** — brand block, version, copyright, license section, quick links, drill‑in row.
  - **Acknowledgements view** — search + generated library list; reached via drill‑in, returns via `‹ Back` in the header. Same modal, no new window.

Reusing one component keeps styling and a11y in one place; the two modes differ only in body/footer content.

## 4. Primary view — content & data
- **Logo**: `codapproductlogo2025.png` (provided), ~220px wide, centered.
- **Tagline**: "Common Online Data Analysis Platform".
- **Version**: `Version {version} · build {buildNumber}` from build metadata — mirror the format the app already shows in the top bar (e.g. `v3.0.5 (2957)` → `Version 3.0.5 · build 2957`). Build number confirmed in scope for triage. Render as **user‑selectable** text so it can be pasted into bug reports.
- **Copyright**: `© 1996–{currentYear} The Concord Consortium, Inc.` (year from build).
- **License section**: copy in §6.
- **Quick links**: Licensing details ↗ (concord.org/licensing) · Source on GitHub ↗. (Commercial‑licensing contact is available inside the "What counts as commercial use?" expander via licensing@concord.org.)
- **Drill‑in row**: "Open‑source libraries & acknowledgements — {N} projects ›".

## 5. Acknowledgements view
- Intro line thanking authors.
- **Search field** filtering by library name.
- **List**: `name · version · license` rows, scrollable (max‑height ~230px).
- Footer: "This list is generated at build time from CODAP's dependencies. Full license texts: THIRD‑PARTY‑NOTICES ↗".
- **Data source (maintainability):** generate a `third-party-licenses.json` at build time (e.g. `license-checker-rspack` / `license-checker` over production deps) and import it; also emit a full‑text `THIRD-PARTY-NOTICES.md` in the repo/build that the footer links to. No hand‑maintained list. Adding a dependency updates the panel automatically — this is the scaling requirement.

## 6. License copy (final draft — **legal review required**)
> **CODAP is free, open‑source software**, released under the MIT License. You're welcome to use, modify, and build on the CODAP application.
>
> Our Terms of Use allows you to use codap.concord.org freely for **non‑commercial** purposes. Using codap.concord.org commercially — including bundling it into paid, subscription, or otherwise revenue‑generating products — requires a commercial license from the Concord Consortium. For more information, visit concord.org/licensing or contact us at licensing@concord.org.

Wording per Scott Cytacki's review: the license section is framed around the site **Terms of Use** for `codap.concord.org` rather than the CC BY‑NC content license, and is limited to these two paragraphs — the earlier "What counts as commercial use?" expander has been removed. In the modal, `codap.concord.org`, `concord.org/licensing`, and `licensing@concord.org` are links.

## 7. Startup modal changes
- Add persistent **"Don't show this again"** (store in user prefs / document CFM settings — persists across sessions; a plain page reload should not re‑show it once dismissed).
- Add `About & licensing` footer link → opens About mode.
- Keep body light (welcome/beta note only); **do not** put license text or the library list here.

## 8. Interaction, a11y, styling
- Open on menu select or startup; close via ×, `Close`, `Esc`, or scrim click. Return focus to the invoking control.
- `role="dialog"`, `aria-modal="true"`, labelled by the header title; trap focus; the `‹ Back` control updates the accessible name.
- External links `target="_blank" rel="noopener"`; email links `mailto:`.
- Reuse existing CODAP dialog chrome (header bar + × , rounded corners, teal primary button `#1f8299`). No new UI paradigm.
- Search filter is client‑side over the generated JSON; empty‑state row when no match.

## 9. Open questions for the team
1. **License framing** — confirmed direction: MIT for software, CC BY‑NC for content (per §6). Legal to approve exact wording.
2. **Version detail** — build number **confirmed** (shown alongside date). Also expose git SHA? Optional; useful for pinpointing a build in bug triage.
3. **Startup persistence scope** — per‑user (account) vs per‑browser vs per‑document?
4. **Acknowledgements depth** — in‑app list of name/version/license only, with full texts on GitHub (recommended), or embed full texts in‑app for offline/embedded use?
5. **License categories** — should any bundled sample datasets/plugins carry their own attribution rows?

## 10. Out of scope (v1)
Full license text rendering in‑app; localization of license copy (link out first); per‑plugin about panels.
