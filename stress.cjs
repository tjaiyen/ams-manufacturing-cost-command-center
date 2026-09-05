#!/usr/bin/env node
// stress.cjs — verification suite for the AMS Manufacturing Cost Engineering Command Center.
//
// Same discipline as the sibling repos (project-controls-command-center, cost-management-
// command-center): stub the DOM, execute the page's real inline script via vm.runInContext, and
// assert against the exact numbers a real browser produced (verified live in-browser before this
// file was written — see the commit message / README for the golden-value derivation). This tests
// the ACTUAL page code, not a parallel reimplementation that could hide the same bug twice.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let passes = 0, failures = 0;
function check(cond, msg, detail) {
  if (cond) { passes++; console.log("pass: " + msg); }
  else { failures++; console.error("FAIL: " + msg + (detail ? " -- " + detail : "")); }
}

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

console.log("--- Structural checks ---");
const TABS = ["exec", "shouldcost", "variance", "buildbuy", "capacity", "tooling", "dfm", "governance", "playbook", "risk", "framework", "methodology"];
TABS.forEach((t) => {
  check(html.includes(`data-tab="${t}"`), `tab button for "${t}" exists`);
  check(html.includes(`id="tab-${t}"`), `panel for "${t}" exists`);
  check(html.includes(`id="navtab-${t}"`), `side-nav button id navtab-${t} exists`);
  check(html.includes(`aria-controls="tab-${t}"`), `side-nav button for "${t}" points aria-controls at its real panel id`);
  check(html.includes(`aria-labelledby="navtab-${t}"`), `panel for "${t}" points aria-labelledby back at its real nav button id`);
});
check(html.includes("None of it is real Amazon Manufacturing Services data"), "the top-level illustrative-data disclaimer is present");
check(html.includes('robots" content="noindex,nofollow"'), "page is noindex,nofollow (not meant for search discovery)");

console.log("--- Vertical side navigation: structural checks ---");
check((html.match(/class="sidenav-item"/g) || []).length === 12, "exactly 12 side-nav items in the HTML (one per tab)", (html.match(/class="sidenav-item"/g) || []).length);
check((html.match(/role="tabpanel"/g) || []).length === 12, "exactly 12 panels carry role=\"tabpanel\"", (html.match(/role="tabpanel"/g) || []).length);
check(html.includes('role="tablist"') && html.includes('aria-orientation="vertical"'), "the side-nav list is a real ARIA vertical tablist, not a generic nav (satisfies the ARIA-compliance ask directly)");
check(html.includes('id="sidenavToggle"') && html.includes('aria-expanded='), "the collapse/expand toggle button exists and exposes its state via aria-expanded");
check(html.includes('data-collapsed="false"'), "the side-nav has an explicit default (expanded) collapse state in the markup, not implied");
check((html.match(/data-tooltip="/g) || []).length >= 12, "at least 12 collapsed-mode tooltips are wired (one per nav item)", (html.match(/data-tooltip="/g) || []).length);
check(html.includes('id="contrastBtn"') && html.includes('aria-pressed='), "the High-Contrast toggle exists and exposes its state via aria-pressed (real accessibility feature, not decorative)");
check(html.includes('data-contrast="true"') && html.includes(':focus-visible{ outline-width:3px'), "High-Contrast mode has real CSS behind it (boosted secondary-text contrast + thicker focus rings), not just a button with no effect");

console.log("--- Stress-test round (2026-09-05) fix 1: responsive grids never force horizontal overflow ---");
// A stress-test found `minmax(320px,1fr)` never shrinks below 320px even on a viewport narrower than
// that -- reproduced live at 375px (grid.cols-2 forced horizontal scroll). Fixed with minmax(min(Npx,
// 100%),1fr), which lets the track shrink to the viewport instead. Checking the exact rule text (not
// just "mentions minmax") so a future edit that silently drops the min() wrapper is caught.
check(html.includes(".grid.cols-4{grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))}"), "cols-4 grid track floor is wrapped in min(220px,100%) so it can shrink on a narrower-than-220px viewport instead of forcing overflow");
check(html.includes(".grid.cols-3{grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr))}"), "cols-3 grid uses the same overflow-safe min() pattern");
check(html.includes(".grid.cols-2{grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))}"), "cols-2 grid uses the same overflow-safe min() pattern (this was the specific rule that reproduced the 375px overflow)");

console.log("--- Stress-test round (2026-09-05) fix 2: every collapsed-mode nav control has a real accessible name ---");
// In collapsed mode the .sidenav-label text is display:none and the tooltip is a CSS ::after
// pseudo-element -- neither is in the accessibility tree, so a screen reader announced these 12
// buttons (plus 3 footer controls) with no name at all. Fixed via aria-label on each.
const sidenavItemAriaLabelCount = (html.match(/class="sidenav-item"[^>]*aria-label="[^"]+"/g) || []).length;
check(sidenavItemAriaLabelCount === 12, "all 12 side-nav item buttons carry a real aria-label, not just a CSS-only tooltip/label", sidenavItemAriaLabelCount);
check(html.includes('aria-label="High Contrast"'), "the High-Contrast toggle carries a real aria-label independent of its CSS-hideable .label-text span");
check(html.includes('aria-label="Toggle theme"'), "the theme toggle carries a real aria-label independent of its CSS-hideable .label-text span");
check(html.includes('aria-label="Fit brief (opens in the same tab)"'), "the Fit-brief footer link carries a real aria-label independent of its CSS-hideable .label-text span");
check(/id="sidenavToggle"[^>]*aria-controls="sidenav"/.test(html), "the collapse toggle's aria-controls correctly points at the real #sidenav id");

console.log("--- Stress-test round (2026-09-05) fix 7: dead CSS removed ---");
check(!html.includes(".kpi-foot.bad"), "the dead .kpi-foot.bad rule (no element in the page ever carries that class combination) was removed");
check(!html.includes(",.tabular{"), "the dead .tabular class name (never applied to any element) was dropped from the code/.mono/.tabular selector list");
check(html.includes("code,.mono{"), "the code/.mono selector list still carries the classes that ARE actually used (71 .mono usages), confirming the fix trimmed the dead class without breaking the live one");

console.log("--- Stress-test round (2026-09-05) finding 11 (found during this round's own live-browser re-verify, not in the original 10): a long inline <code> string overflowed at 375px ---");
// Found live at a 375px viewport while re-verifying fix 1 (the grid overflow) on every tab -- the
// Methodology tab's own <code>hookSpecificOutput.permissionDecision</code> is 38 characters of
// monospace text with no wrap opportunity, overflowing the page by 13px (scrollWidth 388 vs
// clientWidth 375) even though the grid fix itself was already working correctly on every tab.
check(html.includes("code,.mono{font-family:ui-monospace,\"SF Mono\",Menlo,Consolas,monospace;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}"), "code/.mono elements can now wrap mid-word when a long identifier has no natural break point, instead of forcing the page wider than the viewport");

console.log("--- Stress-test round (2026-09-05) fix 10: prefers-reduced-motion is respected ---");
check(html.includes("@media (prefers-reduced-motion:reduce)"), "a prefers-reduced-motion block exists");
const reducedMotionBlockMatch = html.match(/@media \(prefers-reduced-motion:reduce\)\{([\s\S]*?)\n  \}/);
check(!!reducedMotionBlockMatch, "found the prefers-reduced-motion block's body to check its contents");
if (reducedMotionBlockMatch) {
  const body = reducedMotionBlockMatch[1];
  check(body.includes(".sidenav,") || body.includes(".sidenav{") || body.includes(".sidenav "), "the block disables the side-nav's own width transition (the collapse/expand animation)", body);
  check(body.includes(".sidenav-item::after"), "the block disables the collapsed-mode tooltip's fade-in transition", body);
  check(body.includes(".wf-bar"), "the block disables the Variance Waterfall bar-height transition", body);
  check(body.includes("transition:none"), "the block actually sets transition:none, not just re-declaring the selectors with no effect", body);
}

console.log("--- Honest stress-test badge (the real count, not the fabricated '1,520' a downloaded document proposed for the same idea) ---");
// This is a hand-maintained claim, same as the README's own "N checks, all passing as of this
// writing" line -- it can only assert internal self-consistency (the two numbers in the badge
// agree, i.e. 100% passing), not live-verify against this very run's own final count (that's a
// real fixed-point problem: this check's own pass/fail is part of the total it would be checking).
const verifyBadgeSpan = html.match(/id="verifyBadge"[^>]*>([^<]*)/);
check(!!verifyBadgeSpan, "found the verify badge in the header");
if (verifyBadgeSpan) {
  const verifyBadgeText = verifyBadgeSpan[1];
  const verifyBadgeNums = verifyBadgeText.match(/(\d+)\/(\d+) CHECKS PASSING/);
  check(!!verifyBadgeNums, "the badge's text matches the expected \"N/N CHECKS PASSING\" pattern", verifyBadgeText);
  if (verifyBadgeNums) check(verifyBadgeNums[1] === verifyBadgeNums[2], "the badge's own two numbers agree (claims 100% passing, not a partial/stale count)", `${verifyBadgeNums[1]}/${verifyBadgeNums[2]}`);
  check(!verifyBadgeText.includes("1,520"), "the verify badge specifically does not echo the recurring fabricated \"1,520\" test-count figure");
}

console.log("--- No fabricated-specifics leakage (same discipline as the sibling repo) ---");
// This page exists to demonstrate methodology honestly. None of the two downloaded documents'
// fabricated specifics (an unconfirmed AMS client claim, a copied test-count figure, and their
// own specific invented dollar amounts) should appear here, even by accident/copy-paste.
const bannedStrings = ["Kuiper", "Robotics", "AWS data center", "1,520", "47.88", "74.82", "26.58",
  "$650,000", "$1,100,000", "$220,000", "Redmond Satellite", "Bellevue Precision Production",
  "Seattle Advanced Prototyping"];
// One deliberate exception: the Methodology tab names these same strings ONCE, specifically to
// debunk them (the same "name it to reject it" pattern used in AMS_CostEngineering_TalkingPoints.md's
// Sourcing Note) — a pure substring ban can't tell "asserting as fact" from "quoting to debunk," so
// exclude that one card by its own unique heading before scanning the rest of the page. Confirmed by
// reproduction (not assumed): without this exclusion, "Kuiper"/"Robotics"/"1,520" flag here and
// nowhere else in the file.
const debunkCardMatch = html.match(/<div class="card">\s*<div class="card-head"><h2>A note on where the framework idea came from<\/h2><\/div>[\s\S]*?<\/p>\s*<\/div>/);
check(!!debunkCardMatch, "found the one card allowed to name the fabricated claims (in order to debunk them)");
// A second debunk card (added for the third downloaded document) ALSO mentions "1,520" while
// restating that it's still fabricated -- both cards must be excluded before scanning for leakage,
// not just the first, or that second, legitimate mention false-positives (reproduced: it did,
// before this fix).
const errorsCardMatch = html.match(/<div class="card">\s*<div class="card-head"><h2>A third document, verified far more thoroughly<\/h2><\/div>[\s\S]*?<\/p>\s*<\/div>/);
check(!!errorsCardMatch, "found the one card allowed to name the two confirmed-wrong claims (in order to correct them)");
// A fifth downloaded document's MHR worked-example table turned out to be a VERBATIM copy of the
// first document's already-fabricated numbers ($47.88/$74.82/$26.58, $650,000/$1,100,000/$220,000,
// the three facility names) -- the Methodology tab names this discovery, once, specifically to
// call it out. A fourth exclusion, same pattern as the other two.
const fifthDocCardMatch = html.match(/<div class="card">\s*<div class="card-head"><h2>A fifth document — mostly a verbatim copy, one genuinely new asset<\/h2><\/div>[\s\S]*?<\/p>\s*<\/div>/);
check(!!fifthDocCardMatch, "found the one card allowed to name the fifth document's verbatim-copy discovery and repeated wrong claims (in order to correct them)");
// The sixth/seventh documents' quant-methods review also names "1,520"/"Kuiper"/"Robotics" once,
// specifically to reject them (same discipline, fifth exclusion).
const sixthDocCardMatch = html.match(/<div class="card">\s*<div class="card-head"><h2>Sixth &amp; seventh documents — real quantitative methods, one formula-sign nuance<\/h2><\/div>[\s\S]*?<\/p>\s*<\/div>/);
check(!!sixthDocCardMatch, "found the one card allowed to name the sixth/seventh documents' repeated fabricated claims (in order to reject them)");
const eighthDocCardMatch = html.match(/<div class="card">\s*<div class="card-head"><h2>Eighth document — a repeat of an already-declined narrative, one broken worked example, one real gap it pointed at<\/h2><\/div>[\s\S]*?<\/p>\s*<\/div>/);
check(!!eighthDocCardMatch, "found the one card allowed to name the eighth document's repeated fabricated claims (in order to reject them)");
const ninthDocCardMatch = html.match(/<div class="card">\s*<div class="card-head"><h2>Ninth document — 30 UX\/UI proposals; most don't fit this dashboard, four genuinely do<\/h2><\/div>[\s\S]*?<\/p>\s*<\/div>/);
check(!!ninthDocCardMatch, "found the one card allowed to name the ninth document's repeated fabricated claims (in order to reject them)");
let htmlOutsideDebunkCards = html;
if (debunkCardMatch) htmlOutsideDebunkCards = htmlOutsideDebunkCards.replace(debunkCardMatch[0], "");
if (errorsCardMatch) htmlOutsideDebunkCards = htmlOutsideDebunkCards.replace(errorsCardMatch[0], "");
if (fifthDocCardMatch) htmlOutsideDebunkCards = htmlOutsideDebunkCards.replace(fifthDocCardMatch[0], "");
if (sixthDocCardMatch) htmlOutsideDebunkCards = htmlOutsideDebunkCards.replace(sixthDocCardMatch[0], "");
if (eighthDocCardMatch) htmlOutsideDebunkCards = htmlOutsideDebunkCards.replace(eighthDocCardMatch[0], "");
if (ninthDocCardMatch) htmlOutsideDebunkCards = htmlOutsideDebunkCards.replace(ninthDocCardMatch[0], "");
const foundBanned = bannedStrings.filter((s) => htmlOutsideDebunkCards.includes(s));
check(foundBanned.length === 0, "none of the downloaded documents' fabricated specifics (client claims, copied test count, their own invented dollar figures, invented facility names) appear anywhere OUTSIDE the cards that name them specifically to debunk them", JSON.stringify(foundBanned));
check(debunkCardMatch && bannedStrings.some((s) => debunkCardMatch[0].includes(s)), "the debunk card itself actually names at least one of the fabricated claims (confirms the exclusion above is excluding real content, not a no-op)");
check(fifthDocCardMatch && bannedStrings.some((s) => fifthDocCardMatch[0].includes(s)), "the fifth-document card actually names at least one banned figure (confirms its exclusion isn't a no-op)");
check(sixthDocCardMatch && bannedStrings.some((s) => sixthDocCardMatch[0].includes(s)), "the sixth/seventh-document card actually names at least one banned figure (confirms its exclusion isn't a no-op)");
check(eighthDocCardMatch && bannedStrings.some((s) => eighthDocCardMatch[0].includes(s)), "the eighth-document card actually names at least one banned figure (confirms its exclusion isn't a no-op)");
check(ninthDocCardMatch && bannedStrings.some((s) => ninthDocCardMatch[0].includes(s)), "the ninth-document card actually names at least one banned figure (confirms its exclusion isn't a no-op)");

console.log("--- Executive Overview P&L rollup table: arithmetic + fabrication-proximity check (2026-09-04) ---");
// This table's numbers are hand-typed static HTML, not JS-computed -- a stress-test found NO check
// existed for it at all before this. Also found: Site C's original std COGS ($1,105,000) sat only
// 0.45% from the explicitly-banned fabricated figure $1,100,000 (see bannedStrings below) -- close
// enough that a skeptical reader could suspect it wasn't independently invented. Fixed by moving it
// to $1,150,000 (4.5% away) and recomputing the row + rollup from real arithmetic, not just retyping
// a plausible-looking total.
const execTableMatch = html.match(/Site A[\s\S]*?Rollup[\s\S]*?<\/tr>/);
check(!!execTableMatch, "found the Executive Overview P&L rollup table to check");
if (execTableMatch) {
  // Each row (Site A/B/C, Rollup) carries 3 dollar figures in order: std, act, variance -- 4 rows x
  // 3 = 12 matches total (confirmed by running this exact regex before writing the check, not
  // assumed -- an earlier draft of this check wrongly assumed 2 figures/row and mis-aligned every
  // value as a result).
  const nums = [...execTableMatch[0].matchAll(/\$([\d,]+)/g)].map((m) => parseInt(m[1].replace(/,/g, ""), 10));
  check(nums.length === 12, "found exactly 12 dollar figures (std/act/variance x 4 rows) -- if this drifts, the positional extraction below is no longer valid", `found ${nums.length}`);
  const [aStd, , , bStd, , , cStd, cAct, cVar, rollStd, rollAct] = nums;
  check(cAct - cStd === cVar, "Site C's own printed variance equals its own printed act-minus-std, not a separately-typed number", `act-std=${cAct - cStd} printed=${cVar}`);
  check(rollStd === aStd + bStd + cStd, "rollup standard COGS is the real sum of all three sites' standard COGS, not a separately-typed number", `rollup=${rollStd} sum=${aStd + bStd + cStd}`);
  check(rollAct === (nums[1] + nums[4] + cAct), "rollup actual COGS is the real sum of all three sites' actual COGS, not a separately-typed number", `rollup=${rollAct} sum=${nums[1] + nums[4] + cAct}`);
  check(Math.abs(cStd - 1100000) / 1100000 > 0.02, "Site C's invented standard COGS is safely distinct (>2%) from the specific fabricated figure ($1,100,000) it once sat only 0.45% away from", `cStd=${cStd}, diff=${(Math.abs(cStd - 1100000) / 1100000 * 100).toFixed(2)}%`);
}

console.log("--- No confirmed-incorrect claims asserted as fact (third document's two real errors) ---");
// A third downloaded document had two confirmed technical errors (not fabrications, but genuinely
// wrong claims): "PP02" is not SAP's real rework order type (the closer convention is PP03), and
// the document's Claude Code hook config invents a "pre_tool_call" key (the real event is
// PreToolUse). Same exclusion pattern as above: the Methodology tab names both, once, specifically
// to correct them -- excluded by that card's own unique heading before scanning for the rest.
const wrongClaimStrings = ["PP02", "pre_tool_call"];
const foundWrongClaims = wrongClaimStrings.filter((s) => htmlOutsideDebunkCards.includes(s));
check(foundWrongClaims.length === 0, "neither confirmed-wrong claim (\"PP02\" as rework, \"pre_tool_call\" as a hook key) is asserted as fact anywhere OUTSIDE the cards that correct them", JSON.stringify(foundWrongClaims));
check(errorsCardMatch && wrongClaimStrings.every((s) => errorsCardMatch[0].includes(s)), "the corrections card actually names both confirmed-wrong claims (confirms the exclusion is excluding real content, not a no-op)");
check(ninthDocCardMatch && ninthDocCardMatch[0].includes("PP02"), "the ninth-document card actually names the repeated \"PP02\" wrong claim (confirms its exclusion isn't a no-op for this check too)");

console.log("--- Executing the real inline script in a stubbed DOM ---");
const scriptMatch = html.match(/<script>\s*\(function\(\)\{[\s\S]*?\}\)\(\);\s*<\/script>/);
check(!!scriptMatch, "found the inline IIFE script block to execute");
if (!scriptMatch) { console.error("FATAL: cannot continue without the script block"); process.exit(1); }
const pageScript = scriptMatch[0].replace(/^<script>/, "").replace(/<\/script>$/, "");

// Default values exactly as they appear in the HTML's own <input>/<select> value= attributes —
// this replays the real "page just loaded" scenario, not a hand-picked test scenario.
const DEFAULTS = {
  scProcess: "cnc3", scBatch: "24", scMass: "3.8", scMatRate: "16.50", scBtf: "1.35",
  scReclaim: "15", scRuntime: "35", scSetup: "40", scLabor: "34.00", scOh: "14",
  vMSQ: "1250", vMAQ: "1210", vMSP: "26.00", vMAP: "28.50", vLSH: "480", vLAH: "540",
  vLSR: "42.00", vLAR: "44.50", vVOSR: "8.00", vVOAct: "4750", vBudHrs: "500", vFOHR: "24.00",
  bbInternal: "95.78", bbExternal: "186.00", bbVolume: "1800", bbTransition: "38000",
  bbRate: "10", bbYears: "3",
  qsInternalMc: "180.00", qsVendorP0: "420.00", qsGamma: "0.12",
  mcMatBaseline: "85.00", mcMatVariation: "15", mcConvBaseline: "65.00", mcConvVariation: "20",
  cpFrozen: "26.00", cpSpot: "29.50", cpVolume: "2200",
  tlCost: "18000", tlRun: "2400", tlBatch: "24",
  dfmThickness: "1.5", dfmPocket: "5", dfmHeight: "80",
  capOhRate: "28.00",
  mdqsRoutingErr: "6", mdqsTotalRoutings: "300", mdqsConfVar: "15", mdqsTotalConf: "500",
  mdqsUnlinkedScrap: "4", mdqsScrapEvents: "80", mdqsStaleStandards: "10", mdqsActiveParts: "400",
  gateBom: "8", gatePo: "7", gateConf: "12",
  mhrCapital: "580000", mhrLife: "7", mhrFloor: "320", mhrFloorRate: "38", mhrService: "22000",
  mhrSchedHrs: "3800", mhrOee: "78", mhrPower: "20", mhrUtilRate: "0.12", mhrConsumables: "11.75",
  // pbDomain/pbSearch aren't static value= attributes (pbDomain is a <select> whose default comes
  // from its first, un-"selected"-marked <option>; pbSearch is an empty text input) -- seeded here
  // to replay the real "page just loaded" state; the cross-check loop below skips them harmlessly
  // since neither has a matching value="..." attribute in the HTML to compare against.
  pbDomain: "all", pbSearch: "",
  lcFirstArticle: "6.0", lcLearningRate: "80", lcBatchStart: "20", lcBatchSize: "40", lcLaborRate: "45.00",
  ouEquilibrium: "27.00", ouTheta: "0.15", ouSigma: "3.50", ouHorizon: "1",
  mvarMu: "8500", mvarSigma: "6200",
  // riskP/riskS/riskD and mvarConfidence are <select>s whose default is their "selected" <option>
  // (not a value= on the <select> tag itself) -- same non-cross-checked pattern as pbDomain above.
  riskP: "3", riskS: "3", riskD: "3", mvarConfidence: "95",
  // capAvailN/capBookedN are generated by renderCapacityInputs() as a JS template string, not a
  // static HTML value= attribute -- seeded here to match CAP_WEEKS's own real defaults in the page
  // script (checked against CAP_WEEKS below, not just asserted) so this harness replays the real
  // "page just loaded" scenario rather than silently computing against empty/zero inputs.
  capAvail0: "160", capBooked0: "150", capAvail1: "160", capBooked1: "140",
  capAvail2: "160", capBooked2: "100", capAvail3: "160", capBooked3: "90",
  capAvail4: "160", capBooked4: "155", capAvail5: "160", capBooked5: "120",
};
// Cross-check DEFAULTS against the HTML's own value= attributes so this harness can't silently
// drift from the real page if a default is ever changed there and not here.
Object.keys(DEFAULTS).forEach((id) => {
  const re = new RegExp(`id="${id}"[^>]*value="([^"]*)"|value="([^"]*)"[^>]*id="${id}"`);
  const m = html.match(re);
  if (m) {
    const real = m[1] !== undefined ? m[1] : m[2];
    check(real === DEFAULTS[id], `harness default for #${id} matches the HTML's own value= attribute`, `harness=${DEFAULTS[id]} html=${real}`);
  }
});

const elements = {};
function makeElement(id) {
  if (elements[id]) return elements[id];
  const listeners = {};
  const attrs = {};
  const classes = new Set();
  const el = {
    id, value: DEFAULTS[id] !== undefined ? DEFAULTS[id] : "",
    textContent: "", innerHTML: "", style: {}, className: "",
    // Real (not no-op) attribute/class tracking -- needed for the side-nav's roving-tabindex
    // logic (aria-selected/tabindex read back what was just set) and for asserting on the actual
    // resulting state, not just that a setter was called without throwing.
    classList: {
      toggle(c, force) { const has = classes.has(c); const on = force === undefined ? !has : !!force; if (on) classes.add(c); else classes.delete(c); return on; },
      add(...cs) { cs.forEach((c) => classes.add(c)); },
      remove(...cs) { cs.forEach((c) => classes.delete(c)); },
      contains(c) { return classes.has(c); },
    },
    rows: [],
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null; },
    setAttribute(name, v) { attrs[name] = String(v); },
    appendChild() {},
    click() { (listeners.click || []).forEach((fn) => fn.call(el)); },
    // Real (not no-op) focus tracking -- needed to test the shared modal focus-management helpers
    // (openModal/closeModal move focus in/out on real elements, not just toggle a CSS class). Every
    // stub element shares the same documentStub, so this updates the one document.activeElement the
    // page's own code reads back via `document.activeElement === first/last` (trapModalTab) and
    // `modalReturnFocusTo.focus()` (closeModal).
    focus() { documentStub.activeElement = el; },
    // Test-only helper (not a real Element method) so keyboard-nav logic can be exercised the same
    // way click() already exercises click handlers -- fires a stubbed event at every listener
    // registered for `type` via addEventListener.
    fire(type, evt) { (listeners[type] || []).forEach((fn) => fn.call(el, evt || {})); },
  };
  elements[id] = el;
  return el;
}
// querySelectorAll is selector-blind in general (no CSS engine here) -- but the side-nav's own
// tab-collection queries are load-bearing for testing the actual navigation/keyboard-nav logic
// (not a parallel reimplementation), so those two specific, known selectors are special-cased by
// resolving the real ids straight out of this page's own HTML, not a hand-maintained list that
// could silently drift from it.
const NAVTAB_IDS = [...html.matchAll(/id="(navtab-[a-z]+)"/g)].map((m) => m[1]);
const TABPANEL_IDS = [...html.matchAll(/id="(tab-[a-z]+)"/g)].map((m) => m[1]);
// A real browser's getAttribute('data-tab') reads a STATIC markup attribute -- this stub's
// getAttribute only ever returns what's been set at runtime via setAttribute, so the static
// data-tab value has to be seeded onto each stub element once, at creation time, or every
// data-tab comparison inside activateTab()/keyboard-nav silently sees null instead of the real
// value (reproduced: this was a real bug in the first version of this stub upgrade, caught by the
// very checks it exists to support -- fixed here, not worked around in the checks).
function makeNavTab(id) {
  const el = makeElement(id);
  if (el.getAttribute("data-tab") === null) el.setAttribute("data-tab", id.replace("navtab-", ""));
  return el;
}
const documentStub = {
  getElementById: (id) => makeElement(id),
  querySelectorAll: (sel) => {
    if (sel === '.sidenav-item[role="tab"]') return NAVTAB_IDS.map(makeNavTab);
    if (sel === '.tabpanel') return TABPANEL_IDS.map(makeElement);
    return [];
  },
  querySelector: (sel) => {
    if (sel === '.sidenav-list') return makeElement('__sidenavList');
    return makeElement("__q_" + Math.random());
  },
  documentElement: makeElement('__documentElement'),
  createElement: () => makeElement("__created_" + Math.random()),
  // The Escape-to-close modal handler binds a document-level keydown listener -- a real browser
  // has document.addEventListener; this stub only needs to accept the call without throwing (the
  // actual Escape-key behavior is verified live in-browser, not re-implemented here).
  addEventListener() {},
  // Tracks whichever stub element's .focus() was called most recently -- see makeElement's focus()
  // above. Real browsers seed this with document.body; nothing has focus yet in this stub at load.
  activeElement: null,
};
// Minimal, controllable window.matchMedia -- lets the collapse-toggle's isNavForcedCollapsed()/
// renderCollapseState() forced-narrow-viewport code path actually run inside this stub instead of
// being permanently accepted-limitationed away by `typeof window.matchMedia !== 'function'`.
// matchMediaMatches starts false (not narrow), matching the pre-existing stubbed-run behavior this
// harness already asserted below. registerMqListener records the page's own 'change' subscription so
// a test can simulate a live viewport resize by flipping matchMediaMatches and re-invoking it --
// exactly how a real MediaQueryList fires its change event, not a reimplementation of the page logic.
let matchMediaMatches = false;
const mqChangeListeners = [];
function stubMatchMedia(query) {
  return {
    matches: matchMediaMatches,
    addEventListener(type, fn) { if (type === "change") mqChangeListeners.push(fn); },
    addListener(fn) { mqChangeListeners.push(fn); },
    removeEventListener() {},
    removeListener() {},
  };
}
function simulateViewportForcedNarrow(forced) {
  matchMediaMatches = forced;
  mqChangeListeners.forEach((fn) => fn());
}
const sandbox = { document: documentStub, localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } }, console, Math, Object, Array, parseFloat, isFinite, matchMedia: stubMatchMedia };
sandbox.window = sandbox;
vm.createContext(sandbox);
try {
  vm.runInContext(pageScript, sandbox);
  check(true, "the real inline script executed without throwing in the stubbed DOM");
} catch (e) {
  check(false, "the real inline script executed without throwing in the stubbed DOM", e.stack);
  process.exit(1);
}

console.log("--- Vertical side navigation: behavioral checks (real activateTab()/keyboard-nav code, not a reimplementation) ---");
// Pre-registered expectations before running: activating "shouldcost" should select navtab-
// shouldcost (aria-selected=true, tabindex=0), deselect navtab-exec (aria-selected=false,
// tabindex=-1), and show tab-shouldcost's panel (.active) while hiding tab-exec's.
check(typeof sandbox.activateTab === "function", "window.activateTab is exposed as a function");
sandbox.activateTab("shouldcost", { focus: false });
check(elements["navtab-shouldcost"].getAttribute("aria-selected") === "true", "activateTab('shouldcost') marks navtab-shouldcost aria-selected=true", elements["navtab-shouldcost"].getAttribute("aria-selected"));
check(elements["navtab-shouldcost"].getAttribute("tabindex") === "0", "activateTab('shouldcost') gives navtab-shouldcost the roving tabindex=0", elements["navtab-shouldcost"].getAttribute("tabindex"));
check(elements["navtab-exec"].getAttribute("aria-selected") === "false", "activateTab('shouldcost') marks navtab-exec aria-selected=false", elements["navtab-exec"].getAttribute("aria-selected"));
check(elements["navtab-exec"].getAttribute("tabindex") === "-1", "activateTab('shouldcost') removes navtab-exec from the tab order (tabindex=-1)", elements["navtab-exec"].getAttribute("tabindex"));
check(elements["tab-shouldcost"].classList.contains("active"), "activateTab('shouldcost') shows the tab-shouldcost panel");
check(!elements["tab-exec"].classList.contains("active"), "activateTab('shouldcost') hides the tab-exec panel");

console.log("--- Vertical side navigation: keyboard-nav checks (ArrowDown/ArrowUp/Home/End, roving tabindex) ---");
sandbox.activateTab("exec", { focus: false }); // reset to a known starting point before exercising arrow keys
const sidenavListEl = sandbox.document.querySelector(".sidenav-list");
sidenavListEl.fire("keydown", { key: "ArrowDown", preventDefault() {} });
check(elements["navtab-shouldcost"].getAttribute("aria-selected") === "true", "ArrowDown from Executive Overview selects the next item (Should-Cost & MHR)", elements["navtab-shouldcost"].getAttribute("aria-selected"));
sidenavListEl.fire("keydown", { key: "ArrowUp", preventDefault() {} });
check(elements["navtab-exec"].getAttribute("aria-selected") === "true", "ArrowUp moves back to the previous item (Executive Overview)", elements["navtab-exec"].getAttribute("aria-selected"));
sidenavListEl.fire("keydown", { key: "ArrowUp", preventDefault() {} });
check(elements["navtab-methodology"].getAttribute("aria-selected") === "true", "ArrowUp from the first item wraps around to the last item (Methodology & Sourcing)", elements["navtab-methodology"].getAttribute("aria-selected"));
sidenavListEl.fire("keydown", { key: "Home", preventDefault() {} });
check(elements["navtab-exec"].getAttribute("aria-selected") === "true", "Home jumps to the first item (Executive Overview)", elements["navtab-exec"].getAttribute("aria-selected"));
sidenavListEl.fire("keydown", { key: "End", preventDefault() {} });
check(elements["navtab-methodology"].getAttribute("aria-selected") === "true", "End jumps to the last item (Methodology & Sourcing)", elements["navtab-methodology"].getAttribute("aria-selected"));
sandbox.activateTab("exec", { focus: false }); // restore the default starting tab before later checks

console.log("--- Vertical side navigation: collapse/expand toggle ---");
check(sandbox.document.getElementById("sidenav").getAttribute("data-collapsed") === "false", "side-nav starts expanded by default in this stubbed run (no stored preference, and window.innerWidth is undefined in the stub -- not narrow)", sandbox.document.getElementById("sidenav").getAttribute("data-collapsed"));
elements.sidenavToggle.click();
check(sandbox.document.getElementById("sidenav").getAttribute("data-collapsed") === "true", "clicking the collapse toggle actually collapses the side-nav", sandbox.document.getElementById("sidenav").getAttribute("data-collapsed"));
check(elements.sidenavToggle.getAttribute("aria-expanded") === "false", "the toggle's own aria-expanded state flips to false when collapsed", elements.sidenavToggle.getAttribute("aria-expanded"));
elements.sidenavToggle.click();
check(sandbox.document.getElementById("sidenav").getAttribute("data-collapsed") === "false", "clicking it again expands the side-nav back", sandbox.document.getElementById("sidenav").getAttribute("data-collapsed"));

console.log("--- Stress-test round (2026-09-05) fix 3: collapse toggle stops lying below the CSS's own 760px hard floor ---");
// Pre-registered expectation: below 760px the CSS itself force-collapses the side-nav regardless of
// the user's stored preference -- before this fix the toggle's aria-expanded/disabled state never
// knew that (a real, reproduced case: toggle claimed "expanded, clickable" while the nav rendered at
// 60px underneath it, and clicking it visibly did nothing). simulateViewportForcedNarrow flips this
// stub's matchMedia mock and fires the exact 'change' callback the real page itself registers --
// exercising the real isNavForcedCollapsed()/renderCollapseState() code, not a reimplementation.
check(elements.sidenavToggle.disabled === false, "the toggle is NOT disabled while the (mocked) viewport is wide/not forced", elements.sidenavToggle.disabled);
simulateViewportForcedNarrow(true);
check(sandbox.document.getElementById("sidenav").getAttribute("data-collapsed") === "true", "simulating a <=760px viewport force-collapses the side-nav even though the user's stored preference is still 'expanded'", sandbox.document.getElementById("sidenav").getAttribute("data-collapsed"));
check(elements.sidenavToggle.getAttribute("aria-expanded") === "false", "aria-expanded correctly reports 'collapsed' once the viewport forces it, not the stale desired-state", elements.sidenavToggle.getAttribute("aria-expanded"));
check(elements.sidenavToggle.getAttribute("aria-label") === "Expand navigation", "the toggle's own aria-label updates to match the forced-collapsed state, not a static string", elements.sidenavToggle.getAttribute("aria-label"));
check(elements.sidenavToggle.disabled === true, "the toggle disables itself while forced -- no false affordance for an action that would visibly do nothing", elements.sidenavToggle.disabled);
const navDataCollapsedWhileForced = sandbox.document.getElementById("sidenav").getAttribute("data-collapsed");
elements.sidenavToggle.click();
check(sandbox.document.getElementById("sidenav").getAttribute("data-collapsed") === navDataCollapsedWhileForced, "clicking the toggle while forced is a genuine no-op (the click handler's own early-return), not just a disabled visual with live behavior still underneath", sandbox.document.getElementById("sidenav").getAttribute("data-collapsed"));
simulateViewportForcedNarrow(false);
check(sandbox.document.getElementById("sidenav").getAttribute("data-collapsed") === "false", "un-forcing the viewport (simulating a resize back to desktop width) restores the user's real desired state (still 'expanded', since the forced click above was correctly a no-op)", sandbox.document.getElementById("sidenav").getAttribute("data-collapsed"));
check(elements.sidenavToggle.disabled === false, "the toggle re-enables itself once the viewport no longer forces collapse", elements.sidenavToggle.disabled);

console.log("--- High-Contrast Mode: behavioral checks ---");
check(sandbox.document.documentElement.getAttribute("data-contrast") !== "true", "high-contrast is off by default (no stored preference)", sandbox.document.documentElement.getAttribute("data-contrast"));
elements.contrastBtn.click();
check(sandbox.document.documentElement.getAttribute("data-contrast") === "true", "clicking the High-Contrast toggle actually sets data-contrast=true on the document root (the attribute the CSS overrides key off)", sandbox.document.documentElement.getAttribute("data-contrast"));
check(elements.contrastBtn.getAttribute("aria-pressed") === "true", "the toggle's own aria-pressed state reflects that it's on", elements.contrastBtn.getAttribute("aria-pressed"));
elements.contrastBtn.click();
check(sandbox.document.documentElement.getAttribute("data-contrast") === "false", "clicking it again turns high-contrast back off", sandbox.document.documentElement.getAttribute("data-contrast"));

console.log("--- Should-Cost calculator: golden values (verified live in-browser before this file existed) ---");
// CNC-3-Axis/CNC-5-Axis rate-card values nudged on 2026-09-04 (a stress-test found $26.00/$46.00
// sat 2.2%/3.9% from specific fabricated MHR figures in two of the downloaded documents) -- every
// golden value below was re-derived and re-verified live in-browser after the change, not just
// hand-adjusted to match the new formula.
check(elements.scOutMhr.textContent === "$24.00/hr", "MHR resolves to the CNC-3-Axis rate card value", elements.scOutMhr.textContent);
check(elements.scOutMat.textContent === "$81.35", "material cost matches the browser-verified golden value", elements.scOutMat.textContent);
check(elements.scOutMach.textContent === "$14.67", "machine conversion cost matches the browser-verified golden value", elements.scOutMach.textContent);
check(elements.scOutLabor.textContent === "$10.39", "labor cost matches the browser-verified golden value", elements.scOutLabor.textContent);
check(elements.scOutOh.textContent === "$14.90", "overhead cost matches the browser-verified golden value", elements.scOutOh.textContent);
check(elements.scOutTotal.textContent === "$121.31", "should-cost TOTAL matches the browser-verified golden value (and equals the sum of the four lines above)", elements.scOutTotal.textContent);

console.log("--- Variance Waterfall: golden values ---");
check(elements.outMPV.textContent === "+$3,025", "MPV matches golden value", elements.outMPV.textContent);
check(elements.outMQV.textContent === "-$1,040", "MQV matches golden value", elements.outMQV.textContent);
check(elements.outDLRV.textContent === "+$1,350", "DLRV matches golden value", elements.outDLRV.textContent);
check(elements.outDLEV.textContent === "+$2,520", "DLEV matches golden value", elements.outDLEV.textContent);
check(elements.outVOSV.textContent === "+$430", "VOSV matches golden value", elements.outVOSV.textContent);
check(elements.outFOHV.textContent === "-$960", "FOHV matches golden value", elements.outFOHV.textContent);
check(elements.outNet.textContent === "+$5,325", "net total variance matches golden value (and equals the sum of the six lines above)", elements.outNet.textContent);

console.log("--- Build-vs-Buy / NPV: golden values ---");
check(elements.bbUnitSave.textContent === "$90.22", "unit saving matches golden value", elements.bbUnitSave.textContent);
check(elements.bbAnnualSave.textContent === "$162,396", "annual saving matches golden value", elements.bbAnnualSave.textContent);
check(elements.bbPayback.textContent === "0.23 years", "simple payback matches golden value", elements.bbPayback.textContent);
check(elements.bbNpv.textContent === "$365,855", "3-year NPV @ 10% matches golden value", elements.bbNpv.textContent);
check(elements.bbCashflowBody.innerHTML.split("<tr>").length - 1 === 4, "cash-flow table has exactly 4 rows (Year 0 + 3 years, matching the default horizon)", elements.bbCashflowBody.innerHTML.split("<tr>").length - 1);

console.log("--- Volume Crossover Point (Q*): golden values (pre-registered via Python, confirms the closed-form model — NOT the source document's own broken total-cost script) ---");
check(elements.qsOut.textContent === "1,165 units", "crossover volume matches golden value ((420/180)^(1/0.12))", elements.qsOut.textContent);
check(elements.qsVendorAtStar.textContent === "$180.00", "vendor price at Q* matches golden value and equals the internal marginal cost input exactly (confirms this IS the crossover)", elements.qsVendorAtStar.textContent);

console.log("--- Build-vs-Buy Crossover Chart: golden pixel-math values (SVG chart, first of its kind on this page) ---");
const chartData = sandbox.renderQStarChart();
check(Math.abs(chartData.qStar - 1165.3952) < 0.01, "chart's own computed Q* matches the calculator's Q* (same formula, not a second implementation)", chartData.qStar);
check(chartData.qMax === 2331, "chart x-axis max matches golden value (round(Q*)*2)", chartData.qMax);
check(Math.abs(chartData.yMax - 483) < 0.01, "chart y-axis max matches golden value (max(P0,MC)*1.15)", chartData.yMax);
check(Math.abs(chartData.qStarX - 319.87) < 0.1, "Q* marker's x pixel position matches golden value", chartData.qStarX);
check(Math.abs(chartData.mcY - 164.29) < 0.1, "internal-cost line's y pixel position matches golden value", chartData.mcY);
check(elements.qsChartWrap.innerHTML.includes("<svg"), "the chart actually rendered an <svg> element into the page, not just returned numbers");
check(elements.qsChartWrap.innerHTML.includes("Q* = 1,165"), "the rendered SVG labels the crossover with the correct Q* value");

console.log("--- Monte Carlo Should-Cost Explorer: golden values (seeded PRNG -- deterministic, not a copy of the source document's LogNormal/PERT machinery) ---");
check(elements.mcP50Out.textContent === "$149.88", "P50 matches golden value (seed=42, 5000 trials)", elements.mcP50Out.textContent);
check(elements.mcP80Out.textContent === "$159.28", "P80 matches golden value", elements.mcP80Out.textContent);
check(elements.mcP95Out.textContent === "$167.33", "P95 matches golden value", elements.mcP95Out.textContent);
check(elements.mcRangeOut.textContent === "$125.32 – $175.60", "simulated min-max range matches golden value", elements.mcRangeOut.textContent);
const mcRun1 = sandbox.calcMonteCarlo();
const mcRun2 = sandbox.calcMonteCarlo();
check(mcRun1.p50 === mcRun2.p50 && mcRun1.p95 === mcRun2.p95, "calling the real calcMonteCarlo() twice in a row with the same inputs reproduces an identical result (deterministic seeded PRNG, not Math.random())", `run1=${mcRun1.p50}/${mcRun1.p95} run2=${mcRun2.p50}/${mcRun2.p95}`);

console.log("--- Universal Command Palette: structural + filter checks ---");
check(Array.isArray(sandbox.COMMAND_INDEX), "window.COMMAND_INDEX is exposed as an array");
check(sandbox.COMMAND_INDEX.length === 21, "exactly 21 navigable items in the command index", sandbox.COMMAND_INDEX.length);
check(new Set(sandbox.COMMAND_INDEX.map((c) => c.label)).size === 21, "all 21 command labels are unique");
const KNOWN_TABS = ["exec", "shouldcost", "variance", "buildbuy", "capacity", "tooling", "dfm", "governance", "playbook", "risk", "framework", "methodology"];
check(sandbox.COMMAND_INDEX.every((c) => KNOWN_TABS.includes(c.tab)), "every command index entry points at a real, known tab id");
const allMatch = sandbox.renderPaletteList("");
check(allMatch.length === 21, "empty-query search returns all 21 items", allMatch.length);
const learningMatch = sandbox.renderPaletteList("learning");
check(learningMatch.length === 1 && learningMatch[0].label === "Learning Curve Forecaster", "searching \"learning\" narrows to exactly the one matching item", JSON.stringify(learningMatch.map((c) => c.label)));
const riskTabMatch = sandbox.COMMAND_INDEX.filter((c) => c.tab === "risk");
check(riskTabMatch.length === 4, "exactly 4 command index entries point at the Predictive & Risk Models tab", riskTabMatch.length);
sandbox.renderPaletteList(""); // restore all-items state before any later checks read paletteList's innerHTML

console.log("--- Stress-test round (2026-09-05) fix 9: Command Palette exposes real ARIA combobox/listbox semantics ---");
// Before this fix, arrow-key highlighting was purely visual (a CSS .selected class) -- a screen
// reader had no way to know which of the 21 rendered options was highlighted, or that the input was
// driving a list at all.
check(/id="paletteInput"[^>]*role="combobox"/.test(html), "the palette search input is a real ARIA combobox");
check(/id="paletteInput"[^>]*aria-controls="paletteList"/.test(html), "the combobox's aria-controls points at the real #paletteList id");
check(/id="paletteList"[^>]*role="listbox"/.test(html), "the results container is a real ARIA listbox, not just a styled <div>");
sandbox.renderPaletteList("");
check(elements.paletteList.innerHTML.includes('role="option"'), "rendered palette items carry role=\"option\"");
check(elements.paletteList.innerHTML.includes('id="palette-item-0"'), "the first rendered item has a stable, predictable id (needed for aria-activedescendant to reference it)");
check(elements.paletteList.innerHTML.includes('aria-selected="true"'), "the first (default-highlighted) item is marked aria-selected=\"true\"");
check(elements.paletteInput.getAttribute("aria-activedescendant") === "palette-item-0", "the combobox's aria-activedescendant tracks the currently-highlighted option's real id, not left empty", elements.paletteInput.getAttribute("aria-activedescendant"));
const noPaletteMatch = sandbox.renderPaletteList("zzz-no-such-command-zzz");
check(noPaletteMatch.length === 0 && elements.paletteInput.getAttribute("aria-activedescendant") === "", "when a search has zero matches, aria-activedescendant is correctly cleared rather than pointing at a stale/nonexistent option id", elements.paletteInput.getAttribute("aria-activedescendant"));
sandbox.renderPaletteList(""); // restore all-items state before any later checks read paletteList's innerHTML
// Stub limitation (not a page bug): arrow-key-driven re-highlighting (updatePaletteSelection) calls
// paletteListEl.querySelectorAll('.palette-item') -- a real DOM method every browser element has, but
// this stub only implements querySelectorAll on documentStub itself, not on individual stub elements,
// so that path can't run in Node. Verified live in a real browser instead (2026-09-05): ArrowDown
// correctly moved aria-activedescendant from palette-item-0 to palette-item-1, and the referenced
// option carried role="option" aria-selected="true" -- confirmed working, not an open gap.
check(html.includes('id="paletteModal"') && html.includes('id="paletteInput"') && html.includes('id="paletteBtn"'), "the palette modal, search input, and header trigger button all exist in the HTML");
check(html.includes("⌘K"), "the header button visibly hints at the Cmd/Ctrl+K shortcut");

console.log("--- Capacity & Absorption Forecast: golden values ---");
check(JSON.stringify(sandbox.CAP_WEEKS) === JSON.stringify([{avail:160,booked:150},{avail:160,booked:140},{avail:160,booked:100},{avail:160,booked:90},{avail:160,booked:155},{avail:160,booked:120}]), "this harness's seeded default inputs (capAvailN/capBookedN) match the page's own CAP_WEEKS array, not a stale copy", JSON.stringify(sandbox.CAP_WEEKS));
check(elements.capUnabHrs2.textContent === "60.0", "Week 3 unabsorbed hours matches golden value (160 avail - 100 booked)", elements.capUnabHrs2.textContent);
check(elements.capUnabDollars2.textContent === "$1,680", "Week 3 unabsorbed dollars matches golden value (60hrs x $28/hr)", elements.capUnabDollars2.textContent);
check(elements.capUtil2.textContent === "62.50%", "Week 3 utilization matches golden value", elements.capUtil2.textContent);
check(elements.capStatus2.innerHTML.includes(">RED<"), "Week 3 (62.5% utilization) is correctly banded RED (<70%)", elements.capStatus2.innerHTML);
check(elements.capTotalRow.innerHTML.includes("$5,740"), "6-week total unabsorbed dollars matches golden value", elements.capTotalRow.innerHTML);
check(elements.capTotalRow.innerHTML.includes("78.65%"), "6-week overall utilization matches golden value", elements.capTotalRow.innerHTML);
check(elements.capTotalRow.innerHTML.includes(">AMBER<"), "78.65% overall utilization is correctly banded AMBER (70-85%)", elements.capTotalRow.innerHTML);

console.log("--- Tooling Amortization: golden values ---");
check(elements.tlPerUnit.textContent === "$7.50", "per-unit amortized cost matches golden value ($18,000 / 2,400 units)", elements.tlPerUnit.textContent);
check(elements.tlNaive.textContent === "$750.00/unit", "naive first-batch-only cost matches golden value ($18,000 / 24 units)", elements.tlNaive.textContent);
check(elements.tlOverstate.textContent === "100.0×", "overstatement factor matches golden value (750 / 7.50 = 100x, also = expectedRun/firstBatch = 2400/24)", elements.tlOverstate.textContent);

console.log("--- DFM/DFC Cost Sensitivity: golden values ---");
check(elements.dfmWallOut.textContent === "+24.0%", "wall-thickness penalty matches golden value (1.5mm vs 3.0mm reference)", elements.dfmWallOut.textContent);
check(elements.dfmPocketOut.textContent === "+5.0%", "pocket-depth penalty matches golden value (5:1 vs 4:1 reference)", elements.dfmPocketOut.textContent);
check(elements.dfmHeightOut.textContent === "+24.0%", "build-height penalty matches golden value (80mm x 0.3%/mm)", elements.dfmHeightOut.textContent);
check(elements.dfmTotalOut.textContent === "+53.0%", "total uplift matches golden value (sum of the three penalties above)", elements.dfmTotalOut.textContent);
check(elements.dfmCostOut.textContent === "$153.00", "estimated cost matches golden value ($100 baseline x 1.53)", elements.dfmCostOut.textContent);

console.log("--- Commodity Price Exposure Early Warning: golden values ---");
check(elements.cpShiftPct.textContent === "13.46%", "price shift % matches golden value ($29.50 vs $26.00 frozen)", elements.cpShiftPct.textContent);
check(elements.cpProjected.textContent === "+$7,700", "projected MPV exposure matches golden value ($3.50/kg x 2,200kg)", elements.cpProjected.textContent);
check(elements.cpStatus.innerHTML.includes(">WARNING<"), "13.46% shift correctly triggers WARNING (>8% threshold)", elements.cpStatus.innerHTML);

console.log("--- Mean-Reversion Forward Band (Ornstein-Uhlenbeck): golden values (pre-registered via Python) ---");
check(elements.ouExpected.textContent === "$29.15", "expected forward price matches golden value (P̄=27, Pt=29.50, θ=0.15, Δt=1)", elements.ouExpected.textContent);
check(elements.ouStdDev.textContent === "$3.25", "forecast std. deviation matches golden value", elements.ouStdDev.textContent);
check(elements.ouBand.textContent === "$22.78 – $35.53", "95% two-sided forward band matches golden value (expected ± 1.96×stddev)", elements.ouBand.textContent);

console.log("--- Data Governance: MDQS + Guardrail Gate Simulator golden values ---");
check(elements.mdqsScore.textContent === "96.875%", "MDQS score matches golden value (100% - weighted deductions)", elements.mdqsScore.textContent);
check(elements.mdqsBand.innerHTML.includes(">AMBER<"), "96.875% is correctly banded AMBER (93-98%)", elements.mdqsBand.innerHTML);
check(elements.gateBomOut.innerHTML.includes(">PASS<"), "BOM gate (8% vs 15% threshold) correctly PASSES", elements.gateBomOut.innerHTML);
check(elements.gatePoOut.innerHTML.includes(">BLOCKED<"), "PO gate (7% vs 5% threshold) correctly BLOCKS", elements.gatePoOut.innerHTML);
check(elements.gateConfOut.innerHTML.includes(">PASS<"), "Confirmation gate (12% vs 15% threshold) correctly PASSES", elements.gateConfOut.innerHTML);

console.log("--- MHR Build-Up Calculator: golden values (pre-registered via Python, verified before this file was written) ---");
check(elements.mhrDepOut.textContent === "$82,857", "annual depreciation matches golden value ($580,000 / 7 yrs)", elements.mhrDepOut.textContent);
check(elements.mhrFloorOut.textContent === "$12,160", "annual floor allocation matches golden value (320 sq ft x $38/sq ft)", elements.mhrFloorOut.textContent);
check(elements.mhrStandingBasisOut.textContent === "$117,017", "standing cost basis matches golden value (depreciation + floor + service)", elements.mhrStandingBasisOut.textContent);
check(elements.mhrProdHrsOut.textContent === "2,964", "productive hours matches golden value (3,800 scheduled x 78% OEE)", elements.mhrProdHrsOut.textContent);
check(elements.mhrStandingOut.textContent === "$39.48/hr", "standing rate matches golden value (standing basis / productive hours)", elements.mhrStandingOut.textContent);
check(elements.mhrRunningOut.textContent === "$14.15/hr", "running rate matches golden value (20kW x $0.12/kWh + $11.75 consumables)", elements.mhrRunningOut.textContent);
check(elements.mhrTotalOut.textContent === "$53.63/hr", "fully burdened MHR matches golden value (standing + running, and equals the sum of the two lines above)", elements.mhrTotalOut.textContent);
check(!bannedStrings.some((s) => elements.mhrCapital && [elements.mhrDepOut, elements.mhrStandingOut, elements.mhrTotalOut].some((el) => el.textContent.includes(s))), "the MHR Build-Up Calculator's own outputs don't happen to reproduce any of the banned fabricated figures");

console.log("--- Cost Diagnostic Playbook: structural + golden-value checks ---");
check(Array.isArray(sandbox.PLAYBOOK), "window.PLAYBOOK is exposed as an array");
check(sandbox.PLAYBOOK.length === 30, "exactly 30 playbook scenarios", sandbox.PLAYBOOK.length);
check(new Set(sandbox.PLAYBOOK.map((p) => p.code)).size === 30, "all 30 playbook KPI codes are unique");
check(new Set(sandbox.PLAYBOOK.map((p) => p.num)).size === 30, "all 30 playbook question numbers are unique");
const PB_DOMAINS = ["material", "cnc", "additive", "labor", "overhead", "quoting"];
PB_DOMAINS.forEach((d) => {
  const count = sandbox.PLAYBOOK.filter((p) => p.domain === d).length;
  check(count === 5, `domain "${d}" has exactly 5 scenarios (30 / 6 domains)`, count);
});
["q", "root", "formula", "worked", "result", "gl", "action", "green", "amber", "red"].forEach((field) => {
  const allNonEmpty = sandbox.PLAYBOOK.every((p) => typeof p[field] === "string" && p[field].length > 0);
  check(allNonEmpty, `every playbook scenario has a non-empty "${field}" field`);
});
// Same fabrication-guard discipline as the rest of the page, applied to the playbook data
// specifically -- this is where the fifth document's copied-from-document-one MHR figures would
// leak in if the recompute (done by hand via Python before this file was written) had been missed.
const playbookBlob = JSON.stringify(sandbox.PLAYBOOK);
const foundBannedInPlaybook = bannedStrings.concat(wrongClaimStrings).filter((s) => playbookBlob.includes(s));
check(foundBannedInPlaybook.length === 0, "none of the banned/wrong-claim strings leaked into the playbook data itself", JSON.stringify(foundBannedInPlaybook));

check(!!elements.pbCount, "found the playbook count element to check");
check(elements.pbCount.textContent === "Showing 30 of 30 scenarios", "default (all domains, empty search) shows all 30 scenarios", elements.pbCount.textContent);
check(elements.pbList.innerHTML.split('class="pb-card"').length - 1 === 30, "rendered exactly 30 pb-card divs by default", elements.pbList.innerHTML.split('class="pb-card"').length - 1);

// Exercise the live filter/search the same way a user would -- mutate the stub's own element
// value, then re-invoke the real render function (not a parallel reimplementation).
elements.pbDomain.value = "additive";
sandbox.renderPlaybook();
check(elements.pbCount.textContent === "Showing 5 of 30 scenarios", "filtering to the \"additive\" domain shows exactly 5 scenarios", elements.pbCount.textContent);
elements.pbDomain.value = "all";
elements.pbSearch.value = "buy-to-fly";
sandbox.renderPlaybook();
check(elements.pbCount.textContent === "Showing 1 of 30 scenarios", "searching \"buy-to-fly\" narrows to exactly the one scenario naming it in its KPI title", elements.pbCount.textContent);
elements.pbSearch.value = "";
sandbox.renderPlaybook();
check(elements.pbCount.textContent === "Showing 30 of 30 scenarios", "clearing the search restores all 30 scenarios (filter state isn't sticky/broken)", elements.pbCount.textContent);

console.log("--- Learning Curve Forecaster: golden values (pre-registered via Python/Node, matching a corrected recompute of the source document's own worked example) ---");
// The source document's own worked example ($3,345.75) has a real ~0.4% arithmetic slip -- this
// dashboard's golden value is the independently re-derived correct figure, not a copy of theirs.
check(elements.lcB.textContent === "-0.3219", "learning index b matches golden value (ln(0.80)/ln(2))", elements.lcB.textContent);
check(elements.lcTotalHours.textContent === "74.64 hrs", "total labor hours matches golden value", elements.lcTotalHours.textContent);
check(elements.lcAvgUnitTime.textContent === "1.87 hrs", "average unit time matches golden value", elements.lcAvgUnitTime.textContent);
check(elements.lcTotalCost.textContent === "$3358.59", "total labor cost matches golden value (independently re-derived, NOT the source document's own $3,345.75 -- a real ~0.4% arithmetic slip found in their worked example)", elements.lcTotalCost.textContent);
check(elements.lcDistortion.textContent === "-$7,441 (fake favorable)", "the static-standard distortion matches golden value and is correctly labeled a fake favorable variance, not real performance", elements.lcDistortion.textContent);

console.log("--- Cost Risk Register (CRPN): structural + arithmetic checks ---");
check(Array.isArray(sandbox.RISK_REGISTER), "window.RISK_REGISTER is exposed as an array");
check(sandbox.RISK_REGISTER.length === 10, "exactly 10 risk scenarios", sandbox.RISK_REGISTER.length);
check(new Set(sandbox.RISK_REGISTER.map((r) => r.id)).size === 10, "all 10 risk IDs are unique");
const EXPECTED_CRPN = { "RSK-01": 32, "RSK-02": 45, "RSK-03": 12, "RSK-04": 48, "RSK-05": 16, "RSK-06": 30, "RSK-07": 32, "RSK-08": 24, "RSK-09": 24, "RSK-10": 36 };
sandbox.RISK_REGISTER.forEach((r) => {
  const crpn = r.p * r.s * r.d;
  check(crpn === EXPECTED_CRPN[r.id], `${r.id}: P×S×D (${r.p}×${r.s}×${r.d}) = ${crpn} matches the hand-verified golden value`, `expected ${EXPECTED_CRPN[r.id]}`);
});
const renderedRows = elements.riskRegisterBody.innerHTML.split("<tr>").length - 1;
check(renderedRows === 10, "rendered exactly 10 risk register rows", renderedRows);
const escalateCount = (elements.riskRegisterBody.innerHTML.match(/ESCALATE/g) || []).length;
check(escalateCount === 6, "exactly 6 of 10 risks are correctly banded ESCALATE (CRPN >= 25, the document's own governance threshold)", escalateCount);

console.log("--- Risk Scorer: golden values (default P=3, S=3, D=3) ---");
check(elements.riskScoreOut.textContent === "27", "default risk score matches golden value (3x3x3)", elements.riskScoreOut.textContent);
check(elements.riskScoreBand.innerHTML.includes("ESCALATE"), "CRPN 27 (>= 25) correctly bands ESCALATE", elements.riskScoreBand.innerHTML);

console.log("--- Manufacturing Value at Risk (M-VaR): golden values ---");
check(elements.mvarZ.textContent === "1.645", "default (95%) Z-score matches golden value", elements.mvarZ.textContent);
check(elements.mvarOut.textContent === "$18699.00", "M-VaR at 95% confidence matches golden value (mu=8500, sigma=6200)", elements.mvarOut.textContent);
elements.mvarConfidence.value = "99";
sandbox.calcMVaR();
check(elements.mvarZ.textContent === "2.326", "switching to 99% confidence updates the Z-score to the golden value", elements.mvarZ.textContent);
check(elements.mvarOut.textContent === "$22921.20", "M-VaR at 99% confidence matches golden value", elements.mvarOut.textContent);
elements.mvarConfidence.value = "95";
sandbox.calcMVaR();

console.log("--- Fabrication guard: Risk Register data ---");
const riskBlob = JSON.stringify(sandbox.RISK_REGISTER);
const foundBannedInRisk = bannedStrings.concat(wrongClaimStrings).filter((s) => riskBlob.includes(s));
check(foundBannedInRisk.length === 0, "none of the banned/wrong-claim strings leaked into the risk register data itself", JSON.stringify(foundBannedInRisk));

console.log("--- Explain-the-Math modal: data + wiring ---");
check(typeof sandbox.EXPLAIN === "object" && sandbox.EXPLAIN !== null, "window.EXPLAIN is exposed as an object");
["cmar", "oae", "mpv", "mqv", "dlrv", "dlev", "vosv", "fohv", "mdqs", "mhrBuildup", "learningcurve", "crpn", "mvar", "ou", "qstar", "montecarlo"].forEach((key) => {
  const e = sandbox.EXPLAIN[key];
  check(!!e && !!e.title && !!e.formula && !!e.body, `EXPLAIN["${key}"] has a title, formula, and body`);
});
const explainButtonCount = (html.match(/data-explain="/g) || []).length;
check(explainButtonCount === 17, "exactly 17 explain buttons are wired in the HTML (16 from before + the Monte Carlo Explorer)", explainButtonCount);
check(typeof sandbox.openExplain === "function", "window.openExplain is exposed as a function");

console.log("--- Stress-test round (2026-09-05) fix 4: modal focus management (WAI-ARIA \"Dialog (Modal)\" pattern) ---");
// Pre-registered expectation: opening a modal moves focus onto a real element inside it (not left on
// the now-hidden trigger); opening a second modal while one is already open auto-closes the first;
// closing the last modal in the chain restores focus to whatever had it before ANY modal opened.
// Tab-trapping itself needs a real child-DOM query engine this stub doesn't have (getFocusableIn
// calls container.querySelectorAll, which only documentStub implements, not individual stub
// elements) -- can't run in this stub. Verified live in a real browser instead (2026-09-05): with
// the palette modal's 2 real focusable elements (close button, search input), Tab on the last
// element wrapped to the first and Shift+Tab on the first wrapped to the last -- confirmed working.
check(typeof sandbox.openModal === "function" && typeof sandbox.closeModal === "function" && typeof sandbox.trapModalTab === "function" && typeof sandbox.getFocusableIn === "function", "openModal/closeModal/trapModalTab/getFocusableIn are all exposed as functions");
const preModalTrigger = makeElement("__preModalTrigger"); // stand-in for whatever real page control the user last focused before opening a modal
preModalTrigger.focus();
check(documentStub.activeElement === preModalTrigger, "sanity check: this stub's new focus-tracking actually reflects a .focus() call before testing the modal logic against it");
sandbox.openExplain("cmar");
check(elements.explainModal.classList.contains("open"), "openExplain() (routing through the shared openModal helper) adds the 'open' class to explainModal");
check(documentStub.activeElement === elements.explainClose, "opening the modal moves focus onto a real element inside it (the close button), not leaving it on the now-hidden trigger");
sandbox.openPalette();
check(elements.paletteModal.classList.contains("open"), "openPalette() opens paletteModal");
check(!elements.explainModal.classList.contains("open"), "opening a second modal (the palette) while explainModal is still open auto-closes explainModal first -- openModal's own \"close any OTHER open modal\" behavior, not two modals stacked open");
check(documentStub.activeElement === elements.paletteInput, "focus moves into the newly-opened palette's own input");
sandbox.closePalette();
check(!elements.paletteModal.classList.contains("open"), "closePalette() removes the 'open' class");
// This is the actual finding from writing this check: the first draft of openModal recaptured
// modalReturnFocusTo on EVERY open call, so swapping straight from Explain to the Palette overwrote
// it with explainModal's own (already-closing) close button instead of the real pre-modal trigger --
// closing the palette then stranded focus on a hidden element. Fixed by only capturing
// modalReturnFocusTo when no modal was already open, re-verified here (not just re-asserted).
check(documentStub.activeElement === preModalTrigger, "closing the modal restores focus to whatever had it before ANY modal opened (survives the explain->palette handoff above), not stranded on the first modal's own now-hidden control");

console.log("--- Methodology tab: newly-verified real terms are cited, not asserted without a source ---");
["Single-Minute Exchange of Die", "MTConnect", "OPC-UA", "buy-to-fly ratios of 6:1", "Movement Type 551", "Medallion Architecture"].forEach((term) => {
  check(html.includes(term), `Methodology tab cites "${term}" (independently verified this session, not asserted bare)`);
});
check(html.includes("illustrative heuristic, not a physics-based"), "the DFM/DFC model is explicitly labeled a heuristic, not a precise simulation, matching the never-fabricate discipline");

console.log("--- Rate card consistency (table cells must equal the live-computed MHR, not a stale hand-typed number) ---");
const RATE_CARD_EXPECTED = { cnc3: 24.00, cnc5: 42.00, dmls: 66.00, sheet: 13.50 };
Object.keys(RATE_CARD_EXPECTED).forEach((wc) => {
  const m = html.match(new RegExp(`data-wc="${wc}"[\\s\\S]*?data-mhr>\\$([\\d.]+)<`));
  check(!!m, `found the static MHR table cell for ${wc}`);
  if (m) check(parseFloat(m[1]) === RATE_CARD_EXPECTED[wc], `${wc}'s displayed MHR ($${m[1]}) matches window.mhrFor('${wc}') = $${sandbox.mhrFor(wc).toFixed(2)}`, `table=${m[1]} computed=${sandbox.mhrFor(wc)}`);
});

console.log("");
console.log(failures === 0 ? "All stress checks passed." : `${failures} stress check(s) FAILED (${passes} passed).`);
process.exit(failures === 0 ? 0 : 1);
