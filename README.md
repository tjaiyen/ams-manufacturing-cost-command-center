# AMS Manufacturing Cost Engineering Command Center

A standalone, purpose-built dashboard for one specific role — Senior Manufacturing Cost Engineer,
Amazon Manufacturing Services ([req 10512991](https://www.amazon.jobs/en/jobs/10512991/senior-manufacturing-cost-engineer-amazon-manufacturing-services)) —
not a general-purpose portfolio piece. Six live, interactive modules covering the job description's
own responsibility areas: should-cost modeling, machine-hour-rate formalization, standard-cost
variance decomposition, build-vs-buy/NPV, a multi-site executive rollup, and an honest operating
framework.

**Live:** deployed via GitHub Pages, served directly from `main` — pushing to `main` is the deploy,
same as this author's other command-center repos.

## Why a separate repo

This role is manufacturing cost engineering (should-cost, machine-hour rates, standard-cost
variance) — a genuinely different domain from
[`cost-management-command-center`](https://github.com/tjaiyen/cost-management-command-center)
(construction/QS cost management) and
[`project-controls-command-center`](https://github.com/tjaiyen/project-controls-command-center)
(capital-program EVM/schedule controls). Rather than bolt AMS-specific manufacturing-cost tooling
onto either of those, this is its own dedicated dashboard — same zero-dependency architecture and
verification discipline as the other two, different domain entirely.

## Zero dependencies, by design

Plain HTML/CSS/vanilla JS, one file, no build step, no framework, no external script or stylesheet
of any kind. Every calculation — should-cost decomposition, the six-way variance bridge, NPV/payback
— runs client-side in the functions defined in `index.html`'s own `<script>` block. The same
architectural stance as this author's other command-center repos: fewer moving parts, nothing to
build, nothing to break in transit.

## What's real, what's illustrative — read this before drawing any conclusion from the numbers

This is the single most important thing about this repo. **Every dollar figure, KPI reading, and
site rollup is a synthetic worked example** — invented to demonstrate the methodology the real job
posting asks for, not real Amazon Manufacturing Services data. The dashboard says this in a
persistent top banner, and the Methodology & Sourcing tab keeps an explicit source ledger tagging
every claim REAL (traces to the actual job posting or a cited public benchmark) or ILLUSTRATIVE
(invented for the exercise, editable by design).

**Where this idea came from, and what got deliberately left out:** two downloaded "research"
documents proposed increasingly elaborate visions for a dashboard like this — the second one
included a 20-issue "operational governance framework" for AMS complete with a RACI matrix naming
specific internal roles. Both documents share the same reliability problem: they claim AMS serves
"Project Kuiper, Amazon Robotics, and AWS data centers" as named internal clients (the real job
posting says none of this), and the second document's "1,520-test parity verification suite" figure
is copied verbatim from the first — two documents landing on an identical invented number is
evidence of copied origin, not independent corroboration. This dashboard keeps what's actually real
and useful from that lineage (the pillar taxonomy, the should-cost/MHR/variance mechanics, the
Amazon operating-cadence structure) and drops everything presented as fact about AMS specifically
that isn't — no named facilities, no RACI table, no client-program claims, none of the specific
invented dollar figures from either source document. The Methodology tab names this pattern
explicitly, once, specifically to reject it — `stress.cjs` enforces that these fabricated specifics
never leak in anywhere else on the page.

## The six modules

1. **Executive Overview** — a synthetic 3-site P&L rollup. The count of three sites is the real
   job posting's own stated scope; the site labels ("Site A/B/C"), locations beyond the two the
   posting names (Seattle, Bellevue), and every dollar/OEE figure are invented. OEE status bands are
   cited to real, sourced benchmarks (55–70% typical discrete manufacturing, 70–80% advanced, >80%
   world-class — [Fabrico 2026](https://www.fabrico.io/blog/oee-benchmarks-by-industry-manufacturing-2026/),
   [Symestic](https://www.symestic.com/en-us/blog/oee/oee-benchmarks)) applied to invented figures.
2. **Should-Cost & MHR Simulator** — a fully live bottom-up should-cost calculator (material with
   buy-to-fly/scrap-reclaim, machine conversion, labor, overhead) driven by an editable four-work-center
   rate card (CNC 3-Axis, CNC 5-Axis, Additive/DMLS, Sheet Metal), each with its own standing/running
   cost split — deliberately different invented numbers from either source document, not a copy.
3. **Variance Waterfall** — the real six-way standard-cost decomposition (MPV/MQV/DLRV/DLEV/VOSV/FOHV),
   fully interactive, rendered as a live CSS bar-chart waterfall.
4. **Build-vs-Buy / CapEx** — an NPV/payback analyzer generalizing the same methodology used in
   [`ams-narrative.html`](https://tjaiyen.github.io/cost-management-command-center/ams-narrative.html)'s
   worked example, with a year-by-year discounted cash-flow table.
5. **Operating Framework** — a dashboard-native condensation of
   [`ams-90day-plan.html`](https://tjaiyen.github.io/cost-management-command-center/ams-90day-plan.html)'s
   4-pillar thesis and operating cadence, explicitly framed as a hypothesis, not a claim about AMS.
6. **Methodology & Sourcing** — the source ledger described above.

## Verification (`stress.cjs`)

Same discipline as the sibling repos: stub the DOM, execute the page's *real* inline script via
`vm.runInContext` (not a parallel reimplementation that could hide the same bug twice), and assert
against exact numbers **independently verified live in a real browser before this file was written**:

- Should-cost defaults (CNC-3-Axis, batch 24, 3.8kg @ $16.50/kg, 1.35× buy-to-fly, 15% reclaim, 35min
  cycle + 40min/batch setup, $34/hr labor, 14% OH) → material $81.35 / machine $15.89 / labor $10.39 /
  overhead $15.07 / **total $122.70**.
- Variance defaults → MPV +$3,025 / MQV −$1,040 / DLRV +$1,350 / DLEV +$2,520 / VOSV +$430 / FOHV
  −$960 / **net +$5,325**.
- Build-vs-buy defaults ($95.78 internal vs. $186.00 external, 1,800 units/yr, $38K transition, 10%
  discount, 3yr) → unit saving $90.22 / annual saving $162,396 / payback 0.23 years / **NPV $365,855**.
- Rate-card table cells cross-checked against the live-computed `mhrFor()` for all four work centers.
- The fabricated-specifics guard (real find, not hypothetical): the Methodology tab's own debunking
  paragraph names "Kuiper"/"Robotics"/"1,520" specifically to reject them, which the guard's first
  version flagged as a false positive — fixed by excluding that one card by its unique heading before
  scanning the rest of the page for leakage, confirmed the exclusion is real (not a no-op) by
  asserting the excluded card actually contains at least one of the banned strings.

Run: `node stress.cjs` — 72 checks, all passing as of this writing.

## Status

Built 2026-09-04 in response to a direct request for a dedicated dashboard for this specific role
(a prior session had mistakenly added AMS-specific pages to `cost-management-command-center`
instead — corrected here as its own repo). Local commit only until pushed live with explicit
confirmation.
