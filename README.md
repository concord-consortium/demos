# Bananas Simulation

An interactive genetics simulation built for the **DESE SPA Educator Review Panel** (April 2026). Students explore Mendelian inheritance and fungal resistance by crossing wild banana plants with commercially grown Cavendish varieties, then observing what happens when a fungal pathogen is introduced.

**Live demo:** https://models-resources.concord.org/demos/branch/bananas-simulation/

## Overview

The simulation models a simplified version of the real-world challenge facing banana agriculture: the Cavendish monoculture's vulnerability to fungal diseases like Fusarium wilt (TR4). Students select parent plants with different genetic backgrounds, cross them to produce offspring, and then introduce a fungus to reveal which offspring inherited resistance.

## How It Works

Students work through a guided investigation across up to five independent trials (tabs A-E):

1. **Select parents** -- Choose from Wild banana varieties (which carry a dominant resistance allele, R) and Cavendish varieties (homozygous recessive, rr). Parent selections are locked once the first cross is made; reset the trial to choose different parents.
2. **Cross plants** -- Each cross produces 5-20 offspring whose genotypes are determined by Mendelian inheritance. Before the fungus is introduced, all plants appear identically healthy. A maximum of 25 crosses (generations) are allowed per trial.
3. **Introduce fungus** -- A one-way, irreversible action that simulates real-world fungal contamination. Plants lacking the resistance allele (rr) visually wilt and turn brown. A blue dashed marker appears in both the offspring grid and the line graph to indicate the moment of introduction. Fungus can be introduced at any time, even before the first cross.
4. **Continue crossing** -- Students can keep crossing after the fungus to observe how resistance ratios change across generations.
5. **Analyze data** -- A pie chart shows current healthy vs. infected proportions; a line graph tracks resistance percentage over generations.

## Genetics Model

The simulation uses a single-gene, two-allele system (R = resistant, r = susceptible) with complete dominance. Parent genotypes are fixed: Wild W1 is RR, Wild W2 and W3 are Rr, and both Cavendish varieties are rr. Offspring genotypes are determined by random allele sampling from each parent, producing expected Mendelian ratios with natural sampling variability.

## Key Design Decisions

- **Pre-fungus ambiguity:** Before the fungus is introduced, all plants look green and healthy regardless of genotype -- students cannot distinguish resistant from susceptible plants by appearance alone.
- **Irreversible fungus:** Once introduced, the fungus cannot be removed within a trial, modeling the permanence of real agricultural contamination.
- **Locked parents:** Once the first cross is made, parent selections are locked for the remainder of that trial. Students must reset the trial to choose different parents.
- **Generation cap:** Each trial allows a maximum of 25 crosses to keep the investigation focused.
- **Generation rows:** Offspring are organized by generation (G1, G2, G3...) in the grid, making it easy to correlate with the line graph's x-axis.
- **Dual markers:** A blue dashed line appears in both the offspring grid and the line graph at the generation when fungus was introduced, reinforcing the connection between the two visualizations.

## Technical Details

The prototype is a single self-contained HTML file with no external dependencies -- all CSS, SVG assets, and JavaScript are inline. It runs entirely client-side with no server communication.

## Status

This is an interactive prototype, intended for educator review and feedback. It is not a production release.

---

*A [Concord Consortium](https://concord.org) prototype.*
