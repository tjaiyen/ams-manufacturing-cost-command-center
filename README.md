# AMS Manufacturing Cost Engineering Command Center

A standalone, purpose-built dashboard for one specific role — Senior Manufacturing Cost Engineer,
Amazon Manufacturing Services ([req 10512991](https://www.amazon.jobs/en/jobs/10512991/senior-manufacturing-cost-engineer-amazon-manufacturing-services)) —
not a general-purpose portfolio piece. Eleven live, interactive modules covering the job description's
own responsibility areas: should-cost modeling, machine-hour-rate formalization (including a
first-principles MHR build-up calculator), standard-cost variance decomposition (plus a
forward-looking commodity price-exposure warning), build-vs-buy/NPV, capacity/absorption
forecasting, tooling amortization, design-for-cost sensitivity, data governance, a 30-scenario cost
diagnostic playbook, a multi-site executive rollup, and an honest operating framework. Click-to-open
"Explain the Math" modals cover the highest-traffic KPIs throughout.

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
CNC telemetry protocols), aerospace titanium buy-to-fly ratios of 6:1+ (the real range is 6:1–16:1+,
so the document's figure is conservative, not inflated), and SAP Movement Type 551 (the actual SAP
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

## The eleven modules

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
   document's copied-from-document-one figures.
3. **Variance Waterfall** — the real six-way standard-cost decomposition (MPV/MQV/DLRV/DLEV/VOSV/FOHV),
   fully interactive, rendered as a live CSS bar-chart waterfall, plus a **Commodity Price Exposure
   Early Warning** calculator — the forward-looking cousin of the MPV line (spot-price shift vs.
   open purchasing volume → projected dollar exposure, flagged at a real 8% threshold).
4. **Build-vs-Buy / CapEx** — an NPV/payback analyzer generalizing the same methodology used in
   [`ams-narrative.html`](https://tjaiyen.github.io/cost-management-command-center/ams-narrative.html)'s
   worked example, with a year-by-year discounted cash-flow table.
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
10. **Operating Framework** — a dashboard-native condensation of
   [`ams-90day-plan.html`](https://tjaiyen.github.io/cost-management-command-center/ams-90day-plan.html)'s
   4-pillar thesis and operating cadence, explicitly framed as a hypothesis, not a claim about AMS.
11. **Methodology & Sourcing** — the source ledger described above.

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
- Explain-the-Math modal: `EXPLAIN` data object has a title/formula/body for all 10 keyed formulas,
  exactly 11 explain buttons are wired in the HTML, `openExplain` is exposed for the harness to call.

Run: `node stress.cjs` — 203 checks, all passing as of this writing.

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
and the Explain-the-Math modal system (11 modules total, up from ten) — pending push with explicit
confirmation, same discipline as every prior round.
