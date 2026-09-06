# AMS Manufacturing Cost Engineering Command Center

A standalone, purpose-built dashboard for one specific role — Senior Manufacturing Cost Engineer,
Amazon Manufacturing Services ([req 10512991](https://www.amazon.jobs/en/jobs/10512991/senior-manufacturing-cost-engineer-amazon-manufacturing-services)) —
not a general-purpose portfolio piece. Twelve live, interactive modules covering the job description's
own responsibility areas: should-cost modeling, machine-hour-rate formalization (including a
first-principles MHR build-up calculator), standard-cost variance decomposition (plus a
forward-looking commodity price-exposure warning and an Ornstein-Uhlenbeck mean-reversion band),
build-vs-buy/NPV (plus a closed-form volume-crossover solver with a live SVG chart), capacity/
absorption forecasting, tooling amortization, design-for-cost sensitivity, data governance, a
30-scenario cost diagnostic playbook, a predictive/risk-modeling suite (learning-curve forecaster,
a Monte Carlo should-cost explorer, cost-adapted FMEA risk register, Manufacturing Value at Risk), a
multi-site executive rollup, and an honest operating framework. Click-to-open "Explain the Math"
modals (17 of them) cover the highest-traffic KPIs throughout, a Cmd/Ctrl+K command palette jumps
directly to any of the 21 indexed modules, and a **collapsible vertical side navigation** (real
WAI-ARIA Tabs pattern, roving tabindex, full arrow-key navigation) plus a genuine **High-Contrast
Mode** replace the original horizontal tab bar. See [`UX_ROADMAP.md`](UX_ROADMAP.md) for the fuller
30-idea UX brainstorm and backlog this round drew from.

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

**A second, deeper verification pass (2026-09-04)** checked four of the source documents' smaller
technical claims that hadn't been individually fact-checked before — and all four turned out to be
real, legitimate industry terminology, not fabricated: SMED (Single-Minute Exchange of Die, Shigeo
Shingo's real 1950s Toyota/Mazda changeover methodology), MTConnect/OPC-UA (genuine, actively-used
CNC telemetry protocols), aerospace titanium buy-to-fly ratios of 6:1+ (the real range is 6:1–20:1+,
average ~11:1, widened 2026-09-05 from an earlier 16:1+ estimate after a second independent research
pass — see the eleventh-round entry below), so the document's figure is conservative, not inflated,
and SAP Movement Type 551 (the actual SAP
transaction code for goods-issue-for-scrap). This is a more accurate picture than "the documents are
entirely fake": the generic manufacturing/SAP/lean-methodology vocabulary is legitimate public-domain
knowledge; what's fabricated is narrower and specific to *claims about AMS* — the client-program
claim, the RACI table, the copied test-count figure, and every dollar/percentage threshold, all of
which remain excluded. The Methodology tab now cites these four newly-verified real terms directly.

**A third verification round (2026-09-04, on a third downloaded document — a "SAP Automated
Guardrail Engine" proposal)** checked 34 specific SAP technical identifiers via a parallel-agent
workflow against live sources — transaction codes, tables, BAdIs, a user exit, and a BAPI. **32 of
34 checked out as real and correctly described**, including narrow, easy-to-invent identifiers like
BAdI `WORKORDER_CONFIRM` and User Exit `PPCO0007` (which even has a documented SAP bug report
against it — strong evidence it's a real, in-use enhancement spot, not fabricated). Two confirmed
real errors, not just imprecision: **"PP02" is not SAP's real rework order type** (the closer
convention is PP03, and order types are entirely client-configurable via OPJH/OPL8 regardless — no
code has SAP-enforced meaning), and **"tolerance key" blocking PO release conflates two distinct
real mechanisms** (invoice-blocking tolerance keys vs. the separate PO release-strategy price-
tolerance setting). Separately, the same document's Claude Code hook configuration invents a
`pre_tool_call` key — the real event name is `PreToolUse`, blocking via
`hookSpecificOutput.permissionDecision`, matching what this project's own sibling-repo tooling
already documents correctly. The "1,520 tests" figure and a satellite-program callback both appear
again, unchanged — same exclusion treatment as before. Net read: this document's generic SAP
scaffolding is meaningfully more accurate than the first two documents' invented specifics — the
fabrication remains narrow and specific to claims about AMS, not the underlying technical
vocabulary.

**A fourth verification round (2026-09-04, on a fourth downloaded document — a Claude-Code-as-
data-engineer architecture proposal)** found it mostly duplicative: the same `pre_tool_call` hooks
schema mistake as the third document (not a new error, the *identical* one — two documents making
the same specific mistake independently is effectively impossible; this is a shared template, not
independent authorship each time), the same unconfirmed named-client claim, and a forward-looking
overhead-absorption formula identical to the existing Capacity Forecast tab (nothing new built from
it). One genuinely real, new concept confirmed: **Bronze/Silver/Gold Medallion Architecture** is a
well-known, accurately-described [Databricks data-lakehouse pattern](https://www.databricks.com/blog/what-is-medallion-architecture).
One genuinely new addition: a **Commodity Price Exposure Early Warning** calculator, added to the
Variance Waterfall tab — the forward-looking cousin of the MPV line, using the document's own real
8% early-warning threshold on a spot-price shift against open purchasing volume.

**A fifth verification round (2026-09-04, on the largest document yet — a merged should-cost theory
+ 20-issue governance framework + SAP guardrail architecture + a 30-scenario diagnostic question
bank + a full alternative dashboard mockup)** found something the previous four rounds didn't:
cross-referencing its "MHR worked-example table" (a 5-axis CNC/DMLS/press-brake cost derivation)
against this repo's own `bannedStrings` fabrication guard showed it is **verbatim identical** to the
already-fabricated content in the *first* downloaded document — the same dollar figures to the
penny and the same three invented facility names. Two documents landing on identical, oddly specific
numbers is strong evidence of a shared template, not independent generation each time — the same
signature already seen in the "1,520 tests" figure and the Claude Code hooks schema error, both of
which reappear here unchanged. **"PP02" as SAP's rework order type is repeated a fourth time**, and
a deeper check now traces it more precisely: PP02 maps to external/subcontract processing in *both*
the control-key and order-type SAP namespaces; PP03 is the closer real convention. The claimed
Project Kuiper/Amazon Robotics/AWS-facility relationship is now confirmed fabricated with stronger
evidence — Amazon Robotics manufacturing is publicly documented in Massachusetts and Texas, not
Washington State at all. Eight other, narrower technical claims (new to this document) were checked
independently and came back mostly real: SAP field `MBEW-STPRS` (real), transaction `KP26` (real),
movement type `551` (real), `CO02`→TECO (real), `AMS-STD-2154` (real spec, slightly broader scope
than claimed), `ASTM F3049` (real, but a *Guide* not a *Test Method*), the DMG Mori "NMV5000" (real
machine, actual name is "NMV 5000 DCG"), and the EOS M400-4 (real, exact match). What *is* genuinely
new and worth keeping: a 30-scenario diagnostic question bank (operational symptom → variance
formula → dollar exposure → GL account → leadership action) whose arithmetic independently re-derives
cleanly — 29 of 30 to the penny, the cleanest math of any of the five documents. That bank is now the
**Cost Diagnostic Playbook** tab, with every question that depended on the copied/fabricated MHR
figures recomputed against this dashboard's own established rate card instead, and all named-client
references genericized. The document's own real MHR-derivation *formula* (not its copied numbers)
became the **MHR Build-Up Calculator** on the Should-Cost tab, and its "click a KPI for the formula"
mockup UX pattern became the **Explain-the-Math modal system** used across the dashboard. The
document's own full alternative dashboard mockup was not adopted — it duplicates what's already
live, in a different visual style, and bakes the fabricated "1,520 tests"/"SAP CONNECTED" claims
directly into static markup.

**A sixth/seventh verification round (2026-09-04, on two more downloaded documents — six predictive
mathematical models, and a Cost-FMEA/Value-at-Risk risk-management framework)** checked seven
specific quantitative/statistical claims independently. **Five came back fully correct:**
Wright's Cumulative-Average and Crawford's Unit learning-curve models (and the b = ln(φ)/ln(2)
exponent formula); the Ornstein-Uhlenbeck mean-reversion SDE and its conditional mean/variance
formulas (the same equation underlying the Vasicek interest-rate model); the Wiener-process-
degradation → Inverse Gaussian remaining-useful-life relationship (confirmed against published
cutting-tool-wear reliability papers); the Beta-PERT mean/σ approximation formulas; and the
one-tailed VaR Z-scores (1.645 / 2.326). **Two needed a closer look, not a copy-paste:** the
document's Manufacturing Value at Risk formula (M-VaRα = μ + Z·σ) looks backwards next to textbook
portfolio VaR, which subtracts Z·σ — but that convention exists because portfolio VaR works on a
*returns* distribution where a loss is negative. This document's variance metric is already signed
the opposite way (positive = unfavorable), so addition is actually the mathematically correct
operation for *this* metric — not an error to blindly "fix" against the wrong precedent, and not
something to blindly copy either without working out why. And Theil's Inequality Coefficient (the
formula given) is real and correctly bounded [0, 1], but the claim that a value of 1 means "as bad
as a naive forecast" belongs to a different, unrelated formula (Theil's U2); U1 (the one actually
given) is a documented poor discriminator of forecast quality and wasn't built here as a result.
Separately, **"Cost-FMEA" and "CRPN" are not established named frameworks** — the underlying
practice (classic FMEA's Probability × Severity × Detection Risk Priority Number, with dollar-banded
severity) is real and has precedent under other names (Cost-Based FMEA, ERPN), but that specific
branding is the source document's own, labeled as such on the dashboard rather than implied as a
citable standard. The risk register's 10 CRPN scores (P × S × D) all reproduce exactly by hand. One
worked example (a learning-curve labor-cost forecast) had a genuine, if small, arithmetic slip
(~0.4%, ~$13 on a $3,346 figure) — recomputed correctly for the dashboard rather than copied. The
"1,520 test fixtures" figure and the unconfirmed Project Kuiper/Amazon Robotics/AWS client
relationship both appeared again — same exclusion treatment, and every reference was genericized in
the built modules.

**An eighth verification round (2026-09-04)** reviewed a document proposing "Claude Code deployed
inside AMS with live SAP RFC/BAPI write access" — the same theme that had already appeared, in
whole or in part, four times before. Same call as every prior time: that's a claim about live system
access, not a calculator, and it stays out of the dashboard. Two new SAP BAPI names checked out real
(`BAPI_ROUTING_CREATE`, `BAPI_MATERIAL_BOM_GROUP_CREATE`). One concrete finding: the document's own
build-vs-buy solver script, run with its own stated example numbers extended to one million units,
**never finds a crossover** — internal stays more expensive at every volume the model was run
against, despite the document presenting it as a working example. What the document did point at,
independently of its broken example, was real: the existing Build-vs-Buy tab evaluated NPV/payback
at one assumed volume but never asked at what volume the recommendation itself would flip. The new
**Volume Crossover Point (Q\*)** calculator answers that using the cleaner, closed-form
marginal-cost-equality model from the sixth document's "Model 6" instead of the eighth document's
broken total-cost integral. Same recurring pattern reconfirmed: "1,520 tests" and the Kuiper/
Robotics/AWS client claim both appear again.

**A ninth verification round (2026-09-04)** reviewed a document proposing 30 UX/UI features for a
much more elaborate version of this dashboard — WebGL 3D viewports, particle animations, an
oscilloscope-style live sensor stream, an isometric plant-floor twin, drag-and-drop kanban,
gamification with celebratory particle effects, sound cues. This is a design-fit question, not a
factual one — the useful check was against this repo's own established architecture (zero
dependencies, no fabricated telemetry, a restrained professional tone) rather than a fact-check.
Most of the 30 don't fit: either real 3D/WebGL engineering effort disproportionate to the payoff, or
fabricated telemetry data to animate (there's no real sensor stream behind this page), or a shift in
tone this exercise doesn't want. One proposal (a "Solution Action Dispatcher") suggested drafting a
real **"SAP Rework Order PP02"** — the same confirmed-wrong claim from the third document, now
proposed as something to actually dispatch. Another (a "Parity Proof Heartbeat Widget") proposed
displaying **"1,520 Parity Tests Passing"** as a persistent header badge — the fabricated figure,
live and prominent, a second time. Four proposals were a genuinely good fit — feasible in plain
JS/CSS/SVG, no fabricated data required — and are now built: a **Universal Command Palette**
(⌘K/Ctrl+K quick navigation across all 21 indexed modules), a **Build-vs-Buy Crossover chart** (a
real SVG line-chart visualization of the Q\* solver, the first chart of its kind on this page since
a continuous curve doesn't fit the existing bar-chart pattern), a **Monte Carlo Should-Cost
Explorer** (5,000 simulated trials via a seeded, reproducible PRNG rather than the source document's
LogNormal/Beta-PERT machinery — an illustrative heuristic, like the DFM/DFC tab), and the **honest
version** of the heartbeat-widget idea — a header badge showing this repo's real, current
`stress.cjs` pass count instead of the fabricated one.

**A tenth round (2026-09-05)** was a direct request from TJ, not a downloaded document — a
three-phase UX/UI overhaul brief (30 ideas across interactivity, onboarding, accessibility, and
gamification; a vertical-nav redesign; an implementation plan with production code). Two things
were flagged once and then respected, not re-litigated: this dashboard's audience is a hiring panel,
not end-users to "engage," and the request's own "our"/"we" phrasing read like a team-product brief
more than this specific piece — TJ confirmed AMS as the target anyway. Built: a full **vertical,
collapsible side navigation** (real WAI-ARIA Tabs pattern — roving tabindex, arrow-key/Home/End
navigation, `aria-orientation="vertical"`, hand-drawn inline SVG icons, collapsed-mode tooltips, a
responsive floor for narrow screens) replacing the horizontal tab bar, and a genuine **High-Contrast
Mode** (an independent accessibility layer over the existing theme, not a third full palette). The
full 30-idea brainstorm and P0/P1/P2 backlog are in [`UX_ROADMAP.md`](UX_ROADMAP.md) rather than
built wholesale — most of the 30 carry the same 3D/WebGL/gamification-vs.-restrained-tone tension
already resolved in the ninth round, so they're recorded as considered options. Building the nav
also surfaced and fixed a real gap in this repo's own test harness: `stress.cjs`'s DOM stub wasn't
seeding static HTML attributes (like `data-tab`) onto elements it created via `querySelectorAll`,
so the very keyboard-nav checks written to test the new nav caught it first — see `stress.cjs`.

## The twelve modules

1. **Executive Overview** — a synthetic 3-site P&L rollup. The count of three sites is the real
   job posting's own stated scope; the site labels ("Site A/B/C"), locations beyond the two the
   posting names (Seattle, Bellevue), and every dollar/OEE figure are invented. OEE status bands are
   cited to real, sourced benchmarks (55–70% typical discrete manufacturing, 70–80% advanced, >80%
   world-class — [Fabrico 2026](https://www.fabrico.io/blog/oee-benchmarks-by-industry-manufacturing-2026/),
   [Symestic](https://www.symestic.com/en-us/blog/oee/oee-benchmarks)) applied to invented figures.
2. **Should-Cost & MHR Simulator** — a fully live bottom-up should-cost calculator (material with
   buy-to-fly/scrap-reclaim, machine conversion, labor, overhead) driven by an editable four-work-center
   rate card (CNC 3-Axis, CNC 5-Axis, Additive/DMLS, Sheet Metal), each with its own standing/running
   cost split — deliberately different invented numbers from either source document, not a copy. Also
   includes an **MHR Build-Up Calculator**: the same standing/running rate card, derived live from
   first principles (capital depreciation + floor allocation + service contract, spread over
   scheduled hours × OEE, plus power + consumables) — fresh illustrative inputs, not the fifth
   document's copied-from-document-one figures. Also a **Monte Carlo Should-Cost Explorer**: 5,000
   simulated trials over material/conversion cost variation, reporting P50/P80/P95 percentiles via a
   deterministically seeded PRNG (mulberry32, not `Math.random()`) so the same inputs always
   reproduce the same result — should-cost as a distribution, not a point estimate.
3. **Variance Waterfall** — a six-item standard-cost variance decomposition (MPV/MQV/DLRV/DLEV/VOSV/FOVV;
   individually-real formulas, deliberately simplified from the complete 8-variance textbook model —
   see the Source Ledger),
   fully interactive, rendered as a live CSS bar-chart waterfall, plus a **Commodity Price Exposure
   Early Warning** calculator — the forward-looking cousin of the MPV line (spot-price shift vs.
   open purchasing volume → projected dollar exposure, flagged at a real 8% threshold) — and a
   **Mean-Reversion Forward Band** (Ornstein-Uhlenbeck): where the spot price is actually expected
   to drift back to, and a two-sided 95% confidence band around that forecast.
4. **Build-vs-Buy / CapEx** — an NPV/payback analyzer generalizing the same methodology used in
   [`ams-narrative.html`](https://tjaiyen.github.io/cost-management-command-center/ams-narrative.html)'s
   worked example, with a year-by-year discounted cash-flow table. Plus a **Volume Crossover Point
   (Q\*)** solver — the NPV analyzer answers "is this a good deal at my assumed volume"; this answers
   "at what volume does the vendor's falling per-unit price actually beat my own cost," a closed-form
   marginal-cost-equality model, not a copy of the eighth downloaded document's broken total-cost
   script (see Methodology tab). Includes a live SVG line chart plotting the vendor's price curve
   against the internal-cost line with the crossover marked — the first chart on this page built
   from a continuous curve rather than discrete bars.
5. **Capacity & Absorption Forecast** — a 6-week rolling capacity plan (from Issue 11's "predict
   unabsorbed overhead 30-60 days in advance" idea) — fully editable available/booked hours per week,
   live unabsorbed-hours/dollars/utilization, green/amber/red banding distinct from the Executive
   tab's OEE bands (this measures hours booked vs. available, not performance/quality losses).
6. **Tooling Amortization Tracker** — from Issue 17: makes visible the exact distortion of expensing
   a reusable fixture against only the first prototype batch (a naive/amortized comparison, with an
   overstatement multiple).
7. **Design-for-Cost Sensitivity** — from Issue 19's DFM/DFC feedback-loop idea, as a live slider-driven
   heuristic (wall thickness, pocket depth:diameter ratio, additive build height) — explicitly labeled
   an illustrative heuristic, not a physics-based cost simulation.
8. **Data Governance** — from a third downloaded document's "SAP Automated Guardrail Engine" concept:
   a live Master Data Quality Scorecard (the document's own weighted formula — 30% routing errors +
   30% confirmation variances + 25% unlinked scrap + 15% stale standards, banded green/amber/red at
   its own stated thresholds) and a Guardrail Gate Simulator (BOM mass-discrepancy, PO price-variance,
   and confirmation-hours-variance gates against the document's own stated thresholds, showing live
   PASS/BLOCKED status). Real, well-defined formulas — not a claim that AMS's actual SAP instance
   enforces exactly these numbers.
9. **Cost Diagnostic Playbook** — 30 rehearsed diagnostic scenarios across 6 domains (material
   economics, CNC conversion, additive physics, labor routing, overhead absorption, quoting/build-
   vs-buy/transfer pricing), each showing an operational symptom, the root-cause pattern, the real
   variance formula, a worked illustrative dollar exposure, a GL-account mapping, and the leadership
   action — filterable by domain and searchable. Ported from the fifth downloaded document's
   Section 7 (independently re-derived arithmetic; see Verification below).
10. **Predictive & Risk Models** — three independently-verified quantitative/stochastic models from
   the sixth/seventh downloaded documents:
   - **Learning Curve Forecaster** — Wright's/Crawford's power-law model (Y = a·x^b) projecting
     cumulative direct labor hours/cost as production ramps, and quantifying the exact "fake
     favorable variance" a stale Unit-1 standard would otherwise generate.
   - **Cost Risk Register (CRPN)** — 10 illustrative failure modes scored Probability × Severity ×
     Detection (classic FMEA math, re-labeled — see Methodology tab for the naming caveat), plus an
     interactive "score your own risk" calculator against the source document's own ≥25 escalation
     threshold.
   - **Manufacturing Value at Risk (M-VaR)** — a one-sided upper confidence bound on total
     unfavorable cost variance at 95%/99% confidence, with the sign-convention nuance worked through
     explicitly rather than either copied or "corrected" against the wrong precedent.
11. **Operating Framework** — a dashboard-native condensation of
   [`ams-90day-plan.html`](https://tjaiyen.github.io/cost-management-command-center/ams-90day-plan.html)'s
   4-pillar thesis and operating cadence, explicitly framed as a hypothesis, not a claim about AMS.
12. **Methodology & Sourcing** — the source ledger described above.

**Cross-cutting:** a **Universal Command Palette** (⌘K / Ctrl+K, or the "Quick Jump" header button)
indexes all 12 tabs plus 9 specific modules within them — type to filter, arrow keys to navigate,
Enter to jump straight there. And a header **verify badge** states this repo's real, current
`stress.cjs` pass count — the honest version of an idea a downloaded document proposed with a
fabricated "1,520" figure instead (see Methodology tab).

## Verification (`stress.cjs`)

Same discipline as the sibling repos: stub the DOM, execute the page's *real* inline script via
`vm.runInContext` (not a parallel reimplementation that could hide the same bug twice), and assert
against exact numbers **independently verified live in a real browser before this file was written**:

- Should-cost defaults (CNC-3-Axis, batch 24, 3.8kg @ $16.50/kg, 1.35× buy-to-fly, 15% reclaim, 35min
  cycle + 40min/batch setup, $34/hr labor, 14% OH, CNC-3-Axis MHR $24.00/hr) → material $81.35 /
  machine $14.67 / labor $10.39 / overhead $14.90 / **total $121.31**. (CNC-3/5-Axis rate-card MHR
  nudged from $26.00/$46.00 to $24.00/$42.00 on 2026-09-04 — a stress-test found the originals sat
  2.2%/3.9% from specific fabricated MHR figures in two of the downloaded documents; every dependent
  golden value re-derived and re-verified live in-browser after the change.)
- Variance defaults → MPV +$3,025 / MQV −$1,040 / DLRV +$1,350 / DLEV +$2,520 / VOSV +$430 / FOVV
  −$960 / **net +$5,325**.
- Build-vs-buy defaults ($95.78 internal vs. $186.00 external, 1,800 units/yr, $38K transition, 10%
  discount, 3yr) → unit saving $90.22 / annual saving $162,396 / payback 0.23 years / **NPV $365,855**.
- Rate-card table cells cross-checked against the live-computed `mhrFor()` for all four work centers.
- The fabricated-specifics guard (real find, not hypothetical): the Methodology tab's own debunking
  paragraph names "Kuiper"/"Robotics"/"1,520" specifically to reject them, which the guard's first
  version flagged as a false positive — fixed by excluding that one card by its unique heading before
  scanning the rest of the page for leakage, confirmed the exclusion is real (not a no-op) by
  asserting the excluded card actually contains at least one of the banned strings.
- Capacity Forecast defaults (6 weeks x 160 available hrs, booked 150/140/100/90/155/120, $28/hr OH)
  → Week 3: 60 unabsorbed hrs / $1,680 / 62.5% utilization / **RED**; 6-week total: $5,740 unabsorbed /
  78.65% overall utilization / **AMBER**. The harness's seeded inputs are cross-checked against the
  page's own `CAP_WEEKS` array so they can't silently drift apart.
- Tooling Amortization defaults ($18,000 tooling, 2,400-unit run, 24-unit first batch) → $7.50/unit
  amortized vs. $750.00/unit naive-first-batch-only → **100.0× overstatement**.
- DFM/DFC defaults (1.5mm wall, 5:1 pocket ratio, 80mm build height) → wall +24.0% / pocket +5.0% /
  height +24.0% / **total +53.0%** / estimated cost **$153.00** on a $100 reference part.
- MDQS defaults (6/300 routing errors, 15/500 confirmation variances, 4/80 unlinked scrap, 10/400
  stale standards) → **96.875%**, correctly banded **AMBER** (93–98%).
- Guardrail Gate Simulator defaults (8% BOM discrepancy vs. 15% threshold, 7% PO variance vs. 5%,
  12% confirmation variance vs. 15%) → BOM **PASS**, PO **BLOCKED**, Confirmation **PASS**.
- A second confirmed-wrong-claims guard ("PP02" as rework, "pre_tool_call" as a hook key) — same
  exclusion pattern as the fabrication guard above, and same discipline: a genuine bug was found and
  fixed while adding it (a second debunk card also legitimately mentions "1,520," which the original
  single-card exclusion didn't cover, false-positiving until both cards were excluded together) —
  reproduced, fixed, then confirmed the new guard actually fails when "PP02" is reintroduced outside
  both cards, before confirming it passes clean.
- Commodity Price Exposure defaults ($26.00 frozen, $29.50 spot, 2,200kg open volume) → **13.46%**
  shift, **+$7,700** projected exposure, correctly flagged **WARNING** (>8% threshold).

- Executive Overview P&L table arithmetic (added 2026-09-04, closing a real gap — no check existed
  for this table before): rollup std/act COGS are the real sum of all three sites, Site C's own
  variance equals its own act-minus-std, and Site C's invented standard COGS ($1,150,000, nudged
  from $1,105,000) is confirmed >2% away from the specific fabricated figure ($1,100,000) it
  previously sat only 0.45% from.
- MHR Build-Up Calculator defaults ($580,000 capital, 7yr life, 320 sq ft @ $38/sq ft, $22,000
  service, 3,800 scheduled hrs @ 78% OEE, 20kW @ $0.12/kWh, $11.75 consumables) — pre-registered by
  hand/Python before being written, then confirmed live in-browser — → depreciation $82,857 / floor
  allocation $12,160 / standing basis $117,017 / 2,964 productive hrs / standing rate $39.48/hr /
  running rate $14.15/hr / **fully burdened MHR $53.63/hr**.
- Cost Diagnostic Playbook: structural checks (exactly 30 scenarios, unique codes/numbers, 5 per
  domain across all 6 domains, every field non-empty) plus a fabrication-guard sweep of the playbook
  data itself — the exact seam where the fifth document's copied MHR figures would have leaked in
  if the by-hand recompute had been missed. Filter/search behavior exercised by mutating the
  harness's own stub elements and re-invoking the real `renderPlaybook()`: all-domains shows 30,
  filtering to "additive" shows exactly 5, searching "buy-to-fly" narrows to exactly 1, clearing the
  search restores 30.
- Explain-the-Math modal: `EXPLAIN` data object has a title/formula/body for all 16 keyed formulas,
  exactly 17 explain buttons are wired in the HTML, `openExplain` is exposed for the harness to call.
- Learning Curve Forecaster defaults (6.0hr first article, 80% learning rate, units 21–60, $45.00/hr)
  → b = **−0.3219** / total hours **74.64** / avg unit time **1.87 hrs** / total cost **$3,358.59**
  (independently re-derived — NOT the source document's own $3,345.75, a real ~0.4% arithmetic slip
  in their worked example) / static-standard distortion **−$7,441** correctly labeled fake-favorable.
- Cost Risk Register: all 10 CRPN scores (P×S×D) cross-checked against hand-verified products;
  exactly 6 of 10 correctly banded ESCALATE at the source document's own ≥25 threshold. Risk Scorer
  default (P=3, S=3, D=3) → CRPN **27**, ESCALATE.
- Manufacturing Value at Risk defaults (μ=$8,500, σ=$6,200) → 95%: Z=1.645, **M-VaR $18,699.00**;
  switching to 99%: Z=2.326, **M-VaR $22,921.20** — exercised live via the harness's own
  `calcMVaR()`, not hardcoded.
- Mean-Reversion Forward Band defaults (P̄=$27.00, θ=0.15/mo, σ=$3.50, Δt=1mo, off the existing
  $29.50 spot default) → expected **$29.15** / std. dev **$3.25** / 95% two-sided band
  **$22.78 – $35.53**.
- Fabrication guard extended to the Risk Register data (same seam the fifth document's copied MHR
  figures would have leaked through if the recompute had been missed) — clean.
- Volume Crossover Point defaults ($180.00 internal marginal cost, $420.00 vendor price at Q=1,
  γ=0.12) → **Q\* = 1,165 units**, with the vendor price at Q\* independently confirmed to equal the
  internal marginal cost input exactly ($180.00) — proof the crossover is real, not a copy of the
  eighth downloaded document's own worked example, which was independently re-run (extended to one
  million units) and never finds a crossover at all.
- Build-vs-Buy Crossover chart: the same pixel-math (Q\*, axis scaling, marker position) pre-
  registered via Python/Node before being written, cross-checked against the calculator's own Q\*
  (not a second, potentially-divergent implementation), and confirmed the rendered SVG actually
  contains a `<svg>` element and the correct "Q\* = 1,165" label.
- Monte Carlo Should-Cost Explorer defaults ($85.00 material ±15%, $65.00 conversion ±20%, seed 42,
  5,000 trials) → **P50 $149.88 / P80 $159.28 / P95 $167.33**, range $125.32–$175.60 — and calling
  the real `calcMonteCarlo()` twice in a row reproduces an identical result, confirmed live (proof
  it's a seeded, deterministic PRNG, not unseeded `Math.random()`).
- Universal Command Palette: exactly 21 unique, unique-labeled entries, every one pointing at a real
  tab id; empty-query search returns all 21, searching "learning" narrows to exactly 1, exactly 4
  entries route to the Predictive & Risk Models tab. Exercised live in a real browser too: Ctrl+K
  opens it, filtering + clicking an item switches tabs and closes the palette.
- Verify badge: the header's two numbers are checked for self-consistency (100% claimed, not a
  partial count), and confirmed not to contain the recurring fabricated "1,520" figure.
- Vertical side navigation: structural checks (12 side-nav items, 12 `role="tabpanel"` panels, real
  ARIA vertical tablist, collapse toggle with `aria-expanded`, 12+ collapsed-mode tooltips) plus
  **behavioral** checks against the real `activateTab()` and keyboard-nav code — not a
  reimplementation: activating a tab flips the right `aria-selected`/roving-`tabindex` pairs and
  panel visibility; ArrowDown/ArrowUp/Home/End on the real tablist move selection correctly,
  including wraparound. Exercised live in a real browser too (Ctrl+K, arrow keys, collapse toggle,
  High-Contrast toggle all confirmed working end-to-end).
- High-Contrast Mode: clicking the toggle actually sets `data-contrast="true"` on the document root
  (the attribute the CSS overrides key off) and flips `aria-pressed`, confirmed both in the stub and
  live in-browser.
- This round's DOM-stub upgrade (real `getAttribute`/`setAttribute`/`classList` tracking, plus
  selector-aware `querySelectorAll` for the two selectors the nav actually uses) surfaced a genuine
  bug in the *first version of the upgrade itself*: static HTML attributes like `data-tab` weren't
  seeded onto stub elements created via `querySelectorAll`, so the nav's own attribute-comparison
  logic silently saw `null` — caught by the very checks written to verify it, fixed the same session
  (see `stress.cjs`'s `makeNavTab` helper and its comment).

Run: `node stress.cjs` — 582 checks, all passing as of this writing.

## Status

Built 2026-09-04 in response to a direct request for a dedicated dashboard for this specific role
(a prior session had mistakenly added AMS-specific pages to `cost-management-command-center`
instead — corrected here as its own repo). **Live and public** — pushed to `origin/main` with
explicit confirmation at each step (initial build, then three follow-on rounds of verification and
new modules), each push confirmed actually serving the new content before being reported as done.

**Fixed 2026-09-04 (stress-test pass):** this section previously read "Local commit only until
pushed live with explicit confirmation" — stale from the initial build, left un-updated across three
subsequent pushes. An independent reviewer caught the resulting self-contradiction against this
same file's own opening "Live: deployed via GitHub Pages" line. Fixed here, along with the opening
paragraph's stale "Six... modules" (grew to ten across those same three rounds without the intro
being updated).

**2026-09-04, fifth round:** added the Cost Diagnostic Playbook tab, the MHR Build-Up Calculator,
and the Explain-the-Math modal system (11 modules total, up from ten) — pushed live.

**2026-09-04, sixth round:** added the Predictive & Risk Models tab (Learning Curve Forecaster, Cost
Risk Register/CRPN, Manufacturing Value at Risk) and a Mean-Reversion Forward Band on the Variance
tab (12 modules total, up from eleven) — pushed live.

**2026-09-04, seventh round:** added the Volume Crossover Point (Q*) solver to the Build-vs-Buy tab
(still 12 modules — a new card on an existing tab, not a new tab) — pushed live.

**2026-09-04, eighth round:** added a Build-vs-Buy Crossover chart, a Monte Carlo Should-Cost
Explorer, a Universal Command Palette (⌘K), and an honest stress-test-count header badge (still 12
modules — all new cards/cross-cutting features on existing tabs) — pushed live.

**2026-09-05, ninth round:** replaced the horizontal tab bar with a full vertical, collapsible,
ARIA-compliant side navigation and added a High-Contrast Mode toggle, per a direct three-phase UX
overhaul request (still 12 modules — a navigation/shell change, not a new module). Wrote
`UX_ROADMAP.md` for the accompanying 30-idea brainstorm and backlog. Fixed a real bug in this
repo's own test-harness stub along the way (see Verification above) — pushed live.

**2026-09-05, tenth round (stress-test of the ninth round):** the navigation overhaul above was the
most consequential interaction change on this page, so it got a dedicated adversarial review —
independent self-review plus a fresh-context reviewer, every finding empirically reproduced, every
fix re-verified rather than re-asserted. Fixed: the `.grid` responsive tracks forcing horizontal
overflow below their own `minmax()` floor (real, reproduced at 375px); 15 controls (12 nav items + 3
footer controls) with no real accessible name in collapsed mode; the collapse toggle silently lying
about its own state below the CSS's 760px hard floor; neither modal moving focus in, trapping Tab,
or restoring focus on close; a stale tally in `UX_ROADMAP.md` and a stale formula/button count in
this file (both self-contradicted an already-correct number elsewhere in the same file); two dead
CSS rules; missing ARIA combobox/listbox semantics on the Command Palette; and no
`prefers-reduced-motion` support. One item (touch-device discoverability of collapsed-nav tooltips)
was judged moderate, not broken, and is an accepted limitation rather than a fix. Two more surfaced
while re-verifying the others: a long inline `<code>` identifier on the Methodology tab still
overflowed at 375px after the grid fix (fixed with `overflow-wrap:anywhere`), and swapping directly
from one modal to another stranded the return-focus target on the first modal's own control instead
of the real pre-modal trigger (fixed in `openModal`). This repo's DOM-stub test harness was also
upgraded to actually exercise focus tracking and a controllable `matchMedia` mock, closing two
real testing gaps rather than accepting them as permanent limitations. Checks: 357 → 400. Pushed live.

**2026-09-05, eleventh round (KPI research pass on the Cost Diagnostic Playbook):** all 30 Playbook
KPIs were cross-checked against published industry evidence via 7 independent research passes (6
KPI-domain clusters + one on dashboard-visualization practice), each requiring ≥2 corroborating
sources and a disconfirming search before accepting a figure. Headline finding: the underlying
concepts are overwhelmingly real, named disciplines (standard-costing variance analysis, MHR
costing, TPM/OEE, SMED, Activity-Based Costing, should-cost modeling, GAAP units-of-production
depreciation) but the specific green/amber/red numeric thresholds are, with two exceptions,
internal calibrations with no traceable external benchmark — stated explicitly now in a new
Methodology-tab card rather than left implied. One confirmed miscalibration, fixed: the Buy-to-Fly
/ Swarf-to-Solid Ratio's original ≤4.0:1 green ceiling sat below every published aerospace-titanium
range found (real range 6:1–20:1+, average ~11:1) — widened to ≤10.0:1/10.1–16.0:1/&gt;16.0:1, and an
earlier, narrower 16:1+ estimate elsewhere on the Methodology tab was reconciled to match. Also
shipped: the 30 Playbook cards' three separate threshold badges were consolidated into one compact
banded scale per card (a bullet-graph-inspired visual consolidation, without fabricating a
per-scenario numeric needle position across 30 heterogeneous units); and a small Pareto chart was
added for the three scrap/quality-adjacent scenarios (Defect Sunk Scrap Cost Drag, Build Failure
Amortization Factor, Rework Conversion Surcharge), built entirely from real, already-computed
dollar figures already on the page — Pareto charts are the established ASQ/Juran tool for exactly
this root-cause-prioritization question. Full findings filed in the vault, dated 2026-09-05. Checks:
400 → 420. Pushed live.

**2026-09-05, twelfth round (Pathways B and C from the same research):** the research above also
found that SPC/control-chart literature treats a fixed specification-limit band (policy) and a
statistically-derived control-limit band (this shop's own historical variation) as two different
things — conflating them is a documented anti-pattern — and that real standard-cost variance
requires posted, settled transactions, so a "real-time cost variance" claim should be treated
skeptically even from an ERP vendor. Both findings are now visible on the page, not just documented.
**Pathway B:** the Variance Waterfall was rewritten from a grouped bar chart (every bar floating
from a shared zero) into a genuine cascading bridge chart — each bar now starts where the running
cumulative total left off, the defining visual feature of a bridge vs. a bar chart — and carries a
new "financial cadence" badge. The Capacity tab gained a real Individuals (I) control chart on its
existing 6-week utilization data (center line + control limits via the standard I-MR method, no
fabricated history) and an "operational cadence" badge; with only 6 points the limits are wide (a
real small-sample artifact, stated on the card), and neither Week 3 nor Week 4's fixed-band "RED"
reading is actually outside those limits — a concrete illustration of the distinction the research
flagged. The old `.wf-col`/`.wf-value`/`.wf-label`/`.wf-bar` grouped-bar-chart CSS was removed, not
left as dead code alongside the new SVG chart. **Pathway C:** a small KPI Interaction Map was added
to the Playbook tab, visualizing the two (of three) confirmed cross-KPI tradeoffs from the research
that pair cleanly onto two existing Playbook scenarios each (recoater time vs. post-processing
labor; powder reuse vs. build-failure risk) — each box is clickable/keyboard-activatable and jumps
straight to that scenario's card. The third tradeoff (nesting yield vs. cycle time) has no second
Playbook KPI to pair against, so it's a caption, not a forced third box. Checks: 420 → 462, all
pre-registered before being written and live-browser verified (the bridge chart's cascading bar
boundaries genuinely align edge-to-edge; the SPC chart's rendered UCL/mean/LCL match the
hand-calculated golden values; both KPI Interaction Map tradeoff pairs jump and scroll correctly via
both mouse and keyboard). Pushed live.

**2026-09-05, thirteenth round (stress-test of Pathways A/B/C):** independent self-review plus a
fresh-context reviewer, every finding reproduced (grep line numbers, re-derived math) before being
accepted. The most serious catch: the Buy-to-Fly scenario's own worked example (a part's 4:1
engineering release limit, exceeded at 8.1:1) now sat inside the eleventh round's own widened
"GREEN ≤10.0:1" fleet-wide band — a real, reproduced self-contradiction between two numbers on the
same card, not a stylistic nit — fixed with a clarifying sentence distinguishing a part's own
release limit from the general industry-average-anchored band. Also fixed: the KPI Interaction
Map's outer `<svg role="img">` wrapped real interactive `role="button"` children, a documented ARIA
anti-pattern that hides nested controls from the accessibility tree — changed to `role="group"`;
clicking a map node moved keyboard focus to the sidenav tab button while the page visually scrolled
to a card far below, decoupling focus from what's on screen — fixed by moving focus onto the target
card itself after scrolling; the Variance tab's copy used "live" for two different meanings in one
paragraph (this calculator's instant recalculation vs. real standard-cost variance's period-close
cadence) — reworded to separate them explicitly; a grammar typo in the SPC chart's own
screen-reader label; and two `stress.cjs` checks that asserted a hardcoded constant equaled itself,
passing regardless of whether the underlying cascade math actually worked — replaced with a check
on the rendered SVG's own geometry, a different code path than the data model the existing checks
already covered. Two items documented as accepted limitations rather than fixed: SVG chart text
(pre-existing on the Q* chart, now on 4 more charts) renders small — roughly 5-7px — at a ~375px
phone width; bumped every chart's smallest font size for a modest improvement, but a full
viewport-aware redesign is out of scope. And a minor UX side-effect where clicking a map node while
already on the Playbook tab with an active filter silently resets that filter (necessary so the
target card is guaranteed to exist before scrolling to it). Checks: 462 → 475. Committed locally —
pending push with explicit confirmation, same discipline as every prior round.

**2026-09-05, fourteenth round (org verification + terminology calibration):** 4 parallel independent
research passes fact-checked the should-cost/MHR/variance methodology, the physical-manufacturing-tech
claims, the stochastic forecasting models, and — adversarially — AMS as an organization, against live
`amazon.jobs` postings. Real finding: **req 10512991's own charter is now cited directly** ("build,
from scratch, the automated systems and analytical infrastructure that define how AMS understands,
reports, and defends its manufacturing cost position"), and a companion posting (req 10449430)
confirmed AMS's real scale (135+ machines, 100+ orgs served) and real enterprise stack (SAP S/4HANA,
JobBoss, Siemens Teamcenter, Dot Compliance) — added as a new Role Alignment card on the Executive
Overview tab, framed with an explicit honest-gap note (these are systems studied, not operated).
Terminology fixes: renamed **FOHV → FOVV** (Fixed Overhead Volume Variance) — the cost-accounting
literature more commonly reserves "FOHV" for the combined spending+volume figure, and FOVV is the
less-ambiguous abbreviation for what this calculator actually computes; relabeled the MHR Build-Up
Calculator's "standing/running cost" language (real, but CIMA/Indian cost-accounting-tradition
vocabulary, not native to US GAAP/CMA) to "fixed OH allocation / variable operating cost," with the
original terminology kept as an explanatory footnote rather than deleted; and made the Source Ledger
explicit that the six-way variance bundle (MPV/MQV/DLRV/DLEV/VOSV/FOVV) is a deliberate simplification
of the complete 8-variance textbook model, not itself a named standard. Also closed a real, honestly-
flagged gap in this file's own Methodology tab: "Markov capacity states" — one of six models an
earlier-reviewed document proposed — had been left unchecked; the new research confirmed the exact
compound phrase is unattested anywhere in the literature, while the real underlying technique (a
Markov chain model of equipment availability/reliability) is genuine under its own, different name —
noted, not built. Not touched, because independent re-verification found the existing content already
correct: the buy-to-fly 6:1–20:1+ range (already wider/better-sourced than this round's own findings),
the Ornstein-Uhlenbeck mean-reversion model (already correctly described; added an optional Schwartz
(1997) citation for extra precision), and the power-law Build-vs-Buy Volume Crossover (Q\*) calculator
— this models a specific, real vendor-pricing scenario (price falling as a power function of volume),
correctly labeled as such; "linearizing" it per this round's own initial instinct would have made a
correct, already-honest label wrong. Checks: 475 → 486. Committed locally — pending push with explicit
confirmation, same discipline as every prior round.

**2026-09-05, fifteenth round (8 curated navigation features, from a 30-pattern nav-design
brainstorm):** a 30-feature "next-gen navigation" brainstorm (spatial wayfinding, power-user speed,
micro-interaction, and inclusivity patterns) was generated as a general design exercise, then
curated down to 8 for this specific dashboard — most of the other 22 patterns assume a canvas,
multi-pane, or deep-hierarchy app, which this isn't (a single-view, 12-tab flat calculator), and 3
were dropped as duplicative of infrastructure already built earlier this session (the collapsible
density-adaptive rail, the Cmd/Ctrl+K command palette, the KPI Interaction Map's cross-tab `jump()`
links). Built, in order of the original brainstorm's categories:
- **Session Reload Memory** — the last-active tab now survives a hard reload (`localStorage`, same
  pattern as theme/contrast/nav-collapsed).
- **Spatial Bookmarks** — a "Saved Scenarios" panel in the sidenav footer captures the active tab +
  every input/select value on it, named and restorable later; generic across all 12 tabs (no
  per-tab special-casing).
- **Keyboard Chord Navigation** — `g` then a mnemonic letter (`g s` → Should-Cost, `g v` → Variance,
  etc.) jumps directly to any of the 12 tabs, Gmail-style, with an on-screen hint overlay.
- **Recency-Based Tab Stepper** — `Ctrl/Cmd+Shift+[` and `]` cycle tabs in most-recently-visited
  order rather than DOM order (Ctrl/Cmd+Tab itself is reserved by every major browser for its own
  tab-cycling and never reaches page JS, so this uses an unclaimed combo instead).
- **Ambient Data-State Nav Coloring** — a small live status dot on exactly two nav items (Data
  Governance, Capacity Forecast) reflecting each tab's own already-computed real signal (the MDQS
  band + guardrail gates; the SPC out-of-control flag) — deliberately not applied to the other 10
  tabs, which don't have a real pass/fail signal to report.
- **Screen-Reader Landmark Teleporter** — the single skip-link became a 3-item group (nav / main
  content / quick search), and a real pre-existing gap was fixed along the way: neither `#sidenav`
  nor `#main` had `tabindex="-1"`, so the original skip-link scrolled to its target without ever
  actually moving keyboard focus there.
- **Magnetic Hover Physics** — sidenav icons scale up on hover/focus with a spring-overshoot easing
  curve, on both `:hover` and `:focus-visible` (not mouse-only), fully suppressed under
  `prefers-reduced-motion`.
- **Cognitive-Load Focus Mode** — one toggle hides the ambient status dots and dims secondary
  footer controls, for attention-fatigue/ADHD-friendly use; instantly reversible, persisted like
  every other display preference here.

Two real bugs found and fixed while building, both live-browser-caught (the stub couldn't have
caught either — see Accepted Limitations): (1) `setNavStatus`/`setFocusMode`'s first drafts used
`element.querySelector(...)`/`appendChild(...)` and `document.body`, none of which this file's
`stress.cjs` stub supports the same way a real browser does — fixed by using only static markup +
`getElementById`, the same discipline every other feature in this file already follows, and by
adding a minimal `document.body` stub. (2) A genuine var-hoisting bug: `tabVisitOrder`'s initializer
sat inside the "Recency-Based Tab Stepper" block, textually AFTER `restoreLastTab()`'s immediate
call chain (`restoreLastTab → activateTab → recordTabVisit`) — on a real reload with a previously
different tab saved, this threw a live `TypeError` (var declarations hoist, their assignments don't)
and, even after an initial defensive-guard attempt, silently clobbered the just-recorded visit back
to the seed value the moment script execution reached the original `var` statement. Fixed by moving
the one-line initializer earlier, not by defending against the symptom.

**Accepted limitations:** `stress.cjs`'s DOM stub only recognizes 2 hardcoded `querySelectorAll`
selectors and has no working `element.querySelector`, so `captureCurrentScenario()`'s real per-tab
input capture returns `{}` in the stub (documented explicitly in the test, not silently passed) —
verified live instead, where it correctly captured all 24 real inputs on the Should-Cost tab.
Likewise, `document.addEventListener` is an intentional stub no-op (this file's own established
pattern, predating this round), so the actual keydown-driven chord/stepper interception is verified
live rather than re-implemented in the stub; the underlying state machines (`stepMru`, `cancelChord`,
`CHORD_MAP`) are still directly tested. Checks: 486 → 551. Committed locally — pending push with
explicit confirmation, same discipline as every prior round.

**2026-09-05, sixteenth round (Break-Even Crossover Playground — viz-innovation concept #11):**
planned via `/plan-exec` before writing any code (FRAME/DECOMPOSE/SEQUENCE/DE-RISK/VERIFY, with the
inverse-drag math pre-registered via a standalone Node script before implementation, per B35). The
existing Volume Crossover Point (Q\*) calculator's SVG curve gained two draggable handles — the
chart itself is now a second input surface, not just a display:
- **Handle 1** (at q=1, where price(q)=P₀ by definition) directly sets the vendor's starting price.
- **Handle 2** (at q=qMax) sets a new γ, holding P₀ fixed, via the closed-form inverse
  `γ = −ln(price/P₀) / ln(qMax)`.
- Both write back into the real `qsVendorP0`/`qsGamma` number inputs (which remain the full
  keyboard/screen-reader path — the handles are `aria-hidden`, pointer/touch accelerants layered on
  top, not a second, redundant, unlabeled control) and trigger the existing, unmodified
  `calcQStar()`/`renderQStarChart()` pipeline — no parallel reimplementation of the math.
- Added a real "you are here" cross-reference: the NPV analyzer's own Annual Volume input
  (`#bbVolume`, 1,800 units) is now compared directly against Q\* on the same tab, stating where it
  sits without claiming the two analyzers (different vendor-pricing assumptions each) agree.

One real bug found via live-browser testing, not the stub: the first draft recomputed the chart's
Y-axis scale (`yMax = max(P₀,MC)×1.15`) from the CURRENT input values on every `pointermove` —
since dragging P₀ changes `yMax`, a single continuous drag gesture would have its own reference
axis shift under the cursor mid-drag, making a second move within one gesture land somewhere
inconsistent with the first. Fixed by freezing `p0`/`mc`/`qMax`/`yMax` once at `pointerdown` and
using that frozen context for the whole gesture, only committing the final landed-on value —
confirmed via a real multi-move single-gesture test in-browser (`node -e`-pre-registered: drag to
y=100 → P₀=315.00 exactly; a second move to y=150 within the SAME gesture → P₀=210.00 exactly,
against the same frozen axis, not a rescaled one).

**Accepted limitation, same class as every prior round:** `stress.cjs`'s stub can't dispatch real
SVG pointer events or compute `getScreenCTM()` (no rendering engine), so the drag GESTURE is
verified live in a real browser; the inverse-math functions it depends on (`qsPriceFromY`,
`qsGammaFromPrice`) are exposed and tested directly with the exact pre-registered golden values.
Checks: 551 → 564. Committed locally — pending push with explicit confirmation, same discipline as
every prior round.

**2026-09-05, seventeenth round (`/stress-test` of the Break-Even Crossover Playground):** self-
review plus an independent fresh-context reviewer, both driving real events against a live browser
(not just the stub), each finding reproduced with a pre-registered expectation before being
accepted (B35). 8 real findings, all fixed and re-verified; both reviewers independently converged
on the same top 3:

1. **HIGH — no `pointercancel` handling.** An interrupted drag (touch-scroll conflict, lost pointer
   capture, a context menu opening mid-drag) never fires `pointerup`, so `qsDragHandle`/
   `qsDragContext` and the global `pointermove`/`pointerup` listeners stayed attached forever —
   *any* subsequent mouse movement anywhere on the page kept silently overwriting `qsVendorP0`/
   `qsGamma`. Reproduced live (dispatch `pointercancel`, then an unrelated `pointermove` far from
   the chart, watch the input change); fixed by wiring `pointercancel` to the same cleanup.
2. **HIGH — a directly-typed negative P0 → literal "NaN" written into the visible γ input.**
   `qsVendorP0` has no `min=""` (same pre-existing gap `calcQStar()` already had, not introduced
   here), and `Math.log()` of a non-positive ratio is `NaN`. Fixed by flooring P0 inside
   `qsGammaFromPrice` itself; the pre-existing `calcQStar()`/`renderQStarChart()` "NaN units" bug
   for the same root cause is flagged as a separate, out-of-scope follow-up, not silently fixed here.
3. **HIGH — no `touch-action` anywhere; this is the file's first pointer-drag implementation.**
   Default `touch-action:auto` means a touch-drag on either handle likely triggers native
   page-scroll instead of (or racing) the drag, and per spec a UA taking over for scroll fires
   `pointercancel` — compounding directly with Finding 1 on exactly the input surface (touch
   devices) this feature most needs to work on. Fixed with `touch-action:none` on both handles.
4. **MEDIUM — 14×14px hit targets, under WCAG 2.2 SC 2.5.8's 24×24 minimum.** A real motor-
   accessibility gap for a sighted mouse user with limited pointer precision (the number inputs
   remain a fully equivalent alternative — this isn't a keyboard/AT blocker). Fixed with an
   invisible `r=14` (28px) hit-area circle per handle, `fill="transparent"` (not `"none"`, which
   doesn't register pointer events by default) with the visible `r=7` decoration set
   `pointer-events:none` so the larger circle underneath always receives the click/touch.
5. **MEDIUM — a third copy of the Q\* formula.** The new `pointerdown` handler re-derived
   `qStar`/`qMax`/`yMax` from scratch instead of reusing `calcQStar()`/`renderQStarChart()`'s own
   computation — exactly the drift risk the same commit's own `QS_LAYOUT` extraction was trying to
   avoid for the *layout* constants, just not applied to the *formula*. Fixed by pulling the shared
   computation into one `qsComputeState()` helper all three call sites now read from.
6. **LOW/MEDIUM — the "you are here" text had two rough edges.** Exact equality
   (`npvVolume === qStar`) produced the technically-true but oddly-worded "0 units past crossover";
   a degenerate `qStar=0` or `npvVolume=0` rendered as a silent empty string with no indication why
   (could read as a rendering glitch). Both fixed with explicit wording.
7. **LOW — a code comment overclaimed what `aria-hidden` was doing.** The parent `<svg role="img">`
   already collapses all children out of the accessibility tree on its own; `aria-hidden` on the
   handles is defensive documentation of intent, not the actual mechanism. Comment corrected.
8. **Accepted limitation (not fixed):** no `pointerId`/`setPointerCapture` tracking, so two
   simultaneous pointers (multi-touch, stylus+finger) would both drive whichever handle's drag
   started first. Not independently reproducible without real multi-touch hardware, and full
   multi-pointer isolation is disproportionate scope for a desktop/single-touch-first portfolio
   calculator — noted here rather than silently dropped.

Both reviewers separately confirmed the stress.cjs checks are non-vacuous (temporarily broke 3
different assertions one at a time — a renamed `data-handle`, a removed clamp, a changed wording —
confirmed each correctly failed, then reverted and confirmed `git diff` was clean). Checks: 564 →
577. Committed locally — pending push with explicit confirmation, same discipline as every prior
round.

**2026-09-06, eighteenth round (follow-up fix, not a new /stress-test pass):** the seventeenth
round's finding 2 fixed the missing-P0-floor root cause only inside `qsGammaFromPrice`'s *new*
gamma-drag path, and explicitly flagged the matching gap in the pre-existing, untouched
`calcQStar()`/`renderQStarChart()` path as a separate, out-of-scope bug rather than smuggling a
second fix into that finding. This round closes that flagged gap: `qsVendorP0` still has no
`min=""` attribute, so a directly-typed negative price made `p0/mc` negative, and raising a negative
number to a fractional power (`1/gamma`) is `NaN` in JS — `calcQStar()` then wrote the literal
"NaN units" into the real, visible `qsOut` with no error indication. Fixed the same way as the
sibling function: `qsComputeState()` (the one shared helper both `calcQStar()` and
`renderQStarChart()` already read from) now floors P0 to `Math.max(0.01, p0)` for the `qStar`
exponentiation itself, so a negative or zero P0 degrades `qStar` to a sensible ~0 instead of `NaN`
— pre-registered via `node -e` before writing the test (mc=180/γ=0.12 defaults, P0=-50 → `qStar`
floors to `3.46e-36`, rounding to "0 units"). **Accepted limitation:** the P0 floor guards only the
`qStar` calculation; `qsVendorAtStar` for the same negative-P0 input isn't `NaN` either, but is a
large, cosmetically odd negative number (`$-900,000.00`) — noted here rather than silently fixed,
since it wasn't the reported defect and is a separate, smaller cosmetic gap. Checks: 577 → 582.
Committed locally — pending push with explicit confirmation, same discipline as every prior round.
