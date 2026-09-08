# UX/UI Overhaul — Brainstorm, Backlog & Architecture

Requested 2026-09-04/05 as a direct, three-phase brief (not a downloaded document — see the
Methodology tab's note on provenance). This file is Phase 1 (30 ideas) and Phase 3 (backlog +
architecture) of that brief. Phase 2 (the vertical navigation) and the top P0 items are built —
see `index.html` and the Methodology tab for what shipped and why.

## Context this brainstorm is scoped against

This dashboard's actual audience is a hiring panel evaluating cost-engineering seriousness for one
specific role, not end-users of a product to "engage." That reframes what "boost engagement" should
mean here: fewer retention mechanics (streaks, badges, confetti), more genuine clarity/accessibility
wins that a technical reviewer would actually notice and respect. Every idea below is tagged:

- ✅ **Good fit** — buildable with zero external dependencies, no fabricated data, consistent tone.
- ⚠ **Tension** — real value, but conflicts with a hard constraint (no fabricated telemetry, no
  external web fonts/CDNs, or a tone mismatch) that would need to be resolved, not ignored.
- ⛔ **Poor fit** — declined. Usually because it needs data that doesn't exist (fabricating it would
  violate the whole point of this dashboard) or reads as gimmicky for this specific audience.

---

## Phase 1 — 30 ideas

### Interactivity & Immersion
1. **Named scenario snapshots** — save/compare labeled parameter sets per calculator (e.g. "Aggressive Scale-Up" vs. "Conservative") via localStorage. ✅
2. **KPI sparkline previews** — tiny inline SVG trend lines on KPI tiles. ⚠ needs an illustrative time series, must be labeled as clearly as the DFM/DFC heuristic already is.
3. **Draggable threshold markers** — drag a chart's green/amber/red boundary to explore "what if my tolerance were tighter." ✅
4. **Cross-tab metric highlighting** — hovering a KPI (e.g. MDQS) highlights every other place it appears. ✅ moderate effort.
5. **Side-by-side scenario comparison** — two Should-Cost parameter sets, delta highlighted. ✅
6. **URL deep-linking** — encode active tab + key inputs into the URL hash so a specific scenario is shareable via link, no server needed (native `URLSearchParams`/hash). ✅
7. **Animated number count-up** on calculator result changes (~300ms tween). ✅ tasteful, not gimmicky — needs `prefers-reduced-motion` respect (see #18).
8. **3D/WebGL billet-to-fly sculptor** (from the reviewed UX document). ⛔ real 3D engineering effort disproportionate to payoff; no real CAD geometry behind it.

### Education & Onboarding
9. **First-visit guided tour** — a short, dismissible spotlight walkthrough of the nav + one calculator. ✅
10. **Per-tab empty-state guidance** — a one-line "start here" hint before any input is touched. ✅ low effort.
11. **"Why it matters for this role" footnotes** extending the existing Explain-the-Math modals. ✅ builds directly on what's already shipped.
12. **Searchable glossary/term index** (MHR, CRPN, M-VaR, OAE, DLEV, …) — pairs naturally with the Command Palette's existing index pattern. ✅
13. **Progressive disclosure** — advanced inputs (Monte Carlo trial count/seed, OU horizon) hidden behind an "Advanced" toggle by default. ✅
14. **Printable "read this dashboard in 60 seconds" one-pager** (print CSS, no new content engine). ✅ low effort.
15. **Oscilloscope-style live sensor telemetry** "teaching" tool wear (from the reviewed document). ⚠ the underlying lesson (Wiener-process tool degradation) is already taught honestly via the risk-model material; a live-looking sensor stream would need to fabricate the stream itself.

### Accessibility & Inclusivity
16. **High-Contrast Mode.** ✅ **Built this round** — independent layer over light/dark, boosted secondary-text contrast + thicker focus rings.
17. **Full keyboard-navigation audit** across every interactive element (sliders, tables, modals), not just the new nav. ✅ nav is done; sliders/tables need a follow-up pass.
18. **`prefers-reduced-motion` support** — disable the nav-collapse transition and any count-up animation for users who've set that OS preference. ✅ **Built** (2026-09-05, stress-test round 10) — see the `@media (prefers-reduced-motion:reduce)` block in `index.html` and its `stress.cjs` coverage. (This item's own status went stale after that round shipped — caught and corrected 2026-09-06.)
19. **`aria-live="polite"` on calculator outputs** so a screen reader announces updated results without requiring re-navigation. ✅ cheap, currently a real gap, **second-highest-priority item not yet built.**
20. **Adjustable base font-size stepper**, independent of browser zoom, without triggering horizontal scroll. ✅
21. **Dyslexia-friendly font toggle.** ⚠ a real dyslexia-specific typeface (e.g. Atkinson Hyperlegible) would require an external web font, breaking this repo's zero-external-dependency stance; a system-font-only "legible" fallback stack is weaker and not really the same feature. Flagged, not built, until that tradeoff is deliberately revisited.
22. **Keyboard-shortcuts help overlay** (press `?` for a legend: ⌘K, arrow keys, Esc). ✅ cheap, deferred this round only for scope, good next pick.
23. **Colorblind-safe status encoding audit** — pair every green/amber/red status pill with a redundant symbol (✓ / ▲ / ✗), not color alone. ✅ partially true already (PASS/BLOCKED/ESCALATE labels exist); a systematic audit would catch the gaps.

### Gamification & Engagement
24. **Quiet module-exploration indicator** — "Explored 5 of 12" in the nav footer, no scores, no reward mechanic — orientation, not gamification. ✅
25. **Milestone celebrations** (confetti/sound crossing a threshold). ⛔ tone-mismatched for a hiring-panel audience.
26. **"Guess before reveal" quiz mode** on the Diagnostic Playbook (hide the root cause, guess the variance type first). ⚠ genuinely educational reframing of gamification, but real build effort — good P2 experiment, not a quick win.
27. **Session streak / visit counter.** ⛔ streak mechanics are a retention pattern for repeat-visit products; this dashboard gets one serious look from a reviewer, not daily engagement.
28. **"Continue where you left off" resume chip** (localStorage remembers the last tab). ✅ genuinely useful continuity, not really gamification, but honestly answers the engagement ask. **Built** — `ams-cc-last-tab` + `restoreLastTab()`. (This entry went stale after that shipped — caught and corrected during the Phase 4 stress-test below.)
29. **Achievement badges for exploring all tabs.** ⛔ same reasoning as #25/#27.
30. **Sound cues on interaction** (from the reviewed document). ⛔ previously declined for the same dashboard; reaffirmed.

**Tally:** 21 ✅ good fit, 4 ⚠ real tension to resolve deliberately, 5 ⛔ declined (mostly items #25/27/29's gamification-for-retention shape, or items needing fabricated telemetry/external fonts).

---

## Phase 2 — Vertical navigation (built)

Replaced the horizontal tab bar with a collapsible vertical side-nav — see `index.html`'s
`.sidenav` / `#sidenav` structure and the Methodology tab's dedicated entry. Real WAI-ARIA
"Tabs" pattern (`role="tablist"`, `aria-orientation="vertical"`, roving `tabindex`, ArrowUp/Down/
Home/End, automatic activation), hand-drawn inline SVG icons (no icon library), collapsed-mode
tooltips via `data-tooltip` + `::after`, and a `@media (max-width:760px)` hard floor that forces
icon-only regardless of the stored preference. 357/357 `stress.cjs` checks cover the structural
markup, `activateTab()`'s actual attribute/panel-class effects, and the keyboard-nav function
itself (not a reimplementation) — see the "Vertical side navigation" sections in `stress.cjs`.

## Phase 3 — Backlog (P0 / P1 / P2)

**P0 — do next, highest leverage per effort:**
- ~~`prefers-reduced-motion` support (idea #18)~~ — done, see #18 above.
- ~~`aria-live="polite"` on calculator outputs (idea #19)~~ — done, Phase 4 batch A.
- ~~Keyboard-shortcuts help overlay, `?` key (idea #22)~~ — done, Phase 4 batch A.
- ~~Colorblind-safe status-pill symbol audit (idea #23)~~ — done, Phase 4 batch A.

**P1 — good value, moderate effort:**
- URL deep-linking for shareable scenarios (idea #6)
- Searchable glossary/term index (idea #12)
- ~~First-visit guided tour (idea #9)~~ — done, Phase 4 batch E (opt-in only, never auto-shown).
- Progressive disclosure for advanced calculator inputs (idea #13)
- Per-tab empty-state guidance (idea #10)
- Full keyboard-nav audit beyond the side-nav itself (idea #17)
- ~~Printable one-pager (idea #14)~~ — done, Phase 4 batch E (synced live from the real KPI tiles at print time, not a hardcoded duplicate).

**P2 — valuable but bigger lift or more speculative:**
- KPI sparkline previews (idea #2)
- Draggable threshold markers (idea #3)
- Side-by-side scenario comparison (idea #5)
- Cross-tab metric highlighting (idea #4)
- Playbook quiz mode (idea #26)
- ~~"Continue where you left off" resume chip (idea #28)~~ — already done (see idea #28's own entry
  above); this line had gone stale after that shipped, caught during the Dashboard Self-Audit build
  (2026-09-07) while hand-counting this backlog for the Backlog Completion thermometer.

**Declined, documented not silently dropped:** 3D/WebGL sculptor (#8), sensor oscilloscope (#15),
dyslexia web-font (#21, pending a deliberate zero-dependency tradeoff revisit), milestone
celebrations (#25), streak/visit counters (#27), tab-exploration badges (#29), sound cues (#30).

## Phase 4 — External-inspiration ideas (2026-09-07), vetted against the same audience test

TJ pointed at a sibling portfolio dashboard (`project-controls-command-center`, capital-program EVM/
schedule controls — a genuinely different domain, kept as a separate repo on purpose, see README) and
asked for a proposal of AMS upgrades inspired by it. A `/stress-test` pass on the resulting plan found
that 4 of the proposed ideas had gone straight to "build it" without the ✅/⚠/⛔ vetting every Phase-1
idea got — closing that gap here before building any of them.

31. **"Three layers" architecture reframing** (Leading indicators → Confirming cost/schedule metrics →
    Independent assurance) — the inspiration dashboard names its own tabs this way. ⚠→✅ **with two
    fixes required, not adopted as-is.** As first proposed it borrowed the sibling repo's own EVM
    vocabulary ("Confirming EVM-like metrics") — re-importing exactly the cross-domain blending the
    separate-repo decision exists to prevent — and would have created a second, competing taxonomy
    next to the existing illustrative 4-pillar Operating Framework. Fixed: rewritten in AMS-native
    language only (Capacity/Tooling wear = leading, Should-Cost/Variance = confirming, the 857-check
    `stress.cjs` suite = assurance), scoped to a Methodology-tab paragraph that explicitly says it cuts
    *across* the 4-pillar taxonomy rather than replacing it.
32. **"Changed since your last visit" banner** — diffs current KPI values against a localStorage
    snapshot from the visitor's prior session. ⚠→✅ **with an explicit guardrail.** This is
    conceptually adjacent to declined idea #27 (streak/visit counter) — both presuppose a returning
    visitor. The distinction that makes it fit here: zero streak/count/badge/reward mechanics, purely
    a factual "here's what moved" statement — the same reasoning that made #28 (resume chip) a good
    fit despite the same "presupposes a return visit" shape. Built to that standard, not #27's.
33. **"View as: [Role]" filter** — the inspiration dashboard narrows one unified 20-KPI grid to 6 tiles
    per role. ⚠→✅ **redefined, not adopted as proposed.** AMS has no such grid — only 17 `.kpi-tile`
    elements total, 2–4 per tab across 12 separate tabs. As literally proposed this had no structural
    analog to filter. Redefined as role-scoped **nav-tab visibility** instead (AMS's 12 real tabs are
    the actual analog to the inspiration's 20 tiles), framed explicitly as demonstrating
    audience-tailored communication — a real skill for the target role — not as serving genuinely
    different real viewers of this one-hiring-panel-audience dashboard.
34. **Attention & Triage tab** — one cross-tab tab aggregating every currently-firing (non-green/
    non-PASS) real threshold already computed elsewhere on the page into urgency tiers. ✅ **the
    strongest idea in this batch** — reuses only real, already-computed data (MDQS band, Gate
    Simulator results, capacity utilization bands, risk-register severities), zero new fabrication.
    Scope rule (needed because a naive build would range from 4 items to 30+): one item per real
    *distinct mechanism*, with multi-row mechanisms (capacity weeks, risk-register entries) rolled up
    into one aggregate item each — never exploded per-row, which would just duplicate the tab that
    already owns that detail. **Built as 7 items exactly** (PO gate, live CRPN scorer, commodity
    price exposure, capacity weeks, MDQS, OAE, risk-register aggregate) — a Playbook rollup was
    considered at design time (this paragraph originally named it) but never actually built: the
    Diagnostic Playbook's 30 scenarios don't reduce to a single clean non-green/PASS signal the way
    the other 6 mechanisms do, and forcing one in would have meant inventing a threshold that doesn't
    exist elsewhere on the page. Caught and corrected by a `/stress-test` pass that checked this
    paragraph's claim against the real `calcTriage()` implementation.
35. **Colorblind-safe status-pill symbol audit (idea #23, reaffirmed)** — this is the one already-P0
    idea the stress-test caught missing from the new plan entirely. Not a new idea; restored to its
    original P0 priority.
36. **"One root cause, N instruments" showcase.** The inspiration dashboard shows one real event
    surfacing independently across 5 different tabs of its own simulated program. ⛔ **declined
    during Batch B's own build, not before** — checking for a genuine AMS analog found no real
    numeric link to showcase: the one risk-register entry whose NAME echoes another tab's concept
    (RSK-04 "Stale Routing Standard Drift" vs. the MDQS calculator's own "stale standards"
    deduction) turned out to be pure naming coincidence — the risk register's p/s/d scores are
    static, hand-assigned values with no mathematical tie to MDQS's live, separately-computed
    deduction. Building a "cross-tab root cause" card on that pairing would have been exactly the
    kind of fabricated-consistency claim this project exists to avoid. The one genuine, already-
    computed cross-dimension finding this page has (Aurora's real Pearson r≈−0.71 between
    Probability and Severity, both independently assigned across the same 10 risk entries) is
    already the Aurora Layer Correlation Map's own headline result — a second "showcase" of the
    identical fact would be redundant with a feature that already ships it, not additive.

**Dropped, not built:** a live mini-recompute demo on the Executive Overview tab (proposed alongside
#33 above) — the Site Accuracy Explorer already on that tab (live-editable CMAR/spread) is exactly
this; building a second one would ship a near-duplicate. A "one root cause, N instruments" showcase
(idea #36) — the one candidate pairing checked out as naming coincidence, not a real numeric link;
fabricating one to fill the slot was never on the table.

## Phase 5 — Dashboard Self-Audit (2026-09-07), a 30-concept catalog cut to 7 by stress-testing the plan itself

A `/viz-innovation` pass ("upgrade the existing layout to make it more comprehensive") produced 30 new
concepts about the dashboard's own build/structure — a genuinely different axis from every prior
catalog (those were about the manufacturing-cost domain; this one is about the page itself). Before any
`/plan-exec` batch ran, `/stress-test` ran against the PLAN, not code, and found real problems with the
premise: UX_ROADMAP's own stated audience ("a hiring panel... not end-users of a product to 'engage'")
argues directly against a dashboard that becomes about itself, and several of the 30 needed data this
page will never have and never should fabricate (real click-through traffic, visitor dwell-time,
click-distance — confirmed absent via `grep`, not assumed). Verdict: build only the survivors that need
zero invented data, keep them quarantined to one tab, never make this the dashboard's subject.

**Built (7 of 30):** Content Composition onion, Backlog Completion thermometer, Build Velocity
heartbeat, Milestone Trail, Tab Density Leaderboard, Comprehensiveness Scorecard, Sibling Dashboard
Comparator — see the Methodology tab's own "Dashboard Self-Audit" card for what each one measures and
the README's thirty-fourth round for the build/bug-fix detail.

**Declined, not built (23 of 30):** Cross-Tab Citation Web / Navigation Path Predictor — no real
click-traffic data exists to drive either. Content Density Heightmap — a real walkable 3D terrain +
orbiting camera is exactly the disproportionate-effort class the existing 3D/WebGL decline (#8) already
covers. Whole-Dashboard Orbit Map — every tab is a real 1-click distance from every other in this flat
side-nav, so "orbit radius = click-distance" is degenerate, not a real gradient. KPI Constellation Chart
— hand-rolled soft-body drag physics for a data-viz add-on. Information Scent Trail Map — no dwell-time
data exists or ever will. Feature Genealogy Tree, Feature Impact Ripple Pool, Braided Rope
Visualization, Stale Content Rust Overlay, Regression Tripwire Timeline, Before/After Layout Twin
Sliders, Round-by-Round Diff Filmstrip — each needs either labor-intensive, transcription-error-prone
manual data extraction with no reliable source, or rendered screenshots of old commits this zero-build
repo has no mechanism to produce. The remaining "buildable but redundant" concepts (Page Completeness
variants, reflow/budget-allocator/progressive-disclosure simulators) overlapped existing patterns
(the Advanced-inputs toggle, the existing print/role-view features) closely enough that building them
would have shipped a near-duplicate rather than new signal.

## Phase 6 — /nav-innovation (2026-09-07), "build all that doesn't exist" applied to a 30-concept catalog

A `/nav-innovation` pass produced 30 advanced navigation-UX concepts, generic-enterprise-platform-style
(no live audit of this page's actual current state at generation time). TJ then asked to build every one
that doesn't already exist. Auditing the REAL current implementation first (not the mental model the
catalog was written from) found this page already substantially covers 6 of the 30 under different names
— see the README's thirty-fifth round for the full list (MRU Tab Stepper, Ambient Data-State Nav Coloring,
Cognitive-Load Focus Mode, Spatial Bookmarks, Magnetic Hover Physics, skip-links). This is the same
"verify, don't assume" discipline as Phase 5's plan-stress-test, applied one level earlier — to whether a
proposed feature is real *new* scope at all, not just whether it's *feasible or fabrication-free*.

**Built (9 of 30):** 6 real extensions of the already-existing mechanisms above (broader Ambient Nav
Coloring coverage, Focus Mode section-list declutter, fuzzy palette matching) plus 3 genuinely new,
small, real-data-only additions (Bi-Directional Jump-Link Threading, Boundary Reach Feedback + a
scaled-down Directional Transition, and a Wayfinding Digest built on top of Phase 5's `calcSelfAudit()`).
Dyslexia-Optimized Label Mode (idea #21 from Phase 1, flagged there as "pending a deliberate
zero-dependency tradeoff revisit") was finally revisited: system fonts + spacing only, no font file.

**Declined (15 of 30):** see the README's thirty-fifth round for the itemized list and reasons —
drag-and-drop architecture changes, redundancy with the Attention & Triage tab or the MRU
stepper/Bookmarks, a known reordering anti-pattern, disproportionate state-machine complexity for a demo
dashboard, and one real audience-fit risk (voice commands, given this page's one-serious-look hiring-panel
audience and inconsistent browser mic support). Two of the 15 (an ambient recent-tabs ghost trail, a
sidenav quick-filter) were declined **mid-build**, not before it, once building the other 8 made the
redundancy/conflict concrete — the ghost trail would have been a third concurrent "recent tab" surface,
and the quick-filter would have fought the existing chord-navigation system for the same keystrokes.

## Technical architecture & component breakdown

This is a **zero-dependency, single-file, no-build-step** application by deliberate design (see
README). "Architecture" here means the conventions that keep one large HTML file coherent, not a
framework/component-tree story:

- **State model: the DOM *is* the state.** Every calculator is a pure `calcXxx()` function that
  reads current `<input>`/`<select>` values via `getElementById`, computes, and writes results back
  to specific output element ids. There is no shared store, no virtual DOM, no reducer — each
  calculator is independently re-run on its own `input`/`change` events. This is intentional
  (Simplicity First): the moment a shared reactive store would earn its complexity is the moment
  this stops being a single illustrative file, which isn't the goal here.
- **Cross-cutting features share one shape.** The Explain-the-Math modal (`EXPLAIN` object + open/
  close pair + `data-explain` trigger attribute) and the Command Palette (`COMMAND_INDEX` array +
  render/filter functions + a modal) are the two existing examples of this repo's actual "component"
  pattern: **a data table + a generic modal + a trigger attribute.** Any future cross-cutting
  feature (the glossary, the shortcuts overlay) should follow this same shape rather than invent a
  new one — it's what makes features composable without a framework.
- **Persistence is scoped to UI preference, never to scenario data.** `localStorage` holds theme,
  contrast, and nav-collapsed state only. Calculator *inputs* deliberately reset to their
  illustrative defaults on reload — persisting a viewer's typed scenario would blur the "every
  number here is illustrative, not real" line the whole page is built to keep clear.
- **Testing architecture.** `stress.cjs` stubs `document`/`window` and executes the page's *real*
  inline script via `vm.runInContext` — never a parallel reimplementation. Adding an interactive
  feature means: (1) pre-register the expected golden value(s) by hand or in Python/Node before
  writing the check, (2) extend the DOM stub's `querySelectorAll`/`getAttribute`/`classList` support
  if the new feature queries by a selector the stub doesn't already resolve (this round's nav work
  found and fixed a real gap here — static HTML attributes like `data-tab` weren't being seeded onto
  stub elements created via `querySelectorAll`, which the very checks meant to test the nav caught),
  and (3) verify live in a real browser for anything keyboard/pointer-driven the stub can't fully
  simulate (focus, hover, CSS transitions).
