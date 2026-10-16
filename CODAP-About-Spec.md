# CODAP "About" Experience — Implementation Spec (v0.2)

Status: updated October 2026 to reflect the published Concord Consortium [Terms of Use](https://concord.org/terms-of-use/). Companion file: `index.html` (interactive mockup). Jira: [CODAP-1595](https://concord-consortium.atlassian.net/browse/CODAP-1595).

## 1. Goal
Give CODAP a discoverable, legally accurate "About" surface that states the software license and the hosted-site Terms of Use, links to Concord's Terms of Use and licensing pages, and lists third‑party libraries — without cluttering the everyday UI. Reuse one dialog component for both the startup greeting and the About reference.

## 2. Entry points
1. **Help menu → "About CODAP…"** — new item appended after the existing entries (Help Pages and Videos…, Help Forum…, The CODAP Project…, Privacy Page…), below a divider (About is conventionally last), with the "i" info icon. The Help menu lives at the top‑right of the top bar, alongside Settings and the language selector; the dropdown opens directly beneath the Help button, left‑aligned to it.
2. **Help menu → "Terms of Use…"** *(proposed; pending confirmation from engineering)* — external link to https://concord.org/terms-of-use/, placed directly below "Privacy Page…" and styled like the other external‑link items.
3. **Startup modal → "About & licensing"** footer link — opens the same About dialog.

## 3. Component architecture
Single dialog component, two modes and (in About mode) two views:

- `mode="welcome"` — startup greeting: logo, one‑line welcome/beta copy, **"Don't show this again"** checkbox, `About & licensing` link, `Get started` primary button.
- `mode="about"` — reference:
  - **Primary view** — brand block, version, copyright, license & Terms of Use section, quick links, drill‑in row.
  - **Acknowledgements view** — generated library list (search optional); reached via drill‑in, returns via `‹ Back` in the header. Same modal, no new window.

Reusing one component keeps styling and a11y in one place; the two modes differ only in body/footer content.

## 4. Primary view — content & data
- **Logo**: `codapproductlogo2025.png` (provided), ~220px wide, centered.
- **Tagline**: "Common Online Data Analysis Platform".
- **Version**: `Version {version} · build {buildNumber}` from build metadata — mirror the format the app already shows in the top bar (e.g. `v3.0.5 (2957)` → `Version 3.0.5 · build 2957`). Render as **user‑selectable** text so it can be pasted into bug reports.
- **Copyright**: `© 1996–{currentYear} The Concord Consortium, Inc.` (year from build).
- **License & Terms of Use section**: copy in §6.
- **Quick links**: Terms of Use ↗ (concord.org/terms-of-use) · Licensing details ↗ (concord.org/licensing) · Source on GitHub ↗.
- **Drill‑in row**: "Open‑source libraries & acknowledgements — {N} projects ›".

## 5. Acknowledgements view
- Intro line thanking authors.
- **List**: `name · version · license` rows, scrollable (max‑height ~230px). A search field is optional; a plain static list is fine.
- Footer: "This list is generated at build time from CODAP's dependencies. Full license texts: THIRD‑PARTY‑NOTICES ↗". The link must point to the notices **for this specific build**, since dependencies change over time.
- **Data source (maintainability):** generate a `third-party-licenses.json` at build time (e.g. `license-checker-rspack` / `license-checker` over production deps) and import it; also emit a full‑text `THIRD-PARTY-NOTICES.md` in the build that the footer links to. No hand‑maintained list. Adding a dependency updates the panel automatically — this is the scaling requirement.

## 6. License & Terms of Use copy (final)
Section heading: **License & Terms of Use**

> **CODAP is free, open‑source software.** The CODAP source code is released under the MIT License, so you're welcome to use, modify, and build on it.
>
> **Your use of codap.concord.org** is governed by our Terms of Use. The hosted site is free for non‑commercial use. Commercial use of codap.concord.org, including integrating it into paid, subscription, or otherwise revenue‑generating products, requires a separate written agreement with the Concord Consortium. Visit concord.org/licensing or contact licensing@concord.org.

Links in the modal:

| Text | Target |
|---|---|
| MIT License | https://github.com/concord-consortium/codap/blob/main/LICENSE |
| codap.concord.org (first mention) | https://codap.concord.org/ |
| Terms of Use | https://concord.org/terms-of-use/ |
| concord.org/licensing | https://concord.org/licensing |
| licensing@concord.org | mailto:licensing@concord.org |

Notes:
- The copy keeps the two‑part framing from Scott Cytacki's review: MIT for the source code, and the site **Terms of Use** for the hosted service at `codap.concord.org`.
- The wording is aligned with the published Terms of Use: commercial use of the hosted Services requires "a separate written agreement" (Terms §4), and open‑source licenses govern Concord's open‑source software (Terms §6). This replaces the earlier "requires a commercial license" phrasing.
- Approved by Kiley Brown; no further legal review required.

## 7. Startup modal changes
- Add persistent **"Don't show this again"** (store in user prefs / document CFM settings — persists across sessions; a plain page reload should not re‑show it once dismissed).
- Add `About & licensing` footer link → opens About mode.
- Keep body light (welcome/beta note only); **do not** put license text or the library list here.

## 8. Interaction, a11y, styling
- Open on menu select or startup; close via ×, `Close`, `Esc`, or scrim click. Return focus to the invoking control.
- `role="dialog"`, `aria-modal="true"`, labelled by the header title; trap focus; the `‹ Back` control updates the accessible name.
- External links `target="_blank" rel="noopener"`; email links `mailto:`.
- Reuse existing CODAP dialog chrome (header bar + ×, rounded corners, teal primary button `#1f8299`). No new UI paradigm.
- **Typography (Michael Tirenin):** Roboto throughout; **16px** for body text (license paragraphs, startup welcome copy, acknowledgements intro) and **14px** for supporting text and labels (tagline, version, copyright, links, drill‑in row, menu items, buttons, library rows); text color **#3F3F3F**. The mockup widens the About dialog to ~520px so the 16px body text stays comfortable.
- **Help menu:** use the Settings‑menu separator style for the divider above "About CODAP…", and the "i" info icon (as used in the table) for that item. The mockup approximates both; match the real CODAP components in implementation.
- Localize all UI strings. Whether the license/Terms copy is localized in v1 is still open (see §9).

## 9. Open questions for the team
1. **Help menu "Terms of Use…" item** — include in CODAP‑1595 or handle separately? (Pending confirmation from Kirk.)
2. **Version detail** — also expose git SHA? Optional; useful for pinpointing a build in bug triage.
3. **Startup persistence scope** — per‑user (account) vs per‑browser vs per‑document?
4. **Acknowledgements depth** — in‑app list of name/version/license only, with full texts in the per‑build notices (recommended), or embed full texts in‑app for offline/embedded use?
5. **License categories** — should any bundled sample datasets/plugins carry their own attribution rows?
6. **Localization of legal copy** — keep the License & Terms of Use copy English‑only in v1, or localize it?

Resolved: license framing (MIT for source code; hosted site governed by the Terms of Use) — see §6.

## 10. Out of scope (v1)
Full license text rendering in‑app; per‑plugin about panels; usage tracking for commercial‑use auditing.

## 11. Version history
- **v0.2 (October 2026)** — License copy aligned with the published Terms of Use and linked to it; "Terms of Use" quick link and proposed Help menu item added; Michael's typography and menu notes applied. Live mockup: https://models-resources.concord.org/demos/branch/codap-about-modal/
- **v0.1 (July 27, 2026)** — Initial mockup and spec, revised after Scott's review (Terms of Use framing; "What counts as commercial use?" expander removed). Frozen at: https://models-resources.concord.org/demos/branch/codap-about-modal-v0.1/
