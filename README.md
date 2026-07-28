# Storm Explorer — Multi-run

Deployed build of the multi-run version of Storm Explorer, based on the
Concord Consortium `hurricane-model` app (storm mode).

**Live demo:** https://models-resources.concord.org/demos/branch/storm-explorer-multirun/

This branch holds the compiled output only. Source lives in the separate
StormExplorer working repo. To update: rebuild (`npm run build`) and copy the
`dist/` contents here, then push — CI deploys automatically via
`.github/workflows/ci.yml`.

Note: the separate `storm-explorer` branch is a different, standalone static
HTML prototype (APLUS project review) and is intentionally kept apart.
