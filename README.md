# CODAP "About" Modal — Design Mockup

An interactive prototype and implementation spec for a proposed **"About CODAP"** experience: a Help‑menu entry that opens an About dialog surfacing CODAP's branding, version, licensing (MIT for the software, CC BY‑NC 4.0 for educational content), and a discoverable‑but‑tucked‑away list of third‑party libraries.

## Launch the mockup

Once this branch's CI has deployed, open:

**https://models-resources.concord.org/demos/branch/codap-about-modal/**

In the mockup: click **Help** (top‑right of the header) → **About CODAP…**. From the About dialog you can open the **"Open‑source libraries & acknowledgements"** drill‑in (searchable list) and expand **"What counts as commercial use?"**. A **Preview startup modal** control sits in the dark demo bar at the very top.

> The dark bar across the top and the "Mockup" labels are prototype scaffolding, not part of the proposed UI. The app chrome behind the dialog is a simplified stand‑in to show placement of the Help menu and About dialog.

## Files

- **`index.html`** — self‑contained interactive mockup. No build step, no dependencies; the CODAP logo is embedded as a data URI.
- **`CODAP-About-Spec.md`** — implementation spec for developers: entry points, component architecture, the license copy, build‑time acknowledgements generation, accessibility, and open questions.

## Status / notes

- The license wording in the spec (§6) is a strong draft and should be reviewed by Concord legal/licensing before shipping.
- The version string in the mockup mirrors the app's existing format (e.g. `Version 3.0.5 · build 2957`).
