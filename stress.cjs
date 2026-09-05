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
const TABS = ["exec", "shouldcost", "variance", "buildbuy", "framework", "methodology"];
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
const htmlOutsideDebunkCard = debunkCardMatch ? html.replace(debunkCardMatch[0], "") : html;
const foundBanned = bannedStrings.filter((s) => htmlOutsideDebunkCard.includes(s));
check(foundBanned.length === 0, "none of the two downloaded documents' fabricated specifics (client claims, copied test count, their own invented dollar figures, invented facility names) appear anywhere OUTSIDE the one card that names them specifically to debunk them", JSON.stringify(foundBanned));
check(debunkCardMatch && bannedStrings.some((s) => debunkCardMatch[0].includes(s)), "the debunk card itself actually names at least one of the fabricated claims (confirms the exclusion above is excluding real content, not a no-op)");

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
check(elements.scOutMhr.textContent === "$26.00/hr", "MHR resolves to the CNC-3-Axis rate card value", elements.scOutMhr.textContent);
check(elements.scOutMat.textContent === "$81.35", "material cost matches the browser-verified golden value", elements.scOutMat.textContent);
check(elements.scOutMach.textContent === "$15.89", "machine conversion cost matches the browser-verified golden value", elements.scOutMach.textContent);
check(elements.scOutLabor.textContent === "$10.39", "labor cost matches the browser-verified golden value", elements.scOutLabor.textContent);
check(elements.scOutOh.textContent === "$15.07", "overhead cost matches the browser-verified golden value", elements.scOutOh.textContent);
check(elements.scOutTotal.textContent === "$122.70", "should-cost TOTAL matches the browser-verified golden value (and equals the sum of the four lines above)", elements.scOutTotal.textContent);

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

console.log("--- Rate card consistency (table cells must equal the live-computed MHR, not a stale hand-typed number) ---");
const RATE_CARD_EXPECTED = { cnc3: 26.00, cnc5: 46.00, dmls: 66.00, sheet: 13.50 };
Object.keys(RATE_CARD_EXPECTED).forEach((wc) => {
  const m = html.match(new RegExp(`data-wc="${wc}"[\\s\\S]*?data-mhr>\\$([\\d.]+)<`));
  check(!!m, `found the static MHR table cell for ${wc}`);
  if (m) check(parseFloat(m[1]) === RATE_CARD_EXPECTED[wc], `${wc}'s displayed MHR ($${m[1]}) matches window.mhrFor('${wc}') = $${sandbox.mhrFor(wc).toFixed(2)}`, `table=${m[1]} computed=${sandbox.mhrFor(wc)}`);
});

console.log("");
console.log(failures === 0 ? "All stress checks passed." : `${failures} stress check(s) FAILED (${passes} passed).`);
process.exit(failures === 0 ? 0 : 1);
