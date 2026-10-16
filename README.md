# CODAP "About" Modal — Design Mockup

An interactive prototype and implementation spec for a proposed **"About CODAP"** experience: a Help‑menu entry that opens an About dialog surfacing CODAP's branding, version, licensing (MIT for the source code; the hosted site at codap.concord.org governed by Concord's [Terms of Use](https://concord.org/terms-of-use/)), and a discoverable‑but‑tucked‑away list of third‑party libraries.

## Launch the mockup

Once this branch's CI has deployed, open:

**https://models-resources.concord.org/demos/branch/codap-about-modal/**

In the mockup: click **Help** (top‑right of the header) → **About CODAP…**. From the About dialog you can open the **"Open‑source libraries & acknowledgements"** drill‑in. A **Preview startup modal** control sits in the dark demo bar at the very top.

> The dark bar across the top and the "Mockup" labels are prototype scaffolding, not part of the proposed UI. The app chrome behind the dialog is a simplified stand‑in to show placement of the Help menu and About dialog.

## Files

- **`index.html`** — self‑contained interactive mockup. No build step, no dependencies; the CODAP logo is embedded as a data URI. Text uses Roboto, loaded from Google Fonts.
- **`CODAP-About-Spec.md`** — implementation spec for developers: entry points, component architecture, the License & Terms of Use copy, build‑time acknowledgements generation, accessibility, styling, and open questions.

## Versions

- **v0.2 (current, October 2026)** — License copy aligned with and linked to the published Terms of Use. This branch (`codap-about-modal`).
- **v0.1 (July 27, 2026)** — Earlier version, frozen on the `codap-about-modal-v0.1` branch: https://models-resources.concord.org/demos/branch/codap-about-modal-v0.1/

## Status / notes

- The License & Terms of Use copy in the spec (§6) is final and matches the published Terms of Use.
- The version string in the mockup mirrors the app's existing format (e.g. `Version 3.0.5 · build 2957`).
- Tracked in Jira as [CODAP-1595](https://concord-consortium.atlassian.net/browse/CODAP-1595).
