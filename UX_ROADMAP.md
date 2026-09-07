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
- `aria-live="polite"` on calculator outputs (idea #19)
- Keyboard-shortcuts help overlay, `?` key (idea #22)
- Colorblind-safe status-pill symbol audit (idea #23)

**P1 — good value, moderate effort:**
- URL deep-linking for shareable scenarios (idea #6)
- Searchable glossary/term index (idea #12)
- First-visit guided tour (idea #9)
- Progressive disclosure for advanced calculator inputs (idea #13)
- Per-tab empty-state guidance (idea #10)
- Full keyboard-nav audit beyond the side-nav itself (idea #17)
- Printable one-pager (idea #14) — good-fit at Phase 1, never actually tiered until now (caught during the Phase 4 stress-test below)

**P2 — valuable but bigger lift or more speculative:**
- KPI sparkline previews (idea #2)
- Draggable threshold markers (idea #3)
- Side-by-side scenario comparison (idea #5)
- Cross-tab metric highlighting (idea #4)
- Playbook quiz mode (idea #26)
- "Continue where you left off" resume chip (idea #28)

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
    *distinct mechanism*, with multi-row mechanisms (capacity weeks, risk-register entries, playbook
    scenarios) rolled up into one aggregate item each — never exploded per-row, which would just
    duplicate the tab that already owns that detail.
35. **Colorblind-safe status-pill symbol audit (idea #23, reaffirmed)** — this is the one already-P0
    idea the stress-test caught missing from the new plan entirely. Not a new idea; restored to its
    original P0 priority.

**Dropped, not built:** a live mini-recompute demo on the Executive Overview tab (proposed alongside
#33 above) — the Site Accuracy Explorer already on that tab (live-editable CMAR/spread) is exactly
this; building a second one would ship a near-duplicate.

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
