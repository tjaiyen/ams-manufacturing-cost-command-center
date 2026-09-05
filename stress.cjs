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
const TABS = ["exec", "shouldcost", "variance", "buildbuy", "capacity", "tooling", "dfm", "governance", "framework", "methodology"];
TABS.forEach((t) => {
  check(html.includes(`data-tab="${t}"`), `tab button for "${t}" exists`);
  check(html.includes(`id="tab-${t}"`), `panel for "${t}" exists`);
});
check(html.includes("None of it is real Amazon Manufacturing Services data"), "the top-level illustrative-data disclaimer is present");
check(html.includes('robots" content="noindex,nofollow"'), "page is noindex,nofollow (not meant for search discovery)");

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
let htmlOutsideDebunkCards = html;
if (debunkCardMatch) htmlOutsideDebunkCards = htmlOutsideDebunkCards.replace(debunkCardMatch[0], "");
if (errorsCardMatch) htmlOutsideDebunkCards = htmlOutsideDebunkCards.replace(errorsCardMatch[0], "");
const foundBanned = bannedStrings.filter((s) => htmlOutsideDebunkCards.includes(s));
check(foundBanned.length === 0, "none of the two downloaded documents' fabricated specifics (client claims, copied test count, their own invented dollar figures, invented facility names) appear anywhere OUTSIDE the cards that name them specifically to debunk them", JSON.stringify(foundBanned));
check(debunkCardMatch && bannedStrings.some((s) => debunkCardMatch[0].includes(s)), "the debunk card itself actually names at least one of the fabricated claims (confirms the exclusion above is excluding real content, not a no-op)");

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
check(foundWrongClaims.length === 0, "neither confirmed-wrong claim (\"PP02\" as rework, \"pre_tool_call\" as a hook key) is asserted as fact anywhere OUTSIDE the one card that corrects them", JSON.stringify(foundWrongClaims));
check(errorsCardMatch && wrongClaimStrings.every((s) => errorsCardMatch[0].includes(s)), "the corrections card actually names both confirmed-wrong claims (confirms the exclusion is excluding real content, not a no-op)");

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
  cpFrozen: "26.00", cpSpot: "29.50", cpVolume: "2200",
  tlCost: "18000", tlRun: "2400", tlBatch: "24",
  dfmThickness: "1.5", dfmPocket: "5", dfmHeight: "80",
  capOhRate: "28.00",
  mdqsRoutingErr: "6", mdqsTotalRoutings: "300", mdqsConfVar: "15", mdqsTotalConf: "500",
  mdqsUnlinkedScrap: "4", mdqsScrapEvents: "80", mdqsStaleStandards: "10", mdqsActiveParts: "400",
  gateBom: "8", gatePo: "7", gateConf: "12",
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
  const el = {
    id, value: DEFAULTS[id] !== undefined ? DEFAULTS[id] : "",
    textContent: "", innerHTML: "", style: {}, className: "",
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    rows: [],
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    getAttribute() { return null; }, setAttribute() {}, appendChild() {},
    click() { (listeners.click || []).forEach((fn) => fn.call(el)); },
  };
  elements[id] = el;
  return el;
}
const documentStub = {
  getElementById: (id) => makeElement(id),
  querySelectorAll: () => [],
  querySelector: () => makeElement("__q_" + Math.random()),
  documentElement: { getAttribute: () => null, setAttribute: () => {} },
  createElement: () => makeElement("__created_" + Math.random()),
};
const sandbox = { document: documentStub, localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } }, console, Math, Object, Array, parseFloat, isFinite };
sandbox.window = sandbox;
vm.createContext(sandbox);
try {
  vm.runInContext(pageScript, sandbox);
  check(true, "the real inline script executed without throwing in the stubbed DOM");
} catch (e) {
  check(false, "the real inline script executed without throwing in the stubbed DOM", e.stack);
  process.exit(1);
}

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

console.log("--- Data Governance: MDQS + Guardrail Gate Simulator golden values ---");
check(elements.mdqsScore.textContent === "96.875%", "MDQS score matches golden value (100% - weighted deductions)", elements.mdqsScore.textContent);
check(elements.mdqsBand.innerHTML.includes(">AMBER<"), "96.875% is correctly banded AMBER (93-98%)", elements.mdqsBand.innerHTML);
check(elements.gateBomOut.innerHTML.includes(">PASS<"), "BOM gate (8% vs 15% threshold) correctly PASSES", elements.gateBomOut.innerHTML);
check(elements.gatePoOut.innerHTML.includes(">BLOCKED<"), "PO gate (7% vs 5% threshold) correctly BLOCKS", elements.gatePoOut.innerHTML);
check(elements.gateConfOut.innerHTML.includes(">PASS<"), "Confirmation gate (12% vs 15% threshold) correctly PASSES", elements.gateConfOut.innerHTML);

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
