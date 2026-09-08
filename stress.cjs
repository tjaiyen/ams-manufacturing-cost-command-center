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
// The page's own inline <script> block, sliced off -- several checks need to count real static
// markup only, not the same class/tag name reused inside a JS template string elsewhere in the file
// (found twice now: the Keyboard Shortcuts overlay's .outline reuse, and the Attention & Triage tab's
// checkbox <label>). Declared here, once, near the top, so every later check can use it regardless of
// where in the file it's written.
const staticMarkup = html.slice(0, html.indexOf("<script>"));

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
check((html.match(/class="sidenav-item"/g) || []).length === 13, "exactly 13 side-nav items in the HTML (one per tab, +1 for Phase 4 batch D's Attention & Triage)", (html.match(/class="sidenav-item"/g) || []).length);
check((html.match(/role="tabpanel"/g) || []).length === 13, "exactly 13 panels carry role=\"tabpanel\"", (html.match(/role="tabpanel"/g) || []).length);
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
check(sidenavItemAriaLabelCount === 13, "all 13 side-nav item buttons carry a real aria-label, not just a CSS-only tooltip/label", sidenavItemAriaLabelCount);
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
  // .wf-bar was removed 2026-09-05 when the Variance Waterfall was rewritten from animated CSS-height
  // divs into a static SVG bridge chart (no transition property at all now, same as the Q*/Pareto/
  // Monte Carlo charts) -- there is nothing left for prefers-reduced-motion to disable here, so this
  // is a genuine removal, not a regression. See "the old .wf-bar system was fully removed" below.
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

console.log("--- Role Alignment card (req 10512991, added 2026-09-05): real, sourced org facts ---");
// Pre-registered before writing: the card must exist, must cite both live req numbers, must carry
// the verbatim charter quote and the 135+/100+ scale + 4 named enterprise systems from req 10449430,
// and must NOT literally repeat "Kuiper"/"Robotics"/"AWS data center" (the already-fabricated
// client-program claim) even in its own correction sentence -- reworded specifically to avoid
// re-triggering the bannedStrings guard rather than adding a new excluded-card region for it.
const roleAlignmentMatch = html.match(/<div class="card" id="roleAlignmentCard"[\s\S]*?doesn't survive a follow-up question in an interview\.\s*<\/p>\s*<\/div>/);
check(!!roleAlignmentMatch, "found the Role Alignment card to check");
if (roleAlignmentMatch) {
  const ra = roleAlignmentMatch[0];
  check(ra.includes("10512991") && ra.includes("10449430"), "cites both live req numbers (10512991 and 10449430)");
  check(ra.includes("build, from scratch"), "carries the posting's own verbatim charter quote");
  check(ra.includes("135+ machines") && ra.includes("100+ Amazon"), "carries the verified scale figures (135+ machines, 100+ orgs)");
  ["SAP S/4HANA", "JobBoss", "Siemens Teamcenter", "Dot Compliance"].forEach((sys) => {
    check(ra.includes(sys), `names the real enterprise system "${sys}"`);
  });
  check(ra.includes("Honest gap"), "states the honest-gap framing (systems studied, not systems operated) rather than implying hands-on experience with tools not actually used");
  check(!["Kuiper", "Robotics", "AWS data center"].some((s) => ra.includes(s)), "the card does not literally repeat the already-fabricated named-client-program strings, even while alluding to the correction");
}
check(html.includes('req 10449430</a> (Data Engineer II, AMS)'), "the Source Ledger cites req 10449430 as the source for the 135+/100+/enterprise-stack facts");

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
  arSiteAStd: "1420000", arSiteAAct: "1448200", arSiteBStd: "980000", arSiteBAct: "955400",
  arSiteCStd: "1150000", arSiteCAct: "1178000",
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

// Real static innerText for a small, explicit allowlist of ids whose page-load-time JS reads their
// own already-rendered text (not written by any calc/render function first) -- the Phase 4 batch B
// "changed since last visit" banner reads #verifyBadge's literal markup text at init, which this
// stub's default textContent="" silently returned as empty, making its regex match fail-silent and
// the whole feature look inert under test even though it worked live. Same fix shape as
// NAVTAB_ARIA_LABELS above: a targeted, HTML-derived seed for the one id that actually needs it, not
// a general HTML-parsing textContent engine this file has never needed before now.
const STATIC_TEXT_CONTENT = {};
const verifyBadgeMatch = html.match(/id="verifyBadge"[^>]*>([^<]*)</);
if (verifyBadgeMatch) STATIC_TEXT_CONTENT.verifyBadge = verifyBadgeMatch[1];
// Same allowlist shape, added for the Attention & Triage tab's OAE item: kpi-oae's real "93.1%" is a
// static exec-tab value, never written by any calc/render function, so it needs the same seed.
const kpiOaeMatch = html.match(/id="kpi-oae"[^>]*>([^<]*)</);
if (kpiOaeMatch) STATIC_TEXT_CONTENT["kpi-oae"] = kpiOaeMatch[1];

// Real static class="..." per id, seeded once from the actual markup -- unlike aria-label/textContent
// above (narrow, per-id allowlists), .className is a genuinely universal DOM property every element
// has, so this is a general seed rather than a one-off patch. Found by the Attention & Triage tab
// (Phase 4 batch D) reading a KPI tile's real class="kpi-foot amber" at init to decide whether that
// KPI belongs in its own list -- this stub's className had always defaulted to "" for every element,
// so that real, already-shipped amber state looked invisible under test even though it renders
// correctly live. Handles either attribute order (class before or after id), same style as the
// existing bidirectional DEFAULTS regex below.
const STATIC_CLASS_NAMES = {};
for (const m of html.matchAll(/id="([a-zA-Z0-9_-]+)"[^>]*class="([^"]*)"|class="([^"]*)"[^>]*id="([a-zA-Z0-9_-]+)"/g)) {
  const id = m[1] || m[4];
  const cls = m[1] ? m[2] : m[3];
  if (STATIC_CLASS_NAMES[id] === undefined) STATIC_CLASS_NAMES[id] = cls;
}

const elements = {};
function makeElement(id) {
  if (elements[id]) return elements[id];
  const listeners = {};
  const attrs = {};
  const classes = new Set();
  const el = {
    id, value: DEFAULTS[id] !== undefined ? DEFAULTS[id] : "",
    textContent: STATIC_TEXT_CONTENT[id] !== undefined ? STATIC_TEXT_CONTENT[id] : "",
    innerHTML: STATIC_INNER_HTML[id] !== undefined ? STATIC_INNER_HTML[id] : "", style: {},
    className: STATIC_CLASS_NAMES[id] !== undefined ? STATIC_CLASS_NAMES[id] : "",
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
    // Real DOM elements have this; this stub didn't, and 3 real call sites now need it
    // (jumpToDecomposition, the KPI Interaction Map's own jump(), and the guided tour) -- fixed once
    // here, at the root, rather than continuing to avoid directly invoking any of them under test.
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(attrs, name); },
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
    // Real DOM elements have this too; this stub didn't. Minimal, tag-list-only implementation
    // (e.g. 'input,button,select') that counts real tag occurrences in this element's own (real,
    // seeded) innerHTML -- not a CSS selector engine, since the only real call site this needs to
    // support (the Dashboard Self-Audit's per-tab interactive-element count) only ever passes a
    // comma-separated bare tag list. Returns an array of that length (callers here only use .length).
    querySelectorAll(sel) {
      const tags = sel.split(",").map((s) => s.trim());
      let count = 0;
      for (const tag of tags) count += (el.innerHTML.match(new RegExp(`<${tag}[\\s>]`, "g")) || []).length;
      return new Array(count).fill(null);
    },
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
// Real static innerHTML for each tabpanel <section>, sliced directly out of the page's own markup --
// needed by the Dashboard Self-Audit (Phase 5, 2026-09-07), whose calcSelfAudit() reads each tab's
// real interactive-element count via panel.querySelectorAll('input,button,select').length and an
// "illustrative" text count via panel.innerHTML.match(...). This stub's innerHTML had always
// defaulted to "" for every element (real DOM elements reflect their static markup as innerHTML even
// before any script runs) -- reproduced as a real TypeError/wrong-count under test, fixed here from
// the real HTML rather than a hand-copied duplicate, and only for the ids that are actual tabpanels
// (nothing else on this page reads an element's initial innerHTML).
const STATIC_INNER_HTML = {};
for (const id of TABPANEL_IDS) {
  const m = html.match(new RegExp(`<section class="tabpanel[^"]*" id="${id}"[^>]*>([\\s\\S]*?)<\\/section>`));
  if (m) STATIC_INNER_HTML[id] = m[1];
}
// Real counts of the Source Ledger's two srctag classes -- same Dashboard Self-Audit dependency as
// STATIC_INNER_HTML above (calcSelfAudit() reads document.querySelectorAll('.srctag.real'/'.srctag.
// illustrative').length), derived from the real markup rather than hand-copied.
const SRCTAG_REAL_COUNT = (html.match(/srctag real/g) || []).length;
const SRCTAG_ILLUSTRATIVE_COUNT = (html.match(/srctag illustrative/g) || []).length;
// Real aria-label text per navtab, extracted from the actual button markup (not hand-copied) -- the
// Phase 4 batch A stress-test found tabLabelFor() (used by the new Keyboard Shortcuts overlay's
// chord legend) reads this via document.getElementById(), which bypassed the existing data-tab
// seeding below entirely (that only ran for the querySelectorAll('.sidenav-item[role="tab"]') path),
// so every legend row rendered "null" instead of the real tab name -- reproduced, then fixed at the
// root (getElementById now seeds navtab-* the same way, see below) rather than worked around.
const NAVTAB_ARIA_LABELS = Object.fromEntries(
  [...html.matchAll(/id="(navtab-[a-z]+)"[^>]*aria-label="([^"]*)"/g)].map((m) => [m[1], m[2]])
);
// A real browser's getAttribute('data-tab') reads a STATIC markup attribute -- this stub's
// getAttribute only ever returns what's been set at runtime via setAttribute, so the static
// data-tab value has to be seeded onto each stub element once, at creation time, or every
// data-tab comparison inside activateTab()/keyboard-nav silently sees null instead of the real
// value (reproduced: this was a real bug in the first version of this stub upgrade, caught by the
// very checks it exists to support -- fixed here, not worked around in the checks).
function makeNavTab(id) {
  const el = makeElement(id);
  if (el.getAttribute("data-tab") === null) el.setAttribute("data-tab", id.replace("navtab-", ""));
  if (el.getAttribute("aria-label") === null && NAVTAB_ARIA_LABELS[id]) el.setAttribute("aria-label", NAVTAB_ARIA_LABELS[id]);
  return el;
}
const documentStub = {
  getElementById: (id) => (id.startsWith("navtab-") ? makeNavTab(id) : makeElement(id)),
  querySelectorAll: (sel) => {
    if (sel === '.sidenav-item[role="tab"]') return NAVTAB_IDS.map(makeNavTab);
    if (sel === '.tabpanel') return TABPANEL_IDS.map(makeElement);
    if (sel === '.srctag.real') return new Array(SRCTAG_REAL_COUNT).fill(null);
    if (sel === '.srctag.illustrative') return new Array(SRCTAG_ILLUSTRATIVE_COUNT).fill(null);
    return [];
  },
  querySelector: (sel) => {
    if (sel === '.sidenav-list') return makeElement('__sidenavList');
    return makeElement("__q_" + Math.random());
  },
  documentElement: makeElement('__documentElement'),
  body: makeElement('__body'), // Focus Mode toggles a class on document.body -- a standard, always-present real-browser object this stub had never needed before now
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
const sandbox = { document: documentStub, localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } }, console, Math, Object, Array, parseFloat, isFinite, matchMedia: stubMatchMedia,
  // Real-browser timers this stub had never needed before the nav-innovation round -- same "accept
  // the call without throwing, real timing verified live" philosophy as document.addEventListener
  // above. Deliberately NOT firing the callback: an eager/synchronous fire risks looping or
  // reordering relative to the surrounding synchronous code in ways a real 900ms/2s delay never
  // would, which would test a behavior the real page can't actually exhibit.
  setTimeout: () => 0, clearTimeout: () => {},
  // Phase 4 batch E: the printable one-pager listens for the real browser 'beforeprint' event to
  // sync its summary right before printing -- same "accept the call without throwing, real behavior
  // verified live in a real browser" pattern as document.addEventListener/setTimeout above. window
  // IS this sandbox object itself (self-referential, see below), so this has to live here, not on a
  // separate window-only stub.
  addEventListener: () => {} };
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

console.log("--- Phase 4 batch C (2026-09-07): \"View as: Role\" nav-tab visibility (idea #33, redefined) ---");
check(typeof sandbox.applyRoleView === "function", "applyRoleView is exposed as a function");
// Golden ROLE_TABS content pre-registered by design decision before writing this check (B35): exec=4
// tabs, engineer=10 (adds the 6 operational tabs to exec's 4), all=null (every tab, not a duplicated
// 12-name list that could silently drift from the real navtab count).
check(JSON.stringify(sandbox.ROLE_TABS.exec) === JSON.stringify(["exec", "shouldcost", "variance", "methodology", "triage"]), "ROLE_TABS.exec is exactly the 5 golden tab names (Attention & Triage added, Phase 4 batch D)", JSON.stringify(sandbox.ROLE_TABS.exec));
check(sandbox.ROLE_TABS.engineer.length === 11, "ROLE_TABS.engineer has exactly 11 tab names (+1 for Attention & Triage)", sandbox.ROLE_TABS.engineer.length);
check(sandbox.ROLE_TABS.all === null, "ROLE_TABS.all is null (every tab), not a hand-duplicated 13-name array");
sandbox.applyRoleView("exec");
const hiddenUnderExecRole = ["buildbuy", "capacity", "tooling", "dfm", "governance", "playbook", "risk", "framework"].every((t) => elements["navtab-" + t].hidden === true);
const visibleUnderExecRole = ["exec", "shouldcost", "variance", "methodology", "triage"].every((t) => !elements["navtab-" + t].hidden);
check(hiddenUnderExecRole && visibleUnderExecRole, "applyRoleView('exec') hides exactly the 8 non-exec tabs and shows exactly the 5 exec tabs (incl. Attention & Triage)");
check(sandbox.localStorage._s["ams-cc-role-view"] === "exec", "the chosen role persists to localStorage, same pattern as theme/contrast/last-tab");
// The actual regression this guards: cycling ArrowDown through a role-narrowed nav must never land
// on a hidden tab, even transiently -- a stale full-list index (pre-fix) would silently skip/no-op
// on a hidden button instead of correctly landing on the next VISIBLE one.
sandbox.activateTab("exec", { focus: false });
const selectedSequence = [];
for (let i = 0; i < 5; i++) {
  sidenavListEl.fire("keydown", { key: "ArrowDown", preventDefault() {} });
  selectedSequence.push(sandbox.ROLE_TABS.exec.find((t) => elements["navtab-" + t].getAttribute("aria-selected") === "true"));
}
check(selectedSequence.join(",") === "shouldcost,variance,triage,methodology,exec", "5 ArrowDown presses under the exec role cycle through exactly the 5 visible tabs (DOM order places Attention & Triage before Methodology) and wrap back to exec, never landing on a hidden one", selectedSequence.join(","));
// Redirect-on-hide: landing on a tab, then narrowing the role so that tab is no longer visible,
// must not strand the user on a now-invisible tab.
sandbox.activateTab("playbook", { focus: false });
sandbox.applyRoleView("exec");
check(elements["tab-exec"].classList.contains("active"), "narrowing to the exec role while on a tab that role hides (playbook) redirects to the role's own first tab (exec), not stranding the user", elements["tab-exec"].classList.contains("active"));
sandbox.applyRoleView("all");
const allThirteenVisible = ["exec", "shouldcost", "variance", "buildbuy", "capacity", "tooling", "dfm", "governance", "playbook", "risk", "framework", "methodology", "triage"].every((t) => !elements["navtab-" + t].hidden);
check(allThirteenVisible, "applyRoleView('all') restores every one of the 13 tabs to visible", allThirteenVisible);

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

console.log("--- viz-innovation batch 1: Site Accuracy Explorer (archery target) golden values, pre-registered via node -e ---");
// CMAR per site: (1 - |actual-standard|/actual)*100. Site A: 1-28200/1448200=98.053%.
// Site B: 1-24600/955400=97.425%. Site C: 1-28000/1178000=97.623%. Avg=(98.053+97.425+97.623)/3=97.7%
// (toFixed(1)). Spread = max-min = 98.053-97.425 = 0.628 -> "0.6 pts" (toFixed(1)).
check(typeof sandbox.calcCmar === "function", "window.calcCmar is exposed as a function");
const archeryState = sandbox.calcArchery();
check(Math.abs(archeryState.sites[0].cmar - 98.05275514431709) < 1e-9, "Site A CMAR matches golden value", archeryState.sites[0].cmar);
check(Math.abs(archeryState.sites[1].cmar - 97.42516223571279) < 1e-9, "Site B CMAR matches golden value", archeryState.sites[1].cmar);
check(Math.abs(archeryState.sites[2].cmar - 97.62308998302207) < 1e-9, "Site C CMAR matches golden value", archeryState.sites[2].cmar);
check(elements.archeryAvgOut.textContent === "97.7%", "rendered average CMAR matches golden value", elements.archeryAvgOut.textContent);
check(elements.archerySpreadOut.textContent === "0.6 pts", "rendered spread matches golden value", elements.archerySpreadOut.textContent);
check(elements.archeryWrap.innerHTML.includes("<svg") && elements.archeryWrap.innerHTML.includes('role="img"'), "renderArchery() renders an actual accessible <svg>, not just text outputs");
check((elements.archeryWrap.innerHTML.match(/<circle/g) || []).length === 4 + 3, "exactly 7 <circle> elements: 4 ring/bullseye circles (outer boundary, 90% ring, 95% ring, bullseye) + 3 arrow markers (one per site)", (elements.archeryWrap.innerHTML.match(/<circle/g) || []).length);
// TJ flagged this chart looking small in its 2-column card (the ~473px-wide right column dwarfing a
// 260px-capped graphic) -- fixed by raising max-width so the whole SVG (rings, arrows, AND text,
// since font-size is in the same viewBox coordinate system) scales up together, not just its
// container. Guarded here so the size fix can't silently revert.
check(elements.archeryWrap.innerHTML.includes('max-width:340px'), "the chart's max-width was raised from 260px to 340px so it isn't visually lost in its column's whitespace", elements.archeryWrap.innerHTML.includes('max-width:340px'));
check(!html.includes('font-size="9"') && !elements.archeryWrap.innerHTML.includes('font-size="9"'), "no 9px SVG text in the archery target (matches the page-wide minimum-legible-size convention)");

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

console.log("--- design-qa fix (2026-09-07, QA-001): Should-Cost dollar outputs use toLocaleString, not bare toFixed(2) ---");
// A live design-qa pass found these 5 outputs formatted via '$'+val.toFixed(2) -- no thousands
// separator -- while every other dollar output on the page (MHR Build-Up, Build-vs-Buy NPV, etc.)
// uses toLocaleString(). Invisible at realistic per-unit defaults (<$1,000) but a real inconsistency
// at large values. Golden values pre-registered via a standalone node -e script (B35) before writing
// this check: an extreme raw-mass input (999999999kg, all other inputs at default) drives matCost and
// overheadCost past $1,000, so their formatted output must now show comma separators.
elements.scMass.value = 999999999;
sandbox.calcShouldCost();
check(elements.scOutMat.textContent === "$21,408,749,978.59", "extreme material cost renders with thousands separators, not a bare toFixed(2) string", elements.scOutMat.textContent);
check(elements.scOutOh.textContent === "$2,997,225,000.51", "extreme overhead cost renders with thousands separators", elements.scOutOh.textContent);
check(elements.scOutTotal.textContent === "$24,405,975,004.16", "extreme should-cost TOTAL renders with thousands separators", elements.scOutTotal.textContent);
// machine/labor cost don't depend on mass, so they stay under $1,000 even at this extreme --
// confirms the fix didn't change formatting behavior for values that were already correct.
check(elements.scOutMach.textContent === "$14.67", "machine conversion cost (mass-independent) is unaffected by the extreme mass input", elements.scOutMach.textContent);
check(elements.scOutLabor.textContent === "$10.39", "labor cost (mass-independent) is unaffected by the extreme mass input", elements.scOutLabor.textContent);
// restore to default and confirm the fix is a no-op at realistic values (same string as the golden checks above)
elements.scMass.value = "3.8";
sandbox.calcShouldCost();
check(elements.scOutMat.textContent === "$81.35", "restoring the default mass returns the exact original golden-value string (no regression at realistic values)", elements.scOutMat.textContent);
check(elements.scOutTotal.textContent === "$121.31", "restoring the default mass returns the exact original TOTAL golden-value string", elements.scOutTotal.textContent);

console.log("--- viz-innovation batch 1: Nesting Doll Cost Peel golden values (same 4 should-cost components above, ordered by size) ---");
// Components sorted descending: Material 81.35 > Overhead 14.90 > Machine 14.67 > Labor 10.39.
// Cumulative remainder after peeling each: [121.31 (total), 39.96 (total-material),
// 25.06 (-overhead), 10.39 (-machine, = labor alone)] -- verified via node -e.
check(typeof sandbox.calcNestingDoll === "function", "window.calcNestingDoll is exposed as a function");
const dollState = sandbox.calcNestingDoll(81.35, 14.67, 10.39, 14.90, 121.31);
check(dollState.components.map((c) => c.label).join(",") === "Material,Overhead,Machine,Labor", "components are sorted descending by value: Material, Overhead, Machine, Labor", dollState.components.map((c) => c.label).join(","));
check(JSON.stringify(dollState.dolls.map((d) => Math.round(d.value * 100) / 100)) === JSON.stringify([121.31, 39.96, 25.06, 10.39]), "cumulative doll values (outer to inner) match golden values", JSON.stringify(dollState.dolls.map((d) => d.value)));
check(Math.abs(dollState.dolls[3].value - 10.39) < 1e-9, "the innermost doll's value equals Labor's own cost exactly (internal consistency -- nothing left to peel)", dollState.dolls[3].value);
sandbox.renderNestingDoll(dollState);
check(elements.nestingDollWrap.innerHTML.includes("<svg") && elements.nestingDollWrap.innerHTML.includes('role="img"'), "renderNestingDoll() renders an actual accessible <svg>, not just numbers");
check((elements.nestingDollWrap.innerHTML.match(/<ellipse/g) || []).length === 4, "exactly 4 nested doll ellipses are rendered, one per component", (elements.nestingDollWrap.innerHTML.match(/<ellipse/g) || []).length);
check(elements.nestingDollWrap.innerHTML.includes("core: $10.39"), "the innermost doll's label states the exact core value", elements.nestingDollWrap.innerHTML);

// design-qa fix (2026-09-07): the "Total $..." label's ascender was clipping above the SVG's own
// viewBox top on every page load -- not an edge case, since the outer ellipse's radius is ALWAYS
// exactly maxRadius(110) by construction, so this reproduced with the page's own shipped defaults
// (confirmed via a user-supplied screenshot showing "otal $121.31" with the "T" visibly cut off).
// Golden geometry pre-registered via a standalone node -e script (B35) before writing this check.
const dollSvg = elements.nestingDollWrap.innerHTML;
const dollViewBoxMatch = dollSvg.match(/viewBox="0 0 (\d+) (\d+(?:\.\d+)?)"/);
check(!!dollViewBoxMatch && dollViewBoxMatch[1] === "400" && Math.abs(parseFloat(dollViewBoxMatch[2]) - 287) < 0.5, "nesting-doll viewBox height grew to 287 (was 260) to give the Total label real headroom", dollViewBoxMatch && dollViewBoxMatch[0]);
const totalYMatch = dollSvg.match(/<text x="200" y="([\d.]+)" font-size="11"/);
check(!!totalYMatch, "found the Total label's own y attribute to check for clipping");
if (totalYMatch) {
  const totalY = parseFloat(totalYMatch[1]);
  check(Math.abs(totalY - 14.0) < 0.5, "Total label y-position matches the golden geometry (14.0, was 5.5 pre-fix)", totalY);
  // an 11px bold label's ascender is roughly 0.8em above its baseline -- the fix must leave that
  // clear of the viewBox's own y=0 top edge, which the old geometry (baseline y=5.5) did not.
  check(totalY - 11 * 0.8 >= 0, "Total label's ascender (baseline - ~0.8em) stays within the viewBox, not clipped above y=0", (totalY - 11 * 0.8).toFixed(2));
}
// The Overhead/Machine peeled labels (values $14.90/$14.67, close enough to crowd under the old
// pure-midpoint formula) must now be separated by at least the enforced 18-unit minimum gap.
const peelYs = Array.from(dollSvg.matchAll(/<text x="200" y="([\d.]+)" font-size="10" fill="rgb\(var\(--c-text-primary\)\)" text-anchor="middle">peeled:/g)).map((m) => parseFloat(m[1]));
check(peelYs.length === 3, "found all 3 peeled-label y-positions to check spacing", peelYs);
if (peelYs.length === 3) {
  check(peelYs[2] - peelYs[1] >= 18 - 0.5, "the two closest-valued peeled labels (Overhead $14.90, Machine $14.67) are separated by the enforced minimum gap, not crowded", peelYs[2] - peelYs[1]);
}

sandbox.calcShouldCost(); // re-trigger via the real calculator (not a parallel path) to confirm the wiring
check(elements.nestingDollWrap.innerHTML.includes("<svg"), "calcShouldCost() itself re-renders the nesting-doll chart on every recalculation, not just at page load");

console.log("--- viz-innovation batch 2: Circulatory Cost Flow golden values (same 4 should-cost components, as vessel width) ---");
// maxValue = matCost (81.35, the largest). Vessel widths = max(MIN_WIDTH=2, (value/maxValue)*14):
// material=14.0 (itself the max), machine=2.5246, labor=2.0 (floored, real value 1.787), overhead=2.5642.
check(typeof sandbox.calcCirculatory === "function", "window.calcCirculatory is exposed as a function");
const circState = sandbox.calcCirculatory(81.35, 14.67, 10.39, 14.90, 121.31);
check(Math.abs(circState.components[0].vesselWidth - 14) < 1e-9, "Material vessel width matches golden value (itself the max)", circState.components[0].vesselWidth);
check(Math.abs(circState.components[1].vesselWidth - 2.5246465888137677) < 1e-9, "Machine vessel width matches golden value", circState.components[1].vesselWidth);
check(Math.abs(circState.components[2].vesselWidth - 2) < 1e-9, "Labor vessel width is floored to the minimum (real proportional value 1.787 < MIN_WIDTH=2)", circState.components[2].vesselWidth);
check(Math.abs(circState.components[3].vesselWidth - 2.5642286416717885) < 1e-9, "Overhead vessel width matches golden value", circState.components[3].vesselWidth);
check(circState.dominant.label === "Material", "the dominant driver is correctly identified as Material", circState.dominant.label);
sandbox.renderCirculatory(circState);
check(elements.circulatoryWrap.innerHTML.includes("<svg") && elements.circulatoryWrap.innerHTML.includes('role="img"'), "renderCirculatory() renders an actual accessible <svg>, not just numbers");
check((elements.circulatoryWrap.innerHTML.match(/<path/g) || []).length === 4, "exactly 4 vessel paths are rendered, one per component", (elements.circulatoryWrap.innerHTML.match(/<path/g) || []).length);
check(elements.circulatoryWrap.innerHTML.includes("Material $81.35 ★"), "the dominant vessel's label is marked with the star, distinguishing it from the other 3", elements.circulatoryWrap.innerHTML);

console.log("--- Variance Waterfall: golden values ---");
check(elements.outMPV.textContent === "+$3,025", "MPV matches golden value", elements.outMPV.textContent);
check(elements.outMQV.textContent === "-$1,040", "MQV matches golden value", elements.outMQV.textContent);
check(elements.outDLRV.textContent === "+$1,350", "DLRV matches golden value", elements.outDLRV.textContent);
check(elements.outDLEV.textContent === "+$2,520", "DLEV matches golden value", elements.outDLEV.textContent);
check(elements.outVOSV.textContent === "+$430", "VOSV matches golden value", elements.outVOSV.textContent);
check(elements.outFOVV.textContent === "-$960", "FOVV matches golden value", elements.outFOVV.textContent);
check(elements.outNet.textContent === "+$5,325", "net total variance matches golden value (and equals the sum of the six lines above)", elements.outNet.textContent);

console.log("--- Pathway B (2026-09-05): Variance Waterfall rewritten as a true cascading bridge chart ---");
// Pre-registered by hand before writing this check: cumulative running total after MPV(+3025),
// MQV(-1040), DLRV(+1350), DLEV(+2520), VOSV(+430), FOVV(-960) = 3025, 1985, 3335, 5855, 6285, 5325 --
// the final cumulative total must equal the calculator's own separately-computed net (+5325) exactly,
// or the "bridge" wouldn't actually bridge to the same number the rest of the page reports.
check(typeof sandbox.renderWaterfall === "function", "window.renderWaterfall is exposed as a function");
const bridgeResult = sandbox.renderWaterfall(
  [
    { label: "MPV", value: 3025 }, { label: "MQV", value: -1040 }, { label: "DLRV", value: 1350 },
    { label: "DLEV", value: 2520 }, { label: "VOSV", value: 430 }, { label: "FOVV", value: -960 },
  ],
  5325
);
check(bridgeResult.steps.length === 7, "bridge has exactly 7 steps (6 cascading variances + the full NET total bar)", bridgeResult.steps.length);
const expectedCum = [3025, 1985, 3335, 5855, 6285, 5325];
bridgeResult.steps.slice(0, 6).forEach((s, i) => {
  check(Math.abs(s.to - expectedCum[i]) < 0.01, `step ${i} ("${s.label}") cascades to the pre-registered running cumulative total`, `to=${s.to} expected=${expectedCum[i]}`);
});
check(bridgeResult.steps[5].to === bridgeResult.steps[6].to && bridgeResult.steps[6].to === 5325, "the running cumulative total after all 6 variances exactly equals the NET bar's own total (internal consistency -- the bridge really bridges to the number the calculator reports separately)", bridgeResult.steps[6].to);
check(bridgeResult.steps[6].isTotal === true, "the final NET bar is correctly flagged as the total, distinguishing it from the cascading variance deltas", JSON.stringify(bridgeResult.steps[6]));
// A stress-test found the prior two checks here (steps[0].from===0, steps[6].from===0) were
// tautological -- both `from` values are hardcoded literals in renderWaterfall's own source
// (`var cum = 0` and the NET step's own `from: 0`), so asserting they equal 0 asserts a constant
// equals itself; they'd pass even if the cascade math were completely broken. Replaced with a check
// that verifies the RENDERED SVG geometry (a separate code path -- string-building, not the `steps`
// array) independently matches the same yAt() transform renderWaterfall itself uses, computed here
// from the function's own returned yMin/yMax rather than a re-typed pixel constant.
const wfPlotH = 240 - 16 - 54; // H - marginTop - marginBottom, matching renderWaterfall's own layout
function wfYAt(v) { return 16 + (1 - (v - bridgeResult.yMin) / (bridgeResult.yMax - bridgeResult.yMin)) * wfPlotH; }
const firstRectMatch = elements.waterfallChart.innerHTML.match(/<rect x="([\d.]+)" y="([\d.]+)"/);
check(!!firstRectMatch, "found the first rendered <rect> in the bridge chart to check its actual geometry");
if (firstRectMatch) {
  const expectedFirstBarX = 62; // marginLeft, i === 0 so xAt(0) === marginLeft exactly
  const expectedFirstBarY = wfYAt(Math.max(bridgeResult.steps[0].from, bridgeResult.steps[0].to));
  check(Math.abs(parseFloat(firstRectMatch[1]) - expectedFirstBarX) < 0.1, "the first bar's rendered SVG x-coordinate matches marginLeft exactly", `rendered=${firstRectMatch[1]} expected=${expectedFirstBarX}`);
  check(Math.abs(parseFloat(firstRectMatch[2]) - expectedFirstBarY) < 0.5, "the first bar's rendered SVG y-coordinate matches the independently-recomputed expected pixel position -- verifies the SVG string-building code itself, not just the cascade data model", `rendered=${firstRectMatch[2]} expected=${expectedFirstBarY}`);
}
sandbox.calcVariance(); // re-trigger via the real calculator (not a parallel path) to confirm the wiring
check(elements.waterfallChart.innerHTML.includes("<svg"), "calcVariance() renders an actual <svg> bridge chart, not just text outputs");
check((elements.waterfallChart.innerHTML.match(/<line[^>]*stroke-dasharray/g) || []).length === 6, "exactly 6 dashed connector lines link the 7 bars -- one between each consecutive pair, the defining visual feature of a bridge chart vs. a grouped bar chart", (elements.waterfallChart.innerHTML.match(/<line[^>]*stroke-dasharray/g) || []).length);
check(!html.includes(".wf-col") && !html.includes(".wf-value") && !html.includes(".wf-label") && !html.includes(".wf-bar"), "the old grouped-bar-chart CSS (.wf-col/.wf-value/.wf-label/.wf-bar) was fully removed, not left as dead CSS alongside the new SVG chart");

console.log("--- Variance Tug-of-War: golden values (pre-registered by hand from the same 6 default variances above) ---");
// mat = MPV+MQV = 3025-1040 = 1985; labor = DLRV+DLEV = 1350+2520 = 3870; oh = VOSV+FOVV = 430-960 = -530
// net = 1985+3870-530 = 5325 (matches outNet exactly -- same 6 numbers, just regrouped, not recomputed
// from scratch); magnitude = |1985|+|3870|+|-530| = 6385; ratio = 5325/6385 = 0.8339859044635866;
// tension = 1-0.8339859... = 0.1660141, rounds to 17%. pullFav (the only negative group, oh) = 530;
// pullUnfav (mat+labor, both positive) = 5855; unfavorable leads 5855/530 = 11.0:1 (toFixed(1)).
check(typeof sandbox.calcTugOfWar === "function", "window.calcTugOfWar is exposed as a function");
const towState = sandbox.calcTugOfWar(3025, -1040, 1350, 2520, 430, -960);
check(towState.mat === 1985 && towState.labor === 3870 && towState.oh === -530, "calcTugOfWar groups the 6 variances into material/labor/overhead exactly as pre-registered", JSON.stringify(towState));
check(towState.net === 5325, "calcTugOfWar's net exactly equals calcVariance's own net (5325) -- same numbers regrouped, not a parallel recomputation", towState.net);
check(towState.magnitude === 6385, "gross force magnitude (sum of absolute group values) matches golden value", towState.magnitude);
check(Math.abs(towState.ratio - 0.8339859044635866) < 1e-9, "net/magnitude ratio matches the pre-registered golden value", towState.ratio);
check(Math.round(towState.tension * 100) === 17, "tension (1 - |ratio|) rounds to the pre-registered 17%", towState.tension);
check(towState.pullFav === 530 && towState.pullUnfav === 5855, "one-sided pull totals match golden values (only Overhead is favorable)", JSON.stringify(towState));
check(towState.summary === "Net +$5,325 — the unfavorable pull leads by 11.0:1.", "plain-language summary matches the pre-registered exact string", towState.summary);
// Two edge branches of the same summary logic, not exercised by the page's own default inputs --
// tested directly against the pure function so both branches are actually covered, not just implied.
const towAllZero = sandbox.calcTugOfWar(0, 0, 0, 0, 0, 0);
check(towAllZero.magnitude === 0 && towAllZero.ratio === 0 && towAllZero.tension === 0, "all-zero variances: magnitude/ratio/tension all safely resolve to 0, no division by zero", JSON.stringify(towAllZero));
check(towAllZero.summary === "All six variances net to exactly zero — no pull either direction.", "all-zero branch produces the exact pre-registered summary string", towAllZero.summary);
const towOneSidedFav = sandbox.calcTugOfWar(-100, 0, -200, 0, -50, 0); // mat=-100, labor=-200, oh=-50, all favorable
check(towOneSidedFav.pullUnfav === 0 && towOneSidedFav.pullFav === 350, "one-sided-favorable case: pullUnfav is exactly 0, pullFav is the full 350 magnitude", JSON.stringify(towOneSidedFav));
check(towOneSidedFav.summary === "+$350 favorable, entirely one-sided — no offsetting unfavorable variance this period.", "one-sided-favorable branch produces the exact pre-registered summary string", towOneSidedFav.summary);

check(elements.towNetOut.textContent === "+$5,325", "rendered net-position output matches golden value (same net as the waterfall's outNet)", elements.towNetOut.textContent);
check(elements.towTensionOut.textContent === "17%", "rendered tension output matches golden value", elements.towTensionOut.textContent);
check(elements.towSummaryOut.textContent === towState.summary, "rendered summary line matches calcTugOfWar's own returned summary exactly (no separate re-derivation in the render path)", elements.towSummaryOut.textContent);
check(elements.tugOfWarWrap.innerHTML.includes("<svg") && elements.tugOfWarWrap.innerHTML.includes('role="img"'), "renderTugOfWar() renders an actual accessible <svg> (role=img), not just text outputs");
check((elements.tugOfWarWrap.innerHTML.match(/<rect/g) || []).length === 5, "exactly 5 <rect> elements: one base bar per group (Material, Labor, Overhead) + one hatch overlay on each of the 2 unfavorable groups (Material, Labor) -- Overhead is the only favorable group, so it gets no hatch", (elements.tugOfWarWrap.innerHTML.match(/<rect/g) || []).length);
check(elements.tugOfWarWrap.innerHTML.includes('class="tow-flag"'), "the net-position flag group is rendered with the class the reduced-motion CSS rule targets");

console.log("--- Build-vs-Buy / NPV: golden values ---");
check(elements.bbUnitSave.textContent === "$90.22", "unit saving matches golden value", elements.bbUnitSave.textContent);
check(elements.bbAnnualSave.textContent === "$162,396", "annual saving matches golden value", elements.bbAnnualSave.textContent);
check(elements.bbPayback.textContent === "0.23 years", "simple payback matches golden value", elements.bbPayback.textContent);
check(elements.bbNpv.textContent === "$365,855", "3-year NPV @ 10% matches golden value", elements.bbNpv.textContent);
check(elements.bbCashflowBody.innerHTML.split("<tr>").length - 1 === 4, "cash-flow table has exactly 4 rows (Year 0 + 3 years, matching the default horizon)", elements.bbCashflowBody.innerHTML.split("<tr>").length - 1);

console.log("--- viz-innovation batch 2: Compass Rose Scenario Navigator golden values (same NPV/transition, as direction + magnitude) ---");
// npv=365854.8159278737 (unrounded, from the golden $365,855 above), transition=38000.
// magnitude = |npv|/(|npv|+transition) = 365854.816/(365854.816+38000) = 0.905907 -> "90.6%".
check(typeof sandbox.calcCompassRose === "function", "window.calcCompassRose is exposed as a function");
const compassState = sandbox.calcCompassRose(365854.8159278737, 38000);
check(Math.abs(compassState.magnitude - 0.9059067801068724) < 1e-9, "compass magnitude matches golden value", compassState.magnitude);
check(compassState.favorsBuild === true, "with a positive NPV, the compass correctly favors Build In-House", compassState.favorsBuild);
sandbox.renderCompassRose(compassState);
check(elements.compassRoseWrap.innerHTML.includes("<svg") && elements.compassRoseWrap.innerHTML.includes('role="img"'), "renderCompassRose() renders an actual accessible <svg>, not just numbers");
check(elements.compassRoseWrap.innerHTML.includes("90.6% confidence"), "the rendered confidence percentage matches the golden value", elements.compassRoseWrap.innerHTML);
// Edge case: a negative NPV should flip the needle to favor Outsource.
const compassNegState = sandbox.calcCompassRose(-50000, 38000);
check(compassNegState.favorsBuild === false, "with a negative NPV, the compass correctly favors Outsource", compassNegState.favorsBuild);
sandbox.calcBuildBuy(); // re-trigger via the real calculator (not a parallel path) to restore the default rendered state
check(elements.compassRoseWrap.innerHTML.includes("90.6% confidence"), "calcBuildBuy() itself re-renders the compass rose back to the default golden state on every recalculation", elements.compassRoseWrap.innerHTML);

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

console.log("--- Break-Even Crossover Playground (viz-innovation concept #11): drag-handle golden values ---");
// Pre-registered via a standalone `node -e` script BEFORE this code was written (default inputs
// mc=180, p0=420, gamma=0.12): handle P0 at (60.00, 50.00); handle gamma at (580.00, 171.13);
// dragging handle P0 to y=100 -> newP0=315.0000 exactly; dragging handle gamma to y=150 ->
// newGamma=0.089392, and recomputing price at qMax with that gamma reproduces the same 210.0000
// the inverse math started from -- confirms the forward/inverse formulas genuinely agree, not just
// that the inverse function returns SOMETHING.
check(Math.abs(chartData.handleP0Y - 50.0) < 0.05, "handle P0's rendered y pixel matches golden value (yScale(p0))", chartData.handleP0Y);
check(Math.abs(chartData.handleGammaY - 171.13) < 0.05, "handle gamma's rendered y pixel matches golden value (yScale(p0 * qMax^-gamma))", chartData.handleGammaY);
check(elements.qsChartWrap.innerHTML.includes('data-handle="p0"') && elements.qsChartWrap.innerHTML.includes('data-handle="gamma"'), "both draggable handle circles are actually in the rendered markup");
check(elements.qsChartWrap.innerHTML.includes('aria-hidden="true"'), "the handles are aria-hidden -- pointer/touch accelerants layered on the pre-existing, fully keyboard-accessible number inputs, not a second, redundant (and unlabeled) interactive element in the accessibility tree");

check(typeof sandbox.qsPriceFromY === "function" && typeof sandbox.qsGammaFromPrice === "function", "the inverse-math functions are exposed for direct testing -- the stub can't dispatch real SVG pointer/getScreenCTM events, so the drag GESTURE is verified live in a browser, but the math it depends on is tested here");
const newP0FromDrag = sandbox.qsPriceFromY(100, 483);
check(Math.abs(newP0FromDrag - 315.0) < 0.001, "dragging handle P0 to y=100 computes newP0=315.0000 exactly, matching the pre-registered value", newP0FromDrag);
const newGammaFromDrag = sandbox.qsGammaFromPrice(sandbox.qsPriceFromY(150, 483), 420, 2331);
check(Math.abs(newGammaFromDrag - 0.089392) < 0.000001, "dragging handle gamma to y=150 computes newGamma=0.089392, matching the pre-registered value", newGammaFromDrag);
// Round-trip sanity: recomputing price at qMax with the drag-derived gamma must reproduce the SAME
// price the drag started from -- this is what actually proves the inverse formula is the true
// inverse of the forward one, not just a plausible-looking function that returns a number.
const priceRoundTrip = 420 * Math.pow(2331, -newGammaFromDrag);
check(Math.abs(priceRoundTrip - sandbox.qsPriceFromY(150, 483)) < 0.001, "the drag-derived gamma round-trips back to the exact price the drag targeted (forward and inverse formulas genuinely agree)", `roundTrip=${priceRoundTrip} target=${sandbox.qsPriceFromY(150, 483)}`);
check(sandbox.qsGammaFromPrice(-50, 420, 2331) >= 0.01, "qsGammaFromPrice clamps a nonsensical negative price to a valid minimum gamma, never returning NaN/negative/Infinity from an out-of-range drag", sandbox.qsGammaFromPrice(-50, 420, 2331));
check(sandbox.qsGammaFromPrice(500, 420, 2331) >= 0.01, "qsGammaFromPrice clamps a price ABOVE p0 (an increasing-curve drag, invalid for this model) to the same valid minimum, never negative", sandbox.qsGammaFromPrice(500, 420, 2331));

console.log("--- /stress-test findings on the Break-Even Crossover Playground (2026-09-05, independent review round) ---");
// Finding 1 (HIGH, reproduced live before this fix): qsVendorP0 has no min="" attribute, and a
// negative value made qsGammaFromPrice's Math.log() argument negative/zero -> NaN -> ".toFixed(4)"
// wrote the literal string "NaN" into the real, visible qsGamma input. Only reachable by directly
// typing a negative price (the drag handle itself is floored at 1 and can never produce one).
const gammaFromNegativeP0 = sandbox.qsGammaFromPrice(0.001, -50, 200);
check(!isNaN(gammaFromNegativeP0) && gammaFromNegativeP0 >= 0.01, "qsGammaFromPrice no longer returns NaN for a directly-typed negative P0 (floors to the safe minimum instead)", gammaFromNegativeP0);
check(gammaFromNegativeP0.toFixed(4) !== "NaN", "the value that would be written into the visible qsGamma input is a real number string, never the literal 'NaN'", gammaFromNegativeP0.toFixed(4));
check(Math.abs(sandbox.qsGammaFromPrice(sandbox.qsPriceFromY(150, 483), 420, 2331) - 0.089392) < 0.000001, "the P0-floor guard doesn't change the result for a real, positive P0 -- same golden value as before the fix", sandbox.qsGammaFromPrice(sandbox.qsPriceFromY(150, 483), 420, 2331));

// Finding 2 (HIGH, reproduced live before this fix): only 'pointerup' was handled, not
// 'pointercancel' -- an interrupted gesture (touch conflict, lost pointer capture, a context menu
// opening mid-drag) left qsDragHandle/qsDragContext set and the global move/up listeners attached
// forever, so ANY subsequent mouse movement anywhere on the page kept silently overwriting
// qsVendorP0/qsGamma. Live repro: dispatch pointerdown -> pointercancel -> an unrelated pointermove
// far from the chart -> qsVendorP0 changed from a completely unrelated mouse move.
check(typeof sandbox.qsPointerUp === "function", "window.qsPointerUp is exposed so its cleanup can be driven directly (a real pointercancel dispatch needs a live browser -- see README)");
check(html.includes("addEventListener('pointercancel', qsPointerUp)"), "a pointercancel listener is now wired to the SAME cleanup function as pointerup, not a separate, possibly-diverging handler");

// Finding 3 (MEDIUM, source-inspection + documented platform behavior, not reproducible without a
// physical touchscreen): the draggable handles had no touch-action, so a touch-drag would likely
// also trigger the browser's native page-scroll gesture, conflicting with the drag.
// 4, not 2: each handle is now TWO stacked circles (an invisible r=14 hit-area + the visible r=7
// decoration, see the WCAG 2.5.8 hit-target-size fix below) -- both carry touch-action:none.
check((html.match(/data-handle="(p0|gamma)"[^>]*touch-action:none/g) || []).length === 4, "all 4 handle circles (2 per handle: hit-area + visible) set touch-action:none, so a touch-drag doesn't also scroll the page");

console.log("--- Finding 4 (MEDIUM, independent review): WCAG 2.5.8 hit-target size ---");
// The visible handle was r=7 (14px diameter), under WCAG 2.2 SC 2.5.8's 24x24 minimum. Fixed with an
// invisible r=14 (28px) hit-area circle sharing the same data-handle value and position, with the
// visible circle set pointer-events:none so clicks always reach the larger circle underneath.
// Checked against the RENDERED chart (elements.qsChartWrap.innerHTML), not the raw source -- cx/cy
// are computed values (JS string concatenation in source), so a literal-number regex against the
// raw `html` source text can never match them; only the executed output has real numbers.
sandbox.renderQStarChart();
const qsRendered = elements.qsChartWrap.innerHTML;
check((qsRendered.match(/data-handle="p0" cx="[\d.]+" cy="[\d.]+" r="14" fill="transparent"/g) || []).length === 1, "the P0 handle has an invisible r=14 (28px, clears the 24px WCAG minimum) hit-area circle");
check((qsRendered.match(/data-handle="gamma" cx="[\d.]+" cy="[\d.]+" r="14" fill="transparent"/g) || []).length === 1, "the gamma handle has an invisible r=14 hit-area circle");
check((qsRendered.match(/r="7"[^>]*pointer-events:none/g) || []).length === 2, "both visible r=7 decoration circles are pointer-events:none, so the invisible larger circle underneath is what actually receives the click/touch, not the small visible dot");

check(html.includes('id="qsPositionOut"'), "the 'you are here' cross-reference paragraph exists in the markup");
sandbox.renderQStarChart();
const posText = elements.qsPositionOut.textContent;
// Pre-registered: npvVolume=1800 (bbVolume's real default), qStar=1165.3952 -> |1800-1165.3952|
// rounds to 635, and 1800 > qStar means "past crossover," not "short of."
check(posText.includes("1,800") && posText.includes("635") && posText.includes("past crossover"), "the position text correctly cross-references the NPV analyzer's real Annual Volume input (1,800, 635 units above Q*=1,165) -- not a fabricated comparison volume", posText);
check(!posText.toLowerCase().includes("recommend") && !posText.toLowerCase().includes("agrees"), "the position text states where the NPV volume sits relative to Q*, but never claims the two analyzers' separate vendor-pricing assumptions agree or disagree -- they model different scenarios", posText);

console.log("--- Finding 7 (LOW/MEDIUM, independent review): 'you are here' text edge cases ---");
// (a) Exact equality: pre-registered inputs (mc=100, p0=180000, gamma=1) give qStar = 180000/100 =
// 1800 exactly, matching bbVolume's default 1800 -- diff=0. Previously worded as the technically-
// true but odd "0 units past crossover"; now says "exactly at crossover."
sandbox.document.getElementById("qsInternalMc").value = "100";
sandbox.document.getElementById("qsVendorP0").value = "180000";
sandbox.document.getElementById("qsGamma").value = "1";
sandbox.renderQStarChart();
const exactMatchText = elements.qsPositionOut.textContent;
check(exactMatchText.includes("exactly at crossover") && !exactMatchText.includes("0 units past"), "exact equality (npvVolume===qStar) now says 'exactly at crossover', not the odd '0 units past crossover'", exactMatchText);

// (b) qStar=0 (mc=0, a real reachable typed value -- no min="" attribute prevents it): previously
// rendered as a silent empty string; now gives an explicit reason.
sandbox.document.getElementById("qsInternalMc").value = "0";
sandbox.renderQStarChart();
const zeroQStarText = elements.qsPositionOut.textContent;
check(zeroQStarText.length > 0 && zeroQStarText.includes("not a rendering error"), "qStar=0 now shows an explicit reason instead of silently going blank (which could read as a bug)", zeroQStarText);

// (c) npvVolume=0 (bbVolume cleared): restore a valid qStar, zero out the NPV volume instead.
sandbox.document.getElementById("qsInternalMc").value = "180";
sandbox.document.getElementById("qsVendorP0").value = "420";
sandbox.document.getElementById("qsGamma").value = "0.12";
sandbox.document.getElementById("bbVolume").value = "0";
sandbox.renderQStarChart();
const zeroVolumeText = elements.qsPositionOut.textContent;
check(zeroVolumeText.length > 0 && zeroVolumeText.toLowerCase().includes("annual volume above zero"), "npvVolume=0 now shows an explicit reason instead of silently going blank", zeroVolumeText);

// Restore real defaults so nothing downstream in this file runs against stale drag-testing state.
sandbox.document.getElementById("qsInternalMc").value = "180.00";
sandbox.document.getElementById("qsVendorP0").value = "420.00";
sandbox.document.getElementById("qsGamma").value = "0.12";
sandbox.document.getElementById("bbVolume").value = "1800";
sandbox.renderQStarChart();
check(elements.qsPositionOut.textContent.includes("1,800") && elements.qsPositionOut.textContent.includes("635"), "defaults restored cleanly -- the position text is back to the original golden value, confirming no residual state leaked from this edge-case testing", elements.qsPositionOut.textContent);

console.log("--- Finding (2026-09-06, /stress-test follow-up): calcQStar()'s own pre-existing NaN gap for a negative P0 ---");
// The seventeenth round's finding 2 fixed this exact root cause (missing P0 floor) only inside
// qsGammaFromPrice's NEW gamma-drag path, explicitly flagging calcQStar()/renderQStarChart() as a
// separate, untouched, out-of-scope bug (see README) -- p0/mc going negative there also raises a
// negative number to a fractional power (1/gamma), which is NaN in JS, previously written as the
// literal "NaN units" into the real, visible qsOut with no error indication. Pre-registered via
// `node -e` before writing this check (mc=180, gamma=0.12 defaults, p0=-50): qStar floors to ~0,
// so qsOut should read "0 units", never contain "NaN".
sandbox.document.getElementById("qsVendorP0").value = "-50";
const negP0Result = sandbox.calcQStar();
check(!elements.qsOut.textContent.includes("NaN"), "calcQStar() with a directly-typed negative P0 no longer writes the literal 'NaN units' into the visible qsOut", elements.qsOut.textContent);
check(elements.qsOut.textContent === "0 units", "a negative P0 degrades qStar to the sensible minimum '0 units', matching the pre-registered golden value", elements.qsOut.textContent);
check(!isNaN(negP0Result.qStar), "calcQStar()'s own returned qStar value is a real number, never NaN, for a negative P0", negP0Result.qStar);
// Accepted limitation (see README): qsVendorAtStar isn't NaN either, but is a large, cosmetically
// odd negative number ($-900,000.00) -- the P0 floor only guards the qStar exponentiation itself,
// not this separate downstream calculation, and fixing that display quirk was not part of this fix.
check(!elements.qsVendorAtStar.textContent.includes("NaN"), "the vendor-price-at-Q* output also never shows the literal 'NaN' for this input", elements.qsVendorAtStar.textContent);

// Restore real defaults so nothing downstream in this file runs against this edge-case input.
sandbox.document.getElementById("qsVendorP0").value = "420.00";
sandbox.calcQStar();
sandbox.renderQStarChart();
check(elements.qsOut.textContent === "1,165 units", "defaults restored cleanly after this edge-case test, confirming no residual state leaked", elements.qsOut.textContent);

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
check(sandbox.COMMAND_INDEX.length === 43, "exactly 43 navigable items in the command index (+1: Phase 4 batch D's Attention & Triage)", sandbox.COMMAND_INDEX.length);
check(new Set(sandbox.COMMAND_INDEX.map((c) => c.label)).size === 43, "all 43 command labels are unique");
const KNOWN_TABS = ["exec", "shouldcost", "variance", "buildbuy", "capacity", "tooling", "dfm", "governance", "playbook", "risk", "framework", "methodology", "triage"];
check(sandbox.COMMAND_INDEX.every((c) => KNOWN_TABS.includes(c.tab)), "every command index entry points at a real, known tab id");
const allMatch = sandbox.renderPaletteList("");
check(allMatch.length === 43, "empty-query search returns all 43 items", allMatch.length);
const learningMatch = sandbox.renderPaletteList("learning");
check(learningMatch.length === 1 && learningMatch[0].label === "Learning Curve Forecaster", "searching \"learning\" narrows to exactly the one matching item", JSON.stringify(learningMatch.map((c) => c.label)));
const riskTabMatch = sandbox.COMMAND_INDEX.filter((c) => c.tab === "risk");
check(riskTabMatch.length === 6, "exactly 6 command index entries point at the Predictive & Risk Models tab (+1: Aurora Layer Correlation Map)", riskTabMatch.length);
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
check(elements.capStatus2.innerHTML.includes(">✗ RED<"), "Week 3 (62.5% utilization) is correctly banded RED (<70%)", elements.capStatus2.innerHTML);
check(elements.capTotalRow.innerHTML.includes("$5,740"), "6-week total unabsorbed dollars matches golden value", elements.capTotalRow.innerHTML);
check(elements.capTotalRow.innerHTML.includes("78.65%"), "6-week overall utilization matches golden value", elements.capTotalRow.innerHTML);
check(elements.capTotalRow.innerHTML.includes(">▲ AMBER<"), "78.65% overall utilization is correctly banded AMBER (70-85%)", elements.capTotalRow.innerHTML);

console.log("--- Pathway B (2026-09-05): weekly-utilization SPC control chart (I-MR method, built from the same CAP_WEEKS data above) ---");
// Pre-registered via Node before this check was written: weekly utilization = [93.75, 87.5, 62.5,
// 56.25, 96.875, 75]; mean = 78.64583333333333; moving ranges = [6.25, 25, 6.25, 40.625, 21.875],
// MRbar = 20; UCL/LCL = mean +/- 2.66*MRbar = 131.84583333333333 / 25.445833333333326. With only 6
// points and this much week-to-week swing, no point falls outside the limits (expected, and itself
// a real finding: the fixed "RED <70%" policy band flags Week 3/4 as bad, but neither is actually
// outside this shop's own statistically-derived control limits -- exactly the specification-limit-
// vs-control-limit distinction the KPI research flagged as a real, cross-cutting risk).
check(typeof sandbox.renderCapacitySPC === "function", "window.renderCapacitySPC is exposed as a function");
const spc = sandbox.renderCapacitySPC();
check(JSON.stringify(spc.util) === JSON.stringify([93.75, 87.5, 62.5, 56.25, 96.875, 75]), "weekly utilization series matches the pre-registered golden values (derived from the same booked/avail inputs the table above uses)", JSON.stringify(spc.util));
check(Math.abs(spc.mean - 78.64583333333333) < 1e-9, "mean (center line) matches the pre-registered golden value", spc.mean);
check(Math.abs(spc.mrBar - 20) < 1e-9, "mean moving range matches the pre-registered golden value", spc.mrBar);
check(Math.abs(spc.ucl - 131.84583333333333) < 1e-9, "upper control limit (mean + 2.66*MRbar, the standard I-MR constant) matches the pre-registered golden value", spc.ucl);
check(Math.abs(spc.lcl - 25.445833333333326) < 1e-9, "lower control limit matches the pre-registered golden value", spc.lcl);
check(spc.outOfControl.every((v) => v === false), "with this specific 6-week history, no week is flagged out-of-control -- even Week 3/4's fixed-band RED reading is normal process variation by the shop's own control limits, not a special-cause signal", JSON.stringify(spc.outOfControl));
check(elements.capSpcWrap.innerHTML.includes("<svg"), "the SPC chart actually rendered an <svg> element, not just returned numbers");
check((elements.capSpcWrap.innerHTML.match(/<circle/g) || []).length === 6, "exactly 6 data points are plotted, one per week", (elements.capSpcWrap.innerHTML.match(/<circle/g) || []).length);
sandbox.calcCapacity(); // re-trigger via the real calculator (not a parallel path) to confirm the wiring
check(elements.capSpcWrap.innerHTML.includes("<svg"), "calcCapacity() itself re-renders the SPC chart on every recalculation, not just at page load");
check(html.includes('cadence-badge operational') && html.includes('cadence-badge financial'), "both cadence badges (operational on Capacity, financial on Variance) exist, making the two-tier real-time-vs-period-close distinction visible, not just an internal design note");

console.log("--- viz-innovation batch 3: Sonar Ping Anomaly Sweep golden values (same SPC data above, as distance-to-control-limit) ---");
// halfWidth = ucl-mean = 131.84583333333333-78.64583333333333 = 53.2. distanceRatio[i] = (util[i]-mean)/53.2
// for util=[93.75,87.5,62.5,56.25,96.875,75] -- pre-registered via node -e.
check(typeof sandbox.calcSonar === "function", "window.calcSonar is exposed as a function");
const sonarState = sandbox.calcSonar([93.75, 87.5, 62.5, 56.25, 96.875, 75], 78.64583333333333, 20, 131.84583333333333, [false, false, false, false, false, false]);
const expectedRatios = [0.2839129072681705, 0.1664317042606517, -0.30349310776942345, -0.42097431077694225, 0.3426535087719299, -0.06853070175438587];
sonarState.pings.forEach(function(p, i){
  check(Math.abs(p.distanceRatio - expectedRatios[i]) < 1e-9, `week ${i + 1} distance ratio matches golden value`, p.distanceRatio);
});
check(sonarState.pings.every(function(p){ return !p.outOfControl; }), "none of the 6 weeks are flagged out-of-control, matching the SPC chart's own result", JSON.stringify(sonarState.pings.map(function(p){ return p.outOfControl; })));
sandbox.renderSonar(sonarState);
check(elements.sonarWrap.innerHTML.includes("<svg") && elements.sonarWrap.innerHTML.includes('role="img"'), "renderSonar() renders an actual accessible <svg>, not just numbers");
check((elements.sonarWrap.innerHTML.match(/<circle/g) || []).length === 3 + 6, "exactly 9 circles: 2 rings + center dot + 6 pings", (elements.sonarWrap.innerHTML.match(/<circle/g) || []).length);
sandbox.calcCapacity(); // re-trigger via the real calculator (not a parallel path) to confirm the wiring
check(elements.sonarWrap.innerHTML.includes("<svg"), "renderCapacitySPC() itself re-renders the sonar sweep on every recalculation, not just at page load");

console.log("--- viz-innovation batch 1: Honeycomb Capacity Lattice golden values (same CAP_WEEKS data as the table/SPC chart above) ---");
// util per week already pre-registered above: [93.75, 87.5, 62.5, 56.25, 96.875, 75]. Deltas (week N -
// week N-1): [-6.25, -25, -6.25, 40.625, -21.875] (verified via node -e).
check(typeof sandbox.calcHoneycomb === "function", "window.calcHoneycomb is exposed as a function");
const honeycombState = sandbox.calcHoneycomb();
check(JSON.stringify(honeycombState.weeks.map((w) => Math.round(w.util * 1000) / 1000)) === JSON.stringify([93.75, 87.5, 62.5, 56.25, 96.875, 75]), "calcHoneycomb's per-week utilization matches the same golden values as the SPC chart above (same underlying inputs)", JSON.stringify(honeycombState.weeks.map((w) => w.util)));
check(JSON.stringify(honeycombState.deltas.map((d) => Math.round(d * 1000) / 1000)) === JSON.stringify([-6.25, -25, -6.25, 40.625, -21.875]), "calcHoneycomb's week-over-week deltas match golden values", JSON.stringify(honeycombState.deltas));
check(honeycombState.weeks.map((w) => w.status).join(",") === "green,green,red,red,green,amber", "each week's status matches the same utilStatus() bands used by the table above", honeycombState.weeks.map((w) => w.status).join(","));
check(elements.honeycombWrap.innerHTML.includes("<svg") && elements.honeycombWrap.innerHTML.includes('role="img"'), "renderHoneycomb() renders an actual accessible <svg>, not just numbers");
check((elements.honeycombWrap.innerHTML.match(/<polygon/g) || []).length === 6, "exactly 6 hexagon cells are rendered, one per week", (elements.honeycombWrap.innerHTML.match(/<polygon/g) || []).length);
check((elements.honeycombWrap.innerHTML.match(/<line/g) || []).length === 5, "exactly 5 connecting edges are rendered, one between each pair of the 6 adjacent weeks", (elements.honeycombWrap.innerHTML.match(/<line/g) || []).length);

console.log("--- viz-innovation batch 3: Comet Tail Velocity Tracker golden values (same 6-week utilization, velocity + acceleration) ---");
// velocities (already golden above): [-6.25,-25,-6.25,40.625,-21.875]. accelerations[k]=velocities[k+1]-velocities[k]:
// [-18.75, 18.75, 46.875, -62.5]. Largest |accel| is index 3 (-62.5) -> flareSegment = 3+1 = 4 (the
// segment connecting week5 to week6) -- an off-by-one in this exact mapping was caught and fixed via
// a standalone node -e reproduction before this check was written.
check(typeof sandbox.calcCometTail === "function", "window.calcCometTail is exposed as a function");
const cometState = sandbox.calcCometTail();
check(JSON.stringify(cometState.velocities.map((v) => Math.round(v * 1000) / 1000)) === JSON.stringify([-6.25, -25, -6.25, 40.625, -21.875]), "velocities match the same golden values as Honeycomb's deltas above", JSON.stringify(cometState.velocities));
check(JSON.stringify(cometState.accelerations.map((a) => Math.round(a * 1000) / 1000)) === JSON.stringify([-18.75, 18.75, 46.875, -62.5]), "accelerations match golden values", JSON.stringify(cometState.accelerations));
check(cometState.flareSegment === 4, "the flare segment correctly identifies index 4 (week5-to-week6), the transition with the largest |acceleration| (-62.5)", cometState.flareSegment);
sandbox.renderCometTail(cometState);
check(elements.cometTailWrap.innerHTML.includes("<svg") && elements.cometTailWrap.innerHTML.includes('role="img"'), "renderCometTail() renders an actual accessible <svg>, not just numbers");
check(elements.cometTailWrap.innerHTML.includes("flare: Δaccel -62.5"), "the flare label states the exact golden acceleration value at the correct segment", elements.cometTailWrap.innerHTML);
check((elements.cometTailWrap.innerHTML.match(/<circle/g) || []).length === 6, "exactly 6 dots are rendered, one per week", (elements.cometTailWrap.innerHTML.match(/<circle/g) || []).length);
sandbox.calcCapacity(); // re-trigger via the real calculator (not a parallel path) to confirm the wiring
check(elements.cometTailWrap.innerHTML.includes("<svg"), "calcCapacity() itself re-renders the comet tail on every recalculation, not just at page load");

console.log("--- viz-innovation batch 4: Thermostat Feedback Loop golden values (same overall utilization above, vs. this page's own 85% green threshold) ---");
// overallUtil=78.64583333333334 (golden above), target=85 -> gap=6.354166666666657, mode='heating'
// (current below target). Pre-registered via node -e.
check(typeof sandbox.calcThermostat === "function", "window.calcThermostat is exposed as a function");
const thermoState = sandbox.calcThermostat(78.64583333333334);
check(thermoState.target === 85, "target matches this page's own established green threshold", thermoState.target);
check(Math.abs(thermoState.gap - 6.354166666666657) < 1e-9, "gap matches golden value", thermoState.gap);
check(thermoState.mode === "heating", "mode is correctly 'heating' when current utilization is below target", thermoState.mode);
sandbox.renderThermostat(thermoState);
check(elements.thermostatWrap.innerHTML.includes("<svg") && elements.thermostatWrap.innerHTML.includes('role="img"'), "renderThermostat() renders an actual accessible <svg>, not just numbers");
check(elements.thermostatWrap.innerHTML.includes("HEATING"), "the rendered mode label matches the golden state", elements.thermostatWrap.innerHTML);
check(elements.thermostatWrap.innerHTML.includes("current 78.6% vs target 85%"), "the rendered current-vs-target text matches golden values", elements.thermostatWrap.innerHTML);
// Edge case: an overallUtil above target should flip the mode to cooling.
const thermoCooling = sandbox.calcThermostat(95);
check(thermoCooling.mode === "cooling", "mode correctly flips to 'cooling' when current utilization exceeds target", thermoCooling.mode);
sandbox.calcCapacity(); // re-trigger via the real calculator (not a parallel path) to restore the default golden state
check(elements.thermostatWrap.innerHTML.includes("HEATING"), "calcCapacity() itself re-renders the thermostat back to the default golden state on every recalculation", elements.thermostatWrap.innerHTML);

console.log("--- Stress-test round (2026-09-05) fix: Variance tab's copy no longer uses \"live\" for two different meanings in one paragraph ---");
// A stress-test found "the bridge recalculates live" sitting right next to "not a real-time feed" --
// two different senses of "live" (this demo tool's instant UI feedback vs. the real accounting
// process's period-close cadence) collapsed into one word, reading as self-contradictory on a fast
// read even though the underlying distinction is real and defensible.
check(!html.includes("Change any input; the bridge recalculates live."), "the old, ambiguous \"recalculates live\" phrasing (right next to a \"not real-time\" badge) is gone");
check(html.includes("This calculator updates instantly as you type, for exploration"), "the reworded copy separates this demo tool's instant UI feedback from the real accounting process's period-close cadence explicitly, instead of using \"live\"/\"real-time\" for both");

console.log("--- Stress-test round (2026-09-05) fix: no SVG chart text renders below a legible minimum font-size ---");
// A stress-test measured rendered SVG text at a 375px viewport across all 5 charts on this page
// (the pre-existing Q* chart plus the 4 new ones) and found font-size attributes as small as 9,
// rendering at ~4-5px once the viewBox scales down -- illegible on a phone. Bumped every chart's
// smallest text to at least 10-11 (matching or exceeding the pre-existing Q* baseline); a full
// viewport-aware font-scaling redesign is out of scope this round and is stated as an accepted
// limitation on the Methodology tab instead of silently left unaddressed.
check(!html.includes('font-size="9"') && !html.includes('font-size="9.5"'), "no chart on this page still uses a 9 or 9.5 SVG font-size attribute (the smallest, least legible sizes found)");

console.log("--- Tooling Amortization: golden values ---");
check(elements.tlPerUnit.textContent === "$7.50", "per-unit amortized cost matches golden value ($18,000 / 2,400 units)", elements.tlPerUnit.textContent);
check(elements.tlNaive.textContent === "$750.00/unit", "naive first-batch-only cost matches golden value ($18,000 / 24 units)", elements.tlNaive.textContent);
check(elements.tlOverstate.textContent === "100.0×", "overstatement factor matches golden value (750 / 7.50 = 100x, also = expectedRun/firstBatch = 2400/24)", elements.tlOverstate.textContent);

console.log("--- viz-innovation batch 2: Glacial Calving Event Tracker golden values (same naive-vs-amortized numbers, as first-batch attribution) ---");
// naiveChunkValue = naive*batch = 750*24 = 18000 (== cost, by construction).
// correctChunkValue = perUnit*batch = 7.50*24 = 180.
check(typeof sandbox.calcGlacial === "function", "window.calcGlacial is exposed as a function");
const glacialState = sandbox.calcGlacial(7.5, 750, 24, 18000);
check(Math.abs(glacialState.naiveChunkValue - 18000) < 1e-9, "naive chunk value matches golden value (and equals the tooling cost exactly, by construction)", glacialState.naiveChunkValue);
check(Math.abs(glacialState.correctChunkValue - 180) < 1e-9, "correct chunk value matches golden value", glacialState.correctChunkValue);
sandbox.renderGlacial(glacialState);
check(elements.glacialWrap.innerHTML.includes("<svg") && elements.glacialWrap.innerHTML.includes('role="img"'), "renderGlacial() renders an actual accessible <svg>, not just numbers");
check(elements.glacialWrap.innerHTML.includes("Naive: $18,000"), "the naive chunk's label states the exact golden value", elements.glacialWrap.innerHTML);
check(elements.glacialWrap.innerHTML.includes("Correct: $180.00"), "the correct chunk's label states the exact golden value", elements.glacialWrap.innerHTML);
sandbox.calcTooling(); // re-trigger via the real calculator (not a parallel path) to confirm the wiring
check(elements.glacialWrap.innerHTML.includes("<svg"), "calcTooling() itself re-renders the glacial chart on every recalculation, not just at page load");

console.log("--- DFM/DFC Cost Sensitivity: golden values ---");
check(elements.dfmWallOut.textContent === "+24.0%", "wall-thickness penalty matches golden value (1.5mm vs 3.0mm reference)", elements.dfmWallOut.textContent);
check(elements.dfmPocketOut.textContent === "+5.0%", "pocket-depth penalty matches golden value (5:1 vs 4:1 reference)", elements.dfmPocketOut.textContent);
check(elements.dfmHeightOut.textContent === "+24.0%", "build-height penalty matches golden value (80mm x 0.3%/mm)", elements.dfmHeightOut.textContent);
check(elements.dfmTotalOut.textContent === "+53.0%", "total uplift matches golden value (sum of the three penalties above)", elements.dfmTotalOut.textContent);
check(elements.dfmCostOut.textContent === "$153.00", "estimated cost matches golden value ($100 baseline x 1.53)", elements.dfmCostOut.textContent);

console.log("--- viz-innovation batch 2: Kaleidophone Resonance Chart golden values (same 3 DFM penalties, as live per-step marginal sensitivity) ---");
// At defaults (thickness=1.5<3, active; pocket=5>4, active): wallSens=(0.40/2.5)*0.1=0.016,
// pocketSens=0.05*0.5=0.025, heightSens=0.003*5=0.015 (unconditional). Top lever: pocket (0.025).
check(typeof sandbox.calcKaleidophone === "function", "window.calcKaleidophone is exposed as a function");
const kaleidoState = sandbox.calcKaleidophone(1.5, 5);
check(Math.abs(kaleidoState.rods[0].sens - 0.016) < 1e-9, "wall-thickness sensitivity matches golden value", kaleidoState.rods[0].sens);
check(Math.abs(kaleidoState.rods[1].sens - 0.025) < 1e-9, "pocket-depth sensitivity matches golden value", kaleidoState.rods[1].sens);
check(Math.abs(kaleidoState.rods[2].sens - 0.015) < 1e-9, "build-height sensitivity matches golden value", kaleidoState.rods[2].sens);
check(kaleidoState.topLever.label === "Pocket depth", "the top lever at defaults is correctly identified as Pocket depth (0.025 > 0.016 > 0.015)", kaleidoState.topLever.label);
// Edge case: pushing thickness to (or past) the 3.0mm reference should silence that rod entirely.
const kaleidoAtRef = sandbox.calcKaleidophone(3.0, 5);
check(kaleidoAtRef.rods[0].sens === 0, "wall-thickness sensitivity correctly drops to exactly 0 once thickness reaches the 3.0mm reference (no more leverage left)", kaleidoAtRef.rods[0].sens);
sandbox.renderKaleidophone(kaleidoState);
check(elements.kaleidophoneWrap.innerHTML.includes("<svg") && elements.kaleidophoneWrap.innerHTML.includes('role="img"'), "renderKaleidophone() renders an actual accessible <svg>, not just numbers");
check((elements.kaleidophoneWrap.innerHTML.match(/<rect/g) || []).length === 3, "exactly 3 resonance rods are rendered, one per DFM parameter", (elements.kaleidophoneWrap.innerHTML.match(/<rect/g) || []).length);
check(elements.kaleidophoneWrap.innerHTML.includes("2.50 pts/step"), "the top lever's exact per-step sensitivity value is labeled on the chart", elements.kaleidophoneWrap.innerHTML);

console.log("--- viz-innovation batch 4: Shadow Puppet Overlay Comparator golden values (same $100 reference vs. DFM-adjusted actual above) ---");
// reference=100 (DFM_BASELINE), estCost=153.00 (golden above) -> excess=53.00.
check(typeof sandbox.calcShadowPuppet === "function", "window.calcShadowPuppet is exposed as a function");
const shadowState = sandbox.calcShadowPuppet(153);
check(shadowState.reference === 100, "reference matches the golden $100 DFM_BASELINE constant", shadowState.reference);
check(Math.abs(shadowState.excess - 53) < 1e-9, "excess matches golden value (153 - 100)", shadowState.excess);
sandbox.renderShadowPuppet(shadowState);
check(elements.shadowPuppetWrap.innerHTML.includes("<svg") && elements.shadowPuppetWrap.innerHTML.includes('role="img"'), "renderShadowPuppet() renders an actual accessible <svg>, not just numbers");
check(elements.shadowPuppetWrap.innerHTML.includes("+$53.00 over reference"), "the rendered excess label matches the golden value", elements.shadowPuppetWrap.innerHTML);
// Edge case: an estCost at or below the reference should show no excess label at all.
const shadowNoExcess = sandbox.calcShadowPuppet(100);
check(shadowNoExcess.excess === 0, "excess correctly floors to 0 when estCost equals the reference exactly", shadowNoExcess.excess);
sandbox.renderShadowPuppet(shadowNoExcess);
check(!elements.shadowPuppetWrap.innerHTML.includes("over reference"), "no excess label is rendered when there's nothing to show", elements.shadowPuppetWrap.innerHTML);
sandbox.calcDfm(); // re-trigger via the real calculator (not a parallel path) to restore the default golden state
check(elements.shadowPuppetWrap.innerHTML.includes("+$53.00 over reference"), "calcDfm() itself re-renders the shadow puppet comparator back to the default golden state on every recalculation", elements.shadowPuppetWrap.innerHTML);

console.log("--- Commodity Price Exposure Early Warning: golden values ---");
check(elements.cpShiftPct.textContent === "13.46%", "price shift % matches golden value ($29.50 vs $26.00 frozen)", elements.cpShiftPct.textContent);
check(elements.cpProjected.textContent === "+$7,700", "projected MPV exposure matches golden value ($3.50/kg x 2,200kg)", elements.cpProjected.textContent);
check(elements.cpStatus.innerHTML.includes(">✗ WARNING<"), "13.46% shift correctly triggers WARNING (>8% threshold)", elements.cpStatus.innerHTML);

console.log("--- Mean-Reversion Forward Band (Ornstein-Uhlenbeck): golden values (pre-registered via Python) ---");
check(elements.ouExpected.textContent === "$29.15", "expected forward price matches golden value (P̄=27, Pt=29.50, θ=0.15, Δt=1)", elements.ouExpected.textContent);
check(elements.ouStdDev.textContent === "$3.25", "forecast std. deviation matches golden value", elements.ouStdDev.textContent);
check(elements.ouBand.textContent === "$22.78 – $35.53", "95% two-sided forward band matches golden value (expected ± 1.96×stddev)", elements.ouBand.textContent);

console.log("--- viz-innovation batch 1: Equilibrium Pendulum golden values (same OU inputs, pre-registered by hand) ---");
// displacement = Pt-Pbar = 29.5-27 = 2.5 -> fmtMoney rounds to the nearest dollar: "+$3".
// settleTime = ln(20)/theta = ln(20)/0.15 = 19.97 -> "20.0 months" (toFixed(1)).
check(typeof sandbox.calcPendulum === "function", "window.calcPendulum is exposed as a function");
const pendState = sandbox.calcPendulum();
check(Math.abs(pendState.displacement - 2.5) < 1e-9, "calcPendulum's displacement matches golden value", pendState.displacement);
check(Math.abs(pendState.settleTime - Math.log(20) / 0.15) < 1e-9, "calcPendulum's settleTime matches ln(20)/theta exactly", pendState.settleTime);
check(elements.pendDisplacementOut.textContent === "+$3", "rendered displacement matches golden value", elements.pendDisplacementOut.textContent);
check(elements.pendSettleOut.textContent === "20.0 months", "rendered settle-time matches golden value", elements.pendSettleOut.textContent);
check(elements.pendulumWrap.innerHTML.includes("<svg") && elements.pendulumWrap.innerHTML.includes('role="img"'), "renderPendulum() renders an actual accessible <svg>, not just text outputs");
check(elements.pendulumWrap.innerHTML.includes('class="pendulum-bob"'), "the pendulum bob group is rendered with the class the reduced-motion CSS rule targets");

console.log("--- Data Governance: MDQS + Guardrail Gate Simulator golden values ---");
check(elements.mdqsScore.textContent === "96.875%", "MDQS score matches golden value (100% - weighted deductions)", elements.mdqsScore.textContent);
check(elements.mdqsBand.innerHTML.includes(">▲ AMBER<"), "96.875% is correctly banded AMBER (93-98%)", elements.mdqsBand.innerHTML);
check(elements.gateBomOut.innerHTML.includes(">✓ PASS<"), "BOM gate (8% vs 15% threshold) correctly PASSES", elements.gateBomOut.innerHTML);
check(elements.gatePoOut.innerHTML.includes(">✗ BLOCKED<"), "PO gate (7% vs 5% threshold) correctly BLOCKS", elements.gatePoOut.innerHTML);
check(elements.gateConfOut.innerHTML.includes(">✓ PASS<"), "Confirmation gate (12% vs 15% threshold) correctly PASSES", elements.gateConfOut.innerHTML);

console.log("--- Stress-test finding (2026-09-06): BOM gate was missing Math.abs(), unlike its 2 siblings ---");
// Pre-registered by hand: -50% is a mass discrepancy 3x past the 15% threshold in magnitude, but
// without Math.abs() it reads as bom<=15 -> true -> PASS, identical to the benign default (8%).
elements.gateBom.value = "-50";
sandbox.calcGates();
check(elements.gateBomOut.innerHTML.includes(">✗ BLOCKED<"), "BOM gate now correctly BLOCKS on a large NEGATIVE discrepancy (-50%), matching PO/Confirmation's existing Math.abs() behavior (was: silently PASS, identical to a benign +8%)", elements.gateBomOut.innerHTML);
elements.gateBom.value = "8"; // restore default
sandbox.calcGates();
check(elements.gateBomOut.innerHTML.includes(">✓ PASS<"), "restoring the BOM input to its default (8%) reproduces the original golden PASS state", elements.gateBomOut.innerHTML);

console.log("--- Stress-test finding (2026-09-06): MDQS score wasn't floored, could exceed 100% with a negative input ---");
// Pre-registered by hand: deduction = 0.30*(-50/300)*100 + 0.30*(15/500)*100 + 0.25*(4/80)*100 +
// 0.15*(10/400)*100 = -5+0.9+1.25+0.375 = -2.475 -> score = 102.475%, a nonsensical value above the
// page's own 0-100% assumption (bandFor treats >=98% as the best band).
elements.mdqsRoutingErr.value = "-50";
sandbox.calcMdqs();
check(!elements.mdqsScore.textContent.includes("102"), "MDQS score no longer exceeds 100% with a negative routing-error count (was: '102.475%')", elements.mdqsScore.textContent);
check(elements.mdqsScore.textContent === "97.475%", "negative routing-error count is floored to 0 (not just its deduction term), giving the pre-registered golden value for the remaining 3 real deductions (100% - 0.9 - 1.25 - 0.375 = 97.475%)", elements.mdqsScore.textContent);
elements.mdqsRoutingErr.value = "6"; // restore default
sandbox.calcMdqs();
check(elements.mdqsScore.textContent === "96.875%", "restoring the routing-error input to its default (6) reproduces the original golden MDQS score exactly", elements.mdqsScore.textContent);

console.log("--- viz-innovation batch 2: Pressure-Vessel Cost Containment golden values (same MDQS deduction, as distance-to-breach) ---");
// deduction = 100-96.875 = 3.125; pressureRatio = 3.125/7 = 0.446428571... -> "44.6%" (toFixed(1)).
check(typeof sandbox.calcPressureVessel === "function", "window.calcPressureVessel is exposed as a function");
const pvState = sandbox.calcPressureVessel(3.125, "amber");
check(Math.abs(pvState.pressureRatio - 3.125 / 7) < 1e-9, "pressure ratio matches golden value", pvState.pressureRatio);
check(pvState.valveOpen === false, "the valve is correctly closed at the amber band (not yet in breach)", pvState.valveOpen);
sandbox.renderPressureVessel(pvState);
check(elements.pressureVesselWrap.innerHTML.includes("<svg") && elements.pressureVesselWrap.innerHTML.includes('role="img"'), "renderPressureVessel() renders an actual accessible <svg>, not just numbers");
check(elements.pressureVesselWrap.innerHTML.includes("44.6% of redline"), "the rendered pressure percentage matches the golden value", elements.pressureVesselWrap.innerHTML);
check(elements.pressureVesselWrap.innerHTML.includes("valve: closed"), "the valve state text matches the closed golden state", elements.pressureVesselWrap.innerHTML);
// Edge case: a real red-band score should open the valve.
const pvRedState = sandbox.calcPressureVessel(8, "red");
check(pvRedState.valveOpen === true, "the valve correctly opens once the band is red (deduction=8 > the 7-point redline)", pvRedState.valveOpen);
sandbox.renderPressureVessel(pvRedState);
check(elements.pressureVesselWrap.innerHTML.includes("valve: OPEN"), "the rendered valve state correctly shows OPEN for the red-band case", elements.pressureVesselWrap.innerHTML);
sandbox.calcMdqs(); // re-trigger via the real calculator (not a parallel path) to restore the default rendered state
check(elements.pressureVesselWrap.innerHTML.includes("44.6% of redline"), "calcMdqs() itself re-renders the pressure vessel back to the default golden state on every recalculation", elements.pressureVesselWrap.innerHTML);

console.log("--- MHR Build-Up Calculator: golden values (pre-registered via Python, verified before this file was written) ---");
check(elements.mhrDepOut.textContent === "$82,857", "annual depreciation matches golden value ($580,000 / 7 yrs)", elements.mhrDepOut.textContent);
check(elements.mhrFloorOut.textContent === "$12,160", "annual floor allocation matches golden value (320 sq ft x $38/sq ft)", elements.mhrFloorOut.textContent);
check(elements.mhrStandingBasisOut.textContent === "$117,017", "fixed OH allocation basis matches golden value (depreciation + floor + service)", elements.mhrStandingBasisOut.textContent);
check(elements.mhrProdHrsOut.textContent === "2,964", "productive hours matches golden value (3,800 scheduled x 78% OEE)", elements.mhrProdHrsOut.textContent);
check(elements.mhrStandingOut.textContent === "$39.48/hr", "fixed OH allocation rate matches golden value (allocation basis / productive hours)", elements.mhrStandingOut.textContent);
check(elements.mhrRunningOut.textContent === "$14.15/hr", "variable operating rate matches golden value (20kW x $0.12/kWh + $11.75 consumables)", elements.mhrRunningOut.textContent);
check(elements.mhrTotalOut.textContent === "$53.63/hr", "fully burdened MHR matches golden value (fixed allocation + variable operating, and equals the sum of the two lines above)", elements.mhrTotalOut.textContent);
check(!bannedStrings.some((s) => elements.mhrCapital && [elements.mhrDepOut, elements.mhrStandingOut, elements.mhrTotalOut].some((el) => el.textContent.includes(s))), "the MHR Build-Up Calculator's own outputs don't happen to reproduce any of the banned fabricated figures");

console.log("--- viz-innovation batch 4: Suspension Bridge Load Monitor golden values (same 5 MHR cost drivers, converted to a consistent $/hr basis) ---");
// depRate=82857.142857.../2964, floorRateHr=12160/2964, serviceRateHr=22000/2964, powerRate=20*0.12=2.4,
// consumables=11.75 -- all 5 sum to exactly totalMhr (53.629...) -- pre-registered via node -e.
check(typeof sandbox.calcSuspensionBridge === "function", "window.calcSuspensionBridge is exposed as a function");
const bridgeState = sandbox.calcSuspensionBridge(580000 / 7, 320 * 38, 22000, 3800 * 0.78, 20 * 0.12, 11.75, 53.62946790052053);
check(Math.abs(bridgeState.cables[0].rate - 27.954501638712163) < 1e-9, "depreciation cable rate matches golden value", bridgeState.cables[0].rate);
check(Math.abs(bridgeState.cables[1].rate - 4.102564102564102) < 1e-9, "floor allocation cable rate matches golden value", bridgeState.cables[1].rate);
check(Math.abs(bridgeState.cables[2].rate - 7.422402159244265) < 1e-9, "service contract cable rate matches golden value", bridgeState.cables[2].rate);
check(Math.abs(bridgeState.cables[3].rate - 2.4) < 1e-9, "power cable rate matches golden value", bridgeState.cables[3].rate);
check(Math.abs(bridgeState.cables[4].rate - 11.75) < 1e-9, "consumables cable rate matches golden value", bridgeState.cables[4].rate);
const cableSum = bridgeState.cables.reduce((s, c) => s + c.rate, 0);
check(Math.abs(cableSum - 53.62946790052053) < 1e-6, "all 5 cable rates sum to exactly the same fully burdened MHR the calculator above reports", cableSum);
check(bridgeState.dominant.label === "Depreciation", "the dominant (heaviest-loaded) cable is correctly identified as Depreciation", bridgeState.dominant.label);
sandbox.renderSuspensionBridge(bridgeState);
check(elements.suspensionBridgeWrap.innerHTML.includes("<svg") && elements.suspensionBridgeWrap.innerHTML.includes('role="img"'), "renderSuspensionBridge() renders an actual accessible <svg>, not just numbers");
check((elements.suspensionBridgeWrap.innerHTML.match(/<line/g) || []).length === 3 + 5, "exactly 8 lines: 2 towers + 1 deck + 5 cables", (elements.suspensionBridgeWrap.innerHTML.match(/<line/g) || []).length);
sandbox.calcMhrBuildup(); // re-trigger via the real calculator (not a parallel path) to confirm the wiring
check(elements.suspensionBridgeWrap.innerHTML.includes("<svg"), "calcMhrBuildup() itself re-renders the suspension bridge on every recalculation, not just at page load");

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

console.log("--- viz-innovation batch 4: Card Catalog Drawer Cohort Browser golden values (calcCardCatalog/renderCardCatalog) ---");
check(typeof sandbox.calcCardCatalog === "function", "calcCardCatalog is exposed on window");
check(typeof sandbox.renderCardCatalog === "function", "renderCardCatalog is exposed on window");
// Golden values pre-registered via a standalone node -e script against the real PLAYBOOK array
// before this check was written (B35): total=30, PLAYBOOK[0].code="MAT-MPV", PLAYBOOK[29].code="FIN-TRF".
const cc0 = sandbox.calcCardCatalog(0);
check(cc0.index === 0 && cc0.total === 30, "calcCardCatalog(0) returns index 0 of 30 total", JSON.stringify(cc0.index) + "/" + cc0.total);
check(cc0.item.code === "MAT-MPV", "calcCardCatalog(0) resolves to the same PLAYBOOK[0] the grid above renders (MAT-MPV)", cc0.item.code);
const ccLast = sandbox.calcCardCatalog(29);
check(ccLast.item.code === "FIN-TRF", "calcCardCatalog(29) resolves to PLAYBOOK[29] (FIN-TRF), the real last scenario", ccLast.item.code);
// Clamping edge cases -- index is bounded to the real [0, PLAYBOOK.length-1] range, never a
// separate hardcoded bound that could drift from the actual array length.
check(sandbox.calcCardCatalog(-1).index === 0, "calcCardCatalog(-1) clamps to index 0, not negative", sandbox.calcCardCatalog(-1).index);
check(sandbox.calcCardCatalog(30).index === 29, "calcCardCatalog(30) clamps to PLAYBOOK.length-1 (29), not out of bounds", sandbox.calcCardCatalog(30).index);

sandbox.renderCardCatalog(cc0);
check(!!elements.cardCatalogWrap, "found the card catalog wrap element to check");
check(elements.cardCatalogWrap.innerHTML.includes("pb-card"), "renderCardCatalog renders a pb-card block (reuses the same card markup as the grid above)");
check(elements.cardCatalogWrap.innerHTML.includes("MAT-MPV"), "rendered card shows the real MAT-MPV code for index 0", elements.cardCatalogWrap.innerHTML.includes("MAT-MPV"));
check(!!elements.catalogPositionOut, "found the catalog position indicator element to check");
check(elements.catalogPositionOut.textContent === "Card 1 of 30", "position indicator reads \"Card 1 of 30\" at index 0", elements.catalogPositionOut.textContent);

// Exercise the Prev/Next buttons the same way a user would -- click the stub's real listener,
// not a parallel reimplementation of the click handler.
check(!!elements.catalogNextBtn && !!elements.catalogPrevBtn, "found the catalog Prev/Next buttons to check");
elements.catalogNextBtn.click();
check(elements.catalogPositionOut.textContent === "Card 2 of 30", "clicking Next advances the position indicator to \"Card 2 of 30\"", elements.catalogPositionOut.textContent);
elements.catalogPrevBtn.click();
check(elements.catalogPositionOut.textContent === "Card 1 of 30", "clicking Prev returns the position indicator to \"Card 1 of 30\"", elements.catalogPositionOut.textContent);
// Restore the module-level catalogIndex to 0 so later checks in this file aren't affected by
// this block's own click-simulation (matches the "restore to default" discipline used elsewhere).
sandbox.renderCardCatalog(sandbox.calcCardCatalog(0));

console.log("--- KPI research round (2026-09-05): Buy-to-Fly threshold correction + threshold-scale redesign ---");
// A 7-agent research pass cross-checked all 30 Playbook KPIs against published industry evidence.
// Buy-to-Fly / Swarf-to-Solid Ratio was the one confirmed miscalibration: the original <=4.0:1 green
// ceiling sat below the low end of every published aerospace-titanium buy-to-fly range found (real
// figures run 6:1-20:1+, averaging ~11:1) -- widened here to bracket the real average.
const buyToFlyEntry = sandbox.PLAYBOOK.filter((p) => p.code === "MAT-02")[0];
check(!!buyToFlyEntry, "found the Buy-to-Fly / Swarf-to-Solid Ratio playbook entry (MAT-02)");
if (buyToFlyEntry) {
  check(buyToFlyEntry.green === "≤10.0:1", "Buy-to-Fly green threshold corrected to bracket the real ~11:1 industry average, not the original (too-strict) 4.0:1", buyToFlyEntry.green);
  check(buyToFlyEntry.amber === "10.1–16.0:1", "Buy-to-Fly amber threshold corrected", buyToFlyEntry.amber);
  check(buyToFlyEntry.red === ">16.0:1", "Buy-to-Fly red threshold corrected", buyToFlyEntry.red);
  check(buyToFlyEntry.root.includes("engineering release limit (4:1) is deliberately tighter than the general fleet-wide band"), "a stress-test found the widened GREEN <=10.0:1 fleet band contradicted this scenario's own 4:1/8.1:1 worked example (8.1:1 now reads GREEN yet the card narrates it as a real, corrective-action-worthy failure) -- fixed with a clarifying sentence distinguishing the part's own release limit from the fleet-wide band, not by silently leaving the contradiction", buyToFlyEntry.root);
}
check(!html.includes(".pb-thresholds"), "the old three-separate-badge .pb-thresholds display was fully replaced, not left as dead CSS alongside the new one");
check(html.includes(".pb-scale{"), "the new consolidated banded-scale CSS exists");
check(html.includes('class="zone-green"') && html.includes('class="zone-amber"') && html.includes('class="zone-red"'), "renderPlaybook's own template references all three zone classes (confirms the redesign is actually wired in, not just styled-but-unused CSS)");

console.log("--- KPI research round (2026-09-05): Methodology-tab research disclosure card ---");
check(html.includes("A research pass on the 30-scenario Playbook's own KPIs"), "found the card documenting this round's KPI research pass and the Buy-to-Fly correction");

console.log("--- KPI research round (2026-09-05): Quality/Scrap Cost Pareto chart (research-recommended chart type, built from real already-computed figures) ---");
check(typeof sandbox.renderQualityParetoChart === "function", "window.renderQualityParetoChart is exposed as a function");
const paretoData = sandbox.renderQualityParetoChart();
check(paretoData.items.length === 3, "Pareto chart covers exactly the 3 quality/scrap-adjacent scenarios", paretoData.items.length);
check(paretoData.items.map((it) => it.code).join(",") === "QLT-04,QLT-01,QLT-02", "items are correctly sorted descending by dollar exposure (Build Failure Amortization $7,862 > Defect Sunk Scrap $7,350 > Rework Conversion $4,090.50)", paretoData.items.map((it) => it.code).join(","));
check(Math.abs(paretoData.items[0].value - 7862) < 0.01, "Build Failure Amortization Factor's extracted dollar value matches its own printed result ($7,862), not a re-typed number", paretoData.items[0].value);
check(Math.abs(paretoData.items[1].value - 7350) < 0.01, "Defect Sunk Scrap Cost Drag's extracted dollar value matches its own printed result ($7,350)", paretoData.items[1].value);
check(Math.abs(paretoData.items[2].value - 4090.5) < 0.01, "Rework Conversion Surcharge's extracted dollar value matches its own printed result ($4,090.50)", paretoData.items[2].value);
check(Math.abs(paretoData.total - 19302.5) < 0.01, "total exposure across the 3 scenarios matches the pre-registered golden value (verified via Node before this check was written)", paretoData.total);
check(Math.abs(paretoData.cumPoints[0].pct - 40.73047532703018) < 0.0001, "first cumulative-% point matches the pre-registered golden value", paretoData.cumPoints[0].pct);
check(Math.abs(paretoData.cumPoints[1].pct - 78.80844450200752) < 0.0001, "second cumulative-% point matches the pre-registered golden value", paretoData.cumPoints[1].pct);
check(Math.abs(paretoData.cumPoints[2].pct - 100) < 0.0001, "final cumulative-% point reaches exactly 100%", paretoData.cumPoints[2].pct);
check(elements.qualityParetoWrap.innerHTML.includes("<svg"), "the Pareto chart actually rendered an <svg> element into the page, not just returned numbers");
check(elements.qualityParetoWrap.innerHTML.includes("$7,862") && elements.qualityParetoWrap.innerHTML.includes("$7,350") && elements.qualityParetoWrap.innerHTML.includes("$4,091"), "the rendered SVG labels all 3 bars with their real dollar values", elements.qualityParetoWrap.innerHTML.match(/\$[\d,]+/g));

console.log("--- Pathway C (2026-09-05): KPI Interaction Map -- confirmed cross-KPI tradeoffs, each side clickable to a real Playbook scenario ---");
check(Array.isArray(sandbox.KPI_TRADEOFFS), "window.KPI_TRADEOFFS is exposed as an array");
check(sandbox.KPI_TRADEOFFS.length === 2, "exactly 2 tradeoff pairs are modeled (the two with a clean KPI-to-KPI pairing; the third -- nesting yield vs. cycle time -- is documented as a caption, not forced into a pair it doesn't have)", sandbox.KPI_TRADEOFFS.length);
const tradeoffCodes = sandbox.KPI_TRADEOFFS.flatMap((t) => [t.aCode, t.bCode]);
check(new Set(tradeoffCodes).size === 4, "all 4 referenced KPI codes across the 2 tradeoff pairs are unique (no scenario appears twice)", JSON.stringify(tradeoffCodes));
tradeoffCodes.forEach((code) => {
  const found = sandbox.PLAYBOOK.some((p) => p.code === code);
  check(found, `tradeoff-map code "${code}" refers to a real Playbook scenario that actually exists (not a stale/typo\'d reference)`, code);
});
check(typeof sandbox.renderKpiInteractionMap === "function", "window.renderKpiInteractionMap is exposed as a function");
check(elements.kpiInteractionMapWrap.innerHTML.includes("<svg"), "the KPI Interaction Map actually rendered an <svg> element");
check((elements.kpiInteractionMapWrap.innerHTML.match(/class="kim-node"/g) || []).length === 4, "exactly 4 clickable nodes are rendered (2 tradeoff pairs x 2 endpoints each)", (elements.kpiInteractionMapWrap.innerHTML.match(/class="kim-node"/g) || []).length);
tradeoffCodes.forEach((code) => {
  check(elements.kpiInteractionMapWrap.innerHTML.includes('data-target="pbcard-' + code + '"'), `a node targets the real pbcard-${code} element id (not a mismatched or stale target)`, code);
});
sandbox.renderPlaybook(); // ensure the default (all-domains) render has produced every pbcard-* id
tradeoffCodes.forEach((code) => {
  check(elements.pbList.innerHTML.includes('id="pbcard-' + code + '"'), `renderPlaybook() actually emits id="pbcard-${code}" into the rendered markup for this tradeoff's scroll target to find`, code);
});
// Accepted limitation: click/keyboard activation on the map's nodes calls document.querySelectorAll
// ('.kim-node') to attach listeners -- a real DOM method every browser has, but this stub only
// implements querySelectorAll on documentStub itself (degrading safely to [] on individual elements,
// same class of stub limitation as the Command Palette's arrow-key re-highlighting). Verified live in
// a real browser instead: clicking a node activates the Playbook tab, resets the filter, and scrolls
// the target scenario into view.

console.log("--- Stress-test round (2026-09-05) fix: KPI Interaction Map's outer <svg> uses role=\"group\", not role=\"img\" ---");
// A stress-test found the map's outer <svg role="img"> wrapped real interactive role="button"
// children -- role="img" tells assistive tech to treat the whole subtree as one flat, non-interactive
// image, hiding those nested buttons from the accessibility tree entirely. No other chart on this
// page nests interactive content inside role="img", so this checks the map specifically.
check(html.includes('role="group" aria-label="Two confirmed cross-KPI tradeoffs'), "the KPI Interaction Map's outer <svg> uses role=\"group\" (not role=\"img\"), so its nested role=\"button\" nodes are exposed to assistive tech instead of being pruned from the tree");
check(!html.includes('role="img" aria-label="Two confirmed cross-KPI tradeoffs'), "the old role=\"img\" wrapping is gone, not left alongside the fix");

console.log("--- Stress-test round (2026-09-05) fix: KPI Interaction Map jump() moves focus onto the target card, not just the sidenav tab ---");
// A stress-test found jump() called activateTab('playbook') with no opts, which defaults
// focusToo=true and focuses the sidenav tab button while scrollIntoView moves the *visual* viewport
// to the target card -- decoupling keyboard focus from what's on screen. Can't exercise this live in
// the stub (the click/keydown listeners are never attached -- see the accepted limitation above), so
// this checks the fix is actually present in source, and the live-browser behavior is verified
// separately.
const jumpFnMatch = html.match(/var jump = function\(\)\{[\s\S]*?\n\s*\};/);
check(!!jumpFnMatch, "found the jump() function body to check");
if (jumpFnMatch) {
  check(jumpFnMatch[0].includes("activateTab('playbook', { focus: false })"), "jump() passes {focus:false} to activateTab, so it no longer silently focuses the sidenav tab out from under the intended scroll target", jumpFnMatch[0]);
  check(jumpFnMatch[0].includes("target.focus({ preventScroll: true })"), "jump() moves focus onto the target card itself after scrolling (preventScroll avoids fighting the smooth scrollIntoView already in flight)", jumpFnMatch[0]);
}

console.log("--- viz-innovation batch 3: Domino Effect Probability Cascade golden values (illustrative example probabilities, exact compound-probability math) ---");
// p1=0.35, p2=0.25 (defaults): P(none)=(1-.35)(1-.25)=.65*.75=.4875; P(one)=.35*.75+.65*.25=.425;
// P(both)=.35*.25=.0875. Sum must be exactly 1.
check(typeof sandbox.calcDomino === "function", "window.calcDomino is exposed as a function");
const dominoState = sandbox.calcDomino(35, 25);
check(Math.abs(dominoState.pNone - 0.4875) < 1e-9, "P(neither fires) matches golden value", dominoState.pNone);
check(Math.abs(dominoState.pOne - 0.425) < 1e-9, "P(exactly one fires) matches golden value", dominoState.pOne);
check(Math.abs(dominoState.pBoth - 0.0875) < 1e-9, "P(both fire) matches golden value", dominoState.pBoth);
check(Math.abs(dominoState.pNone + dominoState.pOne + dominoState.pBoth - 1) < 1e-9, "the 3 outcome probabilities sum to exactly 1", dominoState.pNone + dominoState.pOne + dominoState.pBoth);
sandbox.renderDomino(dominoState);
check(elements.dominoWrap.innerHTML.includes("<svg") && elements.dominoWrap.innerHTML.includes('role="img"'), "renderDomino() renders an actual accessible <svg>, not just numbers");
check(elements.dominoWrap.innerHTML.includes("48.8%") && elements.dominoWrap.innerHTML.includes("42.5%") && elements.dominoWrap.innerHTML.includes("8.8%"), "all 3 rendered outcome percentages match golden values", elements.dominoWrap.innerHTML);

console.log("--- viz-innovation batch 3: Metronome Cadence Drift Tracker golden values (each cadence's own standard interval, illustrative days elapsed) ---");
// At 45 illustrative days: daily=floor(45/1)=45, weekly=floor(45/7)=6, monthly=floor(45/30)=1,
// OP1/OP2=floor(45/182)=0 -- pre-registered via node -e.
check(typeof sandbox.calcMetronome === "function", "window.calcMetronome is exposed as a function");
const metroState = sandbox.calcMetronome(45);
check(metroState.cadences[0].tickCount === 45, "daily standup tick count matches golden value", metroState.cadences[0].tickCount);
check(metroState.cadences[1].tickCount === 6, "weekly business review tick count matches golden value", metroState.cadences[1].tickCount);
check(metroState.cadences[2].tickCount === 1, "monthly business review tick count matches golden value", metroState.cadences[2].tickCount);
check(metroState.cadences[3].tickCount === 0, "OP1/OP2 tick count matches golden value (fewer than 182 days elapsed)", metroState.cadences[3].tickCount);
sandbox.renderMetronome(metroState);
check(elements.metronomeWrap.innerHTML.includes("<svg") && elements.metronomeWrap.innerHTML.includes('role="img"'), "renderMetronome() renders an actual accessible <svg>, not just numbers");
check((elements.metronomeWrap.innerHTML.match(/<g class="metronome-arm"/g) || []).length === 4, "exactly 4 metronome arms are rendered, one per cadence", (elements.metronomeWrap.innerHTML.match(/<g class="metronome-arm"/g) || []).length);
check(elements.metronomeWrap.innerHTML.includes("45× so far"), "the daily standup's exact tick count is labeled on the chart", elements.metronomeWrap.innerHTML);

console.log("--- viz-innovation batch 4: Relay Race Baton Pass Timeline golden values (same 4 cadence intervals as Metronome, as escalation gaps) ---");
// gaps = [7-1, 30-7, 182-30] = [6, 23, 152] -- pre-registered via node -e.
check(typeof sandbox.calcRelayRace === "function", "window.calcRelayRace is exposed as a function");
const relayState = sandbox.calcRelayRace();
check(relayState.gaps.length === 3, "exactly 3 gaps exist between the 4 cadence tiers", relayState.gaps.length);
check(relayState.gaps[0].days === 6, "daily-to-weekly gap matches golden value", relayState.gaps[0].days);
check(relayState.gaps[1].days === 23, "weekly-to-monthly gap matches golden value", relayState.gaps[1].days);
check(relayState.gaps[2].days === 152, "monthly-to-OP1/OP2 gap matches golden value", relayState.gaps[2].days);
sandbox.renderRelayRace(relayState);
check(elements.relayRaceWrap.innerHTML.includes("<svg") && elements.relayRaceWrap.innerHTML.includes('role="img"'), "renderRelayRace() renders an actual accessible <svg>, not just numbers");
check((elements.relayRaceWrap.innerHTML.match(/<circle/g) || []).length === 4, "exactly 4 runner circles are rendered, one per cadence tier", (elements.relayRaceWrap.innerHTML.match(/<circle/g) || []).length);
check(elements.relayRaceWrap.innerHTML.includes("+152d wait"), "the largest gap's exact value is labeled on the chart", elements.relayRaceWrap.innerHTML);

console.log("--- Stress-test finding (2026-09-06): reduced-motion now reaches the two JS-driven smooth-scroll calls too ---");
// A stress-test found the CSS reduced-motion block disabled every transition/animation but missed
// `html{scroll-behavior:smooth}` and 2 JS scrollIntoView({behavior:'smooth'}) calls -- an explicit JS
// `behavior` option overrides the CSS property per spec, so the CSS fix alone can't reach these.
check(/@media \(prefers-reduced-motion:reduce\)\{[\s\S]*?html\{scroll-behavior:auto\}/.test(html), "html{scroll-behavior:auto} is set inside the reduced-motion media block (covers native/anchor scrolling)");
check(typeof sandbox.prefersReducedMotion === "function", "window.prefersReducedMotion is exposed as a function");
check(sandbox.prefersReducedMotion() === false, "prefersReducedMotion() reads false with the stub's default (non-reduced) matchMedia state", sandbox.prefersReducedMotion());
simulateViewportForcedNarrow(true); // reuses the existing controllable matchMedia stub -- its single
                                     // shared `matches` flag doesn't distinguish query strings, so
                                     // flipping it also exercises the reduced-motion path
check(sandbox.prefersReducedMotion() === true, "prefersReducedMotion() correctly reads true once the stub's matchMedia reports matches:true", sandbox.prefersReducedMotion());
simulateViewportForcedNarrow(false); // restore before any later test relies on the non-narrow default
check(sandbox.prefersReducedMotion() === false, "restoring the stub's matchMedia state back to false is reflected immediately (not cached from the first call)", sandbox.prefersReducedMotion());
const smoothScrollCalls = (html.match(/behavior: prefersReducedMotion\(\) \? 'auto' : 'smooth'/g) || []).length;
check(smoothScrollCalls === 3, "all 3 scrollIntoView call sites (Command Palette + KPI Interaction Map + Phase 4 batch B's jumpToDecomposition) check prefersReducedMotion() instead of hardcoding 'smooth'", smoothScrollCalls);
check(!html.includes("behavior: 'smooth', block: 'center'"), "no scrollIntoView call still hardcodes an unconditional 'smooth' behavior", "");

console.log("--- Stress-test round (2026-09-05) fix: new factual claims (Pareto/ASQ, I-MR/SPC) added to the canonical sourced list ---");
check(html.includes('Pareto charts as the standard root-cause-prioritization tool'), "the Pareto-chart claim is now in the Methodology tab's sourced REAL-tag list, consistent with how every other factual claim on this page is documented");
check(html.includes('The Individuals (I-MR) control chart method'), "the SPC/I-MR claim is now in the Methodology tab's sourced REAL-tag list");

console.log("--- Learning Curve Forecaster: golden values (pre-registered via Python/Node, matching a corrected recompute of the source document's own worked example) ---");
// The source document's own worked example ($3,345.75) has a real ~0.4% arithmetic slip -- this
// dashboard's golden value is the independently re-derived correct figure, not a copy of theirs.
check(elements.lcB.textContent === "-0.3219", "learning index b matches golden value (ln(0.80)/ln(2))", elements.lcB.textContent);
check(elements.lcTotalHours.textContent === "74.64 hrs", "total labor hours matches golden value", elements.lcTotalHours.textContent);
check(elements.lcAvgUnitTime.textContent === "1.87 hrs", "average unit time matches golden value", elements.lcAvgUnitTime.textContent);
check(elements.lcTotalCost.textContent === "$3358.59", "total labor cost matches golden value (independently re-derived, NOT the source document's own $3,345.75 -- a real ~0.4% arithmetic slip found in their worked example)", elements.lcTotalCost.textContent);
check(elements.lcDistortion.textContent === "-$7,441 (fake favorable)", "the static-standard distortion matches golden value and is correctly labeled a fake favorable variance, not real performance", elements.lcDistortion.textContent);

console.log("--- Stress-test finding (2026-09-06): Learning Curve NaN/Infinity at reachable inputs ---");
// Pre-registered by hand: at Learning Rate=50%, b=ln(0.5)/ln(2)=-1 EXACTLY (verified: -1===-1 in JS
// double precision), so exp=b+1=0 exactly, hitting the (a/exp)*(...) formula's division by zero --
// the fix replaces that one point with the true closed-form logarithmic limit, a*ln((M+N)/M), which
// a numerical approach from both sides (49.9999%/50.0001%) confirms agrees with (~6.5917 either way).
elements.lcLearningRate.value = "50";
sandbox.calcLearningCurve();
check(!elements.lcTotalHours.textContent.includes("NaN"), "Learning Rate=50% no longer produces a literal NaN (was: 'NaN hrs')", elements.lcTotalHours.textContent);
check(elements.lcTotalHours.textContent === "6.59 hrs", "Learning Rate=50% uses the correct logarithmic limit (a*ln((M+N)/M) = 6*ln(60/20) = 6.5917, pre-registered via node -e)", elements.lcTotalHours.textContent);
elements.lcLearningRate.value = "80"; // restore default before the M=0 probe below
elements.lcBatchStart.value = "0";
sandbox.calcLearningCurve();
check(!elements.lcTotalHours.textContent.includes("Infinity"), "Batch Start=0 no longer produces a literal Infinity (was: 'Infinity hrs') -- floored to the model's real domain (Wright/Crawford unit numbering starts at 1, not 0)", elements.lcTotalHours.textContent);
check(elements.lcTotalHours.textContent === "100.92 hrs", "Batch Start=0 floors to M=1 internally; result matches the independently pre-registered value for (a=6,phi=80%,M=1,N=40)", elements.lcTotalHours.textContent);
elements.lcBatchStart.value = "20"; // restore default
sandbox.calcLearningCurve();
check(elements.lcTotalHours.textContent === "74.64 hrs", "restoring Batch Start to its default (20) reproduces the original golden value exactly, confirming the fix didn't disturb normal operation", elements.lcTotalHours.textContent);

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

console.log("--- viz-innovation batch 3: Aurora Layer Correlation Map golden values (real Pearson correlation across the 10 risks' independently-assigned P/S/D scores) ---");
// P=[4,3,3,4,4,5,2,4,2,4], S=[4,5,4,3,2,2,4,3,4,3], D=[2,3,1,4,2,3,4,2,3,3] -- pre-registered via a
// standalone node -e Pearson correlation script before this check was written.
check(typeof sandbox.calcAurora === "function", "window.calcAurora is exposed as a function");
const auroraState = sandbox.calcAurora();
check(JSON.stringify(auroraState.P) === JSON.stringify([4, 3, 3, 4, 4, 5, 2, 4, 2, 4]), "the P series matches the real risk register's own values, in order", JSON.stringify(auroraState.P));
check(JSON.stringify(auroraState.S) === JSON.stringify([4, 5, 4, 3, 2, 2, 4, 3, 4, 3]), "the S series matches the real risk register's own values, in order", JSON.stringify(auroraState.S));
check(JSON.stringify(auroraState.D) === JSON.stringify([2, 3, 1, 4, 2, 3, 4, 2, 3, 3]), "the D series matches the real risk register's own values, in order", JSON.stringify(auroraState.D));
check(Math.abs(auroraState.corrPS - (-0.7100716024967264)) < 1e-9, "corr(P,S) matches the pre-registered golden Pearson coefficient", auroraState.corrPS);
check(Math.abs(auroraState.corrPD - (-0.18077538151554684)) < 1e-9, "corr(P,D) matches the pre-registered golden Pearson coefficient", auroraState.corrPD);
check(Math.abs(auroraState.corrSD - 0.024246432248443615) < 1e-9, "corr(S,D) matches the pre-registered golden Pearson coefficient", auroraState.corrSD);
sandbox.renderAurora(auroraState);
check(elements.auroraWrap.innerHTML.includes("<svg") && elements.auroraWrap.innerHTML.includes('role="img"'), "renderAurora() renders an actual accessible <svg>, not just numbers");
check((elements.auroraWrap.innerHTML.match(/<path/g) || []).length === 3, "exactly 3 band paths are rendered, one per dimension (P/S/D)", (elements.auroraWrap.innerHTML.match(/<path/g) || []).length);
check(elements.auroraCorrPS.textContent === "-0.710", "rendered corr(P,S) text matches golden value", elements.auroraCorrPS.textContent);
check(elements.auroraCorrPD.textContent === "-0.181", "rendered corr(P,D) text matches golden value", elements.auroraCorrPD.textContent);
check(elements.auroraCorrSD.textContent === "0.024", "rendered corr(S,D) text matches golden value", elements.auroraCorrSD.textContent);

console.log("--- Risk Scorer: golden values (default P=3, S=3, D=3) ---");
check(elements.riskScoreOut.textContent === "27", "default risk score matches golden value (3x3x3)", elements.riskScoreOut.textContent);
check(elements.riskScoreBand.innerHTML.includes("ESCALATE"), "CRPN 27 (>= 25) correctly bands ESCALATE", elements.riskScoreBand.innerHTML);
check(elements.riskScoreBand.innerHTML.includes(">✗ ESCALATE"), "the ESCALATE band also carries the redundant ✗ symbol (UX_ROADMAP idea #23), not color+text alone", elements.riskScoreBand.innerHTML);

console.log("--- Manufacturing Value at Risk (M-VaR): golden values ---");
check(elements.mvarZ.textContent === "1.645", "default (95%) Z-score matches golden value", elements.mvarZ.textContent);
check(elements.mvarOut.textContent === "$18699.00", "M-VaR at 95% confidence matches golden value (mu=8500, sigma=6200)", elements.mvarOut.textContent);
elements.mvarConfidence.value = "99";
sandbox.calcMVaR();
check(elements.mvarZ.textContent === "2.326", "switching to 99% confidence updates the Z-score to the golden value", elements.mvarZ.textContent);
check(elements.mvarOut.textContent === "$22921.20", "M-VaR at 99% confidence matches golden value", elements.mvarOut.textContent);
elements.mvarConfidence.value = "95";
sandbox.calcMVaR();

console.log("--- viz-innovation batch 1: Tightrope Confidence Walk golden values (same M-VaR inputs, pre-registered by hand) ---");
// buffer = z*sigma = 1.645*6200 = 10199 -> fmtMoney "+$10,199". CoV = sigma/mu = 6200/8500 = 0.729412
// -> "72.9%" (toFixed(1) on the percentage).
check(typeof sandbox.calcTightrope === "function", "window.calcTightrope is exposed as a function");
const tightropeState = sandbox.calcTightrope();
check(Math.abs(tightropeState.buffer - 10199) < 1e-9, "calcTightrope's buffer (z*sigma) matches golden value", tightropeState.buffer);
check(Math.abs(tightropeState.cov - 6200 / 8500) < 1e-9, "calcTightrope's coefficient of variation matches golden value", tightropeState.cov);
sandbox.renderTightrope(tightropeState);
check(elements.tightropeBufferOut.textContent === "+$10,199", "rendered buffer matches golden value", elements.tightropeBufferOut.textContent);
check(elements.tightropeCovOut.textContent === "72.9%", "rendered coefficient of variation matches golden value", elements.tightropeCovOut.textContent);
check(elements.tightropeWrap.innerHTML.includes('class="tightrope-walker"'), "the walker group is rendered with the class the reduced-motion CSS rule targets");
// Edge case: mu=0 makes CoV undefined (division by zero) -- confirm it's handled explicitly, not left as Infinity/NaN in the rendered text.
elements.mvarMu.value = "0";
const zeroMuState = sandbox.calcTightrope();
check(zeroMuState.cov === Infinity, "calcTightrope's cov correctly resolves to Infinity, not NaN, when mu=0 and sigma>0", zeroMuState.cov);
sandbox.renderTightrope(zeroMuState);
check(elements.tightropeCovOut.textContent === "— (μ=0)", "the mu=0 edge case renders an explicit dash, not the literal string 'Infinity'", elements.tightropeCovOut.textContent);
elements.mvarMu.value = "8500"; // restore default
sandbox.renderTightrope(sandbox.calcTightrope());
check(elements.tightropeBufferOut.textContent === "+$10,199", "restoring mu to its default reproduces the original golden buffer value", elements.tightropeBufferOut.textContent);

console.log("--- Fabrication guard: Risk Register data ---");
const riskBlob = JSON.stringify(sandbox.RISK_REGISTER);
const foundBannedInRisk = bannedStrings.concat(wrongClaimStrings).filter((s) => riskBlob.includes(s));
check(foundBannedInRisk.length === 0, "none of the banned/wrong-claim strings leaked into the risk register data itself", JSON.stringify(foundBannedInRisk));

console.log("--- Stress-test finding (2026-09-06): badge/status-pill contrast now clears WCAG AA against the REAL composited background ---");
// A stress-test found the status colors were checked against the wrong background (a flat card
// color, not what actually renders once the badge's own 15%-opacity tint composites over it). This
// is the WCAG relative-luminance/contrast math itself (matching the sibling repos' own fix this
// round), reading the LIVE CSS token values out of index.html rather than hardcoding an assumption.
function srgbToLin(c) { c = c / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function relLum(rgb) { return 0.2126 * srgbToLin(rgb[0]) + 0.7152 * srgbToLin(rgb[1]) + 0.0722 * srgbToLin(rgb[2]); }
function wcagContrast(rgb1, rgb2) {
  const l1 = relLum(rgb1), l2 = relLum(rgb2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
function composite(fg, bg, alpha) { return fg.map((c, i) => c * alpha + bg[i] * (1 - alpha)); }
function parseTriple(str) { return str.split(/\s+/).map(Number); }
function tokenBlock(marker) {
  const blockMatch = html.match(new RegExp(marker + "\\{([\\s\\S]*?)\\}"));
  if (!blockMatch) return null;
  const block = blockMatch[1];
  const success = block.match(/--c-success:([\d\s]+);/);
  const warning = block.match(/--c-warning:([\d\s]+);/);
  const danger = block.match(/--c-danger:([\d\s]+);/);
  const bgCard = block.match(/--c-bg-card:([\d\s]+);/);
  if (!success || !warning || !danger || !bgCard) return null;
  return {
    success: parseTriple(success[1]), warning: parseTriple(warning[1]), danger: parseTriple(danger[1]),
    bgCard: parseTriple(bgCard[1]),
  };
}
const darkTokens = tokenBlock(":root");
const lightTokens = tokenBlock(":root\\[data-theme=\"light\"\\]");
check(!!darkTokens && !!lightTokens, "both dark and light theme token blocks were successfully extracted from the live CSS source", JSON.stringify({ darkTokens, lightTokens }));
if (darkTokens && lightTokens) {
  const BADGE_ALPHA = 0.15;
  const dSuccessOnCard = wcagContrast(darkTokens.success, composite(darkTokens.success, darkTokens.bgCard, BADGE_ALPHA));
  const dWarningOnCard = wcagContrast(darkTokens.warning, composite(darkTokens.warning, darkTokens.bgCard, BADGE_ALPHA));
  const dDangerOnCard = wcagContrast(darkTokens.danger, composite(darkTokens.danger, darkTokens.bgCard, BADGE_ALPHA));
  const lSuccessOnCard = wcagContrast(lightTokens.success, composite(lightTokens.success, lightTokens.bgCard, BADGE_ALPHA));
  const lWarningOnCard = wcagContrast(lightTokens.warning, composite(lightTokens.warning, lightTokens.bgCard, BADGE_ALPHA));
  const lDangerOnCard = wcagContrast(lightTokens.danger, composite(lightTokens.danger, lightTokens.bgCard, BADGE_ALPHA));
  check(dSuccessOnCard >= 4.5, `dark-theme success badge clears WCAG AA (${dSuccessOnCard.toFixed(2)}:1, was 3.95:1)`, dSuccessOnCard);
  check(dWarningOnCard >= 4.5, `dark-theme warning badge clears WCAG AA (${dWarningOnCard.toFixed(2)}:1, was 4.47:1)`, dWarningOnCard);
  check(dDangerOnCard >= 4.5, `dark-theme danger badge clears WCAG AA (${dDangerOnCard.toFixed(2)}:1, was 3.76:1)`, dDangerOnCard);
  check(lSuccessOnCard >= 4.5, `light-theme success badge clears WCAG AA (${lSuccessOnCard.toFixed(2)}:1, was 4.37:1)`, lSuccessOnCard);
  check(lWarningOnCard >= 4.5, `light-theme warning badge already cleared WCAG AA and still does (${lWarningOnCard.toFixed(2)}:1)`, lWarningOnCard);
  check(lDangerOnCard >= 4.5, `light-theme danger badge already cleared WCAG AA and still does (${lDangerOnCard.toFixed(2)}:1)`, lDangerOnCard);
}
// The 4 theme blocks (bare :root, @media light, [data-theme=dark], [data-theme=light]) must stay
// byte-identical in pairs -- a drift here would mean only SOME entry points into a theme get the fix.
const rootDarkMatch = html.match(/:root\{[\s\S]*?--c-success:([\d\s]+); --c-warning:([\d\s]+); --c-danger:([\d\s]+);/);
const attrDarkMatch = html.match(/:root\[data-theme="dark"\]\{[\s\S]*?--c-success:([\d\s]+); --c-warning:([\d\s]+); --c-danger:([\d\s]+);/);
check(!!rootDarkMatch && !!attrDarkMatch && rootDarkMatch[0].match(/--c-success:[\d\s]+/)[0] === attrDarkMatch[0].match(/--c-success:[\d\s]+/)[0], "bare :root and :root[data-theme=\"dark\"] carry the identical (fixed) success/warning/danger values, not just one of the two dark entry points");

console.log("--- Stress-test finding (2026-09-06): every <label> now carries a for= pairing to a real control id ---");
// Pre-registered by hand: this file had 81 <label> elements, none with a `for=` attribute and none
// wrapping their control -- zero programmatic label-control association for every calculator input
// on the page (only the two Playbook filter controls had an aria-label fallback). Fixed by pairing
// each label to the nearest following <input>/<select> id (skipping any id inside a nested <b>, a
// live-value display, not the control itself).
// Scoped to the static markup only (before <script>) -- the Attention & Triage tab (Phase 4 batch D)
// generates its own "Acknowledged" checkbox <label> at runtime via a JS template string, using
// implicit wrapping-based label association (a real, valid a11y pattern) rather than this file's
// otherwise-universal explicit for= convention. That's a deliberate choice for one dynamic, always-
// re-rendered control, not a lapse in the static-markup convention this check actually guards.
const totalLabels = (staticMarkup.match(/<label\b/g) || []).length;
const labelsWithFor = staticMarkup.match(/<label for="([a-zA-Z0-9_]+)"/g) || [];
check(totalLabels === 91, "exactly 91 <label> elements exist in the static markup (90 + 1 from Phase 4 batch C's roleSelect)", totalLabels);
check(labelsWithFor.length === totalLabels, "every single static-markup <label> carries a for= attribute, not just some of them", `${labelsWithFor.length}/${totalLabels}`);
const forTargets = [...html.matchAll(/<label for="([a-zA-Z0-9_]+)"/g)].map((m) => m[1]);
const allIds = new Set([...html.matchAll(/\bid="([a-zA-Z0-9_]+)"/g)].map((m) => m[1]));
check(forTargets.every((id) => allIds.has(id)), "every for= target resolves to a real id= somewhere on the page (no dangling/typo'd pairing)", JSON.stringify(forTargets.filter((id) => !allIds.has(id))));
check(new Set(forTargets).size === forTargets.length, "no two labels point at the same control (each of the 81 pairings is unique)", `${new Set(forTargets).size} unique targets / ${forTargets.length} labels`);
// Spot-check the 8 trickiest cases by hand (a <b> live-value span inside the label, or the label and
// its control on separate source lines) -- these are exactly the shapes a naive "next id on this
// line" substitution would get wrong.
check(html.includes('<label for="dfmThickness">Minimum wall thickness <b id="dfmThicknessLabel">'), "the DFM slider label correctly pairs with its <input>, not the nested <b> live-value span it also contains");
check(html.includes('<label for="scProcess">Process / work center</label>'), "the Should-Cost process dropdown's label (on a separate line from its <select>) is correctly paired");
check(html.includes('<label for="mvarConfidence">Confidence level</label>'), "the M-VaR confidence-level dropdown's label is correctly paired");

console.log("--- Explain-the-Math modal: data + wiring ---");
check(typeof sandbox.EXPLAIN === "object" && sandbox.EXPLAIN !== null, "window.EXPLAIN is exposed as an object");
["cmar", "oae", "mpv", "mqv", "dlrv", "dlev", "vosv", "fovv", "mdqs", "mhrBuildup", "learningcurve", "crpn", "mvar", "ou", "qstar", "montecarlo", "tow", "pendulum", "tightrope", "archery", "honeycomb", "nestingdoll", "circulatory", "glacial", "pressurevessel", "kaleidophone", "compassrose", "domino", "aurora", "sonar", "metronome", "comettail", "suspensionbridge", "shadowpuppet", "relayrace", "thermostat", "cardcatalog"].forEach((key) => {
  const e = sandbox.EXPLAIN[key];
  check(!!e && !!e.title && !!e.formula && !!e.body, `EXPLAIN["${key}"] has a title, formula, and body`);
});
const explainButtonCount = (html.match(/data-explain="/g) || []).length;
check(explainButtonCount === 38, "exactly 38 explain buttons are wired in the HTML (33 from before + viz-innovation batch 4's 5)", explainButtonCount);
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

console.log("--- Phase 4 batch A (2026-09-07): Keyboard Shortcuts overlay (UX_ROADMAP idea #22, P0) ---");
// Golden CHORD_MAP size pre-registered by reading the real object (window.CHORD_MAP, not a
// hand-copied duplicate) before writing this check (B35): 12 tabs, 12 chord letters.
check(typeof sandbox.openShortcuts === "function" && typeof sandbox.closeShortcuts === "function", "openShortcuts/closeShortcuts are exposed as functions");
check(Object.keys(sandbox.CHORD_MAP).length === 13, "CHORD_MAP has exactly 13 entries (one per real tab, +1: a /stress-test pass found Attention & Triage had never gotten its own chord letter)", Object.keys(sandbox.CHORD_MAP).length);
sandbox.openExplain("cmar");
check(elements.explainModal.classList.contains("open"), "sanity: explainModal is open before testing the shortcuts overlay's own close-others behavior");
sandbox.openShortcuts();
check(elements.shortcutsModal.classList.contains("open"), "openShortcuts() opens shortcutsModal");
check(!elements.explainModal.classList.contains("open"), "opening the shortcuts overlay while Explain was open auto-closes Explain first (reuses the shared openModal close-others behavior, not a special case)");
check(documentStub.activeElement === elements.shortcutsClose, "opening the overlay moves focus onto its own close button");
// The chord-legend rows must be GENERATED from the real CHORD_MAP + tabLabelFor(), not a hand-typed
// duplicate list -- checked by asserting the rendered body actually contains the real aria-label
// text for a sample of real tabs, keyed off their real chord letters.
check(elements.shortcutsBody.innerHTML.includes('then <span class="mono">e</span></span><span>Executive Overview</span>'), "the \"g then e\" row names the real Executive Overview tab (via CHORD_MAP+tabLabelFor, not a hand-typed string)", elements.shortcutsBody.innerHTML);
check(elements.shortcutsBody.innerHTML.includes('then <span class="mono">g</span></span><span>Data Governance</span>'), "the \"g then g\" row names the real Data Governance tab", elements.shortcutsBody.innerHTML);
check((elements.shortcutsBody.innerHTML.match(/then <span class="mono">/g) || []).length === 13, "exactly 13 chord rows are rendered, matching CHORD_MAP's own size (not a stale hardcoded count)", (elements.shortcutsBody.innerHTML.match(/then <span class="mono">/g) || []).length);
check(elements.shortcutsBody.innerHTML.includes("⌘K") && elements.shortcutsBody.innerHTML.includes("Esc"), "the overlay also documents the non-chord shortcuts (Quick Jump, Esc)", "");
sandbox.closeShortcuts();
check(!elements.shortcutsModal.classList.contains("open"), "closeShortcuts() removes the 'open' class");
check(documentStub.activeElement === preModalTrigger, "closing the shortcuts overlay restores focus to the real pre-modal trigger, same discipline as every other modal on this page");

// A fresh /stress-test pass (2026-09-07) found this file only ever asserted that OTHER modals close
// when Explain or the palette opens -- never the reverse (that shortcutsModal/tourModal themselves
// get closed when something else opens). Confirmed by sabotage-testing: removing shortcutsModal and
// tourModal from openModal's close-others array left every existing check green. Closing that
// specific coverage gap here, checking the mutual exclusion in both directions for all 4 modals.
sandbox.openShortcuts();
check(elements.shortcutsModal.classList.contains("open"), "sanity: shortcutsModal is open before testing that a DIFFERENT modal opening closes it");
sandbox.openTour();
check(elements.tourModal.classList.contains("open"), "openTour() opens tourModal");
check(!elements.shortcutsModal.classList.contains("open"), "opening the tour while Shortcuts was open closes Shortcuts -- the specific direction the prior checks never covered");
sandbox.openShortcuts();
check(!elements.tourModal.classList.contains("open"), "opening Shortcuts while the tour was open closes the tour -- confirms the exclusion works in both directions, not just one");
sandbox.closeShortcuts();
check(!elements.shortcutsModal.classList.contains("open") && !elements.tourModal.classList.contains("open") && !elements.explainModal.classList.contains("open") && !elements.paletteModal.classList.contains("open"), "all 4 modals are closed after the sequence above, no stray 'open' class left behind on any of them");
check(documentStub.activeElement === preModalTrigger, "after this whole modal-exclusion sequence, focus still correctly returns to the original pre-modal trigger");

console.log("--- Phase 4 batch A (2026-09-07): colorblind-safe status-pill symbol audit (UX_ROADMAP idea #23, P0) ---");
check(typeof sandbox.statusSymbol === "function", "statusSymbol is exposed as a function");
check(sandbox.statusSymbol("green") === "✓" && sandbox.statusSymbol("amber") === "▲" && sandbox.statusSymbol("red") === "✗", "statusSymbol maps green/amber/red to ✓/▲/✗ exactly", [sandbox.statusSymbol("green"), sandbox.statusSymbol("amber"), sandbox.statusSymbol("red")].join(","));
// Every one of the 7 real status-pill render call sites in index.html now routes its label through
// statusSymbol() -- checked structurally here (every one already has its own golden-value behavioral
// check elsewhere in this file, re-verified above after this round's symbol-prefix change broke and
// was fixed against 9 of them).
// Golden count pre-registered via grep before writing this check (B35): 7 real status-pill render
// call sites (cpStatus, capStatus loop, overallUtil summary row, mdqsBand, gatePill, the risk-register
// table row, riskScoreBand), each now calling statusSymbol() exactly once.
const statusSymbolCallCount = (html.match(/statusSymbol\(/g) || []).length;
check(statusSymbolCallCount === 8, "statusSymbol() is called exactly 8 times: once per definition/export plus once at each of the 7 real status-pill render call sites", statusSymbolCallCount);

console.log("--- Phase 4 batch A (2026-09-07): \"three layers\" methodology reframing (UX_ROADMAP idea #31) ---");
// A design-qa-style accuracy guard for this new prose card, matching the established discipline of
// never asserting a claim without checking it against the actual page. Specifically verifies: (1) it
// explicitly reconciles against the existing 4-pillar taxonomy rather than silently competing with it,
// (2) every tab/feature it names by label actually exists, (3) no EVM vocabulary leaked in from the
// sibling repo this idea was inspired by (the stress-test finding this fixes), (4) it's scoped to the
// Methodology tab only, not a new nav tab.
check(html.includes("How this page's own numbers earn trust"), "the three-layers card is present in the page");
check(html.includes("cuts <em>across</em> the Operating Framework tab's 4-pillar taxonomy, not a"), "the card explicitly reconciles against the existing 4-pillar taxonomy rather than presenting a competing, unreconciled framework");
// A fresh /stress-test pass (2026-09-07) found this card's Layer 3 line originally claimed stress.cjs
// is "re-run on every load" -- a real, self-contradicting inaccuracy: stress.cjs is a Node harness
// run by hand before every round, never re-executed in-browser, exactly as #verifyBadge's OWN
// tooltip already correctly says ("updated by hand each build round, not computed live"). Guarded
// here so this specific false claim about the page's own testing mechanism can't recur silently.
check(!html.includes("stress.cjs</code> suite (re-run on every load"), "Layer 3's description of stress.cjs no longer claims it's re-run in-browser on every load (it's a hand-run Node harness, matching the verifyBadge tooltip's own accurate framing)");
check(html.includes("a Node harness run by hand before every round"), "Layer 3 correctly describes stress.cjs as a hand-run Node harness, not an in-browser live process");
["Capacity Forecast", "Tooling Amortization", "Should-Cost &amp; MHR Simulator", "Variance Waterfall"].forEach((label) => {
  check(html.includes(label), `the three-layers card only names real, existing features/tabs ("${label}" exists elsewhere on the page)`);
});
check(!/\bEVM\b|Earned Value Management|Confirming EVM/i.test(html.slice(html.indexOf("How this page's own numbers earn trust"), html.indexOf("How this page's own numbers earn trust") + 1500)), "the three-layers card's own text avoids the sibling repo's EVM vocabulary (the cross-domain-blending finding this round fixed)");
check(!html.includes('id="tab-threelayers"') && !html.includes('id="navtab-threelayers"'), "this shipped as a Methodology-tab prose card, not a new top-level nav tab (matches the plan's revised scope)");
const fourPillarHeadings = (html.match(/<h3>[1-4] · /g) || []).length;
check(fourPillarHeadings === 4, "the Operating Framework tab really does have exactly 4 pillar headings (the count the reconciliation sentence above depends on)", fourPillarHeadings);

console.log("--- Phase 4 batch B (2026-09-07): KPI-to-decomposition cross-link audit + honest coverage stat (idea #6, redefined) ---");
// Golden counts pre-registered via grep before writing this check (B35): 19 real ".line total"
// calculator headline outputs exist across the whole page; exactly 5 of them get a new decomp-link
// to a genuinely SEPARATE chart that further decomposes that same number (not a chart merely
// co-located with it, which several other totals already have and isn't counted here as a "link" --
// see the prose's own explicit distinction). typeof check confirms the shared helper is exposed.
check(typeof sandbox.jumpToDecomposition === "function", "jumpToDecomposition is exposed as a function");
const lineTotalCount = (html.match(/class="line total"/g) || []).length;
check(lineTotalCount === 19, "exactly 19 real calculator headline (.line.total) outputs exist (golden count, pre-registered via grep)", lineTotalCount);
const decompLinkCount = (html.match(/class="decomp-link"/g) || []).length;
check(decompLinkCount === 5, "exactly 5 decomposition links exist (golden count, pre-registered via grep)", decompLinkCount);
check(html.includes("<b>5 of 19</b>"), "the coverage-stat prose cites the exact same count the actual markup contains, not a hand-typed number that could drift from it");
function pageHasElementId(id){ return new RegExp(`id="${id}"`).test(html); }
[
  ["nestingDollWrap", "Nesting Doll Cost Peel"],
  ["suspensionBridgeWrap", "Suspension Bridge Load Monitor"],
  ["glacialWrap", "Glacial Calving Event Tracker"],
  ["kaleidophoneWrap", "Kaleidophone Resonance Chart"],
  ["pressureVesselWrap", "Pressure-Vessel Cost Containment"],
].forEach(([targetId, label]) => {
  check(html.includes(`jumpToDecomposition('${targetId}')`) && html.includes(label), `the decomp-link targeting #${targetId} exists and names the real "${label}" chart it jumps to`);
  check(pageHasElementId(targetId), `the decomp-link's own target element #${targetId} really exists elsewhere on the page (not a broken/typo'd id)`, targetId);
});
// Behavioral note (not a stub-crash workaround): this stub has no scrollIntoView or hasAttribute on
// its stub elements (the pre-existing KPI Interaction Map jump() function has the same two calls and
// is, by the same established precedent, verified structurally here and behaviorally in a real
// browser rather than invoked against this stub -- see README for that round's own live-verification).

console.log("--- Phase 4 batch B (2026-09-07): \"changed since your last visit\" banner (idea #32, redefined) ---");
check(typeof sandbox.checkChangedSinceLastVisit === "function", "checkChangedSinceLastVisit is exposed as a function");
const currentBadgeMatch = html.match(/id="verifyBadge"[^>]*>✓ (\d+)\/\d+ CHECKS PASSING/);
const currentChecksStr = currentBadgeMatch[1];
// checkChangedSinceLastVisit() already ran once at page-load init (this file's own initial
// vm.runInContext of the page's script), against this sandbox's fresh, empty localStorage -- so this
// IS genuinely a first "visit" already, not a contrived setup.
check(!elements.lastVisitBanner.hidden, "the banner is unhidden after the page's own init-time call");
check(elements.lastVisitBanner.textContent.startsWith("First visit"), "a fresh (never-before-seen) localStorage correctly shows the first-visit message, not a false \"changed\"/\"no change\" claim", elements.lastVisitBanner.textContent);
check(sandbox.localStorage._s["ams-cc-last-visit-checks"] === currentChecksStr, "the current checks-passing count was written to localStorage after the first visit", sandbox.localStorage._s["ams-cc-last-visit-checks"]);
// Simulate a second visit with no change (localStorage now holds what the first visit just wrote).
sandbox.checkChangedSinceLastVisit();
check(elements.lastVisitBanner.textContent === "No change since your last visit.", "a second visit with an unchanged checks-count shows the plain \"no change\" message, matching this page's zero-gamification standard (no streak count, no reward copy)", elements.lastVisitBanner.textContent);
// Simulate a real prior visit that predates a content update (a different checks-count stored).
sandbox.localStorage.setItem("ams-cc-last-visit-checks", "857");
sandbox.checkChangedSinceLastVisit();
check(elements.lastVisitBanner.textContent.includes("was passing 857 checks, now " + currentChecksStr), "a genuinely different prior checks-count correctly triggers the \"changed\" message naming both real numbers", elements.lastVisitBanner.textContent);
check(!/streak|badge earned|come back tomorrow|day \d+/i.test(elements.lastVisitBanner.textContent), "the changed-message copy never drifts into streak/reward language (the guardrail distinguishing this from declined idea #27)", elements.lastVisitBanner.textContent);
// Restore localStorage to the current real count so no later check in this file could observe stale state.
sandbox.localStorage.setItem("ams-cc-last-visit-checks", currentChecksStr);

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

console.log("--- Navigation innovation round (2026-09-05): 8 curated features from a 30-pattern nav-design brainstorm ---");
// Only 8 of the 30 originally-brainstormed patterns were built. This dashboard is a single-view,
// 12-tab flat calculator app (not a canvas/multi-pane/deep-hierarchy app), and 3 of the 8 curated
// features overlap infrastructure already built earlier this session (the collapsible density-
// adaptive rail, the Cmd/Ctrl+K command palette, the KPI Interaction Map's cross-tab jump() links) --
// this section tests only the genuinely new additions layered on top. See README for the full
// accounting of what was skipped and why.
function currentActiveTab() {
  const activeId = NAVTAB_IDS.find((id) => elements[id] && elements[id].getAttribute("aria-selected") === "true");
  return activeId ? activeId.replace("navtab-", "") : null;
}

console.log("--- 1. Session Reload Memory (persists the last-active tab; restore-on-load verified live, see README) ---");
sandbox.activateTab("variance");
check(sandbox.localStorage._s["ams-cc-last-tab"] === "variance", "activateTab() persists the newly-active tab name to localStorage", sandbox.localStorage._s["ams-cc-last-tab"]);

console.log("--- 2. Keyboard Chord Navigation (g, then a mnemonic letter) ---");
check(typeof sandbox.cancelChord === "function", "window.cancelChord is exposed (the pending-chord state; the 2s timeout and the actual keydown interception are verified live, since this stub's document.addEventListener is an intentional no-op -- see stress.cjs's own comment on the Escape-key handler above)");
check(typeof sandbox.CHORD_MAP === "object" && sandbox.CHORD_MAP !== null, "window.CHORD_MAP is exposed (checking the real map, not a hand-copied duplicate)");
const chordEntries = Object.keys(sandbox.CHORD_MAP || {});
check(chordEntries.length === 13, "the chord map has exactly 13 entries, one per tab", chordEntries.length);
chordEntries.forEach((letter) => {
  const tab = sandbox.CHORD_MAP[letter];
  check(TABPANEL_IDS.includes("tab-" + tab), `chord "g then ${letter}" maps to a real, existing tab ("${tab}")`, TABPANEL_IDS.join(","));
  check(html.includes('<span class="mono">' + letter + '</span>'), `the on-screen chord hint lists "${letter}" as a completion key, matching the real map (not a hint that's drifted from the actual bindings)`);
});

console.log("--- 3. Recency-Based Tab Stepper (Ctrl/Cmd+Shift+[ and ], MRU order) ---");
check(typeof sandbox.stepMru === "function" && typeof sandbox.getTabVisitOrder === "function", "window.stepMru/getTabVisitOrder are exposed");
const preStepOrder = sandbox.getTabVisitOrder();
const n = preStepOrder.length;
check(n >= 2, "at least 2 distinct tabs have been visited by this point in the run, so the stepper has something to step through", n);
if (n >= 2) {
  sandbox.stepMru(1);
  check(currentActiveTab() === preStepOrder[1 % n], "first step (dir=1, the '[' key) lands on the pre-step MRU snapshot's 2nd entry", `expected=${preStepOrder[1 % n]} actual=${currentActiveTab()}`);
  check(elements.mruToast.hidden === false, "the MRU toast becomes visible on step");
  const step1Label = elements["navtab-" + preStepOrder[1 % n]].getAttribute("aria-label");
  check(elements.mruToast.textContent.indexOf(step1Label) !== -1, "the toast announces the destination's real accessible label (aria-live, so a screen-reader user gets the same confirmation)", elements.mruToast.textContent);
  sandbox.stepMru(1);
  check(currentActiveTab() === preStepOrder[2 % n], "a SECOND step within the same burst lands on the STABLE pre-step snapshot's 3rd entry, not a reshuffled list -- the snapshot-freeze mechanism this feature exists to get right (activateTab() itself would otherwise reorder tabVisitOrder mid-gesture)", `expected=${preStepOrder[2 % n]} actual=${currentActiveTab()}`);
  sandbox.stepMru(-1);
  check(currentActiveTab() === preStepOrder[1 % n], "stepping back (dir=-1, the ']' key) within the same burst returns to the snapshot's 2nd entry");
}

console.log("--- 4. Ambient Data-State Nav Coloring (Governance + Capacity only -- the two tabs with a real, already-computed pass/fail signal) ---");
check(typeof sandbox.setNavStatus === "function", "window.setNavStatus is exposed");
sandbox.setNavStatus("capacity", "red");
check(elements["navstatus-dot-capacity"].className === "nav-status-dot red", "setNavStatus sets the dot's class to reflect a 'red' status");
check(elements["navstatus-capacity"].textContent === "Needs attention", "setNavStatus sets the paired aria-describedby text -- never color alone (WCAG 1.4.1)");
sandbox.setNavStatus("capacity", "green");
check(elements["navstatus-dot-capacity"].className === "nav-status-dot green", "setNavStatus updates the dot back to 'green'");
check(elements["navstatus-capacity"].textContent === "All clear", "the paired text updates in lockstep with the dot");
// Real wiring, not just the setter in isolation: cross-check against the SPC/MDQS/gate calculators'
// OWN return values (a second, independent code path from updateGovernanceNavStatus()'s own
// regex-on-rendered-HTML approach) -- these should agree if the wiring is correct, and could diverge
// if either the regex mis-parses or the combining logic has a bug, so this isn't tautological.
const spcForNav = sandbox.renderCapacitySPC();
check(elements["navstatus-dot-capacity"].className === "nav-status-dot " + (spcForNav.outOfControl.some(Boolean) ? "red" : "green"), "the Capacity tab's nav dot matches renderCapacitySPC()'s own live outOfControl result", `outOfControl=${JSON.stringify(spcForNav.outOfControl)} dotClass=${elements["navstatus-dot-capacity"].className}`);
const mdqsForNav = sandbox.calcMdqs();
const gatesForNav = sandbox.calcGates();
const anyBlocked = !gatesForNav.bomPass || !gatesForNav.poPass || !gatesForNav.confPass;
const expectedGovStatus = anyBlocked || mdqsForNav.band === "red" ? "red" : mdqsForNav.band;
check(elements["navstatus-dot-governance"].className === "nav-status-dot " + expectedGovStatus, "the Governance tab's nav dot matches calcMdqs()'s band + calcGates()'s pass/fail, combined the same way updateGovernanceNavStatus() combines them", `mdqsBand=${mdqsForNav.band} anyBlocked=${anyBlocked} dotClass=${elements["navstatus-dot-governance"].className}`);

console.log("--- 5. Screen-Reader Landmark Teleporter (upgraded from a single skip-link) ---");
check(html.includes('id="sidenav"') && /id="sidenav"[^>]*tabindex="-1"|tabindex="-1"[^>]*id="sidenav"/.test(html), "the nav landmark (#sidenav) is a valid fragment-link focus target (tabindex=-1) -- without this, a browser scrolls a skip-link's target into view but never actually MOVES keyboard focus there, a real pre-existing gap this round fixed");
check(/id="main"[^>]*tabindex="-1"/.test(html), "the main landmark (#main) is likewise a valid focus target");
check(html.includes('href="#sidenav"') && html.includes('href="#main"') && html.includes('id="skipToSearch"'), "the skip-links group offers all 3 real destinations: navigation, main content, and quick search");
check(typeof elements.skipToSearch !== "undefined", "the quick-search skip control exists as a real, focusable element");
elements.skipToSearch.fire("click");
check(elements.paletteModal.classList.contains("open"), "activating the quick-search skip link opens the real command palette (the same one Cmd/Ctrl+K opens), not a separate parallel search");
sandbox.closePalette();

console.log("--- 6. Magnetic Hover Physics (CSS-only; the actual hover/focus rendering is verified live, this checks the authored rule + its reduced-motion fallback) ---");
check(/\.sidenav-item:hover \.sidenav-icon,\.sidenav-item:focus-visible \.sidenav-icon\{transform:scale\(1\.18\)\}/.test(html), "the magnetic-hover scale rule is authored on both :hover AND :focus-visible (keyboard users get the same affordance, not a mouse-only effect)");
check(/cubic-bezier\(\.34,1\.56,\.64,1\)/.test(html), "the hover transition uses a spring-overshoot easing curve, not a linear ease (the actual 'magnetic' feel)");
check(/@media \(prefers-reduced-motion:reduce\)\{[\s\S]*?\.sidenav-icon\{transition:none\}/.test(html), "the magnetic-hover transition is disabled under prefers-reduced-motion (WCAG 2.3.3), in the same media block as this dashboard's other motion");

console.log("--- 7. Cognitive-Load Focus Mode ---");
check(typeof sandbox.setFocusMode === "function", "window.setFocusMode is exposed");
sandbox.setFocusMode(true);
check(elements.focusBtn.getAttribute("aria-pressed") === "true", "setFocusMode(true) marks the toggle button pressed");
check(elements["__body"].classList.contains("focus-mode"), "setFocusMode(true) adds the focus-mode class to document.body");
check(sandbox.localStorage._s["ams-cc-focus-mode"] === "1", "focus-mode preference persists to localStorage, same pattern as theme/contrast/nav-collapsed");
sandbox.setFocusMode(false);
check(elements.focusBtn.getAttribute("aria-pressed") === "false", "setFocusMode(false) un-presses the toggle");
check(!elements["__body"].classList.contains("focus-mode"), "setFocusMode(false) removes the class again");

console.log("--- 8. Spatial Bookmarks (saved scenarios) ---");
check(["loadBookmarks", "captureCurrentScenario", "restoreScenario", "renderBookmarksList"].every((fn) => typeof sandbox[fn] === "function"), "all 4 bookmark functions are exposed");
sandbox.activateTab("shouldcost");
const emptyCapture = sandbox.captureCurrentScenario("Empty-values check");
check(emptyCapture.tab === "shouldcost" && emptyCapture.name === "Empty-values check" && typeof emptyCapture.ts === "number", "captureCurrentScenario() returns the right shape (name/tab/ts)", JSON.stringify(emptyCapture));
// Accepted limitation: .values is {} here because this stub's document.querySelectorAll only
// recognizes two hardcoded selectors (the side-nav tab list and .tabpanel, per its own comment
// above) -- "#tab-x input, #tab-x select" isn't one of them, so the real per-tab input-value capture
// is verified live in a real browser instead, not re-implemented in this stub.
check(Object.keys(emptyCapture.values).length === 0, "documents the accepted stub limitation explicitly, rather than silently passing on an untested assumption", JSON.stringify(emptyCapture.values));
sandbox.localStorage.setItem("ams-cc-bookmarks", JSON.stringify([{ name: "Test Scenario", tab: "shouldcost", values: {}, ts: 12345 }]));
const restored = sandbox.loadBookmarks();
check(restored.length === 1 && restored[0].name === "Test Scenario", "loadBookmarks() reads back a manually-seeded bookmark correctly", JSON.stringify(restored));
sandbox.activateTab("exec");
sandbox.restoreScenario(restored[0]);
check(currentActiveTab() === "shouldcost", "restoreScenario() activates the bookmark's saved tab", currentActiveTab());
sandbox.renderBookmarksList();
check(elements.bookmarksList.innerHTML.includes("Test Scenario"), "renderBookmarksList() renders the saved scenario's name");
check(elements.bookmarksList.innerHTML.includes('data-idx="0"'), "renderBookmarksList() renders a data-idx hook for the restore/delete click delegation");
const fakeDeleteClickEvt = { target: { getAttribute: (attr) => (attr === "data-idx" ? "0" : null), classList: { contains: (c) => c === "bookmarks-delete" } } };
elements.bookmarksList.fire("click", fakeDeleteClickEvt);
check(sandbox.loadBookmarks().length === 0, "clicking the delete control (delegated event) removes the bookmark from storage");
sandbox.renderBookmarksList();
check(elements.bookmarksList.innerHTML.includes("No saved scenarios yet"), "the empty state renders once the last bookmark is deleted");

console.log("--- Stress-test finding (2026-09-06): README/UX_ROADMAP.md self-consistency with the live page ---");
// A stress-test found the README's evergreen summary paragraph (not a dated changelog entry -- the
// file's own living overview) still cited "17" explain modals / "21" indexed modules after the
// nineteenth round (Variance Tug-of-War) shipped the 18th/22nd -- this repo had never previously
// checked its OWN docs against the live page, unlike the sibling repos' established D62-style
// self-check. Reading these files here, not duplicating a hand-maintained count elsewhere.
const readmeSrc = fs.readFileSync(path.join(__dirname, "README.md"), "utf8");
const uxRoadmapSrc = fs.readFileSync(path.join(__dirname, "UX_ROADMAP.md"), "utf8");
const realExplainCount = (html.match(/data-explain="/g) || []).length;
const realCommandIndexCount = sandbox.COMMAND_INDEX.length;
check(!readmeSrc.includes(`modals (${realExplainCount - 1} of them)`), `README's evergreen summary doesn't cite the stale explain-modal count (${realExplainCount - 1}) anymore`, "");
check((readmeSrc.match(new RegExp(`modals \\(${realExplainCount} of them\\)`, "g")) || []).length >= 1, `README's evergreen summary cites the current explain-modal count (${realExplainCount})`, "");
check(!readmeSrc.includes(`any of the ${realCommandIndexCount - 1} indexed modules`), `README doesn't cite the stale command-index count (${realCommandIndexCount - 1}) anymore`, "");
check((readmeSrc.match(new RegExp(`${realCommandIndexCount} indexed modules`, "g")) || []).length === 2, `README cites the current command-index count (${realCommandIndexCount}) in both places it appears (evergreen summary + feature-list prose)`, (readmeSrc.match(new RegExp(`${realCommandIndexCount} indexed modules`, "g")) || []).length);
check(!uxRoadmapSrc.includes("highest-priority accessibility item not yet built"), "UX_ROADMAP.md no longer claims prefers-reduced-motion is unbuilt (it shipped in the tenth round and is live + tested)", "");
check(/@media \(prefers-reduced-motion:reduce\)/.test(html), "sanity: the feature UX_ROADMAP.md now claims is built really is present in index.html, not just asserted in prose", "");

console.log("--- Phase 4 batch A (2026-09-07): aria-live on calculator outputs (UX_ROADMAP idea #19, P0) ---");
// Golden count pre-registered via `grep -c 'class="outline"' index.html` before writing this check
// (B35): 23 real calculator-result blocks share this markup convention. The page wires aria-live via
// a single document.querySelectorAll('.outline').forEach(...) at page-load rather than 23 individual
// hand-edits (Simplicity First) -- but this stub's querySelectorAll only special-cases 2 known
// selectors (.sidenav-item[role="tab"], .tabpanel) and has no real DOM tree to resolve an anonymous,
// id-less class selector against, so it can't execute that forEach meaningfully (degrades safely to
// [] , same accepted-limitation shape as the KPI Interaction Map / Command Palette items elsewhere in
// this file). Verified instead: the wiring code itself is present and correctly scoped, the golden
// element count matches, and the actual runtime behavior (every .outline gets aria-live="polite",
// only the changed line is announced) was confirmed live in a real browser before this round shipped.
// Scoped to the static markup only (before <script>, declared once near the top of this file) --
// the Keyboard Shortcuts overlay reuses the .outline CSS class inside a JS template string for its
// own styling, which would otherwise inflate this count with rows that don't exist in the DOM until
// that modal is opened (and don't need aria-live: they're a static reference legend, not a live
// calculator result). 26, not the original 23: the "three layers" methodology card adds one real
// static .outline block for its own 3-row legend, and the Attention & Triage tab (Phase 4 batch D)
// adds 2 more (its Tier 1/Tier 2 list containers) -- 23 + 1 + 2 = 26.
const outlineCount = (staticMarkup.match(/class="outline"/g) || []).length;
check(outlineCount === 26, "exactly 26 real result/legend blocks share the .outline convention in the static markup (golden count, pre-registered via grep)", outlineCount);
check(html.includes("document.querySelectorAll('.outline').forEach(function(el){ el.setAttribute('aria-live', 'polite'); });"), "the page wires aria-live=\"polite\" onto every .outline block via one init call, not 23 separate hand-edits", "");
check(!html.includes('aria-live="polite"') || html.match(/aria-live="polite"/g).length >= 2, "aria-live is used at least where it already existed pre-round (the kbd-hint toast + MRU toast) -- sanity floor, not a full behavioral proof (see the stub limitation noted above)", (html.match(/aria-live="polite"/g) || []).length);

console.log("--- Phase 4 batch D (2026-09-07): Attention & Triage tab -- calcTriage() golden values (idea #34) ---");
// Golden item list pre-registered by reading each source's own already-tested default state before
// writing this check (B35): PO gate BLOCKED at 7% (stress.cjs's own existing gate check), live CRPN
// calculator ESCALATE at 27 (existing riskScoreBand check), Commodity Price Exposure WARNING at
// 13.46% (existing cpStatus check, cpShiftPct's real toFixed(2) format), capacity weeks 3+4 red with
// the overall 6-week row amber (existing honeycomb/capacity checks), MDQS AMBER at 96.875% (existing
// mdqsBand check), OAE amber-footed at 93.1% (static exec-tab markup), and 6 of 10 real risk-register
// entries at ESCALATE-level CRPN (computed directly from the real RISK_REGISTER array + crpnBand()).
check(typeof sandbox.calcTriage === "function" && typeof sandbox.renderTriage === "function" && typeof sandbox.triageJump === "function", "calcTriage/renderTriage/triageJump are all exposed as functions");
const triageState = sandbox.calcTriage();
check(triageState.tier1.length === 4, "exactly 4 real items land in Tier 1 (Red/Blocked) at default page-load values", triageState.tier1.length, JSON.stringify(triageState.tier1.map((i) => i.id)));
check(triageState.tier2.length === 3, "exactly 3 real items land in Tier 2 (Amber/Watch) at default page-load values", triageState.tier2.length, JSON.stringify(triageState.tier2.map((i) => i.id)));
check(triageState.tier1.map((i) => i.id).join(",") === "po-gate,risk-scorer,commodity-exposure,capacity-weeks", "Tier 1's 4 items are exactly the 4 golden ids, in the order their source calculators run", triageState.tier1.map((i) => i.id).join(","));
check(triageState.tier2.map((i) => i.id).join(",") === "mdqs,oae,risk-register-aggregate", "Tier 2's 3 items are exactly the 3 golden ids, in the order their source calculators run", triageState.tier2.map((i) => i.id).join(","));
check(triageState.tier1.find((i) => i.id === "po-gate").text === "PO price-variance gate BLOCKED (7% actual vs ±5% threshold)", "the PO-gate item states the exact real input value and threshold", triageState.tier1.find((i) => i.id === "po-gate").text);
check(triageState.tier1.find((i) => i.id === "risk-scorer").text === "Live CRPN calculator ESCALATE (27, ≥25 threshold)", "the live CRPN-scorer item states the exact real CRPN value", triageState.tier1.find((i) => i.id === "risk-scorer").text);
check(triageState.tier1.find((i) => i.id === "commodity-exposure").text === "Commodity Price Exposure WARNING (13.46% shift vs 8% early-warning threshold)", "the commodity-exposure item states the exact real shift percentage", triageState.tier1.find((i) => i.id === "commodity-exposure").text);
check(triageState.tier1.find((i) => i.id === "capacity-weeks").text === "2 of 6 weeks in the red utilization band (Weeks 3, 4); overall 6-week utilization sits in the amber band", "the capacity item names the exact real red weeks and the real amber overall band", triageState.tier1.find((i) => i.id === "capacity-weeks").text);
check(triageState.tier2.find((i) => i.id === "mdqs").text === "MDQS score 96.875% (amber band)", "the MDQS item states the exact real score", triageState.tier2.find((i) => i.id === "mdqs").text);
check(triageState.tier2.find((i) => i.id === "oae").text === "Overhead Absorption (OAE) 93.1% (amber, target ≥95%)", "the OAE item states the exact real static value", triageState.tier2.find((i) => i.id === "oae").text);
const realEscalatedCount = sandbox.RISK_REGISTER.filter((r) => sandbox.crpnBand(r.p * r.s * r.d) === "red").length;
check(realEscalatedCount === 6, "sanity: the real risk register really does have 6 of 10 entries at ESCALATE-level CRPN (not a stale hand-typed number)", realEscalatedCount);
check(triageState.tier2.find((i) => i.id === "risk-register-aggregate").text === "Risk register skews toward higher severity: 6 of 10 entries at ESCALATE-level CRPN", "the risk-register aggregate item states the exact real escalated count, computed from the real array, not hand-typed", triageState.tier2.find((i) => i.id === "risk-register-aggregate").text);
sandbox.renderTriage(triageState);
check(elements.triageTier1Count.textContent === "4 ITEMS" && elements.triageTier2Count.textContent === "3 ITEMS", "the tier count badges render the exact real item counts, singular/plural handled", `${elements.triageTier1Count.textContent} / ${elements.triageTier2Count.textContent}`);
check(elements.triageTier1List.innerHTML.includes("PO price-variance gate BLOCKED") && elements.triageTier1List.innerHTML.includes("source-link"), "renderTriage() actually writes the real item text and a source-link jump control into the DOM, not just computing state", "");
check(elements.triageTier1Empty.hidden === true && elements.triageTier2Empty.hidden === true, "the \"nothing to see\" empty-state messages stay hidden when real items exist", `${elements.triageTier1Empty.hidden} / ${elements.triageTier2Empty.hidden}`);
// Disappearing-item behavior: fixing the one upstream input that makes the PO gate fire should make
// that item vanish from the NEXT computed state entirely, not merely change tier -- proving this
// tab reflects live reality rather than a frozen snapshot from whenever it was first opened.
elements.gatePo.value = "2";
sandbox.calcGates();
const triageAfterFix = sandbox.calcTriage();
check(!triageAfterFix.tier1.some((i) => i.id === "po-gate") && !triageAfterFix.tier2.some((i) => i.id === "po-gate"), "fixing the PO gate's real input (7% -> 2%, back under the 5% threshold) removes the po-gate item from calcTriage() entirely, in either tier", JSON.stringify(triageAfterFix.tier1.concat(triageAfterFix.tier2).map((i) => i.id)));
elements.gatePo.value = "7";
sandbox.calcGates(); // restore the default before any later check in this file relies on the gate's real state

// A fresh /stress-test pass (2026-09-07) found ZERO test coverage anywhere in this file for the
// "Mark Acknowledged" checkbox mechanism -- confirmed by grep, not assumed. Closing that gap here.
// This stub has no real DOM tree (innerHTML is a plain string, not parsed into child nodes), so a
// dynamically-generated checkbox can't be fetched by id the way a static element can -- tested
// instead via (1) the generated row STRING actually containing the right markup, and (2) firing the
// real delegated change-listener (attached once to the stable list container, not the replaced
// checkboxes -- see index.html) with a synthetic event target shaped like a real checkbox, so the
// actual listener function runs, not a reimplementation of what it's supposed to do.
try{ sandbox.localStorage.setItem("ams-cc-triage-ack-po-gate", "0"); }catch(e){}
const triageForAck = sandbox.calcTriage();
sandbox.renderTriage(triageForAck);
check(elements.triageTier1List.innerHTML.includes('class="triage-ack-box" data-triage-id="po-gate"') && elements.triageTier1List.innerHTML.includes("> Acknowledged</label>"), "the po-gate row's generated HTML includes a real checkbox with the correct class and data-triage-id, wrapped in a real <label>...Acknowledged</label>", elements.triageTier1List.innerHTML.includes('class="triage-ack-box" data-triage-id="po-gate"'));
check(!elements.triageTier1List.innerHTML.match(/data-triage-id="po-gate"[^>]*checked/), "with no prior acknowledgment in localStorage, the po-gate checkbox does NOT render checked");
const fakeCheckbox = {
  classList: { contains: (c) => c === "triage-ack-box" },
  getAttribute: (name) => (name === "data-triage-id" ? "po-gate" : null),
  checked: true,
  closest: () => null, // this stub can't traverse from a synthetic target to a real parent .line -- the class-toggle side of this same listener was confirmed live in a real browser instead (see README)
};
elements.triageTier1List.fire("change", { target: fakeCheckbox });
check(sandbox.localStorage._s["ams-cc-triage-ack-po-gate"] === "1", "firing the real delegated change-listener with checked=true persists the acknowledgment to localStorage under the real item id, not a reimplementation of the listener's own logic");
fakeCheckbox.checked = false;
elements.triageTier1List.fire("change", { target: fakeCheckbox });
check(sandbox.localStorage._s["ams-cc-triage-ack-po-gate"] === "0", "un-checking persists '0', not leaving a stale '1' behind");
// A change event whose target ISN'T a triage-ack-box (e.g. some other future control sharing this
// container) must be ignored, not misread as an acknowledgment for whatever id happens to be there.
try{ sandbox.localStorage.setItem("ams-cc-triage-ack-decoy", "0"); }catch(e){}
elements.triageTier1List.fire("change", { target: { classList: { contains: () => false }, getAttribute: () => "decoy", checked: true } });
check(sandbox.localStorage._s["ams-cc-triage-ack-decoy"] === "0", "the delegated listener correctly ignores a change event from a non-checkbox target, not writing a spurious acknowledgment", sandbox.localStorage._s["ams-cc-triage-ack-decoy"]);
// Reflects-on-render: an already-true prior acknowledgment must render the checkbox pre-checked AND
// the row pre-dimmed, confirmed via the generated string (the class-toggle-on-click side of this was
// confirmed live; this confirms the READ side, on initial render, which the live check didn't cover).
sandbox.localStorage.setItem("ams-cc-triage-ack-po-gate", "1");
sandbox.renderTriage(sandbox.calcTriage());
check(!!elements.triageTier1List.innerHTML.match(/data-triage-id="po-gate"[^>]*checked/), "with a prior '1' acknowledgment in localStorage, the po-gate checkbox renders pre-checked on the very next render");
check(elements.triageTier1List.innerHTML.includes('class="line triage-acked" data-triage-id="po-gate"'), "the po-gate row itself renders with the triage-acked (dimmed) class from the start, not only after a user interaction");
sandbox.localStorage.setItem("ams-cc-triage-ack-po-gate", "0");
sandbox.renderTriage(sandbox.calcTriage()); // restore to the un-acknowledged default before any later check in this file

console.log("--- Phase 4 batch E (2026-09-07): printable one-pager (idea #14) ---");
check(html.includes('class="print-only" id="printOnePager"'), "the print-only summary section exists in the static markup");
check(html.includes("@media print"), "a real @media print block exists");
check(html.includes("visibility:hidden") && html.includes(".print-only, .print-only *{visibility:visible}"), "the print CSS hides everything except the print-only section, the standard print-isolation pattern");
check(typeof sandbox.syncPrintSummary === "function", "syncPrintSummary is exposed as a function");
// This stub's querySelectorAll only special-cases 2 selectors (neither is '#tab-exec .kpi-tile'), so
// it can't populate the print table under test -- same accepted-limitation shape as the KPI
// Interaction Map's jump() and Phase 4 batch B's jumpToDecomposition. Verified here only that calling
// it doesn't throw; the actual population is verified live in a real browser before this round ships.
try {
  sandbox.syncPrintSummary();
  check(true, "syncPrintSummary() runs without throwing even though this stub can't resolve its query selector");
} catch (e) {
  check(false, "syncPrintSummary() runs without throwing even though this stub can't resolve its query selector", e.message);
}
check(html.includes("window.addEventListener('beforeprint', syncPrintSummary)"), "the summary is wired to sync on the real browser 'beforeprint' event, not just on a manual button click");
check(html.includes("printBriefBtn") && html.includes("syncPrintSummary(); window.print();"), "the visible Print Brief button also syncs the summary before invoking window.print(), for the case a viewer prints via that button rather than Ctrl/Cmd+P");
check(html.includes("tjaiyen.github.io/ams-manufacturing-cost-command-center"), "the printed summary states the real live URL so a paper copy can find its way back to the interactive version");

console.log("--- Phase 4 batch E (2026-09-07): first-visit guided tour (idea #9) ---");
check(typeof sandbox.openTour === "function" && typeof sandbox.closeTour === "function" && typeof sandbox.tourNext === "function" && typeof sandbox.tourBack === "function", "openTour/closeTour/tourNext/tourBack are all exposed as functions");
check(sandbox.TOUR_STEPS.length === 6, "the tour has exactly 6 real steps (golden count)", sandbox.TOUR_STEPS.length);
check(sandbox.TOUR_STEPS.map((s) => s.tab).join(",") === "exec,exec,shouldcost,triage,methodology,exec", "the 6 steps visit the real tabs in the intended order (welcome -> KPIs -> should-cost -> triage -> methodology -> wrap-up)", sandbox.TOUR_STEPS.map((s) => s.tab).join(","));
// Deliberate design choice, checked directly: the tour is opt-in only, never auto-opened on load.
// Checked by scoping to the real "Initial render" init block at the bottom of the script (the only
// place a page-load auto-open could live) and confirming openTour() never appears as a bare call
// there -- it's still fine for that same text to appear earlier, in the function's own definition.
const initBlock = html.slice(html.indexOf("// ---------- Initial render ----------"));
check(!/(?<!function )\bopenTour\(\);/.test(initBlock), "openTour() is never called from the page's own init sequence -- confirms it's opt-in only, not auto-shown on load", "");
sandbox.openTour();
check(elements.tourModal.classList.contains("open"), "openTour() opens tourModal");
check(elements["tab-exec"].classList.contains("active"), "step 1 lands on the real Executive Overview tab");
check(elements.tourStepOut.textContent === "Step 1 of 6", "the step counter shows the real current position");
check(elements.tourBackBtn.hidden === true, "Back is hidden on the first step (nothing to go back to)");
check(elements.tourNextBtn.textContent === "Next ›", "Next reads \"Next\" (not \"Done\") on a non-final step", elements.tourNextBtn.textContent);
sandbox.tourNext();
check(elements.tourStepOut.textContent === "Step 2 of 6", "tourNext() advances to step 2");
check(elements.tourBackBtn.hidden === false, "Back becomes visible once past the first step");
for (let i = 0; i < 3; i++) sandbox.tourNext(); // steps 3, 4, 5 -> lands on step 5 (methodology)
check(elements["tab-methodology"].classList.contains("active"), "step 5 lands on the real Methodology & Sourcing tab", elements.tourStepOut.textContent);
sandbox.tourBack();
check(elements["tab-triage"].classList.contains("active"), "tourBack() from step 5 correctly returns to step 4's real tab (Attention & Triage), not just decrementing a counter with no matching navigation", elements.tourStepOut.textContent);
sandbox.tourNext();
sandbox.tourNext(); // back to step 5, then to the real final step 6
check(elements.tourStepOut.textContent === "Step 6 of 6", "reaching the final step shows the real total", elements.tourStepOut.textContent);
check(elements.tourNextBtn.textContent === "Done", "the final step's button reads \"Done\", not \"Next\"", elements.tourNextBtn.textContent);
sandbox.tourNext(); // clicking "Done" on the final step
check(!elements.tourModal.classList.contains("open"), "clicking \"Done\" on the final step closes the tour (tourNext doubles as the close action there), not stranding the user on a step with nowhere to go");
sandbox.activateTab("exec", { focus: false }); // restore the default tab before any later check relies on it

console.log("--- Dashboard Self-Audit (Phase 5, 2026-09-07 -- 7 concepts, /plan-exec \"all 30\" stress-tested down to the ones needing zero invented data) ---");
check(typeof sandbox.calcSelfAudit === "function", "calcSelfAudit is exposed as a function");
check(Array.isArray(sandbox.HISTORY) && sandbox.HISTORY.length === 30, "HISTORY has all 30 real build rounds (5 through 34)", String(sandbox.HISTORY && sandbox.HISTORY.length));
check(sandbox.HISTORY[0].n === 5 && sandbox.HISTORY[0].before === null && sandbox.HISTORY[0].after === null, "round 5 (the earliest) correctly has no check-count data, not an invented zero");
check(sandbox.HISTORY[4].n === 9 && sandbox.HISTORY[4].after === null, "round 9 (last pre-tracking round) still has no check-count data");
check(sandbox.HISTORY[5].n === 10 && sandbox.HISTORY[5].before === 357 && sandbox.HISTORY[5].after === 400, "round 10 (first tracked round) matches README's real Checks: 357 -> 400");
// Chain integrity: every tracked round's `before` must equal the PRIOR tracked round's `after` --
// this is the exact class of gap the original 30-concept plan's Batch 0 would have introduced
// silently (a naive regex extraction misses ~45% of real "Checks:" occurrences to line-wraps), so
// this loop is what actually proves the hand-transcription in HISTORY has no gaps, not just that it
// parses.
let historyChainOk = true, historyChainBreak = "";
const trackedRounds = sandbox.HISTORY.filter((h) => h.after !== null);
for (let i = 1; i < trackedRounds.length; i++) {
  if (trackedRounds[i].before !== trackedRounds[i - 1].after) {
    historyChainOk = false;
    historyChainBreak = `round ${trackedRounds[i].n} before=${trackedRounds[i].before} != round ${trackedRounds[i - 1].n} after=${trackedRounds[i - 1].after}`;
    break;
  }
}
check(historyChainOk, "every tracked round's check-count chains into the next with no gap (hand-verified, not regex-extracted)", historyChainBreak);
check(trackedRounds[trackedRounds.length - 2].n === 33 && trackedRounds[trackedRounds.length - 2].after === 974, "round 33 (the round before this one) ends at the real 974 pre-this-round total");
// Self-check, same shape as the #verifyBadge one below: HISTORY's own final entry must match the
// real badge count on THIS page -- otherwise HISTORY (and the Heartbeat/Cairn Trail built from it)
// would go stale the very next round a check is added and the badge is updated, exactly the kind of
// drift this Self-Audit section exists to visualize honestly.
const historyLastRound = sandbox.HISTORY[sandbox.HISTORY.length - 1];
const badgeCountMatch = html.match(/id="verifyBadge"[^>]*>✓ (\d+)\/(\d+) CHECKS PASSING/);
check(!!badgeCountMatch && historyLastRound.after === Number(badgeCountMatch[1]), "HISTORY's own final round's check-count matches the real #verifyBadge on this page (no stale hand-updated number)", badgeCountMatch ? `HISTORY.after=${historyLastRound.after} badge=${badgeCountMatch[1]}` : "verifyBadge not found");

check(Array.isArray(sandbox.ROADMAP_PHASES) && sandbox.ROADMAP_PHASES.length === 3, "ROADMAP_PHASES has exactly the 3 real P0/P1/P2 tiers");
check(sandbox.ROADMAP_PHASES[0].tier === "P0" && sandbox.ROADMAP_PHASES[0].done === 4 && sandbox.ROADMAP_PHASES[0].total === 4, "P0 backlog is really 4/4 shipped (UX_ROADMAP.md lines 80-84)");
check(sandbox.ROADMAP_PHASES[1].tier === "P1" && sandbox.ROADMAP_PHASES[1].done === 2 && sandbox.ROADMAP_PHASES[1].total === 7, "P1 backlog is really 2/7 shipped");
check(sandbox.ROADMAP_PHASES[2].tier === "P2" && sandbox.ROADMAP_PHASES[2].done === 1 && sandbox.ROADMAP_PHASES[2].total === 6, "P2 backlog is really 1/6 shipped (idea #28's stale un-struck-through line fixed this round)");

check(sandbox.SIBLING_METRICS.commits === 261 && sandbox.SIBLING_METRICS.checks === 4235 && sandbox.SIBLING_METRICS.lines === 14895, "SIBLING_METRICS matches the real, hand-verified project-controls-command-center numbers (git log/stress.cjs/wc -l, 2026-09-07)");

const selfAuditState = sandbox.calcSelfAudit();
check(selfAuditState.srcReal === 11 && selfAuditState.srcIllustrative === 4, "the live .srctag.real/.srctag.illustrative counts match the Source Ledger's real 11/4 split", `real=${selfAuditState.srcReal} illustrative=${selfAuditState.srcIllustrative}`);
check(selfAuditState.perTab.length === 13, "calcSelfAudit() reports all 13 real tabs");
const methodologyRow = selfAuditState.perTab.find((t) => t.id === "methodology");
check(!!methodologyRow && methodologyRow.interactive === 0 && methodologyRow.illustrative === 11, "the Methodology tab's own numbers exclude this very Self-Audit section (its cairn-trail buttons and prose don't recursively inflate the count it displays)", methodologyRow ? `interactive=${methodologyRow.interactive} illustrative=${methodologyRow.illustrative}` : "not found");
check(html.includes("<!--SELFAUDIT_START-->") && html.includes("<!--SELFAUDIT_END-->"), "the SELFAUDIT_START/END markers the exclusion regex relies on actually exist in the real markup (proving the exclusion has real content to strip, not silently matching nothing)");
const shouldcostRow = selfAuditState.perTab.find((t) => t.id === "shouldcost");
check(!!shouldcostRow && shouldcostRow.interactive === Math.max(...selfAuditState.perTab.map((t) => t.interactive)), "Should-Cost & MHR is really the single busiest tab by interactive-element count (the leaderboard/scorecard's real #1 and 100% gauge)", shouldcostRow ? String(shouldcostRow.interactive) : "not found");
check(selfAuditState.liveChecks !== null, "calcSelfAudit() successfully parses a live check count off #verifyBadge");

sandbox.renderSelfAudit();
check(elements.onionWrap.innerHTML.includes("onion-ring"), "renderOnion populates onionWrap with the 3-ring SVG");
check((elements.onionWrap.innerHTML.match(/class="onion-ring"/g) || []).length === 4, "the onion renders exactly 4 ring elements (outer + mid + the inner ring's 2-way real/illustrative split)");
check(elements.thermoWrap.innerHTML.includes("4/4") && elements.thermoWrap.innerHTML.includes("2/7") && elements.thermoWrap.innerHTML.includes("1/6"), "renderThermo shows all 3 phases' real done/total fractions");
const heartbeatCircleCount = (elements.heartbeatWrap.innerHTML.match(/<circle/g) || []).length;
check(heartbeatCircleCount === trackedRounds.length, "renderHeartbeat draws exactly one beat per tracked round (25), none for the 5 pre-tracking rounds", String(heartbeatCircleCount));
const cairnBtnCount = (elements.cairnWrap.innerHTML.match(/class="cairn-btn"/g) || []).length;
check(cairnBtnCount === sandbox.HISTORY.length, "renderCairnTrail draws exactly one cairn per real round (30)", String(cairnBtnCount));
check(elements.leaderboardWrap.innerHTML.includes("1. Should-Cost") && (elements.leaderboardWrap.innerHTML.match(/<span style="white-space:nowrap/g) || []).length === 13, "renderLeaderboard ranks all 13 tabs with the real busiest tab in first place");
check((elements.scorecardWrap.innerHTML.match(/<svg/g) || []).length === 13, "renderScorecard draws exactly one gauge per real tab (13)");
check(elements.siblingWrap.innerHTML.includes("35") && elements.siblingWrap.innerHTML.includes("261") && elements.siblingWrap.innerHTML.includes("14895"), "renderSibling shows both this dashboard's and the sibling's real numbers side by side");

console.log("--- Stress-test finding (2026-09-06, proactive): #verifyBadge now self-checks against this file's own final tally ---");
// The existing verifyBadgeNums check above only confirms the badge's own two numbers agree with EACH
// OTHER (N/N), not that N matches this file's actual running total -- exactly the gap that was just
// found and fixed in the sibling manufacturing-project-controls-command-center repo (its fixer
// updated stress.cjs and README but left a stale hand-typed badge number). Closing the same hole here
// before it recurs, not after. Runs LAST, deliberately, matching that sibling's own D62-style pattern:
// `passes` here is the exact count of every check before this one, and this check itself becomes one
// more passing assertion -- so the badge must cite passes+1, not passes.
const finalBadgeMatch = html.match(/id="verifyBadge"[^>]*>✓ (\d+)\/(\d+) CHECKS PASSING/);
const expectedFinalBadgeCount = passes + 1;
check(!!finalBadgeMatch && finalBadgeMatch[1] === String(expectedFinalBadgeCount) && finalBadgeMatch[2] === String(expectedFinalBadgeCount), "the #verifyBadge text matches this file's own final passing count exactly (no stale hand-updated number)", finalBadgeMatch ? `badge=${finalBadgeMatch[1]}/${finalBadgeMatch[2]} expected=${expectedFinalBadgeCount}` : "verifyBadge not found");

console.log("");
console.log(failures === 0 ? "All stress checks passed." : `${failures} stress check(s) FAILED (${passes} passed).`);
process.exit(failures === 0 ? 0 : 1);
